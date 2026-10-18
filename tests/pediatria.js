// Testes unitários da conversão adulto -> pediátrico (sem navegador).
const assert = require('assert');
const { converterParaPediatrico } = require('../js/pediatria');

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

console.log('pediatria: OK');
