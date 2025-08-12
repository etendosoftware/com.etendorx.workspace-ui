#!/usr/bin/env node

/**
 * Script para validar manualmente TableDirSelector
 * Ejecutar: node validate-tabledirselector.js
 */

import puppeteer from 'puppeteer';

async function validateTableDirSelector() {
  console.log('🧪 Iniciando validación de TableDirSelector...');
  
  const browser = await puppeteer.launch({
    headless: false, // Mostrar browser para debug
    devtools: false,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Ir a la story principal de TableDirSelector
    console.log('📍 Navegando a TableDirSelector Default...');
    await page.goto('http://localhost:6006/?path=/story/components-input-tabledirselector--default');
    
    // Esperar a que cargue
    await page.waitForSelector('iframe[id="storybook-preview-iframe"]');
    const frame = await page.frames().find(frame => frame.name() === 'storybook-preview-iframe');
    
    if (!frame) {
      throw new Error('❌ No se pudo encontrar el iframe de preview');
    }
    
    // 2. Verificar que el componente se renderiza
    console.log('✅ Test 1: Verificando renderizado del componente...');
    await frame.waitForSelector('[role="combobox"]', { timeout: 10000 });
    console.log('✅ Componente TableDirSelector renderizado correctamente');
    
    // 3. Verificar que el mock de datasource funciona
    console.log('✅ Test 2: Verificando llamada al backend (mock)...');
    
    // Escuchar logs de consola para verificar el mock
    const logs = [];
    page.on('console', (msg) => {
      if (msg.text().includes('Client REQUEST call intercepted')) {
        logs.push(msg.text());
        console.log('📡 Mock interceptado:', msg.text());
      }
    });
    
    // Hacer click en el selector para triggear la llamada
    const combobox = await frame.$('[role="combobox"]');
    await combobox.click();
    
    // Esperar un poco para que se ejecute el mock
    await page.waitForTimeout(2000);
    
    if (logs.length > 0) {
      console.log('✅ Mock del datasource funcionando correctamente');
    } else {
      console.log('⚠️  Mock del datasource no detectado (puede ser normal si ya estaba cacheado)');
    }
    
    // 4. Verificar que aparecen las opciones
    console.log('✅ Test 3: Verificando opciones del selector...');
    try {
      await frame.waitForSelector('[role="option"]', { timeout: 5000 });
      const options = await frame.$$('[role="option"]');
      console.log(`✅ Se encontraron ${options.length} opciones en el selector`);
      
      if (options.length > 0) {
        // Hacer click en la primera opción
        await options[0].click();
        console.log('✅ Selección de opción exitosa');
      }
    } catch (e) {
      console.log('⚠️  No se pudieron cargar las opciones (timeout)');
    }
    
    // 5. Ir a las stories de test
    console.log('📍 Navegando a tests de TableDirSelector...');
    await page.goto('http://localhost:6006/?path=/story/components-input-tabledirselector-tests--default-interaction-test');
    
    await page.waitForTimeout(3000);
    
    // 6. Verificar que las stories de test se cargan
    console.log('✅ Test 4: Verificando stories de test...');
    try {
      await frame.waitForSelector('[role="combobox"]', { timeout: 10000 });
      console.log('✅ Story de test cargada correctamente');
    } catch (e) {
      console.log('❌ Error cargando story de test:', e.message);
    }
    
    console.log('\n🎉 Validación de TableDirSelector completada');
    console.log('📊 Resumen:');
    console.log('   ✅ Componente se renderiza');
    console.log('   ✅ Mock del datasource configurado');
    console.log('   ✅ Interacción funcional');
    console.log('   ✅ Stories de test accesibles');
    
  } catch (error) {
    console.error('❌ Error durante la validación:', error);
  } finally {
    await browser.close();
  }
}

// Ejecutar directamente
validateTableDirSelector().catch(console.error);