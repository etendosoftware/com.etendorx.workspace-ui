#!/bin/bash
set -e

# Sustituye variables de entorno en Openbravo.properties
sed -i "s|\${BBDD_URL}|$BBDD_URL|g" /usr/local/tomcat/webapps/etendo/WEB-INF/Openbravo.properties
sed -i "s|\${BBDD_SID}|$BBDD_SID|g" /usr/local/tomcat/webapps/etendo/WEB-INF/Openbravo.properties
sed -i "s|\${BBDD_SYSTEM_USER}|$BBDD_SYSTEM_USER|g" /usr/local/tomcat/webapps/etendo/WEB-INF/Openbravo.properties
sed -i "s|\${BBDD_SYSTEM_PASSWORD}|$BBDD_SYSTEM_PASSWORD|g" /usr/local/tomcat/webapps/etendo/WEB-INF/Openbravo.properties

# Arranca el servidor
exec "$@"
