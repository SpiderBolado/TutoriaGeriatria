// Suite de regressao para gerador_receitas.html.
// Roda contra um servidor estatico local (nao file://) para que localStorage
// tenha uma origem estavel entre navegacoes. Uso: node tests/regression.js [filtro]
const { chromium } = require('playwright');
const { startServer } = require('./server');

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}${detail ? ' :: ' + detail : ''}`);
}

async function newPage(browser) {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  return { page, consoleErrors };
}

async function selectCondicao(page, nome) {
  await page.fill('#search', nome);
  await page.waitForTimeout(250);
  const found = await page.evaluate((n) => {
    const card = [...document.querySelectorAll('#listaContainer .card')]
      .find((c) => c.querySelector('.card-head .nome')?.textContent.trim() === n);
    if (!card) return false;
    card.querySelector('input[data-role="cond-check"]').click();
    return true;
  }, nome);
  await page.waitForTimeout(200);
  return found;
}

async function run(url) {
  // ---- 1. Carregamento sem erros relevantes ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(400);
    const relevant = consoleErrors.filter((e) => !/ERR_CONNECTION|ERR_NAME_NOT_RESOLVED|net::/.test(e));
    record('carregamento sem erros de console', relevant.length === 0, relevant.join(' | '));
    await browser.close();
  }

  // ---- 2. Persistencia sobrevive a reload (Grupo 1) ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    await page.evaluate(() => { document.getElementById('medicoDetails').open = true; });
    await page.fill('#medicoNome', 'Dr. Teste');
    await page.fill('#medicoCrm', '12345-CE');
    await page.fill('#unidadeSaude', 'UBS Teste');
    await page.click('body'); // forca blur/change no ultimo campo antes do reload
    await page.waitForTimeout(200);
    await page.reload();
    await page.waitForTimeout(400);
    const vals = await page.evaluate(() => ({
      nome: document.querySelector('#medicoNome').value,
      crm: document.querySelector('#medicoCrm').value,
      unidade: document.querySelector('#unidadeSaude').value,
    }));
    const ok = vals.nome === 'Dr. Teste' && vals.crm === '12345-CE' && vals.unidade === 'UBS Teste';
    const relevant = consoleErrors.filter((e) => !/ERR_CONNECTION|net::/.test(e));
    record('persistencia sobrevive a reload', ok && relevant.length === 0, JSON.stringify(vals) + (relevant.length ? ' erros:' + relevant.join('|') : ''));
    await browser.close();
  }

  // ---- 3. Botoes editar/remover sobrevivem a impressao de 2 vias (Grupo 2) ----
  {
    const browser = await chromium.launch();
    const { page } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    await selectCondicao(page, 'Enxaqueca');
    await page.evaluate(() => {
      const radios = document.querySelectorAll('input[name="tipoReceita"]');
      const controle = [...radios].find((r) => r.value === 'controle');
      if (controle) { controle.checked = true; controle.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await page.waitForTimeout(200);
    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      page.click('#btnImprimir'),
    ]);
    await page.waitForTimeout(700);
    if (popup) await popup.close().catch(() => {});
    const btnDisplay = await page.evaluate(() => {
      const btn = document.querySelector('#receitaPaper .edit-item-btn');
      return btn ? getComputedStyle(btn).display : 'nao-encontrado';
    });
    record('botoes editar/remover visiveis apos imprimir 2 vias', btnDisplay !== 'none' && btnDisplay !== 'nao-encontrado', 'display=' + btnDisplay);
    await browser.close();
  }

  // ---- 4. Via nao corrompe ao editar item sem alterar nada (Grupo 3) ----
  {
    const browser = await chromium.launch();
    const { page } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    const target = await page.evaluate(() => {
      for (const [cond, c] of Object.entries(DATA.condicoes)) {
        for (const m of c.meds) {
          if (m.via && !['Oral', 'Tópico', 'Externo', 'Para Hidratação', 'Outro'].includes(m.via)) {
            return { cond, nome: m.nome, via: m.via };
          }
        }
      }
      return null;
    });
    if (!target) {
      record('edicao de item preserva via incomum', false, 'nenhum item de teste encontrado em DATA');
    } else {
      await selectCondicao(page, target.cond);
      await page.evaluate(() => {
        const btn = document.querySelector('#receitaPaper .edit-item-btn[data-sel]');
        if (btn) btn.click();
      });
      await page.waitForTimeout(200);
      await page.click('#btnSaveEditItem').catch(() => {});
      await page.waitForTimeout(200);
      // Le o DOM (nao o closure interno `selected`) pra achar sob qual titulo
      // "USO ___" o item caiu depois de editar/salvar sem alterar nada.
      const grupoDepois = await page.evaluate((nomeAlvo) => {
        const linhas = document.querySelector('#receitaPaper').innerText.split('\n').map((l) => l.trim()).filter(Boolean);
        const idxItem = linhas.findIndex((l) => l.includes(nomeAlvo));
        if (idxItem === -1) return null;
        for (let i = idxItem; i >= 0; i--) {
          if (/^USO /.test(linhas[i])) return linhas[i];
        }
        return null;
      }, target.nome);
      const grupoEsperado = 'USO ' + target.via.toUpperCase();
      record('edicao de item preserva via incomum', grupoDepois === grupoEsperado, `esperado="${grupoEsperado}" obtido="${grupoDepois}"`);
    }
    await browser.close();
  }

  // ---- 5. XSS: nome do paciente nao executa script (Grupo 4) ----
  {
    const browser = await chromium.launch();
    const { page } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    await page.exposeFunction('__xssProbe', () => { global.__xssFired = true; });
    let fired = false;
    await page.exposeFunction('__markXss', () => { fired = true; });
    await page.fill('#nomePaciente', '<img src=x onerror="window.__markXss()">');
    await page.waitForTimeout(300);
    record('XSS no nome do paciente nao executa', !fired);
    await browser.close();
  }

  // ---- 6. Fator nao numerico nao trava aviso de peso (Grupo 5-F) ----
  {
    const browser = await chromium.launch();
    const { page } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    await page.evaluate(() => { document.getElementById('novoNome').closest('details').open = true; });
    await page.fill('#novoNome', 'Remedio Teste Fator');
    await page.fill('#novoFator', 'abc');
    await page.click('#btnAddCustom').catch(() => {});
    await page.waitForTimeout(300);
    const avisoPeso = await page.evaluate(() => document.getElementById('pesoHint').classList.contains('show'));
    record('fator nao numerico nao prende aviso de peso', avisoPeso === false, 'aviso visivel=' + avisoPeso);
    await browser.close();
  }

  // ---- 7. Colisao de ID entre avulsos com mesmo nome (Grupo 5-D) ----
  {
    const browser = await chromium.launch();
    const { page } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    const dupName = await page.evaluate(() => {
      const byName = {};
      for (const m of DATA.medicamentos) (byName[m.nome] = byName[m.nome] || []).push(m);
      const dup = Object.entries(byName).find(([, arr]) => arr.length > 1);
      return dup ? dup[0] : null;
    });
    if (!dupName) {
      record('duas apresentacoes do mesmo remedio ficam selecionadas', false, 'nenhum nome duplicado encontrado em DATA.medicamentos');
    } else {
      await page.fill('#search', dupName);
      await page.waitForTimeout(250);
      let checkboxes = await page.$$('#listaContainer .card.med-avulso input[type=checkbox]');
      await checkboxes[0].click();
      await page.waitForTimeout(200);
      checkboxes = await page.$$('#listaContainer .card.med-avulso input[type=checkbox]');
      if (checkboxes[1]) await checkboxes[1].click();
      await page.waitForTimeout(200);
      const estado = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('#listaContainer .card.med-avulso')];
        return cards.map((c) => c.querySelector('input').checked);
      });
      const ambosSelecionados = estado.length >= 2 && estado[0] && estado[1];
      record('duas apresentacoes do mesmo remedio ficam selecionadas', ambosSelecionados, 'estado=' + JSON.stringify(estado));
    }
    await browser.close();
  }

  // ---- 8. Impressao comum tem @page e break-inside (Grupo 6) ----
  {
    const browser = await chromium.launch();
    const { page } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    await selectCondicao(page, 'Enxaqueca');
    let capturedHtml = null;
    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      page.click('#btnImprimir'),
    ]);
    await page.waitForTimeout(500);
    if (popup) {
      capturedHtml = await popup.content().catch(() => null);
      await popup.close().catch(() => {});
    }
    const hasPageRule = !!capturedHtml && /@page\s*{/.test(capturedHtml);
    const hasBreakInside = !!capturedHtml && /break-inside:\s*avoid/.test(capturedHtml);
    record('impressao comum define @page', hasPageRule);
    record('impressao comum evita quebra dentro de bloco', hasBreakInside);
    await browser.close();
  }

  // ---- 9. Condicao personalizada aparece nos chips de mais usadas (Grupo 7) ----
  {
    const browser = await chromium.launch();
    const { page } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      document.getElementById('editorCondicoesDetails').open = true;
    });
    await page.click('#editorNomeCond').catch(() => {});
    await page.fill('#editorNomeCond', 'Condicao De Teste XYZ').catch(() => {});
    await page.click('#editorBtnAddMed').catch(() => {});
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      const box = document.querySelector('.editor-med-box');
      if (box) box.querySelector('.ed-med-nome').value = 'Remedio XYZ';
    });
    await page.click('#editorBtnSalvar').catch(() => {});
    await page.waitForTimeout(200);
    const clicarCheckboxCondicao = async (n) => {
      await page.evaluate((nome) => {
        const card = [...document.querySelectorAll('#listaContainer .card')]
          .find((c) => c.querySelector('.card-head .nome')?.textContent.trim() === nome);
        card.querySelector('input[data-role="cond-check"]').click();
      }, n);
      await page.waitForTimeout(100);
    };
    await page.fill('#search', 'Condicao De Teste XYZ');
    await page.waitForTimeout(150);
    for (let i = 0; i < 6; i++) {
      // Liga (incrementa uso) e desliga pelo DOM (clique real), sem depender
      // de funcao interna do closure do app (nao acessivel via page.evaluate).
      await clicarCheckboxCondicao('Condicao De Teste XYZ');
      await clicarCheckboxCondicao('Condicao De Teste XYZ');
    }
    await page.waitForTimeout(200);
    const apareceNosChips = await page.evaluate(() => {
      return [...document.querySelectorAll('#chipsMaisUsadas .chip, #chipsMaisUsadas [data-nome]')]
        .some((c) => c.textContent.includes('Condicao De Teste XYZ'));
    });
    record('condicao personalizada aparece nos chips de mais usadas', apareceNosChips);
    await browser.close();
  }

  // ---- 10. Qualidade de dados no catalogo (Grupo 8) ----
  {
    const browser = await chromium.launch();
    const { page } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    const stats = await page.evaluate(() => {
      const raw = JSON.stringify(DATA);
      const viaVazioCondicoes = Object.values(DATA.condicoes).flatMap((c) => c.meds).filter((m) => m.via === '').length;
      const viaVazioMedicamentos = DATA.medicamentos.filter((m) => m.via === '').length;
      const predinis = (raw.match(/Predinis/g) || []).length;
      const constipacaoComAcento = !!DATA.condicoes['Constipação'];
      const constipacaoSemAcento = !!DATA.condicoes['Constipaçao'];
      return { viaVazioCondicoes, viaVazioMedicamentos, predinis, constipacaoComAcento, constipacaoSemAcento };
    });
    record('sem via em branco em DATA.condicoes', stats.viaVazioCondicoes === 0, JSON.stringify(stats));
    record('sem via em branco em DATA.medicamentos', stats.viaVazioMedicamentos === 0, 'total=' + stats.viaVazioMedicamentos);
    record('sem typo "Predinis"', stats.predinis === 0, 'ocorrencias=' + stats.predinis);
    record('chave "Constipação" com acento existe (sem duplicata)', stats.constipacaoComAcento && !stats.constipacaoSemAcento);
    await browser.close();
  }

  // ---- 11. Atalhos de teclado reais (Fase 2.1) ----
  {
    const browser = await chromium.launch();
    const { page } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    await selectCondicao(page, 'Enxaqueca');
    await page.click('body');
    await page.keyboard.press('Control+Enter').catch(() => {});
    await page.waitForTimeout(200);
    const limpouComCtrlEnter = await page.evaluate(() =>
      document.querySelector('#receitaPaper').innerText.includes('Selecione condições ou medicamentos ao lado.'));
    record('Ctrl+Enter limpa a receita', limpouComCtrlEnter);
    await browser.close();
  }

  // ---- 12. Edicao permanente de medicamento avulso (catalogo) ----
  {
    const browser = await chromium.launch();
    const { page } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    // A busca so filtra pelo nome (sem concentracao), entao busca "Azitromicina"
    // e depois acha o card cujo nome exibido bate exatamente com "Azitromicina 500mg".
    await page.fill('#search', 'Azitromicina');
    await page.waitForTimeout(250);
    const cliqueEdit = await page.evaluate(() => {
      const card = [...document.querySelectorAll('#listaContainer .card.med-avulso')]
        .find((c) => c.querySelector('.nome')?.textContent.trim() === 'Azitromicina 500mg');
      const btn = card?.querySelector('.avulso-edit');
      if (!btn) return false;
      btn.click();
      return true;
    });
    await page.waitForTimeout(200);
    if (cliqueEdit) {
      await page.fill('.edit-form .ef-qtde', '01 Caixa');
      await page.fill('.edit-form .ef-pos', 'Tomar 01 comprimido ao dia, por 05 dias.');
      await page.click('.edit-form .ef-save');
      await page.waitForTimeout(200);
    }
    // recarrega pra confirmar que persistiu, depois seleciona e confere a receita
    await page.reload();
    await page.waitForTimeout(400);
    await page.fill('#search', 'Azitromicina');
    await page.waitForTimeout(250);
    const alvo = await page.evaluateHandle(() => [...document.querySelectorAll('#listaContainer .card.med-avulso')]
      .find((c) => c.querySelector('.nome')?.textContent.trim() === 'Azitromicina 500mg'));
    const textoPosEdicao = await page.evaluate((card) => card?.querySelector('.pos')?.textContent || '', alvo);
    const checkbox = await page.evaluateHandle((card) => card?.querySelector('input[type=checkbox]'), alvo);
    await checkbox.asElement()?.click();
    await page.waitForTimeout(200);
    const receita = await page.evaluate(() => document.querySelector('#receitaPaper').innerText);
    const ok = cliqueEdit
      && textoPosEdicao.includes('Tomar 01 comprimido ao dia, por 05 dias.')
      && receita.includes('01 comprimido ao dia, por 05 dias')
      && !receita.includes('____');
    record('edicao permanente de medicamento avulso persiste e e usada ao selecionar', ok, 'posCard=' + JSON.stringify(textoPosEdicao));
    await browser.close();
  }

  // ---- Resumo ----
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${total} testes passaram.`);
  return passed === total;
}

(async () => {
  const { server, url } = await startServer();
  try {
    const ok = await run(url);
    process.exitCode = ok ? 0 : 1;
  } finally {
    server.close();
  }
})();
