// Funções puras da ponte com o Quadro: alergia x remédio e sugestão pela queixa.
const assert = require('assert');
const P = require('../js/ponte.js');
const D = (() => { const fs = require('fs'), vm = require('vm'); const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(__dirname + '/../js/dados.js', 'utf8') + ';this.D=(typeof DATA!=="undefined"?DATA:window.DATA)', ctx); return ctx.D; })();
const existe = n => !!D.condicoes[n];

// alergia: nome direto, grupo e falso positivo
assert.strictEqual(P.conflitoAlergia('Dipirona 500mg', ['dipirona']), 'dipirona');
assert.strictEqual(P.conflitoAlergia('Novalgina gotas', ['dipirona']), 'dipirona');
// componente e classe: Buscopan composto tem dipirona; flurbiprofeno e ácido mefenâmico são AINE
assert.strictEqual(P.conflitoAlergia('Buscopan composto', ['dipirona']), 'dipirona');
assert.strictEqual(P.conflitoAlergia('Flurbiprofeno 8,75mg', ['AINE']), 'AINE');
assert.strictEqual(P.conflitoAlergia('Ácido Mefenâmico 500 mg', ['anti-inflamatório']), 'anti-inflamatório');
assert.strictEqual(P.conflitoAlergia('Buscopan', ['dipirona']), null);
assert.strictEqual(P.conflitoAlergia('Amoxicilina + Clavulanato 875mg', ['penicilina']), 'penicilina');
assert.strictEqual(P.conflitoAlergia('Ibuprofeno 600 mg', ['aine']), 'aine');
assert.strictEqual(P.conflitoAlergia('Nimesulida 100mg', ['anti-inflamatorio']), 'anti-inflamatorio');
assert.strictEqual(P.conflitoAlergia('Sulfametoxazol + Trimetoprima', ['sulfa']), 'sulfa');
assert.strictEqual(P.conflitoAlergia('Azitromicina 500mg', ['penicilina']), null);
assert.strictEqual(P.conflitoAlergia('Paracetamol 750mg', ['dipirona']), null);
assert.strictEqual(P.conflitoAlergia('Dipirona 500mg', []), null);
assert.strictEqual(P.conflitoAlergia('AAS 100mg', ['Dipirona e AAS']), 'Dipirona e AAS');
assert.strictEqual(P.conflitoAlergia('Ibuprofeno 600 mg', ['Dipirona, AINEs']), 'Dipirona, AINEs');
assert.strictEqual(P.conflitoAlergia('Amoxicilina 500mg', ['Alergia a penicilina']), 'Alergia a penicilina');
assert.strictEqual(P.conflitoAlergia('Dipirona 500mg', ['Alérgico a dipirona']), 'Alérgico a dipirona');
assert.strictEqual(P.conflitoAlergia('Cefalexina 500mg', ['Sulfa / cefalosporinas']), 'Sulfa / cefalosporinas');
assert.strictEqual(P.conflitoAlergia('Paracetamol 750mg', ['Dipirona e AAS']), null);

// queixa → condições que existem no catálogo (no máximo 3)
const sug = q => P.sugerirCondicoes(q, existe);
// "gotas" não é gota (doença)
assert.ok(!P.sugerirCondicoes('dipirona gotas', () => true).includes('Gota'));
assert.ok(P.sugerirCondicoes('crise de gota', () => true).includes('Gota'));
assert.deepStrictEqual(sug('dor lombar há 2 dias'), ['Dor Muscular']);
assert.deepStrictEqual(sug('Ardência para urinar e polaciúria'), ['ITU']);
assert.deepStrictEqual(sug('dor de garganta e febre'), ['Faringoamigdalite', 'Faringite']);
// sinônimos comuns de disúria e de sinusite
['ardência urinária', 'dor ao urinar', 'ardor urinário', 'dor para urinar'].forEach(q => assert.deepStrictEqual(sug(q), ['ITU'], q));
['dor facial', 'pressão na face', 'dor facial, pressão em fronte e secreção nasal'].forEach(q => assert.deepStrictEqual(sug(q), ['Sinusite bomba'], q));
// sem sugestão nova inesperada
assert.deepStrictEqual(sug('pressão alta'), ['Crise Hipertensiva']);
assert.deepStrictEqual(sug('dor abdominal'), ['Dor Abdominal']);
assert.deepStrictEqual(sug('urina com cheiro forte'), []);
assert.deepStrictEqual(sug('vômitos e diarreia'), ['GECA']);
assert.deepStrictEqual(sug('cefaleia'), ['Cefaleia Tensional', 'Enxaqueca']);
assert.deepStrictEqual(P.sugerirCondicoes('pneumonia', existe, 5), ['Pneumonia (Criança)']);
assert.deepStrictEqual(P.sugerirCondicoes('pneumonia', existe, 40), ['Pneumonia (Adulto, sem fator de risco)']);
assert.deepStrictEqual(sug('(sem queixa)'), []);
assert.deepStrictEqual(sug('dor de garganta, alergia a dipirona'), ['Faringoamigdalite', 'Faringite']);
assert.deepStrictEqual(sug('urticária após camarão'), ['Alergia']);
assert.ok(sug('tosse, coriza, dor de garganta, cefaleia').length <= 3);
// todo nome sugerido existe no catálogo
const fonte = require('fs').readFileSync(__dirname + '/../js/ponte.js', 'utf8');
const nomes = [...fonte.matchAll(/\['([^']+)'(?:, '([^']+)')?\]\]/g)].flatMap(m => [m[1], m[2]]).filter(Boolean);
nomes.forEach(n => assert.ok(existe(n), 'condição inexistente na sugestão: ' + n));

assert.strictEqual(P.idadeParaCampo('3 dias'), '0m');
assert.strictEqual(P.idadeParaCampo('54 anos'), '54 anos');
console.log('ponte: OK (' + nomes.length + ' nomes de condição conferidos)');
