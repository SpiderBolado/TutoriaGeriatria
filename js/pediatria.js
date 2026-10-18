// Conversão de receita de adulto para pediátrica.
// Regras em dados: cada uma casa pelo nome normalizado do item (sem acento,
// minúsculo); vale a primeira que casar. A ação pode ser substituir o item pela
// apresentação pediátrica, remover ou só avisar. Nada é convertido sem regra.
// 'fonte' registra de onde veio cada dose, para conferência com a bula.
(function(root){
  const PESO_MAX_KG = 40; // acima disso a criança tende a usar dose de adulto

  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  // "500 mg/mL", "gotas", "suspensão" etc.: item que já é formulação pediátrica
  const jaPediatrico = nome => /\/\s*ml|gotas|xarope|suspens/.test(norm(nome));

  const REGRAS = [
    {
      match: /^dipirona\b/,
      acao: 'substituir',
      por: {
        nome: 'Dipirona 500 mg/mL', qtde: '01 Frasco', via: 'Oral', fator: 0.6,
        posologiaBase: 'Tomar DOSE gotas, de 06/06 horas, se dor ou febre (temperatura axilar maior ou igual a 37,8ºC).'
      },
      unidade: 'gotas', mgPorUnidade: 25,
      aviso: 'Dipirona gotas: confira a calibração de gotas/mL do fabricante.',
      fonte: 'Mesmo item e fator (0,6 gota/kg) do catálogo pediátrico do app.'
    },
    {
      match: /^ibuprofeno\b/,
      acao: 'substituir',
      por: {
        nome: 'Ibuprofeno 50 mg/mL', qtde: '01 Frasco', via: 'Oral', fator: 1, max: 40, idadeMinMeses: 6,
        posologiaBase: 'Tomar DOSE gotas, de 08/08 horas, se dor ou febre, por no máximo 05 dias.'
      },
      unidade: 'gotas', mgPorUnidade: 5,
      aviso: 'Ibuprofeno gotas: use a bula do fabricante (1 gota = 5 mg; bulas citam 1–2 gotas/kg, máx. 40 gotas por dose).',
      fonte: '1 gota/kg = 5 mg/kg, mesma dose por kg do "Ibuprofeno 200mg/mL" (0,5 gota/kg) do catálogo; faixa das bulas 1–2 gotas/kg.'
    },
    {
      match: /^ciclobenzaprina\b/,
      acao: 'remover',
      motivo: 'Ciclobenzaprina: removida, não é adequada para crianças.'
    }
  ];

  function regraPara(nome){
    if(jaPediatrico(nome)) return null;
    const n = norm(nome);
    return REGRAS.find(r => r.match.test(n) && !(r.exceto && r.exceto.test(n))) || null;
  }

  // Idade em meses a partir de texto livre: "4", "4a", "4 anos", "8m", "8 meses",
  // "1a6m", "2 anos 3 meses", "1,5". Número sozinho = anos. Vazio ou inválido = null.
  function idadeEmMeses(texto){
    const t = norm(texto).replace(/,/g, '.').replace(/\be\b/g, ' ');
    if(!t.trim()) return null;
    const token = /(\d+(?:\.\d+)?)\s*(anos|ano|a|meses|mes|m)?/g;
    let total = 0, achou = false, m;
    while((m = token.exec(t))){
      achou = true;
      total += /^m/.test(m[2] || '') ? Number(m[1]) : Number(m[1]) * 12;
    }
    if(!achou || t.replace(token, '').trim()) return null; // sobrou texto que não é idade
    return Math.round(total);
  }

  const formatarIdade = meses => meses >= 24 ? `${Math.floor(meses / 12)} anos` : `${meses} meses`;

  // Itens que uma conversão mudaria (substituir/remover); regras só de aviso não contam.
  function contarConversiveis(entradas){
    return entradas.filter(([, it]) => { const r = regraPara(it.nome); return r && r.acao !== 'avisar'; }).length;
  }

  const numBR = n => String(n).replace('.', ',');

  // Avisos de um item já convertido, calculados com o peso/idade ATUAIS (o peso
  // pode mudar depois da conversão; a dose da receita é recalculada na hora).
  function avisosDoItem(it, peso, idadeMeses){
    const out = [];
    const info = it.pedInfo || {};
    const kg = parseFloat(String(peso).replace(',', '.'));
    if(kg > 0 && typeof it.fator === 'number'){
      const calculada = Math.round(kg * it.fator);
      const dose = it.max ? Math.min(calculada, it.max) : calculada;
      let conta = `${it.nome}: ${dose} ${info.unidade || ''}`.trim();
      if(info.mgPorUnidade){
        const mg = Math.round(dose * info.mgPorUnidade * 10) / 10;
        conta += ` = ${numBR(mg)} mg (${numBR((mg / kg).toFixed(1))} mg/kg/dose)`;
      }
      out.push(conta + (info.aviso ? '. ' + info.aviso : '.'));
      if(it.max && calculada > it.max){
        out.push(`${it.nome}: dose calculada (${calculada}) excede o máximo de ${it.max} por dose; a receita sai com ${it.max}.`);
      }
      if(it.pesoMinKg && kg < it.pesoMinKg){
        out.push(`ATENÇÃO — ${it.nome}: peso abaixo do mínimo de ${it.pesoMinKg} kg. Revise.`);
      }
    } else if(info.aviso){
      out.push(`${it.nome}. ${info.aviso}`);
    }
    if(it.idadeMinMeses){
      if(typeof idadeMeses !== 'number') out.push(`${it.nome}: confirme idade mínima de ${formatarIdade(it.idadeMinMeses)}.`);
      else if(idadeMeses < it.idadeMinMeses) out.push(`ATENÇÃO — ${it.nome}: paciente com ${formatarIdade(idadeMeses)}, abaixo da idade mínima de ${formatarIdade(it.idadeMinMeses)}. Revise.`);
    }
    return out;
  }

  function avisoPesoAlto(peso){
    const kg = parseFloat(String(peso).replace(',', '.'));
    return kg > PESO_MAX_KG ? `Peso de ${numBR(kg)} kg: acima de ${PESO_MAX_KG} kg a criança pode usar dose de adulto. Revise a conversão.` : null;
  }

  // entradas: [[id, item], ...] com item = {nome, qtde, posologiaBase, via, fator, ...}
  // opcoes.idadeMeses: idade do paciente em meses, se informada.
  // Retorna as entradas convertidas, os removidos (com motivo), os avisos fixos
  // (itens sem regra / só aviso) e a lista completa de avisos no momento.
  function converterParaPediatrico(entradas, peso, opcoes = {}){
    const kg = parseFloat(String(peso).replace(',', '.'));
    if(!(kg > 0)) return { erro: 'Informe o peso da criança (kg) para converter.' };
    const idade = typeof opcoes.idadeMeses === 'number' ? opcoes.idadeMeses : null;

    const entries = [], removidos = [], fixos = [], doItens = [];
    let convertidos = 0;
    entradas.forEach(([id, it]) => {
      const regra = regraPara(it.nome);
      if(!regra){
        const semPeso = it.fator === null || it.fator === undefined || it.fator === '';
        if(!jaPediatrico(it.nome) && semPeso){
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
      const novo = Object.assign({}, it, regra.por, {
        convertidoPediatrico: true,
        pedInfo: { unidade: regra.unidade || '', mgPorUnidade: regra.mgPorUnidade || null, aviso: regra.aviso || '', origem: it.nome }
      });
      ['max', 'idadeMinMeses', 'pesoMinKg'].forEach(k => { if(regra.por[k] === undefined) delete novo[k]; });
      entries.push([id, novo]);
      convertidos++;
      doItens.push(...avisosDoItem(novo, kg, idade));
    });
    const alto = avisoPesoAlto(kg);
    return { entries, removidos, fixos, convertidos, avisos: [...(alto ? [alto] : []), ...fixos, ...doItens] };
  }

  const api = { converterParaPediatrico, contarConversiveis, avisosDoItem, avisoPesoAlto, regraPara, idadeEmMeses, formatarIdade, REGRAS, PESO_MAX_KG };
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PEDIATRIA = api;
})(typeof window !== 'undefined' ? window : globalThis);
