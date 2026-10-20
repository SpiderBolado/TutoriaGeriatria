// Receita em 2 vias: o que vai para o receituário de controle especial quando
// a receita é separada sozinha ("Separar sozinho").
//   antimicrobiano — RDC ANVISA 471/2021: receita em 2 vias, a 1ª fica na farmácia;
//   controle       — Portaria SVS/MS 344/1998, lista C1 e preparações da A2
//                    (tramadol, codeína): Receita de Controle Especial em 2 vias;
//                    fenobarbital: adendo da lista B1 — como anticonvulsivante vai em
//                    Receita de Controle Especial (conferir no texto consolidado da Anvisa);
//   notificacao    — listas B1/B2 (benzodiazepínicos, zolpidem): exigem a
//                    Notificação de Receita B (azul), que este app não imprime.
// Só vale para via sistêmica (oral, sublingual, injetável): pomada, creme,
// colírio e óvulo ficam na receita comum. É um ponto de partida: na receita,
// cada item pode ser trocado de lado.
(function(root){
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  const ANTIMICROBIANOS = /\b(amoxicilina|ampicilina|azitromicina|claritromicina|eritromicina|cefalexina|cefadroxila|cefaclor|cefuroxima|cefixima|cefpodoxima|ceftriaxona|cefazolina|cefotaxima|cefepima|penicilina|benzilpenicilina|benzetacil|oxacilina|ciprofloxacino|levofloxacino|norfloxacino|moxifloxacino|ofloxacino|sulfametoxazol|trimetoprima|bactrim|nitrofurantoina|fosfomicina|(?:benzoil)?metronidazol|secnidazol|tinidazol|doxiciclina|tetraciclina|minociclina|clindamicina|linezolida|gentamicina|amicacina|vancomicina)\b/;
  const CONTROLE = /\b(tramadol|codeina|amitriptilina|nortriptilina|imipramina|clomipramina|fluoxetina|sertralina|paroxetina|citalopram|escitalopram|venlafaxina|desvenlafaxina|duloxetina|bupropiona|trazodona|mirtazapina|carbamazepina|oxcarbazepina|valproico|valproato|divalproato|lamotrigina|topiramato|gabapentina|pregabalina|fenitoina|levetiracetam|fenobarbital|haloperidol|quetiapina|risperidona|olanzapina|aripiprazol|clorpromazina|levomepromazina|biperideno|litio)\b/;
  const NOTIFICACAO_B = /\b(clonazepam|diazepam|alprazolam|lorazepam|bromazepam|midazolam|clobazam|nitrazepam|flunitrazepam|cloxazolam|zolpidem|zopiclona)\b/;
  const VIA_SISTEMICA = /^(|oral|sublingual|intramuscular|intravenoso|subcutaneo|injetavel)$/;

  const ROTULO = { antimicrobiano: 'antimicrobiano', controle: 'controle especial', notificacao: 'Notificação de Receita B' };

  // 'antimicrobiano' | 'controle' | 'notificacao' | null
  function classificar(item){
    const it = typeof item === 'string' ? { nome: item } : (item || {});
    if(!VIA_SISTEMICA.test(norm(it.via))) return null;
    const n = norm(it.nome);
    if(NOTIFICACAO_B.test(n)) return 'notificacao';
    if(CONTROLE.test(n)) return 'controle';
    if(ANTIMICROBIANOS.test(n)) return 'antimicrobiano';
    return null;
  }

  const api = { classificar, ROTULO };
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VIAS = api;
})(typeof window !== 'undefined' ? window : globalThis);
