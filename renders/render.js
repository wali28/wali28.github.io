#!/usr/bin/env node
import puppeteer from 'puppeteer';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const [,, sceneName, outName, widthArg, heightArg] = process.argv;
if (!sceneName) {
  console.error('usage: node render.js <scene.html> [output.png] [width] [height]');
  process.exit(1);
}

const width = parseInt(widthArg) || 2048;
const height = parseInt(heightArg) || 1536;
const sceneFile = resolve(`./scenes/${sceneName}`);
const outputFile = resolve(`./outputs/${outName || sceneName.replace('.html', '.png')}`);
mkdirSync('./outputs', { recursive: true });

console.log(`rendering ${sceneFile} → ${outputFile} (${width}×${height})`);

const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--use-gl=angle',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--enable-features=Vulkan',
    '--disable-dev-shm-usage',
  ],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  page.on('console', m => console.log(`[page] ${m.type()}: ${m.text()}`));
  page.on('pageerror', e => console.error(`[page-error]`, e.message));
  await page.goto(`file://${sceneFile}`, { waitUntil: 'networkidle0', timeout: 40000 });
  await page.waitForFunction(() => window.sceneReady === true, { timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: outputFile, type: 'png', omitBackground: false });
  console.log(`✓ rendered → ${outputFile}`);
} catch (err) {
  console.error('render failed:', err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
