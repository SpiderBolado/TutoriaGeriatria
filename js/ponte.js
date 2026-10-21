// Ponte com o Quadro do Plantão. Quando o receituário abre dentro do Quadro
// (iframe em receitas/index.html#quadro):
//   - as configurações viajam pelo banco do Quadro e valem em qualquer computador;
//   - imprimir e baixar passam pelo Quadro (a página do Claude não baixa nada
//     sozinha e pode bloquear a janela de impressão);
//   - o paciente do cartão chega preenchido (nome, idade, peso, alergias, queixa);
//   - a receita emitida volta para a linha do tempo do cartão.
// Aberto direto do arquivo, nada disso liga e o app funciona como sempre.
// As funções puras (alergia, sugestão pela queixa) também rodam no Node (testes).
(function(root){
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  // ---------- Alergia: o remédio da receita bate com a alergia do cartão? ----------
  // Mesmo grupo também conta (reação cruzada): o aviso pede conferência, não bloqueia.
  const CLASSES_ALERGIA = {
    dipirona: ['dipirona', 'metamizol', 'novalgina', 'buscopan composto'],
    aine: ['aine', 'anti-inflamatorio', 'antiinflamatorio', 'ibuprofeno', 'diclofenaco', 'cetoprofeno', 'cetorolaco', 'nimesulida', 'naproxeno', 'tenoxicam', 'meloxicam', 'piroxicam', 'indometacina', 'flurbiprofeno', 'acido mefenamico', 'mefenamico', 'ponstan', 'aas', 'acido acetilsalicilico', 'aspirina'],
    aas: ['aas', 'acido acetilsalicilico', 'aspirina', 'ibuprofeno', 'diclofenaco', 'cetoprofeno', 'cetorolaco', 'nimesulida', 'naproxeno', 'tenoxicam', 'flurbiprofeno', 'acido mefenamico', 'mefenamico'],
    penicilina: ['penicilina', 'amoxicilina', 'ampicilina', 'oxacilina', 'piperacilina', 'benzetacil', 'benzilpenicilina', 'clavulanato'],
    cefalosporina: ['cefalosporina', 'ceftriaxona', 'cefazolina', 'cefalexina', 'cefadroxila', 'cefaclor', 'cefepima', 'cefuroxima', 'ceftazidima', 'cefalotina'],
    sulfa: ['sulfa', 'sulfametoxazol', 'bactrim', 'sulfadiazina'],
    macrolideo: ['macrolideo', 'azitromicina', 'claritromicina', 'eritromicina'],
    quinolona: ['quinolona', 'ciprofloxacino', 'levofloxacino', 'moxifloxacino', 'norfloxacino'],
    opioide: ['opioide', 'morfina', 'tramadol', 'codeina', 'fentanil', 'oxicodona', 'metadona', 'nalbufina'],
    metoclopramida: ['metoclopramida', 'plasil'],
    escopolamina: ['escopolamina', 'butilescopolamina', 'buscopan', 'hioscina'],
    paracetamol: ['paracetamol', 'acetaminofeno', 'tylenol']
  };
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // devolve a alergia (texto do cartão) com que o remédio conflita, ou null
  function conflitoAlergia(nomeRemedio, alergias){
    if(!alergias || !alergias.length) return null;
    const t = ' ' + norm(nomeRemedio).replace(/[^a-z0-9-]+/g, ' ') + ' ';
    for(const a of alergias){
      // "Alergia a dipirona e AAS", "sulfa / cefalosporinas": cada alérgeno conta
      const partes = norm(a).replace(/\b(?:alergi\w*|alergic\w*)\s*(?:a|ao|aos|as|:)?\s+/g, ' ')
        .split(/[,;\/+]|\s+e\s+|\s+ou\s+/).map(x => x.trim()).filter(x => x.length >= 3);
      for(const na of partes){
        const classes = Object.keys(CLASSES_ALERGIA).filter(k => na === k || na.startsWith(k) || CLASSES_ALERGIA[k].some(x => na === x || na.startsWith(x)));
        const termos = [na].concat(...classes.map(k => CLASSES_ALERGIA[k]));
        if(termos.some(x => new RegExp(' ' + escRe(x) + '(?:s|es)? ').test(t))) return a;
      }
    }
    return null;
  }

  // ---------- Queixa do cartão → condições do catálogo ----------
  // Ponto de partida para um clique; nada entra na receita sozinho.
  const PELA_QUEIXA = [
    [/\b(enxaqueca)/, ['Enxaqueca']],
    [/\b(cefale\w*|dor de cabeca)/, ['Cefaleia Tensional', 'Enxaqueca']],
    [/\b(colica renal|calculo renal|nefrolit\w*|pedra no rim)/, ['Nefrolitíase']],
    [/\b(lombalgia|lombar|dor nas costas|mialgia|dor muscular|contratura)/, ['Dor Muscular']],
    [/\b(cervicalgia|torcicolo|dor no pescoco)/, ['Cervicalgia', 'Dor Muscular']],
    [/\b(diarre\w*|gastroenter\w*|geca|fezes liquid\w*|evacuac\w* liquid\w*)/, ['GECA']],
    [/\b(vomit\w*|nause\w*|enjoo)/, ['GECA']],
    [/\b(azia|queimacao|epigastr\w*|refluxo|dispeps\w*|drge)/, ['DRGE']],
    [/\b(dor abdominal|dor de barriga|colica abdominal|dor na barriga)/, ['Dor Abdominal']],
    [/\b(disuria|(?:ardencia|ardor|dor) (?:ao|para) urinar|ardencia urinaria|ardor urinario|cistite|polaciuria|infeccao urinaria|itu)\b/, ['ITU']],
    [/\b(garganta|odinofag\w*|amigdal\w*|faring\w*)/, ['Faringoamigdalite', 'Faringite']],
    [/\b(otalgia|dor (?:de|no) ouvido|otite)/, ['Otite média']],
    [/\b(cerume|ouvido entupido|ouvido tampado)/, ['Cerume']],
    [/\b(covid)/, ['COVID']],
    [/\b(gripe|coriza|resfriad\w*|ivas|sindrome gripal|congestao nasal)/, ['Gripe']],
    [/\b(tosse)/, ['Tosse']],
    [/\b(sinusite|dor facial|pressao (?:na|em) (?:face|fronte|testa))/, ['Sinusite bomba']],
    [/\b(asma)/, ['Asma']],
    [/\b(chiado|sibil\w*|broncoespasm\w*)/, ['Broncoespasmo']],
    [/\b(dengue)/, ['Dengue']],
    [/\b(tontura|vertigem|labirint\w*)/, ['Vertigem']],
    [/\b(conjuntivite|olho vermelho|secrecao (?:no|nos) olhos?)/, ['Conjuntivite viral']],
    [/\b(hordeolo|tercol)/, ['Hordéolo']],
    [/\b(prurido|coceira)/, ['Prurido Inespecífico']],
    [/\b(urticari\w*|reacao alergica|crise alergica|alergia na pele)/, ['Alergia']],
    [/\b(picada|ferroada|inseto|abelha|marimbondo)/, ['Picada']],
    [/\b(queimadura)/, ['Queimadura']],
    [/\b(mordedura|mordida|arranhadura) de (?:cao|gato|cachorro|morcego|animal)/, ['Ferimento com Risco de Raiva']],
    [/\b(ferimento|corte|laceracao)/, ['Ferimento']],
    [/\b(entorse|torceu|torcao)/, ['Entorse']],
    [/\b(tce|trauma(?:tismo)? (?:de |em )?cranio|bateu a cabeca)/, ['TCE']],
    [/\b(panico)/, ['Transtorno de Pânico']],
    [/\b(ansiedade|ansios\w*)/, ['Ansiedade']],
    [/\b(crise hipertensiva|pressao alta|pa elevada)/, ['Crise Hipertensiva']],
    [/\b(constipa\w*|intestino preso|prisao de ventre)/, ['Constipação']],
    [/\b(hemorroid\w*)/, ['Hemorroidas']],
    [/\b(gota|acido urico)\b/, ['Gota']],
    [/\b(herpes zoster|cobreiro)/, ['Herpes Zoster']],
    [/\b(corrimento|vaginose)/, ['Vaginose Bacteriana']],
    [/\b(micose|frieira)/, ['Micose']],
    [/\b(escabiose|sarna)/, ['Escabiose']],
    [/\b(impetigo)/, ['Impetigo']],
    [/\b(abscesso|abcesso|furunculo)/, ['Abcesso']],
    [/\b(dismenorr\w*|colica menstrual)/, ['Dismenorreia Secundária']]
  ];
  // queixa (texto livre do cartão) → até 3 nomes de condição que existem no catálogo
  function sugerirCondicoes(queixa, existe, anos){
    // "alergia a dipirona" no texto é dado do paciente, não queixa
    const q = norm(queixa).replace(/\b(?:nega\s+)?alergi\w*\s+(?:a|ao|aos|as|com|de|por)\s+[^.;,\n]*/g, ' ');
    if(!q.trim()) return [];
    const out = [];
    const add = n => { if(out.length < 3 && !out.includes(n) && existe(n)) out.push(n); };
    if(/\bpneumonia\b/.test(q)) add(anos != null && anos < 12 ? 'Pneumonia (Criança)' : 'Pneumonia (Adulto, sem fator de risco)');
    PELA_QUEIXA.forEach(([re, nomes]) => { if(re.test(q)) nomes.forEach(add); });
    return out;
  }

  // "54 anos" e "8 meses" o campo já entende; dias viram "0m"
  function idadeParaCampo(idade){
    const s = String(idade || '').trim();
    if(/^\d+\s*dias?$/i.test(s)) return '0m';
    return s;
  }

  // Paciente masculino: sai do texto o que fala de gravidez e amamentação da própria paciente
  // ("Não usar se estiver grávida, amamentando ou se tiver glaucoma." → "Não usar se tiver glaucoma.";
  // "Se estiver grávida ou houver chance de gravidez, …" some). Devolve '' se não sobrar nada.
  function paraSexo(texto, sexo){
    const t = String(texto == null ? '' : texto);
    if(sexo !== 'M') return t;
    return t
      .replace(/estiver grávida, amamentando ou se tiver/gi, 'tiver')
      .replace(/(^|[.!?]\s+)(?:Se|Não (?:tomar|usar) se) estiver grávida[^.!?]*[.!?]\s*/gi, '$1')
      .trim();
  }

  const puras = { conflitoAlergia, sugerirCondicoes, idadeParaCampo, paraSexo, CLASSES_ALERGIA };
  if(typeof module !== 'undefined' && module.exports){ module.exports = puras; return; }

  // ---------- Ponte (só no navegador) ----------
  const embutido = !!(root.parent && root.parent !== root && /(^|[#&])quadro(&|$)/.test(root.location.hash.replace(/^#/, '')));
  // Viajam só configurações, sem dado de paciente. Ficam neste aparelho: o
  // histórico de receitas e o atendimento aberto (guardam nome), e o tema.
  const SINCRONIZADAS = ['meus-medicamentos', 'custom-condicoes', 'overrides-medicamentos', 'overrides-condicoes', 'overrides-catalogo',
    'uso-condicoes', 'padroes-uso', 'medico-info', 'local-receita', 'unidade-saude', 'separar-auto', 'auto-pediatria'];
  const alvo = () => (root.location.origin && root.location.origin !== 'null') ? root.location.origin : '*';
  function enviar(msg){ try{ root.parent.postMessage(Object.assign({ rx: 1 }, msg), alvo()); }catch(e){ /* Quadro fechado */ } }
  let seq = 0;
  const espera = new Map();
  function pedir(tipo, dados, ms){
    return new Promise(resolve => {
      const id = 'r' + (++seq);
      const t = setTimeout(() => { espera.delete(id); resolve(null); }, ms || 5000);
      espera.set(id, r => { clearTimeout(t); resolve(r); });
      enviar(Object.assign({ tipo, id }, dados || {}));
    });
  }
  const ouvintes = [];
  let pacientePend;
  root.addEventListener('message', e => {
    if(!embutido || e.source !== root.parent) return;
    let d = e.data;
    if(!d || d.rx !== 1) return;
    if(d.resp){
      if(espera.has(d.resp)){ const f = espera.get(d.resp); espera.delete(d.resp); f(d); return; }
      if(!d.paciente) return;   // resposta que chegou depois do tempo: o paciente ainda vale
      d = { tipo: 'paciente', paciente: d.paciente };
    }
    if(d.tipo === 'paciente'){
      if(ouvintes.length) ouvintes.forEach(f => f(d.paciente || null));
      else pacientePend = d.paciente || null;
    }
  });

  // Antes de o app ler as configurações: o que está no banco do Quadro vence;
  // o que só existe neste navegador (1ª vez no Quadro) sobe para o banco.
  let comBanco = false;
  async function sincronizar(){
    if(!embutido) return null;
    const r = await pedir('inicio', { chaves: SINCRONIZADAS }, 6000);
    if(!r) return null;
    if(r.dados){
      comBanco = true;
      SINCRONIZADAS.forEach(k => {
        try{
          if(Object.prototype.hasOwnProperty.call(r.dados, k) && typeof r.dados[k] === 'string') localStorage.setItem(k, r.dados[k]);
          else{ const v = localStorage.getItem(k); if(v !== null) salvar(k, v); }
        }catch(e){ /* sem armazenamento local: segue só com o banco */ }
      });
    }
    if(r.paciente !== undefined && pacientePend === undefined) pacientePend = r.paciente;
    return r;
  }
  const timers = {};
  function salvar(chave, valor){
    if(!embutido || !SINCRONIZADAS.includes(chave)) return;
    clearTimeout(timers[chave]);
    timers[chave] = setTimeout(() => enviar({ tipo: 'salvar', chave, valor: String(valor) }), 400);
  }
  function onPaciente(fn){
    ouvintes.push(fn);
    if(pacientePend !== undefined){ const p = pacientePend; pacientePend = undefined; fn(p); }
  }
  function emitida(info){ if(embutido) enviar(Object.assign({ tipo: 'emitida' }, info)); }
  function fechar(){ if(embutido) enviar({ tipo: 'fechar' }); }
  // download pelo Quadro (capability downloads); resolve true se o arquivo foi aceito
  async function baixar(nome, blob){
    const r = await pedir('baixar', { nome, blob }, 180000);
    return !!(r && r.ok);
  }

  // Imprimir dentro do Claude: janela nova se o navegador deixar; senão um
  // quadro escondido nesta página; se nem isso abrir a impressão (o Claude
  // bloqueia), baixa a receita como página que se imprime sozinha ao abrir.
  const MODO_KEY = 'rx-impressao';
  // vale para esta visita: abrir de novo tenta imprimir direto outra vez
  function modoSalvo(){ try{ return sessionStorage.getItem(MODO_KEY); }catch(e){ return null; } }
  function guardaModo(m){ try{ sessionStorage.setItem(MODO_KEY, m); }catch(e){ /* sem armazenamento */ } }
  function porJanela(doc){
    let w = null;
    try{ w = root.open('', '_blank'); }catch(e){ w = null; }
    if(!w) return false;
    try{
      w.document.write(doc); w.document.close(); w.focus();
      setTimeout(() => { try{ w.print(); }catch(e){ /* a janela foi fechada */ } }, 250);
      return true;
    }catch(e){ try{ w.close(); }catch(_){ /* nada */ } return false; }
  }
  function porQuadroEscondido(doc){
    return new Promise(resolve => {
      const f = document.createElement('iframe');
      f.setAttribute('aria-hidden', 'true');
      f.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
      document.body.appendChild(f);
      let abriu = false;
      const fim = ok => { setTimeout(() => f.remove(), ok ? 60000 : 0); resolve(ok); };
      try{
        const w = f.contentWindow;
        w.document.open(); w.document.write(doc); w.document.close();
        w.addEventListener('beforeprint', () => { abriu = true; });
        setTimeout(() => {
          try{ w.focus(); w.print(); }catch(e){ fim(false); return; }
          setTimeout(() => fim(abriu), 1200);
        }, 250);
      }catch(e){ fim(false); }
    });
  }
  const AUTO_IMPRIMIR = '<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},300)})<\/script>';
  function nomeArquivo(titulo, paciente){
    const limpa = s => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
    return limpa(titulo || 'Receita') + (paciente ? ' - ' + limpa(paciente) : '') + '.html';
  }
  async function porArquivo(doc, titulo, paciente, avisar){
    const html = doc.replace(/<\/body>/i, AUTO_IMPRIMIR + '</body>');
    const ok = await baixar(nomeArquivo(titulo, paciente), new Blob([html], { type: 'text/html' }));
    if(ok) avisar('Abra o arquivo baixado: a impressão começa sozinha');
    return ok;
  }
  // devolve true quando a impressão foi aberta ou o arquivo para imprimir foi salvo
  async function imprimir(titulo, doc, paciente, avisar){
    avisar = avisar || (() => {});
    if(modoSalvo() !== 'arquivo'){
      if(porJanela(doc)) return true;
      if(await porQuadroEscondido(doc)) return true;
      guardaModo('arquivo');
      avisar('O Claude não abriu a impressão aqui: baixe a receita pronta para imprimir');
    }
    return porArquivo(doc, titulo, paciente, avisar);
  }

  root.PONTE = Object.assign({ embutido, comBanco: () => comBanco, SINCRONIZADAS, sincronizar, salvar, onPaciente, emitida, fechar, baixar, imprimir }, puras);
})(typeof window !== 'undefined' ? window : globalThis);
