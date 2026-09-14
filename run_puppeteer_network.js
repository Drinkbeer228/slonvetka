import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const server = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });

setTimeout(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('response', async (response) => {
    if (!response.ok()) {
      try {
        const text = await response.text();
        console.log(`RESPONSE ERROR [${response.status()}] ${response.url()}: ${text}`);
      } catch (e) {}
    }
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  await browser.close();
  server.kill();
  process.exit(0);
}, 3000);
