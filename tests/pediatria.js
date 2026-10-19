// Testes unitários da conversão adulto -> pediátrico (sem navegador).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const P = require('../js/pediatria');
const { converterParaPediatrico, contarConversiveis, regraPara, doseDoItem, avisosDoItem, idadeEmMeses } = P;
const item = (nome, posologiaBase = 'x', extra = {}) => Object.assign({ nome, qtde: '01 Caixa', posologiaBase, via: 'Oral', fator: null }, extra);

const receita = () => [
  ['a', { nome: 'Dipirona 500mg', qtde: '01 Caixa', posologiaBase: 'Tomar 02 comprimidos', via: 'Oral', fator: null, origemCondicao: 'Dor Muscular' }],
  ['b', { nome: 'Ibuprofeno 600 mg', qtde: '01 Caixa', posologiaBase: 'Tomar 01 comprimido', via: 'Oral', fator: null }],
  ['c', { nome: 'Ciclobenzaprina 10mg', qtde: '01 Caixa', posologiaBase: 'x', via: 'Oral', fator: null }],
];

// exige peso
assert.ok(converterParaPediatrico(receita(), '').erro);
assert.ok(converterParaPediatrico(receita(), 0).erro);

// caso do exemplo: 20 kg
const r = converterParaPediatrico(receita(), '20');
assert.deepStrictEqual(r.entries.map(([id]) => id), ['a', 'b']);       // ciclobenzaprina removida
assert.strictEqual(r.entries[0][1].nome, 'Dipirona 500 mg/mL');
assert.strictEqual(r.entries[0][1].fator, 0.6);
assert.strictEqual(r.entries[0][1].origemCondicao, 'Dor Muscular');    // preserva campos do item
assert.strictEqual(r.entries[1][1].nome, 'Ibuprofeno 50 mg/mL');
assert.strictEqual(r.entries[1][1].fator, 1);
assert.strictEqual(r.removidos.length, 1);
assert.ok(/Ciclobenzaprina/.test(r.removidos[0].nome));
assert.strictEqual(r.convertidos, 2);
assert.ok(!r.avisos.some(a => /excede/.test(a)));

// não muta a entrada
const orig = receita();
converterParaPediatrico(orig, 20);
assert.strictEqual(orig[0][1].nome, 'Dipirona 500mg');

// teto de 40 gotas de ibuprofeno e aviso de peso alto
const g = converterParaPediatrico(receita(), 45);
assert.ok(g.avisos.some(a => /excede o máximo de 40/.test(a)));
assert.ok(g.avisos.some(a => /acima de 40 kg/.test(a)));

// item já pediátrico ou já por peso é mantido; sem regra e sem peso avisa
const m = converterParaPediatrico([
  ['x', { nome: 'Dipirona 500 mg/mL', fator: 0.6, via: 'Oral' }],
  ['y', { nome: 'Amoxicilina 50mg/mL', fator: 0.33, via: 'Oral' }],
  ['z', { nome: 'Omeprazol 20mg', fator: null, via: 'Oral' }],
], 15);
assert.deepStrictEqual(m.entries.map(([id]) => id), ['x', 'y', 'z']);
assert.strictEqual(m.convertidos, 0);
assert.strictEqual(m.entries[0][1].nome, 'Dipirona 500 mg/mL');
assert.strictEqual(m.avisos.filter(a => /Omeprazol/.test(a)).length, 1);
assert.ok(!m.avisos.some(a => /Amoxicilina/.test(a)));

// faixas de peso: loratadina 5 mL até 30 kg, 10 mL acima; duração herdada da posologia de adulto
const lor = converterParaPediatrico([['l', item('Loratadina 10mg', 'Tomar 01 comprimido ao dia, por 05 dias.')]], 20).entries[0][1];
assert.strictEqual(lor.nome, 'Loratadina 1mg/mL');
assert.strictEqual(lor.posologiaBase, 'Tomar DOSE mL, 01 vez ao dia, por 05 dias.');
assert.strictEqual(doseDoItem(lor, 20).valor, 5);
assert.strictEqual(doseDoItem(lor, 30).valor, 5);
assert.strictEqual(doseDoItem(lor, 35).valor, 10);

// ondansetrona por faixa: abaixo de 8 kg a dose fica em branco (valor null) e avisa
const ond = converterParaPediatrico([['o', item('Ondansetrona 8mg')]], 6).entries[0][1];
assert.strictEqual(doseDoItem(ond, 6).valor, null);
assert.strictEqual(doseDoItem(ond, 10).valor, '1/2 comprimido (2 mg)');
assert.strictEqual(doseDoItem(ond, 15).valor, '1/2 comprimido (2 mg)');
assert.strictEqual(doseDoItem(ond, 15.5).valor, '01 comprimido (4 mg)');
assert.strictEqual(doseDoItem(ond, 31).valor, '02 comprimidos (8 mg)');
assert.ok(avisosDoItem(ond, 6, 24).some(a => /peso fora das faixas/.test(a)));
assert.ok(!avisosDoItem(ond, 6, 24).some(a => /abaixo do mínimo de 8 kg/.test(a)));   // um aviso só

// azitromicina vira dois itens (1º dia e 2º ao 5º), com ids derivados
const az = converterParaPediatrico([['z', item('Azitromicina 500mg')]], 20);
assert.deepStrictEqual(az.entries.map(([id]) => id), ['z#ped1', 'z#ped2']);
assert.strictEqual(doseDoItem(az.entries[0][1], 20).valor, 5);
assert.strictEqual(doseDoItem(az.entries[1][1], 20).valor, 3);   // 2,5 arredonda para 3
assert.strictEqual(doseDoItem(az.entries[0][1], 60).valor, 12);  // teto
assert.strictEqual(az.convertidos, 1);

// amoxicilina: duração do adulto é mantida; sem duração usa o padrão; clavulanato não converte
const amx = converterParaPediatrico([
  ['a', item('Amoxicilina 500mg', 'Tomar 01 comprimido de 08/08 horas por 07 dias')],
  ['b', item('Amoxicilina 500mg', 'Tomar 01 comprimido de 08/08 horas')],
  ['c', item('Amoxicilina + Clavulanato 875/125 mg')],
], 20);
assert.strictEqual(amx.entries[0][1].posologiaBase, 'Tomar DOSE mL, de 08/08 horas, por 07 dias.');
assert.strictEqual(amx.entries[1][1].posologiaBase, 'Tomar DOSE mL, de 08/08 horas, por 10 dias.');
assert.strictEqual(amx.entries[2][1].nome, 'Amoxicilina + Clavulanato 875/125 mg');
assert.ok(amx.fixos.some(a => /Clavulanato.*sem regra/.test(a)));

// remoção respeita a idade-limite da regra: tramadol sai aos 10 anos, fica aos 13
assert.strictEqual(converterParaPediatrico([['t', item('Tramadol 50mg')]], 30, { idadeMeses: 120 }).removidos.length, 1);
const t13 = converterParaPediatrico([['t', item('Tramadol 50mg')]], 45, { idadeMeses: 156 });
assert.strictEqual(t13.removidos.length, 0);
assert.strictEqual(t13.entries.length, 1);

// regras só de aviso não contam como conversíveis (senão a conversão automática não para)
assert.strictEqual(regraPara(item('Omeprazol 20mg')).acao, 'avisar');
assert.strictEqual(contarConversiveis([['o', item('Omeprazol 20mg')], ['d', item('Dipirona 500mg')]]), 1);
assert.strictEqual(contarConversiveis([['t', item('Tramadol 50mg')]], 156), 0);
// item já convertido nunca casa de novo; líquido não é substituído
assert.strictEqual(regraPara(Object.assign(item('Dipirona 500mg'), { convertidoPediatrico: true })), null);
assert.strictEqual(regraPara(item('Dipirona 500 mg/mL')), null);
// dextrometorfano em xarope é removido mesmo sendo líquido (incluiLiquidos)
assert.strictEqual(regraPara(item('Dextrometorfano 15mg/5mL (Xarope)'), 48).acao, 'remover');
assert.strictEqual(regraPara(item('Dextrometorfano 15mg/5mL (Xarope)'), 96).acao, 'remover');   // 6 a 12 anos: a dose de adulto é o dobro
assert.strictEqual(regraPara(item('Dextrometorfano 15mg/5mL (Xarope)'), 156), null);
// colírio, pomada e injetável não viram gotas/xarope (nem geram aviso de "sem regra")
assert.strictEqual(regraPara(item('Prednisolona 1% - Colírio', 'x', { via: 'Oftálmico' })), null);
assert.strictEqual(regraPara(item('Dipirona 1g/2mL', 'x', { via: 'Intramuscular' })), null);
assert.strictEqual(regraPara(item('Prednisona 20mg')).acao, 'substituir');
const col = converterParaPediatrico([['c', item('Prednisolona 1% - Colírio', 'x', { via: 'Oftálmico' })]], 20);
assert.strictEqual(col.entries[0][1].nome, 'Prednisolona 1% - Colírio');
assert.strictEqual(col.fixos.length, 0);
// hidratação da dengue: aviso de volume pediátrico
assert.strictEqual(regraPara(item('Manhã')).acao, 'avisar');

// idade mínima: aviso quando a idade informada é menor
const dip = converterParaPediatrico([['d', item('Dipirona 500mg')]], 6, { idadeMeses: 2 }).entries[0][1];
assert.ok(avisosDoItem(dip, 6, 2).some(a => /abaixo da idade mínima de 3 meses/.test(a)));
assert.ok(!avisosDoItem(dip, 6, 4).some(a => /idade mínima/.test(a)));
assert.ok(avisosDoItem(dip, 6, null).some(a => /confirme idade mínima/.test(a)));

// idade em texto livre
[['4', 48], ['4a', 48], ['4 anos', 48], ['8m', 8], ['8 meses', 8], ['1a6m', 18], ['2 anos e 3 meses', 27], ['1,5', 18], ['', null], ['abc', null]]
  .forEach(([txt, esperado]) => assert.strictEqual(idadeEmMeses(txt), esperado, txt));

// ---------- Conferência do catálogo (js/dados.js) ----------
const DATA = new Function(fs.readFileSync(path.join(__dirname, '../js/dados.js'), 'utf8') + '; return DATA;')();
const itens = [];
Object.entries(DATA.condicoes).forEach(([c, v]) => v.meds.forEach(m => itens.push([c, m])));
DATA.medicamentos.forEach(m => itens.push(['(avulso)', Object.assign({}, m, { nome: [m.nome, m.concentracao].filter(Boolean).join(' ') })]));
itens.forEach(([c, m]) => {
  const ref = `${c} / ${m.nome}`;
  const porPeso = P.itemPorPeso(m);
  // DOSE na posologia <=> item calculado pelo peso
  assert.strictEqual(/DOSE(?! ÚNICA)/.test(m.posologia || ''), porPeso, `DOSE sem fator/faixas (ou o contrário): ${ref}`);
  if(m.max !== undefined) assert.ok(typeof m.max === 'number' && m.max > 0 && porPeso, `max inválido: ${ref}`);
  if(m.idadeMinMeses !== undefined) assert.ok(Number.isInteger(m.idadeMinMeses) && m.idadeMinMeses > 0, `idadeMinMeses inválido: ${ref}`);
  if(m.pesoMinKg !== undefined) assert.ok(typeof m.pesoMinKg === 'number' && m.pesoMinKg > 0, `pesoMinKg inválido: ${ref}`);
  if(m.faixas !== undefined){
    assert.ok(Array.isArray(m.faixas) && m.faixas.length, `faixas vazias: ${ref}`);
    m.faixas.forEach((f, i) => {
      assert.ok(typeof f.ateKg === 'number' && (i === 0 || f.ateKg > m.faixas[i - 1].ateKg), `faixas fora de ordem: ${ref}`);
      assert.ok(('valor' in f) !== ('fator' in f), `faixa precisa de valor OU fator: ${ref}`);
    });
  }
});
// tetos conferidos nos itens pediátricos das condições
const med = (c, n) => DATA.condicoes[c].meds.find(m => m.nome === n);
assert.strictEqual(doseDoItem(med('Faringoamigdalite', 'Amoxicilina 50mg/mL'), 45).valor, 10);
assert.strictEqual(doseDoItem(med('Pneumonia (Criança)', 'Amoxicilina 50mg/mL'), 70).valor, 20);
assert.strictEqual(doseDoItem(med('Pneumonia (Criança)', 'Dipirona 500 mg/mL'), 80).valor, 40);
assert.strictEqual(doseDoItem(med('Pneumonia (Criança)', 'Ondansetrona 4mg (Comprimido)'), 15).valor, '1/2 comprimido (2 mg)');
assert.ok(!DATA.condicoes['Vertigem'].meds.some(m => /meclin/i.test(m.nome)));

// ---------- Receita em 2 vias (js/vias.js) ----------
const V = require('../js/vias');
assert.strictEqual(V.classificar({ nome: 'Amoxicilina 500mg', via: 'Oral' }), 'antimicrobiano');
assert.strictEqual(V.classificar({ nome: 'Amoxicilina + Clavulanato 875/125 mg', via: 'Oral' }), 'antimicrobiano');
assert.strictEqual(V.classificar({ nome: 'Ceftriaxona 1g', via: 'Intravenoso' }), 'antimicrobiano');
assert.strictEqual(V.classificar({ nome: 'Metronidazol 100mg/g', via: 'Vaginal' }), null);       // gel vaginal fica na comum
assert.strictEqual(V.classificar({ nome: 'Neomicina + Bacitracina Pomada', via: 'Tópico' }), null);
assert.strictEqual(V.classificar({ nome: 'Tramadol 50mg', via: 'Oral' }), 'controle');
assert.strictEqual(V.classificar({ nome: 'Paracetamol + Codeína 500/30mg', via: 'Oral' }), 'controle');
assert.strictEqual(V.classificar({ nome: 'Fluoxetina 20mg', via: 'Oral' }), 'controle');
assert.strictEqual(V.classificar({ nome: 'Clonazepam 0,5mg', via: 'Sublingual' }), 'notificacao');
assert.strictEqual(V.classificar({ nome: 'Dipirona 500mg', via: 'Oral' }), null);
assert.strictEqual(V.classificar({ nome: 'Ciclobenzaprina 10mg', via: 'Oral' }), null);
assert.strictEqual(V.classificar('Azitromicina 500mg'), 'antimicrobiano');                        // sem via = oral

console.log('pediatria: OK');
