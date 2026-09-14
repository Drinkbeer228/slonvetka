import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const server = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });

setTimeout(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  console.log(await page.content());
  
  await browser.close();
  server.kill();
  process.exit(0);
}, 3000);
