# Profiling de C3 (ERP + base de datos)

> **Estado:** borrador de trabajo. No versionado aún en el repo.
> **Requisito previo:** haber completado la matriz de resultados de
> [`01-guia-de-medicion.md`](./01-guia-de-medicion.md) y **haber comprobado que C3 domina**.
> Si el cuello está en C1 (render) o C2 (proxy), nada de este documento aplica.

---

## Cuándo usar este documento

Solo si la matriz de resultados muestra alguna de estas dos cosas:

- `red ≈ wall clock` **y** la separación C2/C3 atribuye la mayor parte a C3.
- Un endpoint puntual del ERP (típicamente `/meta/window/{id}` o el datasource de la grilla)
  concentra por sí solo una fracción dominante del tiempo.

En cualquier otro caso, este trabajo no va a mover la aguja.

---

## 1. Punto de partida: no hay instrumentación

Verificado en `erp/modules/com.etendoerp.metadata/`: **no existe ninguna medición de tiempo
en el módulo**. No hay `System.nanoTime`, ni `StopWatch`, ni métricas. El único
`System.currentTimeMillis` está en `LegacyHttpSessionAdapter` y es para el ciclo de vida de
la sesión, no para performance.

Consecuencia: todo el timing del backend hoy tiene que venir de afuera (access log, JFR) o
hay que agregarlo (§6).

---

## 2. Tomcat — access log con tiempo de respuesta

El camino más barato para tener p50/máximo por endpoint sin tocar código Java.

El `server.xml` vive fuera del repo, en `$CATALINA_HOME/conf`. Agregar dentro del `<Host>`:

```xml
<Valve className="org.apache.catalina.valves.AccessLogValve"
       directory="logs" prefix="etendo_access" suffix=".log"
       pattern="%h %t &quot;%r&quot; %s %b %D %{X-Request-Id}i" />
```

`%D` = tiempo de respuesta en milisegundos. `%{X-Request-Id}i` permite correlacionar con el
proxy de Next si ya se implementó el `Server-Timing` de la guía (§8.1).

Análisis:

```bash
cd $CATALINA_BASE/logs

# Top endpoints por tiempo acumulado
awk '{print $(NF-1), $0}' etendo_access.log | sort -rn | head -20

# Distribución de un endpoint concreto
grep "meta/window" etendo_access.log | awk '{print $(NF-1)}' | sort -n | \
  awk '{a[NR]=$1} END {print "n="NR, "p50="a[int(NR*0.5)], "p95="a[int(NR*0.95)], "max="a[NR]}'
```

**Ventaja sobre medir desde el cliente:** acá se ven los reintentos de sesión/CSRF que el
navegador no muestra. Si una XHR del browser produce 3 líneas en este log, ese es el
hallazgo (ver `sessionRetryWithCsrf.ts`).

---

## 3. JVM — Java Flight Recorder

JFR viene incluido en el OpenJDK 17 que ya está instalado. Overhead ~1–2%, apto para
producción.

```bash
PID=$(pgrep -f "catalina|tomcat" | head -1)

# Grabar 60 s mientras se ejecuta el escenario en la UI
jcmd $PID JFR.start name=etendo duration=60s filename=/tmp/etendo.jfr settings=profile
```

Análisis sin GUI (el JDK trae el comando `jfr`):

```bash
jfr summary /tmp/etendo.jfr                                      # panorama general
jfr print --events jdk.ExecutionSample /tmp/etendo.jfr | head -100   # dónde está la CPU
jfr print --events jdk.GCPhasePause    /tmp/etendo.jfr | head -40    # pausas de GC
jfr print --events jdk.SocketRead      /tmp/etendo.jfr | head -40    # espera de I/O
jfr print --events jdk.JavaMonitorEnter /tmp/etendo.jfr | head -40   # contención de locks
```

Para análisis visual: **JDK Mission Control (JMC)** es descarga gratuita y abre el `.jfr`.

Métricas rápidas sin JFR:

```bash
jstat -gcutil $PID 1000 30                     # ocupación de heap y GC, 30 muestras de 1 s
jcmd $PID GC.heap_info
jcmd $PID Thread.print | grep -c "http-nio"    # threads de Tomcat ocupados
```

**Qué buscar:** si `jdk.ExecutionSample` apunta mayoritariamente a Hibernate o al conversor
JSON de Openbravo, el problema es el ORM o la serialización, no SQL. Si apunta a
`SocketRead`, el problema está más abajo (PostgreSQL).

---

## 4. Contar queries — detectar N+1

`erp/config/log4j2-web.xml` tiene hoy `<Logger name="org.hibernate" level="error"/>`.
Para contar queries de un escenario, subir temporalmente:

```xml
<Logger name="org.hibernate.SQL" level="debug"/>
<!-- opcional, muy verboso: valores de los parámetros -->
<!-- <Logger name="org.hibernate.type.descriptor.sql.BasicBinder" level="trace"/> -->
```

```bash
# nº de sentencias emitidas durante el escenario
grep -c "org.hibernate.SQL" $CATALINA_BASE/logs/openbravo.log

# las más repetidas → candidatas a N+1
grep "org.hibernate.SQL" $CATALINA_BASE/logs/openbravo.log \
  | sed 's/.*- //' | sort | uniq -c | sort -rn | head -20
```

> ⚠️ Esto degrada la performance considerablemente. Sirve para **contar y detectar N+1**,
> nunca para medir tiempos. Revertir a `error` al terminar.

**Señal de N+1:** la misma query repetida decenas o cientos de veces con distinto parámetro.

Zona conocida a revisar en `WindowBuilder.java`: ya tiene defensas explícitas contra N+1
(`getTabAccessesWithTabs` con `left join fetch`, `getFieldAccessesByTabAccessId` con batch
por `in (:tabAccessIds)`). Verificar si `TabBuilder` y `FieldBuilder` tienen las mismas —
son los archivos más grandes del módulo (532 y 873 líneas).

---

## 5. PostgreSQL

### 5.1 `pg_stat_statements`

**Disponible pero no instalado.** Requiere reinicio:

```sql
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
-- reiniciar PostgreSQL
CREATE EXTENSION pg_stat_statements;
```

Uso:

```sql
SELECT pg_stat_statements_reset();          -- justo antes del escenario
-- ...ejecutar el escenario en la UI...
SELECT calls,
       round(total_exec_time::numeric, 1)                AS total_ms,
       round(mean_exec_time::numeric, 2)                 AS mean_ms,
       rows,
       left(regexp_replace(query, '\s+', ' ', 'g'), 120) AS q
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

- Ordenar por `total_exec_time` responde **"qué me está costando"**.
- Ordenar por `calls` responde **"dónde hay un N+1"**.

### 5.2 Log de queries lentas (sin reiniciar)

```sql
ALTER SYSTEM SET log_min_duration_statement = '200ms';
SELECT pg_reload_conf();
```

### 5.3 Planes

```sql
EXPLAIN (ANALYZE, BUFFERS) <query>;
```

Buscar: `Seq Scan` sobre tablas grandes, estimaciones de filas muy alejadas de las reales
(estadísticas desactualizadas → `ANALYZE`), y `Nested Loop` con muchas iteraciones.

### 5.4 Configuración verificada del pool

En `erp/config/Openbravo.properties`:

| Clave | Valor | Comentario |
|-------|-------|------------|
| `db.pool.maxActive` | `10000` | No es un límite real. Bajo carga el cuello aparecería en `max_connections` de PostgreSQL, no acá |
| `db.pool.testOnBorrow` | `true` | Un round-trip extra por cada checkout de conexión |
| `db.pool.validationQuery` | `SELECT 1 FROM DUAL` | Ídem |
| `db.pool.initialSize` / `minIdle` | `1` / `5` | Arranque en frío paga creación de conexiones |

---

## 6. Instrumentar el módulo `metadata`

Si el access log y JFR no alcanzan para localizar el costo dentro de una request, el
siguiente paso es medir por servicio.

Punto de inserción natural: `MetadataFilter`, o `BaseWebService.process()`, que es por donde
pasan todos los endpoints `/meta/*`.

Qué registrar por request:
- Path normalizado (`ServiceFactory.normalizePath`)
- Duración total
- Nº de queries de Hibernate — accesible vía `SessionFactory.getStatistics()` si se habilita
  `hibernate.generate_statistics`
- El `X-Request-Id` que venga del proxy de Next

Salida: log estructurado **y** header `Server-Timing` de vuelta hacia Next, para que la
cadena de atribución quede completa de punta a punta: navegador → Next → ERP.

---

## 7. Pruebas de carga

**No tienen sentido en el entorno actual** y se documentan solo para descartarlas
explícitamente:

- El entorno es un dev local; el throughput medido acá no dice nada sobre producción.
- El `sessionStore` de Next es un `Map` en memoria que crece con cada token distinto
  (`app/api/_utils/sessionStore.ts`), así que cargar con muchos usuarios sintéticos contamina
  la medición y hace crecer el heap de Node.
- Reiniciar Next invalida todas las sesiones del ERP, y cada medición posterior arranca con
  un ciclo de recuperación de sesión que agrega requests.

Si en algún momento hiciera falta: `k6` vía Docker (`docker run --rm -i --network host
grafana/k6 run - < script.js`) o `npx autocannon`, siempre con **un solo token reutilizado**.
