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
    }
  };

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

  async function loadOverrides(){
    try{
      const r = await storage.get('overrides-condicoes', false);
      overrides = r && r.value ? JSON.parse(r.value) : {};
      migrarChaveConstipacao(overrides);
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
          nome: m.nome, qtde: m.qtde, posologiaBase: m.posologia, via: m.via || 'Outro', fator: m.fator, origemCondicao: nome
        });
      }
    });
    eff.orientacoes.forEach(o => {
      const id = 'cond:'+nome+':or:'+o.idx;
      if(selectedOrient[id]) selectedOrient[id] = { texto: o.texto, origemCondicao: nome };
    });
  }

  function calcDose(posologia, fator, peso){
    if(!posologia) return posologia;
    if(fator === null || fator === undefined || fator === '' || !peso) return posologia;
    const valor = Math.round(parseFloat(peso) * parseFloat(fator));
    if(isNaN(valor)) return posologia;
    return posologia.replace(/DOSE/g, String(valor));
  }

  function anySelectedNeedsPeso(){
    return Object.values(selected).some(it => it.fator !== null && it.fator !== undefined && it.fator !== '');
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
  function renderLista(filtro){
    const cont = el('listaContainer');
    const f = norm(filtro);
    cont.innerHTML = '';

    // Condições
    const condMatches = getOrdemCondicoes().filter(nome => {
      if(!f) return true;
      if(norm(nome).includes(f)) return true;
      return getCondEffective(nome).meds.some(m => norm(m.nome).includes(f));
    });
    // Mais usadas primeiro (sort estável: empates mantêm a ordem original)
    condMatches.sort((a,b) => (usoCondicoes[b]||0) - (usoCondicoes[a]||0));

    const medsMatches = allMedicamentos().filter(m => !f || norm(m.nome).includes(f));

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
      <input type="checkbox" ${state==='all' ? 'checked' : ''} data-role="cond-check">
      <span class="nome">${escapeHtml(nome)}</span>
      <span class="count">${eff.meds.length} item${eff.meds.length!==1?'s':''}</span>
      <span class="chev">&#9656;</span>
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
            <input type="text" class="ef-fator" value="${m.fator!==null && m.fator!==undefined ? m.fator : ''}" placeholder="Fator/kg (opcional)">
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
      <input type="checkbox" ${selected[id] ? 'checked':''}>
      <div class="sub-text"><b>${escapeHtml(m.nome)}</b> — ${escapeHtml(m.qtde||'')}${m.fator ? ' <span class="tag-peso">(dose por peso)</span>' : ''}${m.editado ? ' <span class="tag-editado">editado</span>' : ''}
      <span class="pos">${escapeHtml(m.posologia||'')}</span></div>
      <div class="row-actions">
        <button class="icon-btn ef-edit" title="Editar">&#9998;</button>
        <button class="icon-btn ef-remove" title="Remover desta condição">&times;</button>
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
      <input type="checkbox" ${selectedOrient[id] ? 'checked':''}>
      <div class="sub-text">${escapeHtml(o.texto)}${o.editado ? ' <span class="tag-editado">editado</span>' : ''}</div>
      <div class="row-actions">
        <button class="icon-btn ef-edit" title="Editar">&#9998;</button>
        <button class="icon-btn ef-remove" title="Remover">&times;</button>
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
    const hiddenIdxs = Object.keys(map).filter(i => map[i] && map[i].removido);
    if(!hiddenIdxs.length) return null;

    const base = tipo === 'meds' ? DATA.condicoes[nome].meds : DATA.condicoes[nome].orientacoes;
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
          <input type="text" class="ef-fator" value="${efetivo.fator!==null && efetivo.fator!==undefined ? efetivo.fator : ''}" placeholder="Fator/kg (opcional)">
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
      <input type="checkbox" ${isSel ? 'checked':''}>
      <div class="avulso-texto">
        <span class="nome">${escapeHtml(displayNome)}</span>
        <span class="meta">${escapeHtml(efetivo.via||'')}${editado ? ' <span class="tag-editado">editado</span>' : ''}</span>
        ${efetivo.posologia ? `<div class="pos">${escapeHtml(efetivo.qtde ? efetivo.qtde + ' — ' : '')}${escapeHtml(efetivo.posologia)}</div>` : ''}
      </div>
      <button type="button" class="icon-btn avulso-edit" title="Editar permanentemente no catálogo">&#9998;</button>
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
        via: m.via || 'Outro', fator: m.fator, origemCondicao: nomeCondicao
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
        via: efetivo.via || 'Outro', fator: efetivo.fator !== undefined ? efetivo.fator : null, origemCondicao: null
      };
    } else {
      delete selected[id];
    }
    renderTudo();
  }

  // ---------- Receita (painel direito) ----------
  function logosHtml(){
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
      html += `<div class="via-titulo">Uso ${via}</div>`;
      grupos[via].forEach(([id, it], idx) => {
        const posologia = calcDose(it.posologiaBase, it.fator, peso);
        const precisaPeso = (it.fator !== null && it.fator !== undefined && it.fator !== '') && !peso;
        const posVazia = !posologia && !precisaPeso;
        html += `
          <div class="item-linha">
            <span class="num mono">${String(idx+1).padStart(2,'0')}.</span>
            <span class="nome-med">${escapeHtml(it.nome)}</span>
            <span class="dots"></span>
            <span class="qtde">${escapeHtml(it.qtde||'')}</span>
            <button class="edit-item-btn" data-sel="${escapeHtml(id)}" title="Editar item">&#x270E;</button>
            <button class="rm-item" data-sel="${escapeHtml(id)}" title="Remover da receita">&times;</button>
          </div>
          <div class="item-pos">${precisaPeso ? '<span style="color:var(--amber);font-weight:600;">Informe o peso para calcular a dose &rarr;</span> ' : ''}${posVazia ? '<span class="pos-vazia">sem posologia cadastrada — edite o item na lista ao lado</span>' : escapeHtml(posologia||'')}</div>
        `;
      });
    });

    if(orientEntries.length){
      html += `<div class="orientacoes-bloco"><div class="via-titulo">Orientações</div><ul>`;
      orientEntries.forEach(([id, o]) => {
        html += `<li>${escapeHtml(o.texto)} <button class="edit-item-btn" data-orient="${escapeHtml(id)}" title="Editar item">&#x270E;</button><button class="rm-item" data-orient="${escapeHtml(id)}" title="Remover da receita">&times;</button></li>`;
      });
      html += `</ul></div>`;
    }
    return html;
  }

  // ---------- Encaminhamento ----------
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
    el('encTexto').value = montarTextoEncaminhamento();
  }

  function abrirEncaminhamento(){
    el('encNomePaciente').value = el('nomePaciente').value.trim();
    popularEncaminhamentoCondicoes();
    atualizarPreviaEncaminhamento();
    el('encaminhamentoOverlay').classList.add('show');
  }

  function imprimirEncaminhamento(){
    const texto = el('encTexto').value;
    const nomePaciente = el('encNomePaciente').value.trim();
    const dataStr = new Date().toLocaleDateString('pt-BR');
    const medicoNome = (el('medicoNome') && el('medicoNome').value.trim()) || '';
    const medicoCrm = (el('medicoCrm') && el('medicoCrm').value.trim()) || '';
    const labelAssinatura = (medicoNome || medicoCrm) ? [medicoNome, medicoCrm].filter(Boolean).join(' — ') : 'Assinatura do médico';

    const corpoHtml = `
      <div class="encaminhamento-titulo">Encaminhamento</div>
      <div class="encaminhamento-texto">${escapeHtml(texto)}</div>
    `;

    const printStyles = `
      @page{ size: portrait; margin: 20mm 22mm; }
      body{font-family:'Inter',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#16241F; padding:34px 38px; max-width:700px; margin:0 auto;}
      .receita-logos{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
      .receita-logos .logo-carmo{height:38px;width:auto;}
      .receita-logos .logo-sus{height:30px;width:auto;}
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

    const printWindow = window.open('', '_blank');
    if(!printWindow){
      showToast('Pop-up bloqueado — permita pop-ups ou abra o arquivo direto no navegador');
      return;
    }
    printWindow.document.write(
      '<html><head><title>Encaminhamento</title><meta charset="UTF-8">' +
      '<style>' + printStyles + '</style></head><body>' + paperHtml + '</body></html>'
    );
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  }

  async function copiarEncaminhamento(){
    const texto = el('encTexto').value;
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

  function viaBoxHtmlPatos(nomePaciente, dataStr, corpoHtml, label, extraClass){
    const unidade = (el('unidadeSaude') && el('unidadeSaude').value.trim()) || 'Secretaria Municipal de Saúde';
    const medicoNome = (el('medicoNome') && el('medicoNome').value.trim()) || '';
    const medicoCrm = (el('medicoCrm') && el('medicoCrm').value.trim()) || '';
    const labelAssinatura = (medicoNome || medicoCrm) ? [medicoNome, medicoCrm].filter(Boolean).join(' — ') : 'Assinatura do médico';
    return `
      <div class="via-box ${extraClass||''}">
        <div class="via-box-header">
          <div class="muni">
            <img src="data:image/png;base64,${LOGO_PATOS_ICON_B64}" class="muni-logo" alt="Prefeitura de Patos de Minas">
            <div class="muni-text"><b>Prefeitura de Patos de Minas</b><br>${escapeHtml(unidade)}</div>
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
            Prefeitura de Patos de Minas — Secretaria Municipal de Saúde<br>
            Rua Dr. José Olympio de Melo, 151 — Bairro Eldorado — CEP 38.700-900<br><br>
            _________________________________<br>
            Assinatura do farmacêutico &nbsp;&nbsp;&nbsp; Data
          </div>
        </div>
      </div>
    `;
  }

  function renderReceita(){
    const paper = el('receitaPaper');
    const nomePaciente = el('nomePaciente').value.trim();
    const peso = el('peso').value;
    const medEntries = Object.entries(selected);
    const orientEntries = Object.entries(selectedOrient);
    const tipo = tipoReceitaAtual();
    const local = localAtual();
    const dataStr = new Date().toLocaleDateString('pt-BR');
    const vazio = medEntries.length === 0 && orientEntries.length === 0;
    const corpoHtml = vazio
      ? '<div class="receita-vazia-mini">Selecione condições ou medicamentos ao lado.</div>'
      : corpoReceitaHtml(medEntries, orientEntries, peso);

    if(tipo === 'controle'){
      paper.innerHTML = local === 'patos'
        ? `
          <div class="vias-lado-a-lado">
            ${viaBoxHtmlPatos(nomePaciente, dataStr, corpoHtml, '1ª VIA FARMÁCIA')}
            ${viaBoxHtmlPatos(nomePaciente, dataStr, corpoHtml, '2ª VIA PACIENTE', 'via-2')}
          </div>
        `
        : `
          <div class="vias-lado-a-lado">
            ${viaBoxHtml(nomePaciente, dataStr, corpoHtml, '1ª VIA FARMÁCIA')}
            ${viaBoxHtml(nomePaciente, dataStr, corpoHtml, '2ª VIA PACIENTE', 'via-2')}
          </div>
        `;
      return;
    }

    if(vazio){
      paper.innerHTML = `
        ${logosHtml()}
        <div class="receita-head">
          <div class="paciente"><span class="lbl">Paciente</span>${escapeHtml(nomePaciente || '—')}</div>
          <div class="data">${dataStr}</div>
        </div>
        <div class="receita-vazia">Selecione condições ou medicamentos ao lado.<br>A receita é montada aqui, ao vivo.</div>
      `;
      return;
    }

    paper.innerHTML = `
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

  // ---------- Avisos (duplicidade de princípio ativo) ----------
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
    Object.keys(porToken).forEach(token => {
      if(porToken[token].length >= 2){
        const div = document.createElement('div');
        div.className = 'aviso amber';
        const nomeExib = token.charAt(0).toUpperCase() + token.slice(1);
        div.innerHTML = `&#9888; Possível duplicidade: <b>${escapeHtml(nomeExib)}</b> aparece em ${porToken[token].length} itens (${escapeHtml(porToken[token].join(' · '))}). Confira se é intencional.`;
        bar.appendChild(div);
      }
    });
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

  // ---------- Histórico de receitas ----------
  function resumoSelecao(){
    const nomes = Object.values(selected).map(it => it.nome);
    return nomes.slice(0, 4).join(', ') + (nomes.length > 4 ? ' +' + (nomes.length - 4) : '');
  }

  function registrarHistorico(tipo){
    if(Object.keys(selected).length === 0 && Object.keys(selectedOrient).length === 0) return;
    const idsAtuais = Object.keys(selected).sort().join('|') + '§' + Object.keys(selectedOrient).sort().join('|');
    // Dedup: se a última entrada tem os mesmos itens, só atualiza
    if(historico.length && historico[0].ids === idsAtuais){
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
          <b>${escapeHtml(h.paciente || 'Sem nome')}</b> — ${quando}${h.peso ? ' · ' + h.peso + 'kg' : ''}
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
      exportadoEm: new Date().toISOString(),
      customMeds, overrides, overridesMedicamentos, usoCondicoes, historico, customCondicoes,
      medico: { nome: el('medicoNome').value.trim(), crm: el('medicoCrm').value.trim() }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gerador-receitas-backup-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
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
    const base = 'Suas edições, catálogo pessoal, histórico e dados do médico ficam salvos no armazenamento deste app, neste dispositivo. Exporte um backup antes de trocar de computador.';
    const temAlgoParaPerder = customMeds.length || Object.keys(customCondicoes).length || historico.length || Object.keys(overridesMedicamentos).length;
    if(!temAlgoParaPerder){ nota.textContent = base; return; }
    const r = await storage.get('ultimo-backup', false);
    if(!r || !r.value){
      nota.innerHTML = base + ' <b style="color:var(--amber);">Você ainda não exportou nenhum backup.</b>';
      return;
    }
    const dias = Math.floor((Date.now() - new Date(r.value).getTime()) / 86400000);
    if(dias >= 7){
      nota.innerHTML = base + ` <b style="color:var(--amber);">Já fazem ${dias} dias desde o último backup — considere exportar de novo.</b>`;
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
      overridesMedicamentos = payload.overridesMedicamentos && typeof payload.overridesMedicamentos === 'object' ? payload.overridesMedicamentos : {};
      usoCondicoes = payload.usoCondicoes && typeof payload.usoCondicoes === 'object' ? payload.usoCondicoes : {};
      historico = Array.isArray(payload.historico) ? payload.historico : [];
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
    const precisa = anySelectedNeedsPeso();
    const pesoPreenchido = el('peso').value.trim() !== '';
    el('pesoField').classList.toggle('peso-necessario', precisa && !pesoPreenchido);
    el('pesoHint').classList.toggle('show', precisa && !pesoPreenchido);
  }

  function renderTudo(){
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
        const posologia = calcDose(it.posologiaBase, it.fator, peso);
        out += `${String(idx+1).padStart(2,'0')}. ${it.nome} ......... ${it.qtde||''}\n${posologia||''}\n\n`;
      });
    });

    if(orientacoes.length){
      out += `ORIENTAÇÕES\n`;
      orientacoes.forEach(o => { out += `- ${o.texto}\n`; });
    }
    return out;
  }

  function showToast(msg){
    const t = el('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1800);
  }

  async function copiarTexto(){
    const texto = gerarTextoPuro();
    try{
      await navigator.clipboard.writeText(texto);
      showToast('Texto copiado');
    }catch(e){
      // fallback
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try{ document.execCommand('copy'); showToast('Texto copiado'); }
      catch(e2){ showToast('Não consegui copiar automaticamente — selecione o texto manualmente'); }
      document.body.removeChild(ta);
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

  // ---------- Local (Carmo do Paranaíba / Patos de Minas), persistido localmente ----------
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
    const orientacoes = Object.values(selectedOrient).map(o => o.texto);

    const viaOrder = [];
    const grupos = {};
    itens.forEach(it => {
      const via = it.via || 'Outro';
      if(!grupos[via]){ grupos[via] = []; viaOrder.push(via); }
      grupos[via].push({
        nome: it.nome,
        qtde: it.qtde || '',
        posologia: calcDose(it.posologiaBase, it.fator, peso) || ''
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
      dados.orientacoes.forEach(o => {
        paras.push(new Paragraph({ bullet: { level: 0 }, children: [ new TextRun({ text: o, size: 20 }) ] }));
      });
    }
    return paras;
  }

  function gerarDocComum(dados){
    const { Document, Paragraph, TextRun, AlignmentType, ImageRun, BorderStyle } = docx;
    const isPatos = localAtual() === 'patos';
    const cabecalho = isPatos ? [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({ data: base64ParaBytes(LOGO_PATOS_ICON_B64), transformation: { width: 46, height: 61 }, type: 'png' }),
          new TextRun({ text: '   ' }),
          new ImageRun({ data: base64ParaBytes(LOGO_SUS_B64), transformation: { width: 46, height: 24 }, type: 'png' })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [ new TextRun({ text: 'PREFEITURA DE PATOS DE MINAS', bold: true, size: 20, color: '666666' }) ]
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
    return new Document({
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

  function gerarDocControleEspecial(dados){
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

    return new Document({
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838, orientation: 'landscape' } } },
        children: [ masterTable ]
      }]
    });
  }

  // ---------- Modelo Patos de Minas: Receituário de Controle Especial (2 vias) ----------
  function blocoViaDocxPatos(dados, viaLabel){
    const { Table, TableRow, WidthType, Paragraph } = docx;
    const unidade = dados.unidade || 'Secretaria Municipal de Saúde';
    const rows = [];
    rows.push(new TableRow({ children: [
      celulaDocx('Prefeitura de Patos de Minas\n' + unidade, { width: 55, bold: true }),
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
          celulaDocx('Identificação do fornecedor\nPrefeitura de Patos de Minas — Secretaria Municipal de Saúde\nRua Dr. José Olympio de Melo, 151 — Bairro Eldorado — CEP 38.700-900\n\n_______________________________\nAssinatura do farmacêutico        Data', { width: 50, size: 16 })
        ]})
      ]
    });

    return [ table, new Paragraph({ spacing: { before: 100 } }), ...receitaParas, dataPar, new Paragraph({ spacing: { before: 200 } }), rodapeTable ];
  }

  function gerarDocControleEspecialPatos(dados){
    const { Document, Table, TableRow, TableCell, WidthType, VerticalAlign } = docx;
    const via1 = blocoViaDocxPatos(dados, '1ª VIA FARMÁCIA');
    const via2 = blocoViaDocxPatos(dados, '2ª VIA PACIENTE');

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

    return new Document({
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
    const tipo = document.querySelector('input[name=tipoReceita]:checked').value;
    try{
      await garantirDocxCarregado();
      const doc = tipo === 'controle'
        ? (localAtual() === 'patos' ? gerarDocControleEspecialPatos(dados) : gerarDocControleEspecial(dados))
        : gerarDocComum(dados);
      const blob = await docx.Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const nomeArquivo = 'Receita - ' + (dados.paciente !== '—' ? dados.paciente : 'paciente') + ' - ' + dados.data.replace(/\//g,'-') + '.docx';
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast('Arquivo .docx gerado');
    }catch(e){
      console.error(e);
      showToast('Erro ao gerar o .docx — veja o console para detalhes');
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
      const fNorm = norm(f);
      const matches = getOrdemCondicoes().filter(nome =>
        norm(nome).includes(fNorm) || getCondEffective(nome).meds.some(m => norm(m.nome).includes(fNorm))
      );
      matches.sort((a,b) => (usoCondicoes[b]||0) - (usoCondicoes[a]||0));
      if(matches.length){
        const nome = matches[0];
        if(condicaoSelectionState(nome) !== 'all'){
          toggleCondicaoInteira(nome, true);
          showToast('"' + nome + '" adicionada à receita');
        }
      }
    }
  });
  // Atalho "/" foca a busca de qualquer lugar
  document.addEventListener('keydown', (e) => {
    if(e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){
      e.preventDefault();
      el('search').focus();
    }
  });
  // Atalhos 1-9 (aplica a N-ésima condição de "mais usadas") e Ctrl/Cmd+Enter
  // (nova receita) — só fora de campos de texto, pra não atrapalhar digitação.
  document.addEventListener('keydown', (e) => {
    const emCampoDeTexto = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
    if(!emCampoDeTexto && /^[1-9]$/.test(e.key)){
      const chips = [...el('chipsMaisUsadas').querySelectorAll('.chip')];
      const chip = chips[Number(e.key) - 1];
      if(chip){ e.preventDefault(); chip.click(); }
    }
    if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
      e.preventDefault();
      el('btnLimpar').click();
    }
  });

  // Remoção de itens direto pelo papel da receita (delegação)
  el('receitaPaper').addEventListener('click', (e) => {
    const btn = e.target.closest('.rm-item');
    if(!btn) return;
    if(btn.dataset.sel){ delete selected[btn.dataset.sel]; }
    if(btn.dataset.orient){ delete selectedOrient[btn.dataset.orient]; }
    renderTudo();
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
    
    overlay.classList.add('show');
  });

  // Modal de Edição de Itens da Prescrição
  const closeEditModal = () => el('editItemOverlay').classList.remove('show');
  el('btnFecharEditItem').addEventListener('click', closeEditModal);
  el('btnCancelEditItem').addEventListener('click', closeEditModal);
  el('editItemOverlay').addEventListener('click', (e) => {
    if(e.target.id === 'editItemOverlay') closeEditModal();
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && el('editItemOverlay').classList.contains('show')){
      closeEditModal();
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
  el('peso').addEventListener('input', () => { renderReceita(); atualizarDestaquePeso(); });
  document.querySelectorAll('input[name=tipoReceita]').forEach(r => r.addEventListener('change', renderReceita));
  document.querySelectorAll('input[name=localReceita]').forEach(r => r.addEventListener('change', () => { saveLocal(); renderReceita(); }));
  el('btnCopiar').addEventListener('click', async () => { await copiarTexto(); registrarHistorico('copiado'); });
  el('btnDocx').addEventListener('click', async () => { await baixarDocx(); registrarHistorico('docx'); });

  // Encaminhamento
  el('btnEncaminhamento').addEventListener('click', abrirEncaminhamento);
  const closeEncaminhamentoModal = () => el('encaminhamentoOverlay').classList.remove('show');
  el('btnFecharEncaminhamento').addEventListener('click', closeEncaminhamentoModal);
  el('encaminhamentoOverlay').addEventListener('click', (e) => {
    if(e.target.id === 'encaminhamentoOverlay') closeEncaminhamentoModal();
  });
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

  el('medicoNome').addEventListener('change', saveMedico);
  el('medicoCrm').addEventListener('change', saveMedico);
  el('unidadeSaude').addEventListener('input', renderReceita);
  el('unidadeSaude').addEventListener('change', saveUnidade);

  // ---------- Ajuste automático de fonte / paginação da receita de duas vias (impressão) ----------
  const FIT_SCALE_MAX = 1;
  const FIT_SCALE_MIN = 0.62;
  const FIT_SCALE_STEP = 0.04;
  const FIT_COLUMN_WIDTH = 480; // px — largura aproximada de cada via lado a lado em A4 paisagem
  const FIT_MAX_HEIGHT = 620;   // px — altura aproximada disponível por folha (A4 paisagem, margens 12mm)

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
      .rm-item, .edit-item-btn, .pos-vazia{ display:none !important; }
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
      .orientacoes-bloco li{font-size:${s(12.5)}px;color:#4B5A55;margin-bottom:${s(6)}px;}
      .continuacao-nota{font-size:${s(11)}px;font-style:italic;color:#4B5A55;margin-bottom:${s(8)}px;}
    `;
  }

  // Escopa cada seletor da folha de estilo sob #fitProbe, pra que essas regras
  // (pensadas só pra medir a altura da via numa div invisível) nunca vazem pro
  // resto do documento — inclusive a pré-visualização real da receita, que usa
  // as mesmas classes (.via-box, .item-linha etc).
  function scopeCssParaProbe(css){
    return css.replace(/([^{}]+)\{/g, (m, selectors) =>
      selectors.split(',').map(s => '#fitProbe ' + s.trim()).join(', ') + '{'
    );
  }

  function medirProbe(){
    let probe = document.getElementById('fitProbe');
    if(!probe){
      probe = document.createElement('div');
      probe.id = 'fitProbe';
      probe.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;pointer-events:none;width:' + FIT_COLUMN_WIDTH + 'px;';
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
    let html = notaContinuacao ? `<div class="continuacao-nota">${notaContinuacao}</div>` : '';
    let listaAberta = false;
    entradas.forEach(e => {
      if(e.tipo === 'titulo'){
        html += `<div class="via-titulo">Uso ${e.via}</div>`;
      } else if(e.tipo === 'item'){
        const it = e.it;
        const posologia = calcDose(it.posologiaBase, it.fator, peso);
        const precisaPeso = (it.fator !== null && it.fator !== undefined && it.fator !== '') && !peso;
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
        html += `<li>${escapeHtml(e.o.texto)}</li>`;
      }
    });
    if(listaAberta) html += `</ul></div>`;
    return html;
  }

  function calcularEncaixeControle(local, medEntries, orientEntries, peso, nomePaciente, dataStr){
    try{
      const buildVia = corpoHtml => local === 'patos'
        ? viaBoxHtmlPatos(nomePaciente, dataStr, corpoHtml, '1ª VIA FARMÁCIA')
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

      // 2) não coube nem no tamanho mínimo — divide em duas folhas
      const scale = FIT_SCALE_MIN;
      let corte = 1;
      for(let n = entradas.length - 1; n >= 1; n--){
        const html = renderEntradasHtml(entradas.slice(0, n), peso);
        const altura = medirAlturaVia(buildVia(html), scale);
        if(altura <= FIT_MAX_HEIGHT){ corte = n; break; }
      }
      const pagina1 = renderEntradasHtml(entradas.slice(0, corte), peso);
      const restante = entradas.slice(corte);
      let nota = null;
      if(restante.length && restante[0].tipo === 'item'){
        nota = 'Continuação da prescrição — Uso ' + restante[0].it.via;
      } else if(restante.length && restante[0].tipo === 'orientItem'){
        nota = 'Continuação — Orientações';
      }
      const pagina2 = restante.length ? renderEntradasHtml(restante, peso, nota) : null;
      return { scale: Math.round(scale * 100) / 100, paginas: pagina2 ? [ pagina1, pagina2 ] : [ pagina1 ] };
    } finally {
      // Sempre limpa a div/estilo de medição, mesmo que a função retorne mais
      // cedo — sem isso o vazamento de CSS pra página real persistia até o
      // reload (botões de editar/remover somem pra sempre).
      limparProbeDeMedicao();
    }
  }

  el('btnImprimir').addEventListener('click', () => {
    const ehControle = tipoReceitaAtual() === 'controle';
    const local = localAtual();
    let paperHtml;
    let fitScale = 1;

    if(ehControle){
      const nomePaciente = el('nomePaciente').value.trim();
      const peso = el('peso').value;
      const medEntries = Object.entries(selected);
      const orientEntries = Object.entries(selectedOrient);
      const dataStr = new Date().toLocaleDateString('pt-BR');

      if(medEntries.length === 0 && orientEntries.length === 0){
        paperHtml = el('receitaPaper').innerHTML;
      } else {
        const encaixe = calcularEncaixeControle(local, medEntries, orientEntries, peso, nomePaciente, dataStr);
        fitScale = encaixe.scale;
        const montarFolha = corpoHtml => local === 'patos'
          ? `<div class="vias-lado-a-lado">${viaBoxHtmlPatos(nomePaciente, dataStr, corpoHtml, '1ª VIA FARMÁCIA')}${viaBoxHtmlPatos(nomePaciente, dataStr, corpoHtml, '2ª VIA PACIENTE', 'via-2')}</div>`
          : `<div class="vias-lado-a-lado">${viaBoxHtml(nomePaciente, dataStr, corpoHtml, '1ª VIA FARMÁCIA')}${viaBoxHtml(nomePaciente, dataStr, corpoHtml, '2ª VIA PACIENTE', 'via-2')}</div>`;
        paperHtml = encaixe.paginas.map((corpo, i) => {
          const folha = montarFolha(corpo);
          return i === 0 ? folha : `<div class="folha-seguinte">${folha}</div>`;
        }).join('');
      }
    } else {
      paperHtml = el('receitaPaper').innerHTML;
    }

    const printStyles = `
      ${ehControle ? '@page{ size: landscape; margin: 12mm; }' : '@page{ size: portrait; margin: 14mm 16mm; }'}
      body{font-family:'Inter',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#16241F; padding:34px 38px; max-width:${ehControle ? '1000px' : '700px'}; margin:0 auto;}
      .folha-seguinte{ page-break-before: always; }
      .vias-lado-a-lado{display:flex; gap:16px; align-items:flex-start;}
      .vias-lado-a-lado .via-box{flex:1 1 0; min-width:0; margin-bottom:0;}
      .receita-logos{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
      .receita-logos .logo-carmo{height:38px;width:auto;}
      .receita-logos .logo-sus{height:30px;width:auto;}
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
      .rm-item, .edit-item-btn, .pos-vazia{ display:none !important; }
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
      .orientacoes-bloco li{font-size:12.5px;color:#4B5A55;margin-bottom:6px;}
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
    const printWindow = window.open('', '_blank');
    if(!printWindow){
      showToast('Pop-up bloqueado — permita pop-ups ou abra o arquivo direto no navegador');
      return;
    }
    printWindow.document.write(
      '<html><head><title>Receita</title><meta charset="UTF-8">' +
      '<style>' + printStyles + '</style></head><body>' + paperHtml + '</body></html>'
    );
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
    registrarHistorico('impresso');
  });
  el('btnLimpar').addEventListener('click', () => {
    selected = {}; selectedOrient = {};
    el('nomePaciente').value=''; el('peso').value='';
    renderTudo();
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
      
      const cond = customCondicoes[nome] || DATA.condicoes[nome] || { meds: [], orientacoes: [] };
      
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
        el('editorBtnExcluir').style.display = 'block';
        el('editorBtnExcluir').textContent = 'Excluir Condição';
        el('editorBtnExcluir').style.borderColor = 'var(--danger)';
        el('editorBtnExcluir').style.color = 'var(--danger)';
      } else if(isEdited){
        el('editorBtnExcluir').style.display = 'block';
        el('editorBtnExcluir').textContent = 'Restaurar Padrão';
        el('editorBtnExcluir').style.borderColor = 'var(--amber)';
        el('editorBtnExcluir').style.color = 'var(--amber)';
      } else {
        el('editorBtnExcluir').style.display = 'none';
      }
    }
  }

  function addMedRowToEditor(med = null){
    const container = el('editorMedsContainer');

    const box = document.createElement('div');
    box.className = 'editor-med-box';
    box.innerHTML = `
      <button type="button" class="btn-remove-row" title="Remover">&times;</button>
      <input type="text" class="ed-med-nome" placeholder="Nome do medicamento (ex: Dipirona 500mg)" value="${med ? escapeHtml(med.nome) : ''}" style="width: 100%; padding: 7px 8px; border: 1px solid var(--line); border-radius: 6px; font-family: inherit; font-size: 12.5px;" list="datalistMedicamentosEditor">
      <div style="display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 6px;">
        <input type="text" class="ed-med-qtde" placeholder="Qtde" value="${med ? escapeHtml(med.qtde || '') : ''}" style="padding: 7px 8px; border: 1px solid var(--line); border-radius: 6px; font-family: inherit; font-size: 12.5px;">
        <select class="ed-med-via" style="padding: 7px 8px; border: 1px solid var(--line); border-radius: 6px; font-family: inherit; font-size: 12.5px;">
          ${renderViaOptions(med ? med.via : null)}
        </select>
        <input type="text" class="ed-med-fator" placeholder="Fator/kg" value="${med && med.fator !== null && med.fator !== undefined ? med.fator : ''}" style="padding: 7px 8px; border: 1px solid var(--line); border-radius: 6px; font-family: inherit; font-size: 12.5px;">
      </div>
      <textarea class="ed-med-pos" placeholder="Posologia (use DOSE para cálculo por peso)" style="width: 100%; margin-top: 6px; padding: 6px 8px; border: 1px solid var(--line); border-radius: 6px; font-family: inherit; font-size: 12.5px; min-height: 44px; resize: vertical;">${med ? escapeHtml(med.posologia || '') : ''}</textarea>
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
    row.style.marginBottom = '6px';
    row.innerHTML = `
      <textarea class="ed-orient-texto" placeholder="Orientação para o paciente" style="width: 100%; padding: 6px 8px; border: 1px solid var(--line); border-radius: 6px; font-family: inherit; font-size: 12.5px; min-height: 44px; resize: vertical;">${escapeHtml(texto)}</textarea>
      <button type="button" class="btn-remove-row" title="Remover">&times;</button>
    `;
    
    row.querySelector('.btn-remove-row').addEventListener('click', () => {
      row.remove();
      if(container.children.length === 0) addOrientRowToEditor();
    });
    
    container.appendChild(row);
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

          meds.push({
            nome: mNome,
            qtde: qtde || null,
            via: via,
            fator: fator,
            posologia: posologia || null
          });
        }
      });
      
      const orientacoes = [];
      const orientRows = el('editorOrientsContainer').querySelectorAll('.editor-orient-row');
      orientRows.forEach(row => {
        const txt = row.querySelector('.ed-orient-texto').value.trim();
        if(txt) orientacoes.push(txt);
      });
      
      customCondicoes[nome] = { meds, orientacoes };
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
        await saveCustomCondicoes();
        populateEditorMedsDatalist();
        showToast('Condição excluída');
      } else {
        const ok = typeof window.confirm === 'function' ? window.confirm('Restaurar a conduta "' + nome + '" para o padrão de fábrica? Isso apagará suas personalizações nela.') : true;
        if(!ok) return;
        delete customCondicoes[nome];
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
    await loadCustomMeds();
    await loadCustomCondicoes();
    await loadOverrides();
    await loadOverridesMedicamentos();
    await loadMedico();
    await loadLocal();
    await loadUnidade();
    await loadUso();
    await loadHistorico();
    atualizarAvisoBackup();
    renderHistorico();
    renderTudo();
    initEditorCondicoes();
  })();
})();
