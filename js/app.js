(function(){
  // ---------- Estado ----------
  let customMeds = [];
  let selected = {};       // id -> {nome, qtde, posologia, via, fator, origemCondicao}
  let selectedOrient = {}; // id -> {texto, origemCondicao}
  let openCards = new Set();
  let overrides = {};   // edições/remoções por condição, persistidas localmente
  let editingRow = null; // chave da linha em edição no momento (só uma por vez)
  let usoCondicoes = {}; // contagem de uso por condição (mais usadas sobem)
  let historico = [];    // últimas receitas geradas
  let customCondicoes = {}; // nome -> { meds: [...], orientacoes: [...] }
  let conversaoPed = null; // {motivos, fixos} acumulados das conversões pediátricas desta receita
  let desfazerPediatria = null; // seleção anterior à última conversão (para "Desfazer")
  let autoPedSuspensa = false; // "Desfazer" pausa a conversão automática até a próxima receita
  let overridesMedicamentos = {}; // avulsoId -> {qtde, via, fator, posologia} (edição permanente de um item avulso)

  const el = id => document.getElementById(id);

  // ---------- Storage (persistência pessoal) ----------
  // Shim local sobre localStorage, mantendo a interface assíncrona get/set
  // já esperada pelo resto do código (era `window.storage`, nunca definido).
  const storage = {
    async get(key){
      try{ const v = localStorage.getItem(key); return v === null ? null : { value: v }; }
      catch(e){ return null; }
    },
    async set(key, value){
      localStorage.setItem(key, value);
      if(PONTE) PONTE.salvar(key, value);
    }
  };
  // Dentro do Quadro do Plantão (ver js/ponte.js): configurações pelo banco do
  // Quadro, impressão e downloads pelo Quadro, paciente vindo do cartão.
  const PONTE = window.PONTE && window.PONTE.embutido ? window.PONTE : null;
  function guardarPreferencia(key, valor){
    try{ localStorage.setItem(key, valor); }catch(_){ /* sem armazenamento */ }
    if(PONTE) PONTE.salvar(key, valor);
  }

  // Abre a impressão de um documento pronto. Fora do Quadro: janela nova, como sempre.
  function abrirImpressao(titulo, printStyles, paperHtml, paciente){
    const doc = '<html><head><title>' + escapeHtml(titulo) + '</title><meta charset="UTF-8">' +
      '<style>' + printStyles + '</style></head><body>' + paperHtml + '</body></html>';
    if(PONTE) return PONTE.imprimir(titulo, doc, paciente, showToast);   // promessa: true quando a impressão abriu ou o arquivo foi salvo
    const printWindow = window.open('', '_blank');
    if(!printWindow){
      showToast('Pop-up bloqueado — permita pop-ups ou abra o arquivo direto no navegador');
      return false;
    }
    printWindow.document.write(doc);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
    return true;
  }
  // Salva um arquivo gerado aqui. Dentro do Quadro, o download passa por ele.
  async function salvarArquivo(nome, blob){
    if(PONTE) return PONTE.baixar(nome, blob);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  }

  async function loadCustomMeds(){
    try{
      const r = await storage.get('meus-medicamentos', false);
      customMeds = r && r.value ? JSON.parse(r.value) : [];
    }catch(e){ customMeds = []; }
  }
  async function saveCustomMeds(){
    try{ await storage.set('meus-medicamentos', JSON.stringify(customMeds), false); }
    catch(e){ console.error('Falha ao salvar catálogo pessoal', e); }
  }

  async function loadCustomCondicoes(){
    try{
      const r = await storage.get('custom-condicoes', false);
      customCondicoes = r && r.value ? JSON.parse(r.value) : {};
    }catch(e){ customCondicoes = {}; }
  }
  async function saveCustomCondicoes(){
    try{ await storage.set('custom-condicoes', JSON.stringify(customCondicoes), false); }
    catch(e){ console.error('Falha ao salvar condições personalizadas', e); }
  }

  async function loadOverridesMedicamentos(){
    try{
      const r = await storage.get('overrides-medicamentos', false);
      overridesMedicamentos = r && r.value ? JSON.parse(r.value) : {};
    }catch(e){ overridesMedicamentos = {}; }
  }
  async function saveOverridesMedicamentos(){
    try{ await storage.set('overrides-medicamentos', JSON.stringify(overridesMedicamentos), false); }
    catch(e){ console.error('Falha ao salvar edições de medicamentos avulsos', e); }
  }

  function allMedicamentos(){
    return DATA.medicamentos.concat(customMeds);
  }

  function getOrdemCondicoes(){
    const baseOrdem = DATA.ordemCondicoes || [];
    const customNomes = Object.keys(customCondicoes).filter(nome => !baseOrdem.includes(nome));
    return baseOrdem.concat(customNomes);
  }

  // A condição "Constipaçao" (sem til) foi corrigida pra "Constipação" — quem
  // já tinha edições/uso salvos sob o nome antigo não pode perder isso.
  function migrarChaveConstipacao(obj){
    if(obj && Object.prototype.hasOwnProperty.call(obj, 'Constipaçao') && !Object.prototype.hasOwnProperty.call(obj, 'Constipação')){
      obj['Constipação'] = obj['Constipaçao'];
      delete obj['Constipaçao'];
    }
    return obj;
  }

  // Edições de condição são guardadas pelo índice do item (overrides[cond].meds[i]);
  // quando um item sai do catálogo, os índices seguintes mudam. Cada versão lista,
  // por condição, o novo índice de cada item antigo (null = item removido).
  const CATALOGO_VERSAO = 3;
  const REMAP_CATALOGO = {
    2: { 'Vertigem': { meds: [null, 0, 1] } },  // saiu o Meclin 25mg
    3: { 'TCE': { meds: [0, null] } }           // saiu o Meclin 25mg
  };
  function migrarIndicesCatalogo(obj, versao){
    for(let v = (versao || 1) + 1; v <= CATALOGO_VERSAO; v++){
      Object.entries(REMAP_CATALOGO[v] || {}).forEach(([cond, mapa]) => {
        const ov = obj && obj[cond];
        if(!ov) return;
        Object.keys(mapa).forEach(campo => {
          if(!ov[campo]) return;
          const novo = {};
          Object.keys(ov[campo]).forEach(i => {
            const j = mapa[campo][i];
            if(j !== null && j !== undefined) novo[j] = ov[campo][i];
          });
          ov[campo] = novo;
        });
      });
    }
    return obj;
  }

  async function loadOverrides(){
    try{
      const r = await storage.get('overrides-condicoes', false);
      overrides = r && r.value ? JSON.parse(r.value) : {};
      migrarChaveConstipacao(overrides);
      const rv = await storage.get('overrides-catalogo', false);
      const versao = rv && rv.value ? parseInt(rv.value, 10) : 1;
      if(versao < CATALOGO_VERSAO){
        migrarIndicesCatalogo(overrides, versao);
        await saveOverrides();
        await storage.set('overrides-catalogo', String(CATALOGO_VERSAO), false);
      }
    }catch(e){ overrides = {}; }
  }
  async function saveOverrides(){
    try{ await storage.set('overrides-condicoes', JSON.stringify(overrides), false); }
    catch(e){ console.error('Falha ao salvar edições', e); }
  }

  async function loadUso(){
    try{
      const r = await storage.get('uso-condicoes', false);
      usoCondicoes = r && r.value ? JSON.parse(r.value) : {};
      migrarChaveConstipacao(usoCondicoes);
    }catch(e){ usoCondicoes = {}; }
  }
  async function saveUso(){
    try{ await storage.set('uso-condicoes', JSON.stringify(usoCondicoes), false); }
    catch(e){ console.error('Falha ao salvar contagem de uso', e); }
  }

  async function loadHistorico(){
    try{
      const r = await storage.get('historico-receitas', false);
      historico = r && r.value ? JSON.parse(r.value) : [];
    }catch(e){ historico = []; }
  }
  async function saveHistorico(){
    try{ await storage.set('historico-receitas', JSON.stringify(historico), false); }
    catch(e){ console.error('Falha ao salvar histórico', e); }
  }

  // ---------- Helpers de texto ----------
  function norm(s){
    return (s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  }
  function escapeHtml(s){
    return (s===null||s===undefined?'':s).toString()
      .replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ---------- Vias de administração (lista única, usada em todo o app) ----------
  const VIA_OPTIONS = ['Oral','Intramuscular','Intravenoso','Subcutâneo','Tópico','Externo','Externo - Tópico','Inalatório','Oftálmico','Nasal','Vaginal','Retal','Injetável','Para Hidratação','Outro'];

  // Gera as <option> pra um <select> de via, sempre incluindo o valor já
  // selecionado mesmo que ele não esteja na lista canônica — preserva o dado
  // real em vez de deixar o navegador cair em branco ou na primeira opção.
  function renderViaOptions(selecionado){
    const opcoes = (selecionado && !VIA_OPTIONS.includes(selecionado)) ? [selecionado, ...VIA_OPTIONS] : VIA_OPTIONS;
    return opcoes.map(v => `<option ${v===selecionado?'selected':''}>${escapeHtml(v)}</option>`).join('');
  }
  el('novoVia').innerHTML = renderViaOptions(null);

  // ---------- Camada de edição por condição ----------
  function ensureOverrideCond(nome){
    if(!overrides[nome]) overrides[nome] = { meds:{}, orientacoes:{} };
    if(!overrides[nome].meds) overrides[nome].meds = {};
    if(!overrides[nome].orientacoes) overrides[nome].orientacoes = {};
    return overrides[nome];
  }
  function setOverrideMed(nome, idx, fields){
    const ov = ensureOverrideCond(nome);
    ov.meds[idx] = Object.assign({}, ov.meds[idx], fields);
    saveOverrides();
  }
  function clearOverrideMed(nome, idx){
    const ov = ensureOverrideCond(nome);
    delete ov.meds[idx];
    saveOverrides();
  }
  function setOverrideOrientacao(nome, idx, fields){
    const ov = ensureOverrideCond(nome);
    ov.orientacoes[idx] = Object.assign({}, ov.orientacoes[idx], fields);
    saveOverrides();
  }
  function clearOverrideOrientacao(nome, idx){
    const ov = ensureOverrideCond(nome);
    delete ov.orientacoes[idx];
    saveOverrides();
  }

  const nomeIgual = (o, m) => o.nome === undefined || o.nome === m.nome;
  const fatorIgual = (o, m) => o.fator === undefined || (o.fator ?? null) === (m.fator ?? null);
  // Retorna a versão "efetiva" de uma condição: base + edições - remoções
  function getCondEffective(nome){
    const base = customCondicoes[nome] || DATA.condicoes[nome] || { meds: [], orientacoes: [] };
    const ov = overrides[nome] || {};
    const meds = base.meds.map((m, i) => {
      const o = (ov.meds && ov.meds[i]) || {};
      if(o.removido) return null;
      return {
        idx: i,
        nome: o.nome !== undefined ? o.nome : m.nome,
        qtde: o.qtde !== undefined ? o.qtde : m.qtde,
        posologia: o.posologia !== undefined ? o.posologia : m.posologia,
        via: o.via !== undefined ? o.via : m.via,
        fator: o.fator !== undefined ? o.fator : m.fator,
        // teto e idade mínima valem para o item original; trocar o nome ou o fator os descarta
        // (salvar o mesmo nome/fator, só mudando a quantidade, não descarta)
        max: (nomeIgual(o, m) && fatorIgual(o, m)) ? m.max : undefined,
        faixas: (nomeIgual(o, m) && fatorIgual(o, m)) ? m.faixas : undefined,
        idadeMinMeses: nomeIgual(o, m) ? m.idadeMinMeses : undefined,
        pesoMinKg: nomeIgual(o, m) ? m.pesoMinKg : undefined,
        editado: o.nome!==undefined || o.qtde!==undefined || o.posologia!==undefined || o.via!==undefined || o.fator!==undefined
      };
    }).filter(Boolean);
    const orientacoes = base.orientacoes.map((texto, i) => {
      const o = (ov.orientacoes && ov.orientacoes[i]) || {};
      if(o.removido) return null;
      return { idx: i, texto: o.texto !== undefined ? o.texto : texto, editado: o.texto !== undefined };
    }).filter(Boolean);
    return { meds, orientacoes };
  }

  // Se um item editado já estiver selecionado, atualiza o snapshot selecionado também
  function refreshSelectedFromCondicao(nome){
    const eff = getCondEffective(nome);
    eff.meds.forEach(m => {
      const id = 'cond:'+nome+':med:'+m.idx;
      if(selected[id]){
        selected[id] = Object.assign({}, selected[id], {
          nome: m.nome, qtde: m.qtde, posologiaBase: m.posologia, via: m.via || 'Outro', fator: m.fator,
          max: m.max, faixas: m.faixas, idadeMinMeses: m.idadeMinMeses, pesoMinKg: m.pesoMinKg, origemCondicao: nome
        });
      }
    });
    eff.orientacoes.forEach(o => {
      const id = 'cond:'+nome+':or:'+o.idx;
      if(selectedOrient[id]) selectedOrient[id] = Object.assign({}, selectedOrient[id], { texto: o.texto, origemCondicao: nome });
    });
  }

  // Dose por peso do item (fator com teto, ou faixa de peso) — cálculo único em js/pediatria.js.
  // Peso fora das faixas sai como "____" para preencher à mão (com aviso).
  function calcDoseItem(it, peso){
    const posologia = it.posologiaBase;
    if(!posologia) return posologia;
    const d = window.PEDIATRIA.doseDoItem(it, peso);
    if(!d) return posologia;
    return posologia.replace(/DOSE/g, d.valor === null ? '____' : String(d.valor));
  }
  const itemPorPeso = it => window.PEDIATRIA.itemPorPeso(it);

  function anySelectedNeedsPeso(){
    return Object.values(selected).some(itemPorPeso);
  }

  // Converte o texto digitado em "Fator dose/kg" pra número, ou null se vazio
  // ou não numérico — sem o guard de NaN aqui, um texto inválido ficava preso
  // pedindo peso pra sempre (anySelectedNeedsPeso trata NaN como "precisa").
  function parseFator(texto){
    const t = (texto || '').trim();
    if(!t) return null;
    const n = parseFloat(t.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  // ---------- Renderização da lista (esquerda) ----------
  // A lista é refeita inteira a cada mudança (marcar outro item, peso, busca);
  // sem isto, o formulário de edição aberto voltava aos valores salvos e o que
  // estava digitado se perdia. O rascunho vale até Salvar ou Cancelar.
  let rascunhoEdicao = null;
  let linhaEditadaNoDom = null;   // linha cujo formulário está na tela agora
  const campoEdicao = c => [...c.classList].find(k => k.startsWith('ef-'));
  function capturarRascunhoEdicao(cont){
    if(!editingRow || (rascunhoEdicao && rascunhoEdicao.row !== editingRow)) rascunhoEdicao = null;
    if(!editingRow) return;
    const form = cont.querySelector('.edit-form');
    // linha fora do filtro, ou a edição acabou de passar para outra linha: não captura
    if(!form || linhaEditadaNoDom !== editingRow) return;
    const campos = {};
    form.querySelectorAll('input, textarea, select').forEach(c => { const k = campoEdicao(c); if(k) campos[k] = c.value; });
    const ativo = document.activeElement;
    const foco = ativo && form.contains(ativo) ? { k: campoEdicao(ativo), ini: ativo.selectionStart, fim: ativo.selectionEnd } : null;
    rascunhoEdicao = { row: editingRow, campos, foco };
  }
  function restaurarRascunhoEdicao(cont){
    if(!editingRow || !rascunhoEdicao || rascunhoEdicao.row !== editingRow) return;
    const form = cont.querySelector('.edit-form');
    if(!form) return;
    Object.entries(rascunhoEdicao.campos).forEach(([k, v]) => { const c = form.querySelector('.' + k); if(c) c.value = v; });
    const f = rascunhoEdicao.foco;
    const c = f && f.k && form.querySelector('.' + f.k);
    if(c){ c.focus(); try{ if(f.ini !== null && f.ini !== undefined) c.setSelectionRange(f.ini, f.fim); }catch(_){ /* select não tem seleção */ } }
  }

  function renderLista(filtro){
    const cont = el('listaContainer');
    capturarRascunhoEdicao(cont);
    renderListaConteudo(filtro);
    linhaEditadaNoDom = cont.querySelector('.edit-form') ? editingRow : null;
    restaurarRascunhoEdicao(cont);
  }

  // ---------- Busca ----------
  // Todas as palavras do termo precisam aparecer (sem acento; "500 mg" = "500mg"), quem
  // começa com o termo vem antes, e sintomas ("garganta", "febre") trazem as condições
  // que a queixa sugere. A ordem por uso é a do início do atendimento: não pula
  // enquanto se clica (recalcula em "Nova receita").
  const compacto = s => norm(s).replace(/(\d)\s+(mg|ml|g|mcg|ui|%)(?![a-z])/g, '$1$2');
  const tokensBusca = f => compacto(f).split(/\s+/).filter(Boolean);
  let usoNaAbertura = null;
  const usoOrdem = nome => (usoNaAbertura || usoCondicoes)[nome] || 0;
  function pontuaTexto(texto, toks){
    const t = compacto(texto);
    if(!toks.every(k => t.includes(k))) return 0;
    return toks.every(k => new RegExp('(^|[^a-z0-9])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(t)) ? 2 : 1;
  }
  // adulto: condição montada para criança vai para o fim; criança: vem antes
  function ajusteIdade(nome){
    if(!condicaoPorPeso(nome)) return 0;
    const meses = idadeAtualMeses(), kg = pesoAtualKg();
    if(meses === null && kg === null) return 0;
    return pacientePediatrico() ? 0.5 : -3;
  }
  function buscarCondicoes(filtro){
    const toks = tokensBusca(filtro);
    const todas = getOrdemCondicoes();
    if(!toks.length) return todas.slice().sort((a, b) => usoOrdem(b) - usoOrdem(a));
    const sinon = window.PONTE ? window.PONTE.sugerirCondicoes(filtro, n => todas.includes(n), null) : [];
    const pont = {};
    todas.forEach(nome => {
      const pn = pontuaTexto(nome, toks);
      let p = pn ? 3 + pn : sinon.includes(nome) ? 3 : getCondEffective(nome).meds.some(m => pontuaTexto(m.nome, toks)) ? 1 : 0;
      if(p) pont[nome] = p + ajusteIdade(nome);
    });
    return Object.keys(pont).sort((a, b) => pont[b] - pont[a] || usoOrdem(b) - usoOrdem(a));
  }
  function pontoCondicao(nome, filtro){
    const toks = tokensBusca(filtro);
    const pn = pontuaTexto(nome, toks);
    if(pn) return 3 + pn;
    const sinon = window.PONTE ? window.PONTE.sugerirCondicoes(filtro, n => n === nome, null) : [];
    return sinon.length ? 3 : 1;
  }
  function buscarAvulsos(filtro){
    const toks = tokensBusca(filtro);
    const todos = allMedicamentos();
    if(!toks.length) return todos;
    // fora da pediatria, a apresentação de adulto vem antes da suspensão por kg
    const crianca = pacientePediatrico();
    return todos.map(m => [m, pontuaTexto([m.nome, m.concentracao, m.forma].filter(Boolean).join(' '), toks)])
      .filter(x => x[1]).map(x => [x[0], x[1] + (x[0].fator != null || x[0].faixas ? (crianca ? 0.5 : -0.5) : 0)])
      .sort((a, b) => b[1] - a[1]).map(x => x[0]);
  }

  function renderListaConteudo(filtro){
    const cont = el('listaContainer');
    cont.innerHTML = '';

    const condMatches = buscarCondicoes(filtro);
    const medsMatches = buscarAvulsos(filtro);

    if(condMatches.length === 0 && medsMatches.length === 0){
      const wrap = document.createElement('div');
      wrap.className = 'empty-search';
      wrap.innerHTML = 'Nada encontrado para "' + escapeHtml(filtro||'') + '"<br>';
      const btn = document.createElement('button');
      btn.className = 'restore-btn';
      btn.style.marginTop = '8px';
      btn.textContent = 'Cadastrar "' + (filtro||'') + '" como novo medicamento';
      btn.addEventListener('click', () => {
        const details = el('novoNome').closest('details');
        details.open = true;
        el('novoNome').value = filtro || '';
        el('novoNome').scrollIntoView({ behavior:'smooth', block:'center' });
        el('novoQtde').focus();
      });
      wrap.appendChild(btn);
      cont.appendChild(wrap);
      return;
    }

    if(condMatches.length){
      const lbl = document.createElement('div');
      lbl.className = 'group-label';
      lbl.textContent = 'Condições (' + condMatches.length + ')';
      cont.appendChild(lbl);
      condMatches.forEach(nome => cont.appendChild(renderCondicaoCard(nome)));
    }

    if(medsMatches.length){
      const lbl = document.createElement('div');
      lbl.className = 'group-label';
      lbl.textContent = 'Medicamentos avulsos (' + medsMatches.length + ')';
      cont.appendChild(lbl);
      medsMatches.forEach((m, idx) => cont.appendChild(renderMedAvulsoCard(m)));
    }
  }

  function condicaoSelectionState(nome){
    const eff = getCondEffective(nome);
    const totalItens = eff.meds.length + eff.orientacoes.length;
    if(totalItens === 0) return 'none';
    let count = 0;
    eff.meds.forEach(m => { if(selected['cond:'+nome+':med:'+m.idx]) count++; });
    eff.orientacoes.forEach(o => { if(selectedOrient['cond:'+nome+':or:'+o.idx]) count++; });
    if(count === 0) return 'none';
    if(count === totalItens) return 'all';
    return 'partial';
  }

  function renderCondicaoCard(nome){
    const eff = getCondEffective(nome);
    const card = document.createElement('div');
    card.className = 'card';
    if(openCards.has('c:'+nome)) card.classList.add('open');

    const state = condicaoSelectionState(nome);

    const head = document.createElement('div');
    head.className = 'card-head';
    head.innerHTML = `
      <input type="checkbox" ${state==='all' ? 'checked' : ''} data-role="cond-check" aria-label="Adicionar todos os itens de ${escapeHtml(nome)}">
      <span class="nome">${escapeHtml(nome)}</span>
      ${condicaoPorPeso(nome) ? '<span class="selo-crianca" title="Montada para criança: doses por kg (pede o peso)">criança · dose/kg</span>' : ''}
      <span class="count">${eff.meds.length} ${eff.meds.length!==1?'itens':'item'}</span>
      <span class="chev" aria-hidden="true">&#9656;</span>
    `;
    const chk = head.querySelector('input');
    if(state === 'partial') chk.indeterminate = true;

    chk.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCondicaoInteira(nome, !(state==='all'));
    });
    head.addEventListener('click', () => {
      if(openCards.has('c:'+nome)) openCards.delete('c:'+nome); else openCards.add('c:'+nome);
      renderLista(el('search').value);
    });

    const body = document.createElement('div');
    body.className = 'card-body';

    eff.meds.forEach(m => body.appendChild(buildMedRow(nome, m)));
    eff.orientacoes.forEach(o => body.appendChild(buildOrientRow(nome, o)));

    const hiddenMeds = renderHiddenSection(nome, 'meds');
    if(hiddenMeds) body.appendChild(hiddenMeds);
    const hiddenOrient = renderHiddenSection(nome, 'orientacoes');
    if(hiddenOrient) body.appendChild(hiddenOrient);

    card.appendChild(head);
    card.appendChild(body);
    return card;
  }

  // Linha de um medicamento dentro de uma condição — normal ou em modo edição
  function buildMedRow(nome, m){
    const id = 'cond:'+nome+':med:'+m.idx;
    const key = nome+':med:'+m.idx;
    const wrap = document.createElement('div');
    wrap.className = 'sub-row';

    if(editingRow === key){
      wrap.classList.add('editing');
      wrap.innerHTML = `
        <div class="edit-form">
          <input type="text" class="ef-nome" value="${escapeHtml(m.nome)}" placeholder="Nome do medicamento">
          <div class="edit-grid">
            <input type="text" class="ef-qtde" value="${escapeHtml(m.qtde)}" placeholder="Quantidade">
            <select class="ef-via">${renderViaOptions(m.via)}</select>
            <input type="text" class="ef-fator" value="${m.fator!==null && m.fator!==undefined ? escapeHtml(m.fator) : ''}" placeholder="Fator/kg (opcional)">
          </div>
          <textarea class="ef-pos" placeholder="Posologia (use DOSE onde entra o valor calculado pelo peso)">${escapeHtml(m.posologia)}</textarea>
          <div class="edit-actions">
            <button class="ef-save">Salvar</button>
            <button class="ef-cancel">Cancelar</button>
            <button class="ef-restore">Restaurar original</button>
          </div>
        </div>
      `;
      wrap.querySelector('.ef-save').addEventListener('click', (e) => {
        e.stopPropagation();
        const novo = {
          nome: wrap.querySelector('.ef-nome').value.trim(),
          qtde: wrap.querySelector('.ef-qtde').value.trim(),
          via: wrap.querySelector('.ef-via').value,
          fator: parseFator(wrap.querySelector('.ef-fator').value.trim()),
          posologia: wrap.querySelector('.ef-pos').value.trim()
        };
        setOverrideMed(nome, m.idx, novo);
        refreshSelectedFromCondicao(nome);
        editingRow = null;
        renderTudo();
        showToast('Edição salva');
      });
      wrap.querySelector('.ef-cancel').addEventListener('click', (e) => { e.stopPropagation(); editingRow = null; renderLista(el('search').value); });
      wrap.querySelector('.ef-restore').addEventListener('click', (e) => {
        e.stopPropagation();
        clearOverrideMed(nome, m.idx);
        refreshSelectedFromCondicao(nome);
        editingRow = null;
        renderTudo();
        showToast('Restaurado ao original');
      });
      return wrap;
    }

    wrap.innerHTML = `
      <input type="checkbox" ${selected[id] ? 'checked':''} aria-label="${escapeHtml(m.nome)}">
      <div class="sub-text"><b>${escapeHtml(m.nome)}</b> — ${escapeHtml(m.qtde||'')}${m.fator ? ' <span class="tag-peso">(dose por peso)</span>' : ''}${m.editado ? ' <span class="tag-editado">editado</span>' : ''}
      <span class="pos">${escapeHtml(m.posologia||'')}</span></div>
      <div class="row-actions">
        <button class="icon-btn ef-edit" title="Editar" aria-label="Editar ${escapeHtml(m.nome)}">&#9998;</button>
        <button class="icon-btn ef-remove" title="Remover desta condição" aria-label="Remover ${escapeHtml(m.nome)} desta condição">&times;</button>
      </div>
    `;
    wrap.querySelector('input[type=checkbox]').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMedDeCondicao(nome, m.idx, e.target.checked);
    });
    wrap.querySelector('.ef-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      editingRow = key;
      renderLista(el('search').value);
    });
    wrap.querySelector('.ef-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      setOverrideMed(nome, m.idx, { removido: true });
      delete selected[id];
      renderTudo();
      showToast('Removido — dá pra restaurar nos itens ocultos');
    });
    return wrap;
  }

  // Linha de uma orientação dentro de uma condição — normal ou em modo edição
  function buildOrientRow(nome, o){
    const id = 'cond:'+nome+':or:'+o.idx;
    const key = nome+':or:'+o.idx;
    const wrap = document.createElement('div');
    wrap.className = 'sub-row orientacao';

    if(editingRow === key){
      wrap.classList.add('editing');
      wrap.innerHTML = `
        <div class="edit-form">
          <textarea class="ef-or-texto" placeholder="Texto da orientação">${escapeHtml(o.texto)}</textarea>
          <div class="edit-actions">
            <button class="ef-save">Salvar</button>
            <button class="ef-cancel">Cancelar</button>
            <button class="ef-restore">Restaurar original</button>
          </div>
        </div>
      `;
      wrap.querySelector('.ef-save').addEventListener('click', (e) => {
        e.stopPropagation();
        setOverrideOrientacao(nome, o.idx, { texto: wrap.querySelector('.ef-or-texto').value.trim() });
        refreshSelectedFromCondicao(nome);
        editingRow = null;
        renderTudo();
        showToast('Edição salva');
      });
      wrap.querySelector('.ef-cancel').addEventListener('click', (e) => { e.stopPropagation(); editingRow = null; renderLista(el('search').value); });
      wrap.querySelector('.ef-restore').addEventListener('click', (e) => {
        e.stopPropagation();
        clearOverrideOrientacao(nome, o.idx);
        refreshSelectedFromCondicao(nome);
        editingRow = null;
        renderTudo();
        showToast('Restaurado ao original');
      });
      return wrap;
    }

    wrap.innerHTML = `
      <input type="checkbox" ${selectedOrient[id] ? 'checked':''} aria-label="Orientação">
      <div class="sub-text">${escapeHtml(o.texto)}${o.editado ? ' <span class="tag-editado">editado</span>' : ''}</div>
      <div class="row-actions">
        <button class="icon-btn ef-edit" title="Editar" aria-label="Editar orientação">&#9998;</button>
        <button class="icon-btn ef-remove" title="Remover" aria-label="Remover orientação">&times;</button>
      </div>
    `;
    wrap.querySelector('input[type=checkbox]').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleOrientacao(nome, o.idx, e.target.checked);
    });
    wrap.querySelector('.ef-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      editingRow = key;
      renderLista(el('search').value);
    });
    wrap.querySelector('.ef-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      setOverrideOrientacao(nome, o.idx, { removido: true });
      delete selectedOrient[id];
      renderTudo();
      showToast('Removido — dá pra restaurar nos itens ocultos');
    });
    return wrap;
  }

  // Lista compacta de itens ocultos (removidos) de uma condição, com opção de restaurar
  function renderHiddenSection(nome, tipo){
    const ov = overrides[nome];
    if(!ov) return null;
    const map = tipo === 'meds' ? ov.meds : ov.orientacoes;
    if(!map) return null;
    // a base é a mesma que a lista mostra (condição personalizada ou de fábrica)
    const cond = customCondicoes[nome] || DATA.condicoes[nome] || { meds: [], orientacoes: [] };
    const base = (tipo === 'meds' ? cond.meds : cond.orientacoes) || [];
    const hiddenIdxs = Object.keys(map).filter(i => map[i] && map[i].removido && base[i] !== undefined);
    if(!hiddenIdxs.length) return null;

    const box = document.createElement('div');
    box.className = 'hidden-box';
    const title = document.createElement('div');
    title.className = 'hidden-title';
    title.textContent = hiddenIdxs.length + ' item' + (hiddenIdxs.length!==1?'s':'') + ' oculto' + (hiddenIdxs.length!==1?'s':'');
    box.appendChild(title);

    hiddenIdxs.forEach(i => {
      const nomeOriginal = tipo === 'meds' ? base[i].nome : (base[i].length>50 ? base[i].slice(0,50)+'…' : base[i]);
      const row = document.createElement('div');
      row.className = 'hidden-row';
      row.innerHTML = `<span>${escapeHtml(nomeOriginal)}</span>`;
      const btn = document.createElement('button');
      btn.className = 'restore-btn';
      btn.textContent = 'restaurar';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if(tipo === 'meds') clearOverrideMed(nome, i); else clearOverrideOrientacao(nome, i);
        renderTudo();
      });
      row.appendChild(btn);
      box.appendChild(row);
    });
    return box;
  }

  // Chave estável pra um medicamento avulso — usa a posição do item dentro de
  // allMedicamentos() (concatenação fixa de DATA.medicamentos + customMeds),
  // não o nome sozinho. Vários medicamentos no catálogo compartilham nome com
  // apresentações diferentes (ex. Aciclovir oral e tópico); usar só o nome
  // como chave fazia uma seleção sobrescrever/apagar a outra.
  function avulsoId(m){
    return 'avulso:idx:' + allMedicamentos().indexOf(m);
  }

  // Aplica a edição permanente (se existir) sobre um medicamento avulso do
  // catálogo — usado tanto pra exibir o card quanto ao selecionar o item pra
  // receita, pra não precisar preencher o mesmo modo de uso toda vez.
  function getMedicamentoEfetivo(m){
    const ov = overridesMedicamentos[avulsoId(m)];
    return ov ? Object.assign({}, m, ov) : m;
  }
  function setOverrideMedicamento(id, fields){
    overridesMedicamentos[id] = Object.assign({}, overridesMedicamentos[id], fields);
    saveOverridesMedicamentos();
  }
  function clearOverrideMedicamento(id){
    delete overridesMedicamentos[id];
    saveOverridesMedicamentos();
  }

  function renderMedAvulsoCard(m){
    const id = avulsoId(m);
    const card = document.createElement('div');
    card.className = 'card med-avulso';
    const displayNome = [m.nome, m.concentracao].filter(Boolean).join(' ');

    if(editingRow === id){
      card.classList.add('editing-avulso');
      const efetivo = getMedicamentoEfetivo(m);
      const box = document.createElement('div');
      box.className = 'edit-form';
      box.innerHTML = `
        <div class="avulso-edit-titulo">${escapeHtml(displayNome)}</div>
        <div class="edit-grid">
          <input type="text" class="ef-qtde" value="${escapeHtml(efetivo.qtde||'')}" placeholder="Quantidade">
          <select class="ef-via">${renderViaOptions(efetivo.via)}</select>
          <input type="text" class="ef-fator" value="${efetivo.fator!==null && efetivo.fator!==undefined ? escapeHtml(efetivo.fator) : ''}" placeholder="Fator/kg (opcional)">
        </div>
        <textarea class="ef-pos" placeholder="Posologia (use DOSE onde entra o valor calculado pelo peso)">${escapeHtml(efetivo.posologia||'')}</textarea>
        <div class="edit-actions">
          <button class="ef-save">Salvar</button>
          <button class="ef-cancel">Cancelar</button>
          <button class="ef-restore">Restaurar original</button>
        </div>
      `;
      box.querySelector('.ef-save').addEventListener('click', (e) => {
        e.stopPropagation();
        setOverrideMedicamento(id, {
          qtde: box.querySelector('.ef-qtde').value.trim(),
          via: box.querySelector('.ef-via').value,
          fator: parseFator(box.querySelector('.ef-fator').value.trim()),
          posologia: box.querySelector('.ef-pos').value.trim()
        });
        editingRow = null;
        renderTudo();
        showToast('Medicamento atualizado permanentemente no catálogo');
      });
      box.querySelector('.ef-cancel').addEventListener('click', (e) => { e.stopPropagation(); editingRow = null; renderLista(el('search').value); });
      box.querySelector('.ef-restore').addEventListener('click', (e) => {
        e.stopPropagation();
        clearOverrideMedicamento(id);
        editingRow = null;
        renderTudo();
        showToast('Restaurado ao original');
      });
      card.appendChild(box);
      return card;
    }

    const efetivo = getMedicamentoEfetivo(m);
    const editado = !!overridesMedicamentos[id];
    const isSel = !!selected[id];
    const head = document.createElement('div');
    head.className = 'card-head';
    head.innerHTML = `
      <input type="checkbox" ${isSel ? 'checked':''} aria-label="${escapeHtml(displayNome)}">
      <div class="avulso-texto">
        <span class="nome">${escapeHtml(displayNome)}</span>
        <span class="meta">${escapeHtml(efetivo.via||'')}${editado ? ' <span class="tag-editado">editado</span>' : ''}</span>
        ${efetivo.posologia ? `<div class="pos">${escapeHtml(efetivo.qtde ? efetivo.qtde + ' — ' : '')}${escapeHtml(efetivo.posologia)}</div>` : ''}
      </div>
      <button type="button" class="icon-btn avulso-edit" title="Editar permanentemente no catálogo" aria-label="Editar ${escapeHtml(displayNome)} no catálogo">&#9998;</button>
    `;
    head.querySelector('input').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMedAvulso(m, e.target.checked);
    });
    head.querySelector('.avulso-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      editingRow = id;
      renderLista(el('search').value);
    });
    card.appendChild(head);
    return card;
  }

  // ---------- Ações de seleção ----------
  function toggleCondicaoInteira(nome, ligar){
    const eff = getCondEffective(nome);
    eff.meds.forEach(m => toggleMedDeCondicao(nome, m.idx, ligar, true));
    eff.orientacoes.forEach(o => toggleOrientacao(nome, o.idx, ligar, true));
    if(ligar){
      usoCondicoes[nome] = (usoCondicoes[nome] || 0) + 1;
      saveUso();
    }
    renderTudo();
  }

  function toggleMedDeCondicao(nomeCondicao, i, ligar, skipRender){
    const eff = getCondEffective(nomeCondicao);
    const m = eff.meds.find(x => x.idx === i);
    if(!m) return;
    const id = 'cond:'+nomeCondicao+':med:'+i;
    if(ligar){
      selected[id] = {
        nome: m.nome, qtde: m.qtde, posologiaBase: m.posologia,
        via: m.via || 'Outro', fator: m.fator, max: m.max, faixas: m.faixas, idadeMinMeses: m.idadeMinMeses, pesoMinKg: m.pesoMinKg, origemCondicao: nomeCondicao
      };
    } else {
      delete selected[id];
    }
    if(!skipRender) renderTudo();
  }

  function toggleOrientacao(nomeCondicao, i, ligar, skipRender){
    const eff = getCondEffective(nomeCondicao);
    const o = eff.orientacoes.find(x => x.idx === i);
    if(!o) return;
    const id = 'cond:'+nomeCondicao+':or:'+i;
    if(ligar){ selectedOrient[id] = { texto: o.texto, origemCondicao: nomeCondicao }; }
    else { delete selectedOrient[id]; }
    if(!skipRender) renderTudo();
  }

  function toggleMedAvulso(m, ligar){
    const id = avulsoId(m);
    if(ligar){
      const efetivo = getMedicamentoEfetivo(m);
      const displayNome = [m.nome, m.concentracao].filter(Boolean).join(' ');
      selected[id] = {
        nome: displayNome, qtde: efetivo.qtde, posologiaBase: efetivo.posologia,
        via: efetivo.via || 'Outro', fator: efetivo.fator !== undefined ? efetivo.fator : null,
        max: ((efetivo.fator ?? null) === (m.fator ?? null)) ? m.max : undefined, faixas: ((efetivo.fator ?? null) === (m.fator ?? null)) ? m.faixas : undefined,
        idadeMinMeses: m.idadeMinMeses, pesoMinKg: m.pesoMinKg, origemCondicao: null
      };
    } else {
      delete selected[id];
    }
    renderTudo();
  }

  // ---------- Receita (painel direito) ----------
  function logosHtml(){
    const muni = municipioDoLocal(localAtual());
    if(muni && muni.nomeNoCabecalho){
      const brasao = muni.brasao();
      return `
        <div class="receita-logos">
          <div class="logo-muni">
            ${brasao ? `<img src="data:image/png;base64,${brasao}" class="logo-muni-brasao" alt="Brasão de ${escapeHtml(muni.nome)}">` : ''}
            <div class="logo-muni-texto">Prefeitura Municipal de <b>${escapeHtml(muni.nome)}</b></div>
          </div>
          <img src="data:image/png;base64,${LOGO_SUS_B64}" class="logo-sus" alt="SUS">
        </div>
      `;
    }
    if(localAtual() === 'patos'){
      return `
        <div class="receita-logos">
          <img src="data:image/png;base64,${LOGO_PATOS_ICON_B64}" class="logo-carmo" alt="Prefeitura de Patos de Minas">
          <img src="data:image/png;base64,${LOGO_SUS_B64}" class="logo-sus" alt="SUS">
        </div>
      `;
    }
    return `
      <div class="receita-logos">
        <img src="data:image/png;base64,${LOGO_COMUM_B64}" class="logo-carmo" alt="Prefeitura de Carmo do Paranaíba">
        <img src="data:image/png;base64,${LOGO_SUS_B64}" class="logo-sus" alt="SUS">
      </div>
    `;
  }

  function tipoReceitaAtual(){
    const r = document.querySelector('input[name=tipoReceita]:checked');
    return r ? r.value : 'comum';
  }

  function localAtual(){
    const r = document.querySelector('input[name=localReceita]:checked');
    return r ? r.value : 'carmo';
  }

  // Municípios no modelo "brasão + nome da prefeitura + SUS". Carmo do
  // Paranaíba usa o logotipo próprio (LOGO_COMUM_B64) e segue nas funções
  // originais (viaBoxHtml, blocoViaDocx...).
  const MUNICIPIOS = {
    patos: {
      nome: 'Patos de Minas',
      prefeitura: 'Prefeitura de Patos de Minas',
      prefeituraDocx: 'PREFEITURA DE PATOS DE MINAS',
      brasao: () => LOGO_PATOS_ICON_B64,
      nomeNoCabecalho: false, // receita comum: só brasão + SUS
      unidadePadrao: 'Secretaria Municipal de Saúde',
      fornecedor: [
        'Prefeitura de Patos de Minas — Secretaria Municipal de Saúde',
        'Rua Dr. José Olympio de Melo, 151 — Bairro Eldorado — CEP 38.700-900'
      ]
    },
    rio: {
      nome: 'Rio Paranaíba',
      prefeitura: 'Prefeitura Municipal de Rio Paranaíba',
      prefeituraDocx: 'PREFEITURA MUNICIPAL DE RIO PARANAÍBA',
      // Brasão em js/logos.js (LOGO_RIO_ICON_B64). Sem ele, o cabeçalho sai só com o nome.
      brasao: () => (typeof LOGO_RIO_ICON_B64 === 'string' && LOGO_RIO_ICON_B64) || null,
      nomeNoCabecalho: true,
      // Endereço da Secretaria (mesmo prédio da Prefeitura), conforme o site oficial e o CNES.
      // O campo "Unidade de Saúde" substitui este padrão quando preenchido.
      unidadePadrao: 'Secretaria Municipal de Saúde — Rua Capitão Franklin de Castro, 1065 — CEP 38810-000',
      fornecedor: [] // em branco: a farmácia que dispensa preenche
    }
  };
  function municipioDoLocal(local){
    return Object.prototype.hasOwnProperty.call(MUNICIPIOS, local) ? MUNICIPIOS[local] : null;
  }

  // Largura x altura de um PNG em base64 (lidas do cabeçalho IHDR), para
  // manter a proporção do brasão no .docx.
  function dimensoesPng(b64){
    const bin = atob(b64.slice(0, 44));
    const u32 = i => ((bin.charCodeAt(i) << 24) | (bin.charCodeAt(i+1) << 16) | (bin.charCodeAt(i+2) << 8) | bin.charCodeAt(i+3)) >>> 0;
    return { w: u32(16), h: u32(20) };
  }

  // Monta o HTML dos medicamentos + orientações (compartilhado pelos dois layouts)
  // Recebe entries [id, item] para permitir remoção direta pelo papel
  function corpoReceitaHtml(medEntries, orientEntries, peso){
    const viaOrder = [];
    const grupos = {};
    medEntries.forEach(([id, it]) => {
      const via = it.via || 'Outro';
      if(!grupos[via]){ grupos[via] = []; viaOrder.push(via); }
      grupos[via].push([id, it]);
    });

    let html = '';
    viaOrder.forEach(via => {
      html += `<div class="via-titulo">Uso ${escapeHtml(via)}</div>`;
      grupos[via].forEach(([id, it], idx) => {
        const posologia = calcDoseItem(it, peso);
        const precisaPeso = itemPorPeso(it) && !peso;
        const posVazia = !posologia && !precisaPeso;
        html += `
          <div class="item-linha">
            <span class="num mono">${String(idx+1).padStart(2,'0')}.</span>
            <span class="nome-med">${escapeHtml(it.nome)}</span>
            ${tipoReceitaAtual() === 'auto' ? (() => { const d = precisaDuasVias(it); return `<button class="vias-item${d ? ' em-duas' : ''}" data-sel="${escapeHtml(id)}" title="${d ? 'Vai no receituário de 2 vias — clique para passar para a receita comum' : 'Vai na receita comum — clique para passar para as 2 vias'}">${d ? '2 vias' : 'comum'}</button>`; })() : ''}
            <span class="dots"></span>
            <span class="qtde">${escapeHtml(it.qtde||'')}</span>
            <button class="edit-item-btn" data-sel="${escapeHtml(id)}" title="Editar item" aria-label="Editar ${escapeHtml(it.nome)}">&#x270E;</button>
            <button class="rm-item" data-sel="${escapeHtml(id)}" title="Remover da receita" aria-label="Remover ${escapeHtml(it.nome)} da receita">&times;</button>
          </div>
          <div class="item-pos">${precisaPeso ? '<span class="falta-peso">Informe o peso para calcular a dose &rarr;</span> ' : ''}${posVazia ? '<span class="pos-vazia">sem posologia cadastrada — edite o item na lista ao lado</span>' : escapeHtml(posologia||'')}</div>
        `;
      });
    });

    if(orientEntries.length){
      html += `<div class="orientacoes-bloco"><div class="via-titulo">Orientações</div><ul>`;
      orientEntries.forEach(([id, o]) => {
        html += `<li${o.espacoAntes ? ' class="espaco-antes"' : ''}>${escapeHtml(o.texto)} <button class="par-item" data-orient="${escapeHtml(id)}" aria-pressed="${o.espacoAntes ? 'true' : 'false'}" title="${o.espacoAntes ? 'Tirar o espaço antes desta orientação' : 'Dar um espaço (novo parágrafo) antes desta orientação'}">&para;</button><button class="edit-item-btn" data-orient="${escapeHtml(id)}" title="Editar item">&#x270E;</button><button class="rm-item" data-orient="${escapeHtml(id)}" title="Remover da receita">&times;</button></li>`;
      });
      html += `</ul></div>`;
    }
    return html;
  }

  // Retrato dos campos de uma janela, para saber se algo foi alterado antes de fechar
  function valoresDoFormulario(raiz){
    return JSON.stringify([...raiz.querySelectorAll('input, textarea, select')].map(c => (c.type === 'checkbox' || c.type === 'radio') ? c.checked : c.value));
  }

  // ---------- Encaminhamento ----------
  // Rascunho: fechar a janela não descarta o que foi escrito. Reabrir para o
  // mesmo paciente mostra tudo como estava; outro paciente ou "Nova receita"
  // recomeça. Depois de editar o texto à mão, mudar os campos não o sobrescreve
  // (o botão "Recomeçar texto" gera de novo a partir dos campos).
  let encRascunhoPaciente = null;
  let encTextoEditado = false;
  function condicoesNaReceita(){
    const nomes = Object.values(selected).map(it => it.origemCondicao).filter(Boolean);
    return [...new Set(nomes)];
  }

  function medicamentosNaReceitaTexto(){
    const nomes = Object.values(selected).map(it => it.nome).filter(Boolean);
    if(!nomes.length) return '(nenhum medicamento selecionado na receita)';
    return nomes.join(', ');
  }

  function condicaoEscolhidaEncaminhamento(){
    const sel = el('encCondicao').value;
    if(sel === '__outra__') return el('encCondicaoOutra').value.trim();
    return sel;
  }

  function montarTextoEncaminhamento(){
    const nomePaciente = el('encNomePaciente').value.trim() || '(nome do paciente)';
    const condicao = condicaoEscolhidaEncaminhamento() || '(diagnóstico)';
    const dataStr = new Date().toLocaleDateString('pt-BR');
    const medicamentos = medicamentosNaReceitaTexto();
    const medicoNome = (el('medicoNome') && el('medicoNome').value.trim()) || '(nome do médico)';
    const medicoCrm = (el('medicoCrm') && el('medicoCrm').value.trim()) || '';
    const assinatura = [medicoNome, medicoCrm].filter(Boolean).join(' — ');

    return `Encaminho ${nomePaciente} à atenção básica, pois esteve nesta unidade no dia ${dataStr} apresentando sinais e sintomas compatíveis com ${condicao}, tendo sido prescrito ${medicamentos}, e necessita de acompanhamento ao curso de sua doença e na convalescença, além de manejo de suas condições de base.

Agradeço,


_________________________________
${assinatura}
${dataStr}`;
  }

  function popularEncaminhamentoCondicoes(){
    const select = el('encCondicao');
    select.innerHTML = '';
    const condicoes = condicoesNaReceita();
    condicoes.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      select.appendChild(opt);
    });
    const optOutra = document.createElement('option');
    optOutra.value = '__outra__';
    optOutra.textContent = 'Outro (descrever)';
    select.appendChild(optOutra);
    if(!condicoes.length) select.value = '__outra__';
    el('encCondicaoOutraField').style.display = select.value === '__outra__' ? '' : 'none';
  }

  function atualizarPreviaEncaminhamento(){
    el('btnRecomecarEncaminhamento').hidden = !encTextoEditado;
    if(encTextoEditado) return;
    el('encTexto').value = montarTextoEncaminhamento();
  }

  function abrirEncaminhamento(){
    const paciente = el('nomePaciente').value.trim();
    if(encRascunhoPaciente === null || encRascunhoPaciente !== paciente){
      encTextoEditado = false;
      el('encNomePaciente').value = paciente;
      el('encCondicaoOutra').value = '';
      popularEncaminhamentoCondicoes();
    } else {
      // mesmo paciente: mantém o que foi escrito; a lista de condições acompanha a receita
      const escolhida = el('encCondicao').value;
      popularEncaminhamentoCondicoes();
      if([...el('encCondicao').options].some(o => o.value === escolhida)) el('encCondicao').value = escolhida;
      el('encCondicaoOutraField').style.display = el('encCondicao').value === '__outra__' ? '' : 'none';
    }
    atualizarPreviaEncaminhamento();
    mostrarJanela('encaminhamentoOverlay', 'btnImprimirEncaminhamento');
  }

  async function imprimirEncaminhamento(){
    if(!await conferirDocumento(el('encTexto').value, el('encNomePaciente'))) return;
    imprimirDocumentoSimples('Encaminhamento', el('encTexto').value, el('encNomePaciente').value.trim());
  }

  // Folha simples com o cabeçalho do local (logos + paciente + data) e um texto
  // corrido: usada pelo encaminhamento e pelo atestado.
  function imprimirDocumentoSimples(titulo, texto, nomePaciente){
    const dataStr = new Date().toLocaleDateString('pt-BR');

    const corpoHtml = `
      <div class="encaminhamento-titulo">${escapeHtml(titulo)}</div>
      <div class="encaminhamento-texto">${escapeHtml(texto)}</div>
    `;

    const printStyles = `
      @page{ size: portrait; margin: 20mm 22mm; }
      body{font-family:'Inter',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#16241F; padding:34px 38px; max-width:700px; margin:0 auto;}
      .receita-logos{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
      .receita-logos .logo-carmo{height:38px;width:auto;}
      .receita-logos .logo-sus{height:30px;width:auto;}
      .receita-logos .logo-muni{display:flex;align-items:center;gap:10px;}
      .receita-logos .logo-muni-brasao{height:46px;width:auto;}
      .receita-logos .logo-muni-texto{font-size:10px;line-height:1.3;color:#4B5A55;text-transform:uppercase;letter-spacing:.06em;}
      .receita-logos .logo-muni-texto b{display:block;font-size:15px;line-height:1.2;color:#16241F;letter-spacing:.03em;}
      .receita-head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #16241F;padding-bottom:10px;margin-bottom:20px;}
      .receita-head .paciente{font-size:17px;font-weight:600;}
      .receita-head .paciente .lbl{display:block;font-size:10px;color:#4B5A55;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;}
      .receita-head .data{font-size:12px;color:#4B5A55;text-align:right;}
      .encaminhamento-titulo{font-size:11.5px;font-weight:700;letter-spacing:.1em;color:#0A4F41;text-transform:uppercase;margin:0 0 14px 0;padding-bottom:4px;border-bottom:1px solid #E4EFEC;}
      .encaminhamento-texto{font-size:13.5px;line-height:1.8;white-space:pre-wrap;}
      @media print{ body{padding:0;} }
    `;

    const paperHtml = `
      ${logosHtml()}
      <div class="receita-head">
        <div class="paciente"><span class="lbl">Paciente</span>${escapeHtml(nomePaciente || '—')}</div>
        <div class="data">${dataStr}</div>
      </div>
      ${corpoHtml}
    `;

    abrirImpressao(titulo, printStyles, paperHtml, nomePaciente);
  }

  function copiarEncaminhamento(){ return copiarTextoSimples(el('encTexto').value); }

  async function copiarTextoSimples(texto){
    try{
      await navigator.clipboard.writeText(texto);
      showToast('Texto copiado');
    }catch(e){
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Texto copiado');
    }
  }

  // ---------- Atestado ----------
  // Atestado de afastamento (dias) ou declaração de comparecimento/acompanhante.
  // O CID só entra com autorização expressa do paciente (Resolução CFM 1.658/2002).
  const UNIDADES_EXTENSO = ['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove'];
  const DEZENAS_EXTENSO = ['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa'];
  const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const TITULOS_ATESTADO = { afastamento: 'Atestado médico', comparecimento: 'Declaração de comparecimento', acompanhante: 'Declaração de acompanhante' };

  function numeroPorExtenso(n){
    if(n < 20) return UNIDADES_EXTENSO[n];
    const d = Math.floor(n / 10), u = n % 10;
    return DEZENAS_EXTENSO[d] + (u ? ' e ' + UNIDADES_EXTENSO[u] : '');
  }
  // "AAAA-MM-DD" do <input type=date> como data local (new Date("AAAA-MM-DD") seria UTC e voltaria um dia)
  function dataDoCampo(v){
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  const isoDia = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const horaAgora = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  const dataBR = d => d ? d.toLocaleDateString('pt-BR') : '__/__/____';
  const dataPorExtenso = d => `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  // "às 08:30", mas "à 01:30" / "das 08:00", mas "da 01:00"
  const horaCom = (prep, h) => (h && h.startsWith('01:') ? prep.replace(/s$/, '') : prep) + ' ' + (h || '__:__');

  function cidadeDoLocal(){
    const muni = municipioDoLocal(localAtual());
    return muni ? muni.nome : 'Carmo do Paranaíba';
  }
  function tipoAtestado(){
    const r = document.querySelector('input[name=atTipo]:checked');
    return r ? r.value : 'afastamento';
  }

  function montarTextoAtestado(){
    const tipo = tipoAtestado();
    const nome = el('atNomePaciente').value.trim() || '(nome do paciente)';
    const doc = el('atDocumento').value.trim();
    const quem = doc ? `${nome}, documento ${doc},` : nome;
    const data = dataDoCampo(el('atData').value);
    const h1 = el('atHoraInicio').value, h2 = el('atHoraFim').value;
    let corpo;
    if(tipo === 'afastamento'){
      const dias = Math.max(1, Math.min(99, parseInt(el('atDias').value, 10) || 1));
      const inicio = dataDoCampo(el('atInicio').value) || data;
      let periodo = '';
      if(inicio){
        const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + dias - 1);
        periodo = dias === 1 ? `, no dia ${dataBR(inicio)}` : `, de ${dataBR(inicio)} a ${dataBR(fim)}`;
      }
      const cid = el('atCid').value.trim();
      const cidTxt = cid && el('atCidAutorizado').checked ? ` CID-10: ${cid}.` : '';
      corpo = `Atesto, para os devidos fins, que ${quem} esteve em atendimento médico nesta unidade no dia ${dataBR(data)}, ${horaCom('às', el('atHora').value)}, e necessita de ${String(dias).padStart(2, '0')} (${numeroPorExtenso(dias)}) ${dias === 1 ? 'dia' : 'dias'} de afastamento de suas atividades${periodo}.${cidTxt}`;
    } else if(tipo === 'comparecimento'){
      corpo = `Declaro, para os devidos fins, que ${quem} esteve nesta unidade para atendimento médico no dia ${dataBR(data)}, ${horaCom('das', h1)} ${horaCom('às', h2)}.`;
    } else {
      const acomp = el('atAcompanhante').value.trim() || '(nome do acompanhante)';
      corpo = `Declaro, para os devidos fins, que ${acomp} esteve nesta unidade no dia ${dataBR(data)}, ${horaCom('das', h1)} ${horaCom('às', h2)}, acompanhando ${quem} em atendimento médico.`;
    }
    const medicoNome = (el('medicoNome') && el('medicoNome').value.trim()) || '(nome do médico)';
    const medicoCrm = (el('medicoCrm') && el('medicoCrm').value.trim()) || '';
    const assinatura = [medicoNome, medicoCrm].filter(Boolean).join(' — ');
    return `${corpo}

${cidadeDoLocal()}, ${dataPorExtenso(new Date())}.


_________________________________
${assinatura}`;
  }

  // Mesmo esquema de rascunho do encaminhamento
  let atRascunhoPaciente = null;
  let atTextoEditado = false;

  function atualizarPreviaAtestado(){
    const tipo = tipoAtestado();
    el('atestadoOverlay').dataset.tipo = tipo;
    el('atTitulo').textContent = TITULOS_ATESTADO[tipo];
    const dias = el('atDias').value;
    document.querySelectorAll('.at-dias-rapidos button').forEach(b => b.setAttribute('aria-pressed', b.dataset.dias === dias ? 'true' : 'false'));
    el('btnRecomecarAtestado').hidden = !atTextoEditado;
    el('atCidAviso').hidden = !(el('atCid').value.trim() && !el('atCidAutorizado').checked);
    if(atTextoEditado) return;
    el('atTexto').value = montarTextoAtestado();
  }

  // Outro paciente (ou Nova receita) começa do zero: CID, documento e
  // acompanhante não passam de um paciente para o outro. O mesmo paciente
  // reencontra o rascunho como deixou.
  function abrirAtestado(){
    if(atRascunhoPaciente !== null && atRascunhoPaciente === el('nomePaciente').value.trim()){
      atualizarPreviaAtestado();
      mostrarJanela('atestadoOverlay', 'atDias');
      return;
    }
    atTextoEditado = false;
    const hoje = isoDia(new Date()), agora = horaAgora();
    el('atNomePaciente').value = el('nomePaciente').value.trim();
    ['atDocumento', 'atAcompanhante', 'atCid', 'atHoraInicio'].forEach(id => { el(id).value = ''; });
    el('atCidAutorizado').checked = false;
    el('atData').value = hoje;
    el('atInicio').value = hoje;
    el('atHora').value = agora;
    el('atHoraFim').value = agora;
    el('atDias').value = '1';
    atualizarPreviaAtestado();
    mostrarJanela('atestadoOverlay', 'atDias');
  }

  async function imprimirAtestado(){
    if(!await conferirDocumento(el('atTexto').value, el('atNomePaciente'))) return;
    imprimirDocumentoSimples(TITULOS_ATESTADO[tipoAtestado()], el('atTexto').value, el('atNomePaciente').value.trim());
  }

  function viaBoxHtml(nomePaciente, dataStr, corpoHtml, label, extraClass){
    const unidade = (el('unidadeSaude') && el('unidadeSaude').value.trim()) || 'Rua São Vicente, S/N — Bairro JK';
    const medicoNome = (el('medicoNome') && el('medicoNome').value.trim()) || '';
    const medicoCrm = (el('medicoCrm') && el('medicoCrm').value.trim()) || '';
    const labelAssinatura = (medicoNome || medicoCrm) ? [medicoNome, medicoCrm].filter(Boolean).join(' — ') : 'Assinatura do médico';
    return `
      <div class="via-box ${extraClass||''}">
        <div class="via-box-header">
          <div class="muni">
            <img src="data:image/png;base64,${LOGO_COMUM_B64}" class="muni-logo" alt="Prefeitura de Carmo do Paranaíba">
            <div class="muni-text"><b>Prefeitura de Carmo do Paranaíba</b><br>${escapeHtml(unidade)}</div>
          </div>
          <div class="via-label">${label}</div>
        </div>
        <div class="via-box-title">Receituário de Controle Especial</div>
        <div class="via-box-paciente">
          <span><b>Paciente:</b> ${escapeHtml(nomePaciente || '—')}</span>
          <span class="via-box-data">${dataStr}</span>
        </div>
        <div class="via-box-body">${corpoHtml}</div>
        <div class="assinatura-bloco via-box-assinatura">
          <div class="carimbo-box"><span>carimbo</span></div>
          <div class="assinatura-linha-wrap">
            <div class="linha"></div>
            <div class="label">${escapeHtml(labelAssinatura)}</div>
          </div>
        </div>
        <div class="via-box-footer">
          <div>
            <b>Identificação do comprador</b><br>
            Nome:<br>
            Ident.: _______________ Órgão emissor: _______________<br>
            Endereço:<br>
            Cidade: ____________ Estado: ______ Telefone: __________
          </div>
          <div>
            <b>Identificação do fornecedor</b><br><br>
            _________________________________<br>
            Assinatura do farmacêutico &nbsp;&nbsp;&nbsp; Data
          </div>
        </div>
      </div>
    `;
  }

  function viaBoxHtmlMunicipio(muni, nomePaciente, dataStr, corpoHtml, label, extraClass){
    const unidade = (el('unidadeSaude') && el('unidadeSaude').value.trim()) || muni.unidadePadrao;
    const brasao = muni.brasao();
    const medicoNome = (el('medicoNome') && el('medicoNome').value.trim()) || '';
    const medicoCrm = (el('medicoCrm') && el('medicoCrm').value.trim()) || '';
    const labelAssinatura = (medicoNome || medicoCrm) ? [medicoNome, medicoCrm].filter(Boolean).join(' — ') : 'Assinatura do médico';
    return `
      <div class="via-box ${extraClass||''}">
        <div class="via-box-header">
          <div class="muni">
            ${brasao ? `<img src="data:image/png;base64,${brasao}" class="muni-logo" alt="${escapeHtml(muni.prefeitura)}">` : ''}
            <div class="muni-text"><b>${escapeHtml(muni.prefeitura)}</b><br>${escapeHtml(unidade)}</div>
            <img src="data:image/png;base64,${LOGO_SUS_B64}" class="muni-sus-logo" alt="SUS">
          </div>
          <div class="via-label">${label || '1ª VIA FARMÁCIA'}</div>
        </div>
        <div class="via-box-title">Receituário de Controle Especial</div>
        <div class="via-box-paciente">
          <span><b>Paciente:</b> ${escapeHtml(nomePaciente || '—')}</span>
          <span class="via-box-data">${dataStr}</span>
        </div>
        <div class="via-box-body">${corpoHtml}</div>
        <div class="assinatura-bloco via-box-assinatura">
          <div class="carimbo-box"><span>carimbo</span></div>
          <div class="assinatura-linha-wrap">
            <div class="linha"></div>
            <div class="label">${escapeHtml(labelAssinatura)}</div>
          </div>
        </div>
        <div class="via-box-footer">
          <div>
            <b>Identificação do comprador</b><br>
            Nome:<br>
            Ident.: _______________ Órgão emissor: _______________<br>
            Endereço:<br>
            Cidade: ____________ Estado: ______ Telefone: __________
          </div>
          <div>
            <b>Identificação do fornecedor</b><br>
${muni.fornecedor.map(l => '            ' + escapeHtml(l) + '<br>').join('\n')}<br>
            _________________________________<br>
            Assinatura do farmacêutico &nbsp;&nbsp;&nbsp; Data
          </div>
        </div>
      </div>
    `;
  }

  // ---------- Separar sozinho: o que exige 2 vias × receita comum ----------
  // Com "Separar sozinho", antimicrobiano e controlado vão para o receituário de
  // controle especial (2 vias) e o resto, com as orientações, para a receita
  // comum; impressão e .docx saem juntos. it.vias2 (true/false) guarda a troca
  // de lado feita à mão na prévia.
  const precisaDuasVias = it => it.vias2 !== undefined ? !!it.vias2 : !!window.VIAS.classificar(it);
  function partesReceita(){
    const duas = {}, comum = {};
    Object.entries(selected).forEach(([id, it]) => { (precisaDuasVias(it) ? duas : comum)[id] = it; });
    // orientações acompanham os sintomáticos; sem eles, vão com as 2 vias
    const comComum = Object.keys(comum).length > 0;
    return { duas, comum, orientComum: comComum ? selectedOrient : {}, orientDuas: comComum ? {} : selectedOrient };
  }
  // Separação em duas receitas só quando há itens dos dois lados
  function separacaoAtiva(){
    if(tipoReceitaAtual() !== 'auto') return null;
    const p = partesReceita();
    return Object.keys(p.duas).length && Object.keys(p.comum).length ? p : null;
  }
  // Tipo de receita para quem gera uma só (sem separação ativa)
  function tipoEfetivo(){
    const t = tipoReceitaAtual();
    if(t !== 'auto') return t;
    return Object.keys(selected).length && Object.values(selected).every(precisaDuasVias) ? 'controle' : 'comum';
  }
  // Roda fn com outra seleção no lugar da atual (prévia, impressão e .docx de cada parte)
  function comSelecao(sel, ori, fn){
    const s0 = selected, o0 = selectedOrient;
    selected = sel; selectedOrient = ori;
    try{ return fn(); } finally { selected = s0; selectedOrient = o0; }
  }

  // HTML da prévia de um tipo de receita, com a seleção atual (selected/selectedOrient)
  function htmlPrevia(tipo){
    const nomePaciente = el('nomePaciente').value.trim();
    const peso = el('peso').value;
    const medEntries = Object.entries(selected);
    const orientEntries = Object.entries(selectedOrient);
    const local = localAtual();
    const dataStr = new Date().toLocaleDateString('pt-BR');
    const vazio = medEntries.length === 0 && orientEntries.length === 0;
    const corpoHtml = vazio
      ? '<div class="receita-vazia-mini">Selecione condições ou medicamentos ao lado.</div>'
      : corpoReceitaHtml(medEntries, orientEntries, peso);

    if(tipo === 'controle'){
      const muni = municipioDoLocal(local);
      return muni
        ? `
          <div class="vias-lado-a-lado">
            ${viaBoxHtmlMunicipio(muni, nomePaciente, dataStr, corpoHtml, '1ª VIA FARMÁCIA')}
            ${viaBoxHtmlMunicipio(muni, nomePaciente, dataStr, corpoHtml, '2ª VIA PACIENTE', 'via-2')}
          </div>
        `
        : `
          <div class="vias-lado-a-lado">
            ${viaBoxHtml(nomePaciente, dataStr, corpoHtml, '1ª VIA FARMÁCIA')}
            ${viaBoxHtml(nomePaciente, dataStr, corpoHtml, '2ª VIA PACIENTE', 'via-2')}
          </div>
        `;
    }

    if(vazio){
      return `
        ${logosHtml()}
        <div class="receita-head">
          <div class="paciente"><span class="lbl">Paciente</span>${escapeHtml(nomePaciente || '—')}</div>
          <div class="data">${dataStr}</div>
        </div>
        <div class="receita-vazia">Selecione condições ou medicamentos ao lado.<br>A receita é montada aqui, ao vivo.</div>
      `;
    }

    return `
      ${logosHtml()}
      <div class="receita-head">
        <div class="paciente"><span class="lbl">Paciente</span>${escapeHtml(nomePaciente || '—')}</div>
        <div class="data">${dataStr}</div>
      </div>
      ${corpoHtml}
      <div class="assinatura-bloco">
        <div class="carimbo-box"><span>carimbo</span></div>
        <div class="assinatura-linha-wrap">
          <div class="linha"></div>
          <div class="label">${escapeHtml((() => {
            const mn = (el('medicoNome') && el('medicoNome').value.trim()) || '';
            const mc = (el('medicoCrm') && el('medicoCrm').value.trim()) || '';
            return (mn || mc) ? [mn, mc].filter(Boolean).join(' — ') : 'Assinatura do médico';
          })())}</div>
        </div>
      </div>
    `;
  }

  // Na prévia separada, a receita comum vem primeiro e as 2 vias embaixo
  function renderReceita(){
    const paper = el('receitaPaper');
    const sep = separacaoAtiva();
    paper.classList.toggle('separada', !!sep);
    paper.innerHTML = sep
      ? `<div class="parte-comum">${comSelecao(sep.comum, sep.orientComum, () => htmlPrevia('comum'))}</div>`
        + `<div class="separador-vias"><span>Receituário de controle especial — 2 vias</span></div>`
        + `<div class="parte-duas">${comSelecao(sep.duas, sep.orientDuas, () => htmlPrevia('controle'))}</div>`
      : htmlPrevia(tipoEfetivo());
  }

  // ---------- Chips de condições mais usadas ----------
  function renderChips(){
    const cont = el('chipsMaisUsadas');
    cont.innerHTML = '';
    const top = Object.keys(usoCondicoes)
      .filter(n => DATA.condicoes[n] || customCondicoes[n])
      .sort((a,b) => usoCondicoes[b] - usoCondicoes[a])
      .slice(0, 9); // até 9, pra bater com o atalho de teclado 1-9
    top.forEach(nome => {
      const state = condicaoSelectionState(nome);
      const chip = document.createElement('button');
      chip.className = 'chip' + (state === 'all' ? ' on' : '');
      chip.textContent = nome;
      chip.title = 'Usada ' + usoCondicoes[nome] + 'x';
      chip.addEventListener('click', () => toggleCondicaoInteira(nome, state !== 'all'));
      cont.appendChild(chip);
    });
  }

  // ---------- Paciente pediátrico (peso / idade) ----------
  const numBR = n => String(n).replace('.', ',');
  const AUTO_PED_KEY = 'auto-pediatria';
  // "Separar sozinho sempre que precisar": receita comum com antimicrobiano ou
  // controlado passa sozinha para "Separar sozinho" (até o tipo ser escolhido à mão)
  const SEPARAR_KEY = 'separar-auto';
  let separarSuspenso = false;
  function separarSempreAtivo(){
    // ligado de fábrica: quem não quiser desmarca uma vez
    try{ return localStorage.getItem(SEPARAR_KEY) !== '0'; }catch(e){ return true; }
  }
  function pesoAtualKg(){
    const v = parseFloat(String(el('peso').value).replace(',', '.'));
    return v > 0 ? v : null;
  }
  function idadeAtualMeses(){ return window.PEDIATRIA.idadeEmMeses(el('idade').value); }
  // Criança: idade informada < 12 anos; sem idade, peso < 40 kg (só sugere, não converte sozinho)
  function pacientePediatrico(){
    const meses = idadeAtualMeses();
    if(meses !== null) return meses < 144;
    const kg = pesoAtualKg();
    return kg !== null && kg < window.PEDIATRIA.PESO_MAX_KG;
  }
  function autoPediatriaAtiva(){
    // no Quadro (idade e peso chegam do cartão) já vem ligado; fora dele, só se marcado
    try{ const v = localStorage.getItem(AUTO_PED_KEY); return v === null ? !!PONTE : v === '1'; }catch(e){ return false; }
  }

  function executarConversao(automatica){
    const entradas = Object.entries(selected);
    if(!entradas.length){ if(!automatica) showToast('Selecione os medicamentos antes de converter'); return false; }
    const r = window.PEDIATRIA.converterParaPediatrico(entradas, el('peso').value, { idadeMeses: idadeAtualMeses() });
    if(r.erro){ if(!automatica){ showToast(r.erro); el('peso').focus(); } return false; }
    if(!r.convertidos && !r.removidos.length){
      if(!automatica) showToast('Nenhum item com versão pediátrica cadastrada');
      return false;
    }
    desfazerPediatria = { selected: JSON.parse(JSON.stringify(selected)), conversaoPed: conversaoPed && JSON.parse(JSON.stringify(conversaoPed)) };
    selected = Object.fromEntries(r.entries);
    const acum = conversaoPed || { motivos: [], fixos: [] };
    r.removidos.forEach(x => { if(!acum.motivos.includes(x.motivo)) acum.motivos.push(x.motivo); });
    r.fixos.forEach(t => { if(!acum.fixos.includes(t)) acum.fixos.push(t); });
    acum.automatica = !!automatica;
    conversaoPed = acum;
    renderTudo();
    if(automatica) showToast('Receita convertida para pediátrica — confira os avisos');
    return true;
  }
  function desfazerConversao(){
    if(!desfazerPediatria) return;
    selected = desfazerPediatria.selected;
    conversaoPed = desfazerPediatria.conversaoPed;
    desfazerPediatria = null;
    autoPedSuspensa = true;
    renderTudo();
    showToast('Conversão desfeita');
  }

  function avisoHtml(classe, icone, corpoHtml, acaoHtml){
    const div = document.createElement('div');
    div.className = 'aviso ' + classe;
    div.innerHTML = `<span class="aviso-ic" aria-hidden="true">${icone}</span><div class="aviso-corpo">${corpoHtml}</div>${acaoHtml || ''}`;
    return div;
  }
  const listaHtml = itens => itens.length ? '<ul>' + itens.map(t => '<li>' + escapeHtml(t) + '</li>').join('') + '</ul>' : '';

  // ---------- Paciente vindo do Quadro do Plantão ----------
  // {nome, idade, peso, sexo, alergias:[], queixa, ficha} do cartão; vale enquanto o
  // nome na tela for o do cartão (trocou o nome à mão: as alergias não são deste).
  let pacienteQuadro = null;
  let limpezaSilenciosa = false;   // "Nova receita" disparada pelo Quadro: sem Desfazer nem foco
  const primeiroNome = n => norm(n).split(/\s+/)[0] || '';
  function quadroAtual(){
    if(!pacienteQuadro) return null;
    const tela = el('nomePaciente').value.trim();
    if(pacienteQuadro.nome && tela && primeiroNome(tela) !== primeiroNome(pacienteQuadro.nome)) return null;
    return pacienteQuadro;
  }
  async function aplicarPacienteDoQuadro(p){
    if(!p){ return; }
    const tela = el('nomePaciente').value.trim();
    const temItens = Object.keys(selected).length || Object.keys(selectedOrient).length;
    const idsAtuais = Object.keys(selected).sort().join('|') + '§' + Object.keys(selectedOrient).sort().join('|');
    const jaSaiu = temItens && historico.length && historico[0].ids === idsAtuais && (historico[0].paciente || '') === tela;
    const mesmo = tela && p.nome && (norm(tela) === norm(p.nome) || (primeiroNome(tela) === primeiroNome(p.nome) && norm(p.nome).startsWith(norm(tela))));
    // outro paciente: receita nova se a anterior já saiu; receita ainda não impressa
    // sem nome fica para este paciente; com outro nome, pergunta antes de apagar
    if(!mesmo && (tela || temItens)){
      const limpar = jaSaiu || !temItens || (tela && await perguntar('Trocar para <b>' + escapeHtml(p.nome) + '</b>? A receita de ' + escapeHtml(tela) + ' ainda não foi impressa e será apagada.',
        [{ rotulo: 'Manter ' + tela, valor: false }, { rotulo: 'Trocar de paciente', valor: true, primario: true }]));
      if(limpar){ limpezaSilenciosa = true; try{ el('btnLimpar').click(); } finally { limpezaSilenciosa = false; } }
      else if(tela) return;   // ficou com o paciente anterior
    }
    pacienteQuadro = p;
    if(p.nome) el('nomePaciente').value = p.nome;
    if(p.idade && !el('idade').value.trim()) el('idade').value = window.PONTE.idadeParaCampo(p.idade);
    if(p.peso && !el('peso').value) el('peso').value = String(p.peso);
    renderReceita(); atualizarDestaquePeso(); renderTudo();
    // receita vazia: o foco vai para a 1ª sugestão pela queixa (Enter adiciona) ou para a busca
    if(!Object.keys(selected).length){
      const sug = document.querySelector('#avisoBar button[data-acao="cond-queixa"]');
      (sug || el('search')).focus({ preventScroll: true });
    }
  }
  // condição montada para criança: a maioria dos itens com dose por peso (ex.: Faringoamigdalite, em suspensão)
  function condicaoPorPeso(nome){
    const meds = getCondEffective(nome).meds;
    return meds.length > 0 && meds.filter(m => m.fator != null || m.faixas).length * 2 > meds.length;
  }
  // adulto não recebe sugestão de condição pediátrica
  function condicaoParaSugerir(nome){
    if(!(DATA.condicoes[nome] || customCondicoes[nome])) return false;
    return pacientePediatrico() || !condicaoPorPeso(nome);
  }
  function renderAvisosQuadro(bar, entradas){
    const q = quadroAtual();
    if(!q) return;
    const alergias = q.alergias || [];
    if(alergias.length){
      const conflitos = entradas.map(([id, it]) => [id, it.nome, window.PONTE.conflitoAlergia(it.nome, alergias)]).filter(x => x[2]);
      bar.appendChild(avisoHtml('perigo', '&#9888;', conflitos.length
        ? '<b>ALERGIA — confira antes de imprimir:</b>' + listaHtml(conflitos.map(([, n, a]) => n + ' (alergia a ' + a + ' registrada no Quadro)'))
        : 'Alergia registrada no Quadro: <b>' + escapeHtml(alergias.join(', ')) + '</b>',
        conflitos.length ? `<button type="button" data-acao="tirar-alergico" data-ids="${escapeHtml(conflitos.map(c => c[0]).join('|'))}">Tirar da receita</button>` : ''));
    }
    // receita ainda vazia: a queixa do cartão sugere por onde começar
    if(!entradas.length && q.queixa){
      const anos = idadeAtualMeses() !== null ? idadeAtualMeses() / 12 : null;
      const sug = window.PONTE.sugerirCondicoes(q.queixa, condicaoParaSugerir, anos);
      if(sug.length) bar.appendChild(avisoHtml('teal', '&#10022;',
        'Pela queixa do Quadro: <b>' + escapeHtml(q.queixa.length > 90 ? q.queixa.slice(0, 89) + '…' : q.queixa) + '</b>',
        '<div class="aviso-acoes">' + sug.map(n => `<button type="button" data-acao="cond-queixa" data-nome="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join('') + '</div>'));
    }
  }
  // Textos que mudam dentro do Quadro (as configurações deixam de ser só deste aparelho)
  function modoQuadro(){
    document.documentElement.classList.add('no-quadro');
    const tag = document.querySelector('.header-titles .tag');
    if(tag && PONTE.comBanco()) tag.lastChild.textContent = ' No Quadro · configurações valem em qualquer computador';
  }

  // ---------- Avisos (pediatria, teto de dose, duplicidade de princípio ativo) ----------
  function renderAvisos(){
    const bar = el('avisoBar');
    bar.innerHTML = '';
    const porToken = {};
    Object.values(selected).forEach(it => {
      const token = norm(it.nome).split(/[\s+]/)[0];
      if(!token) return;
      if(!porToken[token]) porToken[token] = [];
      porToken[token].push(it.nome);
    });
    const entradas = Object.entries(selected);
    const kg = pesoAtualKg(), idade = idadeAtualMeses();
    renderAvisosQuadro(bar, entradas);
    if(entradas.length && !el('medicoNome').value.trim() && !semMedicoAceito)
      bar.appendChild(avisoHtml('teal', '&#9998;', 'Seu <b>nome e CRM</b> ainda não aparecem na receita (preenche uma vez neste aparelho).',
        '<button type="button" data-acao="preencher-medico">Preencher</button>'));

    // 1) Sugestão: paciente pediátrico com itens de adulto que têm versão pediátrica
    const conversiveis = entradas.length ? window.PEDIATRIA.contarConversiveis(entradas, idade) : 0;
    if(conversiveis && pacientePediatrico()){
      const quem = idade !== null ? window.PEDIATRIA.formatarIdade(idade) + (kg ? ', ' + numBR(kg) + ' kg' : '') : numBR(kg) + ' kg';
      bar.appendChild(avisoHtml('teal', '&#9432;',
        `<b>Paciente pediátrico (${escapeHtml(quem)}): ${conversiveis} ${conversiveis === 1 ? 'item de adulto pode' : 'itens de adulto podem'} ir para a versão pediátrica.</b>`
        + (kg ? '' : '<br>Informe o peso para converter.')
        + `<label class="aviso-check"><input type="checkbox" data-acao="auto-ped" ${autoPediatriaAtiva() ? 'checked' : ''}> Converter sozinho quando a idade informada for menor que 12 anos</label>`,
        `<button type="button" data-acao="converter-ped" ${kg ? '' : 'disabled'}>Converter agora</button>`));
    }

    // 2) Resultado da conversão, recalculado com o peso/idade atuais
    const convertidos = entradas.filter(([, it]) => it.convertidoPediatrico);
    if(conversaoPed && (convertidos.length || conversaoPed.motivos.length || conversaoPed.fixos.length)){
      const itens = [];
      const alto = window.PEDIATRIA.avisoPesoAlto(kg || 0);
      if(alto) itens.push(alto);
      itens.push(...conversaoPed.motivos, ...conversaoPed.fixos);
      convertidos.forEach(([, it]) => itens.push(...window.PEDIATRIA.avisosDoItem(it, kg || 0, idade)));
      const titulo = 'Receita convertida ' + (conversaoPed.automatica ? 'automaticamente ' : '') + 'para pediátrica' + (kg ? ` (peso ${numBR(kg)} kg)` : '') + '. Confira cada dose antes de imprimir.';
      bar.appendChild(avisoHtml('amber', '&#9888;', '<b>' + escapeHtml(titulo) + '</b>' + listaHtml(itens)
        + `<label class="aviso-check"><input type="checkbox" data-acao="auto-ped" ${autoPediatriaAtiva() ? 'checked' : ''}> Converter sozinho quando a idade informada for menor que 12 anos</label>`,
        desfazerPediatria ? '<button type="button" data-acao="desfazer-ped">Desfazer</button>' : ''));
    }

    // 3) Itens por peso escolhidos direto (não convertidos): teto por dose e idade mínima
    const soltos = [];
    entradas.forEach(([, it]) => {
      if(it.convertidoPediatrico) return;
      const d = window.PEDIATRIA.doseDoItem(it, kg);
      if(d && d.limitada) soltos.push(`${it.nome}: dose calculada (${d.semTeto}) excede o máximo de ${it.max} por dose; a receita sai com ${it.max}.`);
      if(d && d.valor === null) soltos.push(`ATENÇÃO — ${it.nome}: peso fora das faixas de dose (mínimo ${it.pesoMinKg || '?'} kg). Preencha à mão ou revise.`);
      if(kg && it.pesoMinKg && kg < it.pesoMinKg && !(d && d.valor === null)) soltos.push(`ATENÇÃO — ${it.nome}: peso abaixo do mínimo de ${it.pesoMinKg} kg. Revise.`);
      if(it.idadeMinMeses && idade !== null && idade < it.idadeMinMeses){
        soltos.push(`ATENÇÃO — ${it.nome}: paciente com ${window.PEDIATRIA.formatarIdade(idade)}, abaixo da idade mínima de ${window.PEDIATRIA.formatarIdade(it.idadeMinMeses)}. Revise.`);
      }
    });
    if(soltos.length) bar.appendChild(avisoHtml('amber', '&#9888;', '<b>Confira doses e idade mínima</b>' + listaHtml(soltos)));
    Object.keys(porToken).forEach(token => {
      if(porToken[token].length >= 2){
        const div = document.createElement('div');
        div.className = 'aviso amber';
        const nomeExib = token.charAt(0).toUpperCase() + token.slice(1);
        div.innerHTML = `<span class="aviso-ic" aria-hidden="true">&#9888;</span><div class="aviso-corpo">Possível duplicidade: <b>${escapeHtml(nomeExib)}</b> aparece em ${porToken[token].length} itens (${escapeHtml(porToken[token].join(' · '))}). Confira se é intencional.</div>`;
        bar.appendChild(div);
      }
    });
    // Receita em 2 vias: sugere separar quando o tipo não combina com os itens
    const valores = Object.values(selected);
    const de2 = valores.filter(precisaDuasVias), resto = valores.filter(it => !precisaDuasVias(it));
    const nomesDe = l => escapeHtml(l.map(it => it.nome).join(', '));
    const tipoSel = tipoReceitaAtual();
    const chkSeparar = `<label class="aviso-check"><input type="checkbox" data-acao="separar-sempre" ${separarSempreAtivo() ? 'checked' : ''}> Separar sozinho sempre que precisar</label>`;
    if(tipoSel === 'comum' && de2.length){
      const motivos = [...new Set(de2.map(it => window.VIAS.ROTULO[window.VIAS.classificar(it)] || 'marcado por você'))].join(', ');
      bar.appendChild(avisoHtml('teal', '&#8645;',
        `<b>${nomesDe(de2)}</b> ${de2.length === 1 ? 'precisa' : 'precisam'} de receita em 2 vias (${escapeHtml(motivos)}).`
        + (resto.length ? ' Dá para separar: isso no receituário de 2 vias e o resto, com as orientações, na receita comum — numa impressão só.' : '') + chkSeparar,
        `<button type="button" data-acao="separar-auto">${resto.length ? 'Separar sozinho' : 'Usar 2 vias'}</button>`));
    } else if(tipoSel === 'controle' && de2.length && resto.length){
      bar.appendChild(avisoHtml('teal', '&#8645;',
        `<b>${nomesDe(resto)}</b> não ${resto.length === 1 ? 'precisa' : 'precisam'} de 2 vias. Dá para separar: só ${nomesDe(de2)} no receituário de 2 vias e o resto na receita comum.`,
        `<button type="button" data-acao="separar-auto">Separar sozinho</button>`));
    } else if(tipoSel === 'auto' && de2.length && resto.length){
      bar.appendChild(avisoHtml('teal', '&#8645;',
        `<b>Receita separada:</b> 2 vias — ${nomesDe(de2)}; comum — ${nomesDe(resto)}${Object.keys(selectedOrient).length ? ' e as orientações' : ''}. Clique em “2 vias” ou “comum” no item para trocar de lado.` + chkSeparar));
    }
    const notifB = valores.filter(it => window.VIAS.classificar(it) === 'notificacao');
    if(notifB.length) bar.appendChild(avisoHtml('amber', '&#9888;',
      `<b>${nomesDe(notifB)}</b> ${notifB.length === 1 ? 'exige' : 'exigem'} Notificação de Receita B (azul), que este app não imprime: preencha também a notificação.`));

    renderSugestoesPadroes(bar);
  }

  // ---------- Contador de itens ----------
  function renderCount(){
    const n = Object.keys(selected).length;
    const o = Object.keys(selectedOrient).length;
    const chip = el('countChip');
    if(n === 0 && o === 0){ chip.textContent = ''; return; }
    let txt = n + ' medicamento' + (n !== 1 ? 's' : '');
    if(o) txt += ' · ' + o + ' orientaç' + (o !== 1 ? 'ões' : 'ão');
    chip.textContent = txt;
  }

  // ---------- Padrões de uso: sugerir tornar padrão o que o médico repete ----------
  // Cada atendimento (de uma "Nova receita" à próxima, ou até mudar o paciente —
  // as duas receitas de um mesmo paciente contam como um atendimento) é comparado
  // com o padrão de cada condição usada: item com posologia/quantidade trocada,
  // item ou orientação que ficou de fora, orientação reescrita, remédio
  // acrescentado. Quando a mesma mudança se repete, a receita sugere torná-la o
  // padrão. Fica tudo neste navegador e sem dado de paciente (só condição,
  // remédio e texto).
  const PADROES_MIN = 3;          // repetições para sugerir
  const PADROES_FRACAO = 0.6;     // retirar/acrescentar: fração dos atendimentos com a condição
  const PADROES_MAX_CHAVES = 400;
  let padroes = { uso: {}, n: {}, info: {}, dispensadas: {}, adiadas: {} };
  let atendimentoAtual = null;    // { paciente, inicio, ignorar, conds: {X: {meds: {i: {posologia, qtde}}, orient: {i: texto}}}, extras: {nome: item} }

  async function loadPadroes(){
    try{
      const r = await storage.get('padroes-uso', false);
      if(r && r.value) padroes = Object.assign(padroes, JSON.parse(r.value));
      const a = await storage.get('padroes-atendimento', false);
      atendimentoAtual = a && a.value ? JSON.parse(a.value) : null;
    }catch(e){ atendimentoAtual = null; }
    // atendimento esquecido aberto (app fechado sem "Nova receita"): fecha agora
    if(atendimentoAtual && Date.now() - (atendimentoAtual.inicio || 0) > 12 * 3600e3) finalizarAtendimento();
  }
  async function savePadroes(){
    try{
      const chaves = Object.keys(padroes.n);
      if(chaves.length > PADROES_MAX_CHAVES){
        chaves.sort((a, b) => padroes.n[a] - padroes.n[b]).slice(0, chaves.length - PADROES_MAX_CHAVES)
          .forEach(k => { delete padroes.n[k]; delete padroes.info[k]; });
      }
      await storage.set('padroes-uso', JSON.stringify(padroes), false);
      await storage.set('padroes-atendimento', JSON.stringify(atendimentoAtual), false);
    }catch(e){ /* sem armazenamento: só não aprende */ }
  }

  // Chamado a cada receita emitida (imprimir, .docx, copiar)
  function registrarAtendimento(){
    const paciente = el('nomePaciente').value.trim();
    if(atendimentoAtual && atendimentoAtual.paciente !== paciente) finalizarAtendimento();
    if(!atendimentoAtual) atendimentoAtual = { paciente, inicio: Date.now(), ignorar: false, conds: {}, extras: {} };
    const at = atendimentoAtual;
    const cond = nome => (at.conds[nome] = at.conds[nome] || { meds: {}, orient: {} });
    Object.entries(selected).forEach(([id, it]) => {
      // receita convertida para pediatria difere do padrão de propósito: não ensina nada
      if(it.convertidoPediatrico) { at.ignorar = true; return; }
      const m = /^cond:(.+):med:(\d+)$/.exec(id);
      if(m) cond(m[1]).meds[m[2]] = { posologia: it.posologiaBase || '', qtde: it.qtde || '' };
      else if(!it.origemCondicao) at.extras[it.nome] = { nome: it.nome, qtde: it.qtde || null, posologia: it.posologiaBase || null, via: it.via || 'Oral', fator: it.fator ?? null };
    });
    Object.entries(selectedOrient).forEach(([id, o]) => {
      const m = /^cond:(.+):or:(\d+)$/.exec(id);
      if(m) cond(m[1]).orient[m[2]] = o.texto;
    });
    savePadroes();
  }

  function chavePadrao(i){
    if(i.tipo === 'E') return `E|${i.cond}|${i.idx}|${i.campo}|${i.valor}`;
    if(i.tipo === 'EO') return `EO|${i.cond}|${i.idx}|${i.valor}`;
    if(i.tipo === 'A') return `A|${i.cond}|${norm(i.item)}`;
    return `${i.tipo}|${i.cond}|${i.idx}`;
  }
  function contar(info){
    const chave = chavePadrao(info);
    padroes.n[chave] = (padroes.n[chave] || 0) + 1;
    padroes.info[chave] = info;
  }

  function finalizarAtendimento(){
    const at = atendimentoAtual;
    atendimentoAtual = null;
    if(!at || at.ignorar){ savePadroes(); return; }
    const conds = Object.keys(at.conds).filter(nome => DATA.condicoes[nome] || customCondicoes[nome]);
    conds.forEach(nome => {
      const eff = getCondEffective(nome);
      const usado = at.conds[nome];
      const emitidos = eff.meds.filter(m => usado.meds[m.idx]).length;
      // só conta "ficou de fora"/"acrescentou" quando a condição foi usada como conjunto
      // (metade ou mais dos itens), não quando se pegou um item avulso dela
      const comoConjunto = eff.meds.length ? emitidos / eff.meds.length >= 0.5 : Object.keys(usado.orient).length > 0;
      if(comoConjunto) padroes.uso[nome] = (padroes.uso[nome] || 0) + 1;
      eff.meds.forEach(m => {
        const e = usado.meds[m.idx];
        if(!e){
          if(comoConjunto) contar({ tipo: 'R', cond: nome, idx: m.idx, item: m.nome });
          return;
        }
        if(e.posologia && e.posologia !== (m.posologia || '')) contar({ tipo: 'E', cond: nome, idx: m.idx, item: m.nome, campo: 'posologia', valor: e.posologia });
        if(e.qtde && e.qtde !== (m.qtde || '')) contar({ tipo: 'E', cond: nome, idx: m.idx, item: m.nome, campo: 'qtde', valor: e.qtde });
      });
      if(!comoConjunto) return;
      eff.orientacoes.forEach(o => {
        const t = usado.orient[o.idx];
        if(t === undefined) contar({ tipo: 'RO', cond: nome, idx: o.idx, item: o.texto });
        else if(t !== o.texto) contar({ tipo: 'EO', cond: nome, idx: o.idx, item: o.texto, valor: t });
      });
      Object.values(at.extras).forEach(x => {
        if(!eff.meds.some(m => norm(m.nome) === norm(x.nome))) contar({ tipo: 'A', cond: nome, item: x.nome, med: x });
      });
    });
    savePadroes();
  }

  // A sugestão ainda vale? (o padrão pode ter mudado depois, à mão ou por outra sugestão)
  function sugestaoAtual(chave){
    const info = padroes.info[chave];
    const n = padroes.n[chave] || 0;
    if(!info || padroes.dispensadas[chave] || n < PADROES_MIN || n < (padroes.adiadas[chave] || 0)) return null;
    const eff = getCondEffective(info.cond);
    const uso = padroes.uso[info.cond] || 0;
    const m = eff.meds.find(x => x.idx === info.idx);
    const o = eff.orientacoes.find(x => x.idx === info.idx);
    if(info.tipo === 'E') return m && m.nome === info.item && (m[info.campo] || '') !== info.valor ? info : null;
    if(info.tipo === 'R') return m && m.nome === info.item && n / Math.max(uso, 1) >= PADROES_FRACAO ? info : null;
    if(info.tipo === 'EO') return o && o.texto === info.item ? info : null;
    if(info.tipo === 'RO') return o && o.texto === info.item && n / Math.max(uso, 1) >= PADROES_FRACAO ? info : null;
    if(info.tipo === 'A') return !eff.meds.some(x => norm(x.nome) === norm(info.item)) && n / Math.max(uso, 1) >= PADROES_FRACAO ? info : null;
    return null;
  }

  function textoSugestao(info, n){
    const c = `<b>${escapeHtml(info.cond)}</b>`, it = `<b>${escapeHtml(info.item)}</b>`;
    const vezes = `${n} ${n === 1 ? 'vez' : 'vezes'}`;
    const curto = t => escapeHtml(t.length > 140 ? t.slice(0, 139) + '…' : t);
    if(info.tipo === 'E') return `Em ${c}, você mudou ${info.campo === 'qtde' ? 'a quantidade' : 'o modo de uso'} de ${it} para “${curto(info.valor)}” ${vezes}.`;
    if(info.tipo === 'R') return `Em ${c}, você tirou ${it} da receita ${vezes}.`;
    if(info.tipo === 'EO') return `Em ${c}, você reescreveu a orientação “${curto(info.item)}” como “${curto(info.valor)}” ${vezes}.`;
    if(info.tipo === 'RO') return `Em ${c}, você tirou a orientação “${curto(info.item)}” ${vezes}.`;
    return `Em ${c}, você acrescentou ${it} ${vezes}.`;
  }
  const ACAO_SUGESTAO = { E: 'Tornar padrão', R: 'Tirar do padrão', EO: 'Tornar padrão', RO: 'Tirar do padrão', A: 'Incluir no padrão' };

  // Até 2 sugestões, só das condições que estão na receita agora
  function renderSugestoesPadroes(bar){
    const condsNaReceita = new Set([
      ...Object.values(selected).map(it => it.origemCondicao).filter(Boolean),
      ...Object.values(selectedOrient).map(o => o.origemCondicao).filter(Boolean)
    ]);
    if(!condsNaReceita.size) return;
    const chaves = Object.keys(padroes.n)
      .filter(k => condsNaReceita.has((padroes.info[k] || {}).cond) && sugestaoAtual(k))
      .sort((a, b) => padroes.n[b] - padroes.n[a]).slice(0, 2);
    chaves.forEach(k => {
      const info = padroes.info[k];
      bar.appendChild(avisoHtml('teal', '&#10022;',
        `<b>Sugestão do seu uso:</b> ${textoSugestao(info, padroes.n[k])}`,
        `<span class="aviso-acoes"><button type="button" data-acao="padrao-aplicar" data-chave="${escapeHtml(k)}">${ACAO_SUGESTAO[info.tipo]}</button>` +
        `<button type="button" class="sec" data-acao="padrao-adiar" data-chave="${escapeHtml(k)}">Agora não</button>` +
        `<button type="button" class="sec" data-acao="padrao-dispensar" data-chave="${escapeHtml(k)}">Não sugerir</button></span>`));
    });
  }

  function itemDeCondicao(m){
    const x = { nome: m.nome, qtde: m.qtde ?? null, posologia: m.posologia ?? null, via: m.via || 'Oral', fator: m.fator ?? null };
    ['max', 'faixas', 'idadeMinMeses', 'pesoMinKg'].forEach(k => { if(m[k] !== undefined) x[k] = m[k]; });
    return x;
  }

  async function aplicarSugestao(chave){
    const info = sugestaoAtual(chave);
    if(!info) return;
    const nome = info.cond;
    if(info.tipo === 'E') setOverrideMed(nome, info.idx, { [info.campo]: info.valor });
    else if(info.tipo === 'R') setOverrideMed(nome, info.idx, { removido: true });
    else if(info.tipo === 'EO') setOverrideOrientacao(nome, info.idx, { texto: info.valor });
    else if(info.tipo === 'RO') setOverrideOrientacao(nome, info.idx, { removido: true });
    else if(info.tipo === 'A'){
      // acrescentar item: a condição passa a ter uma versão sua (como no editor de
      // condições; "Restaurar padrão" no editor volta à original). As edições por
      // índice viram parte dessa versão, e os itens já na receita são renumerados.
      const eff = getCondEffective(nome);
      const novoIdxMed = {}, novoIdxOr = {};
      eff.meds.forEach((m, k) => { novoIdxMed[m.idx] = k; });
      eff.orientacoes.forEach((o, k) => { novoIdxOr[o.idx] = k; });
      customCondicoes[nome] = {
        meds: [...eff.meds.map(itemDeCondicao), itemDeCondicao(info.med)],
        orientacoes: eff.orientacoes.map(o => o.texto)
      };
      delete overrides[nome];
      const renumera = (obj, tipo, mapa) => Object.keys(obj).forEach(id => {
        const m = new RegExp('^cond:' + nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':' + tipo + ':(\\d+)$').exec(id);
        if(!m) return;
        const v = obj[id]; delete obj[id];
        if(mapa[m[1]] !== undefined) obj[`cond:${nome}:${tipo}:${mapa[m[1]]}`] = v;
      });
      renumera(selected, 'med', novoIdxMed);
      renumera(selectedOrient, 'or', novoIdxOr);
      if(atendimentoAtual && atendimentoAtual.conds[nome]){
        const c = atendimentoAtual.conds[nome], meds = {}, orient = {};
        Object.entries(c.meds).forEach(([i, v]) => { if(novoIdxMed[i] !== undefined) meds[novoIdxMed[i]] = v; });
        Object.entries(c.orient).forEach(([i, v]) => { if(novoIdxOr[i] !== undefined) orient[novoIdxOr[i]] = v; });
        atendimentoAtual.conds[nome] = { meds, orient };
      }
      // as outras sugestões desta condição seguem valendo, com a numeração nova
      Object.keys(padroes.n).forEach(k => {
        const i = padroes.info[k];
        if(!i || i.cond !== nome || i.tipo === 'A') return;
        const novo = (i.tipo === 'E' || i.tipo === 'R' ? novoIdxMed : novoIdxOr)[i.idx];
        const n = padroes.n[k], disp = padroes.dispensadas[k], adia = padroes.adiadas[k];
        delete padroes.n[k]; delete padroes.info[k]; delete padroes.dispensadas[k]; delete padroes.adiadas[k];
        if(novo === undefined) return;
        const info2 = Object.assign({}, i, { idx: novo }), k2 = chavePadrao(info2);
        padroes.n[k2] = n; padroes.info[k2] = info2;
        if(disp) padroes.dispensadas[k2] = disp;
        if(adia) padroes.adiadas[k2] = adia;
      });
      await saveCustomCondicoes();
      await saveOverrides();
      populateEditorMedsDatalist();
    }
    padroes.dispensadas[chave] = true;
    await savePadroes();
    renderTudo();
    showToast(`Padrão de ${nome} atualizado (dá para desfazer em "Restaurar original" na lista ou no editor de condições)`);
  }

  // ---------- Histórico de receitas ----------
  function resumoSelecao(){
    const nomes = Object.values(selected).map(it => it.nome);
    return nomes.slice(0, 4).join(', ') + (nomes.length > 4 ? ' +' + (nomes.length - 4) : '');
  }

  function registrarHistorico(tipo){
    if(Object.keys(selected).length === 0 && Object.keys(selectedOrient).length === 0) return;
    const idsAtuais = Object.keys(selected).sort().join('|') + '§' + Object.keys(selectedOrient).sort().join('|');
    // Dedup: mesma receita do mesmo paciente (reimpressão) só atualiza; outro paciente
    // com os mesmos itens, ou receita editada, vira entrada nova
    const pacienteAtual = el('nomePaciente').value.trim();
    const retrato = JSON.stringify([selected, selectedOrient]);
    if(historico.length && historico[0].ids === idsAtuais && (historico[0].paciente || '') === pacienteAtual
       && JSON.stringify([historico[0].selected, historico[0].selectedOrient]) === retrato){
      historico[0].quando = new Date().toISOString();
      historico[0].tipo = tipo;
      historico[0].paciente = el('nomePaciente').value.trim();
    } else {
      historico.unshift({
        quando: new Date().toISOString(),
        tipo,
        ids: idsAtuais,
        paciente: el('nomePaciente').value.trim(),
        peso: el('peso').value || '',
        resumo: resumoSelecao(),
        selected: JSON.parse(JSON.stringify(selected)),
        selectedOrient: JSON.parse(JSON.stringify(selectedOrient))
      });
      historico = historico.slice(0, 15);
    }
    saveHistorico();
    renderHistorico();
    registrarAtendimento();
    // a receita volta para a linha do tempo do cartão no Quadro
    if(PONTE){
      const sep = separacaoAtiva();
      PONTE.emitida({ como: tipo, paciente: el('nomePaciente').value.trim(), itens: Object.values(selected).map(it => it.nome),
        duasVias: sep ? Object.values(sep.duas).map(it => it.nome) : (tipoEfetivo() === 'controle' ? Object.values(selected).map(it => it.nome) : []),
        orientacoes: Object.keys(selectedOrient).length });
    }
  }

  function renderHistorico(filtroPaciente){
    const lista = el('histLista');
    lista.innerHTML = '';
    if(!historico.length){
      lista.innerHTML = '<div class="mini-note">Nenhuma receita gerada ainda. Assim que você imprimir, copiar ou baixar uma, ela aparece aqui.</div>';
      return;
    }
    const f = norm(filtroPaciente || '');
    const itens = f ? historico.filter((h, i) => norm(h.paciente || '').includes(f)).map(h => ({ h, i: historico.indexOf(h) })) : historico.map((h, i) => ({ h, i }));
    if(!itens.length){
      lista.innerHTML = '<div class="mini-note">Nenhuma receita encontrada para esse paciente.</div>';
      return;
    }
    itens.forEach(({ h, i }) => {
      const row = document.createElement('div');
      row.className = 'hist-row';
      const dt = new Date(h.quando);
      const quando = dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
      row.innerHTML = `
        <div class="hist-info">
          <b>${escapeHtml(h.paciente || 'Sem nome')}</b> — ${quando}${h.peso ? ' · ' + escapeHtml(h.peso) + 'kg' : ''}
          <span>${escapeHtml(h.resumo)}</span>
        </div>
      `;
      const btnRe = document.createElement('button');
      btnRe.textContent = 'Reaplicar';
      btnRe.addEventListener('click', () => {
        selected = JSON.parse(JSON.stringify(h.selected));
        selectedOrient = JSON.parse(JSON.stringify(h.selectedOrient));
        el('peso').value = h.peso || '';
        renderTudo();
        showToast('Receita restaurada — confira o nome do paciente');
      });
      const btnDel = document.createElement('button');
      btnDel.className = 'hist-del';
      btnDel.textContent = '×';
      btnDel.title = 'Excluir do histórico';
      btnDel.addEventListener('click', () => {
        historico.splice(i, 1);
        saveHistorico();
        renderHistorico(el('histBuscaPaciente').value);
      });
      row.appendChild(btnRe);
      row.appendChild(btnDel);
      lista.appendChild(row);
    });
  }

  // ---------- Backup: exportar / importar ----------
  async function exportarBackup(){
    const payload = {
      app: 'gerador-receitas',
      versao: 1,
      catalogo: CATALOGO_VERSAO,
      exportadoEm: new Date().toISOString(),
      customMeds, overrides, overridesMedicamentos, usoCondicoes, historico, customCondicoes, padroes,
      medico: { nome: el('medicoNome').value.trim(), crm: el('medicoCrm').value.trim() }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    if(!await salvarArquivo('gerador-receitas-backup-' + new Date().toISOString().slice(0,10) + '.json', blob)) return;
    await storage.set('ultimo-backup', payload.exportadoEm, false);
    atualizarAvisoBackup();
    showToast('Backup exportado');
  }

  // Mostra um aviso discreto quando faz tempo que não se exporta um backup e
  // já existe algo de valor pra perder (catálogo pessoal, condições
  // personalizadas ou histórico) — sem isso, trocar de computador silenciosamente
  // perdia tudo o que só ficava salvo no localStorage daquele navegador.
  async function atualizarAvisoBackup(){
    const nota = el('storageNote');
    const base = PONTE && PONTE.comBanco()
      ? 'Dentro do Quadro, suas edições, catálogo pessoal, padrões e dados do médico ficam salvos na sua conta do Claude e valem em qualquer computador. O histórico de receitas (tem nomes de pacientes) fica só neste aparelho.'
      : 'Suas edições, catálogo pessoal, histórico e dados do médico ficam salvos no armazenamento deste app, neste dispositivo. Exporte um backup antes de trocar de computador.';
    if(PONTE && PONTE.comBanco()){ nota.textContent = base; return; }
    const temAlgoParaPerder = customMeds.length || Object.keys(customCondicoes).length || historico.length || Object.keys(overridesMedicamentos).length;
    if(!temAlgoParaPerder){ nota.textContent = base; return; }
    const r = await storage.get('ultimo-backup', false);
    if(!r || !r.value){
      nota.innerHTML = base + ' <b style="color:var(--amber);">Você ainda não exportou nenhum backup.</b>';
      return;
    }
    const dias = Math.floor((Date.now() - new Date(r.value).getTime()) / 86400000);
    if(dias >= 7){
      nota.innerHTML = base + ` <b style="color:var(--amber);">Já se passaram ${dias} dias desde o último backup — considere exportar de novo.</b>`;
    } else {
      nota.textContent = base;
    }
  }

  async function importarBackup(file){
    try{
      const texto = await file.text();
      const payload = JSON.parse(texto);
      if(payload.app !== 'gerador-receitas'){ showToast('Este arquivo não parece ser um backup do gerador'); return; }
      const nMeds = Array.isArray(payload.customMeds) ? payload.customMeds.length : 0;
      const nCond = payload.customCondicoes && typeof payload.customCondicoes === 'object' ? Object.keys(payload.customCondicoes).length : 0;
      const nHist = Array.isArray(payload.historico) ? payload.historico.length : 0;
      const resumo = `Este backup tem ${nMeds} medicamento(s) pessoal(is), ${nCond} condição(ões) personalizada(s) e ${nHist} receita(s) no histórico.\n\nImportar vai SUBSTITUIR suas edições, catálogo pessoal e histórico atuais. Continuar?`;
      const ok = typeof window.confirm === 'function'
        ? window.confirm(resumo)
        : true;
      if(!ok) return;
      customMeds = Array.isArray(payload.customMeds) ? payload.customMeds : [];
      customCondicoes = payload.customCondicoes && typeof payload.customCondicoes === 'object' ? payload.customCondicoes : {};
      overrides = payload.overrides && typeof payload.overrides === 'object' ? payload.overrides : {};
      migrarChaveConstipacao(overrides);
      migrarIndicesCatalogo(overrides, payload.catalogo);
      overridesMedicamentos = payload.overridesMedicamentos && typeof payload.overridesMedicamentos === 'object' ? payload.overridesMedicamentos : {};
      usoCondicoes = payload.usoCondicoes && typeof payload.usoCondicoes === 'object' ? payload.usoCondicoes : {};
      historico = Array.isArray(payload.historico) ? payload.historico : [];
      if(payload.padroes && typeof payload.padroes === 'object') padroes = Object.assign({ uso: {}, n: {}, info: {}, dispensadas: {}, adiadas: {} }, payload.padroes);
      if(payload.medico){
        el('medicoNome').value = payload.medico.nome || '';
        el('medicoCrm').value = payload.medico.crm || '';
      }
      await saveCustomMeds();
      await saveCustomCondicoes();
      await saveOverrides();
      await saveOverridesMedicamentos();
      await saveUso();
      await saveHistorico();
      await savePadroes();
      await saveMedico();
      populateEditorMedsDatalist();
      renderTudo();
      renderHistorico();
      atualizarAvisoBackup();
      showToast('Backup importado com sucesso');
    }catch(e){
      console.error(e);
      showToast('Não consegui ler este arquivo de backup');
    }
  }

  function atualizarDestaquePeso(){
    el('idadeField').classList.toggle('campo-invalido', el('idade').value.trim() !== '' && idadeAtualMeses() === null);
    const precisa = anySelectedNeedsPeso();
    const pesoPreenchido = el('peso').value.trim() !== '';
    el('pesoField').classList.toggle('peso-necessario', precisa && !pesoPreenchido);
    el('pesoHint').classList.toggle('show', precisa && !pesoPreenchido);
  }

  let convertendoAuto = false;
  function renderTudo(){
    if(separarSempreAtivo() && !separarSuspenso && tipoReceitaAtual() === 'comum' && Object.values(selected).some(precisaDuasVias)){
      document.querySelector('input[name=tipoReceita][value="auto"]').checked = true;
    }
    // Conversão automática (opcional): só com idade informada < 12 anos e peso preenchido
    if(!convertendoAuto && autoPediatriaAtiva() && !autoPedSuspensa){
      const meses = idadeAtualMeses();
      if(meses !== null && meses < 144 && pesoAtualKg() && window.PEDIATRIA.contarConversiveis(Object.entries(selected), meses)){
        convertendoAuto = true;
        let converteu = false;
        try{ converteu = executarConversao(true); } finally { convertendoAuto = false; }
        if(converteu) return;
      }
    }
    renderLista(el('search').value);
    renderReceita();
    renderChips();
    renderAvisos();
    renderCount();
    atualizarDestaquePeso();
  }

  // ---------- Texto puro para copiar ----------
  function gerarTextoPuro(){
    const nomePaciente = el('nomePaciente').value.trim();
    const peso = el('peso').value;
    const itens = Object.values(selected);
    const orientacoes = Object.values(selectedOrient);
    let out = `Paciente: ${nomePaciente || '---'}\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n`;

    const viaOrder = [];
    const grupos = {};
    itens.forEach(it => {
      const via = it.via || 'Outro';
      if(!grupos[via]){ grupos[via] = []; viaOrder.push(via); }
      grupos[via].push(it);
    });

    viaOrder.forEach(via => {
      out += `USO ${via.toUpperCase()}\n`;
      grupos[via].forEach((it, idx) => {
        const posologia = calcDoseItem(it, peso);
        out += `${String(idx+1).padStart(2,'0')}. ${it.nome} ......... ${it.qtde||''}\n${posologia||''}\n\n`;
      });
    });

    if(orientacoes.length){
      out += `ORIENTAÇÕES\n`;
      orientacoes.forEach(o => { out += `${o.espacoAntes ? '\n' : ''}- ${o.texto}\n`; });
    }
    return out;
  }

  // Aviso curto; com acao = { rotulo, fn }, mostra um botão (ex.: Desfazer) por mais tempo
  let toastTimer = null;
  function showToast(msg, acao){
    const t = el('toast');
    t.textContent = msg;
    t.classList.toggle('com-acao', !!acao);
    if(acao){
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = acao.rotulo;
      b.addEventListener('click', () => { t.classList.remove('show'); acao.fn(); });
      t.appendChild(b);
    }
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), acao ? 8000 : 1800);
  }
  // Abre uma janela no topo, com o foco dentro dela (campo principal ou o botão de imprimir);
  // ao fechar, o foco volta para o botão que a abriu
  const quemAbriu = {};
  function mostrarJanela(id, focoId){
    const ov = el(id);
    quemAbriu[id] = document.activeElement;
    ov.classList.add('show');
    const modal = ov.querySelector('.ajuda-modal');
    if(modal) modal.scrollTop = 0;
    const f = focoId && el(focoId);
    if(f){
      f.focus({ preventScroll: true });
      if(f.tagName === 'TEXTAREA'){ try{ f.setSelectionRange(f.value.length, f.value.length); }catch(_){ /* nada */ } }
    }
  }
  document.querySelectorAll('.ajuda-overlay').forEach(ov => new MutationObserver(() => {
    if(!ov.classList.contains('show') && quemAbriu[ov.id]){
      const b = quemAbriu[ov.id]; quemAbriu[ov.id] = null;
      if(b && document.contains(b) && !document.querySelector('.ajuda-overlay.show')) b.focus({ preventScroll: true });
    }
  }).observe(ov, { attributes: true, attributeFilter: ['class'] }));

  // Pergunta dentro do app (o confirm() do navegador pode ser bloqueado dentro do Claude).
  // htmlTexto já vem escapado; botoes: [{ rotulo, valor, primario }]. Esc devolve null.
  function perguntar(htmlTexto, botoes){
    return new Promise(resolve => {
      const ov = document.createElement('div');
      ov.className = 'ajuda-overlay show pergunta-overlay';
      ov.innerHTML = '<div class="ajuda-modal modal-sm" role="alertdialog" aria-modal="true"><div class="ajuda-modal-body"><div class="pergunta-texto"></div><div class="modal-actions"></div></div></div>';
      ov.querySelector('.pergunta-texto').innerHTML = htmlTexto;
      const fim = v => { document.removeEventListener('keydown', tecla, true); ov.remove(); resolve(v); };
      const tecla = e => { if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); fim(null); } };
      document.addEventListener('keydown', tecla, true);
      const acoes = ov.querySelector('.modal-actions');
      botoes.forEach(b => {
        const bt = document.createElement('button');
        bt.type = 'button'; bt.className = 'btn ' + (b.primario ? 'btn-primary' : 'btn-outline'); bt.textContent = b.rotulo;
        bt.addEventListener('click', () => fim(b.valor));
        acoes.appendChild(bt);
      });
      document.body.appendChild(ov);
      const prim = acoes.querySelector('.btn-primary') || acoes.querySelector('button');
      if(prim) prim.focus();
    });
  }
  // Antes de imprimir ou baixar: o que sairia errado no papel. "Preencher" leva ao campo;
  // "Imprimir assim mesmo" segue (para o médico em branco, não pergunta de novo nesta visita).
  let semMedicoAceito = false;
  async function conferirAntesDeEmitir(){
    if(!Object.keys(selected).length && !Object.keys(selectedOrient).length){ showToast('A receita está vazia'); return false; }
    if(window.__semConferir) return true;   // testes automáticos que não tratam da checagem
    const falta = [];
    const porPeso = Object.values(selected).filter(it => itemPorPeso(it)).length;
    if(porPeso && !pesoAtualKg()) falta.push({ txt: `o <b>peso</b> (${porPeso} ${porPeso === 1 ? 'item' : 'itens'} com dose por kg)`, campo: 'peso' });
    else if(/\bDOSE\b/.test(el('receitaPaper').innerText)) falta.push({ txt: 'a <b>dose</b> de um item (a palavra DOSE sairia no papel)', campo: null });
    if(!el('nomePaciente').value.trim()) falta.push({ txt: 'o <b>nome do paciente</b>', campo: 'nomePaciente' });
    if(!semMedicoAceito && !el('medicoNome').value.trim()) falta.push({ txt: 'o <b>seu nome e CRM</b> (Dados do médico)', campo: 'medicoNome', medico: true });
    if(!falta.length) return true;
    const r = await perguntar('<b>Antes de imprimir, falta:</b><ul>' + falta.map(f => '<li>' + f.txt + '</li>').join('') + '</ul>',
      [{ rotulo: 'Imprimir assim mesmo', valor: 'segue' }, { rotulo: 'Preencher', valor: 'preencher', primario: true }]);
    if(r === 'segue'){ if(falta.some(f => f.medico)) semMedicoAceito = true; return true; }
    if(r === 'preencher'){
      const f = falta.find(x => x.campo);
      if(f){
        if(f.campo === 'medicoNome') el('medicoDetails').open = true;
        el(f.campo).scrollIntoView({ block: 'center' }); el(f.campo).focus();
      }
    }
    return false;
  }
  // Atestado e encaminhamento: marcadores "(nome do …)" que ficaram no texto
  async function conferirDocumento(texto, campoNome){
    if(window.__semConferir) return true;
    const marcas = [...new Set((String(texto).match(/\((?:nome do (?:m[eé]dico|paciente)|diagn[oó]stico|nenhum medicamento[^)]*)\)/gi) || []))];
    if(!marcas.length) return true;
    const r = await perguntar('<b>O texto ainda tem marcadores para preencher:</b><ul>' + marcas.map(m => '<li>' + escapeHtml(m) + '</li>').join('') + '</ul>',
      [{ rotulo: 'Imprimir assim mesmo', valor: 'segue' }, { rotulo: 'Voltar e editar', valor: 'editar', primario: true }]);
    if(r === 'segue') return true;
    if(/nome do paciente/i.test(marcas.join(' ')) && campoNome && !campoNome.value.trim()) campoNome.focus();
    else if(/nome do m/i.test(marcas.join(' '))){ el('medicoDetails').open = true; }
    return false;
  }

  // Retrato da receita na tela, para desfazer "Nova receita", "Mesmo paciente" e o ×
  function retratoReceita(){
    return { selected: JSON.parse(JSON.stringify(selected)), selectedOrient: JSON.parse(JSON.stringify(selectedOrient)),
      conversaoPed: conversaoPed && JSON.parse(JSON.stringify(conversaoPed)), nome: el('nomePaciente').value, idade: el('idade').value,
      peso: el('peso').value, pacienteQuadro, encRascunhoPaciente, atRascunhoPaciente };
  }
  function voltarRetrato(r){
    selected = r.selected; selectedOrient = r.selectedOrient; conversaoPed = r.conversaoPed;
    el('nomePaciente').value = r.nome; el('idade').value = r.idade; el('peso').value = r.peso;
    pacienteQuadro = r.pacienteQuadro; encRascunhoPaciente = r.encRascunhoPaciente; atRascunhoPaciente = r.atRascunhoPaciente;
    renderTudo(); atualizarDestaquePeso();
    showToast('Receita de volta');
  }

  async function copiarTexto(){
    const sep = separacaoAtiva();
    const texto = sep
      ? comSelecao(sep.comum, sep.orientComum, gerarTextoPuro) + '\n— RECEITA EM 2 VIAS (CONTROLE ESPECIAL) —\n' + comSelecao(sep.duas, sep.orientDuas, gerarTextoPuro)
      : gerarTextoPuro();
    try{
      await navigator.clipboard.writeText(texto);
      showToast('Texto copiado');
      return true;
    }catch(e){
      // fallback
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try{ ok = document.execCommand('copy'); }catch(e2){ ok = false; }
      document.body.removeChild(ta);
      showToast(ok ? 'Texto copiado' : 'Não consegui copiar automaticamente — selecione o texto manualmente');
      return ok;
    }
  }

  // ---------- Dados do médico (persistidos localmente) ----------
  async function loadMedico(){
    try{
      const r = await storage.get('medico-info', false);
      const info = r && r.value ? JSON.parse(r.value) : null;
      el('medicoNome').value = info && info.nome ? info.nome : '';
      el('medicoCrm').value = info && info.crm ? info.crm : '';
    }catch(e){
      el('medicoNome').value = '';
      el('medicoCrm').value = '';
    }
  }
  async function saveMedico(){
    try{
      await storage.set('medico-info', JSON.stringify({ nome: el('medicoNome').value.trim(), crm: el('medicoCrm').value.trim() }), false);
    }catch(e){ console.error('Falha ao salvar dados do médico', e); }
  }

  // ---------- Local (Carmo do Paranaíba / Patos de Minas / Rio Paranaíba), persistido localmente ----------
  async function loadLocal(){
    try{
      const r = await storage.get('local-receita', false);
      const val = r && r.value ? r.value : 'carmo';
      const radio = document.querySelector('input[name=localReceita][value="'+val+'"]');
      if(radio) radio.checked = true;
    }catch(e){ /* mantém padrão Carmo já marcado no HTML */ }
  }
  async function saveLocal(){
    try{ await storage.set('local-receita', localAtual(), false); }catch(e){ console.error('Falha ao salvar local', e); }
  }

  // ---------- Unidade de Saúde (local de trabalho atual), persistida localmente ----------
  async function loadUnidade(){
    try{
      const r = await storage.get('unidade-saude', false);
      el('unidadeSaude').value = r && r.value ? r.value : '';
    }catch(e){ el('unidadeSaude').value = ''; }
  }
  async function saveUnidade(){
    try{ await storage.set('unidade-saude', el('unidadeSaude').value.trim(), false); }catch(e){ console.error('Falha ao salvar unidade', e); }
  }

  // ---------- Coleta os dados atuais para geração do .docx ----------
  function coletarDadosReceita(){
    const peso = el('peso').value;
    const itens = Object.values(selected);
    const orientacoes = Object.values(selectedOrient).map(o => ({ texto: o.texto, espacoAntes: !!o.espacoAntes }));

    const viaOrder = [];
    const grupos = {};
    itens.forEach(it => {
      const via = it.via || 'Outro';
      if(!grupos[via]){ grupos[via] = []; viaOrder.push(via); }
      grupos[via].push({
        nome: it.nome,
        qtde: it.qtde || '',
        posologia: calcDoseItem(it, peso) || ''
      });
    });

    return {
      paciente: el('nomePaciente').value.trim() || '—',
      data: new Date().toLocaleDateString('pt-BR'),
      medico: { nome: el('medicoNome').value.trim(), crm: el('medicoCrm').value.trim() },
      unidade: (el('unidadeSaude') && el('unidadeSaude').value.trim()) || '',
      grupos: viaOrder.map(via => ({ via, itens: grupos[via] })),
      orientacoes
    };
  }

  function base64ParaBytes(b64){
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function paragrafosMedicamento(item){
    const { Paragraph, TextRun, PositionalTab, PositionalTabAlignment, PositionalTabLeader } = docx;
    return [
      new Paragraph({
        spacing: { before: 160, after: 20 },
        children: [
          new TextRun({ text: item.nome, bold: true }),
          new TextRun({ children: [new PositionalTab({ alignment: PositionalTabAlignment.RIGHT, leader: PositionalTabLeader.DOT })] }),
          new TextRun({ text: item.qtde || '' })
        ]
      }),
      new Paragraph({
        spacing: { after: 40 },
        children: [ new TextRun({ text: item.posologia || '', size: 20, color: '444444' }) ]
      })
    ];
  }

  function blocoReceitaDocx(dados){
    const { Paragraph, TextRun } = docx;
    const paras = [];
    dados.grupos.forEach(g => {
      paras.push(new Paragraph({
        spacing: { before: 200, after: 60 },
        children: [ new TextRun({ text: 'USO ' + g.via.toUpperCase(), bold: true, size: 20 }) ]
      }));
      g.itens.forEach(item => paras.push(...paragrafosMedicamento(item)));
    });
    if(dados.orientacoes && dados.orientacoes.length){
      paras.push(new Paragraph({
        spacing: { before: 220, after: 60 },
        children: [ new TextRun({ text: 'ORIENTAÇÕES', bold: true, size: 20 }) ]
      }));
      // cada linha do texto vira uma quebra de linha no mesmo item; espacoAntes abre um parágrafo
      dados.orientacoes.forEach(o => {
        paras.push(new Paragraph({
          bullet: { level: 0 },
          ...(o.espacoAntes ? { spacing: { before: 200 } } : {}),
          children: String(o.texto).split('\n').map((linha, i) => new TextRun({ text: linha, size: 20, ...(i ? { break: 1 } : {}) }))
        }));
      });
    }
    return paras;
  }

  const montarDocx = (soSecoes, opcoes) => soSecoes ? opcoes : new docx.Document(opcoes);

  function gerarDocComum(dados, soSecoes){
    const { Document, Paragraph, TextRun, AlignmentType, ImageRun, BorderStyle } = docx;
    const muni = municipioDoLocal(localAtual());
    const brasao = muni && muni.brasao();
    const cabecalho = muni ? [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          ...(brasao ? [
            new ImageRun({ data: base64ParaBytes(brasao), transformation: (() => { const d = dimensoesPng(brasao); return { width: Math.round(61 * d.w / d.h), height: 61 }; })(), type: 'png' }),
            new TextRun({ text: '   ' })
          ] : []),
          new ImageRun({ data: base64ParaBytes(LOGO_SUS_B64), transformation: { width: 46, height: 24 }, type: 'png' })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [ new TextRun({ text: muni.prefeituraDocx, bold: true, size: 20, color: '666666' }) ]
      })
    ] : [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [ new ImageRun({ data: base64ParaBytes(LOGO_COMUM_B64), transformation: { width: 70, height: 29 }, type: 'png' }) ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [ new TextRun({ text: 'PREFEITURA MUNICIPAL DO CARMO DO PARANAÍBA', bold: true, size: 20, color: '666666' }) ]
      })
    ];
    return montarDocx(soSecoes, {
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 } } },
        children: [
          ...cabecalho,
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [ new TextRun({ text: 'RECEITA MÉDICA', bold: true, size: 28 }) ]
          }),
          new Paragraph({
            spacing: { after: 200 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
            children: [ new TextRun({ text: 'Paciente: ', bold: true }), new TextRun({ text: dados.paciente }) ]
          }),
          ...blocoReceitaDocx(dados),
          new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: '000000' } },
            children: [ new TextRun({ text: ' '.repeat(60) }) ]
          }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: 'Data: ' + dados.data }) ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [ new TextRun({ text: dados.medico.nome }) ] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [ new TextRun({ text: dados.medico.crm }) ] })
        ]
      }]
    });
  }

  function celulaDocx(texto, opts={}){
    const { TableCell, WidthType, VerticalAlign, Paragraph, TextRun, ShadingType } = docx;
    const linhas = texto.split('\n');
    return new TableCell({
      width: { size: opts.width || 50, type: WidthType.PERCENTAGE },
      columnSpan: opts.colSpan,
      verticalAlign: VerticalAlign.CENTER,
      shading: opts.shaded ? { type: ShadingType.CLEAR, fill: 'EFEFEF' } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: linhas.map(l => new Paragraph({ children: [ new TextRun({ text: l, bold: opts.bold, size: opts.size || 18 }) ] }))
    });
  }

  function blocoViaDocx(dados, viaLabel){
    const { Table, TableRow, WidthType, Paragraph, ImageRun } = docx;
    const unidade = dados.unidade || 'Rua São Vicente, S/N – Bairro JK';
    const rows = [];
    rows.push(new TableRow({ children: [
      celulaDocx('Prefeitura de Carmo do Paranaíba\n' + unidade, { width: 55, bold: true }),
      celulaDocx(viaLabel, { width: 45, bold: true, shaded: true })
    ]}));
    rows.push(new TableRow({ children: [
      celulaDocx('RECEITUÁRIO DE CONTROLE ESPECIAL', { colSpan: 2, bold: true, size: 20 })
    ]}));
    rows.push(new TableRow({ children: [
      celulaDocx('Nome completo: ' + dados.paciente, { colSpan: 2 })
    ]}));

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [5500, 4500],
      rows
    });

    const receitaParas = blocoReceitaDocx(dados);
    const dataPar = new Paragraph({ spacing: { before: 120 }, children: [ new docx.TextRun({ text: 'Data: ' + dados.data }) ] });

    const rodapeTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [5000, 5000],
      rows: [
        new TableRow({ children: [
          celulaDocx('Identificação do comprador\nNome:\nIdent.:                    Órgão emissor:\nEndereço:\nCidade:                     Estado:\nTelefone:', { width: 50, size: 16 }),
          celulaDocx('Identificação do fornecedor\n\n\n_______________________________\nAssinatura do farmacêutico        Data', { width: 50, size: 16 })
        ]})
      ]
    });

    return [ table, new Paragraph({ spacing: { before: 100 } }), ...receitaParas, dataPar, new Paragraph({ spacing: { before: 200 } }), rodapeTable ];
  }

  function gerarDocControleEspecial(dados, soSecoes){
    const { Document, Table, TableRow, TableCell, WidthType, VerticalAlign } = docx;
    const via1 = blocoViaDocx(dados, '1ª VIA FARMÁCIA');
    const via2 = blocoViaDocx(dados, '2ª VIA PACIENTE');

    const masterTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [7900, 7900],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 0, left: 80, right: 120 },
              children: via1
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 0, left: 120, right: 80 },
              children: via2
            })
          ]
        })
      ]
    });

    return montarDocx(soSecoes, {
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838, orientation: 'landscape' } } },
        children: [ masterTable ]
      }]
    });
  }

  // ---------- Modelo município (Patos de Minas, Rio Paranaíba): Receituário de Controle Especial (2 vias) ----------
  function blocoViaDocxMunicipio(muni, dados, viaLabel){
    const { Table, TableRow, WidthType, Paragraph } = docx;
    const unidade = dados.unidade || muni.unidadePadrao;
    const rows = [];
    rows.push(new TableRow({ children: [
      celulaDocx(muni.prefeitura + '\n' + unidade, { width: 55, bold: true }),
      celulaDocx(viaLabel, { width: 45, bold: true, shaded: true })
    ]}));
    rows.push(new TableRow({ children: [
      celulaDocx('RECEITUÁRIO DE CONTROLE ESPECIAL', { colSpan: 2, bold: true, size: 20 })
    ]}));
    rows.push(new TableRow({ children: [
      celulaDocx('Nome completo: ' + dados.paciente, { colSpan: 2 })
    ]}));

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [5500, 4500],
      rows
    });

    const receitaParas = blocoReceitaDocx(dados);
    const dataPar = new Paragraph({ spacing: { before: 120 }, children: [ new docx.TextRun({ text: 'Data: ' + dados.data }) ] });

    const rodapeTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [5000, 5000],
      rows: [
        new TableRow({ children: [
          celulaDocx('Identificação do comprador\nNome:\nIdent.:                    Órgão emissor:\nEndereço:\nCidade:                     Estado:\nTelefone:', { width: 50, size: 16 }),
          celulaDocx(['Identificação do fornecedor', ...(muni.fornecedor.length ? muni.fornecedor : ['']), '', '_______________________________', 'Assinatura do farmacêutico        Data'].join('\n'), { width: 50, size: 16 })
        ]})
      ]
    });

    return [ table, new Paragraph({ spacing: { before: 100 } }), ...receitaParas, dataPar, new Paragraph({ spacing: { before: 200 } }), rodapeTable ];
  }

  function gerarDocControleEspecialMunicipio(muni, dados, soSecoes){
    const { Document, Table, TableRow, TableCell, WidthType, VerticalAlign } = docx;
    const via1 = blocoViaDocxMunicipio(muni, dados, '1ª VIA FARMÁCIA');
    const via2 = blocoViaDocxMunicipio(muni, dados, '2ª VIA PACIENTE');

    const masterTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [7900, 7900],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 0, left: 80, right: 120 },
              children: via1
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 0, left: 120, right: 80 },
              children: via2
            })
          ]
        })
      ]
    });

    return montarDocx(soSecoes, {
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838, orientation: 'landscape' } } },
        children: [ masterTable ]
      }]
    });
  }

  // A biblioteca docx.js (~400KB minificados) mora em js/docx-lib.js, num
  // arquivo à parte — só é baixada e executada na primeira vez que o usuário
  // pede o .docx, já que a maioria das receitas é impressa ou copiada, nunca
  // exportada nesse formato.
  let docxCarregando = null;
  function garantirDocxCarregado(){
    if(typeof docx !== 'undefined') return Promise.resolve();
    if(docxCarregando) return docxCarregando;
    docxCarregando = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'js/docx-lib.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar js/docx-lib.js'));
      document.head.appendChild(script);
    });
    return docxCarregando;
  }

  async function baixarDocx(){
    if(Object.keys(selected).length === 0 && Object.keys(selectedOrient).length === 0){
      showToast('Selecione ao menos um item antes de gerar o arquivo');
      return;
    }
    const dados = coletarDadosReceita();
    const tipo = tipoEfetivo();
    const sep = separacaoAtiva();
    try{
      await garantirDocxCarregado();
      const muni = municipioDoLocal(localAtual());
      const docControle = (d, soSecoes) => muni ? gerarDocControleEspecialMunicipio(muni, d, soSecoes) : gerarDocControleEspecial(d, soSecoes);
      // separada: um arquivo só, com a receita comum (retrato) e as 2 vias (paisagem)
      const doc = sep
        ? new docx.Document({ sections: [
            ...gerarDocComum(comSelecao(sep.comum, sep.orientComum, coletarDadosReceita), true).sections,
            ...docControle(comSelecao(sep.duas, sep.orientDuas, coletarDadosReceita), true).sections
          ] })
        : tipo === 'controle' ? docControle(dados) : gerarDocComum(dados);
      const blob = await docx.Packer.toBlob(doc);
      const nomeArquivo = 'Receita - ' + (dados.paciente !== '—' ? dados.paciente : 'paciente') + ' - ' + dados.data.replace(/\//g,'-') + '.docx';
      if(await salvarArquivo(nomeArquivo, blob)){ showToast('Arquivo .docx gerado'); return true; }
      showToast('O arquivo .docx não foi salvo');
      return false;
    }catch(e){
      console.error(e);
      showToast('Erro ao gerar o .docx — veja o console para detalhes');
      return false;
    }
  }

  // ---------- Eventos ----------
  // Pequeno debounce na busca — evita reconstruir a lista inteira a cada
  // tecla quando o usuário digita rápido.
  let buscaDebounceId = null;
  el('search').addEventListener('input', () => {
    el('searchWrap').classList.toggle('has-text', el('search').value.length > 0);
    clearTimeout(buscaDebounceId);
    buscaDebounceId = setTimeout(() => renderLista(el('search').value), 120);
  });
  el('searchClear').addEventListener('click', () => {
    el('search').value = '';
    el('searchWrap').classList.remove('has-text');
    renderLista('');
    el('search').focus();
  });
  el('search').addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      el('search').value = '';
      el('searchWrap').classList.remove('has-text');
      renderLista('');
    }
    if(e.key === 'Enter'){
      e.preventDefault();
      const f = el('search').value;
      if(!f.trim()) return;
      // nome de condição (ou sintoma) → condição; senão, nome de remédio → o remédio avulso
      // (não a condição inteira que o contém)
      const conds = buscarCondicoes(f);
      const cond = conds.find(nome => pontoCondicao(nome, f) >= 3);
      const med = buscarAvulsos(f)[0];
      if(cond){
        if(condicaoSelectionState(cond) !== 'all'){
          toggleCondicaoInteira(cond, true);
          showToast('"' + cond + '" adicionada à receita');
        } else showToast('"' + cond + '" já está na receita');
      } else if(med){
        if(!selected[avulsoId(med)]){
          toggleMedAvulso(med, true);
          showToast('"' + [med.nome, med.concentracao].filter(Boolean).join(' ') + '" adicionado à receita');
        } else showToast('Já está na receita');
      } else if(conds.length){
        if(condicaoSelectionState(conds[0]) !== 'all'){ toggleCondicaoInteira(conds[0], true); showToast('"' + conds[0] + '" adicionada à receita'); }
      }
    }
  });
  // Atalho "/" foca a busca de qualquer lugar
  const modalAberto = () => document.querySelector('.ajuda-overlay.show');
  document.addEventListener('keydown', (e) => {
    if(e.key === '/' && !modalAberto() && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){
      e.preventDefault();
      el('search').focus();
    }
  });
  // Atalhos: 1-9 (N-ésima condição de "mais usadas"), Ctrl/Cmd+Enter (nova receita;
  // com Shift, mesmo paciente) e Ctrl/Cmd+P (imprimir). Com uma janela aberta,
  // Ctrl+Enter salva/imprime a janela e Ctrl+P imprime o documento dela.
  document.addEventListener('keydown', (e) => {
    const emCampoDeTexto = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
    const modal = modalAberto();
    const ctrl = e.ctrlKey || e.metaKey;
    if(modal){
      const acao = { editItemOverlay: 'btnSaveEditItem', atestadoOverlay: 'btnImprimirAtestado', encaminhamentoOverlay: 'btnImprimirEncaminhamento' }[modal.id];
      if(ctrl && acao && (e.key === 'Enter' || (e.key.toLowerCase() === 'p' && modal.id !== 'editItemOverlay'))){ e.preventDefault(); el(acao).click(); }
      return;
    }
    if(!emCampoDeTexto && !ctrl && !e.altKey && /^[1-9]$/.test(e.key)){
      const chips = [...el('chipsMaisUsadas').querySelectorAll('.chip')];
      const chip = chips[Number(e.key) - 1];
      if(chip){ e.preventDefault(); chip.click(); }
    }
    if(ctrl && e.key.toLowerCase() === 'p' && !e.shiftKey){ e.preventDefault(); el('btnImprimir').click(); return; }
    if(ctrl && e.key === 'Enter'){
      // digitando no nome/idade/peso: Ctrl+Enter não apaga o que está sendo escrito
      if(emCampoDeTexto && document.activeElement.id !== 'search') return;
      e.preventDefault();
      el(e.shiftKey ? 'btnMesmoPaciente' : 'btnLimpar').click();
    }
  });

  // Trocar o item de lado (2 vias × comum) em "Separar sozinho"
  el('receitaPaper').addEventListener('click', (e) => {
    const btn = e.target.closest('.vias-item');
    if(!btn || !selected[btn.dataset.sel]) return;
    selected[btn.dataset.sel].vias2 = !precisaDuasVias(selected[btn.dataset.sel]);
    renderTudo();
  });

  // Espaço de parágrafo antes de uma orientação (botão ¶ na prévia)
  el('receitaPaper').addEventListener('click', (e) => {
    const btn = e.target.closest('.par-item');
    if(!btn || !selectedOrient[btn.dataset.orient]) return;
    selectedOrient[btn.dataset.orient].espacoAntes = !selectedOrient[btn.dataset.orient].espacoAntes;
    renderTudo();
  });

  // Remoção de itens direto pelo papel da receita (delegação)
  el('receitaPaper').addEventListener('click', (e) => {
    const btn = e.target.closest('.rm-item');
    if(!btn) return;
    const antes = retratoReceita();
    const nomeItem = btn.dataset.sel ? (selected[btn.dataset.sel] || {}).nome : 'Orientação';
    if(btn.dataset.sel){ delete selected[btn.dataset.sel]; }
    if(btn.dataset.orient){ delete selectedOrient[btn.dataset.orient]; }
    renderTudo();
    showToast((nomeItem || 'Item') + ' removido', { rotulo: 'Desfazer', fn: () => voltarRetrato(antes) });
  });

  // Edição de itens direto pelo papel da receita (delegação)
  el('receitaPaper').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-item-btn');
    if(!editBtn) return;
    
    const overlay = el('editItemOverlay');
    const title = el('editItemTitle');
    const nomeField = el('editItemNomeField');
    const medsGrid = el('editItemMedsGrid');
    const posLabel = el('editItemPosologiaLabel');
    
    const inputNome = el('editItemNome');
    const inputQtde = el('editItemQtde');
    const selectVia = el('editItemVia');
    const inputFator = el('editItemFator');
    const textareaPos = el('editItemPosologia');
    const inputId = el('editItemId');
    
    if(editBtn.dataset.sel){
      const id = editBtn.dataset.sel;
      const item = selected[id];
      if(!item) return;
      
      title.textContent = 'Editar Medicamento';
      nomeField.style.display = 'block';
      medsGrid.style.display = 'grid';
      posLabel.textContent = 'Posologia / Modo de Uso';
      
      inputNome.value = item.nome || '';
      inputQtde.value = item.qtde || '';
      selectVia.innerHTML = renderViaOptions(item.via || 'Oral');
      inputFator.value = item.fator !== null && item.fator !== undefined ? item.fator : '';
      textareaPos.value = item.posologiaBase || '';
      inputId.value = id;
    } else if(editBtn.dataset.orient){
      const id = editBtn.dataset.orient;
      const item = selectedOrient[id];
      if(!item) return;
      
      title.textContent = 'Editar Orientação';
      nomeField.style.display = 'none';
      medsGrid.style.display = 'none';
      posLabel.textContent = 'Texto da Orientação';
      
      inputNome.value = '';
      inputQtde.value = '';
      selectVia.innerHTML = renderViaOptions('Oral');
      inputFator.value = '';
      textareaPos.value = item.texto || '';
      inputId.value = id;
    }
    
    mostrarJanela('editItemOverlay', 'editItemPosologia');
    overlay.dataset.valoresIniciais = valoresDoFormulario(overlay);
  });

  // Modal de Edição de Itens da Prescrição
  const closeEditModal = () => el('editItemOverlay').classList.remove('show');
  el('btnFecharEditItem').addEventListener('click', closeEditModal);
  el('btnCancelEditItem').addEventListener('click', closeEditModal);
  // Clicar fora não fecha (perdia a edição); Esc só fecha direto se nada mudou
  document.addEventListener('keydown', (e) => {
    const ov = el('editItemOverlay');
    if(e.key === 'Escape' && ov.classList.contains('show')){
      const mudou = valoresDoFormulario(ov) !== ov.dataset.valoresIniciais;
      if(!mudou || window.confirm('Fechar sem salvar? A edição deste item será perdida.')) closeEditModal();
    }
  });

  el('btnSaveEditItem').addEventListener('click', () => {
    const id = el('editItemId').value;
    
    const nome = el('editItemNome').value.trim();
    const qtde = el('editItemQtde').value.trim();
    const via = el('editItemVia').value;
    const fatorTxt = el('editItemFator').value.trim();
    const posologia = el('editItemPosologia').value.trim();
    const fator = parseFator(fatorTxt);
    
    if(selectedOrient[id]){
      if(!posologia){
        showToast('O texto da orientação não pode ficar vazio');
        return;
      }
      selectedOrient[id].texto = posologia;
    } else if(selected[id]){
      if(!nome){
        showToast('O nome do medicamento não pode ficar vazio');
        return;
      }
      if(selected[id].nome !== nome || selected[id].fator !== fator){ delete selected[id].max; delete selected[id].faixas; }
      if(selected[id].nome !== nome){ delete selected[id].idadeMinMeses; delete selected[id].pesoMinKg; }
      selected[id].nome = nome;
      selected[id].qtde = qtde || null;
      selected[id].via = via;
      selected[id].fator = fator;
      selected[id].posologiaBase = posologia || null;
    }
    
    closeEditModal();
    renderTudo();
    showToast('Prescrição atualizada');
  });

  // Backup
  el('btnExport').addEventListener('click', exportarBackup);
  el('btnImport').addEventListener('click', () => el('importFile').click());
  el('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) importarBackup(file);
    e.target.value = '';
  });

  // Ajuda
  el('btnAjuda').addEventListener('click', () => {
    el('ajudaOverlay').classList.add('show');
  });
  el('btnFecharAjuda').addEventListener('click', () => {
    el('ajudaOverlay').classList.remove('show');
  });
  el('ajudaOverlay').addEventListener('click', (e) => {
    if(e.target.id === 'ajudaOverlay') el('ajudaOverlay').classList.remove('show');
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && el('ajudaOverlay').classList.contains('show')){
      el('ajudaOverlay').classList.remove('show');
    }
  });

  // Tema: automático (segue o sistema) → claro → escuro. A receita impressa é sempre clara.
  const TEMAS = ['auto', 'claro', 'escuro'];
  const TEMA_ROTULO = { auto: 'automático', claro: 'claro', escuro: 'escuro' };
  function aplicarTema(pref){
    const root = document.documentElement;
    root.setAttribute('data-tema-pref', pref);
    if(pref === 'claro') root.setAttribute('data-theme', 'light');
    else if(pref === 'escuro') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    const rotulo = 'Tema: ' + TEMA_ROTULO[pref] + ' (clique para alternar)';
    el('btnTema').title = rotulo;
    el('btnTema').setAttribute('aria-label', rotulo);
  }
  aplicarTema(TEMAS.includes(document.documentElement.getAttribute('data-tema-pref')) ? document.documentElement.getAttribute('data-tema-pref') : 'auto');
  el('btnTema').addEventListener('click', () => {
    const atual = document.documentElement.getAttribute('data-tema-pref');
    const prox = TEMAS[(TEMAS.indexOf(atual) + 1) % TEMAS.length];
    aplicarTema(prox);
    try{
      if(prox === 'auto') localStorage.removeItem('tema'); else localStorage.setItem('tema', prox);
    }catch(e){ /* sem armazenamento: vale só nesta sessão */ }
    showToast('Tema ' + TEMA_ROTULO[prox]);
  });

  // Histórico
  el('btnLimparHist').addEventListener('click', () => {
    historico = [];
    saveHistorico();
    renderHistorico();
    showToast('Histórico limpo');
  });
  el('histBuscaPaciente').addEventListener('input', () => {
    renderHistorico(el('histBuscaPaciente').value);
  });

  el('nomePaciente').addEventListener('input', renderReceita);
  let pacienteDebounceId = null;
  const aoMudarPesoOuIdade = () => {
    renderReceita(); atualizarDestaquePeso();
    clearTimeout(pacienteDebounceId);
    pacienteDebounceId = setTimeout(renderTudo, 400); // espera terminar de digitar ("2" → "25")
  };
  el('peso').addEventListener('input', aoMudarPesoOuIdade);
  el('idade').addEventListener('input', aoMudarPesoOuIdade);
  document.querySelectorAll('input[name=tipoReceita]').forEach(r => r.addEventListener('change', () => {
    if(tipoReceitaAtual() !== 'auto') separarSuspenso = true;   // escolheu o tipo à mão: não separa sozinho
    renderTudo();
  }));
  document.querySelectorAll('input[name=localReceita]').forEach(r => r.addEventListener('change', () => { saveLocal(); renderReceita(); }));
  // só conta como emitida (histórico, padrões, cartão do Quadro) a receita que de fato saiu
  el('btnCopiar').addEventListener('click', async () => { if(await copiarTexto()) registrarHistorico('copiado'); });
  el('btnDocx').addEventListener('click', async () => { if(await baixarDocx()) registrarHistorico('docx'); });

  // Encaminhamento
  el('btnEncaminhamento').addEventListener('click', abrirEncaminhamento);
  // Clicar fora da janela não fecha (fechava sem querer e perdia o texto); fechar guarda o rascunho
  const closeEncaminhamentoModal = () => {
    encRascunhoPaciente = el('nomePaciente').value.trim();
    el('encaminhamentoOverlay').classList.remove('show');
  };
  el('btnFecharEncaminhamento').addEventListener('click', closeEncaminhamentoModal);
  el('encTexto').addEventListener('input', () => { encTextoEditado = true; el('btnRecomecarEncaminhamento').hidden = false; });
  el('btnRecomecarEncaminhamento').addEventListener('click', () => { encTextoEditado = false; atualizarPreviaEncaminhamento(); });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && el('encaminhamentoOverlay').classList.contains('show')){
      closeEncaminhamentoModal();
    }
  });
  el('encNomePaciente').addEventListener('input', atualizarPreviaEncaminhamento);
  el('encCondicao').addEventListener('change', () => {
    el('encCondicaoOutraField').style.display = el('encCondicao').value === '__outra__' ? '' : 'none';
    atualizarPreviaEncaminhamento();
  });
  el('encCondicaoOutra').addEventListener('input', atualizarPreviaEncaminhamento);
  el('btnCopiarEncaminhamento').addEventListener('click', copiarEncaminhamento);
  el('btnImprimirEncaminhamento').addEventListener('click', imprimirEncaminhamento);

  // Atestado
  el('btnAtestado').addEventListener('click', abrirAtestado);
  const closeAtestadoModal = () => {
    atRascunhoPaciente = el('nomePaciente').value.trim();
    el('atestadoOverlay').classList.remove('show');
  };
  el('btnFecharAtestado').addEventListener('click', closeAtestadoModal);
  el('atTexto').addEventListener('input', () => { atTextoEditado = true; el('btnRecomecarAtestado').hidden = false; });
  el('btnRecomecarAtestado').addEventListener('click', () => { atTextoEditado = false; atualizarPreviaAtestado(); });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && el('atestadoOverlay').classList.contains('show')) closeAtestadoModal();
  });
  ['atNomePaciente', 'atDocumento', 'atAcompanhante', 'atData', 'atHora', 'atHoraInicio', 'atHoraFim', 'atDias', 'atInicio', 'atCid']
    .forEach(id => el(id).addEventListener('input', atualizarPreviaAtestado));
  el('atCidAutorizado').addEventListener('change', atualizarPreviaAtestado);
  document.querySelectorAll('input[name=atTipo]').forEach(r => r.addEventListener('change', atualizarPreviaAtestado));
  document.querySelectorAll('.at-dias-rapidos button').forEach(b => b.addEventListener('click', () => {
    el('atDias').value = b.dataset.dias;
    atualizarPreviaAtestado();
  }));
  el('btnCopiarAtestado').addEventListener('click', () => copiarTextoSimples(el('atTexto').value));
  el('btnImprimirAtestado').addEventListener('click', imprimirAtestado);

  ['medicoNome', 'medicoCrm'].forEach(id => {
    el(id).addEventListener('input', renderReceita);   // a prévia (e a impressão comum, que a copia) mostra na hora
    el(id).addEventListener('change', saveMedico);
  });
  el('unidadeSaude').addEventListener('input', renderReceita);
  el('unidadeSaude').addEventListener('change', saveUnidade);

  // ---------- Ajuste automático de fonte / paginação da receita de duas vias (impressão) ----------
  const FIT_SCALE_MAX = 1;
  const FIT_SCALE_MIN = 0.62;
  const FIT_SCALE_STEP = 0.04;
  // A4 paisagem (1123 x 794 px a 96 dpi) com margem de 12 mm: ~1032 x 703 px úteis. O corpo da
  // janela de impressão tem max-width 1000px e as duas vias têm 16px entre si: (1000-16)/2 = 492px.
  const FIT_COLUMN_WIDTH = 492; // px — largura de cada via lado a lado na impressão
  const FIT_MAX_HEIGHT = 680;   // px — altura útil da folha (703px) com folga para diferença de fonte

  function fitChromeCss(){
    return `
      .via-box{border:1.5px solid #16241F;border-radius:4px;overflow:hidden;font-family:'Inter',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#16241F;}
      .via-box-header{display:flex;border-bottom:1.5px solid #16241F;}
      .via-box-header .muni{flex:1;display:flex;align-items:center;gap:10px;padding:8px 12px;border-right:1.5px solid #16241F;min-width:0;}
      .via-box-header .muni-logo{height:34px;width:auto;flex:none;}
  .via-box-header .muni-sus-logo{height:26px;width:auto;flex:none;margin-left:4px;}
      .via-box-header .muni-text{font-size:10.5px;line-height:1.35;color:#4B5A55;}
      .via-box-header .muni-text b{color:#16241F;font-size:11.5px;}
      .via-box-header .via-label{width:168px;flex:none;background:#E4EFEC;color:#0A4F41;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:700;font-size:11.5px;letter-spacing:.04em;padding:6px 8px;}
      .via-box-header-patos{flex-direction:column;align-items:center;text-align:center;padding:10px 12px;gap:2px;}
      .via-box-header-patos .logo-patos-via{height:34px;width:auto;}
      .via-box-title{padding:7px 12px;border-bottom:1.5px solid #16241F;font-weight:700;font-size:12px;letter-spacing:.04em;text-transform:uppercase;background:#FAFCFB;}
      .via-box-patos-label{padding:6px 12px;font-weight:700;font-size:11px;letter-spacing:.04em;text-align:center;border-bottom:1.5px solid #16241F;background:#FAFCFB;}
      .via-box-paciente{padding:8px 12px;border-bottom:1.5px solid #16241F;font-size:12.5px;display:flex;justify-content:space-between;align-items:baseline;}
      .via-box-paciente .via-box-data{color:#4B5A55;font-size:11.5px;}
      .via-box-patos-campo{padding:6px 12px 0 12px;font-size:12px;}
      .via-box-patos-medico{padding:10px 12px 0 12px;font-weight:700;font-size:12px;}
      .via-box-patos-data{padding:2px 12px 0 12px;font-size:11.5px;color:#4B5A55;}
      .via-box-patos-orientacao{padding:8px 12px 0 12px;font-size:11.5px;color:#4B5A55;}
      .via-box-footer{display:flex;border-top:1.5px solid #16241F;}
      .via-box-footer > div{flex:1;padding:9px 12px;font-size:10.5px;color:#4B5A55;line-height:1.7;}
      .via-box-footer > div:first-child{border-right:1.5px solid #16241F;}
      .via-box-footer b{color:#16241F;}
      .via-box-footer-patos{border-top:1.5px solid #16241F;flex-direction:column;}
      .via-box-footer-patos > div{flex:none;border-right:none !important;border-bottom:1px dashed #D7DEDA;}
      .via-box-footer-patos > div:last-child{border-bottom:none;}
      .assinatura-bloco{margin-top:50px;padding-top:16px;border-top:1px dashed #D7DEDA;display:flex;align-items:flex-end;justify-content:center;gap:28px;}
      .carimbo-box{width:190px;height:88px;flex:none;border:1.5px dashed #D7DEDA;border-radius:6px;display:flex;align-items:center;justify-content:center;}
      .carimbo-box span{font-size:10.5px;color:#D7DEDA;text-transform:uppercase;letter-spacing:.08em;font-weight:600;}
      .assinatura-linha-wrap{flex:none;width:260px;text-align:center;}
      .assinatura-linha-wrap .linha{border-top:1px solid #16241F;margin-bottom:6px;}
      .assinatura-linha-wrap .label{font-size:11.5px;color:#4B5A55;}
      .via-box-assinatura{margin-top:8px;padding:14px 16px 18px 16px;border-top:1px dashed #D7DEDA;}
      .via-box-patos-assinatura{margin-top:8px;padding:14px 16px 18px 16px;border-top:1px dashed #D7DEDA;font-size:11px;}
      .receita-vazia-mini{padding:20px 6px;color:#4B5A55;font-size:12.5px;text-align:center;}
      .rm-item, .edit-item-btn, .par-item, .vias-item, .pos-vazia{ display:none !important; }
    `;
  }

  function fitBodyCss(scale){
    const s = n => Math.round(n * scale * 100) / 100;
    return `
      .via-box-body{padding:${s(16)}px 16px;}
      .via-titulo{font-size:${s(11.5)}px;font-weight:700;letter-spacing:.1em;color:#0A4F41;text-transform:uppercase;margin:${s(18)}px 0 ${s(8)}px 0;padding-bottom:4px;border-bottom:1px solid #E4EFEC;}
      .via-titulo:first-of-type{margin-top:0;}
      .item-linha{display:flex;align-items:baseline;gap:8px;margin-top:${s(10)}px;}
      .item-linha .num{font-family:'IBM Plex Mono',Consolas,Menlo,'Courier New',monospace;font-size:${s(12)}px;color:#4B5A55;flex:none;}
      .item-linha .nome-med{font-weight:600;white-space:nowrap;font-size:${s(15)}px;}
      .item-linha .dots{flex:1;border-bottom:1.5px dotted #D7DEDA;position:relative;top:-3px;}
      .item-linha .qtde{font-family:'IBM Plex Mono',Consolas,Menlo,'Courier New',monospace;font-size:${s(12.5)}px;flex:none;color:#4B5A55;}
      .item-pos{margin:2px 0 0 ${s(24)}px;font-size:${s(12.5)}px;color:#4B5A55;}
      .orientacoes-bloco{margin-top:${s(22)}px;}
      .orientacoes-bloco ul{margin:8px 0 0 0;padding-left:18px;}
      .orientacoes-bloco li{font-size:${s(12.5)}px;color:#4B5A55;margin-bottom:${s(6)}px;white-space:pre-line;}
      .orientacoes-bloco li.espaco-antes{margin-top:${s(14)}px;}
      .continuacao-nota{font-size:${s(11)}px;font-style:italic;color:#4B5A55;margin-bottom:${s(8)}px;}
    `;
  }

  // Escopa cada seletor da folha de estilo sob #fitProbe, pra que essas regras
  // (pensadas só pra medir a altura da via numa div invisível) nunca vazem pro
  // resto do documento — inclusive a pré-visualização real da receita, que usa
  // as mesmas classes (.via-box, .item-linha etc).
  function scopeCssParaProbe(css){ return scopeCss(css, '#fitProbe'); }
  function scopeCss(css, escopo){
    return css.replace(/([^{}]+)\{/g, (m, selectors) =>
      selectors.split(',').map(s => escopo + ' ' + s.trim()).join(', ') + '{'
    );
  }

  function medirProbe(){
    let probe = document.getElementById('fitProbe');
    if(!probe){
      probe = document.createElement('div');
      probe.id = 'fitProbe';
      probe.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;pointer-events:none;width:' + FIT_COLUMN_WIDTH + 'px;'
        + "font-size:16px;line-height:normal;font-family:'Inter',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#16241F;";
      document.body.appendChild(probe);
      const style = document.createElement('style');
      style.id = 'fitProbeStyle';
      style.textContent = scopeCssParaProbe(fitChromeCss());
      document.head.appendChild(style);
    }
    return probe;
  }

  function medirAlturaVia(viaHtml, scale){
    const probe = medirProbe();
    el('fitProbeStyle').textContent = scopeCssParaProbe(fitChromeCss() + fitBodyCss(scale));
    probe.innerHTML = viaHtml;
    const h = probe.scrollHeight;
    probe.innerHTML = '';
    return h;
  }

  function limparProbeDeMedicao(){
    const probe = document.getElementById('fitProbe');
    if(probe) probe.remove();
    const style = document.getElementById('fitProbeStyle');
    if(style) style.remove();
  }

  function construirEntradasReceita(medEntries, orientEntries){
    const grupos = {}; const viaOrder = [];
    medEntries.forEach(([id, it]) => {
      const via = it.via || 'Outro';
      if(!grupos[via]){ grupos[via] = []; viaOrder.push(via); }
      grupos[via].push([id, it]);
    });
    const entradas = [];
    viaOrder.forEach(via => {
      entradas.push({ tipo: 'titulo', via });
      grupos[via].forEach(([id, it], idx) => entradas.push({ tipo: 'item', id, it, idx }));
    });
    if(orientEntries.length){
      entradas.push({ tipo: 'orientTitulo' });
      orientEntries.forEach(([id, o]) => entradas.push({ tipo: 'orientItem', id, o }));
    }
    return entradas;
  }

  function renderEntradasHtml(entradas, peso, notaContinuacao){
    let html = notaContinuacao ? `<div class="continuacao-nota">${escapeHtml(notaContinuacao)}</div>` : '';
    let listaAberta = false;
    entradas.forEach(e => {
      if(e.tipo === 'titulo'){
        html += `<div class="via-titulo">Uso ${escapeHtml(e.via)}</div>`;
      } else if(e.tipo === 'item'){
        const it = e.it;
        const posologia = calcDoseItem(it, peso);
        const precisaPeso = itemPorPeso(it) && !peso;
        const posVazia = !posologia && !precisaPeso;
        html += `
          <div class="item-linha">
            <span class="num mono">${String(e.idx+1).padStart(2,'0')}.</span>
            <span class="nome-med">${escapeHtml(it.nome)}</span>
            <span class="dots"></span>
            <span class="qtde">${escapeHtml(it.qtde||'')}</span>
          </div>
          <div class="item-pos">${precisaPeso ? '<span style="color:#B8860B;font-weight:600;">Informe o peso para calcular a dose &rarr;</span> ' : ''}${posVazia ? '' : escapeHtml(posologia||'')}</div>
        `;
      } else if(e.tipo === 'orientTitulo'){
        html += `<div class="orientacoes-bloco"><div class="via-titulo">Orientações</div><ul>`;
        listaAberta = true;
      } else if(e.tipo === 'orientItem'){
        if(!listaAberta){ html += `<div class="orientacoes-bloco"><ul>`; listaAberta = true; }
        html += `<li${e.o.espacoAntes ? ' class="espaco-antes"' : ''}>${escapeHtml(e.o.texto)}</li>`;
      }
    });
    if(listaAberta) html += `</ul></div>`;
    return html;
  }

  function calcularEncaixeControle(local, medEntries, orientEntries, peso, nomePaciente, dataStr){
    try{
      const muni = municipioDoLocal(local);
      const buildVia = corpoHtml => muni
        ? viaBoxHtmlMunicipio(muni, nomePaciente, dataStr, corpoHtml, '1ª VIA FARMÁCIA')
        : viaBoxHtml(nomePaciente, dataStr, corpoHtml, '1ª VIA FARMÁCIA');

      const entradas = construirEntradasReceita(medEntries, orientEntries);
      const corpoCompleto = renderEntradasHtml(entradas, peso);

      // 1) tenta encaixar tudo em uma única folha, reduzindo a fonte gradualmente
      for(let scale = FIT_SCALE_MAX; scale >= FIT_SCALE_MIN - 1e-6; scale -= FIT_SCALE_STEP){
        const altura = medirAlturaVia(buildVia(corpoCompleto), scale);
        if(altura <= FIT_MAX_HEIGHT){
          return { scale: Math.round(scale * 100) / 100, paginas: [ corpoCompleto ] };
        }
      }

      // 2) não coube nem no tamanho mínimo — divide em quantas folhas forem precisas,
      // cada uma medida (antes só havia 2 e o resto transbordava sem cabeçalho)
      const notaDe = e => !e ? null
        : e.tipo === 'item' ? 'Continuação da prescrição — Uso ' + e.it.via
        : e.tipo === 'orientItem' ? 'Continuação — Orientações'
        : null;
      const paginar = (scale, limiteFolhas) => {
        const cabe = (ini, fim) => {
          const nota = ini > 0 ? notaDe(entradas[ini]) : null;
          return medirAlturaVia(buildVia(renderEntradasHtml(entradas.slice(ini, fim), peso, nota)), scale) <= FIT_MAX_HEIGHT;
        };
        const paginas = [];
        let ini = 0;
        while(ini < entradas.length){
          if(limiteFolhas && paginas.length >= limiteFolhas) return null; // já passou do mínimo
          // maior fim que cabe (a altura cresce com o nº de entradas: busca binária)
          let lo = ini + 1, hi = entradas.length, melhor = ini + 1;
          while(lo <= hi){
            const meio = (lo + hi) >> 1;
            if(cabe(ini, meio)){ melhor = meio; lo = meio + 1; } else { hi = meio - 1; }
          }
          // não termina a folha num título ("Uso oral", "Orientações") sem nada embaixo
          while(melhor - 1 > ini && melhor < entradas.length && /titulo|orientTitulo/.test(entradas[melhor - 1].tipo)) melhor--;
          paginas.push(renderEntradasHtml(entradas.slice(ini, melhor), peso, ini > 0 ? notaDe(entradas[ini]) : null));
          ini = melhor;
        }
        return paginas;
      };
      // menor nº de folhas possível (fonte mínima) e, com esse nº, a maior fonte que ainda cabe
      const minimo = paginar(FIT_SCALE_MIN);
      for(let scale = FIT_SCALE_MAX; scale > FIT_SCALE_MIN + 1e-6; scale -= FIT_SCALE_STEP){
        const paginas = paginar(scale, minimo.length);
        if(paginas && paginas.length <= minimo.length) return { scale: Math.round(scale * 100) / 100, paginas };
      }
      return { scale: FIT_SCALE_MIN, paginas: minimo };
    } finally {
      // Sempre limpa a div/estilo de medição, mesmo que a função retorne mais
      // cedo — sem isso o vazamento de CSS pra página real persistia até o
      // reload (botões de editar/remover somem pra sempre).
      limparProbeDeMedicao();
    }
  }

  // Folhas do controle especial (2 vias lado a lado), já paginadas, com a seleção atual
  function folhasControle(){
    const local = localAtual();
    let paperHtml, fitScale = 1;
    const nomePaciente = el('nomePaciente').value.trim();
    const peso = el('peso').value;
    const medEntries = Object.entries(selected);
    const orientEntries = Object.entries(selectedOrient);
    const dataStr = new Date().toLocaleDateString('pt-BR');

    if(medEntries.length === 0 && orientEntries.length === 0){
      paperHtml = htmlPrevia('controle');
    } else {
      const encaixe = calcularEncaixeControle(local, medEntries, orientEntries, peso, nomePaciente, dataStr);
      fitScale = encaixe.scale;
      const muni = municipioDoLocal(local);
      const montarFolha = corpoHtml => muni
        ? `<div class="vias-lado-a-lado">${viaBoxHtmlMunicipio(muni, nomePaciente, dataStr, corpoHtml, '1ª VIA FARMÁCIA')}${viaBoxHtmlMunicipio(muni, nomePaciente, dataStr, corpoHtml, '2ª VIA PACIENTE', 'via-2')}</div>`
        : `<div class="vias-lado-a-lado">${viaBoxHtml(nomePaciente, dataStr, corpoHtml, '1ª VIA FARMÁCIA')}${viaBoxHtml(nomePaciente, dataStr, corpoHtml, '2ª VIA PACIENTE', 'via-2')}</div>`;
      paperHtml = encaixe.paginas.map((corpo, i) => {
        const folha = montarFolha(corpo);
        return i === 0 ? folha : `<div class="folha-seguinte">${folha}</div>`;
      }).join('');
    }
    return { paperHtml, fitScale };
  }

  function estilosImpressao(ehControle, fitScale){
    return `
      ${ehControle ? '@page{ size: landscape; margin: 12mm; }' : '@page{ size: portrait; margin: 14mm 16mm; }'}
      body{font-family:'Inter',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#16241F; padding:34px 38px; max-width:${ehControle ? '1000px' : '700px'}; margin:0 auto;}
      .folha-seguinte{ page-break-before: always; }
      .vias-lado-a-lado{display:flex; gap:16px; align-items:flex-start;}
      .vias-lado-a-lado .via-box{flex:1 1 0; min-width:0; margin-bottom:0;}
      .receita-logos{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
      .receita-logos .logo-carmo{height:38px;width:auto;}
      .receita-logos .logo-sus{height:30px;width:auto;}
      .receita-logos .logo-muni{display:flex;align-items:center;gap:10px;}
      .receita-logos .logo-muni-brasao{height:46px;width:auto;}
      .receita-logos .logo-muni-texto{font-size:10px;line-height:1.3;color:#4B5A55;text-transform:uppercase;letter-spacing:.06em;}
      .receita-logos .logo-muni-texto b{display:block;font-size:15px;line-height:1.2;color:#16241F;letter-spacing:.03em;}
      .via-box{border:1.5px solid #16241F;border-radius:4px;margin-bottom:22px;overflow:hidden;}
      .via-box-header{display:flex;border-bottom:1.5px solid #16241F;}
      .via-box-header .muni{flex:1;display:flex;align-items:center;gap:10px;padding:8px 12px;border-right:1.5px solid #16241F;min-width:0;}
      .via-box-header .muni-logo{height:34px;width:auto;flex:none;}
  .via-box-header .muni-sus-logo{height:26px;width:auto;flex:none;margin-left:4px;}
      .via-box-header .muni-text{font-size:10.5px;line-height:1.35;color:#4B5A55;}
      .via-box-header .muni-text b{color:#16241F;font-size:11.5px;}
      .via-box-header .via-label{width:168px;flex:none;background:#E4EFEC;color:#0A4F41;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:700;font-size:11.5px;letter-spacing:.04em;padding:6px 8px;}
      .via-box-title{padding:7px 12px;border-bottom:1.5px solid #16241F;font-weight:700;font-size:12px;letter-spacing:.04em;text-transform:uppercase;background:#FAFCFB;}
      .via-box-paciente{padding:8px 12px;border-bottom:1.5px solid #16241F;font-size:12.5px;display:flex;justify-content:space-between;align-items:baseline;}
      .via-box-paciente .via-box-data{color:#4B5A55;font-size:11.5px;}
      .via-box-body{padding:16px;}
      .via-box-body .via-titulo:first-child{margin-top:0;}
      .receita-vazia-mini{padding:20px 6px;color:#4B5A55;font-size:12.5px;text-align:center;}
      .via-box-footer{display:flex;border-top:1.5px solid #16241F;}
      .via-box-footer > div{flex:1;padding:9px 12px;font-size:10.5px;color:#4B5A55;line-height:1.7;}
      .via-box-footer > div:first-child{border-right:1.5px solid #16241F;}
      .via-box-footer b{color:#16241F;}
      .rm-item, .edit-item-btn, .par-item, .vias-item, .pos-vazia{ display:none !important; }
      .assinatura-bloco{margin-top:50px;padding-top:16px;border-top:1px dashed #D7DEDA;display:flex;align-items:flex-end;justify-content:center;gap:28px;}
      .carimbo-box{width:190px;height:88px;flex:none;border:1.5px dashed #D7DEDA;border-radius:6px;display:flex;align-items:center;justify-content:center;}
      .carimbo-box span{font-size:10.5px;color:#D7DEDA;text-transform:uppercase;letter-spacing:.08em;font-weight:600;}
      .assinatura-linha-wrap{flex:none;width:260px;text-align:center;}
      .assinatura-linha-wrap .linha{border-top:1px solid #16241F;margin-bottom:6px;}
      .assinatura-linha-wrap .label{font-size:11.5px;color:#4B5A55;}
      .via-box-assinatura{margin-top:8px;padding:14px 16px 18px 16px;border-top:1px dashed #D7DEDA;}
      .receita-logos-patos{text-align:center;margin-bottom:14px;}
      .receita-logos-patos .logo-patos{height:52px;width:auto;margin-bottom:6px;}
      .receita-logos-patos .patos-titulo{font-weight:700;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;border-top:1.5px solid #16241F;border-bottom:1.5px solid #16241F;padding:5px 0;}
      .via-box-header-patos{flex-direction:column;align-items:center;text-align:center;padding:10px 12px;gap:2px;}
      .via-box-header-patos .logo-patos-via{height:34px;width:auto;}
      .via-box-patos-label{padding:6px 12px;font-weight:700;font-size:11px;letter-spacing:.04em;text-align:center;border-bottom:1.5px solid #16241F;background:#FAFCFB;}
      .via-box-patos-campo{padding:6px 12px 0 12px;font-size:12px;}
      .via-box-patos-medico{padding:10px 12px 0 12px;font-weight:700;font-size:12px;}
      .via-box-patos-data{padding:2px 12px 0 12px;font-size:11.5px;color:#4B5A55;}
      .via-box-patos-orientacao{padding:8px 12px 0 12px;font-size:11.5px;color:#4B5A55;}
      .via-box-footer-patos{border-top:1.5px solid #16241F;flex-direction:column;}
      .via-box-footer-patos > div{flex:none;border-right:none !important;border-bottom:1px dashed #D7DEDA;}
      .via-box-footer-patos > div:last-child{border-bottom:none;}
      .via-box-patos-assinatura{margin-top:8px;padding:14px 16px 18px 16px;border-top:1px dashed #D7DEDA;font-size:11px;}
      .receita-head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #16241F;padding-bottom:10px;margin-bottom:20px;}
      .receita-head .paciente{font-size:17px;font-weight:600;}
      .receita-head .paciente .lbl{display:block;font-size:10px;color:#4B5A55;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px;}
      .receita-head .data{font-size:12px;color:#4B5A55;text-align:right;}
      .via-titulo{font-size:11.5px;font-weight:700;letter-spacing:.1em;color:#0A4F41;text-transform:uppercase;margin:18px 0 8px 0;padding-bottom:4px;border-bottom:1px solid #E4EFEC;}
      .via-titulo:first-of-type{margin-top:0;}
      .item-linha{display:flex;align-items:baseline;gap:8px;margin-top:10px;}
      .item-linha .num{font-family:'IBM Plex Mono',Consolas,Menlo,'Courier New',monospace;font-size:12px;color:#4B5A55;flex:none;}
      .item-linha .nome-med{font-weight:600;white-space:nowrap;}
      .item-linha .dots{flex:1;border-bottom:1.5px dotted #D7DEDA;position:relative;top:-3px;}
      .item-linha .qtde{font-family:'IBM Plex Mono',Consolas,Menlo,'Courier New',monospace;font-size:12.5px;flex:none;color:#4B5A55;}
      .item-pos{margin:2px 0 0 24px;font-size:12.5px;color:#4B5A55;}
      .orientacoes-bloco{margin-top:22px;}
      .orientacoes-bloco ul{margin:8px 0 0 0;padding-left:18px;}
      .orientacoes-bloco li{font-size:12.5px;color:#4B5A55;margin-bottom:6px;white-space:pre-line;}
      .orientacoes-bloco li.espaco-antes{margin-top:14px;}
      .assinatura{margin-top:44px;padding-top:10px;text-align:center;font-size:12px;color:#4B5A55;}
      .assinatura .linha{width:260px;border-top:1px solid #16241F;margin:0 auto 6px auto;}
      /* Evita que a paginação nativa do navegador quebre um item ou bloco no
         meio, ou jogue o cabeçalho/assinatura sozinhos numa folha — sem isso,
         a receita comum podia sobrar espaço em branco na 1ª página e ainda
         assim empurrar um bloco pequeno (ex. orientações) pra 2ª. */
      .item-linha{ break-inside: avoid; }
      .orientacoes-bloco{ break-inside: avoid; }
      .assinatura-bloco{ break-inside: avoid; break-before: avoid; }
      .receita-head{ break-after: avoid; }
      ${ehControle ? fitBodyCss(fitScale) : ''}
      @media print{ body{padding:0;} }
    `;
  }

  el('btnImprimir').addEventListener('click', async () => {
    if(!await conferirAntesDeEmitir()) return;
    const sep = separacaoAtiva();
    let paperHtml, printStyles;
    if(sep){
      // receita comum (retrato) e, na folha seguinte, as 2 vias (paisagem)
      const comum = comSelecao(sep.comum, sep.orientComum, () => htmlPrevia('comum'));
      const ctl = comSelecao(sep.duas, sep.orientDuas, folhasControle);
      paperHtml = `<div class="parte-comum">${comum}</div><div class="parte-duas">${ctl.paperHtml}</div>`;
      printStyles = estilosImpressao(false, 1) + `
      @page vias2{ size: landscape; margin: 12mm; }
      body{ max-width:1000px; }
      .parte-comum{ max-width:700px; margin:0 auto; }
      .parte-duas{ page: vias2; break-before: page; }
      ` + scopeCss(fitBodyCss(ctl.fitScale), '.parte-duas');
    } else {
      const ehControle = tipoEfetivo() === 'controle';
      let fitScale = 1;
      if(ehControle){ ({ paperHtml, fitScale } = folhasControle()); }
      else paperHtml = el('receitaPaper').innerHTML;
      printStyles = estilosImpressao(ehControle, fitScale);
    }
    if(!await abrirImpressao('Receita', printStyles, paperHtml, el('nomePaciente').value.trim())) return;
    registrarHistorico('impresso');
  });
  el('btnPediatrica').addEventListener('click', async () => {
    const meses = idadeAtualMeses();
    if(meses !== null && meses >= 144){
      const r = await perguntar('O paciente tem <b>' + escapeHtml(window.PEDIATRIA.formatarIdade(meses)) + '</b>. A versão pediátrica troca os remédios por gotas e doses por kg. Converter assim mesmo?',
        [{ rotulo: 'Cancelar', valor: false }, { rotulo: 'Converter', valor: true, primario: true }]);
      if(!r) return;
    }
    executarConversao(false);
  });
  el('avisoBar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-acao]');
    if(!b) return;
    if(b.dataset.acao === 'converter-ped') executarConversao(false);
    if(b.dataset.acao === 'desfazer-ped') desfazerConversao();
    if(b.dataset.acao === 'separar-auto'){
      document.querySelector('input[name=tipoReceita][value="auto"]').checked = true;
      separarSuspenso = false;
      renderTudo();
    }
    if(b.dataset.acao === 'padrao-aplicar') aplicarSugestao(b.dataset.chave);
    if(b.dataset.acao === 'cond-queixa') toggleCondicaoInteira(b.dataset.nome, true);
    if(b.dataset.acao === 'preencher-medico'){ el('medicoDetails').open = true; el('medicoNome').scrollIntoView({ block: 'center' }); el('medicoNome').focus(); }
    if(b.dataset.acao === 'tirar-alergico'){
      const antes = retratoReceita();
      b.dataset.ids.split('|').forEach(id => { delete selected[id]; });
      renderTudo();
      showToast('Removido da receita', { rotulo: 'Desfazer', fn: () => voltarRetrato(antes) });
    }
    if(b.dataset.acao === 'padrao-adiar'){ padroes.adiadas[b.dataset.chave] = (padroes.n[b.dataset.chave] || 0) + PADROES_MIN; savePadroes(); renderTudo(); }
    if(b.dataset.acao === 'padrao-dispensar'){ padroes.dispensadas[b.dataset.chave] = true; savePadroes(); renderTudo(); }
  });
  el('avisoBar').addEventListener('change', (e) => {
    if(e.target.matches('input[data-acao="separar-sempre"]')){
      guardarPreferencia(SEPARAR_KEY, e.target.checked ? '1' : '0');
      if(e.target.checked){ separarSuspenso = false; renderTudo(); }
      return;
    }
    if(!e.target.matches('input[data-acao="auto-ped"]')) return;
    guardarPreferencia(AUTO_PED_KEY, e.target.checked ? '1' : '0');
    if(e.target.checked){ autoPedSuspensa = false; renderTudo(); }
  });
  // Nova receita: próximo paciente (limpa tudo)
  el('btnLimpar').addEventListener('click', (ev) => {
    const antes = retratoReceita();
    const tinhaAlgo = antes.nome.trim() || Object.keys(antes.selected).length || Object.keys(antes.selectedOrient).length;
    finalizarAtendimento();
    selected = {}; selectedOrient = {}; conversaoPed = null; desfazerPediatria = null; autoPedSuspensa = false; separarSuspenso = false;
    encRascunhoPaciente = null; atRascunhoPaciente = null; pacienteQuadro = null;
    el('nomePaciente').value=''; el('peso').value=''; el('idade').value='';
    usoNaAbertura = { ...usoCondicoes };
    // próximo paciente: busca limpa e o cursor no nome (no Quadro o nome vem do cartão)
    el('search').value = ''; el('searchWrap').classList.remove('has-text');
    renderTudo();
    if(limpezaSilenciosa) return;
    if(!PONTE) el('nomePaciente').focus();
    if(tinhaAlgo) showToast('Receita limpa para o próximo paciente', { rotulo: 'Desfazer', fn: () => voltarRetrato(antes) });
  });
  // Mesmo paciente: outra receita para quem já está na tela (ex.: antibiótico
  // nas 2 vias e sintomáticos na comum). Mantém nome, idade, peso e os rascunhos
  // de encaminhamento/atestado; limpa remédios e orientações.
  el('btnMesmoPaciente').addEventListener('click', () => {
    const antes = retratoReceita();
    selected = {}; selectedOrient = {}; conversaoPed = null; desfazerPediatria = null; autoPedSuspensa = false; separarSuspenso = false;
    renderTudo();
    const nome = el('nomePaciente').value.trim();
    showToast(nome ? `Receita limpa — continua para ${nome}` : 'Receita limpa — dados do paciente mantidos', { rotulo: 'Desfazer', fn: () => voltarRetrato(antes) });
    el('search').focus();
  });

  el('btnAddCustom').addEventListener('click', async () => {
    const nome = el('novoNome').value.trim();
    const qtde = el('novoQtde').value.trim();
    const via = el('novoVia').value;
    const fatorTxt = el('novoFator').value.trim();
    const posologia = el('novoPosologia').value.trim();
    const salvar = el('novoSalvar').checked;

    if(!nome){ showToast('Digite o nome do medicamento'); return; }

    const fator = parseFator(fatorTxt);
    const novoMed = { nome, concentracao:'', forma:'', qtde, posologia, tempo:'', via, fator };

    const id = 'avulso:' + nome + ':' + Date.now();
    selected[id] = { nome, qtde, posologiaBase: posologia, via: via||'Outro', fator, origemCondicao: null };

    if(salvar){
      customMeds.push(novoMed);
      await saveCustomMeds();
      populateEditorMedsDatalist();
    }

    el('novoNome').value=''; el('novoQtde').value=''; el('novoFator').value=''; el('novoPosologia').value='';
    renderTudo();
    showToast(salvar ? 'Adicionado à receita e salvo no catálogo' : 'Adicionado à receita');
  });

  // ---------- Editor de Condições Clínicas ----------
  function getUniqueMedsList(){
    const map = new Map();
    
    // 1. From DATA.medicamentos & customMeds (já com edição permanente aplicada)
    allMedicamentos().forEach(m => {
      const efetivo = getMedicamentoEfetivo(m);
      const concentracao = m.concentracao ? m.concentracao.trim() : '';
      const nomeCompleto = m.nome.trim() + (concentracao ? ' ' + concentracao : '');
      const key = norm(nomeCompleto);
      if(key && !map.has(key)){
        map.set(key, {
          nomeCompleto,
          qtde: efetivo.qtde ? efetivo.qtde.trim() : '',
          via: efetivo.via ? efetivo.via.trim() : 'Oral',
          fator: efetivo.fator !== undefined && efetivo.fator !== null ? efetivo.fator : null,
          posologia: efetivo.posologia ? efetivo.posologia.trim() : ''
        });
      }
    });
    
    // 2. From DATA.condicoes & customCondicoes
    const conds = getOrdemCondicoes();
    conds.forEach(cNome => {
      const eff = getCondEffective(cNome);
      if(eff && eff.meds){
        eff.meds.forEach(m => {
          const key = norm(m.nome);
          if(key){
            if(!map.has(key)){
              map.set(key, {
                nomeCompleto: m.nome.trim(),
                qtde: m.qtde ? m.qtde.trim() : '',
                via: m.via ? m.via.trim() : 'Oral',
                fator: m.fator !== undefined && m.fator !== null ? m.fator : null,
                posologia: m.posologia ? m.posologia.trim() : ''
              });
            } else {
              const existing = map.get(key);
              if(!existing.posologia && m.posologia) existing.posologia = m.posologia.trim();
              if(!existing.qtde && m.qtde) existing.qtde = m.qtde.trim();
              if(m.fator !== null && m.fator !== undefined) existing.fator = m.fator;
            }
          }
        });
      }
    });
    
    return Array.from(map.values());
  }

  function populateEditorMedsDatalist(){
    const dl = el('datalistMedicamentosEditor');
    if(!dl) return;
    dl.innerHTML = '';
    const meds = getUniqueMedsList();
    meds.sort((a, b) => a.nomeCompleto.localeCompare(b, 'pt-BR'));
    meds.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.nomeCompleto;
      dl.appendChild(opt);
    });
  }

  function populateEditorSelect(selectedName = ''){
    const select = el('editorSelectCond');
    select.innerHTML = '<option value="">-- Criar Nova Condição --</option>';
    
    const nomes = getOrdemCondicoes();
    nomes.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    
    nomes.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      const isCustom = !DATA.condicoes[nome];
      const isEdited = !!customCondicoes[nome] && !isCustom;
      opt.textContent = nome + (isCustom ? ' (Personalizada)' : (isEdited ? ' (Editada)' : ''));
      if(nome === selectedName) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function renderEditorForm(){
    const select = el('editorSelectCond');
    const nome = select.value;
    const isNew = !nome;
    const medsContainer = el('editorMedsContainer');
    const orientsContainer = el('editorOrientsContainer');
    
    medsContainer.innerHTML = '';
    orientsContainer.innerHTML = '';
    
    if(isNew){
      el('editorNomeCondField').style.display = 'block';
      el('editorNomeCond').value = '';
      el('editorBtnExcluir').style.display = 'none';
      el('editorBtnSalvar').textContent = 'Salvar Nova Condição';
      
      addMedRowToEditor();
      addOrientRowToEditor();
    } else {
      el('editorNomeCondField').style.display = 'none';
      el('editorNomeCond').value = nome;
      el('editorBtnSalvar').textContent = 'Salvar Alterações';
      
      // o editor abre o que a lista mostra: com as edições e sem os itens removidos
      const eff = getCondEffective(nome);
      const cond = { meds: eff.meds.map(itemDeCondicao), orientacoes: eff.orientacoes.map(o => o.texto) };
      
      if(cond.meds && cond.meds.length){
        cond.meds.forEach(m => addMedRowToEditor(m));
      } else {
        addMedRowToEditor();
      }
      
      if(cond.orientacoes && cond.orientacoes.length){
        cond.orientacoes.forEach(o => {
          const texto = typeof o === 'string' ? o : (o.texto || '');
          addOrientRowToEditor(texto);
        });
      } else {
        addOrientRowToEditor();
      }
      
      const isCustom = !DATA.condicoes[nome];
      const isEdited = !!customCondicoes[nome] && !isCustom;
      
      if(isCustom){
        el('editorBtnExcluir').style.display = '';
        el('editorBtnExcluir').textContent = 'Excluir Condição';
        el('editorBtnExcluir').classList.remove('is-restore');
      } else if(isEdited){
        el('editorBtnExcluir').style.display = '';
        el('editorBtnExcluir').textContent = 'Restaurar Padrão';
        el('editorBtnExcluir').classList.add('is-restore');
      } else {
        el('editorBtnExcluir').style.display = 'none';
      }
    }
  }

  function addMedRowToEditor(med = null){
    const container = el('editorMedsContainer');

    const box = document.createElement('div');
    box.className = 'editor-med-box';
    box._orig = med;   // teto, faixas e idade mínima voltam se nome e fator não mudarem
    box.innerHTML = `
      <button type="button" class="btn-remove-row" title="Remover medicamento" aria-label="Remover medicamento">&times;</button>
      <input type="text" class="ed-med-nome" placeholder="Nome do medicamento (ex: Dipirona 500mg)" aria-label="Nome do medicamento" value="${med ? escapeHtml(med.nome) : ''}" list="datalistMedicamentosEditor">
      <div class="ed-grid-3">
        <input type="text" class="ed-med-qtde" placeholder="Qtde" aria-label="Quantidade" value="${med ? escapeHtml(med.qtde || '') : ''}">
        <select class="ed-med-via" aria-label="Via">
          ${renderViaOptions(med ? med.via : null)}
        </select>
        <input type="text" class="ed-med-fator" placeholder="Fator/kg" aria-label="Fator dose por kg" value="${med && med.fator !== null && med.fator !== undefined ? escapeHtml(med.fator) : ''}">
      </div>
      <textarea class="ed-med-pos" placeholder="Posologia (use DOSE para cálculo por peso)" aria-label="Posologia">${med ? escapeHtml(med.posologia || '') : ''}</textarea>
    `;
    
    const inputNome = box.querySelector('.ed-med-nome');
    inputNome.addEventListener('input', () => {
      const val = inputNome.value.trim();
      const valNorm = norm(val);
      if(!valNorm) return;
      
      const meds = getUniqueMedsList();
      const match = meds.find(m => norm(m.nomeCompleto) === valNorm);
      if(match){
        const inputQtde = box.querySelector('.ed-med-qtde');
        const selectVia = box.querySelector('.ed-med-via');
        const inputFator = box.querySelector('.ed-med-fator');
        const textareaPos = box.querySelector('.ed-med-pos');
        
        if(!inputQtde.value.trim() && match.qtde) inputQtde.value = match.qtde;
        if(match.via) selectVia.innerHTML = renderViaOptions(match.via);
        if(!inputFator.value.trim() && match.fator !== null && match.fator !== undefined) {
          inputFator.value = match.fator;
        }
        if(!textareaPos.value.trim() && match.posologia) textareaPos.value = match.posologia;
      }
    });

    box.querySelector('.btn-remove-row').addEventListener('click', () => {
      box.remove();
      if(container.children.length === 0) addMedRowToEditor();
    });
    
    container.appendChild(box);
  }

  function addOrientRowToEditor(texto = ''){
    const container = el('editorOrientsContainer');
    
    const row = document.createElement('div');
    row.className = 'editor-orient-row';
    row.innerHTML = `
      <textarea class="ed-orient-texto" placeholder="Orientação para o paciente" aria-label="Orientação para o paciente">${escapeHtml(texto)}</textarea>
      <button type="button" class="btn-remove-row" title="Remover orientação" aria-label="Remover orientação">&times;</button>
    `;
    
    row.querySelector('.btn-remove-row').addEventListener('click', () => {
      row.remove();
      if(container.children.length === 0) addOrientRowToEditor();
    });
    
    container.appendChild(row);
  }

  // Edições da lista e itens marcados apontam para a posição do item na condição.
  // Quando o editor troca a lista inteira, essas posições deixam de valer: as edições
  // já foram incorporadas pelo editor e os itens na receita ficam como estão, soltos.
  async function desligarIndicesCondicao(nome){
    delete overrides[nome];
    await saveOverrides();
    const prefixo = 'cond:' + nome + ':';
    [selected, selectedOrient].forEach(obj => Object.keys(obj).forEach(id => {
      if(id.startsWith(prefixo)){ obj['solto:' + id] = obj[id]; delete obj[id]; }
    }));
    if(atendimentoAtual && atendimentoAtual.conds) delete atendimentoAtual.conds[nome];
  }

  function initEditorCondicoes(){
    populateEditorSelect();
    populateEditorMedsDatalist();
    renderEditorForm();
    
    el('editorSelectCond').addEventListener('change', renderEditorForm);
    el('editorBtnAddMed').addEventListener('click', () => addMedRowToEditor());
    el('editorBtnAddOrient').addEventListener('click', () => addOrientRowToEditor());
    
    el('editorBtnSalvar').addEventListener('click', async () => {
      const select = el('editorSelectCond');
      const isNew = !select.value;
      let nome = isNew ? el('editorNomeCond').value.trim() : select.value;
      
      if(!nome){
        showToast(isNew ? 'Digite o nome da nova condição' : 'Selecione uma condição');
        return;
      }
      
      const meds = [];
      const medBoxes = el('editorMedsContainer').querySelectorAll('.editor-med-box');
      medBoxes.forEach(box => {
        const mNome = box.querySelector('.ed-med-nome').value.trim();
        if(mNome){
          const qtde = box.querySelector('.ed-med-qtde').value.trim();
          const via = box.querySelector('.ed-med-via').value;
          const fatorTxt = box.querySelector('.ed-med-fator').value.trim();
          const posologia = box.querySelector('.ed-med-pos').value.trim();
          const fator = parseFator(fatorTxt);

          const item = { nome: mNome, qtde: qtde || null, via: via, fator: fator, posologia: posologia || null };
          const o = box._orig;
          if(o && o.nome === mNome && (o.fator ?? null) === (fator ?? null))
            ['max', 'faixas', 'idadeMinMeses', 'pesoMinKg'].forEach(k => { if(o[k] !== undefined) item[k] = o[k]; });
          meds.push(item);
        }
      });
      
      const orientacoes = [];
      const orientRows = el('editorOrientsContainer').querySelectorAll('.editor-orient-row');
      orientRows.forEach(row => {
        const txt = row.querySelector('.ed-orient-texto').value.trim();
        if(txt) orientacoes.push(txt);
      });
      
      customCondicoes[nome] = { meds, orientacoes };
      await desligarIndicesCondicao(nome);
      await saveCustomCondicoes();
      populateEditorMedsDatalist();
      
      showToast('Condição clínica salva com sucesso');
      
      populateEditorSelect(nome);
      renderEditorForm();
      renderTudo();
    });
    
    el('editorBtnExcluir').addEventListener('click', async () => {
      const select = el('editorSelectCond');
      const nome = select.value;
      if(!nome) return;
      
      const isCustom = !DATA.condicoes[nome];
      
      if(isCustom){
        const ok = typeof window.confirm === 'function' ? window.confirm('Deseja realmente excluir a condição "' + nome + '"?') : true;
        if(!ok) return;
        delete customCondicoes[nome];
        await desligarIndicesCondicao(nome);
        await saveCustomCondicoes();
        populateEditorMedsDatalist();
        showToast('Condição excluída');
      } else {
        const ok = typeof window.confirm === 'function' ? window.confirm('Restaurar a conduta "' + nome + '" para o padrão de fábrica? Isso apagará suas personalizações nela.') : true;
        if(!ok) return;
        delete customCondicoes[nome];
        await desligarIndicesCondicao(nome);
        await saveCustomCondicoes();
        populateEditorMedsDatalist();
        showToast('Conduta restaurada ao padrão');
      }
      
      populateEditorSelect();
      renderEditorForm();
      renderTudo();
    });
  }

  // ---------- Init ----------
  (async function init(){
    if(PONTE){ await PONTE.sincronizar(); modoQuadro(); }
    await loadCustomMeds();
    await loadCustomCondicoes();
    await loadOverrides();
    await loadOverridesMedicamentos();
    await loadMedico();
    await loadLocal();
    await loadUnidade();
    await loadUso();
    await loadHistorico();
    await loadPadroes();
    atualizarAvisoBackup();
    renderHistorico();
    usoNaAbertura = { ...usoCondicoes };
    renderTudo();
    initEditorCondicoes();
    if(PONTE) PONTE.onPaciente(aplicarPacienteDoQuadro);
  })();
})();
