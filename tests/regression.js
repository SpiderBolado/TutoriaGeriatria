// Suite de regressao para index.html (+ css/, js/).
// Roda contra um servidor estatico local (nao file://) para que localStorage
// tenha uma origem estavel entre navegacoes. Uso: node tests/regression.js [filtro]
const { chromium } = require('playwright');
const { startServer } = require('./server');

// A checagem antes de imprimir (falta peso/nome/médico) abre uma pergunta; os testes que
// não tratam dela rodam com window.__semConferir. O teste da checagem desliga isso.
{
  const launch0 = chromium.launch.bind(chromium);
  chromium.launch = async (...args) => {
    const b = await launch0(...args);
    const novoContexto = b.newContext.bind(b);
    b.newContext = async (o) => { const c = await novoContexto(o); await c.addInitScript(() => { window.__semConferir = true; }); return c; };
    b.newPage = async (o) => (await b.newContext(o)).newPage();
    return b;
  };
}

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
    await page.evaluate(() => localStorage.setItem('separar-auto', '0'));   // receita comum: o teste olha o "____" da quantidade
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

  // ---- 13. Encaminhamento: preenchimento, texto gerado e impressao ----
  {
    const browser = await chromium.launch();
    const { page } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    await page.fill('#nomePaciente', 'Paciente Teste Encaminhamento');
    await selectCondicao(page, 'Enxaqueca');
    await page.click('#btnEncaminhamento');
    await page.waitForTimeout(200);
    const overlayAberto = await page.evaluate(() => document.getElementById('encaminhamentoOverlay').classList.contains('show'));
    const dados = await page.evaluate(() => ({
      nome: document.getElementById('encNomePaciente').value,
      condicaoSel: document.getElementById('encCondicao').value,
      texto: document.getElementById('encTexto').value,
    }));
    const textoOk = dados.texto.includes('Paciente Teste Encaminhamento')
      && dados.texto.includes('Encaminho')
      && dados.texto.includes('atenção básica')
      && dados.texto.includes('Enxaqueca')
      && !dados.texto.includes('undefined');
    record('encaminhamento abre preenchido com paciente/condicao/texto', overlayAberto && dados.nome === 'Paciente Teste Encaminhamento' && dados.condicaoSel === 'Enxaqueca' && textoOk, JSON.stringify(dados));

    const [popup] = await Promise.all([
      page.waitForEvent('popup').catch(() => null),
      page.click('#btnImprimirEncaminhamento'),
    ]);
    await page.waitForTimeout(500);
    let popupOk = false;
    if (popup) {
      const conteudo = await popup.content().catch(() => '');
      popupOk = conteudo.includes('Paciente Teste Encaminhamento') && conteudo.includes('Encaminho');
      await popup.close().catch(() => {});
    }
    record('impressao de encaminhamento abre popup com texto correto', popupOk);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    const fechouComEsc = await page.evaluate(() => !document.getElementById('encaminhamentoOverlay').classList.contains('show'));
    record('encaminhamento fecha com Escape', fechouComEsc);
    await browser.close();
  }

  // ---- Conversao adulto -> pediatrica ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    const achou = await selectCondicao(page, 'Dor Muscular');
    await page.click('#btnPediatrica');
    await page.waitForTimeout(150);
    const semPeso = await page.evaluate(() => document.querySelectorAll('#receitaPaper .nome-med').length);
    await page.fill('#peso', '20');
    await page.click('#btnPediatrica');
    await page.waitForTimeout(250);
    const r = await page.evaluate(() => ({
      nomes: [...document.querySelectorAll('#receitaPaper .nome-med')].map((e) => e.textContent.trim()),
      pos: [...document.querySelectorAll('#receitaPaper .item-pos')].map((e) => e.textContent.trim()),
      avisos: document.getElementById('avisoBar').textContent,
    }));
    const ok = achou && semPeso === 3
      && r.nomes.join('|') === 'Dipirona 500 mg/mL|Ibuprofeno 50 mg/mL'
      && r.pos[0].includes('Tomar 12 gotas') && r.pos[1].includes('Tomar 20 gotas')
      && /Ciclobenzaprina/.test(r.avisos) && /Confira cada dose/.test(r.avisos)
      && consoleErrors.length === 0;
    record('converte receita de adulto para pediatrica pelo peso', ok, JSON.stringify(r));
    await page.click('#btnLimpar');
    await page.waitForTimeout(150);
    const limpou = await page.evaluate(() => document.getElementById('avisoBar').textContent.trim() === '');
    record('nova receita limpa avisos da conversao pediatrica', limpou);
    await browser.close();
  }

  // ---- Tema claro/escuro alterna e persiste ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    const estado = () => page.evaluate(() => [document.documentElement.getAttribute('data-tema-pref'), document.documentElement.getAttribute('data-theme')]);
    const inicial = await estado();
    await page.click('#btnTema');
    const claro = await estado();
    await page.click('#btnTema');
    const escuro = await estado();
    await page.reload();
    await page.waitForTimeout(300);
    const aposReload = await estado();
    await page.click('#btnTema');
    const volta = await estado();
    const ok = JSON.stringify([inicial, claro, escuro, aposReload, volta]) === JSON.stringify([
      ['auto', null], ['claro', 'light'], ['escuro', 'dark'], ['escuro', 'dark'], ['auto', null]
    ]) && consoleErrors.length === 0;
    record('tema alterna (auto/claro/escuro) e persiste apos reload', ok, JSON.stringify([inicial, claro, escuro, aposReload, volta]));
    await browser.close();
  }

  // ---- Celular: sem rolagem horizontal da pagina ----
  {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(url);
    await page.waitForTimeout(300);
    await page.fill('#nomePaciente', 'Paciente Com Nome Bem Comprido Para Testar Quebra');
    await selectCondicao(page, 'Dor Muscular');
    const larguras = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, vw: window.innerWidth }));
    record('celular sem rolagem horizontal (390px)', larguras.doc <= 390 && larguras.vw <= 390, JSON.stringify(larguras));
    await page.click('label.tipo-opt:has(input[name="tipoReceita"][value="controle"])');
    await page.waitForTimeout(250);
    const alturasVias = await page.evaluate(() => [...document.querySelectorAll('#receitaPaper .via-box')].map((v) => Math.round(v.getBoundingClientRect().height)));
    record('celular: vias do controle especial visiveis', alturasVias.length === 2 && alturasVias.every((h) => h > 200), JSON.stringify(alturasVias));
    await browser.close();
  }

  // ---- Local Rio Paranaiba: cabecalho, controle especial, .docx e persistencia ----
  {
    const browser = await chromium.launch();
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    await page.goto(url);
    await page.waitForTimeout(300);
    await page.click('label.tipo-opt:has(input[name="localReceita"][value="rio"])');
    await selectCondicao(page, 'Dor Muscular');
    const comum = await page.evaluate(() => {
      const head = document.querySelector('#receitaPaper .receita-logos');
      const temBrasao = typeof LOGO_RIO_ICON_B64 === 'string' && !!LOGO_RIO_ICON_B64;
      return {
        texto: head ? head.textContent.replace(/\s+/g, ' ').trim() : '',
        brasaoOk: temBrasao === !!document.querySelector('#receitaPaper .logo-muni-brasao'),
        semCarmo: !document.querySelector('#receitaPaper img[alt*="Carmo"]'),
      };
    });
    const [dl1] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }).catch(() => null), page.click('#btnDocx')]);
    await page.click('label.tipo-opt:has(input[name="tipoReceita"][value="controle"])');
    await page.waitForTimeout(200);
    const vias = await page.evaluate(() => [...document.querySelectorAll('#receitaPaper .via-box .muni-text b')].map((b) => b.textContent));
    const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }).catch(() => null), page.click('#btnDocx')]);
    await page.reload();
    await page.waitForTimeout(400);
    const persistiu = await page.evaluate(() => document.querySelector('input[name="localReceita"]:checked').value);
    const ok = /Prefeitura Municipal de Rio Paranaíba/.test(comum.texto) && comum.brasaoOk && comum.semCarmo
      && vias.length === 2 && vias.every((v) => v === 'Prefeitura Municipal de Rio Paranaíba')
      && !!dl1 && !!dl2 && persistiu === 'rio' && consoleErrors.length === 0;
    record('local Rio Paranaiba: cabecalho, 2 vias, .docx e persistencia', ok,
      JSON.stringify({ comum, vias, docx: [!!dl1, !!dl2], persistiu, consoleErrors }));
    await browser.close();
  }

  // ---- Pediatria: sugestao, conversao automatica, desfazer, idoso de baixo peso ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    const barra = () => page.evaluate(() => document.getElementById('avisoBar').textContent.replace(/\s+/g, ' '));
    const nomes = () => page.evaluate(() => [...document.querySelectorAll('#receitaPaper .nome-med')].map((e) => e.textContent.trim()));

    // idoso de 38 kg: sem sugestao de conversao
    await page.fill('#idade', '82');
    await page.fill('#peso', '38');
    await selectCondicao(page, 'Dor Muscular');
    await page.waitForTimeout(500);
    const idoso = await barra();
    await page.click('#btnLimpar');
    await page.waitForTimeout(200);

    // crianca so com peso: sugestao com botao, sem converter sozinha
    await page.fill('#peso', '20');
    await selectCondicao(page, 'Dor Muscular');
    await page.waitForTimeout(500);
    const sugestao = await barra();
    const antes = await nomes();
    await page.click('#avisoBar button[data-acao="converter-ped"]');
    await page.waitForTimeout(250);
    const depois = await nomes();
    // peso muda depois da conversao: avisos acompanham
    await page.fill('#peso', '24');
    await page.waitForTimeout(600);
    const recalculado = await barra();
    await page.click('#avisoBar button[data-acao="desfazer-ped"]');
    await page.waitForTimeout(250);
    const desfeito = await nomes();
    await page.click('#btnLimpar');
    await page.waitForTimeout(200);

    // modo automatico com idade < 12 anos
    await page.fill('#idade', '5a');
    await page.fill('#peso', '20');
    await page.waitForTimeout(500);
    await selectCondicao(page, 'Enxaqueca');
    await page.waitForTimeout(300);
    await page.click('#avisoBar input[data-acao="auto-ped"]');
    await page.waitForTimeout(400);
    await page.click('#btnLimpar');
    await page.fill('#idade', '5a');
    await page.fill('#peso', '20');
    await page.waitForTimeout(500);
    await selectCondicao(page, 'Dor Muscular');
    await page.waitForTimeout(400);
    const auto = await nomes();
    const autoPersistiu = await page.evaluate(() => localStorage.getItem('auto-pediatria'));

    const ok = !/Paciente pediátrico/.test(idoso)
      && /Paciente pediátrico \(20 kg\)/.test(sugestao) && antes.includes('Ciclobenzaprina 10mg')
      && depois.join('|') === 'Dipirona 500 mg/mL|Ibuprofeno 50 mg/mL'
      && /14 gotas/.test(recalculado) && /peso 24 kg/.test(recalculado)
      && desfeito.includes('Ciclobenzaprina 10mg')
      && auto.join('|') === 'Dipirona 500 mg/mL|Ibuprofeno 50 mg/mL' && autoPersistiu === '1'
      && consoleErrors.length === 0;
    record('pediatria: sugestao, conversao automatica, desfazer e idoso sem sugestao', ok,
      JSON.stringify({ idoso: idoso.slice(0, 80), sugestao: sugestao.slice(0, 120), antes, depois, recalculado: recalculado.slice(0, 160), desfeito, auto, autoPersistiu, consoleErrors }));
    await browser.close();
  }

  // ---- Catalogo pediatrico: faixas, teto e idade minima na receita; avulso com dose pronta ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    const barra = () => page.evaluate(() => document.getElementById('avisoBar').textContent.replace(/\s+/g, ' '));
    const linha = (nome) => page.evaluate((n) => {
      const it = [...document.querySelectorAll('#receitaPaper .nome-med')].find((e) => e.textContent.trim() === n);
      const l = it && it.closest('.item-linha');
      return l ? (l.textContent + ' ' + (l.nextElementSibling ? l.nextElementSibling.textContent : '')).replace(/\s+/g, ' ') : '';
    }, nome);
    await page.fill('#idade', '4m');
    await page.fill('#peso', '10');
    await page.waitForTimeout(500);
    await selectCondicao(page, 'Pneumonia (Criança)');
    await page.waitForTimeout(400);
    const ond10 = await linha('Ondansetrona 4mg (Comprimido)');
    const avisos4m = await barra();
    await page.fill('#idade', '14');
    await page.fill('#peso', '70');
    await page.waitForTimeout(600);
    const amox70 = await linha('Amoxicilina 50mg/mL');
    const avisos70 = await barra();
    await page.click('#btnLimpar');
    await page.fill('#peso', '20');
    await page.waitForTimeout(500);
    await page.fill('#search', 'Dipirona gotas');
    await page.waitForTimeout(250);
    await page.evaluate(() => {
      const card = [...document.querySelectorAll('#listaContainer .card.med-avulso')]
        .find((c) => c.querySelector('.nome')?.textContent.trim() === 'Dipirona gotas 500mg/mL');
      card?.querySelector('input[type=checkbox]')?.click();
    });
    await page.waitForTimeout(300);
    const avulso = await page.evaluate(() => document.querySelector('#receitaPaper').innerText.replace(/\s+/g, ' '));
    const ok = /1\/2 comprimido \(2 mg\)/.test(ond10)
      && /Metoclopramida Gotas 4mg\/mL: paciente com 4 meses, abaixo da idade mínima de 12 meses/.test(avisos4m)
      && /Tomar 20 mL/.test(amox70) && /Amoxicilina 50mg\/mL: dose calculada \(23\) excede o máximo de 20/.test(avisos70)
      && /Dar 12 gotas, de 06\/06 horas/.test(avulso)
      && consoleErrors.length === 0;
    record('catalogo pediatrico: faixa de peso, teto, idade minima e avulso por peso', ok,
      JSON.stringify({ ond10: ond10.slice(0, 160), avisos4m: avisos4m.slice(0, 400), amox70: amox70.slice(0, 120), avisos70: avisos70.slice(0, 300), avulso: avulso.slice(0, 200), consoleErrors }));
    await browser.close();
  }

  // ---- Edicoes salvas acompanham a remocao de item do catalogo (Vertigem sem Meclin) ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.goto(url);
    await page.evaluate(() => {
      localStorage.removeItem('overrides-catalogo');
      localStorage.setItem('overrides-condicoes', JSON.stringify({
        Vertigem: { meds: { 0: { removido: true }, 1: { posologia: 'CINARIZINA EDITADA' } }, orientacoes: {} },
        TCE: { meds: { 0: { posologia: 'DIPIRONA EDITADA' }, 1: { posologia: 'MECLIN EDITADO' } }, orientacoes: {} }
      }));
    });
    const ler = async () => {
      await page.reload();
      await page.waitForTimeout(400);
      await page.click('#btnLimpar');
      await selectCondicao(page, 'Vertigem');
      await page.waitForTimeout(200);
      return page.evaluate(() => document.querySelector('#receitaPaper').innerText.replace(/\s+/g, ' '));
    };
    const r1 = await ler();
    const r2 = await ler();   // segunda carga nao pode deslocar de novo
    const versao = await page.evaluate(() => localStorage.getItem('overrides-catalogo'));
    const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem('overrides-condicoes')).Vertigem.meds);
    const salvoTce = await page.evaluate(() => JSON.parse(localStorage.getItem('overrides-condicoes')).TCE.meds);
    const ok = /CINARIZINA EDITADA/.test(r1) && /Domperidona/.test(r1) && r1 === r2
      && versao === '3' && JSON.stringify(salvo) === JSON.stringify({ 0: { posologia: 'CINARIZINA EDITADA' } })
      && JSON.stringify(salvoTce) === JSON.stringify({ 0: { posologia: 'DIPIRONA EDITADA' } })
      && consoleErrors.length === 0;
    record('edicoes salvas acompanham a remocao do Meclin (Vertigem e TCE)', ok, JSON.stringify({ r1: r1.slice(0, 300), iguais: r1 === r2, versao, salvo, salvoTce, consoleErrors }));
    await browser.close();
  }

  // ---- Atestado: afastamento com periodo e CID so com autorizacao; comparecimento; acompanhante; impressao ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.addInitScript(() => { window.__prints = []; window.open = () => ({ document: { write: (h) => window.__prints.push(h), close(){} }, focus(){}, print(){}, close(){} }); });
    await page.goto(url);
    await page.waitForTimeout(300);
    await page.fill('#nomePaciente', 'Paciente Atestado');
    await page.click('#btnAtestado');
    await page.waitForTimeout(150);
    const texto = () => page.inputValue('#atTexto');
    const aberto = await page.evaluate(() => document.getElementById('atestadoOverlay').classList.contains('show'));
    const t1 = await texto();
    await page.fill('#atData', '2026-10-19');
    await page.fill('#atInicio', '2026-10-19');
    await page.fill('#atHora', '08:30');
    await page.click('.at-dias-rapidos button[data-dias="3"]');
    await page.fill('#atCid', 'J06.9');
    const semAutorizacao = await texto();
    await page.check('#atCidAutorizado');
    const comCid = await texto();
    await page.click('#btnImprimirAtestado');
    await page.waitForTimeout(400);
    const impresso = (await page.evaluate(() => window.__prints)).pop() || '';
    await page.check('input[name=atTipo][value="comparecimento"]');
    await page.fill('#atHoraInicio', '07:10');
    await page.fill('#atHoraFim', '09:00');
    const comparecimento = await texto();
    const titulo = await page.textContent('#atTitulo');
    await page.check('input[name=atTipo][value="acompanhante"]');
    await page.fill('#atAcompanhante', 'Fulana Acompanhante');
    const acompanhante = await texto();
    await page.keyboard.press('Escape');
    const fechou = await page.evaluate(() => !document.getElementById('atestadoOverlay').classList.contains('show'));
    // mesmo paciente: o rascunho volta como estava
    await page.click('#btnAtestado');
    await page.waitForTimeout(150);
    const rascunhoMantido = (await page.inputValue('#atAcompanhante')) === 'Fulana Acompanhante' && (await page.isChecked('input[name=atTipo][value="acompanhante"]'));
    await page.keyboard.press('Escape');
    // outro paciente: nao carrega o CID do anterior; Rio Paranaiba muda a cidade
    await page.fill('#nomePaciente', 'Outro Paciente');
    await page.evaluate(() => { const r = document.querySelector('input[name=localReceita][value="rio"]'); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.click('#btnAtestado');
    await page.waitForTimeout(150);
    await page.check('input[name=atTipo][value="afastamento"]');
    const reaberto = await texto();
    const cidLimpo = (await page.inputValue('#atCid')) === '' && !(await page.isChecked('#atCidAutorizado'));
    const ok = aberto && /Atesto, para os devidos fins, que Paciente Atestado esteve em atendimento médico/.test(t1) && /01 \(um\) dia/.test(t1)
      && /03 \(três\) dias de afastamento de suas atividades, de 19\/10\/2026 a 21\/10\/2026\./.test(semAutorizacao) && !/J06\.9/.test(semAutorizacao)
      && /CID-10: J06\.9\./.test(comCid) && /às 08:30/.test(comCid)
      && /Atestado médico/.test(impresso) && /CID-10: J06\.9/.test(impresso) && /Paciente Atestado/.test(impresso) && /Carmo do Paranaíba, \d+ de /.test(impresso)
      && /esteve nesta unidade para atendimento médico no dia 19\/10\/2026, das 07:10 às 09:00\./.test(comparecimento) && titulo === 'Declaração de comparecimento'
      && /Fulana Acompanhante esteve nesta unidade no dia 19\/10\/2026, das 07:10 às 09:00, acompanhando Paciente Atestado/.test(acompanhante)
      && fechou && rascunhoMantido && cidLimpo && /^Atesto/.test(reaberto) && /Outro Paciente/.test(reaberto) && /Rio Paranaíba, \d+ de /.test(reaberto)
      && consoleErrors.length === 0;
    record('atestado: afastamento (periodo, CID com autorizacao), comparecimento, acompanhante e impressao', ok,
      JSON.stringify({ aberto, rascunhoMantido, t1: t1.slice(0, 200), semAutorizacao: semAutorizacao.slice(0, 260), comCid: comCid.slice(0, 260), comparecimento: comparecimento.slice(0, 200), titulo, acompanhante: acompanhante.slice(0, 200), fechou, cidLimpo, reaberto: reaberto.slice(-120), consoleErrors }));
    await browser.close();
  }

  // ---- Orientacoes: quebra de linha do texto e espaco de paragrafo (previa, impressao, copia, .docx) ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.addInitScript(() => { window.__prints = []; window.open = () => ({ document: { write: (h) => window.__prints.push(h), close(){} }, focus(){}, print(){}, close(){} }); });
    const context = page.context();
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(url);
    await page.waitForTimeout(300);
    await selectCondicao(page, 'DRGE');   // tem orientacao com lista numerada em varias linhas
    await page.waitForTimeout(200);
    const lis = () => page.evaluate(() => [...document.querySelectorAll('#receitaPaper .orientacoes-bloco li')]
      .map((li) => ({ esp: li.classList.contains('espaco-antes'), mt: getComputedStyle(li).marginTop, h: li.getBoundingClientRect().height, ws: getComputedStyle(li).whiteSpace })));
    const antes = await lis();
    await page.evaluate(() => document.querySelectorAll('#receitaPaper .orientacoes-bloco li .par-item')[2].click());
    await page.waitForTimeout(200);
    const depois = await lis();
    await page.click('#btnImprimir');
    await page.waitForTimeout(400);
    const impresso = (await page.evaluate(() => window.__prints)).pop() || '';
    const pImp = await browser.newPage(); await pImp.setContent(impresso);
    const botoesNaImpressao = await pImp.evaluate(() => [...document.querySelectorAll('.par-item, .edit-item-btn, .rm-item')].filter((b) => getComputedStyle(b).display !== 'none').length);
    await pImp.close();
    await page.click('#btnCopiar');
    await page.waitForTimeout(200);
    const copiado = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnDocx')]);
    const fs = require('fs'); const os = require('os'); const path = require('path');
    const arq = path.join(os.tmpdir(), 'orient-paragrafo.docx'); await dl.saveAs(arq);
    const xml = require('child_process').execSync(`unzip -p ${arq} word/document.xml`).toString();
    // desmarca de novo: volta ao normal
    await page.evaluate(() => document.querySelectorAll('#receitaPaper .orientacoes-bloco li .par-item')[2].click());
    await page.waitForTimeout(150);
    const desfeito = await lis();
    const ok = antes.every((l) => !l.esp && l.ws === 'pre-line') && depois[2].esp && depois[2].mt === '14px' && !depois[1].esp
      && (impresso.match(/class="espaco-antes"/g) || []).length === 1 && /white-space:pre-line/.test(impresso) && botoesNaImpressao === 0
      && /\n\n- /.test(copiado.split('ORIENTAÇÕES')[1] || '')
      && /<w:spacing w:before="200"\/>/.test(xml) && (xml.match(/<w:br\/>/g) || []).length >= 3
      && !desfeito[2].esp && consoleErrors.length === 0;
    record('orientacoes: quebra de linha e espaco de paragrafo (previa, impressao, copia, docx)', ok,
      JSON.stringify({ botoesNaImpressao, antes: antes.slice(0, 4), depois: depois.slice(0, 4), impressoEsp: (impresso.match(/class="espaco-antes"/g) || []).length, copiado: (copiado.split('ORIENTAÇÕES')[1] || '').slice(0, 160), brs: (xml.match(/<w:br\/>/g) || []).length, before200: /<w:spacing w:before="200"\/>/.test(xml), consoleErrors }));
    await browser.close();
  }

  // ---- Clique fora nao apaga texto: janelas de edicao, encaminhamento (rascunho) e edicao na lista ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    page.on('dialog', (d) => d.dismiss());
    await page.goto(url);
    await page.waitForTimeout(300);
    await page.fill('#nomePaciente', 'Paciente Rascunho');
    await selectCondicao(page, 'Enxaqueca');
    await page.waitForTimeout(200);
    const cantoDoFundo = async (id) => { const b = await page.$(`#${id}`); const r = await b.boundingBox(); await page.mouse.click(r.x + 5, r.y + 5); await page.waitForTimeout(150); };
    const aberta = (id) => page.evaluate((i) => document.getElementById(i).classList.contains('show'), id);

    // 1) editar item da receita: clique no fundo nao fecha; Esc com alteracao pergunta (aqui: cancela)
    await page.evaluate(() => document.querySelector('#receitaPaper .edit-item-btn[data-sel]').click());
    await page.waitForTimeout(150);
    await page.fill('#editItemPosologia', 'POSOLOGIA DIGITADA');
    await cantoDoFundo('editItemOverlay');
    const editAbertaAposClique = await aberta('editItemOverlay');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    const editAbertaAposEsc = await aberta('editItemOverlay');
    const editTexto = await page.inputValue('#editItemPosologia');
    await page.click('#btnCancelEditItem');

    // 2) encaminhamento: clique no fundo nao fecha; fechar e reabrir mantem o texto; Recomecar gera de novo
    await page.click('#btnEncaminhamento');
    await page.waitForTimeout(150);
    await page.fill('#encTexto', 'TEXTO ESCRITO A MAO');
    await cantoDoFundo('encaminhamentoOverlay');
    const encAbertaAposClique = await aberta('encaminhamentoOverlay');
    await page.click('#btnFecharEncaminhamento');
    await page.click('#btnEncaminhamento');
    await page.waitForTimeout(150);
    const encReaberto = await page.inputValue('#encTexto');
    const recomecarVisivel = await page.isVisible('#btnRecomecarEncaminhamento');
    await page.click('#btnRecomecarEncaminhamento');
    const encRecomecado = await page.inputValue('#encTexto');
    await page.fill('#encTexto', 'OUTRO RASCUNHO');
    await page.click('#btnFecharEncaminhamento');
    await page.click('#btnLimpar');
    await page.fill('#nomePaciente', 'Paciente Rascunho');
    await page.click('#btnEncaminhamento');
    await page.waitForTimeout(150);
    const encAposNovaReceita = await page.inputValue('#encTexto');
    await page.click('#btnFecharEncaminhamento');

    // 3) edicao na lista: marcar outra condicao e mudar o peso redesenham a lista sem perder o que foi digitado
    await page.fill('#search', 'Enxaqueca');
    await page.waitForTimeout(250);
    await page.evaluate(() => {
      const card = [...document.querySelectorAll('#listaContainer .card')].find((c) => c.querySelector('.card-head .nome')?.textContent.trim() === 'Enxaqueca');
      card.querySelector('.card-head').click();
    });
    await page.waitForTimeout(150);
    await page.evaluate(() => document.querySelector('#listaContainer .sub-row .ef-edit').click());
    await page.waitForTimeout(150);
    await page.fill('#listaContainer .edit-form .ef-pos', 'EDICAO NA LISTA');
    await page.fill('#peso', '30');
    await page.waitForTimeout(600);
    await page.evaluate(() => document.querySelector('#listaContainer .sub-row input[type=checkbox]').click());
    await page.waitForTimeout(250);
    const lista = await page.evaluate(() => document.querySelector('#listaContainer .edit-form .ef-pos')?.value || '(sem formulario)');
    await page.click('#listaContainer .edit-form .ef-cancel');
    await page.waitForTimeout(150);
    const semFormulario = await page.evaluate(() => !document.querySelector('#listaContainer .edit-form'));

    const ok = editAbertaAposClique && editAbertaAposEsc && editTexto === 'POSOLOGIA DIGITADA'
      && encAbertaAposClique && encReaberto === 'TEXTO ESCRITO A MAO' && recomecarVisivel && /^Encaminho Paciente Rascunho/.test(encRecomecado)
      && /^Encaminho Paciente Rascunho/.test(encAposNovaReceita)
      && lista === 'EDICAO NA LISTA' && semFormulario
      && consoleErrors.length === 0;
    record('clique fora nao apaga texto (edicao de item, encaminhamento com rascunho, edicao na lista)', ok,
      JSON.stringify({ editAbertaAposClique, editAbertaAposEsc, editTexto, encAbertaAposClique, encReaberto, recomecarVisivel, encRecomecado: encRecomecado.slice(0, 40), encAposNovaReceita: encAposNovaReceita.slice(0, 40), lista, semFormulario, consoleErrors }));
    await browser.close();
  }

  // ---- Mesmo paciente: limpa so a receita e mantem nome, idade e peso; Nova receita limpa tudo ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    const estado = () => page.evaluate(() => ({
      nome: document.getElementById('nomePaciente').value, idade: document.getElementById('idade').value, peso: document.getElementById('peso').value,
      itens: document.querySelectorAll('#receitaPaper .nome-med').length, orient: document.querySelectorAll('#receitaPaper .orientacoes-bloco li').length
    }));
    await page.fill('#nomePaciente', 'Maria Mesmo Paciente');
    await page.fill('#idade', '40');
    await page.fill('#peso', '62');
    await selectCondicao(page, 'ITU');
    await page.waitForTimeout(200);
    const antes = await estado();
    await page.click('#btnMesmoPaciente');
    await page.waitForTimeout(200);
    const mesmo = await estado();
    await selectCondicao(page, 'Enxaqueca');
    await page.keyboard.press('Control+Shift+Enter');
    await page.waitForTimeout(200);
    const atalho = await estado();
    await selectCondicao(page, 'Enxaqueca');
    await page.click('#btnLimpar');
    await page.waitForTimeout(200);
    const nova = await estado();
    const ok = antes.itens > 0 && antes.orient > 0
      && mesmo.nome === 'Maria Mesmo Paciente' && mesmo.idade === '40' && mesmo.peso === '62' && mesmo.itens === 0 && mesmo.orient === 0
      && atalho.nome === 'Maria Mesmo Paciente' && atalho.itens === 0
      && nova.nome === '' && nova.idade === '' && nova.peso === '' && nova.itens === 0
      && consoleErrors.length === 0;
    record('mesmo paciente mantem nome/idade/peso; nova receita limpa tudo', ok, JSON.stringify({ antes, mesmo, atalho, nova, consoleErrors }));
    await browser.close();
  }

  // ---- Padroes de uso: mudanca repetida em 3 atendimentos vira sugestao; aplicar muda o padrao ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.addInitScript(() => { window.open = () => ({ document: { write(){}, close(){} }, focus(){}, print(){}, close(){} }); });
    await page.goto(url);
    await page.waitForTimeout(300);
    const barra = () => page.evaluate(() => document.getElementById('avisoBar').textContent.replace(/\s+/g, ' '));
    const NOVA = 'Tomar 01 comprimido, de 08/08 horas, se dor.';
    // atendimento = Dor Muscular sem a Ciclobenzaprina, com Dipirona editada e Omeprazol acrescentado;
    // o 2o atendimento e feito em duas receitas do mesmo paciente (nao pode contar a "remocao" da 1a parte)
    // remove da receita, um por vez (cada clique redesenha a receita), os itens cujo nome casa com re
    const removerItens = async (re) => {
      for (;;) {
        const tirou = await page.evaluate((src) => {
          const b = [...document.querySelectorAll('#receitaPaper .rm-item[data-sel]')].find((x) => new RegExp(src).test(x.closest('.item-linha').textContent));
          if (b) b.click();
          return !!b;
        }, re);
        if (!tirou) return;
        await page.waitForTimeout(60);
      }
    };
    const atendimento = async (i, dividido) => {
      await page.fill('#nomePaciente', 'Paciente ' + i);
      await selectCondicao(page, 'Dor Muscular');
      await removerItens('Ciclobenzaprina');
      await page.evaluate(() => [...document.querySelectorAll('#receitaPaper .edit-item-btn[data-sel]')].find((x) => /Dipirona/.test(x.closest('.item-linha').textContent)).click());
      await page.fill('#editItemPosologia', NOVA);
      await page.click('#btnSaveEditItem');
      await page.fill('#search', 'Omeprazol'); await page.waitForTimeout(250);
      await page.evaluate(() => { const c = [...document.querySelectorAll('#listaContainer .card.med-avulso')].find((x) => /^Omeprazol/.test(x.querySelector('.nome')?.textContent.trim() || '')); c.querySelector('input[type=checkbox]').click(); });
      await page.waitForTimeout(150);
      if(dividido){
        // 1a receita so com a Dipirona; 2a (Mesmo paciente) com o resto
        await removerItens('^(?:(?!Dipirona).)*$');
        await page.click('#btnImprimir'); await page.waitForTimeout(150);
        await page.click('#btnMesmoPaciente');
        await selectCondicao(page, 'Dor Muscular');
        await removerItens('Ciclobenzaprina|Dipirona');
        await page.fill('#search', 'Omeprazol'); await page.waitForTimeout(250);
        await page.evaluate(() => { const c = [...document.querySelectorAll('#listaContainer .card.med-avulso')].find((x) => /^Omeprazol/.test(x.querySelector('.nome')?.textContent.trim() || '')); c.querySelector('input[type=checkbox]').click(); });
        await page.waitForTimeout(150);
      }
      await page.click('#btnImprimir'); await page.waitForTimeout(150);
      await page.click('#btnLimpar'); await page.waitForTimeout(150);
    };
    await atendimento(1, false);
    await atendimento(2, true);
    await selectCondicao(page, 'Dor Muscular');
    const depoisDe2 = await barra();
    await page.click('#btnLimpar');
    await atendimento(3, false);
    await selectCondicao(page, 'Dor Muscular');
    await page.waitForTimeout(200);
    const depoisDe3 = await barra();
    // aplica as tres sugestoes
    for (let k = 0; k < 3; k++) {
      const b = await page.$('#avisoBar button[data-acao="padrao-aplicar"]');
      if (!b) break;
      await b.click(); await page.waitForTimeout(250);
    }
    await page.click('#btnLimpar');
    await page.reload(); await page.waitForTimeout(400);
    await selectCondicao(page, 'Dor Muscular');
    await page.waitForTimeout(200);
    const receita = await page.evaluate(() => document.querySelector('#receitaPaper').innerText.replace(/\s+/g, ' '));
    const semSugestao = !/Sugestão do seu uso/.test(await barra());
    const ok = !/Sugestão do seu uso/.test(depoisDe2)
      && /Sugestão do seu uso/.test(depoisDe3) && /Dipirona/.test(depoisDe3) && /tirou .*Ciclobenzaprina|acrescentou .*Omeprazol/.test(depoisDe3)
      && receita.includes(NOVA) && !/Ciclobenzaprina/.test(receita) && /Omeprazol/.test(receita)
      && semSugestao && consoleErrors.length === 0;
    record('padroes de uso: sugere apos 3 atendimentos (receita dividida conta como 1) e aplicar muda o padrao', ok,
      JSON.stringify({ depoisDe2: depoisDe2.slice(0, 200), depoisDe3: depoisDe3.slice(0, 500), receita: receita.slice(0, 400), semSugestao, consoleErrors }));
    await browser.close();
  }

  // ---- Separar sozinho: ATB nas 2 vias e o resto + orientacoes na comum (previa, impressao, docx, copia) ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.addInitScript(() => { window.__prints = []; window.open = () => ({ document: { write: (h) => window.__prints.push(h), close(){} }, focus(){}, print(){}, close(){} }); });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(url);
    // "separar sempre" vem ligado de fábrica; aqui começa desligado para testar a sugestão
    await page.evaluate(() => localStorage.setItem('separar-auto', '0'));
    await page.reload();
    await page.waitForTimeout(300);
    const barra = () => page.evaluate(() => document.getElementById('avisoBar').textContent.replace(/\s+/g, ' '));
    const partes = () => page.evaluate(() => {
      const nomes = (sel) => [...document.querySelectorAll(sel + ' .nome-med')].map((e) => e.textContent.trim());
      return { comum: nomes('#receitaPaper .parte-comum'), duas: [...new Set(nomes('#receitaPaper .parte-duas'))],
        orientComum: document.querySelectorAll('#receitaPaper .parte-comum .orientacoes-bloco li').length,
        orientDuas: document.querySelectorAll('#receitaPaper .parte-duas .orientacoes-bloco li').length };
    });
    await page.fill('#nomePaciente', 'Paciente Separado');
    await selectCondicao(page, 'ITU');   // Fosfomicina (antimicrobiano) + Dipirona + Pyridium + orientacoes
    await page.waitForTimeout(200);
    const sugestao = await barra();
    await page.click('#avisoBar button[data-acao="separar-auto"]');
    await page.waitForTimeout(250);
    const separado = await partes();
    // trocar a Dipirona de lado e voltar
    await page.evaluate(() => [...document.querySelectorAll('#receitaPaper .parte-comum .vias-item')].find((b) => /Dipirona/.test(b.closest('.item-linha').textContent)).click());
    await page.waitForTimeout(200);
    const trocado = await partes();
    await page.evaluate(() => [...document.querySelectorAll('#receitaPaper .parte-duas .vias-item')].find((b) => /Dipirona/.test(b.closest('.item-linha').textContent)).click());
    await page.waitForTimeout(200);
    // impressao: retrato + paisagem no mesmo PDF
    await page.click('#btnImprimir');
    await page.waitForTimeout(500);
    const html = (await page.evaluate(() => window.__prints)).pop() || '';
    const p2 = await browser.newPage();
    await p2.setContent(html, { waitUntil: 'load' });
    const pdf = await p2.pdf({ preferCSSPageSize: true });
    const caixas = (pdf.toString('latin1').match(/\/MediaBox\s*\[[^\]]*\]/g) || []).map((m) => { const n = m.match(/[\d.]+/g).map(Number); return n[2] > n[3] ? 'paisagem' : 'retrato'; });
    const botoesVisiveis = await p2.evaluate(() => [...document.querySelectorAll('.vias-item, .par-item, .edit-item-btn, .rm-item')].filter((b) => getComputedStyle(b).display !== 'none').length);
    await p2.close();
    // .docx: duas secoes, a segunda em paisagem
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnDocx')]);
    const os = require('os'); const path = require('path');
    const arq = path.join(os.tmpdir(), 'separado.docx'); await dl.saveAs(arq);
    const xml = require('child_process').execSync(`unzip -p ${arq} word/document.xml`).toString();
    const secoes = (xml.match(/<w:sectPr/g) || []).length;
    const paisagem = /w:orient="landscape"/.test(xml);
    const docxTexto = xml.replace(/<[^>]+>/g, ' ');
    // copia
    await page.click('#btnCopiar');
    await page.waitForTimeout(200);
    const copiado = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
    // "Separar sozinho sempre": na proxima receita com ATB, separa sem pedir
    await page.check('#avisoBar input[data-acao="separar-sempre"]');
    await page.reload();   // app reaberto: o tipo volta a "Comum"
    await page.waitForTimeout(400);
    const tipoAoAbrir = await page.evaluate(() => document.querySelector('input[name=tipoReceita]:checked').value);
    await selectCondicao(page, 'ITU');
    await page.waitForTimeout(250);
    const sozinho = await page.evaluate(() => document.querySelector('input[name=tipoReceita]:checked').value);
    const ok = /Fosfomicina Trometamol 3g precisa de receita em 2 vias \(antimicrobiano\)/.test(sugestao)
      && separado.duas.join('|') === 'Fosfomicina Trometamol 3g' && separado.comum.includes('Dipirona 500mg') && !separado.comum.includes('Fosfomicina Trometamol 3g')
      && separado.orientComum > 0 && separado.orientDuas === 0
      && trocado.duas.includes('Dipirona 500mg') && !trocado.comum.includes('Dipirona 500mg')
      && caixas.length >= 2 && caixas[0] === 'retrato' && caixas[caixas.length - 1] === 'paisagem' && botoesVisiveis === 0
      && secoes === 2 && paisagem && /Fosfomicina/.test(docxTexto) && /Dipirona/.test(docxTexto)
      && /RECEITA EM 2 VIAS/.test(copiado) && copiado.indexOf('Dipirona') < copiado.indexOf('RECEITA EM 2 VIAS') && copiado.indexOf('Fosfomicina') > copiado.indexOf('RECEITA EM 2 VIAS')
      && tipoAoAbrir === 'comum' && sozinho === 'auto'
      && consoleErrors.length === 0;
    record('separar sozinho: ATB nas 2 vias, resto e orientacoes na comum (previa, troca de lado, PDF retrato+paisagem, docx, copia, sempre)', ok,
      JSON.stringify({ sugestao: sugestao.slice(0, 160), separado, trocado, caixas, botoesVisiveis, secoes, paisagem, copiado: copiado.slice(0, 80), tipoAoAbrir, sozinho, consoleErrors }));
    await browser.close();
  }

  // ---- Dentro do Quadro do Plantao: configuracoes pelo banco, paciente do cartao, receita volta, downloads pelo Quadro ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.goto(url + 'tests/fixtures/quadro-falso.html');
    let f = null;
    for(let k = 0; k < 40; k++){
      f = page.frame({ url: /index\.html#quadro/ });
      if(f && await f.evaluate(() => document.getElementById('nomePaciente') && document.getElementById('nomePaciente').value).catch(() => '')) break;
      await page.waitForTimeout(250);
    }
    const inicio = await f.evaluate(() => ({ nome: nomePaciente.value, idade: idade.value, peso: peso.value, medico: medicoNome.value, avisos: avisoBar.innerText }));
    await f.click('button[data-acao="cond-queixa"][data-nome="Dor Muscular"]');
    await page.waitForTimeout(400);
    const conflito = await f.evaluate(() => avisoBar.innerText);
    // configuracao editada sobe; historico (tem nome) nao
    await f.evaluate(() => { medicoCrm.value = '9999'; medicoCrm.dispatchEvent(new Event('input', { bubbles: true })); medicoCrm.dispatchEvent(new Event('change', { bubbles: true })); });
    const [popup] = await Promise.all([page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null), f.click('#btnImprimir')]);
    if(popup) await popup.close();
    await f.click('#btnDocx');
    await page.waitForTimeout(2500);
    const log = await page.evaluate(() => window.__log);
    const banco = await page.evaluate(() => window.__banco);
    // outro cartao: outro paciente comeca receita nova, sem as alergias do anterior
    await page.evaluate(() => window.__mandarPaciente({ nome: 'Bruno Outro', idade: '8 meses', peso: 9, alergias: [], queixa: '' }));
    await page.waitForTimeout(500);
    const outro = await f.evaluate(() => ({ nome: nomePaciente.value, idade: idade.value, peso: peso.value, itens: document.querySelectorAll('#receitaPaper .item, #receitaPaper .rx-item').length, avisos: avisoBar.innerText }));
    const emitidas = log.filter(x => x.tipo === 'emitida');
    const ok = inicio.nome === 'Ana Teste' && inicio.idade === '30 anos' && inicio.peso === '58' && inicio.medico === 'Dra. Do Banco'
      && /Alergia registrada no Quadro: dipirona/.test(inicio.avisos) && /ALERGIA/.test(conflito)
      && /9999/.test(banco['medico-info'] || '') && !log.some(x => x.tipo === 'salvar' && /historico|atendimento/.test(x.chave))
      && !!popup && emitidas.length === 2 && emitidas[0].como === 'impresso' && emitidas[0].itens.length >= 1
      && log.some(x => x.tipo === 'baixar' && /\.docx$/.test(x.nome) && x.tamanho > 1000)
      && outro.nome === 'Bruno Outro' && outro.idade === '8 meses' && !/dipirona/.test(outro.avisos)
      && consoleErrors.length === 0;
    record('dentro do Quadro: banco, paciente do cartao, alergia, receita emitida e downloads pela ponte', ok,
      JSON.stringify({ inicio: { ...inicio, avisos: inicio.avisos.slice(0, 120) }, conflito: conflito.slice(0, 120), crm: banco['medico-info'], popup: !!popup, log: log.map(x => x.tipo + (x.chave ? ':' + x.chave : '') + (x.nome ? ':' + x.nome : '')), outro, consoleErrors }));
    await browser.close();
  }

  // ---- Revisao de plantao: atalhos seguros, Desfazer, busca, checagem antes de imprimir, condicao personalizada ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    const itens = () => page.evaluate(() => document.querySelectorAll('#receitaPaper .item-linha').length);
    // busca por sintoma e Enter no nome do remedio
    await page.fill('#search', 'garganta'); await page.waitForTimeout(250);
    const garganta = await page.evaluate(() => [...document.querySelectorAll('#listaContainer .card-head .nome')].map((e) => e.textContent.trim()).slice(0, 3));
    await page.fill('#search', 'azitro'); await page.press('#search', 'Enter'); await page.waitForTimeout(250);
    const aposAzitro = await page.evaluate(() => [...document.querySelectorAll('#receitaPaper .nome-med')].map((e) => e.textContent.trim()));
    // Ctrl+Enter dentro da janela de edicao salva, nao apaga a receita
    await page.fill('#nomePaciente', 'Paciente Atalho');
    await page.evaluate(() => document.querySelector('#receitaPaper .edit-item-btn').click());
    await page.waitForTimeout(150);
    await page.fill('#editItemPosologia', 'POSOLOGIA PELO ATALHO');
    await page.press('#editItemPosologia', 'Control+Enter'); await page.waitForTimeout(200);
    const aposAtalho = { nome: await page.inputValue('#nomePaciente'), texto: await page.evaluate(() => receitaPaper.innerText), janela: await page.evaluate(() => editItemOverlay.classList.contains('show')) };
    // Nova receita com Desfazer
    await page.click('#btnLimpar'); await page.waitForTimeout(150);
    const limpo = { nome: await page.inputValue('#nomePaciente'), itens: await itens(), foco: await page.evaluate(() => document.activeElement.id) };
    await page.click('#toast button'); await page.waitForTimeout(200);
    const desfeito = { nome: await page.inputValue('#nomePaciente'), itens: await itens() };
    // checagem antes de imprimir: falta o medico
    await page.evaluate(() => { window.__semConferir = false; });
    await page.click('#btnImprimir'); await page.waitForTimeout(200);
    const pergunta = await page.evaluate(() => (document.querySelector('.pergunta-overlay') || {}).innerText || '');
    await page.click('.pergunta-overlay button.btn-primary'); await page.waitForTimeout(200);
    const preencher = await page.evaluate(() => ({ foco: document.activeElement.id, aberto: medicoDetails.open }));
    // condicao personalizada: remover item nao quebra a lista
    await page.evaluate(() => { localStorage.setItem('custom-condicoes', JSON.stringify({ 'Minha Condicao': { meds: [{ nome: 'Dipirona 500mg', qtde: '01 Caixa', via: 'Oral', fator: null, posologia: 'Tomar 1 cp.' }, { nome: 'Loratadina 10mg', qtde: '01 Caixa', via: 'Oral', fator: null, posologia: 'Tomar 1 cp.' }], orientacoes: ['Repouso.'] } })); });
    await page.reload(); await page.waitForTimeout(400);
    await selectCondicao(page, 'Minha Condicao');
    await page.evaluate(() => [...document.querySelectorAll('#listaContainer .card')].find((c) => /Minha Condicao/.test(c.textContent)).querySelector('.card-head').click());
    await page.waitForTimeout(200);
    await page.evaluate(() => { const c = [...document.querySelectorAll('#listaContainer .card')].find((x) => /Minha Condicao/.test(x.textContent)); const b = c.querySelector('.card-body .ef-remove'); if (b) b.click(); });
    await page.waitForTimeout(250);
    await page.fill('#search', ''); await page.waitForTimeout(250);
    const avulsosVisiveis = await page.evaluate(() => document.querySelectorAll('#listaContainer .card.med-avulso').length);
    const ok = garganta.includes('Faringite') && new Set(aposAzitro).size === 1 && /Azitromicina 500/.test(aposAzitro[0])
      && aposAtalho.nome === 'Paciente Atalho' && /POSOLOGIA PELO ATALHO/.test(aposAtalho.texto) && !aposAtalho.janela
      && limpo.nome === '' && limpo.itens === 0 && limpo.foco === 'nomePaciente' && desfeito.nome === 'Paciente Atalho' && desfeito.itens >= 1
      && /seu nome e CRM/i.test(pergunta) && preencher.foco === 'medicoNome' && preencher.aberto
      && avulsosVisiveis > 100 && consoleErrors.length === 0;
    record('revisao de plantao: busca por sintoma, Enter no remedio, Ctrl+Enter salva, Desfazer, checagem, condicao personalizada', ok,
      JSON.stringify({ garganta, aposAzitro, aposAtalho: { ...aposAtalho, texto: aposAtalho.texto.slice(0, 60) }, limpo, desfeito, pergunta: pergunta.slice(0, 120), preencher, avulsosVisiveis, consoleErrors }));
    await browser.close();
  }

  // ---- Avisos de seguranca: AINE na dengue ----
  {
    const browser = await chromium.launch();
    const { page, consoleErrors } = await newPage(browser);
    await page.goto(url);
    await page.waitForTimeout(300);
    const avisos = () => page.evaluate(() => avisoBar.innerText.replace(/\s+/g, ' '));
    const nomes = () => page.evaluate(() => [...document.querySelectorAll('#receitaPaper .nome-med')].map((e) => e.textContent.trim()));
    await page.fill('#idade', '35'); await page.fill('#peso', '65');
    await selectCondicao(page, 'Dengue');
    const dengueSo = await avisos();
    await page.fill('#search', 'Ibuprofeno 600'); await page.press('#search', 'Enter'); await page.waitForTimeout(250);
    await page.fill('#search', ''); await page.waitForTimeout(150);
    const dengueIbu = await avisos();
    await page.fill('#nomePaciente', 'Caso Dengue');
    await page.evaluate(() => { medicoDetails.open = true; window.__semConferir = false; });
    await page.fill('#medicoNome', 'Dr. Teste');
    await page.click('#btnImprimir'); await page.waitForTimeout(200);
    const pergunta = await page.evaluate(() => (document.querySelector('.pergunta-overlay') || {}).innerText || '');
    await page.click('.pergunta-overlay button.btn-primary'); await page.waitForTimeout(150);
    await page.click('#avisoBar button[data-acao="tirar-alergico"]'); await page.waitForTimeout(200);
    const depois = await nomes();
    const ok = !/contraindicado/.test(dengueSo) && /Dengue com anti-inflamat.*Ibuprofeno 600/.test(dengueIbu)
      && /Ibuprofeno 600.*contraindicado na dengue/.test(pergunta.replace(/\s+/g, ' '))
      && !depois.some((n) => /Ibuprofeno/.test(n)) && depois.some((n) => /Dipirona/.test(n))
      && consoleErrors.length === 0;
    record('avisos de seguranca: AINE na dengue (aviso, checagem antes de imprimir, tirar da receita)', ok,
      JSON.stringify({ dengueSo: dengueSo.slice(0, 120), dengueIbu: dengueIbu.slice(0, 200), pergunta: pergunta.slice(0, 200), depois, consoleErrors }));
    await browser.close();
  }

  // ---- Controle especial: cada folha montada vira exatamente 1 pagina no PDF ----
  {
    const browser = await chromium.launch();
    const { page } = await newPage(browser);
    await page.addInitScript(() => { window.__prints = []; window.open = () => ({ document: { write: (h) => window.__prints.push(h), close(){} }, focus(){}, print(){}, close(){} }); });
    await page.goto(url);
    await page.waitForTimeout(300);
    await page.evaluate(() => { const r = document.querySelector('input[name=tipoReceita][value="controle"]'); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); });
    const resultados = [];
    for (const conds of [['Dor Muscular'], ['Enxaqueca', 'Dor Muscular', 'GECA'], ['Dengue', 'ITU', 'Sinusite bomba', 'Vertigem', 'Gripe']]) {
      await page.click('#btnLimpar');
      for (const n of conds) await selectCondicao(page, n);
      await page.click('#btnImprimir');
      await page.waitForTimeout(500);
      const html = (await page.evaluate(() => window.__prints)).pop();
      const p2 = await browser.newPage();
      await p2.setContent(html, { waitUntil: 'load' });
      const folhas = await p2.evaluate(() => document.querySelectorAll('.vias-lado-a-lado').length);
      const pdf = await p2.pdf({ preferCSSPageSize: true });
      const paginas = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
      resultados.push({ conds: conds.length, folhas, paginas });
      await p2.close();
    }
    const ok = resultados.every((r) => r.folhas === r.paginas) && resultados[0].folhas === 1;
    record('controle especial: folhas montadas = paginas do PDF', ok, JSON.stringify(resultados));
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
