// Conversão de receita de adulto para pediátrica.
// Regras em dados: cada uma casa pelo nome normalizado do item (sem acento,
// minúsculo); vale a primeira que casar. A ação pode ser:
//   substituir — troca pela apresentação pediátrica (dose por peso, com teto);
//   remover    — tira o item (inadequado em criança), com o motivo;
//   avisar     — mantém o item e mostra um aviso para o médico.
// Doses conferidas por pesquisa com conferência independente (bula ANVISA, MS,
// SBP); onde o catálogo do médico já tinha dose por kg, ela foi mantida e só
// ganhou teto e idade mínima. Nada é convertido sem regra.
(function(root){
  const PESO_MAX_KG = 40; // acima disso a criança tende a usar dose de adulto

  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  // "500 mg/mL", "gotas", "suspensão" etc.: item que já é formulação pediátrica
  const jaPediatrico = nome => /\/\s*ml|gotas|xarope|suspens/.test(norm(nome));
  const ehOral = it => !it.via || norm(it.via) === 'oral';
  const toKg = p => { const v = parseFloat(String(p === undefined || p === null ? '' : p).replace(',', '.')); return v > 0 ? v : null; };
  const numBR = n => String(n).replace('.', ',');

  // ---------- Itens pediátricos (reutilizados nas regras) ----------
  const DIPIRONA_GOTAS = { nome: 'Dipirona 500 mg/mL', qtde: '01 Frasco', via: 'Oral', fator: 0.6, max: 40, idadeMinMeses: 3, pesoMinKg: 5,
    posologiaBase: 'Tomar DOSE gotas, de 06/06 horas, se dor ou febre (temperatura axilar maior ou igual a 37,8ºC).' };

  const REGRAS = [
    // ===== Substituições (comprimido de adulto -> apresentação pediátrica) =====
    { match: /^dipirona\b/, acao: 'substituir', por: DIPIRONA_GOTAS, unidade: 'gotas', mgPorUnidade: 25,
      aviso: 'Calibração de gotas/mL varia um pouco entre fabricantes.',
      fonte: 'Fator do catálogo (0,6 gota/kg ≈ 15 mg/kg); teto 40 gotas (1 g); bula: não usar < 3 meses ou < 5 kg.' },
    { match: /^paracetamol\b/, acao: 'substituir', unidade: 'gotas', mgPorUnidade: 13.3,
      por: { nome: 'Paracetamol 200mg/mL', qtde: '01 Frasco', via: 'Oral', fator: 1, max: 35,
        posologiaBase: 'Dar DOSE gotas, de 06/06 horas, se dor ou febre.' },
      aviso: 'No máximo 5 doses em 24 h.',
      fonte: 'Fator do catálogo (1 gota/kg ≈ 13 mg/kg); teto 35 gotas por dose (bulas Prati-Donaduzzi, Medquímica).' },
    { match: /^ibuprofeno\b/, acao: 'substituir', unidade: 'gotas', mgPorUnidade: 5,
      por: { nome: 'Ibuprofeno 50 mg/mL', qtde: '01 Frasco', via: 'Oral', fator: 1, max: 40, idadeMinMeses: 6,
        posologiaBase: 'Tomar DOSE gotas, de 08/08 horas, se dor ou febre, por no máximo 05 dias.' },
      aviso: '1 gota = 5 mg (bula: 1–2 gotas/kg, máx. 40 gotas por dose). Evitar na suspeita de dengue ou desidratação.',
      fonte: 'Dose baixa da bula (5 mg/kg); o "Ibuprofeno 200mg/mL" do catálogo usa 10 mg/kg — conferir a apresentação da farmácia.' },
    { match: /^amoxicilina\b/, exceto: /clavul/, acao: 'substituir', unidade: 'mL', mgPorUnidade: 50,
      por: { nome: 'Amoxicilina 50mg/mL', qtde: '02 Frascos', via: 'Oral', fator: 0.33, max: 10, idadeMinMeses: 3, volumeFrascoMl: 150,
        posologiaBase: 'Tomar DOSE mL, de 08/08 horas, {duracao}.' },
      duracaoPadrao: 'por 10 dias',
      aviso: 'Teto de 10 mL (500 mg) por dose; na pneumonia pode ir até 20 mL (1 g). Frasco de 150 mL: confira a quantidade.',
      fonte: 'Fator do catálogo (0,33 mL/kg ≈ 50 mg/kg/dia); teto IDSA 500 mg/dose.' },
    { match: /^azitromicina\b/, acao: 'substituir', unidade: 'mL', mgPorUnidade: 40,
      por: [
        { nome: 'Azitromicina 40mg/mL - 1º dia', qtde: '01 Frasco', via: 'Oral', fator: 0.25, max: 12, idadeMinMeses: 6,
          posologiaBase: 'Tomar DOSE mL, 01 vez, no 1º dia.' },
        { nome: 'Azitromicina 40mg/mL - 2º ao 5º dia', qtde: '(mesmo frasco)', via: 'Oral', fator: 0.125, max: 6, idadeMinMeses: 6,
          posologiaBase: 'Tomar DOSE mL, 01 vez ao dia, do 2º ao 5º dia.' }
      ],
      aviso: 'Esquema pediátrico do catálogo: 10 mg/kg no 1º dia e 5 mg/kg do 2º ao 5º (total de bula).',
      fonte: 'Fatores do catálogo (Pneumonia Criança); tetos = dose adulta (500/250 mg).' },
    { match: /^cefalexina\b/, acao: 'substituir', unidade: 'mL', mgPorUnidade: 50,
      por: { nome: 'Cefalexina 50mg/mL', qtde: '02 Frascos', via: 'Oral', fator: 0.25, max: 10, idadeMinMeses: 3, volumeFrascoMl: 100,
        posologiaBase: 'Tomar DOSE mL, de 06/06 horas, {duracao}.' },
      duracaoPadrao: 'por 07 dias',
      aviso: '50 mg/kg/dia de 6/6 h (otite pode pedir dose maior). Frasco de 100 mL: confira a quantidade.',
      fonte: 'Bula: 25–50 mg/kg/dia; teto 500 mg/dose.' },
    { match: /^sulfametoxazol\b/, acao: 'substituir', unidade: 'mL', mgPorUnidade: 8,
      por: { nome: 'Sulfametoxazol + Trimetoprima 40+8mg/mL', qtde: '02 Frascos', via: 'Oral', fator: 0.375, max: 20, idadeMinMeses: 2, volumeFrascoMl: 100,
        posologiaBase: 'Tomar DOSE mL, de 12/12 horas, {duracao}.' },
      duracaoPadrao: 'por 07 dias',
      aviso: 'mg calculados como trimetoprima (6 mg/kg/dia). Na ITU, considere 0,5 mL/kg. Evitar na deficiência de G6PD. Frasco de 100 mL: confira a quantidade.',
      fonte: 'Bula BR (TMP 6 mg/kg/dia de 12/12 h); teto = 800/160 mg.' },
    { match: /^prednis(on|olon)a\b/, acao: 'substituir', unidade: 'mL', mgPorUnidade: 3,
      por: { nome: 'Prednisolona 3mg/mL', qtde: '01 Frasco', via: 'Oral', fator: 0.3, max: 13,
        posologiaBase: 'Tomar DOSE mL, pela manhã, {duracao}.' },
      duracaoPadrao: 'por 05 dias',
      aviso: 'Teto de 13 mL (39 mg). Cautela com varicela ativa ou contato recente.',
      fonte: 'Fator do catálogo (0,3 mL/kg ≈ 0,9 mg/kg); teto GINA/BNFC ~40 mg.' },
    { match: /^metoclopramida\b/, acao: 'substituir', unidade: 'gotas', mgPorUnidade: 0.2,
      por: { nome: 'Metoclopramida Gotas 4mg/mL', qtde: '01 Frasco', via: 'Oral', fator: 0.5, max: 50, idadeMinMeses: 12,
        posologiaBase: 'Dar DOSE gotas, de 08/08 horas, se náuseas ou vômitos importantes, por no máximo 05 dias.' },
      aviso: 'Risco de distonia aguda; em criança é segunda linha (prefira ondansetrona).',
      fonte: 'Fator do catálogo (0,1 mg/kg/dose); bula: contraindicada < 1 ano; EMA: máx. 5 dias.' },
    { match: /^ondansetrona\b/, acao: 'substituir',
      por: { nome: 'Ondansetrona 4mg (Comprimido)', qtde: '06 Comprimidos', via: 'Oral', idadeMinMeses: 6, pesoMinKg: 8,
        faixas: [ { ateKg: 7.99, valor: null }, { ateKg: 15, valor: '1/2 comprimido (2 mg)' }, { ateKg: 30, valor: '01 comprimido (4 mg)' }, { ateKg: 999, valor: '02 comprimidos (8 mg)' } ],
        posologiaBase: 'Tomar DOSE, se náuseas ou vômitos importantes, até de 08/08 horas, por no máximo 02 dias.' },
      aviso: 'Faixas de peso do catálogo (Freedman, NEJM 2006). Alarga o QT: cautela junto com azitromicina.',
      fonte: 'Item pediátrico do catálogo (Pneumonia Criança).' },
    // abaixo de 2 anos a loratadina não é indicada: desloratadina xarope, dose pela idade (só com a idade preenchida)
    { match: /^loratadina\b/, soAbaixoMeses: 24, incluiLiquidos: true, incluiPorPeso: true, acao: 'substituir', unidade: 'mL', mgPorUnidade: 0.5,
      porIdade: [
        { ateMeses: 5, remover: 'Loratadina: removida — anti-histamínico oral não indicado antes de 6 meses (loratadina a partir de 2 anos; desloratadina a partir de 6 meses).' },
        { ateMeses: 11, por: { nome: 'Desloratadina 0,5mg/mL', qtde: '01 Frasco', via: 'Oral', idadeMinMeses: 6,
          posologiaBase: 'Dar 02 mL, 01 vez ao dia, {duracao}.' } },
        { ateMeses: 23, por: { nome: 'Desloratadina 0,5mg/mL', qtde: '01 Frasco', via: 'Oral', idadeMinMeses: 6,
          posologiaBase: 'Dar 2,5 mL, 01 vez ao dia, {duracao}.' } }
      ],
      duracaoPadrao: 'por 05 dias',
      aviso: 'Loratadina só a partir de 2 anos; abaixo disso, desloratadina (bula): 6 a 11 meses 2 mL (1 mg), 1 a 5 anos 2,5 mL (1,25 mg), 1 vez ao dia. Não usar antes de 6 meses.',
      fonte: 'Bula desloratadina xarope 0,5 mg/mL; preferência do médico (21/10).' },
    { match: /^loratadina\b/, acao: 'substituir', unidade: 'mL', mgPorUnidade: 1,
      por: { nome: 'Loratadina 1mg/mL', qtde: '01 Frasco', via: 'Oral', idadeMinMeses: 24,
        faixas: [ { ateKg: 30, valor: 5 }, { ateKg: 999, valor: 10 } ],
        posologiaBase: 'Tomar DOSE mL, 01 vez ao dia, {duracao}.' },
      duracaoPadrao: 'por 05 dias',
      aviso: 'Dose por faixa (bula): 5 mL até 30 kg; 10 mL acima. Abaixo de 2 anos, use desloratadina (com a idade preenchida, a conversão troca sozinha).',
      fonte: 'Bula loratadina xarope 1 mg/mL.' },
    { match: /^simeticona\b/, incluiLiquidos: true, acao: 'substituir',
      por: { nome: 'Simeticona 75mg/mL', qtde: '01 Frasco', via: 'Oral',
        posologiaBase: 'Lactentes (até 02 anos): dar 03 a 05 gotas; crianças de 02 a 12 anos: dar 05 a 10 gotas. De 08/08 horas, se gases ou cólica.' },
      aviso: 'Dose fixa por idade (bula Luftal gotas).',
      fonte: 'Bula Luftal gotas.' },

    // ===== Remoções (inadequados em criança) =====
    ...[
      [/^tramadol\b/, 144, 'Tramadol: removido — contraindicado em menores de 12 anos.'],
      [/^ciclobenzaprina\b/, 180, 'Ciclobenzaprina: removida — segurança não estabelecida em menores de 15 anos.'],
      [/^ciprofloxacino\b/, 216, 'Ciprofloxacino: removido — não é primeira escolha em menores de 18 anos.'],
      [/^meloxicam\b/, 144, 'Meloxicam: removido — contraindicado em menores de 12 anos; use o ibuprofeno em gotas.'],
      [/^(trometamol|cetorolaco)\b/, 204, 'Cetorolaco: removido — não indicado em crianças; use dipirona ou ibuprofeno em gotas.'],
      [/^cetoprofeno\b/, 144, 'Cetoprofeno: removido — comprimido de uso adulto; use o ibuprofeno em gotas.'],
      [/^prometazina\b/, 144, 'Prometazina: removida — contraindicada abaixo de 2 anos (depressão respiratória) e comprimido de adulto; considere dexclorfeniramina ou loratadina solução.'],
      [/^amitriptilina\b/, 144, 'Amitriptilina: removida — não recomendada em menores de 12 anos.'],
      [/^betaistina\b|^betahistina\b/, 216, 'Betaistina: removida — não recomendada em menores de 18 anos.'],
      [/^meclin\b|^meclizina\b/, 144, 'Meclin: removido — contraindicado em menores de 12 anos; considere ondansetrona.'],
      [/^cinarizina\b/, 144, 'Cinarizina: removida — de uso adulto; considere ondansetrona se náusea.'],
      [/^domperidona\b/, 144, 'Domperidona: removida — não usar em menores de 12 anos ou abaixo de 35 kg; considere ondansetrona.'],
      [/^bromoprida\b/, 144, 'Bromoprida: removida — sem posologia pediátrica para o comprimido; considere ondansetrona.'],
      [/^dextrometorfano\b/, 144, 'Dextrometorfano: removido — não indicado em crianças pequenas, e a dose de adulto (10 mL) é o dobro da de 6 a 12 anos (bula: 05 mL de 6/6 a 8/8 horas); se for manter (≥ 6 anos), prescreva à parte com a dose da idade. Prefira lavagem nasal e mel (> 1 ano).', true],
      [/^clonazepam\b/, 216, 'Clonazepam: removido — segurança não estabelecida em menores de 18 anos.'],
      [/^fluoxetina\b/, 144, 'Fluoxetina: removida — exige avaliação especializada em criança.'],
      [/^colchicina\b/, 216, 'Colchicina: removida — sem uso pediátrico pertinente nesta condição.'],
      [/^captopril\b/, 216, 'Captopril: removido — a dose fixa de adulto não serve para criança.'],
      [/^tansulozina\b|^tansulosina\b/, 216, 'Tansulosina: removida — uso pediátrico só com urologia.'],
      [/^diosmina\b/, 216, 'Diosmina + Hesperidina: removida — não indicada em crianças.'],
      [/^trimebutina\b/, 144, 'Trimebutina: removida — uso a partir de 12 anos.'],
      [/^pyridium\b|^fenazopiridina\b/, 216, 'Pyridium: removido — contraindicado em crianças.'],
      [/^fosfomicina\b/, 144, 'Fosfomicina: removida — não estabelecida em menores de 12 anos; considere cefalexina suspensão.'],
      [/^buscopan\b/, 144, 'Buscopan composto: removido — comprimido sem posologia pediátrica; use a dipirona em gotas.'],
      [/^tropinal\b/, 144, 'Tropinal: removido — de uso adulto; use a dipirona em gotas.'],
      [/^vacina dt\b/, 84, 'Vacina dT: removida — contraindicada em menores de 7 anos; seguir o calendário do PNI (DTP/Penta).']
    ].map(([match, idadeLimiteMeses, motivo, incluiLiquidos]) => ({ match, acao: 'remover', idadeLimiteMeses, motivo, incluiLiquidos: !!incluiLiquidos })),

    // ===== Avisos (mantém o item) =====
    ...[
      [/^naproxeno\b/, 144, 'Naproxeno: abaixo de 12 anos, prefira o ibuprofeno em gotas.'],
      [/^acido mefenamico\b/, 168, 'Ácido mefenâmico: contraindicado em menores de 14 anos.'],
      [/^acido tranexamico\b/, 144, 'Ácido tranexâmico: só após a menarca.'],
      [/^diclofenaco\b/, 168, 'Diclofenaco: comprimido contraindicado e gel não recomendado em menores de 14 anos (bula); para dor, prefira o ibuprofeno em gotas.'],
      [/^flurbiprofeno\b/, 144, 'Flurbiprofeno pastilha: não indicado em menores de 12 anos.'],
      [/^flogoral\b/, 72, 'Flogoral pastilha: contraindicado em menores de 6 anos (risco de engasgo).'],
      [/^sumatriptano\b/, 144, 'Sumatriptano: retirar abaixo de 12 anos.'],
      [/^hidroxizina\b/, 144, 'Hidroxizina: sem apresentação pediátrica no catálogo; se usar solução 2 mg/mL, ~0,33 mL/kg à noite (máx. 12 mL), a partir de 6 meses; cautela com QT longo.'],
      [/^omeprazol\b/, 144, 'Omeprazol em criança é por peso: 5 a <10 kg 5 mg; 10 a <20 kg 10 mg; ≥ 20 kg 20 mg, 1x/dia.'],
      [/^budesonida\b/, 72, 'Budesonida nasal: a partir de 6 anos; abaixo disso, lavagem nasal.'],
      [/^clenil\b/, 144, 'Clenil: usar com espaçador (com máscara até ~4 anos).'],
      [/^salbutamol\b/, 144, 'Salbutamol: dose em jatos não muda com o peso; sempre com espaçador (máscara bem ajustada abaixo de ~4 anos).'],
      [/^ivermectina\b/, 60, 'Ivermectina: contraindicada abaixo de 15 kg ou de 5 anos; considere permetrina.'],
      [/^terbinafina\b/, 144, 'Terbinafina em criança é por peso: < 20 kg 62,5 mg; 20–40 kg 125 mg; > 40 kg 250 mg.'],
      [/^fluconazol\b/, 144, 'Fluconazol em criança: 6 mg/kg no 1º dia e 3 mg/kg/dia depois (a partir de 6 meses); na candidíase oral, prefira nistatina.'],
      [/^nistatina\b.*(suspens|100\.?000)/, 144, 'Nistatina suspensão em criança (bula): lactentes 01 a 02 mL (prematuros e baixo peso 01 mL), 04 vezes ao dia, metade de cada lado da boca, sem bochecho; crianças maiores 01 a 06 mL. A posologia de adulto (bochechar 05 mL) precisa ser ajustada.'],
      [/^aciclovir\b(?!.*(pomada|creme|%|0\.05))/, 144, 'Aciclovir em criança depende da indicação (varicela: 20 mg/kg/dose 4x/dia, máx. 800 mg/dose, a partir de 2 anos) — ajustar manualmente.'],
      [/^oseltamivir\b/, 144, 'Oseltamivir em criança é por peso, de 12/12 horas por 05 dias: até 15 kg 30 mg; > 15 a 23 kg 45 mg; > 23 a 40 kg 60 mg; > 40 kg 75 mg. Abaixo de 1 ano: 3 mg/kg por dose (9 a 11 meses: 3,5 mg/kg).'],
      [/^sulfadiazina\b/, 2, 'Sulfadiazina de prata: contraindicada nos primeiros 2 meses de vida.'],
      [/^olopatadina\b/, 36, 'Olopatadina colírio: a partir de 3 anos.', true],
      [/^ciclopentolato\b/, 144, 'Ciclopentolato: cautela em lactentes e crianças pequenas.'],
      [/^valerato de betametasona\b/, 144, 'Betametasona tópica: contraindicada em dermatoses de menores de 1 ano; em criança, até 5 dias e sem oclusão (fralda conta).'],
      [/^levon(or)?gestrel\b/, 144, 'Anticoncepcional: só após a menarca.'],
      [/^dolutegravir\b/, 72, 'Dolutegravir 50 mg: só para ≥ 20 kg ou > 6 anos; abaixo disso, formulação dispersível.'],
      [/^lamivudina\b/, 144, 'Lamivudina/Tenofovir: dose de adulto (≥ 12 anos e ≥ 35 kg).'],
      [/^lactulose\b/, 216, 'Lactulose: ajustar a dose para criança.', true],
      [/^vitamina d\b/, 216, 'Vitamina D: dose de criança é diferente (manutenção 400–600 UI/dia; reposição 2.000 UI/dia).'],
      [/^(manha|tarde|noite)$/, 156, 'Hidratação na dengue em criança (< 13 anos, MS): 130 mL/kg/dia até 10 kg, 100 mL/kg/dia de 10 a 20 kg e 80 mL/kg/dia acima de 20 kg (adulto: 60). Os itens Manhã/Tarde/Noite estão com o volume de adulto — ajuste.']
    ].map(([match, idadeLimiteMeses, aviso, incluiLiquidos]) => ({ match, acao: 'avisar', idadeLimiteMeses, aviso, incluiLiquidos: !!incluiLiquidos }))
  ];

  // Regra que vale para o item (ou null). Itens já convertidos nunca casam de novo.
  // idadeMeses: se a idade informada já passa do limite da regra, ela não se aplica.
  function regraPara(item, idadeMeses){
    const it = typeof item === 'string' ? { nome: item } : (item || {});
    if(it.convertidoPediatrico) return null;
    const n = norm(it.nome);
    // substituir só vale para forma oral de adulto: colírio, pomada e injetável do
    // mesmo princípio ativo não viram gotas/xarope
    const oral = ehOral(it);
    const regra = REGRAS.find(r => r.match.test(n) && !(r.exceto && r.exceto.test(n))
      && (!r.soAbaixoMeses || (typeof idadeMeses === 'number' && idadeMeses < r.soAbaixoMeses))
      && (r.acao !== 'substituir' || (oral && (r.incluiPorPeso || !itemPorPeso(it)) && (r.incluiLiquidos || !jaPediatrico(it.nome)))));
    if(!regra) return null;
    if(regra.idadeLimiteMeses && typeof idadeMeses === 'number' && idadeMeses >= regra.idadeLimiteMeses) return null;
    return regra;
  }

  // Idade em meses a partir de texto livre: "4", "4a", "4 anos", "8m", "8 meses",
  // "1a6m", "2 anos 3 meses", "1,5". Número sozinho = anos. Vazio ou inválido = null.
  function idadeEmMeses(texto){
    const t = norm(texto).replace(/,/g, '.').replace(/\be\b/g, ' ');
    if(!t.trim()) return null;
    if(/^\s*(?:rn|recem[- ]nascid[oa])\s*$/.test(t)) return 0;
    const token = /(\d+(?:\.\d+)?)\s*(anos|ano|a|meses|mes|m|semanas|semana|sem|dias|dia|d)?/g;
    let total = 0, achou = false, fracao = false, m;
    while((m = token.exec(t))){
      achou = true;
      const u = m[2] || '';
      if(/^s/.test(u)){ total += Number(m[1]) * 7 / 30.44; fracao = true; }
      else if(/^d/.test(u)){ total += Number(m[1]) / 30.44; fracao = true; }
      else total += /^m/.test(u) ? Number(m[1]) : Number(m[1]) * 12;
    }
    if(!achou || t.replace(token, '').trim()) return null; // sobrou texto que não é idade
    return fracao ? Math.floor(total) : Math.round(total); // em dias/semanas não arredonda para cima
  }

  const formatarIdade = meses => meses >= 24 ? `${Math.floor(meses / 12)} anos` : `${meses} meses`;
  // o que usar no lugar quando a criança está abaixo da idade mínima do item
  const ALTERNATIVA = [[/^loratadina\b/, 'abaixo de 2 anos, a escolha é a desloratadina xarope 0,5 mg/mL (6 a 11 meses 2 mL; 1 a 5 anos 2,5 mL, 1 vez ao dia)']];
  const alternativaIdade = nome => { const a = ALTERNATIVA.find(([re]) => re.test(norm(nome))); return a ? a[1] : ''; };

  // Dose por peso de um item: round(peso x fator) com teto (max), ou por faixa de
  // peso (faixas: [{ateKg, fator} | {ateKg, valor}]). null se não for por peso
  // ou faltar o peso. {valor: null} = peso fora das faixas (preencher à mão).
  function doseDoItem(it, peso){
    if(!it) return null;
    const kg = toKg(peso);
    const temFaixas = Array.isArray(it.faixas) && it.faixas.length > 0;
    const temFator = it.fator !== null && it.fator !== undefined && it.fator !== '' && !isNaN(parseFloat(it.fator));
    if((!temFaixas && !temFator) || !kg) return null;
    let fator = temFator ? parseFloat(it.fator) : null;
    if(temFaixas){
      const f = it.faixas.find(x => kg <= x.ateKg) || it.faixas[it.faixas.length - 1];
      if(f.valor !== undefined) return { valor: f.valor, semTeto: f.valor, limitada: false, porFaixa: true };
      fator = f.fator;
    }
    const calculada = Math.round(kg * fator);
    const max = it.max ? Number(it.max) : null;
    return { valor: max && calculada > max ? max : calculada, semTeto: calculada, limitada: !!(max && calculada > max) };
  }
  function itemPorPeso(it){
    return !!it && ((Array.isArray(it.faixas) && it.faixas.length > 0) || (it.fator !== null && it.fator !== undefined && it.fator !== ''));
  }

  // Frascos para o tratamento todo: dose (mL) x doses/dia x dias ÷ volume do frasco, para cima.
  // Só quando tudo é legível ("DOSE mL", "de 08/08 horas", "por 07 dias") e o volume é
  // conhecido (volumeFrascoMl da regra ou pelo nome da suspensão); senão null.
  const FRASCO_ML = [[/^amoxicilina\b(?!.*clavul)/, 150], [/^cefalexina\b/, 100], [/^sulfametoxazol\b/, 100]];
  function frascosNecessarios(it, peso){
    if(!it) return null;
    const pos = String(it.posologiaBase || '');
    const vol = Number(it.volumeFrascoMl) || (FRASCO_ML.find(([re]) => re.test(norm(it.nome))) || [])[1];
    if(!vol || !/DOSE\s*mL\b/.test(pos)) return null;
    const d = doseDoItem(it, peso);
    const h = pos.match(/\bde (\d{1,2})\/\1 horas/), dias = pos.match(/\bpor (\d{1,2}) dias/);
    if(!d || typeof d.valor !== 'number' || !h || !dias || !(Number(h[1]) > 0) || 24 % Number(h[1])) return null;
    const totalMl = d.valor * (24 / Number(h[1])) * Number(dias[1]);
    return { frascos: Math.ceil(totalMl / vol), totalMl, volumeFrascoMl: vol };
  }
  const frascosDaQtde = q => { const m = String(q || '').match(/^\s*(\d+)\s*frascos?\s*$/i); return m ? Number(m[1]) : null; };
  const qtdeFrascos = n => String(n).padStart(2, '0') + (n === 1 ? ' Frasco' : ' Frascos');
  // Aviso quando a quantidade da receita não cobre o tratamento (ou null)
  function avisoFrascos(it, peso){
    const f = frascosNecessarios(it, peso), atual = frascosDaQtde(it && it.qtde);
    if(!f || !atual || f.frascos <= atual) return null;
    return `${it.nome}: o tratamento soma ${numBR(f.totalMl)} mL; ${it.qtde} de ${f.volumeFrascoMl} mL não bastam — são ${qtdeFrascos(f.frascos)}.`;
  }

  // Itens que uma conversão mudaria (substituir/remover); regras só de aviso não contam.
  function contarConversiveis(entradas, idadeMeses){
    return entradas.filter(([, it]) => { const r = regraPara(it, idadeMeses); return r && r.acao !== 'avisar'; }).length;
  }

  // Avisos de um item já convertido, calculados com o peso/idade ATUAIS (o peso
  // pode mudar depois da conversão; a dose da receita é recalculada na hora).
  function avisosDoItem(it, peso, idadeMeses){
    const out = [];
    const info = it.pedInfo || {};
    const kg = toKg(peso);
    const d = doseDoItem(it, peso);
    if(d && d.valor === null){
      out.push(`ATENÇÃO — ${it.nome}: peso fora das faixas de dose (mínimo ${it.pesoMinKg || '?'} kg). Revise.`);
    } else if(d){
      let conta = `${it.nome}: ${d.valor} ${typeof d.valor === 'number' ? (info.unidade || '') : ''}`.trim();
      if(info.mgPorUnidade && typeof d.valor === 'number'){
        const mg = Math.round(d.valor * info.mgPorUnidade * 10) / 10;
        conta += ` = ${numBR(mg)} mg (${numBR((mg / kg).toFixed(1))} mg/kg/dose)`;
      }
      out.push(conta + (info.aviso ? '. ' + info.aviso : '.'));
      if(d.limitada) out.push(`${it.nome}: dose calculada (${d.semTeto}) excede o máximo de ${it.max} por dose; a receita sai com ${it.max}.`);
    } else if(info.aviso){
      out.push(`${it.nome}. ${info.aviso}`);
    }
    const frascos = avisoFrascos(it, peso);
    if(frascos) out.push(frascos);
    if(kg && it.pesoMinKg && kg < it.pesoMinKg && !(d && d.valor === null)){
      out.push(`ATENÇÃO — ${it.nome}: peso abaixo do mínimo de ${it.pesoMinKg} kg. Revise.`);
    }
    if(it.idadeMinMeses){
      if(typeof idadeMeses !== 'number') out.push(`${it.nome}: confirme idade mínima de ${formatarIdade(it.idadeMinMeses)}.`);
      else if(idadeMeses < it.idadeMinMeses) out.push(`ATENÇÃO — ${it.nome}: paciente com ${formatarIdade(idadeMeses)}, abaixo da idade mínima de ${formatarIdade(it.idadeMinMeses)}. ${alternativaIdade(it.nome) ? alternativaIdade(it.nome)[0].toUpperCase() + alternativaIdade(it.nome).slice(1) + '.' : 'Revise.'}`);
    }
    return out;
  }

  function avisoPesoAlto(peso){
    const kg = toKg(peso);
    return kg && kg > PESO_MAX_KG ? `Peso de ${numBR(kg)} kg: acima de ${PESO_MAX_KG} kg a criança pode usar dose de adulto. Revise a conversão.` : null;
  }

  // "por 07 dias" / "por no máximo 05 dias" / "por 07 a 10 dias" da posologia de adulto
  function duracaoDe(posologia){
    const m = String(posologia || '').match(/por (?:no máximo |até )?\d+(?: a \d+)? dias/i);
    return m ? m[0] : null;
  }

  // entradas: [[id, item], ...] com item = {nome, qtde, posologiaBase, via, fator, ...}
  // opcoes.idadeMeses: idade do paciente em meses, se informada.
  // Retorna as entradas convertidas, os removidos (com motivo), os avisos fixos
  // (itens sem regra / só aviso) e a lista completa de avisos no momento.
  function converterParaPediatrico(entradas, peso, opcoes = {}){
    const kg = toKg(peso);
    if(!kg) return { erro: 'Informe o peso da criança (kg) para converter.' };
    const idade = typeof opcoes.idadeMeses === 'number' ? opcoes.idadeMeses : null;

    const entries = [], removidos = [], fixos = [], doItens = [];
    let convertidos = 0;
    entradas.forEach(([id, it]) => {
      const regra = regraPara(it, idade);
      if(!regra){
        if(!it.convertidoPediatrico && ehOral(it) && !jaPediatrico(it.nome) && !itemPorPeso(it)){
          fixos.push(`${it.nome}: sem regra pediátrica cadastrada, mantido como está. Confira manualmente.`);
        }
        entries.push([id, it]);
        return;
      }
      if(regra.acao === 'remover'){
        removidos.push({ nome: it.nome, motivo: regra.motivo });
        return;
      }
      if(regra.acao === 'avisar'){
        fixos.push(regra.aviso);
        entries.push([id, it]);
        return;
      }
      const faixa = regra.porIdade ? (regra.porIdade.find(f => idade <= f.ateMeses) || regra.porIdade[regra.porIdade.length - 1]) : null;
      if(faixa && faixa.remover){ removidos.push({ nome: it.nome, motivo: faixa.remover }); return; }
      const por = faixa ? faixa.por : regra.por;
      const lista = Array.isArray(por) ? por : [por];
      const duracao = duracaoDe(it.posologiaBase) || regra.duracaoPadrao || '';
      lista.forEach((p, i) => {
        const novo = Object.assign({}, it, p, {
          posologiaBase: String(p.posologiaBase || '').replace('{duracao}', duracao).replace(/\s+,/, ',').replace(/, \./, '.'),
          convertidoPediatrico: true,
          pedInfo: { unidade: regra.unidade || '', mgPorUnidade: regra.mgPorUnidade || null, aviso: i === 0 ? (regra.aviso || '') : '', origem: it.nome }
        });
        ['fator', 'max', 'idadeMinMeses', 'pesoMinKg', 'faixas'].forEach(k => { if(p[k] === undefined) delete novo[k]; });
        // suspensão: frascos suficientes para o tratamento todo (só aumenta)
        const f = frascosNecessarios(novo, kg), atual = frascosDaQtde(novo.qtde);
        if(f && atual && f.frascos > atual) novo.qtde = qtdeFrascos(f.frascos);
        entries.push([lista.length > 1 ? `${id}#ped${i + 1}` : id, novo]);
        doItens.push(...avisosDoItem(novo, kg, idade));
      });
      convertidos++;
    });
    const alto = avisoPesoAlto(kg);
    return { entries, removidos, fixos, convertidos, avisos: [...(alto ? [alto] : []), ...fixos, ...doItens] };
  }

  const api = { converterParaPediatrico, contarConversiveis, avisosDoItem, avisoPesoAlto, frascosNecessarios, avisoFrascos, regraPara, idadeEmMeses, formatarIdade, alternativaIdade, doseDoItem, itemPorPeso, REGRAS, PESO_MAX_KG };
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PEDIATRIA = api;
})(typeof window !== 'undefined' ? window : globalThis);
