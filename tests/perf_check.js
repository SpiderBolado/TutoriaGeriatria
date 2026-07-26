const { chromium } = require('playwright');
const { startServer } = require('./server');

(async () => {
  const { server, url } = await startServer(8935);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const t0 = Date.now();
  await page.goto(url);
  await page.waitForSelector('#receitaPaper');
  const tLoaded = Date.now() - t0;

  const docxAntes = await page.evaluate(() => typeof docx);
  console.log('tempo ate #receitaPaper existir:', tLoaded, 'ms');
  console.log('typeof docx logo apos carregar (esperado "undefined"):', docxAntes);

  // seleciona algo e exporta docx, confirma que carrega sob demanda e funciona
  await page.fill('#search', 'Enxaqueca');
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const card = [...document.querySelectorAll('#listaContainer .card')].find((c) => c.querySelector('.card-head .nome')?.textContent.trim() === 'Enxaqueca');
    card.querySelector('input[data-role="cond-check"]').click();
  });
  await page.waitForTimeout(200);

  const t1 = Date.now();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
    page.click('#btnDocx'),
  ]);
  const tExport = Date.now() - t1;
  const docxDepois = await page.evaluate(() => typeof docx);
  console.log('download disparado:', !!download, download ? await download.suggestedFilename() : '');
  console.log('tempo pra carregar docx.js sob demanda + gerar arquivo:', tExport, 'ms');
  console.log('typeof docx depois de exportar (esperado "function"):', docxDepois);
  console.log('erros de console:', errors.filter((e) => !/ERR_CONNECTION|net::/.test(e)));

  await browser.close();
  server.close();
})();
