// Conversão de receita de adulto para pediátrica.
// Regras em dados: cada uma casa pelo princípio ativo (primeira palavra do nome)
// e pode substituir o item, removê-lo ou só avisar. Nada é convertido sem regra.
// As doses por kg reaproveitam as já usadas no catálogo pediátrico do app;
// 'fonte' registra de onde cada regra veio para conferência com a bula.
(function(root){
  const PESO_MAX_KG = 40; // acima disso a criança tende a usar dose de adulto

  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const principio = nome => norm(nome).split(/[\s+]/)[0];
  // "500 mg/mL", "gotas", "suspensão" etc.: item que já é formulação pediátrica
  const jaPediatrico = nome => /\/\s*ml|gotas|xarope|suspens/.test(norm(nome));

  const REGRAS = {
    dipirona: {
      acao: 'substituir',
      por: {
        nome: 'Dipirona 500 mg/mL', qtde: '01 Frasco', via: 'Oral', fator: 0.6,
        posologiaBase: 'Tomar DOSE gotas, de 06/06 horas, se dor ou febre (temperatura axilar maior ou igual a 37,8ºC).'
      },
      aviso: 'Dipirona gotas: confirme a idade (algumas bulas contraindicam < 3 meses ou < 5 kg) e a calibração de gotas/mL do fabricante.',
      fonte: 'Mesmo item e fator (0,6 gota/kg) do catálogo pediátrico do app.'
    },
    ibuprofeno: {
      acao: 'substituir',
      por: {
        nome: 'Ibuprofeno 50 mg/mL', qtde: '01 Frasco', via: 'Oral', fator: 1,
        posologiaBase: 'Tomar DOSE gotas, de 08/08 horas, se dor ou febre, por no máximo 05 dias.'
      },
      maxGotasDose: 40,
      aviso: 'Ibuprofeno gotas: confirme idade ≥ 6 meses e use a bula do fabricante (1 gota = 5 mg; bulas citam 1–2 gotas/kg, máx. 40 gotas por dose).',
      fonte: '1 gota/kg = 5 mg/kg, mesma dose por kg do "Ibuprofeno 200mg/mL" (0,5 gota/kg) do catálogo; faixa das bulas 1–2 gotas/kg.'
    },
    ciclobenzaprina: {
      acao: 'remover',
      motivo: 'Ciclobenzaprina: removida, não é adequada para crianças.'
    }
  };

  // entradas: [[id, item], ...] com item = {nome, qtde, posologiaBase, via, fator, ...}
  function converterParaPediatrico(entradas, peso){
    const kg = parseFloat(peso);
    if(!(kg > 0)) return { erro: 'Informe o peso da criança (kg) para converter.' };

    const entries = [], removidos = [], avisos = [];
    let convertidos = 0;
    if(kg > PESO_MAX_KG){
      avisos.push(`Peso de ${kg} kg: acima de ${PESO_MAX_KG} kg a criança pode usar dose de adulto. Revise a conversão.`);
    }
    entradas.forEach(([id, it]) => {
      const regra = REGRAS[principio(it.nome)];
      if(!regra || jaPediatrico(it.nome)){
        const semPeso = it.fator === null || it.fator === undefined || it.fator === '';
        if(!regra && semPeso){
          avisos.push(`${it.nome}: sem regra pediátrica cadastrada, mantido como está. Confira manualmente.`);
        }
        entries.push([id, it]);
        return;
      }
      if(regra.acao === 'remover'){
        removidos.push({ nome: it.nome, motivo: regra.motivo });
        return;
      }
      const novo = Object.assign({}, it, regra.por, { convertidoPediatrico: true });
      entries.push([id, novo]);
      convertidos++;
      avisos.push(regra.aviso);
      const dose = Math.round(kg * regra.por.fator);
      if(regra.maxGotasDose && dose > regra.maxGotasDose){
        avisos.push(`${regra.por.nome}: ${dose} gotas excede o máximo de ${regra.maxGotasDose} por dose. Reduza a dose manualmente.`);
      }
    });
    return { entries, removidos, avisos, convertidos };
  }

  const api = { converterParaPediatrico, REGRAS, PESO_MAX_KG };
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PEDIATRIA = api;
})(typeof window !== 'undefined' ? window : globalThis);
