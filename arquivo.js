/* =====================================================================
 * GABOrg · arquivo.js — aplicação completa (front-end)
 * Secretaria de Estado de Educação de Mato Grosso · Decreto nº 2.236/2026
 * Arquivos do sistema: index.html (tela e estilos) + arquivo.js (este) + Codigo.gs (backend no Apps Script)
 * ===================================================================== */

/* ===================== APP INSTALÁVEL: ÍCONES E MANIFESTO GERADOS AQUI =====================
 * Nada de arquivos extras: os ícones são desenhados num canvas e o manifesto é montado em memória. */
(function prepararApp(){
  function icone(tam, cheio, margem){
    const c = document.createElement('canvas'); c.width = c.height = tam;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, tam);
    gr.addColorStop(0, '#2563eb'); gr.addColorStop(1, '#0e7490'); g.fillStyle = gr;
    const r = cheio ? 0 : tam * .22;
    g.beginPath(); g.moveTo(r, 0); g.arcTo(tam, 0, tam, tam, r); g.arcTo(tam, tam, 0, tam, r); g.arcTo(0, tam, 0, 0, r); g.arcTo(0, 0, tam, 0, r); g.closePath(); g.fill();
    const u = tam * margem, o = (tam - u) / 2, X = v => o + v * u, Y = v => o + v * u;
    g.strokeStyle = g.fillStyle = '#fff'; g.lineWidth = Math.max(1.5, u * .045); g.lineCap = 'square';
    g.beginPath(); g.moveTo(X(.5), Y(.3)); g.lineTo(X(.5), Y(.47)); g.moveTo(X(.17), Y(.47)); g.lineTo(X(.83), Y(.47));
    [.17, .5, .83].forEach(x => { g.moveTo(X(x), Y(.47)); g.lineTo(X(x), Y(.62)); }); g.stroke();
    const caixa = (x0, y0, x1, y1) => { const rr = u * .05; g.beginPath(); g.moveTo(X(x0) + rr, Y(y0)); g.arcTo(X(x1), Y(y0), X(x1), Y(y1), rr); g.arcTo(X(x1), Y(y1), X(x0), Y(y1), rr); g.arcTo(X(x0), Y(y1), X(x0), Y(y0), rr); g.arcTo(X(x0), Y(y0), X(x1), Y(y0), rr); g.closePath(); g.fill(); };
    caixa(.30, .08, .70, .32); [.17, .5, .83].forEach(x => caixa(x - .15, .62, x + .15, .86));
    return c.toDataURL('image/png');
  }
  const link = (rel, href, extra) => { const l = document.createElement('link'); l.rel = rel; l.href = href; Object.assign(l, extra || {}); document.head.appendChild(l); };
  try {
    const i192 = icone(192, false, .78), i512 = icone(512, false, .78), iMask = icone(512, true, .62);
    link('icon', icone(32, false, .82), { type:'image/png' });
    link('apple-touch-icon', icone(180, true, .78));
    const base = location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '');
    const manifesto = {
      name:'GABOrg · Organização Institucional SEDUC-MT', short_name:'GABOrg',
      description:'Setores, hierarquias, valores, impactos e validações da SEDUC-MT, com mapa interativo da estrutura.',
      id:base, start_url:base, scope:base, display:'standalone', orientation:'any',
      background_color:'#0b1222', theme_color:'#0b1222', lang:'pt-BR',
      icons:[{ src:i192, sizes:'192x192', type:'image/png', purpose:'any' }, { src:i512, sizes:'512x512', type:'image/png', purpose:'any' }, { src:iMask, sizes:'512x512', type:'image/png', purpose:'maskable' }]
    };
    link('manifest', 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifesto)));
  } catch (e) {}
})();

'use strict';
/* =====================================================================
   GABOrg · Organização institucional da SEDUC-MT
   Front-end único. Backend: Google Apps Script + Google Sheets (Codigo.gs)
   ===================================================================== */
const VERSAO = '1.29.0';
const NW = 236, NH = 82, GX = 26, GY = 50, GV = 14, IND = 30;

const TIPOS = {
  'Gabinete':           { cor:'#1e3a8a', ic:'fa-landmark', estilo:'cheio' },
  'Superintendência':   { cor:'#2563eb', ic:'fa-sitemap', estilo:'tinto' },
  'Coordenadoria':      { cor:'#0891b2', ic:'fa-diagram-project' },
  'Gerência':           { cor:'#0d9488', ic:'fa-briefcase' },
  'Núcleo':             { cor:'#14b8a6', ic:'fa-circle-nodes' },
  'Unidade':            { cor:'#7c3aed', ic:'fa-cube' },
  'Conselho':           { cor:'#475569', ic:'fa-people-group', estilo:'tinto' },
  'Colegiado':          { cor:'#64748b', ic:'fa-users-rectangle' },
  'Câmara':             { cor:'#78716c', ic:'fa-scale-balanced' },
  'Secretaria':         { cor:'#a16207', ic:'fa-file-signature' },
  'Comissão':           { cor:'#db2777', ic:'fa-handshake' },
  'Ouvidoria':          { cor:'#e11d48', ic:'fa-comments' },
  'Diretoria':          { cor:'#ea580c', ic:'fa-building-columns', estilo:'tinto' },
  'Diretoria Adjunta':  { cor:'#f59e0b', ic:'fa-building' },
  'Núcleo Regional':    { cor:'#65a30d', ic:'fa-location-dot' },
  'Unidades Escolares': { cor:'#16a34a', ic:'fa-school' },
  'Outro':              { cor:'#475569', ic:'fa-shapes' }
};
const STATUS_SETOR = { 'Ativo':'#16a34a', 'Em revisão':'#d97706', 'Proposto':'#2563eb', 'Extinto':'#94a3b8' };
const STATUS_VAL = { 'Sem validação':'#94a3b8', 'Pendente':'#d97706', 'Aprovado':'#16a34a', 'Aprovado com ressalvas':'#0891b2', 'Reprovado':'#dc2626' };
const IMPACTO = [ ['Não avaliado','#94a3b8'], ['Muito baixo','#22c55e'], ['Baixo','#84cc16'], ['Médio','#eab308'], ['Alto','#f97316'], ['Crítico','#dc2626'] ];
const TIPOS_VINCULO = ['Apoio técnico','Supervisão','Fluxo de processos','Colaboração','Atuação regional','Vinculação administrativa'];
const PALETA_AREA = ['#1e3a8a','#0891b2','#7c3aed','#ea580c','#059669','#db2777','#ca8a04','#4f46e5','#0d9488','#9333ea','#64748b','#be123c'];

const CAMPOS = {
  setores: ['id','nome','sigla','tipo','paiId','ordem','status','responsavel','contato','competencias','entregas','orcamento','custoMensal','servidores','comissionados','impacto','impactoDescricao','positivos','negativos','layout','colunas','dx','dy','atualizadoEm','atualizadoPor','quantidade'],
  validacoes: ['id','setorId','validadorId','status','parecer','solicitadoEm','solicitadoPor','respondidoEm','respondidoPor'],
  vinculos: ['id','origemId','destinoId','tipo','descricao'],
  historico: ['id','setorId','data','usuario','acao'],
  rubricas: ['id','codigo','nome','categoria','valorMensal','encargos','meses','observacao','ativo','atualizadoEm','atualizadoPor','percEfetivo','fonte'],
  despesas: ['id','setorId','rubricaId','descricao','quantidade','valorUnitario','meses','cenario','observacao','atualizadoEm','atualizadoPor','vinculo'],
  propostas: ['id','nome','descricao','status','itens','criadoEm','criadoPor','atualizadoEm','atualizadoPor'],
  propSetores: ['id','propostaId','setorId','nome','sigla','tipo','paiId','ordem','status','responsavel','contato','competencias','entregas','orcamento','custoMensal','servidores','comissionados','impacto','impactoDescricao','positivos','negativos','layout','colunas','dx','dy','atualizadoEm','atualizadoPor','quantidade','excluido'],
  escolas: ['id','codigo','nome','dre','municipio','tipo','localidade','endereco','numero','cep','bairro','telefone','email','latitude','longitude','atualizadoEm','atualizadoPor','alunos'],
  chefias: ['id','setorId','titular','situacao','desde','atoNomeacao','substituto','atoSubstituto','contato','observacao','atualizadoEm','atualizadoPor'],
  etapas: ['id','propostaId','titulo','fase','responsavel','setorId','inicio','prazo','status','observacao','ordem','atualizadoEm','atualizadoPor'],
  metas: ['id','setorId','objetivo','titulo','indicador','unidade','linhaBase','meta','resultado','prazo','status','observacao','atualizadoEm','atualizadoPor'],
  reunioes: ['id','titulo','data','participantes','itens','status','observacao','criadoEm','criadoPor','atualizadoEm','atualizadoPor'],
  parametros: ['id','valor','atualizadoEm','atualizadoPor'],
  servidores: ['id','matricula','nome','cargo','vinculo','tipoLotacao','unidade','lotacaoCod','lotacao','setorId','dataInicio','dataFinal','sugerido','importadoEm','importadoPor'],
};
const TABS_DB = ['setores','validacoes','vinculos','historico','rubricas','despesas','propostas','propSetores','escolas','chefias','etapas','metas','reunioes','parametros','servidores'];

/* ===================== ESTRUTURA DO DECRETO Nº 2.236/2026 =====================
   Hierarquia montada a partir do anexo (organograma). Cada nível = 2 espaços.
   [SIGLA] opcional · {h6} = filhos lado a lado em até 6 colunas · {v} = filhos em lista */
const SEED_TXT = `
Gabinete do Secretário de Estado de Educação [GS] {h8}
  Colégio Diretivo Estratégico
  Colégio de Avaliação das Estratégias
  Comitês Setoriais
  Conselho Estadual de Alimentação Escolar [CEAE]
  Conselho Estadual de Educação Indígena [CEEI]
  Núcleo de Gestão Estratégica para Resultados [NGER]
  Unidade de Desenvolvimento Organizacional
  Unidade de Comunicação da Educação
  Unidade Setorial PGE
  Ouvidoria Setorial
  Comissão de Ética
  Unidade Setorial de Correição
  Unidade Setorial de Controle Interno [UNISECI]
  Unidade de Apoio Estratégico
  Gabinete de Direção
  Unidade de Assessoria
  Conselho Estadual de Educação [CEE]
    Secretaria do Conselho
    Coordenadoria de Apoio às Câmaras
      Câmara de Educação Básica
      Câmara de Educação Profissional e Ensino Superior
    Coordenadoria de Suporte Operacional
  Gabinete do Secretário Adjunto Executivo [SAEX]
    Unidade de Coordenação do Programa
    Unidade de Cerimonial
    Unidade de Microplanejamento
    Unidade Executiva e de Negócios da Secretaria Adjunta Executiva
    Unidade de Normas da Secretaria Adjunta Executiva
    Unidade de Inteligência de Dados na Educação
    Superintendência de Tecnologia da Informação [STI]
      Coordenadoria de Desenvolvimento de Soluções de TI
        Núcleo de Análise e Desenvolvimento de Soluções de TI
        Núcleo de Inteligência de Negócios
        Núcleo de Tecnologias Educacionais
      Coordenadoria de Infraestrutura e Segurança da Informação
        Núcleo de Infraestrutura de TI
        Núcleo de Suporte Técnico de TI
        Núcleo de Serviços de TI
        Núcleo de Segurança da Informação e Proteção de Dados
    Superintendência de Escolas Estaduais Militares e Cívico-Militares
      Núcleo de Escolas Estaduais Militares
      Núcleo de Escolas Estaduais Cívico-Militares
  Gabinete do Secretário Adjunto de Gestão de Pessoas [SAGP]
    Unidade Executiva e de Negócio da Gestão de Pessoas
    Unidade de Normas da Gestão de Pessoas
    Unidade de Políticas de Formação Continuada
    Superintendência de Provimento e Movimentação
      Coordenadoria de Provimento
        Núcleo de Quadro de Pessoal
      Coordenadoria de Movimentação
      Coordenadoria de Recrutamento e Seleção
        Núcleo de Seletivos
    Superintendência de Desenvolvimento, Aplicação, Saúde e Segurança
      Coordenadoria de Saúde e Segurança
      Coordenadoria de Aplicação e Vida Funcional
        Núcleo de Progressão e Enquadramento Funcional
        Núcleo de Informação da Vida Funcional
      Coordenadoria de Desenvolvimento
        Núcleo de e-Formação e Mídia
        Núcleo de Monitoramento da Qualificação Profissional
        Núcleo de Estágio e Residência
        Núcleo de Logística de Formação
    Superintendência de Monitoramento e Folha de Pagamento
      Coordenadoria de Controle de Despesa e Conformidade da Folha
        Núcleo de Conformidade da Folha
        Núcleo de Controle de Despesas de Pessoal
        Núcleo de Impacto Pessoal
      Coordenadoria de Monitoramento de Pessoal
        Núcleo de Gestão da Assiduidade
  Gabinete do Secretário Adjunto de Infraestrutura e Patrimônio [SAIP]
    Unidade Executiva e de Negócio da Infraestrutura e Patrimônio
    Unidade de Normas da Infraestrutura e Patrimônio
    Superintendência de Patrimônio
      Coordenadoria de Patrimônio Imobiliário
        Núcleo de Patrimônio Imobiliário
      Coordenadoria de Patrimônio Mobiliário
        Núcleo de Patrimônio Mobiliário
    Superintendência de Obras
      Coordenadoria de Execução de Obras
        Núcleo de Fiscalização de Obras
      Coordenadoria de Projetos e Manutenção
        Núcleo de Desenvolvimento de Projetos
        Núcleo de Manutenção
        Núcleo de Infraestrutura
  Gabinete do Secretário Adjunto de Administração Sistêmica [SAAS]
    Unidade Executiva e de Negócio da Administração Sistêmica
    Unidade de Normas da Administração Sistêmica
    Superintendência de Aquisições e Contratos
      Coordenadoria de Gestão de Aquisições
      Coordenadoria de Gestão de Contratos
        Núcleo de Processo de Irregularidade Contratual
        Núcleo de Conformidade de Pagamentos de Contratos
    Superintendência de Finanças
      Coordenadoria de Orçamento
        Núcleo de Conformidade
      Coordenadoria Financeira
        Núcleo de Receita
    Superintendência Contábil
      Gerência de Informações Contábeis
      Gerência de Prestação e Conformidade
      Gerência de Sistema de Informação Orçamentário Público da Educação
    Superintendência Administrativa
      Coordenadoria Administrativa
        Gerência de Protocolo
        Gerência de Arquivo Central
        Núcleo de Serviços Gerais
      Núcleo de Frotas
    Superintendência de Convênios e Prestação de Contas
      Coordenadoria de Convênios e Prestação de Contas
        Núcleo de Convênios de Ingresso
        Núcleo de Convênios de Descentralização
        Núcleo de Análise de Projetos de Descentralização
        Núcleo de Prestação de Contas
        Núcleo de Prestação de Contas de Diárias
  Gabinete do Secretário Adjunto de Gestão Educacional [SAGE]
    Unidade Executiva e de Negócio da Gestão Educacional
    Unidade de Normas da Gestão Educacional
    Unidade de Cenários e Indicadores da Gestão Educacional
    Superintendência de Desenvolvimento Curricular
      Coordenadoria de Ensino Fundamental
      Coordenadoria de Ensino Médio
      Coordenadoria de Educação de Jovens e Adultos
      Coordenadoria de Educação Integrada e Inovação
      Núcleo de Currículo
      Núcleo do Sistema Estruturado de Ensino no Ensino Fundamental
      Núcleo do Sistema Estruturado de Ensino no Ensino Médio
    Superintendência de Equidade e Inclusão
      Coordenadoria de Educação Inclusiva
        Centro de Apoio e Suporte à Inclusão da Educação Especial [CASIES]
      Coordenadoria de Educação Escolar Indígena
      Coordenadoria de Educação Étnico-Racial e Ambiental
    Superintendência de Avaliação de Educação Básica
      Coordenadoria de Monitoramento e Avaliação Educacional
        Núcleo de Análise da Aprendizagem
      Coordenadoria de Gestão para Aprendizagem
        Núcleo de Recomposição das Aprendizagens
        Núcleo de Acompanhamento de Prioridades Pedagógicas
    Superintendência de Educação Profissional, Tecnológica e Tempo Integral
      Coordenadoria de Educação Profissional Tecnológica
      Coordenadoria de Educação em Tempo Integral
  Gabinete do Secretário Adjunto de Gestão Regional [SAGR] {h5}
    Unidade Executiva e de Negócio da Gestão Regional
    Unidade de Normas da Gestão Regional
    Unidade de Cenários da Gestão Regional
    Unidades Escolares
    Superintendência de Gestão Regional
      Núcleo de Monitoramento das DREs
    Superintendência de Gestão Escolar
      Coordenadoria de Gestão da Rede
        Núcleo de Estrutura e Funcionamento de Gestão Escolar
        Núcleo de Mediação Escolar
        Núcleo de Gestão de Repasses
        Núcleo de Escrituração
        Núcleo de Matrículas
        Núcleo de Bem-Estar Escolar
        Núcleo de Busca Ativa Escolar
      Coordenadoria de Alimentação Escolar
        Núcleo de Gestão das Aquisições da Alimentação Escolar
        Núcleo de Nutrição e Monitoramento
  Gabinete do Secretário Adjunto de Regime de Colaboração [SARC]
    Unidade Executiva e de Negócio do Regime de Colaboração
    Unidade de Normas do Regime de Colaboração
    Superintendência de Alfabetização em Regime de Colaboração
      Coordenadoria de Impacto Educacional
      Núcleo de Apoio e Desenvolvimento da Educação Infantil
      Núcleo de Apoio e Desenvolvimento da Alfabetização e Anos Iniciais
      Núcleo de Apoio e Desenvolvimento à Gestão Municipal
      Núcleo Educa-MT
      Núcleo de Análise e Monitoramento de Indicadores
    Superintendência de Políticas em Regime de Colaboração
      Coordenadoria de Transporte Escolar
      Núcleo de Informações Estatísticas
      Núcleo de Regime de Colaboração
`;
const DRES = [
  ['Rondonópolis', []], ['Sinop', ['Colíder','Lucas do Rio Verde']], ['Barra do Garças', ['Campinápolis','Canarana','Água Boa','Querência']],
  ['Cáceres', []], ['Confresa', ['Santa Terezinha','São Félix do Araguaia','São José do Xingu']], ['Diamantino', ['Nova Mutum']],
  ['Juína', ['Aripuanã','Cotriguaçu','Juara','Colniza']], ['Primavera do Leste', ['Paranatinga']], ['Tangará da Serra', []],
  ['Alta Floresta', ['Apiacás']], ['Matupá', []], ['Pontes e Lacerda', ['Rondolândia']]
];
const COORDS_DRE = ['Coordenadoria de Formação Continuada','Coordenadoria de Gestão Pedagógica','Coordenadoria de Gestão Escolar e de Rede','Coordenadoria Administrativa e Financeira','Coordenadoria de Gestão de Pessoas','Coordenadoria de Infraestrutura, Patrimônio e TI'];

function tipoPorNome(n){
  const t = norm(n);
  const r = [['gabinete','Gabinete'],['superintend','Superintendência'],['coordenadoria','Coordenadoria'],['nucleo regional','Núcleo Regional'],['nucleo','Núcleo'],['gerencia','Gerência'],['unidades escolares','Unidades Escolares'],['unidade','Unidade'],['centro','Unidade'],['conselho','Conselho'],['colegio','Colegiado'],['comite','Colegiado'],['camara','Câmara'],['secretaria','Secretaria'],['comissao','Comissão'],['ouvidoria','Ouvidoria'],['diretoria adjunta','Diretoria Adjunta'],['diretoria','Diretoria']];
  for (const [p,tp] of r) if (t.startsWith(p)) return tp;
  return 'Outro';
}
const ESCOLAS_PADRAO = '631';
const rotuloUnid = s => s.tipo === 'Unidades Escolares' ? 'escolas' : 'unidades';
function construirDecreto(){
  const L = [], V = []; let seq = 0;
  const add = (nome, pai, extra) => { const s = novoSetor(Object.assign({ id:'d'+String(++seq).padStart(3,'0'), nome, tipo:tipoPorNome(nome), paiId:pai||'', ordem:String(seq) }, extra||{})); L.push(s); return s.id; };
  const pilha = [], ref = {};
  SEED_TXT.split('\n').forEach(l => {
    if (!l.trim()) return;
    const m = l.match(/^( *)(.+?)(?: \[([^\]]+)\])?(?: \{([hv])(\d*)\})?\s*$/);
    const nivel = m[1].length / 2; pilha.length = nivel;
    const id = add(m[2], nivel ? pilha[nivel-1] : '', { sigla:m[3]||'', layout:m[4]||'', colunas:m[5]||'' });
    pilha[nivel] = id; ref[m[2]] = id;
  });
  const gr = ref['Gabinete do Secretário Adjunto de Gestão Regional'];
  const pol = ref['Superintendência de Políticas em Regime de Colaboração'];
  const met = add('Diretoria Metropolitana de Educação', gr, { sigla:'DME' });
  ['Conselho Deliberativo','Conselho Fiscal','Unidade de Assessoria'].forEach(n => add(n, met));
  const a1 = add('Diretoria Adjunta Metropolitana de Educação I', met); COORDS_DRE.forEach(n => add(n, a1));
  add('Diretoria Adjunta Metropolitana de Educação II', met);
  let nv = 0;
  DRES.forEach(([cid, nucs]) => {
    const d = add('Diretoria Regional de Educação de ' + cid, gr, { sigla:'DRE ' + cid });
    ['Conselho Deliberativo','Conselho Fiscal','Unidade de Assessoria'].forEach(n => add(n, d));
    const ad = add('Diretoria Adjunta Regional de ' + cid, d); COORDS_DRE.forEach(n => add(n, ad));
    nucs.forEach(n => add('Núcleo Regional de Educação de ' + n, d));
    const nrc = add('Núcleo de Regime de Colaboração da Diretoria Regional de ' + cid, pol);
    V.push(novoReg('vinculos', { id:'dv'+String(++nv).padStart(3,'0'), origemId:nrc, destinoId:d, tipo:'Atuação regional', descricao:'Atua junto à DRE de ' + cid + ' no regime de colaboração com os municípios.' }));
  });
  L.forEach(s => { if (s.tipo === 'Unidades Escolares' && !s.quantidade) s.quantidade = ESCOLAS_PADRAO; });
  return { setores:L, vinculos:V, validacoes:[], historico:[], rubricas:[], despesas:[], propostas:[], propSetores:[], escolas:[], chefias:[], etapas:[], metas:[], reunioes:[], parametros:[] };
}

/* ===================== UTILITÁRIOS ===================== */
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const num = v => { const n = Number(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; };
const arg = v => esc(JSON.stringify(String(v ?? '')));
const agora = () => new Date().toISOString();
const novoId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmtN = v => num(v).toLocaleString('pt-BR');
const fmtR = v => num(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
const fmtRc = v => { const n = num(v); if (n >= 1e9) return 'R$ ' + (n/1e9).toLocaleString('pt-BR',{maximumFractionDigits:1}) + ' bi'; if (n >= 1e6) return 'R$ ' + (n/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1}) + ' mi'; if (n >= 1e3) return 'R$ ' + (n/1e3).toLocaleString('pt-BR',{maximumFractionDigits:0}) + ' mil'; return fmtR(n); };
const fmtData = v => { const t = Date.parse(v); return isFinite(t) ? new Date(t).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'; };
const iniciais = n => { const p = String(n||'').trim().split(/\s+/).filter(Boolean); return p.length ? (p[0][0] + (p.length > 1 ? p[p.length-1][0] : '')).toUpperCase() : '?'; };
function parseValor(v){
  let t = String(v ?? '').replace(/R\$|\s/g, '');
  if (!t) return '';
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t); return isFinite(n) ? String(n) : '';
}
const linhasDe = v => String(v || '').split('\n').map(x => x.trim()).filter(Boolean);
const store = {
  get(k, p){ try { const v = localStorage.getItem(k); return v === null ? p : JSON.parse(v); } catch(e){ return p; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};
function novoReg(tab, o){ const r = {}; CAMPOS[tab].forEach(k => r[k] = ''); Object.assign(r, o || {}); Object.keys(r).forEach(k => r[k] = r[k] == null ? '' : String(r[k])); return r; }
function novoSetor(o){ return novoReg('setores', Object.assign({ status:'Ativo' }, o)); }
let toastT;
function toast(msg, tipo){
  const t = $('#toast'); t.querySelector('span').textContent = msg;
  t.querySelector('i').className = 'fa-solid ' + (tipo === 'erro' ? 'fa-circle-xmark' : tipo === 'aviso' ? 'fa-triangle-exclamation' : 'fa-circle-check');
  t.querySelector('i').style.color = tipo === 'erro' ? '#f87171' : tipo === 'aviso' ? '#fbbf24' : '#4ade80';
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200);
}
function confirmar(titulo, texto, rotulo, perigo){
  return new Promise(ok => {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="cx" role="dialog" aria-modal="true"><h3>${esc(titulo)}</h3><p>${texto}</p><div class="acoes"><button class="btn btn-s" data-r="0">Cancelar</button><button class="btn ${perigo ? 'btn-perigo' : 'btn-p'}" data-r="1">${esc(rotulo || 'Confirmar')}</button></div></div>`;
    m.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b || e.target === m){ m.remove(); ok(!!(b && b.dataset.r === '1')); } });
    document.body.appendChild(m); m.querySelector('[data-r="1"]').focus();
  });
}

/* ===================== ESTADO ===================== */
let DB = { setores:[], validacoes:[], vinculos:[], historico:[], rubricas:[], despesas:[], propostas:[], propSetores:[], escolas:[], chefias:[], etapas:[], metas:[], reunioes:[], parametros:[], servidores:[] };
let backendVersao = '';
const URL_PADRAO = 'https://script.google.com/macros/s/AKfycbzZsM71FJARYYoqpRcFY4tHUAVBV-EdVW2NDL6eLaMId-iXY6Z-bnhuOkxA2nyfrdUz/exec';
let cfg = Object.assign({ url:URL_PADRAO, login:'', usuario:'', perfil:'', modo:'' }, store.get('gaborg_cfg', {}));
if (!cfg.url) cfg.url = URL_PADRAO;
delete cfg.chave;
// Token de sessão: localStorage com "Manter conectado", senão só nesta aba (sessionStorage)
const sessao = {
  get(){ try { return sessionStorage.getItem('gaborg_token') || localStorage.getItem('gaborg_token') || ''; } catch (e) { return ''; } },
  set(t, lembrar){ try { sessionStorage.removeItem('gaborg_token'); localStorage.removeItem('gaborg_token'); if (t) (lembrar ? localStorage : sessionStorage).setItem('gaborg_token', t); } catch (e) {} },
  lembrado(){ try { return !!localStorage.getItem('gaborg_token'); } catch (e) { return false; } }
};
cfg.token = sessao.get();
const ehAdmin = () => !!acesso().administrar;
const somenteLeitura = () => { const k = VISTA_SECAO[typeof vistaAtual !== 'undefined' ? vistaAtual : 'mapa']; if (k && SEM_EDICAO.has(k)) return k === 'relatorios' ? !podeExtra('documentos') : !editaAlgo(acesso()); return k ? !podeEditarSec(k) : !editaAlgo(acesso()); };
/* ===================== PERFIS DE ACESSO =====================
   Cada perfil define, seção por seção, se ela fica oculta, só para ver ou para editar, e quatro permissões extras.
   O Codigo.gs (1.13.0) aplica as mesmas regras no servidor: não envia dados de seções ocultas e recusa gravações indevidas. */
const SECOES_ACESSO = [
  ['Estrutura', [['estrutura', 'Mapa e lista de setores', 'fa-diagram-project', ['mapa', 'lista'], 'Organograma, lista, painel do setor, valores, vínculos'], ['escolas', 'Mapa de MT (escolas)', 'fa-map-location-dot', ['escolas'], 'Mapa das escolas e DREs; editar escolas e alunos']]],
  ['Análise', [['painel', 'Indicadores', 'fa-chart-line', ['painel'], 'Indicadores estratégicos (só leitura)', true], ['relatorios', 'Relatórios e minutas', 'fa-file-pdf', ['relatorios'], 'Montar relatórios, portarias e decretos', true], ['financeiro', 'Financeiro', 'fa-coins', ['financeiro'], 'Rubricas, despesas e custos'],
    ['propostas', 'Propostas', 'fa-lightbulb', ['propostas'], 'Cenários de reestruturação'], ['validacoes', 'Validações', 'fa-stamp', ['validacoes'], 'Pedidos e respostas de validação'], ['tv', 'Modo TV', 'fa-tv', [], 'Apresentação em tela cheia', true]]],
  ['Gestão', [['reestruturacao', 'Reestruturação', 'fa-compass-drafting', ['reestruturacao'], 'Metas, atribuições e minuta'], ['implantacao', 'Implantação', 'fa-list-check', ['implantacao'], 'Etapas, prazos e responsáveis'], ['chefias', 'Chefias', 'fa-user-tie', ['chefias'], 'Titulares, substitutos e atos'],
    ['servidores', 'Servidores', 'fa-id-card-clip', ['servidores'], 'Lotação, vínculos e importação'], ['resultados', 'Resultados', 'fa-bullseye', ['resultados'], 'Pacto de metas'], ['regional', 'Gestão regional', 'fa-route', ['regional'], 'Análise das DREs e sugestões'], ['reunioes', 'Reuniões', 'fa-people-group', ['reunioes'], 'Pautas, decisões e encaminhamentos']]]
];
const SECOES_LISTA = SECOES_ACESSO.flatMap(g => g[1]);
const SEM_EDICAO = new Set(SECOES_LISTA.filter(x => x[5]).map(x => x[0]));
const EXTRAS_ACESSO = [['administrar', 'Administrar usuários e perfis', 'fa-user-shield', 'Criar logins, redefinir senhas, criar perfis, restaurar a estrutura'], ['nomesServidores', 'Ver nomes e matrículas de servidores', 'fa-id-card', 'Sem isso a seção Servidores mostra só números'],
  ['exportar', 'Exportar planilhas e cópias', 'fa-file-csv', 'Baixar CSV das listas e a cópia completa (JSON)'], ['documentos', 'Emitir relatórios e minutas', 'fa-file-signature', 'Gerar PDF, Word e impressão com código de verificação']];
const NIVEIS = { oculto:['Oculto', 'fa-eye-slash', '#94a3b8'], ver:['Ver', 'fa-eye', '#2563eb'], editar:['Editar', 'fa-pen', '#16a34a'] };
const VISTA_SECAO = {}; SECOES_LISTA.forEach(([k, , , vs]) => vs.forEach(v => { VISTA_SECAO[v] = k; }));
function perfilSistema(nome){
  const tudo = v => SECOES_LISTA.reduce((o, [k]) => (o[k] = v, o), {});
  if (nome === 'Administrador') return { id:'Administrador', nome, sistema:true, cor:'#dc2626', descricao:'Tudo, inclusive usuários, perfis e restauração da estrutura.', administrar:true, secoes:tudo('editar'), extras:{ nomesServidores:true, exportar:true, documentos:true } };
  if (nome === 'Editor') return { id:'Editor', nome, sistema:true, cor:'#2563eb', descricao:'Vê e altera todas as seções; não gerencia usuários.', administrar:false, secoes:tudo('editar'), extras:{ nomesServidores:true, exportar:true, documentos:true } };
  return { id:'Leitor', nome:'Leitor', sistema:true, cor:'#64748b', descricao:'Consulta todas as seções, sem alterar nada; não vê nomes de servidores.', administrar:false, secoes:tudo('ver'), extras:{ nomesServidores:false, exportar:true, documentos:true } };
}
let perfisLista = [];
const acesso = () => cfg.simulado || cfg.acesso || perfilSistema(cfg.perfil);
const nivelSec = k => { const a = acesso(); return a.administrar ? 'editar' : ((a.secoes || {})[k] || 'oculto'); };
const podeVerSec = k => nivelSec(k) !== 'oculto';
const podeEditarSec = k => !SEM_EDICAO.has(k) && nivelSec(k) === 'editar';
const podeExtra = k => { const a = acesso(); return !!(a.administrar || (a.extras || {})[k]); };
const editaAlgo = a => !!(a.administrar || SECOES_LISTA.some(([k]) => !SEM_EDICAO.has(k) && (a.secoes || {})[k] === 'editar'));
const podeVerVista = v => !VISTA_SECAO[v] || podeVerSec(VISTA_SECAO[v]) || (v === 'usuarios' && ehAdmin());
const primeiraVista = () => { const b = [...document.querySelectorAll('.lado .nav-b[data-vista]')].find(b => podeVerVista(b.dataset.vista)); return b ? b.dataset.vista : 'config'; };
function aplicarAcessoUI(){
  document.querySelectorAll('.lado .nav-b[data-vista]').forEach(b => b.classList.toggle('sem-acesso', !podeVerVista(b.dataset.vista) || (b.dataset.vista === 'usuarios' && !ehAdmin())));
  const tv = document.querySelector('.nav-b.nav-tv'); if (tv) tv.classList.toggle('sem-acesso', !podeVerSec('tv'));
  document.querySelectorAll('.lado nav h6').forEach(h => { let n = h.nextElementSibling, vis = false; while (n && n.tagName !== 'H6') { if (n.classList.contains('nav-b') && !n.classList.contains('sem-acesso') && !(n.classList.contains('so-adm') && !ehAdmin())) vis = true; n = n.nextElementSibling; } h.classList.toggle('sem-acesso', !vis); });
  document.body.classList.toggle('adm', ehAdmin()); document.body.classList.toggle('ro', somenteLeitura());
  const sim = $('#acesso-sim'); if (sim) sim.remove();
  if (cfg.simulado) document.body.insertAdjacentHTML('beforeend', `<div id="acesso-sim" style="--c:${esc(cfg.simulado.cor || '#7c3aed')}"><i class="fa-solid fa-user-secret"></i><span>Visualizando como <b>${esc(cfg.simulado.nome)}</b> — a tela mostra só o que este perfil vê</span><button class="btn btn-sm" onclick="sairSimulacao()">Voltar ao meu perfil</button></div>`);
  if (typeof vistaAtual !== 'undefined' && !podeVerVista(vistaAtual) && document.querySelector('#app:not(.hidden)')) trocarVista(primeiraVista());
}
function simularPerfil(id){
  const p = perfisLista.find(x => x.id === id) || perfilSistema(id); if (!p || !ehAdmin()) return;
  cfg.simulado = JSON.parse(JSON.stringify(p)); aplicarAcessoUI(); trocarVista(primeiraVista()); toast('Visualizando como ' + p.nome + '. Os dados continuam os seus; só a tela muda.');
}
function sairSimulacao(){ delete cfg.simulado; aplicarAcessoUI(); trocarVista('usuarios'); abaAdm('perfis'); }
/* exportações e documentos respeitam as permissões extras */
['exportarCSV', 'exportarJSON', 'exportarEscolasMT', 'svExportar', 'exportarChefias', 'csvBaixar'].forEach(n => { const f = window[n]; if (typeof f !== 'function') return; window[n] = function(){ if (!podeExtra('exportar')) return toast('Seu perfil não pode exportar planilhas.', 'aviso'); return f.apply(this, arguments); }; });
['emitirDoc', 'exportarMinuta'].forEach(n => { const f = window[n]; if (typeof f !== 'function') return; window[n] = function(){ if (!podeExtra('documentos')) return toast('Seu perfil não pode emitir documentos.', 'aviso'); return f.apply(this, arguments); }; });
['abrirModoTV'].forEach(n => { const f = window[n]; if (typeof f !== 'function') return; window[n] = function(){ if (!podeVerSec('tv')) return toast('Seu perfil não tem acesso ao Modo TV.', 'aviso'); return f.apply(this, arguments); }; });

/* ---------- tela de perfis ---------- */
async function carregarPerfis(){
  try { const r = await chamar({ action:'profiles_list' }, 30000); if (r.status !== 'success') throw new Error(r.message); perfisLista = r.perfis || []; }
  catch (e) { if (!perfisLista.length) perfisLista = ['Administrador', 'Editor', 'Leitor'].map(perfilSistema); }
  return perfisLista;
}
const backendSemPerfis = () => online() && backendVersao && svVerMaior('1.13.0', backendVersao);
const corPerfil = nome => (perfisLista.find(p => p.nome === nome) || {}).cor || COR_PERFIL[nome] || '#7c3aed';
function contagemNiveis(p){ const c = { oculto:0, ver:0, editar:0 }; SECOES_LISTA.forEach(([k]) => { const v = p.administrar ? (SEM_EDICAO.has(k) ? 'ver' : 'editar') : (p.secoes[k] || 'oculto'); c[SEM_EDICAO.has(k) && v === 'editar' ? 'ver' : v]++; }); return c; }
async function renderPerfis(){
  const el = $('#u-corpo'); if (!el) return;
  if (!perfisLista.length || !usuarios.length) { el.innerHTML = '<div class="cartao vazio"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando perfis...</div>'; await carregarPerfis(); if (!usuarios.length) { try { const r = await chamar({ action:'users_list' }, 30000); if (r.status === 'success') usuarios = r.usuarios || []; } catch (e) {} } }
  if (abaAdmAtual !== 'perfis') return;
  const n = nome => usuarios.filter(u => u.perfil === nome && u.ativo === 'Sim').length;
  const card = p => { const c = contagemNiveis(p), ex = EXTRAS_ACESSO.filter(([k]) => k === 'administrar' ? p.administrar : p.extras && p.extras[k]);
    return `<div class="pf-card" style="--c:${esc(p.cor)}"><div class="pf-top"><span class="pf-ic"><i class="fa-solid ${p.administrar ? 'fa-user-shield' : p.sistema ? 'fa-user-lock' : 'fa-user-gear'}"></i></span><div><b>${esc(p.nome)}</b>${p.sistema ? ' <span class="chip" style="--c:#64748b">do sistema</span>' : ''}<small>${esc(p.descricao || 'Sem descrição')}</small></div><span class="pf-n" title="usuários ativos com este perfil">${n(p.nome)}<small>usuário(s)</small></span></div>
      <div class="pf-barra"><span style="flex:${c.editar};background:#16a34a" title="${c.editar} para editar"></span><span style="flex:${c.ver};background:#2563eb" title="${c.ver} só para ver"></span><span style="flex:${c.oculto};background:#cbd5e1" title="${c.oculto} ocultas"></span></div>
      <div class="pf-cont"><span><i class="fa-solid fa-pen" style="color:#16a34a"></i>${c.editar} editar</span><span><i class="fa-solid fa-eye" style="color:#2563eb"></i>${c.ver} ver</span><span><i class="fa-solid fa-eye-slash" style="color:#94a3b8"></i>${c.oculto} ocultas</span></div>
      <div class="pf-ex">${ex.map(([, t, ic]) => `<span title="${esc(t)}"><i class="fa-solid ${ic}"></i>${esc(t)}</span>`).join('') || '<span class="s">Sem permissões extras</span>'}</div>
      <div class="pf-ac">${p.sistema ? `<button class="btn btn-s btn-sm" onclick="formPerfil(${arg(p.id)},true)"><i class="fa-solid fa-eye"></i>Ver detalhes</button>` : `<button class="btn btn-p btn-sm" onclick="formPerfil(${arg(p.id)})"><i class="fa-solid fa-pen"></i>Editar</button>`}
        <button class="btn btn-s btn-sm" onclick="formPerfil(${arg(p.id)},false,true)" title="Criar um perfil novo a partir deste"><i class="fa-regular fa-copy"></i>Duplicar</button>
        <button class="btn btn-s btn-sm" onclick="simularPerfil(${arg(p.id)})" title="Ver a tela como este perfil vê"><i class="fa-solid fa-user-secret"></i>Ver como</button>
        ${p.sistema ? '' : `<button class="btn btn-g btn-sm btn-i" title="Excluir perfil" onclick="apagarPerfil(${arg(p.id)})"><i class="fa-solid fa-trash"></i></button>`}</div></div>`; };
  const cel = (p, k) => { const v = p.administrar ? 'editar' : p.secoes[k] || 'oculto', w = SEM_EDICAO.has(k) && v === 'editar' ? 'ver' : v; return `<td class="pf-cel"><span class="pf-niv ${w}" style="--c:${NIVEIS[w][2]}"><i class="fa-solid ${NIVEIS[w][1]}"></i>${w === 'oculto' ? '—' : NIVEIS[w][0]}</span></td>`; };
  el.innerHTML = `${backendSemPerfis() ? `<div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-triangle-exclamation"></i>Atualize o Codigo.gs para a versão 1.13.0</h3><p class="s">A planilha está com o backend ${esc(backendVersao)}, que só conhece os perfis Administrador, Editor e Leitor. Cole o novo Codigo.gs e publique uma nova versão para criar perfis personalizados.</p></div>` : ''}
    <div class="pf-cab"><div><h3 style="margin:0">Perfis de acesso</h3><p class="s" style="margin:2px 0 0">Defina, seção por seção, o que cada perfil <b>vê</b> e o que pode <b>editar</b>. As regras valem também na planilha: o servidor não envia dados de seções ocultas.</p></div>
      <div class="pf-novo"><button class="btn btn-p" onclick="novoPerfil()" ${backendSemPerfis() ? 'disabled' : ''}><i class="fa-solid fa-plus"></i>Novo perfil</button></div></div>
    <div class="pf-grade">${perfisLista.map(card).join('')}</div>
    <div class="cartao bl" style="--c:#7c3aed;margin-top:16px"><h3><i class="fa-solid fa-table-cells"></i>O que cada perfil vê e acessa</h3><p class="s"><span class="pf-leg"><i class="fa-solid fa-pen" style="color:#16a34a"></i>editar <i class="fa-solid fa-eye" style="color:#2563eb"></i>só ver <i class="fa-solid fa-eye-slash" style="color:#94a3b8"></i>oculto</span></p>
      <div class="tab-wrap"><table class="tab pf-mat"><thead><tr><th>Seção</th>${perfisLista.map(p => `<th style="--c:${esc(p.cor)}"><span>${esc(p.nome)}</span></th>`).join('')}</tr></thead><tbody>
      ${SECOES_ACESSO.map(([g, l]) => `<tr class="pf-g"><td colspan="${perfisLista.length + 1}">${g}</td></tr>` + l.map(([k, t, ic]) => `<tr><td><i class="fa-solid ${ic}" style="color:var(--mut);width:18px"></i>${t}</td>${perfisLista.map(p => cel(p, k)).join('')}</tr>`).join('')).join('')}
      <tr class="pf-g"><td colspan="${perfisLista.length + 1}">Permissões extras</td></tr>
      ${EXTRAS_ACESSO.map(([k, t, ic]) => `<tr><td><i class="fa-solid ${ic}" style="color:var(--mut);width:18px"></i>${t}</td>${perfisLista.map(p => { const v = k === 'administrar' ? p.administrar : p.administrar || (p.extras || {})[k]; return `<td class="pf-cel">${v ? '<span class="pf-niv" style="--c:#16a34a"><i class="fa-solid fa-check"></i>Sim</span>' : '<span class="pf-niv oculto" style="--c:#94a3b8">—</span>'}</td>`; }).join('')}</tr>`).join('')}
      <tr><td><b>Usuários ativos</b></td>${perfisLista.map(p => `<td class="pf-cel"><b>${n(p.nome)}</b></td>`).join('')}</tr></tbody></table></div></div>
    <div class="cartao bl" style="margin-top:14px"><h3><i class="fa-solid fa-shield-halved"></i>Regras de segurança</h3>
      <p class="s" style="line-height:1.7">• As permissões são conferidas no servidor (Apps Script): uma seção oculta não tem seus dados enviados, e gravações fora do perfil são recusadas.<br>• Os perfis Administrador, Editor e Leitor são do sistema e não podem ser alterados; duplique-os para criar variações.<br>• Sempre fica pelo menos um usuário ativo com permissão de administrar.<br>• Senhas com no mínimo 8 caracteres, letras e números, guardadas só de forma cifrada; 5 senhas erradas bloqueiam o login por 15 minutos.<br>• Mudanças de perfil valem no próximo carregamento da pessoa (ou ao recarregar a página).</p></div>`;
}
const MODELOS_PERFIL = [
  ['branco', 'Em branco', 'fa-file', 'Tudo oculto; você escolhe seção por seção', {}, {}],
  ['consulta', 'Consulta total', 'fa-eye', 'Vê todas as seções, sem editar', { '*':'ver' }, { exportar:true, documentos:true }],
  ['gabinete', 'Gabinete — análise e documentos', 'fa-landmark', 'Indicadores, relatórios, mapas e Modo TV', { estrutura:'ver', escolas:'ver', painel:'ver', relatorios:'ver', tv:'ver', propostas:'ver', reestruturacao:'ver', resultados:'ver', regional:'ver', chefias:'ver' }, { documentos:true, exportar:true }],
  ['pessoas', 'Gestão de pessoas', 'fa-id-card-clip', 'Edita servidores e chefias; consulta a estrutura', { estrutura:'ver', painel:'ver', servidores:'editar', chefias:'editar', implantacao:'ver', relatorios:'ver' }, { nomesServidores:true, exportar:true, documentos:true }],
  ['regional', 'DRE / Gestão regional', 'fa-map-location-dot', 'Edita escolas e alunos; vê DREs, servidores e indicadores', { estrutura:'ver', escolas:'editar', regional:'ver', painel:'ver', servidores:'ver', relatorios:'ver', tv:'ver' }, { documentos:true }],
  ['financeiro', 'Financeiro', 'fa-coins', 'Edita custos; vê estrutura e propostas', { estrutura:'ver', financeiro:'editar', propostas:'ver', painel:'ver', relatorios:'ver' }, { exportar:true, documentos:true }],
  ['indicadores', 'Somente indicadores', 'fa-chart-line', 'Indicadores e Modo TV, nada mais', { painel:'ver', tv:'ver' }, {}]
];
function novoPerfil(){
  abrirModal({ titulo:'Novo perfil: comece por um modelo', rotulo:'Fechar', semCancelar:true, largura:760, html:`<p class="s" style="margin:0 0 10px">Escolha um ponto de partida. Depois você ajusta cada seção.</p><div class="pf-modelos">${MODELOS_PERFIL.map(([k, t, ic, d]) => `<button type="button" onclick="this.closest('.modal').remove();formPerfil('',false,false,${arg(k)})"><i class="fa-solid ${ic}"></i><b>${t}</b><small>${d}</small></button>`).join('')}</div>` });
}
let pfEd = null;
function formPerfil(id, soVer, duplicar, modelo){
  const base = perfisLista.find(p => p.id === id);
  let p;
  if (modelo) { const m = MODELOS_PERFIL.find(x => x[0] === modelo); p = { id:'', nome:m[0] === 'branco' ? '' : m[1], descricao:m[3], cor:'#7c3aed', administrar:false, secoes:{}, extras:Object.assign({ nomesServidores:false, exportar:false, documentos:false }, m[5]) }; SECOES_LISTA.forEach(([k]) => { p.secoes[k] = m[4][k] || m[4]['*'] || 'oculto'; }); }
  else { p = JSON.parse(JSON.stringify(base || perfilSistema('Leitor'))); if (duplicar) { p.id = ''; p.nome = 'Cópia de ' + p.nome; p.sistema = false; } }
  pfEd = p; const ro = !!soVer;
  abrirModal({ titulo:ro ? 'Perfil ' + p.nome : (p.id ? 'Editar perfil' : 'Novo perfil'), rotulo:ro ? 'Fechar' : 'Salvar perfil', semCancelar:ro, largura:1040, html:`<div class="pf-ed ${ro ? 'ro' : ''}">
    <div class="pf-ed-l">
      <div class="g2"><label><span class="rot">Nome do perfil</span><input class="campo" id="pf-nome" value="${esc(p.nome)}" placeholder="ex.: Coordenação de Pessoas" ${ro ? 'disabled' : 'required'} oninput="pfEd.nome=this.value;pfPrevia()"></label>
        <label><span class="rot">Cor</span><div class="pf-cores">${['#7c3aed', '#0e7490', '#16a34a', '#d97706', '#db2777', '#0f766e', '#4f46e5', '#b45309'].map(c => `<button type="button" style="background:${c}" class="${c === p.cor ? 'on' : ''}" onclick="pfEd.cor='${c}';this.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===this));pfPrevia()" ${ro ? 'disabled' : ''}></button>`).join('')}</div></label></div>
      <label><span class="rot">Descrição <small>para quem é este perfil</small></span><input class="campo" id="pf-desc" value="${esc(p.descricao || '')}" ${ro ? 'disabled' : ''}></label>
      <div class="pf-rap">${ro ? '' : `<span class="s">Aplicar a todas:</span>${Object.entries(NIVEIS).map(([v, [t, ic]]) => `<button type="button" class="btn btn-s btn-sm" onclick="pfTodas('${v}')"><i class="fa-solid ${ic}"></i>${t}</button>`).join('')}`}</div>
      <div class="pf-secs">${SECOES_ACESSO.map(([g, l]) => `<div class="pf-gr"><h4>${g}</h4>${l.map(([k, t, ic, , d]) => `<div class="pf-lin"><i class="fa-solid ${ic} pf-li"></i><div class="pf-lt"><b>${t}</b><small>${d}</small></div>
          <div class="pf-seg" data-k="${k}">${Object.entries(NIVEIS).map(([v, [tt, ic2, c]]) => `<button type="button" data-v="${v}" style="--c:${c}" class="${(p.administrar ? (SEM_EDICAO.has(k) ? 'ver' : 'editar') : p.secoes[k]) === v ? 'on' : ''}" ${ro || (v === 'editar' && SEM_EDICAO.has(k)) ? 'disabled' : ''} onclick="pfNivel('${k}','${v}')" title="${v === 'editar' && SEM_EDICAO.has(k) ? 'Esta seção não tem edição' : tt}"><i class="fa-solid ${ic2}"></i>${tt}</button>`).join('')}</div></div>`).join('')}</div>`).join('')}</div>
      <div class="pf-gr"><h4>Permissões extras</h4>${EXTRAS_ACESSO.map(([k, t, ic, d]) => `<div class="pf-lin pf-x" onclick="if(event.target.tagName!=='INPUT'){const c=this.querySelector('input');if(!c.disabled){c.checked=!c.checked;c.dispatchEvent(new Event('change'))}}"><i class="fa-solid ${ic} pf-li"></i><div class="pf-lt"><b>${t}</b><small>${d}</small></div><input type="checkbox" class="pf-sw" data-x="${k}" ${(k === 'administrar' ? p.administrar : p.extras[k]) ? 'checked' : ''} ${ro ? 'disabled' : ''} onchange="pfExtra('${k}',this.checked)"></div>`).join('')}</div>
    </div>
    <div class="pf-ed-r"><div class="pf-prev-t">Como a pessoa verá o menu</div><div id="pf-prev"></div></div></div>`,
    aoConfirmar:ro ? undefined : async m => {
      pfEd.nome = m.querySelector('#pf-nome').value.trim(); pfEd.descricao = m.querySelector('#pf-desc').value.trim();
      if (pfEd.nome.length < 3) throw new Error('Dê um nome ao perfil (mínimo 3 letras).');
      if (!pfEd.administrar && !SECOES_LISTA.some(([k]) => pfEd.secoes[k] !== 'oculto')) throw new Error('O perfil precisa ver ao menos uma seção.');
      const r = await chamar({ action:'profile_save', perfil:pfEd }, 30000); if (r.status !== 'success') throw new Error(r.message);
      perfisLista = r.perfis || perfisLista; toast('Perfil salvo.'); return true;
    } }).then(ok => { if (ok) renderPerfis(); });
  pfPrevia();
}
function pfNivel(k, v){ if (!pfEd) return; pfEd.secoes[k] = v; if (pfEd.administrar && v !== 'editar') { pfEd.administrar = false; const x = document.querySelector('.pf-sw[data-x=administrar]'); if (x) x.checked = false; } const s = document.querySelector(`.pf-seg[data-k="${k}"]`); if (s) s.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); pfPrevia(); }
function pfTodas(v){ SECOES_LISTA.forEach(([k]) => pfNivel(k, v === 'editar' && SEM_EDICAO.has(k) ? 'ver' : v)); }
function pfExtra(k, on){ if (!pfEd) return; if (k === 'administrar') { pfEd.administrar = on; if (on) { pfTodas('editar'); EXTRAS_ACESSO.forEach(([x]) => { if (x !== 'administrar') { pfEd.extras[x] = true; const c = document.querySelector(`.pf-sw[data-x=${x}]`); if (c) c.checked = true; } }); } } else pfEd.extras[k] = on; pfPrevia(); }
function pfPrevia(){
  const el = $('#pf-prev'); if (!el || !pfEd) return; const p = pfEd, niv = k => p.administrar ? (SEM_EDICAO.has(k) ? 'ver' : 'editar') : (p.secoes[k] || 'oculto');
  const vis = SECOES_LISTA.filter(([k]) => niv(k) !== 'oculto'), c = { editar:vis.filter(([k]) => niv(k) === 'editar').length, ver:vis.filter(([k]) => niv(k) === 'ver').length };
  el.innerHTML = `<div class="pf-menu" style="--c:${esc(p.cor)}"><div class="pf-menu-u"><span class="u-av" style="background:${esc(p.cor)}">${esc(iniciais(p.nome || 'Novo'))}</span><div><b>${esc(p.nome || 'Novo perfil')}</b><small>${c.editar} para editar · ${c.ver} só para ver</small></div></div>
    ${SECOES_ACESSO.map(([g, l]) => { const it = l.filter(([k]) => niv(k) !== 'oculto'); return it.length ? `<h6>${g}</h6>` + it.map(([k, t, ic]) => `<div class="pf-mi"><i class="fa-solid ${ic}"></i><span>${t}</span><i class="fa-solid ${niv(k) === 'editar' ? 'fa-pen' : 'fa-eye'} pf-mi-n" style="color:${niv(k) === 'editar' ? '#16a34a' : '#93c5fd'}"></i></div>`).join('') : ''; }).join('') || '<p class="pf-vz">Nenhuma seção visível</p>'}
    ${p.administrar ? '<h6>Sistema</h6><div class="pf-mi"><i class="fa-solid fa-user-shield"></i><span>Administração</span></div>' : ''}<div class="pf-mi"><i class="fa-solid fa-gear"></i><span>Configurações</span></div></div>
    <ul class="pf-res">${[p.extras.nomesServidores || p.administrar ? (podeVerAlgum(p, 'servidores') ? '<li><i class="fa-solid fa-id-card" style="color:#16a34a"></i>Vê nomes e matrículas dos servidores</li>' : '') : (podeVerAlgum(p, 'servidores') ? '<li><i class="fa-solid fa-lock" style="color:#d97706"></i>Servidores só em números (sem nomes)</li>' : ''),
      p.extras.exportar || p.administrar ? '<li><i class="fa-solid fa-file-csv" style="color:#16a34a"></i>Pode exportar planilhas</li>' : '<li><i class="fa-solid fa-ban" style="color:#94a3b8"></i>Não exporta planilhas</li>',
      p.extras.documentos || p.administrar ? '<li><i class="fa-solid fa-file-signature" style="color:#16a34a"></i>Emite relatórios e minutas</li>' : '<li><i class="fa-solid fa-ban" style="color:#94a3b8"></i>Não emite documentos</li>',
      p.administrar ? '<li><i class="fa-solid fa-user-shield" style="color:#dc2626"></i>Administra usuários e perfis</li>' : ''].join('')}</ul>`;
}
const podeVerAlgum = (p, k) => p.administrar || (p.secoes[k] && p.secoes[k] !== 'oculto');
async function apagarPerfil(id){
  const p = perfisLista.find(x => x.id === id); if (!p) return;
  if (!await confirmar('Excluir perfil', `Excluir o perfil <b>${esc(p.nome)}</b>? Só é possível se nenhum usuário estiver com ele.`, 'Excluir', true)) return;
  try { const r = await chamar({ action:'profile_delete', id }, 30000); if (r.status !== 'success') throw new Error(r.message); perfisLista = r.perfis || []; toast('Perfil excluído.'); renderPerfis(); } catch (e) { toast(e.message, 'erro'); }
}

let porId = new Map(), filhos = new Map(), prof = new Map(), areaDe = new Map(), areas = [], valPorSetor = new Map();
let abertos = new Set(store.get('gaborg_abertos', []));
let listaAbertos = new Set(store.get('gaborg_lista_abertos', []));
let selId = '', abaPainel = 'dados', vistaAtual = 'mapa';

function indexar(){
  porId = new Map(DB.setores.map(s => [s.id, s]));
  filhos = new Map([['', []]]);
  DB.setores.forEach(s => { const p = porId.has(s.paiId) && s.paiId !== s.id ? s.paiId : ''; if (!filhos.has(p)) filhos.set(p, []); filhos.get(p).push(s); });
  filhos.forEach(l => l.sort((a, b) => num(a.ordem) - num(b.ordem) || a.nome.localeCompare(b.nome, 'pt-BR')));
  prof = new Map(); areaDe = new Map(); areas = [];
  const visit = (s, d, area) => {
    if (prof.has(s.id)) return;
    prof.set(s.id, d); areaDe.set(s.id, area);
    if (d === 1) areas.push(s.id);
    (filhos.get(s.id) || []).forEach(k => visit(k, d + 1, d === 0 ? k.id : area));
  };
  filhos.get('').forEach(r => visit(r, 0, r.id));
  // Ciclos criados por edição manual na planilha: ficam como raiz
  DB.setores.forEach(s => { if (!prof.has(s.id)) { s.paiId = ''; filhos.get('').push(s); visit(s, 0, s.id); } });
  valPorSetor = new Map();
  DB.validacoes.forEach(v => { if (!valPorSetor.has(v.setorId)) valPorSetor.set(v.setorId, []); valPorSetor.get(v.setorId).push(v); });
  atualizarBadgeVal();
}
const raizes = () => filhos.get('') || [];
const filhosDe = id => filhos.get(id) || [];
function descendentes(id, acc = new Set()){ filhosDe(id).forEach(k => { if (!acc.has(k.id)) { acc.add(k.id); descendentes(k.id, acc); } }); return acc; }
function caminho(id){ const r = []; let s = porId.get(id), g = 0; while (s && s.paiId && porId.has(s.paiId) && g++ < 60){ s = porId.get(s.paiId); r.unshift(s); } return r; }
function statusVal(id){
  const l = valPorSetor.get(id) || [];
  if (!l.length) return 'Sem validação';
  if (l.some(v => v.status === 'Reprovado')) return 'Reprovado';
  if (l.some(v => !v.status || v.status === 'Pendente')) return 'Pendente';
  if (l.some(v => v.status === 'Aprovado com ressalvas')) return 'Aprovado com ressalvas';
  return 'Aprovado';
}
const corTipo = t => (TIPOS[t] || TIPOS.Outro).cor;
const icTipo = t => (TIPOS[t] || TIPOS.Outro).ic;
function corArea(id){ const i = areas.indexOf(id); return i < 0 ? '#1e3a8a' : PALETA_AREA[i % PALETA_AREA.length]; }
function nomeCurto(s){ if (!s) return '—'; return s.sigla ? s.sigla : s.nome.replace(/^Gabinete do Secretário Adjunto (de |do )?/, 'SA ').replace(/^Gabinete do Secretário de Estado de Educação$/, 'Gabinete do Secretário'); }
function somaSub(id){
  const ids = [id, ...descendentes(id)]; const r = { servidores:0, comissionados:0, orcamento:0, custoMensal:0, setores:ids.length };
  ids.forEach(i => { const s = porId.get(i); if (!s || s.status === 'Extinto') return; ['servidores','comissionados','orcamento','custoMensal'].forEach(k => r[k] += num(s[k])); });
  return r;
}

/* ===================== PERSISTÊNCIA LOCAL ===================== */
let tLocal;
function salvarLocal(){ clearTimeout(tLocal); tLocal = setTimeout(() => store.set('gaborg_db', Object.assign({}, DB, { setores:setoresOficiais() })), 400); }
const salvarAbertos = () => { store.set('gaborg_abertos', [...abertos]); };

/* ===================== NUVEM (APPS SCRIPT) ===================== */
let fila = store.get('gaborg_fila', []);
let enviando = false, tFila, versaoNuvem = '', ultimoErro = '';
const online = () => cfg.modo === 'nuvem' && !!cfg.url && !!cfg.token;

async function chamar(body, ms = 45000){
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(cfg.url, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body:JSON.stringify(Object.assign({ token:cfg.token }, body)), redirect:'follow', signal:ctrl.signal });
    const txt = await r.text();
    if (txt.trim().startsWith('<')) throw new Error('O Google devolveu uma página de login. Publique o Apps Script com acesso "Qualquer pessoa".');
    const j = JSON.parse(txt);
    if (j.code === 'AUTH' && body.action !== 'login') sessaoEncerrada(j.message);
    else if (j.code === 'TROCAR_SENHA') setTimeout(() => modalTrocarSenha(true), 0);
    return j;
  } catch (e) { if (e.name === 'AbortError') throw new Error('A planilha demorou demais para responder.'); throw e; }
  finally { clearTimeout(t); }
}
async function lerNuvem(){
  const r = await chamar({ action:'read' }, 60000);
  const voltar = cenSwap; if (cenSwap) desaplicarCenario();
  if (r.status !== 'success') throw new Error(r.message || 'Falha ao ler a planilha.');
  if (r.usuario) aplicarUsuario(r.usuario);
  const d = r.dados || {};
  TABS_DB.forEach(t => { DB[t] = (d[t] || []).map(x => novoReg(t, x)); });
  versaoNuvem = String(r.versao || ''); backendVersao = String(r.backend || '');
  aplicarFilaNaMemoria();
  indexar(); salvarLocal();
  if (voltar && cenMapa) aplicarCenario();
}
function enfileirar(table, record, del){
  if (table === 'setores' && cenSwap) return salvarOverride(record, del);
  salvarLocal();
  if (!online()) return statusSync();
  fila.push({ op: del ? 'delete' : 'upsert', table, record: del ? { id:record.id } : Object.assign({}, record) });
  store.set('gaborg_fila', fila);
  clearTimeout(tFila); tFila = setTimeout(enviarFila, 700); statusSync();
}
function compactar(ops){
  const ult = new Map(); ops.forEach((o, i) => ult.set(o.table + '|' + o.record.id, i));
  return ops.filter((o, i) => ult.get(o.table + '|' + o.record.id) === i);
}
async function enviarFila(){
  if (enviando || !fila.length || !online()) return;
  enviando = true; statusSync();
  const n = Math.min(fila.length, 500);
  try {
    const r = await chamar({ action:'batch', ops:compactar(fila.slice(0, n)) });
    if (r.status !== 'success') throw new Error(r.message || 'A planilha recusou a gravação.');
    fila.splice(0, n); store.set('gaborg_fila', fila);
    if (r.versao) versaoNuvem = String(r.versao);
    ultimoErro = '';
  } catch (e) {
    ultimoErro = e.message || 'Sem conexão';
    setTimeout(enviarFila, 10000);
  }
  enviando = false; statusSync();
  if (fila.length && !ultimoErro) setTimeout(enviarFila, 200);
}
function aplicarFilaNaMemoria(){
  fila.forEach(o => {
    const l = DB[o.table]; if (!l) return;
    const i = l.findIndex(x => x.id === o.record.id);
    if (o.op === 'delete') { if (i >= 0) l.splice(i, 1); }
    else if (i >= 0) l[i] = Object.assign(l[i], o.record); else l.push(novoReg(o.table, o.record));
  });
}
function statusSync(){
  const el = $('#sync'); if (!el) return;
  let c, t;
  if (!online()) { c = 'local'; t = 'Desconectado'; }
  else if (ultimoErro) { c = 'erro'; t = 'Sem gravar: ' + ultimoErro; }
  else if (enviando || fila.length) { c = 'env'; t = `Enviando ${fila.length} alteração(ões)...`; }
  else { c = 'ok'; t = 'Planilha sincronizada'; }
  el.className = 'sync ' + c; el.querySelector('span').textContent = t; el.title = t;
}
// Alterações de outras pessoas: confere a versão a cada 20 s
setInterval(async () => {
  if (!online() || document.hidden || fila.length || enviando) return;
  try {
    const r = await chamar({ action:'version' }, 15000);
    if (r.status === 'success' && r.versao && String(r.versao) !== versaoNuvem && !document.querySelector('#painel :focus')) {
      await lerNuvem(); redesenharTudo(); toast('Estrutura atualizada com alterações de outra pessoa.');
    }
  } catch (e) {}
}, 20000);
window.addEventListener('beforeunload', e => { if (fila.length) { e.preventDefault(); e.returnValue = ''; } });

/* ===================== HISTÓRICO E ALTERAÇÕES ===================== */
function registrar(setorId, acao){
  if (cenSwap) return; // edições numa proposta não entram no histórico oficial
  const h = novoReg('historico', { id:novoId('h'), setorId, data:agora(), usuario:cfg.usuario || 'Usuário', acao });
  DB.historico.unshift(h); if (DB.historico.length > 3000) DB.historico.length = 3000;
  enfileirar('historico', h);
}
const ROTULOS = { quantidade:'Unidades representadas', nome:'Nome', sigla:'Sigla', tipo:'Tipo', paiId:'Setor superior', status:'Situação', responsavel:'Responsável', contato:'Contato', competencias:'Competências', entregas:'Entregas', orcamento:'Orçamento anual', custoMensal:'Custo mensal', servidores:'Servidores', comissionados:'Cargos comissionados', impacto:'Impacto', impactoDescricao:'Descrição do impacto', positivos:'Pontos positivos', negativos:'Pontos negativos', layout:'Disposição dos subordinados', colunas:'Colunas', ordem:'Ordem' };
const ESTRUTURAIS = ['paiId','layout','colunas','ordem','nome','tipo','status','dx','dy'];
function alterar(s, campo, valor, silencioso){
  valor = String(valor ?? '');
  if (s[campo] === valor) return;
  const antes = s[campo]; s[campo] = valor;
  s.atualizadoEm = agora(); s.atualizadoPor = cfg.usuario || '';
  enfileirar('setores', s);
  if (!silencioso && ROTULOS[campo]) {
    let txt = ROTULOS[campo] + ' alterado';
    if (campo === 'paiId') txt = `Subordinado a ${porId.get(valor) ? porId.get(valor).nome : '(raiz)'}`;
    else if (['nome','sigla','tipo','status','responsavel','impacto','servidores','comissionados','orcamento','custoMensal'].includes(campo)) txt += `: ${antes || '—'} → ${valor || '—'}`;
    registrar(s.id, txt);
  }
  if (ESTRUTURAIS.includes(campo) || campo === 'impacto') indexar();
  atualizarVistaAtual();
}

/* ===================== LAYOUT DO MAPA ===================== */
let caixas = new Map(), modos = new Map(), pos = new Map(), visiveis = [], origemRaiz = new Map();
const temFilhos = id => filhosDe(id).length > 0;
const filhosVis = id => abertos.has(id) ? filhosDe(id) : [];
function modoDe(s, d){ return s.layout === 'h' || s.layout === 'v' ? s.layout : (d === 0 ? 'h' : 'v'); }
function medir(s, d){
  const ks = d > 40 ? [] : filhosVis(s.id), m = modoDe(s, d); modos.set(s.id, m);
  const b = { w:NW, h:NH, nx:0, rel:new Map() };
  if (ks.length) {
    ks.forEach(k => medir(k, d + 1));
    if (m === 'v') {
      let y = NH + GV + 6, w = NW;
      ks.forEach(k => { const c = caixas.get(k.id); b.rel.set(k.id, { x:IND, y }); y += c.h + GV + (abertos.has(k.id) && temFilhos(k.id) ? 6 : 0); w = Math.max(w, IND + c.w); });
      b.w = w; b.h = y - GV;
    } else {
      const folhas = ks.filter(k => !temFilhos(k.id)), ramos = ks.filter(k => temFilhos(k.id));
      const cf = Math.min(folhas.length, s.layout === 'h' && num(s.colunas) && !ramos.length ? num(s.colunas) : 4) || 1;
      const gw = folhas.length ? cf * NW + (cf - 1) * GX : 0;
      const maxC = Math.max(1, num(s.colunas) || 6);
      const linhas = []; for (let i = 0; i < ramos.length; i += maxC) linhas.push(ramos.slice(i, i + maxC));
      const lw = linhas.map(l => l.reduce((a, k) => a + caixas.get(k.id).w, 0) + (l.length - 1) * GX);
      b.w = Math.max(NW, gw, ...lw); b.nx = (b.w - NW) / 2;
      let y = NH + GY;
      if (folhas.length) {
        const x0 = (b.w - gw) / 2;
        folhas.forEach((k, i) => b.rel.set(k.id, { x:x0 + (i % cf) * (NW + GX) - caixas.get(k.id).nx, y:y + Math.floor(i / cf) * (NH + GV + 8) }));
        y += Math.ceil(folhas.length / cf) * (NH + GV + 8) - GV - 8 + GY;
      }
      linhas.forEach((l, i) => { let x = (b.w - lw[i]) / 2, hm = 0; l.forEach(k => { const c = caixas.get(k.id); b.rel.set(k.id, { x, y }); x += c.w + GX; hm = Math.max(hm, c.h); }); y += hm + GY + 10; });
      b.h = y - GY - 10;
    }
  }
  caixas.set(s.id, b); return b;
}
function posicionar(s, ox, oy){
  const b = caixas.get(s.id), dx = num(s.dx), dy = num(s.dy);
  pos.set(s.id, { x:ox + b.nx + dx, y:oy + dy }); visiveis.push(s);
  b.rel.forEach((r, kid) => posicionar(porId.get(kid), ox + dx + r.x, oy + dy + r.y));
}
function calcularLayout(){
  caixas = new Map(); modos = new Map(); origemRaiz = new Map();
  let x = 0;
  raizes().forEach(r => { medir(r, 0); origemRaiz.set(r.id, x); x += caixas.get(r.id).w + 140; });
  reposicionar();
}
function reposicionar(){
  pos = new Map(); visiveis = [];
  raizes().forEach(r => posicionar(r, origemRaiz.get(r.id) || 0, 0));
}

/* ===================== DESENHO DO MAPA ===================== */
let view = store.get('gaborg_view', { x:60, y:90, k:.8 });
const elNo = new Map();
function corDe(s){
  const m = $('#m-cor').value;
  if (m === 'area') return corArea(areaDe.get(s.id));
  if (m === 'validacao') return STATUS_VAL[statusVal(s.id)];
  if (m === 'impacto') return IMPACTO[num(s.impacto)] ? IMPACTO[num(s.impacto)][1] : IMPACTO[0][1];
  if (m === 'status') return STATUS_SETOR[s.status] || '#64748b';
  return corTipo(s.tipo);
}
function cardHTML(s){
  const p = pos.get(s.id), n = filhosDe(s.id).length, ab = abertos.has(s.id);
  const estilo = $('#m-cor').value === 'tipo' ? ((TIPOS[s.tipo] || {}).estilo || '') : (prof.get(s.id) === 0 ? 'cheio' : '');
  const sv = statusVal(s.id), imp = num(s.impacto);
  const ser = num(s.servidores);
  const mk = s._marcas && s._marcas.length ? [...new Set(s._marcas)] : [], qt = num(s.quantidade);
  return `<div class="no ${qt ? 'grupo' : ''} ${estilo} ${s.status === 'Extinto' ? 'extinto' : ''} ${modos.get(s.id) === 'v' ? 'v-mode' : ''} ${s.id === selId ? 'sel' : ''} ${multi.has(s.id) ? 'msel' : ''} ${mk.length ? 'cen-m cen-' + mk[0] : ''}" data-id="${esc(s.id)}" style="--c:${corDe(s)};--d:${Math.min(prof.get(s.id) || 0, 8)};transform:translate(${p.x}px,${p.y}px)" title="${esc(s.nome)}">
    <div class="no-tipo"><i class="fa-solid ${icTipo(s.tipo)}"></i>${esc(s.tipo)}${s.sigla ? ' · ' + esc(s.sigla) : ''}</div>
    <div class="no-nome">${esc(s.nome)}</div>
    ${qt ? `<span class="no-qt" title="${fmtN(qt)} ${rotuloUnid(s)} representadas neste cartão"><b>${fmtN(qt)}</b>${rotuloUnid(s)}</span>` : ''}
    <div class="no-pe"><span class="r">${qt ? '' : s.responsavel ? '<i class="fa-solid fa-user"></i> ' + esc(s.responsavel) : 'Sem responsável'}</span>${ser ? `<span><i class="fa-solid fa-users"></i> ${fmtN(ser)}</span>` : ''}${imp ? `<span class="p" style="background:${IMPACTO[imp][1]}" title="Impacto: ${IMPACTO[imp][0]}"></span>` : ''}${sv !== 'Sem validação' ? `<span class="p" style="background:${STATUS_VAL[sv]};border-radius:2px" title="Validação: ${sv}"></span>` : ''}</div>
    ${mk.length ? `<span class="cen-tags">${marcasHTML(s)}</span>` : ''}
    ${n ? `<button class="no-exp ${ab ? 'aberto' : ''}" data-exp title="${ab ? 'Recolher' : 'Mostrar'} ${n} subordinado(s)">${ab ? '<i class="fa-solid fa-minus"></i>' : n}</button>` : ''}
  </div>`;
}
function desenharMapa(){
  if (vistaAtual !== 'mapa') return;
  preencherCenarios();
  if (cenSwap) remarcarCenario();
  desenharMapaBase();
}
let primeiroDesenho = true;
function desenharMapaBase(){
  if (typeof terminarAnimMapa === 'function') terminarAnimMapa();
  const antes = new Map(pos), elsAntigos = new Map(elNo);
  calcularLayout();
  $('#nos').innerHTML = visiveis.map(cardHTML).join('');
  elNo.clear(); document.querySelectorAll('#nos .no').forEach(el => elNo.set(el.dataset.id, el));
  if (primeiroDesenho && typeof semMovimento === 'function' && !semMovimento()) { $('#nos').classList.add('entrando'); setTimeout(() => $('#nos').classList.remove('entrando'), 1400); }
  desenharArestas(); aplicarView(); desenharLegenda(); desenharMini(); atualizarBarraSel();
  if (!primeiroDesenho && typeof animarLayout === 'function') animarLayout(antes, elsAntigos);
  primeiroDesenho = false;
}
function caminhoAresta(p, c){
  const a = pos.get(p.id), b = pos.get(c.id);
  if (modos.get(p.id) === 'v') {
    const x1 = a.x + 16, y1 = a.y + NH, y2 = b.y + NH / 2, r = Math.min(10, Math.abs(y2 - y1) / 2);
    return `M${x1},${y1} V${y2 - r} Q${x1},${y2} ${x1 + r},${y2} H${b.x}`;
  }
  const x1 = a.x + NW / 2, y1 = a.y + NH, x2 = b.x + NW / 2, y2 = b.y, k = Math.max(26, Math.abs(y2 - y1) / 2);
  return `M${x1},${y1} C${x1},${y1 + k} ${x2},${y2 - k} ${x2},${y2}`;
}
function desenharArestas(){
  if (cenMapa && !desenharArestas.dentro) { desenharArestas.dentro = true; try { return emCenario(desenharArestas); } finally { desenharArestas.dentro = false; } }
  const ativos = new Set(selId ? [selId, ...caminho(selId).map(s => s.id)] : []);
  let h = '';
  visiveis.forEach(s => { filhosVis(s.id).forEach(k => { if (pos.has(k.id)) h += `<path d="${caminhoAresta(s, k)}" data-p="${esc(s.id)}" data-f="${esc(k.id)}" class="${ativos.has(k.id) ? 'ativa' : ''}${focoId && vpEl.classList.contains('focando') && elNo.get(k.id)?.classList.contains('rel') && elNo.get(s.id)?.classList.contains('rel') ? ' rel' : ''}"/>`; }); });
  DB.vinculos.forEach(v => {
    const a = pos.get(v.origemId), b = pos.get(v.destinoId); if (!a || !b) return;
    const x1 = a.x + NW / 2, y1 = a.y + NH / 2, x2 = b.x + NW / 2, y2 = b.y + NH / 2, my = Math.min(y1, y2) - 80;
    h += `<path d="M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}" class="vin ${v.origemId === selId || v.destinoId === selId ? 'ativa' : ''}"><title>${esc(v.tipo)}</title></path>`;
  });
  if (cenMapa) visiveis.forEach(s => { if (s._paiOrig && pos.has(s._paiOrig) && pos.has(s.id)) { const a = pos.get(s._paiOrig), b = pos.get(s.id); h += `<path d="M${a.x + NW / 2},${a.y + NH} C${a.x + NW / 2},${a.y + NH + 60} ${b.x + NW / 2},${b.y - 60} ${b.x + NW / 2},${b.y}" class="orig"><title>Subordinação anterior</title></path>`; } });
  $('#arestas').innerHTML = h;
}
function aplicarView(anim){
  const m = $('#mundo');
  if (anim) { m.classList.add('anim'); setTimeout(() => m.classList.remove('anim'), 480); }
  m.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.k})`;
  const vp = $('#vp'); const g = 22 * view.k;
  vp.style.backgroundSize = `${g}px ${g}px`; vp.style.backgroundPosition = `${view.x}px ${view.y}px`;
  $('#m-zv').textContent = Math.round(view.k * 100) + '%';
  store.set('gaborg_view', view);
  desenharMiniVisor();
}
function limites(){
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  pos.forEach(p => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + NW); y1 = Math.max(y1, p.y + NH); });
  return isFinite(x0) ? { x0, y0, x1, y1 } : { x0:0, y0:0, x1:NW, y1:NH };
}
function ajustar(anim){
  const vp = $('#vp').getBoundingClientRect(), L = limites();
  const k = Math.max(.12, Math.min(1.1, Math.min((vp.width - 80) / (L.x1 - L.x0), (vp.height - 170) / (L.y1 - L.y0))));
  view = { k, x:(vp.width - (L.x1 - L.x0) * k) / 2 - L.x0 * k, y:90 - L.y0 * k + Math.max(0, (vp.height - 170 - (L.y1 - L.y0) * k) / 2) };
  if (vp.width < 820 && k < .42) {
    // celular: em vez de miniaturizar tudo, mostra o topo da estrutura legível, centrado na raiz
    const r = raizes()[0], p = r && pos.get(r.id), kk = .42;
    view = { k:kk, x:vp.width / 2 - ((p ? p.x : L.x0) + NW / 2) * kk, y:130 - L.y0 * kk };
  }
  aplicarView(anim);
}
function zoomPor(f, cx, cy){
  const vp = $('#vp').getBoundingClientRect();
  if (cx === undefined) { cx = vp.width / 2; cy = vp.height / 2; }
  const k = Math.max(.1, Math.min(2.5, view.k * f)); const r = k / view.k;
  view = { k, x:cx - (cx - view.x) * r, y:cy - (cy - view.y) * r }; aplicarView();
}
function centralizar(id, anim){
  const p = pos.get(id); if (!p) return;
  const vp = $('#vp').getBoundingClientRect(), pn = $('#painel').classList.contains('aberto') && window.innerWidth > 820 ? 460 : 0;
  const k = Math.max(view.k, .75);
  view = { k, x:(vp.width - pn) / 2 - (p.x + NW / 2) * k, y:vp.height / 2.6 - (p.y + NH / 2) * k };
  aplicarView(anim !== false);
}
function desenharLegenda(){
  const m = $('#m-cor').value; let it = [];
  if (m === 'tipo') { const usados = new Set(DB.setores.map(s => s.tipo)); it = Object.keys(TIPOS).filter(t => usados.has(t)).map(t => [t, TIPOS[t].cor]); }
  else if (m === 'area') it = areas.map(a => [nomeCurto(porId.get(a)), corArea(a)]);
  else if (m === 'validacao') it = Object.entries(STATUS_VAL);
  else if (m === 'impacto') it = IMPACTO.map(x => [x[0], x[1]]);
  else it = Object.entries(STATUS_SETOR);
  if (cenMapa) it = Object.values(ROT_MARCA).map(([n, c]) => [n + ' (proposta)', c]).concat(it);
  $('#m-leg').innerHTML = `<button class="leg-x" onclick="alternarMapaUI('leg')" title="Esconder a legenda (L)"><i class="fa-solid fa-xmark"></i></button>` + it.map(([n, c]) => `<span><i class="q" style="background:${c}"></i>${esc(n)}</span>`).join('')
    + `<span class="dica"><i class="fa-solid fa-hand"></i> Arraste o fundo para navegar · roda do mouse para zoom · arraste um setor para reposicionar (encaixa nas guias; <b>Alt</b> solta livre) · <b>Ctrl</b> + clique seleciona vários · <b>Ctrl</b> + arrastar o fundo seleciona uma área · setas movem a seleção · <b>Shift</b> + arrastar sobre outro setor para subordinar · duplo clique abre/fecha</span>`;
}
/* Minimapa */
function desenharMini(){
  if (cenMapa && !desenharMini.dentro) { desenharMini.dentro = true; try { return emCenario(desenharMini); } finally { desenharMini.dentro = false; } }
  const c = $('#mini'); if (!c || !c.offsetWidth) return;
  const W = c.width = c.offsetWidth * 2, H = c.height = c.offsetHeight * 2, L = limites();
  const s = Math.min((W - 16) / (L.x1 - L.x0), (H - 16) / (L.y1 - L.y0));
  c._esc = { s, ox:8 - L.x0 * s + ((W - 16) - (L.x1 - L.x0) * s) / 2, oy:8 - L.y0 * s + ((H - 16) - (L.y1 - L.y0) * s) / 2 };
  const g = c.getContext('2d'); g.clearRect(0, 0, W, H);
  visiveis.forEach(n => { const p = pos.get(n.id); g.fillStyle = corDe(n); g.fillRect(c._esc.ox + p.x * s, c._esc.oy + p.y * s, Math.max(2, NW * s), Math.max(2, NH * s)); });
  c._base = g.getImageData(0, 0, W, H); desenharMiniVisor();
}
function desenharMiniVisor(){
  const c = $('#mini'); if (!c || !c._base) return;
  const g = c.getContext('2d'); g.putImageData(c._base, 0, 0);
  const vp = $('#vp').getBoundingClientRect(), e = c._esc;
  const x = e.ox + (-view.x / view.k) * e.s, y = e.oy + (-view.y / view.k) * e.s, w = vp.width / view.k * e.s, h = vp.height / view.k * e.s;
  g.strokeStyle = '#2563eb'; g.lineWidth = 3; g.fillStyle = 'rgba(37,99,235,.08)'; g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h);
}
$('#m-mini').addEventListener('pointerdown', e => {
  const c = $('#mini'), r = c.getBoundingClientRect(), es = c._esc; if (!es) return;
  const mx = (e.clientX - r.left) * 2, my = (e.clientY - r.top) * 2;
  const wx = (mx - es.ox) / es.s, wy = (my - es.oy) / es.s, vp = $('#vp').getBoundingClientRect();
  view.x = vp.width / 2 - wx * view.k; view.y = vp.height / 2 - wy * view.k; aplicarView(true);
});

/* Interação: arrastar, pan, zoom, pinça, seleção múltipla */
let drag = null; const ponteiros = new Map(); let pinca = null;
const vpEl = $('#vp');
let multi = new Set(), modoSel = false;
const SNAP = 8; // px de tela para encaixar nas guias
function aditivo(e){ return modoSel || e.ctrlKey || e.metaKey; }
// Quando um superior e um subordinado estão selecionados, só o superior é movido (o ramo o acompanha)
function raizesDoConjunto(ids){ const set = new Set(ids); return [...set].filter(id => porId.has(id) && !caminho(id).some(a => set.has(a.id))); }
function aParaMundo(cx, cy){ const r = vpEl.getBoundingClientRect(); return { x:(cx - r.left - view.x) / view.k, y:(cy - r.top - view.y) / view.k }; }
vpEl.addEventListener('pointerdown', e => {
  if (e.button === 2 || e.target.closest('[data-exp]')) return;
  ponteiros.set(e.pointerId, { x:e.clientX, y:e.clientY });
  if (ponteiros.size === 2) { const [a, b] = [...ponteiros.values()]; pinca = { d:Math.hypot(a.x - b.x, a.y - b.y), k:view.k }; drag = null; $('#laco').classList.add('hidden'); return; }
  const no = e.target.closest('.no');
  if (no) {
    const s = porId.get(no.dataset.id) || { id:no.dataset.id, dx:'', dy:'' };
    drag = { tipo:'no', s, x0:e.clientX, y0:e.clientY, moveu:false, alvo:null, adit:aditivo(e) };
  } else if (aditivo(e) && !somenteLeitura()) {
    drag = { tipo:'laco', x0:e.clientX, y0:e.clientY, base:new Set(multi), moveu:false };
  } else { drag = { tipo:'pan', x0:e.clientX, y0:e.clientY, vx:view.x, vy:view.y, moveu:false }; vpEl.classList.add('pan'); }
  vpEl.setPointerCapture(e.pointerId);
});
function iniciarArrasto(){
  // grupo: a seleção múltipla (se o setor arrastado faz parte dela) ou só o setor
  let ids = multi.size > 1 && multi.has(drag.s.id) ? raizesDoConjunto(multi) : [drag.s.id];
  if (!multi.has(drag.s.id) && multi.size) { limparMulti(true); }
  drag.grupo = ids.map(id => { const s = porId.get(id); return { s, dx0:num(s.dx), dy0:num(s.dy) }; });
  guardarPos(drag.grupo.map(g => g.s));
  drag.desc = new Set(); drag.grupo.forEach(g => { drag.desc.add(g.s.id); descendentes(g.s.id, drag.desc); });
  drag.grupo.forEach(g => elNo.get(g.s.id)?.classList.add('arrastando'));
  // referências para as guias: setores visíveis que não se movem
  drag.refs = visiveis.filter(n => !drag.desc.has(n.id)).map(n => pos.get(n.id));
}
function encaixe(p){
  const lim = SNAP / view.k; let bx = null, by = null, gx = null, gy = null;
  drag.refs.forEach(o => {
    const mesmaLinha = Math.abs(o.y - p.y) < NH * 1.5, mesmaColuna = Math.abs(o.x - p.x) < NW * 1.2;
    // alinhamento direto
    [[o.x, o.x], ...(mesmaLinha ? [[o.x + NW + GX, null], [o.x - NW - GX, null]] : [])].forEach(([cx, linha]) => {
      const d = cx - p.x; if (Math.abs(d) <= lim && (bx === null || Math.abs(d) < Math.abs(bx))) { bx = d; gx = linha === null ? null : cx; }
    });
    [[o.y, o.y], ...(mesmaColuna ? [[o.y + NH + GV, null], [o.y - NH - GV, null]] : [])].forEach(([cy, linha]) => {
      const d = cy - p.y; if (Math.abs(d) <= lim && (by === null || Math.abs(d) < Math.abs(by))) { by = d; gy = linha === null ? null : cy; }
    });
  });
  return { dx:bx || 0, dy:by || 0, gx, gy };
}
function desenharGuias(g, p){
  const el = $('#guias'); if (!g) { el.innerHTML = ''; return; }
  const L = limites(); let s = '';
  if (g.gx !== null) s += `<line x1="${g.gx}" y1="${L.y0 - 200}" x2="${g.gx}" y2="${L.y1 + 200}"/>`;
  if (g.gy !== null) s += `<line x1="${L.x0 - 200}" y1="${g.gy}" x2="${L.x1 + 200}" y2="${g.gy}"/>`;
  el.innerHTML = s;
}
function moverVisual(){
  reposicionar();
  visiveis.forEach(n => { const el = elNo.get(n.id), p = pos.get(n.id); if (el) el.style.transform = `translate(${p.x}px,${p.y}px)`; });
  desenharArestas();
}
vpEl.addEventListener('pointermove', e => {
  if (ponteiros.has(e.pointerId)) ponteiros.set(e.pointerId, { x:e.clientX, y:e.clientY });
  if (pinca && ponteiros.size === 2) {
    const [a, b] = [...ponteiros.values()], d = Math.hypot(a.x - b.x, a.y - b.y), r = vpEl.getBoundingClientRect();
    zoomPor((pinca.k * d / pinca.d) / view.k, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); return;
  }
  if (!drag) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (!drag.moveu && Math.hypot(dx, dy) < 5) return;
  if (drag.tipo === 'pan') { drag.moveu = true; view.x = drag.vx + dx; view.y = drag.vy + dy; aplicarView(); return; }
  if (drag.tipo === 'laco') {
    drag.moveu = true;
    const r = vpEl.getBoundingClientRect(), lc = $('#laco');
    const x = Math.min(e.clientX, drag.x0) - r.left, y = Math.min(e.clientY, drag.y0) - r.top;
    Object.assign(lc.style, { left:x + 'px', top:y + 'px', width:Math.abs(dx) + 'px', height:Math.abs(dy) + 'px' }); lc.classList.remove('hidden');
    const a = aParaMundo(drag.x0, drag.y0), b = aParaMundo(e.clientX, e.clientY);
    const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
    multi = new Set(drag.base);
    visiveis.forEach(n => { const p = pos.get(n.id); if (p.x < x1 && p.x + NW > x0 && p.y < y1 && p.y + NH > y0) multi.add(n.id); });
    elNo.forEach((el, id) => el.classList.toggle('msel', multi.has(id)));
    atualizarBarraSel(); return;
  }
  if (somenteLeitura()) return;
  if (!drag.moveu) { drag.moveu = true; iniciarArrasto(); }
  const ox = dx / view.k, oy = dy / view.k;
  drag.grupo.forEach(g => { g.s.dx = String(Math.round(g.dx0 + ox)); g.s.dy = String(Math.round(g.dy0 + oy)); });
  reposicionar();
  let gd = null;
  if (!e.altKey) {
    gd = encaixe(pos.get(drag.s.id));
    if (gd.dx || gd.dy) drag.grupo.forEach(g => { g.s.dx = String(Math.round(num(g.s.dx) + gd.dx)); g.s.dy = String(Math.round(num(g.s.dy) + gd.dy)); });
  }
  moverVisual(); desenharGuias(gd);
  if (drag.alvo) { elNo.get(drag.alvo)?.classList.remove('alvo'); drag.alvo = null; }
  if (e.shiftKey) {
    const sob = document.elementsFromPoint(e.clientX, e.clientY).map(x => x.closest && x.closest('.no')).find(x => x && !drag.desc.has(x.dataset.id));
    if (sob) { drag.alvo = sob.dataset.id; sob.classList.add('alvo'); }
  }
});
function fimDrag(e){
  ponteiros.delete(e.pointerId); if (ponteiros.size < 2) pinca = null;
  vpEl.classList.remove('pan');
  if (!drag) return;
  const d = drag; drag = null;
  desenharGuias(null);
  if (d.tipo === 'laco') { $('#laco').classList.add('hidden'); atualizarBarraSel(); if (d.moveu && multi.size) toast(`${multi.size} setor(es) selecionado(s).`); return; }
  if (d.tipo === 'pan') { if (!d.moveu && multi.size && !modoSel) limparMulti(); return; }
  if (!d.moveu) {
    if (d.adit && !somenteLeitura()) alternarMulti(d.s.id);
    else { if (multi.size) limparMulti(true); selecionar(d.s.id); }
    return;
  }
  d.grupo.forEach(g => elNo.get(g.s.id)?.classList.remove('arrastando'));
  if (d.alvo) {
    const alvo = porId.get(d.alvo); elNo.get(d.alvo)?.classList.remove('alvo');
    abertos.add(alvo.id); salvarAbertos();
    let ord = Math.max(0, ...filhosDe(alvo.id).map(k => num(k.ordem)));
    d.grupo.forEach(g => { g.s.dx = ''; g.s.dy = ''; g.s.ordem = String(++ord); alterar(g.s, 'paiId', alvo.id); });
    desfazerPilha.pop(); // subordinação tem histórico próprio
    toast(d.grupo.length > 1 ? `${d.grupo.length} setores agora são subordinados a ${alvo.nome}.` : `${d.s.nome} agora é subordinado a ${alvo.nome}.`);
  } else {
    d.grupo.forEach(g => { g.s.atualizadoEm = agora(); enfileirar('setores', g.s); });
    desenharMini();
  }
}
vpEl.addEventListener('pointerup', fimDrag);
vpEl.addEventListener('pointercancel', fimDrag);

/* Seleção múltipla */
function alternarMulti(id){
  if (!multi.size && selId && selId !== id && pos.has(selId)) multi.add(selId);
  multi.has(id) ? multi.delete(id) : multi.add(id);
  elNo.forEach((el, k) => el.classList.toggle('msel', multi.has(k)));
  atualizarBarraSel();
}
function limparMulti(silencioso){
  multi.clear(); elNo.forEach(el => el.classList.remove('msel')); atualizarBarraSel();
}
function alternarModoSel(forcar){
  modoSel = forcar !== undefined ? forcar : !modoSel;
  $('#m-modosel')?.classList.toggle('on', modoSel); vpEl.classList.toggle('modo-sel', modoSel);
  if (modoSel) toast('Modo seleção: arraste no fundo para marcar uma área ou toque nos setores.');
}
function atualizarBarraSel(){
  const b = $('#m-sel'); if (!b) return;
  [...multi].forEach(id => { if (!porId.has(id)) multi.delete(id); });
  $('#ms-n').textContent = multi.size;
  b.classList.toggle('hidden', multi.size < 1);
  const inp = $('#ms-esp'); if (inp && !inp.value) inp.value = store.get('gaborg_espaco', GX);
}
function selecionarIrmaos(){
  const base = multi.size ? [...multi] : (selId ? [selId] : []);
  if (!base.length) return;
  base.forEach(id => { const s = porId.get(id); filhosDe(s ? s.paiId : '').forEach(k => { if (pos.has(k.id)) multi.add(k.id); }); });
  elNo.forEach((el, k) => el.classList.toggle('msel', multi.has(k))); atualizarBarraSel();
}

/* Desfazer movimentações */
let desfazerPilha = [];
function guardarPos(lista){
  desfazerPilha.push(lista.map(s => ({ id:s.id, dx:s.dx, dy:s.dy })));
  if (desfazerPilha.length > 60) desfazerPilha.shift();
}
function desfazerPos(){
  if (somenteLeitura()) return;
  const ult = desfazerPilha.pop(); if (!ult) return toast('Nada para desfazer.');
  ult.forEach(o => { const s = porId.get(o.id); if (!s) return; s.dx = o.dx; s.dy = o.dy; s.atualizadoEm = agora(); enfileirar('setores', s); });
  desenharMapa(); toast('Movimentação desfeita.');
}

/* Alinhar, distribuir e espaçar a seleção */
function alinharSel(modo){
  if (somenteLeitura()) return;
  const ids = [...multi].filter(id => pos.has(id));
  if (modo === 'auto') {
    if (!ids.length) return;
    guardarPos(ids.map(id => porId.get(id)));
    ids.forEach(id => { const s = porId.get(id); s.dx = ''; s.dy = ''; s.atualizadoEm = agora(); enfileirar('setores', s); });
    desenharMapa(); return toast('Posição automática restaurada.');
  }
  if (ids.length < 2) return toast('Selecione pelo menos 2 setores (Ctrl + clique).', 'aviso');
  if ((modo === 'distH' || modo === 'distV') && ids.length < 3) return toast('Para distribuir, selecione pelo menos 3 setores.', 'aviso');
  let esp = Math.max(0, Math.min(600, Number($('#ms-esp').value)));
  if (!isFinite(esp)) esp = GX;
  store.set('gaborg_espaco', esp);
  const P = new Map(ids.map(id => [id, Object.assign({}, pos.get(id))]));
  const ys = ids.map(id => P.get(id).y), xs = ids.map(id => P.get(id).x);
  const porX = [...ids].sort((a, b) => P.get(a).x - P.get(b).x || P.get(a).y - P.get(b).y);
  const porY = [...ids].sort((a, b) => P.get(a).y - P.get(b).y || P.get(a).x - P.get(b).x);
  const alvo = new Map();
  // Mesma linha/coluna: se algum ficaria por cima de outro, enfileira com o espaço escolhido
  const sobrepoe = (lista, eixo, tam) => lista.some((id, i) => i && P.get(id)[eixo] - P.get(lista[i - 1])[eixo] < tam);
  let ajustou = false;
  if (modo === 'linha') { if (sobrepoe(porX, 'x', NW)) { modo = 'filaH'; ajustou = true; } else { const y = Math.min(...ys); ids.forEach(id => alvo.set(id, { y })); } }
  if (modo === 'coluna') { if (sobrepoe(porY, 'y', NH)) { modo = 'filaV'; ajustou = true; } else { const x = Math.min(...xs); ids.forEach(id => alvo.set(id, { x })); } }
  if (modo === 'distH') { const a = P.get(porX[0]).x, b = P.get(porX[porX.length - 1]).x, st = (b - a) / (porX.length - 1); porX.forEach((id, i) => alvo.set(id, { x:a + i * st })); }
  if (modo === 'distV') { const a = P.get(porY[0]).y, b = P.get(porY[porY.length - 1]).y, st = (b - a) / (porY.length - 1); porY.forEach((id, i) => alvo.set(id, { y:a + i * st })); }
  if (modo === 'filaH') { const y = Math.min(...ys), x0 = P.get(porX[0]).x; porX.forEach((id, i) => alvo.set(id, { x:x0 + i * (NW + esp), y })); }
  if (modo === 'filaV') { const x = Math.min(...xs), y0 = P.get(porY[0]).y; porY.forEach((id, i) => alvo.set(id, { x, y:y0 + i * (NH + esp) })); }
  guardarPos(ids.map(id => porId.get(id)));
  // superiores primeiro: ao mover um superior o ramo dele vem junto, e o subordinado é corrigido depois
  [...ids].sort((a, b) => (prof.get(a) || 0) - (prof.get(b) || 0)).forEach(id => {
    reposicionar();
    const s = porId.get(id), p = pos.get(id), t = alvo.get(id); if (!t) return;
    if (t.x !== undefined) s.dx = String(Math.round(num(s.dx) + t.x - p.x));
    if (t.y !== undefined) s.dy = String(Math.round(num(s.dy) + t.y - p.y));
  });
  ids.forEach(id => { const s = porId.get(id); s.atualizadoEm = agora(); enfileirar('setores', s); });
  desenharMapa();
  if (ajustou) return toast(`Alinhados e espaçados em ${esp} px para nenhum setor ficar por cima de outro.`);
  toast({ linha:'Alinhados na mesma linha.', coluna:'Alinhados na mesma coluna.', distH:'Distribuídos com espaço igual na horizontal.', distV:'Distribuídos com espaço igual na vertical.', filaH:`Em linha, com ${esp} px entre eles.`, filaV:`Em coluna, com ${esp} px entre eles.` }[modo]);
}

/* Teclado no mapa: setas movem a seleção (Shift = 10 px), Ctrl+Z desfaz, Esc limpa */
let ultimaSeta = 0;
document.addEventListener('keydown', e => {
  if (vistaAtual !== 'mapa' || document.querySelector('.modal') || !$('#tv-modo').classList.contains('hidden') || e.target.closest('input,textarea,select,[contenteditable]')) return;
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); desfazerPos(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && !somenteLeitura()) { e.preventDefault(); visiveis.forEach(n => multi.add(n.id)); elNo.forEach((el, k) => el.classList.toggle('msel', multi.has(k))); atualizarBarraSel(); return; }
  if (e.key === 'Escape' && (multi.size || modoSel)) { limparMulti(); alternarModoSel(false); e.stopImmediatePropagation(); return; }
  const dir = { ArrowLeft:[-1, 0], ArrowRight:[1, 0], ArrowUp:[0, -1], ArrowDown:[0, 1] }[e.key];
  if (!dir || somenteLeitura()) return;
  const ids = multi.size ? raizesDoConjunto(multi) : (selId && pos.has(selId) ? [selId] : []);
  if (!ids.length) return;
  e.preventDefault();
  const passo = e.shiftKey ? 10 : 1, lista = ids.map(id => porId.get(id));
  if (Date.now() - ultimaSeta > 900) guardarPos(lista);
  ultimaSeta = Date.now();
  lista.forEach(s => { s.dx = String(num(s.dx) + dir[0] * passo); s.dy = String(num(s.dy) + dir[1] * passo); s.atualizadoEm = agora(); enfileirar('setores', s); });
  moverVisual();
}, true);
vpEl.addEventListener('wheel', e => { e.preventDefault(); const r = vpEl.getBoundingClientRect(); zoomPor(Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0015)), e.clientX - r.left, e.clientY - r.top); }, { passive:false });
vpEl.addEventListener('click', e => { const b = e.target.closest('[data-exp]'); if (b) alternarAberto(b.closest('.no').dataset.id); });
vpEl.addEventListener('dblclick', e => { const no = e.target.closest('.no'); if (no && temFilhos(no.dataset.id)) alternarAberto(no.dataset.id); });
function alternarAberto(id, forcar){
  const abrir = forcar !== undefined ? forcar : !abertos.has(id);
  abrir ? abertos.add(id) : abertos.delete(id); salvarAbertos(); desenharMapa();
}
function expandirNivel(){
  const prox = visiveis.filter(s => temFilhos(s.id) && !abertos.has(s.id));
  if (!prox.length) return toast('Tudo já está aberto.');
  prox.forEach(s => abertos.add(s.id)); salvarAbertos(); desenharMapa(); ajustar(true);
}
function recolherTudo(){ abertos = new Set(raizes().map(r => r.id)); salvarAbertos(); desenharMapa(); ajustar(true); }
async function reorganizar(){
  const mexidos = DB.setores.filter(s => s.dx || s.dy);
  if (!mexidos.length) { ajustar(true); return toast('O mapa já está na disposição automática.'); }
  if (!await confirmar('Reorganizar o mapa', `${mexidos.length} setor(es) foram movidos manualmente. Voltar todos para a disposição automática?`, 'Reorganizar')) return;
  guardarPos(mexidos);
  mexidos.forEach(s => { s.dx = ''; s.dy = ''; enfileirar('setores', s); });
  desenharMapa(); ajustar(true);
}

/* Busca no mapa */
let resIdx = 0;
$('#m-busca').addEventListener('input', () => { resIdx = 0; renderBusca(); });
$('#m-busca').addEventListener('keydown', e => {
  const bs = [...document.querySelectorAll('#m-res button')]; if (!bs.length) return;
  if (e.key === 'ArrowDown') { resIdx = Math.min(bs.length - 1, resIdx + 1); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { resIdx = Math.max(0, resIdx - 1); e.preventDefault(); }
  else if (e.key === 'Enter') { bs[resIdx].click(); return; }
  else if (e.key === 'Escape') { $('#m-res').classList.add('hidden'); return; }
  bs.forEach((b, i) => b.classList.toggle('on', i === resIdx));
});
document.addEventListener('pointerdown', e => { if (!e.target.closest('.m-busca')) $('#m-res').classList.add('hidden'); });
function renderBusca(){
  const q = norm($('#m-busca').value), box = $('#m-res');
  if (!q) { box.classList.add('hidden'); return; }
  const r = DB.setores.filter(s => norm(s.nome + ' ' + s.sigla + ' ' + s.responsavel).includes(q)).slice(0, 12);
  box.innerHTML = r.length ? r.map((s, i) => `<button class="${i === resIdx ? 'on' : ''}" onclick="irPara(${arg(s.id)})"><span class="ic" style="color:${corTipo(s.tipo)}"><i class="fa-solid ${icTipo(s.tipo)}"></i></span><span style="min-width:0"><span class="t">${esc(s.nome)}</span><br><span class="s">${esc(caminho(s.id).map(nomeCurto).join(' › ') || 'Raiz')}</span></span></button>`).join('') : '<div class="vazio">Nenhum setor encontrado.</div>';
  box.classList.remove('hidden');
}
function irPara(id){
  $('#m-res').classList.add('hidden'); $('#m-busca').value = '';
  if (vistaAtual !== 'mapa') trocarVista('mapa');
  caminho(id).forEach(a => abertos.add(a.id)); salvarAbertos();
  selId = id; desenharMapa(); renderPainel(); setTimeout(() => { centralizar(id); setTimeout(() => pulsar(id), 380); }, 30);
}

/* ===================== SELEÇÃO E PAINEL LATERAL ===================== */
function selecionar(id){
  selId = id;
  document.querySelectorAll('#nos .no.sel').forEach(x => x.classList.remove('sel'));
  elNo.get(id)?.classList.add('sel');
  if (vistaAtual === 'mapa') { desenharArestas(); pulsar(id); }
  if (vistaAtual === 'lista') renderLista();
  renderPainel();
}
function fecharPainel(){ selId = ''; $('#painel').classList.remove('aberto'); document.querySelectorAll('.no.sel').forEach(x => x.classList.remove('sel')); if (vistaAtual === 'mapa') desenharArestas(); if (vistaAtual === 'lista') renderLista(); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !document.querySelector('.modal') && !e.target.closest('input,textarea,select')) fecharPainel();
  if (e.key === '/' && vistaAtual === 'mapa' && !e.target.closest('input,textarea,select')) { e.preventDefault(); $('#m-busca').focus(); }
});

const ABAS = [['dados','Dados','fa-id-card'],['valores','Valores','fa-coins'],['analise','Análise','fa-scale-unbalanced'],['validacoes','Validações','fa-stamp'],['vinculos','Vínculos','fa-link'],['historico','Histórico','fa-clock-rotate-left']];
function renderPainel(){
  const s = porId.get(selId), p = $('#painel');
  if (!s) { p.classList.remove('aberto'); return; }
  const cor = corTipo(s.tipo), cam = caminho(s.id), sv = statusVal(s.id);
  const contagem = { validacoes:(valPorSetor.get(s.id) || []).length, vinculos:DB.vinculos.filter(v => v.origemId === s.id || v.destinoId === s.id).length, historico:DB.historico.filter(h => h.setorId === s.id).length, analise:linhasDe(s.positivos).length + linhasDe(s.negativos).length };
  p.style.setProperty('--c', cor);
  p.innerHTML = `
    <div class="pn-topo">
      <button class="btn btn-g btn-i fechar" onclick="fecharPainel()" title="Fechar (Esc)"><i class="fa-solid fa-xmark"></i></button>
      <div class="pn-cam">${cam.length ? cam.map(a => `<button onclick="irPara(${arg(a.id)})" title="${esc(a.nome)}">${esc(nomeCurto(a))}</button><i class="fa-solid fa-chevron-right"></i>`).join('') : '<span>Nível mais alto da estrutura</span>'}</div>
      <div class="pn-tit"><span class="ic"><i class="fa-solid ${icTipo(s.tipo)}"></i></span><div style="min-width:0"><h2 id="pn-nome">${esc(s.nome)}</h2>
        <div class="tags"><span class="chip sem" style="--c:${cor}">${esc(s.tipo)}${s.sigla ? ' · ' + esc(s.sigla) : ''}</span><span class="chip" style="--c:${STATUS_SETOR[s.status] || '#64748b'}">${esc(s.status || 'Ativo')}</span><span class="chip" style="--c:${STATUS_VAL[sv]}">${sv}</span></div></div></div>
      <div class="pn-acoes">
        <button class="btn btn-s btn-sm" onclick="irPara(${arg(s.id)})"><i class="fa-solid fa-location-crosshairs"></i>Mostrar no mapa</button>
        <button class="btn btn-s btn-sm so-edit" onclick="novoSetorEm(${arg(s.id)})"><i class="fa-solid fa-plus"></i>Subordinado</button>
        ${temFilhos(s.id) ? `<button class="btn btn-s btn-sm" onclick="abrirRamo(${arg(s.id)})"><i class="fa-solid fa-angles-down"></i>Abrir ramo</button>` : ''}
        <button class="btn btn-s btn-sm so-edit" onclick="duplicarSetor(${arg(s.id)})" title="Duplicar setor"><i class="fa-regular fa-copy"></i></button>
        <button class="btn btn-perigo btn-sm so-edit" onclick="excluirSetor(${arg(s.id)})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <div class="pn-abas" role="tablist">${ABAS.filter(a => !cenSwap || !['validacoes','vinculos'].includes(a[0])).map(([k, n, ic]) => `<button class="${abaPainel === k ? 'on' : ''}" onclick="abaPainel='${k}';renderPainel()" role="tab"><i class="fa-solid ${ic}"></i>${n}${contagem[k] ? `<span class="n">${contagem[k]}</span>` : ''}</button>`).join('')}</div>
    </div>
    <div class="pn-corpo" id="pn-corpo">${CORPO[cenSwap && CORPO_ABAS_CEN.includes(abaPainel) ? (abaPainel = 'dados') : abaPainel](s)}</div>`;
  p.classList.add('aberto');
}
function opcoesSetores(excluir, valor, vazio){
  const ex = excluir || new Set(); let h = vazio !== undefined ? `<option value="">${esc(vazio)}</option>` : '';
  const visit = (s, d) => { if (ex.has(s.id)) return; h += `<option value="${esc(s.id)}" ${s.id === valor ? 'selected' : ''}>${'\u00a0\u00a0'.repeat(d)}${d ? '└ ' : ''}${esc(s.nome)}</option>`; filhosDe(s.id).forEach(k => visit(k, d + 1)); };
  raizes().forEach(r => visit(r, 0)); return h;
}
const sel = (campo, opcoes, valor) => `<select class="campo" data-campo="${campo}">${opcoes.map(o => `<option ${o === valor ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
const CORPO_ABAS_CEN = ['validacoes','vinculos'];
const CORPO = {
  dados(s){
    const irmaos = filhosDe(s.paiId && porId.has(s.paiId) ? s.paiId : ''), i = irmaos.indexOf(s);
    return `
      <label><span class="rot">Nome do setor</span><input class="campo" data-campo="nome" value="${esc(s.nome)}" maxlength="200"></label>
      <div class="g2">
        <label><span class="rot">Sigla</span><input class="campo" data-campo="sigla" value="${esc(s.sigla)}" maxlength="30"></label>
        <label><span class="rot">Tipo</span>${sel('tipo', Object.keys(TIPOS), s.tipo)}</label>
      </div>
      <label><span class="rot">Setor superior <small>a quem responde</small></span><select class="campo" data-campo="paiId">${opcoesSetores(new Set([s.id, ...descendentes(s.id)]), s.paiId, '— Nenhum (nível mais alto) —')}</select></label>
      <div class="g2">
        <label><span class="rot">Situação</span>${sel('status', Object.keys(STATUS_SETOR), s.status || 'Ativo')}</label>
        <div><span class="rot">Posição entre os pares</span><div style="display:flex;gap:6px"><button class="btn btn-s btn-sm" ${i <= 0 ? 'disabled' : ''} onclick="moverOrdem(${arg(s.id)},-1)"><i class="fa-solid fa-arrow-up"></i>Antes</button><button class="btn btn-s btn-sm" ${i < 0 || i >= irmaos.length - 1 ? 'disabled' : ''} onclick="moverOrdem(${arg(s.id)},1)"><i class="fa-solid fa-arrow-down"></i>Depois</button></div></div>
      </div>
      ${s.tipo === 'Unidades Escolares' || num(s.quantidade) ? `<label><span class="rot">Quantidade de ${rotuloUnid(s)} <small>representadas por este cartão, sem desenhar uma a uma</small></span><input class="campo" data-campo="quantidade" data-num inputmode="numeric" value="${esc(s.quantidade)}" placeholder="ex.: 631"></label>` : ''}
      <div class="g2">
        <label><span class="rot">Responsável</span><input class="campo" data-campo="responsavel" value="${esc(s.responsavel)}" placeholder="Nome do titular"></label>
        <label><span class="rot">Contato</span><input class="campo" data-campo="contato" value="${esc(s.contato)}" placeholder="E-mail ou ramal"></label>
      </div>
      <label><span class="rot">Competências e funções <small>uma por linha</small></span><textarea class="campo" data-campo="competencias" rows="6" placeholder="O que o setor faz, conforme o decreto ou regimento">${esc(s.competencias)}</textarea></label>
      <label><span class="rot">Principais entregas e produtos</span><textarea class="campo" data-campo="entregas" rows="3" placeholder="Serviços, documentos, programas que o setor entrega">${esc(s.entregas)}</textarea></label>
      ${temFilhos(s.id) ? `<div class="g2">
        <label><span class="rot">Subordinados no mapa</span><select class="campo" data-campo="layout"><option value="" ${!s.layout ? 'selected' : ''}>Automático</option><option value="h" ${s.layout === 'h' ? 'selected' : ''}>Lado a lado</option><option value="v" ${s.layout === 'v' ? 'selected' : ''}>Em lista</option></select></label>
        <label><span class="rot">Colunas <small>lado a lado</small></span><input class="campo" data-campo="colunas" type="number" min="1" max="20" value="${esc(s.colunas)}" placeholder="6"></label>
      </div>` : ''}
      <p style="margin:0;font-size:11.5px;color:var(--mut)">${s.atualizadoEm ? `Última alteração em ${fmtData(s.atualizadoEm)}${s.atualizadoPor ? ' por ' + esc(s.atualizadoPor) : ''}.` : 'Estrutura original do Decreto nº 2.236/2026.'}</p>`;
  },
  valores(s){
    return `
      <div class="sec-t"><i class="fa-solid fa-coins"></i>Valores do próprio setor</div>
      <div class="g2">
        <label><span class="rot">Orçamento anual (R$)</span><input class="campo" data-campo="orcamento" data-num value="${s.orcamento ? esc(num(s.orcamento).toLocaleString('pt-BR')) : ''}" inputmode="decimal" placeholder="0"></label>
        <label><span class="rot">Custo mensal de pessoal (R$)</span><input class="campo" data-campo="custoMensal" data-num value="${s.custoMensal ? esc(num(s.custoMensal).toLocaleString('pt-BR')) : ''}" inputmode="decimal" placeholder="0"></label>
        <label><span class="rot">Servidores</span><input class="campo" data-campo="servidores" data-num value="${esc(s.servidores)}" inputmode="numeric" placeholder="0"></label>
        <label><span class="rot">Cargos comissionados</span><input class="campo" data-campo="comissionados" data-num value="${esc(s.comissionados)}" inputmode="numeric" placeholder="0"></label>
      </div>
      <div id="pn-soma">${blocoSoma(s)}</div>${svResumoSetor(s)}
      ${cenSwap ? '<p class="s" style="margin-top:14px;font-size:12.5px"><i class="fa-solid fa-lightbulb"></i> Os custos (DGA, bolsas e despesas) desta proposta ficam em <b>Propostas › Alterações</b>.</p>' : blocoFinSetor(s)}`;
  },
  analise(s){
    const imp = num(s.impacto), pos_ = linhasDe(s.positivos), neg = linhasDe(s.negativos), tot = pos_.length + neg.length;
    const lista = (campo, itens, ic, cor) => `<div class="lista-i" style="--c:${cor}">${itens.map((t, i) => `<div class="it"><i class="m fa-solid ${ic}"></i><span>${esc(t)}</span><button onclick="rmItem(${arg(s.id)},'${campo}',${i})" title="Remover"><i class="fa-solid fa-xmark"></i></button></div>`).join('') || `<div style="font-size:12.5px;color:var(--mut2)">Nenhum item.</div>`}
      <form class="add-i" onsubmit="event.preventDefault();addItem(${arg(s.id)},'${campo}',this.t)"><input name="t" class="campo" placeholder="Adicionar e tecle Enter" maxlength="300"><button class="btn btn-s btn-i" title="Adicionar"><i class="fa-solid fa-plus"></i></button></form></div>`;
    return `
      <div class="sec-t"><i class="fa-solid fa-bolt"></i>Impacto do setor na Secretaria</div>
      <div class="imp">${[1,2,3,4,5].map(n => `<button class="${imp === n ? 'on' : ''}" style="--c:${IMPACTO[n][1]}" onclick="alterar(porId.get(${arg(s.id)}),'impacto','${imp === n ? '' : n}');renderPainel()"><b>${n}</b>${IMPACTO[n][0]}</button>`).join('')}</div>
      <label><span class="rot">Descrição do impacto <small>o que muda se o setor parar</small></span><textarea class="campo" data-campo="impactoDescricao" rows="3">${esc(s.impactoDescricao)}</textarea></label>
      ${tot ? `<div><div class="balanco"><span style="width:${pos_.length * 100 / tot}%;background:#16a34a"></span><span style="width:${neg.length * 100 / tot}%;background:#dc2626"></span></div><div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--mut);margin-top:4px"><span>${pos_.length} positivo(s)</span><span>${neg.length} negativo(s)</span></div></div>` : ''}
      <div class="sec-t" style="--c:#16a34a"><i class="fa-solid fa-circle-plus"></i>Pontos positivos</div>${lista('positivos', pos_, 'fa-check', '#16a34a')}
      <div class="sec-t" style="--c:#dc2626"><i class="fa-solid fa-circle-minus"></i>Pontos negativos</div>${lista('negativos', neg, 'fa-xmark', '#dc2626')}`;
  },
  validacoes(s){
    const minhas = (valPorSetor.get(s.id) || []), deles = DB.validacoes.filter(v => v.validadorId === s.id);
    const item = (v, mostrar) => { const o = porId.get(mostrar === 'validador' ? v.validadorId : v.setorId); return `<div class="val-it">
      <div class="l1"><i class="fa-solid ${mostrar === 'validador' ? 'fa-user-check' : 'fa-inbox'}" style="color:var(--mut)"></i><b title="${esc(o ? o.nome : '')}">${esc(o ? o.nome : '(setor removido)')}</b><span class="chip" style="--c:${STATUS_VAL[v.status || 'Pendente']}">${esc(v.status || 'Pendente')}</span><button class="btn btn-g btn-i btn-sm" onclick="rmValidacao(${arg(v.id)})" title="Remover"><i class="fa-solid fa-trash-can"></i></button></div>
      <select class="campo" data-val="${esc(v.id)}" data-vcampo="status">${Object.keys(STATUS_VAL).filter(x => x !== 'Sem validação').map(x => `<option ${x === (v.status || 'Pendente') ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <textarea class="campo" data-val="${esc(v.id)}" data-vcampo="parecer" rows="2" placeholder="Parecer do setor validador">${esc(v.parecer)}</textarea>
      <span style="font-size:11px;color:var(--mut)">Solicitada em ${fmtData(v.solicitadoEm)}${v.solicitadoPor ? ' por ' + esc(v.solicitadoPor) : ''}${v.respondidoEm ? ` · respondida em ${fmtData(v.respondidoEm)}${v.respondidoPor ? ' por ' + esc(v.respondidoPor) : ''}` : ''}</span></div>`; };
    return `
      <div class="sec-t"><i class="fa-solid fa-paper-plane"></i>Pedir validação a outro setor</div>
      <div style="display:flex;gap:6px"><select id="val-novo" class="campo">${opcoesSetores(new Set([s.id]), '', 'Escolha o setor validador')}</select><button class="btn btn-p" onclick="solicitarValidacao(${arg(s.id)})"><i class="fa-solid fa-plus"></i>Pedir</button></div>
      <div class="sec-t"><i class="fa-solid fa-stamp"></i>Validações deste setor <span class="chip" style="--c:${STATUS_VAL[statusVal(s.id)]}">${statusVal(s.id)}</span></div>
      ${minhas.map(v => item(v, 'validador')).join('') || '<div class="vazio"><i class="fa-regular fa-folder-open"></i>Nenhuma validação pedida.</div>'}
      ${deles.length ? `<div class="sec-t"><i class="fa-solid fa-inbox"></i>Este setor deve validar</div>${deles.map(v => item(v, 'setor')).join('')}` : ''}`;
  },
  vinculos(s){
    const l = DB.vinculos.filter(v => v.origemId === s.id || v.destinoId === s.id);
    return `
      <p style="margin:0;font-size:12.5px;color:var(--mut);line-height:1.5">Relações fora da linha hierárquica (apoio, fluxos, atuação regional). Aparecem no mapa como linhas tracejadas roxas.</p>
      <div class="sec-t"><i class="fa-solid fa-plus"></i>Novo vínculo</div>
      <select id="vin-dest" class="campo">${opcoesSetores(new Set([s.id]), '', 'Setor relacionado')}</select>
      <div style="display:flex;gap:6px"><select id="vin-tipo" class="campo">${TIPOS_VINCULO.map(t => `<option>${t}</option>`).join('')}</select><button class="btn btn-p" onclick="addVinculo(${arg(s.id)})"><i class="fa-solid fa-link"></i>Vincular</button></div>
      <input id="vin-desc" class="campo" placeholder="Descrição (opcional)">
      <div class="sec-t"><i class="fa-solid fa-link"></i>Vínculos existentes</div>
      ${l.map(v => { const outro = porId.get(v.origemId === s.id ? v.destinoId : v.origemId); return `<div class="val-it"><div class="l1"><i class="fa-solid ${v.origemId === s.id ? 'fa-arrow-right' : 'fa-arrow-left'}" style="color:#8b5cf6"></i><b>${esc(outro ? outro.nome : '(removido)')}</b><span class="chip sem" style="--c:#8b5cf6">${esc(v.tipo)}</span><button class="btn btn-g btn-i btn-sm" onclick="rmVinculo(${arg(v.id)})"><i class="fa-solid fa-trash-can"></i></button></div>${v.descricao ? `<span style="font-size:12.5px;color:var(--txt2)">${esc(v.descricao)}</span>` : ''}</div>`; }).join('') || '<div class="vazio"><i class="fa-solid fa-link-slash"></i>Sem vínculos.</div>'}`;
  },
  historico(s){
    const l = DB.historico.filter(h => h.setorId === s.id).sort((a, b) => Date.parse(b.data) - Date.parse(a.data)).slice(0, 100);
    return l.length ? `<div class="hist">${l.map(h => `<div><i class="fa-solid fa-circle"></i><span>${esc(h.acao)}<small>${fmtData(h.data)} · ${esc(h.usuario)}</small></span></div>`).join('')}</div>` : '<div class="vazio"><i class="fa-regular fa-clock"></i>Nenhuma alteração registrada.</div>';
  }
};
function blocoSoma(s){
  const t = somaSub(s.id), g = somaSub(raizes()[0] ? raizes()[0].id : s.id);
  const pct = (a, b) => b ? ` · ${Math.round(a * 100 / b)}% do total` : '';
  return `<div class="sec-t"><i class="fa-solid fa-layer-group"></i>Somando ${t.setores > 1 ? `os ${t.setores - 1} subordinados` : 'só este setor'}</div>
    <div class="soma">
      <div><b>${fmtRc(t.orcamento)}</b><span>Orçamento anual${pct(t.orcamento, g.orcamento)}</span></div>
      <div><b>${fmtRc(t.custoMensal)}</b><span>Custo mensal${pct(t.custoMensal, g.custoMensal)}</span></div>
      <div><b>${fmtN(t.servidores)}</b><span>Servidores${pct(t.servidores, g.servidores)}</span></div>
      <div><b>${fmtN(t.comissionados)}</b><span>Comissionados${pct(t.comissionados, g.comissionados)}</span></div>
    </div>`;
}
// Campos do painel: grava ao sair do campo (sem redesenhar o painel, para não perder o foco)
$('#painel').addEventListener('change', e => {
  const el = e.target, s = porId.get(selId); if (!s) return;
  if (el.dataset.val) { editarValidacao(el.dataset.val, el.dataset.vcampo, el.value); return; }
  const c = el.dataset.campo; if (!c) return;
  let v = el.value;
  if (el.hasAttribute('data-num')) { v = parseValor(v); if (v && ['orcamento','custoMensal'].includes(c)) el.value = num(v).toLocaleString('pt-BR'); }
  if (c === 'nome' && !v.trim()) { el.value = s.nome; return toast('O nome não pode ficar vazio.', 'aviso'); }
  if (c === 'nome' && !s.tipo) s.tipo = tipoPorNome(v);
  if (c === 'paiId') { s.dx = ''; s.dy = ''; if (v) { abertos.add(v); salvarAbertos(); } }
  alterar(s, c, c === 'nome' ? v.trim() : v);
  if (c === 'nome') $('#pn-nome').textContent = s.nome;
  if (['tipo','status','paiId','layout'].includes(c)) renderPainel();
  if (c === 'quantidade' && vistaAtual === 'mapa') desenharMapa();
  if (['orcamento','custoMensal','servidores','comissionados'].includes(c)) $('#pn-soma').innerHTML = blocoSoma(s);
});

/* Ações sobre setores */
function novoSetorEm(paiId){
  const pai = porId.get(paiId);
  const tipoSug = pai ? ({ 'Gabinete':'Superintendência','Superintendência':'Coordenadoria','Coordenadoria':'Núcleo','Diretoria':'Coordenadoria','Diretoria Adjunta':'Coordenadoria' }[pai.tipo] || 'Unidade') : 'Gabinete';
  const s = novoSetor({ id:novoId('s'), nome:'Novo setor', tipo:tipoSug, paiId:pai ? pai.id : '', ordem:String(Math.max(0, ...filhosDe(pai ? pai.id : '').map(k => num(k.ordem))) + 1), status:'Proposto', atualizadoEm:agora(), atualizadoPor:cfg.usuario });
  DB.setores.push(s); indexar(); enfileirar('setores', s); registrar(s.id, 'Setor criado' + (pai ? ' em ' + pai.nome : ''));
  if (pai) { abertos.add(pai.id); salvarAbertos(); }
  selId = s.id; abaPainel = 'dados';
  atualizarVistaAtual(); renderPainel();
  if (vistaAtual === 'mapa') setTimeout(() => centralizar(s.id), 40);
  setTimeout(() => { const i = document.querySelector('#painel [data-campo="nome"]'); if (i) { i.focus(); i.select(); } }, 80);
}
function duplicarSetor(id){
  const o = porId.get(id); if (!o) return;
  const s = novoSetor(Object.assign({}, o, { id:novoId('s'), nome:o.nome + ' (cópia)', dx:String(num(o.dx) + 30), dy:String(num(o.dy) + 30), ordem:String(num(o.ordem) + .5), atualizadoEm:agora(), atualizadoPor:cfg.usuario }));
  DB.setores.push(s); indexar(); enfileirar('setores', s); registrar(s.id, 'Criado a partir de ' + o.nome);
  selId = s.id; atualizarVistaAtual(); renderPainel(); toast('Setor duplicado (sem os subordinados).');
}
async function excluirSetor(id){
  const s = porId.get(id); if (!s) return;
  const desc = descendentes(id);
  if (cenSwap) {
    if (!await confirmar('Excluir nesta proposta', `Excluir <b>${esc(s.nome)}</b>${desc.size ? ` e os <b>${desc.size}</b> subordinados` : ''} <b>somente nesta proposta</b>? A estrutura atual não muda. Setores existentes aparecem como extintos no mapa da proposta; setores criados na proposta são removidos.`, 'Excluir na proposta', true)) return;
    const ofic = new Set(setoresOficiais().map(x => x.id));
    [id, ...desc].forEach(i => { const x = porId.get(i); if (!x) return; if (ofic.has(i)) { x.status = 'Extinto'; enfileirar('setores', x, true); } else { DB.setores = DB.setores.filter(y => y.id !== i); enfileirar('setores', x, true); } });
    indexar(); fecharPainel(); atualizarVistaAtual(); toast('Excluído nesta proposta.'); return;
  }
  if (!await confirmar('Excluir setor', `Excluir <b>${esc(s.nome)}</b>${desc.size ? ` e os <b>${desc.size}</b> setores subordinados a ele` : ''}? As validações e vínculos ligados a eles também serão removidos. Para manter o histórico, prefira mudar a situação para <b>Extinto</b>.`, 'Excluir', true)) return;
  const ids = new Set([id, ...desc]);
  DB.setores.filter(x => ids.has(x.id)).forEach(x => enfileirar('setores', x, true));
  DB.validacoes.filter(v => ids.has(v.setorId) || ids.has(v.validadorId)).forEach(v => enfileirar('validacoes', v, true));
  DB.vinculos.filter(v => ids.has(v.origemId) || ids.has(v.destinoId)).forEach(v => enfileirar('vinculos', v, true));
  DB.setores = DB.setores.filter(x => !ids.has(x.id));
  DB.validacoes = DB.validacoes.filter(v => !ids.has(v.setorId) && !ids.has(v.validadorId));
  DB.vinculos = DB.vinculos.filter(v => !ids.has(v.origemId) && !ids.has(v.destinoId));
  if (s.paiId) registrar(s.paiId, `Subordinado excluído: ${s.nome}${desc.size ? ` (com ${desc.size} setores)` : ''}`);
  indexar(); fecharPainel(); atualizarVistaAtual(); toast('Setor excluído.');
}
function moverOrdem(id, d){
  const s = porId.get(id), irm = filhosDe(s.paiId && porId.has(s.paiId) ? s.paiId : '');
  irm.forEach((x, i) => { if (x.ordem !== String(i + 1)) { x.ordem = String(i + 1); enfileirar('setores', x); } });
  const i = irm.indexOf(s), j = i + d; if (j < 0 || j >= irm.length) return;
  const o = irm[j], t = s.ordem; s.ordem = o.ordem; o.ordem = t; enfileirar('setores', o);
  alterar(s, 'ordem', s.ordem, true); renderPainel();
}
function abrirRamo(id){ [id, ...descendentes(id)].forEach(i => { if (temFilhos(i)) abertos.add(i); }); caminho(id).forEach(a => abertos.add(a.id)); salvarAbertos(); if (vistaAtual !== 'mapa') trocarVista('mapa'); desenharMapa(); setTimeout(() => centralizar(id), 30); }
function addItem(id, campo, input){
  const t = input.value.trim(); if (!t) return;
  const s = porId.get(id); alterar(s, campo, linhasDe(s[campo]).concat(t.replace(/\n/g, ' ')).join('\n'), true);
  registrar(id, `${campo === 'positivos' ? 'Ponto positivo' : 'Ponto negativo'} incluído: ${t}`); renderPainel();
  setTimeout(() => { const f = document.querySelectorAll('#pn-corpo .add-i input')[campo === 'positivos' ? 0 : 1]; if (f) f.focus(); }, 20);
}
function rmItem(id, campo, i){ const s = porId.get(id), l = linhasDe(s[campo]); const t = l.splice(i, 1)[0]; alterar(s, campo, l.join('\n'), true); registrar(id, `${campo === 'positivos' ? 'Ponto positivo' : 'Ponto negativo'} removido: ${t}`); renderPainel(); }

/* Validações */
function solicitarValidacao(id){
  const vid = $('#val-novo').value; if (!vid) return toast('Escolha o setor que vai validar.', 'aviso');
  if ((valPorSetor.get(id) || []).some(v => v.validadorId === vid)) return toast('Esse setor já foi chamado a validar.', 'aviso');
  const v = novoReg('validacoes', { id:novoId('val'), setorId:id, validadorId:vid, status:'Pendente', solicitadoEm:agora(), solicitadoPor:cfg.usuario });
  DB.validacoes.push(v); enfileirar('validacoes', v); registrar(id, 'Validação pedida a ' + porId.get(vid).nome);
  indexar(); renderPainel(); atualizarVistaAtual();
}
function editarValidacao(vid, campo, valor){
  const v = DB.validacoes.find(x => x.id === vid); if (!v || v[campo] === valor) return;
  v[campo] = valor; v.respondidoEm = agora(); v.respondidoPor = cfg.usuario;
  enfileirar('validacoes', v);
  if (campo === 'status') registrar(v.setorId, `Validação de ${(porId.get(v.validadorId) || {}).nome || '?'}: ${valor}`);
  indexar(); if (vistaAtual === 'validacoes') renderValidacoes(); else if (selId) renderPainel();
  if (vistaAtual === 'mapa') desenharMapa();
}
async function rmValidacao(vid){
  if (!await confirmar('Remover validação', 'Remover este pedido de validação?', 'Remover', true)) return;
  const v = DB.validacoes.find(x => x.id === vid); if (!v) return;
  DB.validacoes = DB.validacoes.filter(x => x.id !== vid); enfileirar('validacoes', v, true);
  indexar(); renderPainel(); atualizarVistaAtual();
}
/* Vínculos */
function addVinculo(id){
  const d = $('#vin-dest').value; if (!d) return toast('Escolha o setor relacionado.', 'aviso');
  const v = novoReg('vinculos', { id:novoId('v'), origemId:id, destinoId:d, tipo:$('#vin-tipo').value, descricao:$('#vin-desc').value.trim() });
  DB.vinculos.push(v); enfileirar('vinculos', v); registrar(id, `Vínculo (${v.tipo}) com ${porId.get(d).nome}`);
  renderPainel(); if (vistaAtual === 'mapa') desenharArestas();
}
function rmVinculo(vid){ const v = DB.vinculos.find(x => x.id === vid); if (!v) return; DB.vinculos = DB.vinculos.filter(x => x.id !== vid); enfileirar('vinculos', v, true); renderPainel(); if (vistaAtual === 'mapa') desenharArestas(); }

/* ===================== VISTAS ===================== */
document.querySelectorAll('.nav-b').forEach(b => { b.title = b.querySelector('span').textContent; b.addEventListener('click', () => b.dataset.acao === 'tv' ? abrirModoTV() : trocarVista(b.dataset.vista)); });
function trocarVista(v){
  if (!podeVerVista(v)) { if (document.querySelector('#app:not(.hidden)')) toast('Seu perfil não tem acesso a esta seção.', 'aviso'); v = primeiraVista(); }
  vistaAtual = v; document.body.classList.toggle('ro', somenteLeitura());
  if (cenMapa) { if (VISTAS_CEN.includes(v)) { if (!cenSwap) aplicarCenario(); } else if (cenSwap) desaplicarCenario(); }
  if (typeof atualizarBarraCen === 'function') atualizarBarraCen();
  document.querySelectorAll('.nav-b').forEach(b => b.classList.toggle('on', b.dataset.vista === v));
  document.querySelectorAll('.vista').forEach(s => s.classList.toggle('fora', s.id !== 'v-' + v));
  atualizarVistaAtual();
  if (typeof animarEntrada === 'function') animarEntrada($('#v-' + v));
}
function atualizarVistaAtual(){
  if (vistaAtual === 'mapa') desenharMapa();
  else if (vistaAtual === 'lista') renderLista();
  else if (vistaAtual === 'painel') renderPainelInd();
  else if (vistaAtual === 'validacoes') renderValidacoes();
  else if (vistaAtual === 'config') renderConfig();
  else if (vistaAtual === 'usuarios') renderUsuarios();
  else if (vistaAtual === 'financeiro') renderFinanceiro();
  else if (vistaAtual === 'propostas') renderPropostas();
  else if (vistaAtual === 'escolas') renderEscolas();
  else if (vistaAtual === 'reestruturacao') renderReestruturacao();
  else if (vistaAtual === 'implantacao') renderImplantacao();
  else if (vistaAtual === 'chefias') renderChefias();
  else if (vistaAtual === 'servidores') renderServidores();
  else if (vistaAtual === 'resultados') renderResultados();
  else if (vistaAtual === 'regional') renderRegional();
  else if (vistaAtual === 'reunioes') renderReunioes();
  else if (vistaAtual === 'relatorios') renderRelatorios();
  atualizarBadgeIm();
}
function redesenharTudo(){ indexar(); atualizarVistaAtual(); if (selId && porId.has(selId)) renderPainel(); else fecharPainel(); }
function atualizarBadgeIm(){ const n = (DB.etapas || []).filter(e => e.status !== 'Concluída' && e.prazo && e.prazo < hojeISO()).length, b = $('#nav-im'); if (!b) return; b.textContent = n; b.classList.toggle('hidden', !n); b.title = n + ' etapa(s) atrasada(s)'; }
function atualizarBadgeVal(){ const n = DB.validacoes.filter(v => !v.status || v.status === 'Pendente').length, b = $('#nav-val'); if (!b) return; b.textContent = n; b.classList.toggle('hidden', !n); }
function opcoesFiltro(id, rotulo, valores){
  const el = $(id); const atual = el.value;
  el.innerHTML = `<option value="">${rotulo}</option>` + valores.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join('');
  el.value = valores.some(x => x[0] === atual) ? atual : '';
}

/* Lista hierárquica */
function renderLista(){
  opcoesFiltro('#l-tipo', 'Todos os tipos', Object.keys(TIPOS).filter(t => DB.setores.some(s => s.tipo === t)).map(t => [t, t]));
  opcoesFiltro('#l-area', 'Todas as áreas', areas.map(a => [a, nomeCurto(porId.get(a))]));
  opcoesFiltro('#l-val', 'Toda validação', Object.keys(STATUS_VAL).map(t => [t, t]));
  const q = norm($('#l-busca').value), ft = $('#l-tipo').value, fa = $('#l-area').value, fv = $('#l-val').value;
  const filtro = q || ft || fa || fv;
  const casa = s => (!q || norm([s.nome, s.sigla, s.responsavel, s.competencias].join(' ')).includes(q)) && (!ft || s.tipo === ft) && (!fa || areaDe.get(s.id) === fa) && (!fv || statusVal(s.id) === fv);
  let mostrar = null, nCasa = 0;
  if (filtro) { mostrar = new Set(); DB.setores.forEach(s => { if (!casa(s)) return; nCasa++; let x = s, g = 0; while (x && !mostrar.has(x.id) && g++ < 60) { mostrar.add(x.id); x = porId.get(x.paiId); } }); }
  if (!listaAbertos.size && !filtro) raizes().forEach(r => listaAbertos.add(r.id));
  const linhas = [];
  const visit = (s, d) => { if (mostrar && !mostrar.has(s.id)) return; linhas.push([s, d]); if (filtro || listaAbertos.has(s.id)) filhosDe(s.id).forEach(k => visit(k, d + 1)); };
  raizes().forEach(r => visit(r, 0));
  $('#l-resumo').textContent = filtro ? `${nCasa} setor(es) encontrados de ${DB.setores.length}` : `${DB.setores.length} setores na estrutura`;
  $('#l-corpo').innerHTML = linhas.map(([s, d]) => {
    const n = filhosDe(s.id).length, ab = filtro || listaAbertos.has(s.id), sv = statusVal(s.id), imp = num(s.impacto), casaQ = filtro && casa(s);
    return `<tr class="${s.id === selId ? 'sel' : ''}" onclick="selecionar(${arg(s.id)})">
      <td><div class="arv" style="padding-left:${d * 20}px;--c:${corTipo(s.tipo)}">${n ? `<button class="tg" onclick="event.stopPropagation();listaAlternar(${arg(s.id)})" title="${ab ? 'Recolher' : 'Abrir'}"><i class="fa-solid fa-chevron-${ab ? 'down' : 'right'}"></i></button>` : '<span style="width:20px"></span>'}<span class="ic"><i class="fa-solid ${icTipo(s.tipo)}"></i></span><span class="nm" style="${filtro && !casaQ ? 'opacity:.55' : ''}">${esc(s.nome)}${num(s.quantidade) ? ` <span class="chip" style="--c:#16a34a">${fmtN(s.quantidade)} ${rotuloUnid(s)}</span>` : ''}</span>${s.sigla ? `<span class="sg">${esc(s.sigla)}</span>` : ''}${n ? `<span class="sg">· ${n}</span>` : ''}</div></td>
      <td>${esc(s.tipo)}</td><td>${esc(s.responsavel) || '<span style="color:var(--mut2)">—</span>'}</td>
      <td class="n">${s.servidores ? fmtN(s.servidores) : '—'}</td><td class="n">${s.orcamento ? fmtRc(s.orcamento) : '—'}</td>
      <td>${imp ? `<span class="chip" style="--c:${IMPACTO[imp][1]}">${IMPACTO[imp][0]}</span>` : '<span style="color:var(--mut2)">—</span>'}</td>
      <td><span class="chip" style="--c:${STATUS_VAL[sv]}">${sv}</span></td><td><span class="chip" style="--c:${STATUS_SETOR[s.status] || '#64748b'}">${esc(s.status || 'Ativo')}</span></td></tr>`;
  }).join('') || `<tr><td colspan="8"><div class="vazio"><i class="fa-solid fa-magnifying-glass"></i>Nenhum setor com esses filtros.</div></td></tr>`;
}
function listaAlternar(id){ listaAbertos.has(id) ? listaAbertos.delete(id) : listaAbertos.add(id); store.set('gaborg_lista_abertos', [...listaAbertos]); renderLista(); }
function listaAbrirTudo(abrir){ listaAbertos = abrir ? new Set(DB.setores.filter(s => temFilhos(s.id)).map(s => s.id)) : new Set(raizes().map(r => r.id)); store.set('gaborg_lista_abertos', [...listaAbertos]); renderLista(); }
function limparFiltrosLista(){ ['#l-busca','#l-tipo','#l-area','#l-val'].forEach(i => $(i).value = ''); renderLista(); }

/* Indicadores */
/* ===================== INDICADORES ESTRATÉGICOS ===================== */
let indAba = store.get('gaborg_ind_aba', 'geral'), indSel = null, indOrd = { k:'idx', d:-1 };
const IND_ABAS = [['geral','Visão geral','fa-gauge-high'],['risco','Riscos e prioridades','fa-triangle-exclamation'],['estrutura','Estrutura e governança','fa-sitemap'],['rede','Rede escolar','fa-school'],['dist','Distâncias até a DRE','fa-route'],['custos','Custos e propostas','fa-coins']];
const CHEFIAS = ['Gabinete','Superintendência','Diretoria','Diretoria Adjunta','Coordenadoria','Gerência','Unidade','Núcleo Regional'];
const CAMPOS_CAD = [['responsavel','Responsável'],['competencias','Competências'],['entregas','Entregas'],['impacto','Impacto avaliado'],['servidores','Nº de servidores']];
const pct = (a, b) => b ? Math.round(a * 100 / b) : 0;
const fmtRs = v => (v < 0 ? '−' : '') + fmtRc(Math.abs(v));
const fmtP = v => v.toLocaleString('pt-BR', { maximumFractionDigits:1 }) + '%';
function abaInd(a){ indAba = a; indSel = null; store.set('gaborg_ind_aba', a); renderPainelInd(); }
function cadSetor(s){ return CAMPOS_CAD.filter(([k]) => k === 'impacto' ? num(s.impacto) > 0 : k === 'servidores' ? String(s.servidores ?? '') !== '' : String(s[k] || '').trim()).length / CAMPOS_CAD.length; }
const validado = s => ['Aprovado', 'Aprovado com ressalvas'].includes(statusVal(s.id));
const emRisco = s => num(s.impacto) >= 4 && (linhasDe(s.negativos).length > linhasDe(s.positivos).length || ['Reprovado', 'Sem validação'].includes(statusVal(s.id)) || !s.responsavel);
const diasDesde = d => { const t = Date.parse(d || ''); return isFinite(t) ? Math.floor((Date.now() - t) / 864e5) : 0; };
/* Coleta todos os números de uma vez, para o filtro de área escolhido */
function dadosInd(fa){
  const todos = DB.setores.filter(s => s.status !== 'Extinto');
  const base = todos.filter(s => !fa || areaDe.get(s.id) === fa), ids = new Set(base.map(s => s.id));
  const filhosAtivos = id => filhosDe(id).filter(k => k.status !== 'Extinto' && k.tipo !== 'Unidades Escolares');
  const chefias = base.filter(s => CHEFIAS.includes(s.tipo));
  const amp = chefias.map(s => [s, filhosAtivos(s.id).length]).filter(([, n]) => n > 0);
  const vals = DB.validacoes.filter(v => ids.has(v.setorId)), pend = vals.filter(v => !v.status || v.status === 'Pendente');
  const desp = DB.despesas.filter(d => (!d.setorId || ids.has(d.setorId) || !fa) && (!fa || ids.has(d.setorId)));
  const custo = { Atual:{ m:0, a:0 }, Proposto:{ m:0, a:0 } }; desp.forEach(d => { const c = calcDesp(d), k = d.cenario === 'Proposto' ? 'Proposto' : 'Atual'; custo[k].m += c.mensal; custo[k].a += c.anual; });
  const porArea = areas.filter(a => !fa || a === fa).map(a => {
    const sub = todos.filter(s => areaDe.get(s.id) === a), sid = new Set(sub.map(s => s.id)), ch = sub.filter(s => CHEFIAS.includes(s.tipo));
    let ca = 0; DB.despesas.forEach(d => { if (sid.has(d.setorId) && (d.cenario || 'Atual') === 'Atual') ca += calcDesp(d).anual; });
    const cad = sub.length ? sub.reduce((t, s) => t + cadSetor(s), 0) / sub.length * 100 : 0, val = pct(sub.filter(validado).length, sub.length), risco = sub.filter(emRisco).length;
    const semResp = ch.filter(s => !s.responsavel).length, pendA = DB.validacoes.filter(v => sid.has(v.setorId) && (!v.status || v.status === 'Pendente')).length;
    const idx = Math.round(cad * .4 + val * .3 + (ch.length ? (1 - semResp / ch.length) * 100 : 100) * .2 + (sub.length ? (1 - risco / sub.length) * 100 : 100) * .1);
    return { a, nome:nomeCurto(porId.get(a)), cor:corArea(a), n:sub.length, ch:ch.length, ser:sub.reduce((t, s) => t + num(s.servidores), 0), com:sub.reduce((t, s) => t + num(s.comissionados), 0), ca, cad, val, risco, semResp, pend:pendA, idx };
  });
  const E = escolasLista(), dres = dresDe(E);
  return { todos, base, ids, chefias, amp, vals, pend, custo, desp, porArea, E, dres };
}
function insightsInd(D, fa){
  const r = [], { base, chefias, amp, pend, porArea, E, dres } = D;
  const ser = base.reduce((t, s) => t + num(s.servidores), 0);
  const cad = base.length ? base.reduce((t, s) => t + cadSetor(s), 0) / base.length * 100 : 0;
  const semResp = chefias.filter(s => !s.responsavel);
  const criticosSemVal = base.filter(s => num(s.impacto) >= 4 && statusVal(s.id) === 'Sem validação');
  const parados = pend.filter(v => diasDesde(v.solicitadoEm) > 15);
  const altos = amp.filter(([, n]) => n > 8), unicos = amp.filter(([, n]) => n === 1);
  const risco = base.filter(emRisco);
  if (cad < 60) r.push(['alerta', `O cadastro está <b>${fmtP(cad)}</b> completo. Sem responsável, competências e impacto preenchidos, as análises abaixo ficam parciais.`, () => "abaInd('estrutura')"]);
  else r.push(['ok', `Cadastro <b>${fmtP(cad)}</b> completo: a base é confiável para análise.`]);
  if (semResp.length) r.push([semResp.length > chefias.length * .3 ? 'alerta' : 'atencao', `<b>${semResp.length}</b> de ${chefias.length} chefias (${pct(semResp.length, chefias.length)}%) estão sem responsável indicado.`, () => "abaInd('risco')"]);
  if (risco.length) r.push(['alerta', `<b>${risco.length}</b> setor(es) de impacto alto ou crítico com ponto fraco: sem validação, sem responsável ou com mais pontos negativos que positivos.`, () => "abaInd('risco')"]);
  if (criticosSemVal.length) r.push(['atencao', `<b>${criticosSemVal.length}</b> setor(es) de impacto alto ou crítico ainda não passaram por validação de outro setor.`, () => "abaInd('risco')"]);
  if (parados.length) r.push(['atencao', `<b>${parados.length}</b> validação(ões) pendente(s) há mais de 15 dias.`, () => "trocarVista('validacoes')"]);
  else if (pend.length) r.push(['info', `${pend.length} validação(ões) pendente(s), todas pedidas há menos de 15 dias.`]);
  if (altos.length) r.push(['atencao', `<b>${altos.length}</b> chefia(s) com mais de 8 setores diretamente subordinados (amplitude de controle alta). Maior: <b>${esc(nomeCurto(altos.sort((a, b) => b[1] - a[1])[0][0]))}</b>, com ${altos[0][1]}.`, () => "abaInd('estrutura')"]);
  if (unicos.length) r.push(['info', `<b>${unicos.length}</b> chefia(s) com apenas 1 setor subordinado: possível nível hierárquico a simplificar.`, () => "abaInd('estrutura')"]);
  if (!fa && porArea.length > 1) { const tot = porArea.reduce((t, x) => t + x.n, 0), mx = porArea.slice().sort((a, b) => b.n - a.n)[0]; r.push(['info', `<b>${esc(mx.nome)}</b> concentra ${pct(mx.n, tot)}% dos setores${ser ? ` e ${pct(mx.ser, ser)}% dos servidores informados` : ''}.`]);
    const pior = porArea.slice().sort((a, b) => a.idx - b.idx)[0]; if (pior && pior.idx < 70) r.push(['atencao', `Menor índice de maturidade: <b>${esc(pior.nome)}</b> (${pior.idx} de 100).`, () => `$('#p-area').value=${arg(pior.a)};renderPainelInd()`]); }
  if (E.length) { const met = dres.map(d => [d, E.filter(e => e.dre === d).length]).sort((a, b) => b[1] - a[1]), med = E.length / dres.length, rur = dres.map(d => { const l = E.filter(e => e.dre === d); return [d, pct(l.filter(e => e.localidade === 'RURAL').length, l.length)]; }).sort((a, b) => b[1] - a[1])[0];
    r.push(['info', `Rede de <b>${fmtN(E.length)}</b> unidades escolares em ${dres.length} DREs. A <b>${esc(nomeDRE(met[0][0]))}</b> atende ${met[0][1]} escolas (${(met[0][1] / med).toLocaleString('pt-BR', { maximumFractionDigits:1 })}× a média de ${Math.round(med)} por DRE). A <b>${esc(nomeDRE(rur[0]))}</b> é a mais rural: ${rur[1]}% das suas escolas.`, () => "abaInd('rede')"]); }
  if (E.length) { const X = distanciasMT(), l = X.lista, m100 = l.filter(o => o.km > 100).length, med = l.reduce((t, o) => t + o.km, 0) / l.length, dm = X.dres.map(d => { const x = l.filter(o => o.e.dre === d); return [d, x.reduce((t, o) => t + o.km, 0) / x.length]; }).sort((a, b) => b[1] - a[1])[0];
    r.push([m100 > l.length * .2 ? 'atencao' : 'info', `As escolas ficam, em média, a <b>${fmtKm(med)}</b> em linha reta da sede da sua DRE. <b>${m100}</b> estão a mais de 100 km. A DRE com escolas mais distantes é <b>${esc(nomeDRE(dm[0]))}</b> (média de ${fmtKm(dm[1])}).`, () => "abaInd('dist')"]); }
  if (!DB.despesas.length) r.push(['info', 'Os custos ainda não foram lançados no Financeiro: os indicadores de custo aparecem quando houver lançamentos.', () => "trocarVista('financeiro')"]);
  return r;
}
function renderPainelInd(){
  opcoesFiltro('#p-area', 'Toda a Secretaria', areas.map(a => [a, nomeCurto(porId.get(a))]));
  const fa = $('#p-area').value, D = dadosInd(fa);
  const kpi = (c, ic, r, v, s, on) => `<div class="cartao kpi ${on ? 'clic' : ''}" style="--c:${c}" ${on ? `onclick="${on}"` : ''}><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  const barras = (pares, fmt) => { const mx = Math.max(1, ...pares.map(p => p[1])); return pares.map(([n, v, c, on, extra, ic]) => `<div class="barra-l" ${on ? `style="cursor:pointer" onclick="${on}"` : ''}><span class="n" title="${esc(n)}">${ic || ''}${esc(n)}</span><span class="t"><span style="width:${v / mx * 100}%;background:${c || 'var(--marca)'}"></span></span><b>${fmt ? fmt(v) : fmtN(v)}</b>${extra || ''}</div>`).join(''); };
  const nav = `<div class="ind-abas">${IND_ABAS.map(([k, n, ic]) => `<button class="${indAba === k ? 'on' : ''}" onclick="abaInd('${k}')"><i class="fa-solid ${ic}"></i><span>${n}</span></button>`).join('')}<span class="esp"></span><button class="btn btn-s btn-sm" onclick="exportarIndicadores()"><i class="fa-solid fa-file-csv"></i>Exportar</button><button class="btn btn-s btn-sm" onclick="window.print()"><i class="fa-solid fa-print"></i>Imprimir</button></div>`;
  let h = '';
  if (indAba === 'geral') h = indGeral(D, fa, kpi);
  else if (indAba === 'risco') h = indRisco(D, kpi);
  else if (indAba === 'estrutura') h = indEstrutura(D, kpi, barras);
  else if (indAba === 'rede') h = indRede(D, kpi, barras);
  else if (indAba === 'dist') h = indDist(D, kpi, barras);
  else h = indCustos(D, fa, kpi, barras);
  $('#p-corpo').innerHTML = nav + `<div class="ind-corpo">${h}</div>`;
}
function indGeral(D, fa, kpi){
  const { base, chefias, amp, vals, pend, custo, porArea, E, dres } = D;
  const ser = base.reduce((t, s) => t + num(s.servidores), 0), com = base.reduce((t, s) => t + num(s.comissionados), 0);
  const cad = base.length ? Math.round(base.reduce((t, s) => t + cadSetor(s), 0) / base.length * 100) : 0;
  const profMax = Math.max(0, ...base.map(s => (prof.get(s.id) || 0) + 1)), ampMed = amp.length ? amp.reduce((t, x) => t + x[1], 0) / amp.length : 0;
  const ok = vals.filter(v => ['Aprovado', 'Aprovado com ressalvas'].includes(v.status)).length, risco = base.filter(emRisco).length;
  const ins = insightsInd(D, fa), IC = { alerta:'fa-circle-exclamation', atencao:'fa-triangle-exclamation', info:'fa-circle-info', ok:'fa-circle-check' };
  const idxG = porArea.length ? Math.round(porArea.reduce((t, x) => t + x.idx * x.n, 0) / Math.max(1, porArea.reduce((t, x) => t + x.n, 0))) : 0;
  const cols = [['nome','Área',0],['n','Setores',1],['ch','Chefias',1],['ser','Servidores',1],['ca','Custo anual',1],['cad','Cadastro',2],['val','Validados',2],['semResp','Sem resp.',3],['risco','Em risco',3],['pend','Valid. pend.',3],['idx','Índice',2]];
  const linhas = porArea.slice().sort((a, b) => { const k = indOrd.k, x = a[k], y = b[k]; return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : x - y) * indOrd.d; });
  const mx = {}; cols.forEach(([k]) => { mx[k] = Math.max(1, ...porArea.map(x => num(x[k]))); });
  const cel = (x, [k, , t]) => { const v = x[k];
    if (!t) return `<td class="nm"><span class="pt" style="background:${x.cor}"></span>${esc(v)}</td>`;
    const f = k === 'ca' ? (v ? fmtRc(v) : '—') : t === 2 ? Math.round(v) + (k === 'idx' ? '' : '%') : fmtN(v);
    let bg = ''; if (t === 2) { const q = v / 100; bg = `background:color-mix(in srgb,${q >= .75 ? '#16a34a' : q >= .5 ? '#eab308' : '#dc2626'} ${Math.round(12 + Math.abs(q - .5) * 40)}%,transparent)`; }
    else if (t === 3 && v) bg = `background:color-mix(in srgb,#dc2626 ${Math.round(8 + v / mx[k] * 32)}%,transparent)`;
    else if (t === 1 && v) bg = `background:linear-gradient(90deg,color-mix(in srgb,${x.cor} 18%,transparent) ${v / mx[k] * 100}%,transparent 0)`;
    return `<td style="${bg}">${f}</td>`; };
  return `<div class="ind-resumo cartao">
      <div class="ind-nota" style="--c:${idxG >= 75 ? '#16a34a' : idxG >= 50 ? '#d97706' : '#dc2626'}"><div class="anel"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" class="f"/><circle cx="18" cy="18" r="15.9" class="v" stroke-dasharray="${idxG} 100"/></svg><b>${idxG}</b></div><small>índice de maturidade</small></div>
      <div class="ind-ins"><h3><i class="fa-solid fa-lightbulb"></i>Resumo executivo${fa ? ' · ' + esc(nomeCurto(porId.get(fa))) : ''}</h3>
        ${ins.map(([t, txt, on]) => `<div class="in ${t}" ${on ? `onclick="${on()}" role="button"` : ''}><i class="fa-solid ${IC[t]}"></i><span>${txt}</span>${on ? '<i class="fa-solid fa-chevron-right vai"></i>' : ''}</div>`).join('')}
        <small class="ind-leg">Índice de maturidade (0 a 100) = 40% cadastro completo + 30% setores validados + 20% chefias com responsável + 10% setores fora de risco.</small></div>
    </div>
    <div class="kpis">
      ${kpi('#1e3a8a', 'fa-sitemap', 'Setores ativos', fmtN(base.length), `${profMax} níveis hierárquicos · ${chefias.length} chefias`, "abaInd('estrutura')")}
      ${kpi('#0891b2', 'fa-users', 'Servidores informados', fmtN(ser), ser ? `${fmtP(com * 100 / ser)} em cargos comissionados` : 'preencha o campo Servidores dos setores')}
      ${kpi('#16a34a', 'fa-school', 'Unidades escolares', fmtN(E.length), `${dres.length} DREs · ${new Set(E.map(e => e.municipio)).size} municípios`, "abaInd('rede')")}
      ${kpi('#0e7490', 'fa-diagram-project', 'Amplitude de controle', ampMed.toLocaleString('pt-BR', { maximumFractionDigits:1 }), 'setores subordinados por chefia, em média', "abaInd('estrutura')")}
      ${kpi('#2563eb', 'fa-coins', 'Custo anual (atual)', custo.Atual.a ? fmtRc(custo.Atual.a) : '—', custo.Proposto.a ? `proposto: ${fmtRc(custo.Proposto.a)} (${custo.Proposto.a >= custo.Atual.a ? '+' : ''}${fmtRs(custo.Proposto.a - custo.Atual.a)})` : `mensal ${fmtRc(custo.Atual.m)}`, "abaInd('custos')")}
      ${kpi('#d97706', 'fa-stamp', 'Validações', `${pct(ok, vals.length)}%`, `${ok} concluídas · ${pend.length} pendentes de ${vals.length}`, "trocarVista('validacoes')")}
      ${kpi('#7c3aed', 'fa-list-check', 'Cadastro completo', cad + '%', 'responsável, competências, entregas, impacto e servidores', "abaInd('estrutura')")}
      ${kpi('#dc2626', 'fa-fire', 'Setores em risco', fmtN(risco), 'impacto alto ou crítico com ponto fraco', "abaInd('risco')")}
    </div>
    <div class="cartao bl"><h3><i class="fa-solid fa-table-cells"></i>Painel por secretaria adjunta</h3><p class="s">Clique no título de uma coluna para ordenar e numa linha para filtrar a área. Verde é bom, vermelho pede atenção.</p>
      <div class="tab-wrap"><table class="tab ind-heat"><thead><tr>${cols.map(([k, n]) => `<th onclick="indOrd={k:'${k}',d:indOrd.k==='${k}'?-indOrd.d:-1};renderPainelInd()" class="${indOrd.k === k ? 'ord' : ''}">${n}${indOrd.k === k ? `<i class="fa-solid fa-caret-${indOrd.d > 0 ? 'up' : 'down'}"></i>` : ''}</th>`).join('')}</tr></thead>
      <tbody>${linhas.map(x => `<tr onclick="$('#p-area').value=${arg(x.a)};renderPainelInd()">${cols.map(c => cel(x, c)).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}
function indRisco(D, kpi){
  const { base, chefias, pend } = D;
  const cols = Object.keys(STATUS_VAL), linhas = [5, 4, 3, 2, 1, 0];
  const cel = (i, st) => base.filter(s => num(s.impacto) === i && statusVal(s.id) === st);
  const peso = (i, st) => (i >= 4 ? 2 : i === 3 ? 1 : 0) + (['Reprovado', 'Sem validação'].includes(st) ? 2 : st === 'Pendente' ? 1 : 0);
  const sel = indSel ? cel(indSel[0], indSel[1]) : base.filter(emRisco);
  const semResp = chefias.filter(s => !s.responsavel).sort((a, b) => (prof.get(a.id) || 0) - (prof.get(b.id) || 0));
  const saldo = base.map(s => [s, linhasDe(s.positivos).length, linhasDe(s.negativos).length]).filter(x => x[2] > x[1]).sort((a, b) => (b[2] - b[1]) - (a[2] - a[1]));
  const parados = pend.slice().sort((a, b) => diasDesde(b.solicitadoEm) - diasDesde(a.solicitadoEm)).slice(0, 12);
  const item = (s, dir) => `<button onclick="irPara(${arg(s.id)})"><span class="chip" style="--c:${IMPACTO[num(s.impacto)][1]}">${IMPACTO[num(s.impacto)][0]}</span><span>${esc(s.nome)}</span><small>${dir || esc(statusVal(s.id))}</small></button>`;
  return `<div class="grade2 ind-g12">
    <div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-border-all"></i>Matriz de risco: impacto × validação</h3><p class="s">Cada célula mostra quantos setores estão naquela combinação. Clique para listar. Quanto mais vermelha a célula, maior a prioridade.</p>
      <div class="ind-mat" style="grid-template-columns:110px repeat(${cols.length},1fr)"><span></span>${cols.map(c => `<span class="ch">${esc(c)}</span>`).join('')}
      ${linhas.map(i => `<span class="rh"><i style="background:${IMPACTO[i][1]}"></i>${IMPACTO[i][0]}</span>` + cols.map(st => { const n = cel(i, st).length, p = peso(i, st), on = indSel && indSel[0] === i && indSel[1] === st; return `<button class="cl p${p} ${on ? 'on' : ''} ${n ? '' : 'z'}" onclick="indSel=${on ? 'null' : `[${i},'${st}']`};renderPainelInd()">${n || ''}</button>`; }).join('')).join('')}</div></div>
    <div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-fire"></i>${indSel ? `${esc(IMPACTO[indSel[0]][0])} · ${esc(indSel[1])}` : 'Setores em risco'}</h3><p class="s">${indSel ? `${sel.length} setor(es) · <a href="#" onclick="event.preventDefault();indSel=null;renderPainelInd()">voltar aos setores em risco</a>` : 'Impacto alto ou crítico e sem validação, sem responsável ou com saldo negativo'}</p>
      <div class="pend">${sel.slice(0, 40).map(s => item(s, !s.responsavel ? 'sem responsável' : '')).join('') || '<div class="vazio">Nenhum setor aqui.</div>'}</div></div>
  </div>
  <div class="grade2">
    <div class="cartao bl" style="--c:#7c3aed"><h3><i class="fa-solid fa-user-xmark"></i>Chefias sem responsável <span class="ct">${semResp.length}</span></h3><p class="s">Ordenadas do nível mais alto para o mais baixo</p><div class="pend">${semResp.slice(0, 30).map(s => `<button onclick="irPara(${arg(s.id)})"><i class="fa-solid ${icTipo(s.tipo)}" style="color:${corTipo(s.tipo)}"></i><span>${esc(s.nome)}</span><small>${esc(nomeCurto(porId.get(areaDe.get(s.id))))}</small></button>`).join('') || '<div class="vazio">Todas as chefias têm responsável.</div>'}</div></div>
    <div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-scale-unbalanced"></i>Mais pontos negativos que positivos <span class="ct">${saldo.length}</span></h3><p class="s">Pontos de atenção registrados na aba Análise de cada setor</p><div class="pend">${saldo.slice(0, 30).map(([s, p, n]) => `<button onclick="irPara(${arg(s.id)})"><span class="chip" style="--c:#dc2626">−${n} / +${p}</span><span>${esc(s.nome)}</span></button>`).join('') || '<div class="vazio">Nenhum setor com saldo negativo.</div>'}</div></div>
  </div>
  <div class="cartao bl" style="--c:#d97706"><h3><i class="fa-solid fa-hourglass-half"></i>Validações pendentes mais antigas <span class="ct">${pend.length}</span></h3><p class="s">Quanto mais tempo parada, mais a decisão atrasa</p><div class="pend">${parados.map(v => { const s = porId.get(v.setorId), o = porId.get(v.validadorId), d = diasDesde(v.solicitadoEm); return `<button onclick="irPara(${arg(v.setorId)})"><span class="chip" style="--c:${d > 30 ? '#dc2626' : d > 15 ? '#d97706' : '#64748b'}">${d} dia(s)</span><span>${esc(s ? s.nome : '?')}</span><small>validador: ${esc(o ? nomeCurto(o) : '?')}</small></button>`; }).join('') || '<div class="vazio">Nenhuma validação pendente.</div>'}</div></div>`;
}
function indEstrutura(D, kpi, barras){
  const { base, chefias, amp } = D;
  const porTipo = Object.keys(TIPOS).map(t => [t, base.filter(s => s.tipo === t).length, TIPOS[t].cor]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
  const niveis = {}; base.forEach(s => { const n = (prof.get(s.id) || 0) + 1; niveis[n] = (niveis[n] || 0) + 1; });
  const faixas = [['1', n => n === 1, '#94a3b8'], ['2 a 3', n => n >= 2 && n <= 3, '#0891b2'], ['4 a 8', n => n >= 4 && n <= 8, '#16a34a'], ['9 a 12', n => n >= 9 && n <= 12, '#d97706'], ['mais de 12', n => n > 12, '#dc2626']];
  const altos = amp.filter(([, n]) => n > 8).sort((a, b) => b[1] - a[1]), unicos = amp.filter(([, n]) => n === 1);
  const cad = CAMPOS_CAD.map(([k, n]) => [n, pct(base.filter(s => k === 'impacto' ? num(s.impacto) > 0 : k === 'servidores' ? String(s.servidores ?? '') !== '' : String(s[k] || '').trim()).length, base.length)]);
  const status = Object.keys(STATUS_SETOR).map(k => [k, DB.setores.filter(s => (s.status || 'Ativo') === k && (!$('#p-area').value || areaDe.get(s.id) === $('#p-area').value)).length, STATUS_SETOR[k]]).filter(x => x[1]);
  return `<div class="grade2">
    <div class="cartao bl" style="--c:#7c3aed"><h3><i class="fa-solid fa-list-check"></i>Qualidade do cadastro</h3><p class="s">Percentual dos setores com cada informação preenchida</p>${cad.map(([n, v]) => `<div class="barra-l"><span class="n">${n}</span><span class="t"><span style="width:${v}%;background:${v >= 75 ? '#16a34a' : v >= 50 ? '#eab308' : '#dc2626'}"></span></span><b>${v}%</b></div>`).join('')}</div>
    <div class="cartao bl" style="--c:#0e7490"><h3><i class="fa-solid fa-diagram-project"></i>Amplitude de controle</h3><p class="s">Quantos setores cada chefia coordena diretamente. O ideal fica entre 4 e 8.</p>${barras(faixas.map(([n, f, c]) => [n + ' subordinado(s)', amp.filter(([, x]) => f(x)).length, c]))}</div>
  </div>
  <div class="grade2">
    <div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-people-arrows"></i>Chefias sobrecarregadas <span class="ct">${altos.length}</span></h3><p class="s">Mais de 8 setores diretamente subordinados: avaliar criar um nível intermediário ou redistribuir</p><div class="pend">${altos.slice(0, 20).map(([s, n]) => `<button onclick="irPara(${arg(s.id)})"><span class="chip" style="--c:#dc2626">${n}</span><span>${esc(s.nome)}</span><small>${esc(s.tipo)}</small></button>`).join('') || '<div class="vazio">Nenhuma chefia acima de 8 subordinados.</div>'}</div></div>
    <div class="cartao bl" style="--c:#64748b"><h3><i class="fa-solid fa-compress"></i>Possíveis níveis a simplificar <span class="ct">${unicos.length}</span></h3><p class="s">Chefias com apenas 1 setor subordinado: avaliar fusão ou subordinação direta</p><div class="pend">${unicos.slice(0, 20).map(([s]) => { const f = filhosDe(s.id).find(k => k.status !== 'Extinto'); return `<button onclick="irPara(${arg(s.id)})"><span class="chip" style="--c:#64748b">1</span><span>${esc(s.nome)}</span><small>→ ${esc(f ? nomeCurto(f) : '')}</small></button>`; }).join('') || '<div class="vazio">Nenhum caso.</div>'}</div></div>
  </div>
  <div class="grade2">
    <div class="cartao bl" style="--c:#2563eb"><h3><i class="fa-solid fa-shapes"></i>Setores por tipo</h3><p class="s">Composição da estrutura</p>${barras(porTipo)}</div>
    <div class="cartao bl" style="--c:#1e3a8a"><h3><i class="fa-solid fa-layer-group"></i>Setores por nível hierárquico</h3><p class="s">Nível 1 é o topo. Muitos níveis alongam a cadeia de decisão.</p>${barras(Object.keys(niveis).sort((a, b) => a - b).map(n => ['Nível ' + n, niveis[n], '#1e3a8a']))}
      <h3 style="margin-top:14px"><i class="fa-solid fa-circle-half-stroke"></i>Situação dos setores</h3>${barras(status)}</div>
  </div>`;
}
function indRede(D, kpi, barras){
  const { E, dres } = D; if (!E.length) return '<div class="cartao vazio">Sem base de escolas.</div>';
  const med = E.length / dres.length, mun = new Set(E.map(e => e.municipio)), rur = E.filter(e => e.localidade === 'RURAL').length;
  const T = ['Cívico-militar', 'Militar', 'Campo', 'Indígena', 'Quilombola', 'Integral', 'Especializada'];
  const lin = dres.map(d => { const l = E.filter(e => e.dre === d), m = new Set(l.map(e => e.municipio)), r = l.filter(e => e.localidade === 'RURAL').length, tp = {}; l.forEach(e => { const g = grupoTipo(e.tipo); tp[g] = (tp[g] || 0) + 1; if (/INTEGRAL/.test(e.tipo) && g !== 'Integral') tp.Integral = (tp.Integral || 0) + 1; }); return { d, n:l.length, m:m.size, r, pr:pct(r, l.length), em:l.length / m.size, carga:l.length / med, tp, s:setorDaDRE(d) }; }).sort((a, b) => b.n - a.n);
  const tipos = {}; E.forEach(e => { const g = grupoTipo(e.tipo); tipos[g] = (tipos[g] || 0) + 1; });
  const munT = [...mun].map(m => [m, E.filter(e => e.municipio === m).length]).sort((a, b) => b[1] - a[1]);
  const mx = Math.max(...lin.map(x => x.n)), umaEsc = munT.filter(x => x[1] === 1).length;
  return `<div class="kpis">
      ${kpi('#16a34a', 'fa-school', 'Unidades escolares', fmtN(E.length), 'base geolocalizada da SEDUC', "trocarVista('escolas')")}
      ${kpi('#7c3aed', 'fa-children', 'Alunos', fmtN(alunosDe(E)), `média de ${fmtN(Math.round(alunosDe(E) / Math.max(1, E.filter(e => num(e.alunos)).length)))} por escola`, "mt.modo='alunos';store.set('gaborg_mt_modo','alunos');trocarVista('escolas')")}
      ${kpi('#2563eb', 'fa-building-flag', 'DREs', dres.length, `média de ${Math.round(med)} escolas por DRE`)}
      ${kpi('#0891b2', 'fa-city', 'Municípios atendidos', mun.size, `${umaEsc} com uma única escola estadual`)}
      ${kpi('#65a30d', 'fa-tree', 'Escolas rurais', fmtN(rur), `${pct(rur, E.length)}% da rede · ${fmtN(E.length - rur)} urbanas`)}
      ${kpi('#c2410c', 'fa-feather', 'Indígenas e quilombolas', fmtN((tipos['Indígena'] || 0) + (tipos.Quilombola || 0)), `${tipos['Indígena'] || 0} indígenas · ${tipos.Quilombola || 0} quilombolas`)}
      ${kpi('#0f766e', 'fa-shield-halved', 'Cívico-militares e militares', fmtN((tipos['Cívico-militar'] || 0) + (tipos.Militar || 0)), `${tipos['Cívico-militar'] || 0} cívico-militares · ${tipos.Militar || 0} militares`)}
    </div>
    <div class="cartao bl" style="--c:#16a34a"><h3><i class="fa-solid fa-building-flag"></i>Carga de cada DRE</h3><p class="s">Escolas e municípios sob cada Diretoria Regional. O índice de carga compara com a média (1,0 = média). Clique para ver no mapa.</p>
      <div class="tab-wrap"><table class="tab ind-heat ind-dre"><thead><tr><th>DRE</th><th>Escolas</th><th>Alunos</th><th>Alunos/escola</th><th>Carga</th><th>Municípios</th><th>Escolas/mun.</th><th>Rurais</th>${T.map(t => `<th>${t}</th>`).join('')}<th></th></tr></thead><tbody>
      ${lin.map(x => `<tr onclick="trocarVista('escolas');setTimeout(()=>focarDREmt(${dres.indexOf(x.d)}),400)"><td class="nm"><span class="pt" style="background:${corDRE(dres, x.d)}"></span>${esc(nomeDRE(x.d))}</td>
        <td style="background:linear-gradient(90deg,color-mix(in srgb,${corDRE(dres, x.d)} 22%,transparent) ${x.n / mx * 100}%,transparent 0)"><b>${x.n}</b></td>
        <td>${fmtN(alunosDe(E.filter(e => e.dre === x.d)))}</td><td>${fmtN(Math.round(alunosDe(E.filter(e => e.dre === x.d)) / Math.max(1, x.n)))}</td>
        <td><span class="chip" style="--c:${x.carga > 1.5 ? '#dc2626' : x.carga > 1.15 ? '#d97706' : x.carga < .6 ? '#64748b' : '#16a34a'}">${x.carga.toLocaleString('pt-BR', { maximumFractionDigits:2 })}</span></td>
        <td>${x.m}</td><td>${x.em.toLocaleString('pt-BR', { maximumFractionDigits:1 })}</td><td>${x.r} <small>(${x.pr}%)</small></td>${T.map(t => `<td>${x.tp[t] || '<span style="color:var(--mut2)">—</span>'}</td>`).join('')}
        <td onclick="event.stopPropagation()">${x.s ? `<button class="btn btn-g btn-sm btn-i" title="Ver no organograma" onclick="trocarVista('mapa');setTimeout(()=>irPara(${arg(x.s.id)}),60)"><i class="fa-solid fa-sitemap"></i></button>` : ''}</td></tr>`).join('')}
      </tbody><tfoot><tr><td><b>Total</b></td><td><b>${E.length}</b></td><td><b>${fmtN(alunosDe(E))}</b></td><td>${fmtN(Math.round(alunosDe(E) / Math.max(1, E.length)))}</td><td></td><td>${mun.size}</td><td>${(E.length / mun.size).toLocaleString('pt-BR', { maximumFractionDigits:1 })}</td><td>${rur} <small>(${pct(rur, E.length)}%)</small></td>${T.map(t => `<td>${lin.reduce((a, x) => a + (x.tp[t] || 0), 0)}</td>`).join('')}<td></td></tr></tfoot></table></div></div>
    <div class="grade2">
      <div class="cartao bl" style="--c:#2563eb"><h3><i class="fa-solid fa-shapes"></i>Escolas por tipo</h3><p class="s">Classificação da base</p>${barras(Object.entries(tipos).sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, n, CORES_TIPO[k] || '#94a3b8', '', '', iconeTipoSVG(k, CORES_TIPO[k], 13) + ' ']))}</div>
      <div class="cartao bl" style="--c:#0891b2"><h3><i class="fa-solid fa-city"></i>Municípios com mais escolas</h3><p class="s">Onde a rede estadual se concentra</p>${barras(munT.slice(0, 10).map(([m, n]) => [m, n, '#0891b2']))}</div>
    </div>
    <div class="grade2">
      <div class="cartao bl" style="--c:#7c3aed"><h3><i class="fa-solid fa-children"></i>Alunos por tipo de escola</h3><p class="s">Matrículas ${new Date().getFullYear()} da base de escolas</p>${barras(Object.keys(tipos).map(k => [k, alunosDe(E.filter(e => grupoTipo(e.tipo) === k))]).sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, n, CORES_TIPO[k] || '#94a3b8', '', '', iconeTipoSVG(k, CORES_TIPO[k], 13) + ' ']))}</div>
      <div class="cartao bl" style="--c:#4f46e5"><h3><i class="fa-solid fa-ranking-star"></i>Escolas com mais alunos</h3><p class="s">As 10 maiores da rede · clique para ver no mapa</p>${barras(E.slice().sort((a, b) => num(b.alunos) - num(a.alunos)).slice(0, 10).map(e => [e.nome + ' · ' + e.municipio, num(e.alunos), '#4f46e5', `trocarVista('escolas');setTimeout(()=>irEscolaMT(${arg(e.codigo)}),500)`]))}</div>
    </div>
    <div class="cartao bl" style="--c:#0ea5e9"><h3><i class="fa-solid fa-chart-column"></i>Tamanho das escolas</h3><p class="s">Quantas escolas em cada faixa de alunos</p>${barras(FAIXAS_ALUNOS.map(f => [f[1], E.filter(e => num(e.alunos) && faixaAlunos(num(e.alunos)) === f).length, f[2]]))}</div>`;
}
function indCustos(D, fa, kpi, barras){
  const { custo, porArea } = D;
  const dga = new Map(); DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual' && (!fa || D.ids.has(d.setorId))).forEach(d => { const c = calcDesp(d), k = c.r.codigo || c.categoria; if (!/^DGA|^FG|^DAS/i.test(k)) return; const o = dga.get(k) || { q:0, m:0 }; o.q += c.qtd; o.m += c.mensal; dga.set(k, o); });
  const dgaL = [...dga.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'pt-BR', { numeric:true }));
  const props = (DB.propostas || []).map(p => { try { const x = diffCenarios('', p.id), c = t => x.est.filter(e => e.tipo === t).length; return { p, aA:x.aA, aB:x.aB, d:x.aB - x.aA, novo:c('novo') + c('reativado'), ext:c('extinto'), mov:c('movido'), ren:c('renomeado') + c('tipo'), ed:c('editado') }; } catch (e) { return null; } }).filter(Boolean);
  const dif = custo.Proposto.a - custo.Atual.a, porSer = (() => { const s = D.base.reduce((t, x) => t + num(x.servidores), 0); return s ? custo.Atual.a / s : 0; })();
  return `<div class="kpis">
      ${kpi('#2563eb', 'fa-calendar', 'Custo anual atual', custo.Atual.a ? fmtRc(custo.Atual.a) : '—', `mensal ${fmtRc(custo.Atual.m)}`, "trocarVista('financeiro')")}
      ${kpi('#7c3aed', 'fa-lightbulb', 'Custo anual proposto', custo.Proposto.a ? fmtRc(custo.Proposto.a) : '—', 'lançamentos marcados como Proposto')}
      ${kpi(dif > 0 ? '#dc2626' : '#16a34a', dif > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down', 'Diferença anual', custo.Proposto.a ? (dif > 0 ? '+' : '') + fmtRs(dif) : '—', custo.Atual.a && custo.Proposto.a ? fmtP(dif / custo.Atual.a * 100) + ' sobre o atual' : 'proposto − atual')}
      ${kpi('#0891b2', 'fa-user-tie', 'Custo por servidor/ano', porSer ? fmtRc(porSer) : '—', 'custo atual ÷ servidores informados')}
      ${kpi('#0e7490', 'fa-scale-balanced', 'Propostas', props.length, props.length ? `${props.filter(x => x.d < 0).length} reduzem e ${props.filter(x => x.d > 0).length} aumentam o custo` : 'nenhuma proposta criada', "trocarVista('propostas')")}
    </div>
    ${props.length ? `<div class="cartao bl" style="--c:#7c3aed"><h3><i class="fa-solid fa-code-compare"></i>Propostas em comparação com a estrutura atual</h3><p class="s">Efeito de cada cenário na estrutura e no custo anual. Clique para abrir o comparativo.</p>
      <div class="tab-wrap"><table class="tab ind-heat"><thead><tr><th>Proposta</th><th>Situação</th><th>Novos</th><th>Extintos</th><th>Movidos</th><th>Renomeados</th><th>Editados</th><th>Custo anual</th><th>Diferença</th></tr></thead><tbody>
      ${props.sort((a, b) => a.d - b.d).map(x => `<tr onclick="abrirComparativo('',${arg(x.p.id)})"><td class="nm"><b>${esc(x.p.nome)}</b></td><td>${esc(x.p.status || '—')}</td><td>${x.novo || '—'}</td><td>${x.ext || '—'}</td><td>${x.mov || '—'}</td><td>${x.ren || '—'}</td><td>${x.ed || '—'}</td><td>${fmtRc(x.aB)}</td><td><span class="chip" style="--c:${x.d > 0 ? '#dc2626' : x.d < 0 ? '#16a34a' : '#64748b'}">${x.d > 0 ? '+' : ''}${fmtRs(x.d)}${x.aA ? ` (${fmtP(x.d / x.aA * 100)})` : ''}</span></td></tr>`).join('')}</tbody></table></div></div>` : ''}
    <div class="grade2">
      <div class="cartao bl" style="--c:#2563eb"><h3><i class="fa-solid fa-building-columns"></i>Custo anual por área</h3><p class="s">Lançamentos atuais do Financeiro</p>${porArea.some(x => x.ca) ? barras(porArea.slice().sort((a, b) => b.ca - a.ca).map(x => [x.nome, x.ca, x.cor, `$('#p-area').value=${arg(x.a)};renderPainelInd()`]), fmtRc) : '<div class="vazio">Sem lançamentos no Financeiro.</div>'}</div>
      <div class="cartao bl" style="--c:#7c3aed"><h3><i class="fa-solid fa-id-badge"></i>Cargos em comissão e funções</h3><p class="s">Quantidade e custo mensal por símbolo (DGA, FG...)</p>${dgaL.length ? `<div class="tab-wrap"><table class="tab"><thead><tr><th>Símbolo</th><th>Qtd.</th><th>Custo mensal</th></tr></thead><tbody>${dgaL.map(([k, o]) => `<tr><td><b>${esc(k)}</b></td><td>${o.q.toLocaleString('pt-BR')}</td><td>${fmtM0(o.m)}</td></tr>`).join('')}</tbody><tfoot><tr><td><b>Total</b></td><td><b>${dgaL.reduce((t, x) => t + x[1].q, 0).toLocaleString('pt-BR')}</b></td><td><b>${fmtM0(dgaL.reduce((t, x) => t + x[1].m, 0))}</b></td></tr></tfoot></table></div>` : '<div class="vazio">Nenhum cargo lançado. No Financeiro, use "Aplicar cargos das chefias".</div>'}</div>
    </div>`;
}
let indDistDRE = '';
function indDist(D, kpi, barras){
  const X = distanciasMT(), dres = X.dres, L = X.lista.filter(o => !indDistDRE || o.e.dre === indDistDRE);
  if (!L.length) return '<div class="cartao vazio">Sem base de escolas.</div>';
  const kms = L.map(o => o.km).sort((a, b) => a - b), med = kms.reduce((a, b) => a + b, 0) / kms.length, mediana = kms[Math.floor(kms.length / 2)], max = L.reduce((a, o) => o.km > a.km ? o : a, L[0]);
  const acima = k => L.filter(o => o.km > k).length, longe = L.slice().sort((a, b) => b.km - a.km).slice(0, 25);
  const realinhar = L.filter(o => o.prox && o.km - o.prox.km >= 40 && o.prox.km < o.km * .7).sort((a, b) => (b.km - b.prox.km) - (a.km - a.prox.km));
  const porDRE = dres.map(d => { const l = X.lista.filter(o => o.e.dre === d), k = l.map(o => o.km).sort((a, b) => a - b), mx = l.reduce((a, o) => o.km > a.km ? o : a, l[0]);
    return { d, n:l.length, med:k.reduce((a, b) => a + b, 0) / k.length, mediana:k[Math.floor(k.length / 2)], mx, p100:pct(l.filter(o => o.km > 100).length, l.length), tot:k.reduce((a, b) => a + b, 0) * 2 * FATOR_ESTRADA, fx:FAIXAS_DIST.map(f => l.filter(o => faixaDist(o.km) === f).length), mesma:l.filter(o => o.km <= 10).length }; }).sort((a, b) => b.med - a.med);
  const mxMed = Math.max(...porDRE.map(x => x.med));
  const opt = `<select class="campo" style="width:auto;height:34px" onchange="indDistDRE=this.value;renderPainelInd()"><option value="">Todas as DREs</option>${dres.map(d => `<option value="${esc(d)}" ${d === indDistDRE ? 'selected' : ''}>${esc(nomeDRE(d))}</option>`).join('')}</select>`;
  const linhaEsc = (o, extra) => `<tr onclick="verEscolaNoMapa(${arg(o.e.codigo)})"><td class="nm"><b>${esc(o.e.nome)}</b><small style="display:block;color:var(--mut)">${esc(o.e.municipio)} · ${o.e.localidade === 'RURAL' ? 'rural' : 'urbana'}</small></td><td><span class="pt" style="background:${corDRE(dres, o.e.dre)}"></span>${esc(nomeDRE(o.e.dre))}</td>
    <td><span class="chip" style="--c:${faixaDist(o.km)[2]}">${fmtKm(o.km)}</span></td><td>~${fmtKm(o.km * FATOR_ESTRADA)}</td><td>~${fmtHoras(o.km)}</td>${extra || ''}
    <td onclick="event.stopPropagation()"><a class="btn btn-g btn-sm btn-i" href="${rotaDRE(o.e)}" target="_blank" rel="noopener" title="Rota real pelo Google Maps, saindo da sede da DRE"><i class="fa-solid fa-route"></i></a></td></tr>`;
  return `<div class="ind-filtro"><span><i class="fa-solid fa-filter"></i>Ver</span>${opt}<button class="btn btn-s btn-sm" onclick="trocarVista('escolas');setTimeout(()=>{modoMT('distancia');${indDistDRE ? `focarDREmt(${dres.indexOf(indDistDRE)})` : ''}},400)"><i class="fa-solid fa-map-location-dot"></i>Ver no mapa</button><button class="btn btn-s btn-sm" onclick="exportarDistancias()"><i class="fa-solid fa-file-csv"></i>Exportar distâncias</button></div>
    <div class="kpis">
      ${kpi('#2563eb', 'fa-ruler', 'Distância média', fmtKm(med), `mediana ${fmtKm(mediana)} · em linha reta até a sede da DRE`)}
      ${kpi('#0e7490', 'fa-road', 'Média por estrada (estimada)', '~' + fmtKm(med * FATOR_ESTRADA), `~${fmtHoras(med)} de viagem, só ida`)}
      ${kpi('#dc2626', 'fa-location-crosshairs', 'Escola mais distante', fmtKm(max.km), `${esc(max.e.nome)} (${esc(max.e.municipio)})`, `verEscolaNoMapa(${arg(max.e.codigo)})`)}
      ${kpi('#f97316', 'fa-arrows-left-right-to-line', 'A mais de 100 km', fmtN(acima(100)), `${pct(acima(100), L.length)}% das escolas · ${acima(200)} a mais de 200 km`)}
      ${kpi('#16a34a', 'fa-house-flag', 'Até 10 km da sede', fmtN(L.filter(o => o.km <= 10).length), `${pct(L.filter(o => o.km <= 10).length, L.length)}% · praticamente na cidade da DRE`)}
      ${kpi('#7c3aed', 'fa-shuffle', 'Mais perto de outra DRE', fmtN(realinhar.length), 'pelo menos 40 km mais perto da sede de outra DRE')}
    </div>
    <div class="grade2">
      <div class="cartao bl" style="--c:#f97316"><h3><i class="fa-solid fa-chart-bar"></i>Escolas por faixa de distância</h3><p class="s">Distância em linha reta até a sede da DRE a que a escola é subordinada</p>${barras(FAIXAS_DIST.map(f => [f[1], L.filter(o => faixaDist(o.km) === f).length, f[2]]))}</div>
      <div class="cartao bl" style="--c:#2563eb"><h3><i class="fa-solid fa-building-flag"></i>Distância média por DRE</h3><p class="s">DREs com média alta têm mais custo e tempo de deslocamento para acompanhar as escolas</p>${barras(porDRE.map(x => [nomeDRE(x.d), Math.round(x.med), corDRE(dres, x.d), `indDistDRE=${arg(x.d)};renderPainelInd()`]), v => v + ' km')}</div>
    </div>
    <div class="cartao bl" style="--c:#0e7490"><h3><i class="fa-solid fa-table"></i>Quadro de distâncias por DRE</h3><p class="s">A barra mostra como as escolas de cada DRE se distribuem nas faixas de distância. "Circuito" é a soma de ida e volta, por estrada (estimada), para visitar cada escola uma vez.</p>
      <div class="tab-wrap"><table class="tab ind-heat"><thead><tr><th>DRE</th><th>Escolas</th><th>Média</th><th>Mediana</th><th>Mais distante</th><th>&gt; 100 km</th><th style="min-width:200px">Distribuição</th><th>Circuito</th></tr></thead><tbody>
      ${porDRE.map(x => `<tr onclick="indDistDRE=${arg(x.d)};renderPainelInd()" class="${indDistDRE === x.d ? 'sel' : ''}"><td class="nm"><span class="pt" style="background:${corDRE(dres, x.d)}"></span>${esc(nomeDRE(x.d))}</td><td>${x.n}</td>
        <td style="background:linear-gradient(90deg,color-mix(in srgb,${faixaDist(x.med)[2]} 22%,transparent) ${x.med / mxMed * 100}%,transparent 0)"><b>${fmtKm(x.med)}</b></td><td>${fmtKm(x.mediana)}</td>
        <td title="${esc(x.mx.e.nome)}">${fmtKm(x.mx.km)} <small style="color:var(--mut)">${esc(x.mx.e.municipio)}</small></td><td>${x.p100 ? `<span class="chip" style="--c:${x.p100 > 40 ? '#dc2626' : x.p100 > 15 ? '#f97316' : '#64748b'}">${x.p100}%</span>` : '—'}</td>
        <td><div class="ind-fx">${x.fx.map((n, i) => n ? `<span style="flex:${n};background:${FAIXAS_DIST[i][2]}" title="${FAIXAS_DIST[i][1]}: ${n}"></span>` : '').join('')}</div></td><td>~${Math.round(x.tot).toLocaleString('pt-BR')} km</td></tr>`).join('')}
      </tbody></table></div>
      <div class="ind-fx-leg">${FAIXAS_DIST.map(f => `<span><i style="background:${f[2]}"></i>${f[1]}</span>`).join('')}</div></div>
    <div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-location-crosshairs"></i>Escolas mais distantes da sua DRE${indDistDRE ? ' · ' + esc(nomeDRE(indDistDRE)) : ''}</h3><p class="s">Clique para ver no mapa. O botão de rota abre o trajeto real no Google Maps, saindo da sede da DRE.</p>
      <div class="tab-wrap"><table class="tab ind-heat"><thead><tr><th>Escola</th><th>DRE</th><th>Linha reta</th><th>Estrada (est.)</th><th>Tempo (est.)</th><th></th></tr></thead><tbody>${longe.map(o => linhaEsc(o)).join('')}</tbody></table></div></div>
    ${realinhar.length ? `<div class="cartao bl" style="--c:#7c3aed"><h3><i class="fa-solid fa-shuffle"></i>Escolas mais perto da sede de outra DRE <span class="ct">${realinhar.length}</span></h3><p class="s">A sede de outra DRE fica pelo menos 40 km mais perto. Pode valer avaliar o acompanhamento compartilhado ou uma nova subordinação; confira a rota real antes de decidir.</p>
      <div class="tab-wrap"><table class="tab ind-heat"><thead><tr><th>Escola</th><th>DRE atual</th><th>Até a DRE atual</th><th>Estrada (est.)</th><th>Tempo (est.)</th><th>DRE mais próxima</th><th>Ganho</th><th></th></tr></thead><tbody>
      ${realinhar.slice(0, 40).map(o => linhaEsc(o, `<td><span class="pt" style="background:${corDRE(dres, o.prox.dre)}"></span>${esc(nomeDRE(o.prox.dre))} · ${fmtKm(o.prox.km)}</td><td><span class="chip" style="--c:#16a34a">−${fmtKm(o.km - o.prox.km)}</span></td>`)).join('')}</tbody></table></div></div>` : ''}
    <p class="ind-nota-rodape"><i class="fa-solid fa-circle-info"></i>As distâncias são calculadas em linha reta entre as coordenadas da escola e a sede da DRE (o ponto central das escolas urbanas da cidade-sede). A distância por estrada e o tempo são estimativas (${String(FATOR_ESTRADA).replace('.', ',')} × a linha reta, a ${VEL_MEDIA} km/h). Para o trajeto exato, use o botão de rota.</p>`;
}
function verEscolaNoMapa(cod){ trocarVista('escolas'); setTimeout(() => irEscolaMT(cod), 500); }
function exportarDistancias(){
  const X = distanciasMT(), q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', n = v => String(Math.round(v * 10) / 10).replace('.', ',');
  const L = [['Código', 'Escola', 'Município', 'Localidade', 'DRE', 'Distância em linha reta (km)', 'Distância por estrada estimada (km)', 'Tempo estimado', 'DRE mais próxima (outra)', 'Distância até ela (km)', 'Rota no Google Maps']];
  X.lista.slice().sort((a, b) => a.e.dre.localeCompare(b.e.dre) || b.km - a.km).forEach(o => L.push([o.e.codigo, o.e.nome, o.e.municipio, o.e.localidade, o.e.dre, n(o.km), n(o.km * FATOR_ESTRADA), fmtHoras(o.km), o.prox ? o.prox.dre : '', o.prox ? n(o.prox.km) : '', rotaDRE(o.e)]));
  baixarArquivo('gaborg-distancias-escolas-dre-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + L.map(r => r.map(q).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
}
function exportarIndicadores(){
  const fa = $('#p-area').value, D = dadosInd(fa), q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', L = [];
  L.push(['Painel por secretaria adjunta']); L.push(['Área', 'Setores', 'Chefias', 'Servidores', 'Comissionados', 'Custo anual', 'Cadastro %', 'Validados %', 'Chefias sem responsável', 'Setores em risco', 'Validações pendentes', 'Índice de maturidade']);
  D.porArea.forEach(x => L.push([x.nome, x.n, x.ch, x.ser, x.com, Math.round(x.ca), Math.round(x.cad), x.val, x.semResp, x.risco, x.pend, x.idx]));
  L.push([]); L.push(['Rede escolar por DRE']); L.push(['DRE', 'Escolas', 'Municípios', 'Rurais', 'Urbanas']);
  D.dres.forEach(d => { const l = D.E.filter(e => e.dre === d); L.push([d, l.length, new Set(l.map(e => e.municipio)).size, l.filter(e => e.localidade === 'RURAL').length, l.filter(e => e.localidade !== 'RURAL').length]); });
  L.push(['Total', D.E.length, new Set(D.E.map(e => e.municipio)).size]);
  L.push([]); L.push(['Setores em risco']); L.push(['Setor', 'Impacto', 'Validação', 'Responsável']);
  D.base.filter(emRisco).forEach(s => L.push([s.nome, IMPACTO[num(s.impacto)][0], statusVal(s.id), s.responsavel || '(sem)']));
  baixarArquivo('gaborg-indicadores-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + L.map(r => r.map(q).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
}

/* Validações (todas) */
function renderValidacoes(){
  opcoesFiltro('#v-status', 'Todas as situações', Object.keys(STATUS_VAL).filter(x => x !== 'Sem validação').map(t => [t, t]));
  const usados = [...new Set(DB.validacoes.map(v => v.validadorId))].filter(i => porId.has(i)).sort((a, b) => porId.get(a).nome.localeCompare(porId.get(b).nome, 'pt-BR'));
  opcoesFiltro('#v-validador', 'Todos os validadores', usados.map(i => [i, porId.get(i).nome]));
  const q = norm($('#v-busca').value), fs = $('#v-status').value, fv = $('#v-validador').value;
  const l = DB.validacoes.filter(v => (!fs || (v.status || 'Pendente') === fs) && (!fv || v.validadorId === fv) && (!q || norm([(porId.get(v.setorId) || {}).nome, (porId.get(v.validadorId) || {}).nome, v.parecer].join(' ')).includes(q)))
    .sort((a, b) => ((a.status || 'Pendente') === 'Pendente' ? 0 : 1) - ((b.status || 'Pendente') === 'Pendente' ? 0 : 1) || Date.parse(b.solicitadoEm || 0) - Date.parse(a.solicitadoEm || 0));
  $('#v-corpo').innerHTML = l.length ? `<div class="tab-wrap"><table class="tab"><thead><tr><th>Setor avaliado</th><th>Setor validador</th><th>Situação</th><th>Parecer</th><th>Pedida em</th></tr></thead><tbody>${l.map(v => { const s = porId.get(v.setorId), o = porId.get(v.validadorId); return `<tr>
    <td onclick="irPara(${arg(v.setorId)})"><b>${esc(s ? s.nome : '?')}</b></td><td>${esc(o ? o.nome : '?')}</td>
    <td onclick="event.stopPropagation()"><select class="campo" style="height:32px;min-width:190px" onchange="editarValidacao(${arg(v.id)},'status',this.value)">${Object.keys(STATUS_VAL).filter(x => x !== 'Sem validação').map(x => `<option ${x === (v.status || 'Pendente') ? 'selected' : ''}>${x}</option>`).join('')}</select></td>
    <td onclick="event.stopPropagation()" style="white-space:normal;min-width:240px"><input class="campo" style="height:32px" value="${esc(v.parecer)}" placeholder="Parecer" onchange="editarValidacao(${arg(v.id)},'parecer',this.value)"></td>
    <td>${fmtData(v.solicitadoEm)}</td></tr>`; }).join('')}</tbody></table></div>`
    : `<div class="cartao vazio" style="padding:40px"><i class="fa-solid fa-stamp"></i>Nenhuma validação ${DB.validacoes.length ? 'com esses filtros' : 'pedida ainda'}.<br><span style="font-size:12.5px">Abra um setor no mapa e use a aba <b>Validações</b> para pedir a outro setor que valide sua estrutura.</span></div>`;
}

/* Configurações */
function renderConfig(){
  $('#c-corpo').innerHTML = cartaoAparencia() + `
    <div class="cartao bl"><h3><i class="fa-solid fa-cloud"></i>Conexão com a planilha</h3>
      <p class="s">Situação: <b>${online() ? 'conectado ao Apps Script' : 'desconectado'}</b>${online() && fila.length ? ` · ${fila.length} alteração(ões) aguardando envio` : ''}${ultimoErro ? ` · <span style="color:var(--perigo)">${esc(ultimoErro)}</span>` : ''}</p>
      <p class="s">Conectado como <b>${esc(cfg.usuario)}</b> (${esc(cfg.login)}) · perfil <b>${esc(cfg.perfil || '—')}</b>${sessao.lembrado() ? ' · sessão mantida neste computador' : ''}</p>
      <label><span class="rot">Endereço do Apps Script (Web App)</span><input id="c-url" class="campo" value="${esc(cfg.url)}" ${ehAdmin() ? '' : 'readonly'} placeholder="https://script.google.com/macros/s/.../exec"></label>
      <div class="acoes"><button class="btn btn-s" onclick="testarConexao()"><i class="fa-solid fa-signal"></i>Testar</button>${ehAdmin() ? `<button class="btn btn-s" onclick="salvarUrl()"><i class="fa-solid fa-floppy-disk"></i>Salvar endereço</button>` : ''}${online() ? `<button class="btn btn-s" onclick="recarregarNuvem()"><i class="fa-solid fa-cloud-arrow-down"></i>Baixar da planilha</button>${ehAdmin() ? `<button class="btn btn-s" onclick="enviarTudo()"><i class="fa-solid fa-cloud-arrow-up"></i>Enviar tudo para a planilha</button>` : ''}` : ''}<button class="btn btn-s" onclick="modalTrocarSenha(false)"><i class="fa-solid fa-key"></i>Alterar minha senha</button></div>
    </div>
    <div class="cartao bl"><h3><i class="fa-solid fa-mobile-screen-button"></i>GABOrg como aplicativo</h3>
      <p class="s">${rodandoComoApp() ? 'Você está usando o GABOrg instalado como app.' : 'Instale o GABOrg no computador ou no celular: ele ganha ícone próprio e abre em tela cheia, sem a barra do navegador. Os dados continuam na planilha.'}</p>
      ${rodandoComoApp() ? '' : `<div class="acoes"><button class="btn btn-p" onclick="instalarApp()"><i class="fa-solid fa-download"></i>Instalar o GABOrg</button></div>
      <p class="s" style="font-size:12px">Android/Chrome/Edge: botão acima ou menu do navegador › <b>Instalar app</b>. iPhone/iPad: Safari › <b>Compartilhar</b> › <b>Adicionar à Tela de Início</b>. É preciso abrir pelo endereço publicado (GitHub Pages), não pelo arquivo.</p>`}
    </div>
    <div class="cartao bl so-adm"><h3><i class="fa-solid fa-file-code"></i>Como instalar ou atualizar o backend</h3>
      <ol class="passos">
        <li>Na planilha, abra <b>Extensões › Apps Script</b>, apague o conteúdo e cole o arquivo <code>Codigo.gs</code>. Salve.</li>
        <li>Execute a função <code>configurarGABOrg</code> uma vez e autorize. Ela cria as abas e o usuário <b>admin</b> com uma <b>senha provisória</b> (mostrada na planilha).</li>
        <li><b>Implantar › Nova implantação › App da Web</b>, executar como <b>Eu</b> e acesso <b>Qualquer pessoa</b>. Para atualizar sem mudar o endereço: <b>Gerenciar implantações › Editar › Nova versão</b>.</li>
        <li>Entre com <b>admin</b> e a senha provisória, defina a sua senha e cadastre as outras pessoas em <b>Usuários</b>.</li>
        <li>Esqueceu a senha do único administrador? Na planilha, use o menu <b>GABOrg › Redefinir senha de um usuário</b>.</li>
      </ol>
    </div>
    <div class="cartao bl"><h3><i class="fa-solid fa-box-archive"></i>Cópias e restauração</h3>
      <p class="s">${DB.setores.length} setores · ${DB.validacoes.length} validações · ${DB.vinculos.length} vínculos · ${DB.historico.length} registros de histórico</p>
      <div class="acoes">
        <button class="btn btn-s" onclick="exportarJSON()"><i class="fa-solid fa-download"></i>Exportar cópia (JSON)</button>
        <label class="btn btn-s so-adm"><i class="fa-solid fa-upload"></i>Importar cópia<input type="file" accept=".json,application/json" class="sr" onchange="importarJSON(this.files[0])"></label>
        <button class="btn btn-s" onclick="exportarCSV()"><i class="fa-solid fa-file-csv"></i>Exportar setores (CSV)</button>
        <button class="btn btn-perigo so-adm" onclick="restaurarDecreto()"><i class="fa-solid fa-rotate-left"></i>Restaurar estrutura do decreto</button>
      </div>
    </div>
    <p style="font-size:11.5px;color:var(--mut)">GABOrg v${VERSAO} · estrutura de referência: Decreto nº 2.236, de 27 de agosto de 2026 (vigência 01/09/2026). A hierarquia foi lida do organograma anexo: confira as subordinações e ajuste no mapa quando necessário.</p>`;
}
async function salvarUrl(){
  const url = $('#c-url').value.trim();
  if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) return toast('Informe o endereço do Web App do Apps Script.', 'aviso');
  if (url === cfg.url) return toast('O endereço não mudou.');
  if (!await confirmar('Trocar endereço', 'Ao trocar o endereço do Apps Script, você precisará entrar de novo com usuário e senha cadastrados naquela planilha.', 'Trocar e sair')) return;
  cfg.url = url; salvarCfg(); sessao.set(''); cfg.token = ''; location.reload();
}
async function testarConexao(){
  const url = ($('#c-url') && $('#c-url').value.trim()) || cfg.url; if (!url) return toast('Informe o endereço.', 'aviso');
  const t0 = performance.now();
  try { const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'action=ping').then(x => x.text()).then(JSON.parse); toast(`Apps Script respondeu em ${Math.round(performance.now() - t0)} ms (GABOrg backend v${r.versao || '?'}).`); }
  catch (e) { toast('Não foi possível falar com o Apps Script.', 'erro'); }
}
async function recarregarNuvem(){
  if (fila.length && !await confirmar('Baixar da planilha', `${fila.length} alteração(ões) ainda não foram enviadas. Elas continuam guardadas e serão reaplicadas.`, 'Baixar')) return;
  try { await lerNuvem(); redesenharTudo(); toast('Dados atualizados.'); } catch (e) { toast(e.message, 'erro'); }
}
async function enviarTudo(){
  if (!await confirmar('Enviar tudo para a planilha', 'A planilha será substituída pelos dados desta tela (setores, validações, vínculos e histórico). Continuar?', 'Substituir planilha', true)) return;
  try { const r = await chamar({ action:'replace_all', dados:DB }, 120000); if (r.status !== 'success') throw new Error(r.message); fila = []; store.set('gaborg_fila', fila); versaoNuvem = String(r.versao || ''); toast('Planilha substituída.'); } catch (e) { toast(e.message, 'erro'); }
  statusSync(); renderConfig();
}
function baixarArquivo(nome, conteudo, tipo){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([conteudo], { type:tipo })); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
function exportarJSON(){ if (cenSwap) { desaplicarCenario(); setTimeout(aplicarCenario, 0); } baixarArquivo(`gaborg_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ sistema:'GABOrg', versao:VERSAO, exportadoEm:agora(), dados:DB }, null, 1), 'application/json'); }
async function importarJSON(f){
  if (cenMapa) sairCenario();
  if (!f) return;
  try {
    const j = JSON.parse(await f.text()), d = j.dados || j;
    if (!Array.isArray(d.setores)) throw new Error('Arquivo sem a lista de setores.');
    if (!await confirmar('Importar cópia', `Substituir a estrutura atual pelos <b>${d.setores.length}</b> setores do arquivo?${online() ? ' A planilha também será substituída.' : ''}`, 'Importar', true)) return;
    TABS_DB.forEach(t => DB[t] = (d[t] || []).map(x => novoReg(t, x)));
    redesenharTudo(); salvarLocal();
    if (online()) { const r = await chamar({ action:'replace_all', dados:DB }, 120000); if (r.status !== 'success') throw new Error(r.message); versaoNuvem = String(r.versao || ''); }
    toast('Cópia importada.');
  } catch (e) { toast('Falha ao importar: ' + e.message, 'erro'); }
}
function exportarCSV(){
  const q = v => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' | ')}"`;
  const cab = ['ID','Nome','Sigla','Tipo','Setor superior','Caminho','Área','Situação','Responsável','Contato','Competências','Entregas','Orçamento anual','Custo mensal','Servidores','Comissionados','Impacto','Descrição do impacto','Pontos positivos','Pontos negativos','Validação'];
  const ordenados = []; const visit = s => { ordenados.push(s); filhosDe(s.id).forEach(visit); }; raizes().forEach(visit);
  const linhas = ordenados.map(s => [s.id, s.nome, s.sigla, s.tipo, (porId.get(s.paiId) || {}).nome || '', caminho(s.id).map(a => a.nome).concat(s.nome).join(' > '), nomeCurto(porId.get(areaDe.get(s.id))), s.status, s.responsavel, s.contato, s.competencias, s.entregas, s.orcamento, s.custoMensal, s.servidores, s.comissionados, num(s.impacto) ? IMPACTO[num(s.impacto)][0] : '', s.impactoDescricao, s.positivos, s.negativos, statusVal(s.id)].map(q).join(';'));
  baixarArquivo(`gaborg_setores_${new Date().toISOString().slice(0, 10)}.csv`, '\uFEFF' + [cab.map(q).join(';')].concat(linhas).join('\r\n'), 'text/csv;charset=utf-8');
  toast(`${ordenados.length} setores exportados.`);
}
async function restaurarDecreto(){
  if (cenMapa) sairCenario();
  if (!await confirmar('Restaurar estrutura do decreto', 'Todos os setores, valores, validações e vínculos atuais serão substituídos pela estrutura original do Decreto nº 2.236/2026. Exporte uma cópia antes, se precisar.', 'Restaurar', true)) return;
  DB = Object.assign(construirDecreto(), { historico:DB.historico, rubricas:DB.rubricas || [], despesas:DB.despesas || [], propostas:DB.propostas || [], propSetores:DB.propSetores || [], escolas:DB.escolas || [] });
  indexar();abertos = new Set(raizes().map(r => r.id)); salvarAbertos();
  salvarLocal();
  if (online()) { try { const r = await chamar({ action:'replace_all', dados:DB }, 120000); if (r.status !== 'success') throw new Error(r.message); versaoNuvem = String(r.versao || ''); } catch (e) { toast(e.message, 'erro'); } }
  fecharPainel(); trocarVista('mapa'); setTimeout(() => ajustar(true), 50); toast('Estrutura do decreto restaurada.');
}

/* ===================== TEMA, LOGIN E INÍCIO ===================== */
function alternarTema(){ setTimeout(() => { if (mt.mapa && ['claro','escuro'].includes(mt.base)) trocarBaseMT(document.documentElement.dataset.tema === 'escuro' ? 'escuro' : 'claro'); else if (mt.mapa) desenharMalhaMT(); }, 0); const e = document.documentElement.dataset.tema === 'escuro'; if (e) delete document.documentElement.dataset.tema; else document.documentElement.dataset.tema = 'escuro'; store.set('gaborg_tema', e ? 'claro' : 'escuro'); try { localStorage.setItem('gaborg_tema', e ? 'claro' : 'escuro'); } catch (x) {} desenharMini(); }
function preencherUsuario(){
  $('#u-nome').textContent = cfg.usuario || cfg.login || 'Usuário'; $('#u-av').textContent = iniciais(cfg.usuario || cfg.login);
  $('#u-perfil').textContent = cfg.perfil || '';
  aplicarAcessoUI();
}
function salvarCfg(){ const c = Object.assign({}, cfg); delete c.token; delete c.simulado; store.set('gaborg_cfg', c); }
function aplicarUsuario(u){ Object.assign(cfg, { usuario:u.nome || u.login, login:u.login, perfil:u.perfil, acesso:u.acesso || null, modo:'nuvem' }); if (!u.acesso) delete cfg.acesso; salvarCfg(); preencherUsuario(); }
function verSenha(b){ const i = b.parentNode.querySelector('input'); const v = i.type === 'password'; i.type = v ? 'text' : 'password'; b.innerHTML = `<i class="fa-solid ${v ? 'fa-eye-slash' : 'fa-eye'}"></i>`; b.title = v ? 'Ocultar senha' : 'Mostrar senha'; }
function mostrarLogin(msg){
  $('#app').classList.add('hidden'); $('#login').classList.remove('hidden');
  $('#lg-login').value = cfg.login || ''; $('#lg-url').value = cfg.url || URL_PADRAO; $('#lg-senha').value = '';
  const a = $('#lg-aviso'); if (msg) { a.textContent = msg; a.classList.remove('hidden'); setTimeout(() => typeof tremerLogin === 'function' && tremerLogin(), 300); } else a.classList.add('hidden');
  setTimeout(() => (cfg.login ? $('#lg-senha') : $('#lg-login')).focus(), 50);
  setTimeout(() => typeof iniciarFundoLogin === 'function' && iniciarFundoLogin(), 30);
}
let encerrando = false;
function sessaoEncerrada(msg){
  if (encerrando) return; encerrando = true;
  cfg.token = ''; sessao.set(''); document.querySelectorAll('.modal').forEach(m => m.remove());
  mostrarLogin(msg || 'Sua sessão terminou. Entre novamente.');
  setTimeout(() => { encerrando = false; }, 1000);
}
async function carregarNuvem(){
  await lerNuvem(); setTimeout(() => { try { migrarBaseEscolas(); } catch (e) { console.error(e); } }, 1500);
  if (!DB.setores.length && ehAdmin()) {
    if (await confirmar('Planilha vazia', 'A planilha ainda não tem setores. Enviar a estrutura do <b>Decreto nº 2.236/2026</b> para começar?', 'Enviar estrutura')) {
      DB = construirDecreto(); indexar(); abertos = new Set(raizes().map(r => r.id)); salvarAbertos();
      const rr = await chamar({ action:'replace_all', dados:DB }, 120000); if (rr.status !== 'success') throw new Error(rr.message);
      versaoNuvem = String(rr.versao || '');
    }
  }
  salvarLocal();
}
$('#f-login').addEventListener('submit', async e => {
  e.preventDefault();
  const login = $('#lg-login').value.trim(), senha = $('#lg-senha').value, lembrar = $('#lg-lembrar').checked, url = $('#lg-url').value.trim() || cfg.url;
  const aviso = m => { const a = $('#lg-aviso'); a.textContent = m; a.classList.remove('hidden'); tremerLogin(); };
  if (!login || !senha) return aviso('Informe usuário e senha.');
  if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) { $('#lg-adv').open = true; return aviso('Informe o endereço do Apps Script.'); }
  const b = $('#lg-btn'); b.disabled = true; b.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>Entrando...';
  try {
    if (url !== cfg.url) { cfg.url = url; fila = []; store.set('gaborg_fila', fila); store.set('gaborg_db', null); }
    if (login.toLowerCase() !== String(cfg.login || '').toLowerCase()) { fila = []; store.set('gaborg_fila', fila); }
    cfg.token = '';
    const r = await chamar({ action:'login', login, senha, lembrar }, 30000);
    if (r.status !== 'success') throw new Error(r.message || 'Não foi possível entrar.');
    cfg.token = r.token; sessao.set(r.token, lembrar); aplicarUsuario(r.usuario);
    $('#lg-senha').value = ''; $('#lg-aviso').classList.add('hidden');
    if (r.usuario.trocarSenha === 'Sim') { const ok = await modalTrocarSenha(true, senha); if (!ok) throw new Error('Defina uma nova senha para continuar.'); }
    await carregarNuvem(); abrirApp();
  } catch (err) { aviso(err.message || 'Não foi possível conectar.'); }
  b.disabled = false; b.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i>Entrar';
});
function sair(){
  if (fila.length && !confirm(`${fila.length} alteração(ões) ainda não chegaram à planilha. Elas ficam guardadas neste navegador e serão enviadas quando você entrar de novo. Sair mesmo assim?`)) return;
  cfg.token = ''; sessao.set(''); location.reload();
}
function migrarEscolas(){
  if (somenteLeitura()) return;
  DB.setores.filter(s => s.tipo === 'Unidades Escolares' && s.quantidade === '' && s.status !== 'Extinto').forEach(s => { s.quantidade = ESCOLAS_PADRAO; enfileirar('setores', s); });
}
function abrirApp(){
  indexar(); migrarEscolas();
  if (!store.get('gaborg_abertos', null)) { abertos = new Set(raizes().map(r => r.id)); salvarAbertos(); }
  $('#login').classList.add('hidden'); $('#app').classList.remove('hidden');
  if (typeof animAtiva === 'function' && animAtiva()) { const ap = $('#app'); ap.classList.add('chegando'); setTimeout(() => { ap.classList.remove('chegando'); animarEntrada($('#v-' + vistaAtual)); }, 750); }
  preencherUsuario(); statusSync();
  { const hv = location.hash.slice(1); if (['mapa','lista','painel','validacoes','config'].includes(hv)) vistaAtual = hv; }
  trocarVista(vistaAtual === 'usuarios' && !ehAdmin() ? 'mapa' : (vistaAtual || 'mapa'));
  if (!store.get('gaborg_view_ok', false)) { setTimeout(() => ajustar(true), 60); store.set('gaborg_view_ok', true); }
  if (fila.length && !somenteLeitura()) enviarFila(); else if (somenteLeitura() && fila.length) { fila = []; store.set('gaborg_fila', fila); }
}

/* ===================== SENHA E USUÁRIOS ===================== */
function abrirModal({ titulo, html, rotulo, perigo, semCancelar, largura, aoConfirmar }){
  return new Promise(ok => {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<form class="cx" role="dialog" aria-modal="true" style="${largura ? 'max-width:' + largura + 'px' : ''}"><h3>${esc(titulo)}</h3>${html}<div class="lg-aviso hidden" data-aviso></div><div class="acoes">${semCancelar ? '' : '<button type="button" class="btn btn-s" data-r="0">Cancelar</button>'}<button type="submit" class="btn ${perigo ? 'btn-perigo' : 'btn-p'}" data-ok>${esc(rotulo || 'Confirmar')}</button></div></form>`;
    const fechar = v => { m.remove(); ok(v); };
    m.addEventListener('click', e => { if (e.target.closest('[data-r="0"]') || (e.target === m && !semCancelar)) fechar(false); });
    m.querySelector('form').addEventListener('submit', async e => {
      e.preventDefault();
      const bt = m.querySelector('[data-ok]'), av = m.querySelector('[data-aviso]'), txt = bt.innerHTML;
      bt.disabled = true; bt.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>Aguarde...'; av.classList.add('hidden');
      try { const r = aoConfirmar ? await aoConfirmar(m) : true; if (r !== false) fechar(r === undefined ? true : r); }
      catch (err) { av.textContent = err.message || String(err); av.classList.remove('hidden'); }
      bt.disabled = false; bt.innerHTML = txt;
    });
    document.body.appendChild(m);
    const f = m.querySelector('input:not([type=hidden]):not([readonly]),select'); (f || m.querySelector('[data-ok]')).focus();
  });
}
const campoSenha = (id, rot, ac) => `<label><span class="rot">${rot}</span><span class="senha-cx"><input id="${id}" class="campo" type="password" autocomplete="${ac}" required><button type="button" class="ver" title="Mostrar senha" onclick="verSenha(this)"><i class="fa-solid fa-eye"></i></button></span></label>`;
let trocandoSenha = null;
function modalTrocarSenha(obrigatorio, atualConhecida){
  if (trocandoSenha) return trocandoSenha;
  trocandoSenha = abrirModal({
    titulo: obrigatorio ? 'Defina a sua senha' : 'Alterar minha senha',
    html: `<p>${obrigatorio ? 'Você entrou com uma senha provisória. Escolha agora uma senha pessoal.' : 'A nova senha passa a valer em todos os seus acessos.'} Use pelo menos <b>8 caracteres</b>, com letras e números.</p>
      ${atualConhecida ? '' : campoSenha('ts-atual', obrigatorio ? 'Senha provisória' : 'Senha atual', 'current-password')}
      ${campoSenha('ts-nova', 'Nova senha', 'new-password')}${campoSenha('ts-conf', 'Repita a nova senha', 'new-password')}`,
    rotulo: 'Salvar senha', semCancelar: obrigatorio,
    aoConfirmar: async m => {
      const atual = atualConhecida || m.querySelector('#ts-atual').value, nova = m.querySelector('#ts-nova').value, conf = m.querySelector('#ts-conf').value;
      if (nova.length < 8 || !/[A-Za-zÀ-ú]/.test(nova) || !/\d/.test(nova)) throw new Error('A senha precisa ter pelo menos 8 caracteres, com letras e números.');
      if (nova !== conf) throw new Error('As duas senhas não são iguais.');
      const r = await chamar({ action:'change_password', senhaAtual:atual, novaSenha:nova }, 30000);
      if (r.status !== 'success') throw new Error(r.message);
      cfg.token = r.token; sessao.set(r.token, sessao.lembrado()); aplicarUsuario(r.usuario);
      toast('Senha alterada.'); return true;
    }
  }).finally(() => { trocandoSenha = null; });
  return trocandoSenha;
}

let usuarios = [], acessos = [], abaAdmAtual = 'usuarios';
const COR_PERFIL = { Administrador:'#dc2626', Editor:'#2563eb', Leitor:'#64748b' };
const COR_EVENTO = { 'Login':'#16a34a', 'Senha incorreta':'#d97706', 'Login recusado':'#dc2626', 'Bloqueado por tentativas':'#dc2626', 'Usuário criado':'#2563eb', 'Usuário alterado':'#0891b2', 'Usuário desativado':'#64748b', 'Usuário excluído':'#dc2626', 'Usuário desbloqueado':'#16a34a', 'Senha alterada pelo usuário':'#7c3aed', 'Senha definida pelo administrador':'#7c3aed', 'Senha provisória gerada':'#7c3aed', 'Sessões encerradas':'#475569' };
function situacaoUsuario(u){
  if (u.ativo !== 'Sim') return ['Desativado', '#94a3b8'];
  if (u.bloqueado) return ['Bloqueado', '#dc2626'];
  if (u.trocarSenha === 'Sim') return [u.ultimoAcesso ? 'Deve trocar a senha' : 'Aguardando 1º acesso', '#d97706'];
  return ['Ativo', '#16a34a'];
}
function abaAdm(a){
  abaAdmAtual = a;
  document.querySelectorAll('.adm-abas button').forEach(b => b.classList.toggle('on', b.dataset.aba === a));
  renderUsuarios();
}
async function renderUsuarios(recarregar){
  const c = $('#u-corpo'); if (!c) return;
  if (!ehAdmin()) { c.innerHTML = '<div class="cartao vazio">Apenas administradores acessam esta área.</div>'; return; }
  if (abaAdmAtual === 'perfis') return renderPerfis();
  if (abaAdmAtual === 'acessos') return renderAcessos(recarregar);
  if (!usuarios.length) c.innerHTML = '<div class="cartao vazio"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando usuários...</div>';
  try { const [r] = await Promise.all([chamar({ action:'users_list' }, 30000), carregarPerfis()]); if (r.status !== 'success') throw new Error(r.message); usuarios = r.usuarios || []; }
  catch (e) { c.innerHTML = `<div class="cartao vazio" style="color:var(--perigo)">${esc(e.message)}</div>`; return; }
  if (abaAdmAtual !== 'usuarios') return;
  const ativos = usuarios.filter(u => u.ativo === 'Sim');
  const kpi = (cor, ic, r, v, s) => `<div class="cartao kpi" style="--c:${cor}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  const f = { q:($('#ua-q') || {}).value || '', perfil:($('#ua-perfil') || {}).value || '', sit:($('#ua-sit') || {}).value || '' };
  c.innerHTML = `<div class="kpis">
      ${kpi('#2563eb', 'fa-users', 'Usuários', usuarios.length, `${ativos.length} ativo(s)`)}
      ${kpi('#dc2626', 'fa-user-shield', 'Administradores', ativos.filter(u => (perfisLista.find(p => p.nome === u.perfil) || perfilSistema(u.perfil)).administrar).length, 'ativos')}
      ${kpi('#7c3aed', 'fa-id-badge', 'Perfis de acesso', perfisLista.length, perfisLista.filter(p => !p.sistema).length + ' personalizado(s)')}
      ${kpi('#d97706', 'fa-hourglass-half', 'Aguardando senha', ativos.filter(u => u.trocarSenha === 'Sim').length, 'precisam definir a senha')}
      ${kpi('#7f1d1d', 'fa-lock', 'Bloqueados', usuarios.filter(u => u.bloqueado).length, 'por senhas erradas')}
    </div>
    <div class="adm-filtros">
      <div class="busca"><i class="fa-solid fa-magnifying-glass"></i><input id="ua-q" class="campo" placeholder="Buscar nome, login ou e-mail" value="${esc(f.q)}" oninput="filtrarUsuarios()"></div>
      <select id="ua-perfil" class="campo" onchange="filtrarUsuarios()"><option value="">Todos os perfis</option>${perfisLista.map(p => p.nome).map(p => `<option ${f.perfil === p ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>
      <select id="ua-sit" class="campo" onchange="filtrarUsuarios()"><option value="">Todas as situações</option>${['Ativo','Aguardando 1º acesso','Deve trocar a senha','Bloqueado','Desativado'].map(s => `<option ${f.sit === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    </div>
    <div id="ua-lista"></div>
    <p style="font-size:12px;color:var(--mut);margin-top:10px"><i class="fa-solid fa-shield-halved"></i> Senhas nunca aparecem aqui: o sistema guarda só uma versão cifrada. Você pode <b>definir uma senha</b> para a pessoa ou <b>gerar uma provisória</b>; em ambos os casos pode exigir que ela crie a própria no próximo acesso.</p>`;
  filtrarUsuarios();
}
function filtrarUsuarios(){
  const el = $('#ua-lista'); if (!el) return;
  const q = norm($('#ua-q').value), pf = $('#ua-perfil').value, st = $('#ua-sit').value;
  const lista = usuarios.filter(u => (!q || norm(u.nome + ' ' + u.login + ' ' + (u.email || '')).includes(q)) && (!pf || u.perfil === pf) && (!st || situacaoUsuario(u)[0] === st))
    .sort((a, b) => (a.ativo === b.ativo ? 0 : a.ativo === 'Sim' ? -1 : 1) || a.nome.localeCompare(b.nome, 'pt-BR'));
  if (!lista.length) { el.innerHTML = '<div class="cartao vazio">Nenhum usuário com esses filtros.</div>'; return; }
  el.innerHTML = `<div class="tab-wrap"><table class="tab"><thead><tr><th>Nome</th><th>Login</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th>Último acesso</th><th></th></tr></thead><tbody>${lista.map(u => { const [s, cs] = situacaoUsuario(u); return `<tr>
    <td><span class="u-nome"><span class="u-av" style="background:${corPerfil(u.perfil)}">${esc(iniciais(u.nome))}</span><span><b>${esc(u.nome)}</b>${u.login === cfg.login ? ' <span class="chip" style="--c:#2563eb">você</span>' : ''}<small>criado ${u.criadoEm ? fmtData(u.criadoEm) : '—'}${u.criadoPor ? ' por ' + esc(u.criadoPor) : ''}</small></span></span></td>
    <td><code>${esc(u.login)}</code></td><td>${esc(u.email || '—')}</td>
    <td><span class="chip" style="--c:${corPerfil(u.perfil)}">${esc(u.perfil)}</span></td>
    <td><span class="chip" style="--c:${cs}">${s}</span>${Number(u.tentativas) && !u.bloqueado ? `<small style="display:block;color:var(--alerta);font-size:11px;margin-top:3px">${u.tentativas} senha(s) errada(s)</small>` : ''}</td>
    <td>${u.ultimoAcesso ? fmtData(u.ultimoAcesso) : '<span style="color:var(--mut)">nunca</span>'}</td>
    <td><div class="u-acoes"><button class="btn btn-s btn-sm" onclick="formUsuario(${arg(u.id)})"><i class="fa-solid fa-pen"></i>Editar</button><button class="btn btn-p btn-sm" onclick="acoesUsuario(${arg(u.id)})"><i class="fa-solid fa-key"></i>Senha e acesso</button></div></td></tr>`; }).join('')}</tbody></table></div>`;
}

// Painel de ações de um usuário (senha, bloqueio, sessões, situação, exclusão)
function acoesUsuario(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  const proprio = u.login === cfg.login, [s, cs] = situacaoUsuario(u);
  const it = (a, ic, t, d, cls) => `<button type="button" data-a="${a}" class="${cls || ''}"><i class="fa-solid ${ic}"></i><span><b>${t}</b><small>${d}</small></span></button>`;
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="cx" role="dialog" aria-modal="true" style="max-width:460px">
    <div class="u-nome" style="margin-bottom:4px"><span class="u-av" style="width:42px;height:42px;font-size:14px;background:${corPerfil(u.perfil)}">${esc(iniciais(u.nome))}</span><span><b style="font-size:15px">${esc(u.nome)}</b><small><code>${esc(u.login)}</code> · ${esc(u.perfil)} · <span style="color:${cs};font-weight:700">${s}</span></small></span></div>
    <div class="sheet-acoes">
      ${it('definir', 'fa-key', 'Definir nova senha', 'Você escolhe a senha e informa à pessoa. Pode exigir que ela troque no próximo acesso.')}
      ${it('provisoria', 'fa-wand-magic-sparkles', 'Gerar senha provisória', 'O sistema cria uma senha aleatória; a pessoa define a própria ao entrar.')}
      ${u.bloqueado || Number(u.tentativas) ? it('desbloquear', 'fa-lock-open', 'Desbloquear', u.bloqueado ? 'Libera o login agora, sem esperar os 15 minutos.' : 'Zera o contador de senhas erradas.') : ''}
      ${proprio ? '' : it('sessoes', 'fa-right-from-bracket', 'Encerrar sessões abertas', 'Desconecta a pessoa de todos os computadores e celulares. A senha não muda.')}
      ${proprio ? '' : it('situacao', u.ativo === 'Sim' ? 'fa-user-slash' : 'fa-user-check', u.ativo === 'Sim' ? 'Desativar acesso' : 'Reativar acesso', u.ativo === 'Sim' ? 'Bloqueia o login sem apagar o usuário. Pode ser reativado depois.' : 'Volta a permitir o login com a senha atual.')}
      ${it('historico', 'fa-clock-rotate-left', 'Ver registro de acessos', 'Logins, tentativas e alterações desta pessoa.')}
      ${proprio ? '' : it('excluir', 'fa-trash-can', 'Excluir usuário', 'Remove o acesso de vez. O histórico de alterações é mantido.', 'perigo')}
    </div>
    <div class="acoes"><button type="button" class="btn btn-s" data-a="fechar">Fechar</button></div></div>`;
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b && e.target !== m) return;
    m.remove(); const a = b && b.dataset.a;
    if (a === 'definir') definirSenhaUsuario(id);
    if (a === 'provisoria') resetarSenha(id);
    if (a === 'desbloquear') acaoSimples(id, 'user_unlock', 'Usuário desbloqueado.');
    if (a === 'sessoes') confirmar('Encerrar sessões', `Desconectar <b>${esc(u.nome)}</b> de todos os aparelhos? Ela precisará entrar de novo com a senha atual.`, 'Encerrar sessões').then(ok => ok && acaoSimples(id, 'user_logout', 'Sessões encerradas.'));
    if (a === 'situacao') alternarAtivo(id);
    if (a === 'historico') { abaAdm('acessos'); setTimeout(() => { const q = $('#ac-q'); if (q) { q.value = u.login; filtrarAcessos(); } }, 400); }
    if (a === 'excluir') excluirUsuario(id);
  });
  document.body.appendChild(m);
}
async function acaoSimples(id, action, msg){
  try { const r = await chamar({ action, id }, 30000); if (r.status !== 'success') throw new Error(r.message); toast(msg); renderUsuarios(); }
  catch (e) { toast(e.message, 'erro'); }
}
async function alternarAtivo(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  const ativar = u.ativo !== 'Sim';
  if (!ativar && !await confirmar('Desativar acesso', `<b>${esc(u.nome)}</b> não conseguirá mais entrar e as sessões abertas serão encerradas. Você pode reativar depois.`, 'Desativar', true)) return;
  try { const r = await chamar({ action:'user_save', usuario:{ id:u.id, nome:u.nome, login:u.login, email:u.email, perfil:u.perfil, ativo: ativar ? 'Sim' : 'Não' } }, 30000); if (r.status !== 'success') throw new Error(r.message); toast(ativar ? 'Acesso reativado.' : 'Acesso desativado.'); renderUsuarios(); }
  catch (e) { toast(e.message, 'erro'); }
}
function sugerirSenha(){
  const L = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz', N = '23456789', T = L + N + '@#$%&*';
  const r = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  let s = L[r(L.length)] + N[r(N.length)]; while (s.length < 12) s += T[r(T.length)];
  return s.split('').sort(() => r(3) - 1).join('');
}
function forcaSenha(s){
  let p = 0; if (s.length >= 8) p++; if (s.length >= 12) p++; if (/[a-z]/.test(s) && /[A-Z]/.test(s)) p++; if (/\d/.test(s)) p++; if (/[^A-Za-z0-9]/.test(s)) p++;
  return [['Muito fraca', '#dc2626', 15], ['Fraca', '#dc2626', 30], ['Razoável', '#d97706', 55], ['Boa', '#16a34a', 78], ['Forte', '#16a34a', 100], ['Forte', '#16a34a', 100]][p];
}
function medirSenha(inp){
  const [t, c, w] = forcaSenha(inp.value), cx = inp.closest('form').querySelector('[data-forca]');
  if (!cx) return; cx.querySelector('i').style.cssText = `width:${inp.value ? w : 0}%;background:${c}`; cx.nextElementSibling.textContent = inp.value ? 'Força: ' + t : '';
}
function definirSenhaUsuario(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  const proprio = u.login === cfg.login;
  let senhaFinal = '';
  abrirModal({ titulo:'Definir nova senha', rotulo:'Salvar senha', largura:460,
    html:`<p>Nova senha de <b>${esc(u.nome)}</b> (<code>${esc(u.login)}</code>). As sessões abertas dessa pessoa serão encerradas.</p>
      <label><span class="rot">Nova senha</span><span class="senha-cx"><input id="ds-senha" class="campo" type="password" autocomplete="new-password" required oninput="medirSenha(this)"><button type="button" class="ver" title="Mostrar senha" onclick="verSenha(this)"><i class="fa-solid fa-eye"></i></button></span></label>
      <div class="forca" data-forca><i></i></div><small style="font-size:11.5px;color:var(--mut)"></small>
      <button type="button" class="btn btn-s btn-sm" style="align-self:flex-start" onclick="const i=this.closest('form').querySelector('#ds-senha');i.value=sugerirSenha();i.type='text';medirSenha(i)"><i class="fa-solid fa-dice"></i>Sugerir senha forte</button>
      <label class="chk"><input type="checkbox" id="ds-trocar" ${proprio ? '' : 'checked'}><span>Exigir que a pessoa crie a própria senha no próximo acesso <small style="display:block;color:var(--mut)">Recomendado: assim só ela conhecerá a senha definitiva.</small></span></label>
      <p style="font-size:12px">Mínimo de <b>8 caracteres</b>, com letras e números.</p>`,
    aoConfirmar: async m => {
      const s = m.querySelector('#ds-senha').value, troca = m.querySelector('#ds-trocar').checked;
      if (s.length < 8 || !/[A-Za-zÀ-ú]/.test(s) || !/\d/.test(s)) throw new Error('A senha precisa ter pelo menos 8 caracteres, com letras e números.');
      const r = await chamar({ action:'user_set_password', id, senha:s, exigirTroca:troca }, 30000);
      if (r.status !== 'success') throw new Error(r.message);
      senhaFinal = s; return r;
    }
  }).then(async r => {
    if (!r) return;
    if (proprio) { sessaoEncerrada('Sua senha foi alterada. Entre com a nova senha.'); return; }
    await abrirModal({ titulo:'Senha definida', rotulo:'Pronto', semCancelar:true,
      html:`<p>Passe estes dados a <b>${esc(u.nome)}</b>${r.usuario.trocarSenha === 'Sim' ? '. No próximo acesso o GABOrg pedirá uma senha pessoal' : ''}.</p>
        <p><span class="rot">Usuário</span><code style="font-size:14px">${esc(u.login)}</code></p>
        <div><span class="rot">Senha</span><div class="senha-prov">${esc(senhaFinal)}</div></div>
        <button type="button" class="btn btn-s" onclick="navigator.clipboard && navigator.clipboard.writeText(${arg('Endereço: ' + location.href.split('#')[0] + '\nUsuário: ' + u.login + '\nSenha: ' + senhaFinal)}).then(() => toast('Copiado.'))"><i class="fa-regular fa-copy"></i>Copiar usuário e senha</button>` });
    renderUsuarios();
  });
}

/* Registro de acessos */
async function renderAcessos(recarregar){
  const c = $('#u-corpo');
  if (!acessos.length || recarregar !== false) {
    if (!acessos.length) c.innerHTML = '<div class="cartao vazio"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando registro...</div>';
    try { const r = await chamar({ action:'access_log', limite:1000 }, 30000); if (r.status !== 'success') throw new Error(r.message); acessos = r.acessos || []; }
    catch (e) { c.innerHTML = `<div class="cartao vazio" style="color:var(--perigo)">${esc(e.message)}${/desconhecida/i.test(e.message) ? '<br><small>Atualize o Codigo.gs no Apps Script e publique uma nova versão.</small>' : ''}</div>`; return; }
  }
  if (abaAdmAtual !== 'acessos') return;
  const hoje = new Date().toISOString().slice(0, 10);
  const deHoje = acessos.filter(a => (a.data || '').slice(0, 10) === hoje);
  const kpi = (cor, ic, r, v, s) => `<div class="cartao kpi" style="--c:${cor}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  const eventos = [...new Set(acessos.map(a => a.evento))].sort();
  c.innerHTML = `<div class="kpis">
      ${kpi('#16a34a', 'fa-right-to-bracket', 'Logins hoje', deHoje.filter(a => a.evento === 'Login').length, `${new Set(deHoje.filter(a => a.evento === 'Login').map(a => a.login)).size} pessoa(s)`)}
      ${kpi('#d97706', 'fa-triangle-exclamation', 'Falhas hoje', deHoje.filter(a => /incorreta|recusado|Bloqueado/.test(a.evento)).length, 'senhas erradas e recusas')}
      ${kpi('#7c3aed', 'fa-key', 'Mudanças de senha', acessos.filter(a => /Senha/.test(a.evento)).length, 'no período carregado')}
      ${kpi('#475569', 'fa-list', 'Registros', acessos.length, acessos.length ? 'desde ' + fmtData(acessos[acessos.length - 1].data) : '—')}
    </div>
    <div class="adm-filtros">
      <div class="busca"><i class="fa-solid fa-magnifying-glass"></i><input id="ac-q" class="campo" placeholder="Buscar usuário ou detalhe" oninput="filtrarAcessos()"></div>
      <select id="ac-ev" class="campo" onchange="filtrarAcessos()"><option value="">Todos os eventos</option><option value="__falhas">Só falhas e bloqueios</option>${eventos.map(e => `<option>${esc(e)}</option>`).join('')}</select>
      <button class="btn btn-s" onclick="exportarAcessos()"><i class="fa-solid fa-file-csv"></i>Exportar CSV</button>
    </div>
    <div id="ac-lista"></div>`;
  filtrarAcessos();
}
function acessosFiltrados(){
  const q = norm(($('#ac-q') || {}).value || ''), ev = ($('#ac-ev') || {}).value || '';
  return acessos.filter(a => (!q || norm(a.login + ' ' + a.nome + ' ' + a.detalhe + ' ' + a.autor).includes(q)) && (!ev || (ev === '__falhas' ? /incorreta|recusado|Bloqueado/.test(a.evento) : a.evento === ev)));
}
function filtrarAcessos(){
  const el = $('#ac-lista'); if (!el) return;
  const l = acessosFiltrados();
  if (!l.length) { el.innerHTML = '<div class="cartao vazio">Nenhum registro.</div>'; return; }
  el.innerHTML = `<div class="tab-wrap"><table class="tab"><thead><tr><th>Data</th><th>Usuário</th><th>Evento</th><th>Detalhe</th><th>Feito por</th></tr></thead><tbody>${l.slice(0, 500).map(a => `<tr>
    <td style="white-space:nowrap">${fmtData(a.data)}</td>
    <td class="ev"><b>${esc(a.nome || '—')}</b><br><small><code>${esc(a.login)}</code></small></td>
    <td><span class="chip" style="--c:${COR_EVENTO[a.evento] || '#64748b'}">${esc(a.evento)}</span></td>
    <td class="ev">${esc(a.detalhe || '')}</td>
    <td class="ev">${esc(a.autor || (a.evento === 'Login' || /incorreta|recusado|Bloqueado/.test(a.evento) ? '' : 'a própria pessoa'))}</td></tr>`).join('')}</tbody></table></div>
    ${l.length > 500 ? `<p style="font-size:12px;color:var(--mut)">Mostrando os 500 mais recentes de ${l.length}. Use a busca ou exporte o CSV para ver todos.</p>` : ''}`;
}
function exportarAcessos(){
  const l = acessosFiltrados(), q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const csv = '﻿' + ['Data;Login;Nome;Evento;Detalhe;Feito por', ...l.map(a => [fmtData(a.data), a.login, a.nome, a.evento, a.detalhe, a.autor].map(q).join(';'))].join('\r\n');
  const b = new Blob([csv], { type:'text/csv;charset=utf-8' }), u = URL.createObjectURL(b), lk = document.createElement('a');
  lk.href = u; lk.download = 'gaborg-acessos-' + new Date().toISOString().slice(0, 10) + '.csv'; lk.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
}

/* Perfis */
function mostrarSenhaProvisoria(u, senha, nova){
  return abrirModal({ titulo: nova ? 'Usuário criado' : 'Senha redefinida', rotulo:'Pronto', semCancelar:true,
    html:`<p>Passe estes dados a <b>${esc(u.nome)}</b>. A senha provisória aparece só agora; no primeiro acesso o GABOrg pede uma senha pessoal.</p>
      <p><span class="rot">Usuário</span><code style="font-size:14px">${esc(u.login)}</code></p>
      <div><span class="rot">Senha provisória</span><div class="senha-prov">${esc(senha)}</div></div>
      <button type="button" class="btn btn-s" onclick="navigator.clipboard && navigator.clipboard.writeText(${arg('Endereço: ' + location.href.split('#')[0] + '\nUsuário: ' + u.login + '\nSenha provisória: ' + senha)}).then(() => toast('Copiado.'))"><i class="fa-regular fa-copy"></i>Copiar usuário e senha</button>` });
}
function resumoPerfilHTML(nome){
  const p = perfisLista.find(x => x.nome === nome) || perfilSistema(nome), niv = k => p.administrar ? 'editar' : p.secoes[k] || 'oculto';
  const ed = SECOES_LISTA.filter(([k]) => !SEM_EDICAO.has(k) && niv(k) === 'editar').map(x => x[1]), ve = SECOES_LISTA.filter(([k]) => niv(k) !== 'oculto' && !(niv(k) === 'editar' && !SEM_EDICAO.has(k))).map(x => x[1]), oc = SECOES_LISTA.filter(([k]) => niv(k) === 'oculto').length;
  return `<b style="color:${esc(p.cor)}">${esc(p.nome)}</b>: ${esc(p.descricao || '')}<br>${ed.length ? `<i class="fa-solid fa-pen" style="color:#16a34a"></i> edita ${ed.length === SECOES_LISTA.length - SEM_EDICAO.size ? 'todas as seções' : esc(ed.join(', '))}<br>` : ''}${ve.length ? `<i class="fa-solid fa-eye" style="color:#2563eb"></i> só vê ${esc(ve.join(', '))}<br>` : ''}${oc ? `<i class="fa-solid fa-eye-slash" style="color:#94a3b8"></i> ${oc} seção(ões) oculta(s)` : ''}${p.administrar ? '<br><i class="fa-solid fa-user-shield" style="color:#dc2626"></i> administra usuários e perfis' : ''}`;
}
function formUsuario(id){
  const u = usuarios.find(x => x.id === id) || { login:'', nome:'', email:'', perfil:'Editor', ativo:'Sim' };
  const proprio = u.login && u.login === cfg.login;
  abrirModal({ titulo: id ? 'Editar usuário' : 'Novo usuário', rotulo: id ? 'Salvar' : 'Criar usuário', largura:500,
    html:`<label><span class="rot">Nome completo</span><input id="fu-nome" class="campo" required value="${esc(u.nome)}" placeholder="Como aparecerá no histórico"></label>
      <div class="g2"><label><span class="rot">Login</span><input id="fu-login" class="campo" required autocapitalize="none" spellcheck="false" value="${esc(u.login)}" placeholder="maria.silva"></label>
      <label><span class="rot">E-mail <span style="font-weight:500;color:var(--mut)">(opcional, também serve para entrar)</span></span><input id="fu-email" class="campo" type="email" value="${esc(u.email)}"></label></div>
      <div class="g2"><label><span class="rot">Perfil</span><select id="fu-perfil" class="campo" ${proprio ? 'disabled' : ''} onchange="document.getElementById('fu-pres').innerHTML=resumoPerfilHTML(this.value)">${(perfisLista.length ? perfisLista : ['Administrador','Editor','Leitor'].map(perfilSistema)).map(p => `<option ${p.nome === u.perfil ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></label>
      <label><span class="rot">Situação</span><select id="fu-ativo" class="campo" ${proprio ? 'disabled' : ''}><option value="Sim" ${u.ativo === 'Sim' ? 'selected' : ''}>Ativo</option><option value="Não" ${u.ativo !== 'Sim' ? 'selected' : ''}>Desativado</option></select></label></div>
      <div id="fu-pres" class="fu-pres">${resumoPerfilHTML(u.perfil)}</div>
      ${id ? '' : '<p style="font-size:12.5px">O sistema gera uma <b>senha provisória</b> e a mostra na próxima tela.</p>'}`,
    aoConfirmar: async m => {
      const dados = { id: id || '', nome:m.querySelector('#fu-nome').value.trim(), login:m.querySelector('#fu-login').value.trim().toLowerCase(), email:m.querySelector('#fu-email').value.trim(), perfil:m.querySelector('#fu-perfil').value, ativo:m.querySelector('#fu-ativo').value };
      if (!/^[a-z0-9._@-]{3,60}$/.test(dados.login)) throw new Error('Login: use de 3 a 60 letras minúsculas, números, ponto, hífen ou @ (sem espaços e acentos).');
      const r = await chamar({ action:'user_save', usuario:dados }, 30000);
      if (r.status !== 'success') throw new Error(r.message);
      if (proprio) aplicarUsuario(r.usuario);
      return r;
    }
  }).then(async r => { if (!r) return; if (r.senhaProvisoria) await mostrarSenhaProvisoria(r.usuario, r.senhaProvisoria, true); else toast('Usuário salvo.'); renderUsuarios(); });
}
async function resetarSenha(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  if (!await confirmar('Redefinir senha', `Gerar uma senha provisória para <b>${esc(u.nome)}</b>? A senha atual deixa de funcionar e as sessões abertas dessa pessoa são encerradas.`, 'Gerar senha provisória')) return;
  try { const r = await chamar({ action:'user_reset', id }, 30000); if (r.status !== 'success') throw new Error(r.message); if (u.login === cfg.login) { sessaoEncerrada('Sua senha foi redefinida. Entre com a senha provisória.'); } await mostrarSenhaProvisoria(r.usuario, r.senhaProvisoria, false); renderUsuarios(); }
  catch (e) { toast(e.message, 'erro'); }
}
async function excluirUsuario(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  if (!await confirmar('Excluir usuário', `Excluir <b>${esc(u.nome)}</b> (${esc(u.login)})? Ele perde o acesso imediatamente. O histórico de alterações dessa pessoa é mantido. Para suspender sem excluir, edite e marque como desativado.`, 'Excluir', true)) return;
  try { const r = await chamar({ action:'user_delete', id }, 30000); if (r.status !== 'success') throw new Error(r.message); toast('Usuário excluído.'); renderUsuarios(); }
  catch (e) { toast(e.message, 'erro'); }
}

/* Perfil Leitor: bloqueia qualquer alteração, mesmo que um botão escape da interface */
['alterar','novoSetorEm','duplicarSetor','excluirSetor','moverOrdem','addItem','rmItem','solicitarValidacao','editarValidacao','rmValidacao','addVinculo','rmVinculo','reorganizar','restaurarDecreto','importarJSON','enviarTudo'].forEach(n => {
  const f = window[n]; if (typeof f !== 'function') return;
  const admin = ['restaurarDecreto','importarJSON','enviarTudo'].includes(n);
  window[n] = function(){
    if (admin ? !ehAdmin() : somenteLeitura()) { toast(admin ? 'Apenas administradores podem fazer isso.' : 'Seu perfil é somente leitura.', 'aviso'); if (n === 'alterar' && selId) setTimeout(renderPainel, 0); return; }
    return f.apply(this, arguments);
  };
});
function travarLeitura(raiz){
  if (!somenteLeitura() || !raiz) return;
  raiz.querySelectorAll('input,select,textarea').forEach(el => { el.disabled = true; });
  raiz.querySelectorAll('button').forEach(b => { const oc = b.getAttribute('onclick') || ''; if (!/irPara|abaPainel|selecionar|fecharPainel|abrirRamo/.test(oc)) b.disabled = true; });
}
['renderPainel','renderValidacoes'].forEach(n => {
  const f = window[n];
  window[n] = function(){ const r = f.apply(this, arguments); travarLeitura(n === 'renderPainel' ? $('#pn-corpo') : $('#v-corpo')); if (n === 'renderPainel' && somenteLeitura() && $('#pn-corpo') && !$('#pn-corpo .ro-aviso')) $('#pn-corpo').insertAdjacentHTML('afterbegin', '<div class="ro-aviso"><i class="fa-solid fa-eye"></i>Perfil Leitor: você pode consultar, mas não alterar.</div>'); return r; };
});
window.addEventListener('resize', () => { if (vistaAtual === 'mapa') desenharMini(); });

/* ===================== FINANCEIRO ===================== */
const CATEG_FIN = {
  'Cargo em comissão (DGA)':['#dc2626','fa-user-tie'], 'Função gratificada':['#ea580c','fa-award'], 'Bolsa':['#7c3aed','fa-graduation-cap'],
  'Pessoal efetivo':['#2563eb','fa-id-card'], 'Terceirizado / contrato':['#0891b2','fa-file-contract'], 'Custeio':['#16a34a','fa-receipt'],
  'Diárias e passagens':['#ca8a04','fa-plane'], 'Outro':['#64748b','fa-ellipsis']
};
const CENARIOS = ['Atual', 'Proposto'];
/* Subsídio dos cargos em comissão do Poder Executivo de MT (inclui a SEDUC-MT):
 * Anexo V da LC nº 266/2006, na redação da LC nº 755, de 12/01/2023 (D.O. 13/01/2023).
 * % efetivo = percentual do subsídio pago como gratificação ao servidor efetivo/de carreira nomeado no cargo. */
const DGA_FONTE = 'LC 755/2023 (Anexo V da LC 266/2006)';
const DGA_OFICIAL = [['DGA-1',25096.81,70],['DGA-2',12891.56,70],['DGA-3',9436.62,70],['DGA-4',7700.56,70],['DGA-5',5534.78,70],['DGA-6',4273.12,70],['DGA-7',3217.73,85],['DGA-8',3032.10,85],['DGA-9',1794.51,85],['DGA-10',1344.16,85]];
function carregarDGA(sobrescrever){
  let novos = 0, atualizados = 0;
  DGA_OFICIAL.forEach(([cod, val, pe]) => {
    let r = DB.rubricas.find(x => String(x.codigo).trim().toUpperCase().replace(/\s+/g, '') === cod);
    const dados = { valorMensal:String(val), percEfetivo:String(pe), fonte:DGA_FONTE, categoria:'Cargo em comissão (DGA)' };
    if (!r) {
      r = novoReg('rubricas', Object.assign({ id:novoId('rb'), codigo:cod, nome:'Cargo em comissão – símbolo ' + cod, encargos:'', meses:'12', ativo:'Sim', observacao:'Subsídio do comissionado; servidor efetivo recebe ' + pe + '% como gratificação' }, dados, { atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }));
      DB.rubricas.push(r); enfileirar('rubricas', r); novos++;
    } else if (sobrescrever || !numBR(r.valorMensal) || r.percEfetivo === '') {
      if (!sobrescrever && numBR(r.valorMensal)) delete dados.valorMensal;
      Object.assign(r, dados, { atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); enfileirar('rubricas', r); atualizados++;
    }
  });
  salvarLocal();
  return { novos, atualizados };
}
async function atualizarDGAOficial(){
  if (somenteLeitura()) return;
  if (!await confirmar('Tabela oficial DGA', `Gravar os valores de <b>DGA-1 a DGA-10</b> da ${DGA_FONTE}? Os valores que você editou nesses símbolos serão substituídos. Os lançamentos que usam esses itens são recalculados.`, 'Atualizar valores')) return;
  const r = carregarDGA(true); toast(`Tabela DGA: ${r.novos} incluído(s), ${r.atualizados} atualizado(s).`); renderFinanceiro();
}
function reajusteTabela(){
  if (somenteLeitura()) return;
  const cats = Object.keys(CATEG_FIN);
  abrirModal({ titulo:'Aplicar reajuste', rotulo:'Aplicar', largura:460,
    html:`<p>Aplica um percentual (ex.: revisão geral anual) sobre o valor mensal dos itens escolhidos. Arredonda em centavos e registra na observação.</p>
      <div class="g2"><label><span class="rot">Percentual (%)</span><input id="rj-p" class="campo" type="number" step="0.01" required placeholder="ex.: 4,83"></label>
      <label><span class="rot">Aplicar em</span><select id="rj-c" class="campo"><option value="Cargo em comissão (DGA)">Cargos em comissão (DGA)</option><option value="">Todos os itens</option>${cats.filter(c => c !== 'Cargo em comissão (DGA)').map(c => `<option>${c}</option>`).join('')}</select></label></div>
      <label><span class="rot">Referência <small>opcional</small></span><input id="rj-r" class="campo" placeholder="ex.: RGA 2025 – Lei nº 12.793/2025"></label>`,
    aoConfirmar: async m => {
      const pct = numBR(m.querySelector('#rj-p').value), cat = m.querySelector('#rj-c').value, ref = m.querySelector('#rj-r').value.trim();
      if (!pct) throw new Error('Informe o percentual.');
      const alvo = DB.rubricas.filter(r => (!cat || r.categoria === cat) && numBR(r.valorMensal));
      if (!alvo.length) throw new Error('Nenhum item com valor nessa categoria.');
      alvo.forEach(r => { r.valorMensal = String(Math.round(numBR(r.valorMensal) * (1 + pct / 100) * 100) / 100); r.observacao = ((r.observacao ? r.observacao + ' · ' : '') + `Reajuste de ${pct.toLocaleString('pt-BR')}%${ref ? ' (' + ref + ')' : ''} em ${new Date().toLocaleDateString('pt-BR')}`).slice(0, 500); r.atualizadoEm = agora(); r.atualizadoPor = cfg.usuario || ''; enfileirar('rubricas', r); });
      salvarLocal(); toast(`Reajuste de ${pct.toLocaleString('pt-BR')}% aplicado em ${alvo.length} item(ns).`); return true;
    }
  }).then(ok => { if (ok) renderFinanceiro(); });
}
const numBR = v => { let s = String(v ?? '').trim(); if (!s) return 0; if (/,\d{1,2}$/.test(s) || /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/[^\d.-]/g, ''); const n = Number(s); return isFinite(n) ? n : 0; };
const fmtM = v => numBR(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const fmtM0 = v => numBR(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
let abaFinAtual = 'resumo', calcLinhas = [];
const rubricaDe = id => DB.rubricas.find(r => r.id === id);
function calcDesp(d){
  const r = rubricaDe(d.rubricaId) || {};
  const pe = d.vinculo === 'Efetivo' && r.percEfetivo !== undefined && r.percEfetivo !== '' ? numBR(r.percEfetivo) / 100 : 1;
  const unit = d.valorUnitario !== '' ? numBR(d.valorUnitario) : numBR(r.valorMensal) * pe;
  const enc = numBR(r.encargos), qtd = d.quantidade === '' ? 1 : numBR(d.quantidade);
  const mensal = qtd * unit * (1 + enc / 100);
  const meses = d.meses !== '' ? numBR(d.meses) : (r.meses !== '' && r.meses != null ? numBR(r.meses) : 12);
  return { r, unit, enc, qtd, mensal, meses, anual: mensal * meses, categoria: r.categoria || 'Outro', efetivo: pe !== 1 };
}
function backendSemFinanceiro(){ return online() && backendVersao && backendVersao.localeCompare('1.4.0', undefined, { numeric:true }) < 0; }
function despesasFiltradas(area){
  return DB.despesas.filter(d => !area || areaDe.get(d.setorId) === area || d.setorId === area);
}
function totaisFin(lista){
  const t = { Atual:{ m:0, a:0, n:0 }, Proposto:{ m:0, a:0, n:0 } };
  lista.forEach(d => { const c = calcDesp(d), k = d.cenario === 'Proposto' ? 'Proposto' : 'Atual'; t[k].m += c.mensal; t[k].a += c.anual; t[k].n++; });
  return t;
}
function custoSetorFin(id, comSub){
  const ids = new Set([id, ...(comSub ? descendentes(id) : [])]);
  return totaisFin(DB.despesas.filter(d => ids.has(d.setorId)));
}
function abaFin(a){ abaFinAtual = a; document.querySelectorAll('.fin-abas button').forEach(b => b.classList.toggle('on', b.dataset.aba === a)); renderFinanceiro(); }
/* Cargos padrão das chefias (titulares), no cenário Atual:
 * Secretário(a) de Estado = DGA-1 · Secretários Adjuntos = DGA-2 · Superintendentes = DGA-3 · Coordenadores = DGA-5 */
const CHEFIAS_PADRAO = [
  { cod:'DGA-1', titulo:'Secretário(a) de Estado de Educação', teste:s => !s.paiId || !porId.has(s.paiId) },
  { cod:'DGA-2', titulo:'Secretário(a) Adjunto(a)', teste:s => s.tipo === 'Gabinete' && /^Gabinete d[oa] Secret[aá]ri[oa] Adjunt/i.test(s.nome) },
  { cod:'DGA-3', titulo:'Superintendente', teste:s => s.tipo === 'Superintendência' },
  { cod:'DGA-5', titulo:'Coordenador(a)', teste:s => s.tipo === 'Coordenadoria' }
];
const MARCA_CHEFIA = 'Cargo padrão da chefia', MARCA_HIST = 'Financeiro: cargos padrão das chefias aplicados';
function aplicarCargosChefia(){
  if (somenteLeitura()) return 0;
  carregarDGA(false);
  const rub = cod => DB.rubricas.find(r => String(r.codigo).trim().toUpperCase() === cod);
  let n = 0;
  DB.setores.filter(s => s.status !== 'Extinto').forEach(s => {
    const regra = CHEFIAS_PADRAO.find(c => c.teste(s)); if (!regra) return;
    const r = rub(regra.cod); if (!r) return;
    const ja = DB.despesas.some(d => d.setorId === s.id && d.observacao === MARCA_CHEFIA && (d.cenario || 'Atual') === 'Atual');
    if (ja) return;
    const d = novoReg('despesas', { id:novoId('fd'), setorId:s.id, rubricaId:r.id, descricao:regra.titulo, quantidade:'1', meses:'', cenario:'Atual', vinculo:'Comissionado', observacao:MARCA_CHEFIA, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
    DB.despesas.push(d); enfileirar('despesas', d); n++;
  });
  if (n) { const raiz = raizes()[0]; registrar(raiz ? raiz.id : '', `${MARCA_HIST} (${n} lançamento(s))`); salvarLocal(); }
  return n;
}
async function reaplicarCargosChefia(){
  if (somenteLeitura()) return;
  const n = aplicarCargosChefia();
  toast(n ? `${n} cargo(s) de chefia lançado(s) no cenário Atual.` : 'Todas as chefias já têm o cargo padrão lançado.');
  renderFinanceiro();
}
function renderFinanceiro(){
  if (!somenteLeitura() && !DB.rubricas.some(r => /^DGA-?\d+$/i.test(String(r.codigo).trim()))) { const r = carregarDGA(false); if (r.novos) toast('Tabela DGA-1 a DGA-10 carregada (' + DGA_FONTE + '). Os valores podem ser editados.'); }
  if (!somenteLeitura() && !DB.historico.some(x => String(x.acao).startsWith(MARCA_HIST)) && !DB.despesas.some(d => d.observacao === MARCA_CHEFIA)) {
    const n = aplicarCargosChefia(); if (n) setTimeout(() => toast(`Cargos das chefias lançados: ${n} (Secretário DGA-1, Adjuntos DGA-2, Superintendentes DGA-3, Coordenadores DGA-5).`), 900);
  }
  const sel = $('#f-area'), va = sel.value;
  sel.innerHTML = '<option value="">Toda a Secretaria</option>' + areas.map(a => `<option value="${esc(a)}" ${a === va ? 'selected' : ''}>${esc(nomeCurto(porId.get(a)))}</option>`).join('');
  const c = $('#f-corpo');
  const aviso = backendSemFinanceiro() ? `<div class="cartao bl" style="border-color:#f59e0b;margin-bottom:14px"><h3 style="color:#b45309"><i class="fa-solid fa-triangle-exclamation"></i>Atualize o backend</h3><p class="s">A planilha está com o Codigo.gs v${esc(backendVersao)}. Para gravar o Financeiro na planilha, cole o Codigo.gs novo no Apps Script e publique uma nova versão. Até lá, os lançamentos ficam só neste navegador.</p></div>` : '';
  if (abaFinAtual === 'resumo') c.innerHTML = aviso + finResumo(sel.value);
  if (abaFinAtual === 'lancamentos') { c.innerHTML = aviso + finLancamentosCasca(); filtrarLancamentos(); }
  if (abaFinAtual === 'tabela') c.innerHTML = aviso + finTabela();
  if (abaFinAtual === 'calc') c.innerHTML = aviso + finCalc();
}
function barrasFin(itens, max){
  return `<div class="fin-barras">${itens.map(([n, cor, ic, a, p]) => `<div class="fin-barra" style="--c:${cor}"><span class="n" title="${esc(n)}"><i class="fa-solid ${ic}"></i>${esc(n)}</span><span class="t"><span style="width:${max ? a / max * 100 : 0}%"></span><span class="p" style="width:${max ? p / max * 100 : 0}%"></span></span><span class="v">${fmtM0(a)}<small>proposto ${fmtM0(p)}</small></span></div>`).join('')}</div>`;
}
function finResumo(area){
  const lista = despesasFiltradas(area), t = totaisFin(lista);
  const setoresArea = DB.setores.filter(s => s.status !== 'Extinto' && (!area || areaDe.get(s.id) === area || s.id === area));
  const orc = setoresArea.reduce((a, s) => a + numBR(s.orcamento), 0);
  const dif = t.Proposto.a - t.Atual.a;
  const kpi = (cor, ic, r, v, s) => `<div class="cartao kpi" style="--c:${cor}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v" style="font-size:22px">${v}</div><div class="s">${s}</div></div>`;
  if (!DB.rubricas.length && !DB.despesas.length) return `<div class="cartao bl"><h3><i class="fa-solid fa-sack-dollar"></i>Comece pela tabela de valores</h3><p class="s">Cadastre os valores mensais dos cargos em comissão (DGA), funções gratificadas, bolsas e demais despesas em <b>Tabela de valores</b>. Depois faça os <b>lançamentos</b> em cada setor (quantidade × valor), no cenário <b>Atual</b> e no <b>Proposto</b>. O resumo, o painel do setor e o Modo TV passam a mostrar os totais.</p><div class="acoes"><button class="btn btn-p so-edit" onclick="abaFin('tabela')"><i class="fa-solid fa-table"></i>Abrir a tabela de valores</button></div></div>`;
  // por categoria
  const porCat = {}; lista.forEach(d => { const c = calcDesp(d), k = c.categoria; porCat[k] = porCat[k] || [0, 0]; porCat[k][d.cenario === 'Proposto' ? 1 : 0] += c.anual; });
  const cats = Object.keys(porCat).sort((a, b) => porCat[b][0] - porCat[a][0]);
  const maxC = Math.max(1, ...cats.map(k => Math.max(...porCat[k])));
  // por área ou setor
  const grupo = id => area ? id : areaDe.get(id);
  const porG = new Map(); lista.forEach(d => { const g = grupo(d.setorId) || '—', c = calcDesp(d); const o = porG.get(g) || [0, 0]; o[d.cenario === 'Proposto' ? 1 : 0] += c.anual; porG.set(g, o); });
  const gs = [...porG.entries()].sort((a, b) => b[1][0] - a[1][0]).slice(0, 12), maxG = Math.max(1, ...gs.map(g => Math.max(...g[1])));
  // quadro por item (DGA, bolsas...)
  const porItem = new Map();
  lista.forEach(d => { const c = calcDesp(d), k = d.rubricaId || '__' + (d.descricao || 'Valor próprio'); const o = porItem.get(k) || { r:c.r, nome:c.r.codigo || d.descricao || 'Valor próprio', cat:c.categoria, qa:0, qp:0, ma:0, mp:0 }; if (d.cenario === 'Proposto') { o.qp += c.qtd; o.mp += c.mensal; } else { o.qa += c.qtd; o.ma += c.mensal; } porItem.set(k, o); });
  const itens = [...porItem.values()].sort((a, b) => a.cat.localeCompare(b.cat) || String(a.nome).localeCompare(String(b.nome), 'pt-BR', { numeric:true }));
  const tot = itens.reduce((a, o) => ({ qa:a.qa + o.qa, qp:a.qp + o.qp, ma:a.ma + o.ma, mp:a.mp + o.mp }), { qa:0, qp:0, ma:0, mp:0 });
  const d0 = (a, b) => { const x = b - a; return x ? `<span class="${x > 0 ? 'fin-pos' : 'fin-neg'}">${x > 0 ? '+' : ''}${typeof a === 'number' && Math.abs(x) >= 100 ? fmtM0(x) : x.toLocaleString('pt-BR')}</span>` : '<span style="color:var(--mut2)">—</span>'; };
  return `<div class="kpis">
      ${kpi('#2563eb', 'fa-calendar-day', 'Custo mensal · atual', fmtM0(t.Atual.m), `${t.Atual.n} lançamento(s)`)}
      ${kpi('#0e7490', 'fa-calendar', 'Custo anual · atual', fmtM0(t.Atual.a), orc ? `${(t.Atual.a / orc * 100).toLocaleString('pt-BR', { maximumFractionDigits:1 })}% do orçamento declarado` : 'sem orçamento declarado nos setores')}
      ${kpi('#7c3aed', 'fa-lightbulb', 'Custo anual · proposto', fmtM0(t.Proposto.a), `${t.Proposto.n} lançamento(s)`)}
      ${kpi(dif > 0 ? '#dc2626' : '#16a34a', dif > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down', 'Diferença anual', (dif > 0 ? '+' : '') + fmtM0(dif), t.Atual.a ? `${(dif / t.Atual.a * 100).toLocaleString('pt-BR', { maximumFractionDigits:1 })}% em relação ao atual` : 'proposto − atual')}
      ${kpi('#16a34a', 'fa-landmark', 'Orçamento declarado', fmtM0(orc), 'soma do campo orçamento dos setores')}
    </div>
    <div class="grade2">
      <div class="cartao bl"><h3><i class="fa-solid fa-layer-group"></i>Custo anual por tipo de despesa</h3><div class="fin-leg"><span><i></i>Atual</span><span><i class="p"></i>Proposto</span></div>
        ${cats.length ? barrasFin(cats.map(k => [k, (CATEG_FIN[k] || CATEG_FIN.Outro)[0], (CATEG_FIN[k] || CATEG_FIN.Outro)[1], porCat[k][0], porCat[k][1]]), maxC) : '<p class="s">Sem lançamentos.</p>'}</div>
      <div class="cartao bl"><h3><i class="fa-solid fa-sitemap"></i>Custo anual por ${area ? 'setor' : 'secretaria adjunta'}</h3><div class="fin-leg"><span><i></i>Atual</span><span><i class="p"></i>Proposto</span></div>
        ${gs.length ? barrasFin(gs.map(([g, v]) => [nomeCurto(porId.get(g)) || 'Sem setor', area ? corTipo((porId.get(g) || {}).tipo) : corArea(g), 'fa-building', v[0], v[1]]), maxG) : '<p class="s">Sem lançamentos.</p>'}</div>
    </div>
    <div class="cartao bl"><h3><i class="fa-solid fa-table-list"></i>Quadro por item (DGA, funções, bolsas e demais)</h3><p class="s">Quantidades e custo mensal com encargos, atual × proposto.</p>
      <div class="tab-wrap" style="margin-top:10px"><table class="tab"><thead><tr><th>Item</th><th>Tipo</th><th class="fin-num">Valor unitário</th><th class="fin-num">Qtd atual</th><th class="fin-num">Qtd proposta</th><th class="fin-num">Δ qtd</th><th class="fin-num">Mensal atual</th><th class="fin-num">Mensal proposto</th><th class="fin-num">Δ mensal</th></tr></thead>
      <tbody>${itens.map(o => `<tr><td><b>${esc(o.nome)}</b>${o.r && o.r.nome ? `<br><small style="color:var(--mut)">${esc(o.r.nome)}</small>` : ''}</td><td><span class="chip" style="--c:${(CATEG_FIN[o.cat] || CATEG_FIN.Outro)[0]}">${esc(o.cat)}</span></td><td class="fin-num">${o.r && o.r.id ? fmtM(o.r.valorMensal) : '—'}</td><td class="fin-num">${o.qa.toLocaleString('pt-BR')}</td><td class="fin-num">${o.qp.toLocaleString('pt-BR')}</td><td class="fin-num">${d0(o.qa, o.qp)}</td><td class="fin-num">${fmtM(o.ma)}</td><td class="fin-num">${fmtM(o.mp)}</td><td class="fin-num">${d0(o.ma, o.mp)}</td></tr>`).join('')}
      <tr class="fin-tot"><td colspan="3">Total</td><td class="fin-num">${tot.qa.toLocaleString('pt-BR')}</td><td class="fin-num">${tot.qp.toLocaleString('pt-BR')}</td><td class="fin-num">${d0(tot.qa, tot.qp)}</td><td class="fin-num">${fmtM(tot.ma)}</td><td class="fin-num">${fmtM(tot.mp)}</td><td class="fin-num">${d0(tot.ma, tot.mp)}</td></tr></tbody></table></div></div>`;
}
function finLancamentosCasca(){
  const cats = Object.keys(CATEG_FIN);
  return `<div class="adm-filtros">
      <div class="busca"><i class="fa-solid fa-magnifying-glass"></i><input id="fl-q" class="campo" placeholder="Buscar setor, item ou descrição" oninput="filtrarLancamentos()"></div>
      <select id="fl-cat" class="campo" onchange="filtrarLancamentos()"><option value="">Todos os tipos</option>${cats.map(c => `<option>${c}</option>`).join('')}</select>
      <select id="fl-cen" class="campo" onchange="filtrarLancamentos()"><option value="">Atual e proposto</option>${CENARIOS.map(c => `<option>${c}</option>`).join('')}</select>
      <button class="btn btn-s so-edit" onclick="reaplicarCargosChefia()" title="Lança o cargo do titular nas chefias que ainda não têm: Secretário DGA-1, Adjuntos DGA-2, Superintendentes DGA-3, Coordenadores DGA-5"><i class="fa-solid fa-user-tie"></i>Cargos das chefias</button>
    </div>
    <p style="font-size:12px;color:var(--mut);margin:-4px 0 10px"><i class="fa-solid fa-circle-info"></i> Titulares lançados automaticamente no cenário Atual: Secretário(a) de Estado <b>DGA-1</b>, Secretários Adjuntos <b>DGA-2</b>, Superintendentes <b>DGA-3</b>, Coordenadores <b>DGA-5</b> — como exclusivamente comissionados. Edite cada um para mudar o vínculo (servidor efetivo), o símbolo ou copiar para o Proposto.</p>
    <div id="fl-lista"></div>`;
}
function lancamentosFiltrados(){
  const q = norm(($('#fl-q') || {}).value || ''), cat = ($('#fl-cat') || {}).value || '', cen = ($('#fl-cen') || {}).value || '';
  return despesasFiltradas($('#f-area').value).map(d => ({ d, c:calcDesp(d), s:porId.get(d.setorId) }))
    .filter(o => (!cat || o.c.categoria === cat) && (!cen || (o.d.cenario || 'Atual') === cen) && (!q || norm(((o.s || {}).nome || '') + ' ' + ((o.s || {}).sigla || '') + ' ' + (o.c.r.codigo || '') + ' ' + (o.c.r.nome || '') + ' ' + o.d.descricao).includes(q)))
    .sort((a, b) => ((a.s || {}).nome || '').localeCompare((b.s || {}).nome || '', 'pt-BR') || (a.d.cenario || '').localeCompare(b.d.cenario || ''));
}
function filtrarLancamentos(){
  const el = $('#fl-lista'); if (!el) return;
  const l = lancamentosFiltrados();
  if (!l.length) { el.innerHTML = `<div class="cartao vazio">Nenhum lançamento${DB.despesas.length ? ' com esses filtros' : ''}. <button class="btn btn-p btn-sm so-edit" style="margin-left:8px" onclick="formDespesa()"><i class="fa-solid fa-plus"></i>Novo lançamento</button></div>`; return; }
  const t = totaisFin(l.map(o => o.d));
  el.innerHTML = `<div class="tab-wrap"><table class="tab"><thead><tr><th>Setor</th><th>Item</th><th class="fin-num">Qtd</th><th class="fin-num">Unitário</th><th class="fin-num">Encargos</th><th class="fin-num">Mensal</th><th class="fin-num">Meses</th><th class="fin-num">Anual</th><th>Cenário</th><th></th></tr></thead><tbody>
    ${l.map(({ d, c, s }) => `<tr><td>${s ? `<a href="#" style="color:var(--txt);text-decoration:none" onclick="event.preventDefault();irPara(${arg(s.id)})"><b>${esc(s.sigla ? s.sigla + ' · ' + s.nome : s.nome)}</b></a><br><small style="color:var(--mut)">${esc(caminho(s.id).slice(-2).map(nomeCurto).join(' › ') || 'Topo da estrutura')}</small>` : '<span style="color:var(--perigo)">setor removido</span>'}</td>
      <td><span class="chip" style="--c:${(CATEG_FIN[c.categoria] || CATEG_FIN.Outro)[0]}">${esc(c.r.codigo || c.categoria)}</span>${d.descricao ? `<br><small>${esc(d.descricao)}</small>` : (c.r.nome ? `<br><small style="color:var(--mut)">${esc(c.r.nome)}</small>` : '')}</td>
      <td class="fin-num">${c.qtd.toLocaleString('pt-BR')}</td><td class="fin-num">${fmtM(c.unit)}${d.valorUnitario !== '' ? ' <small title="Valor próprio, diferente da tabela">*</small>' : ''}${c.efetivo ? `<br><small style="color:var(--mut)">efetivo · ${numBR(c.r.percEfetivo).toLocaleString('pt-BR')}%</small>` : ''}</td><td class="fin-num">${c.enc ? c.enc.toLocaleString('pt-BR') + '%' : '—'}</td>
      <td class="fin-num"><b>${fmtM(c.mensal)}</b></td><td class="fin-num">${c.meses.toLocaleString('pt-BR')}</td><td class="fin-num">${fmtM(c.anual)}</td>
      <td><span class="chip" style="--c:${d.cenario === 'Proposto' ? '#7c3aed' : '#2563eb'}">${esc(d.cenario || 'Atual')}</span></td>
      <td><div class="u-acoes so-edit"><button class="btn btn-s btn-sm btn-i" title="Editar" onclick="formDespesa(${arg(d.id)})"><i class="fa-solid fa-pen"></i></button><button class="btn btn-s btn-sm btn-i" title="Copiar para o outro cenário" onclick="copiarCenario(${arg(d.id)})"><i class="fa-regular fa-copy"></i></button><button class="btn btn-perigo btn-sm btn-i" title="Excluir" onclick="excluirDespesa(${arg(d.id)})"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>`).join('')}
    <tr class="fin-tot"><td colspan="5">Atual (${t.Atual.n})</td><td class="fin-num">${fmtM(t.Atual.m)}</td><td></td><td class="fin-num">${fmtM(t.Atual.a)}</td><td colspan="2"></td></tr>
    <tr class="fin-tot"><td colspan="5">Proposto (${t.Proposto.n})</td><td class="fin-num">${fmtM(t.Proposto.m)}</td><td></td><td class="fin-num">${fmtM(t.Proposto.a)}</td><td colspan="2"></td></tr>
  </tbody></table></div><p style="font-size:12px;color:var(--mut);margin-top:8px">Mensal = quantidade × valor unitário × (1 + encargos). Anual = mensal × meses. * valor próprio do lançamento, diferente da tabela.</p>`;
}
function opcoesSetoresFin(sel){
  const ord = []; const visit = (s, d) => { ord.push([s, d]); filhosDe(s.id).forEach(k => visit(k, d + 1)); }; raizes().forEach(r => visit(r, 0));
  return ord.map(([s, d]) => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${'  '.repeat(Math.min(d, 6))}${esc(s.sigla ? s.sigla + ' · ' : '')}${esc(s.nome)}</option>`).join('');
}
function opcoesRubricas(sel){
  const g = {}; DB.rubricas.filter(r => r.ativo !== 'Não' || r.id === sel).forEach(r => (g[r.categoria || 'Outro'] = g[r.categoria || 'Outro'] || []).push(r));
  return `<option value="">— Sem item da tabela (valor próprio) —</option>` + Object.keys(g).map(c => `<optgroup label="${esc(c)}">${g[c].sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric:true })).map(r => `<option value="${esc(r.id)}" ${r.id === sel ? 'selected' : ''}>${esc(r.codigo || r.nome)} — ${esc(r.nome || '')} (${fmtM(r.valorMensal)})</option>`).join('')}</optgroup>`).join('');
}
function formDespesa(id, setorPadrao){
  if (somenteLeitura()) return toast('Seu perfil é somente leitura.', 'aviso');
  const d = DB.despesas.find(x => x.id === id) || novoReg('despesas', { setorId:setorPadrao || selId || '', quantidade:'1', cenario:'Atual' });
  const prev = m => {
    const o = { rubricaId:m.querySelector('#fd-rub').value, quantidade:m.querySelector('#fd-qtd').value, valorUnitario:m.querySelector('#fd-val').value, meses:m.querySelector('#fd-mes').value, vinculo:m.querySelector('#fd-vinc').value };
    const r = rubricaDe(o.rubricaId), temPe = !!(r && r.percEfetivo !== '');
    m.querySelector('#fd-vinc-cx').style.display = temPe ? '' : 'none'; if (!temPe) o.vinculo = '';
    m.querySelector('#fd-val').placeholder = r ? 'Tabela: ' + fmtM(numBR(r.valorMensal) * (o.vinculo === 'Efetivo' ? numBR(r.percEfetivo) / 100 : 1)) : 'Valor mensal';
    m.querySelector('#fd-mes').placeholder = r && r.meses ? r.meses : '12';
    const c = calcDesp(o); m.querySelector('#fd-prev').innerHTML = `<div>Total mensal${c.enc ? ` (com ${c.enc.toLocaleString('pt-BR')}% de encargos)` : ''}<b>${fmtM(c.mensal)}</b></div><div>Total anual (${c.meses.toLocaleString('pt-BR')} meses)<b>${fmtM(c.anual)}</b></div>`;
  };
  abrirModal({ titulo: id ? 'Editar lançamento' : 'Novo lançamento', rotulo: id ? 'Salvar' : 'Lançar', largura:540,
    html:`<label><span class="rot">Setor</span><select id="fd-set" class="campo" required>${d.setorId ? '' : '<option value="">Escolha o setor</option>'}${opcoesSetoresFin(d.setorId)}</select></label>
      <label><span class="rot">Item da tabela de valores</span><select id="fd-rub" class="campo">${opcoesRubricas(d.rubricaId)}</select></label>
      <label><span class="rot">Descrição <small>opcional</small></span><input id="fd-desc" class="campo" value="${esc(d.descricao)}" placeholder="ex.: Coordenador, bolsistas do programa X"></label>
      <div class="g2"><label><span class="rot">Quantidade</span><input id="fd-qtd" class="campo" type="number" min="0" step="any" value="${esc(d.quantidade)}"></label>
      <label><span class="rot">Valor unitário mensal <small>vazio = tabela</small></span><input id="fd-val" class="campo" type="number" min="0" step="0.01" value="${esc(d.valorUnitario)}"></label></div>
      <div class="g2"><label><span class="rot">Meses no ano <small>vazio = tabela</small></span><input id="fd-mes" class="campo" type="number" min="0" max="13.34" step="any" value="${esc(d.meses)}"></label>
      <label><span class="rot">Cenário</span><select id="fd-cen" class="campo">${CENARIOS.map(c => `<option ${c === (d.cenario || 'Atual') ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
      <label id="fd-vinc-cx"><span class="rot">Ocupante do cargo</span><select id="fd-vinc" class="campo"><option value="Comissionado" ${d.vinculo !== 'Efetivo' ? 'selected' : ''}>Exclusivamente comissionado (100% do subsídio)</option><option value="Efetivo" ${d.vinculo === 'Efetivo' ? 'selected' : ''}>Servidor efetivo (gratificação de % do subsídio)</option></select></label>
      <label><span class="rot">Observação</span><input id="fd-obs" class="campo" value="${esc(d.observacao)}"></label>
      <div class="fin-prev" id="fd-prev"></div>`,
    aoConfirmar: async m => {
      const v = { setorId:m.querySelector('#fd-set').value, rubricaId:m.querySelector('#fd-rub').value, descricao:m.querySelector('#fd-desc').value.trim(), quantidade:m.querySelector('#fd-qtd').value, valorUnitario:m.querySelector('#fd-val').value, meses:m.querySelector('#fd-mes').value, cenario:m.querySelector('#fd-cen').value, observacao:m.querySelector('#fd-obs').value.trim(), vinculo:'' };
      const rr = rubricaDe(v.rubricaId); if (rr && rr.percEfetivo !== '') v.vinculo = m.querySelector('#fd-vinc').value;
      if (!v.setorId) throw new Error('Escolha o setor.');
      if (!v.rubricaId && v.valorUnitario === '') throw new Error('Escolha um item da tabela ou informe o valor unitário.');
      if (!v.rubricaId && !v.descricao) throw new Error('Sem item da tabela, descreva a despesa.');
      Object.assign(d, v, { atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      if (!DB.despesas.includes(d)) { d.id = novoId('fd'); DB.despesas.push(d); }
      enfileirar('despesas', d);
      const c = calcDesp(d); registrar(d.setorId, `Financeiro: ${id ? 'alterou' : 'lançou'} ${c.r.codigo || d.descricao} × ${c.qtd.toLocaleString('pt-BR')} (${d.cenario}) = ${fmtM(c.mensal)}/mês`);
      return true;
    }
  }).then(ok => { if (ok) { toast('Lançamento salvo.'); posFinanceiro(); } });
  const m = document.querySelectorAll('.modal'); const mm = m[m.length - 1];
  mm.querySelectorAll('#fd-rub,#fd-qtd,#fd-val,#fd-mes,#fd-vinc').forEach(i => i.addEventListener('input', () => prev(mm))); prev(mm);
}
function posFinanceiro(){ salvarLocal(); if (vistaAtual === 'financeiro') renderFinanceiro(); if (selId && $('#painel').classList.contains('aberto')) renderPainel(); }
function copiarCenario(id){
  const d = DB.despesas.find(x => x.id === id); if (!d || somenteLeitura()) return;
  const n = novoReg('despesas', Object.assign({}, d, { id:novoId('fd'), cenario:d.cenario === 'Proposto' ? 'Atual' : 'Proposto', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }));
  DB.despesas.push(n); enfileirar('despesas', n); toast(`Copiado para o cenário ${n.cenario}.`); posFinanceiro();
}
async function excluirDespesa(id){
  const d = DB.despesas.find(x => x.id === id); if (!d || somenteLeitura()) return;
  if (!await confirmar('Excluir lançamento', 'Excluir este lançamento financeiro?', 'Excluir', true)) return;
  DB.despesas = DB.despesas.filter(x => x !== d); enfileirar('despesas', d, true);
  const c = calcDesp(d); registrar(d.setorId, `Financeiro: excluiu ${c.r.codigo || d.descricao} (${d.cenario})`);
  posFinanceiro();
}
/* Tabela de valores */
function finTabela(){
  const usos = id => DB.despesas.filter(d => d.rubricaId === id).length;
  const ro = somenteLeitura() ? 'disabled' : '';
  const lin = r => `<tr data-id="${esc(r.id)}" style="${r.ativo === 'Não' ? 'opacity:.55' : ''}">
    <td><input class="campo fin-edit" ${ro} value="${esc(r.codigo)}" onchange="alterarRubrica(${arg(r.id)},'codigo',this.value)" placeholder="DGA-1"></td>
    <td><input class="campo fin-edit" ${ro} value="${esc(r.nome)}" onchange="alterarRubrica(${arg(r.id)},'nome',this.value)" placeholder="Descrição">${r.fonte ? `<small style="display:block;color:var(--mut);font-size:10.5px;margin-top:2px" title="Fonte / base legal"><i class="fa-solid fa-scale-balanced"></i> ${esc(r.fonte)}</small>` : ''}</td>
    <td><select class="campo fin-edit" ${ro} onchange="alterarRubrica(${arg(r.id)},'categoria',this.value)">${Object.keys(CATEG_FIN).map(c => `<option ${c === r.categoria ? 'selected' : ''}>${c}</option>`).join('')}</select></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" step="0.01" value="${esc(r.valorMensal)}" onchange="alterarRubrica(${arg(r.id)},'valorMensal',this.value)" placeholder="0,00"></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" step="0.01" value="${esc(r.encargos)}" onchange="alterarRubrica(${arg(r.id)},'encargos',this.value)" placeholder="0" style="min-width:60px"></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" max="13.34" step="any" value="${esc(r.meses)}" onchange="alterarRubrica(${arg(r.id)},'meses',this.value)" placeholder="12" style="min-width:60px"></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" max="100" step="0.01" value="${esc(r.percEfetivo)}" onchange="alterarRubrica(${arg(r.id)},'percEfetivo',this.value)" placeholder="—" style="min-width:60px" title="Percentual do valor pago quando o ocupante é servidor efetivo (gratificação)"></td>
    <td class="fin-num">${usos(r.id)}</td>
    <td><div class="u-acoes so-edit"><button class="btn btn-s btn-sm btn-i" title="${r.ativo === 'Não' ? 'Reativar' : 'Desativar (some da lista de lançamento)'}" onclick="alterarRubrica(${arg(r.id)},'ativo','${r.ativo === 'Não' ? 'Sim' : 'Não'}');renderFinanceiro()"><i class="fa-solid ${r.ativo === 'Não' ? 'fa-eye' : 'fa-eye-slash'}"></i></button><button class="btn btn-perigo btn-sm btn-i" title="Excluir" onclick="excluirRubrica(${arg(r.id)})"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>`;
  const ord = [...DB.rubricas].sort((a, b) => Object.keys(CATEG_FIN).indexOf(a.categoria) - Object.keys(CATEG_FIN).indexOf(b.categoria) || String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric:true }));
  return `<div class="cartao bl" style="margin-bottom:14px"><h3><i class="fa-solid fa-table"></i>Tabela de valores</h3>
      <p class="s">Valores mensais usados nos cálculos: símbolos DGA dos cargos em comissão, funções gratificadas, bolsas e demais itens. <b>Encargos</b> soma um percentual ao valor (ex.: contribuição patronal). <b>Meses por ano</b>: 12 por padrão; use 13,33 para incluir 13º e 1/3 de férias. Mudar um valor aqui atualiza todos os lançamentos que usam o item.</p>
      <div class="acoes so-edit"><button class="btn btn-p" onclick="novaRubrica()"><i class="fa-solid fa-plus"></i>Novo item</button><button class="btn btn-s" onclick="atualizarDGAOficial()"><i class="fa-solid fa-scale-balanced"></i>Atualizar DGA pela LC 755/2023</button><button class="btn btn-s" onclick="reajusteTabela()"><i class="fa-solid fa-percent"></i>Aplicar reajuste (RGA)</button>${DB.rubricas.some(r => r.categoria !== 'Cargo em comissão (DGA)') ? '' : '<button class="btn btn-s" onclick="modeloRubricas()"><i class="fa-solid fa-wand-magic-sparkles"></i>Incluir modelos de função, bolsa e diária</button>'}</div>
      <p class="s" style="margin-top:10px;font-size:12px"><i class="fa-solid fa-circle-info"></i> DGA-1 a DGA-10: subsídio dos cargos em comissão do Executivo de MT, conforme o Anexo V da LC 266/2006 na redação da <b>LC nº 755, de 12/01/2023</b>. O servidor efetivo nomeado em cargo DGA recebe a gratificação de <b>70%</b> (DGA-1 a 6) ou <b>85%</b> (DGA-7 a 10) desse valor. Se houver reajuste posterior (revisão geral anual), use "Aplicar reajuste" ou edite os valores.</p></div>
    ${DB.rubricas.length ? `<div class="tab-wrap"><table class="tab"><thead><tr><th style="min-width:100px">Código</th><th style="min-width:200px">Descrição</th><th style="min-width:170px">Tipo</th><th class="fin-num" style="min-width:120px">Valor mensal (R$)</th><th class="fin-num">Encargos %</th><th class="fin-num">Meses/ano</th><th class="fin-num" title="Percentual pago ao servidor efetivo nomeado no cargo">% efetivo</th><th class="fin-num">Usos</th><th></th></tr></thead><tbody>${ord.map(lin).join('')}</tbody></table></div>` : '<div class="cartao vazio">Nenhum item cadastrado.</div>'}`;
}
function alterarRubrica(id, campo, valor){
  if (somenteLeitura()) return;
  const r = rubricaDe(id); if (!r || r[campo] === String(valor)) return;
  r[campo] = String(valor); r.atualizadoEm = agora(); r.atualizadoPor = cfg.usuario || '';
  if (campo === 'valorMensal' && r.fonte && !/editado/.test(r.fonte)) r.fonte += ' · valor editado em ' + new Date().toLocaleDateString('pt-BR');
  enfileirar('rubricas', r); salvarLocal();
}
function novaRubrica(){
  if (somenteLeitura()) return;
  const r = novoReg('rubricas', { id:novoId('rb'), codigo:'', nome:'', categoria:'Cargo em comissão (DGA)', valorMensal:'', encargos:'', meses:'12', ativo:'Sim', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
  DB.rubricas.push(r); enfileirar('rubricas', r); renderFinanceiro();
  setTimeout(() => { const i = document.querySelector(`tr[data-id="${r.id}"] input`); if (i) i.focus(); }, 50);
}
async function excluirRubrica(id){
  const r = rubricaDe(id); if (!r || somenteLeitura()) return;
  const n = DB.despesas.filter(d => d.rubricaId === id).length + (DB.propostas || []).reduce((t, p) => t + itensProp(p).filter(i => i.rubricaId === id).length, 0);
  if (n) return toast(`Este item é usado em ${n} lançamento(s) ou proposta(s). Desative-o em vez de excluir.`, 'aviso');
  if (!await confirmar('Excluir item', `Excluir <b>${esc(r.codigo || r.nome || 'item')}</b> da tabela de valores?`, 'Excluir', true)) return;
  DB.rubricas = DB.rubricas.filter(x => x !== r); enfileirar('rubricas', r, true); salvarLocal(); renderFinanceiro();
}
function modeloRubricas(){
  if (somenteLeitura()) return;
  carregarDGA(false);
  const base = [];
  base.push(['FG', 'Função gratificada', 'Função gratificada'], ['BOLSA', 'Bolsa (programa)', 'Bolsa'], ['EFETIVO', 'Servidor efetivo (média)', 'Pessoal efetivo'], ['DIÁRIA', 'Diária', 'Diárias e passagens']);
  base.filter(([codigo]) => !DB.rubricas.some(x => x.codigo === codigo)).forEach(([codigo, nome, categoria]) => { const r = novoReg('rubricas', { id:novoId('rb'), codigo, nome, categoria, valorMensal:'', encargos:'', meses:'12', ativo:'Sim', observacao:'Preencher com o valor vigente', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.rubricas.push(r); enfileirar('rubricas', r); });
  renderFinanceiro(); toast('Modelo criado: DGA-1 a DGA-10 com os valores da LC 755/2023 e itens de função, bolsa, efetivo e diária para preencher.');
}
/* Calculadora */
function finCalc(){
  if (!calcLinhas.length) calcLinhas = [{ rub:'', qtd:'1', meses:'', vinc:'Comissionado' }];
  return `<div class="cartao bl"><h3><i class="fa-solid fa-calculator"></i>Calculadora rápida</h3><p class="s">Simule combinações (ex.: 3 × DGA-2 + 10 bolsas) sem gravar nada. Se quiser, lance o resultado num setor.</p>
    <div id="calc-ls" style="margin-top:12px"></div>
    <div class="acoes" style="justify-content:space-between;flex-wrap:wrap"><button class="btn btn-s" onclick="calcLinhas.push({rub:'',qtd:'1',meses:'',vinc:'Comissionado'});desenharCalc()"><i class="fa-solid fa-plus"></i>Adicionar linha</button><div class="fin-prev" id="calc-tot" style="flex:1;max-width:420px"></div></div>
    <div class="acoes so-edit" style="margin-top:12px;flex-wrap:wrap"><select id="calc-set" class="campo" style="width:auto;max-width:100%"><option value="">Lançar em qual setor?</option>${opcoesSetoresFin(selId)}</select><select id="calc-cen" class="campo" style="width:auto">${CENARIOS.map(c => `<option>${c}</option>`).join('')}</select><button class="btn btn-p" onclick="lancarCalc()"><i class="fa-solid fa-file-import"></i>Lançar no setor</button></div></div>`;
}
function desenharCalc(){
  const el = $('#calc-ls'); if (!el) return;
  el.innerHTML = calcLinhas.map((l, i) => { const c = calcDesp({ rubricaId:l.rub, quantidade:l.qtd, valorUnitario:'', meses:l.meses, vinculo:l.vinc }); const rr = rubricaDe(l.rub), temPe = !!(rr && rr.percEfetivo !== ''); return `<div class="calc-l"><select class="campo" onchange="calcLinhas[${i}].rub=this.value;desenharCalc()">${opcoesRubricas(l.rub).replace('— Sem item da tabela (valor próprio) —', 'Escolha um item')}</select><input class="campo" type="number" min="0" step="any" value="${esc(l.qtd)}" title="Quantidade" oninput="calcLinhas[${i}].qtd=this.value;desenharCalcTot(this,${i})"><input class="campo" type="number" min="0" step="any" value="${esc(l.meses)}" placeholder="${c.meses}" title="Meses" oninput="calcLinhas[${i}].meses=this.value;desenharCalcTot(this,${i})"><span class="v" data-i="${i}">${fmtM(c.mensal)}/mês</span>${temPe ? `<select class="campo" style="grid-column:1/-2;height:32px;font-size:12px" onchange="calcLinhas[${i}].vinc=this.value;desenharCalc()"><option value="Comissionado" ${l.vinc !== 'Efetivo' ? 'selected' : ''}>Exclusivamente comissionado (100%)</option><option value="Efetivo" ${l.vinc === 'Efetivo' ? 'selected' : ''}>Servidor efetivo (${numBR(rr.percEfetivo).toLocaleString('pt-BR')}% do subsídio)</option></select>` : ''}<button class="btn btn-s btn-i" title="Remover" onclick="calcLinhas.splice(${i},1);desenharCalc()"><i class="fa-solid fa-xmark"></i></button></div>`; }).join('');
  desenharCalcTot();
}
function desenharCalcTot(){
  let m = 0, a = 0; calcLinhas.forEach((l, i) => { const c = calcDesp({ rubricaId:l.rub, quantidade:l.qtd, valorUnitario:'', meses:l.meses, vinculo:l.vinc }); m += c.mensal; a += c.anual; const v = document.querySelector(`.calc-l .v[data-i="${i}"]`); if (v) v.textContent = fmtM(c.mensal) + '/mês'; });
  const t = $('#calc-tot'); if (t) t.innerHTML = `<div>Total mensal<b>${fmtM(m)}</b></div><div>Total anual<b>${fmtM(a)}</b></div>`;
}
function lancarCalc(){
  if (somenteLeitura()) return;
  const sid = $('#calc-set').value, cen = $('#calc-cen').value; if (!sid) return toast('Escolha o setor.', 'aviso');
  const ok = calcLinhas.filter(l => l.rub && numBR(l.qtd)); if (!ok.length) return toast('Nenhuma linha com item e quantidade.', 'aviso');
  ok.forEach(l => { const rr = rubricaDe(l.rub); const d = novoReg('despesas', { id:novoId('fd'), setorId:sid, rubricaId:l.rub, quantidade:l.qtd, meses:l.meses, cenario:cen, vinculo:rr && rr.percEfetivo !== '' ? (l.vinc || 'Comissionado') : '', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.despesas.push(d); enfileirar('despesas', d); });
  registrar(sid, `Financeiro: ${ok.length} lançamento(s) pela calculadora (${cen})`);
  toast(`${ok.length} lançamento(s) feitos em ${nomeCurto(porId.get(sid))}.`); calcLinhas = []; abaFin('lancamentos');
}
function exportarFinanceiro(){
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', n = v => numBR(v).toFixed(2).replace('.', ',');
  const l = DB.despesas.map(d => ({ d, c:calcDesp(d), s:porId.get(d.setorId) }));
  const csv = '﻿' + ['Setor;Sigla;Área;Item;Tipo;Descrição;Ocupante;Quantidade;Valor unitário;Encargos %;Mensal;Meses;Anual;Cenário;Observação', ...l.map(({ d, c, s }) => [s ? s.nome : '(removido)', s ? s.sigla : '', nomeCurto(porId.get(areaDe.get(d.setorId))), c.r.codigo || '', c.categoria, d.descricao, d.vinculo === 'Efetivo' ? 'Servidor efetivo' : (d.vinculo ? 'Comissionado' : ''), c.qtd, n(c.unit), c.enc, n(c.mensal), c.meses, n(c.anual), d.cenario || 'Atual', d.observacao].map(q).join(';'))].join('\r\n');
  baixarArquivo('gaborg-financeiro-' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
}
/* Bloco financeiro no painel do setor (aba Valores) */
function blocoFinSetor(s){
  const p = custoSetorFin(s.id, false), t = custoSetorFin(s.id, true), lst = DB.despesas.filter(d => d.setorId === s.id);
  const temSub = descendentes(s.id).size > 0;
  return `<div class="sec-t" style="margin-top:18px"><i class="fa-solid fa-sack-dollar"></i>Financeiro (lançamentos)</div>
    <div class="fin-prev"><div>Mensal atual<b>${fmtM0(p.Atual.m)}</b></div><div>Mensal proposto<b>${fmtM0(p.Proposto.m)}</b></div>${temSub ? `<div>Com subordinados · atual<b>${fmtM0(t.Atual.m)}</b></div><div>Com subordinados · proposto<b>${fmtM0(t.Proposto.m)}</b></div>` : ''}</div>
    ${lst.length ? `<div class="tab-wrap" style="margin-top:10px"><table class="tab"><tbody>${lst.map(d => { const c = calcDesp(d); return `<tr><td><b>${esc(c.r.codigo || d.descricao || c.categoria)}</b> × ${c.qtd.toLocaleString('pt-BR')}<br><small style="color:var(--mut)">${esc(d.cenario || 'Atual')}</small></td><td class="fin-num">${fmtM(c.mensal)}/mês</td><td><div class="u-acoes so-edit"><button class="btn btn-s btn-sm btn-i" onclick="formDespesa(${arg(d.id)})" title="Editar"><i class="fa-solid fa-pen"></i></button></div></td></tr>`; }).join('')}</tbody></table></div>` : '<p style="font-size:12.5px;color:var(--mut)">Nenhum lançamento financeiro neste setor.</p>'}
    <div class="acoes" style="margin-top:10px"><button class="btn btn-p btn-sm so-edit" onclick="formDespesa('', ${arg(s.id)})"><i class="fa-solid fa-plus"></i>Lançamento</button><button class="btn btn-s btn-sm" onclick="trocarVista('financeiro');abaFin('lancamentos');setTimeout(()=>{const q=$('#fl-q');if(q){q.value=${arg(s.sigla || s.nome)};filtrarLancamentos()}},50)"><i class="fa-solid fa-arrow-up-right-from-square"></i>Abrir no Financeiro</button></div>`;
}

/* ===================== PROPOSTAS (cenários de estrutura e valores) ===================== */
const STATUS_PROP = { 'Rascunho':'#64748b', 'Em análise':'#d97706', 'Aprovada':'#16a34a', 'Aplicada':'#2563eb', 'Arquivada':'#94a3b8' };
const TIPOS_ALT = {
  novo:['fa-square-plus', 'Criar setor', '#16a34a'], extinguir:['fa-square-minus', 'Extinguir setor', '#dc2626'], mover:['fa-arrows-up-down-left-right', 'Mudar subordinação', '#7c3aed'],
  renomear:['fa-pen', 'Renomear / mudar tipo', '#0891b2'], cargo:['fa-user-tie', 'Trocar cargo do titular', '#ea580c'], despesa:['fa-coins', 'Despesa ou bolsa', '#ca8a04']
};
let propSel = '', abaPropAtual = 'propostas';
const itensProp = p => { try { const a = JSON.parse(p.itens || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
function salvarItensProp(p, itens, msgHist){
  p.itens = JSON.stringify(itens); p.atualizadoEm = agora(); p.atualizadoPor = cfg.usuario || '';
  enfileirar('propostas', p); salvarLocal();
}
function backendSemPropostas(){ return online() && backendVersao && backendVersao.localeCompare('1.8.0', undefined, { numeric:true }) < 0; }
/* Estrutura resultante da proposta (cópia virtual; nada muda na estrutura real) */
const CAMPOS_COMPARA = ['nome','sigla','tipo','paiId','status','responsavel','contato','competencias','entregas','orcamento','custoMensal','servidores','comissionados','impacto','impactoDescricao','positivos','negativos','quantidade'];
const CAMPOS_DADOS = CAMPOS_COMPARA.filter(c => !['nome','sigla','tipo','paiId','status'].includes(c));
function setoresOficiais(){ return cenSwap ? DBoficial : DB.setores; }
function overridesDe(pid){ return (DB.propSetores || []).filter(o => o.propostaId === pid); }
function deOverride(o){ const s = {}; CAMPOS.setores.forEach(k => s[k] = o[k] ?? ''); s.id = o.setorId; return novoReg('setores', s); }
function paraOverride(pid, s, excluido){ const o = { id:pid + '_' + s.id, propostaId:pid, setorId:s.id, excluido:excluido ? 'Sim' : '' }; CAMPOS.setores.forEach(k => { if (k !== 'id') o[k] = s[k] ?? ''; }); return novoReg('propSetores', o); }
function estruturaProposta(p){
  const oficiais = setoresOficiais(), ofMap = new Map(oficiais.map(s => [s.id, s]));
  const lista = oficiais.map(s => Object.assign({}, s, { _marcas:[] })), mapa = new Map(lista.map(s => [s.id, s]));
  const cargos = new Set();
  itensProp(p).forEach(it => {   // alterações registradas como itens (versão anterior)
    if (it.tipo === 'novo' && !mapa.has(it.novoId)) { const s = novoReg('setores', { id:it.novoId, nome:it.nome || 'Novo setor', sigla:it.sigla || '', tipo:it.tipoSetor || 'Coordenadoria', paiId:it.paiId || '', status:'Proposto', ordem:'999' }); s._marcas = []; lista.push(s); mapa.set(s.id, s); }
    const s = mapa.get(it.setorId); if (!s) return;
    if (it.tipo === 'extinguir') { const alvo = [s.id]; if (it.comSub) { const vis = id => lista.filter(x => x.paiId === id).forEach(x => { alvo.push(x.id); vis(x.id); }); vis(s.id); } alvo.forEach(id => { mapa.get(id).status = 'Extinto'; }); }
    if (it.tipo === 'mover' && it.paiId && it.paiId !== s.id) s.paiId = it.paiId;
    if (it.tipo === 'renomear') { if (it.nome) s.nome = it.nome; if (it.sigla) s.sigla = it.sigla; if (it.tipoSetor) s.tipo = it.tipoSetor; }
    if (it.tipo === 'cargo') cargos.add(s.id);
  });
  overridesDe(p.id).forEach(o => {   // edições feitas diretamente no mapa da proposta
    const s = Object.assign(deOverride(o), { _marcas:[] }); if (o.excluido === 'Sim') s.status = 'Extinto';
    const i = lista.findIndex(x => x.id === s.id); if (i >= 0) lista[i] = s; else lista.push(s); mapa.set(s.id, s);
  });
  lista.forEach(s => marcarSetor(s, ofMap.get(s.id), cargos.has(s.id)));
  return { lista, mapa };
}
function marcarSetor(s, of, cargo){
  const m = [];
  if (!of) m.push('novo');
  else {
    if (s.status === 'Extinto' && of.status !== 'Extinto') m.push('extinto');
    if ((s.paiId || '') !== (of.paiId || '')) { m.push('movido'); s._paiOrig = of.paiId || ''; } else delete s._paiOrig;
    if (s.nome !== of.nome || (s.sigla || '') !== (of.sigla || '') || s.tipo !== of.tipo) m.push('renomeado');
    if (CAMPOS_DADOS.some(c => String(s[c] ?? '') !== String(of[c] ?? ''))) m.push('editado');
  }
  if (cargo) m.push('cargo');
  s._marcas = m;
}
/* Linhas de custo da proposta: base atual − setores extintos ± trocas de cargo + novas despesas/bolsas */
function custoProposta(p){
  const E = estruturaProposta(p), extinto = id => { const s = E.mapa.get(id); return !s || s.status === 'Extinto'; };
  let linhas = DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual').map(d => Object.assign({}, d, { _orig:d.id }));
  itensProp(p).forEach(it => {
    if (it.tipo === 'novo' && it.rubricaId) linhas.push(novoReg('despesas', { id:'v' + it.id, setorId:it.novoId, rubricaId:it.rubricaId, quantidade:'1', vinculo:it.vinculo || 'Comissionado', descricao:'Titular (novo setor)', observacao:MARCA_CHEFIA }));
    if (it.tipo === 'cargo' && it.setorId) {
      const l = linhas.find(x => x.setorId === it.setorId && x.observacao === MARCA_CHEFIA);
      if (it.rubricaId === '__remover') { if (l) linhas = linhas.filter(x => x !== l); }
      else if (l) { l.rubricaId = it.rubricaId; l.vinculo = it.vinculo || l.vinculo; l.valorUnitario = ''; }
      else linhas.push(novoReg('despesas', { id:'v' + it.id, setorId:it.setorId, rubricaId:it.rubricaId, quantidade:'1', vinculo:it.vinculo || 'Comissionado', descricao:'Titular', observacao:MARCA_CHEFIA }));
    }
    if (it.tipo === 'despesa') linhas.push(novoReg('despesas', { id:'v' + it.id, setorId:it.setorId || '', rubricaId:it.rubricaId || '', quantidade:String(it.qtd ?? '1'), valorUnitario:it.valor || '', meses:it.meses || '', vinculo:it.vinculo || '', descricao:it.descricao || '' }));
  });
  linhas = linhas.filter(l => !l.setorId || !extinto(l.setorId));
  let m = 0, a = 0; linhas.forEach(l => { const c = calcDesp(l); m += c.mensal; a += c.anual; });
  return { E, linhas, m, a };
}
function baseAtual(){ let m = 0, a = 0; DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual').forEach(d => { const c = calcDesp(d); m += c.mensal; a += c.anual; }); return { m, a }; }
function abaProp(a){ abaPropAtual = a; document.querySelectorAll('.prop-abas button').forEach(b => b.classList.toggle('on', b.dataset.aba === a)); renderPropostas(); }
function renderPropostas(){
  const c = $('#pr-corpo'); if (!c) return;
  const aviso = backendSemPropostas() ? `<div class="cartao bl" style="border-color:#f59e0b;margin-bottom:14px"><h3 style="color:#b45309"><i class="fa-solid fa-triangle-exclamation"></i>Atualize o backend</h3><p class="s">A planilha está com o Codigo.gs v${esc(backendVersao)}. Para gravar as propostas na planilha, cole o Codigo.gs novo no Apps Script e publique uma nova versão.</p></div>` : '';
  if (abaPropAtual === 'bolsas') { c.innerHTML = aviso + renderBolsas(); return; }
  if (propSel && !DB.propostas.some(p => p.id === propSel)) propSel = '';
  const base = baseAtual();
  const lista = [...DB.propostas].sort((a, b) => (b.atualizadoEm || '').localeCompare(a.atualizadoEm || ''));
  c.innerHTML = aviso + `<div class="prop-grade">
    <div class="prop-lista">
      <button class="btn btn-p so-edit" style="width:100%;margin-bottom:10px" onclick="novaProposta()"><i class="fa-solid fa-plus"></i>Nova proposta</button>
      ${lista.length ? lista.map(p => { const cp = custoProposta(p), dif = cp.m - base.m, n = itensProp(p).length; return `<button class="prop-card ${p.id === propSel ? 'on' : ''}" onclick="propSel=${esc(JSON.stringify(p.id))};renderPropostas()">
        <span class="chip" style="--c:${STATUS_PROP[p.status] || '#64748b'}">${esc(p.status || 'Rascunho')}</span>
        <b>${esc(p.nome || 'Sem nome')}</b><small>${n} alteração(ões) · ${p.atualizadoPor ? esc(p.atualizadoPor) + ' · ' : ''}${p.atualizadoEm ? new Date(p.atualizadoEm).toLocaleDateString('pt-BR') : ''}</small>
        <small>${overridesDe(p.id).length} setor(es) editado(s) no mapa</small><span class="prop-dif ${dif > 0 ? 'fin-pos' : dif < 0 ? 'fin-neg' : ''}">${dif ? (dif > 0 ? '+' : '−') + fmtM0(Math.abs(dif)) + '/mês' : 'sem impacto financeiro'}</span></button>`; }).join('') : '<div class="cartao vazio">Nenhuma proposta ainda.</div>'}
    </div>
    <div class="prop-det">${propSel ? detalheProposta(DB.propostas.find(p => p.id === propSel), base) : `<div class="cartao bl"><h3><i class="fa-solid fa-lightbulb"></i>Propostas de estrutura e valores</h3><p class="s" style="line-height:1.7">Monte cenários sem mexer na estrutura oficial: <b>crie, extinga, mova ou renomeie setores</b>, <b>troque o cargo DGA</b> dos titulares e <b>inclua despesas e bolsas</b> com custos próprios. Cada proposta mostra o custo mensal e anual comparado ao atual, a diferença por item (DGA e bolsas) e a estrutura resultante. Quando uma proposta for aprovada, um administrador pode <b>aplicá-la</b> à estrutura oficial.</p><div class="acoes so-edit"><button class="btn btn-p" onclick="novaProposta()"><i class="fa-solid fa-plus"></i>Criar a primeira proposta</button></div></div>`}</div>
  </div>`;
}
function novaProposta(copiaDe){
  if (somenteLeitura()) return toast('Seu perfil é somente leitura.', 'aviso');
  const o = copiaDe ? DB.propostas.find(p => p.id === copiaDe) : null;
  abrirModal({ titulo: o ? 'Duplicar proposta' : 'Nova proposta', rotulo: o ? 'Duplicar' : 'Criar', largura:480,
    html:`<label><span class="rot">Nome da proposta</span><input id="np-nome" class="campo" required value="${o ? esc(o.nome + ' (cópia)') : ''}" placeholder="ex.: Reestruturação da SAGP 2027"></label>
      <label><span class="rot">Descrição / justificativa</span><textarea id="np-desc" class="campo" rows="3">${o ? esc(o.descricao) : ''}</textarea></label>`,
    aoConfirmar: async m => {
      const nome = m.querySelector('#np-nome').value.trim(); if (!nome) throw new Error('Dê um nome à proposta.');
      const p = novoReg('propostas', { id:novoId('pp'), nome, descricao:m.querySelector('#np-desc').value.trim(), status:'Rascunho', itens:o ? o.itens : '[]', criadoEm:agora(), criadoPor:cfg.usuario || '', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      DB.propostas.push(p); enfileirar('propostas', p);
      if (o) overridesDe(o.id).forEach(x => { const n = novoReg('propSetores', Object.assign({}, x, { id:p.id + '_' + x.setorId, propostaId:p.id })); DB.propSetores.push(n); enfileirar('propSetores', n); });
      salvarLocal(); propSel = p.id; return true;
    }
  }).then(ok => { if (ok) { abaProp('propostas'); } });
}
function nomeVirt(E, id){ const s = E.mapa.get(id); return s ? (s.sigla ? s.sigla + ' · ' : '') + s.nome : '(setor removido)'; }
function descreverAlt(it, E){
  const r = it.rubricaId && it.rubricaId !== '__remover' ? rubricaDe(it.rubricaId) : null, rn = r ? (r.codigo || r.nome) : '';
  if (it.tipo === 'novo') return `<b>${esc(it.nome)}</b>${it.sigla ? ' (' + esc(it.sigla) + ')' : ''} · ${esc(it.tipoSetor || '')} · subordinado a ${esc(nomeVirt(E, it.paiId))}${rn ? ` · titular <b>${esc(rn)}</b>${it.vinculo === 'Efetivo' ? ' (efetivo)' : ''}` : ''}`;
  if (it.tipo === 'extinguir') return `<b>${esc(nomeVirt(E, it.setorId))}</b>${it.comSub ? ' e todos os subordinados' : ' (subordinados ficam sem superior até serem movidos)'}`;
  if (it.tipo === 'mover') return `<b>${esc(nomeVirt(E, it.setorId))}</b> passa a responder a <b>${esc(nomeVirt(E, it.paiId))}</b>`;
  if (it.tipo === 'renomear') { const s = DB.setores.find(x => x.id === it.setorId); return `<b>${esc(s ? s.nome : nomeVirt(E, it.setorId))}</b> → ${esc(it.nome || '(mesmo nome)')}${it.tipoSetor ? ' · tipo ' + esc(it.tipoSetor) : ''}`; }
  if (it.tipo === 'cargo') return `<b>${esc(nomeVirt(E, it.setorId))}</b>: titular ${it.rubricaId === '__remover' ? '<b>sem cargo em comissão</b>' : `passa a <b>${esc(rn)}</b>${it.vinculo === 'Efetivo' ? ' (efetivo)' : ''}`}`;
  if (it.tipo === 'despesa') { const c = calcDesp({ rubricaId:it.rubricaId || '', quantidade:String(it.qtd ?? 1), valorUnitario:it.valor || '', meses:it.meses || '', vinculo:it.vinculo || '' }); return `${esc(rn || it.descricao || 'Despesa')} × <b>${numBR(it.qtd).toLocaleString('pt-BR')}</b>${it.descricao && rn ? ' · ' + esc(it.descricao) : ''} em ${esc(nomeVirt(E, it.setorId))} · <b>${fmtM(c.mensal)}/mês</b>${c.meses !== 12 ? ` (${c.meses.toLocaleString('pt-BR')} meses)` : ''}`; }
  return '';
}
function detalheProposta(p, base){
  const cp = custoProposta(p), itens = itensProp(p), dif = cp.m - base.m, difA = cp.a - base.a, E = cp.E, ro = somenteLeitura();
  const novos = E.lista.filter(s => s._marcas.includes('novo')).length, ext = E.lista.filter(s => s._marcas.includes('extinto')).length;
  // comparativo por item
  const porItem = new Map(); const soma = (lst, k) => lst.forEach(l => { const c = calcDesp(l), key = l.rubricaId || '__' + (l.descricao || 'Valor próprio'); const o = porItem.get(key) || { nome:c.r.codigo || l.descricao || 'Valor próprio', cat:c.categoria, qa:0, qp:0, ma:0, mp:0 }; o['q' + k] += c.qtd; o['m' + k] += c.mensal; porItem.set(key, o); });
  soma(DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual'), 'a'); soma(cp.linhas, 'p');
  const linhasItem = [...porItem.values()].filter(o => o.qa || o.qp).sort((a, b) => Object.keys(CATEG_FIN).indexOf(a.cat) - Object.keys(CATEG_FIN).indexOf(b.cat) || String(a.nome).localeCompare(String(b.nome), 'pt-BR', { numeric:true }));
  const dv = (a, b, moeda) => { const x = b - a; return x ? `<span class="${x > 0 ? 'fin-pos' : 'fin-neg'}">${x > 0 ? '+' : '−'}${moeda ? fmtM(Math.abs(x)) : Math.abs(x).toLocaleString('pt-BR')}</span>` : '<span style="color:var(--mut2)">—</span>'; };
  const kpi = (cor, ic, r, v, s) => `<div class="cartao kpi" style="--c:${cor}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v" style="font-size:21px">${v}</div><div class="s">${s}</div></div>`;
  return `<div class="cartao bl prop-cab">
      <div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">
        <div style="flex:1;min-width:220px"><input class="campo prop-nome" ${ro ? 'disabled' : ''} value="${esc(p.nome)}" onchange="editarProp(${arg(p.id)},'nome',this.value)">
          <textarea class="campo" ${ro ? 'disabled' : ''} rows="2" style="margin-top:6px" placeholder="Descrição / justificativa" onchange="editarProp(${arg(p.id)},'descricao',this.value)">${esc(p.descricao)}</textarea></div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <select class="campo" style="width:auto" ${ro ? 'disabled' : ''} onchange="editarProp(${arg(p.id)},'status',this.value)">${Object.keys(STATUS_PROP).map(s => `<option ${s === (p.status || 'Rascunho') ? 'selected' : ''}>${s}</option>`).join('')}</select>
          <div class="u-acoes"><button class="btn btn-p btn-sm" onclick="verPropostaNoMapa(${arg(p.id)})" title="Ver a estrutura desta proposta no mapa"><i class="fa-solid fa-diagram-project"></i>Ver no mapa</button><button class="btn btn-s btn-sm" onclick="abrirComparativo('', ${arg(p.id)})" title="Comparar com a estrutura atual, lado a lado"><i class="fa-solid fa-code-compare"></i>Comparar</button><button class="btn btn-s btn-sm" onclick="exportarProposta(${arg(p.id)})" title="Exportar comparativo (CSV)"><i class="fa-solid fa-file-csv"></i>CSV</button><button class="btn btn-s btn-sm so-edit" onclick="novaProposta(${arg(p.id)})" title="Duplicar"><i class="fa-regular fa-copy"></i>Duplicar</button>${ehAdmin() && p.status !== 'Aplicada' ? `<button class="btn btn-s btn-sm" onclick="aplicarProposta(${arg(p.id)})" title="Aplicar à estrutura oficial"><i class="fa-solid fa-check-double"></i>Aplicar</button>` : ''}<button class="btn btn-perigo btn-sm btn-i so-edit" onclick="excluirProposta(${arg(p.id)})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button></div>
        </div>
      </div></div>
    <div class="kpis">
      ${kpi('#2563eb', 'fa-calendar-day', 'Custo mensal · atual', fmtM0(base.m), 'lançamentos do cenário Atual')}
      ${kpi('#7c3aed', 'fa-lightbulb', 'Custo mensal · proposta', fmtM0(cp.m), fmtM0(cp.a) + ' por ano')}
      ${kpi(dif > 0 ? '#dc2626' : '#16a34a', dif > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down', 'Diferença', (dif > 0 ? '+' : dif < 0 ? '−' : '') + fmtM0(Math.abs(dif)) + '/mês', (difA > 0 ? '+' : difA < 0 ? '−' : '') + fmtM0(Math.abs(difA)) + ' por ano' + (base.m ? ` · ${(dif / base.m * 100).toLocaleString('pt-BR', { maximumFractionDigits:1 })}%` : ''))}
      ${kpi('#0891b2', 'fa-sitemap', 'Estrutura', `+${novos} / −${ext}`, `setores criados / extintos · ${E.lista.filter(s => s._marcas.some(m => ['movido','renomeado','editado'].includes(m))).length} alterados`)}
    </div>
    <div class="cartao bl"><h3><i class="fa-solid fa-list-check"></i>Alterações da proposta</h3>
      <div class="prop-mapa"><div><b><i class="fa-solid fa-diagram-project"></i> Estrutura desta proposta</b><span>Abra o mapa da proposta e altere tudo como na estrutura atual: nomes, tipos, subordinação, impactos, valores, pontos positivos e negativos, criar e excluir setores e reposicionar. Nada muda na estrutura atual.</span></div><button class="btn btn-p" onclick="verPropostaNoMapa(${arg(p.id)})"><i class="fa-solid fa-pen-ruler"></i>${somenteLeitura() ? 'Ver no mapa' : 'Editar no mapa'}</button></div>
      <div class="prop-add so-edit"><span style="font-size:12px;color:var(--mut);align-self:center">Custos da proposta:</span>${Object.entries(TIPOS_ALT).filter(([k]) => ['cargo','despesa'].includes(k)).map(([k, [ic, n, cor]]) => `<button class="btn btn-s btn-sm" style="--c:${cor}" onclick="formAlteracao(${arg(p.id)},'','${k}')"><i class="fa-solid ${ic}" style="color:${cor}"></i>${n}</button>`).join('')}</div>
      ${itens.length ? `<div class="prop-itens">${itens.map((it, i) => `<div class="prop-it" style="--c:${TIPOS_ALT[it.tipo][2]}"><i class="fa-solid ${TIPOS_ALT[it.tipo][0]}"></i><div><small>${TIPOS_ALT[it.tipo][1]}</small><span>${descreverAlt(it, E)}</span></div>
        <div class="u-acoes so-edit">${i ? `<button class="btn btn-s btn-sm btn-i" title="Subir" onclick="moverAlt(${arg(p.id)},${i},-1)"><i class="fa-solid fa-arrow-up"></i></button>` : ''}<button class="btn btn-s btn-sm btn-i" title="Editar" onclick="formAlteracao(${arg(p.id)},${arg(it.id)},'${it.tipo}')"><i class="fa-solid fa-pen"></i></button><button class="btn btn-perigo btn-sm btn-i" title="Remover" onclick="removerAlt(${arg(p.id)},${arg(it.id)})"><i class="fa-solid fa-xmark"></i></button></div></div>`).join('')}</div>` : '<p class="s" style="margin-top:10px">Nenhum custo extra registrado. Para trocar o cargo DGA de um titular ou incluir despesas e bolsas, use os botões acima.</p>'}
    </div>
    <div class="grade2" style="margin-top:14px">
      <div class="cartao bl"><h3><i class="fa-solid fa-table-list"></i>Comparativo por item</h3>
        ${linhasItem.length ? `<div class="tab-wrap" style="margin-top:8px"><table class="tab"><thead><tr><th>Item</th><th class="fin-num">Qtd atual</th><th class="fin-num">Qtd proposta</th><th class="fin-num">Δ qtd</th><th class="fin-num">Δ mensal</th></tr></thead><tbody>${linhasItem.map(o => `<tr><td><span class="chip" style="--c:${(CATEG_FIN[o.cat] || CATEG_FIN.Outro)[0]}">${esc(o.nome)}</span></td><td class="fin-num">${o.qa.toLocaleString('pt-BR')}</td><td class="fin-num">${o.qp.toLocaleString('pt-BR')}</td><td class="fin-num">${dv(o.qa, o.qp)}</td><td class="fin-num">${dv(o.ma, o.mp, true)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="s">Sem lançamentos financeiros.</p>'}</div>
      <div class="cartao bl"><h3><i class="fa-solid fa-sitemap"></i>Estrutura resultante <small style="font-weight:500;color:var(--mut)">só setores afetados e seus superiores</small></h3>${arvoreProposta(E)}</div>
    </div>`;
}
function arvoreProposta(E){
  const afetados = E.lista.filter(s => s._marcas.length); if (!afetados.length) return '<p class="s">Nenhuma mudança de estrutura.</p>';
  const mostrar = new Set(); afetados.forEach(s => { let x = s, g = 0; while (x && g++ < 40) { mostrar.add(x.id); x = E.mapa.get(x.paiId); } });
  const filhos = id => E.lista.filter(s => (s.paiId || '') === id && mostrar.has(s.id));
  const ROT = { novo:['novo', '#16a34a'], extinto:['extinto', '#dc2626'], movido:['movido', '#7c3aed'], renomeado:['renomeado', '#0891b2'], editado:['editado', '#ca8a04'], cargo:['cargo', '#ea580c'] };
  const raizesV = E.lista.filter(s => (!s.paiId || !E.mapa.has(s.paiId)) && mostrar.has(s.id));
  const no = (s, d) => `<div class="prop-no" style="padding-left:${d * 18}px;${s.status === 'Extinto' ? 'opacity:.6;text-decoration:line-through' : ''}"><i class="fa-solid ${icTipo(s.tipo)}" style="color:${corTipo(s.tipo)}"></i>${esc(s.sigla ? s.sigla + ' · ' : '')}${esc(s.nome)} ${[...new Set(s._marcas)].map(m => `<span class="chip" style="--c:${ROT[m][1]};text-decoration:none">${ROT[m][0]}</span>`).join(' ')}</div>` + filhos(s.id).map(f => no(f, d + 1)).join('');
  return `<div class="prop-arvore">${raizesV.map(r => no(r, 0)).join('')}</div>`;
}
function editarProp(id, campo, valor){
  const p = DB.propostas.find(x => x.id === id); if (!p || somenteLeitura()) return;
  if (campo === 'status' && valor === 'Aplicada' && p.status !== 'Aplicada') { toast('Use o botão "Aplicar" para aplicar a proposta à estrutura.', 'aviso'); renderPropostas(); return; }
  p[campo] = String(valor); p.atualizadoEm = agora(); p.atualizadoPor = cfg.usuario || ''; enfileirar('propostas', p); salvarLocal();
  if (campo !== 'descricao') renderPropostas();
}
async function excluirProposta(id){
  const p = DB.propostas.find(x => x.id === id); if (!p || somenteLeitura()) return;
  if (!await confirmar('Excluir proposta', `Excluir a proposta <b>${esc(p.nome)}</b>? A estrutura oficial não é afetada.`, 'Excluir', true)) return;
  if (cenMapa === p.id) sairCenario();
  overridesDe(p.id).forEach(o => enfileirar('propSetores', o, true)); DB.propSetores = DB.propSetores.filter(o => o.propostaId !== p.id);
  DB.propostas = DB.propostas.filter(x => x !== p); enfileirar('propostas', p, true); salvarLocal(); propSel = ''; renderPropostas();
}
function moverAlt(pid, i, d){ const p = DB.propostas.find(x => x.id === pid); const a = itensProp(p); if (!a[i + d]) return; [a[i], a[i + d]] = [a[i + d], a[i]]; salvarItensProp(p, a); renderPropostas(); }
function removerAlt(pid, iid){
  const p = DB.propostas.find(x => x.id === pid); let a = itensProp(p); const it = a.find(x => x.id === iid);
  if (it && it.tipo === 'novo' && a.some(x => x !== it && (x.paiId === it.novoId || x.setorId === it.novoId))) return toast('Outras alterações dependem deste novo setor. Remova-as primeiro.', 'aviso');
  a = a.filter(x => x.id !== iid); salvarItensProp(p, a); renderPropostas();
}
function opcoesVirt(E, sel, excluir){
  const ord = []; const visit = (s, d) => { if (excluir && excluir.has(s.id)) return; ord.push([s, d]); E.lista.filter(x => x.paiId === s.id && x.status !== 'Extinto').forEach(k => visit(k, d + 1)); };
  E.lista.filter(s => (!s.paiId || !E.mapa.has(s.paiId)) && s.status !== 'Extinto').forEach(r => visit(r, 0));
  return ord.map(([s, d]) => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${'  '.repeat(Math.min(d, 6))}${s._marcas.includes('novo') ? '★ ' : ''}${esc(s.sigla ? s.sigla + ' · ' : '')}${esc(s.nome)}</option>`).join('');
}
function opcoesDGA(sel, comRemover){
  return (comRemover ? `<option value="__remover" ${sel === '__remover' ? 'selected' : ''}>— Sem cargo em comissão —</option>` : '<option value="">— Sem cargo em comissão —</option>') + DB.rubricas.filter(r => r.categoria === 'Cargo em comissão (DGA)' || r.categoria === 'Função gratificada').sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric:true })).map(r => `<option value="${esc(r.id)}" ${r.id === sel ? 'selected' : ''}>${esc(r.codigo)} — ${fmtM(r.valorMensal)}</option>`).join('');
}
function formAlteracao(pid, iid, tipo){
  if (somenteLeitura()) return;
  const p = DB.propostas.find(x => x.id === pid); if (!p) return;
  const itens = itensProp(p), it = itens.find(x => x.id === iid) || { id:novoId('al'), tipo };
  // estrutura até antes deste item (para que o item possa referenciar setores criados antes dele)
  const idx = itens.indexOf(it), antes = Object.assign({}, p, { itens:JSON.stringify(idx >= 0 ? itens.slice(0, idx) : itens) }), E = estruturaProposta(antes);
  const tiposSetor = Object.keys(TIPOS);
  const vincSel = v => `<label><span class="rot">Ocupante do cargo</span><select id="fa-vinc" class="campo"><option value="Comissionado" ${v !== 'Efetivo' ? 'selected' : ''}>Exclusivamente comissionado (100%)</option><option value="Efetivo" ${v === 'Efetivo' ? 'selected' : ''}>Servidor efetivo (gratificação de %)</option></select></label>`;
  let html = '';
  if (tipo === 'novo') html = `<label><span class="rot">Nome do novo setor</span><input id="fa-nome" class="campo" required value="${esc(it.nome)}"></label>
    <div class="g2"><label><span class="rot">Sigla</span><input id="fa-sigla" class="campo" value="${esc(it.sigla)}"></label><label><span class="rot">Tipo</span><select id="fa-tipo" class="campo">${tiposSetor.map(t => `<option ${t === (it.tipoSetor || 'Coordenadoria') ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
    <label><span class="rot">Subordinado a</span><select id="fa-pai" class="campo">${opcoesVirt(E, it.paiId)}</select></label>
    <div class="g2"><label><span class="rot">Cargo do titular</span><select id="fa-rub" class="campo">${opcoesDGA(it.rubricaId)}</select></label>${vincSel(it.vinculo)}</div>`;
  if (tipo === 'extinguir') html = `<label><span class="rot">Setor a extinguir</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label>
    <label class="chk"><input type="checkbox" id="fa-sub" ${it.comSub !== false ? 'checked' : ''}><span>Extinguir também todos os subordinados <small style="display:block;color:var(--mut)">Desmarque se os subordinados forem movidos para outro setor nesta proposta.</small></span></label>
    <p style="font-size:12px">Os custos lançados nos setores extintos saem do total da proposta.</p>`;
  if (tipo === 'mover') html = `<label><span class="rot">Setor</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label><label><span class="rot">Passa a responder a</span><select id="fa-pai" class="campo">${opcoesVirt(E, it.paiId)}</select></label>`;
  if (tipo === 'renomear') html = `<label><span class="rot">Setor</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label><label><span class="rot">Novo nome <small>vazio = mantém</small></span><input id="fa-nome" class="campo" value="${esc(it.nome)}"></label>
    <div class="g2"><label><span class="rot">Nova sigla <small>vazio = mantém</small></span><input id="fa-sigla" class="campo" value="${esc(it.sigla)}"></label><label><span class="rot">Novo tipo</span><select id="fa-tipo" class="campo"><option value="">(mantém)</option>${tiposSetor.map(t => `<option ${t === it.tipoSetor ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>`;
  if (tipo === 'cargo') html = `<label><span class="rot">Setor (titular)</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label>
    <div class="g2"><label><span class="rot">Novo cargo</span><select id="fa-rub" class="campo">${opcoesDGA(it.rubricaId || '', true)}</select></label>${vincSel(it.vinculo)}</div>
    <p style="font-size:12px">Substitui o cargo padrão do titular desse setor nesta proposta (ex.: Coordenadoria de DGA-5 para DGA-4).</p>`;
  if (tipo === 'despesa') html = `<label><span class="rot">Setor</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label>
    <label><span class="rot">Item da tabela (DGA, bolsa, função…)</span><select id="fa-rub" class="campo">${opcoesRubricas(it.rubricaId || '')}</select></label>
    <div class="acoes" style="margin-top:-4px"><button type="button" class="btn btn-s btn-sm" onclick="formBolsa('', true)"><i class="fa-solid fa-graduation-cap"></i>Cadastrar nova bolsa</button></div>
    <label><span class="rot">Descrição</span><input id="fa-desc" class="campo" value="${esc(it.descricao)}" placeholder="ex.: Bolsistas formadores do programa X"></label>
    <div class="g2"><label><span class="rot">Quantidade <small>negativa reduz</small></span><input id="fa-qtd" class="campo" type="number" step="any" value="${esc(it.qtd ?? '1')}"></label><label><span class="rot">Valor mensal próprio <small>vazio = tabela</small></span><input id="fa-val" class="campo" type="number" min="0" step="0.01" value="${esc(it.valor)}"></label></div>
    <div class="g2"><label><span class="rot">Meses no ano <small>vazio = tabela</small></span><input id="fa-mes" class="campo" type="number" min="0" step="any" value="${esc(it.meses)}"></label>${vincSel(it.vinculo)}</div>
    <div class="fin-prev" id="fa-prev"></div>`;
  abrirModal({ titulo:TIPOS_ALT[tipo][1], rotulo: idx >= 0 ? 'Salvar' : 'Incluir na proposta', largura:540, html,
    aoConfirmar: async m => {
      const v = id => { const e = m.querySelector(id); return e ? (e.type === 'checkbox' ? e.checked : e.value) : undefined; };
      const n = Object.assign({}, it);
      if (tipo === 'novo') { n.nome = v('#fa-nome').trim(); n.sigla = v('#fa-sigla').trim(); n.tipoSetor = v('#fa-tipo'); n.paiId = v('#fa-pai'); n.rubricaId = v('#fa-rub'); n.vinculo = v('#fa-vinc'); n.novoId = n.novoId || novoId('pn'); if (!n.nome) throw new Error('Informe o nome.'); }
      if (tipo === 'extinguir') { n.setorId = v('#fa-set'); n.comSub = v('#fa-sub'); }
      if (tipo === 'mover') { n.setorId = v('#fa-set'); n.paiId = v('#fa-pai'); if (n.setorId === n.paiId) throw new Error('Um setor não pode responder a si mesmo.'); const sub = new Set(); const vis = id => E.lista.filter(x => x.paiId === id).forEach(x => { sub.add(x.id); vis(x.id); }); vis(n.setorId); if (sub.has(n.paiId)) throw new Error('O novo superior está dentro do próprio ramo do setor.'); }
      if (tipo === 'renomear') { n.setorId = v('#fa-set'); n.nome = v('#fa-nome').trim(); n.sigla = v('#fa-sigla').trim(); n.tipoSetor = v('#fa-tipo'); if (!n.nome && !n.sigla && !n.tipoSetor) throw new Error('Informe o que muda.'); }
      if (tipo === 'cargo') { n.setorId = v('#fa-set'); n.rubricaId = v('#fa-rub'); n.vinculo = v('#fa-vinc'); }
      if (tipo === 'despesa') { n.setorId = v('#fa-set'); n.rubricaId = v('#fa-rub'); n.descricao = v('#fa-desc').trim(); n.qtd = v('#fa-qtd'); n.valor = v('#fa-val'); n.meses = v('#fa-mes'); n.vinculo = v('#fa-vinc'); if (!n.rubricaId && !n.valor) throw new Error('Escolha um item ou informe o valor.'); if (!n.rubricaId && !n.descricao) throw new Error('Descreva a despesa.'); if (!numBR(n.qtd)) throw new Error('Informe a quantidade.'); }
      const a = itensProp(p), i = a.findIndex(x => x.id === n.id); if (i >= 0) a[i] = n; else a.push(n);
      salvarItensProp(p, a); return true;
    }
  }).then(ok => { if (ok) renderPropostas(); });
  if (tipo === 'despesa') {
    const ms = document.querySelectorAll('.modal'), mm = ms[ms.length - 1];
    const prev = () => { const c = calcDesp({ rubricaId:mm.querySelector('#fa-rub').value, quantidade:mm.querySelector('#fa-qtd').value, valorUnitario:mm.querySelector('#fa-val').value, meses:mm.querySelector('#fa-mes').value, vinculo:mm.querySelector('#fa-vinc').value }); mm.querySelector('#fa-prev').innerHTML = `<div>Mensal<b>${fmtM(c.mensal)}</b></div><div>Anual (${c.meses.toLocaleString('pt-BR')} meses)<b>${fmtM(c.anual)}</b></div>`; const r = rubricaDe(mm.querySelector('#fa-rub').value); mm.querySelector('#fa-vinc').closest('label').style.display = r && r.percEfetivo !== '' ? '' : 'none'; };
    mm.querySelectorAll('#fa-rub,#fa-qtd,#fa-val,#fa-mes,#fa-vinc').forEach(x => x.addEventListener('input', prev)); prev();
    tv.atualizarRubFA = () => { const s = mm.querySelector('#fa-rub'); if (s) { const v = s.value; s.innerHTML = opcoesRubricas(v); prev(); } };
  }
}
async function aplicarProposta(id){
  const p = DB.propostas.find(x => x.id === id); if (!p || !ehAdmin()) return;
  if (cenMapa) sairCenario();
  const itens = itensProp(p), ovs = overridesDe(p.id); if (!itens.length && !ovs.length) return toast('A proposta não tem alterações.', 'aviso');
  if (!await confirmar('Aplicar proposta', `Aplicar as <b>${itens.length + ovs.length}</b> alteração(ões) de <b>${esc(p.nome)}</b> à <b>estrutura oficial</b>? Setores serão criados, extintos, movidos ou renomeados, e os lançamentos do cenário Atual serão ajustados. Recomendo exportar uma cópia antes (Configurações).`, 'Aplicar à estrutura', true)) return;
  const real = new Map(); const R = x => real.get(x) || x;
  itens.forEach(it => {
    if (it.tipo === 'novo') {
      const pai = R(it.paiId), s = novoSetor({ id:novoId('s'), nome:it.nome, sigla:it.sigla || '', tipo:it.tipoSetor || 'Coordenadoria', paiId:pai, ordem:String(Math.max(0, ...filhosDe(pai).map(k => num(k.ordem))) + 1), atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      DB.setores.push(s); enfileirar('setores', s); real.set(it.novoId, s.id); indexar(); registrar(s.id, `Criado pela proposta "${p.nome}"`);
      if (it.rubricaId) { const d = novoReg('despesas', { id:novoId('fd'), setorId:s.id, rubricaId:it.rubricaId, quantidade:'1', cenario:'Atual', vinculo:it.vinculo || 'Comissionado', descricao:'Titular', observacao:MARCA_CHEFIA, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.despesas.push(d); enfileirar('despesas', d); }
    }
    const s = porId.get(R(it.setorId));
    if (it.tipo === 'extinguir' && s) { [s.id, ...(it.comSub ? descendentes(s.id) : [])].forEach(i => { const x = porId.get(i); if (x) alterar(x, 'status', 'Extinto', true); }); registrar(s.id, `Extinto pela proposta "${p.nome}"`); DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual' && porId.get(d.setorId) && porId.get(d.setorId).status === 'Extinto').forEach(d => { DB.despesas = DB.despesas.filter(x => x !== d); enfileirar('despesas', d, true); }); }
    if (it.tipo === 'mover' && s) { s.dx = ''; s.dy = ''; alterar(s, 'paiId', R(it.paiId)); }
    if (it.tipo === 'renomear' && s) { if (it.nome) alterar(s, 'nome', it.nome); if (it.sigla) alterar(s, 'sigla', it.sigla); if (it.tipoSetor) alterar(s, 'tipo', it.tipoSetor); }
    if (it.tipo === 'cargo' && s) {
      const d = DB.despesas.find(x => x.setorId === s.id && x.observacao === MARCA_CHEFIA && (x.cenario || 'Atual') === 'Atual');
      if (it.rubricaId === '__remover') { if (d) { DB.despesas = DB.despesas.filter(x => x !== d); enfileirar('despesas', d, true); } }
      else if (d) { d.rubricaId = it.rubricaId; d.vinculo = it.vinculo || d.vinculo; d.valorUnitario = ''; d.atualizadoEm = agora(); enfileirar('despesas', d); }
      else { const n = novoReg('despesas', { id:novoId('fd'), setorId:s.id, rubricaId:it.rubricaId, quantidade:'1', cenario:'Atual', vinculo:it.vinculo || 'Comissionado', descricao:'Titular', observacao:MARCA_CHEFIA, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.despesas.push(n); enfileirar('despesas', n); }
      registrar(s.id, `Cargo do titular alterado pela proposta "${p.nome}"`);
    }
    if (it.tipo === 'despesa' && (s || !it.setorId)) { const d = novoReg('despesas', { id:novoId('fd'), setorId:s ? s.id : '', rubricaId:it.rubricaId || '', quantidade:String(it.qtd), valorUnitario:it.valor || '', meses:it.meses || '', vinculo:it.vinculo || '', descricao:it.descricao || '', cenario:'Atual', observacao:'Proposta: ' + p.nome, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.despesas.push(d); enfileirar('despesas', d); }
  });
  // edições feitas no mapa da proposta
  ovs.filter(o => !porId.has(o.setorId)).forEach(o => { const s = deOverride(o); if (o.excluido === 'Sim') s.status = 'Extinto'; DB.setores.push(s); enfileirar('setores', s); });
  indexar();
  ovs.filter(o => porId.has(o.setorId)).forEach(o => { const s = porId.get(o.setorId), n = deOverride(o); if (o.excluido === 'Sim') n.status = 'Extinto'; CAMPOS.setores.forEach(k => { if (k !== 'id' && !['atualizadoEm','atualizadoPor'].includes(k) && String(s[k] ?? '') !== String(n[k] ?? '')) s[k] = n[k]; }); s.atualizadoEm = agora(); s.atualizadoPor = cfg.usuario || ''; enfileirar('setores', s); });
  ovs.forEach(o => registrar(o.setorId, `Alterado pela proposta "${p.nome}"`));
  p.status = 'Aplicada'; p.atualizadoEm = agora(); p.atualizadoPor = cfg.usuario || ''; enfileirar('propostas', p);
  indexar(); salvarLocal(); toast(`Proposta "${p.nome}" aplicada à estrutura oficial.`); renderPropostas();
}
function exportarProposta(id){
  const p = DB.propostas.find(x => x.id === id); if (!p) return;
  const cp = custoProposta(p), q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', n = v => numBR(v).toFixed(2).replace('.', ',');
  const linhas = ['Proposta;' + q(p.nome), 'Situação;' + q(p.status), '', 'Alterações', ...itensProp(p).map(it => q(TIPOS_ALT[it.tipo][1]) + ';' + q(descreverAlt(it, cp.E).replace(/<[^>]+>/g, ''))), '',
    'Setor;Item;Tipo;Descrição;Quantidade;Valor unitário;Mensal;Meses;Anual', ...cp.linhas.map(l => { const c = calcDesp(l), s = cp.E.mapa.get(l.setorId); return [s ? s.nome : '', c.r.codigo || '', c.categoria, l.descricao, c.qtd, n(c.unit), n(c.mensal), c.meses, n(c.anual)].map(q).join(';'); }),
    '', 'Total mensal da proposta;' + n(cp.m), 'Total mensal atual;' + n(baseAtual().m)];
  baixarArquivo('gaborg-proposta-' + (p.nome || 'sem-nome').replace(/[^\w-]+/g, '_').slice(0, 40) + '.csv', '﻿' + linhas.join('\r\n'), 'text/csv;charset=utf-8');
}
/* Bolsas: cadastro próprio com custos diferentes */
function renderBolsas(){
  const bolsas = DB.rubricas.filter(r => r.categoria === 'Bolsa'), ro = somenteLeitura() ? 'disabled' : '';
  const usos = id => DB.despesas.filter(d => d.rubricaId === id).length + DB.propostas.reduce((t, p) => t + itensProp(p).filter(i => i.rubricaId === id).length, 0);
  return `<div class="cartao bl" style="margin-bottom:14px"><h3><i class="fa-solid fa-graduation-cap"></i>Bolsas</h3><p class="s">Cadastre cada tipo de bolsa com o seu valor mensal e a quantidade de meses pagos no ano (ex.: bolsa de 10 meses). Elas aparecem nos lançamentos do Financeiro e nas alterações das Propostas.</p>
    <div class="acoes so-edit"><button class="btn btn-p" onclick="formBolsa()"><i class="fa-solid fa-plus"></i>Nova bolsa</button></div></div>
    ${bolsas.length ? `<div class="tab-wrap"><table class="tab"><thead><tr><th style="min-width:110px">Código</th><th style="min-width:220px">Nome da bolsa</th><th class="fin-num" style="min-width:120px">Valor mensal (R$)</th><th class="fin-num">Meses/ano</th><th class="fin-num">Custo anual por bolsista</th><th class="fin-num">Usos</th><th></th></tr></thead><tbody>${bolsas.sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR')).map(r => `<tr>
      <td><input class="campo fin-edit" ${ro} value="${esc(r.codigo)}" onchange="alterarRubrica(${arg(r.id)},'codigo',this.value);renderPropostas()"></td>
      <td><input class="campo fin-edit" ${ro} value="${esc(r.nome)}" onchange="alterarRubrica(${arg(r.id)},'nome',this.value);renderPropostas()"></td>
      <td><input class="campo fin-edit n" ${ro} type="number" min="0" step="0.01" value="${esc(r.valorMensal)}" onchange="alterarRubrica(${arg(r.id)},'valorMensal',this.value);renderPropostas()"></td>
      <td><input class="campo fin-edit n" ${ro} type="number" min="0" max="13.34" step="any" value="${esc(r.meses)}" placeholder="12" style="min-width:60px" onchange="alterarRubrica(${arg(r.id)},'meses',this.value);renderPropostas()"></td>
      <td class="fin-num"><b>${fmtM(numBR(r.valorMensal) * (r.meses !== '' ? numBR(r.meses) : 12))}</b></td><td class="fin-num">${usos(r.id)}</td>
      <td><div class="u-acoes so-edit"><button class="btn btn-perigo btn-sm btn-i" title="Excluir" onclick="excluirRubrica(${arg(r.id)}).then(()=>renderPropostas())"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>`).join('')}</tbody></table></div>` : '<div class="cartao vazio">Nenhuma bolsa cadastrada.</div>'}`;
}
function formBolsa(id, deDentro){
  if (somenteLeitura()) return;
  abrirModal({ titulo:'Nova bolsa', rotulo:'Cadastrar', largura:460,
    html:`<label><span class="rot">Nome da bolsa</span><input id="fb-nome" class="campo" required placeholder="ex.: Bolsa Formador Regional"></label>
      <div class="g2"><label><span class="rot">Código <small>opcional</small></span><input id="fb-cod" class="campo" placeholder="ex.: BOLSA-FR"></label><label><span class="rot">Valor mensal (R$)</span><input id="fb-val" class="campo" type="number" min="0" step="0.01" required></label></div>
      <label><span class="rot">Meses pagos no ano</span><input id="fb-mes" class="campo" type="number" min="0" max="13.34" step="any" value="12"></label>`,
    aoConfirmar: async m => {
      const nome = m.querySelector('#fb-nome').value.trim(), val = m.querySelector('#fb-val').value; if (!nome || val === '') throw new Error('Informe o nome e o valor.');
      const r = novoReg('rubricas', { id:novoId('rb'), codigo:m.querySelector('#fb-cod').value.trim() || ('BOLSA-' + (DB.rubricas.filter(x => x.categoria === 'Bolsa').length + 1)), nome, categoria:'Bolsa', valorMensal:val, encargos:'', meses:m.querySelector('#fb-mes').value || '12', ativo:'Sim', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      DB.rubricas.push(r); enfileirar('rubricas', r); salvarLocal(); toast('Bolsa cadastrada.'); return true;
    }
  }).then(ok => { if (!ok) return; if (deDentro && tv.atualizarRubFA) tv.atualizarRubFA(); else renderPropostas(); });
}

/* ===================== MAPA POR CENÁRIO (atual × propostas) E COMPARATIVO ===================== */
let cenMapa = '', cenSwap = false, DBoficial = null;
const VISTAS_CEN = ['mapa', 'lista', 'painel'];
/* Ao entrar numa proposta, a estrutura exibida e editada passa a ser a da proposta; a oficial fica guardada intacta */
function aplicarCenario(){
  const p = DB.propostas.find(x => x.id === cenMapa); if (!p) { cenMapa = ''; return; }
  if (cenSwap) desaplicarCenario();
  const E = estruturaProposta(p);
  DBoficial = DB.setores; DB.setores = E.lista; cenSwap = true; indexar();
}
function desaplicarCenario(){ if (!cenSwap) return; DB.setores = DBoficial; DBoficial = null; cenSwap = false; indexar(); }
function sairCenario(){ desaplicarCenario(); cenMapa = ''; atualizarBarraCen(); preencherCenarios(); }
function remarcarCenario(){
  if (!cenSwap) return; const p = DB.propostas.find(x => x.id === cenMapa); if (!p) return;
  const of = new Map(DBoficial.map(s => [s.id, s])), cargos = new Set(itensProp(p).filter(i => i.tipo === 'cargo').map(i => i.setorId));
  DB.setores.forEach(s => marcarSetor(s, of.get(s.id), cargos.has(s.id)));
}
function salvarOverride(rec, del){
  const p = DB.propostas.find(x => x.id === cenMapa); if (!p || somenteLeitura()) return;
  const of = DBoficial.find(s => s.id === rec.id), key = p.id + '_' + rec.id, ex = DB.propSetores.find(o => o.id === key);
  const tira = () => { if (ex) { DB.propSetores = DB.propSetores.filter(o => o !== ex); enfileirar('propSetores', ex, true); } };
  const poe = o => { const i = DB.propSetores.findIndex(x => x.id === o.id); if (i >= 0) DB.propSetores[i] = o; else DB.propSetores.push(o); enfileirar('propSetores', o); };
  if (del) { if (of) poe(paraOverride(p.id, Object.assign({}, rec, { status:'Extinto' }), true)); else tira(); }
  else if (of && CAMPOS.setores.every(k => ['atualizadoEm','atualizadoPor'].includes(k) || String(rec[k] ?? '') === String(of[k] ?? ''))) tira();
  else poe(paraOverride(p.id, rec, false));
  p.atualizadoEm = agora(); p.atualizadoPor = cfg.usuario || ''; enfileirar('propostas', p);
  clearTimeout(salvarOverride.t); salvarOverride.t = setTimeout(() => { remarcarCenario(); if (vistaAtual === 'mapa') { visiveis.forEach(n => { const el = elNo.get(n.id); if (el) { el.outerHTML = cardHTML(n); } }); elNo.clear(); document.querySelectorAll('#nos .no').forEach(el => elNo.set(el.dataset.id, el)); desenharArestas(); } atualizarBarraCen(); }, 250);
}
function atualizarBarraCen(){
  const b = $('#cen-barra'); if (!b) return;
  const p = cenMapa && DB.propostas.find(x => x.id === cenMapa);
  document.body.classList.toggle('cen-ativo', !!p);
  b.classList.toggle('hidden', !p); if (!p) return;
  const cp = custoProposta(p), base = baseAtual(), d = cp.m - base.m, E = cp.E, n = c => E.lista.filter(s => s._marcas.includes(c)).length;
  const emEstrutura = VISTAS_CEN.includes(vistaAtual);
  b.innerHTML = `<i class="fa-solid fa-lightbulb"></i><span class="cb-t">${somenteLeitura() ? 'Vendo' : 'Editando'} a proposta <b>${esc(p.nome)}</b></span>
    <span class="cb-n">${n('novo') ? `<i style="--t:#16a34a">+${n('novo')} novo(s)</i>` : ''}${n('extinto') ? `<i style="--t:#dc2626">${n('extinto')} extinto(s)</i>` : ''}${n('movido') ? `<i style="--t:#7c3aed">${n('movido')} movido(s)</i>` : ''}${n('renomeado') ? `<i style="--t:#0891b2">${n('renomeado')} renomeado(s)</i>` : ''}${n('editado') ? `<i style="--t:#ca8a04">${n('editado')} editado(s)</i>` : ''}<i style="--t:${d > 0 ? '#dc2626' : '#16a34a'}">${d ? (d > 0 ? '+' : '−') + fmtM0(Math.abs(d)) + '/mês' : 'custo igual'}</i></span>
    ${emEstrutura ? '' : '<span class="cb-x">a estrutura atual está sendo exibida nesta tela</span>'}
    <span class="cb-a"><button class="btn btn-s btn-sm" onclick="abrirComparativo('', ${arg(p.id)})"><i class="fa-solid fa-code-compare"></i>Comparar</button><button class="btn btn-s btn-sm" onclick="trocarVista('propostas');propSel=${arg(p.id)};abaProp('propostas')"><i class="fa-solid fa-list-check"></i>Proposta</button><button class="btn btn-p btn-sm" onclick="escolherCenarioMapa('')"><i class="fa-solid fa-arrow-left"></i>Voltar à estrutura atual</button></span>`;
}
const ROT_MARCA = { novo:['Novo', '#16a34a'], extinto:['Extinto', '#dc2626'], movido:['Movido', '#7c3aed'], renomeado:['Renomeado', '#0891b2'], editado:['Editado', '#ca8a04'], cargo:['Cargo alterado', '#ea580c'] };
function listaCenario(id){
  const p = id && DB.propostas.find(x => x.id === id);
  if (p && cenSwap && id === cenMapa) { remarcarCenario(); return DB.setores; }
  return p ? estruturaProposta(p).lista : setoresOficiais();
}
function linhasCenario(id){
  const p = id && DB.propostas.find(x => x.id === id);
  return p ? custoProposta(p).linhas : DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual');
}
function nomeCenario(id){ const p = id && DB.propostas.find(x => x.id === id); return p ? p.nome : 'Estrutura atual (oficial)'; }
/* Executa fn com a estrutura de um cenário no lugar da oficial (só para desenhar; nada é gravado) */
function comLista(lista, fn, manterLayout, abExtra){
  const S = { setores:DB.setores, porId, filhos, prof, areaDe, areas, valPorSetor, pos, visiveis, caixas, modos, origemRaiz, abertos };
  DB.setores = lista; const jaAtivo = comLista.ativo; comLista.ativo = true;
  try { indexar(); if (abExtra) abertos = new Set([...abertos, ...abExtra]); return fn(); }
  finally {
    comLista.ativo = jaAtivo;
    const L = { pos, visiveis, caixas, modos, origemRaiz };
    DB.setores = S.setores; porId = S.porId; filhos = S.filhos; prof = S.prof; areaDe = S.areaDe; areas = S.areas; valPorSetor = S.valPorSetor; abertos = S.abertos;
    if (manterLayout) { pos = L.pos; visiveis = L.visiveis; caixas = L.caixas; modos = L.modos; origemRaiz = L.origemRaiz; }
    else { pos = S.pos; visiveis = S.visiveis; caixas = S.caixas; modos = S.modos; origemRaiz = S.origemRaiz; }
  }
}
const emCenario = fn => fn();
function ancestraisMarcados(lista){
  const m = new Map(lista.map(s => [s.id, s])), r = new Set();
  lista.filter(s => s._marcas && s._marcas.length).forEach(s => { let x = m.get(s.paiId), g = 0; while (x && g++ < 40) { r.add(x.id); x = m.get(x.paiId); } if (s._paiOrig) { let y = m.get(s._paiOrig), h = 0; while (y && h++ < 40) { r.add(y.id); y = m.get(y.paiId); } } });
  return r;
}
function preencherCenarios(){
  const sel = $('#m-cen'); if (!sel) return;
  if (cenMapa && !DB.propostas.some(p => p.id === cenMapa)) cenMapa = '';
  sel.innerHTML = '<option value="">Estrutura atual</option>' + DB.propostas.filter(p => p.status !== 'Aplicada').map(p => `<option value="${esc(p.id)}" ${p.id === cenMapa ? 'selected' : ''}>Proposta: ${esc(p.nome)}</option>`).join('');
  sel.value = cenMapa;
  const f = null;
  if (f) {
    f.classList.toggle('hidden', !cenMapa);
    if (cenMapa) { const p = DB.propostas.find(x => x.id === cenMapa), cp = custoProposta(p), b = baseAtual(), d = cp.m - b.m;
      f.innerHTML = `<i class="fa-solid fa-lightbulb"></i><span><b>${esc(p.nome)}</b> · ${itensProp(p).length} alteração(ões) · ${d ? (d > 0 ? '+' : '−') + fmtM0(Math.abs(d)) + '/mês' : 'sem impacto financeiro'} · somente visualização</span><button class="btn btn-s btn-sm" onclick="abrirComparativo('', ${arg(p.id)})"><i class="fa-solid fa-code-compare"></i>Comparar com o atual</button><button class="btn btn-s btn-sm" onclick="trocarVista('propostas');propSel=${arg(p.id)};abaProp('propostas')"><i class="fa-solid fa-pen"></i>Editar proposta</button><button class="btn btn-s btn-sm" onclick="escolherCenarioMapa('')"><i class="fa-solid fa-xmark"></i>Voltar ao atual</button>`; }
  }
  atualizarBarraCen();
}
function escolherCenarioMapa(id){
  limparMulti(true); fecharPainel(); desaplicarCenario();
  cenMapa = id || '';
  if (cenMapa) { ancestraisMarcados(listaCenario(cenMapa)).forEach(a => abertos.add(a)); aplicarCenario(); }
  if (vistaAtual !== 'mapa') trocarVista('mapa'); else { atualizarBarraCen(); desenharMapa(); }
  setTimeout(() => ajustar(true), 40);
}
function verPropostaNoMapa(id){ escolherCenarioMapa(id); }
function marcasHTML(s){ return (s._marcas && s._marcas.length) ? [...new Set(s._marcas)].map(m => `<span class="cen-tag" style="--t:${ROT_MARCA[m][1]}">${ROT_MARCA[m][0]}</span>`).join('') : ''; }
function infoCenario(id){
  const lista = listaCenario(cenMapa), m = new Map(lista.map(s => [s.id, s])), s = m.get(id); if (!s) return;
  const linhas = linhasCenario(cenMapa).filter(l => l.setorId === id), real = DB.setores.find(x => x.id === id);
  const pai = m.get(s.paiId), paiOrig = s._paiOrig ? m.get(s._paiOrig) : null;
  abrirModal({ titulo: s.nome, rotulo:'Fechar', semCancelar:true, largura:480,
    html:`<p style="margin-top:-6px">${esc(s.tipo)}${s.sigla ? ' · ' + esc(s.sigla) : ''} ${marcasHTML(s)}</p>
      <p><span class="rot">Responde a (nesta proposta)</span>${esc(pai ? pai.nome : '—')}${paiOrig ? `<br><small style="color:var(--mut)">antes: ${esc(paiOrig.nome)}</small>` : ''}</p>
      ${real && real.nome !== s.nome ? `<p><span class="rot">Nome atual</span>${esc(real.nome)}</p>` : ''}
      <div><span class="rot">Custos nesta proposta</span>${linhas.length ? linhas.map(l => { const c = calcDesp(l); return `<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0"><span>${esc(c.r.codigo || l.descricao || c.categoria)} × ${c.qtd.toLocaleString('pt-BR')}</span><b>${fmtM(c.mensal)}/mês</b></div>`; }).join('') : '<p class="s">Nenhum.</p>'}</div>
      <div class="acoes" style="justify-content:flex-start">${real ? `<button type="button" class="btn btn-s btn-sm" onclick="this.closest('.modal').remove();escolherCenarioMapa('');setTimeout(()=>irPara(${arg(id)}),80)"><i class="fa-solid fa-arrow-right"></i>Abrir setor na estrutura atual</button>` : ''}</div>` });
}
/* ---------- Comparativo lado a lado ---------- */
const cmp = { a:'', b:'', sinc:true, v:[null, null] };
function diffCenarios(aId, bId){
  const A = listaCenario(aId), B = listaCenario(bId), mA = new Map(A.map(s => [s.id, s])), mB = new Map(B.map(s => [s.id, s]));
  const ativo = s => s && s.status !== 'Extinto', nm = (m, id) => { const s = m.get(id); return s ? (s.sigla || s.nome) : '(topo)'; };
  const est = [];
  B.forEach(s => { const a = mA.get(s.id);
    if (ativo(s) && !ativo(a)) est.push({ id:s.id, tipo:a ? 'reativado' : 'novo', txt:`<b>${esc(s.nome)}</b> (${esc(s.tipo)}) sob ${esc(nm(mB, s.paiId))}` });
    if (!ativo(s) && ativo(a)) est.push({ id:s.id, tipo:'extinto', txt:`<b>${esc(a.nome)}</b> (${esc(a.tipo)})` });
    if (a && ativo(s) && ativo(a)) {
      if ((a.paiId || '') !== (s.paiId || '')) est.push({ id:s.id, tipo:'movido', txt:`<b>${esc(s.nome)}</b>: ${esc(nm(mA, a.paiId))} → ${esc(nm(mB, s.paiId))}` });
      if (a.nome !== s.nome || (a.sigla || '') !== (s.sigla || '')) est.push({ id:s.id, tipo:'renomeado', txt:`${esc(a.nome)} → <b>${esc(s.nome)}</b>` });
      if (a.tipo !== s.tipo) est.push({ id:s.id, tipo:'tipo', txt:`<b>${esc(s.nome)}</b>: ${esc(a.tipo)} → ${esc(s.tipo)}` });
      const mud = CAMPOS_DADOS.filter(c => String(a[c] ?? '') !== String(s[c] ?? ''));
      if (mud.length) est.push({ id:s.id, tipo:'editado', txt:`<b>${esc(s.nome)}</b>: ` + mud.map(c => { const v = x => { x = String(x ?? '').trim(); if (!x) return '—'; if (c === 'impacto') return (IMPACTO[num(x)] || [x])[0]; if (['orcamento','custoMensal'].includes(c)) return fmtRc(x); return x.length > 40 ? x.slice(0, 40).replace(/\n/g, ' ') + '…' : x.replace(/\n/g, ' · '); }; return `${esc(ROTULOS[c] || c)}: ${esc(v(a[c]))} → <b>${esc(v(s[c]))}</b>`; }).join('; ') });
    }
  });
  A.forEach(a => { if (!mB.has(a.id) && ativo(a)) est.push({ id:a.id, tipo:'extinto', txt:`<b>${esc(a.nome)}</b> (${esc(a.tipo)})` }); });
  const custo = lst => { const m = new Map(); lst.forEach(l => { const c = calcDesp(l); const o = m.get(l.setorId) || { m:0, itens:[] }; o.m += c.mensal; o.itens.push((c.r.codigo || l.descricao || c.categoria) + (c.qtd !== 1 ? ' ×' + c.qtd.toLocaleString('pt-BR') : '')); m.set(l.setorId, o); }); return m; };
  const cA = custo(linhasCenario(aId)), cB = custo(linhasCenario(bId)), fin = [];
  new Set([...cA.keys(), ...cB.keys()]).forEach(id => { const x = cA.get(id) || { m:0, itens:[] }, y = cB.get(id) || { m:0, itens:[] }, d = y.m - x.m; if (Math.abs(d) > .004) fin.push({ id, nome:(mB.get(id) || mA.get(id) || {}).nome || '(sem setor)', a:x, b:y, d }); });
  fin.sort((p, q) => Math.abs(q.d) - Math.abs(p.d));
  const tot = (l, k) => l.reduce((t, x) => t + calcDesp(x)[k], 0), LA = linhasCenario(aId), LB = linhasCenario(bId);
  return { est, fin, tA:tot(LA, 'mensal'), tB:tot(LB, 'mensal'), aA:tot(LA, 'anual'), aB:tot(LB, 'anual'), mA, mB, A, B };
}
function abrirComparativo(a, b){
  cmp.a = a || ''; cmp.b = b !== undefined ? b : (cenMapa || (DB.propostas[0] || {}).id || '');
  let el = $('#cmp'); if (!el) { el = document.createElement('div'); el.id = 'cmp'; document.body.appendChild(el); }
  el.classList.remove('hidden'); renderComparativo();
}
function fecharComparativo(){ const el = $('#cmp'); if (el) { el.classList.add('hidden'); el.innerHTML = ''; } }
function opcoesCen(sel){ return '<option value="">Estrutura atual (oficial)</option>' + DB.propostas.map(p => `<option value="${esc(p.id)}" ${p.id === sel ? 'selected' : ''}>${esc(p.nome)}${p.status ? ' · ' + esc(p.status) : ''}</option>`).join(''); }
function renderComparativo(){
  const el = $('#cmp'), D = diffCenarios(cmp.a, cmp.b), dif = D.tB - D.tA;
  const ROT = { novo:['Criado', '#16a34a', 'fa-square-plus'], reativado:['Reativado', '#16a34a', 'fa-rotate-left'], extinto:['Extinto', '#dc2626', 'fa-square-minus'], movido:['Subordinação', '#7c3aed', 'fa-arrows-up-down-left-right'], renomeado:['Nome', '#0891b2', 'fa-pen'], tipo:['Tipo', '#0e7490', 'fa-tag'], editado:['Dados', '#ca8a04', 'fa-pen-to-square'] };
  el.innerHTML = `<div class="cmp-topo"><b><i class="fa-solid fa-code-compare"></i> Comparar cenários</b>
      <select class="campo" onchange="cmp.a=this.value;renderComparativo()">${opcoesCen(cmp.a)}</select><span class="cmp-x">×</span><select class="campo" onchange="cmp.b=this.value;renderComparativo()">${opcoesCen(cmp.b)}</select>
      <label class="chk" style="margin-left:6px"><input type="checkbox" ${cmp.sinc ? 'checked' : ''} onchange="cmp.sinc=this.checked"><span>Mover os dois mapas juntos</span></label>
      <button class="btn btn-s btn-sm" onclick="exportarComparativo()"><i class="fa-solid fa-file-csv"></i>CSV</button><button class="btn btn-s btn-sm btn-i" title="Fechar (Esc)" onclick="fecharComparativo()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="cmp-mapas">
      ${[0, 1].map(i => `<div class="cmp-pane"><div class="cmp-tit"><span>${i ? 'B' : 'A'} · ${esc(nomeCenario(i ? cmp.b : cmp.a))}</span><b>${fmtM0(i ? D.tB : D.tA)}/mês</b></div><div class="cmp-vp" id="cmp-vp${i}"><div class="mundo-cmp" id="cmp-m${i}"></div></div></div>`).join('')}
    </div>
    <div class="cmp-dif">
      <div class="cmp-res"><span><b>${D.est.length}</b> mudança(s) de estrutura</span><span><b>${D.fin.length}</b> setor(es) com custo diferente</span><span>Diferença de custo (B − A): <b class="${dif > 0 ? 'fin-pos' : dif < 0 ? 'fin-neg' : ''}">${dif ? (dif > 0 ? '+' : '−') + fmtM(Math.abs(dif)) + '/mês · ' + (D.aB - D.aA > 0 ? '+' : '−') + fmtM0(Math.abs(D.aB - D.aA)) + '/ano' : 'nenhuma'}</b></span></div>
      <div class="cmp-col"><h4>Estrutura</h4>${D.est.length ? D.est.map(x => `<button class="cmp-it" onclick="cmpFocar(${arg(x.id)})" style="--c:${ROT[x.tipo][1]}"><i class="fa-solid ${ROT[x.tipo][2]}"></i><span><small>${ROT[x.tipo][0]}</small>${x.txt}</span></button>`).join('') : '<p class="s">Nenhuma diferença de estrutura.</p>'}</div>
      <div class="cmp-col"><h4>Custos por setor</h4>${D.fin.length ? D.fin.map(x => `<button class="cmp-it" onclick="cmpFocar(${arg(x.id)})" style="--c:${x.d > 0 ? '#dc2626' : '#16a34a'}"><i class="fa-solid ${x.d > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i><span><small>${x.d > 0 ? '+' : '−'}${fmtM(Math.abs(x.d))}/mês</small><b>${esc(x.nome)}</b><br><span style="color:var(--mut);font-size:11.5px">A: ${esc(x.a.itens.join(', ') || '—')} · B: ${esc(x.b.itens.join(', ') || '—')}</span></span></button>`).join('') : '<p class="s">Nenhuma diferença de custo.</p>'}</div>
    </div>`;
  // marcas de diferença em cada lado
  const marcaA = new Map(), marcaB = new Map();
  D.est.forEach(x => { const t = x.tipo === 'reativado' ? 'novo' : x.tipo === 'tipo' ? 'renomeado' : x.tipo; if (t === 'editado' && marcaB.has(x.id)) return; if (t === 'extinto') { marcaA.set(x.id, 'extinto'); marcaB.set(x.id, 'extinto'); } else marcaB.set(x.id, t); if (t === 'movido') marcaA.set(x.id, 'movido'); });
  D.fin.forEach(x => { if (!marcaB.has(x.id)) marcaB.set(x.id, 'cargo'); });
  [[cmp.a, marcaA, 0], [cmp.b, marcaB, 1]].forEach(([id, mk, i]) => montarPaneCmp(id, mk, i));
}
function montarPaneCmp(cid, marcas, i){
  const lista = listaCenario(cid).map(s => Object.assign({}, s, { _marcas: marcas.has(s.id) ? [marcas.get(s.id)] : [] }));
  const anc = ancestraisMarcados(lista); marcas.forEach((v, id) => anc.add(id));
  let html = '', L;
  comLista(lista, () => {
    calcularLayout();
    let ar = ''; visiveis.forEach(s => filhosVis(s.id).forEach(k => { if (pos.has(k.id)) ar += `<path d="${caminhoAresta(s, k)}"/>`; }));
    html = `<svg style="position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible">${ar}</svg>` + visiveis.map(cardHTML).join('').replace(/ sel /g, ' ').replace(/ msel /g, ' ');
    L = limites(); cmp['pos' + i] = new Map(pos);
  }, false, anc);
  const vp = $('#cmp-vp' + i), mu = $('#cmp-m' + i); mu.innerHTML = html;
  const r = vp.getBoundingClientRect(), k = Math.max(.1, Math.min((r.width - 30) / (L.x1 - L.x0), (r.height - 30) / (L.y1 - L.y0), .9));
  cmp.v[i] = { k, x:(r.width - (L.x1 - L.x0) * k) / 2 - L.x0 * k, y:14 - L.y0 * k };
  aplicarCmp(i);
  let arr = null;
  vp.onpointerdown = e => { if (e.target.closest('.no')) { const id = e.target.closest('.no').dataset.id; cmpFocar(id); return; } arr = { x:e.clientX, y:e.clientY, v:Object.assign({}, cmp.v[i]) }; vp.setPointerCapture(e.pointerId); vp.classList.add('pan'); };
  vp.onpointermove = e => { if (!arr) return; const dx = e.clientX - arr.x, dy = e.clientY - arr.y; [i, ...(cmp.sinc ? [1 - i] : [])].forEach(j => { if (j === i) { cmp.v[j].x = arr.v.x + dx; cmp.v[j].y = arr.v.y + dy; } else { cmp.v[j].x += e.movementX; cmp.v[j].y += e.movementY; } aplicarCmp(j); }); };
  vp.onpointerup = vp.onpointercancel = () => { arr = null; vp.classList.remove('pan'); };
  vp.onwheel = e => { e.preventDefault(); const b = vp.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top, f = Math.exp(-e.deltaY * .0015); [i, ...(cmp.sinc ? [1 - i] : [])].forEach(j => { const v = cmp.v[j]; if (!v) return; const kk = Math.max(.06, Math.min(2.5, v.k * f)), q = kk / v.k; cmp.v[j] = { k:kk, x:mx - (mx - v.x) * q, y:my - (my - v.y) * q }; aplicarCmp(j); }); };
}
function aplicarCmp(i){ const m = $('#cmp-m' + i), v = cmp.v[i]; if (m && v) m.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.k})`; }
function cmpFocar(id){
  [0, 1].forEach(i => { const p = cmp['pos' + i] && cmp['pos' + i].get(id), vp = $('#cmp-vp' + i); document.querySelectorAll(`#cmp-m${i} .no`).forEach(n => n.classList.toggle('sel', n.dataset.id === id)); if (!p || !vp) return; const r = vp.getBoundingClientRect(), k = Math.max(cmp.v[i].k, .6); cmp.v[i] = { k, x:r.width / 2 - (p.x + NW / 2) * k, y:r.height / 2 - (p.y + NH / 2) * k }; const m = $('#cmp-m' + i); m.style.transition = 'transform .4s'; aplicarCmp(i); setTimeout(() => { m.style.transition = ''; }, 420); });
}
function exportarComparativo(){
  const D = diffCenarios(cmp.a, cmp.b), q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/<[^>]+>/g, '') + '"', n = v => numBR(v).toFixed(2).replace('.', ',');
  const l = ['A;' + q(nomeCenario(cmp.a)), 'B;' + q(nomeCenario(cmp.b)), 'Custo mensal A;' + n(D.tA), 'Custo mensal B;' + n(D.tB), 'Diferença mensal;' + n(D.tB - D.tA), 'Diferença anual;' + n(D.aB - D.aA), '', 'Mudança de estrutura;Detalhe', ...D.est.map(x => q(x.tipo) + ';' + q(x.txt)), '', 'Setor;Custo mensal A;Custo mensal B;Diferença;Itens A;Itens B', ...D.fin.map(x => [x.nome, n(x.a.m), n(x.b.m), n(x.d), x.a.itens.join(', '), x.b.itens.join(', ')].map(q).join(';'))];
  baixarArquivo('gaborg-comparativo-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + l.join('\r\n'), 'text/csv;charset=utf-8');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#cmp') && !$('#cmp').classList.contains('hidden') && !document.querySelector('.modal')) { e.stopImmediatePropagation(); fecharComparativo(); } }, true);

/* ===================== MAPA: EXIBIÇÃO, ANIMAÇÕES E INTERATIVIDADE ===================== */
let mapaUI = Object.assign({ leg:true, mini:true, hover:true, anim:true, dicas:true }, store.get('gaborg_mapa_ui', {}));
const semMovimento = () => !mapaUI.anim || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function aplicarMapaUI(){
  document.body.classList.toggle('sem-leg', !mapaUI.leg);
  document.body.classList.toggle('sem-mini', !mapaUI.mini);
  const b = $('#m-btn-leg'); if (b) { b.classList.toggle('on', mapaUI.leg); b.title = mapaUI.leg ? 'Esconder a legenda (L)' : 'Mostrar a legenda (L)'; b.innerHTML = `<i class="fa-solid ${mapaUI.leg ? 'fa-list' : 'fa-eye-slash'}"></i>`; }
  const m = $('#m-btn-mini'); if (m) { m.classList.toggle('on', mapaUI.mini); m.title = mapaUI.mini ? 'Esconder o minimapa (M)' : 'Mostrar o minimapa (M)'; }
  store.set('gaborg_mapa_ui', mapaUI);
  if (mapaUI.mini && vistaAtual === 'mapa') setTimeout(desenharMini, 30);
}
function alternarMapaUI(k){ mapaUI[k] = !mapaUI[k]; aplicarMapaUI(); if (k === 'hover' && !mapaUI.hover) limparFoco(); }
function menuExibicao(ev){
  const ja = $('#m-exib'); if (ja) { ja.remove(); return; }
  const op = (k, ic, t, d) => `<label class="exib-op"><i class="fa-solid ${ic}"></i><span><b>${t}</b><small>${d}</small></span><input type="checkbox" ${mapaUI[k] ? 'checked' : ''} onchange="alternarMapaUI('${k}')"></label>`;
  const el = document.createElement('div'); el.id = 'm-exib'; el.className = 'm-exib';
  el.innerHTML = `<b class="t">Exibição do mapa</b>${op('leg', 'fa-list', 'Legenda', 'cores e dicas de uso (tecla L)')}${op('mini', 'fa-map', 'Minimapa', 'visão geral no canto (tecla M)')}${op('hover', 'fa-wand-magic-sparkles', 'Destacar ao passar o mouse', 'realça o ramo e esmaece o resto')}${op('dicas', 'fa-message', 'Fichas rápidas', 'resumo do setor ao parar o mouse')}${op('anim', 'fa-film', 'Animações', 'transições ao abrir e fechar ramos')}`;
  $('#v-mapa').appendChild(el);
  setTimeout(() => document.addEventListener('pointerdown', function f(e){ if (!e.target.closest('#m-exib,#m-btn-exib')) { el.remove(); document.removeEventListener('pointerdown', f, true); } }, true), 0);
}

/* Transição do layout: os setores deslizam até a nova posição; os que aparecem saem do superior e os que somem voltam para ele */
let animMapa = null;
function animarLayout(antes, elsAntigos){
  if (animMapa) { cancelAnimationFrame(animMapa.raf); animMapa = null; }
  if (semMovimento() || !antes || !antes.size || visiveis.length > 700) return;
  const alvo = new Map(pos), origem = new Map(), novos = new Set();
  const anc = id => { let a = porId.get((porId.get(id) || {}).paiId), g = 0; while (a && !antes.has(a.id) && g++ < 40) a = porId.get(a.paiId); return a && antes.get(a.id); };
  visiveis.forEach(n => { let o = antes.get(n.id); if (!o) { o = anc(n.id) || alvo.get(n.id); novos.add(n.id); } origem.set(n.id, o); });
  let mudou = false; origem.forEach((o, id) => { const f = alvo.get(id); if (Math.abs(o.x - f.x) > .5 || Math.abs(o.y - f.y) > .5) mudou = true; });
  // setores que saíram: cópias que encolhem até o superior visível
  const saindo = [];
  elsAntigos.forEach((el, id) => {
    if (alvo.has(id)) return;
    let a = porId.get((porId.get(id) || {}).paiId), g = 0; while (a && !alvo.has(a.id) && g++ < 40) a = porId.get(a.paiId);
    const de = antes.get(id), para = a ? alvo.get(a.id) : de; if (!de) return;
    el.classList.add('saindo'); el.classList.remove('sel', 'msel'); $('#nos').appendChild(el); saindo.push({ el, de, para }); mudou = true;
  });
  if (!mudou) { saindo.forEach(s => s.el.remove()); return; }
  const dur = 460, t0 = performance.now(), ease = t => 1 - Math.pow(1 - t, 3);
  const passo = agora_ => {
    const t = Math.min(1, (agora_ - t0) / dur), e = ease(t);
    origem.forEach((o, id) => { const f = alvo.get(id), x = o.x + (f.x - o.x) * e, y = o.y + (f.y - o.y) * e; pos.set(id, { x, y }); const el = elNo.get(id); if (el) { el.style.transform = `translate(${x}px,${y}px)`; if (novos.has(id)) el.style.opacity = String(Math.min(1, e * 1.4)); } });
    saindo.forEach(s => { const x = s.de.x + (s.para.x - s.de.x) * e, y = s.de.y + (s.para.y - s.de.y) * e; s.el.style.transform = `translate(${x}px,${y}px) scale(${1 - .5 * e})`; s.el.style.opacity = String(1 - e); });
    desenharArestas();
    if (t < 1) animMapa.raf = requestAnimationFrame(passo);
    else { animMapa = null; alvo.forEach((v, k) => pos.set(k, v)); novos.forEach(id => { const el = elNo.get(id); if (el) el.style.opacity = ''; }); saindo.forEach(s => s.el.remove()); desenharArestas(); desenharMini(); }
  };
  animMapa = { raf:requestAnimationFrame(passo), alvo };
}
function terminarAnimMapa(){ if (!animMapa) return; cancelAnimationFrame(animMapa.raf); animMapa.alvo.forEach((v, k) => pos.set(k, v)); animMapa = null; document.querySelectorAll('#nos .no.saindo').forEach(e => e.remove()); visiveis.forEach(n => { const el = elNo.get(n.id), p = pos.get(n.id); if (el && p) { el.style.transform = `translate(${p.x}px,${p.y}px)`; el.style.opacity = ''; } }); desenharArestas(); }

/* Pulso de destaque num setor */
function pulsar(id){ const el = elNo.get(id); if (!el || semMovimento()) return; el.classList.remove('pulso'); void el.offsetWidth; el.classList.add('pulso'); setTimeout(() => el.classList.remove('pulso'), 1500); }

/* Destaque do ramo ao passar o mouse */
let tFoco = null, focoId = '', tDica = null;
function relacionados(id){ const r = new Set([id]); caminho(id).forEach(a => r.add(a.id)); descendentes(id).forEach(d => r.add(d)); return r; }
function aplicarFoco(id){
  if (!mapaUI.hover || drag || animMapa) return;
  focoId = id; const r = emCenario(() => relacionados(id));
  vpEl.classList.add('focando');
  elNo.forEach((el, k) => el.classList.toggle('rel', r.has(k)));
  document.querySelectorAll('#arestas path[data-f]').forEach(p => p.classList.toggle('rel', r.has(p.dataset.f) && r.has(p.dataset.p)));
}
function limparFoco(){ clearTimeout(tFoco); focoId = ''; vpEl.classList.remove('focando'); document.querySelectorAll('#nos .no.rel,#arestas path.rel').forEach(e => e.classList.remove('rel')); }
/* Ficha rápida */
function mostrarDica(id, el){
  if (!mapaUI.dicas || drag) return;
  const dados = emCenario(() => { const s = porId.get(id); if (!s) return null; return { s, sub:descendentes(id).size, cam:caminho(id).map(nomeCurto).slice(-2).join(' › ') }; }); if (!dados) return;
  const { s, sub, cam } = dados, f = cenMapa ? null : custoSetorFin(id, false), ft = cenMapa ? null : custoSetorFin(id, true), sv = statusVal(id), imp = num(s.impacto), qt = num(s.quantidade);
  const d = $('#m-dica');
  d.innerHTML = `<div class="dc-t" style="--c:${corTipo(s.tipo)}"><i class="fa-solid ${icTipo(s.tipo)}"></i>${esc(s.tipo)}${s.sigla ? ' · ' + esc(s.sigla) : ''}</div><b>${esc(s.nome)}</b>${cam ? `<small>${esc(cam)}</small>` : ''}
    <div class="dc-g">
      ${qt ? `<span><b>${fmtN(qt)}</b>${rotuloUnid(s)}</span>` : ''}
      <span><b>${sub}</b>subordinado(s)</span>
      ${num(s.servidores) ? `<span><b>${fmtN(s.servidores)}</b>servidores</span>` : ''}
      ${f && f.Atual.m ? `<span><b>${fmtRc(f.Atual.m)}</b>por mês${sub && ft.Atual.m !== f.Atual.m ? ` · ${fmtRc(ft.Atual.m)} c/ ramo` : ''}</span>` : ''}
    </div>
    <div class="dc-r"><i class="fa-solid fa-user"></i>${esc(s.responsavel || 'Sem responsável')}</div>
    ${imp || sv !== 'Sem validação' ? `<div class="dc-r">${imp ? `<span class="p" style="background:${IMPACTO[imp][1]}"></span>Impacto ${IMPACTO[imp][0].toLowerCase()}` : ''}${sv !== 'Sem validação' ? ` <span class="p" style="background:${STATUS_VAL[sv]}"></span>${esc(sv)}` : ''}</div>` : ''}
    <div class="dc-h">clique: detalhes · duplo clique: abrir/fechar · botão direito: mais ações</div>`;
  const r = el.getBoundingClientRect(), vr = vpEl.getBoundingClientRect(), w = 270;
  let x = r.right - vr.left + 10, y = r.top - vr.top;
  if (x + w > vr.width - 8) x = r.left - vr.left - w - 10;
  if (x < 8) { x = Math.max(8, r.left - vr.left); y = r.bottom - vr.top + 10; }
  d.style.left = x + 'px'; d.style.top = Math.max(8, Math.min(y, vr.height - 190)) + 'px';
  d.classList.add('on');
}
function esconderDica(){ clearTimeout(tDica); const d = $('#m-dica'); if (d) d.classList.remove('on'); }
$('#nos').addEventListener('mouseover', e => {
  const no = e.target.closest('.no'); if (!no || no.classList.contains('saindo') || drag) return;
  const id = no.dataset.id; if (id === focoId) return;
  clearTimeout(tFoco); clearTimeout(tDica); esconderDica();
  tFoco = setTimeout(() => aplicarFoco(id), 160);
  tDica = setTimeout(() => mostrarDica(id, no), 650);
});
$('#nos').addEventListener('mouseout', e => {
  const no = e.target.closest('.no'); if (!no) return;
  if (e.relatedTarget && no.contains(e.relatedTarget)) return;
  clearTimeout(tFoco); clearTimeout(tDica); esconderDica();
  tFoco = setTimeout(limparFoco, 120);
});
vpEl.addEventListener('pointerdown', e => { esconderDica(); if (e.button !== 2) limparFoco(); terminarAnimMapa(); if (!e.target.closest('#m-ctx')) fecharMenuNo(); }, true);
vpEl.addEventListener('wheel', () => esconderDica(), { passive:true });

/* Menu de ações do setor (botão direito ou toque longo) */
function fecharMenuNo(){ const m = $('#m-ctx'); if (m) m.remove(); }
function menuNo(id, x, y){
  fecharMenuNo(); esconderDica();
  const info = emCenario(() => { const s = porId.get(id); return s ? { s, temF:temFilhos(id), ab:abertos.has(id) } : null; }); if (!info) return;
  const { s, temF, ab } = info, ed = !somenteLeitura(), real = !cenSwap && !!DB.setores.find(x => x.id === id);
  const it = (a, ic, t, cond = true) => cond ? `<button data-a="${a}"><i class="fa-solid ${ic}"></i>${t}</button>` : '';
  const m = document.createElement('div'); m.id = 'm-ctx'; m.className = 'm-ctx';
  m.innerHTML = `<div class="ct">${esc(s.sigla || nomeCurto(s))}<small>${esc(s.tipo)}</small></div>
    ${it('det', 'fa-circle-info', 'Ver detalhes')}
    ${it('focar', 'fa-crosshairs', 'Focar neste ramo')}
    ${it('abrir', 'fa-angles-down', 'Abrir o ramo inteiro', temF)}
    ${it('fechar', 'fa-angles-up', 'Recolher o ramo', temF && ab)}
    ${it('caminho', 'fa-route', 'Mostrar o caminho até o topo')}
    ${it('irmaos', 'fa-people-group', 'Selecionar os irmãos', ed)}
    ${it('mt', 'fa-map-location-dot', 'Ver escolas no mapa de MT', /^(DRE |DME$)/i.test(s.sigla || '') || s.tipo === 'Unidades Escolares')}
    ${ed ? '<hr>' : ''}${it('novo', 'fa-plus', 'Novo subordinado', ed)}${it('fin', 'fa-sack-dollar', 'Lançamento financeiro', ed && real)}${it('auto', 'fa-wand-magic-sparkles', 'Voltar à posição automática', ed && (s.dx || s.dy))}`;
  $('#v-mapa').appendChild(m);
  const vr = vpEl.getBoundingClientRect(), w = 230, h = m.offsetHeight;
  m.style.left = Math.min(x - vr.left, vr.width - w - 8) + 'px'; m.style.top = Math.min(y - vr.top, vr.height - h - 8) + 'px';
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return; fecharMenuNo();
    const a = b.dataset.a;
    if (a === 'det') selecionar(id);
    if (a === 'focar') focarRamo(id);
    if (a === 'abrir') { emCenario(() => [id, ...descendentes(id)].forEach(i => { if (temFilhos(i)) abertos.add(i); })); salvarAbertos(); desenharMapa(); setTimeout(() => focarRamo(id), semMovimento() ? 30 : 500); }
    if (a === 'fechar') alternarAberto(id, false);
    if (a === 'caminho') mostrarCaminho(id);
    if (a === 'irmaos') { multi.add(id); selecionarIrmaos(); }
    if (a === 'novo') novoSetorEm(id);
    if (a === 'mt') { trocarVista('escolas'); const lst = escolasLista(), dres = dresDe(lst), alvo = /^DME$/i.test(s.sigla) ? 'dre metropolitana' : norm(s.sigla || ''); const i = dres.findIndex(d => norm(d) === alvo); setTimeout(() => focarDREmt(i), 400); }
    if (a === 'fin') formDespesa('', id);
    if (a === 'auto') { const r = porId.get(id); guardarPos([r]); r.dx = ''; r.dy = ''; enfileirar('setores', r); desenharMapa(); }
  });
  setTimeout(() => document.addEventListener('pointerdown', function f(e){ if (!e.target.closest('#m-ctx')) { fecharMenuNo(); document.removeEventListener('pointerdown', f, true); } }, true), 0);
}
vpEl.addEventListener('contextmenu', e => { const alvo = document.elementFromPoint(e.clientX, e.clientY), no = (alvo && alvo.closest('.no')) || e.target.closest('.no'); if (!no) return; e.preventDefault(); menuNo(no.dataset.id, e.clientX, e.clientY); });
// toque longo no celular
let tLongo = null;
vpEl.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') return; const no = e.target.closest('.no'); if (!no) return; const x = e.clientX, y = e.clientY; clearTimeout(tLongo); tLongo = setTimeout(() => { if (drag && drag.moveu) return; drag = null; menuNo(no.dataset.id, x, y); if (navigator.vibrate) navigator.vibrate(15); }, 550); });
['pointerup', 'pointercancel', 'pointermove'].forEach(t => vpEl.addEventListener(t, e => { if (t !== 'pointermove' || (drag && drag.moveu)) clearTimeout(tLongo); }));

/* Focar um ramo: aproxima até caber o setor e seus subordinados visíveis */
function focarRamo(id){
  const ids = emCenario(() => [id, ...descendentes(id)]).filter(i => pos.has(i)); if (!ids.length) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  ids.forEach(i => { const p = pos.get(i); x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + NW); y1 = Math.max(y1, p.y + NH); });
  const vp = vpEl.getBoundingClientRect(), pn = $('#painel').classList.contains('aberto') && window.innerWidth > 820 ? 460 : 0, topo = 120;
  const k = Math.max(.15, Math.min(1.25, (vp.width - pn - 80) / (x1 - x0), (vp.height - topo - 60) / (y1 - y0)));
  view = { k, x:(vp.width - pn - (x1 - x0) * k) / 2 - x0 * k, y:topo + (vp.height - topo - 40 - (y1 - y0) * k) / 2 - y0 * k };
  aplicarView(!semMovimento()); setTimeout(() => pulsar(id), semMovimento() ? 0 : 420);
}
/* Caminho até o topo: destaca e anima as ligações */
function mostrarCaminho(id){
  const ids = emCenario(() => [id, ...caminho(id).map(a => a.id)]);
  vpEl.classList.add('focando'); elNo.forEach((el, k) => el.classList.toggle('rel', ids.includes(k)));
  document.querySelectorAll('#arestas path[data-f]').forEach(p => p.classList.toggle('rel', ids.includes(p.dataset.f) && ids.includes(p.dataset.p)));
  document.querySelectorAll('#arestas path.rel').forEach(p => p.classList.add('fluxo'));
  ids.slice().reverse().forEach((i, n) => setTimeout(() => pulsar(i), n * 180));
  setTimeout(() => { document.querySelectorAll('#arestas path.fluxo').forEach(p => p.classList.remove('fluxo')); limparFoco(); }, 3200 + ids.length * 180);
}
/* Duplo clique no fundo: aproxima naquele ponto */
vpEl.addEventListener('dblclick', e => { if (e.target.closest('.no')) return; const r = vpEl.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top, k = Math.min(2.5, view.k * 1.6), q = k / view.k; view = { k, x:cx - (cx - view.x) * q, y:cy - (cy - view.y) * q }; aplicarView(!semMovimento()); });
document.addEventListener('keydown', e => {
  if (vistaAtual !== 'mapa' || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.modal') || !$('#tv-modo').classList.contains('hidden') || e.target.closest('input,textarea,select,[contenteditable]')) return;
  if (e.key === 'l' || e.key === 'L') { alternarMapaUI('leg'); toast(mapaUI.leg ? 'Legenda visível.' : 'Legenda escondida (L para mostrar).'); }
  if (e.key === 'm' || e.key === 'M') alternarMapaUI('mini');
  if ((e.key === 'f' || e.key === 'F') && selId) focarRamo(selId);
});
aplicarMapaUI();

/* Base de escolas estaduais (SEDUC-MT) – planilha "Base de Dados - Completo", aba "1. BASE DE INFORMAÇÕES", ano letivo 2026.
 * Campos: código, unidade, índice da DRE, município, tipo de lotação, localidade (U/R), endereço, número, CEP, bairro, telefone, e-mail, latitude, longitude */
const ESCOLAS_ANO = "2026";
const ESCOLAS_DRES = ["DRE ALTA FLORESTA", "DRE BARRA DO GARÇAS", "DRE CONFRESA", "DRE CÁCERES", "DRE DIAMANTINO", "DRE JUÍNA", "DRE MATUPÁ", "DRE METROPOLITANA", "DRE PONTES E LACERDA", "DRE PRIMAVERA DO LESTE", "DRE RONDONÓPOLIS", "DRE SINOP", "DRE TANGARÁ DA SERRA"];
const ESCOLAS_BASE = [["21717","EECM 19 DE MAIO",0,"ALTA FLORESTA","ESCOLA CÍVICO-MILITAR","U","Rua São Judas Tadeu","349","78.580-000","Boa Nova I","66 35212094","escola.21717@edu.mt.gov.br",-9.8765,-56.0663,250],["145718","EE BOA ESPERANÇA",0,"ALTA FLORESTA","ESCOLA CAMPO","R","Comunidade Ourolanda- Rod.MT 325-Km 75.","0","78.580-000","Zona Rural","66 9632-227","escola.145718@edu.mt.gov.br",-10.3692,-56.4326,85],["15547","EECM DOM BOSCO",0,"ALTA FLORESTA","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","RUA JOÃO DE BARRO","111","78.580-000","JARDIM DAS ARARAS","66 35212399","escola.15547@edu.mt.gov.br",-9.8958,-56.0746,213],["148091","EECM JARDIM UNIVERSITÁRIO",0,"ALTA FLORESTA","ESCOLA CÍVICO-MILITAR","U","Av. Unemat","555","78.580-000","Residencial Universitário","66 992402112","escola.148091@edu.mt.gov.br",-9.9039,-56.0984,518],["40118","EE JAYME VERÍSSIMO DE CAMPOS JÚNIOR",0,"ALTA FLORESTA","ESCOLA INTEGRAL","U","RUA RIO JORDÃO","1","78.580-000","CIDADE ALTA","66 99264499","escola.40118@edu.mt.gov.br",-9.8473,-56.0737,263],["15610","EE LUDOVICO DA RIVA NETO",0,"ALTA FLORESTA","ESCOLA INTEGRAL","U","RUA ORLÂNDIA, CX POSTAL 116","119","78.580-000","VILA NOVA","66 996824385","escola.15610@edu.mt.gov.br",-9.8345,-56.0822,126],["197300","EE MILITAR DOM PEDRO II TENENTE CORONEL EVANDRO DIAS DE SOUZA",0,"ALTA FLORESTA","ESCOLA MILITAR","U","Avenida Uniflor","188","78.580-000","CENTRO","66 992206532","escola.197300@edu.mt.gov.br",-9.8675,-56.0851,919],["15504","EE MUNDO NOVO",0,"ALTA FLORESTA","ESCOLA CAMPO","R","3ª VICINAL LESTE COMUNIDADE MUNDO NOVO","1","78.580-000","Zona Rural","66 984330626","escola.15504@edu.mt.gov.br",-9.8514,-55.9387,183],["45047","EE OURO VERDE",0,"ALTA FLORESTA","ESCOLA CAMPO","R","Rodovia mt 325 km 25 comunidade ouro verde","0","78.580-000","Zona Rural","66 99903218","escola.45047@edu.mt.gov.br",-10.0705,-56.1751,118],["15474","EECM PROFESSORA MARINES FÁTIMA DE SÁ TEIXEIRA",0,"ALTA FLORESTA","ESCOLA CÍVICO-MILITAR","U","AVENIDA LUDOVICO DA RIVA NETO","1702","78.580-000","CENTRO","66 35213677","escola.15474@edu.mt.gov.br",-9.8854,-56.0866,877],["15482","EECM RUI BARBOSA",0,"ALTA FLORESTA","ESCOLA CÍVICO-MILITAR","U","AVENIDA MINAS GERAIS","46","78.580-000","CIDADE ALTA","66 35211497","escola.15482@edu.mt.gov.br",-9.8539,-56.0718,584],["15601","EECM CECÍLIA MEIRELES",0,"ALTA FLORESTA","ESCOLA CÍVICO-MILITAR","U","AV. AMAZONAS","141","78.580-000","Cidade Bela","66 9212-6330","escola.15601@edu.mt.gov.br",-9.8496,-56.0794,651],["124044","EE PORTAL DA AMAZÔNIA",0,"APIACÁS","ESCOLA INTEGRAL","U","AVENIDA DOS YPÊS","01","78.595-000","PRIMAVERA","66 98416033","escola.124044@edu.mt.gov.br",-9.5724,-57.3975,202],["15652","EECM VINÍCIUS DE MORAES",0,"APIACÁS","ESCOLA CÍVICO-MILITAR","U","AV. MONTEIRO LOBATO","1","78.595-000","Pioneiro","66 35931191","escola.15652@edu.mt.gov.br",-9.5557,-57.3856,649],["140988","EEI ITAWYAK",0,"APIACÁS","ESCOLA INDÍGENA","R","Aldeia kururuzinho","00","78.595-000","Terra Indígena Kayabi","66 35931202","escola.140988@edu.mt.gov.br",-8.8839,-57.3267,125],["46434","EE FREI CANECA",0,"CARLINDA","ESCOLA CAMPO/INTEGRAL/MISTA","R","Estrada D2, esquina com Estara D Comunidade Nazaré","348","78.587-000","Zona Rural","66 992708376","escola.46434@edu.mt.gov.br",-9.9101,-55.7412,160],["46442","EECM TANCREDO DE ALMEIDA NEVES",0,"CARLINDA","ESCOLA CÍVICO-MILITAR","U","AV TANCREDO DE ALMEIDA NEVES","115","78.587-000","CENTRO","66 99260319","escola.46442@edu.mt.gov.br",-9.967,-55.825,612],["145726","EE CEREJEIRAS",0,"NOVA BANDEIRANTES","ESCOLA CAMPO","R","RUA JOAO DE DEUS RIBEIRO","0","78.565-000","JAPURANA","66 981371266","escola.145726@edu.mt.gov.br",-9.9691,-58.015,137],["127728","EE PROFESSOR VALDOMIRO TEODORO CANDIDO",0,"NOVA BANDEIRANTES","ESCOLA","U","AVENIDA COMENDADOR LUIZ MENEGHEL","438","78.565-000","CENTRO","66 35721133","escola.127728@edu.mt.gov.br",-9.8505,-57.8163,832],["124087","EE IVONE BORKWSKI DE LIMA",0,"NOVA CANAÃ DO NORTE","ESCOLA CAMPO","R","Avenida Jardim","81","78.515-000","Distrito Colorado do Norte","66 99607187","escola.124087@edu.mt.gov.br",-10.446,-56.0983,132],["13544","EECM NOVA UNIÃO",0,"NOVA CANAÃ DO NORTE","ESCOLA CÍVICO-MILITAR/CAMPO","R","Rua Newton Vieira Barbosa","0","78.515-000","Distrito Ouro Branco","66 996642316","escola.13544@edu.mt.gov.br",-10.5569,-55.9453,230],["13536","EECM NOVA CANAÃ",0,"NOVA CANAÃ DO NORTE","ESCOLA CÍVICO-MILITAR","U","Avenida Parana","115","78.515-000","CENTRO","66 35511238","escola.13536@edu.mt.gov.br",-10.639,-55.7094,727],["173282","EE PROFESSORA NEIDE ENARA SIMA",0,"NOVA MONTE VERDE","ESCOLA","U","RUA REINOLDO KAUFMANN","29","78.593-000","SAO LUCAS","66 98138071","escola.173282@edu.mt.gov.br",-9.9861,-57.4688,543],["15636","EE JOÃO PAULO I",0,"PARANAÍTA","ESCOLA INTEGRAL/ESPORTE","U","Avenida Ayrton Senna da Silva","s/n","78.590-000","CENTRO","66 35631015","escola.15636@edu.mt.gov.br",-9.6653,-56.4765,164],["154059","EE SÃO PEDRO",0,"PARANAÍTA","ESCOLA CAMPO","R","Assentamento São Pedro-Estrada Capixaba","306","78.590-000","Comunidade Sombra da Manha","66 999826019","escola.154059@edu.mt.gov.br",-9.7695,-56.6897,254],["15644","EECM DOUTOR MÁRIO CORRÊA DA COSTA",0,"PARANAÍTA","ESCOLA CÍVICO-MILITAR","U","Via 02","2264","78.590-000","CENTRO","66 35631490","escola.15644@edu.mt.gov.br",-9.6645,-56.4724,559],["15105","EE 09 DE JULHO",1,"ÁGUA BOA","ESCOLA","U","Rua 11","750","78.635-000","Guaruja","66 34681002","escola.15105@edu.mt.gov.br",-14.0533,-52.1641,920],["15091","EE ANTÔNIO GROHS",1,"ÁGUA BOA","ESCOLA INTEGRAL/MISTA","U","RUA 07","456","78.635-000","CENTRO","66 34681202","escola.15091@edu.mt.gov.br",-14.0566,-52.1598,823],["176770","EE JARAGUÁ",1,"ÁGUA BOA","ESCOLA CAMPO/INTEGRAL/AGRÍCOLA","R","RUA PRINCIPAL","01","78.635-000","Assentamento Jaraguá","66 981378848","escola.176770@edu.mt.gov.br",-14.0048,-52.5128,145],["214590","EE MILITAR TIRADENTES 3º SARGENTO PM JUSTINO PINHEIRO DOS SANTOS",1,"ÁGUA BOA","ESCOLA MILITAR","U","Avenida Planalto","3715","78.635-000","Universitário","66 981326793","escola.214590@edu.mt.gov.br",-14.0704,-52.1632,631],["11533","EECM CORONEL JERÔNIMO GOMES SILVA",1,"ARAGUAIANA","ESCOLA CÍVICO-MILITAR","U","Travessa da Saúde","31","78.685-000","CENTRO","66 34991278","escola.11533@edu.mt.gov.br",-15.7301,-51.8347,314],["11410","EE FRANCISCO DOURADO",1,"BARRA DO GARÇAS","ESCOLA","U","AV. ARAGUAIA QUADRA 19","s/n","78.601-470","JARDIM AMAZÔNIA","66 992153365","escola.11410@edu.mt.gov.br",-15.8783,-52.2413,151],["11282","EE HERONIDES ARAÚJO",1,"BARRA DO GARÇAS","ESCOLA CAMPO","R","BR 158 KM 698","00","78608500","DISTRITO DE INDIANÓPOLIS","66 992564202","escola.11282@edu.mt.gov.br",-15.0344,-52.238,211],["11339","EE IRMÃ DIVA PIMENTEL",1,"BARRA DO GARÇAS","ESCOLA INTEGRAL/MISTA","U","RUA DOM AQUINO","791","78.600-001","SANTO ANTÔNIO","66 34011741","escola.11339@edu.mt.gov.br",-15.8806,-52.2614,323],["11290","EECM JOSÉ ÂNGELO DOS SANTOS",1,"BARRA DO GARÇAS","ESCOLA CÍVICO-MILITAR","U","RUA VITÓRIO PEREIRA DA SILVA","979","78.600-294","SÃO JOÃO","66 34016624","escola.11290@edu.mt.gov.br",-15.8899,-52.2736,598],["11355","EE MARECHAL EURICO GASPAR DUTRA",1,"BARRA DO GARÇAS","ESCOLA INTEGRAL/LÍNGUAS","U","RUA MATO GROSSO","1523","78.600-023","CENTRO","66 34016737","escola.11355@edu.mt.gov.br",-15.887,-52.2679,267],["11363","EE MILITAR DOM PEDRO II DEPUTADO NORBERTO SCHWANTES",1,"BARRA DO GARÇAS","ESCOLA MILITAR","U","Rua Eudócia Oliveira Silva","117","78603006","Conjunto Habitacional Piracema","66 34012274","escola.11363@edu.mt.gov.br",-15.8826,-52.2861,517],["213462","EE MILITAR TIRADENTES CABO PM VANILSON SILVA CARVALHO",1,"BARRA DO GARÇAS","ESCOLA MILITAR","U","RUA PRESIDENTE VARGAS","1268","78601246","SETOR CIDADE VELHA","66 992222605","escola.213462@edu.mt.gov.br",-15.8905,-52.25872,640],["60194","EECM PROFESSORA MARIA DE LOURDES HORA MORAES",1,"BARRA DO GARÇAS","ESCOLA CÍVICO-MILITAR","U","RUA PE. ZEFERINO AGOSTINI S/N","0","78.600-001","VILA MARIA","66 34055012","escola.60194@edu.mt.gov.br",-15.891,-52.335,558],["11371","EECM SENADOR FILINTO MÜLLER",1,"BARRA DO GARÇAS","ESCOLA CÍVICO-MILITAR","U","Rua Amaro Leite","619","78.600-027","CENTRO","66 992248433","escola.11371@edu.mt.gov.br",-15.8927,-52.2618,772],["76929","EEI DEPUTADO MÁRIO JURUNA",1,"BARRA DO GARÇAS","ESCOLA INDÍGENA","R","ÁREA RURAL","1","78.607-899","ÁREA RURAL DE BARRA DO GARÇAS","66 34011468","escola.76929@edu.mt.gov.br",-15.4214,-52.9336,226],["11452","EEI DOM FELIPPÓ RINALDI",1,"BARRA DO GARÇAS","ESCOLA INDÍGENA","R","TERRA INDÍGENA SÃO MARCOS","SN","78.600-001","Zona Rural","66 34161021","escola.11452@edu.mt.gov.br",-15.3758,-52.9026,219],["124010","EEI HAMBÉ",1,"BARRA DO GARÇAS","ESCOLA INDÍGENA","R","ALDEIA NOVA ESPERANÇA","10","78607899","ÁREA RURAL DE BARRA DO GARÇAS","66 34017620","escola.124010@edu.mt.gov.br",-15.4715,-52.8591,135],["158844","EEI JUCELINO TSEREMA-Á",1,"BARRA DO GARÇAS","ESCOLA INDÍGENA","R","ÁREA RURAL","s/n","78.607-899","ÁREA RURAL DE BARRA DO GARÇAS","66 34011468","escola.158844@edu.mt.gov.br",-15.3558,-52.8477,208],["107263","EEI ULISSES GUIMARÃES",1,"BARRA DO GARÇAS","ESCOLA INDÍGENA","R","ÁREA RURAL","1","78.607-899","ÁREA RURAL DE BARRA DO GARÇAS","66 34482000","escola.107263@edu.mt.gov.br",-15.4515,-52.8586,172],["15172","EE COUTO MAGALHÃES",1,"CAMPINÁPOLIS","ESCOLA","U","RUA LAUDELINO DOMINGOS DE ARAÚJO","1700","78.630-000","SETOR ANTONIO PEDRO","66 992575852","escola.15172@edu.mt.gov.br",-14.5426,-52.7916,583],["123021","EEI ALDEIONA",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA ALDEIONA","1","78.630-000","RESERVA INDÍGENA","66 34371030","escola.123021@edu.mt.gov.br",-14.4142,-53.3873,61],["131822","EEI BUTSE WAWE",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA SÃO FELIPE","1","78.630-000","RESERVA INDÍGENA","66 34371030","escola.131822@edu.mt.gov.br",-14.4272,-52.8944,147],["192643","EEI CONSTANTINO TSEREROWÊ",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA DZEPA","0","78.630-000","TERRA INIDIGENA PARABUBURE","66 34371030","escola.192643@edu.mt.gov.br",-14.4326,-53.1291,25],["166294","EEI DAVID AI'RERO",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","Aldeia Etepó're","00","78.630-000","Terra indígena Parabubure","66 34371030","escola.166294@edu.mt.gov.br",-14.3759,-53.1708,53],["118532","EEI ESTRELA",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA ESTRELAz","2","78.630-000","Zona Rural","66 34371030","escola.118532@edu.mt.gov.br",-14.3372,-53.2108,83],["148121","EEI LUIZ RUDZANE'EDI OREBEWE",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA RO OREDZA OZE","6","78.630-000","Zona Rural","66 34371030","escola.148121@edu.mt.gov.br",-14.4914,-53.0263,84],["156361","EEI RAÍ'RÃTE",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA SAO PEDRO","2","78.630-000","RESERVA INDIGENA","66 34371030","escola.156361@edu.mt.gov.br",-14.266,-53.0306,33],["119229","EEI WA'OMORÃ",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA BOM JESUS DA LAPA","1","78.630-000","RESERVA INDÍGENA","66 33437115","escola.119229@edu.mt.gov.br",-14.2578,-52.9892,75],["115231","EEI XAVANTE",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA NOVO PARAÍSO","1","78.630-000","Zona Rural","66 34371159","escola.115231@edu.mt.gov.br",-14.4305,-53.4467,54],["15130","EECM31 DE MARÇO",1,"CANARANA","ESCOLA CÍVICO-MILITAR","U","Avenida Paraná","328","78.640-000","CENTRO","66 984380501","escola.15130@edu.mt.gov.br",-13.5536,-52.2705,1188],["154156","EE MILITAR TIRADENTES CABO PM SEBASTIÃO FERREIRA MIRANDA",1,"CANARANA","ESCOLA MILITAR","U","RUA SANTA ROSA","604","78.640-000","NOVA CANARANA","66 34783592","escola.154156@edu.mt.gov.br",-13.559,-52.263,515],["131857","EEI ETENHIRITIPÁ",1,"CANARANA","ESCOLA INDÍGENA","R","TERRA INDÍGENA PIMENTEL BARBOSA","0","78.640-000","ALDEIA WEDERÃ","66 34781100","escola.131857@edu.mt.gov.br",-13.2882,-51.5797,63],["156345","EEI SAMUEL SAHUTUWÊ",1,"CANARANA","ESCOLA INDÍGENA","R","TERRA INDÍGENA PIMENTEL BARBOSA","0","78.640-000","ALDEIA ETENHIRITIPÁ","66 34781100","escola.156345@edu.mt.gov.br",-13.317,-51.6826,120],["11550","EE GETÚLIO VARGAS",1,"COCALINHO","ESCOLA","U","RUA ARCEU BEZERRA VILARINS","223","78.680-000","CENTRO","66 992260928","escola.11550@edu.mt.gov.br",-14.3949,-51.0002,548],["69299","EEI IKPENG",1,"FELIZ NATAL","ESCOLA INDÍGENA","R","TERRA INDÍGENA DO XINGÚ","0","78.885-000","CTL PAVURU","66 34781100","escola.69299@edu.mt.gov.br",-11.7436,-53.6115,234],["192112","EEI CENTRAL AIHA",1,"GAÚCHA DO NORTE","ESCOLA INDÍGENA","R","Terra Indígena do Xingu","s/n","78.875-000","Aldeia Kalapalo","66 984103902","escola.192112@edu.mt.gov.br",-12.1638,-53.2568,279],["156353","EEI MAVUTSININ",1,"GAÚCHA DO NORTE","ESCOLA INDÍGENA","R","TERRA INDÍGENA DO XINGÚ","0","78.875-000","ALDEIA YPAVU","66 34781100","escola.156353@edu.mt.gov.br",-12.1534,-53.433,133],["11487","EE ANTÔNIO NONATO ROCHA",1,"GENERAL CARNEIRO","ESCOLA CAMPO","R","19ª TRAVESSA PRINCIPAL, S/N","155","78620-970","PAREDÃO","66 34491020","escola.11487@edu.mt.gov.br",-15.5715,-53.4116,171],["11509","EE DOUTOR JOÃO PONCE DE ARRUDA",1,"GENERAL CARNEIRO","ESCOLA","U","AVENIDA RACHID J. MAMED","s/n","78.620-970","CENTRO","66 34161061","escola.11509@edu.mt.gov.br",-15.7083,-52.7558,167],["11479","EEI SAGRADO CORAÇÃO DE JESUS",1,"GENERAL CARNEIRO","ESCOLA INDÍGENA/INTEGRAL/MISTA","R","ALDEIA MERURI - RODOVIA BR 070 KM 112","0","78.620-000","ZONA RURAL - TI MERURI","66 34161172","escola.11479@edu.mt.gov.br",-15.5503,-53.0784,126],["69329","EECM TANCREDO NEVES",1,"NOVA NAZARÉ","ESCOLA CÍVICO-MILITAR","U","RUA FABIANE ALVES DA SILVA LIMA QD 26 LT 02","s/n","78.638-000","SETOR SUL","66 34671102","escola.69329@edu.mt.gov.br",-13.9887,-51.8021,455],["15067","EE JUSCELINO KUBITSCHEK DE OLIVEIRA",1,"NOVA XAVANTINA","ESCOLA","U","AV. BRASILIA","287","78.690-000","TONETTO","66 34381976","escola.15067@edu.mt.gov.br",-14.6641,-52.3503,503],["15059","EE MILITAR TIRADENTES CABO PM DANNER MAIA BARBOSA",1,"NOVA XAVANTINA","ESCOLA MILITAR","U","AV. RIO GRANDE DO SUL","1039","78.690-000","CENTRO","66 992281871","escola.15059@edu.mt.gov.br",-14.6599,-52.3546,616],["15032","EE MINISTRO JOÃO ALBERTO",1,"NOVA XAVANTINA","ESCOLA","U","Av. Expedição Roncador Xingu","275","78.690-000","CENTRO","66 34381293","escola.15032@edu.mt.gov.br",-14.6747,-52.353,457],["15075","EECM ARLINDO ESTILAC LEAL",1,"NOVA XAVANTINA","ESCOLA CÍVICO-MILITAR","U","Av. COUTO MAGALHÃES","2563","78.690-000","ESTILAC LEAL","66 34382960","escola.15075@edu.mt.gov.br",-14.6464,-52.3549,361],["11576","EE DINIZ ALVES DE TOLEDO",1,"NOVO SÃO JOAQUIM","ESCOLA","U","Rua Divina Madalena","332","78.625-000","CENTRO","66 34791128","escola.11576@edu.mt.gov.br",-14.9104,-53.0213,477],["11568","EE JOSÉ DE ALENCAR",1,"NOVO SÃO JOAQUIM","ESCOLA CAMPO","R","RUA PRINCIPAL","s/nº","78.625-000","CENTRO / DISTRITO CACHOEIRA DA FUMAÇA","66 981266555","escola.11568@edu.mt.gov.br",-15.0908,-52.8053,209],["49549","EECM SÃO MIGUEL",1,"PONTAL DO ARAGUAIA","ESCOLA CÍVICO-MILITAR","U","Rua.: Custódio de Souza Pinto","86","78.698-000","Universitário","66 992426283","escola.49549@edu.mt.gov.br",-15.9084,-52.2613,352],["13013","EE SÃO DOMINGOS SÁVIO",1,"PONTE BRANCA","ESCOLA","U","Av.Cel.Belmiro Nogueira da Silva","1","78.610-000","CENTRO","66 34661312","escola.13013@edu.mt.gov.br",-16.7644,-52.8376,177],["192228","EE 20 DE MARÇO",1,"QUERÊNCIA","ESCOLA CAMPO","R","ESTRADA R9","s/n","78.643-000","SETOR RURAL","66 09719428","escola.192228@edu.mt.gov.br",-12.597,-52.1946,396],["157260","EE COUTINHO UNIÃO",1,"QUERÊNCIA","ESCOLA CAMPO","R","AVENIDA CENTRO OESTE, S/N, DISTRITO DE COUTINHO UNIÃO","0","78.643-000","Zona Rural","66 992267160","escola.157260@edu.mt.gov.br",-11.9593,-52.4941,409],["61441","EE MILITAR TIRADENTES CORONEL PM JORGE LUIZ DE MAGALHÃES",1,"QUERÊNCIA","ESCOLA MILITAR","U","AV. FRANCISCO SCHNEIDER","1524","78.643-000","SETOR NOVA QUERÊNCIA","66 984326887","escola.61441@edu.mt.gov.br",-12.5866,-52.2106,683],["44253","EE QUERÊNCIA",1,"QUERÊNCIA","ESCOLA","U","RUA VERONICA J. FONTANA","186","78.643-000","SETOR D","66 992829740","escola.44253@edu.mt.gov.br",-12.5931,-52.2087,1248],["124850","EEI CENTRAL KISÉDJE",1,"QUERÊNCIA","ESCOLA INDÍGENA","R","ALDEIA KHIKATXI","1","78.643-000","TERRA INDÍGENA WAWI","66 44007906","escola.124850@edu.mt.gov.br",-11.869,-52.9028,171],["15180","EE CORONEL ONDINO RODRIGUES LIMA",1,"RIBEIRÃO CASCALHEIRA","ESCOLA","U","Avenida Professor Zacarias","1396","78.675-000","CENTRO","66 34891300","escola.15180@edu.mt.gov.br",-12.931,-51.8238,793],["45403","EECM ALEXANDRE LEITE",1,"RIBEIRÃOZINHO","ESCOLA CÍVICO-MILITAR","U","AVENIDA SENADOR JOÃO VILAS BOAS","625","78.613-000","CENTRO","66 34151200","escola.45403@edu.mt.gov.br",-16.4912,-52.6934,242],["69280","EEI DIAUARUM",1,"SÃO FÉLIX DO ARAGUAIA","ESCOLA INDÍGENA","R","TERRA INDÍGENA DO XINGÚ","0","78.670-000","CTL DIAUARUM","66 34781100","escola.69280@edu.mt.gov.br",-11.1992,-53.2356,331],["11517","EE ARTHUR DA COSTA E SILVA",1,"TORIXORÉU","ESCOLA","U","Avenida Deputado Heronides Araújo","SN","78.695-000","Vila União","66 09644022","escola.11517@edu.mt.gov.br",-16.1966,-52.5561,263],["16560","EECM JOÃO SATO",3,"ARAPUTANGA","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","Av. Marechal Rondon","813","78.260-000","CENTRO","65 999112496","escola.16560@edu.mt.gov.br",-15.4708,-58.3494,396],["16594","EE PRESIDENTE TANCREDO DE ALMEIDA NEVES",3,"ARAPUTANGA","ESCOLA CAMPO/INTEGRAL/MISTA","R","Av.Dionisio Santa Rosa","1","78.260-000","Comunidade de Farinópolis","65 998083238","escola.16594@edu.mt.gov.br",-15.4053,-58.449,131],["16624","EECM NOSSA SENHORA DE FÁTIMA",3,"ARAPUTANGA","ESCOLA CÍVICO-MILITAR","U","RUA MARQUES DE POMBAL","445","78.260-000","JARDIM PRIMAVERA","65 99612241","escola.16624@edu.mt.gov.br",-15.4732,-58.3423,736],["11606","EE 11 DE MARÇO",3,"CÁCERES","ESCOLA","U","RUA TIRADENTES","732","78.200-001","CENTRO","65 996208638","escola.11606@edu.mt.gov.br",-16.07,-57.6846,1139],["176664","EE 12 DE OUTUBRO",3,"CÁCERES","ESCOLA CÍVICO-MILITAR/CAMPO","R","BR 070","0","78.219.899","Agrovila Nova Esperança","65 999304491","escola.176664@edu.mt.gov.br",-16.2977,-58.1911,380],["11630","EE LEOPOLDO AMBRÓSIO FILHO",3,"CÁCERES","ESCOLA INTEGRAL","U","Rua dos Cajueiros","s/n","78.211-210","DNER","65 999969310","escola.11630@edu.mt.gov.br",-16.078,-57.6611,160],["61298","EE MILITAR TIRADENTES PROFESSOR NATALINO FERREIRA MENDES",3,"CÁCERES","ESCOLA MILITAR","U","RUA TIRADENTES","726","78.210-090","CENTRO","65 32230001","escola.61298@edu.mt.gov.br",-16.0697,-57.6852,729],["11703","EE PROFESSOR DEMÉTRIO COSTA PEREIRA",3,"CÁCERES","ESCOLA INTEGRAL/MISTA","U","RUA DOS COLIBRIS","0","78210490","CIDADE ALTA","65 996642527","escola.11703@edu.mt.gov.br",-16.0718,-57.6773,468],["84336","EE PROFESSOR JOÃO FLORENTINO SILVA NETO",3,"CÁCERES","ESCOLA CÍVICO-MILITAR/CAMPO","R","Rua Dercídio Magio","s/n","78.236-970","DISTRITO DE CARAMUJO","65 981321600","escola.84336@edu.mt.gov.br",-15.8449,-57.862,739],["11657","EE SÃO LUIZ",3,"CÁCERES","ESCOLA CÍVICO-MILITAR","U","AVENIDA GETÚLIO VARGAS","2085","78.210-902","JARDIM CELESTE","65 996716947","escola.11657@edu.mt.gov.br",-16.0849,-57.6754,936],["11690","EECM FREI AMBRÓSIO",3,"CÁCERES","ESCOLA CÍVICO-MILITAR","U","AVENIDA NOSSA SENHORA DO CARMO","1","78.200-001","JUNCO","65 996630824","escola.11690@edu.mt.gov.br",-16.101,-57.6867,725],["11797","EECM PROFESSORA ANA MARIA DAS GRAÇAS DE SOUZA NORONHA",3,"CÁCERES","ESCOLA CÍVICO-MILITAR","U","RUA MONTEIROS","0","78.217-383","COHAB NOVA","65 996585833","escola.11797@edu.mt.gov.br",-16.048,-57.6593,640],["11614","EECM SENADOR MÁRIO MOTTA",3,"CÁCERES","ESCOLA CÍVICO-MILITAR","U","Rua Dr Leopoldo Ambrosio Filho","0","78.200-001","SAO LUIZ","65 999096909","escola.11614@edu.mt.gov.br",-16.0853,-57.6951,974],["212490","EEDIEB PROFESSOR MILTON MARQUES CURVO",3,"CÁCERES","ESCOLA","U","Rua Bolivia","21","78.210-270","CENTRO","65 999956706","escola.212490@edu.mt.gov.br",-16.0774,-57.6915,612],["69493","EECM BOA ESPERANÇA",3,"CURVELÂNDIA","ESCOLA CÍVICO-MILITAR","U","AVENIDA MARIANA","3188","78.237-000","CENTRO","65 32731115","escola.69493@edu.mt.gov.br",-15.6101,-57.9208,491],["71790","EECM JOSÉ BEJO",3,"GLÓRIA D'OESTE","ESCOLA CÍVICO-MILITAR","U","Rua Maria Cecília Della Costa","2606","78.293-000","José Bejo","65 999895140","escola.71790@edu.mt.gov.br",-15.7725,-58.3127,197],["16640","EE PAULINO MODESTO",3,"INDIAVAÍ","ESCOLA","U","Rua Nossa Senhora do Carmo","0","78.295-000","CENTRO","65 998441868","escola.16640@edu.mt.gov.br",-15.4951,-58.578,89],["11894","EECM PADRE JOSÉ ANCHIETA",3,"LAMBARI D'OESTE","ESCOLA CÍVICO-MILITAR","U","RUA CIDROLANDIA","145 E","78.278-000","CENTRO","65 99611566","escola.11894@edu.mt.gov.br",-15.3197,-58.0039,439],["16284","EE BOA VISTA",3,"MIRASSOL D'OESTE","ESCOLA","U","RUA BARÃO DO RIO BRANCO","238","78.280-000","ALTO DA BOA VISTA","65 99816434","escola.16284@edu.mt.gov.br",-15.6883,-58.0967,210],["16195","EE JOÃO DE CAMPOS WIDAL",3,"MIRASSOL D'OESTE","ESCOLA CAMPO/INTEGRAL","R","AVENIDA CUIABÁ","1","78.280-000","Distrito de Sonho Azul","65 996693881","escola.16195@edu.mt.gov.br",-15.7737,-58.1215,226],["94420","EE MADRE CRISTINA",3,"MIRASSOL D'OESTE","ESCOLA CAMPO","R","Assentamento Roseli Nunes","SN","78.280-000","Zona Rural","65 998048231","escola.94420@edu.mt.gov.br",-15.534,-58.0234,95],["16241","EECM PADRE JOSÉ DE ANCHIETA",3,"MIRASSOL D'OESTE","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","Rua XV de Novembro","1151","78.280-000","CIDADE TAMANDARÉ","65 996243664","escola.16241@edu.mt.gov.br",-15.6727,-58.0845,210],["16209","EECM PADRE TIAGO",3,"MIRASSOL D'OESTE","ESCOLA CÍVICO-MILITAR","U","RUA PROFESSOR ODÉLIO BARBOSA DA SILVA","620","78.280-000","CENTRO","65 32411670","escola.16209@edu.mt.gov.br",-15.6759,-58.0961,821],["16233","EE PEDRO GALHARDO GARCIA",3,"MIRASSOL D'OESTE","ESCOLA","U","RUA PAULINA MOREIRA DE MATOS - PARQUE MORUMBI","241","78.280-000","PARQUE MORUMBI","65 32412296","escola.16233@edu.mt.gov.br",-15.6774,-58.0858,378],["16187","EECM 12 DE OUTUBRO",3,"MIRASSOL D'OESTE","ESCOLA CÍVICO-MILITAR","U","RUA NILMA PEREIRA LEITE","1298","78.280-000","CENTRO","65 996237931","escola.16187@edu.mt.gov.br",-15.6792,-58.1018,477],["16314","EECM 13 DE MAIO",3,"PORTO ESPERIDIÃO","ESCOLA CÍVICO-MILITAR","U","Rua Ramão Lara Franco","46","78.240-000","Parque das Américas","65 998016574","escola.16314@edu.mt.gov.br",-15.8541,-58.466,532],["16322","EE SÃO GERALDO",3,"PORTO ESPERIDIÃO","ESCOLA CAMPO","R","Rua Padre Nazareno","s/n°","78.240-000","Bocaiuval","65 996510318","escola.16322@edu.mt.gov.br",-15.7282,-58.6237,242],["154989","EEI CHIQUITANO JOSÉ TURÍBIO",3,"PORTO ESPERIDIÃO","ESCOLA INDÍGENA","R","TERRA INDIGENA ALDEIA VILA NOVA BARBECHO","0","78.240-000","indígena","65 32251337","escola.154989@edu.mt.gov.br",-16.2684,-59.1593,26],["109444","EEI CHIQUITANOS",3,"PORTO ESPERIDIÃO","ESCOLA INDÍGENA","R","Marechal Rondon","0","78.240-000","Zona Rural","65 32251337","escola.109444@edu.mt.gov.br",-16.2415,-59.4489,73],["16632","EE PROFESSOR DEMÉTRIO PEREIRA",3,"RESERVA DO CABAÇAL","ESCOLA","U","Av. Mato Grosso","222","78.265-000","CENTRO","65 981172872","escola.16632@edu.mt.gov.br",-15.1204,-58.3844,232],["11886","EECM DEPUTADO FRANCISCO EDUARDO RANGEL TORRES",3,"RIO BRANCO","ESCOLA CÍVICO-MILITAR","U","Avenida Sete de Setembro","1017","78.275-000","CIDADE ALTA","65 999316708","escola.11886@edu.mt.gov.br",-15.2464,-58.116,406],["11843","EE DEPUTADO FRANCISCO VILLANOVA",3,"SALTO DO CÉU","ESCOLA","U","RUA ESPIRITO SANTO","412","78.270-000","BELA VISTA","65 996143896","escola.11843@edu.mt.gov.br",-15.1295,-58.1326,298],["15261","EE 15 DE JUNHO",3,"SÃO JOSÉ DOS QUATRO MARCOS","ESCOLA","U","RUA JALES","1","78.285-000","JARDIM ZEFERINO I","65 996465449","escola.15261@edu.mt.gov.br",-15.6215,-58.1721,320],["15210","EE DEPUTADO BERTOLDO FREIRE",3,"SÃO JOSÉ DOS QUATRO MARCOS","ESCOLA INTEGRAL","U","Rua Pernambuco","962","78.285-000","CENTRO","65 996143896","escola.15210@edu.mt.gov.br",-15.6277,-58.1799,224],["15253","EECM LOURENÇO PERUCHI",3,"SÃO JOSÉ DOS QUATRO MARCOS","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","RUA LEON DENIS","526","78.285-000","JARDIM POPULAR","65 999906694","escola.15253@edu.mt.gov.br",-15.6359,-58.1845,149],["15300","EE SANTA ROSA",3,"SÃO JOSÉ DOS QUATRO MARCOS","ESCOLA CAMPO","R","RODOVIA MT 175 KM 50","SN","78.285-000","COMUNIDADE DO BARREIRÃO","65 999078373","escola.15300@edu.mt.gov.br",-15.5666,-58.2587,177],["15237","EECM MIGUEL BARBOSA",3,"SÃO JOSÉ DOS QUATRO MARCOS","ESCOLA CÍVICO-MILITAR","U","RUA SETE DE SETEMBRO","845","78.285-000","JARDIM SANTA ROSA","65 999310627","escola.15237@edu.mt.gov.br",-15.6239,-58.1812,480],["39055","EE JOÃO REZENDE DE AZEVEDO",2,"ALTO BOA VISTA","ESCOLA","U","Avenida Brasil","700","78.665-000","CENTRO","66 35391163","escola.39055@edu.mt.gov.br",-11.6788,-51.379,287],["69205","EE PROFESSOR GERSON CARLOS DA SILVA",2,"BOM JESUS DO ARAGUAIA","ESCOLA","U","Rua J Ribeiro","230","78.678-000","CENTRO","66 35381250","herculesofn@gmail.com",-12.1708,-51.5091,663],["118524","EEI MARAIWATSEDE",2,"BOM JESUS DO ARAGUAIA","ESCOLA INDÍGENA","R","Aldeia Maraiwatsede","0","78.678-000","rural","66 35381340","escola.118524@edu.mt.gov.br",-11.8979,-51.6827,303],["14222","EE ELIAS BENTO",2,"CANABRAVA DO NORTE","ESCOLA","U","AVENIDA ANTONIO BOSAIPO","78","78.658-000","CENTRO","66 35771195","escola.14222@edu.mt.gov.br",-11.0498,-51.8268,422],["159700","EE ANTÔNIO ALVES DIAS",2,"CONFRESA","ESCOLA CAMPO/INTEGRAL/MISTA","R","MT 430 KM 35 AGROVILA NOVO PLANALTO","s/n","78.652-000","Zona Rural","66 999884090","escola.159700@edu.mt.gov.br",-10.5749,-51.8318,223],["194921","EE MILITAR TIRADENTES CABO PM JOSÉ MARTINS DE MOURA",2,"CONFRESA","ESCOLA MILITAR","U","Avenida Aluísio Babinski","139","78.652-000","Setor Babinsk","66 35641453","escola.194921@edu.mt.gov.br",-10.6495,-51.57,661],["156388","EE SOL NASCENTE",2,"CONFRESA","ESCOLA CAMPO","R","ASSENTAMENTO CONFRESA RONCADOR, AGROVILA LUMIAR, KM 45","s/n","78.652-000","Zona Rural","66 99723114","escola.156388@edu.mt.gov.br",-10.3681,-51.6811,79],["124907","EE TEOTÔNIO CARLOS DA CUNHA NETO",2,"CONFRESA","ESCOLA","U","Av. S esquina com SQ 19","0","78.652-000","Setor Gameleira","66 35641828","escola.124907@edu.mt.gov.br",-10.6405,-51.5694,1292],["158828","EE WALDIR BENTO DA COSTA",2,"CONFRESA","ESCOLA CAMPO","R","Rua moreira Cabral, distrito de Veranópolis","s/n","78.652-000","Zona Rural","66 35649107","escola.158828@edu.mt.gov.br",-10.4595,-51.4526,288],["38652","EECM 29 DE JULHO",2,"CONFRESA","ESCOLA CÍVICO-MILITAR","U","RUA IPORÁ","6","78.652-000","CENTRO","66 992539929","escola.38652@edu.mt.gov.br",-10.6464,-51.5721,1015],["212482","EEDIEB CREUSLHI DE SOUZA RAMOS",2,"CONFRESA","ESCOLA INTEGRAL/ESPORTE","U","Av. Centro-Oeste, esq. c/ Pequizeiro","735","78.652-000","VILA NOVA","66 997113867","escola.212482@edu.mt.gov.br",-10.661,-51.5751,187],["75710","EEI TAPI'ITÃWA",2,"CONFRESA","ESCOLA INDÍGENA","R","ALDEIA INDÍGENA TAPI'ITÃWA","0","78.652-000","TERRA INDÍGENA URUBU BRANCO","66 99843748","escola.75710@edu.mt.gov.br",-10.6691,-51.3527,278],["38709","EE JUSCELINO KUBISTCHEK",2,"LUCIARA","ESCOLA","U","AVENIDA 10 DE MAIO","0","78.660-000","CENTRO","66 984161908","escola.38709@edu.mt.gov.br",-11.2232,-50.6692,240],["75698","EEI HADORI",2,"LUCIARA","ESCOLA INDÍGENA","R","ALDEIA SÃO DOMINGOS","0","78.660-000","Zona Rural","66 35281327","escola.75698@edu.mt.gov.br",-11.2446,-50.6627,81],["69140","EE 29 DE SETEMBRO",2,"NOVO SANTO ANTÔNIO","ESCOLA","U","Av.Santo Antonio","68","78.674-000","CENTRO","66 35481129","escola.69140@edu.mt.gov.br",-12.2907,-50.9668,67],["14206","EE ALEXANDRE QUIRINO SOUZA",2,"PORTO ALEGRE DO NORTE","ESCOLA","U","RUA SÃO PEDRO","472","78.655-000","CENTRO","66 35691289","escola.14206@edu.mt.gov.br",-10.8819,-51.6351,589],["158623","EE ANTÔNIA LEÃO DOS SANTOS",2,"PORTO ALEGRE DO NORTE","ESCOLA CAMPO","R","COLONIA GOIAS I","0","78.655-000","PA UNIAO MARGARIDA","66 992271842","escola.158623@edu.mt.gov.br",-10.7492,-51.8655,101],["91456","EE JOSÉ GONÇALVES DOS SANTOS",2,"PORTO ALEGRE DO NORTE","ESCOLA CAMPO/INTEGRAL","R","AVENIDA 01","00","78.655-000","NOVA FLORESTA","66 98461314","escola.91456@edu.mt.gov.br",-10.785,-51.9921,115],["14214","EECM 13 DE MAIO",2,"PORTO ALEGRE DO NORTE","ESCOLA CÍVICO-MILITAR","U","RUA AMAZONAS","1","78.655-000","SETOR DOS ESPORTES","66 35691377","escola.14214@edu.mt.gov.br",-10.8828,-51.6291,267],["77925","EE SANTA CRUZ",2,"SANTA CRUZ DO XINGU","ESCOLA","U","AV. PROJETADA A, QD. A LT A","1","78.664-000","ELDORADO","66 35941170","escola.77925@edu.mt.gov.br",-10.158,-52.3869,259],["158348","EE ROBERVAL COSTA REIS",2,"SANTA TEREZINHA","ESCOLA CAMPO","R","Proj. de Assentamento Porto Velho-Colônia Santa Terezinha","s/nº","78.650-000","Zona Rural","66 981024273","escola.158348@edu.mt.gov.br",-10.5295,-50.8533,319],["14150","EE SANTA TEREZINHA",2,"SANTA TEREZINHA","ESCOLA","U","RUA DO COMERCIO","240","78.650-000","CENTRO","66 981162561","escola.14150@edu.mt.gov.br",-10.4758,-50.5141,340],["148075","EEI HAWALORA",2,"SANTA TEREZINHA","ESCOLA INDÍGENA","R","Aldeia Hawalora","0","78.650-000","S/N","66 98418344","escola.148075@edu.mt.gov.br",-10.6409,-50.6209,60],["75680","EEI ITXALÁ",2,"SANTA TEREZINHA","ESCOLA INDÍGENA","R","Aldeia Itxala","s/nº","78.650-000","Zona Rural","66 984631387","escola.75680@edu.mt.gov.br",-10.6538,-50.6047,121],["14184","EEI TAPIRAPÉ",2,"SANTA TEREZINHA","ESCOLA INDÍGENA","R","ALDEIA MAJTYRI","1","78.650-000","Zona Rural","66 992567656","escola.14184@edu.mt.gov.br",-10.6235,-50.6236,38],["14095","EE PRESIDENTE TANCREDO DE ALMEIDA NEVES",2,"SÃO FÉLIX DO ARAGUAIA","ESCOLA INTEGRAL/MISTA","U","Avenida Governador José Fragelli","1167","78.670-000","VILA NOVA","66 98477590","escola.14095@edu.mt.gov.br",-11.6178,-50.6717,267],["14087","EE SEVERIANO NEVES",2,"SÃO FÉLIX DO ARAGUAIA","ESCOLA CAMPO","R","AVENIDA SÃO VICENTE","SN","78.670-000","DISTRITO ESPIGÃO DO LESTE","66 98428904","escola.14087@edu.mt.gov.br",-11.4321,-50.6875,298],["137758","EECM PROFESSORA HILDA ROCHA SOUZA",2,"SÃO FÉLIX DO ARAGUAIA","ESCOLA CÍVICO-MILITAR","U","AV SEVERIANO NEVES","s/n","78.670-000","CENTRO","66 35221202","escola.137758@edu.mt.gov.br",-11.6172,-50.6684,294],["158615","EE 05 DE ABRIL",2,"SÃO JOSÉ DO XINGU","ESCOLA CAMPO/INTEGRAL/MISTA","R","RUA 01 QUADRA 06","0","78.663-000","DISTRITO DE SANTO ANTONIO DO FONTOURA","66 35081168","escola.158615@edu.mt.gov.br",-10.5804,-52.2491,350],["14192","EE ANTÔNIO GOMES PRIMO",2,"SÃO JOSÉ DO XINGU","ESCOLA","U","AVENIDA DOMITÍLIA GOMES DE OLIVEIRA","68","78.663-000","CENTRO","66 35681197","escola.14192@edu.mt.gov.br",-10.8041,-52.7353,381],["123986","EEI BEPKOROROTI",2,"SÃO JOSÉ DO XINGU","ESCOLA INDÍGENA","R","ALDEIA PIARAÇU","SN","78.663-000","ALDEIA","66 44007888","escola.123986@edu.mt.gov.br",-10.7792,-53.0794,156],["158372","EEI BITAHAMA",2,"SÃO JOSÉ DO XINGU","ESCOLA INDÍGENA","R","ALDEIA PAKAYA","SN","78.663-000","Zona Rural","66 35681073","escola.158372@edu.mt.gov.br",-10.8339,-53.1169,31],["69230","EE ANTÔNIO CARLOS MOURA",2,"SERRA NOVA DOURADA","ESCOLA","U","RUA AÇAI","292","78.668-000","CENTRO","66 34731060","escola.69230@edu.mt.gov.br",-12.0878,-51.4016,95],["14230","EE MARIA ESTHER PERES",2,"VILA RICA","ESCOLA","U","RUA UM","07","78.645-000","SETOR SUL","66 35541428","escola.14230@edu.mt.gov.br",-10.0159,-51.1156,941],["127701","EE MILITAR TIRADENTES SOLDADO PM ANTÔNIO EUSTÁQUIO DE PAULA",2,"VILA RICA","ESCOLA MILITAR","U","Rua 52","723","78.645-000","SETOR OESTE","66 35541574","escola.127701@edu.mt.gov.br",-10.0185,-51.1302,485],["155128","EE ÁGUA SANTA",4,"ALTO PARAGUAI","ESCOLA CAMPO","R","AVENIDA PRINCIPAL","s/n","78.410-000","Assentamento Nova Esperança","65 99697383","escola.155128@edu.mt.gov.br",-14.8896,-56.7154,82],["13838","EE ALEXANDRE GOMES SILVA CHAVES",4,"ALTO PARAGUAI","ESCOLA","U","Rua Santos Dumont","70","78.410-000","CENTRO","65 992172029","escola.13838@edu.mt.gov.br",-14.5157,-56.4846,260],["13889","EE DOUTOR ARNALDO ESTEVÃO DE FIGUEIREDO",4,"ALTO PARAGUAI","ESCOLA INTEGRAL","U","AVENIDA MAJOR SIMÃO AURELIANO DE BARROS","221","78.410-000","CENTRO","65 99949233","escola.13889@edu.mt.gov.br",-14.5164,-56.483,107],["173509","EE HENRIQUE JOSÉ TRINDADE",4,"ALTO PARAGUAI","ESCOLA CAMPO/INTEGRAL/MISTA","R","RUA MANOEL DIAS","s/n","78.410-000","CAPÃO VERDE","65 999647702","escola.173509@edu.mt.gov.br",-14.9357,-56.8451,75],["13897","EE PROFESSORA ZÉLIA COSTA DE ALMEIDA",4,"ALTO PARAGUAI","ESCOLA CAMPO","R","Rua 25 de Outubro","0","78.410-000","Distrito de Tira Sentido","65 999125277","escola.13897@edu.mt.gov.br",-14.8345,-56.8107,32],["13919","EE ALFREDO DE ARAÚJO GRANJA",4,"ARENÁPOLIS","ESCOLA","U","AVENIDA DAURY RIVA","200S","78.420-000","VILA NOVA","65 996848294","escola.13919@edu.mt.gov.br",-14.4607,-56.8457,465],["13951","EECM SENADOR FILINTO MÜLLER",4,"ARENÁPOLIS","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","RUA GLICERIO MARTINS PINTO","50E","78.420-000","VILA NOVA","65 33431053","escola.13951@edu.mt.gov.br",-14.4582,-56.8434,209],["13943","EECM GOVERNADOR JOÃO PONCE DE ARRUDA",4,"ARENÁPOLIS","ESCOLA CÍVICO-MILITAR","U","Rua Presidente Costa e Silva,","731","78.420-000","VILA NOVA","65 33431853","escola.13943@edu.mt.gov.br",-14.4579,-56.8473,396],["163660","EE ANA MARIA TISSIANI DE OLIVEIRA",4,"DIAMANTINO","ESCOLA CAMPO","R","AGROVILA BOJUI","00","78.400-000","ZONA RURAL - ESCOLA DO CAMPO","65 992244108","escola.163660@edu.mt.gov.br",-14.1998,-56.4211,85],["163643","EE CASTRO ALVES",4,"DIAMANTINO","ESCOLA CAMPO","R","ASSENTAMENTO CAETÉS-SETOR BALALA fone 065.9.9812.2398","7km","78.400-000","PROJETO DE ASSENTAMENTO CAETÉS","65 992018245","escola.163643@edu.mt.gov.br",-14.4263,-56.2523,89],["163651","EECM DÉCIO LUIZ FURIGO",4,"DIAMANTINO","ESCOLA CÍVICO-MILITAR/CAMPO","R","RUA DECIO LUIZ FURIGO","s/n","78.400-000","DECIOLÂNDIA","65 999203128","escola.163651@edu.mt.gov.br",-14.1829,-57.5071,208],["176427","EECM JOÃO BATISTA DE ALMEIDA",4,"DIAMANTINO","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","RUA FORTALEZA","100","78.402-000","JARDIM ALVORADA","65 98463559","escola.176427@edu.mt.gov.br",-14.3792,-56.379,176],["15369","EE MILITAR TIRADENTES DOUTOR MANOEL JOSÉ MURTINHO",4,"DIAMANTINO","ESCOLA MILITAR","U","RUA DAS AZALEIAS","306","78.400-000","NOVO DIAMANTINO","65 996161735","escola.15369@edu.mt.gov.br",-14.3756,-56.3861,448],["15377","EE NILCE MARIA DE MAGALHÃES",4,"DIAMANTINO","ESCOLA","U","Rua dos Estudantes","200","78.400-000","Buriti","65 33361779","escola.15377@edu.mt.gov.br",-14.4178,-56.4408,163],["15385","EE PLÁCIDO DE CASTRO",4,"DIAMANTINO","ESCOLA INTEGRAL","U","AVENIDA MUNICIPAL","1389","78.400-000","São Benedito","65 33361717","escola.15385@edu.mt.gov.br",-14.405,-56.4457,112],["15350","EECM SERRA AZUL",4,"DIAMANTINO","ESCOLA CÍVICO-MILITAR","U","RUA DAS PITOMBEIRAS","407","78.402-000","NOVO DIAMANTINO","65 999847635","escola.15350@edu.mt.gov.br",-14.3739,-56.3952,317],["15334","EECM IRMÃ LUCINDA FACCHINI",4,"DIAMANTINO","ESCOLA CÍVICO-MILITAR","U","AVENIDA MUNICIPAL","573","78.400-000","DA PONTE","65 993501416","escola.15334@edu.mt.gov.br",-14.408,-56.4515,363],["12882","EECM DOUTOR FÁBIO SILVÉRIO DE FARIAS",4,"NOBRES","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","PRAÇA ROOSEVELT RACHID JAUDY","175","78.470-000","CENTRO","65 999657771","escola.12882@edu.mt.gov.br",-14.7204,-56.3274,154],["84344","EE MARECHAL CÂNDIDO RONDON",4,"NOBRES","ESCOLA CAMPO","R","VILA RODA D'ÁGUA","0","78.479-000","DISTRITO COQUEIRAL","65 99272284","escola.84344@edu.mt.gov.br",-14.5518,-55.9724,341],["12890","EE PROFESSOR NILO PÓVOAS",4,"NOBRES","ESCOLA","U","AVENIDA MARECHAL RONDON","325","78.470-000","CENTRO","65 33761958","escola.12890@edu.mt.gov.br",-14.7225,-56.335,569],["12866","EECM INOCÊNCIA RACHID JAUDY",4,"NOBRES","ESCOLA CÍVICO-MILITAR","U","RUA PROFESSORA NIVA MATOS DE OLIVEIRA","877","78.470-000","SÃO JOSÉ","65 992612838","escola.12866@edu.mt.gov.br",-14.7252,-56.3304,575],["14044","EE DESEMBARGADOR OLEGÁRIO MOREIRA DE BARROS",4,"NORTELÂNDIA","ESCOLA INTEGRAL","U","Avenida Rodolfo Rodrigues da Silva","155","78.430-000","Ponte","65 992729136","escola.14044@edu.mt.gov.br",-14.4504,-56.8127,202],["14036","EE IDALINA DE FARIAS",4,"NORTELÂNDIA","ESCOLA","U","AV. PREFEITO JOÃO MACAUBA","1270","78.430-000","CENTRO","65 33461514","escola.14036@edu.mt.gov.br",-14.4539,-56.8026,310],["192058","EECM PROFESSORA MURALHA DE MIRANDA PASSOS",4,"NOVA MARILÂNDIA","ESCOLA CÍVICO-MILITAR","U","Rua das Bromélias","s/n","78.415-000","loteamento Planalto","65 33521365","escola.192058@edu.mt.gov.br",-14.3671,-56.9836,339],["71838","EECM OSMAIR PINHEIRO DA SILVA",4,"NOVA MARINGÁ","ESCOLA CÍVICO-MILITAR","U","Av Amos Bernardino Zanchet","828 E","78.440-000","CENTRO","66 981091173","escola.71838@edu.mt.gov.br",-13.0282,-57.0916,503],["194905","EE MILITAR TIRADENTES CORONEL PM CELSO HENRIQUE SOUZA BARBOSA",4,"NOVA MUTUM","ESCOLA MILITAR","U","RUA DOS CEDROS","884 N","78450-086","CENTRO","65 993289989","escola.194905@edu.mt.gov.br",-13.8124,-56.0783,951],["114553","EE PADRE JHOANNES BERTHOLD HENNING",4,"NOVA MUTUM","ESCOLA CAMPO","R","ÁREA RURAL","34","78457899","ÁREA RURAL DE NOVA MUTUM","65 992505549","escola.114553@edu.mt.gov.br",-13.8225,-55.7011,464],["163554","EECM RUI BARBOSA",4,"NOVA MUTUM","ESCOLA CÍVICO-MILITAR","U","RUA DAS PRIMAVERAS","718W","78.450-084","CENTRO","65 996853353","escola.163554@edu.mt.gov.br",-13.8257,-56.0847,1218],["97012","EECM JOSÉ APARECIDO RIBEIRO",4,"NOVA MUTUM","ESCOLA CÍVICO-MILITAR","U","AVENIDA MUTUM","1401w","78452040","BELA VISTA","65 33083704","escola.97012@edu.mt.gov.br",-13.8172,-56.0894,1338],["145696","EECM VIRGÍLIO CORRÊA FILHO",4,"NOVA MUTUM","ESCOLA CÍVICO-MILITAR","U","RUA DOS ANGICOS","1127","78454522","RESIDENCIAL PARAÍSO","65 998463808","escola.145696@edu.mt.gov.br",-13.8352,-56.0944,1494],["184390","EE BENEDITA DE ALMEIDA",4,"ROSÁRIO OESTE","ESCOLA CAMPO","R","Comunidade Novo Horizonte","s/n","78.480-000","Distrito de Arruda","65 999652458","escola.184390@edu.mt.gov.br",-14.8818,-56.1796,192],["12785","EE CORONEL ARTUR BORGES",4,"ROSÁRIO OESTE","ESCOLA","U","AVENIDA CORONEL ARTUR BORGES","566","78.480-000","CENTRO","65 992022794","rodrigo.vespucci@edu.mt.gov.br",-14.8287,-56.4277,465],["176648","EE ESTEVÃO PEREIRA DE ALMEIDA",4,"ROSÁRIO OESTE","ESCOLA CAMPO","R","ASSENTAMENTO FORQUILHA DO RIO MANSO","SN","78480-971","DISTRITO DO MARZAGÃO","65 99340673","escola.176648@edu.mt.gov.br",-14.7679,-56.1189,123],["12831","EE MARECHAL RONDON",4,"ROSÁRIO OESTE","ESCOLA CAMPO","R","Av Principal","s/nº","7848350051","DISTRITO DO BAUXI","65 993347084","escola.12831@edu.mt.gov.br",-15.14783,-56.726014,149],["173541","EE PROFESSORA ELIZABET EVANGELISTA PEREIRA",4,"ROSÁRIO OESTE","ESCOLA INTEGRAL","U","RUA C","43","78.480-000","COHAB VELHA","65 999632218","escola.173541@edu.mt.gov.br",-14.8265,-56.4285,146],["12815","EECM PROFESSOR JOÃO CALIXTO BERNARDES",4,"ROSÁRIO OESTE","ESCOLA CÍVICO-MILITAR","U","Rua: C Quadra: 10 Cohab Nossa Senhora do Rosário","s/n","78.480-000","Santo Antonio","65 992768123","escola.12815@edu.mt.gov.br",-14.8406,-56.4383,274],["124079","EECM CÂNDIDO PORTINARI",4,"SANTA RITA DO TRIVELATO","ESCOLA CÍVICO-MILITAR","U","AV 28 DE DEZEMBRO","snº.","78.445-000","CENTRO","65 981274598","escola.124079@edu.mt.gov.br",-13.8183,-55.2756,157],["13935","EECMACADÊMICO LAURO AUGUSTO DE BARROS",4,"SANTO AFONSO","ESCOLA CÍVICO-MILITAR","U","AVENIDA SEBASTIÃO JACINTO","350","78.425-000","CENTRO","65 999036323","escola.13935@edu.mt.gov.br",-14.4957,-57.0043,181],["13927","EE GERALDO SANTANA DOS SANTOS",4,"SANTO AFONSO","ESCOLA CAMPO","R","RUA DAS PERDIZES","0","78.425-000","GLEBA UNIÃO - VILA BOA ESPERANÇA","65 31051017","escola.13927@edu.mt.gov.br",-14.4551,-57.1563,84],["15407","EECM DOMINGOS BRIANTE",4,"SÃO JOSÉ DO RIO CLARO","ESCOLA CÍVICO-MILITAR","U","Rua Santa Catarina","1574","78.435-000","PLANALTO","65 999215269","escola.15407@edu.mt.gov.br",-13.4561,-56.7251,601],["173363","EE SANTANA D'ÁGUA LIMPA",4,"SÃO JOSÉ DO RIO CLARO","ESCOLA CAMPO","R","Assentamento Santana Dagua Limpa","s/nº","78.435-000","Lote 214 - Rural","65 993270283","escola.173363@edu.mt.gov.br",-13.3678,-56.6837,90],["15393","EE SÃO JOSÉ DO RIO CLARO",4,"SÃO JOSÉ DO RIO CLARO","ESCOLA INTEGRAL","U","AVENIDA URUGUAI","441","78.435-000","CENTRO","65 992823991","escola.15393@edu.mt.gov.br",-13.4464,-56.7203,210],["15423","EECM DOUTOR ANÍSIO JOSÉ MOREIRA",4,"SÃO JOSÉ DO RIO CLARO","ESCOLA CÍVICO-MILITAR","U","RUA ACRE","544","78.435-000","CENTRO","66 992118293","escola.15423@edu.mt.gov.br",-13.4486,-56.7237,532],["142166","EE DOM FRANCO DALLA VALLE",5,"ARIPUANÃ","ESCOLA CAMPO","R","RUA MAÇARANDUBA","1","78.325-000","CONSELVAN","66 36031266","escola.142166@edu.mt.gov.br",-9.9274,-59.9226,525],["104230","EECM PROFESSOR ELÍDIO MURCELLI FILHO",5,"ARIPUANÃ","ESCOLA CÍVICO-MILITAR/INTEGRAL/MISTA/ESPORTE","U","AVENIDA DERCIO TORREMOCHA AGUILAR","2246","78.325-000","PARQUE INDUSTRIAL HELEODORO MAZON","66 35651553","escola.104230@edu.mt.gov.br",-10.1769,-59.4353,403],["14729","EECM SÃO FRANCISCO DE ASSIS",5,"ARIPUANÃ","ESCOLA CÍVICO-MILITAR","U","RUA COMENDADOR MANOEL PEDRO DE OLIVEIRA","121","78.325-000","CENTRO","66 35651503","escola.14729@edu.mt.gov.br",-10.1732,-59.4542,1177],["78280","EEI ADECA VELA ARARA",5,"ARIPUANÃ","ESCOLA INDÍGENA","R","Terra Indigena Arara do Rio Branco Aldeia Volta Grande","1000","78.325-000","Terra Indigena Arara do Rio Branco","66 992189222","escola.78280@edu.mt.gov.br",-9.905,-59.6026,36],["82252","EEI PASAPKAREEJ",5,"ARIPUANÃ","ESCOLA INDÍGENA","R","Aldeia Taquaral","01","78.325-000","Terra Indigena Aripuanã","66 35651482","escola.82252@edu.mt.gov.br",-10.4163,-59.7105,134],["14761","EE EWALDO MEYER RODERJAN",5,"BRASNORTE","ESCOLA INTEGRAL/MISTA","U","Rua Cáceres","1250","78.350-000","CENTRO","66 35921574","escola.14761@edu.mt.gov.br",-12.1221,-58.0011,801],["196495","EECM PROFESSORA NORMA LÚCIA NUNES",5,"BRASNORTE","ESCOLA CÍVICO-MILITAR","U","RUA GUAÍRA","185","78.350-000","CENTRO","66 35921989","escola.196495@edu.mt.gov.br",-12.1176,-58.0094,559],["129232","EEI MYHYINYMYKYTA SKIRIPI",5,"BRASNORTE","ESCOLA INDÍGENA","R","Aldeia Barranco Vermelho","11","78.350-000","Zona Rural","66 44007208","escola.129232@edu.mt.gov.br",-11.4304,-58.3195,403],["154938","EEI TAPURÁ IRANTXE",5,"BRASNORTE","ESCOLA INDÍGENA","R","ALDEIA PAREDÃO","10","78.350-000","ALDEIA","66 44007209","escola.154938@edu.mt.gov.br",-12.9229,-58.0326,47],["91421","EEI XINUI MYKY",5,"BRASNORTE","ESCOLA INDÍGENA","R","Aldeia Japuira","10","78.350-000","Zona Rural","66 35922451","escola.91421@edu.mt.gov.br",-12.1778,-58.4002,40],["14796","EECM MARIA QUITÉRIA",5,"CASTANHEIRA","ESCOLA CÍVICO-MILITAR","U","Avenida 04 de Julho","552","78.345-000","CENTRO","66 999816422","escola.14796@edu.mt.gov.br",-11.1399,-58.6115,396],["137774","EE MÁRIO DE ANDRADE",5,"CASTANHEIRA","ESCOLA CAMPO","R","vale do seringal, loteamento 3º, comunidade nova conquista","3","78.345-000","rural","66 44007248","escola.137774@edu.mt.gov.br",-10.8423,-58.4741,66],["137766","EE PAULO FREIRE",5,"CASTANHEIRA","ESCOLA CAMPO","R","VALE DO SERINGAL COMUNIDADE SÃO LOURENÇO SETOR IV","IV","78.345-000","rural","66 99667432","escola.137766@edu.mt.gov.br",-10.7403,-58.4842,137],["69469","EE BERNARDINO GOMES DA LUZ",5,"COLNIZA","ESCOLA","U","AVenida DOS PINHAIS","446","78.335-000","CENTRO","66 35711138","escola.69469@edu.mt.gov.br",-9.4581,-59.2223,435],["145734","EE MARIA MIRANDA ARAÚJO",5,"COLNIZA","ESCOLA CAMPO","R","AV. SANTOS DUMONT","s/nº","78.336-000","Zona Rural","66 35991113","escola.145734@edu.mt.gov.br",-9.2498,-60.3289,450],["97004","EE MILITAR TIRADENTES 3º SARGENTO PM EDUARDO LUIZ DE SOUZA",5,"COLNIZA","ESCOLA MILITAR","U","RUA: A-7","50","78.335-000","BELA VISTA","66 981139853","escola.97004@edu.mt.gov.br",-9.458,-59.209,545],["183636","EE PEDRO BORGES",5,"COLNIZA","ESCOLA CAMPO","R","BR 174 KM 29","s/n","78.335-000","Projeto de Assentamento Scol Sul","66 98470247","escola.183636@edu.mt.gov.br",-9.6903,-59.169,682],["154695","EE TARSILA DO AMARAL",5,"COLNIZA","ESCOLA","U","Avenida Mato Grosso","446","78.335-000","CENTRO","66 98127547","escola.154695@edu.mt.gov.br",-9.4572,-59.2226,347],["119237","EE ANDRÉ ANTÔNIO MAGGI",5,"COTRIGUAÇU","ESCOLA CAMPO","R","AV 07 DE SETEMBRO","0","78.330-000","NOVA UNIÃO","66 35271149","escola.119237@edu.mt.gov.br",-9.3677,-58.946,368],["44261","EECM MARIA DA GLÓRIA VARGAS OCHOA",5,"COTRIGUAÇU","ESCOLA CÍVICO-MILITAR","U","RUA GUMERCINDO BERNARDI","28","78.330-000","CENTRO","66 992369985","escola.44261@edu.mt.gov.br",-9.9064,-58.5644,431],["157244","EE SIDNEY CÉSAR FÜHR",5,"COTRIGUAÇU","ESCOLA CAMPO","R","ASSENTAMENTO PA JURUENA CDR9 COMUNIDADE SANTA LUZIA","243","78.330-000","LINHA GAUCHA","66 999844784","escola.157244@edu.mt.gov.br",-10.0023,-58.3698,201],["21636","EE CECÍLIA DE CASTRO BARBOSA",5,"JUARA","ESCOLA CAMPO","R","COMUNIDADE DO JAÚ - ESTRADA RIO DOS PEIXES KM 30","00","78.575-000","Zona Rural","66 99974641","escola.21636@edu.mt.gov.br",-11.1948,-57.3115,198],["158658","EE DAURY RIVA",5,"JUARA","ESCOLA INTEGRAL","U","Avenida Paraná","750 E","78.575-000","RESIDENCIAL SANTA TEREZINHA","66 35563976","escola.158658@edu.mt.gov.br",-11.2538,-57.4962,155],["15792","EE DOM AQUINO CORRÊA",5,"JUARA","ESCOLA CAMPO","R","rua oliveira, zona rural","s/n","78.575-000","comunidade águas claras","66 99686069","escola.15792@edu.mt.gov.br",-11.0711,-57.5698,229],["194930","EE MILITAR TIRADENTES CABO PM ISRAEL WESLEY PRADO DE ALMEIDA",5,"JUARA","ESCOLA MILITAR","U","Rua Bauru","1067 S","78.575-000","JARDIM PRIMAVERA","66 35565615","escola.194930@edu.mt.gov.br",-11.2622,-57.5019,514],["118559","EECM NIVALDO FRACAROLLI",5,"JUARA","ESCOLA CÍVICO-MILITAR","U","RUA SOROCABA","927S","78.575-000","JARDIM PRIMAVERA","66 35564203","escola.118559@edu.mt.gov.br",-11.2594,-57.5021,433],["15687","EE OSCAR SOARES",5,"JUARA","ESCOLA","U","AVENIDA RIO ARINOS","3950","78.575-000","GLEBA TAQUARAL","66 996520715","escola.15687@edu.mt.gov.br",-11.2523,-57.5076,485],["15741","EECM COMENDADOR JOSÉ PEDRO DIAS",5,"JUARA","ESCOLA CÍVICO-MILITAR","U","RUA ANITA GARIBALDI","179 W","78.575-000","BOA VISTA","66 996963527","escola.15741@edu.mt.gov.br",-11.2603,-57.5172,450],["212440","EEDIEB JOSÉ DIAS",5,"JUARA","ESCOLA CÍVICO-MILITAR","U","RUA PORTO VELHO","256 E","78.575-000","CENTRO","66 999253630","escola.212440@edu.mt.gov.br",-11.2481,-57.5068,539],["131849","EEI JUPORIJUP",5,"JUARA","ESCOLA INDÍGENA","R","AVENIDA RIO ARINOS/ALDEIA TATUÍ","500 W","78.575-000","ALDEIA TATUÍ-ZONA RURAL","66 35561616","escola.131849@edu.mt.gov.br",-10.9204,-57.536,103],["145750","EEI KRIXI BAROMPO",5,"JUARA","ESCOLA INDÍGENA","R","Aldeia Munduruku","0","78.575-000","ALDEIA NOVA MUNDURUKU","66 35561616","escola.145750@edu.mt.gov.br",-10.8832,-57.5543,41],["131830","EEI LEONARDO CRIXI APIAKÁ",5,"JUARA","ESCOLA INDÍGENA","R","ESTRADA JUARA ÁGUAS CLARAS ALDEIA MAYROB KM 65","0","78.575-000","ALDEIA MAYROB-ZONA RURAL","66 35561616","escola.131830@edu.mt.gov.br",-10.9005,-57.4746,88],["173525","EEI PÉ DE MUTUM",5,"JUARA","ESCOLA INDÍGENA","R","Aldeia Pé de Mutum","SN","78.575-000","Aldeia Pé de Mutum","66 35661106","escola.173525@edu.mt.gov.br",-10.8899,-58.3402,138],["14613","EECM 07 DE SETEMBRO",5,"JUÍNA","ESCOLA CÍVICO-MILITAR","U","AVENIDA ARAPONGAS","517N","78.320-000","MODULO 04","66 99982820","escola.14613@edu.mt.gov.br",-11.4113,-58.7578,591],["14648","EECM 21 DE ABRIL",5,"JUÍNA","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","Rua Pariri","50s","78.320-000","Padre Duilio Liburde","66 35662161","escola.14648@edu.mt.gov.br",-11.4451,-58.7662,315],["14567","EE ANA NÉRI",5,"JUÍNA","ESCOLA","U","AV. PRESIDENTE TANCREDO DE ALMEIDA NEVES","266N","78.320-000","SÃO JOSÉ OPERÁRIO","66 35663756","escola.14567@edu.mt.gov.br",-11.4147,-58.7458,218],["173347","EECM ANTÔNIA MOURA MUNIZ",5,"JUÍNA","ESCOLA CÍVICO-MILITAR","U","RUA PRESIDENTE PRUDENTE","SN","78.320-000","MODULO 6","66 35663116","escola.173347@edu.mt.gov.br",-11.419,-58.7855,563],["14591","EE ANTÔNIO FRANCISCO LISBOA",5,"JUÍNA","ESCOLA CAMPO","R","LINHA 05 KM 05","1","78.320-000","BAIRRO BOA SORTE - COMUNIDADE SAO LUCAS","66 992604920","escola.14591@edu.mt.gov.br",-11.3841,-58.7807,371],["14630","EE MILITAR TIRADENTES PADRE EZEQUIEL RAMIN",5,"JUÍNA","ESCOLA MILITAR","U","Rua Pe. Ezequiel Ramin","125W","78.320-000","Modulo 05","66 35662700","escola.14630@edu.mt.gov.br",-11.4189,-58.7758,551],["14575","EECM DOUTOR ARTUR ANTUNES MACIEL",5,"JUÍNA","ESCOLA CÍVICO-MILITAR","U","RUA PAULO CARNEIRO DA SILVA","45N","78.320-000","MÓDULO 02","66 35662022","escola.14575@edu.mt.gov.br",-11.4216,-58.7606,482],["192031","EEI ENAWENÊ NAWÊ",5,"JUÍNA","ESCOLA INDÍGENA","R","BR 174 - terra indigena enawenê nawê","s/n","78.320-000","Aldeia Halaitaikwa","66 35661106","escola.192031@edu.mt.gov.br",-11.2779,-58.3182,529],["166308","EEI ETEREPUIY",5,"JUÍNA","ESCOLA INDÍGENA","R","Aldeia Rio Capivara","SN","78.320-000","Zona Rural","66 35661106","escola.166308@edu.mt.gov.br",-11.2425,-59.2447,121],["192040","EE ALINE MARIA TEIXEIRA",5,"JURUENA","ESCOLA INTEGRAL","U","Rua Ezequiel Ramin","s/n","78.340-000","VILA NOVA","66 35532041","escola.192040@edu.mt.gov.br",-10.3305,-58.5073,202],["21083","EECM DOM AQUINO CORRÊA",5,"JURUENA","ESCOLA CÍVICO-MILITAR","U","RUA 07 DE MAIO","42","78.340-000","CENTRO","66 35531404","escola.21083@edu.mt.gov.br",-10.3309,-58.4964,753],["15849","EECM ROSMAY KARA JOSÉ",5,"NOVO HORIZONTE DO NORTE","ESCOLA CÍVICO-MILITAR","U","RUA IGUAÇU","562","78.570-000","CENTRO","66 981365599","escola.15849@edu.mt.gov.br",-11.3887,-57.3179,301],["15806","EECM JOSÉ ALVES BEZERRA",5,"PORTO DOS GAÚCHOS","ESCOLA CÍVICO-MILITAR","U","AV. GUILHERME MEYER","1450","78.560-000","CENTRO","66 35261193","escola.15806@edu.mt.gov.br",-11.5362,-57.4062,361],["154970","EE JOSÉ CLETO GIEHL",5,"PORTO DOS GAÚCHOS","ESCOLA CAMPO","R","RUA UMUARAMA","1","78.560-000","COMUNIDADE NOVO PARANA - ZONA RURAL","66 999261947","escola.154970@edu.mt.gov.br",-11.618,-57.235,90],["15814","EE RENATO SPINELLI",5,"PORTO DOS GAÚCHOS","ESCOLA CAMPO","R","RUA SAO PAULO","0","78.560-000","GLEBA SAO JOAO","66 35671064","escola.15814@edu.mt.gov.br",-11.4337,-57.0312,64],["16349","EECM GUARANTÃ",6,"GUARANTÃ DO NORTE","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","RUA INHARÉ","937","78.520-000","CENTRO","66 9612-7856","escola.16349@edu.mt.gov.br",-9.9502,-54.9104,317],["16357","EE IRANY JAIME FARINA",6,"GUARANTÃ DO NORTE","ESCOLA CAMPO","R","Avenida dos Canários","344","78.520-000","Cotrel","66 99691842","escola.16357@edu.mt.gov.br",-9.9482,-54.9543,761],["16365","EECM KREEN AKARORE",6,"GUARANTÃ DO NORTE","ESCOLA CÍVICO-MILITAR","U","RUA DAS CASTANHEIRAS","1657","78.520-000","CIDADE NOVA","66 35521923","escola.16365@edu.mt.gov.br",-9.9499,-54.919,1179],["114561","EE PROFESSOR ÉLCIO PRATES",6,"GUARANTÃ DO NORTE","ESCOLA INTEGRAL/ESPORTE","U","AVENIDA SENADOR JONAS PINHEIRO","420","78.520-000","JARDIM AEROPORTO","66 35523489","escola.114561@edu.mt.gov.br",-9.9616,-54.9149,151],["60208","EECM ALBERT EINSTEIN",6,"GUARANTÃ DO NORTE","ESCOLA CÍVICO-MILITAR","U","RUA INHARÉ","835","78.520-000","CENTRO","66 984261244","escola.60208@edu.mt.gov.br",-9.9488,-54.9103,459],["49646","EECM PAULO FREIRE",6,"MARCELÂNDIA","ESCOLA CÍVICO-MILITAR","U","Rua Tres Poderes","970","78.535-000","CENTRO","66 999428388","escola.49646@edu.mt.gov.br",-11.0864,-54.5212,561],["13552","EECMPEDRO BIANCHINI",6,"MARCELÂNDIA","ESCOLA CÍVICO-MILITAR","U","RUA JOÃO BIONDARO","532","78535000","CENTRO","66 35361324","escola.13552@edu.mt.gov.br",-11.0832,-54.5217,490],["123013","EEI CENTRAL KAMADU",6,"MARCELÂNDIA","ESCOLA INDÍGENA","R","ALDEIA TUBA TUBA","1","78.535-000","PARQUE INDIGENA DO XINGU","66 35362698","escola.123013@edu.mt.gov.br",-11.0289,-53.2869,152],["140813","EEI PANAKU",6,"MARCELÂNDIA","ESCOLA INDÍGENA","R","ALDEIA AIPORÉ","1","78.535-000","PARQUE INDIGENA DO XINGU","66 996369083","escola.140813@edu.mt.gov.br",-11.0462,-53.4219,140],["16381","EE ANTÔNIO OMETTO",6,"MATUPÁ","ESCOLA INTEGRAL/ESPORTE","U","AV. HERMINIO OMETTO","11","78.525-000","ZH1-001","66 996563293","escola.16381@edu.mt.gov.br",-10.1794,-54.9303,320],["16403","EE BAIRRO UNIÃO",6,"MATUPÁ","ESCOLA","U","Rua 10","46","78.525-000","União","66 999321666","escola.16403@edu.mt.gov.br",-10.1672,-54.9281,853],["154180","EE SENADOR JONAS PINHEIRO",6,"MATUPÁ","ESCOLA CAMPO","R","LINHA 03 - Comunidade Santo Antonio","s/n","78.525-000","Gleba União","66 35951365","escola.154180@edu.mt.gov.br",-10.170865,-54.25903,292],["38563","EECM JARDIM DAS FLORES",6,"MATUPÁ","ESCOLA CÍVICO-MILITAR","U","RUA 14","36","78.525-000","JARDIM DAS FLORES","66 992525884","escola.38563@edu.mt.gov.br",-10.1733,-54.9222,542],["153958","EEI TERENA DE KOMOMOYEA KOVÔERO",6,"MATUPÁ","ESCOLA INDÍGENA","R","Aldeia Indígena Kuxonety Pokeê - Iriri Novo","0","78.525-000","GLEBA IRIRI NOVO","66 35951365","escola.153958@edu.mt.gov.br",-9.7448,-53.7705,132],["44270","EECM 13 DE MAIO",6,"NOVA GUARITA","ESCOLA CÍVICO-MILITAR","U","AVENIDA DOS MIGRANTES","1224","78.508-000","CENTRO","66 99716941","escola.44270@edu.mt.gov.br",-10.3053,-55.3994,358],["69582","EECM ANDRÉ ANTÔNIO MAGGI",6,"NOVO MUNDO","ESCOLA CÍVICO-MILITAR","U","Rua Santa Catarina","101","78.528-000","CENTRO","66 35396076","escola.69582@edu.mt.gov.br",-9.9774,-55.1714,418],["16411","EECM 19 DE JULHO",6,"PEIXOTO DE AZEVEDO","ESCOLA CÍVICO-MILITAR","U","RUA CRISTAL","314","78.530-000","CENTRO","66 997122800","escola.16411@edu.mt.gov.br",-10.2405,-54.9921,1017],["124052","EE LEONÍSIO LEMOS MELO",6,"PEIXOTO DE AZEVEDO","ESCOLA CAMPO","R","Rua Joaquim de Barros","0","78.530-000","Alto Alegre","66 35041141","escola.124052@edu.mt.gov.br",-10.4359,-54.4516,625],["16454","EE LUCIENE CARDOSO DE OLIVEIRA",6,"PEIXOTO DE AZEVEDO","ESCOLA","U","RUA COLÍDER","368","78.530-000","AEROPORTO","66 999035369","escola.16454@edu.mt.gov.br",-10.2502,-54.9888,324],["40320","EE MILITAR TIRADENTES 2º SARGENTO PM LUCIANO JOSÉ QUEIROZ",6,"PEIXOTO DE AZEVEDO","ESCOLA MILITAR","U","RUA MATO GROSSO","365","78.530-000","AEROPORTO","65 992414067","escola.40320@edu.mt.gov.br",-10.2403,-55.0017,576],["16438","EECM KREEN AKARORE",6,"PEIXOTO DE AZEVEDO","ESCOLA CÍVICO-MILITAR","U","RUA WASHINGTON LUIZ","1","78.530-000","CENTRO","66 35752632","escola.16438@edu.mt.gov.br",-10.2379,-54.9963,609],["83607","EEI ELIO TURI RONDON TERENA",6,"PEIXOTO DE AZEVEDO","ESCOLA INDÍGENA","R","MT322","s/n","78.530-000","ALDEIA KOPENOTY","66 35041126","escola.83607@edu.mt.gov.br",-10.4493,-54.4171,62],["158380","EEI GORONÃ",6,"PEIXOTO DE AZEVEDO","ESCOLA INDÍGENA","R","ALDEIA KAMERETXIKO CAPOTO JARINA","001","78.530-000","ALDEIA","66 99991539","escola.158380@edu.mt.gov.br",-10.5289,-53.4199,66],["124001","EEI METUKTIRE",6,"PEIXOTO DE AZEVEDO","ESCOLA INDÍGENA","R","ALDEIA METUKTIRE","123","78.530-000","Zona Rural","66 98102875","escola.124001@edu.mt.gov.br",-10.33779,-53.035607,111],["13498","EECM 12 DE ABRIL",6,"TERRA NOVA DO NORTE","ESCOLA CÍVICO-MILITAR","U","Av Clóves Felício Vettorato","186","78.505-000","CENTRO","66 35341217","escola.13498@edu.mt.gov.br",-10.5984,-55.1146,633],["13528","EE LUCAS AUXÍLIO TONIAZZO",6,"TERRA NOVA DO NORTE","ESCOLA CAMPO","R","BR 163, KM 667, AVENIDA PRINCIPAL, CENTRO","s/n","78.505-000","ZONA RURAL, AGROVILA XANXERÊ","66 996453232","escola.13528@edu.mt.gov.br",-10.5165,-55.2306,312],["160040","EE TERRA NOVA",6,"TERRA NOVA DO NORTE","ESCOLA CAMPO/INTEGRAL/AGRÍCOLA","R","RUA PRINCIPAL","001","78.505-000","DÉCIMA AGROVILA","66 996558689","escola.160040@edu.mt.gov.br",-10.4244,-54.842,251],["10774","EE DOM ANTÔNIO CAMPELO",7,"ACORIZAL","ESCOLA INTEGRAL","U","RUA DOZE DE DEZEMBRO","s/n","78.485-000","CANDONGA","65 33531216","escola.10774@edu.mt.gov.br",-15.2023,-56.3633,86],["10804","EE PIO MACHADO",7,"ACORIZAL","ESCOLA","U","LOCALIDADE","704","78485000","CENTRO","65 33531217","escola.10804@edu.mt.gov.br",-15.1999,-56.3667,365],["10766","EE PONCE DE ARRUDA",7,"ACORIZAL","ESCOLA CAMPO","R","Av. Eduardo José da Cruz","0","78.485-000","ALDEIA","65 999662931","escola.10766@edu.mt.gov.br",-15.1529,-56.4158,135],["10758","EE PROFESSORA CEZINA ANTÔNIA BOTELHO",7,"ACORIZAL","ESCOLA CAMPO/INTEGRAL/MISTA","R","Praça Sebastião de arruda botelho","0","78.485-000","Centro - Distrito de Baús","65 999330682","escola.10758@edu.mt.gov.br",-15.2358,-56.2949,154],["12629","EECM CORONEL ANTÔNIO PAES DE BARROS",7,"BARÃO DE MELGAÇO","ESCOLA CÍVICO-MILITAR/INTEGRAL/MISTA","U","AVENIDA MARECHAL RONDON","0","78.190-000","CENTRO","65 33311277","escola.12629@edu.mt.gov.br",-16.2001,-55.9688,484],["12610","EE PROFESSORA MARIA SILVINA PEIXOTO DE MOURA",7,"BARÃO DE MELGAÇO","ESCOLA CAMPO","R","Povoado São Pedro","0","78.190-000","Distrito de Joselândia","65 36344443","escola.12610@edu.mt.gov.br",-16.5723,-56.2075,128],["78298","EEI KOGE EIARI",7,"BARÃO DE MELGAÇO","ESCOLA INDÍGENA","R","ALDEIA INDIGENA PERIGARA","s n","78.190-000","Zona Rural","65 33311107","escola.78298@edu.mt.gov.br",-16.9203,-56.2294,21],["10243","EE CORONEL RAFAEL DE SIQUEIRA",7,"CHAPADA DOS GUIMARÃES","ESCOLA INTEGRAL","U","Rua Santo Antonio","350","78.195-000","CENTRO","65 33011572","escola.10243@edu.mt.gov.br",-15.4611,-55.75,537],["10278","EE REUNIDAS DE CACHOEIRA RICA",7,"CHAPADA DOS GUIMARÃES","ESCOLA QUILOMBOLA","R","Av. Principal","s/n","78.195-000","Cachoeira Rica","65 99960665","escola.10278@edu.mt.gov.br",-15.2674,-55.6023,106],["10260","EE SÃO JOSÉ",7,"CHAPADA DOS GUIMARÃES","ESCOLA CAMPO","R","AV: PRINCIPAL","s/nº","78.197-000","CENTRO","65 33041081","escola.10260@edu.mt.gov.br",-15.18,-55.7534,477],["44954","EECM PROFESSORA ANA TEREZA ALBERNAZ",7,"CHAPADA DOS GUIMARÃES","ESCOLA CÍVICO-MILITAR","U","RUA DAS PALMEIRAS","480","78.195-000","SAO SEBASTIÃO","65 33011725","escola.44954@edu.mt.gov.br",-15.467,-55.7356,761],["60224","CEAADA PROFESSORA ARLETE PEREIRA MIGUELETTI",7,"CUIABÁ","ESCOLA ESPECIALIZADA/INTEGRAL","U","Rua General Vale","189","78.010-200","BANDEIRANTES","65 30543343","escola.60224@edu.mt.gov.br",-15.6025,-56.0935,52],["10430","EE ALINA DO NASCIMENTO TOCANTINS",7,"CUIABÁ","ESCOLA","U","AVENIDA IPIRANGA","2560","78.030-500","CIDADE ALTA","65 36375186","escola.10430@edu.mt.gov.br",-15.6111,-56.1207,489],["10502","EE AUREOLINA EUSTÁCIA RIBEIRO",7,"CUIABÁ","ESCOLA INTEGRAL/MISTA","U","AV GENEROSO MALHEIROS (PRAÇA CENTRAL)","305","78.028-685","CIDADE VERDE","65 36236089","escola.10502@edu.mt.gov.br",-15.6109,-56.1319,148],["21091","EECM CLÊINIA ROSALINA DE SOUZA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR/INTEGRAL/ESPORTE","U","Rua A Quadra 15 Esquina 06","247","78.058-000","Residencial Itamaraty","65 36531432","escola.21091@edu.mt.gov.br",-15.5858,-56.0386,316],["10731","EE DE ENSINO ESPECIAL LIVRE APRENDER",7,"CUIABÁ","ESCOLA ESPECIALIZADA","U","RUA A","1597","78.010-670","AREÃO","65 98463989","escola.10731@edu.mt.gov.br",-15.5972,-56.0791,117],["9920","EECM DJALMA FERREIRA DE SOUZA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR/INTEGRAL/ARTE","U","AV Djalma Ferreira de Souza, S/N","s/nº","78.053-000","Morada do Ouro","65 993478513","escola.9920@edu.mt.gov.br",-15.5714,-56.0643,281],["9717","EECM DOUTOR ESTEVÃO ALVES CORRÊA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA 230 QUADRA 66 SETOR II","51","78.088-260","TIJUCAL","65 36657505","escola.9717@edu.mt.gov.br",-15.6305,-56.0143,1068],["9857","EECM FRANCISCO ALEXANDRE FERREIRA MENDES",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","RUA DOUTOR ÁUREO LINO DA SILVA","363","78.068-545","BOA ESPERANÇA","65 992297207","escola.9857@edu.mt.gov.br",-15.6146,-56.0631,243],["194565","EECM GOVERNADOR JOSÉ FRAGELLI",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR/INTEGRAL/ESPORTE","U","AVENIDA AGRÍCOLA PAES DE BARROS","0","78.030-210","VERDÃO","65 992316157","escola.194565@edu.mt.gov.br",-15.605,-56.1218,428],["9679","EECM HERMELINDA DE FIGUEIREDO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Rua Londrina","37","78.085-225","Coophema","65 33587965","escola.9679@edu.mt.gov.br",-15.6346,-56.0587,481],["10359","EECM JOSÉ DE MESQUITA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR/INTEGRAL/MISTA","U","RUA BARÃO DE MELGAÇO","945","78.025-300","PORTO","65 36371117","escola.10359@edu.mt.gov.br",-15.6131,-56.1141,342],["10340","EE LICEU CUIABANO MARIA DE ARRUDA MÜLLER",7,"CUIABÁ","ESCOLA","U","Praca General Mallet","150","78.045-250","Quilombo","65 33220242","escola.10340@edu.mt.gov.br",-15.5929,-56.1017,1140],["9733","EECM MANOEL CAVALCANTE PROENÇA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA 107 QUADRA 14 SETOR 01 TIJUCAL FUNDO COM AV.DR.MEIRELLES","320","78.088-028","TIJUCAL","65 36663366","escola.9733@edu.mt.gov.br",-15.6361,-56.0224,653],["10707","EE MARCELINA DE CAMPOS",7,"CUIABÁ","ESCOLA","U","AV. PRINCIPAL QDA 18","472","78.035-750","SANTA AMÁLIA","65 21291106","escola.10707@edu.mt.gov.br",-15.5924,-56.1374,511],["10596","EE MILITAR DOM PEDRO II PRESIDENTE MÉDICI",7,"CUIABÁ","ESCOLA MILITAR","U","Avenida Mato Grosso","564","78.005-030","Araés","65 33215134","escola.10596@edu.mt.gov.br",-15.5894,-56.0961,1662],["10693","EE MILITAR TIRADENTES",7,"CUIABÁ","ESCOLA MILITAR","U","AVENIDA GONÇALO ANTUNES DE BARROS","SN","78050667","CARUMBÉ","65 36417238","escola.10693@edu.mt.gov.br",-15.58134,-56.05029,1207],["9326","EECM PADRE ERNESTO CAMILO BARRETO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA FORTALEZA","35","78.065-350","JARDIM PAULISTA","65 992175334","escola.9326@edu.mt.gov.br",-15.6172,-56.0847,844],["117595","EE PADRE FIRMO PINTO DUARTE FILHO",7,"CUIABÁ","ESCOLA","U","RUA A","121","78.097-014","Distrito Industrial","65 36677523","escola.117595@edu.mt.gov.br",-15.6471,-55.9933,658],["9911","EECM PADRE JOÃO PANAROTTO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR/INTEGRAL/TECNOLOGIA","U","Rua 64 Quadra G CPA IV 2ª Etapa","0","78.058-100","CPA IV 2ª ETAPA","65 998179894","escola.9911@edu.mt.gov.br",-15.5629,-56.0329,309],["9946","EECM PASCOAL MOREIRA CABRAL",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA Avenida Asa Branca","0","78.075-335","RECANTO DOS PÁSSAROS","65 36632681","escola.9946@edu.mt.gov.br",-15.613,-56.0389,1252],["9725","EECM PROFESSOR AGENOR FERREIRA LEÃO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Rua 314 -Quadra 102 - Setor III","94","78.088-390","TIJUCAL","65 36652002","escola.9725@edu.mt.gov.br",-15.625,-56.0085,657],["9610","EE PROFESSOR ANTÔNIO EPAMINONDAS",7,"CUIABÁ","ESCOLA INTEGRAL/LÍNGUAS","U","Rua Padre Remeter,","355","78.008-150","LIXEIRA","65 33222376","escola.9610@edu.mt.gov.br",-15.5928,-56.0848,189],["9652","EECM PROFESSOR BENEDITO DE CARVALHO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA A","296","78.053-438","MORADA DO OURO SETOR NORTE","65 99947790","escola.9652@edu.mt.gov.br",-15.5668,-56.0622,633],["42587","EE PROFESSOR RAFAEL RUEDA",7,"CUIABÁ","ESCOLA INTEGRAL/ESPORTE","U","AVENIDA INTEGRAÇÃO III","761","78099000","Pedra 90","65 992410518","escola.42587@edu.mt.gov.br",-15.6287,-55.9523,279],["9547","EECM PROFESSOR WELSON MESQUITA DE OLIVEIRA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA FRANCISCO DE JESUS","430","78.098-100","PASCOAL RAMOS","65 20180507","escola.9547@edu.mt.gov.br",-15.6407,-55.9814,2123],["9865","EE PROFESSORA ALICE FONTES PINHEIRO",7,"CUIABÁ","ESCOLA","U","RUA E","157","78030385","JARDIM NOSSA SENHORA APARECIDA","65 984630960","escola.9865@edu.mt.gov.br",-15.6396,-56.047,260],["10057","EECM PROFESSORA DIONE AUGUSTA SILVA SOUZA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA TUIUIU","45","78.058-000","CPA IV","65 98474243","escola.10057@edu.mt.gov.br",-15.5593,-56.0422,832],["94439","EECM PROFESSORA DIVA HUGUENEY DE SIQUEIRA BASTOS",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA SENADOR JONAS PINHEIRO","687","78.056-408","JARDIM ARUEIRA","65 99337936","escola.94439@edu.mt.gov.br",-15.5412,-56.0422,675],["9709","EECM PROFESSORA MARIANA LUIZA MOREIRA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA SECUNDARIA III","644","78.088-620","TIJUCAL","65 36655614","escola.9709@edu.mt.gov.br",-15.6324,-56.0081,646],["9938","EE PROFESSORA PACIANA TORRES DE SANT'ANA",7,"CUIABÁ","ESCOLA","U","AVENIDA PRINCIPAL","585","78.090-274","RESIDENCIAL COXIPÓ","65 999371035","escola.9938@edu.mt.gov.br",-15.6464,-56.0332,752],["9849","EECM RAIMUNDO PINHEIRO DA SILVA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AV. FERNANDO CORREA DA COSTA","3610","78.070-200","SHANGRILÁ","65 36273350","escola.9849@edu.mt.gov.br",-15.6232,-56.0634,802],["10642","EE RAIO DE SOL",7,"CUIABÁ","ESCOLA ESPECIALIZADA","U","RUA RIO MANSO","s/n","78.065-705","GRANDE TERCEIRO","65 36222431","escola.10642@edu.mt.gov.br",-15.6249,-56.0802,149],["21628","EECM RODOLFO AUGUSTO TRECHAUD E CURVO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA J QUADRA 09","25","78.048-090","RESIDENCIAL PAIAGUÁS","65 36236967","escola.21628@edu.mt.gov.br",-15.5624,-56.0832,718],["9830","EE SANTOS DUMONT",7,"CUIABÁ","CONFESSIONAL","U","RUA PIMENTA BUENO","534","78.015-190","DOM AQUINO","65 33651999","escola.9830@edu.mt.gov.br",-15.6164,-56.091,630],["9474","EE SOUZA BANDEIRA",7,"CUIABÁ","CONFESSIONAL","U","AV. FERNANDO CORREA DA COSTA","214","78.070-210","COXIPÓ DA PONTE","65 36271320","escola.9474@edu.mt.gov.br",-15.6217,-56.0652,1202],["10065","EE TANCREDO DE ALMEIDA NEVES",7,"CUIABÁ","ESCOLA","U","RUA MILITAR","185","78.060-000","JARDIM LEBLON","65 36534849","escola.10065@edu.mt.gov.br",-15.5998,-56.0747,395],["10480","EECM ALCEBÍADES CALHÃO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA FILINTO MULLER","1300","78.043-409","Quilombo","65 36220154","escola.10480@edu.mt.gov.br",-15.586,-56.1039,761],["9520","EECM ANDRÉ AVELINO RIBEIRO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Av. Deputado Osvaldo Candido Pereira","365","78.055-210","Morada da Serra CPA I","65 36413039","escola.9520@edu.mt.gov.br",-15.5564,-56.0522,1081],["9571","EECM DOUTOR HÉLIO PALMA DE ARRUDA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Av Dante Martins de Oliveira Quadra 08","s/n","78.058-751","Novo Mato Grosso","65 984721217","escola.9571@edu.mt.gov.br",-15.5824,-56.0441,1107],["9687","EECM DOUTOR LEÔNIDAS ANTERO DE MATOS",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","rua 36 qd 43","s/n","78.058-300","CPA III setor III","65 36464214","escola.9687@edu.mt.gov.br",-15.5713,-56.0456,640],["20516","EECM DOUTOR MÁRIO DE CASTRO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA NEWTTON RABELO DE CASTRO QUADRA 180","23","78099005","Pedra 90","65 992455522","escola.20516@edu.mt.gov.br",-15.6327,-55.9452,1722],["10456","EECM FILOGÔNIO CORRÊA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AV. SINFRONIO DE CAMARGO","691","78.104-000","Distrito Nossa Senhora da Guia","65 33534238","escola.10456@edu.mt.gov.br",-15.3507,-56.2334,591],["10405","EECM GUSTAVO KULMAN",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA SETE","SN","78.055-766","JARDIM VITÓRIA","65 981417794","escola.10405@edu.mt.gov.br",-15.5412,-56.0655,1111],["9806","EECM HISTORIADOR RUBENS DE MENDONÇA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA B","77","78.090-839","COHAB SÃO GONÇALO","65 21365190","escola.9806@edu.mt.gov.br",-15.6472,-56.0453,456],["9393","EECM JOÃO BRIENNE DE CAMARGO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA JOÃO GOMES SOBRINHO","1092","78.008-800","LIXEIRA","65 33588578","escola.9393@edu.mt.gov.br",-15.5962,-56.0791,646],["184152","EECM JUAREZ RODRIGUES DOS ANJOS",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Rua Padre Amadeu (RUA DO COLÉGIO)","s/n","78.091-138","Santa Laura","65 99282577","escola.184152@edu.mt.gov.br",-15.6191,-55.9927,1570],["9440","EECM LEOVEGILDO DE MELO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA 25 QUADRA 42","58","78.058-382","CPA III SETOR V","65 36465843","escola.9440@edu.mt.gov.br",-15.5623,-56.0358,1256],["23329","EECM MALIK DIDIER NAMER ZAHAFI",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Avenida Newton Rabelo de Castro","425","78.099-005","Pedra 90","65 40420193","escola.23329@edu.mt.gov.br",-15.6336,-55.9456,1507],["10421","EECM PADRE WANIR DELFINO CÉSAR",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Professor Floriano Siqueira de Carvalho","421","78.028-301","NOVO TERCEIRO","65 36343008","escola.10421@edu.mt.gov.br",-15.6155,-56.1319,441],["9482","EECM PROFESSOR HELIODORO CAPISTRANO DA SILVA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA D4 QUADRA 130","1","78.095-292","PARQUE CUIABA","65 36610847","escola.9482@edu.mt.gov.br",-15.6604,-56.0485,1071],["76201","EECM PROFESSOR JOÃO CRISÓSTOMO DE FIGUEIREDO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Rua Bandeirantes quadra 86","625","78.058-725","Dr Fábio Leite II","65 992563048","escola.76201@edu.mt.gov.br",-15.5644,-56.0122,1155],["10588","EECM PROFESSOR ULISSES CUIABANO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA DOS MIOSOTIS","555","78.043-116","JARDIM CUIABA","65 999255423","escola.10588@edu.mt.gov.br",-15.5954,-56.1188,763],["9814","EECM PROFESSORA ANA MARIA DO COUTO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AV.BRASIL","905","78.055-508","CPA II","65 99906669","escola.9814@edu.mt.gov.br",-15.5589,-56.0486,1164],["49859","EECM PROFESSORA ELIANE DIGIGOV SANTANA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA VEREADOR JULIANO DA COSTA MARQUES","1503","78.050-560","BELA VISTA","65 36537082","escola.49859@edu.mt.gov.br",-15.5809,-56.0582,1069],["124060","EECM PROFESSORA MARIA HERMÍNIA ALVES",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA 101, QUADRA 89","SN","78.058-150","CPA IV","65 33591036","escola.124060@edu.mt.gov.br",-15.5563,-56.037,875],["49832","EECM SALIM FELÍCIO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Avenida Sebastião Rodrigues Lima","371","78.095-280","Parque Cuiabá","65 36660013","escola.49832@edu.mt.gov.br",-15.672,-56.039,891],["10448","EECM SENADOR AZEREDO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA SENADOR METELLO","675","78.020-600","PORTO","65 999801673","escola.10448@edu.mt.gov.br",-15.6091,-56.1055,541],["9903","EECM VICTORINO MONTEIRO DA SILVA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Rua I","s/n","78056-716","Ilza Terezinha Picolli Pagot","65 999466525","escola.9903@edu.mt.gov.br",-15.5353,-56.0344,1150],["10154","EECM ZÉLIA COSTA DE ALMEIDA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA F","273","78.090-320","JARDIM PRESIDENTE 2","65 36653213","escola.10154@edu.mt.gov.br",-15.6466,-56.0278,662],["212431","EEDIEB ANTÔNIO CESÁRIO DE FIGUEIREDO NETO",7,"CUIABÁ","ESCOLA","U","TRAVESSA FRANCISCO DE SIQUEIRA","195","78.010-010","BANDEIRANTES","65 33228754","escola.212431@edu.mt.gov.br",-15.6016,-56.0939,970],["212512","EEDIEB PROFESSORA ALMIRA DE AMORIM SILVA",7,"CUIABÁ","ESCOLA","U","AVENIDA OSASCO","765","78055055","CPA I","65 36414050","escola.212512@edu.mt.gov.br",-15.5655,-56.0461,980],["12378","EE ARNALDO ESTEVÃO DE FIGUEIREDO",7,"JANGADA","ESCOLA","U","Rua Ramiro Vieira Mendes","0","78.490-000","CENTRO","65 33441297","escola.12378@edu.mt.gov.br",-15.2368,-56.4856,451],["12386","EE BENEDITA AUGUSTA LEMES",7,"JANGADA","ESCOLA CAMPO","R","NOVO MATO GROSSO","0","78.490-000","Zona Rural","65 33441300","escola.12386@edu.mt.gov.br",-15.3741,-56.617,199],["21679","EE DAMIÃO MAMEDES DO NASCIMENTO",7,"JANGADA","ESCOLA CAMPO","R","Comunidade do Mutum","0","78.490-000","Zona Rural","65 33441300","escola.21679@edu.mt.gov.br",-15.3674,-56.6424,131],["45110","EE LUIZA SOARES BOABAID",7,"JANGADA","ESCOLA CAMPO","R","RUA VIVA VIDA","100","78.490-000","NOVA JANGADA","65 33441031","escola.45110@edu.mt.gov.br",-15.1813,-56.5189,130],["21652","EE PROFESSOR ARLINDO DE SOUZA BRUNO",7,"JANGADA","ESCOLA","U","avenida um","1","78.490-000","altos da jangada","65 33441298","escola.21652@edu.mt.gov.br",-15.2391,-56.4919,215],["12475","EE FELICIANO GALDINO",7,"NOSSA SENHORA DO LIVRAMENTO","ESCOLA INTEGRAL/MISTA","U","RUA FELICÍSSIMO JOSÉ DA SILVA","117","78.170-000","CENTRO","65 33511456","escola.12475@edu.mt.gov.br",-15.7748,-56.3474,112],["40096","EE FREI EMILIANO MONTEIRO",7,"NOSSA SENHORA DO LIVRAMENTO","ESCOLA CAMPO","R","COMUNIDADE DE CAMPO ALEGRE DE CIMA","1","78.170-000","Zona Rural","65 992299760","escola.40096@edu.mt.gov.br",-15.7346,-56.5725,125],["21660","EE JOSÉ DE LIMA BARROS",7,"NOSSA SENHORA DO LIVRAMENTO","ESCOLA CAMPO","R","RUA MADRE MARIA ANTONIA","22","78.170-000","CENTRO - DISTRITO DE FAVAL","65 33511322","escola.21660@edu.mt.gov.br",-15.782,-56.7287,208],["153877","EE TEREZA CONCEIÇÃO DE ARRUDA",7,"NOSSA SENHORA DO LIVRAMENTO","ESCOLA QUILOMBOLA/INTEGRAL/MISTA","R","RODOVIA TRANSPANTANEIRA MT 060 KM 25","10","78.170-000","QUILOMBO MATA CAVALO","65 98402265","escola.153877@edu.mt.gov.br",-15.8685,-56.41,250],["12440","EE VEREADOR AMARÍLIO GOMES DA SILVA",7,"NOSSA SENHORA DO LIVRAMENTO","ESCOLA CAMPO","R","AVENIDA PRINCIPAL","1","78.170-000","DISTRITO DE RIBEIRÃO DOS COCAIS","65 992299760","escola.12440@edu.mt.gov.br",-15.78,-56.2242,124],["12394","EECM JOSÉ DE BARROS MACIEL",7,"NOSSA SENHORA DO LIVRAMENTO","ESCOLA CÍVICO-MILITAR","U","Rua:Cel.Manoel Felix","121","78.170-000","CENTRO","65 33511196","escola.12394@edu.mt.gov.br",-15.7742,-56.3453,357],["10189","EECM PADRE JOSÉ MARIA DO SACRAMENTO",7,"NOVA BRASILÂNDIA","ESCOLA CÍVICO-MILITAR","U","AVENIDA VEREADOR GENIVAL NUNES DE ARAUJO","1341","78.860-000","CENTRO","66 33851401","escola.10189@edu.mt.gov.br",-14.9242,-54.9742,282],["38806","EECM ALVARINA ALVES DE FREITAS",7,"PLANALTO DA SERRA","ESCOLA CÍVICO-MILITAR","U","Rua Rosário Oeste","300","78.855-000","CENTRO","66 33286145","escola.38806@edu.mt.gov.br",-14.6637,-54.7737,274],["158810","EE ANTÔNIO GARCIA",7,"POCONÉ","ESCOLA CAMPO","R","Km 120 da BR 070, proximo ao posto 120","s/n","78.175-000","S/N","65 99964037","escola.158810@edu.mt.gov.br",-15.9371,-57.032,347],["12718","EECM BACHAREL RIBEIRO DE ARRUDA",7,"POCONÉ","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","RUA TIRADENTES","1305","78.175-000","CENTRO","65 33451556","escola.12718@edu.mt.gov.br",-16.2705,-56.6249,183],["12726","EE DOM FRANCISCO DE AQUINO CORRÊA",7,"POCONÉ","ESCOLA CAMPO","R","Rua Santa Terezinha","s/n","78.175-000","Distrito de Cangas","65 992365037","escola.12726@edu.mt.gov.br",-16.0787,-56.5698,506],["12670","EECM FREI CARLOS VALETTE",7,"POCONÉ","ESCOLA CÍVICO-MILITAR","U","AV. PINHEIRO MACHADO","1266","78.175-000","BOM PASTOR","65 33452344","escola.12670@edu.mt.gov.br",-16.2533,-56.632,622],["12742","EE PROFESSORA MARIA HELENA DE ARAÚJO BASTOS",7,"POCONÉ","ESCOLA","U","Rua São João Del Rey","688","78.175-000","jurumirim","65 33452662","escola.12742@edu.mt.gov.br",-16.264,-56.6412,290],["12688","EECM ANTÔNIO JOÃO RIBEIRO DE ARRUDA",7,"POCONÉ","ESCOLA CÍVICO-MILITAR","U","Rua Coronel Teófilo s/nº","s/n","78.175-000","São Benedito","65 33452737","escola.12688@edu.mt.gov.br",-16.2672,-56.6277,377],["12700","EECM PROFESSORA EUCÁRIS NUNES DA CUNHA E MORAES",7,"POCONÉ","ESCOLA CÍVICO-MILITAR","U","Rua Joaquim Murtinho","167","78.175-000","CENTRO","65 33452359","escola.12700@edu.mt.gov.br",-16.2601,-56.6268,824],["12505","EE FAUSTINO DIAS DE AMORIM",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA CAMPO","R","Rua Bom Jesus","03","78.180-000","Varginha","65 999807933","escola.12505@edu.mt.gov.br",-15.814,-56.1009,279],["12564","EE HERMES RODRIGUES DE ALCÂNTARA",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA","U","Rua XV de Novembro","10","78.180-000","CENTRO","65 33411516","escola.12564@edu.mt.gov.br",-15.867,-56.0716,477],["76228","EE MARIA DE ARRUDA MÜLLER",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA QUILOMBOLA/INTEGRAL/MISTA","R","BR 364 KM 353","s/nº","78.180-000","FAZENDA ABOLIÇÃO","65 992108545","escola.76228@edu.mt.gov.br",-15.7898,-55.6071,205],["12513","EE NAGIB SAAD",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA CAMPO/INTEGRAL/MISTA","R","Av. Faustino Dias Neto","0","78.180-000","Agrovila das Palmeiras","65 33351098","escola.12513@edu.mt.gov.br",-15.9659,-55.5381,240],["12580","EE OSWALDITA ELIZA TEIXEIRA COUTO",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA","U","Praça:Deputado Eugênio Vieira de Figueiredo","97","78.180-000","CENTRO","65 998192639","escola.12580@edu.mt.gov.br",-15.8667,-56.0793,547],["12556","EE SANTA CLAUDINA",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA CAMPO/INTEGRAL/MISTA","R","Av Principal","44","78.180-000","Mimoso","65 33411070","escola.12556@edu.mt.gov.br",-16.2737,-55.7994,239],["117587","EE SANTANA DO TAQUARAL",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA CAMPO","R","acesso as fazendas amparo e bandeirantes","SN","78.180-000","PA SANTANA DO TAQUARAL","06501010101","escola.117587@edu.mt.gov.br",-16.0499,-55.5039,147],["12548","EECM LEÔNIDAS DE MATOS",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA CÍVICO-MILITAR","U","AVENIDA SANTO ANTONIO","585","78.180-000","CENTRO","65 33411589","escola.12548@edu.mt.gov.br",-15.8639,-56.0756,570],["120979","EEI KOROGEDO PARU",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA INDÍGENA","R","Aldeia Córrego Grande","01","78.180-000","ALDEIA","65 44007637","escola.120979@edu.mt.gov.br",-16.5934,-55.2139,59],["119202","EEI PIEBAGA",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA INDÍGENA","R","aldeia piebaga","0","78.180-000","Tereza Cristina","65 33411773","escola.119202@edu.mt.gov.br",-16.5936,-54.9891,33],["12025","CHP PROFESSORA CÉLIA RODRIGUES DUQUE",7,"VÁRZEA GRANDE","ESCOLA ESPECIALIZADA","U","RUA MIGUEL LEITE","266","78.110-044","CENTRO SUL","65 36861464","escola.12025@edu.mt.gov.br",-15.652,-56.138,110],["75116","EE DE ENSINO ESPECIAL LUZ DO SABER",7,"VÁRZEA GRANDE","ESCOLA ESPECIALIZADA","U","RUA GONÇALO BOTELHO DE CAMPOS","251","78.116-136","PONTE NOVA","65 33623377","escola.75116@edu.mt.gov.br",-15.6276,-56.1157,70],["12157","EE DEPUTADO EMANUEL PINHEIRO",7,"VÁRZEA GRANDE","ESCOLA","U","AV. DOM ORLANDO CHAVES","778","78.115-970","Cristo Rei","65 99219321","escola.12157@edu.mt.gov.br",-15.6332,-56.1087,449],["11959","EE DEPUTADO GONÇALO BOTELHO DE CAMPOS",7,"VÁRZEA GRANDE","ESCOLA INTEGRAL/MISTA","U","Rua Jacob do Bandolim","30","78.128-234","Jd. Costa Verde","65 36867002","escola.11959@edu.mt.gov.br",-15.6792,-56.1227,392],["12319","EE DEPUTADO MILTON FIGUEIREDO",7,"VÁRZEA GRANDE","ESCOLA","U","RUA CRUZEIRO DO SUL","22","78.158-006","JARDIM DOS ESTADOS","65 33641137","escola.12319@edu.mt.gov.br",-15.6404,-56.1747,574],["12181","EE DEPUTADO UBALDO MONTEIRO DA SILVA",7,"VÁRZEA GRANDE","ESCOLA","U","RUA MINAS GERAIS","s/nº","78.158-018","JARDIM DOS ESTADOS","65 36827815","escola.12181@edu.mt.gov.br",-15.6391,-56.1745,836],["12246","EE DOM BOSCO",7,"VÁRZEA GRANDE","ESCOLA","U","AV. PRINCIPAL DA COHAB DOM BOSCO","40","78.110-002","Cristo Rei","65 36857224","escola.12246@edu.mt.gov.br",-15.6485,-56.0973,452],["49875","EE DOMINGOS SÁVIO BRANDÃO LIMA",7,"VÁRZEA GRANDE","ESCOLA","U","RUA ARI PAES BARRETO","s/nº","78.118-091","Cristo Rei","65 36851523","escola.49875@edu.mt.gov.br",-15.6446,-56.1051,501],["71765","EECM DUNGA RODRIGUES",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","AVENIDA CEL. SÉRGIO JULIÃO DE BRITO","s/n","78.120-400","PARQUE DO LAGO","65 36913990","escola.71765@edu.mt.gov.br",-15.6601,-56.0914,1461],["173576","EECM GOVERNADOR DANTE MARTINS DE OLIVEIRA",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","RUA CARVÃO BRANCO","s/n","78.149-502","NOVO MUNDO","65 36852737","escola.173576@edu.mt.gov.br",-15.6272,-56.1862,1388],["173584","EE GOVERNADOR JOSÉ GARCIA NETO",7,"VÁRZEA GRANDE","ESCOLA","U","Av. Mario Andreazza","SN","78.144-850","Jardim Taruma","65 981436828","escola.173584@edu.mt.gov.br",-15.6171,-56.1773,587],["12289","EE IRMÃOS DO CAMINHO",7,"VÁRZEA GRANDE","ESCOLA CAMPO","R","Av Principal","0","78.110-002","SOUZA LIMA","65 36868186","escola.12289@edu.mt.gov.br",-15.7219,-56.1317,397],["104248","EE JAYME VERÍSSIMO DE CAMPOS JÚNIOR - JAIMINHO",7,"VÁRZEA GRANDE","ESCOLA","U","RUA DAS BEGÔNIAS QUADRA 03 LOTES 04 e 05","SN","78.158-401","JARDIM DOS ESTADO LOTEAMENTO TARUMA","65 36954457","escola.104248@edu.mt.gov.br",-15.6197,-56.1709,738],["11940","EECM JOSÉ LEITE DE MORAES",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","RUA SENADOR VICENTE VUOLO","0","78.118-081","Cristo Rei","65 36851608","escola.11940@edu.mt.gov.br",-15.6438,-56.1052,1335],["40452","EE JÚLIO STRUBING MÜLLER",7,"VÁRZEA GRANDE","ESCOLA","U","AV. DOM ORLANDO CHAVES (UNIVAG BLOCO - C2)","2655","78.118-650","Cristo Rei","65 33623697","escola.40452@edu.mt.gov.br",-15.6448,-56.1055,513],["12149","EE MANOEL GOMES",7,"VÁRZEA GRANDE","ESCOLA INTEGRAL","U","TRAVESSA BARNABé","3","78.115-540","MANGA","65 996833400","escola.12149@edu.mt.gov.br",-15.6312,-56.1143,300],["11991","EE MILITAR TIRADENTES TENENTE CORONEL PM LOUIRSON RODRIGUES BENEVIDES",7,"VÁRZEA GRANDE","ESCOLA MILITAR","U","RUA GOVERNADOR PEDRO PEDROSSIAN","s/n","78.110-069","JARDIM AEROPORTO","65 36842684","escola.11991@edu.mt.gov.br",-15.6465,-56.125,1105],["12114","EE PEDRO GARDÉS",7,"VÁRZEA GRANDE","ESCOLA","U","AV. Filinto Muller","1511","78.110-056","CENTRO","65 36821318","escola.12114@edu.mt.gov.br",-15.6482,-56.1344,995],["12084","EE PORFÍRIA PAULA DE CAMPOS",7,"VÁRZEA GRANDE","ESCOLA","U","Rua Abdala José de Almeida","1","78.150-292","Santa isabel","65 36846571","escola.12084@edu.mt.gov.br",-15.6511,-56.1734,748],["11932","EE PROFESSOR FERNANDO LEITE DE CAMPOS",7,"VÁRZEA GRANDE","ESCOLA","U","AVENIDA ALZIRA SANTANA","347","78.135-626","CENTRO","65 36866007","escola.11932@edu.mt.gov.br",-15.6533,-56.1385,1355],["12262","EE PROFESSOR HONÓRIO RODRIGUES AMORIM",7,"VÁRZEA GRANDE","ESCOLA INTEGRAL/LÍNGUAS","U","Rua Honorio Rodrigues - Quadra 22","s/n","78.118-184","Cristo Rei","65 36850029","escola.12262@edu.mt.gov.br",-15.6394,-56.0981,143],["12122","EECM PROFESSOR JERCY JACOB",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","Rua São Judas Tadeu","99","78.138-040","Marajoara (antigo Água Vermelha)","65 99318466","escola.12122@edu.mt.gov.br",-15.6507,-56.1452,409],["12327","EE PROFESSOR JOSÉ MENDES MARTINS",7,"VÁRZEA GRANDE","ESCOLA","U","RUA: JOÃO LOPES MACEDO","4","78.120-520","JARDIM MARINGÁ II","65 36911863","escola.12327@edu.mt.gov.br",-15.6638,-56.0886,399],["12106","EE PROFESSORA ADALGISA DE BARROS",7,"VÁRZEA GRANDE","ESCOLA","U","AVENIDA PEDRO PEDROSSIAN","s/n","78.110-354","JARDIM AEROPORTO","65 999781725","escola.12106@edu.mt.gov.br",-15.6507,-56.1273,1031],["106020","EE PROFESSORA ELIZABETH MARIA BASTOS MINEIRO",7,"VÁRZEA GRANDE","ESCOLA","U","RUA ARACY DE ALMEIDA","n.º 1","78.152-124","SÃO MATHEUS","65 36945300","escola.106020@edu.mt.gov.br",-15.666,-56.1804,1011],["12238","EECM PROFESSORA MARIA DA CUNHA BRUNO",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","RUA DAS ACÁCIAS","s/nº","78.132-672","PRIMAVERA","65 36865215","escola.12238@edu.mt.gov.br",-15.689,-56.1334,1107],["12335","EE PROFESSORA MARIA DE MACEDO RODRIGUES",7,"VÁRZEA GRANDE","ESCOLA INTEGRAL/MISTA","U","Rua Martins Afonso s/n","1","78.142-603","Mapim","65 36849061","escola.12335@edu.mt.gov.br",-15.6314,-56.1671,241],["12130","EE PROFESSORA MARIA LEITE MARCOSKI",7,"VÁRZEA GRANDE","ESCOLA","U","RUA TENENTE SOUZA MARQUES","s/n","78138452","MARAJOARA","65 36943662","escola.12130@edu.mt.gov.br",-15.656,-56.1564,844],["96865","EE PROFESSORA MARLENE MARQUES DE BARROS",7,"VÁRZEA GRANDE","ESCOLA","U","RUA PERU QUADRA 01","8","78.143-330","JARDIM IMPERIAL","65 36953242","escola.96865@edu.mt.gov.br",-15.6205,-56.1701,739],["12254","EECM ARLETE MARIA DA SILVA",7,"VÁRZEA GRANDE","ESCOLA","U","RUA F QUADRA 12","0","78.150-442","COHAB ASA BELA","65 36845207","escola.12254@edu.mt.gov.br",-15.6543,-56.1764,1018],["12017","EECM DEPUTADO SALIM NADAF",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","Rua Papa João Paulo (Cohab C Rei)","0","78.118-280","Cristo Rei","65 36913332","escola.12017@edu.mt.gov.br",-15.6584,-56.0982,799],["158364","EECM ERNANDY MAURÍCIO BARACAT DE ARRUDA",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","Rua 15 quadra 56","s/n","78.148-792","Nova Fronteira","65 36861229","escola.158364@edu.mt.gov.br",-15.6645,-56.159,980],["12050","EECM IRENE GOMES DE CAMPOS",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","Rua da Guarita","288","78.110-100","Figueirinha","65 36828255","escola.12050@edu.mt.gov.br",-15.6379,-56.138,992],["12300","EECM MIGUEL BARACAT",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","rua treze","SN","78.125-200","Residencial São Benedito","65 36840581","escola.12300@edu.mt.gov.br",-15.6814,-56.1847,923],["11967","EECM PROFESSOR VANIL STABILITO",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","RUA JOÃO AUGUSTO DE FIGUEIREDO","10","78.130-095","CENTRO SUL","65 36945001","escola.11967@edu.mt.gov.br",-15.6654,-56.1351,748],["11975","EECM PROFESSORA ELMAZ GATTAS MONTEIRO",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","rua Presidente Arthur Bernardes","s/n","78.110-798","Ipase","65 36853375","escola.11975@edu.mt.gov.br",-15.6619,-56.1243,885],["13153","EE CORA CORALINA",8,"COMODORO","ESCOLA INTEGRAL/MISTA","U","RUA CASSEMIRO DO VALE","184 S","78.310-000","NOVA VACARIA","65 32832318","escola.13153@edu.mt.gov.br",-13.6543,-59.8024,509],["13137","EE DEPUTADO DJALMA CARNEIRO DA ROCHA",8,"COMODORO","ESCOLA CAMPO","R","Rua dos Ipês","s/nº","78.310-000","Nova Alvorada","65 992601658","escola.13137@edu.mt.gov.br",-13.6501,-59.9142,347],["13145","EECM DONA ROSA FRIGER PIOVEZAN",8,"COMODORO","ESCOLA CÍVICO-MILITAR","U","RUA CEARÁ","280 N","78.310-000","Tertúlia","65 32831222","escola.13145@edu.mt.gov.br",-13.6544,-59.7829,738],["154164","EEI MAMAINDE",8,"COMODORO","ESCOLA INDÍGENA","R","ALDEIA CAPITÃO PEDRO","0","78.310-000","ALDEIA","65 993373460","escola.154164@edu.mt.gov.br",-13.2014,-60.138,170],["158313","EEI PIRINEUS DE SOUZA",8,"COMODORO","ESCOLA INDÍGENA","R","ALDEIA AROEIRA","0","78.310-000","ALDEIA","69 99249018","escola.158313@edu.mt.gov.br",-12.7213,-59.9888,212],["69523","EE CONQUISTA D´OESTE",8,"CONQUISTA DO OESTE","ESCOLA","U","RUA DAS JABUTICABEIRAS","1339","78.254-000","CENTRO","65 32651199","escola.69523@edu.mt.gov.br",-14.5378,-59.5424,473],["13218","EE BARÃO DE MELGAÇO",8,"FIGUEIRÓPOLIS D'OESTE","ESCOLA","U","RUA ALAGOAS","76","78.290-000","CENTRO","65 32351299","escola.13218@edu.mt.gov.br",-15.4456,-58.739,294],["13170","EE DEPUTADO JOÃO EVARISTO CURVO",8,"JAURU","ESCOLA","U","AV. SANTOS DUMONT","50","78.255-000","CENTRO","65 32441779","escola.13170@edu.mt.gov.br",-15.3404,-58.8646,667],["13188","EE JUSCELINO KUBITSCHEK DE OLIVEIRA",8,"JAURU","ESCOLA CAMPO","R","RUA JUSCELINO KUBITSCHEK DE OLIVEIRA","245","78.255-000","CENTRO","65 992669933","escola.13188@edu.mt.gov.br",-15.1666,-58.8625,107],["69558","EECM ANGELINA FRANCISCON MAZUTTI",8,"JÚLIO","ESCOLA CÍVICO-MILITAR","U","VOLMIR TABORDA CAMARA","676","78.319-000","BOM JARDIM","65 992654228","escola.69558@edu.mt.gov.br",-13.7126,-59.2601,870],["69264","EE HERMES JOSÉ DA SILVA",8,"NOVA LACERDA","ESCOLA","U","RUA ESPIRITO SANTO","400","78.243-000","SÃO JOSÉ","65 99217739","escola.69264@edu.mt.gov.br",-14.4789,-59.5914,239],["13048","EECM DEPUTADO DORMEVIL FARIA",8,"PONTES E LACERDA","ESCOLA CÍVICO-MILITAR","U","RUA CEARÁ","782","78.250-000","CENTRO","65 32661221","escola.13048@edu.mt.gov.br",-15.2362,-59.3349,1262],["13056","EECM MÁRIO SPINELLI",8,"PONTES E LACERDA","ESCOLA CÍVICO-MILITAR","U","RUA 14 DE FEVEREIRO","303","78.250-000","CENTRO","65 32664042","escola.13056@edu.mt.gov.br",-15.2299,-59.3452,919],["13102","EE MILITAR TIRADENTES 1º TENENTE PM CARLOS HENRIQUE PASCHOIOTTO SCHEIFER",8,"PONTES E LACERDA","ESCOLA MILITAR","U","AVENIDA BOM JESUS","531","78.250-000","CENTRO","65 32661592","escola.13102@edu.mt.gov.br",-15.2273,-59.3398,971],["13072","EE SÃO JOSÉ",8,"PONTES E LACERDA","ESCOLA","U","RUA TEREZINHA COURA GARBIM","1545","78.250-000","SÃO JOSÉ","65 999903941","escola.13072@edu.mt.gov.br",-15.234,-59.3247,1162],["65498","EE OLAVO BILAC",8,"RONDOLÂNDIA","ESCOLA","U","Rua Mathilde Klemz","0","78.338-000","CENTRO","66 35421117","escola.65498@edu.mt.gov.br",-10.8407,-61.4616,236],["145742","EEI SERTANISTA APOENA MEIRELLES",8,"RONDOLÂNDIA","ESCOLA INDÍGENA","R","ALDEIA INDIGENA SERTANISTA APOENA MEIRELLES","s/n","78.338-000","TERRA INDIGENA SETE DE SETEMBRO","66 99219379","escola.145742@edu.mt.gov.br",-10.8128,-61.423,17],["123994","EEI ZARUP WEJ",8,"RONDOLÂNDIA","ESCOLA INDÍGENA ALTERNÂNCIA INTEGRAL","R","Aldeia Zarup'Wej","0","78.338-000","Terra Indigena Zoró","66 35421001","escola.123994@edu.mt.gov.br",-10.8573,-60.7697,100],["191841","EEI ZAWÃ KAREJ PANGYJEJ",8,"RONDOLÂNDIA","ESCOLA INDÍGENA ALTERNÂNCIA INTEGRAL","R","Aldeia Zawã Karej Pangyjej","s/n","78.338-000","Aldeia Zawã Karej Pangyjej","66 35421001","escola.191841@edu.mt.gov.br",-10.6508,-61.1302,54],["69400","EE RAINHA DA PAZ",8,"VALE DE SÃO DOMINGOS","ESCOLA CAMPO","R","RUA HONORATO AZAMBUJA","s/nº","78.253-000","CENTRO","65 32681056","escola.69400@edu.mt.gov.br",-15.2941,-59.066,328],["176460","EE 11 DE AGOSTO",8,"VILA BELA DA SANTÍSSIMA TRINDADE","ESCOLA CAMPO","R","Francisca Verdecio","01","78.246-000","Distrito de Santa Clara do Monte Cristo","65 35281021","escola.176460@edu.mt.gov.br",-16.0988,-59.9628,201],["13129","EE VERENA LEITE DE BRITO",8,"VILA BELA DA SANTÍSSIMA TRINDADE","ESCOLA QUILOMBOLA","U","Rua Municipal","738","78.245-000","CENTRO","65 32591234","escola.13129@edu.mt.gov.br",-15.007,-59.9492,1011],["173355","EE BOA ESPERANÇA",9,"CAMPO VERDE","ESCOLA CAMPO","R","Assentamento Dom Osório - ROD BR 070 KM 348+30 KM a Esquerda","s/n","78.840-000","Zona Rural","66 996525687","escola.173355@edu.mt.gov.br",-15.3294,-54.7568,147],["9539","EE GUSTAVO DUTRA",9,"CAMPO VERDE","ESCOLA CAMPO","R","BR 364 KM 329","SN","78.180-000","SAO VICENTE DA SERRA","65 33412008","escola.9539@edu.mt.gov.br",-15.8234,-55.4207,275],["157252","EECM LEDY ANITA BRESCANCIN",9,"CAMPO VERDE","ESCOLA CÍVICO-MILITAR","U","AVENIDA VEREADOR CESAR LIMA","950","78.840-000","SÃO MIGUEL","66 996602846","escola.157252@edu.mt.gov.br",-15.5534,-55.1526,741],["16152","EE PROFESSORA ALICE BARBOSA PACHECO",9,"CAMPO VERDE","ESCOLA CAMPO","R","Agrovila João Ponce de Arruda","SN","78.846-899","Zona Rural","66 999964186","escola.16152@edu.mt.gov.br",-15.578,-55.362,132],["16136","EECM WALDEMON MORAES COELHO",9,"CAMPO VERDE","ESCOLA CÍVICO-MILITAR","U","RUA BELÉM","507","78.840-000","CENTRO","66 999369579","escola.16136@edu.mt.gov.br",-15.5502,-55.17,1145],["16144","EECM JUPIARA",9,"CAMPO VERDE","ESCOLA CÍVICO-MILITAR","U","RUA DOS SULISTAS","117-1","78843-074","JUPIARA","66 999631855","escola.16144@edu.mt.gov.br",-15.5637,-55.1721,701],["49786","EECM ULISSES GUIMARÃES",9,"CAMPO VERDE","ESCOLA CÍVICO-MILITAR","U","RUA RIO DE JANEIRO","915","78.840-073","CENTRO","66 999621151","escola.49786@edu.mt.gov.br",-15.5417,-55.1707,677],["45829","EE GERVÁSIO DOS SANTOS COSTA",9,"GAÚCHA DO NORTE","ESCOLA","U","RUA CAPANEMA ESQUNA COM MINAS GERAIS","974","78.875-000","CENTRO","66 981270880","escola.45829@edu.mt.gov.br",-13.1816,-53.2587,674],["75728","EEI CENTRAL LEONARDO VILLAS-BÔAS",9,"GAÚCHA DO NORTE","ESCOLA INDÍGENA","R","POSTO LEONARDO","1004","78.875-000","TERRA INDÍGENA DO XINGU","66 992507178","escola.75728@edu.mt.gov.br",-12.1999,-53.378,428],["69302","EEI KARIB - COMUNIDADE KUIKURO",9,"GAÚCHA DO NORTE","ESCOLA INDÍGENA","R","COMUNIDADE KUIKURO ALDEIA IPATSE","1004","78.875-000","PARQUE INDIGENA DO XINGU","11 914519315","escola.69302@edu.mt.gov.br",-12.3524,-53.2095,233],["129240","EEI PIYULAGA",9,"GAÚCHA DO NORTE","ESCOLA INDÍGENA","R","TERRA NACIONAL DO XINGU","1","78.875-000","ALDEIA WAURÁ","66 996822137","escola.129240@edu.mt.gov.br",-12.2486,-53.5827,97],["82260","EEI ADÃO TOPTIVO",9,"GENERAL CARNEIRO","ESCOLA INDÍGENA","R","ALDEIA ABELHINHA","1","78.620-000","ALDEIA","66 34161181","escola.82260@edu.mt.gov.br",-15.6058,-53.9151,117],["11495","EEI SÃO JOSÉ SANGRADOURO",9,"GENERAL CARNEIRO","ESCOLA INDÍGENA","R","ALDEIA SANGRADOURO KM 225 BR 070","1","78.620-000","ALDEIA","66 34161181","escola.11495@edu.mt.gov.br",-15.6548,-53.9065,484],["13803","EECM APOLÔNIO BOURET DE MELO",9,"PARANATINGA","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","Av. Bandeirante","2529","78.870-000","CENTRO","66 996742785","escola.13803@edu.mt.gov.br",-14.4296,-54.0494,316],["13781","EE OSVALDO CÂNDIDO PEREIRA",9,"PARANATINGA","ESCOLA","U","Avenida Mato Grosso","690","78.870-000","CENTRO","66 981530683","escola.13781@edu.mt.gov.br",-14.4272,-54.0504,1152],["13773","EECM 29 DE JUNHO",9,"PARANATINGA","ESCOLA CÍVICO-MILITAR","U","Rua João Pessoa","794","78.870-000","Vila Concórdia","66 981334788","escola.13773@edu.mt.gov.br",-14.4396,-54.0567,690],["156230","EEI ATURUA",9,"PARANATINGA","ESCOLA INDÍGENA","R","TERRA INDIGENA BAKAIRI","1","78.870-000","ALDEIA ATURUA","66 98420780","escola.156230@edu.mt.gov.br",-14.3909,-54.6511,52],["118540","EEI KURÂ-BAKAIRI",9,"PARANATINGA","ESCOLA INDÍGENA/INTEGRAL/MISTA","R","TERRA INDÍGENA BAKAIRI","1","78.870-000","ALDEIA PAKUERA","66 35731316","escola.118540@edu.mt.gov.br",-14.3164,-54.6828,87],["128228","EEI PAIHITWARA",9,"PARANATINGA","ESCOLA INDÍGENA","R","TERRA INDIGENA MARECHAL RONDON, ETNIA XAVANTE","s/n","78.870-000","ALDEIA UIRAPURU","66 984218050","escola.128228@edu.mt.gov.br",-13.756,-53.8826,159],["13692","EE ARGEMIRO RODRIGUES PIMENTEL",9,"POXORÉU","ESCOLA CAMPO","R","RUA ANTONIO VIEIRA RUICCI","10","78.800-000","CENTRO - DISTRITO DE PARAÍSO DO LESTE","66 34172045","escola.13692@edu.mt.gov.br",-16.067,-54.1619,87],["13617","EECM FRANKLIN CASSIANO",9,"POXORÉU","ESCOLA CÍVICO-MILITAR/CAMPO","R","AVENIDA MANOEL CANDIDO DE OLIVEIRA","1","78.800-000","JARUDORE","66 99902846","escola.13617@edu.mt.gov.br",-16.1983,-54.3103,135],["13706","EE JOÃO BORGES VIEIRA",9,"POXORÉU","ESCOLA CAMPO","R","Avenida Nossa Senhora Aparecida","00","78.800-000","Distrito de Aparecida do Leste","66 99257970","escola.13706@edu.mt.gov.br",-15.9987,-54.2554,65],["13595","EE PADRE CÉSAR ALBISETTI",9,"POXORÉU","ESCOLA INTEGRAL/EPT","R","Rua MT 260, KM 05","KM 05","78.800-000","Zona Rural","66 99997515","escola.13595@edu.mt.gov.br",-15.8348,-54.389,203],["13641","EE POXORÉO",9,"POXORÉU","CONFESSIONAL","U","RUA GOIÁS","160","78.800-000","CENTRO","66 992177498","escola.13641@edu.mt.gov.br",-15.8386,-54.3842,280],["13633","EE PRESIDENTE DUTRA",9,"POXORÉU","ESCOLA CAMPO","R","DISTRITO DE ALTO COITÉ","10","78.800-000","DISTRITO","66 34141156","escola.13633@edu.mt.gov.br",-15.739,-54.3382,257],["13609","EE PROFESSORA JURACY MACEDO",9,"POXORÉU","ESCOLA","U","Av. Dom Bosco","s/nº","78.800-000","João Pessoa","66 99683340","escola.13609@edu.mt.gov.br",-15.8299,-54.3947,236],["13625","EECM JOÃO PEDRO TORRES",9,"POXORÉU","ESCOLA CÍVICO-MILITAR","U","Rui Barbosa","1","78.800-000","Vila Irantinópolis","66 34361188","escola.13625@edu.mt.gov.br",-15.8159,-54.401,399],["148130","EEI MARIMBÚ",9,"POXORÉU","ESCOLA INDÍGENA","R","Aldeia Marimbú","10","78.800-000","Terra Indígena Sangradouro","66 984298650","escola.148130@edu.mt.gov.br",-15.4638,-53.9478,246],["173568","EE CAMPO MASSAPÉ",9,"PRIMAVERA DO LESTE","ESCOLA CAMPO","R","RODOVIA MT 130 KM 12 MAIS 30 KM À ESQUERDA - COLÔNIA RUSSA","s/n","78.850-000","Zona Rural","66 996923548","escola.173568@edu.mt.gov.br",-15.2694,-54.302,199],["173550","EE CAMPO VILA UNIÃO",9,"PRIMAVERA DO LESTE","ESCOLA CAMPO","R","RODOVIA MT 130,KM5 , 48KM A ESQUERDA DA RODOVIA MT 486","s/n","78.850-000","COMUNIDADE RURAL VILA UNIAO","66 34987404","escola.173550@edu.mt.gov.br",-15.2387,-54.4918,300],["13765","EECM JOÃO RIBEIRO VILELA",9,"PRIMAVERA DO LESTE","ESCOLA CÍVICO-MILITAR","U","Rua Arlindo Cornelli","301","78.850-000","Centro Leste","66 999961350","escola.13765@edu.mt.gov.br",-15.5526,-54.291,512],["159697","EE MILITAR TIRADENTES 2° SARGENTO PM WELITON PEREIRA DUARTE",9,"PRIMAVERA DO LESTE","ESCOLA MILITAR","U","Rua da Cohab","175","78.850-000","Cohab Tancredo Neves","66 996707974","escola.159697@edu.mt.gov.br",-15.56447,-54.29155,1014],["38571","EECM MONTEIRO LOBATO",9,"PRIMAVERA DO LESTE","ESCOLA CÍVICO-MILITAR","U","Rua: Malva Real","48","78.850-000","Pioneiro","66 996599665","escola.38571@edu.mt.gov.br",-15.5726,-54.3099,781],["183652","EECM PROFESSORA MARIA SEBASTIANA DE SOUZA",9,"PRIMAVERA DO LESTE","ESCOLA CÍVICO-MILITAR","U","AVENIDA AMAZONAS","402","78.850-000","Primavera 2","66 99638443","escola.183652@edu.mt.gov.br",-15.5483,-54.3015,994],["148113","EECM CREMILDA DE OLIVEIRA VIANA",9,"PRIMAVERA DO LESTE","ESCOLA CÍVICO-MILITAR","U","RUA:ANTÔNIO SALOMÃO","35","78.850-000","SÃO CRISTOVÃO","66 99973910","escola.148113@edu.mt.gov.br",-15.5404,-54.2876,1195],["158836","EECM PAULO FREIRE",9,"PRIMAVERA DO LESTE","ESCOLA CÍVICO-MILITAR","U","RUA PINHEIRO","900","78.850-000","RESIDENCIAL BURITIS PRIMAVERA","66 31910756","escola.158836@edu.mt.gov.br",-15.5262,-54.3299,920],["13730","EECM PROFESSORA ALDA GAWLINSKI SCOPEL",9,"PRIMAVERA DO LESTE","ESCOLA CÍVICO-MILITAR","U","Avenida São João","212","78.850-000","CENTRO","66 34982006","escola.13730@edu.mt.gov.br",-15.5568,-54.2978,429],["13757","EECM SEBASTIÃO PATRÍCIO",9,"PRIMAVERA DO LESTE","ESCOLA CÍVICO-MILITAR","U","AVENIDA PRIMAVERA","350","78.850-000","PRIMAVERA II","66 34987496","escola.13757@edu.mt.gov.br",-15.5432,-54.3009,758],["212504","EEDIEB GETÚLIO DORNELLES VARGAS",9,"PRIMAVERA DO LESTE","ESCOLA CÍVICO-MILITAR","U","Avenida São João","594","78.850-000","Primavera I","66 99990409","escola.212504@edu.mt.gov.br",-15.5575,-54.3014,982],["68713","EECM VANDERLEI CECATTO",9,"SANTO ANTÔNIO DO LESTE","ESCOLA CÍVICO-MILITAR","U","Avenida Maceió","125","78.628-000","Jardim Bem Viver","66 99209873","escola.68713@edu.mt.gov.br",-14.7983,-53.6149,402],["12912","EE ARLINDA PESSOA MORBECK",10,"ALTO ARAGUAIA","ESCOLA","U","AVENIDA VEREADOR LAURISTON FERNANDES BARBOSA","74","78.780-000","AEROPORTO","66 34811819","escola.12912@edu.mt.gov.br",-17.3285,-53.2245,394],["12939","EE MARIA AUXILIADORA",10,"ALTO ARAGUAIA","CONFESSIONAL","U","Rua Santa Rita","171","78.780-000","CENTRO","66 999020487","escola.12939@edu.mt.gov.br",-17.3191,-53.2131,608],["12947","EE ONECÍDIO MANOEL DE RESENDE",10,"ALTO ARAGUAIA","ESCOLA CAMPO","R","RUA ESTADUAL","2","78.780-000","DISTRITO DO BURITI","66 99924376","escola.12947@edu.mt.gov.br",-17.9799,-53.5515,44],["12920","EECM CARLOS HUGUENEY",10,"ALTO ARAGUAIA","ESCOLA CÍVICO-MILITAR","U","RUA RIO BRANCO","253","78.780-000","CENTRO","66 34811195","escola.12920@edu.mt.gov.br",-17.3159,-53.2116,78],["12971","EE DEPUTADO OSCAR SOARES",10,"ALTO GARÇAS","ESCOLA CAMPO/INTEGRAL/AGRÍCOLA","U","Avenida Vereador Benedito Ferreira De Moura","s/n","78.770-000","NOVO HORIZANTE","66 34711484","escola.12971@edu.mt.gov.br",-16.9607,-53.5366,141],["12955","EECM DOUTOR YTRIO CORRÊA",10,"ALTO GARÇAS","ESCOLA CÍVICO-MILITAR","U","Avenida 7 de setembro","s/n","78.770-000","CENTRO","66 34711392","escola.12955@edu.mt.gov.br",-16.9533,-53.525,991],["13021","EECM CARLOS IRIGARAY FILHO",10,"ALTO TAQUARI","ESCOLA CÍVICO-MILITAR","U","RUA ALTINO PEREIRA DE SOUZA","1080","78.785-000","CENTRO","66 34961247","escola.13021@edu.mt.gov.br",-17.828,-53.2824,986],["12980","EE RUI BARBOSA",10,"ARAGUAINHA","ESCOLA","U","AVENIDA ARAGUAIA","1030","78.615-000","CENTRO","66 34761121","escola.12980@edu.mt.gov.br",-16.8551,-53.0341,78],["16071","EE SÃO LOURENÇO",10,"DOM AQUINO","CONFESSIONAL","U","RUA PRESIDENTE VARGAS","47","78.830-000","CENTRO","66 34511084","escola.16071@edu.mt.gov.br",-15.8107,-54.9198,479],["16110","EECM VINÍCIUS DE MORAES",10,"DOM AQUINO","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","AV.JOÃO FURTADO DE MENDONÇA","s/n","78.830-000","VILA ESPORTIVA","66 34511056","escola.16110@edu.mt.gov.br",-15.8077,-54.9297,122],["14320","EECM DONA MARIA DE LOURDES RIBEIRO FRAGELLI",10,"GUIRATINGA","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","AV. PARANÁ","925","78.760-000","SANTA MARIA BERTILA","66 99943956","escola.14320@edu.mt.gov.br",-16.3509,-53.7617,143],["14303","EE PEDRO FERREIRA",10,"GUIRATINGA","ESCOLA CAMPO","R","RUA PADRE CORNÉLIO FARESIN","113","78.766-000","DISTRITO VALE RICO","66 34691062","escola.14303@edu.mt.gov.br",-16.3916,-54.1535,60],["49689","EE SANTA TERESINHA",10,"GUIRATINGA","CONFESSIONAL","U","Av.Marechal Rondon","779","78.760-000","CENTRO","66 999069900","escola.49689@edu.mt.gov.br",-16.3484,-53.76,504],["140805","EECM BONIFÁCIO SACHETTI",10,"ITIQUIRA","ESCOLA CÍVICO-MILITAR/CAMPO","R","AV. JORGE EDUARDO RAPOSO DE MEDEIROS - QUADRA 17 - LOTE 01","01","78.790-000","DISTRITO DE OURO BRANCO DO SUL","65 999070610","escola.140805@edu.mt.gov.br",-17.3813,-54.7599,251],["11231","EECM DOM AQUINO CORRÊA",10,"ITIQUIRA","ESCOLA CÍVICO-MILITAR","U","RUA DR. FERNANDO CORRÊA DA COSTA","s/n","78.790-000","CENTRO","65 34911491","escola.11231@edu.mt.gov.br",-17.2082,-54.1477,483],["14826","EECM ANTÔNIO FERREIRA SOBRINHO",10,"JACIARA","ESCOLA CÍVICO-MILITAR/INTEGRAL/ESPORTE","U","Avenida Piracicaba","1030","78.820-000","CENTRO","66 34611902","escola.14826@edu.mt.gov.br",-15.9692,-54.9673,155],["14850","EE CELESTINO CORRÊA DA COSTA",10,"JACIARA","ESCOLA CAMPO","R","AVENIDA PRINCIPAL","521","78.820-000","Distrito de Celma","66 34091016","escola.14850@edu.mt.gov.br",-15.6557,-55.0776,66],["192163","EE MILITAR TIRADENTES MODELO SANTO ANTÔNIO",10,"JACIARA","ESCOLA MILITAR","U","Rua Irahy","778","78.820-000","SANTO ANTÔNIO","66 34611329","escola.192163@edu.mt.gov.br",-15.9514,-54.9712,592],["14893","EECM MILTON DA COSTA FERREIRA",10,"JACIARA","ESCOLA CÍVICO-MILITAR","U","RUA CECI","1238","78.820-000","JARDIM AEROPORTO","66 9927-9471","escola.14893@edu.mt.gov.br",-15.9449,-54.9768,392],["14869","EECM PREFEITO ARTUR RAMOS",10,"JACIARA","ESCOLA CÍVICO-MILITAR","U","RUA MOEMA","1079","78.820-000","CENTRO","66 34611431","escola.14869@edu.mt.gov.br",-15.9665,-54.9654,503],["14885","EE SÃO FRANCISCO",10,"JACIARA","CONFESSIONAL","U","Avenida Antonio Ferreira Sobrinho","1536","78.820-000","CENTRO","66 999891933","escola.14885@edu.mt.gov.br",-15.9632,-54.9696,533],["14940","EECM DOM VUNIBALDO",10,"JUSCIMEIRA","ESCOLA CÍVICO-MILITAR/CAMPO","R","AV. ALMIRANTE BARROSO","782","78.810-000","CENTRO","66 34411077","escola.14940@edu.mt.gov.br",-16.3154,-54.9381,201],["14982","EECM JOÃO MATHEUS BARBOSA",10,"JUSCIMEIRA","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","RUA DR. CASTILHO","966","78.810-000","CENTRO","66 992587808","escola.14982@edu.mt.gov.br",-16.0535,-54.8867,159],["15008","EECM SANTA ELVIRA",10,"JUSCIMEIRA","ESCOLA CÍVICO-MILITAR/CAMPO/INTEGRAL","R","RUA GENI","670","78.810-000","DISTRITO DE SANTA ELVIRA","66 34551141","escola.15008@edu.mt.gov.br",-16.1642,-54.7968,131],["14958","EECM ANTÔNIO JOSÉ DE LIMA",10,"JUSCIMEIRA","ESCOLA CÍVICO-MILITAR","U","RUA: EMANUEL PINHEIRO","183","78.810-000","CENTRO","66 34121375","escola.14958@edu.mt.gov.br",-16.0527,-54.8832,597],["11207","EECM 13 DE MAIO",10,"PEDRA PRETA","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","AV. FERNANDO CORREA DA COSTA","844","78.795-000","CENTRO","66 34861237","escola.11207@edu.mt.gov.br",-16.6217,-54.4763,207],["11215","EECM SÃO PEDRO APÓSTOLO",10,"PEDRA PRETA","ESCOLA CÍVICO-MILITAR","U","AV PRESIDENTE VARGAS","220","78.795-000","CENTRO","66 997126523","escola.11215@edu.mt.gov.br",-16.6184,-54.4772,450],["11193","EECM 10 DE DEZEMBRO",10,"PEDRA PRETA","ESCOLA CÍVICO-MILITAR","U","AV. FREI SERVACIO","580","78.795-000","CENTRO","66 34861209","escola.11193@edu.mt.gov.br",-16.6193,-54.4722,1097],["11185","EE 7 DE SETEMBRO",10,"RONDONÓPOLIS","ESCOLA CAMPO","R","Rua Emilia Costa Prado","270","78.754-000","Nova Galiléia","66 99986992","escola.11185@edu.mt.gov.br",-16.6003,-54.3649,206],["10871","EE ADOLFO AUGUSTO DE MORAES",10,"RONDONÓPOLIS","ESCOLA INTEGRAL/LÍNGUAS","U","Avenida Padre Anchieta","937","78.740-031","Vila Aurora I","66 30220293","escola.10871@edu.mt.gov.br",-16.4758,-54.6213,273],["10880","EE DANIEL MARTINS MOURA",10,"RONDONÓPOLIS","ESCOLA","U","AVENIDA DEPUTADO EMANUEL PINHEIRO","2700","78.720-400","JARDIM MODELO - DISTRITO DE V. OPERARIA","66 34263006","escola.10880@edu.mt.gov.br",-16.443,-54.6233,732],["11142","EECM EMANUEL PINHEIRO",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","RUA 13 DE MAIO","1037","78.700-160","CENTRO","66 30230262","escola.11142@edu.mt.gov.br",-16.4665,-54.6345,462],["11061","EECM JOSÉ MORAES",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","Rua Harolda Duetti Silva","244","78.725-220","JARDIM PRIMAVERA","66 34262665","escola.11061@edu.mt.gov.br",-16.4509,-54.6148,400],["10960","EE JOSÉ RODRIGUES DOS SANTOS",10,"RONDONÓPOLIS","ESCOLA CAMPO","R","Rua Santa Catarina","s/n","78.752-000","Distrito de Boa Vista","66 34642061","escola.10960@edu.mt.gov.br",-16.2148,-54.7818,435],["10928","EECM JOSÉ SALMEN HANZE",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","Rua Mascarenhas de Moraes","764","78.705-200","Cidade Salmen","66 992054367","escola.10928@edu.mt.gov.br",-16.4711,-54.65,235],["11134","EE LA SALLE",10,"RONDONÓPOLIS","CONFESSIONAL","U","RUA 13 DE MAIO","1699","78.710-080","LA SALLE","66 34267706","escola.11134@edu.mt.gov.br",-16.4626,-54.6385,892],["10863","EECM LUCAS PACHECO DE CAMARGO",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","RUA E","1","78715317","JARDIM VERA CRUZ","66 34233787","escola.10863@edu.mt.gov.br",-16.4486,-54.6308,191],["10995","EE MAJOR OTÁVIO PITALUGA",10,"RONDONÓPOLIS","ESCOLA","U","AV. AMAZONAS","789","78.700-050","CENTRO","66 30222196","escola.10995@edu.mt.gov.br",-16.4727,-54.6324,1516],["10979","EECM MARIA DE LIMA CADIDÉ",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","Avenida São João","1177","78.720-618","Vila Operária","66 34236863","escola.10979@edu.mt.gov.br",-16.4386,-54.6245,951],["49883","EE MILITAR DOM PEDRO II ANDRÉ ANTÔNIO MAGGI",10,"RONDONÓPOLIS","ESCOLA MILITAR","U","Avenida Rotary Internacional","1006","78.730-234","Nucleo Habitacional Participacao","66 34224577","escola.49883@edu.mt.gov.br",-16.4631,-54.6095,1160],["196509","EE MILITAR TIRADENTES MAJOR PM ERNESTINO VERÍSSIMO DA SILVA",10,"RONDONÓPOLIS","ESCOLA MILITAR","U","RUA D","450","78745623","JARDIM MARIA TEREZA","66 34261273","escola.196509@edu.mt.gov.br",-16.4793,-54.6641,1203],["11002","EECM PINDORAMA",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR/INTEGRAL/ESPORTE","U","Rua Augusto de Moraes","990","78.710-790","Santa Cruz","66 30233810","escola.11002@edu.mt.gov.br",-16.4595,-54.6301,320],["11070","EECM PROFESSOR DOMINGOS APARECIDO DOS SANTOS",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","RUA CLEMENTINA DUARTE AQUINO","s/n","78.715-437","NUCLEO HABITACIONAL SÃO JOSÉ II","66 34261899","escola.11070@edu.mt.gov.br",-16.4353,-54.6401,983],["44245","EECM PROFESSORA AMÉLIA DE OLIVEIRA SILVA",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","Rua das Andorinhas, Qd 67","267","78.750-235","Residencial Parque Universitário","66 99675363","escola.44245@edu.mt.gov.br",-16.4626,-54.6706,827],["192139","EECM PROFESSORA STELA MARIS VALERIANO DA SILVA",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","RUA OITO - RESIDENCIAL EDELMINA QUERUBIM MARCHETTI","s/n","78.717-535","LOTEAMENTO CARLOS BEZERRA II","66 984121448","escola.192139@edu.mt.gov.br",-16.4194,-54.6364,200],["11118","EECM RAMIRO BERNARDO DA SILVA",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","RUA LUIZ CLEMENTE","175","78.710-535","JARDIM PINDORAMA II","66 34267061","escola.11118@edu.mt.gov.br",-16.4513,-54.6402,556],["10901","EE SAGRADO CORAÇÃO DE JESUS",10,"RONDONÓPOLIS","CONFESSIONAL","U","AVENIDA CUIABÁ","1073","78.700-090","CENTRO","66 34213602","escola.10901@edu.mt.gov.br",-16.4702,-54.6313,757],["49794","EE SANTO ANTÔNIO",10,"RONDONÓPOLIS","CONFESSIONAL","U","RUA FRANCISCO FELIX","274","78.700-499","VILA SANTO ANTONIO","66 34216871","escola.49794@edu.mt.gov.br",-16.4629,-54.6237,1025],["10910","EE SÃO JOSÉ OPERÁRIO",10,"RONDONÓPOLIS","CONFESSIONAL","U","AVENIDA BANDEIRANTES","5636","78.720-587","VILA OPERARIA","66 34254261","escola.10910@edu.mt.gov.br",-16.4389,-54.618,903],["10855","EECM SILVESTRE GOMES JARDIM",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR/INTEGRAL/ESPORTE","U","Rua Presidente Costa e Silva","1365","78.714-269","Vila Mariana","66 34211572","escola.10855@edu.mt.gov.br",-16.4385,-54.6318,238],["145769","EECM FRANCISCA BARROS DE CARVALHO",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","Avenida Pastor José Francisco da Silva","2647","78.750-736","Vila Olinda II","66 9909-9789","escola.145769@edu.mt.gov.br",-16.4648,-54.6777,745],["11126","EECM JOAQUIM NUNES ROCHA",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","AVENIDA BAHIA","764","78.705-090","VILA SALMEN","66 34214011","escola.11126@edu.mt.gov.br",-16.4708,-54.6475,818],["11010","EECM MARECHAL DUTRA",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","Rua Afonso Pena","695","78.700-070","CENTRO","66 30261022","escola.11010@edu.mt.gov.br",-16.472,-54.6354,975],["192147","EECM PROFESSORA EDITH PEREIRA BARBOSA",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","Rua Maria Irene Rodrigues Oliveira","SN","78.734-502","RESIDENCIAL SÍTIO FARIAS","66 34223716","escola.192147@edu.mt.gov.br",-16.4936,-54.5918,879],["11045","EECM PROFESSORA ELIZABETH DE FREITAS MAGALHÃES",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","RUA CARLOS PEREIRA BARBOSA","68","78.735-665","JARDIM ATLANTICO","66 34220633","escola.11045@edu.mt.gov.br",-16.4709,-54.5781,1727],["10952","EECM PROFESSORA EUNICE SOUZA DOS SANTOS",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","RUA DOM PEDRO II","4154","78.710-230","MONTE LIBANO","66 34266256","escola.10952@edu.mt.gov.br",-16.4448,-54.6511,782],["38636","EECM PROFESSORA MARIA ELZA FERREIRA INÁCIO",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","Rua Airton A. Santana","s/n","78.715-576","Residencial Marechal Rondon","66 9965-790","escola.38636@edu.mt.gov.br",-16.43,-54.6531,940],["43133","EECM LUDOVICO VIEIRA CAMARGO",10,"SÃO JOSÉ DO POVO","ESCOLA CÍVICO-MILITAR","U","RUA ZANETE FERREIRA CARDINAL","690","78.773-000","CENTRO","66 34941071","escola.43133@edu.mt.gov.br",-16.4669,-54.2567,208],["14877","EECM IRMÃ MIGUELINA CORSO",10,"SÃO PEDRO DA CIPA","ESCOLA CÍVICO-MILITAR","U","Rua São Paulo","245","78.835-000","CENTRO","66 34181214","escola.14877@edu.mt.gov.br",-16.0017,-54.9195,352],["44180","EE 15 DE OUTUBRO",10,"TESOURO","ESCOLA CÍVICO-MILITAR","U","RUA MARECHAL RONDON","381","78.775-000","CENTRO","66 34351133","escola.44180@edu.mt.gov.br",-16.0829,-53.5522,214],["124028","EEI MAYROWI APIAKÁ",11,"APIACÁS","ESCOLA INDÍGENA","R","ALDEIA MAYROWI","SN","78.595-000","ALDEIA","66 99909284","escola.124028@edu.mt.gov.br",-7.8062,-57.8786,69],["116033","EECM CRISTIANO ARAÚJO PIRES",11,"BOA ESPERANÇA DO NORTE","ESCOLA CÍVICO-MILITAR","U","RUA DOS JAMBOS","34","78.887-000","CENTRO","66 981367296","escola.116033@edu.mt.gov.br",-13.5141,-55.1482,518],["172456","EE DOROTHY STANG",11,"CLÁUDIA","ESCOLA CAMPO","R","Estrada Valdirene Km35 Assentamento Keno","0","78.540-000","Zona Rural","66 996681379","escola.172456@edu.mt.gov.br",-11.2579,-54.9264,104],["172081","EE FLORESTAN FERNANDES",11,"CLÁUDIA","ESCOLA CAMPO","R","ASSENTAMENTO 12 DE OUTUBRO, BR 163","KM 890","78.540-000","rural","66 999172788","escola.172081@edu.mt.gov.br",-11.3819,-55.3726,58],["13374","EECM MANOEL SOARES CAMPOS",11,"CLÁUDIA","ESCOLA CÍVICO-MILITAR","U","RUA DOM AQUINO CORREA S/N","0","78.540-000","CENTRO","66 996314509","escola.13374@edu.mt.gov.br",-11.5037,-54.8745,850],["158330","EECM ANDRÉ ANTÔNIO MAGGI",11,"COLÍDER","ESCOLA CÍVICO-MILITAR","U","RUA BORBA GATO","80","78.500-000","SETOR OESTE","66 996827608","escola.158330@edu.mt.gov.br",-10.7962,-55.4665,489],["13471","EE CAFENORTE",11,"COLÍDER","ESCOLA CAMPO","R","Comunidade Café Norte","0","78.500-000","Zona Rural","66 992017293","escola.13471@edu.mt.gov.br",-10.6203,-55.4214,79],["13404","EECM DESEMBARGADOR MILTON ARMANDO POMPEU DE BARROS",11,"COLÍDER","ESCOLA CÍVICO-MILITAR","U","AVENIDA JAIME VERISSIMO DE CAMPOS JUNIOR - SETOR LESTE","285","78.500-000","CENTRO","66 35411337","escola.13404@edu.mt.gov.br",-10.8092,-55.4547,704],["13412","EE MILITAR DOM PEDRO II 2º TENENTE BM KLEIBER RODRIGUES ALVES",11,"COLÍDER","ESCOLA MILITAR","U","AV. IZABEL MARTINS SIMONE","159","78.500-000","TORRE - SETOR OESTE","66 996344457","escola.13412@edu.mt.gov.br",-10.8027,-55.4635,446],["13420","EE NOVA GALILEIA",11,"COLÍDER","ESCOLA CAMPO","R","Comunidade Nova Galileia","0","78.500-000","Zona Rural","66 996895108","escola.13420@edu.mt.gov.br",-10.5793,-55.5244,51],["13455","EE PALMITAL",11,"COLÍDER","ESCOLA CAMPO/INTEGRAL/MISTA","R","AVENIDA MOGNO - COMUNIDADE MARCO DE CIMENTO","250","78.500-000","Zona Rural","66 996035788","escola.13455@edu.mt.gov.br",-10.4129,-55.4971,75],["154016","EECM PROFESSORA ALZIRA MARIA DA SILVA",11,"COLÍDER","ESCOLA CÍVICO-MILITAR","U","AV. MAL. DEODORO DA FONSECA","307","78.500-000","CENTRO","66 996238252","escola.154016@edu.mt.gov.br",-10.8056,-55.4559,798],["124923","EECM ANDRÉ ANTÔNIO MAGGI",11,"FELIZ NATAL","ESCOLA CÍVICO-MILITAR","U","RUA ITAPIRANGA","111","78.885-000","CENTRO","66 999731769","escola.124923@edu.mt.gov.br",-12.3878,-54.9383,728],["120936","EECM ANDRÉ ANTÔNIO MAGGI",11,"IPIRANGA DO NORTE","ESCOLA CÍVICO-MILITAR","U","RUA DOS GIRASSOIS","511","78.578-000","CENTRO","66 996030866","escola.120936@edu.mt.gov.br",-12.2408,-56.1478,845],["124109","EECM BROMILDO LAWISCH",11,"ITANHANGÁ","ESCOLA CÍVICO-MILITAR","U","Rua Primavera","101","78.579-000","CENTRO","66 981249755","escola.124109@edu.mt.gov.br",-12.2357,-56.6444,691],["13560","EECM PAPA JOÃO PAULO II",11,"ITAÚBA","ESCOLA CÍVICO-MILITAR","U","Avenida Brasil","504","78.510-000","CENTRO","66 35611302","escola.13560@edu.mt.gov.br",-11.0101,-55.2459,508],["16470","EECM DOM BOSCO",11,"LUCAS DO RIO VERDE","ESCOLA CÍVICO-MILITAR","U","Avenida Mato Grosso","2191","78462041","RIO VERDE","65 996155139","escola.16470@edu.mt.gov.br",-13.0781,-55.9066,1454],["154172","EE LUIZ CARLOS CECONELLO",11,"LUCAS DO RIO VERDE","ESCOLA","U","Rua do Otimismo","","78464-020","VIDA NOVA","","escola.154172@edu.mt.gov.br",-13.105,-55.9179,345],["198226","EECM MÁRCIO SCHABATT SOUZA",11,"LUCAS DO RIO VERDE","ESCOLA CÍVICO-MILITAR","U","AVENIDA SERGIPE","1120-S","78466088","VENEZA","65 999964159","escola.198226@edu.mt.gov.br",-13.0884,-55.9115,1014],["197297","EE MILITAR TIRADENTES SOLDADO PM ADRIANA MORAIS RAMOS",11,"LUCAS DO RIO VERDE","ESCOLA MILITAR","U","AVENIDA INDEPENDENCIA","815 W","78460613","BANDEIRANTES","65 99285404","escola.197297@edu.mt.gov.br",-13.0539,-55.9347,877],["38512","EECM ÂNGELO NADIN",11,"LUCAS DO RIO VERDE","ESCOLA CÍVICO-MILITAR","U","RUA AMOR-PERFEITO","1590w","78460528","BANDEIRANTES","65 993420247","escola.38512@edu.mt.gov.br",-13.0681,-55.9342,1061],["184586","EECM MANOEL DE BARROS",11,"LUCAS DO RIO VERDE","ESCOLA CÍVICO-MILITAR","U","RUA NELSON RIGO","2851-S","78464159","Parque das Américas","65 99961817","escola.184586@edu.mt.gov.br",-13.1082,-55.9067,960],["69612","EE GRÁCIA EDMUNDO ZEFERINO",11,"NOVA SANTA HELENA","ESCOLA","U","RUA RIO DE JANEIRO","000","78513000","CENTRO","66 35231128","escola.69612@edu.mt.gov.br",-10.8512,-55.1814,387],["77895","EE 19 DE DEZEMBRO",11,"NOVA UBIRATÃ","ESCOLA","U","RUA MARANHÃO","1550","78.888-000","CENTRO","66 999279810","escola.77895@edu.mt.gov.br",-13.0316,-55.2498,819],["173371","EE PEDRO BARBOSA",11,"NOVA UBIRATÃ","ESCOLA CAMPO","R","RUA DOS PEQUIS","18","78.888-000","DISTRITO ENTRE RIOS","66 997179467","escola.173371@edu.mt.gov.br",-12.4567,-54.347,156],["13366","EE NOSSA SENHORA APARECIDA",11,"SANTA CARMEM","ESCOLA","U","Avenida Alvorada","421","78.545-000","CENTRO","66 999263902","escola.13366@edu.mt.gov.br",-11.9796,-55.2811,177],["174122","EE BOM JARDIM",11,"SINOP","ESCOLA","U","Quadra 06 lote 4","1","78.559-006","BOM JARDIM","66 999238952","escola.174122@edu.mt.gov.br",-11.8578,-55.503,278],["194522","EE CARLOS DRUMMOND DE ANDRADE",11,"SINOP","ESCOLA CAMPO","R","ASSENTAMENTO WESLEY MANOEL DOS SANTOS - AGROVILA NOVA","0","78.559-899","ÁREA RURAL DE SINOP","66 996830059","escola.194522@edu.mt.gov.br",-11.4991,-55.6936,134],["173770","EE JORGE AMADO",11,"SINOP","ESCOLA","U","RUA JOAO PEDRO MOREIRA DE CARVALHO LOTES 03 E 04","558","78.559-106","CHACARAS SINOP","66 996590367","escola.173770@edu.mt.gov.br",-11.9026,-55.5053,748],["214159","EE MILITAR TIRADENTES 2º SARGENTO PM CLAUDEMIR FRANÇA MACIEL",11,"SINOP","ESCOLA MILITAR","U","ESTRADA CLAUDETE","442-A","78.555-810","JARDIM CURITIBA","66 36891124","escola.214159@edu.mt.gov.br",-11.891,-55.532,596],["13242","EECM NILZA DE OLIVEIRA PIPINO",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","RUA DOS LIRIOS","460","78.550-007","SETOR RESIDENCIAL SUL","66 35312173","escola.13242@edu.mt.gov.br",-11.8608,-55.5,1258],["64149","EECM PAULO FREIRE",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","RUA DAS ALFAZEMAS","740","78.552-400","JARDIM OLIVEIRAS","66 35325222","escola.64149@edu.mt.gov.br",-11.8267,-55.5078,915],["173762","EE PROFESSOR DJALMA GUILHERME DA SILVA",11,"SINOP","ESCOLA","U","RUA DAS CELESTINAS","135","78.552-555","JARDIM DAS ORQUÍDEAS","66 999846306","escola.173762@edu.mt.gov.br",-11.8234,-55.4969,1094],["91448","EECM PROFESSORA EDELI MANTOVANI",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","RUA CARLOS EDUARDO, QUADRA 17","770","78.553-531","JARDIM SÃO PAULO I","66 996784372","escola.91448@edu.mt.gov.br",-11.8258,-55.5187,1854],["76180","EECM PROFESSORA MARIA DE FÁTIMA GIMENEZ LOPES",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","RUA DAS JABUTICABEIRAS","761","78.556-646","JD.CELESTE","66 999438982","escola.76180@edu.mt.gov.br",-11.8818,-55.5115,670],["172642","EECM PROFESSORA ZENI VIEIRA",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","RUA AUGUSTA","71","78.556-794","JARDIM IBIRAPUERA","66 999191725","escola.172642@edu.mt.gov.br",-11.8888,-55.5119,1091],["124869","EE RENÉE MENEZES",11,"SINOP","ESCOLA CAMPO","U","RUA DO BAGRE","10","78.550-001","CAMPING CLUB","66 999696411","escola.124869@edu.mt.gov.br",-11.7022,-55.4463,429],["13331","EE ROSA DOS VENTOS",11,"SINOP","ESCOLA","U","RUA DAS PAINEIRAS","1400","78.555-058","JARDIM IMPERIAL","66 999062262","escola.13331@edu.mt.gov.br",-11.8397,-55.5168,708],["13285","EE SÃO VICENTE DE PAULA",11,"SINOP","ESCOLA","U","RUA COLONIZADOR ENIO PIPINO","455","78.557-484","SÃO CRISTÓVÃO","66 984322573","escola.13285@edu.mt.gov.br",-11.8977,-55.5053,1337],["158399","EECM CLEUFA HUBNER",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","RUA DAS GAIVOTAS","565","78556400","JARDIM DAS NAÇÕES","66 99644623","escola.158399@edu.mt.gov.br",-11.8585,-55.5303,1029],["13250","EECM ÊNIO PIPINO",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","RUA DAS AVENCAS","2261","78.550-178","SETOR COMERCIAL","66 999763705","escola.13250@edu.mt.gov.br",-11.8501,-55.5065,1100],["13340","EECM NOSSA SENHORA DA GLÓRIA",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","BR 163 km","821","78.558-490","ALTO DA GLORIA","66 99685697","escola.13340@edu.mt.gov.br",-11.9816,-55.5165,1054],["13307","EECM NOSSA SENHORA DE LOURDES",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","Av. Rute de Souza Silva","471","78.557-515","Industrial","66 992436677","escola.13307@edu.mt.gov.br",-11.8695,-55.4927,862],["13269","EECM OLÍMPIO JOÃO PISSINATTI GUERRA",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","RUA DAS BILBERGIAS","422","78.550-389","JARDIM PRIMAVERA","66 35317228","escola.13269@edu.mt.gov.br",-11.8446,-55.497,910],["212474","EEDIEB BENEDITO SANTANA DA SILVA FREIRE",11,"SINOP","ESCOLA","U","RUA DAS AVENCAS","847","78.550-070","SETOR COMERCIAL","66 35320408","escola.212474@edu.mt.gov.br",-11.8624,-55.5098,806],["192210","EECM ARLETE MARIA CAPPELLARI",11,"SORRISO","ESCOLA CÍVICO-MILITAR","U","Rua Rosa dos Ventos","1052","78.890-001","Rota do Sol","66 996869802","escola.192210@edu.mt.gov.br",-12.5789,-55.7436,996],["38598","EECM IGNÁCIO SCHEVINSKI FILHO",11,"SORRISO","ESCOLA CÍVICO-MILITAR","U","RUA PASSO FUNDO","1243","78.890-001","BAIRRO INDUSTRIAL I","66 992010551","escola.38598@edu.mt.gov.br",-12.5592,-55.7107,1775],["156434","EECM JOSÉ DOMINGOS FRAGA",11,"SORRISO","ESCOLA CÍVICO-MILITAR","U","RUA TENENTE LIRA","1291","78.890-001","RESIDENCIAL VILLAGE","65 999747423","escola.156434@edu.mt.gov.br",-12.5343,-55.7423,1200],["16500","EECM MÁRIO SPINELLI",11,"SORRISO","ESCOLA CÍVICO-MILITAR","U","AVENIDA BLUMENAU","1831","78.894-038","MORADA DO SOL","66 992345029","escola.16500@edu.mt.gov.br",-12.5514,-55.73,1425],["194948","EE MILITAR TIRADENTES CABO ANTÔNIO DILCEU DA SILVA AMARAL",11,"SORRISO","ESCOLA MILITAR","U","AVENIDA NOÊMIA TONELLO DALMOLIN","2499","78893110","PARQUE UNIVERSITÁRIO","65 992231011","escola.194948@edu.mt.gov.br",-12.552,-55.7203,1428],["16519","EECM 13 DE MAIO",11,"SORRISO","ESCOLA CÍVICO-MILITAR","U","RUA ALTA FLORESTA","189","78.890-174","CENTRO","66 996656960","escola.16519@edu.mt.gov.br",-12.5439,-55.7279,1316],["102326","EE ALFREDO TREUHERZ",11,"TABAPORÃ","ESCOLA CAMPO","R","AVENIDA DOS PRIMEIROS","s/nº","78.563-000","AGROVILA NOVA FRONTEIRA","66 984280768","escola.102326@edu.mt.gov.br",-11.3057,-56.2642,212],["49964","EECM FRANCISCO SALDANHA NETO",11,"TABAPORÃ","ESCOLA CÍVICO-MILITAR","U","RUA VILAS BOAS","1185","78.563-000","CENTRO","66 35571206","escola.49964@edu.mt.gov.br",-11.304,-56.8115,456],["156000","EE PROFESSORA ZULEIDE DOS SANTOS BARROS",11,"TABAPORÃ","ESCOLA CAMPO","R","RUA 4, QUADRA 8","0","78.563-000","DISTRITO de AMERICANA DO NORTE","66 36021021","escola.156000@edu.mt.gov.br",-11.6373,-56.1427,212],["16543","EECM CÂNDIDO PORTINARI",11,"TAPURAH","ESCOLA CÍVICO-MILITAR","U","RUA DOS ANGICOS","1602","78.573-000","Cristo Rei","66 992384015","escola.16543@edu.mt.gov.br",-12.7405,-56.5103,1286],["65587","EECM IVALDINO FRÂNCIO",11,"UNIÃO DO SUL","ESCOLA CÍVICO-MILITAR","U","RUA JABORÁ","183","78.543-000","SÃO LUIZ","66 992424397","escola.65587@edu.mt.gov.br",-11.5277,-54.3679,442],["13358","EECM NOSSA SENHORA DO PERPÉTUO SOCORRO",11,"VERA","ESCOLA CÍVICO-MILITAR","U","Av. Nicarágua","2024","78.880-000","CENTRO","66 999318959","escola.13358@edu.mt.gov.br",-12.2868,-55.2942,1045],["14508","EE 07 DE SETEMBRO",12,"BARRA DO BUGRES","ESCOLA CAMPO","R","RUA SETE DE SETEMBRO","55","78.390-000","Distrito Assari","65 996262163","escola.14508@edu.mt.gov.br",-14.8762,-57.1757,211],["14435","EECM ALFREDO JOSÉ DA SILVA",12,"BARRA DO BUGRES","ESCOLA CÍVICO-MILITAR/INTEGRAL/ESPORTE","U","RUA TAMOIOS","55","78.390-000","MARACANÃ","65 996423997","escola.14435@edu.mt.gov.br",-15.0689,-57.1924,315],["14451","EECM JOÃO DE CAMPOS BORGES",12,"BARRA DO BUGRES","ESCOLA CÍVICO-MILITAR","U","RUA B S/N","0","78.390-000","MARACANÃ - COHAB NHAMBIQUARA","65 996916461","escola.14451@edu.mt.gov.br",-15.0656,-57.1965,423],["14460","EECM JÚLIO MÜLLER",12,"BARRA DO BUGRES","ESCOLA CÍVICO-MILITAR","U","RUA SÃO BENEDITO","701","78.390-000","CENTRO","65 33611244","escola.14460@edu.mt.gov.br",-15.072,-57.1805,607],["14419","EE PROFESSORA JULIETA XAVIER BORGES",12,"BARRA DO BUGRES","ESCOLA INTEGRAL","U","AV. DEP. EMANUEL PINHEIRO","100","78.390-000","SÃO RAIMUNDO","65 998075878","escola.14419@edu.mt.gov.br",-15.0612,-57.1751,232],["44938","EE SABINO FERREIRA MAIA",12,"BARRA DO BUGRES","ESCOLA CAMPO","R","Rua Goias","s/n","78.390-000","Distrito de Currupira","65 996045001","escola.44938@edu.mt.gov.br",-15.1106,-56.8583,84],["14478","EECM DEPUTADO RENÊ BARBOUR",12,"BARRA DO BUGRES","ESCOLA CÍVICO-MILITAR","U","Rua B","s/n","78.390-000","Residencial Roosevelt","65 999151153","escola.14478@edu.mt.gov.br",-15.0633,-57.198,926],["109436","EEI JULA PARÉ",12,"BARRA DO BUGRES","ESCOLA INDÍGENA/INTEGRAL","R","ALDEIA UMUTINA","s/n","78.390-000","Zona Rural","65 99948829","escola.109436@edu.mt.gov.br",-15.0887,-57.1088,68],["45055","EE ARGEU AUGUSTO DE MORAES",12,"CAMPO NOVO DO PARECIS","ESCOLA CAMPO","R","AVENIDA ARGEU AUGUSTO DE MORAES","s/n","78.360-000","FAZENDA ITAMARATI NORTE","65 33491131","escola.45055@edu.mt.gov.br",-14.319,-57.9673,226],["176451","EE MARECHAL CÂNDIDO RONDON",12,"CAMPO NOVO DO PARECIS","ESCOLA CAMPO","R","Rodovia 364","s/nº","78.360-000","DISTRITO MARECHAL RONDON","65 99293195","escola.176451@edu.mt.gov.br",-13.2974,-58.0361,182],["71773","EE PADRE ARLINDO IGNÁCIO DE OLIVEIRA",12,"CAMPO NOVO DO PARECIS","ESCOLA INTEGRAL","U","AVENIDA AMAZONAS QUADRA 271","100","78.360-000","JARDIM DAS PALMEIRAS","65 33824084","escola.71773@edu.mt.gov.br",-13.6547,-57.9049,286],["176800","EECM PARECIS",12,"CAMPO NOVO DO PARECIS","ESCOLA CÍVICO-MILITAR","U","Avenida Amapá","614","78.360-000","Jardim Olenka","65 992625794","escola.176800@edu.mt.gov.br",-13.649,-57.9054,1451],["163678","EECM UNIÃO DA CHAPADA",12,"CAMPO NOVO DO PARECIS","ESCOLA CÍVICO-MILITAR","R","FAZENDA UNIÃO","SN","78.360-000","Zona Rural","65 999877104","escola.163678@edu.mt.gov.br",-13.6296,-57.9126,702],["16055","EECM MADRE TARCILA",12,"CAMPO NOVO DO PARECIS","ESCOLA CÍVICO-MILITAR","U","RUA GOIÁS","700","78.360-000","CENTRO","65 999223453","escola.16055@edu.mt.gov.br",-13.6605,-57.8876,1293],["14516","EECM DOUTOR JOAQUIM AUGUSTO DA COSTA MARQUES",12,"DENISE","ESCOLA CÍVICO-MILITAR","U","Rua 7 de Setembro","621","78.380-000","CENTRO","65 998083554","escola.14516@edu.mt.gov.br",-14.7266,-57.0489,676],["16047","EECM JOÃO MONTEIRO SOBRINHO",12,"NOVA OLÍMPIA","ESCOLA CÍVICO-MILITAR/INTEGRAL","U","AVENIDA FRANCISCO JOSE BERNARDO","554","78.370-000","OURO VERDE","65 996351505","escola.16047@edu.mt.gov.br",-14.7754,-57.2819,241],["96784","EE REINALDO DUTRA VILARINHO",12,"NOVA OLÍMPIA","ESCOLA CAMPO/INTEGRAL","R","Agrovila Assentamento Rio Branco - agrovila","s/n","78.370-000","Zona Rural","65 99678125","escola.96784@edu.mt.gov.br",-14.8623,-57.6823,63],["15954","EECM WILSON DE ALMEIDA",12,"NOVA OLÍMPIA","ESCOLA CÍVICO-MILITAR","U","Av. Mato Grosso","454","78.370-000","CENTRO","65 998171573","escola.15954@edu.mt.gov.br",-14.7845,-57.2905,569],["157236","EECM PROFESSORA FRANCISCA DE SOUZA ALENCAR",12,"NOVA OLÍMPIA","ESCOLA CÍVICO-MILITAR","U","RUA 34, QUADRAS 40 E 41","0","78.370-000","JARDIM DAS OLIVEIRAS","65 33321816","escola.157236@edu.mt.gov.br",-14.7853,-57.273,615],["14486","EECM REGINA TENÓRIO DE OLIVEIRA",12,"PORTO ESTRELA","ESCOLA CÍVICO-MILITAR","U","Rua Getulio Vargas","1","78.398-000","CENTRO","65 996079886","escola.14486@edu.mt.gov.br",-15.3354,-57.201,272],["154040","EECM ANDRÉ ANTÔNIO MAGGI",12,"SAPEZAL","ESCOLA CÍVICO-MILITAR","U","AVENIDA ANTONIO ANDRÉ MAGGI","1870","78.365-000","JARDIM IPÊ","65 996155483","escola.154040@edu.mt.gov.br",-13.5477,-58.8213,1162],["14532","EE PROFESSOR JOSÉ ARI DE OLIVEIRA",12,"SAPEZAL","ESCOLA","U","RUA PROJETADA 7","753NW","78367268","CENTRO","","escola.14532@edu.mt.gov.br",-13.5325,-58.843,471],["156370","EECM LUIZ FRUTUOSO DA SILVA",12,"SAPEZAL","ESCOLA CÍVICO-MILITAR","U","AVENIDA DO JÁU","1690 S","78.365-000","CENTRO","65 992887395","escola.156370@edu.mt.gov.br",-13.5462,-58.8198,1232],["15873","EECM 13 DE MAIO",12,"TANGARÁ DA SERRA","ESCOLA CÍVICO-MILITAR","U","Avenida Brasil","1148 W","78.300-096","JARDIM ACÁCIA","65 99607489","escola.15873@edu.mt.gov.br",-14.6258,-57.496,1089],["15865","EECM 29 DE NOVEMBRO",12,"TANGARÁ DA SERRA","ESCOLA CÍVICO-MILITAR","U","RUA JOSÉ CÂNDIDO MELHORANÇA","37-E","78.300-118","CENTRO","65 99281287","escola.15865@edu.mt.gov.br",-14.618,-57.4835,966],["15920","EE ANTÔNIO HORTOLLANI",12,"TANGARÁ DA SERRA","ESCOLA CAMPO","R","Avenida 07 de Setembro","1","78.306-000","Distrito São Joaquim","65 99980055","escola.15920@edu.mt.gov.br",-14.644,-57.311,69],["23841","EECM DOUTOR HÉLCIO DE SOUZA",12,"TANGARÁ DA SERRA","ESCOLA CÍVICO-MILITAR","U","RUA CINCO","92","78.307-112","JARDIM NAZARÉ","65 99988197","escola.23841@edu.mt.gov.br",-14.6422,-57.4837,424],["15962","EE JONAS LOPES DA SILVA",12,"TANGARÁ DA SERRA","ESCOLA INTEGRAL/LÍNGUAS","U","RUA SEIS","1600E","78.301-106","JARDIM GOIÁS","65 30160336","escola.15962@edu.mt.gov.br",-14.6254,-57.4711,182],["213454","EE MILITAR TIRADENTES 1º TENENTE PM SALOMÃO FERNANDES FERREIRA PIOVESAN",12,"TANGARÁ DA SERRA","ESCOLA MILITAR","U","RUA MANOEL DIONÍSIO SOBRINHO","233-S","78300066","CENTRO","65 996351680","escola.213454@edu.mt.gov.br",-14.625,-57.4907,514],["15903","EE MINISTRO PETRÔNIO PORTELA NUNES",12,"TANGARÁ DA SERRA","ESCOLA CAMPO/INTEGRAL/MISTA","R","Rua Santa Catarina","1","78307899","DISTRITO SÃO JORGE","65 999802660","escola.15903@edu.mt.gov.br",-14.6612,-57.9453,268],["15890","EE PATRIARCA DA INDEPENDÊNCIA",12,"TANGARÁ DA SERRA","ESCOLA CAMPO/INTEGRAL/MISTA","R","Rua Diva Martins Junqueira","167 W","78.305-000","Progresso","65 99991578","escola.15890@edu.mt.gov.br",-14.6635,-57.362,172],["76198","EE PAULO FREIRE",12,"TANGARÁ DA SERRA","ESCOLA CAMPO","R","ÁREA RURAL","s/n","78307899","ÁREA RURAL DE TANGARÁ DA SERRA","65 99225090","escola.76198@edu.mt.gov.br",-14.8794,-57.7887,71],["16020","EECM PROFESSOR JOÃO BATISTA",12,"TANGARÁ DA SERRA","ESCOLA CÍVICO-MILITAR","U","AVENIDA ISMAEL JOSÉ DO NASCIMENTO","892","78.300-152","CENTRO - JARDIM EUROPA -SETOR NORTE","65 33291021","escola.16020@edu.mt.gov.br",-14.6116,-57.4836,849],["15989","EECM VEREADOR BENTO MUNIZ",12,"TANGARÁ DA SERRA","ESCOLA CÍVICO-MILITAR","U","RUA LUIZ FERNANDES DE MOURA","1320 N","78.303-061","JARDIM TARUMÃ","65 33291455","escola.15989@edu.mt.gov.br",-14.5989,-57.4907,791],["15970","EECM VEREADOR MANOEL MARINHEIRO",12,"TANGARÁ DA SERRA","ESCOLA CÍVICO-MILITAR","U","RUA AVELINA JACI BOHN","800-S","78.306-018","JARDIM RIO PRETO","65 33263847","escola.15970@edu.mt.gov.br",-14.6302,-57.4893,364],["15911","EECM VEREADOR RAMON SANCHES MARQUES",12,"TANGARÁ DA SERRA","ESCOLA CÍVICO-MILITAR/INTEGRAL/ESPORTE","U","RUA ALZIRO ZARUR","378-S","78.306-124","JARDIM CIDADE ALTA","65 999118850","escola.15911@edu.mt.gov.br",-14.6321,-57.4982,344],["15938","EECM PEDRO ALBERTO TAYANO",12,"TANGARÁ DA SERRA","ESCOLA CÍVICO-MILITAR","U","RUA 07","1980","78.305-197","VILA ESMERALDA","65 33252898","escola.15938@edu.mt.gov.br",-14.6326,-57.524,593],["15997","EECM PROFESSORA JADA TORRES",12,"TANGARÁ DA SERRA","ESCOLA CÍVICO-MILITAR","U","RUA VITÓRIA","171 W","78.303-528","JARDIM DONA JÚLIA","65 996351968","escola.15997@edu.mt.gov.br",-14.6126,-57.5079,506],["129259","EEI MALAMALALI",12,"TANGARÁ DA SERRA","ESCOLA INDÍGENA","R","ÁREA RURAL","0","78307899","ÁREA RURAL DE TANGARÁ DA SERRA","65 33262612","escola.129259@edu.mt.gov.br",-14.3806,-58.2336,58],["946079","EECM ARÃO GOMES BEZERRA",11,"SORRISO","ESCOLA CÍVICO-MILITAR","U","Av. Zilda Arns","0","78895-450","Mário Raiter","","escola.946079@edu.mt.gov.br",-12.5834,-55.7069,1015]];

/* topojson-client 3.1.0 (ISC, Mike Bostock), embutido */
if (!window.topojson) {
// https://github.com/topojson/topojson-client v3.1.0 Copyright 2019 Mike Bostock
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e=e||self).topojson=e.topojson||{})}(this,function(e){"use strict";function t(e){return e}function r(e){if(null==e)return t;var r,n,o=e.scale[0],a=e.scale[1],i=e.translate[0],c=e.translate[1];return function(e,t){t||(r=n=0);var u=2,f=e.length,s=new Array(f);for(s[0]=(r+=e[0])*o+i,s[1]=(n+=e[1])*a+c;u<f;)s[u]=e[u],++u;return s}}function n(e){var t,n=r(e.transform),o=1/0,a=o,i=-o,c=-o;function u(e){(e=n(e))[0]<o&&(o=e[0]),e[0]>i&&(i=e[0]),e[1]<a&&(a=e[1]),e[1]>c&&(c=e[1])}function f(e){switch(e.type){case"GeometryCollection":e.geometries.forEach(f);break;case"Point":u(e.coordinates);break;case"MultiPoint":e.coordinates.forEach(u)}}for(t in e.arcs.forEach(function(e){for(var t,r=-1,u=e.length;++r<u;)(t=n(e[r],r))[0]<o&&(o=t[0]),t[0]>i&&(i=t[0]),t[1]<a&&(a=t[1]),t[1]>c&&(c=t[1])}),e.objects)f(e.objects[t]);return[o,a,i,c]}function o(e,t){var r=t.id,n=t.bbox,o=null==t.properties?{}:t.properties,i=a(e,t);return null==r&&null==n?{type:"Feature",properties:o,geometry:i}:null==n?{type:"Feature",id:r,properties:o,geometry:i}:{type:"Feature",id:r,bbox:n,properties:o,geometry:i}}function a(e,t){var n=r(e.transform),o=e.arcs;function a(e,t){t.length&&t.pop();for(var r=o[e<0?~e:e],a=0,i=r.length;a<i;++a)t.push(n(r[a],a));e<0&&function(e,t){for(var r,n=e.length,o=n-t;o<--n;)r=e[o],e[o++]=e[n],e[n]=r}(t,i)}function i(e){return n(e)}function c(e){for(var t=[],r=0,n=e.length;r<n;++r)a(e[r],t);return t.length<2&&t.push(t[0]),t}function u(e){for(var t=c(e);t.length<4;)t.push(t[0]);return t}function f(e){return e.map(u)}return function e(t){var r,n=t.type;switch(n){case"GeometryCollection":return{type:n,geometries:t.geometries.map(e)};case"Point":r=i(t.coordinates);break;case"MultiPoint":r=t.coordinates.map(i);break;case"LineString":r=c(t.arcs);break;case"MultiLineString":r=t.arcs.map(c);break;case"Polygon":r=f(t.arcs);break;case"MultiPolygon":r=t.arcs.map(f);break;default:return null}return{type:n,coordinates:r}}(t)}function i(e,t){var r={},n={},o={},a=[],i=-1;function c(e,t){for(var n in e){var o=e[n];delete t[o.start],delete o.start,delete o.end,o.forEach(function(e){r[e<0?~e:e]=1}),a.push(o)}}return t.forEach(function(r,n){var o,a=e.arcs[r<0?~r:r];a.length<3&&!a[1][0]&&!a[1][1]&&(o=t[++i],t[i]=r,t[n]=o)}),t.forEach(function(t){var r,a,i=function(t){var r,n=e.arcs[t<0?~t:t],o=n[0];e.transform?(r=[0,0],n.forEach(function(e){r[0]+=e[0],r[1]+=e[1]})):r=n[n.length-1];return t<0?[r,o]:[o,r]}(t),c=i[0],u=i[1];if(r=o[c])if(delete o[r.end],r.push(t),r.end=u,a=n[u]){delete n[a.start];var f=a===r?r:r.concat(a);n[f.start=r.start]=o[f.end=a.end]=f}else n[r.start]=o[r.end]=r;else if(r=n[u])if(delete n[r.start],r.unshift(t),r.start=c,a=o[c]){delete o[a.end];var s=a===r?r:a.concat(r);n[s.start=a.start]=o[s.end=r.end]=s}else n[r.start]=o[r.end]=r;else n[(r=[t]).start=c]=o[r.end=u]=r}),c(o,n),c(n,o),t.forEach(function(e){r[e<0?~e:e]||a.push([e])}),a}function c(e,t,r){var n,o,a;if(arguments.length>1)n=function(e,t,r){var n,o=[],a=[];function i(e){var t=e<0?~e:e;(a[t]||(a[t]=[])).push({i:e,g:n})}function c(e){e.forEach(i)}function u(e){e.forEach(c)}return function e(t){switch(n=t,t.type){case"GeometryCollection":t.geometries.forEach(e);break;case"LineString":c(t.arcs);break;case"MultiLineString":case"Polygon":u(t.arcs);break;case"MultiPolygon":!function(e){e.forEach(u)}(t.arcs)}}(t),a.forEach(null==r?function(e){o.push(e[0].i)}:function(e){r(e[0].g,e[e.length-1].g)&&o.push(e[0].i)}),o}(0,t,r);else for(o=0,n=new Array(a=e.arcs.length);o<a;++o)n[o]=o;return{type:"MultiLineString",arcs:i(e,n)}}function u(e,t){var r={},n=[],o=[];function c(e){e.forEach(function(t){t.forEach(function(t){(r[t=t<0?~t:t]||(r[t]=[])).push(e)})}),n.push(e)}function u(t){return function(e){for(var t,r=-1,n=e.length,o=e[n-1],a=0;++r<n;)t=o,o=e[r],a+=t[0]*o[1]-t[1]*o[0];return Math.abs(a)}(a(e,{type:"Polygon",arcs:[t]}).coordinates[0])}return t.forEach(function e(t){switch(t.type){case"GeometryCollection":t.geometries.forEach(e);break;case"Polygon":c(t.arcs);break;case"MultiPolygon":t.arcs.forEach(c)}}),n.forEach(function(e){if(!e._){var t=[],n=[e];for(e._=1,o.push(t);e=n.pop();)t.push(e),e.forEach(function(e){e.forEach(function(e){r[e<0?~e:e].forEach(function(e){e._||(e._=1,n.push(e))})})})}}),n.forEach(function(e){delete e._}),{type:"MultiPolygon",arcs:o.map(function(t){var n,o=[];if(t.forEach(function(e){e.forEach(function(e){e.forEach(function(e){r[e<0?~e:e].length<2&&o.push(e)})})}),(n=(o=i(e,o)).length)>1)for(var a,c,f=1,s=u(o[0]);f<n;++f)(a=u(o[f]))>s&&(c=o[0],o[0]=o[f],o[f]=c,s=a);return o}).filter(function(e){return e.length>0})}}function f(e,t){for(var r=0,n=e.length;r<n;){var o=r+n>>>1;e[o]<t?r=o+1:n=o}return r}function s(e){if(null==e)return t;var r,n,o=e.scale[0],a=e.scale[1],i=e.translate[0],c=e.translate[1];return function(e,t){t||(r=n=0);var u=2,f=e.length,s=new Array(f),l=Math.round((e[0]-i)/o),h=Math.round((e[1]-c)/a);for(s[0]=l-r,r=l,s[1]=h-n,n=h;u<f;)s[u]=e[u],++u;return s}}e.bbox=n,e.feature=function(e,t){return"string"==typeof t&&(t=e.objects[t]),"GeometryCollection"===t.type?{type:"FeatureCollection",features:t.geometries.map(function(t){return o(e,t)})}:o(e,t)},e.merge=function(e){return a(e,u.apply(this,arguments))},e.mergeArcs=u,e.mesh=function(e){return a(e,c.apply(this,arguments))},e.meshArcs=c,e.neighbors=function(e){var t={},r=e.map(function(){return[]});function n(e,r){e.forEach(function(e){e<0&&(e=~e);var n=t[e];n?n.push(r):t[e]=[r]})}function o(e,t){e.forEach(function(e){n(e,t)})}var a={LineString:n,MultiLineString:o,Polygon:o,MultiPolygon:function(e,t){e.forEach(function(e){o(e,t)})}};for(var i in e.forEach(function e(t,r){"GeometryCollection"===t.type?t.geometries.forEach(function(t){e(t,r)}):t.type in a&&a[t.type](t.arcs,r)}),t)for(var c=t[i],u=c.length,s=0;s<u;++s)for(var l=s+1;l<u;++l){var h,p=c[s],g=c[l];(h=r[p])[i=f(h,g)]!==g&&h.splice(i,0,g),(h=r[g])[i=f(h,p)]!==p&&h.splice(i,0,p)}return r},e.quantize=function(e,t){if(e.transform)throw new Error("already quantized");if(t&&t.scale)u=e.bbox;else{if(!((r=Math.floor(t))>=2))throw new Error("n must be ≥2");var r,o=(u=e.bbox||n(e))[0],a=u[1],i=u[2],c=u[3];t={scale:[i-o?(i-o)/(r-1):1,c-a?(c-a)/(r-1):1],translate:[o,a]}}var u,f,l=s(t),h=e.objects,p={};function g(e){return l(e)}function y(e){var t;switch(e.type){case"GeometryCollection":t={type:"GeometryCollection",geometries:e.geometries.map(y)};break;case"Point":t={type:"Point",coordinates:g(e.coordinates)};break;case"MultiPoint":t={type:"MultiPoint",coordinates:e.coordinates.map(g)};break;default:return e}return null!=e.id&&(t.id=e.id),null!=e.bbox&&(t.bbox=e.bbox),null!=e.properties&&(t.properties=e.properties),t}for(f in h)p[f]=y(h[f]);return{type:"Topology",bbox:u,transform:t,objects:p,arcs:e.arcs.map(function(e){var t,r=0,n=1,o=e.length,a=new Array(o);for(a[0]=l(e[0],0);++r<o;)((t=l(e[r],r))[0]||t[1])&&(a[n++]=t);return 1===n&&(a[n++]=[0,0]),a.length=n,a})}},e.transform=r,e.untransform=s,Object.defineProperty(e,"__esModule",{value:!0})});
}
const MALHA_MT = {"type":"Topology","arcs":[[[48207,27520],[-22,-326],[-771,-535],[-464,-153],[-254,-394],[220,-336],[-22,-495]],[[46894,25281],[-657,-681]],[[46237,24600],[-318,185],[-528,1186],[410,887],[-405,261]],[[45396,27119],[159,671],[1392,583],[288,297],[332,-127]],[[47567,28543],[-66,-671],[145,-347],[561,-5]],[[81510,32812],[127,681],[-124,532],[85,545],[-568,390],[45,1157],[-688,-91],[-538,104],[-625,-276],[-495,256],[-319,-276],[-1215,-199],[-1194,8]],[[76001,35643],[-477,616],[-196,601],[47,669],[377,230],[-94,595],[-210,219],[-337,1153],[-457,577],[144,926]],[[74798,41229],[5963,-301],[3291,-832]],[[84052,40096],[31,-737],[-453,-807],[717,-521],[536,-9],[918,-401],[-5,-499],[-764,-1347],[-558,-15],[-638,-329],[-271,-379],[-620,-212],[-11,-618],[-687,-344],[-556,-1132],[-181,66]],[[51170,80470],[-983,-114],[70,-705],[-329,-801],[589,-969],[308,-181]],[[50825,77700],[-114,-1027],[-258,-984],[-285,-466],[69,-322],[-958,-853],[-848,172],[-81,-258],[-553,-339],[-352,-503],[482,-83],[568,-521],[314,-529]],[[48809,71987],[-1268,-457],[-657,-74],[-27,-451],[378,-396],[49,-348],[-244,-422],[-610,-4],[-880,-994]],[[45550,68841],[-1321,778],[-574,146],[-591,855]],[[43064,70620],[-771,935],[-396,180],[-862,57],[-326,376],[176,398]],[[40885,72566],[209,395],[-22,899],[-131,349],[197,409],[302,61],[-254,604],[-58,556]],[[41128,75839],[313,-115],[3643,158],[359,221],[606,-116],[296,2602],[364,1001],[403,737],[-169,515]],[[46943,80842],[4227,-372]],[[75536,11009],[-483,-1545],[114,-378],[-554,-400],[-674,-1529],[-203,-215],[195,-757],[-286,-448],[-122,-723]],[[73523,5014],[-806,-641],[-548,-1341],[-962,-367],[9,-593],[445,-750],[474,-372],[-35,-487]],[[72100,463],[-453,-71],[-93,-329],[-1696,536],[-255,-233],[-736,16],[-555,618],[-1037,483],[591,1254],[392,527],[393,207],[827,66],[215,3835]],[[69693,7372],[-28,271]],[[69665,7643],[961,215],[102,155],[1835,1820],[803,746],[-874,557]],[[72492,11136],[493,305],[563,112],[591,-75],[1028,-431],[369,-38]],[[90259,57957],[-570,-182],[-652,-525],[-676,141],[-869,-176],[-82,-375]],[[87410,56840],[-515,188],[-978,803],[-212,5],[-1011,-452],[-794,-806],[-518,67]],[[83382,56645],[-609,332],[-486,650],[-51,502]],[[82236,58129],[581,638],[661,96],[736,-367],[355,570],[1970,120],[333,-119],[1124,398],[1232,84],[346,675],[413,-321],[434,-8],[369,-678],[-832,-286],[45,-519],[256,-455]],[[74208,14078],[154,-456],[-443,-528],[-1427,-1958]],[[69665,7643],[-338,329],[-482,81],[-270,314],[-706,207],[-372,358],[-406,650]],[[67091,9582],[15,382],[-354,358],[130,563],[521,491],[433,216],[260,425]],[[68096,12017],[324,-391],[826,318],[186,345],[864,-3],[978,557],[715,-115],[82,395],[-165,618],[541,829],[1761,-492]],[[46124,31279],[-340,-303]],[[45784,30976],[-860,-580],[-1082,-910],[-803,-1020],[-866,-1371]],[[42173,27095],[109,358],[-619,963],[-528,-185],[-186,540],[274,278]],[[41223,29049],[430,450],[188,579],[481,640],[389,238],[-28,316],[293,481]],[[42976,31753],[491,492],[111,832],[753,313],[285,263],[-106,480]],[[44510,34133],[548,-561],[703,-29],[341,-1054],[22,-1210]],[[73523,5014],[-65,-1145],[113,-796],[531,-400],[360,-760],[43,-747],[539,-645],[-20,-450],[-917,-71],[-193,199],[-880,232],[-716,-124],[-218,156]],[[40047,82888],[-369,-235],[177,-1726],[-453,-258],[586,-538],[125,-488]],[[40113,79643],[-475,-383],[-519,-895],[-66,-505],[-457,-735],[-874,213],[-104,830],[-578,-67],[-194,167],[-680,-274],[-1162,-187]],[[35004,77807],[-636,202],[-242,782],[187,679],[-226,453],[-1408,143],[-306,132],[-851,1092],[-331,-20],[-215,998],[-654,577],[5,386],[-407,126],[-664,441],[-101,491],[-516,109],[-427,525],[-975,-20],[-300,235]],[[26937,85138],[826,928],[155,401]],[[27918,86467],[482,231],[324,685],[-534,-178],[-223,161],[419,1016],[-183,228],[-58,734],[864,1514],[-34,1498],[296,356],[2,490],[-292,511],[-86,526],[-366,576],[14,804],[681,465],[158,672],[648,738],[-181,905],[85,613],[348,601],[481,386],[510,-411],[222,-535],[548,-752],[290,-1109],[356,-176],[221,-1210],[341,-758],[27,-742],[485,-848],[422,-393],[209,-691],[538,-413],[-321,-999],[104,-448],[-163,-375],[466,-1121],[355,-2149],[549,78],[1002,-447],[-1,-590],[863,-250],[278,-279],[356,89],[497,-254],[444,-575],[383,-210],[486,-760],[-183,-783]],[[90153,28548],[-705,-170],[-438,-452],[-511,-122],[-553,-814],[-466,-217],[-317,-1206],[148,-588],[-230,-358],[-62,-812],[-202,-506],[-438,-32],[174,-764],[-1161,-1835],[-514,203],[-209,-257]],[[84669,20618],[-263,-108],[-1365,749],[87,697],[-244,875],[242,490],[866,678],[-71,1117],[125,1188],[23,1021],[-153,798],[84,538],[351,343],[-53,1308]],[[84298,30312],[429,346],[540,-30],[89,315],[587,505],[571,757],[574,178],[50,415]],[[87138,32798],[580,271],[818,1159],[1091,293],[154,-273],[92,-1077],[-772,-1122],[-98,-480],[-510,-487],[-190,-989],[-367,-839],[-163,-707],[2380,1]],[[76405,11502],[-476,-538],[-393,45]],[[74208,14078],[718,-810],[222,-680],[353,-123],[197,-450],[523,-107],[184,-406]],[[29049,26741],[268,-386],[364,-1014],[188,-183]],[[29869,25158],[-582,-1619],[-1728,90]],[[27559,23629],[73,481],[-125,1052],[-426,-41],[-27,834],[-511,755],[-1111,303]],[[25432,27013],[-228,1035],[273,362]],[[25477,28410],[1874,-1],[-178,-409],[139,-563],[946,-101],[725,-331],[66,-264]],[[42976,31753],[-1581,532],[-46,430],[-333,378]],[[41016,33093],[-243,637]],[[40773,33730],[103,259],[691,447]],[[41567,34436],[741,-1007],[95,-567],[316,-273],[257,-836]],[[22855,75376],[546,-106],[814,-652],[229,-508]],[[24444,74110],[-41,-642],[420,-866],[-741,-1020],[286,-670],[526,-458],[441,-943],[462,-481]],[[25797,69030],[-464,-269],[-784,-180]],[[24549,68581],[-568,20],[-523,-428],[-522,-247],[-397,74],[-701,-347],[-512,148],[-1146,-176],[-339,125],[-358,529],[-447,226],[-339,-232],[-412,156],[-954,-99],[-379,-580],[-1149,-197],[-521,-336],[-826,191],[-1004,-411],[-377,-9],[-921,-362],[-769,67],[-669,559]],[[10716,67252],[-228,321],[83,690],[-503,246],[-406,480],[-123,712],[159,231],[-343,1258],[-351,204],[-30,748],[-211,153],[-99,716],[97,346],[-173,616],[267,278],[46,936],[-293,455],[-447,78],[321,551],[-137,460],[-54,984],[365,610],[-53,307]],[[8603,78632],[-90,345],[568,444],[35,703],[-329,1091],[-512,513],[110,174],[1587,-273],[1777,-37],[1044,-751],[891,-222],[550,394],[134,-309],[636,33],[218,-380],[478,-234],[584,-41],[-25,-658],[-562,-616],[213,-1239],[638,-470],[197,192],[549,-386],[129,-369],[644,-137],[278,630],[352,-39],[602,359],[468,29],[230,-270],[908,199],[429,-99],[-25,-1051],[200,-841],[500,-128],[846,188]],[[52836,6325],[-2,-20]],[[52834,6305],[-472,199],[-1630,422],[-289,305],[-626,-36],[-505,363],[-368,587],[-598,41],[-1205,-490],[-408,-539],[-473,-9],[-810,-506],[-404,312],[-927,-321],[-684,-8],[-411,242]],[[43024,6867],[55,327],[524,720],[191,686],[392,536],[-69,591],[-265,119],[77,1100],[660,757],[232,13],[182,760],[253,127],[13,517],[1018,1418],[246,115],[185,729]],[[46718,15382],[312,-124],[590,546],[1017,257],[249,444],[350,223],[131,534]],[[49367,17262],[608,459],[986,-1563],[304,252],[1032,-116],[590,-537],[154,84],[741,-391],[-587,-5625],[-359,-3500]],[[33768,29693],[251,-406],[1367,-1],[1121,395],[392,20],[-89,-518],[1032,-322],[510,117],[-80,542],[262,625],[358,233],[405,-67]],[[39297,30311],[247,-464],[266,142],[78,-770],[670,254],[665,-424]],[[42173,27095],[39,-136],[-1486,-2060]],[[40726,24899],[-49,523],[193,814],[-363,230],[-488,-521],[-628,329],[-928,-350],[1,-581],[-490,-34],[20,-626],[-668,-1138],[-576,-106],[-17,-659],[-476,-264]],[[36257,22516],[59,602],[-240,843]],[[36076,23961],[-353,460],[-446,983],[37,307],[-239,1136],[-442,353]],[[34633,27200],[-182,982],[-275,238],[-2513,-7],[-372,421],[-17,326],[-591,317],[-947,-207],[-88,380],[274,670],[-123,296]],[[29799,30616],[567,507],[559,-279],[799,-165],[203,-281],[892,-222],[949,-483]],[[26393,30081],[-226,239],[-369,958],[-747,909]],[[25051,32187],[74,-1155],[-349,-491],[174,-693],[-563,-455],[136,-250],[-250,-732]],[[24273,28411],[1192,-1]],[[25465,28410],[615,690],[313,981]],[[84669,20618],[-339,-453],[-1578,42],[-539,-102]],[[82213,20105],[-473,-175],[-538,229],[-1180,223],[-919,603],[18,228],[-752,508],[-526,-14]],[[77843,21707],[-184,608],[62,371],[535,521],[-143,710],[-731,371],[-715,-583],[-1125,-119],[-339,-375],[-420,295],[-639,883],[-270,9],[-809,1050]],[[73065,25448],[295,745],[848,233],[1506,-542],[469,9],[525,713],[301,624],[587,514],[348,495],[122,771],[421,731]],[[78487,29741],[356,-148],[15,-415],[318,-266],[55,-896],[476,-1165],[443,2606],[707,-455],[538,72],[940,1047],[362,67],[950,-424],[651,548]],[[87410,56840],[489,-130],[162,-378],[994,-1080],[291,-158],[373,-562],[315,-1048],[672,-211]],[[90706,53273],[385,-60],[707,-393],[273,-345]],[[92071,52475],[-588,-10],[-744,338],[-731,-504],[-534,-53],[-1085,113],[-888,-242],[23,-276],[-479,-331],[-1066,-106],[-698,416],[-175,2006],[-217,400],[-497,-605],[-551,194]],[[83841,53815],[-583,243],[-300,569],[466,1159],[-42,859]],[[34155,54565],[789,-454],[184,-745],[791,-626],[304,-51],[557,-665],[-80,-775],[421,-1393],[-114,-486],[228,-616],[767,-934],[-152,-762],[-489,-573],[-1068,-763]],[[36293,45722],[-594,13],[-294,-192],[-718,102],[-443,-471],[-237,-530],[-1523,566],[-1228,-329],[-618,62],[-442,706],[-33,1273],[-171,462],[-777,450]],[[29215,47834],[-431,535],[-157,467],[-314,259],[28,395],[-168,1210],[-291,700],[205,312],[-288,488],[-245,1347],[-351,410],[435,989],[-140,380],[21,650],[278,610],[132,656]],[[27929,57242],[141,599],[367,770],[-27,622],[-226,702],[282,228],[48,633],[416,258],[163,652],[-158,168],[37,1332],[-401,370]],[[28571,63576],[351,539],[-13,741],[-455,1128],[346,367]],[[28800,66351],[387,-661],[521,-434],[38,-716],[-261,-337],[441,-744],[859,-332],[-255,-1287],[96,-849],[168,-419],[419,-359],[58,-945],[414,-742],[489,-395],[678,-1135],[120,-570],[-51,-971],[200,2],[1034,-892]],[[36257,22516],[-244,-1031],[620,-84],[375,321],[501,-48],[620,-1015],[205,358],[344,-518]],[[38678,20499],[1356,301],[207,-191]],[[40241,20609],[-396,-481],[-420,-874],[52,-1430],[325,-509],[165,-700],[-124,-615],[78,-782],[-766,-234],[-216,-826],[-440,-155],[-500,-490],[-519,29],[-429,-387],[-49,-953],[304,-460],[28,-677],[-428,-222],[-657,558],[-678,115],[61,-451],[552,-184],[595,-419],[425,-634],[-189,-480],[321,-645],[235,-2061],[-368,-589],[-367,-226],[-651,-1088],[-369,-254],[-1319,-604]],[[34497,3881],[-169,782],[-352,-199],[-1151,1075],[-854,-573],[-548,169],[-147,393],[-494,-11],[-308,629],[-297,-64],[-686,438],[-113,413],[-1057,1113],[-249,650],[-92,961],[-289,798],[75,566],[-138,338],[113,1639],[237,560],[809,699],[-109,839],[431,541],[35,585],[-157,401],[-392,-80],[-568,-449],[-3113,135]],[[24914,16229],[-95,506],[298,740],[407,303],[257,637],[-63,392],[380,343],[843,430],[474,67],[963,530]],[[28378,20177],[797,-415],[149,-724],[406,-269],[687,-113],[74,541],[-200,574],[165,449],[416,360]],[[30872,20580],[1428,192],[-292,438],[-42,638],[803,-411]],[[32769,21437],[823,-113]],[[33592,21324],[318,758],[415,315],[154,911],[-153,901],[1750,-248]],[[76001,35643],[238,-159],[327,-741],[869,-315],[-173,-278],[1140,-1850],[-526,-194],[-64,-474],[-317,-249],[-22,-798]],[[77473,30585],[-528,-40],[-843,490],[-708,-233],[-49,-470],[-436,-497],[-1474,-231],[-335,137]],[[73100,29741],[-593,700],[61,339],[-438,205],[213,346],[240,1068],[-499,903],[-287,105],[-233,629]],[[71564,34036],[127,463],[-28,832],[464,532],[351,707],[35,1012],[276,199],[380,895],[234,241],[66,759],[229,236]],[[73698,39912],[513,610],[219,503],[368,204]],[[36293,45722],[-278,-647],[-862,-1089],[-117,-654],[568,-417],[194,-629],[14,-564],[750,16],[760,245],[43,-303]],[[37365,41680],[-233,-176],[-511,-1011],[-1019,-1441],[-45,-370],[-501,-536],[-540,-1148],[60,-1148],[-450,-760]],[[34126,35090],[-852,-61],[-3497,-826],[209,982],[711,759],[344,843],[-95,444],[105,549]],[[31051,37780],[-833,259],[-1000,1018],[-345,1480],[-636,1367],[566,1422],[-28,400],[213,836],[391,934],[-4,2070],[-160,268]],[[60765,28889],[581,-222],[631,81],[480,-629],[570,-266],[5,-439],[-477,-191],[333,-693],[-729,-367],[155,-386],[-272,-737]],[[62042,25040],[-1353,-274],[-1774,-954],[-579,-573],[-13,-665]],[[58323,22574],[-933,212],[-68,-472],[-377,-332],[-506,-124],[-474,-371],[-29,-287],[-470,-1134]],[[55466,20066],[7,441],[-940,276],[-139,419],[4,1092],[358,229]],[[54756,22523],[-519,214],[341,952],[540,213],[314,-270],[137,787],[213,271],[-259,445],[-346,32],[1465,1371],[609,927],[1586,350],[63,214]],[[58900,28029],[586,-206],[445,465],[834,601]],[[22663,37827],[50,-388],[-365,-926],[99,-246],[-320,-609],[120,-428]],[[22247,35230],[-472,-619],[-1054,-231],[-372,-622],[-39,-709]],[[20310,33049],[-976,2754],[142,580],[284,211],[272,734],[-274,623]],[[19758,37951],[-39,826],[-478,332],[-209,641],[-27,871],[338,607],[-20,1115],[221,289],[34,1203],[-302,621],[329,497],[94,599],[236,451],[931,755],[147,1132],[755,760],[288,42],[444,559],[261,675],[450,168],[435,432]],[[23646,50526],[-131,-1092],[292,-1321],[-132,-628],[-241,-267],[-190,-798],[146,-430],[-399,-529],[-275,-1208],[330,-1197],[-277,-531],[-4,-966],[266,-1727],[183,-465],[-551,-1540]],[[82770,66463],[670,-530],[533,3],[557,-252],[1127,689],[810,101],[897,-545],[831,-62],[153,-333],[493,-30],[873,151]],[[89714,65655],[-669,-610],[-314,-582]],[[88731,64463],[199,-938],[-653,-563],[-173,-412],[-415,-112],[-261,-861],[-484,-54],[-594,-493],[-619,112],[-623,-110],[-666,715],[-308,729],[45,641],[-526,291],[-273,449],[86,520],[-499,400],[-490,800]],[[82477,65577],[4,575],[289,311]],[[83391,46091],[464,32],[1185,-965],[359,-1665],[-142,-658],[311,-332],[491,720],[1085,-13],[429,404],[548,245],[457,-410],[1270,-487]],[[89848,42962],[-257,-347],[-21,-561],[-571,-209],[94,-456]],[[89093,41389],[-1143,70],[-1431,-778],[-1218,-791],[-209,258],[-428,-232],[-612,180]],[[74798,41229],[209,692],[-174,347],[393,810],[382,1209],[316,284],[657,1350],[138,1385],[470,556],[106,738],[-698,552],[-402,720],[-103,684],[225,313]],[[76317,50869],[606,-67],[625,-360],[308,115],[877,-239],[507,-569],[626,84],[207,-208],[36,-828],[249,-197],[-170,-446],[301,-1473],[199,-32],[374,-1012],[231,-29],[260,-530],[419,-306],[790,562],[229,-7],[400,764]],[[53243,74656],[-106,-513]],[[53137,74143],[-181,-954],[-335,-256],[-543,-60]],[[52078,72873],[-409,171],[-628,-76],[-469,-506],[-631,-893],[-778,-21],[-354,439]],[[50825,77700],[924,-557],[402,-882],[540,41],[521,-991],[31,-655]],[[28124,69914],[273,-401],[146,-1045],[367,-669],[-243,-632],[133,-816]],[[28571,63576],[-252,13],[-516,-806],[-380,-75],[-993,748],[-1437,292],[-669,279],[-415,495],[487,366],[325,451],[-480,391],[-633,104],[167,1360],[326,219],[-228,440],[191,444],[485,284]],[[25797,69030],[1164,412],[521,-53],[362,458],[280,67]],[[54756,22523],[-846,177]],[[53910,22700],[24,664],[-625,242],[-177,335],[-708,120],[-615,-195],[-342,94],[-426,1028],[61,380],[-1151,719],[289,569],[-85,885],[-481,125],[-534,-140],[-776,152],[-157,-158]],[[47567,28543],[2231,-853],[-32,794],[-500,769],[379,401],[440,34],[498,308],[267,-220],[596,431],[-30,263],[3553,2058]],[[54969,32528],[-148,-483],[-853,-526],[-257,-677],[-1212,-596],[1006,-652],[594,80],[333,257],[969,299],[982,-146],[493,91],[-61,-571],[391,-751],[-30,-390],[727,-7],[476,-555],[521,128]],[[58814,64232],[295,-832],[438,-170],[492,267],[734,-22]],[[60773,63475],[66,-1243],[-92,-635],[-273,-753],[162,-279],[-126,-760]],[[60510,59805],[-351,-616],[-55,-502],[-281,-373],[-368,682],[-256,-23],[-1165,629],[-498,-240]],[[57536,59362],[-550,13],[-306,236],[-1064,39],[-331,716],[97,597],[-336,296],[-551,33],[-133,979],[-296,267]],[[54066,62538],[-59,333],[279,1185],[529,410],[335,-283],[136,-618],[351,-291],[977,142],[146,609],[858,-101],[803,360],[393,-52]],[[87138,32798],[-253,630],[134,543],[-130,354]],[[86889,34325],[277,575],[-369,831],[9,500],[286,712],[-52,531],[664,1000],[284,1160],[341,296],[11,568],[753,891]],[[89848,42962],[661,817],[523,1036],[404,148],[16,545],[824,847],[-178,618],[93,523],[705,662],[235,385],[-147,356],[427,594],[-143,262],[404,300]],[[93672,50055],[433,-1478],[499,-464],[526,378],[22,406],[431,240],[-112,341],[286,762],[227,222]],[[95984,50462],[523,-812],[-21,-611],[512,-406],[409,65],[162,-433],[-211,-877],[-447,-698],[-233,-1364],[166,-172],[-199,-894],[-513,-611],[2,-619],[-859,-821],[-45,-627],[-311,-879],[-460,-232],[-3,-1083],[134,-266],[-37,-764],[-149,-143],[272,-1083],[-317,-490],[-445,-7],[36,-434],[-419,-736],[-62,-777],[-261,-798],[318,-1009],[-303,-478],[51,-324],[-351,-630],[-196,-623],[82,-452],[-394,-424],[48,-712],[-378,-193],[-208,-437],[-805,-483],[-420,10],[-100,447],[-399,-34]],[[55039,70721],[357,-493],[614,-287],[134,-397],[582,-859],[-31,-223]],[[56695,68462],[-63,-511],[-382,-256],[-793,-899]],[[55457,66796],[-940,-117],[-533,-168],[-253,-712],[-506,485],[-511,-31]],[[52714,66253],[-266,462],[-179,1808],[375,1764],[-334,1322],[110,351],[-420,347],[78,566]],[[53137,74143],[462,-302],[331,-961],[416,-1772],[693,-387]],[[8603,78632],[-621,-721],[-450,-59],[-969,-491],[-1244,-1745],[-825,-279],[-397,-559],[-482,747],[-655,277],[109,-507],[-243,-316],[-396,-14],[-714,269],[-963,5]],[[753,75239],[282,1296],[-346,688],[131,708],[488,777],[-274,826],[-364,236],[-282,525],[273,387],[-204,440],[-457,72],[118,779],[328,399],[412,56],[68,368],[-307,564],[-4,366],[551,1402],[215,236],[-377,502],[-106,422],[-393,164],[3365,23],[6706,18],[3049,-33],[5786,-29],[2504,0]],[[21915,86431],[949,-598],[67,-706],[-290,-391],[295,-574],[353,-219],[-533,-1090],[297,-420],[328,-1018],[-270,-200],[183,-535],[-238,-616],[182,-563],[-520,-231],[-54,-637],[168,-920],[207,-364],[-184,-1973]],[[24197,54581],[-54,-442],[260,-684],[-138,-1183],[-425,-402],[-194,-1344]],[[19758,37951],[-713,-530],[-701,292],[-397,-440],[-1173,-599],[-509,274],[-591,-799],[-538,494],[-454,653],[-884,284],[-840,116],[-1415,-457]],[[11543,37239],[-635,644]],[[10908,37883],[-288,111],[-540,1200],[98,356],[-582,399],[-329,27],[-475,460],[-287,-176],[-506,583],[245,475],[472,501],[478,60],[671,625],[607,94],[387,316],[140,428],[-14,790],[815,1767],[114,546],[739,1025],[580,76],[334,734],[39,1008],[-140,343],[242,888],[319,750],[1071,831],[316,-89],[663,1277],[163,46]],[[16240,53334],[1285,356],[2596,220],[905,-225],[556,-577],[321,119],[128,417],[530,493],[1212,405],[424,39]],[[91867,72868],[-637,-301],[-572,-1185],[132,-580],[-166,-591],[-392,-785],[-289,-186],[211,-739],[-70,-258]],[[90084,68243],[-4054,202],[-185,582],[-562,166],[-370,-107],[-188,410],[77,601],[-1048,107],[-901,458]],[[82853,70662],[-53,929],[190,281],[168,826]],[[83158,72698],[503,549],[208,1077]],[[83869,74324],[362,195],[1528,-322],[835,-56],[188,434],[428,-71],[986,-682],[414,282],[673,-110],[962,-964],[312,-153],[465,291],[845,-300]],[[22093,31641],[-341,-96],[-175,-644],[166,-321],[-493,-510],[-526,-68],[-629,-417],[-285,-717],[-692,-29]],[[19118,28839],[-1208,1299]],[[17910,30138],[148,234],[-404,574],[202,975],[-66,702],[-280,512],[1025,411],[522,-359],[1053,-463],[200,325]],[[22247,35230],[293,-324],[-148,-1998],[212,-82],[103,-914],[-614,-271]],[[26937,85138],[-415,-636],[81,-677],[-560,-621],[489,-1669],[607,-601],[876,-564],[1000,144],[502,-561],[89,-586],[-64,-903],[234,-404],[325,-1361],[-276,-360],[89,-502],[-132,-606],[-489,-835],[-308,-331]],[[28985,74065],[-4541,45]],[[21915,86431],[5499,4],[504,32]],[[53910,22700],[-448,-523],[-654,-433],[-922,121],[-1580,49],[-2235,-635]],[[48071,21279],[306,246],[34,490],[310,419],[-539,178],[-450,1080],[-542,493],[133,411],[-114,453],[-315,232]],[[32743,24057],[535,-376],[-107,-310],[404,-630],[-126,-1004],[143,-413]],[[32769,21437],[92,252],[-195,686],[-792,414],[143,687],[352,-188],[374,769]],[[39297,30311],[-107,553],[789,1238],[-520,443]],[[39459,32545],[723,432],[296,-183],[538,299]],[[37365,41680],[312,-352],[-189,-383],[100,-798]],[[37588,40147],[81,-1183],[1058,-381],[284,419],[1219,373],[787,400],[1160,421],[454,762],[410,77],[436,-437],[-197,-527],[-32,-826],[171,-234],[663,24],[372,-234],[509,321],[776,200]],[[45739,39322],[531,-722],[-3,-576],[409,-435],[-29,-438],[715,-809],[1485,115],[262,-732]],[[49109,35725],[434,-570],[-96,-593],[-539,-697],[-439,-275],[-1040,-903],[-201,-460],[-1104,-948]],[[44510,34133],[69,1402],[-538,392],[-421,-136],[-466,159],[-544,444],[-1057,21],[-550,-215]],[[41003,36200],[-524,-279],[-1216,331],[-428,-270],[-788,301],[-430,-199],[-408,215],[-1008,-487],[-563,388],[-381,-119],[-965,-991]],[[34292,35090],[-166,0]],[[62042,25040],[293,-329]],[[62335,24711],[-273,-937],[-98,-722],[-1000,-2531],[833,-313]],[[61797,20208],[-773,-150],[-668,20],[-682,-411],[-640,-121],[-132,-277]],[[58902,19269],[-385,609],[-59,1281],[-489,145],[354,1270]],[[73492,63883],[-33,-427],[-575,-546],[-730,-1097],[-680,-787],[-629,-462],[-179,-749],[-349,-909],[184,-1069],[355,-724]],[[70856,57113],[-9,-117]],[[70847,56996],[-433,-99],[-498,-570],[-1126,-682]],[[68790,55645],[-521,198],[-922,-147],[-252,-359],[-331,167],[-379,-495],[-421,70],[-415,-245],[-447,-622],[-318,29],[-711,-523],[-791,-430],[-640,-142],[-290,-216],[-164,-599],[-227,-178],[-957,-72],[-293,-160],[-361,-1001],[-408,-257],[-912,-251],[-208,-246],[-2432,-14],[-343,390]],[[56047,50542],[76,402],[748,385],[645,1779],[-370,1080],[-234,347],[86,345]],[[56998,54880],[632,211],[382,-859],[347,407],[-29,318],[389,352],[845,26],[855,329],[254,263],[470,-53],[1473,626],[471,-51],[1054,842],[229,415]],[[64370,57706],[1012,1239],[554,996],[799,372],[422,575],[966,401],[688,1870]],[[68811,63159],[155,463],[656,513],[111,347],[744,286],[267,315],[641,282],[843,-20],[355,280],[290,646]],[[72873,66271],[11,-375],[283,-386],[345,-933],[-20,-694]],[[25694,25524],[370,-345],[652,-1487]],[[26716,23692],[-3,-539],[215,-167],[-16,-1008]],[[26912,21978],[-17,1]],[[26895,21979],[-1361,70],[-166,282],[-1011,489]],[[24357,22820],[-140,333],[41,677],[606,292],[50,730],[780,672]],[[73698,39912],[-547,209],[-25,320],[-504,30],[-1065,591],[-301,-594],[-962,-591],[-767,118],[-52,856],[480,726],[156,1022],[-225,255],[-415,-938],[-672,-263],[-630,-1111],[-557,-326],[-109,-339],[-1163,-322],[-236,468],[101,847],[215,174],[281,1977],[-43,495],[169,909],[-159,443],[187,1123],[239,493],[-171,555],[404,421],[225,654],[262,157],[492,879],[-75,640],[421,731],[-10,385],[249,472],[-233,689],[941,1205],[106,378],[798,1247],[-51,378],[351,412],[268,881],[-224,428]],[[70856,57113],[516,-86],[905,-934],[231,-85],[166,-847],[340,-149],[-76,-612],[419,-15],[619,-727],[624,-414],[114,-781],[655,-506],[948,-1088]],[[77843,21707],[-645,-80],[-393,282],[-243,-159],[-1264,-191]],[[75298,21559],[-1026,119],[-318,820],[-553,170],[-262,267],[-1628,77],[-440,-565],[-516,-426],[-991,-447],[-600,-68],[-208,-719],[372,-438]],[[69128,20349],[-918,330],[-259,604],[-170,877],[-302,334],[161,1205],[873,906],[97,394],[625,246]],[[69235,25245],[1096,-41],[527,-262],[548,-53],[371,326],[412,-11],[479,-264],[397,508]],[[29816,21900],[-357,-347],[-175,-742],[1588,-231]],[[28378,20177],[-1167,1005],[-316,797]],[[26912,21978],[2157,-125],[747,47]],[[65952,79240],[-261,-151],[-107,-682],[64,-611],[-139,-600],[-545,-83],[-440,-730],[352,-403],[-333,-513],[-1340,-187],[-813,36],[-245,216],[-866,-135],[-260,-685],[-2860,64],[-466,72]],[[57693,74848],[193,1946],[259,110],[287,1279],[-277,1680]],[[58155,79863],[3351,-285],[4446,-338]],[[75824,17852],[20,-115],[-1429,-721],[-268,-562],[172,-953],[-343,-312],[-112,-710],[344,-401]],[[68096,12017],[289,252],[-154,431],[111,969],[-499,-99],[-802,639],[-453,517],[-636,-115],[-541,-255]],[[65411,14356],[-442,677],[334,340],[-381,710]],[[64922,16083],[362,262],[868,-224],[500,-493],[748,293],[-11,700],[172,640],[1026,-21],[-207,373]],[[68380,17613],[1138,-1],[27,-264],[624,-366],[314,354],[158,611],[713,-209],[1736,43],[393,1204],[750,155],[326,354],[109,556],[376,107]],[[75044,20157],[20,-738],[212,-349],[-248,-411],[796,-807]],[[27559,23629],[-843,63]],[[25694,25524],[-298,865],[36,624]],[[51224,61872],[-251,-638],[390,-951],[702,-304],[-379,-894]],[[51686,59085],[-860,-250],[-71,-733],[-290,-319],[-130,-1137],[-208,-680],[203,-764],[-248,-876],[-901,-873],[-359,-935]],[[48822,52518],[-412,-63],[-718,475],[-510,-321],[-853,1082],[-172,346]],[[46157,54037],[-383,256],[158,507]],[[45932,54800],[668,424],[-69,300],[517,763],[170,597],[678,581],[42,423],[456,264],[392,1288],[346,84],[493,555]],[[49625,60079],[962,404],[219,281],[46,603],[372,505]],[[46157,54037],[-886,-352],[-572,-423],[-622,111],[-188,-292],[-618,490],[-847,-488],[-474,-48],[-989,679]],[[40961,53714],[-747,385],[-31,491],[-873,1856]],[[39310,56446],[549,277],[1106,188],[533,369],[963,45],[842,-691],[1215,274],[694,-315],[201,-573],[349,-327],[170,-893]],[[55457,66796],[568,198],[283,-472],[1020,-453],[200,-282],[960,-147],[-3,-383],[351,-385],[-22,-640]],[[54066,62538],[-436,-431],[-691,404],[-232,469],[-650,104],[-612,-331],[-500,262]],[[50945,63015],[-445,326],[-1802,858],[-1112,366],[-456,271],[-610,106]],[[46520,64942],[696,573],[514,-28],[932,772],[1197,527],[264,402],[549,-605],[-81,-360],[1521,-85],[602,115]],[[61489,9861],[12,-962],[716,105],[487,-304],[1098,218],[549,-42],[623,232],[515,458],[1602,16]],[[69693,7372],[-220,238],[-473,-140],[-535,-482],[-99,-565],[-325,-125],[-735,-851],[-670,-189],[-492,-1305],[-953,121],[-957,-520],[-720,239],[89,258],[-428,675],[-383,69],[-323,458],[-910,-66],[-1253,-339],[-104,-290],[-866,-650],[-468,144],[-1868,-414],[-1201,700],[-311,343],[-926,270],[-591,290],[-452,2],[-566,630],[-119,432]],[[52836,6325],[629,360],[187,-194],[1311,-109],[605,640],[713,255],[231,508],[607,260],[274,434],[482,295],[322,-132],[885,417],[428,6]],[[59510,9065],[1040,299],[430,455],[509,42]],[[58902,19269],[-257,-155],[117,-534]],[[58762,18580],[-216,-595],[-607,249],[-601,31],[-417,-149],[-270,-361],[-660,-213]],[[55991,17542],[-525,2524]],[[46237,24600],[-962,-413],[-387,-507]],[[44888,23680],[-474,278],[-1047,30]],[[43367,23988],[279,361],[-407,204],[-533,695],[797,891],[486,69],[347,672],[745,464],[315,-225]],[[24357,22820],[-1271,327],[-494,715],[-371,198]],[[22221,24060],[-62,156]],[[22159,24216],[325,-63],[415,393],[4,393],[628,400],[0,331],[388,655],[-533,405],[677,252],[93,420],[-134,612],[251,397]],[[25465,28410],[12,0]],[[43064,70620],[-601,-766],[-203,-1814],[656,-892],[298,-624],[16,-944],[-649,259],[-671,511],[-426,61],[-593,-292],[-894,-103],[356,-733],[113,-577],[-430,-492],[12,-690],[-251,-494],[-428,-146]],[[39369,62884],[-561,19],[-742,392],[-545,20],[-783,-257],[-243,90],[-723,-265],[-31,-407],[952,-738],[304,-440]],[[36997,61298],[-310,-808],[230,-200],[134,-907],[-78,-310]],[[36973,59073],[57,-1100],[-266,-204],[46,-1211],[160,-207],[-9,-680],[-923,65],[-238,185],[-612,-346],[-1033,-1010]],[[28124,69914],[109,312],[543,608],[76,559]],[[28852,71393],[383,-399],[829,421],[291,-115],[637,277],[722,-49],[58,-350],[878,314],[1924,524],[33,247],[670,166],[3,476]],[[35280,72905],[546,-259],[759,218],[890,-306],[682,140],[1065,-387],[1663,255]],[[27929,57242],[-582,-217],[-184,-431],[-717,-519],[-436,-34],[-648,-775],[-445,-178],[-720,-507]],[[16240,53334],[-982,893],[-215,552],[97,648],[-698,820],[112,209],[-168,890],[-656,160],[-336,462],[17,470],[-217,779],[59,1129],[212,342],[1371,1227],[151,798],[-371,409],[-197,573],[94,498],[-422,478],[-1227,313],[-348,-172],[-718,211],[-179,321],[-792,-342],[-601,972]],[[10226,65974],[213,537],[-139,217],[416,524]],[[28985,74065],[57,-429],[-382,-917],[192,-1326]],[[62669,18444],[-465,-126],[-2298,-1187],[-259,-497],[-715,-49],[-321,-814],[-6,-456],[-236,-631]],[[58369,14684],[-334,-391],[-338,596],[-1188,162],[-518,2491]],[[58762,18580],[304,506],[636,-75],[311,136],[1555,133],[395,642],[-98,267]],[[61865,20189],[958,-317],[-154,-1428]],[[32743,24057],[-165,258],[-529,158],[47,294],[-452,336]],[[31644,25103],[-283,-23],[-577,-480]],[[30784,24600],[471,901],[404,533],[608,246]],[[32267,26280],[975,327],[118,532],[703,-56],[570,117]],[[50411,44772],[-302,-412],[-404,-215],[-145,-1226],[-1161,22],[42,292],[-538,261],[-411,936],[-1165,1690],[-392,-14],[-612,625],[-554,187],[-776,56],[-206,542],[749,153],[211,450]],[[44747,48119],[803,28],[475,143],[371,929],[602,736],[771,116],[548,483]],[[48317,50554],[694,-624],[66,-576],[340,-500],[-16,-499],[490,-606],[282,-645],[-23,-419],[252,-1032],[9,-881]],[[96678,69060],[288,-865],[-451,-813],[186,-574],[-282,-329],[206,-1231],[-431,-574],[23,-1042],[-374,-658]],[[95843,62974],[-3311,693],[-3801,796]],[[89714,65655],[327,169],[743,9],[400,544],[575,176],[250,294],[568,133],[108,445],[474,675]],[[93159,68100],[783,189],[189,270],[529,27],[120,421],[305,158],[760,-29],[528,-336],[305,260]],[[11543,37239],[251,-448],[-3,-410],[400,-320],[-8,-353],[370,-813],[725,-1097],[871,182],[309,-156],[399,-541],[523,-74],[592,-605],[271,-789],[378,-214],[592,-756],[89,-565],[608,-142]],[[19118,28839],[-1026,-174],[-179,-274],[621,-823],[32,-246],[660,-988],[-486,-2008],[-4596,-1132],[-301,-705],[50,-379],[342,-608],[-86,-350],[284,-272],[235,-575],[108,-717],[464,-336],[553,261],[232,-591],[1149,-1351],[800,-295],[920,444]],[[18894,17720],[-159,-252],[355,-638],[-181,-345]],[[18909,16485],[-6154,129],[-278,3555],[-309,3854],[-2863,3416],[562,117],[2251,-6],[-244,4459],[-430,106],[-149,908],[-551,827],[67,411],[-525,610],[-106,467],[-128,1559],[283,114],[573,872]],[[74794,67965],[-218,-541]],[[74576,67424],[-836,-264],[-867,-889]],[[68811,63159],[-800,436],[-1278,-40],[-1009,-493],[-619,-191],[-868,-445],[-587,408],[-468,-19],[-476,-643],[-307,-182],[-337,571],[57,492],[-204,748],[-285,316]],[[61630,64117],[-541,559],[-798,545],[-108,220],[-1132,731],[325,432],[660,516],[516,1381],[591,351],[430,857]],[[61573,69709],[457,-145],[258,335],[895,334],[621,734],[542,11],[375,201],[817,-150],[622,10],[362,-430],[573,-194],[468,-474],[540,30],[659,222],[385,-22],[676,239],[3057,-1199],[1665,-1209],[249,-37]],[[65952,79240],[4545,-366]],[[70497,78874],[-116,-394],[-1283,-550],[-6,-292],[-362,-505],[-404,58],[-49,-498],[-895,-60],[-356,-442],[-185,-727],[-438,-194],[-789,-1628],[-57,-494],[-282,-289],[-821,108],[-562,-371],[-196,-417],[-484,34],[-649,-488],[-1427,198],[-1783,1080],[-440,-29],[-873,732],[-825,97],[-549,-603]],[[56666,73200],[-478,146],[-193,540]],[[55995,73886],[479,-360],[223,1097],[303,229],[693,-4]],[[29816,21900],[610,58],[1218,3145]],[[54633,36625],[452,-400],[155,-525],[755,-145]],[[55995,35555],[176,-433],[-946,-321],[-1230,-281],[-1172,-837],[-899,-130],[-436,-397],[-703,-237],[48,-893],[-352,-419],[-516,-195],[-361,69],[-1149,-185],[-165,306],[-841,-68],[-681,-920],[-517,-219],[-467,581]],[[49109,35725],[849,222],[948,519],[970,278],[6,440],[396,460],[473,112],[1882,-1131]],[[41567,34436],[130,1183],[-694,581]],[[44888,23680],[-167,-356],[463,-169],[2273,-471],[-437,-628],[177,-717],[464,-153],[410,93]],[[48071,21279],[46,-1578],[464,-1257],[786,-1182]],[[46718,15382],[1,241],[452,506],[-9,348],[273,765],[-738,37],[-225,-423],[-941,-255],[-570,-258],[-187,390],[570,316],[191,534],[442,419],[-71,716],[-909,433],[-557,526],[-29,449],[437,919],[295,201],[274,683],[-2518,-1131],[-460,310],[-350,-379],[-821,612],[-337,-74],[-690,-658]],[[38678,20499],[442,591],[-89,365],[1003,1978],[445,560],[369,103]],[[40848,24096],[1200,-96],[447,-368],[331,-27],[541,383]],[[35004,77807],[-63,-559],[-410,-604],[318,-404],[79,-784],[522,-1125],[-170,-1426]],[[86889,34325],[-544,-977],[-480,-319],[-339,72],[-432,-670],[-754,-289],[-412,-651],[-530,151],[-1063,978],[-472,-248],[-353,440]],[[61630,64117],[-387,-148],[-470,-494]],[[56695,68462],[1806,69],[661,-100],[325,197],[399,817],[920,160],[471,602]],[[61277,70207],[296,-498]],[[62744,30577],[-121,-594],[-299,-406],[-1195,-341],[-364,-347]],[[54969,32528],[871,-609],[348,-88],[555,214],[453,632],[528,34],[410,890],[593,293]],[[58727,33894],[253,-508],[-237,-629],[198,-1046],[-376,-792],[205,-519],[397,71],[808,-165],[1516,450],[283,-353],[970,174]],[[46520,64942],[-723,119],[-348,-187],[-474,74],[-526,430],[-479,39],[435,649],[122,469],[441,531],[483,244],[345,437],[-87,936],[-159,158]],[[50411,44772],[924,-796]],[[51335,43976],[307,-518],[432,-199],[14,-306],[738,-1526],[-32,-755],[698,-1148],[-114,-828],[808,-1265],[150,-567],[297,-239]],[[45739,39322],[239,1490],[-365,623],[72,227],[-921,673],[-79,441],[-684,630],[-294,1393],[-282,296],[-229,609],[-369,531],[182,709],[-152,643]],[[42857,47587],[-288,1136]],[[42569,48723],[2178,-604]],[[33768,29693],[466,797],[791,554],[621,-153],[403,201],[588,-33],[304,457],[706,10],[1454,614],[205,274]],[[39306,32414],[153,131]],[[68790,55645],[-589,-1127],[-352,-179],[-704,184],[-115,-287],[-656,-465],[-110,-359],[-537,-163],[-388,-844],[67,-450],[-1181,-897],[-149,-888],[-209,-525],[186,-1377],[-326,-844],[-408,-304],[-136,-688],[-383,-942],[-60,-522],[-528,-258],[-190,-598],[-562,-637],[-464,-1124],[176,-556],[-226,-553],[61,-867],[269,-594],[-506,-272],[-529,-480],[-2998,1596]],[[57243,40625],[128,342]],[[57371,40967],[-300,1415],[-451,1485],[-648,-3],[-570,647],[-117,921],[257,515],[-520,649],[-173,806],[-848,1221],[153,441]],[[54154,49064],[264,-466],[397,911],[348,171],[884,862]],[[78487,29741],[172,598],[-223,206],[-963,40]],[[51170,80470],[6985,-607]],[[55995,73886],[-299,-9],[-650,-386],[-592,229],[-1211,936]],[[39369,62884],[656,-249],[33,-201]],[[40058,62434],[-93,-610],[-633,-235],[-461,287],[-557,-390],[-227,-395],[-561,-148],[-529,355]],[[69235,25245],[-676,709],[-781,56]],[[67778,26010],[-424,224]],[[67354,26234],[328,712],[452,474],[1081,-390],[910,687],[783,1308],[347,-318],[556,384],[685,70],[604,580]],[[41128,75839],[337,232],[-98,343],[507,553],[-266,306],[-2,546],[-507,1206],[-344,322],[-642,296]],[[40047,82888],[566,-485],[380,101],[1159,-218],[391,-778],[28,-575],[881,220],[3491,-311]],[[71564,34036],[-443,-383],[-700,-1055],[-811,-144],[-293,-379],[-472,-198]],[[68845,31877],[-628,162],[-647,-179],[-333,302],[-1296,-95],[-671,-366],[-148,-335],[-1093,-380]],[[64029,30986],[-51,824],[-372,80],[-206,434],[-16,513],[-675,406],[-294,-30],[-522,321],[-226,555],[-350,-85],[-543,327],[-47,396],[-628,88],[-355,244]],[[59744,35059],[-536,736]],[[59208,35795],[69,346],[-513,811],[241,862],[-657,645],[18,593],[-213,414],[-796,866],[-114,293]],[[93672,50055],[184,620],[-311,650],[30,517],[-332,131],[136,721],[-236,160],[-616,-398],[-456,19]],[[90706,53273],[-237,254],[199,607],[-199,310],[58,486],[573,525],[640,161],[296,243],[416,-116]],[[92452,55743],[310,-390],[782,160],[710,919],[306,1224],[261,442],[545,184],[343,511]],[[95709,58793],[242,-950],[413,-239],[-251,-405],[-126,-590],[128,-689],[-97,-1444],[431,-581],[-170,-170],[194,-794],[28,-667],[-706,-1352],[189,-450]],[[61489,9861],[-40,2345],[292,607],[415,291],[-113,308],[455,481],[489,-82],[1593,-697],[240,359]],[[64820,13473],[591,883]],[[70497,78874],[3991,-321],[4503,-345]],[[78991,78208],[-302,-901],[-667,-230],[-446,-357],[-148,-352],[-493,-379],[-380,-696],[-866,-830],[-59,-524],[415,-1498],[-333,-136]],[[75712,72305],[-466,-494],[-328,-1317],[-18,-578],[308,-367],[-349,-366],[77,-521],[-142,-697]],[[61277,70207],[-185,1000],[-504,342],[-396,547],[-694,0],[-1668,334],[-1191,618]],[[56639,73048],[27,152]],[[64029,30986],[-641,-317],[-644,-92]],[[58727,33894],[525,311],[111,533],[381,321]],[[43024,6867],[-326,-179],[-247,-569],[-337,-333],[-452,-1028],[-797,-359],[18,-471],[-1323,-1491],[-273,127],[-705,-143],[-331,-351],[-1866,-362],[-1125,530],[-151,617],[-540,186],[113,490],[-185,350]],[[82213,20105],[-111,-508],[-396,-566],[-155,-591],[-1253,-524]],[[80298,17916],[-132,332],[-687,209],[-475,-456],[-849,328],[-394,-71],[-251,361],[-437,149],[-458,-427],[-34,-415],[-757,-74]],[[75044,20157],[332,257],[59,672],[-137,473]],[[76177,13809],[51,-464],[608,-31],[1161,308]],[[77997,13622],[155,-502],[-470,-310],[-554,-935],[-438,-36],[-285,-337]],[[74208,14078],[778,94],[359,-293],[832,-70]],[[22093,31641],[196,-48]],[[22289,31593],[502,-612],[-112,-671],[114,-1093],[-68,-996],[375,-322],[242,-629],[-418,-652],[-78,-464],[-664,252],[-470,-109],[-208,-370],[167,-1056],[488,-655]],[[22221,24060],[-8,-416],[-522,-1420],[-43,-672],[-387,-278],[-237,-485],[-492,-579],[-171,-616],[-776,-537],[-126,-588],[-758,198],[-204,-566],[397,-381]],[[90084,68243],[3075,-143]],[[82770,66463],[79,579],[-168,418],[240,438],[-287,1225],[219,1539]],[[39310,56446],[-194,352],[-297,1123],[-354,164],[-634,673],[-263,-171],[-595,486]],[[40058,62434],[566,-206],[483,-1],[398,206],[17,-741],[-152,-371],[462,-201],[1168,164],[1562,-198],[1986,-634],[774,-425],[549,-124],[1043,-29],[711,205]],[[24914,16229],[-6005,256]],[[40726,24899],[122,-803]],[[69128,20349],[-324,-319],[40,-416],[-279,-545],[-506,-228],[481,-574],[-160,-654]],[[64922,16083],[-759,-181],[-237,156]],[[63926,16058],[-1096,768],[395,931],[-361,94],[-195,593]],[[61865,20189],[-68,19]],[[62335,24711],[247,-89],[823,285],[676,438],[526,-21],[-171,-809],[-686,-346],[-520,-598],[-212,-609],[683,-153],[1129,424],[93,-766],[1578,225],[138,703],[-27,689],[-219,721],[201,529],[1184,676]],[[68845,31877],[-809,-819],[-968,-437],[-553,-477],[-1053,-267],[1186,-469],[378,-630],[450,-247],[-117,-486],[51,-1125],[-56,-686]],[[83841,53815],[85,-1678],[151,-328],[-188,-1188],[-414,-290],[-119,-683],[89,-858],[-252,-556],[5,-1794],[193,-349]],[[73492,63883],[202,-623],[1007,-1074],[46,-557],[374,-5],[449,-772],[1028,-520],[172,109],[1264,-496],[429,-385],[1529,-125],[1159,-304],[138,-239],[693,-303],[254,-460]],[[29869,25158],[59,-226],[856,-332]],[[29190,30291],[6,-294],[-428,-743],[176,-438],[117,-966],[485,-811]],[[29546,27039],[-497,-298]],[[26393,30081],[586,705],[305,148],[311,478],[762,-246],[198,-630],[635,-245]],[[76177,13809],[914,1016],[641,405],[-73,444],[579,637],[208,-55]],[[78446,16256],[-95,-602],[143,-411],[634,-490],[-275,-813],[-596,-413],[-260,95]],[[29546,27039],[382,-480],[1543,106],[346,-318],[450,-67]],[[60510,59805],[377,-85],[417,-517],[525,320],[-174,-940],[365,-748],[728,-229],[1622,100]],[[56998,54880],[-115,515],[-430,-60],[-794,116],[-229,-200]],[[55430,55251],[-891,491],[244,243],[-97,549],[208,360],[851,535],[110,362],[438,509],[779,66],[464,996]],[[39306,32414],[-55,279],[-678,71],[-454,-161],[-808,485],[-535,104],[-200,508],[-774,-277],[-962,-905],[-517,693],[131,340],[-281,733]],[[34173,34284],[671,-272],[949,422],[318,320],[488,-176],[844,148],[505,-833],[459,-27],[869,203],[157,-124],[1340,-215]],[[64820,13473],[-663,58],[-603,830],[419,873],[-47,824]],[[37588,40147],[527,-371],[244,586],[545,257],[470,424],[269,588],[360,418],[398,-119],[214,695],[-164,164],[-39,935],[502,724],[83,570],[392,204],[317,435],[368,1113],[783,817]],[[82477,65577],[-747,-206],[-683,-9],[-491,-394],[-796,81],[-226,197],[-742,-23],[-1004,236],[-488,-597],[-507,188],[-336,473],[-138,668],[-639,639],[-911,88],[-193,506]],[[75712,72305],[409,-217],[449,-548],[682,177],[728,-194],[1438,463],[604,-31],[170,238],[1037,-11],[418,-226],[1256,864],[255,-122]],[[10226,65974],[-4741,14],[-3739,8],[-905,79],[43,1153],[427,824],[-196,634],[198,864],[-40,1122],[167,634],[-631,824],[-378,779],[159,675],[-377,185],[201,724],[339,746]],[[59510,9065],[-62,886],[-197,172],[27,857],[257,401],[96,619],[-698,856],[131,702],[-330,569],[-294,71],[-71,486]],[[55995,35555],[370,217],[1138,124],[374,-426],[588,265],[214,-186],[529,246]],[[78991,78208],[3198,-239]],[[82189,77969],[576,-852],[13,-336],[-447,-280],[146,-792],[368,-707],[233,204],[791,-882]],[[29190,30291],[609,325]],[[51335,43976],[526,-253],[604,-91],[480,603],[787,-188],[959,-818],[-26,-611],[402,-41],[123,-653],[679,-464],[345,103],[569,-500],[588,-96]],[[91867,72868],[431,-134],[1056,559],[884,-644],[1030,39],[485,-314],[541,94],[742,-236],[-34,446],[-427,158],[-364,506],[412,1190],[-1421,771],[24,255],[-654,921],[6,619]],[[94578,77098],[5421,-377],[-346,-630],[-423,-1283],[-240,-143],[-459,-684],[81,-851],[-365,-1019],[55,-209],[-486,-455],[-124,-590],[-254,-352],[-26,-532],[-734,-913]],[[95843,62974],[-381,-1402],[10,-719],[219,-390],[513,-130],[-41,-708],[-521,-591],[67,-241]],[[92452,55743],[-501,601],[-960,471],[423,333],[169,855],[-142,252],[-607,-47],[-575,-251]],[[31051,37780],[-4949,30],[-3439,17]],[[55430,55251],[-585,-473],[-164,268],[-1115,58]],[[53566,55104],[-544,388],[-338,1136],[-508,698],[-197,542],[232,457],[-525,760]],[[51224,61872],[-399,807],[120,336]],[[53566,55104],[-568,-277],[-30,-785],[567,-1423],[-12,-341],[-523,-1032],[124,-642],[541,-458],[144,-528],[345,-554]],[[48317,50554],[424,667],[-215,438],[296,859]],[[34292,35090],[-119,-806]],[[25051,32187],[-1740,128],[-1022,-722]],[[42569,48723],[-478,898],[-162,564],[-500,438],[25,592],[-404,647],[-16,878],[-199,655],[126,319]],[[55039,70721],[328,222],[434,-218],[335,407],[217,561],[292,226],[102,495],[-108,634]],[[80298,17916],[-681,-360],[20,-874],[-1018,-236],[-173,-190]],[[82189,77969],[6729,-494],[5660,-377]]],"transform":{"scale":[0.0001140116230572306,0.00010688564066440663],"translate":[-61.62540498500001,-18.0411339272]},"objects":{"mun":{"type":"GeometryCollection","geometries":[{"arcs":[[0,1,2,3,4]],"type":"Polygon","properties":{"codarea":"5100102","nome":"Acorizal"}},{"arcs":[[5,6,7,8]],"type":"Polygon","properties":{"codarea":"5100201","nome":"Água Boa"}},{"arcs":[[9,10,11,12,13,14,15,16]],"type":"Polygon","properties":{"codarea":"5100250","nome":"Alta Floresta"}},{"arcs":[[17,18,19,20,21,22]],"type":"Polygon","properties":{"codarea":"5100300","nome":"Alto Araguaia"}},{"arcs":[[23,24,25,26]],"type":"Polygon","properties":{"codarea":"5100359","nome":"Alto Boa Vista"}},{"arcs":[[27,-22,28,29,30]],"type":"Polygon","properties":{"codarea":"5100409","nome":"Alto Garças"}},{"arcs":[[31,32,33,34,35,36]],"type":"Polygon","properties":{"codarea":"5100508","nome":"Alto Paraguai"}},{"arcs":[[37,-19]],"type":"Polygon","properties":{"codarea":"5100607","nome":"Alto Taquari"}},{"arcs":[[38,39,40,41,42]],"type":"Polygon","properties":{"codarea":"5100805","nome":"Apiacás"}},{"arcs":[[43,44,45,46]],"type":"Polygon","properties":{"codarea":"5101001","nome":"Araguaiana"}},{"arcs":[[47,-23,-28,48]],"type":"Polygon","properties":{"codarea":"5101209","nome":"Araguainha"}},{"arcs":[[49,50,51,52,53]],"type":"Polygon","properties":{"codarea":"5101258","nome":"Araputanga"}},{"arcs":[[54,55,56,57]],"type":"Polygon","properties":{"codarea":"5101308","nome":"Arenápolis"}},{"arcs":[[58,59,60,61,62,63]],"type":"Polygon","properties":{"codarea":"5101407","nome":"Aripuanã"}},{"arcs":[[64,65,66,67,68]],"type":"Polygon","properties":{"codarea":"5101605","nome":"Barão de Melgaço"}},{"arcs":[[69,70,-34,71,72,73,74,75,76]],"type":"Polygon","properties":{"codarea":"5101704","nome":"Barra do Bugres"}},{"arcs":[[-45,81,82,83,84,85]],"type":"Polygon","properties":{"codarea":"5101803","nome":"Barra do Garças"}},{"arcs":[[86,87,88,89,-25]],"type":"Polygon","properties":{"codarea":"5101852","nome":"Bom Jesus do Araguaia"}},{"arcs":[[90,91,92,93,94,95]],"type":"Polygon","properties":{"codarea":"5101902","nome":"Brasnorte"}},{"arcs":[[96,97,98,99,100,101,102,103,104,-74]],"type":"Polygon","properties":{"codarea":"5102504","nome":"Cáceres"}},{"arcs":[[105,106,107,108,109,-7]],"type":"Polygon","properties":{"codarea":"5102603","nome":"Campinápolis"}},{"arcs":[[110,111,112,113,-92]],"type":"Polygon","properties":{"codarea":"5102637","nome":"Campo Novo do Parecis"}},{"arcs":[[114,115,116,117,118,119]],"type":"Polygon","properties":{"codarea":"5102678","nome":"Campo Verde"}},{"arcs":[[120,121,122,123,124]],"type":"Polygon","properties":{"codarea":"5102686","nome":"Campos de Júlio"}},{"arcs":[[125,126,127,128]],"type":"Polygon","properties":{"codarea":"5102694","nome":"Canabrava do Norte"}},{"arcs":[[129,130,131,-8,132,133]],"type":"Polygon","properties":{"codarea":"5102702","nome":"Canarana"}},{"arcs":[[134,135,136,-11,137]],"type":"Polygon","properties":{"codarea":"5102793","nome":"Carlinda"}},{"arcs":[[138,-95,139,-61,140]],"type":"Polygon","properties":{"codarea":"5102850","nome":"Castanheira"}},{"arcs":[[-119,141,142,-5,143,144]],"type":"Polygon","properties":{"codarea":"5103007","nome":"Chapada dos Guimarães"}},{"arcs":[[145,146,147,148,149]],"type":"Polygon","properties":{"codarea":"5103056","nome":"Cláudia"}},{"arcs":[[-47,150,151,-131,152,153,154]],"type":"Polygon","properties":{"codarea":"5103106","nome":"Cocalinho"}},{"arcs":[[155,156,157,158,-136,159]],"type":"Polygon","properties":{"codarea":"5103205","nome":"Colíder"}},{"arcs":[[-64,160,161,162]],"type":"Polygon","properties":{"codarea":"5103254","nome":"Colniza"}},{"arcs":[[163,-124,164,165,166,167]],"type":"Polygon","properties":{"codarea":"5103304","nome":"Comodoro"}},{"arcs":[[168,169,170,171,172]],"type":"Polygon","properties":{"codarea":"5103353","nome":"Confresa"}},{"arcs":[[173,174,175,-122,176]],"type":"Polygon","properties":{"codarea":"5103361","nome":"Conquista D'Oeste"}},{"arcs":[[-42,177,178,-59,-163,179]],"type":"Polygon","properties":{"codarea":"5103379","nome":"Cotriguaçu"}},{"arcs":[[180,181,-1,-143]],"type":"Polygon","properties":{"codarea":"5103403","nome":"Cuiabá"}},{"arcs":[[182,-104,183]],"type":"Polygon","properties":{"codarea":"5103437","nome":"Curvelândia"}},{"arcs":[[-55,-35,-71,184,185]],"type":"Polygon","properties":{"codarea":"5103452","nome":"Denise"}},{"arcs":[[186,187,188,189,-37,190,191,192,-112]],"type":"Polygon","properties":{"codarea":"5103502","nome":"Diamantino"}},{"arcs":[[193,194,195,196,-116]],"type":"Polygon","properties":{"codarea":"5103601","nome":"Dom Aquino"}},{"arcs":[[197,198,199,200,201,202,203,204,205]],"type":"Polygon","properties":{"codarea":"5103700","nome":"Feliz Natal"}},{"arcs":[[206,207,208,209,210]],"type":"Polygon","properties":{"codarea":"5103809","nome":"Figueirópolis D'Oeste"}},{"arcs":[[-133,-110,211,-199,212]],"type":"Polygon","properties":{"codarea":"5103858","nome":"Gaúcha do Norte"}},{"arcs":[[-84,213,214,215,216]],"type":"Polygon","properties":{"codarea":"5103908","nome":"General Carneiro"}},{"arcs":[[217,-102,218,-209,219]],"type":"Polygon","properties":{"codarea":"5103957","nome":"Glória D'Oeste"}},{"arcs":[[220,221,222]],"type":"Polygon","properties":{"codarea":"5104104","nome":"Guarantã do Norte"}},{"arcs":[[223,-31,224,225,226,227,228]],"type":"Polygon","properties":{"codarea":"5104203","nome":"Guiratinga"}},{"arcs":[[229,-207,230,-52]],"type":"Polygon","properties":{"codarea":"5104500","nome":"Indiavaí"}},{"arcs":[[231,232,233,234,235,236]],"type":"Polygon","properties":{"codarea":"5104526","nome":"Ipiranga do Norte"}},{"arcs":[[-235,237,238,239]],"type":"Polygon","properties":{"codarea":"5104542","nome":"Itanhangá"}},{"arcs":[[-158,240,-150,241,242,243]],"type":"Polygon","properties":{"codarea":"5104559","nome":"Itaúba"}},{"arcs":[[244,-29,-21,245,-65,246,247]],"type":"Polygon","properties":{"codarea":"5104609","nome":"Itiquira"}},{"arcs":[[-197,248,249,250,-117]],"type":"Polygon","properties":{"codarea":"5104807","nome":"Jaciara"}},{"arcs":[[251,252,253,-3]],"type":"Polygon","properties":{"codarea":"5104906","nome":"Jangada"}},{"arcs":[[-231,-211,254,255,256,79,257,-53]],"type":"Polygon","properties":{"codarea":"5105002","nome":"Jauru"}},{"arcs":[[-14,258,259,260,261,-96,-139,262,263,264]],"type":"Polygon","properties":{"codarea":"5105101","nome":"Juara"}},{"arcs":[[-140,-94,265,-168,266,267,-62]],"type":"Polygon","properties":{"codarea":"5105150","nome":"Juína"}},{"arcs":[[-141,-60,-179,268,-263]],"type":"Polygon","properties":{"codarea":"5105176","nome":"Juruena"}},{"arcs":[[269,270,-250,271,272]],"type":"Polygon","properties":{"codarea":"5105200","nome":"Juscimeira"}},{"arcs":[[-105,-183,273,274,275,276,-75]],"type":"Polygon","properties":{"codarea":"5105234","nome":"Lambari D'Oeste"}},{"arcs":[[277,278,279]],"type":"Polygon","properties":{"codarea":"5105259","nome":"Lucas do Rio Verde"}},{"arcs":[[280,281,-127,282,283]],"type":"Polygon","properties":{"codarea":"5105309","nome":"Luciara"}},{"arcs":[[-166,284,-175,285,286,287]],"type":"Polygon","properties":{"codarea":"5105507","nome":"Vila Bela da Santíssima Trindade"}},{"arcs":[[288,289,-205,290,291,292]],"type":"Polygon","properties":{"codarea":"5105580","nome":"Marcelândia"}},{"arcs":[[293,294,295,296,-221]],"type":"Polygon","properties":{"codarea":"5105606","nome":"Matupá"}},{"arcs":[[-184,-103,-218,297,-274]],"type":"Polygon","properties":{"codarea":"5105622","nome":"Mirassol d'Oeste"}},{"arcs":[[298,299,-32,-190,300]],"type":"Polygon","properties":{"codarea":"5105903","nome":"Nobres"}},{"arcs":[[-36,-58,301,-191]],"type":"Polygon","properties":{"codarea":"5106000","nome":"Nortelândia"}},{"arcs":[[-253,302,303,-68,304,-98,305,306]],"type":"Polygon","properties":{"codarea":"5106109","nome":"Nossa Senhora do Livramento"}},{"arcs":[[307,-264,-269,-178,-41]],"type":"Polygon","properties":{"codarea":"5106158","nome":"Nova Bandeirantes"}},{"arcs":[[-152,308,-9,-132]],"type":"Polygon","properties":{"codarea":"5106174","nome":"Nova Nazaré"}},{"arcs":[[-176,-285,-165,-123]],"type":"Polygon","properties":{"codarea":"5106182","nome":"Nova Lacerda"}},{"arcs":[[-292,309,-146,-241,-157,310,311]],"type":"Polygon","properties":{"codarea":"5106190","nome":"Nova Santa Helena"}},{"arcs":[[312,-120,-145,313,314]],"type":"Polygon","properties":{"codarea":"5106208","nome":"Nova Brasilândia"}},{"arcs":[[-244,315,-12,-137,-159]],"type":"Polygon","properties":{"codarea":"5106216","nome":"Nova Canaã do Norte"}},{"arcs":[[-278,316,317,-301,-189,318,319,320]],"type":"Polygon","properties":{"codarea":"5106224","nome":"Nova Mutum"}},{"arcs":[[-70,321,322,-185]],"type":"Polygon","properties":{"codarea":"5106232","nome":"Nova Olímpia"}},{"arcs":[[323,324,325,326,-201]],"type":"Polygon","properties":{"codarea":"5106240","nome":"Nova Ubiratã"}},{"arcs":[[-309,-151,-46,-86,327,-106,-6]],"type":"Polygon","properties":{"codarea":"5106257","nome":"Nova Xavantina"}},{"arcs":[[328,-222,-297,329,-138,-10]],"type":"Polygon","properties":{"codarea":"5106265","nome":"Novo Mundo"}},{"arcs":[[330,331,-260]],"type":"Polygon","properties":{"codarea":"5106273","nome":"Novo Horizonte do Norte"}},{"arcs":[[-328,-85,-217,332,333,334,-107]],"type":"Polygon","properties":{"codarea":"5106281","nome":"Novo São Joaquim"}},{"arcs":[[-16,335,-39,336]],"type":"Polygon","properties":{"codarea":"5106299","nome":"Paranaíta"}},{"arcs":[[-109,337,338,339,340,341,-324,-200,-212]],"type":"Polygon","properties":{"codarea":"5106307","nome":"Paranatinga"}},{"arcs":[[-154,342,-88,343,344,345]],"type":"Polygon","properties":{"codarea":"5106315","nome":"Novo Santo Antônio"}},{"arcs":[[-30,-245,346,347,-225]],"type":"Polygon","properties":{"codarea":"5106372","nome":"Pedra Preta"}},{"arcs":[[348,349,350,-293,-312,351,352,-295]],"type":"Polygon","properties":{"codarea":"5106422","nome":"Peixoto de Azevedo"}},{"arcs":[[353,-315,354,-340]],"type":"Polygon","properties":{"codarea":"5106455","nome":"Planalto da Serra"}},{"arcs":[[-67,355,-99,-305]],"type":"Polygon","properties":{"codarea":"5106505","nome":"Poconé"}},{"arcs":[[-83,356,357,-229,358,-214]],"type":"Polygon","properties":{"codarea":"5106653","nome":"Pontal do Araguaia"}},{"arcs":[[359,360,-49,361]],"type":"Polygon","properties":{"codarea":"5106703","nome":"Ponte Branca"}},{"arcs":[[362,363,-256,364,-286,-174]],"type":"Polygon","properties":{"codarea":"5106752","nome":"Pontes e Lacerda"}},{"arcs":[[365,-283,-126,366,-170]],"type":"Polygon","properties":{"codarea":"5106778","nome":"Porto Alegre do Norte"}},{"arcs":[[-236,-240,367,-261,-332,368]],"type":"Polygon","properties":{"codarea":"5106802","nome":"Porto dos Gaúchos"}},{"arcs":[[-210,-219,-101,369,-287,-365,-255]],"type":"Polygon","properties":{"codarea":"5106828","nome":"Porto Esperidião"}},{"arcs":[[370,-306,-97,-73]],"type":"Polygon","properties":{"codarea":"5106851","nome":"Porto Estrela"}},{"arcs":[[-216,371,-227,372,373,-273,374,-195,375,-333]],"type":"Polygon","properties":{"codarea":"5107008","nome":"Poxoréo"}},{"arcs":[[376,-334,-376,-194,-115,-313,-354,-339]],"type":"Polygon","properties":{"codarea":"5107040","nome":"Primavera do Leste"}},{"arcs":[[-26,-90,377,-134,-213,-198,378]],"type":"Polygon","properties":{"codarea":"5107065","nome":"Querência"}},{"arcs":[[-298,-220,-208,-230,-51,379,-275]],"type":"Polygon","properties":{"codarea":"5107107","nome":"São José dos Quatro Marcos"}},{"arcs":[[380,381,-54,-258,80,382]],"type":"Polygon","properties":{"codarea":"5107156","nome":"Reserva do Cabaçal"}},{"arcs":[[-343,-153,-130,-378,-89]],"type":"Polygon","properties":{"codarea":"5107180","nome":"Ribeirão Cascalheira"}},{"arcs":[[-360,383,384]],"type":"Polygon","properties":{"codarea":"5107198","nome":"Ribeirãozinho"}},{"arcs":[[-276,-380,-50,-382,385]],"type":"Polygon","properties":{"codarea":"5107206","nome":"Rio Branco"}},{"arcs":[[386,-203,387,388,-148]],"type":"Polygon","properties":{"codarea":"5107248","nome":"Santa Carmem"}},{"arcs":[[-56,-186,-323,389,390]],"type":"Polygon","properties":{"codarea":"5107263","nome":"Santo Afonso"}},{"arcs":[[-226,-348,391,-373]],"type":"Polygon","properties":{"codarea":"5107297","nome":"São José do Povo"}},{"arcs":[[-188,392,-319]],"type":"Polygon","properties":{"codarea":"5107305","nome":"São José do Rio Claro"}},{"arcs":[[-171,-367,-129,393,-289,-351,394]],"type":"Polygon","properties":{"codarea":"5107354","nome":"São José do Xingu"}},{"arcs":[[-272,-249,-196,-375]],"type":"Polygon","properties":{"codarea":"5107404","nome":"São Pedro da Cipa"}},{"arcs":[[-268,395,-161,-63]],"type":"Polygon","properties":{"codarea":"5107578","nome":"Rondolândia"}},{"arcs":[[-374,-392,-347,-248,396,-270]],"type":"Polygon","properties":{"codarea":"5107602","nome":"Rondonópolis"}},{"arcs":[[-341,-355,-314,-144,-4,-254,-307,-371,-72,-33,-300,397]],"type":"Polygon","properties":{"codarea":"5107701","nome":"Rosário Oeste"}},{"arcs":[[-172,-395,-350,398,399]],"type":"Polygon","properties":{"codarea":"5107743","nome":"Santa Cruz do Xingu"}},{"arcs":[[-76,-277,-386,-381,400]],"type":"Polygon","properties":{"codarea":"5107750","nome":"Salto do Céu"}},{"arcs":[[-325,-342,-398,-299,-318,401]],"type":"Polygon","properties":{"codarea":"5107768","nome":"Santa Rita do Trivelato"}},{"arcs":[[-284,-366,-169,402,403]],"type":"Polygon","properties":{"codarea":"5107776","nome":"Santa Terezinha"}},{"arcs":[[-335,-377,-338,-108]],"type":"Polygon","properties":{"codarea":"5107792","nome":"Santo Antônio do Leste"}},{"arcs":[[-118,-251,-271,-397,-247,-69,-304,-181,-142]],"type":"Polygon","properties":{"codarea":"5107800","nome":"Santo Antônio do Leverger"}},{"arcs":[[-128,-282,404,-345,405,-27,-379,-206,-290,-394]],"type":"Polygon","properties":{"codarea":"5107859","nome":"São Félix do Araguaia"}},{"arcs":[[-114,406,-125,-164,-266,-93]],"type":"Polygon","properties":{"codarea":"5107875","nome":"Sapezal"}},{"arcs":[[-344,-87,-24,-406]],"type":"Polygon","properties":{"codarea":"5107883","nome":"Serra Nova Dourada"}},{"arcs":[[-149,-389,407,408,-232,409,-242]],"type":"Polygon","properties":{"codarea":"5107909","nome":"Sinop"}},{"arcs":[[-409,410,-326,-402,-317,-280,411,-233]],"type":"Polygon","properties":{"codarea":"5107925","nome":"Sorriso"}},{"arcs":[[-316,-243,-410,-237,-369,-331,-259,-13]],"type":"Polygon","properties":{"codarea":"5107941","nome":"Tabaporã"}},{"arcs":[[-193,412,-390,-322,-77,-401,-383,77,413,-363,-177,-121,-407,-113]],"type":"Polygon","properties":{"codarea":"5107958","nome":"Tangará da Serra"}},{"arcs":[[-412,-279,-321,414,-238,-234]],"type":"Polygon","properties":{"codarea":"5108006","nome":"Tapurah"}},{"arcs":[[-311,-156,415,-352]],"type":"Polygon","properties":{"codarea":"5108055","nome":"Terra Nova do Norte"}},{"arcs":[[-359,-228,-372,-215]],"type":"Polygon","properties":{"codarea":"5108105","nome":"Tesouro"}},{"arcs":[[416,-384,-362,-224,-358]],"type":"Polygon","properties":{"codarea":"5108204","nome":"Torixoréu"}},{"arcs":[[-204,-387,-147,-310,-291]],"type":"Polygon","properties":{"codarea":"5108303","nome":"União do Sul"}},{"arcs":[[78,-257,-364,-414]],"type":"Polygon","properties":{"codarea":"5108352","nome":"Vale de São Domingos"}},{"arcs":[[-303,-252,-2,-182]],"type":"Polygon","properties":{"codarea":"5108402","nome":"Várzea Grande"}},{"arcs":[[-202,-327,-411,-408,-388]],"type":"Polygon","properties":{"codarea":"5108501","nome":"Vera"}},{"arcs":[[-403,-173,-400,417]],"type":"Polygon","properties":{"codarea":"5108600","nome":"Vila Rica"}},{"arcs":[[-296,-353,-416,-160,-135,-330]],"type":"Polygon","properties":{"codarea":"5108808","nome":"Nova Guarita"}},{"arcs":[[-302,-57,-391,-413,-192]],"type":"Polygon","properties":{"codarea":"5108857","nome":"Nova Marilândia"}},{"arcs":[[-239,-415,-320,-393,-187,-111,-91,-262,-368]],"type":"Polygon","properties":{"codarea":"5108907","nome":"Nova Maringá"}},{"arcs":[[-15,-265,-308,-40,-336]],"type":"Polygon","properties":{"codarea":"5108956","nome":"Nova Monte Verde"}}]}}};
/* ===================== MAPA DE MATO GROSSO: ESCOLAS E DREs ===================== */
const CAMPOS_ESC = ['codigo','nome','dre','municipio','tipo','localidade','endereco','numero','cep','bairro','telefone','email','latitude','longitude','alunos'];
const CORES_DRE = ['#2563eb','#dc2626','#16a34a','#d97706','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#0d9488','#9333ea','#b45309','#475569','#1d4ed8','#be123c'];
const GRUPOS_TIPO = [['Regular', /^ESCOLA$/], ['Cívico-militar', /CÍVICO/], ['Militar', /^ESCOLA MILITAR/], ['Campo', /CAMPO/], ['Indígena', /INDÍGENA/], ['Quilombola', /QUILOMBOLA/], ['Integral', /INTEGRAL/], ['Especializada', /ESPECIALIZADA/], ['Confessional', /CONFESSIONAL/]];
const CORES_TIPO = { 'Regular':'#2563eb', 'Cívico-militar':'#0f766e', 'Militar':'#334155', 'Campo':'#65a30d', 'Indígena':'#c2410c', 'Quilombola':'#7c2d12', 'Integral':'#7c3aed', 'Especializada':'#db2777', 'Confessional':'#ca8a04', 'Outro':'#94a3b8' };
const MODOS_MT = {
  dre:['fa-circle-dot', 'Unidades por DRE', 'Cada escola na cor da DRE a que é subordinada'],
  sodre:['fa-building-flag', 'Somente as DREs', 'Só as sedes das DREs e as suas regiões, sem as escolas'],
  regioes:['fa-draw-polygon', 'Regiões das DREs', 'Municípios pintados pela DRE, com as escolas por cima'],
  divisao:['fa-map', 'Divisão municipal', 'Cada município com uma cor, suas divisas e o nome'],
  municipio:['fa-layer-group', 'Escolas por município', 'Quanto mais escuro, mais escolas no município'],
  cluster:['fa-object-group', 'Agrupadas', 'Bolhas com a quantidade de escolas; aproxime para separar'],
  tipo:['fa-shapes', 'Tipo de escola', 'Regular, cívico-militar, campo, indígena, integral...'],
  localidade:['fa-tree-city', 'Urbanas e rurais', 'Localização da escola'],
  distancia:['fa-route', 'Distância até a DRE', 'Cor da escola pela distância em linha reta até a sede da sua DRE'],
  alunos:['fa-children', 'Quantidade de alunos', 'Cor e tamanho da escola pelo número de alunos']
};
const mt = { mapa:null, camadas:{}, base:'', modo:store.get('gaborg_mt_modo', 'dre'), fil:{ dres:new Set(), tipo:'', loc:'', q:'' }, foco:-1, lado:window.innerWidth > 820, ligacoes:store.get('gaborg_mt_lig', true), divisas:store.get('gaborg_mt_div', false), rotulos:store.get('gaborg_mt_rot', false), leg:store.get('gaborg_mt_leg2', false), mun:'', marcadores:new Map(), aberto:new Set(), carregando:null, malha:null, erroTiles:0 };
function escolasLista(){
  if (DB.escolas && DB.escolas.length) return DB.escolas.map(e => Object.assign({}, e, { latitude:numBR(e.latitude), longitude:numBR(e.longitude) })).filter(e => e.latitude && e.longitude);
  if (!escolasLista.seed) escolasLista.seed = ESCOLAS_BASE.map(r => ({ codigo:r[0], nome:r[1], dre:ESCOLAS_DRES[r[2]], municipio:r[3], tipo:r[4], localidade:r[5] === 'R' ? 'RURAL' : 'URBANA', endereco:r[6], numero:r[7], cep:r[8], bairro:r[9], telefone:r[10], email:r[11], latitude:r[12], longitude:r[13], alunos:String(r[14] ?? '') }));
  return escolasLista.seed;
}
function dresDe(lista){ return [...new Set(lista.map(e => e.dre))].sort((a, b) => a.localeCompare(b, 'pt-BR')); }
const corDRE = (dres, d) => CORES_DRE[Math.max(0, dres.indexOf(d)) % CORES_DRE.length];
const nomeDRE = d => String(d || '').replace(/^DRE\s+/i, '').toLowerCase().replace(/(^|\s|-)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Da|Do|Das|Dos|E)\b/g, x => x.toLowerCase());
const grupoTipo = t => (GRUPOS_TIPO.find(([, re]) => re.test(String(t).toUpperCase())) || ['Outro'])[0];
/* ---------- símbolo de cada tipo de unidade escolar: selo na cor (DRE ou modo do mapa) com um desenho branco que lembra o tipo ---------- */
const FORMAS_TIPO = { 'Regular':'escola', 'Cívico-militar':'insignia', 'Militar':'escudo', 'Campo':'broto', 'Indígena':'pena', 'Quilombola':'comunidade', 'Integral':'relogio', 'Especializada':'acessivel', 'Confessional':'cruz', 'Outro':'ponto' };
const NOMES_FORMA = { escola:'prédio escolar', insignia:'estrela de insígnia', escudo:'escudo militar', broto:'planta do campo', pena:'pena (cocar)', comunidade:'comunidade (pessoas)', relogio:'relógio (tempo integral)', acessivel:'acessibilidade (educação especial)', cruz:'cruz', ponto:'ponto' };
const GLIFOS = {
  escola:'M0 -7.2L7.4 -1.6H5.6V6.6H1.6V2.4H-1.6V6.6H-5.6V-1.6H-7.4Z',
  insignia:'M0 -7.6L2.2 -2.6L7.4 -2.3L3.4 1.1L4.7 6.4L0 3.5L-4.7 6.4L-3.4 1.1L-7.4 -2.3L-2.2 -2.6Z',
  escudo:'M0 -7.6L6.6 -5V0.2C6.6 3.9 3.8 6.4 0 7.6C-3.8 6.4 -6.6 3.9 -6.6 0.2V-5ZM0 -5.3V5.4C2.6 4.4 4.5 2.6 4.5 0.1V-3.6Z',
  broto:'M-0.9 7.2V-0.6H0.9V7.2ZM-0.6 1.8C-5.4 1.8 -7.2 -1.8 -7.2 -4.6C-2.6 -4.6 -0.6 -2.2 -0.6 1.8ZM0.6 -0.4C0.6 -4.6 2.8 -7.4 7.2 -7.4C7.2 -3.8 5.2 -0.4 0.6 -0.4Z',
  pena:'M6.8 -7.4C-1.2 -6.8 -5.6 -1 -5.8 5.2L-7.2 7.4L-6 7.6L-4.6 5.6C0.8 5.2 5.8 1.2 6.8 -7.4ZM4 -4.2L-3.6 4.6L-4.2 4.1L3.5 -4.7Z',
  comunidade:'M0 -6.8A2.3 2.3 0 1 1 0 -2.2A2.3 2.3 0 1 1 0 -6.8ZM-3.8 6.2C-3.8 1.6 -2.2 -0.8 0 -0.8C2.2 -0.8 3.8 1.6 3.8 6.2ZM-5 -4.6A1.8 1.8 0 1 1 -5 -1A1.8 1.8 0 1 1 -5 -4.6ZM-7.6 6.2C-7.6 2.4 -6.6 0.4 -5 0.4C-4.4 0.4 -3.9 0.6 -3.5 1C-4.4 2.4 -4.8 4.2 -4.8 6.2ZM5 -4.6A1.8 1.8 0 1 1 5 -1A1.8 1.8 0 1 1 5 -4.6ZM7.6 6.2C7.6 2.4 6.6 0.4 5 0.4C4.4 0.4 3.9 0.6 3.5 1C4.4 2.4 4.8 4.2 4.8 6.2Z',
  relogio:'M0 -7.4A7.4 7.4 0 1 1 0 7.4A7.4 7.4 0 1 1 0 -7.4ZM0 -5.6A5.6 5.6 0 1 0 0 5.6A5.6 5.6 0 1 0 0 -5.6ZM-0.9 -4.4H0.9V-0.4L3.6 1.9L2.5 3.3L-0.9 0.5Z',
  acessivel:'M0 -7.6A1.9 1.9 0 1 1 0 -3.8A1.9 1.9 0 1 1 0 -7.6ZM-7 -3H7V-1.3H1.9V1.4L3.6 7H1.7L0 2.6L-1.7 7H-3.6L-1.9 1.4V-1.3H-7Z',
  cruz:'M-1.3 -7.6H1.3V-3.4H5V-0.9H1.3V7.6H-1.3V-0.9H-5V-3.4H-1.3Z',
  ponto:'M0 -3A3 3 0 1 1 0 3A3 3 0 1 1 0 -3Z'
};
const formaTipo = t => FORMAS_TIPO[grupoTipo(t)] || 'ponto';
/* selo (círculo na cor + desenho branco) como SVG; r = raio do selo */
function simbolo(f, x, y, r, cor, op){ const k = r * .7 / 7.6, o = op === undefined ? 1 : op;
  return `<circle cx="${(+x).toFixed(1)}" cy="${(+y).toFixed(1)}" r="${r.toFixed(2)}" fill="${cor}" fill-opacity="${o}" stroke="#ffffff" stroke-width="${(r * .14).toFixed(2)}"/>${r >= 2 ? `<path transform="translate(${(+x).toFixed(1)} ${(+y).toFixed(1)}) scale(${k.toFixed(3)})" d="${GLIFOS[f] || GLIFOS.ponto}" fill="#ffffff" fill-opacity="${o}" fill-rule="evenodd"/>` : ''}`; }
function iconeTipoSVG(tipo, cor, t){ t = t || 14; const f = FORMAS_TIPO[tipo] || formaTipo(tipo), c = t / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" width="${t}" height="${t}" class="ic-tipo">${simbolo(f, c, c, c - .4, cor || CORES_TIPO[tipo] || '#2563eb')}</svg>`; }
/* marcador do Leaflet: o círculo continua sendo um CircleMarker (cluster, tooltip, setRadius) e o desenho vai por cima */
function prepararMarcadorEscola(){
  if (!window.L || L.EscolaMarker) return;
  const visivel = l => !l._empty() && l._radius >= 4.2, kk = l => l._radius * .7 / 7.6, opG = l => l.options.fillOpacity < .5 ? .35 : 1;
  L.SVG.include({ _updateGlifo(l){ let g = l._gl; if (!g) { g = l._gl = L.SVG.create('path'); g.setAttribute('fill', '#ffffff'); g.setAttribute('fill-rule', 'evenodd'); g.setAttribute('pointer-events', 'none'); g.setAttribute('d', GLIFOS[l.options.forma] || GLIFOS.ponto); }
    if (l._path && l._path.parentNode && g.previousSibling !== l._path) l._path.parentNode.insertBefore(g, l._path.nextSibling);
    if (!visivel(l)) { g.setAttribute('display', 'none'); return; } g.removeAttribute('display'); const p = l._point; g.setAttribute('transform', `translate(${p.x} ${p.y}) scale(${kk(l).toFixed(3)})`); g.setAttribute('fill-opacity', opG(l)); } });
  L.Canvas.include({ _updateGlifo(l){ if (!this._drawing || !visivel(l)) return; const ctx = this._ctx, p = l._point, k = kk(l); l._p2d = l._p2d || new Path2D(GLIFOS[l.options.forma] || GLIFOS.ponto);
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(k, k); ctx.globalAlpha = opG(l); ctx.fillStyle = '#ffffff'; ctx.fill(l._p2d, 'evenodd'); ctx.restore(); } });
  L.EscolaMarker = L.CircleMarker.extend({ options:{ forma:'ponto' },
    _updatePath(){ L.CircleMarker.prototype._updatePath.call(this); if (this._renderer && this._renderer._updateGlifo) this._renderer._updateGlifo(this); },
    onAdd(map){ L.CircleMarker.prototype.onAdd.call(this, map); if (this._renderer && this._renderer._updateGlifo && this._point) this._renderer._updateGlifo(this); },
    onRemove(map){ L.CircleMarker.prototype.onRemove.call(this, map); if (this._gl && this._gl.parentNode) this._gl.parentNode.removeChild(this._gl); },
    bringToFront(){ L.CircleMarker.prototype.bringToFront.call(this); if (this._gl && this._path && this._path.parentNode) this._path.parentNode.insertBefore(this._gl, this._path.nextSibling); return this; } });
  L.escolaMarker = (ll, o) => new L.EscolaMarker(ll, o);
}

const ALIAS_MUN = { julio:'camposdejulio', conquistadoeste:'conquistadooeste', poxoreo:'poxoreu' };
const chaveMun = n => { const k = norm(n).replace(/[^a-z]/g, ''); return ALIAS_MUN[k] || k; };
function sedeDRE(d, lista){
  const cid = norm(String(d).replace(/^DRE\s+/i, '')) === 'metropolitana' ? 'cuiaba' : norm(String(d).replace(/^DRE\s+/i, ''));
  let pts = lista.filter(e => e.dre === d && norm(e.municipio) === cid && e.localidade !== 'RURAL'); if (!pts.length) pts = lista.filter(e => e.dre === d && norm(e.municipio) === cid); if (!pts.length) pts = lista.filter(e => e.dre === d);
  return [pts.reduce((t, e) => t + e.latitude, 0) / pts.length, pts.reduce((t, e) => t + e.longitude, 0) / pts.length];
}
function setorDaDRE(d){
  const alvo = norm(d) === 'dre metropolitana' ? 'dme' : norm(d);
  return setoresOficiais().find(s => norm(s.sigla) === alvo || norm(s.nome) === norm('Diretoria Regional de Educação de ' + String(d).replace(/^DRE\s+/i, '')));
}
function carregarScript(srcs){
  const lista = [].concat(srcs);
  return lista.reduce((p, src) => p.catch(() => new Promise((ok, erro) => {
    if (document.querySelector(`script[data-ok="${src}"]`)) return ok();
    const s = document.createElement('script'); s.src = src; s.onload = () => { s.dataset.ok = src; ok(); }; s.onerror = () => { s.remove(); erro(new Error('Não foi possível carregar ' + src)); }; document.head.appendChild(s);
  })), Promise.reject(new Error('início')));
}
function carregarCSS(href){ if (document.querySelector(`link[href="${href}"]`)) return; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
async function carregarLeaflet(){
  if (!(window.L && L.map)) {
    carregarCSS('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
    await carregarScript(['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js']);
  }
}
async function carregarCluster(){
  if (window.L && L.markerClusterGroup) return true;
  try {
    carregarCSS('https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css');
    await carregarScript(['https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js', 'https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js']);
    return !!L.markerClusterGroup;
  } catch (e) { return false; }
}
/* Fundos de mapa sem chave de acesso (Esri e OpenStreetMap) e um modo sem fundo, que nunca falha */
const ESRI = s => `https://server.arcgisonline.com/ArcGIS/rest/services/${s}/MapServer/tile/{z}/{y}/{x}`;
const BASES_MT = {
  ruas:['OpenStreetMap', 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap'],
  claro:['Claro', ESRI('Canvas/World_Light_Gray_Base'), 'Esri, HERE, Garmin, © OpenStreetMap', ESRI('Canvas/World_Light_Gray_Reference')],
  escuro:['Escuro', ESRI('Canvas/World_Dark_Gray_Base'), 'Esri, HERE, Garmin, © OpenStreetMap', ESRI('Canvas/World_Dark_Gray_Reference')],
  topo:['Relevo', ESRI('World_Topo_Map'), 'Esri, HERE, Garmin, USGS'],
  satelite:['Satélite', ESRI('World_Imagery'), 'Esri, Maxar, Earthstar Geographics', ESRI('Reference/World_Boundaries_and_Places')],
  nenhum:['Sem fundo', null, '']
};
function trocarBaseMT(k){
  if (!mt.mapa) return; if (!BASES_MT[k]) k = 'ruas';
  mt.base = k; store.set('gaborg_mt_base3', k); mt.erroTiles = 0; mt.okTiles = 0;
  ['base', 'rotulosBase'].forEach(c => { if (mt.camadas[c]) { mt.mapa.removeLayer(mt.camadas[c]); mt.camadas[c] = null; } });
  const b = BASES_MT[k];
  $('#esc-map').classList.toggle('sem-fundo', !b[1]);
  if (b[1]) {
    mt.camadas.base = L.tileLayer(b[1], { attribution:b[2], maxZoom:18, maxNativeZoom:k === 'ruas' ? 19 : 16 }).addTo(mt.mapa);
    mt.camadas.base.on('tileerror', () => { mt.erroTiles++; if (mt.erroTiles > 12 && !mt.okTiles && mt.base === k) { trocarBaseMT('nenhum'); toast(`O fundo "${b[0]}" não respondeu. Mostrando sem fundo; escolha outro no botão de mapa.`, 'aviso'); } });
    mt.camadas.base.on('tileload', () => { mt.okTiles++; });
    if (b[3]) mt.camadas.rotulosBase = L.tileLayer(b[3], { pane:'rotulosBase', maxZoom:18, maxNativeZoom:16 }).addTo(mt.mapa);
  }
  if ($('#mt-menu') && $('#mt-menu').dataset.t === 'fundo') menuMT('fundo', null, true);
  estilizarMalhaMT();
}
async function renderEscolas(){
  const el = $('#esc-map'); if (!el) return;
  if (!mt.mapa) {
    $('#v-escolas').classList.toggle('sem-lado', !mt.lado);
    $('#esc-status').textContent = 'Carregando o mapa...';
    try { await (mt.carregando = mt.carregando || carregarLeaflet()); }
    catch (e) { $('#esc-status').innerHTML = `<span style="color:var(--perigo)">${esc(e.message)}. Verifique a internet e recarregue.</span>`; return; }
    $('#esc-status').textContent = '';
    mt.mapa = L.map(el, { zoomControl:false, preferCanvas:false, minZoom:4, maxZoom:18, zoomSnap:.25, zoomDelta:.5, wheelPxPerZoomLevel:110, attributionControl:true }).setView([-12.9, -55.6], 6);
    [['rotulosBase', 250, 1], ['mascara', 300, 1], ['malha', 350, 0], ['divisas', 380, 1], ['destaque', 390, 1]].forEach(([n, z, sem]) => { mt.mapa.createPane(n); mt.mapa.getPane(n).style.zIndex = z; if (sem) mt.mapa.getPane(n).style.pointerEvents = 'none'; });
    L.control.zoom({ position:'bottomright', zoomInTitle:'Aproximar', zoomOutTitle:'Afastar' }).addTo(mt.mapa);
    L.control.scale({ imperial:false, position:'bottomright' }).addTo(mt.mapa);
    mt.render = L.svg({ padding:.4 }); // SVG: deixa o mouse chegar aos municípios entre as escolas
    mt.svg = { malha:L.svg({ pane:'malha', padding:.5 }), mascara:L.svg({ pane:'mascara', padding:1 }), destaque:L.svg({ pane:'destaque', padding:.5 }) };
    ['malha', 'divisas', 'destaque', 'nomes', 'ligacoes', 'escolas', 'dres'].forEach(c => { mt.camadas[c] = L.layerGroup().addTo(mt.mapa); });
    trocarBaseMT(store.get('gaborg_mt_base3', 'ruas'));
    mt.mapa.on('click', () => { fecharMenuMT(); voltarMT(mt.mun ? 1 : 0); });
    const zoomCls = () => { el.classList.toggle('mt-longe', mt.mapa.getZoom() < (window.innerWidth > 820 ? 6.6 : 7.4)); el.classList.toggle('mt-perto', mt.mapa.getZoom() >= 8.5); el.classList.toggle('mt-sem-mun', mt.mapa.getZoom() < 7.6); el.classList.toggle('mt-div', mt.modo === 'divisao'); };
    mt.zoomCls = zoomCls;
    mt.mapa.on('zoomend', zoomCls); zoomCls();
    mt.mapa.on('movestart', fecharMenuMT);
    carregarMalhaMT();
    setTimeout(() => { mt.mapa.invalidateSize(); enquadrarMT(false); }, 60);
  } else setTimeout(() => mt.mapa.invalidateSize(), 60);
  montarControlesMT();
  desenharEscolasMT();
}
function montarControlesMT(){
  const c = $('#mt-ctrl'); if (!c) return;
  const [ic, nome] = MODOS_MT[mt.modo];
  c.innerHTML = `<div class="mt-barra">
      <button class="mt-b-modo" onclick="menuMT('modo',this)" title="Como as escolas aparecem no mapa"><i class="fa-solid ${ic}"></i><span>${esc(nome)}</span><i class="fa-solid fa-chevron-down"></i></button>
      <span class="mt-sep"></span>
      <button class="mt-bi" onclick="menuMT('fundo',this)" title="Fundo do mapa"><i class="fa-solid fa-map"></i></button>
      <button class="mt-bi" onclick="menuMT('camadas',this)" title="Linhas e nomes"><i class="fa-solid fa-sliders"></i></button>
      <button class="mt-bi" onclick="telaCheiaMT()" title="Tela cheia"><i class="fa-solid fa-expand"></i></button>
    </div><div class="mt-menu hidden" id="mt-menu"></div>`;
}
function fecharMenuMT(){ const m = $('#mt-menu'); if (m && !m.classList.contains('hidden')) { m.classList.add('hidden'); m.dataset.t = ''; } }
function menuMT(t, btn, manter){
  const m = $('#mt-menu'); if (!m) return;
  if (!manter && m.dataset.t === t) return fecharMenuMT();
  m.dataset.t = t;
  const sw = (k, n, d) => `<button class="mt-mi" onclick="alternarCamadaMT('${k}')"><span class="mt-sw ${mt[k] ? 'on' : ''}"></span><div><b>${n}</b><small>${d}</small></div></button>`;
  if (t === 'modo') m.innerHTML = `<div class="mt-mh">Mostrar as escolas</div>` + Object.entries(MODOS_MT).map(([k, [ic, n, d]]) => `<button class="mt-mi ${mt.modo === k ? 'on' : ''}" onclick="modoMT('${k}')"><i class="fa-solid ${ic}"></i><div><b>${esc(n)}</b><small>${esc(d)}</small></div>${mt.modo === k ? '<i class="fa-solid fa-check ck"></i>' : ''}</button>`).join('');
  else if (t === 'fundo') m.innerHTML = `<div class="mt-mh">Fundo do mapa</div>` + Object.entries(BASES_MT).map(([k, [n]]) => `<button class="mt-mi ${mt.base === k ? 'on' : ''}" onclick="trocarBaseMT('${k}')"><span class="mt-th mt-th-${k}"></span><div><b>${esc(n)}</b>${k === 'ruas' ? '<small>Mapa padrão do Leaflet, com cidades, rodovias e rios</small>' : k === 'nenhum' ? '<small>Só o território do estado</small>' : ''}</div>${mt.base === k ? '<i class="fa-solid fa-check ck"></i>' : ''}</button>`).join('');
  else m.innerHTML = `<div class="mt-mh">Linhas e nomes</div>` + sw('divisas', 'Divisas', 'Limites dos municípios e das regiões das DREs') + sw('rotulos', 'Nomes', 'Nome das regiões e dos municípios ao aproximar') + sw('ligacoes', 'Ligações', 'Linha de cada escola até a sua DRE');
  m.classList.remove('hidden');
}
document.addEventListener('pointerdown', e => { if (!e.target.closest || e.target.closest('.mt-ctrl')) return; fecharMenuMT(); });
async function modoMT(m){
  if (m === 'cluster' && !(await carregarCluster())) { toast('Não foi possível carregar o agrupamento. Mostrando por DRE.', 'aviso'); m = 'dre'; }
  mt.modo = m; store.set('gaborg_mt_modo', m); fecharMenuMT(); montarControlesMT(); if (mt.zoomCls) mt.zoomCls();
  desenharEscolasMT();
}
function telaCheiaMT(){ const a = $('.mt-area'); if (document.fullscreenElement) document.exitFullscreen(); else if (a.requestFullscreen) a.requestFullscreen().then(() => setTimeout(() => mt.mapa.invalidateSize(), 200)).catch(() => {}); }
document.addEventListener('fullscreenchange', () => { if (mt.mapa) setTimeout(() => mt.mapa.invalidateSize(), 200); });
function filtrarEscolasMT(lista){
  const f = mt.fil, q = norm(f.q);
  return lista.filter(e => (!f.dres.size || f.dres.has(e.dre)) && (!f.tipo || grupoTipo(e.tipo) === f.tipo || (f.tipo === 'Integral' && /INTEGRAL/.test(e.tipo))) && (!f.loc || e.localidade === f.loc) && (!q || norm(e.nome + ' ' + e.codigo + ' ' + e.municipio + ' ' + e.bairro).includes(q)));
}
/* ---------- Distâncias das escolas até a sede da sua DRE ---------- */
const FATOR_ESTRADA = 1.3, VEL_MEDIA = 70; // estimativa: estrada ≈ 1,3 × linha reta; 70 km/h em média
const FAIXAS_DIST = [[10, 'até 10 km', '#16a34a'], [50, '10 a 50 km', '#65a30d'], [100, '50 a 100 km', '#eab308'], [200, '100 a 200 km', '#f97316'], [300, '200 a 300 km', '#dc2626'], [Infinity, 'mais de 300 km', '#7f1d1d']];
const faixaDist = km => FAIXAS_DIST.find(f => km <= f[0]) || FAIXAS_DIST[FAIXAS_DIST.length - 1];
function kmEntre(a, b){ const R = 6371, r = x => x * Math.PI / 180, dLa = r(b[0] - a[0]), dLo = r(b[1] - a[1]), h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
const fmtKm = v => Math.round(v).toLocaleString('pt-BR') + ' km';
const fmtHoras = km => { const m = Math.round(km * FATOR_ESTRADA / VEL_MEDIA * 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + String(m % 60).padStart(2, '0') : ''); };
/* calcula uma vez por base de escolas: distância de cada escola à sede da sua DRE e a sede mais próxima */
function distanciasMT(){
  const sig = assinaturaMT(); if (distanciasMT.c && distanciasMT.c.sig === sig) return distanciasMT.c;
  const E = escolasLista(), dres = dresDe(E), sedes = new Map(dres.map(d => [d, sedeDRE(d, E)]));
  const porCod = new Map(), lista = E.map(e => {
    const p = [e.latitude, e.longitude], km = kmEntre(p, sedes.get(e.dre));
    let prox = null; dres.forEach(d => { if (d === e.dre) return; const k = kmEntre(p, sedes.get(d)); if (!prox || k < prox.km) prox = { dre:d, km:k }; });
    const o = { e, km, prox, mesmaCidade:norm(e.municipio) === norm(String(e.dre).replace(/^DRE\s+/i, '')) || (/METROPOLITANA/.test(e.dre) && /^(cuiaba|varzea grande)$/.test(norm(e.municipio))) };
    porCod.set(e.codigo, o); return o;
  });
  return distanciasMT.c = { sig, lista, porCod, sedes, dres };
}
const distEscola = e => { const o = distanciasMT().porCod.get(e.codigo); return o ? o.km : 0; };
function rotaDRE(e){ const s = distanciasMT().sedes.get(e.dre); return `https://www.google.com/maps/dir/?api=1&origin=${s[0].toFixed(5)},${s[1].toFixed(5)}&destination=${e.latitude},${e.longitude}&travelmode=driving`; }
function popupEscola(e, dres){
  const cor = corDRE(dres, e.dre), end = [e.endereco, e.numero && e.numero !== '0' ? e.numero : '', e.bairro].filter(Boolean).join(', ');
  return `<div class="mt-pop"><div class="t" style="--c:${cor}">${iconeTipoSVG(grupoTipo(e.tipo), cor, 15)}${esc(e.tipo)} · ${esc(e.localidade === 'RURAL' ? 'Rural' : 'Urbana')}</div><b>${esc(e.nome)}</b><small>Código ${esc(e.codigo)} · ${esc(e.municipio)}</small>
    <div class="l"><i class="fa-solid fa-children"></i><span><b>${num(e.alunos) ? fmtN(e.alunos) : '—'}</b> aluno(s)${num(e.alunos) ? ` · ${faixaAlunos(num(e.alunos))[1]}` : ''}</span></div>
    <div class="l"><i class="fa-solid fa-sitemap"></i><a href="#" onclick="event.preventDefault();focarDREmt(${dres.indexOf(e.dre)})" style="color:${cor}">${esc(e.dre)}</a></div>
    <div class="l"><i class="fa-solid fa-ruler"></i><span><b style="color:${faixaDist(distEscola(e))[2]}">${fmtKm(distEscola(e))}</b> em linha reta até a sede da DRE · ~${fmtKm(distEscola(e) * FATOR_ESTRADA)} por estrada · ~${fmtHoras(distEscola(e))} <a href="${rotaDRE(e)}" target="_blank" rel="noopener">rota real</a></span></div>
    ${end ? `<div class="l"><i class="fa-solid fa-location-dot"></i>${esc(end)}${e.cep ? ' · ' + esc(e.cep) : ''}</div>` : ''}
    ${e.telefone ? `<div class="l"><i class="fa-solid fa-phone"></i>${esc(e.telefone)}</div>` : ''}
    ${e.email ? `<div class="l"><i class="fa-solid fa-envelope"></i><a href="mailto:${esc(e.email)}">${esc(e.email)}</a></div>` : ''}
    <div class="a"><a href="https://www.google.com/maps/dir/?api=1&destination=${e.latitude},${e.longitude}" target="_blank" rel="noopener"><i class="fa-solid fa-route"></i>Como chegar</a><a href="#" onclick="event.preventDefault();mt.mapa.flyTo([${e.latitude},${e.longitude}],15)"><i class="fa-solid fa-magnifying-glass-plus"></i>Aproximar</a>${podeGestao() ? `<a href="#" onclick="event.preventDefault();formEscola(${arg(e.codigo)})"><i class="fa-solid fa-pen"></i>Editar</a>` : ''}</div></div>`;
}
function corEscolaMT(e, dres){
  if (mt.modo === 'tipo') return CORES_TIPO[grupoTipo(e.tipo)] || CORES_TIPO.Outro;
  if (mt.modo === 'localidade') return e.localidade === 'RURAL' ? '#65a30d' : '#2563eb';
  if (mt.modo === 'distancia') return faixaDist(distEscola(e))[2];
  if (mt.modo === 'alunos') return num(e.alunos) ? faixaAlunos(num(e.alunos))[2] : '#cbd5e1';
  if (mt.modo === 'municipio' || mt.modo === 'divisao') return '#0f172a';
  return corDRE(dres, e.dre);
}
function desenharEscolasMT(){
  if (!mt.mapa) return;
  const todas = escolasLista(), dres = dresDe(todas), lista = filtrarEscolasMT(todas), foco = mt.foco >= 0 ? dres[mt.foco] : null, modo = mt.modo, mun = mt.mun;
  if (mt.camadas.cluster) { mt.mapa.removeLayer(mt.camadas.cluster); mt.camadas.cluster = null; }
  mt.camadas.escolas.clearLayers(); mt.camadas.dres.clearLayers(); mt.camadas.ligacoes.clearLayers(); mt.marcadores.clear();
  const sedes = new Map(dres.map(d => [d, sedeDRE(d, todas)]));
  if ((mt.ligacoes && modo !== 'divisao') || modo === 'distancia' || (foco && modo !== 'sodre')) lista.filter(e => (!foco || e.dre === foco) && (!mun || chaveMun(e.municipio) === mun)).forEach(e => L.polyline([sedes.get(e.dre), [e.latitude, e.longitude]], { color:modo === 'distancia' ? faixaDist(distEscola(e))[2] : corDRE(dres, e.dre), weight:foco ? 1.6 : 1.1, opacity:foco ? .7 : .45, renderer:mt.render, interactive:false }).addTo(mt.camadas.ligacoes));
  const pequeno = ['regioes', 'municipio', 'divisao'].includes(modo);
  let destino = mt.camadas.escolas;
  if (modo === 'cluster' && L.markerClusterGroup) {
    destino = mt.camadas.cluster = L.markerClusterGroup({ showCoverageOnHover:false, spiderfyOnMaxZoom:true, maxClusterRadius:z => z < 7 ? 70 : 50, chunkedLoading:true,
      iconCreateFunction:cl => { const cont = {}; cl.getAllChildMarkers().forEach(m => { cont[m.options.fillColor] = (cont[m.options.fillColor] || 0) + 1; }); const tot = cl.getChildCount(), ord = Object.entries(cont).sort((a, b) => b[1] - a[1]);
        let ac = 0; const fatias = ord.map(([c, n]) => { const i = ac; ac += n / tot * 360; return `${c} ${i}deg ${ac}deg`; }).join(',');
        const t = tot < 10 ? 34 : tot < 50 ? 42 : tot < 150 ? 50 : 58;
        return L.divIcon({ html:`<div class="mt-bolha" style="width:${t}px;height:${t}px;background:conic-gradient(${fatias})"><span>${tot}</span></div>`, className:'mt-bolha-ic', iconSize:[t, t] }); } });
    mt.mapa.addLayer(destino);
  }
  if (modo !== 'sodre') lista.forEach(e => {
    const cor = corEscolaMT(e, dres), apagada = (foco && e.dre !== foco) || (mun && chaveMun(e.municipio) !== mun);
    const opts = { radius:modo === 'alunos' ? Math.max(4.6, Math.min(13, 4 + Math.sqrt(num(e.alunos)) / 4)) : pequeno ? 4.6 : (foco && !apagada ? 8.5 : 7), color:'#fff', weight:pequeno ? .8 : 1.3, fillColor:cor, fillOpacity:apagada ? .12 : (modo === 'municipio' ? .55 : .92), opacity:apagada ? .2 : 1 };
    if (destino === mt.camadas.escolas) opts.renderer = mt.render;
    prepararMarcadorEscola(); opts.forma = formaTipo(e.tipo); const m = L.escolaMarker([e.latitude, e.longitude], opts);
    if (!apagada) { m.on('mouseover', () => m.setRadius(opts.radius + 3)); m.on('mouseout', () => m.setRadius(opts.radius)); }
    m.bindTooltip(`<b>${esc(e.nome)}</b><br>${esc(e.municipio)} · ${esc(nomeDRE(e.dre))} · ${fmtKm(distEscola(e))} da DRE${num(e.alunos) ? ' · ' + fmtN(e.alunos) + ' alunos' : ''}`, { direction:'top', offset:[0, -4], className:'mt-tip' });
    m.bindPopup(() => popupEscola(e, dres), { maxWidth:320, className:'mt-popup' });
    destino.addLayer(m); mt.marcadores.set(e.codigo, m);
  });
  if (modo !== 'municipio' && (modo !== 'divisao' || foco)) dres.forEach((d, i) => {
    const n = lista.filter(e => e.dre === d).length; if (!n && (mt.fil.dres.size && !mt.fil.dres.has(d))) return;
    const icone = L.divIcon({ className:'mt-dre-ic', html:`<div class="mt-dre ${foco === d ? 'on' : ''} ${foco && foco !== d ? 'off' : ''}" style="--c:${corDRE(dres, d)}"><i class="fa-solid fa-building-flag"></i><span>${esc(nomeDRE(d))}</span><b>${n}</b></div>`, iconSize:null, iconAnchor:[14, 14] });
    L.marker(sedes.get(d), { icon:icone, zIndexOffset:1000 + (foco === d ? 500 : 0), keyboard:false, title:'Sede da ' + d }).on('click', ev => { L.DomEvent.stopPropagation(ev); focarDREmt(foco === d && !mt.mun ? -1 : i); }).on('mouseover', () => realcarDREmt(i)).on('mouseout', () => realcarDREmt(-1)).addTo(mt.camadas.dres);
  });
  estilizarMalhaMT(); legendaMT(dres, lista); trilhaMT(dres);
  painelEscolasMT(todas, dres, lista);
}
function enquadrarMT(anim){
  if (!mt.mapa) return;
  const dur = anim === false || semMovimento() ? 0 : .9, pad = { paddingTopLeft:[40, 70], paddingBottomRight:[40, 40], duration:dur };
  const todas = escolasLista(), dres = dresDe(todas), foco = mt.foco >= 0 ? dres[mt.foco] : null;
  const filtrando = mt.fil.dres.size || mt.fil.tipo || mt.fil.loc || mt.fil.q;
  if (mt.mun && mt.munB && mt.munB.get(mt.mun)) return mt.mapa.flyToBounds(mt.munB.get(mt.mun), Object.assign({ maxZoom:11.5 }, pad));
  if (foco && !filtrando && mt.regB && mt.regB.get(foco)) return mt.mapa.flyToBounds(mt.regB.get(foco), Object.assign({ maxZoom:10 }, pad));
  if (!foco && !filtrando && mt.estadoB) return mt.mapa.flyToBounds(mt.estadoB, Object.assign({}, pad, { paddingTopLeft:[20, 60], paddingBottomRight:[20, 20] }));
  const l = filtrarEscolasMT(todas).filter(e => !foco || e.dre === foco);
  if (!l.length) return;
  mt.mapa.flyToBounds(L.latLngBounds(l.map(e => [e.latitude, e.longitude])), Object.assign({ maxZoom:12 }, pad));
}
function focarDREmt(i){
  mt.foco = i; mt.mun = ''; if (mt.mapa) mt.mapa.closePopup();
  if (i >= 0) mt.aberto.add(dresDe(escolasLista())[i]);
  desenharEscolasMT(); enquadrarMT(true);
}
function selecionarMunMT(k){
  const dres = dresDe(escolasLista()), f = mt.munF && mt.munF.get(k);
  if (!f) return;
  if (mt.mun === k) return voltarMT(1);
  mt.mun = k; const i = dres.indexOf(f.properties.dre); mt.foco = i;
  if (mt.mapa) mt.mapa.closePopup();
  desenharEscolasMT(); enquadrarMT(true);
}
function voltarMT(n){
  if (n >= 1 && mt.mun) { mt.mun = ''; desenharEscolasMT(); enquadrarMT(true); return; }
  if (n === 0 && (mt.foco >= 0 || mt.mun)) { mt.mun = ''; focarDREmt(-1); }
}
function trilhaMT(dres){
  const t = $('#mt-trilha'); if (!t) return;
  const foco = mt.foco >= 0 ? dres[mt.foco] : null, f = mt.mun && mt.munF ? mt.munF.get(mt.mun) : null;
  t.innerHTML = `<button class="${foco ? '' : 'on'}" onclick="voltarMT(0)"><i class="fa-solid fa-map-location-dot"></i>Mato Grosso</button>`
    + (foco ? `<i class="fa-solid fa-chevron-right sep"></i><button class="${f ? '' : 'on'}" style="--c:${corDRE(dres, foco)}" onclick="${f ? 'voltarMT(1)' : 'enquadrarMT(true)'}"><span class="pt"></span>${esc(nomeDRE(foco))}</button>` : '')
    + (f ? `<i class="fa-solid fa-chevron-right sep"></i><button class="on" onclick="enquadrarMT(true)">${esc(f.properties.nome)}</button>` : '')
    + (foco ? `<button class="x" onclick="voltarMT(${f ? 1 : 0})" title="Voltar (Esc)"><i class="fa-solid fa-arrow-left"></i></button>` : '');
}
/* ---------- Malha municipal do IBGE: regiões, divisas e nomes ---------- */
/* Limites dos municípios de MT embutidos (IBGE, via geodata-br, simplificados): o mapa funciona mesmo sem acesso à API do IBGE.
   Depois, se a API do IBGE responder com a malha atual (142 municípios), ela substitui a embutida. */
async function carregarMalhaMT(){
  const usar = (topo, nomes) => {
    const obj = topo.objects[Object.keys(topo.objects)[0]];
    obj.geometries.forEach(g => { g.properties = g.properties || {}; if (nomes) g.properties.nome = nomes[String(g.properties.codarea)] || g.properties.nome || ''; });
    mt.malha = { topo, obj }; mt.malhaSig = ''; mt.camadas.mun = null;
    const a = $('#mt-aviso-malha'); if (a) a.classList.add('hidden');
    desenharMalhaMT();
  };
  let cache = null;
  try { cache = JSON.parse(localStorage.getItem('gaborg_ibge_mt3') || 'null'); } catch (e) {}
  if (cache && cache.topo && cache.nomes && Date.now() - (cache.em || 0) < 90 * 864e5) return usar(cache.topo, cache.nomes);
  usar(JSON.parse(JSON.stringify(MALHA_MT)), null);
  try {
    const [t, m] = await Promise.all([
      fetch('https://servicodados.ibge.gov.br/api/v3/malhas/estados/51?formato=application/json&qualidade=intermediaria&intrarregiao=municipio').then(r => { if (!r.ok) throw new Error('IBGE ' + r.status); return r.json(); }),
      fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios').then(r => r.json())
    ]);
    const obj = t && t.type === 'Topology' && t.objects[Object.keys(t.objects)[0]];
    if (!obj || !obj.geometries || obj.geometries.length < 140) throw new Error('malha do IBGE sem os municípios');
    const nomes = {}; m.forEach(x => { nomes[String(x.id)] = x.nome; });
    try { localStorage.removeItem('gaborg_ibge_mt2'); localStorage.setItem('gaborg_ibge_mt3', JSON.stringify({ topo:t, nomes, em:Date.now() })); } catch (e) {}
    usar(t, nomes);
  } catch (e) { console.info('GABOrg: usando os limites municipais embutidos (' + e.message + ')'); }
}
function dreDosMunicipios(){
  const porMun = new Map(); escolasLista().forEach(e => { const k = chaveMun(e.municipio), o = porMun.get(k) || {}; o[e.dre] = (o[e.dre] || 0) + 1; porMun.set(k, o); });
  return porMun;
}
function corEscala(n, max){
  if (!n) return '#e2e8f0';
  const passos = ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a8a'], lim = [1, 2, 4, 8, 16, 1e9];
  return passos[lim.findIndex(l => n <= l)];
}
function desenharMalhaMT(){ estilizarMalhaMT(); }
/* monta uma vez as camadas da malha (municípios, regiões, máscara fora do estado) e depois só muda o estilo */
function construirMalhaMT(){
  const { topo, obj, geo } = mt.malha, temTopo = !!(topo && window.topojson), todas = escolasLista(), dres = dresDe(todas);
  const porMun = dreDosMunicipios();
  const geoms = temTopo ? obj.geometries : geo.features;
  const PAL_MUN = ['#fde68a', '#a7f3d0', '#bfdbfe', '#fecaca', '#ddd6fe', '#fed7aa', '#a5f3fc', '#f5d0fe', '#d9f99d'];
  if (temTopo) {
    const viz = topojson.neighbors(geoms), ordem = geoms.map((g, i) => i).sort((a, b) => viz[b].length - viz[a].length), cor = [];
    ordem.forEach(i => { const usadas = new Set(viz[i].map(j => cor[j])); let c = (i * 7) % PAL_MUN.length, t = 0; while (usadas.has(c) && t++ < PAL_MUN.length) c = (c + 1) % PAL_MUN.length; if (usadas.has(c)) { c = PAL_MUN.length; while (usadas.has(c)) c++; } cor[i] = c; });
    geoms.forEach((g, i) => { g.properties = g.properties || {}; g.properties.cor = PAL_MUN[cor[i] % PAL_MUN.length]; });
  } else geoms.forEach((g, i) => { g.properties.cor = PAL_MUN[(parseInt(g.properties.codarea, 10) || i) % PAL_MUN.length]; });
  geoms.forEach(g => { const o = porMun.get(chaveMun(g.properties.nome)); g.properties.chave = chaveMun(g.properties.nome) || String(g.properties.codarea); g.properties.dre = o ? Object.entries(o).sort((a, b) => b[1] - a[1])[0][0] : ''; g.properties.n = o ? Object.values(o).reduce((a, b) => a + b, 0) : 0; g.properties.detalhe = o; });
  ['malha', 'divisas', 'destaque', 'nomes'].forEach(c => mt.camadas[c].clearLayers());
  if (mt.camadas.mascara) { mt.mapa.removeLayer(mt.camadas.mascara); mt.camadas.mascara = null; }
  const fc = temTopo ? topojson.feature(topo, obj) : geo;
  mt.temTopo = temTopo; mt.munF = new Map(); mt.munB = new Map(); mt.munL = new Map(); mt.regB = new Map(); mt.regGeo = new Map(); mt.regC = new Map();
  fc.features.forEach(f => { const k = f.properties.chave; mt.munF.set(k, f); const b = L.geoJSON(f).getBounds(); mt.munB.set(k, mt.munB.has(k) ? mt.munB.get(k).extend(b) : b); });
  // estado: fundo com sombra e máscara que esconde tudo o que está fora de Mato Grosso
  if (temTopo) {
    const estado = topojson.merge(topo, obj.geometries);
    mt.estadoB = L.geoJSON(estado).getBounds();
    mt.camadas.estado = L.geoJSON(estado, { renderer:mt.svg.malha, interactive:false, style:{ stroke:false, fillOpacity:1, className:'mt-estado' } }).addTo(mt.camadas.malha);
    const furos = estado.coordinates.map(pol => pol[0].map(([x, y]) => [y, x]));
    mt.camadas.mascara = L.polygon([[[-89, -400], [-89, 400], [89, 400], [89, -400]], ...furos], { renderer:mt.svg.mascara, interactive:false, stroke:false, fillOpacity:1, className:'mt-mascara' }).addTo(mt.mapa);
    dres.forEach(d => {
      const g = obj.geometries.filter(x => x.properties.dre === d); if (!g.length) return;
      const r = topojson.merge(topo, g); mt.regGeo.set(d, r); mt.regB.set(d, L.geoJSON(r).getBounds());
      // ponto do nome: centro do maior pedaço da região
      let best = null, ba = 0; r.coordinates.forEach(pol => { const ring = pol[0]; let A = 0, cx = 0, cy = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [x0, y0] = ring[j], [x1, y1] = ring[i], k = x0 * y1 - x1 * y0; A += k; cx += (x0 + x1) * k; cy += (y0 + y1) * k; } if (Math.abs(A) > ba) { ba = Math.abs(A); best = [cy / (3 * A), cx / (3 * A)]; } });
      if (best) mt.regC.set(d, best);
    });
    mt.mesh = { mun:topojson.mesh(topo, obj, (a, b) => a !== b && a.properties.dre === b.properties.dre), dre:topojson.mesh(topo, obj, (a, b) => a !== b && a.properties.dre !== b.properties.dre), estado:topojson.mesh(topo, obj, (a, b) => a === b) };
  } else {
    mt.estadoB = L.geoJSON(fc).getBounds(); mt.mesh = null;
    dres.forEach(d => { const fs = fc.features.filter(f => f.properties.dre === d); if (!fs.length) return; const b = L.geoJSON({ type:'FeatureCollection', features:fs }).getBounds(); mt.regB.set(d, b); mt.regC.set(d, [b.getCenter().lat, b.getCenter().lng]); });
  }
  mt.mapa.setMaxBounds(L.latLngBounds([-36, -76], [7, -32])); mt.mapa.options.maxBoundsViscosity = .6; // Brasil inteiro, para ver MT no contexto do país
  mt.camadas.mun = L.geoJSON(fc, { renderer:mt.svg.malha, style:f => estiloMunMT(f),
    onEachFeature:(f, l) => {
      const k = f.properties.chave; (mt.munL.get(k) || mt.munL.set(k, []).get(k)).push(l);
      l.bindTooltip(() => dicaMunMT(f), { sticky:true, className:'mt-tip mt-tip-mun', direction:'top', offset:[0, -10] });
      l.on('mouseover', () => { mt.hover = k; (mt.munL.get(k) || []).forEach(x => x.setStyle(estiloMunMT(x.feature, true))); realcarDREmt(dres.indexOf(f.properties.dre), true); });
      l.on('mouseout', () => { if (mt.hover === k) mt.hover = ''; (mt.munL.get(k) || []).forEach(x => x.setStyle(estiloMunMT(x.feature))); realcarDREmt(-1); });
      l.on('click', ev => { L.DomEvent.stopPropagation(ev); fecharMenuMT(); selecionarMunMT(k); });
    } }).addTo(mt.camadas.malha);
  mt.malhaSig = assinaturaMT();
  if (mt.foco < 0 && !mt.mun) enquadrarMT(false);
}
const assinaturaMT = () => { const l = escolasLista(); return l.length + '|' + (l[0] && l[0].codigo) + '|' + (l[l.length - 1] && l[l.length - 1].dre); };
function corMascaraMT(){ const c = getComputedStyle($('#esc-map')).backgroundColor; return c && c !== 'rgba(0, 0, 0, 0)' ? c : '#f1f5f9'; }
function estiloMunMT(f, hover){
  const dres = dresDe(escolasLista()), foco = mt.foco >= 0 ? dres[mt.foco] : null, d = f.properties.dre, k = f.properties.chave;
  const ap = (foco && d !== foco), sel = mt.mun === k, semFundo = mt.base === 'nenhum', escuro = document.documentElement.dataset.tema === 'escuro' || ['escuro', 'satelite'].includes(mt.base);
  let fill = d ? corDRE(dres, d) : '#94a3b8', op;
  if (mt.modo === 'regioes') op = ap ? .1 : sel ? .75 : .5;
  else if (mt.modo === 'sodre') op = ap ? .08 : sel ? .6 : .38;
  else if (mt.modo === 'municipio') { fill = corEscala(f.properties.n); op = ap ? .25 : .9; }
  else if (mt.modo === 'divisao') { fill = f.properties.cor || '#e2e8f0'; op = ap ? .15 : sel ? .9 : .62; }
  else if (semFundo) op = ap ? .05 : sel ? .4 : foco ? .24 : .16;
  else op = ap ? .02 : sel ? .3 : foco ? .12 : 0;
  if (ap && !semFundo && mt.modo !== 'divisao') { fill = escuro ? '#020617' : '#0f172a'; op = .2; }
  if (mt.mun && !sel && !ap) op *= .55;
  if (hover) op = Math.min(.95, op + (mt.modo === 'municipio' ? .1 : .2));
  return { stroke:hover || sel, color:escuro ? '#f8fafc' : '#0f172a', weight:sel ? 2.6 : 1.8, opacity:1, fillColor:fill, fillOpacity:op, className:'mt-mun' };
}
function dicaMunMT(f){
  const o = f.properties.detalhe, dres = dresDe(escolasLista()), d = f.properties.dre;
  const l = escolasLista().filter(e => chaveMun(e.municipio) === f.properties.chave), u = l.filter(e => e.localidade !== 'RURAL').length;
  return `<div class="mt-dica" style="--c:${d ? corDRE(dres, d) : '#94a3b8'}"><b>${esc(f.properties.nome)}</b>${d ? `<span class="r"><i></i>${esc(nomeDRE(d))}</span>` : ''}
    ${l.length ? `<div class="n"><b>${l.length}</b> escola${l.length > 1 ? 's' : ''} estadua${l.length > 1 ? 'is' : 'l'}<small>${u} urbana${u === 1 ? '' : 's'} · ${l.length - u} rura${l.length - u === 1 ? 'l' : 'is'}</small></div>` : '<div class="n"><small>Nenhuma escola estadual na base</small></div>'}
    ${o && Object.keys(o).length > 1 ? `<small class="o">${Object.entries(o).map(([x, n]) => `${esc(nomeDRE(x))}: ${n}`).join(' · ')}</small>` : ''}
    <small class="h">${mt.mun === f.properties.chave ? 'Clique para voltar' : 'Clique para ver as escolas'}</small></div>`;
}
function realcarMunMT(k, on){
  (mt.munL && mt.munL.get(k) || []).forEach(l => { l.setStyle(estiloMunMT(l.feature, on)); if (on) l.bringToFront(); });
}
function realcarDREmt(i, doMapa){
  if (!mt.camadas.destaque) return; mt.camadas.destaque.clearLayers();
  const dres = dresDe(escolasLista()), d = dres[i]; if (!d || !mt.regGeo || !mt.regGeo.get(d)) return;
  if (doMapa && mt.foco >= 0) return; // dentro de uma DRE, o realce fica só no município
  const c = corDRE(dres, d);
  L.geoJSON(mt.regGeo.get(d), { renderer:mt.svg.destaque, interactive:false, style:{ color:'#fff', weight:7, opacity:.85, fill:false, lineJoin:'round' } }).addTo(mt.camadas.destaque);
  L.geoJSON(mt.regGeo.get(d), { renderer:mt.svg.destaque, interactive:false, style:{ color:c, weight:3.5, opacity:1, fill:!doMapa, fillColor:c, fillOpacity:.12, lineJoin:'round', className:'mt-reg-hl' } }).addTo(mt.camadas.destaque);
}
function estilizarMalhaMT(){
  if (!mt.mapa || !mt.malha) return;
  if (mt.malhaSig !== assinaturaMT() || !mt.camadas.mun) construirMalhaMT();
  const dres = dresDe(escolasLista()), foco = mt.foco >= 0 ? dres[mt.foco] : null, semFundo = mt.base === 'nenhum';
  const escuro = document.documentElement.dataset.tema === 'escuro' || ['escuro', 'satelite'].includes(mt.base);
  mt.camadas.mun.eachLayer(l => l.setStyle(estiloMunMT(l.feature, mt.hover === l.feature.properties.chave)));
  if (mt.camadas.estado) mt.camadas.estado.setStyle({ fillColor:escuro ? '#0f172a' : '#ffffff', fillOpacity:semFundo ? 1 : 0 });
  if (mt.camadas.mascara) mt.camadas.mascara.setStyle({ fillColor:corMascaraMT(), fillOpacity:semFundo ? 1 : 0 });
  $('#esc-map').classList.toggle('mt-foco-on', !!foco);
  // linhas
  mt.camadas.divisas.clearLayers(); mt.camadas.nomes.clearLayers();
  const linha = escuro ? '#e2e8f0' : '#0f172a', fina = escuro ? 'rgba(226,232,240,.45)' : (semFundo ? 'rgba(15,23,42,.18)' : 'rgba(15,23,42,.4)');
  if (mt.mesh) {
    const pintado = ['regioes', 'sodre', 'municipio', 'divisao'].includes(mt.modo), div = mt.modo === 'divisao';
    if (div) { L.geoJSON(mt.mesh.mun, { pane:'divisas', interactive:false, style:{ color:escuro ? '#0b1220' : '#ffffff', weight:2.6, opacity:.9, lineJoin:'round' } }).addTo(mt.camadas.divisas); L.geoJSON(mt.mesh.dre, { pane:'divisas', interactive:false, style:{ color:escuro ? '#0b1220' : '#ffffff', weight:2.6, opacity:.9, lineJoin:'round' } }).addTo(mt.camadas.divisas); }
    if (mt.divisas || pintado || foco) L.geoJSON(mt.mesh.mun, { pane:'divisas', interactive:false, style:{ color:div ? (escuro ? 'rgba(226,232,240,.7)' : 'rgba(15,23,42,.55)') : fina, weight:div ? 1 : foco ? 1 : .7 } }).addTo(mt.camadas.divisas);
    if (div && !mt.divisas) L.geoJSON(mt.mesh.dre, { pane:'divisas', interactive:false, style:{ color:escuro ? 'rgba(226,232,240,.7)' : 'rgba(15,23,42,.55)', weight:1 } }).addTo(mt.camadas.divisas);
    if (mt.divisas || mt.modo === 'regioes' || mt.modo === 'sodre') {
      L.geoJSON(mt.mesh.dre, { pane:'divisas', interactive:false, style:{ color:escuro ? '#0b1220' : '#ffffff', weight:5, opacity:.9, lineCap:'round', lineJoin:'round' } }).addTo(mt.camadas.divisas);
      L.geoJSON(mt.mesh.dre, { pane:'divisas', interactive:false, style:{ color:linha, weight:1.8, opacity:.8, lineCap:'round', lineJoin:'round' } }).addTo(mt.camadas.divisas);
    }
    L.geoJSON(mt.mesh.estado, { pane:'divisas', interactive:false, style:{ color:semFundo ? linha : '#7c3aed', weight:semFundo ? 2.4 : 2, opacity:semFundo ? .9 : .55, dashArray:semFundo ? null : '6 5', lineJoin:'round' } }).addTo(mt.camadas.divisas);
  }
  if (foco && mt.regGeo && mt.regGeo.get(foco)) {
    L.geoJSON(mt.regGeo.get(foco), { renderer:mt.svg.destaque, interactive:false, style:{ color:'#fff', weight:8, opacity:.9, fill:false, lineJoin:'round' } }).addTo(mt.camadas.divisas);
    L.geoJSON(mt.regGeo.get(foco), { renderer:mt.svg.destaque, interactive:false, style:{ color:corDRE(dres, foco), weight:4, opacity:1, fill:false, lineJoin:'round', className:'mt-reg-on' } }).addTo(mt.camadas.divisas);
  }
  // nomes: das regiões (se ligado ou nos modos pintados) e dos municípios (se ligado ou com uma DRE aberta)
  if (!foco && (mt.rotulos || mt.modo === 'regioes' || mt.modo === 'sodre')) mt.regC.forEach((c, d) => {
    const i = dres.indexOf(d);
    L.marker(c, { keyboard:false, zIndexOffset:-500, icon:L.divIcon({ className:'mt-reg-ic', html:`<span class="mt-reg" style="--c:${corDRE(dres, d)}">${esc(nomeDRE(d))}</span>`, iconSize:null }) })
      .on('click', ev => { L.DomEvent.stopPropagation(ev); focarDREmt(i); }).on('mouseover', () => realcarDREmt(i)).on('mouseout', () => realcarDREmt(-1)).addTo(mt.camadas.nomes);
  });
  if (mt.rotulos || foco || mt.modo === 'divisao') {
    const vistos = new Set();
    mt.munF.forEach((f, k) => {
      if (vistos.has(k) || !f.properties.nome || (foco && f.properties.dre !== foco)) return; vistos.add(k);
      const c = mt.munB.get(k).getCenter();
      L.marker(c, { interactive:false, keyboard:false, zIndexOffset:-600, icon:L.divIcon({ className:'mt-reg-ic', html:`<span class="mt-mun-n ${mt.mun === k ? 'on' : ''} ${f.properties.n ? '' : 'z'}">${esc(f.properties.nome)}${f.properties.n ? `<b>${f.properties.n}</b>` : ''}</span>`, iconSize:null }) }).addTo(mt.camadas.nomes);
    });
  }
}
function legendaMT(dres, lista){
  const el = $('#mt-leg'); if (!el) return;
  el.classList.toggle('fechada', !mt.leg);
  let it = [];
  if (mt.modo === 'tipo') { const c = {}; lista.forEach(e => { const g = grupoTipo(e.tipo); c[g] = (c[g] || 0) + 1; }); it = Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => [CORES_TIPO[k] || CORES_TIPO.Outro, k, n]); }
  else if (mt.modo === 'localidade') it = [['#2563eb', 'Urbanas', lista.filter(e => e.localidade !== 'RURAL').length], ['#65a30d', 'Rurais', lista.filter(e => e.localidade === 'RURAL').length]];
  else if (mt.modo === 'alunos') it = FAIXAS_ALUNOS.map(f => [f[2], f[1], lista.filter(e => num(e.alunos) && faixaAlunos(num(e.alunos)) === f).length]).concat(lista.some(e => !num(e.alunos)) ? [['#cbd5e1', 'sem informação', lista.filter(e => !num(e.alunos)).length]] : []);
  else if (mt.modo === 'distancia') it = FAIXAS_DIST.map(f => [f[2], f[1], lista.filter(e => faixaDist(distEscola(e)) === f).length]);
  else if (mt.modo === 'divisao') { const ks = mt.munF ? [...mt.munF.values()] : [], com = ks.filter(f => f.properties.n).length; it = [['#fde68a', `${ks.length || 142} municípios`], ['#bfdbfe', `${com} com escola estadual`, undefined], ['#e2e8f0', `${(ks.length || 142) - com} sem escola estadual`]]; }
  else if (mt.modo === 'municipio') it = [['#dbeafe', '1 escola'], ['#93c5fd', '2'], ['#60a5fa', '3 a 4'], ['#3b82f6', '5 a 8'], ['#1d4ed8', '9 a 16'], ['#1e3a8a', 'mais de 16'], ['#e2e8f0', 'sem escola']];
  else it = dres.map((d, i) => [corDRE(dres, d), nomeDRE(d), lista.filter(e => e.dre === d).length, i]);
  el.innerHTML = `<button class="mt-leg-tg" onclick="mt.leg=!mt.leg;store.set('gaborg_mt_leg2',mt.leg);this.parentNode.classList.toggle('fechada',!mt.leg)" title="Mostrar ou esconder a legenda"><i class="fa-solid fa-list"></i><span>Legenda</span></button>
    <div class="mt-leg-c"><b>${esc(MODOS_MT[mt.modo][1])}</b><small>${esc(MODOS_MT[mt.modo][2])}</small><div class="its ${it.length > 8 ? 'duas' : ''}">${it.map(([c, n, q, i]) => i !== undefined ? `<button class="it ${mt.foco === i ? 'on' : ''}" onclick="focarDREmt(${mt.foco === i ? -1 : i})" onmouseenter="realcarDREmt(${i})" onmouseleave="realcarDREmt(-1)"><i style="background:${c}"></i>${esc(n)}<span>${q}</span></button>` : `<div class="it"><i style="background:${c}"></i>${esc(n)}${q !== undefined ? `<span>${q}</span>` : ''}</div>`).join('')}</div>
    ${(() => { const c = {}; lista.forEach(e => { const g = grupoTipo(e.tipo); c[g] = (c[g] || 0) + 1; }); const ks = Object.keys(FORMAS_TIPO).filter(k => c[k]); return ks.length ? `<div class="mt-leg-formas"><b>Tipo de unidade (forma do ícone)</b><div>${ks.map(k => `<span title="${esc(k)}: ${NOMES_FORMA[FORMAS_TIPO[k]]}">${iconeTipoSVG(k, mt.modo === 'tipo' ? CORES_TIPO[k] : '#475569', 15)}${esc(k)}<small>${c[k]}</small></span>`).join('')}</div></div>` : ''; })()}
    ${!['municipio', 'divisao'].includes(mt.modo) ? '<div class="sede"><span class="mt-dre" style="--c:#475569;transform:scale(.8);transform-origin:left"><i class="fa-solid fa-building-flag"></i><b>n</b></span>sede da DRE (nº de escolas)</div>' : ''}</div>`;
}
function painelEscolasMT(todas, dres, lista){
  const f = mt.fil, foco = mt.foco >= 0 ? dres[mt.foco] : null;
  const mun = new Set(lista.map(e => e.municipio)), urb = lista.filter(e => e.localidade !== 'RURAL').length;
  $('#esc-kpi').innerHTML = `<div><b>${lista.length.toLocaleString('pt-BR')}</b>escolas</div><div><b>${new Set(lista.map(e => e.dre)).size}</b>DREs</div><div><b>${mun.size}</b>municípios</div><div><b>${fmtN(alunosDe(lista))}</b> alunos · <b>${urb}</b>urbanas · <b>${lista.length - urb}</b> rurais</div>`;
  $('#esc-dres').innerHTML = dres.map((d, i) => { const n = todas.filter(e => e.dre === d).length; return `<button class="mt-chip ${!f.dres.size || f.dres.has(d) ? 'on' : ''}" style="--c:${corDRE(dres, d)}" onclick="alternarDREfiltro(${i})" title="${esc(d)}: ${n} escolas"><i></i>${esc(nomeDRE(d))}<b>${n}</b></button>`; }).join('');
  const fc = $('#esc-foco');
  if (foco) {
    const l = todas.filter(e => e.dre === foco), m = [...new Set(l.map(e => e.municipio))].sort(), u = l.filter(e => e.localidade !== 'RURAL').length, s = setorDaDRE(foco);
    const tipos = {}; l.forEach(e => { const g = grupoTipo(e.tipo); tipos[g] = (tipos[g] || 0) + 1; });
    fc.innerHTML = `<div class="mt-foco" style="--c:${corDRE(dres, foco)}"><div class="h"><i class="fa-solid fa-building-flag"></i><div><b>${esc(foco)}</b><small>${l.length} escolas · ${fmtN(alunosDe(l))} alunos · ${m.length} municípios · ${u} urbanas · ${l.length - u} rurais</small></div><button class="btn btn-s btn-sm btn-i" onclick="focarDREmt(-1)" title="Mostrar todas"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="tp">${Object.entries(tipos).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span>${iconeTipoSVG(k, CORES_TIPO[k], 12)} ${esc(k)} <b>${v}</b></span>`).join('')}</div>
      <div class="mu">${m.map(x => esc(x)).join(' · ')}</div>
      ${s ? `<button class="btn btn-s btn-sm" onclick="trocarVista('mapa');setTimeout(()=>irPara(${arg(s.id)}),60)"><i class="fa-solid fa-diagram-project"></i>Ver no organograma</button>` : ''}</div>`;
  } else fc.innerHTML = '';
  if (mt.mun && mt.munF && mt.munF.get(mt.mun)) {
    const f = mt.munF.get(mt.mun), l = todas.filter(e => chaveMun(e.municipio) === mt.mun).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), d = f.properties.dre;
    fc.innerHTML = `<div class="mt-foco" style="--c:${d ? corDRE(dres, d) : '#94a3b8'}"><div class="h"><i class="fa-solid fa-city"></i><div><b>${esc(f.properties.nome)}</b><small>${d ? esc(d) + ' · ' : ''}${l.length} escola(s)</small></div><button class="btn btn-s btn-sm btn-i" onclick="voltarMT(1)" title="Voltar para a DRE"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="mt-mun-l">${l.map(e => `<button class="ei" onclick="irEscolaMT(${arg(e.codigo)})" onmouseenter="pulsarEscolaMT(${arg(e.codigo)})"><b>${esc(e.nome)}</b><small>${iconeTipoSVG(grupoTipo(e.tipo), CORES_TIPO[grupoTipo(e.tipo)], 12)} ${esc(grupoTipo(e.tipo))}${e.localidade === 'RURAL' ? ' · rural' : ''}${e.bairro ? ' · ' + esc(e.bairro) : ''}</small></button>`).join('') || '<small>Nenhuma escola estadual na base.</small>'}</div></div>`;
  }
  const sub = $('#esc-sub'); if (sub) sub.textContent = mt.modo === 'divisao' ? 'Municípios' : 'Escolas por DRE';
  if (mt.modo === 'divisao' && mt.munF) {
    const q = norm(f.q), vistos = new Set();
    const ms = [...mt.munF.values()].filter(x => { const k = x.properties.chave; if (vistos.has(k) || !x.properties.nome) return false; vistos.add(k); return (!foco || x.properties.dre === foco) && (!f.dres.size || f.dres.has(x.properties.dre)) && (!q || norm(x.properties.nome).includes(q)); }).sort((a, b) => a.properties.nome.localeCompare(b.properties.nome, 'pt-BR'));
    $('#esc-lista').innerHTML = ms.length ? `<div class="mt-muns">${ms.map(x => { const p = x.properties; return `<button class="mt-mu ${mt.mun === p.chave ? 'on' : ''}" style="--c:${p.dre ? corDRE(dres, p.dre) : '#94a3b8'};--m:${p.cor}" onclick="selecionarMunMT(${arg(p.chave)})" onmouseenter="realcarMunMT(${arg(p.chave)},true)" onmouseleave="realcarMunMT(${arg(p.chave)},false)"><span class="q"></span><b>${esc(p.nome)}</b><small>${p.dre ? esc(nomeDRE(p.dre)) : 'sem escola'}</small><span class="n">${p.n || '–'}</span></button>`; }).join('')}</div>` : '<div class="cartao vazio">Nenhum município com esses filtros.</div>';
    return;
  }
  const grupos = dres.map(d => [d, lista.filter(e => e.dre === d)]).filter(([, l]) => l.length);
  const abrirTudo = !!f.q && lista.length <= 80;
  $('#esc-lista').innerHTML = grupos.length ? grupos.map(([d, l]) => { const ab = abrirTudo || mt.aberto.has(d); return `<div class="mt-grp ${foco === d ? 'foco' : ''}" style="--c:${corDRE(dres, d)}">
      <button class="gh" onclick="alternarGrupoMT(${arg(d)})"><i class="fa-solid fa-chevron-${ab ? 'down' : 'right'}"></i><span class="pt"></span><b>${esc(d)}</b><span class="n">${l.length}</span><span class="fo" onclick="event.stopPropagation();focarDREmt(${dres.indexOf(d)})" title="Mostrar no mapa"><i class="fa-solid fa-crosshairs"></i></span></button>
      ${ab ? `<div class="gi">${l.sort((a, b) => a.municipio.localeCompare(b.municipio, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR')).map(e => `<button class="ei" onclick="irEscolaMT(${arg(e.codigo)})"><b>${esc(e.nome)}</b><small>${esc(e.municipio)} · ${esc(grupoTipo(e.tipo))}${e.localidade === 'RURAL' ? ' · rural' : ''}</small></button>`).join('')}</div>` : ''}</div>`; }).join('') : '<div class="cartao vazio">Nenhuma escola com esses filtros.</div>';
}
function alternarGrupoMT(d){ mt.aberto.has(d) ? mt.aberto.delete(d) : mt.aberto.add(d); painelEscolasMT(escolasLista(), dresDe(escolasLista()), filtrarEscolasMT(escolasLista())); }
function alternarDREfiltro(i){
  const dres = dresDe(escolasLista()), d = dres[i];
  if (!mt.fil.dres.size) mt.fil.dres = new Set([d]);
  else if (mt.fil.dres.has(d)) mt.fil.dres.delete(d);
  else mt.fil.dres.add(d);
  if (mt.fil.dres.size === dres.length) mt.fil.dres.clear();
  desenharEscolasMT(); enquadrarMT(true);
}
function filtroEscMT(k, v){ mt.fil[k] = v; clearTimeout(filtroEscMT.t); filtroEscMT.t = setTimeout(() => { desenharEscolasMT(); if (k !== 'q' || v.length > 2) enquadrarMT(true); }, k === 'q' ? 250 : 0); }
function limparFiltrosMT(){ mt.fil = { dres:new Set(), tipo:'', loc:'', q:'' }; mt.foco = -1; ['#esc-q', '#esc-tipo', '#esc-loc'].forEach(s => { const e = $(s); if (e) e.value = ''; }); desenharEscolasMT(); enquadrarMT(true); }
function irEscolaMT(cod){
  const e = escolasLista().find(x => x.codigo === cod); if (!e || !mt.mapa) return;
  if (window.innerWidth <= 820) alternarLadoMT(false);
  const m = mt.marcadores.get(cod);
  if (mt.camadas.cluster && m) { mt.camadas.cluster.zoomToShowLayer(m, () => m.openPopup()); return; }
  mt.mapa.flyTo([e.latitude, e.longitude], Math.max(mt.mapa.getZoom(), 13), { duration:semMovimento() ? 0 : 1.1 });
  setTimeout(() => { if (m) m.openPopup(); pulsarEscolaMT(cod); }, semMovimento() ? 50 : 1150);
}
function pulsarEscolaMT(cod){
  const e = escolasLista().find(x => x.codigo === cod); if (!e || !mt.mapa) return;
  const ic = L.divIcon({ className:'mt-pulso-ic', html:'<span class="mt-pulso"></span>', iconSize:[60, 60], iconAnchor:[30, 30] });
  const p = L.marker([e.latitude, e.longitude], { icon:ic, interactive:false, keyboard:false }).addTo(mt.mapa);
  setTimeout(() => mt.mapa.removeLayer(p), 1300);
}
function alternarLadoMT(forcar){ mt.lado = forcar !== undefined ? forcar : !mt.lado; $('#v-escolas').classList.toggle('sem-lado', !mt.lado); setTimeout(() => mt.mapa && mt.mapa.invalidateSize(), 260); }
function alternarCamadaMT(k){ mt[k] = !mt[k]; store.set({ ligacoes:'gaborg_mt_lig', divisas:'gaborg_mt_div', rotulos:'gaborg_mt_rot' }[k], mt[k]); menuMT('camadas', null, true); desenharEscolasMT(); }
function exportarEscolasMT(){
  const l = filtrarEscolasMT(escolasLista()), q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const csv = '﻿' + ['Código;Unidade escolar;DRE;Município;Tipo;Localidade;Alunos;Endereço;Número;CEP;Bairro;Telefone;E-mail;Latitude;Longitude', ...l.map(e => [e.codigo, e.nome, e.dre, e.municipio, e.tipo, e.localidade, e.alunos, e.endereco, e.numero, e.cep, e.bairro, e.telefone, e.email, String(e.latitude).replace('.', ','), String(e.longitude).replace('.', ',')].map(q).join(';'))].join('\r\n');
  baixarArquivo('gaborg-escolas-' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
}
async function importarEscolasMT(f){
  if (!f || !ehAdmin()) return;
  try {
    await carregarScript(['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js']);
    const wb = XLSX.read(await f.arrayBuffer(), { type:'array' });
    const H = { alunos:['quantidade de alunos','qtd de alunos','alunos','matriculas','quantidade de matriculas'], codigo:['codigo da escola','cod escola','codigo'], nome:['unidade escolar','escola'], dre:['dre'], municipio:['municipio'], tipo:['tipolotacaocalculada','tipo de lotacao','tipo'], localidade:['localidadeescola','localizacao','localidade'], endereco:['endereco'], numero:['numero'], cep:['cep'], bairro:['bairro'], telefone:['telefone'], email:['e-mail','email'], latitude:['latitude','latitude 2025'], longitude:['longitude','longitude 2025'] };
    let achou = null;
    for (const nome of wb.SheetNames) {
      const linhas = XLSX.utils.sheet_to_json(wb.Sheets[nome], { header:1, raw:false, defval:'' }); if (!linhas.length) continue;
      const cab = linhas[0].map(c => norm(c)), idx = {};
      Object.entries(H).forEach(([k, alts]) => { const i = alts.map(a => cab.indexOf(a)).find(i => i >= 0); if (i !== undefined) idx[k] = i; });
      if (idx.codigo !== undefined && idx.nome !== undefined && idx.dre !== undefined && idx.latitude !== undefined && idx.longitude !== undefined) { achou = { nome, linhas, idx }; break; }
    }
    if (!achou) throw new Error('Não encontrei uma aba com as colunas Código da Escola, Unidade Escolar, DRE, Latitude e Longitude.');
    const novas = achou.linhas.slice(1).map(r => { const o = {}; CAMPOS_ESC.forEach(k => o[k] = achou.idx[k] !== undefined ? String(r[achou.idx[k]] ?? '').trim() : ''); o.codigo = o.codigo.replace(/\.0+$/, ''); o.localidade = o.localidade.toUpperCase(); o.tipo = o.tipo.replace(/\s+/g, ' ').trim(); o.alunos = String(Math.round(num(String(o.alunos).replace(/\./g, '').replace(',', '.'))) || ''); return o; })
      .filter(o => o.codigo && o.nome && numBR(o.latitude) && numBR(o.longitude));
    if (!novas.length) throw new Error('Nenhuma escola com coordenadas válidas.');
    const atuais = new Map(escolasLista().map(e => [e.codigo, e])), cods = new Set(novas.map(e => e.codigo));
    const inc = novas.filter(e => !atuais.has(e.codigo)).length, rem = [...atuais.keys()].filter(c => !cods.has(c)).length, alt = novas.filter(e => { const a = atuais.get(e.codigo); return a && (a.nome !== e.nome || a.dre !== e.dre || Math.abs(numBR(a.latitude) - numBR(e.latitude)) > 1e-5 || Math.abs(numBR(a.longitude) - numBR(e.longitude)) > 1e-5); }).length;
    if (!await confirmar('Atualizar base de escolas', `Aba <b>${esc(achou.nome)}</b>: <b>${novas.length}</b> escolas em <b>${new Set(novas.map(e => e.dre)).size}</b> DREs.<br>${inc} nova(s) · ${rem} removida(s) · ${alt} com nome, DRE ou localização diferente.<br><br>Gravar na planilha do GABOrg?`, 'Atualizar base')) return;
    (DB.escolas || []).filter(e => !cods.has(e.codigo)).forEach(e => enfileirar('escolas', e, true));
    DB.escolas = novas.map(e => novoReg('escolas', Object.assign({ id:e.codigo, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }, e)));
    DB.escolas.forEach(e => enfileirar('escolas', e));
    salvarLocal(); escolasLista.seed = null; mt.foco = -1; desenharEscolasMT(); enquadrarMT(true);
    toast(`Base atualizada: ${novas.length} escolas.`);
  } catch (e) { toast('Falha ao importar: ' + e.message, 'erro'); }
}
/* ---------- alunos e edição da base de escolas ---------- */
const ESC_BASE_VERSAO = '2026-10-27';   // base oficial 2026 embutida (alunos e tipos corrigidos)
const FAIXAS_ALUNOS = [[100, 'até 100 alunos', '#bae6fd'], [300, '101 a 300', '#38bdf8'], [600, '301 a 600', '#0284c7'], [1000, '601 a 1.000', '#1d4ed8'], [Infinity, 'mais de 1.000', '#312e81']];
const faixaAlunos = n => FAIXAS_ALUNOS.find(f => n <= f[0]) || FAIXAS_ALUNOS[FAIXAS_ALUNOS.length - 1];
const alunosDe = l => l.reduce((t, e) => t + num(e.alunos), 0);
const backendSemAlunos = () => online() && backendVersao && svVerMaior('1.12.0', backendVersao);
function baseEscolasEmbutida(){ escolasLista.seed = null; const d = DB.escolas; DB.escolas = []; const l = escolasLista().map(e => Object.assign({}, e)); DB.escolas = d; return l; }
/* garante que a base editável exista na planilha (antes só a base embutida era usada) */
function garantirEscolasDB(){
  if (DB.escolas && DB.escolas.length) return false;
  const quando = agora(), por = cfg.usuario || '';
  DB.escolas = baseEscolasEmbutida().map(e => novoReg('escolas', Object.assign({}, e, { id:e.codigo, latitude:String(e.latitude), longitude:String(e.longitude), atualizadoEm:quando, atualizadoPor:por })));
  svEnfileirarLote(DB.escolas.map(e => ({ op:'upsert', table:'escolas', record:Object.assign({}, e) }))); escolasLista.seed = null; return true;
}
/* aplica uma vez a base oficial embutida (alunos e tipos 2026) à base editável, preservando o que foi editado depois */
function migrarBaseEscolas(){
  if (somenteLeitura() || backendSemAlunos() || param('escolasBase', '') >= ESC_BASE_VERSAO) return;
  const base = baseEscolasEmbutida(), atuais = new Map((DB.escolas || []).map(e => [e.codigo, e])), quando = agora(), por = cfg.usuario || '', ops = [];
  if (!atuais.size) { garantirEscolasDB(); salvarParam('escolasBase', ESC_BASE_VERSAO); return; }
  const editada = e => e && e.atualizadoEm && e.atualizadoEm.slice(0, 10) > ESC_BASE_VERSAO;
  base.forEach(b => { const a = atuais.get(b.codigo); if (editada(a)) return;
    const r = Object.assign(a || novoReg('escolas', { id:b.codigo }), CAMPOS_ESC.reduce((o, k) => (o[k] = String(b[k] ?? ''), o), {}), { atualizadoEm:quando, atualizadoPor:por + ' (base 2026)' });
    if (!a) DB.escolas.push(r); ops.push({ op:'upsert', table:'escolas', record:Object.assign({}, r) }); });
  svEnfileirarLote(ops); salvarParam('escolasBase', ESC_BASE_VERSAO); escolasLista.seed = null;
  const cm = escolasLista().filter(e => grupoTipo(e.tipo) === 'Cívico-militar').length;
  toast(`Base de escolas atualizada para 2026: ${fmtN(alunosDe(escolasLista()))} alunos e ${cm} escolas cívico-militares.`);
  if (vistaAtual === 'escolas') desenharEscolasMT(); else atualizarVistaAtual();
}
const TIPOS_ESC_SUG = () => [...new Set(escolasLista().map(e => e.tipo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
function salvarEscola(cod, mud){
  if (!podeGestao()) return null;
  garantirEscolasDB();
  const e = DB.escolas.find(x => x.codigo === cod); if (!e) return null;
  Object.assign(e, mud, { atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); enfileirar('escolas', e); escolasLista.seed = null; return e;
}
function formEscola(cod){
  const e = escolasLista().find(x => x.codigo === cod); if (!e || !podeGestao()) return;
  const dres = dresDe(escolasLista()), c = (k, rot, extra) => `<label><span class="rot">${rot}</span><input class="campo" name="${k}" value="${esc(e[k] ?? '')}" ${extra || ''}></label>`;
  abrirModal({ titulo:'Editar escola · ' + e.codigo, rotulo:'Salvar', largura:640, html:`${backendSemAlunos() ? '<p class="s" style="color:#dc2626"><i class="fa-solid fa-triangle-exclamation"></i> Atualize o Codigo.gs para a 1.12.0 para a quantidade de alunos ficar gravada na planilha.</p>' : ''}
    ${c('nome', 'Unidade escolar', 'required')}
    <div class="g2"><label><span class="rot">Tipo</span><input class="campo" name="tipo" list="esc-tipos" value="${esc(e.tipo)}"><datalist id="esc-tipos">${TIPOS_ESC_SUG().map(t => `<option value="${esc(t)}">`).join('')}</datalist></label>
      <label><span class="rot">Quantidade de alunos</span><input class="campo" name="alunos" type="number" min="0" step="1" value="${esc(e.alunos || '')}"></label></div>
    <div class="g2"><label><span class="rot">DRE</span><select class="campo" name="dre">${dres.map(d => `<option ${d === e.dre ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></label>
      <label><span class="rot">Localidade</span><select class="campo" name="localidade">${['URBANA', 'RURAL'].map(l => `<option ${l === e.localidade ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <div class="g2">${c('municipio', 'Município')}${c('bairro', 'Bairro')}</div>
    <div class="g2">${c('endereco', 'Endereço')}${c('numero', 'Número')}</div>
    <div class="g2">${c('cep', 'CEP')}${c('telefone', 'Telefone')}</div>
    ${c('email', 'E-mail')}
    <div class="g2">${c('latitude', 'Latitude')}${c('longitude', 'Longitude')}</div>`,
    aoConfirmar:m => { const f = m.querySelector('form'), v = k => String(f.elements[k].value || '').trim(), lat = numBR(v('latitude')), lon = numBR(v('longitude'));
      if (!lat || !lon || lat > -6 || lat < -19 || lon > -49 || lon < -62) throw new Error('Latitude e longitude precisam estar dentro de Mato Grosso.');
      const mud = {}; ['nome', 'tipo', 'dre', 'localidade', 'municipio', 'bairro', 'endereco', 'numero', 'cep', 'telefone', 'email'].forEach(k => mud[k] = k === 'municipio' || k === 'tipo' ? v(k).toUpperCase() : v(k));
      mud.alunos = v('alunos') === '' ? '' : String(Math.max(0, Math.round(num(v('alunos'))))); mud.latitude = String(lat); mud.longitude = String(lon);
      salvarEscola(cod, mud); toast('Escola atualizada.'); if (vistaAtual === 'escolas') desenharEscolasMT(); if (document.querySelector('.eb-tab')) renderBaseEscolas(); return true; } });
}
/* editor em tabela da base de escolas (alunos e tipo editáveis direto na linha) */
let ebFil = { q:'', dre:'', tipo:'' }, ebLim = 80;
function abrirBaseEscolas(){
  if (!podeGestao()) return;
  abrirModal({ titulo:'Base de escolas', rotulo:'Fechar', semCancelar:true, largura:1100, html:`<div id="eb-corpo"></div>` });
  renderBaseEscolas();
}
function renderBaseEscolas(){
  const el = $('#eb-corpo'); if (!el) return;
  const T = escolasLista(), dres = dresDe(T), q = norm(ebFil.q);
  const L = T.filter(e => (!ebFil.dre || e.dre === ebFil.dre) && (!ebFil.tipo || grupoTipo(e.tipo) === ebFil.tipo) && (!q || norm([e.codigo, e.nome, e.municipio].join(' ')).includes(q))).sort((a, b) => a.dre.localeCompare(b.dre, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'));
  const cm = T.filter(e => grupoTipo(e.tipo) === 'Cívico-militar').length, imp = param('escolasBase', '');
  el.innerHTML = `${backendSemAlunos() ? '<p class="s" style="color:#dc2626"><i class="fa-solid fa-triangle-exclamation"></i> O Codigo.gs da planilha está na versão ' + esc(backendVersao) + '. Atualize para a 1.12.0 para gravar a quantidade de alunos.</p>' : ''}
    <div class="eb-res"><span><b>${fmtN(T.length)}</b> escolas</span><span><b>${fmtN(alunosDe(T))}</b> alunos</span><span><b>${fmtN(cm)}</b> cívico-militares</span><span><b>${fmtN(Math.round(alunosDe(T) / Math.max(1, T.length)))}</b> alunos por escola</span>${imp ? `<span class="s">base oficial ${esc(fmtDia(imp))}</span>` : ''}</div>
    <div class="filtros" style="margin:8px 0"><div class="busca"><i class="fa-solid fa-magnifying-glass"></i><input class="campo" placeholder="Buscar escola, código ou município" value="${esc(ebFil.q)}" oninput="ebFil.q=this.value;ebLim=80;clearTimeout(window.tEb);window.tEb=setTimeout(()=>{renderBaseEscolas();const i=document.querySelector('#eb-corpo .busca input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)"></div>
      <select class="campo" onchange="ebFil.dre=this.value;ebLim=80;renderBaseEscolas()"><option value="">Todas as DREs</option>${dres.map(d => `<option value="${esc(d)}" ${d === ebFil.dre ? 'selected' : ''}>${esc(nomeDRE(d))}</option>`).join('')}</select>
      <select class="campo" onchange="ebFil.tipo=this.value;ebLim=80;renderBaseEscolas()"><option value="">Todos os tipos</option>${Object.keys(FORMAS_TIPO).map(k => `<option ${k === ebFil.tipo ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
    <p class="s" style="margin:0 0 6px">${fmtN(L.length)} escola(s) · ${fmtN(alunosDe(L))} alunos · altere o tipo ou a quantidade de alunos direto na tabela (grava ao sair do campo).</p>
    <datalist id="eb-tipos">${TIPOS_ESC_SUG().map(t => `<option value="${esc(t)}">`).join('')}</datalist>
    <div class="tab-wrap" style="max-height:56vh"><table class="tab eb-tab"><thead><tr><th>Código</th><th>Unidade escolar</th><th>DRE</th><th>Município</th><th>Tipo</th><th class="dir">Alunos</th><th></th></tr></thead><tbody>
    ${L.slice(0, ebLim).map(e => `<tr><td>${esc(e.codigo)}</td><td style="white-space:normal;min-width:200px">${iconeTipoSVG(grupoTipo(e.tipo), CORES_TIPO[grupoTipo(e.tipo)], 13)} <b>${esc(e.nome)}</b></td><td>${esc(nomeDRE(e.dre))}</td><td>${esc(e.municipio)}</td>
      <td><input class="campo eb-in" list="eb-tipos" value="${esc(e.tipo)}" onchange="ebSalvar(${arg(e.codigo)},'tipo',this)"></td><td class="dir"><input class="campo eb-in eb-num" type="number" min="0" step="1" value="${esc(e.alunos || '')}" onchange="ebSalvar(${arg(e.codigo)},'alunos',this)"></td>
      <td><button type="button" class="btn btn-s btn-sm btn-i" title="Editar todos os dados" onclick="formEscola(${arg(e.codigo)})"><i class="fa-solid fa-pen"></i></button></td></tr>`).join('') || '<tr><td colspan="7" class="vazio">Nenhuma escola com esses filtros.</td></tr>'}</tbody></table></div>
    ${L.length > ebLim ? `<div style="text-align:center;margin-top:8px"><button type="button" class="btn btn-s btn-sm" onclick="ebLim+=200;renderBaseEscolas()">Mostrar mais (${fmtN(L.length - ebLim)})</button></div>` : ''}`;
}
function ebSalvar(cod, k, inp){
  let v = String(inp.value || '').trim();
  if (k === 'alunos') { if (v !== '' && !(num(v) >= 0)) { inp.classList.add('erro'); return; } v = v === '' ? '' : String(Math.round(num(v))); }
  if (k === 'tipo') { v = v.toUpperCase(); if (!v) return; }
  salvarEscola(cod, { [k]:v }); inp.value = v; inp.classList.remove('erro'); inp.classList.add('ok'); setTimeout(() => inp.classList.remove('ok'), 900);
  const r = $('#eb-corpo .eb-res'); if (r) { const T = escolasLista(); r.children[1].innerHTML = `<b>${fmtN(alunosDe(T))}</b> alunos`; r.children[2].innerHTML = `<b>${fmtN(T.filter(e => grupoTipo(e.tipo) === 'Cívico-militar').length)}</b> cívico-militares`; }
  if (vistaAtual === 'escolas') desenharEscolasMT();
}
document.addEventListener('keydown', e => { if (vistaAtual !== 'escolas' || e.key !== 'Escape' || document.querySelector('.modal')) return; const m = $('#mt-menu'); if (m && !m.classList.contains('hidden')) return fecharMenuMT(); if (mt.mun) voltarMT(1); else if (mt.foco >= 0) voltarMT(0); });

/* ===================== GESTÃO: FUNÇÕES COMUNS ===================== */
function backendSemGestao(){ return online() && backendVersao && backendVersao.localeCompare('1.10.0', undefined, { numeric:true }) < 0; }
const avisoGestao = () => backendSemGestao() ? `<div class="cartao bl g-aviso"><h3><i class="fa-solid fa-triangle-exclamation"></i>Atualize o backend para gravar estes dados</h3><p class="s">A planilha está com o Codigo.gs ${esc(backendVersao)}. Cole o Codigo.gs 1.10.0 no Apps Script e publique uma nova versão (Implantar › Gerenciar implantações › Editar › Nova versão). Até lá, o que você registrar aqui fica só neste navegador.</p></div>` : '';
function param(id, padrao){ const r = (DB.parametros || []).find(x => x.id === id); if (!r || r.valor === '') return padrao; try { return JSON.parse(r.valor); } catch (e) { return r.valor; } }
function salvarParam(id, valor){
  let r = DB.parametros.find(x => x.id === id);
  if (!r) { r = novoReg('parametros', { id }); DB.parametros.push(r); }
  r.valor = typeof valor === 'string' ? valor : JSON.stringify(valor); r.atualizadoEm = agora(); r.atualizadoPor = cfg.usuario || '';
  enfileirar('parametros', r);
}
const hojeISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const somaDias = (n, base) => { const d = base ? new Date(base + 'T12:00:00') : new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const tData = v => { if (!v) return NaN; return Date.parse(String(v).length === 10 ? v + 'T12:00:00' : v); };
const fmtDia = v => { const t = tData(v); return isFinite(t) ? new Date(t).toLocaleDateString('pt-BR') : '—'; };
const diasAte = v => { const t = tData(v); return isFinite(t) ? Math.round((t - tData(hojeISO())) / 864e5) : null; };
const diasDesdeData = v => { const d = diasAte(v); return d === null ? null : -d; };
const podeGestao = () => !somenteLeitura();
function abasG(lista, atual, fn){ return `<div class="ind-abas">${lista.map(([k, n, ic]) => `<button class="${atual === k ? 'on' : ''}" onclick="${fn}('${k}')"><i class="fa-solid ${ic}"></i><span>${n}</span></button>`).join('')}<span class="esp"></span></div>`; }
const kpiG = (c, ic, r, v, s, on) => `<div class="cartao kpi ${on ? 'clic' : ''}" style="--c:${c}" ${on ? `onclick="${on}"` : ''}><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
const chipG = (txt, cor) => `<span class="chip" style="--c:${cor}">${txt}</span>`;
const nomeSetor = id => { const s = porId.get(id); return s ? s.nome : ''; };
function csvBaixar(nome, linhas){ const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"'; baixarArquivo(nome + '-' + hojeISO() + '.csv', '﻿' + linhas.map(r => r.map(q).join(';')).join('\r\n'), 'text/csv;charset=utf-8'); }
/* Documento Word (.doc em HTML, abre no Word e no LibreOffice) e impressão sem abrir outra janela */
const ESTILO_DOC = `body{font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.5;color:#000}h1{font-size:13pt;text-align:center;margin:0 0 4pt}h2{font-size:12pt;text-align:center;margin:14pt 0 6pt;text-transform:uppercase}h3{font-size:12pt;text-align:center;margin:10pt 0 4pt}p{margin:0 0 6pt;text-align:justify}.ementa{margin:12pt 0 12pt 45%;text-align:justify;font-style:italic}.centro{text-align:center}.ass{margin-top:36pt;text-align:center}.marca{border:1px dashed #999;padding:4pt 8pt;color:#555;font-size:10pt;text-align:center;margin-bottom:12pt}.lista{margin:0 0 4pt 0}.n1{margin-left:0}.n2{margin-left:24pt}.n3{margin-left:48pt}.n4{margin-left:72pt}.n5{margin-left:96pt}table{border-collapse:collapse;width:100%;margin:6pt 0 10pt}td,th{border:1px solid #000;padding:3pt 5pt;font-size:10.5pt;vertical-align:top}th{background:#eee}.dir{text-align:right}.pq{font-size:10pt;color:#444}`;
function baixarWord(nome, titulo, corpo){ baixarArquivo(nome + '.doc', '﻿' + `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>@page{size:21cm 29.7cm;margin:2.5cm 2cm 2cm 3cm}${ESTILO_DOC}</style></head><body>${corpo}</body></html>`, 'application/msword'); }
function imprimirDoc(titulo, corpo){
  const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
  const d = f.contentWindow.document; d.open(); d.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>@page{size:A4;margin:2.5cm 2cm 2cm 3cm}${ESTILO_DOC}</style></head><body>${corpo}</body></html>`); d.close();
  setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(() => f.remove(), 2000); }, 300);
}
const romano = n => { const m = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]; let r = ''; m.forEach(([v, s]) => { while (n >= v) { r += s; n -= v; } }); return r; };
const alinea = n => { let s = ''; n++; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(97 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
const artN = n => n < 10 ? n + 'º' : n + '.';
/* Métricas de qualquer estrutura (atual ou de uma proposta) */
function metricasEstrutura(lista){
  const ativos = lista.filter(s => s.status !== 'Extinto'), ids = new Set(ativos.map(s => s.id)), fil = new Map();
  ativos.forEach(s => { const p = ids.has(s.paiId) ? s.paiId : ''; if (!fil.has(p)) fil.set(p, []); fil.get(p).push(s); });
  const prof = new Map(), vis = (p, d) => (fil.get(p) || []).forEach(s => { if (prof.has(s.id)) return; prof.set(s.id, d); vis(s.id, d + 1); }); vis('', 1);
  const chefias = ativos.filter(s => CHEFIAS.includes(s.tipo)).map(s => [s, (fil.get(s.id) || []).filter(k => k.tipo !== 'Unidades Escolares').length]);
  const comSub = chefias.filter(x => x[1] > 0), niveis = Math.max(0, ...prof.values());
  return { ativos, fil, prof, chefias, comSub, niveis, ampMedia:comSub.length ? comSub.reduce((t, x) => t + x[1], 0) / comSub.length : 0, semResp:chefias.filter(x => !x[0].responsavel).length };
}

/* ===================== REESTRUTURAÇÃO: SIMULADOR COM METAS, COMPETÊNCIAS E MINUTA ===================== */
let reAba = store.get('gaborg_re_aba', 'simulador'), reSel = null, reCompAba = 'sobre', reBusca = '';
const RE_ABAS = [['simulador','Metas e simulador','fa-bullseye'],['competencias','Competências','fa-list-check'],['minuta','Minuta do decreto','fa-file-signature']];
const METAS_PADRAO = { tetoCusto:'', variacaoMax:'0', maxNiveis:'6', ampMax:'8', ampMin:'2', maxSetores:'', maxSemResp:'' };
function abaRe(a){ reAba = a; store.set('gaborg_re_aba', a); renderReestruturacao(); }
function renderReestruturacao(){
  const el = $('#re-corpo'); if (!el) return;
  el.innerHTML = avisoGestao() + abasG(RE_ABAS, reAba, 'abaRe') + `<div class="ind-corpo">${reAba === 'competencias' ? reCompetencias() : reAba === 'minuta' ? reMinuta() : reSimulador()}</div>`;
  if (reAba === 'minuta') atualizarMinuta();
}
/* ---------- (4) Metas e simulador ---------- */
function cenariosRe(){
  const at = baseAtual(), c = [{ id:'', nome:'Estrutura atual', status:'Oficial', lista:setoresOficiais(), m:at.m, a:at.a, linhas:DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual') }];
  (DB.propostas || []).forEach(p => { try { const x = custoProposta(p); c.push({ id:p.id, nome:p.nome, status:p.status || 'Em elaboração', lista:x.E.lista, m:x.m, a:x.a, linhas:x.linhas }); } catch (e) { console.warn(e); } });
  return c;
}
function avaliarCenario(c, M, base, mt){
  const r = [], n = v => String(v ?? '').trim() === '' ? null : numBR(v);
  const t = n(mt.tetoCusto), vm = n(mt.variacaoMax), mn = n(mt.maxNiveis), aM = n(mt.ampMax), am = n(mt.ampMin), ms = n(mt.maxSetores), sr = n(mt.maxSemResp);
  const varPct = base.a ? (c.a - base.a) / base.a * 100 : 0;
  if (t !== null) r.push({ k:'teto', nome:`Custo anual até ${fmtRc(t)}`, valor:fmtRc(c.a), ok:c.a <= t, falta:c.a - t });
  if (vm !== null) r.push({ k:'var', nome:`Variação do custo até ${fmtP(vm)} sobre o atual`, valor:(varPct > 0 ? '+' : '') + fmtP(varPct), ok:varPct <= vm + 1e-9 });
  if (mn !== null) r.push({ k:'niveis', nome:`No máximo ${mn} níveis hierárquicos`, valor:M.niveis + ' níveis', ok:M.niveis <= mn });
  if (aM !== null) { const x = M.comSub.filter(([, k]) => k > aM); r.push({ k:'ampMax', nome:`Nenhuma chefia com mais de ${aM} subordinados`, valor:x.length ? x.length + ' acima' : 'nenhuma', ok:!x.length, lista:x }); }
  if (am !== null) { const x = M.comSub.filter(([, k]) => k < am); r.push({ k:'ampMin', nome:`Nenhuma chefia com menos de ${am} subordinados`, valor:x.length ? x.length + ' abaixo' : 'nenhuma', ok:!x.length, lista:x }); }
  if (ms !== null) r.push({ k:'setores', nome:`No máximo ${fmtN(ms)} setores`, valor:fmtN(M.ativos.length), ok:M.ativos.length <= ms });
  if (sr !== null) { const p = M.chefias.length ? M.semResp / M.chefias.length * 100 : 0; r.push({ k:'semResp', nome:`Até ${fmtP(sr)} das chefias sem responsável`, valor:fmtP(p), ok:p <= sr + 1e-9 }); }
  return r;
}
function custoChefiaCen(c, setorId){ return c.linhas.filter(l => l.setorId === setorId && l.observacao === MARCA_CHEFIA).reduce((t, l) => t + calcDesp(l).anual, 0); }
function reSimulador(){
  const mt = Object.assign({}, METAS_PADRAO, param('metasReestr', {})), C = cenariosRe(), base = C[0];
  if (reSel === null || !C.some(c => c.id === reSel)) reSel = C.length > 1 ? C[1].id : '';
  const av = C.map(c => { const M = metricasEstrutura(c.lista); return { c, M, r:avaliarCenario(c, M, base, mt) }; });
  const metas = av[0].r.map(x => x.k), sel = av.find(x => x.c.id === reSel) || av[0];
  const campo = (k, rot, ajuda, tipo) => `<label><span class="rot">${rot} <small>${ajuda}</small></span><input class="campo" type="${tipo || 'number'}" step="any" min="0" data-meta="${k}" value="${esc(mt[k])}" ${podeGestao() ? '' : 'disabled'}></label>`;
  const sug = [];
  sel.r.forEach(x => {
    if (x.ok) return;
    if (x.k === 'ampMax') x.lista.sort((a, b) => b[1] - a[1]).forEach(([s, k]) => sug.push(['fa-people-arrows', `<b>${esc(s.nome)}</b> coordena <b>${k}</b> setores diretamente. Criar um nível intermediário (ex.: agrupar por tema) ou passar parte deles para outra chefia.`, s.id]));
    if (x.k === 'ampMin') x.lista.forEach(([s, k]) => { const f = (sel.M.fil.get(s.id) || [])[0], ec = custoChefiaCen(sel.c, s.id); sug.push(['fa-compress', `<b>${esc(s.nome)}</b> tem só ${k} setor subordinado${f ? ` (${esc(f.nome)})` : ''}. Avaliar fundir os dois ou subordinar o setor diretamente ao nível acima.${ec ? ` Economia estimada se o cargo deixar de existir: <b>${fmtRc(ec)}/ano</b>.` : ''}`, s.id]); });
    if (x.k === 'teto' || x.k === 'var') {
      const porSetor = new Map(); sel.c.linhas.forEach(l => porSetor.set(l.setorId, (porSetor.get(l.setorId) || 0) + calcDesp(l).anual));
      const fus = sel.M.comSub.filter(([, k]) => k === 1).reduce((t, [s]) => t + custoChefiaCen(sel.c, s.id), 0);
      sug.push(['fa-sack-dollar', `O custo anual de <b>${fmtRc(sel.c.a)}</b> fura a meta${x.falta ? ` em <b>${fmtRc(x.falta)}</b>` : ''}. ${fus ? `Fundir as chefias que têm só 1 subordinado economizaria cerca de <b>${fmtRc(fus)}/ano</b>. ` : ''}Maiores custos: ${[...porSetor.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, v]) => `${esc(nomeCurto(sel.c.lista.find(s => s.id === id) || porId.get(id)))} (${fmtRc(v)})`).join(', ')}.`, '']);
    }
    if (x.k === 'niveis') { const fundo = sel.M.ativos.filter(s => sel.M.prof.get(s.id) > numBR(mt.maxNiveis)); sug.push(['fa-layer-group', `${fundo.length} setor(es) ficam abaixo do nível ${mt.maxNiveis}: ${fundo.slice(0, 6).map(s => '<b>' + esc(s.nome) + '</b>').join(', ')}${fundo.length > 6 ? '...' : ''}. Encurtar a cadeia subordinando-os a um nível acima.`, '']); }
    if (x.k === 'semResp') sug.push(['fa-user-xmark', `${sel.M.semResp} chefias sem responsável. Use a seção <b>Chefias</b> para registrar titulares e substitutos.`, '']);
    if (x.k === 'setores') sug.push(['fa-sitemap', `A estrutura tem ${fmtN(sel.M.ativos.length)} setores. Fusões das chefias com 1 subordinado e das unidades com competências repetidas (aba Competências) reduzem o total.`, '']);
  });
  return `<div class="cartao bl" style="--c:#2563eb"><h3><i class="fa-solid fa-sliders"></i>Metas da reorganização</h3><p class="s">Os limites que toda proposta deve respeitar. Deixe em branco o que não quiser avaliar. As metas valem para todos os usuários.</p>
      <div class="g-metas">${campo('tetoCusto', 'Teto de custo anual (R$)', 'cargos e despesas')}${campo('variacaoMax', 'Variação máxima do custo (%)', '0 = sem aumento')}${campo('maxNiveis', 'Máximo de níveis', 'hierárquicos')}${campo('ampMax', 'Máximo de subordinados', 'por chefia')}${campo('ampMin', 'Mínimo de subordinados', 'por chefia')}${campo('maxSetores', 'Máximo de setores', 'ativos')}${campo('maxSemResp', 'Chefias sem responsável (%)', 'no máximo')}</div>
      ${podeGestao() ? `<div class="acoes" style="margin-top:10px"><button class="btn btn-p btn-sm" onclick="salvarMetasRe()"><i class="fa-solid fa-floppy-disk"></i>Salvar metas</button></div>` : ''}</div>
    ${metas.length ? `<div class="cartao bl" style="--c:#7c3aed"><h3><i class="fa-solid fa-table-columns"></i>Como cada cenário se sai</h3><p class="s">Verde atende, vermelho fura a meta. Clique numa coluna para ver o diagnóstico e as sugestões.</p>
      <div class="tab-wrap"><table class="tab re-sim"><thead><tr><th>Meta</th>${av.map(x => { const ok = x.r.filter(y => y.ok).length; return `<th class="${x.c.id === reSel ? 'on' : ''}" onclick="reSel=${arg(x.c.id)};renderReestruturacao()"><b>${esc(x.c.nome)}</b><small>${esc(x.c.status)}</small>${chipG(`${ok}/${x.r.length} metas`, ok === x.r.length ? '#16a34a' : ok >= x.r.length / 2 ? '#d97706' : '#dc2626')}</th>`; }).join('')}</tr></thead>
      <tbody>${metas.map((k, i) => `<tr><td class="nm">${esc(av[0].r[i].nome)}</td>${av.map(x => { const y = x.r[i]; return `<td class="${y.ok ? 'ok' : 'nok'} ${x.c.id === reSel ? 'on' : ''}" onclick="reSel=${arg(x.c.id)};renderReestruturacao()"><i class="fa-solid ${y.ok ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>${esc(y.valor)}</td>`; }).join('')}</tr>`).join('')}
      <tr class="info"><td class="nm">Setores · chefias · amplitude média</td>${av.map(x => `<td>${fmtN(x.M.ativos.length)} · ${x.M.chefias.length} · ${x.M.ampMedia.toLocaleString('pt-BR', { maximumFractionDigits:1 })}</td>`).join('')}</tr>
      <tr class="info"><td class="nm">Custo anual</td>${av.map(x => `<td>${fmtRc(x.c.a)}${x.c.id ? ` <small class="${x.c.a > base.a ? 'fin-pos' : x.c.a < base.a ? 'fin-neg' : ''}">${x.c.a >= base.a ? '+' : ''}${fmtRs(x.c.a - base.a)}</small>` : ''}</td>`).join('')}</tr></tbody></table></div></div>` : '<div class="cartao vazio">Defina ao menos uma meta para comparar os cenários.</div>'}
    ${metas.length ? `<div class="cartao bl" style="--c:${sel.r.every(x => x.ok) ? '#16a34a' : '#dc2626'}"><h3><i class="fa-solid fa-stethoscope"></i>Diagnóstico: ${esc(sel.c.nome)}</h3><p class="s">${sel.r.every(x => x.ok) ? 'Este cenário atende todas as metas.' : `Fura ${sel.r.filter(x => !x.ok).length} de ${sel.r.length} metas. Sugestões para chegar lá:`}</p>
      <div class="pend re-sug">${sug.slice(0, 40).map(([ic, t, id]) => `<div class="it"><i class="fa-solid ${ic}"></i><span>${t}</span>${id && porId.has(id) ? `<button class="btn btn-g btn-sm" onclick="irPara(${arg(id)})">abrir</button>` : ''}</div>`).join('') || '<div class="vazio">Nada a sugerir.</div>'}</div>
      <div class="acoes" style="margin-top:10px">${sel.c.id ? `<button class="btn btn-s btn-sm" onclick="verPropostaNoMapa(${arg(sel.c.id)});trocarVista('mapa')"><i class="fa-solid fa-diagram-project"></i>Editar no mapa da proposta</button><button class="btn btn-s btn-sm" onclick="abrirComparativo('',${arg(sel.c.id)})"><i class="fa-solid fa-code-compare"></i>Comparar com a atual</button><button class="btn btn-s btn-sm" onclick="reSel=${arg(sel.c.id)};abaRe('minuta')"><i class="fa-solid fa-file-signature"></i>Gerar minuta</button>` : `<button class="btn btn-s btn-sm" onclick="trocarVista('propostas')"><i class="fa-solid fa-lightbulb"></i>Criar uma proposta</button>`}</div></div>` : ''}`;
}
function salvarMetasRe(){
  const o = {}; document.querySelectorAll('[data-meta]').forEach(i => o[i.dataset.meta] = i.value.trim());
  salvarParam('metasReestr', o); toast('Metas salvas.'); renderReestruturacao();
}
/* ---------- (3) Competências: sobreposições e lacunas ---------- */
const STOP_COMP = new Set('de da do das dos e em para com por a o as os ao aos no na nos nas um uma que se sua seu suas seus ou entre sobre demais outras outros outro outra bem como quando junto pela pelo pelas pelos sob conforme mediante cada todos todas ambito area areas acoes atividades relativas relativos referentes demandas'.split(' '));
const limparComp = t => String(t).replace(/^\s*([IVXLC]+|\d+|[a-z])\s*[–\-.)]\s*/i, '').trim();
const tokensComp = t => [...new Set(norm(t).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length >= 4 && !STOP_COMP.has(w)).map(w => w.slice(0, 6)))];
function baseCompetencias(){
  let sig = setoresOficiais().length; setoresOficiais().forEach(s => { const t = s.id + (s.competencias || '') + s.status; for (let i = 0; i < t.length; i += 3) sig = (sig * 31 + t.charCodeAt(i)) | 0; });
  if (baseCompetencias.c && baseCompetencias.c.sig === sig) return baseCompetencias.c;
  const C = [];
  setoresOficiais().filter(s => s.status !== 'Extinto').forEach(s => String(s.competencias || '').split(/\n|;\s*/).map(limparComp).filter(t => t.length > 12).forEach(t => { const k = tokensComp(t); if (k.length >= 2) C.push({ s, t, k }); }));
  const idx = new Map(); C.forEach((c, i) => c.k.forEach(w => { if (!idx.has(w)) idx.set(w, []); idx.get(w).push(i); }));
  const pares = [];
  C.forEach((c, i) => { const cont = new Map(); c.k.forEach(w => idx.get(w).forEach(j => { if (j > i && C[j].s.id !== c.s.id) cont.set(j, (cont.get(j) || 0) + 1); }));
    cont.forEach((n, j) => { if (n < 3) return; const sim = n / (c.k.length + C[j].k.length - n); if (sim >= .45) pares.push({ a:c, b:C[j], sim, n }); }); });
  pares.sort((x, y) => y.sim - x.sim);
  return baseCompetencias.c = { sig, C, idx, pares };
}
function melhorSetorPara(texto, B){
  const k = tokensComp(texto); if (!k.length) return null; const cont = new Map();
  k.forEach(w => (B.idx.get(w) || []).forEach(j => cont.set(j, (cont.get(j) || 0) + 1)));
  let best = null; cont.forEach((n, j) => { const sim = n / (k.length + B.C[j].k.length - n); if (!best || sim > best.sim) best = { c:B.C[j], sim, n }; });
  return best;
}
function reCompetencias(){
  const B = baseCompetencias(), chef = setoresOficiais().filter(s => s.status !== 'Extinto' && CHEFIAS.includes(s.tipo)), semComp = chef.filter(s => !String(s.competencias || '').trim());
  const ref = String(param('atribuicoes', '') || ''), refL = ref.split('\n').map(limparComp).filter(t => t.length > 8);
  const cob = refL.map(t => ({ t, m:melhorSetorPara(t, B) })), lac = cob.filter(x => !x.m || x.m.sim < .3 || x.m.n < 2);
  const parSet = new Map(); B.pares.forEach(p => { const k = [p.a.s.id, p.b.s.id].sort().join('|'); parSet.set(k, (parSet.get(k) || 0) + 1); });
  const topPares = [...parSet.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const cor = sim => sim >= .7 ? '#dc2626' : sim >= .55 ? '#f97316' : '#d97706';
  const sub = [['sobre','Sobreposições','fa-clone'],['lacunas','Lacunas','fa-circle-question'],['ref','Atribuições de referência','fa-scroll'],['busca','Buscar competência','fa-magnifying-glass']];
  let corpo = '';
  if (reCompAba === 'sobre') corpo = `<div class="grade2 ind-g12"><div class="cartao bl" style="--c:#f97316"><h3><i class="fa-solid fa-clone"></i>Competências parecidas em setores diferentes <span class="ct">${B.pares.length}</span></h3><p class="s">Atribuições escritas de forma semelhante em mais de um setor: possível retrabalho ou conflito de responsabilidade. A porcentagem mostra o quanto os textos se parecem.</p>
      <div class="re-pares">${B.pares.slice(0, 80).map(p => `<div class="par"><div class="pc">${chipG(Math.round(p.sim * 100) + '%', cor(p.sim))}</div><div class="lado"><button onclick="irPara(${arg(p.a.s.id)})">${esc(p.a.s.nome)}</button><p>${esc(p.a.t)}</p></div><div class="lado"><button onclick="irPara(${arg(p.b.s.id)})">${esc(p.b.s.nome)}</button><p>${esc(p.b.t)}</p></div></div>`).join('') || '<div class="vazio">Nenhuma sobreposição encontrada. Quanto mais setores tiverem competências cadastradas, mais completa fica esta análise.</div>'}</div></div>
    <div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-people-arrows"></i>Pares de setores com mais repetição</h3><p class="s">Candidatos a fusão ou a uma divisão mais clara de papéis</p><div class="pend">${topPares.map(([k, n]) => { const [a, b] = k.split('|'); return `<button onclick="irPara(${arg(a)})">${chipG(n, '#dc2626')}<span>${esc(nomeCurto(porId.get(a)))} ↔ ${esc(nomeCurto(porId.get(b)))}</span></button>`; }).join('') || '<div class="vazio">Nenhum.</div>'}</div></div></div>`;
  else if (reCompAba === 'lacunas') corpo = `<div class="grade2"><div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-circle-question"></i>Atribuições sem setor responsável <span class="ct">${refL.length ? lac.length : '—'}</span></h3><p class="s">${refL.length ? 'Itens da lista de referência que nenhum setor tem entre as suas competências' : 'Cadastre a lista de referência (aba ao lado) com as atribuições do decreto ou do regimento para encontrar lacunas.'}</p><div class="pend">${lac.map(x => `<div class="it"><i class="fa-solid fa-circle-exclamation" style="color:#dc2626"></i><span>${esc(x.t)}${x.m ? `<small>mais próximo: ${esc(nomeCurto(x.m.c.s))} (${Math.round(x.m.sim * 100)}%)</small>` : ''}</span></div>`).join('') || (refL.length ? '<div class="vazio">Todas as atribuições têm um setor correspondente.</div>' : '')}</div></div>
    <div class="cartao bl" style="--c:#7c3aed"><h3><i class="fa-solid fa-file-circle-xmark"></i>Chefias sem competências cadastradas <span class="ct">${semComp.length}</span></h3><p class="s">Sem as competências, não dá para checar sobreposição nem lacuna dessas unidades</p><div class="pend">${semComp.slice(0, 60).map(s => `<button onclick="irPara(${arg(s.id)})"><i class="fa-solid ${icTipo(s.tipo)}" style="color:${corTipo(s.tipo)}"></i><span>${esc(s.nome)}</span><small>${esc(s.tipo)}</small></button>`).join('') || '<div class="vazio">Todas têm competências.</div>'}</div></div></div>`;
  else if (reCompAba === 'ref') corpo = `<div class="cartao bl" style="--c:#2563eb"><h3><i class="fa-solid fa-scroll"></i>Atribuições de referência</h3><p class="s">Cole aqui, uma por linha, as atribuições que a Secretaria precisa cobrir (do decreto, do regimento ou de uma lei). O sistema procura qual setor cuida de cada uma.</p>
      <textarea id="re-ref" class="campo" style="min-height:220px" ${podeGestao() ? '' : 'disabled'} placeholder="Ex.:&#10;Formular e coordenar a política estadual de educação básica&#10;Gerir a rede física das unidades escolares&#10;Promover a formação continuada dos profissionais da educação">${esc(ref)}</textarea>
      ${podeGestao() ? '<div class="acoes" style="margin-top:8px"><button class="btn btn-p btn-sm" onclick="salvarParam(\'atribuicoes\', $(\'#re-ref\').value);toast(\'Lista salva.\');renderReestruturacao()"><i class="fa-solid fa-floppy-disk"></i>Salvar e analisar</button></div>' : ''}
      ${refL.length ? `<div class="tab-wrap" style="margin-top:12px"><table class="tab"><thead><tr><th>Atribuição</th><th>Setor que mais se aproxima</th><th>Semelhança</th></tr></thead><tbody>${cob.map(x => `<tr><td style="white-space:normal">${esc(x.t)}</td><td style="white-space:normal">${x.m ? `<a href="#" onclick="event.preventDefault();irPara(${arg(x.m.c.s.id)})">${esc(x.m.c.s.nome)}</a><small style="display:block;color:var(--mut)">${esc(x.m.c.t)}</small>` : '—'}</td><td>${x.m ? chipG(Math.round(x.m.sim * 100) + '%', x.m.sim >= .3 && x.m.n >= 2 ? '#16a34a' : '#dc2626') : chipG('sem setor', '#dc2626')}</td></tr>`).join('')}</tbody></table></div>` : ''}</div>`;
  else { const q = norm(reBusca), res = q.length > 2 ? B.C.filter(c => norm(c.t).includes(q)) : [];
    corpo = `<div class="cartao bl" style="--c:#0891b2"><h3><i class="fa-solid fa-magnifying-glass"></i>Quem cuida de quê</h3><p class="s">Digite um tema (ex.: "transporte escolar", "merenda", "formação") para ver todos os setores com essa competência.</p>
      <input class="campo" id="re-busca" value="${esc(reBusca)}" placeholder="Tema ou palavra" oninput="reBusca=this.value;clearTimeout(window.tReB);window.tReB=setTimeout(()=>{renderReestruturacao();const i=$('#re-busca');i.focus();i.setSelectionRange(i.value.length,i.value.length)},350)">
      <div class="pend" style="margin-top:10px">${res.slice(0, 80).map(c => `<button onclick="irPara(${arg(c.s.id)})"><i class="fa-solid ${icTipo(c.s.tipo)}" style="color:${corTipo(c.s.tipo)}"></i><span><b>${esc(c.s.nome)}</b><small style="display:block;white-space:normal">${esc(c.t)}</small></span></button>`).join('') || (q.length > 2 ? '<div class="vazio">Nenhum setor com essa competência.</div>' : '')}</div></div>`; }
  const comC = new Set(B.C.map(c => c.s.id)).size;
  return `<div class="kpis">${kpiG('#2563eb', 'fa-list-check', 'Competências cadastradas', fmtN(B.C.length), `em ${comC} setores`)}${kpiG('#f97316', 'fa-clone', 'Sobreposições', fmtN(B.pares.length), 'pares de competências parecidas', "reCompAba='sobre';renderReestruturacao()")}${kpiG('#dc2626', 'fa-circle-question', 'Lacunas', refL.length ? fmtN(lac.length) : '—', refL.length ? `de ${refL.length} atribuições de referência` : 'cadastre a lista de referência', "reCompAba='lacunas';renderReestruturacao()")}${kpiG('#7c3aed', 'fa-file-circle-xmark', 'Chefias sem competências', fmtN(semComp.length), `de ${chef.length} chefias`, "reCompAba='lacunas';renderReestruturacao()")}</div>
    <div class="g-subabas">${sub.map(([k, n, ic]) => `<button class="${reCompAba === k ? 'on' : ''}" onclick="reCompAba='${k}';renderReestruturacao()"><i class="fa-solid ${ic}"></i>${n}</button>`).join('')}</div>${corpo}`;
}
/* ---------- (2) Minuta do decreto ---------- */
const MINUTA_PADRAO = { numero:'', data:'', ato:'Decreto nº 2.236, de 27 de agosto de 2026', base:'no uso das atribuições que lhe confere o art. [__], inciso [__], da Constituição Estadual', comp:true, cargos:true, motivos:true, cenario:'' };
function reMinuta(){
  const o = Object.assign({}, MINUTA_PADRAO, param('minuta', {}));
  if (reSel !== null && reSel !== undefined && reSel !== o._ultimo) o.cenario = reSel;
  const C = [['', 'Estrutura atual (regimento consolidado)'], ...(DB.propostas || []).map(p => [p.id, p.nome + (p.status ? ' · ' + p.status : '')])];
  return `<div class="re-min"><div class="cartao bl re-min-cfg" style="--c:#a16207"><h3><i class="fa-solid fa-gear"></i>Dados da minuta</h3><p class="s">O texto é montado a partir da estrutura escolhida. Revise com a assessoria jurídica antes de enviar.</p>
      <label><span class="rot">Estrutura</span><select id="mi-cen" class="campo" onchange="atualizarMinuta()">${C.map(([v, n]) => `<option value="${esc(v)}" ${v === o.cenario ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
      <div class="g2"><label><span class="rot">Número</span><input id="mi-num" class="campo" value="${esc(o.numero)}" placeholder="[número]" oninput="atualizarMinuta()"></label><label><span class="rot">Data</span><input id="mi-data" type="date" class="campo" value="${esc(o.data)}" oninput="atualizarMinuta()"></label></div>
      <label><span class="rot">Ato que será alterado ou revogado</span><input id="mi-ato" class="campo" value="${esc(o.ato)}" oninput="atualizarMinuta()"></label>
      <label><span class="rot">Fundamento legal <small>texto após "O GOVERNADOR DO ESTADO DE MATO GROSSO,"</small></span><textarea id="mi-base" class="campo" oninput="atualizarMinuta()">${esc(o.base)}</textarea></label>
      <label class="lg-lembrar"><input type="checkbox" id="mi-comp" ${o.comp ? 'checked' : ''} onchange="atualizarMinuta()">Incluir as competências das unidades</label>
      <label class="lg-lembrar"><input type="checkbox" id="mi-cargos" ${o.cargos ? 'checked' : ''} onchange="atualizarMinuta()">Incluir o anexo de cargos em comissão</label>
      <label class="lg-lembrar"><input type="checkbox" id="mi-mot" ${o.motivos ? 'checked' : ''} onchange="atualizarMinuta()">Incluir a exposição de motivos com o impacto financeiro</label>
      <div class="acoes" style="flex-wrap:wrap;margin-top:6px"><button class="btn btn-p btn-sm" onclick="exportarMinuta('word')"><i class="fa-solid fa-file-word"></i>Baixar Word</button><button class="btn btn-s btn-sm" onclick="exportarMinuta('print')"><i class="fa-solid fa-print"></i>Imprimir / PDF</button><button class="btn btn-s btn-sm" onclick="exportarMinuta('copiar')"><i class="fa-solid fa-copy"></i>Copiar texto</button>${podeGestao() ? '<button class="btn btn-g btn-sm" onclick="guardarMinuta()"><i class="fa-solid fa-floppy-disk"></i>Guardar dados</button>' : ''}</div></div>
    <div class="re-papel"><div id="mi-doc" class="re-folha"></div></div></div>`;
}
function dadosMinutaForm(){ const v = id => { const e = $(id); return e ? (e.type === 'checkbox' ? e.checked : e.value) : ''; }; return { cenario:v('#mi-cen'), numero:v('#mi-num').trim(), data:v('#mi-data'), ato:v('#mi-ato').trim(), base:v('#mi-base').trim(), comp:v('#mi-comp'), cargos:v('#mi-cargos'), motivos:v('#mi-mot') }; }
function guardarMinuta(){ const o = dadosMinutaForm(); o._ultimo = o.cenario; salvarParam('minuta', o); toast('Dados da minuta guardados.'); }
function atualizarMinuta(){ const d = $('#mi-doc'); if (!d) return; const o = dadosMinutaForm(); reSel = o.cenario; d.innerHTML = gerarMinuta(o); }
function gerarMinuta(o){
  const p = o.cenario && DB.propostas.find(x => x.id === o.cenario), A = setoresOficiais(), B = p ? estruturaProposta(p).lista : A;
  const ativo = s => s && s.status !== 'Extinto', mA = new Map(A.map(s => [s.id, s])), mB = new Map(B.map(s => [s.id, s]));
  const M = metricasEstrutura(B), nomeS = s => s.nome + (s.sigla && !s.nome.includes(s.sigla) ? ' – ' + s.sigla : '');
  const dataTxt = o.data ? new Date(o.data + 'T12:00:00').toLocaleDateString('pt-BR', { day:'numeric', month:'long', year:'numeric' }) : '[data]';
  let art = 0; const A_ = () => `<b>Art. ${artN(++art)}</b>`;
  // estrutura em incisos, alíneas e itens
  const linhasEst = []; const vis = (pai, nivel, pref) => (M.fil.get(pai) || []).slice().sort((a, b) => num(a.ordem) - num(b.ordem) || a.nome.localeCompare(b.nome, 'pt-BR')).forEach((s, i) => {
    const marca = nivel === 1 ? romano(i + 1) + ' –' : nivel === 2 ? alinea(i) + ')' : nivel === 3 ? (i + 1) + '.' : pref + (i + 1) + '.';
    const qt = s.tipo === 'Unidades Escolares' && num(s.quantidade) ? ` (${fmtN(s.quantidade)} unidades)` : '';
    linhasEst.push(`<p class="lista n${Math.min(nivel, 5)}">${marca} ${esc(nomeS(s))}${qt};</p>`);
    vis(s.id, nivel + 1, nivel >= 3 ? (nivel === 3 ? (i + 1) + '.' : pref + (i + 1) + '.') : '');
  }); vis('', 1, '');
  if (linhasEst.length) linhasEst[linhasEst.length - 1] = linhasEst[linhasEst.length - 1].replace(/;<\/p>$/, '.</p>');
  let h = `<div class="marca">MINUTA – documento de trabalho gerado pelo GABOrg em ${new Date().toLocaleDateString('pt-BR')}, sujeito a revisão jurídica</div>
    <h1>DECRETO Nº ${esc(o.numero || '[número]')}, DE ${esc(dataTxt.toUpperCase())}</h1>
    <p class="ementa">${p ? `Altera a estrutura organizacional da Secretaria de Estado de Educação – SEDUC${o.ato ? ', de que trata o ' + esc(o.ato) : ''}, e dá outras providências.` : 'Dispõe sobre a estrutura organizacional da Secretaria de Estado de Educação – SEDUC e dá outras providências.'}</p>
    <p><b>O GOVERNADOR DO ESTADO DE MATO GROSSO</b>, ${esc(o.base || '[fundamento legal]')},</p><p class="centro"><b>D E C R E T A:</b></p>`;
  // alterações (proposta)
  if (p) {
    const novos = B.filter(s => ativo(s) && !ativo(mA.get(s.id))), ext = A.filter(s => ativo(s) && !ativo(mB.get(s.id)));
    const mov = B.filter(s => ativo(s) && ativo(mA.get(s.id)) && (mA.get(s.id).paiId || '') !== (s.paiId || ''));
    const ren = B.filter(s => ativo(s) && ativo(mA.get(s.id)) && (mA.get(s.id).nome !== s.nome || (mA.get(s.id).sigla || '') !== (s.sigla || '')));
    const pai = (m, s) => { const x = m.get(s.paiId); return x ? x.nome : 'Gabinete do Secretário de Estado de Educação'; };
    const bloco = (intro, l, f) => l.length ? `<p>${A_()} ${intro}</p>` + l.map((s, i) => `<p class="lista n2">${romano(i + 1)} – ${f(s)}${i === l.length - 1 ? '.' : ';'}</p>`).join('') : '';
    h += `<h2>Capítulo I<br>Das alterações na estrutura</h2>`
      + bloco('Ficam criadas, na estrutura organizacional da Secretaria de Estado de Educação, as seguintes unidades administrativas:', novos, s => `${esc(nomeS(s))}, subordinada ao(à) ${esc(pai(mB, s))}`)
      + bloco('Ficam extintas as seguintes unidades administrativas:', ext, s => esc(nomeS(s)))
      + bloco('Passam a subordinar-se às unidades indicadas:', mov, s => `${esc(nomeS(s))}, ao(à) ${esc(pai(mB, s))}`)
      + bloco('Ficam alteradas as denominações das seguintes unidades:', ren, s => `${esc(nomeS(mA.get(s.id)))}, que passa a denominar-se ${esc(nomeS(s))}`);
    if (!novos.length && !ext.length && !mov.length && !ren.length) h += `<p>${A_()} [A proposta não altera unidades; descreva aqui as alterações.]</p>`;
    h += `<p>${A_()} Em decorrência do disposto neste Decreto, a estrutura organizacional da Secretaria de Estado de Educação passa a ser a seguinte:</p>`;
  } else h += `<h2>Capítulo I<br>Da estrutura organizacional</h2><p>${A_()} A estrutura organizacional da Secretaria de Estado de Educação – SEDUC compreende as seguintes unidades administrativas:</p>`;
  h += linhasEst.join('');
  // competências
  if (o.comp) {
    const alvo = M.ativos.filter(s => CHEFIAS.includes(s.tipo) && String(s.competencias || '').trim() && (!p || !ativo(mA.get(s.id)) || String(mA.get(s.id).competencias || '') !== String(s.competencias || '')));
    if (alvo.length) { h += `<h2>Capítulo II<br>Das competências</h2>`;
      alvo.sort((a, b) => (M.prof.get(a.id) || 0) - (M.prof.get(b.id) || 0)).forEach(s => { const it = String(s.competencias).split(/\n|;\s*/).map(limparComp).filter(Boolean);
        h += `<p>${A_()} Compete ao(à) ${esc(nomeS(s))}:</p>` + it.map((t, i) => `<p class="lista n2">${romano(i + 1)} – ${esc(t.replace(/[.;]+$/, ''))}${i === it.length - 1 ? '.' : ';'}</p>`).join(''); }); }
  }
  // cargos
  const linhas = p ? custoProposta(p).linhas : DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual');
  const cargos = linhas.filter(l => l.observacao === MARCA_CHEFIA && ativo(mB.get(l.setorId)));
  const porSimb = new Map(); cargos.forEach(l => { const c = calcDesp(l), k = c.r.codigo || 'Sem símbolo', x = porSimb.get(k) || { q:0, unit:c.unit, m:0 }; x.q += c.qtd; x.m += c.mensal; porSimb.set(k, x); });
  if (o.cargos && cargos.length) h += `<p>${A_()} Os cargos em comissão das unidades de que trata este Decreto são os constantes do Anexo Único.</p>`;
  const at = baseAtual(), nv = p ? custoProposta(p) : at, dif = nv.a - at.a;
  h += `<h2>Capítulo ${o.comp ? 'III' : 'II'}<br>Das disposições finais</h2>
    <p>${A_()} As despesas decorrentes da execução deste Decreto correrão à conta das dotações orçamentárias próprias da Secretaria de Estado de Educação${p && dif > 0 ? ', observados os limites da legislação orçamentária e da Lei de Responsabilidade Fiscal' : ''}.</p>
    <p>${A_()} Ato do Secretário de Estado de Educação disporá sobre o regimento interno, o detalhamento das competências e a lotação das unidades no prazo de [__] dias.</p>
    <p>${A_()} Ficam revogadas as disposições em contrário${o.ato && !p ? ', em especial o ' + esc(o.ato) : ''}.</p>
    <p>${A_()} Este Decreto entra em vigor na data de sua publicação.</p>
    <p class="centro" style="margin-top:14pt">Palácio Paiaguás, em Cuiabá, ${esc(dataTxt)}.</p>
    <p class="ass">______________________________<br><b>GOVERNADOR DO ESTADO</b></p><p class="ass">______________________________<br><b>SECRETÁRIO(A) DE ESTADO DE EDUCAÇÃO</b></p>`;
  if (o.cargos && cargos.length) h += `<h2 style="page-break-before:always">Anexo Único<br>Quadro de cargos em comissão</h2>
    <table><thead><tr><th>Unidade</th><th>Cargo</th><th>Símbolo</th><th>Qtd.</th></tr></thead><tbody>${cargos.slice().sort((a, b) => (M.prof.get(a.setorId) || 0) - (M.prof.get(b.setorId) || 0)).map(l => { const c = calcDesp(l), s = mB.get(l.setorId); return `<tr><td>${esc(s ? nomeS(s) : '')}</td><td>${esc(l.descricao || 'Titular')}</td><td>${esc(c.r.codigo || '')}</td><td class="dir">${c.qtd}</td></tr>`; }).join('')}</tbody></table>
    <h3>Resumo por símbolo</h3><table><thead><tr><th>Símbolo</th><th>Quantidade</th><th>Valor unitário mensal</th><th>Total mensal</th></tr></thead><tbody>${[...porSimb.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'pt-BR', { numeric:true })).map(([k, x]) => `<tr><td>${esc(k)}</td><td class="dir">${x.q}</td><td class="dir">${fmtM(x.unit)}</td><td class="dir">${fmtM(x.m)}</td></tr>`).join('')}<tr><th>Total</th><th class="dir">${[...porSimb.values()].reduce((t, x) => t + x.q, 0)}</th><th></th><th class="dir">${fmtM([...porSimb.values()].reduce((t, x) => t + x.m, 0))}</th></tr></tbody></table>`;
  if (o.motivos) {
    const Ma = metricasEstrutura(A);
    h += `<h2 style="page-break-before:always">Exposição de motivos</h2>
      <p>Submete-se à apreciação a ${p ? `proposta "${esc(p.nome)}" de alteração da` : 'consolidação da'} estrutura organizacional da Secretaria de Estado de Educação${p && p.descricao ? `, com o seguinte objetivo: ${esc(p.descricao)}` : ''}.</p>
      <table><thead><tr><th>Indicador</th><th>Estrutura atual</th>${p ? '<th>Proposta</th><th>Diferença</th>' : ''}</tr></thead><tbody>
      ${[['Unidades administrativas', Ma.ativos.length, M.ativos.length], ['Chefias', Ma.chefias.length, M.chefias.length], ['Níveis hierárquicos', Ma.niveis, M.niveis], ['Amplitude média de controle', Ma.ampMedia.toFixed(1).replace('.', ','), M.ampMedia.toFixed(1).replace('.', ',')]].map(([n, a, b]) => `<tr><td>${n}</td><td class="dir">${a}</td>${p ? `<td class="dir">${b}</td><td class="dir">${typeof a === 'number' ? (b - a > 0 ? '+' : '') + (b - a) : ''}</td>` : ''}</tr>`).join('')}
      <tr><td>Custo mensal (cargos e despesas lançados)</td><td class="dir">${fmtM(at.m)}</td>${p ? `<td class="dir">${fmtM(nv.m)}</td><td class="dir">${nv.m - at.m >= 0 ? '+' : ''}${fmtM(nv.m - at.m)}</td>` : ''}</tr>
      <tr><td>Custo anual</td><td class="dir">${fmtM(at.a)}</td>${p ? `<td class="dir">${fmtM(nv.a)}</td><td class="dir">${dif >= 0 ? '+' : ''}${fmtM(dif)}${at.a ? ` (${fmtP(dif / at.a * 100)})` : ''}</td>` : ''}</tr></tbody></table>
      <p>${p ? (dif > 0 ? `A proposta acarreta aumento de despesa de ${fmtM(dif)} por ano, que deverá ser compensado ou ter a fonte de custeio indicada, nos termos da Lei de Responsabilidade Fiscal.` : dif < 0 ? `A proposta reduz a despesa em ${fmtM(-dif)} por ano.` : 'A proposta não altera a despesa com os cargos lançados.') : 'Os valores refletem os cargos e despesas lançados no módulo Financeiro do GABOrg.'}</p>
      <p class="pq">Valores calculados a partir da Tabela de valores do GABOrg (cargos DGA e demais despesas). Conferir com a folha de pagamento antes do envio.</p>`;
  }
  return h;
}
function exportarMinuta(modo){
  const o = dadosMinutaForm(), p = o.cenario && DB.propostas.find(x => x.id === o.cenario);
  if (modo === 'copiar') { const t = document.createElement('div'); t.innerHTML = gerarMinuta(o); navigator.clipboard.writeText(t.innerText).then(() => toast('Texto copiado.'), () => toast('Não foi possível copiar.', 'aviso')); return; }
  const codigo = gerarCodigo('DEC'), d = new Date(), emis = { codigo, data:d.toLocaleDateString('pt-BR'), quando:d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }), por:cfg.usuario || cfg.login || '' };
  const titulo = 'Minuta de decreto' + (p ? ' – ' + p.nome : ' – estrutura vigente'), nome = 'minuta-decreto-' + codigo;
  const html = `<style>${ESTILO_REL}</style>` + docHTML([blocoCapa('Minuta de decreto', titulo, SISTEMA_ORG, emis, filtrosDec(o))]) + gerarMinuta(o) + docHTML([Object.assign({ t:'selo' }, emis)]);
  if (modo === 'word') baixarWord(nome, titulo, html); else imprimirDoc(titulo, html);
  registrarEmissao({ c:codigo, tipo:'Minuta de decreto', titulo, formato:modo === 'word' ? 'word' : 'print', det:p ? p.nome : 'Estrutura vigente' });
  toast('Documento emitido: ' + codigo);
}

/* ===================== SERVIDORES (Órgão Central e DREs) =====================
   A planilha de lotação é importada pelo próprio sistema e gravada na aba "Servidores" da planilha Google.
   O CPF nunca é importado. Usuários com perfil Leitor recebem os dados sem nome e sem matrícula. */
let svAba = store.get('gaborg_sv_aba', 'geral'), svFil = { q:'', tipo:'', unid:'', cargo:'', vinc:'', sit:'' }, svLim = 100, svPrev = null, svUniArea = '', svUniVazios = false;
const SV_ABAS = [['geral', 'Visão geral', 'fa-chart-pie'], ['unidades', 'Por unidade', 'fa-sitemap'], ['dres', 'DREs', 'fa-map-location-dot'], ['lista', 'Lista', 'fa-list'], ['importar', 'Importar planilha', 'fa-file-import']];
const SV_CARGOS = [['Professor', '#2563eb', /^PROFESSOR(ES)?\b/], ['ADES', '#0e7490', /^ADES$/], ['TAE', '#7c3aed', /^TAE$/], ['AAE', '#0891b2', /^AAE$/], ['TDES', '#4f46e5', /^TDES$/], ['Estagiário', '#65a30d', /ESTAGI/], ['Residente técnico', '#84cc16', /RESIDENTE/], ['Exclusivamente comissionado', '#d97706', /COMISSIONADO/], ['Militar', '#334155', /MILITAR|POLICIAL/]];
const SV_COR_OUTROS = '#94a3b8';
const svGrupoCargo = c => { const t = String(c || '').trim().toUpperCase(); if (!t) return 'Não informado'; const g = SV_CARGOS.find(x => x[2].test(t)); return g ? g[0] : 'Outros cargos'; };
const svCorCargo = g => (SV_CARGOS.find(x => x[0] === g) || [0, g === 'Não informado' ? '#cbd5e1' : SV_COR_OUTROS])[1];
const svEhDRE = r => /^DRE\b/i.test(r.unidade || '') || /DRE/i.test(r.tipoLotacao || '');
const svNomeUnid = u => /^DRE\s/i.test(u || '') ? 'DRE ' + nomeDRE(u) : String(u || '—');
const svTemp = r => /TEMPOR/i.test(r.vinculo || '');
const svEfet = r => /EFETIV/i.test(r.vinculo || '');
const svComV = r => /COMISSION/i.test(r.vinculo || '') || (!svEfet(r) && !svTemp(r) && /COMISSIONADO/i.test(r.cargo || ''));
const svPartes = l => { const e = l.filter(svEfet).length, t = l.filter(svTemp).length, c = l.filter(svComV).length; return [[e, '#16a34a'], [t, '#f59e0b'], [c, '#b45309'], [l.length - e - t - c, '#cbd5e1']]; };
const SV_LEG = '<span class="sv-leg"><i style="background:#16a34a"></i>efetivos <i style="background:#f59e0b"></i>temporários <i style="background:#b45309"></i>comissionados</span>';
const svChave = r => (r.unidade || '') + '|' + (r.lotacaoCod || r.lotacao || '');
const svLista = () => DB.servidores || [];
const svComNome = () => svLista().some(r => r.nome);
const svDiasFim = r => r.dataFinal ? diasAte(r.dataFinal) : null;
function svVerMaior(a, b){ const p = s => String(s || '0').split('.').map(Number); const x = p(a), y = p(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; }
const svBackendOk = () => !online() || !backendVersao || !svVerMaior('1.11.0', backendVersao);

/* ---------- correspondência lotação → setor da estrutura ---------- */
const SV_PARADAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'em', 'para', 'na', 'no']);
const svTokens = s => new Set(norm(s).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w && !SV_PARADAS.has(w)));
function svLimparLotacao(txt, unidade){
  let t = String(txt || '').replace(/^\s*\d+\s*-\s*/, '').replace(/\s*-\s*DME\s*$/i, '').trim();
  const dre = String(unidade || '').replace(/^DRE\s+/i, '');
  if (dre) t = t.replace(new RegExp('\\s*(DA|DE)?\\s*DIRETORIA\\s+(REGIONAL|METROPOLITANA)\\s+(DE\\s+(EDUCA[ÇC][ÃA]O\\s+)?)?(DE\\s+)?' + dre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i'), '').trim();
  return t;
}
function svRaizes(){
  const L = setoresOficiais().filter(s => s.status !== 'Extinto'), dre = new Map(), area = new Map();
  L.forEach(s => { if (/^Diretoria (Regional de Educação de|Metropolitana de Educação)/i.test(s.nome) && !/Adjunta/i.test(s.nome)) dre.set(norm(s.nome), s.id); if (s.sigla && areas.includes(s.id)) area.set(s.sigla.toUpperCase(), s.id); });
  return { L, dre, area };
}
function svCandidatos(unidade, R){
  const u = String(unidade || '').toUpperCase().trim(), sub = id => [porId.get(id), ...[...descendentes(id)].map(i => porId.get(i))].filter(s => s && s.status !== 'Extinto');
  if (/^DRE\s/.test(u)) { const n = norm(u.replace(/^DRE\s+/, '')); for (const [k, id] of R.dre) if (k.endsWith(n) || (n === 'metropolitana' && k.includes('metropolitana'))) return sub(id); return []; }
  if (R.area.has(u)) return sub(R.area.get(u));
  return R.L;
}
function svCasar(unidade, lotacao, R, mapa){
  const k = unidade + '|' + lotacao.cod; if (mapa && mapa[k]) return mapa[k] !== '-' && porId.has(mapa[k]) ? mapa[k] : '';
  const alvo = svLimparLotacao(lotacao.nome, unidade), ta = svTokens(alvo), cand = svCandidatos(unidade, R);
  if (!ta.size || /^diretoria (regional|metropolitana)( de educacao)?$/.test(norm(alvo))) return /^DRE\s/i.test(unidade) && cand[0] ? cand[0].id : '';
  let melhor = '', ms = 0;
  const testar = (lista, min) => lista.forEach(s => { const tb = svTokens(s.nome); let i = 0; ta.forEach(w => { if (tb.has(w)) i++; }); const sc = i / (ta.size + tb.size - i); if (sc > ms || (sc === ms && melhor && (prof.get(s.id) || 0) < (prof.get(melhor) || 0))) { ms = sc; melhor = s.id; } });
  testar(cand); if (ms >= .6) return melhor;
  if (/^DRE\s/i.test(unidade)) return '';
  ms = 0; melhor = ''; testar(R.L); return ms >= .85 ? melhor : '';
}
const svMapa = () => { const m = param('mapaLotacao', {}); return m && typeof m === 'object' ? m : {}; };

/* ---------- indicadores ---------- */
function svDados(lista){
  const L = lista || svLista(), cont = f => L.filter(f).length;
  const porUnid = new Map(); L.forEach(r => { const u = r.unidade || '—'; if (!porUnid.has(u)) porUnid.set(u, []); porUnid.get(u).push(r); });
  const porCargo = {}; L.forEach(r => { const g = svGrupoCargo(r.cargo); porCargo[g] = (porCargo[g] || 0) + 1; });
  const porSetor = new Map(); L.forEach(r => { if (!r.setorId) return; if (!porSetor.has(r.setorId)) porSetor.set(r.setorId, []); porSetor.get(r.setorId).push(r); });
  const semCasar = new Map(); L.filter(r => !r.setorId || !porId.has(r.setorId)).forEach(r => { const k = svChave(r); if (!semCasar.has(k)) semCasar.set(k, { k, unidade:r.unidade, cod:r.lotacaoCod, nome:svLimparLotacao(r.lotacao, ''), l:[] }); semCasar.get(k).l.push(r); });
  const vence90 = L.filter(r => { const d = svDiasFim(r); return d !== null && d >= 0 && d <= 90; }), venceAno = L.filter(r => r.dataFinal && r.dataFinal.slice(0, 4) === hojeISO().slice(0, 4) && (svDiasFim(r) ?? -1) >= 0);
  return { L, n:L.length, oc:cont(r => !svEhDRE(r)), dre:cont(svEhDRE), efet:cont(svEfet), temp:cont(svTemp), prof:cont(r => svGrupoCargo(r.cargo) === 'Professor'), est:cont(r => ['Estagiário', 'Residente técnico'].includes(svGrupoCargo(r.cargo))),
    com:cont(r => svComV(r) || svGrupoCargo(r.cargo) === 'Exclusivamente comissionado'), semCargo:cont(r => !r.cargo), sug:cont(r => r.sugerido === '1' || /^sim$/i.test(r.sugerido)), porUnid, porCargo, porSetor, semCasar, vence90, venceAno };
}
function svBarras(it, total){ const mx = Math.max(1, ...it.map(x => x[1])); return it.map(([n, v, partes, on, ic]) => `<div class="barra-l sv-b" ${on ? `style="cursor:pointer" onclick="${on}"` : ''}><span class="n" title="${esc(n)}">${ic || ''}${esc(n)}</span><span class="t">${(partes || [[v, '#2563eb']]).map(([q, c]) => `<span style="width:${(q / mx * 100).toFixed(2)}%;background:${c}" title="${fmtN(q)}"></span>`).join('')}</span><b>${fmtN(v)}${total ? `<small>${pct(v, total)}%</small>` : ''}</b></div>`).join(''); }
const svIrLista = o => `svFil=Object.assign({q:'',tipo:'',unid:'',cargo:'',vinc:'',sit:''},${esc(JSON.stringify(o))});svLim=100;abaSv('lista')`;

/* ---------- tela ---------- */
function abaSv(k){ svAba = k; store.set('gaborg_sv_aba', k); renderServidores(); const r = $('#v-servidores .rolagem'); if (r) r.scrollTop = 0; }
function renderServidores(){
  const el = $('#sv-corpo'); if (!el) return;
  const D = svDados(), imp = param('servidoresImport', null);
  const aviso = !svBackendOk() ? `<div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-triangle-exclamation"></i>Atualize o Codigo.gs para a versão 1.11.0</h3><p class="s">A planilha Google ainda não tem a aba "Servidores" (backend ${esc(backendVersao)}). Cole o novo Codigo.gs no Apps Script e publique uma nova versão; sem isso os servidores ficam só neste navegador.</p></div>` : '';
  const topo = abasG(SV_ABAS.filter(a => a[0] !== 'importar' || ehAdmin()), svAba, 'abaSv') + (imp && imp.em ? `<p class="sv-orig"><i class="fa-solid fa-file-excel"></i>Base: <b>${esc(imp.arquivo || 'planilha')}</b> · importada em ${fmtData(imp.em)} por ${esc(imp.por || '—')} · ${fmtN(D.n)} servidores</p>` : '');
  if (!D.n && svAba !== 'importar') { el.innerHTML = aviso + topo + `<div class="cartao vazio"><i class="fa-solid fa-id-card-clip" style="font-size:34px;color:var(--marca);margin-bottom:10px"></i><h3 style="margin:0 0 6px">Nenhum servidor importado ainda</h3><p>${ehAdmin() ? 'Importe a planilha de lotação (Órgão Central e DREs) para ver quem está em cada unidade.' : 'Peça a um administrador para importar a planilha de lotação.'}</p>${ehAdmin() ? `<button class="btn btn-p" onclick="abaSv('importar')"><i class="fa-solid fa-file-import"></i>Importar planilha</button>` : ''}</div>`; return; }
  const corpo = { geral:svGeral, unidades:svUnidades, dres:svDREs, lista:svListaTela, importar:svImportarTela }[svAba] || svGeral;
  el.innerHTML = aviso + topo + corpo(D);
}
function svGeral(D){
  const U = [...D.porUnid].map(([u, l]) => [u, l.length, l.filter(svEfet).length, l.filter(svTemp).length]).sort((a, b) => b[1] - a[1]);
  const C = Object.entries(D.porCargo).sort((a, b) => b[1] - a[1]);
  const S = setoresOficiais().filter(s => s.status !== 'Extinto' && !['Conselho', 'Colegiado', 'Comissão', 'Câmara', 'Unidades Escolares'].includes(s.tipo) && !/^Unidades Escolares$/i.test(s.nome));
  const vazios = S.filter(s => !D.porSetor.has(s.id)), semC = [...D.semCasar.values()].sort((a, b) => b.l.length - a.l.length);
  const tempAlta = [...D.porSetor].map(([id, l]) => [id, l.length, l.filter(svTemp).length]).filter(x => x[1] >= 5 && x[2] / x[1] > .6).sort((a, b) => b[2] / b[1] - a[2] / a[1]);
  const meses = {}; D.L.forEach(r => { const d = svDiasFim(r); if (d === null || d < 0 || d > 366) return; const m = r.dataFinal.slice(0, 7); meses[m] = (meses[m] || 0) + 1; });
  const nomeMes = m => new Date(m + '-15T12:00:00').toLocaleDateString('pt-BR', { month:'short', year:'numeric' }).replace('.', '');
  const ocE = D.L.filter(r => !svEhDRE(r)), drE = D.L.filter(svEhDRE);
  const al = [];
  if (semC.length) al.push(['#dc2626', `<b>${fmtN(D.L.length - [...D.porSetor.values()].reduce((t, l) => t + l.length, 0))}</b> servidores em <b>${semC.length}</b> lotações que não correspondem a nenhuma unidade da nova estrutura (Decreto nº 2.236/2026).`, "abaSv('unidades')"]);
  if (D.vence90.length) al.push(['#d97706', `<b>${fmtN(D.vence90.length)}</b> vínculos terminam nos próximos 90 dias${D.vence90.filter(svTemp).length ? ` (${fmtN(D.vence90.filter(svTemp).length)} temporários)` : ''}: risco de descontinuidade.`, svIrLista({ sit:'vence90' })]);
  if (D.venceAno.length > D.vence90.length) al.push(['#d97706', `<b>${fmtN(D.venceAno.length)}</b> vínculos terminam até 31/12/${hojeISO().slice(0, 4)} (${pct(D.venceAno.length, D.n)}% da força de trabalho).`, svIrLista({ sit:'venceAno' })]);
  if (vazios.length) al.push(['#7c3aed', `<b>${vazios.length}</b> unidades da nova estrutura ainda sem nenhum servidor lotado na planilha.`, "svUniVazios=true;abaSv('unidades')"]);
  if (tempAlta.length) al.push(['#d97706', `<b>${tempAlta.length}</b> unidades com mais de 60% de temporários (mín. 5 servidores). Maior: ${esc(nomeSetor(tempAlta[0][0]))} (${pct(tempAlta[0][2], tempAlta[0][1])}%).`, "abaSv('unidades')"]);
  if (D.prof) al.push(['#2563eb', `<b>${fmtN(D.prof)}</b> professores (${pct(D.prof, D.n)}%) estão lotados em unidades administrativas, fora da sala de aula.`, svIrLista({ cargo:'Professor' })]);
  if (D.semCargo) al.push(['#94a3b8', `<b>${fmtN(D.semCargo)}</b> registros sem cargo informado.`, svIrLista({ cargo:'Não informado' })]);
  if (D.sug) al.push(['#0e7490', `<b>${fmtN(D.sug)}</b> servidores marcados como "sugeridos" na planilha de origem.`, svIrLista({ sit:'sugerido' })]);
  return `<div class="kpis">${kpiG('#1e3a8a', 'fa-users', 'Servidores', fmtN(D.n), `${fmtN(D.oc)} no Órgão Central · ${fmtN(D.dre)} nas DREs`, "abaSv('lista')")}
    ${kpiG('#16a34a', 'fa-user-check', 'Efetivos', fmtN(D.efet), pct(D.efet, D.n) + '% do total', svIrLista({ vinc:'EFETIVO' }))}
    ${kpiG('#d97706', 'fa-user-clock', 'Temporários', fmtN(D.temp), pct(D.temp, D.n) + '% do total', svIrLista({ vinc:'TEMPOR' }))}
    ${kpiG('#2563eb', 'fa-chalkboard-user', 'Professores fora da sala', fmtN(D.prof), 'lotados em unidades administrativas', svIrLista({ cargo:'Professor' }))}
    ${kpiG('#65a30d', 'fa-user-graduate', 'Estagiários e residentes', fmtN(D.est), pct(D.est, D.n) + '% do total')}
    ${kpiG('#b45309', 'fa-user-tie', 'Exclusivamente comissionados', fmtN(D.com), 'sem vínculo efetivo')}
    ${kpiG('#dc2626', 'fa-hourglass-half', 'Vínculos a vencer (90 dias)', fmtN(D.vence90.length), fmtN(D.venceAno.length) + ' até o fim do ano', svIrLista({ sit:'vence90' }))}
    ${kpiG('#7c3aed', 'fa-link-slash', 'Fora da nova estrutura', fmtN([...D.semCasar.values()].reduce((t, x) => t + x.l.length, 0)), D.semCasar.size + ' lotações sem correspondência', "abaSv('unidades')")}</div>
    ${al.length ? `<div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-bell"></i>Pontos de atenção</h3><p class="s">O que a planilha de lotação mostra sobre a nova estrutura</p><div class="pend">${al.map(([c, t, on]) => `<button onclick="${on}"><i class="fa-solid fa-circle" style="color:${c};font-size:8px"></i><span>${t}</span><i class="fa-solid fa-chevron-right" style="margin-left:auto;color:var(--mut2)"></i></button>`).join('')}</div></div>` : ''}
    <div class="grade2"><div class="cartao bl" style="--c:#1e3a8a"><h3><i class="fa-solid fa-building-columns"></i>Onde estão os servidores</h3><p class="s">Por secretaria adjunta e DRE · ${SV_LEG}</p>${svBarras(U.map(([u, n]) => [svNomeUnid(u), n, svPartes(D.porUnid.get(u)), svIrLista({ unid:u })]), D.n)}</div>
      <div><div class="cartao bl" style="--c:#2563eb"><h3><i class="fa-solid fa-id-badge"></i>Por cargo</h3><p class="s">Agrupado pela carreira</p>${svBarras(C.map(([g, n]) => [g, n, [[n, svCorCargo(g)]], svIrLista({ cargo:g })]), D.n)}</div>
      <div class="cartao bl" style="--c:#0e7490"><h3><i class="fa-solid fa-scale-balanced"></i>Órgão Central × DREs</h3><p class="s">Composição dos vínculos</p>${svBarras([['Órgão Central', ocE.length, svPartes(ocE), svIrLista({ tipo:'oc' })], ['DREs', drE.length, svPartes(drE), svIrLista({ tipo:'dre' })]], D.n)}
        <p class="s" style="margin-top:8px">Temporários: ${pct(ocE.filter(svTemp).length, ocE.length)}% no Órgão Central e ${pct(drE.filter(svTemp).length, drE.length)}% nas DREs.</p></div>
      <div class="cartao bl" style="--c:#d97706"><h3><i class="fa-solid fa-calendar-xmark"></i>Fim dos vínculos (próximos 12 meses)</h3><p class="s">Quantos vínculos terminam em cada mês</p>${Object.keys(meses).length ? svBarras(Object.keys(meses).sort().map(m => [nomeMes(m), meses[m], [[meses[m], '#f59e0b']]])) : '<p class="vazio">Nenhum vínculo termina nos próximos 12 meses.</p>'}</div></div></div>`;
}
function svUnidades(D){
  const R = setoresOficiais().filter(s => s.status !== 'Extinto' && (!svUniArea || areaDe.get(s.id) === svUniArea || s.id === svUniArea));
  const ord = R.map(s => ({ s, l:D.porSetor.get(s.id) || [] })).filter(x => svUniVazios || x.l.length).sort((a, b) => ordemArvore(a.s.id) - ordemArvore(b.s.id));
  const semC = [...D.semCasar.values()].sort((a, b) => (a.unidade || '').localeCompare(b.unidade || '', 'pt-BR') || b.l.length - a.l.length);
  const pode = podeGestao(), op = pode ? `<option value="">— sem correspondência —</option>` + setoresOficiais().filter(s => s.status !== 'Extinto').slice().sort((a, b) => ordemArvore(a.id) - ordemArvore(b.id)).map(s => `<option value="${esc(s.id)}">${'  '.repeat(Math.min(prof.get(s.id) || 0, 6))}${esc(s.nome)}${s.sigla ? ' (' + esc(s.sigla) + ')' : ''}</option>`).join('') : '';
  const cel = (l, f) => { const n = l.filter(f).length; return n ? fmtN(n) : '<span class="sv-z">—</span>'; };
  return `<div class="filtros"><select class="campo" onchange="svUniArea=this.value;renderServidores()"><option value="">Todas as áreas</option>${areas.map(a => `<option value="${esc(a)}" ${a === svUniArea ? 'selected' : ''}>${esc(nomeCurto(porId.get(a)))}</option>`).join('')}</select>
      <label class="lg-lembrar" style="margin:0"><input type="checkbox" ${svUniVazios ? 'checked' : ''} onchange="svUniVazios=this.checked;renderServidores()">Mostrar unidades sem servidores</label><span style="flex:1"></span>
      ${pode ? `<button class="btn btn-s btn-sm" onclick="svAplicarContagem()"><i class="fa-solid fa-arrows-rotate"></i>Atualizar nº de servidores dos setores</button>` : ''}</div>
    <div class="tab-wrap"><table class="tab sv-tab"><thead><tr><th>Unidade da estrutura</th><th class="dir">Servidores</th><th class="dir">Efetivos</th><th class="dir">Temporários</th><th class="dir">% temp.</th><th class="dir">Professores</th><th class="dir">Estagiários</th><th class="dir">Comissionados</th></tr></thead><tbody>
    ${ord.map(({ s, l }) => { const t = l.filter(svTemp).length; return `<tr onclick="svVerSetor(${arg(s.id)})" class="${l.length ? '' : 'sv-vazio'}"><td class="nm" style="white-space:normal;padding-left:${8 + Math.min(prof.get(s.id) || 0, 8) * 12}px"><i class="fa-solid ${icTipo(s.tipo)}" style="color:${corTipo(s.tipo)};margin-right:6px"></i><b>${esc(s.nome)}</b>${s.sigla ? ` <small style="color:var(--mut)">${esc(s.sigla)}</small>` : ''}</td>
      <td class="dir"><b>${l.length ? fmtN(l.length) : '<span class="sv-z">0</span>'}</b></td><td class="dir">${cel(l, svEfet)}</td><td class="dir">${cel(l, svTemp)}</td><td class="dir">${l.length ? `<span style="color:${t / l.length > .6 ? '#d97706' : 'inherit'}">${pct(t, l.length)}%</span>` : '—'}</td>
      <td class="dir">${cel(l, r => svGrupoCargo(r.cargo) === 'Professor')}</td><td class="dir">${cel(l, r => ['Estagiário', 'Residente técnico'].includes(svGrupoCargo(r.cargo)))}</td><td class="dir">${cel(l, r => svGrupoCargo(r.cargo) === 'Exclusivamente comissionado')}</td></tr>`; }).join('') || '<tr><td colspan="8" class="vazio">Nenhuma unidade com servidores neste filtro.</td></tr>'}</tbody></table></div>
    ${svCorrCard(D, semC, op, pode)}`;
}
const ordemArvore = (() => { let cache = null, ver = null; return id => { if (ver !== porId) { ver = porId; cache = new Map(); let i = 0; const vis = s => { cache.set(s.id, i++); filhosDe(s.id).forEach(vis); }; setoresOficiais().filter(s => !s.paiId || !porId.has(s.paiId)).forEach(vis); } return cache.has(id) ? cache.get(id) : 1e9; }; })();
let svCorr = 'sem';
function svCorrCard(D, semC, op, pode){
  const todas = new Map(); D.L.forEach(r => { const k = svChave(r); if (!todas.has(k)) todas.set(k, { k, unidade:r.unidade, cod:r.lotacaoCod, nome:svLimparLotacao(r.lotacao, ''), l:[], setorId:r.setorId && porId.has(r.setorId) ? r.setorId : '' }); todas.get(k).l.push(r); });
  const manual = svMapa(), L = svCorr === 'todas' ? [...todas.values()].sort((a, b) => (a.unidade || '').localeCompare(b.unidade || '', 'pt-BR') || (a.nome || '').localeCompare(b.nome || '', 'pt-BR')) : semC;
  return `<div class="cartao bl" style="--c:#7c3aed;margin-top:14px"><h3><i class="fa-solid fa-link-slash"></i>Correspondência das lotações com a nova estrutura</h3>
    <p class="s">${semC.length} lotação(ões) da planilha sem unidade correspondente no Decreto nº 2.236/2026 · ${todas.size} lotações no total. A ligação automática compara os nomes; ${pode ? 'confira e corrija quando precisar — a escolha vale para as próximas importações.' : 'Editores podem corrigir.'}</p>
    <div class="rm-seg" style="max-width:420px;margin-bottom:10px"><button class="${svCorr === 'sem' ? 'on' : ''}" onclick="svCorr='sem';renderServidores()">Sem correspondência (${semC.length})</button><button class="${svCorr === 'todas' ? 'on' : ''}" onclick="svCorr='todas';renderServidores()">Todas as lotações (${todas.size})</button></div>
    ${L.length ? `<div class="tab-wrap" style="max-height:520px"><table class="tab"><thead><tr><th>Lotação na planilha</th><th>Unidade</th><th class="dir">Servidores</th><th>${pode ? 'Unidade na nova estrutura' : 'Na nova estrutura'}</th></tr></thead><tbody>${L.map(x => { const sid = x.setorId || ''; return `<tr><td style="white-space:normal"><b>${esc(x.nome || '—')}</b>${x.cod ? ` <small style="color:var(--mut)">cód. ${esc(x.cod)}</small>` : ''}</td><td>${esc(svNomeUnid(x.unidade))}</td><td class="dir">${fmtN(x.l.length)}</td>
      <td style="white-space:normal;min-width:260px">${sid ? `<b>${esc(nomeSetor(sid))}</b><small style="display:block;color:var(--mut)">${esc(caminho(sid).slice(1).map(nomeCurto).join(' › ') || '')}</small>` : chipG('sem correspondência', '#7c3aed')}
        <div style="display:flex;gap:6px;align-items:center;margin-top:4px">${manual[x.k] ? chipG('manual', '#7c3aed') : sid ? chipG('automática', '#16a34a') : ''}${pode ? `<button class="btn btn-s btn-sm" onclick="svEscolher(${arg(x.k)})"><i class="fa-solid fa-pen"></i>${sid ? 'Alterar' : 'Ligar'}</button>` : ''}</div></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="vazio">Todas as lotações foram ligadas a uma unidade da estrutura.</p>'}</div>`;
}
let svEsc = null;
function svEscOps(q){ const E = svEsc; if (!E) return ''; return '<option value="">— sem correspondência —</option>' + E.L.filter(x => !q || norm(x.r).includes(norm(q))).map(x => `<option value="${esc(x.id)}" ${x.id === E.sel ? 'selected' : ''}>${esc(x.r)}</option>`).join(''); }
function svEscolher(k){
  const ex = svLista().find(r => svChave(r) === k); if (!ex) return;
  svEsc = { k, sel:ex.setorId, L:setoresOficiais().filter(s => s.status !== 'Extinto').slice().sort((a, b) => ordemArvore(a.id) - ordemArvore(b.id)).map(s => ({ id:s.id, r:s.nome + (s.sigla ? ' (' + s.sigla + ')' : '') + (caminho(s.id).length > 1 ? ' — ' + caminho(s.id).slice(1).map(nomeCurto).join(' › ') : '') })) };
  abrirModal({ titulo:'Ligar lotação à nova estrutura', rotulo:'Salvar', largura:720, html:`<p class="s" style="margin:0 0 8px"><b>${esc(svLimparLotacao(ex.lotacao, ''))}</b> · ${esc(svNomeUnid(ex.unidade))}</p>
    <input class="campo" id="sv-esc-q" placeholder="Filtrar por nome, sigla ou DRE" oninput="document.getElementById('sv-esc-s').innerHTML=svEscOps(this.value)" style="margin-bottom:8px">
    <select class="campo" id="sv-esc-s" size="12" style="height:auto">${svEscOps('')}</select>`,
    aoConfirmar:() => { const v = $('#sv-esc-s').value; svLigar(k, v); return true; } });
}
function svVerSetor(id){
  const s = porId.get(id); if (!s) return; const l = (svDados().porSetor.get(id) || []).slice().sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
  const nomes = svComNome();
  abrirModal({ titulo:(s.sigla ? s.sigla + ' · ' : '') + s.nome, rotulo:'Fechar', semCancelar:true, largura:760, html:`<p class="s" style="margin:0 0 10px">${fmtN(l.length)} servidor(es) lotado(s) nesta unidade segundo a planilha · ${fmtN(l.filter(svEfet).length)} efetivos · ${fmtN(l.filter(svTemp).length)} temporários</p>
    ${l.length ? `<div class="tab-wrap" style="max-height:52vh"><table class="tab"><thead><tr>${nomes ? '<th>Nome</th><th>Matrícula</th>' : ''}<th>Cargo</th><th>Vínculo</th><th>Início</th><th>Fim</th></tr></thead><tbody>${l.map(r => `<tr>${nomes ? `<td>${esc(r.nome || '—')}</td><td>${esc(r.matricula || '—')}</td>` : ''}<td>${esc(r.cargo || '—')}</td><td>${chipG(esc(r.vinculo || '—'), svTemp(r) ? '#d97706' : '#16a34a')}</td><td>${r.dataInicio ? fmtDia(r.dataInicio) : '—'}</td><td>${r.dataFinal ? fmtDia(r.dataFinal) : '—'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="vazio">Nenhum servidor lotado nesta unidade na planilha importada.</p>'}
    ${nomes ? '' : '<p class="s" style="margin-top:8px"><i class="fa-solid fa-lock"></i> Nomes e matrículas aparecem só para Editores e Administradores.</p>'}` });
}
function svLigar(k, setorId){
  if (!podeGestao()) return;
  const m = svMapa(); if (setorId) m[k] = setorId; else m[k] = '-'; salvarParam('mapaLotacao', m);
  const ops = []; svLista().forEach(r => { if (svChave(r) === k) { r.setorId = setorId; ops.push({ op:'upsert', table:'servidores', record:{ id:r.id, setorId } }); } });
  svEnfileirarLote(ops); toast(setorId ? `${ops.length} servidor(es) ligado(s) a ${nomeSetor(setorId)}.` : `${ops.length} servidor(es) marcados como sem correspondência.`); renderServidores();
}
async function svAplicarContagem(){
  const P = svDados().porSetor, mud = setoresOficiais().filter(s => s.status !== 'Extinto' && String(num(s.servidores)) !== String((P.get(s.id) || []).length) && ((P.get(s.id) || []).length || num(s.servidores)));
  if (!mud.length) return toast('O nº de servidores dos setores já está igual ao da planilha.');
  if (!await confirmar('Atualizar o nº de servidores', `O campo "Nº de servidores" de <b>${mud.length}</b> setor(es) passará a ser a quantidade de servidores lotados na planilha importada. Continuar?`, 'Atualizar')) return;
  mud.forEach(s => { s.servidores = String((P.get(s.id) || []).length); s.atualizadoEm = agora(); s.atualizadoPor = cfg.usuario || ''; enfileirar('setores', s); });
  redesenharTudo(); toast(`${mud.length} setor(es) atualizado(s).`);
}
function svDREs(D){
  const E = escolasLista(), dres = dresDe(E), Ld = D.L.filter(svEhDRE);
  const linhas = dres.map(d => { const l = Ld.filter(r => norm(r.unidade) === norm(d)), e = E.filter(x => x.dre === d); return { d, l, n:l.length, ef:l.filter(svEfet).length, te:l.filter(svTemp).length, pr:l.filter(r => svGrupoCargo(r.cargo) === 'Professor').length, es:e.length, al:alunosDe(e), mun:new Set(e.map(x => x.municipio)).size }; });
  const med = linhas.reduce((t, x) => t + x.n, 0) / Math.max(1, linhas.reduce((t, x) => t + x.es, 0));
  return `<div class="kpis">${kpiG('#0e7490', 'fa-users', 'Servidores nas DREs', fmtN(Ld.length), dres.length + ' diretorias regionais')}${kpiG('#16a34a', 'fa-school', 'Servidores por escola', med.toFixed(1).replace('.', ','), 'média da rede (servidores da DRE ÷ escolas)')}
      ${kpiG('#d97706', 'fa-user-clock', 'Temporários nas DREs', pct(Ld.filter(svTemp).length, Ld.length) + '%', fmtN(Ld.filter(svTemp).length) + ' servidores')}${kpiG('#2563eb', 'fa-chalkboard-user', 'Professores nas DREs', fmtN(Ld.filter(r => svGrupoCargo(r.cargo) === 'Professor').length), 'em funções administrativas')}</div>
    <div class="grade2"><div class="cartao bl" style="--c:#0e7490"><h3><i class="fa-solid fa-scale-unbalanced"></i>Servidores por escola em cada DRE</h3><p class="s">Quanto maior, mais equipe para apoiar cada escola</p>${svBarras(linhas.slice().sort((a, b) => b.n / Math.max(1, b.es) - a.n / Math.max(1, a.es)).map(x => [nomeDRE(x.d), +(x.n / Math.max(1, x.es)).toFixed(1), [[x.n / Math.max(1, x.es), corDRE(dres, x.d)]], svIrLista({ unid:x.l[0] ? x.l[0].unidade : x.d })])).replace(/<b>([\d.]+)<\/b>/g, (m, v) => `<b>${String(v).replace('.', ',')}</b>`)}</div>
      <div class="cartao bl" style="--c:#16a34a"><h3><i class="fa-solid fa-users-between-lines"></i>Tamanho das equipes</h3><p class="s">${SV_LEG}</p>${svBarras(linhas.slice().sort((a, b) => b.n - a.n).map(x => [nomeDRE(x.d), x.n, svPartes(x.l), svIrLista({ unid:x.l[0] ? x.l[0].unidade : x.d })]))}</div></div>
    <div class="tab-wrap"><table class="tab sv-tab"><thead><tr><th>DRE</th><th class="dir">Servidores</th><th class="dir">Efetivos</th><th class="dir">Temporários</th><th class="dir">% temp.</th><th class="dir">Professores</th><th class="dir">Escolas</th><th class="dir">Alunos</th><th class="dir">Municípios</th><th class="dir">Serv./escola</th><th class="dir">Alunos/serv.</th></tr></thead><tbody>
    ${linhas.map(x => `<tr onclick="${svIrLista({ unid:x.l[0] ? x.l[0].unidade : x.d })}"><td><i class="fa-solid fa-circle" style="color:${corDRE(dres, x.d)};font-size:9px;margin-right:6px"></i><b>${esc(nomeDRE(x.d))}</b></td><td class="dir"><b>${fmtN(x.n)}</b></td><td class="dir">${fmtN(x.ef)}</td><td class="dir">${fmtN(x.te)}</td><td class="dir">${pct(x.te, x.n)}%</td><td class="dir">${fmtN(x.pr)}</td><td class="dir">${fmtN(x.es)}</td><td class="dir">${fmtN(x.al)}</td><td class="dir">${fmtN(x.mun)}</td><td class="dir"><b>${(x.n / Math.max(1, x.es)).toFixed(1).replace('.', ',')}</b></td><td class="dir">${x.n ? fmtN(Math.round(x.al / x.n)) : '—'}</td></tr>`).join('')}</tbody></table></div>`;
}
function svFiltrar(D){
  const q = norm(svFil.q), f = svFil;
  return D.L.filter(r => (!f.tipo || (f.tipo === 'dre') === svEhDRE(r)) && (!f.unid || r.unidade === f.unid) && (!f.cargo || svGrupoCargo(r.cargo) === f.cargo) && (!f.vinc || String(r.vinculo || '').toUpperCase().includes(f.vinc))
    && (!f.sit || (f.sit === 'vence90' ? (d => d !== null && d >= 0 && d <= 90)(svDiasFim(r)) : f.sit === 'venceAno' ? (r.dataFinal && r.dataFinal.slice(0, 4) === hojeISO().slice(0, 4) && (svDiasFim(r) ?? -1) >= 0) : f.sit === 'semSetor' ? !r.setorId || !porId.has(r.setorId) : f.sit === 'sugerido' ? r.sugerido === '1' : true))
    && (!q || norm([r.nome, r.matricula, r.cargo, r.lotacao, nomeSetor(r.setorId)].join(' ')).includes(q)));
}
function svListaTela(D){
  const L = svFiltrar(D).sort((a, b) => (a.nome || a.lotacao || '').localeCompare(b.nome || b.lotacao || '', 'pt-BR')), nomes = svComNome(), V = L.slice(0, svLim);
  const unids = [...D.porUnid.keys()].sort((a, b) => (/^DRE/.test(a) - /^DRE/.test(b)) || a.localeCompare(b, 'pt-BR')), cargos = Object.keys(D.porCargo).sort();
  const sel = (k, rot, ops) => `<select class="campo" onchange="svFil.${k}=this.value;svLim=100;renderServidores()"><option value="">${rot}</option>${ops.map(([v, n]) => `<option value="${esc(v)}" ${svFil[k] === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  return `<div class="filtros"><div class="busca"><i class="fa-solid fa-magnifying-glass"></i><input class="campo" placeholder="${nomes ? 'Buscar nome, matrícula, cargo ou lotação' : 'Buscar cargo ou lotação'}" value="${esc(svFil.q)}" oninput="svFil.q=this.value;svLim=100;clearTimeout(window.tSv);window.tSv=setTimeout(()=>{renderServidores();const i=document.querySelector('#sv-corpo .busca input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},300)"></div>
      ${sel('tipo', 'Órgão Central e DREs', [['oc', 'Órgão Central'], ['dre', 'DREs']])}${sel('unid', 'Todas as unidades', unids.map(u => [u, svNomeUnid(u)]))}${sel('cargo', 'Todos os cargos', cargos.map(c => [c, c]))}${sel('vinc', 'Todos os vínculos', [['EFETIVO', 'Efetivos'], ['TEMPOR', 'Temporários'], ['COMISSION', 'Exclusivamente comissionados']])}
      ${sel('sit', 'Qualquer situação', [['vence90', 'Vínculo termina em 90 dias'], ['venceAno', 'Vínculo termina este ano'], ['semSetor', 'Fora da nova estrutura'], ['sugerido', 'Marcados como sugeridos']])}
      ${podeGestao() ? `<button class="btn btn-s btn-sm" onclick="svExportar()"><i class="fa-solid fa-file-csv"></i>Exportar</button>` : ''}</div>
    <p class="s" style="margin:-4px 0 8px;color:var(--mut)">${fmtN(L.length)} servidor(es)${L.length !== D.n ? ' de ' + fmtN(D.n) : ''}${nomes ? '' : ' · <i class="fa-solid fa-lock"></i> nomes e matrículas visíveis só para Editores e Administradores'}</p>
    <div class="tab-wrap"><table class="tab sv-tab"><thead><tr>${nomes ? '<th>Nome</th><th>Matrícula</th>' : ''}<th>Cargo</th><th>Vínculo</th><th>Unidade</th><th>Lotação (planilha)</th><th>Na nova estrutura</th><th>Início</th><th>Fim</th></tr></thead><tbody>
    ${V.map(r => { const d = svDiasFim(r); return `<tr>${nomes ? `<td><b>${esc(r.nome || '—')}</b></td><td>${esc(r.matricula || '—')}</td>` : ''}<td>${esc(r.cargo || '—')}</td><td>${chipG(esc(r.vinculo || '—'), svTemp(r) ? '#d97706' : '#16a34a')}</td><td>${esc(svNomeUnid(r.unidade))}</td><td style="white-space:normal;min-width:200px">${esc(svLimparLotacao(r.lotacao, ''))}</td>
      <td style="white-space:normal;min-width:180px">${r.setorId && porId.has(r.setorId) ? `<a href="#" onclick="event.preventDefault();irPara(${arg(r.setorId)})">${esc(nomeSetor(r.setorId))}</a>` : chipG('sem correspondência', '#7c3aed')}</td><td>${r.dataInicio ? fmtDia(r.dataInicio) : '—'}</td><td>${r.dataFinal ? fmtDia(r.dataFinal) + (d !== null && d >= 0 && d <= 90 ? ' ' + chipG(d + ' dias', '#dc2626') : '') : '—'}</td></tr>`; }).join('') || `<tr><td colspan="${nomes ? 9 : 7}" class="vazio">Nenhum servidor com esses filtros.</td></tr>`}</tbody></table></div>
    ${L.length > svLim ? `<div style="text-align:center;margin:12px 0"><button class="btn btn-s" onclick="svLim+=200;renderServidores()"><i class="fa-solid fa-angles-down"></i>Mostrar mais (${fmtN(L.length - svLim)} restantes)</button></div>` : ''}`;
}
function svExportar(){
  const L = svFiltrar(svDados()), nomes = svComNome();
  csvBaixar('gaborg-servidores', [(nomes ? ['Nome', 'Matrícula'] : []).concat(['Cargo', 'Grupo do cargo', 'Vínculo', 'Tipo de lotação', 'Unidade', 'Código da lotação', 'Lotação', 'Unidade na nova estrutura', 'Área', 'Início', 'Fim'])]
    .concat(L.map(r => (nomes ? [r.nome, r.matricula] : []).concat([r.cargo, svGrupoCargo(r.cargo), r.vinculo, r.tipoLotacao, svNomeUnid(r.unidade), r.lotacaoCod, svLimparLotacao(r.lotacao, ''), nomeSetor(r.setorId) || 'sem correspondência', nomeCurto(porId.get(areaDe.get(r.setorId))) || '', r.dataInicio ? fmtDia(r.dataInicio) : '', r.dataFinal ? fmtDia(r.dataFinal) : '']))));
}

/* ---------- importação ---------- */
function svImportarTela(D){
  if (!ehAdmin()) return '<div class="cartao vazio">Só administradores importam a planilha de servidores.</div>';
  const P = svPrev;
  return `<div class="grade2"><div class="cartao bl" style="--c:#16a34a"><h3><i class="fa-solid fa-file-import"></i>Importar a planilha de lotação</h3>
      <p class="s">Aceita o arquivo Excel (.xlsx) ou CSV exportado do sistema de pessoal, com as colunas <b>TipoLotacao, ADJ/DRE, Lotacao, Nome, Matricula, Cargo, DataInicio, DataFinal, TipoVinculo</b> e Sugeridos. A importação <b>substitui</b> a lista atual de servidores.</p>
      <label class="sv-arq"><input type="file" accept=".xlsx,.xls,.csv" onchange="svLerArquivo(this.files[0]);this.value=''"><i class="fa-solid fa-cloud-arrow-up"></i><b>Escolher arquivo</b><small>ou arraste para cá</small></label>
      <p class="s" style="margin-top:10px"><i class="fa-solid fa-shield-halved" style="color:#16a34a"></i> <b>Proteção de dados:</b> a coluna CPF é ignorada e nunca é gravada. Os dados ficam na planilha Google do sistema (aba "Servidores"), não no código publicado. Leitores veem apenas números, sem nome e matrícula.</p></div>
    <div class="cartao bl" style="--c:#2563eb"><h3><i class="fa-solid fa-eye"></i>Conferência antes de gravar</h3>
      ${P ? `<p class="s">Arquivo <b>${esc(P.arquivo)}</b> · ${fmtN(P.regs.length)} servidores lidos${P.ign ? ` · ${P.ign} linha(s) vazia(s) ignorada(s)` : ''}</p>
        <div class="kpis" style="grid-template-columns:repeat(2,minmax(0,1fr))">${kpiG('#1e3a8a', 'fa-users', 'Servidores', fmtN(P.regs.length), `${fmtN(P.regs.filter(r => !svEhDRE(r)).length)} Órgão Central · ${fmtN(P.regs.filter(svEhDRE).length)} DREs`)}${kpiG('#16a34a', 'fa-link', 'Ligados à estrutura', pct(P.regs.filter(r => r.setorId).length, P.regs.length) + '%', `${fmtN(P.regs.filter(r => r.setorId).length)} servidores em unidades do decreto`)}
        ${kpiG('#d97706', 'fa-user-clock', 'Temporários', fmtN(P.regs.filter(svTemp).length), pct(P.regs.filter(svTemp).length, P.regs.length) + '%')}${kpiG('#7c3aed', 'fa-link-slash', 'Lotações sem correspondência', fmtN(new Set(P.regs.filter(r => !r.setorId).map(svChave)).size), 'podem ser ligadas depois em "Por unidade"')}</div>
        <p class="s">Colunas reconhecidas: ${P.cols.map(c => chipG(esc(c), '#2563eb')).join(' ')}${P.cpf ? ' ' + chipG('CPF (ignorada)', '#94a3b8') : ''}</p>
        ${!svBackendOk() ? `<p class="s" style="color:#dc2626"><i class="fa-solid fa-triangle-exclamation"></i> O Codigo.gs da planilha está na versão ${esc(backendVersao)}. Atualize para a 1.11.0 antes de importar, para os servidores ficarem gravados na planilha.</p>` : ''}
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn btn-p" onclick="svConfirmar()" ${svBackendOk() ? '' : 'disabled'}><i class="fa-solid fa-check"></i>Gravar ${fmtN(P.regs.length)} servidores</button><button class="btn btn-s" onclick="svPrev=null;renderServidores()">Cancelar</button></div>`
      : `<p class="vazio">Escolha um arquivo para ver o resumo aqui antes de gravar.</p>`}</div></div>`;
}
function svDataISO(v){
  if (v == null || v === '') return '';
  if (v instanceof Date) return isNaN(v) ? '' : v.getFullYear() + '-' + String(v.getMonth() + 1).padStart(2, '0') + '-' + String(v.getDate()).padStart(2, '0');
  if (typeof v === 'number' && v > 20000 && v < 80000) { const d = new Date(Math.round((v - 25569) * 864e5)); return d.toISOString().slice(0, 10); }
  const s = String(v).trim(), m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m2 ? m2[0] : '';
}
async function svLerArquivo(f){
  if (!f || !ehAdmin()) return;
  try {
    toast('Lendo a planilha...');
    let linhas;
    if (/\.csv$/i.test(f.name)) { const t = await f.text(), sep = (t.split('\n')[0].match(/;/g) || []).length >= (t.split('\n')[0].match(/,/g) || []).length ? ';' : ','; linhas = t.split(/\r?\n/).map(l => l.split(sep).map(c => c.replace(/^"|"$/g, '').trim())); }
    else { await carregarScript(['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js']); const wb = XLSX.read(await f.arrayBuffer(), { type:'array', cellDates:true }); linhas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header:1, raw:true, defval:'' }); }
    const chaves = { tipolotacao:'tipoLotacao', adjdre:'unidade', lotacao:'lotacao', nome:'nome', matricula:'matricula', cargo:'cargo', datainicio:'dataInicio', datafinal:'dataFinal', tipovinculo:'vinculo', sugeridos:'sugerido', sugerido:'sugerido' };
    const nk = s => norm(s).replace(/[^a-z0-9]/g, '');
    const hi = linhas.findIndex(l => l.some(c => nk(c) === 'tipolotacao') || (l.some(c => nk(c) === 'nome') && l.some(c => nk(c) === 'matricula')));
    if (hi < 0) throw new Error('Não encontrei o cabeçalho (TipoLotacao, ADJ/DRE, Lotacao, Nome, Matricula...).');
    const cab = linhas[hi].map(nk), col = {}; cab.forEach((c, i) => { if (chaves[c] && col[chaves[c]] == null) col[chaves[c]] = i; });
    if (col.lotacao == null || (col.unidade == null && col.tipoLotacao == null)) throw new Error('A planilha precisa das colunas ADJ/DRE (ou TipoLotacao) e Lotacao.');
    const R = svRaizes(), mapa = svMapa(), usados = new Map(), regs = []; let ign = 0;
    linhas.slice(hi + 1).forEach(l => {
      const g = k => col[k] == null ? '' : l[col[k]], lot = String(g('lotacao') || '').trim(); if (!lot && !String(g('nome') || '').trim()) { ign++; return; }
      const cod = (lot.match(/^\s*(\d+)\s*-/) || [])[1] || '', unidade = String(g('unidade') || g('tipoLotacao') || '').trim().toUpperCase(), mat = String(g('matricula') || '').trim().replace(/\.0$/, '');
      let id = 'sv' + (mat || 'x' + svHash([g('nome'), g('cargo'), lot].join('|'))); const n = (usados.get(id) || 0) + 1; usados.set(id, n); if (n > 1) id += '-' + n;
      const sg = String(g('sugerido') || '').trim();
      regs.push(novoReg('servidores', { id, matricula:mat, nome:String(g('nome') || '').trim(), cargo:String(g('cargo') || '').trim(), vinculo:String(g('vinculo') || '').trim().toUpperCase(), tipoLotacao:String(g('tipoLotacao') || '').trim(), unidade, lotacaoCod:cod, lotacao:lot,
        setorId:svCasar(unidade, { cod:cod || lot, nome:lot }, R, mapa), dataInicio:svDataISO(g('dataInicio')), dataFinal:svDataISO(g('dataFinal')), sugerido:sg === '1' || /^sim$/i.test(sg) ? '1' : '0' }));
    });
    if (!regs.length) throw new Error('Nenhum servidor encontrado no arquivo.');
    svPrev = { arquivo:f.name, regs, ign, cols:Object.keys(col).map(k => ({ tipoLotacao:'TipoLotacao', unidade:'ADJ/DRE', lotacao:'Lotacao', nome:'Nome', matricula:'Matricula', cargo:'Cargo', dataInicio:'DataInicio', dataFinal:'DataFinal', vinculo:'TipoVinculo', sugerido:'Sugeridos' }[k])), cpf:cab.includes('cpf') };
    svAba = 'importar'; renderServidores(); toast(`${fmtN(regs.length)} servidores lidos. Confira o resumo e grave.`);
  } catch (e) { console.error(e); toast('Não foi possível ler a planilha: ' + e.message, 'erro'); }
}
function svHash(t){ let h = 2166136261; for (const ch of norm(t)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); }
function svEnfileirarLote(ops){
  salvarLocal(); if (!online() || !ops.length) return statusSync();
  fila.push(...ops); store.set('gaborg_fila', fila); clearTimeout(tFila); tFila = setTimeout(enviarFila, 300); statusSync();
}
async function svConfirmar(){
  const P = svPrev; if (!P || !ehAdmin()) return;
  if (!svBackendOk()) return toast('Atualize o Codigo.gs para a versão 1.11.0 antes de importar.', 'aviso');
  const ant = svLista(), novos = new Set(P.regs.map(r => r.id));
  if (!await confirmar('Gravar servidores', `A lista atual (${fmtN(ant.length)}) será substituída por <b>${fmtN(P.regs.length)}</b> servidores do arquivo <b>${esc(P.arquivo)}</b>. O CPF não é gravado. Continuar?`, 'Gravar')) return;
  const quando = agora(), por = cfg.usuario || cfg.login || '';
  P.regs.forEach(r => { r.importadoEm = quando; r.importadoPor = por; });
  const ops = ant.filter(r => !novos.has(r.id)).map(r => ({ op:'delete', table:'servidores', record:{ id:r.id } })).concat(P.regs.map(r => ({ op:'upsert', table:'servidores', record:Object.assign({}, r) })));
  DB.servidores = P.regs; svPrev = null;
  salvarParam('servidoresImport', { em:quando, por, arquivo:P.arquivo, n:P.regs.length, ligados:P.regs.filter(r => r.setorId).length });
  svEnfileirarLote(ops); svAba = 'geral'; store.set('gaborg_sv_aba', 'geral'); renderServidores();
  toast(`${fmtN(P.regs.length)} servidores gravados${online() ? '; enviando para a planilha em lotes de 500' : ''}.`);
}
/* realinha os servidores sem unidade quando a estrutura muda (novos setores, nomes corrigidos) */
function svRecasar(){
  if (!podeGestao()) return; const R = svRaizes(), mapa = svMapa(), ops = [];
  svLista().forEach(r => { if (r.setorId && porId.has(r.setorId)) return; const id = svCasar(r.unidade, { cod:r.lotacaoCod || r.lotacao, nome:r.lotacao }, R, mapa); if (id && id !== r.setorId) { r.setorId = id; ops.push({ op:'upsert', table:'servidores', record:{ id:r.id, setorId:id } }); } });
  svEnfileirarLote(ops); return ops.length;
}
function svResumoSetor(s){
  if (!svLista().length) return '';
  const ids = new Set([s.id, ...descendentes(s.id)]), dir = svLista().filter(r => r.setorId === s.id), tot = svLista().filter(r => ids.has(r.setorId));
  return `<div class="sv-pn"><i class="fa-solid fa-id-card-clip"></i><div><b>${fmtN(dir.length)}</b> servidor(es) lotado(s) aqui na planilha de lotação${tot.length > dir.length ? ` · <b>${fmtN(tot.length)}</b> somando os subordinados` : ''}<small>${fmtN(dir.filter(svEfet).length)} efetivos · ${fmtN(dir.filter(svTemp).length)} temporários${num(s.servidores) !== dir.length ? ` · o cadastro informa ${fmtN(s.servidores || 0)}` : ''}</small></div>${dir.length ? `<button class="btn btn-s btn-sm" onclick="svVerSetor(${arg(s.id)})">Ver</button>` : ''}</div>`;
}

/* ===================== IMPLANTAÇÃO DA NOVA ESTRUTURA ===================== */
let imProp = store.get('gaborg_im_prop', '*'), imVer = 'fases';
const FASES_IM = ['Preparação', 'Aprovação', 'Publicação', 'Pessoas', 'Instalação das unidades', 'Sistemas e comunicação'];
const STATUS_IM = { 'A fazer':'#64748b', 'Em andamento':'#2563eb', 'Concluída':'#16a34a', 'Bloqueada':'#dc2626' };
const PLANO_PADRAO = [
  ['Preparação', 'Validar a proposta com as secretarias adjuntas e as áreas afetadas', 0, 10],
  ['Preparação', 'Levantar a lotação atual e os cargos envolvidos', 0, 10],
  ['Preparação', 'Consolidar a minuta do decreto e a exposição de motivos', 7, 15],
  ['Aprovação', 'Parecer da assessoria jurídica sobre a minuta', 15, 25],
  ['Aprovação', 'Análise do impacto financeiro e da fonte de custeio', 15, 25],
  ['Aprovação', 'Aprovação do(a) Secretário(a) de Estado de Educação', 25, 30],
  ['Publicação', 'Envio da minuta à Casa Civil', 30, 32],
  ['Publicação', 'Publicação do decreto no Diário Oficial', 32, 45],
  ['Pessoas', 'Exonerações e nomeações dos cargos em comissão', 45, 60],
  ['Pessoas', 'Remanejamento e lotação dos servidores nas novas unidades', 45, 75],
  ['Sistemas e comunicação', 'Atualizar sistemas de folha, protocolo, e-mails e permissões', 45, 75],
  ['Sistemas e comunicação', 'Atualizar o organograma oficial e comunicar a rede', 50, 70],
  ['Sistemas e comunicação', 'Publicar o regimento interno atualizado', 60, 90]
];
function etapasDe(pid){ return (DB.etapas || []).filter(e => pid === '*' || (e.propostaId || '') === pid); }
function atrasada(e){ return e.status !== 'Concluída' && e.prazo && diasAte(e.prazo) < 0; }
function renderImplantacao(){
  const el = $('#im-corpo'); if (!el) return;
  const P = DB.propostas || [], L = etapasDe(imProp).slice().sort((a, b) => FASES_IM.indexOf(a.fase) - FASES_IM.indexOf(b.fase) || num(a.ordem) - num(b.ordem) || String(a.prazo).localeCompare(String(b.prazo)));
  const conc = L.filter(e => e.status === 'Concluída').length, atr = L.filter(atrasada), prox = L.filter(e => e.status !== 'Concluída' && e.prazo && diasAte(e.prazo) >= 0 && diasAte(e.prazo) <= 7), bloq = L.filter(e => e.status === 'Bloqueada');
  const opt = `<select class="campo" style="width:auto;height:34px" onchange="imProp=this.value;store.set('gaborg_im_prop',imProp);renderImplantacao()"><option value="*" ${imProp === '*' ? 'selected' : ''}>Todas as etapas</option>${P.map(p => `<option value="${esc(p.id)}" ${imProp === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}<option value="" ${imProp === '' ? 'selected' : ''}>Sem proposta vinculada</option></select>`;
  const prop = P.find(p => p.id === imProp);
  const linha = e => { const d = e.prazo ? diasAte(e.prazo) : null, at = atrasada(e);
    return `<tr class="${at ? 'atr' : ''}"><td style="width:150px" onclick="event.stopPropagation()">${podeGestao() ? `<select class="campo im-st" style="--c:${STATUS_IM[e.status] || '#64748b'}" onchange="mudarEtapa(${arg(e.id)},'status',this.value)">${Object.keys(STATUS_IM).map(k => `<option ${k === (e.status || 'A fazer') ? 'selected' : ''}>${k}</option>`).join('')}</select>` : chipG(esc(e.status || 'A fazer'), STATUS_IM[e.status] || '#64748b')}</td>
      <td class="nm" style="white-space:normal" onclick="formEtapa(${arg(e.id)})"><b>${esc(e.titulo)}</b>${e.observacao ? `<small style="display:block;color:var(--mut)">${esc(e.observacao)}</small>` : ''}${imProp === '*' && e.propostaId ? `<small style="display:block;color:var(--marca)">${esc((P.find(p => p.id === e.propostaId) || {}).nome || '')}</small>` : ''}</td>
      <td onclick="formEtapa(${arg(e.id)})">${esc(e.responsavel || '—')}${e.setorId ? `<small style="display:block;color:var(--mut)">${esc(nomeCurto(porId.get(e.setorId)))}</small>` : ''}</td>
      <td onclick="formEtapa(${arg(e.id)})">${fmtDia(e.inicio)}</td><td onclick="formEtapa(${arg(e.id)})">${fmtDia(e.prazo)}${d !== null && e.status !== 'Concluída' ? `<small style="display:block;color:${at ? '#dc2626' : d <= 7 ? '#d97706' : 'var(--mut)'}">${at ? `atrasada ${-d} dia(s)` : d === 0 ? 'vence hoje' : `faltam ${d} dia(s)`}</small>` : ''}</td>
      <td class="so-edit" style="width:44px" onclick="event.stopPropagation()"><button class="btn btn-g btn-sm btn-i" title="Excluir" onclick="excluirEtapa(${arg(e.id)})"><i class="fa-solid fa-trash"></i></button></td></tr>`; };
  // linha do tempo
  const comDatas = L.filter(e => e.inicio && e.prazo), t0 = Math.min(...comDatas.map(e => tData(e.inicio)), tData(hojeISO())), t1 = Math.max(...comDatas.map(e => tData(e.prazo)), tData(hojeISO()) + 864e5);
  const pos = t => ((t - t0) / (t1 - t0) * 100).toFixed(2), hoje = pos(tData(hojeISO()));
  const gantt = comDatas.length ? `<div class="cartao bl" style="--c:#0f766e"><h3><i class="fa-solid fa-chart-gantt"></i>Linha do tempo</h3><p class="s">De ${fmtDia(new Date(t0).toISOString())} a ${fmtDia(new Date(t1).toISOString())}. A linha vertical é hoje.</p><div class="im-gantt">${comDatas.map(e => `<div class="lg"><span class="n" title="${esc(e.titulo)}">${esc(e.titulo)}</span><span class="tr"><i class="hj" style="left:${hoje}%"></i><b style="left:${pos(tData(e.inicio))}%;width:${Math.max(1, pos(tData(e.prazo)) - pos(tData(e.inicio)))}%;background:${atrasada(e) ? '#dc2626' : STATUS_IM[e.status] || '#64748b'}" onclick="formEtapa(${arg(e.id)})"></b></span></div>`).join('')}</div></div>` : '';
  const pctC = L.length ? Math.round(conc * 100 / L.length) : 0;
  el.innerHTML = avisoGestao() + `<div class="ind-filtro"><span><i class="fa-solid fa-filter"></i>Plano</span>${opt}
      ${podeGestao() ? `<button class="btn btn-p btn-sm" onclick="formEtapa('')"><i class="fa-solid fa-plus"></i>Nova etapa</button>${imProp !== '*' ? `<button class="btn btn-s btn-sm" onclick="gerarPlano(${arg(imProp)})"><i class="fa-solid fa-wand-magic-sparkles"></i>Gerar plano ${prop ? 'desta proposta' : 'padrão'}</button>` : ''}` : ''}
      <button class="btn btn-s btn-sm" onclick="exportarEtapas()"><i class="fa-solid fa-file-csv"></i>Exportar</button></div>
    <div class="kpis">${kpiG('#0f766e', 'fa-list-check', 'Etapas', fmtN(L.length), `${conc} concluídas`)}${kpiG(pctC >= 75 ? '#16a34a' : '#2563eb', 'fa-percent', 'Andamento', pctC + '%', `<span class="im-prog"><i style="width:${pctC}%"></i></span>`)}${kpiG('#dc2626', 'fa-hourglass-end', 'Atrasadas', fmtN(atr.length), atr.length ? 'prazo vencido e não concluídas' : 'nenhuma etapa atrasada')}${kpiG('#d97706', 'fa-calendar-week', 'Vencem em 7 dias', fmtN(prox.length), 'atenção aos próximos prazos')}${kpiG('#7f1d1d', 'fa-ban', 'Bloqueadas', fmtN(bloq.length), 'dependem de outra decisão')}</div>
    ${!L.length ? `<div class="cartao vazio" style="padding:40px"><i class="fa-solid fa-list-check"></i>Nenhuma etapa ${imProp === '*' ? 'cadastrada' : 'neste plano'}.<br><span style="font-size:12.5px">${prop ? 'Use <b>Gerar plano desta proposta</b>: o sistema cria as etapas padrão (jurídico, financeiro, publicação, nomeações, sistemas) e uma etapa para cada unidade criada, extinta ou movida.' : 'Escolha uma proposta no filtro e use <b>Gerar plano</b>, ou cadastre etapas uma a uma.'}</span></div>` :
    FASES_IM.concat([...new Set(L.map(e => e.fase).filter(f => !FASES_IM.includes(f)))]).map(f => { const l = L.filter(e => (e.fase || FASES_IM[0]) === f); if (!l.length) return ''; const c = l.filter(e => e.status === 'Concluída').length;
      return `<div class="cartao bl im-fase" style="--c:#0f766e"><h3><i class="fa-solid fa-flag"></i>${esc(f)} <span class="ct">${c}/${l.length}</span><span class="im-prog" style="margin-left:10px;flex:0 0 120px"><i style="width:${Math.round(c * 100 / l.length)}%"></i></span></h3>
        <div class="tab-wrap"><table class="tab im-tab"><thead><tr><th>Situação</th><th>Etapa</th><th>Responsável</th><th>Início</th><th>Prazo</th><th class="so-edit"></th></tr></thead><tbody>${l.map(linha).join('')}</tbody></table></div></div>`; }).join('')}
    ${gantt}`;
}
function gerarPlano(pid){
  const p = (DB.propostas || []).find(x => x.id === pid), ja = etapasDe(pid);
  const passos = PLANO_PADRAO.map(([f, t, i, d]) => ({ fase:f, titulo:t, inicio:somaDias(i), prazo:somaDias(d) }));
  if (p) { const A = setoresOficiais(), mA = new Map(A.map(s => [s.id, s])), B = estruturaProposta(p).lista, mB = new Map(B.map(s => [s.id, s])), at = s => s && s.status !== 'Extinto';
    B.filter(s => at(s) && !at(mA.get(s.id))).forEach(s => passos.push({ fase:'Instalação das unidades', titulo:`Instalar ${s.nome}: nomear a chefia, lotar a equipe e definir o espaço`, inicio:somaDias(45), prazo:somaDias(75), setorId:'' }));
    A.filter(s => at(s) && !at(mB.get(s.id))).forEach(s => passos.push({ fase:'Instalação das unidades', titulo:`Desativar ${s.nome}: remanejar equipe, processos e acervo`, inicio:somaDias(45), prazo:somaDias(75), setorId:s.id }));
    B.filter(s => at(s) && at(mA.get(s.id)) && (mA.get(s.id).paiId || '') !== (s.paiId || '')).forEach(s => passos.push({ fase:'Instalação das unidades', titulo:`Atualizar a subordinação de ${s.nome} nos sistemas e fluxos`, inicio:somaDias(45), prazo:somaDias(60), setorId:s.id })); }
  const novos = passos.filter(x => !ja.some(e => e.titulo === x.titulo));
  if (!novos.length) return toast('Todas as etapas do plano já existem.');
  novos.forEach((x, i) => { const e = novoReg('etapas', Object.assign({ id:novoId('im'), propostaId:pid || '', status:'A fazer', ordem:String(i + 1), atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }, x)); DB.etapas.push(e); enfileirar('etapas', e); });
  toast(`${novos.length} etapa(s) criada(s). Ajuste responsáveis e prazos.`); renderImplantacao();
}
function mudarEtapa(id, k, v){ const e = DB.etapas.find(x => x.id === id); if (!e) return; e[k] = v; e.atualizadoEm = agora(); e.atualizadoPor = cfg.usuario || ''; enfileirar('etapas', e); renderImplantacao(); }
async function excluirEtapa(id){ const e = DB.etapas.find(x => x.id === id); if (!e || !await confirmar('Excluir etapa', `Excluir "<b>${esc(e.titulo)}</b>"?`, 'Excluir', true)) return; DB.etapas = DB.etapas.filter(x => x !== e); enfileirar('etapas', e, true); renderImplantacao(); }
function formEtapa(id){
  if (!podeGestao()) return toast('Seu perfil é somente leitura.', 'aviso');
  const e = DB.etapas.find(x => x.id === id) || novoReg('etapas', { propostaId:imProp === '*' ? '' : imProp, status:'A fazer', fase:FASES_IM[0], inicio:hojeISO() });
  abrirModal({ titulo:id ? 'Editar etapa' : 'Nova etapa', rotulo:'Salvar', largura:560,
    html:`<label><span class="rot">Etapa</span><input id="et-t" class="campo" required value="${esc(e.titulo)}" placeholder="O que precisa ser feito"></label>
      <div class="g2"><label><span class="rot">Fase</span><select id="et-f" class="campo">${FASES_IM.map(f => `<option ${f === e.fase ? 'selected' : ''}>${f}</option>`).join('')}</select></label><label><span class="rot">Situação</span><select id="et-s" class="campo">${Object.keys(STATUS_IM).map(k => `<option ${k === e.status ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
      <div class="g2"><label><span class="rot">Responsável</span><input id="et-r" class="campo" value="${esc(e.responsavel)}" placeholder="Nome"></label><label><span class="rot">Setor responsável</span><select id="et-set" class="campo"><option value="">—</option>${opcoesSetoresFin(e.setorId)}</select></label></div>
      <div class="g2"><label><span class="rot">Início</span><input id="et-i" type="date" class="campo" value="${esc(e.inicio)}"></label><label><span class="rot">Prazo</span><input id="et-p" type="date" class="campo" value="${esc(e.prazo)}"></label></div>
      <label><span class="rot">Proposta</span><select id="et-prop" class="campo"><option value="">Nenhuma</option>${(DB.propostas || []).map(p => `<option value="${esc(p.id)}" ${p.id === e.propostaId ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></label>
      <label><span class="rot">Observação</span><textarea id="et-o" class="campo">${esc(e.observacao)}</textarea></label>`,
    aoConfirmar: async m => {
      const v = k => m.querySelector(k).value.trim(), o = { titulo:v('#et-t'), fase:v('#et-f'), status:v('#et-s'), responsavel:v('#et-r'), setorId:v('#et-set'), inicio:v('#et-i'), prazo:v('#et-p'), propostaId:v('#et-prop'), observacao:v('#et-o') };
      if (!o.titulo) throw new Error('Descreva a etapa.');
      if (o.inicio && o.prazo && o.prazo < o.inicio) throw new Error('O prazo não pode ser antes do início.');
      Object.assign(e, o, { atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      if (!DB.etapas.includes(e)) { e.id = novoId('im'); e.ordem = String(DB.etapas.length + 1); DB.etapas.push(e); }
      enfileirar('etapas', e); renderImplantacao();
    } });
}
function exportarEtapas(){ csvBaixar('gaborg-implantacao', [['Proposta', 'Fase', 'Etapa', 'Situação', 'Responsável', 'Setor', 'Início', 'Prazo', 'Atrasada', 'Observação']].concat(etapasDe(imProp).map(e => [((DB.propostas || []).find(p => p.id === e.propostaId) || {}).nome || '', e.fase, e.titulo, e.status, e.responsavel, nomeSetor(e.setorId), fmtDia(e.inicio), fmtDia(e.prazo), atrasada(e) ? 'Sim' : '', e.observacao]))); }

/* ===================== CHEFIAS E SUCESSÃO ===================== */
let chFil = { area:'', sit:'', q:'' };
const SIT_CH = { 'Titular':'#16a34a', 'Interino':'#d97706', 'Em nomeação':'#2563eb', 'Vago':'#dc2626', 'Não informado':'#94a3b8' };
function simboloChefia(setorId){ const l = DB.despesas.find(d => d.setorId === setorId && d.observacao === MARCA_CHEFIA && (d.cenario || 'Atual') === 'Atual'); if (!l) return ''; const r = rubricaDe(l.rubricaId); return r ? r.codigo : ''; }
function chefiaDe(s){
  const r = (DB.chefias || []).find(c => c.setorId === s.id);
  if (r) return r;
  return novoReg('chefias', { setorId:s.id, titular:s.responsavel, situacao:s.responsavel ? 'Titular' : 'Não informado', contato:s.contato });
}
function alertasChefia(s, c){
  const a = [], d = c.desde ? diasDesdeData(c.desde) : null, simb = simboloChefia(s.id), alto = /^DGA-?[1-3]$/i.test(simb) || (prof.get(s.id) || 0) <= 1;
  if (c.situacao === 'Vago') a.push(['#dc2626', d !== null ? `vago há ${d} dia(s)` : 'cargo vago']);
  if (c.situacao === 'Interino' && d !== null && d > 90) a.push(['#d97706', `interino há ${d} dias`]);
  if (c.situacao === 'Em nomeação' && d !== null && d > 30) a.push(['#d97706', `em nomeação há ${d} dias`]);
  if (c.situacao === 'Não informado') a.push(['#94a3b8', 'sem registro']);
  if (alto && c.situacao !== 'Vago' && !c.substituto) a.push(['#7c3aed', 'sem substituto formal']);
  if (['Titular', 'Interino'].includes(c.situacao) && !c.atoNomeacao) a.push(['#64748b', 'sem ato de nomeação']);
  return a;
}
function renderChefias(){
  const el = $('#ch-corpo'); if (!el) return;
  const todas = setoresOficiais().filter(s => s.status !== 'Extinto' && CHEFIAS.includes(s.tipo));
  const linhas = todas.map(s => { const c = chefiaDe(s); return { s, c, a:alertasChefia(s, c), simb:simboloChefia(s.id) }; });
  const q = norm(chFil.q), L = linhas.filter(x => (!chFil.area || areaDe.get(x.s.id) === chFil.area) && (!chFil.sit || x.c.situacao === chFil.sit) && (!q || norm([x.s.nome, x.s.sigla, x.c.titular, x.c.substituto].join(' ')).includes(q)))
    .sort((a, b) => (prof.get(a.s.id) || 0) - (prof.get(b.s.id) || 0) || a.s.nome.localeCompare(b.s.nome, 'pt-BR'));
  const cnt = k => linhas.filter(x => x.c.situacao === k).length, semSub = linhas.filter(x => x.a.some(a => a[1] === 'sem substituto formal')).length;
  const vagLong = linhas.filter(x => x.c.situacao === 'Vago' && x.c.desde && diasDesdeData(x.c.desde) > 30).length;
  const crit = linhas.filter(x => x.a.some(a => a[0] === '#dc2626' || a[0] === '#d97706')).slice(0, 20);
  el.innerHTML = avisoGestao() + `<div class="kpis">${kpiG('#1e3a8a', 'fa-user-tie', 'Chefias', fmtN(linhas.length), 'gabinetes, superintendências, coordenadorias...')}${kpiG('#16a34a', 'fa-user-check', 'Com titular', fmtN(cnt('Titular')), pct(cnt('Titular'), linhas.length) + '% das chefias', "chFil.sit='Titular';renderChefias()")}${kpiG('#d97706', 'fa-user-clock', 'Interinos', fmtN(cnt('Interino')), `${cnt('Em nomeação')} em nomeação`, "chFil.sit='Interino';renderChefias()")}${kpiG('#dc2626', 'fa-user-slash', 'Vagos', fmtN(cnt('Vago')), `${vagLong} há mais de 30 dias`, "chFil.sit='Vago';renderChefias()")}${kpiG('#7c3aed', 'fa-people-arrows', 'Sem substituto', fmtN(semSub), 'nas chefias de nível mais alto')}${kpiG('#94a3b8', 'fa-circle-question', 'Sem registro', fmtN(cnt('Não informado')), 'ainda não cadastradas aqui', "chFil.sit='Não informado';renderChefias()")}</div>
    ${crit.length ? `<div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-bell"></i>Riscos de continuidade</h3><p class="s">Vagas longas, interinidades prolongadas e nomeações paradas</p><div class="pend">${crit.map(x => `<button onclick="formChefia(${arg(x.s.id)})"><span>${esc(x.s.nome)}</span>${x.a.filter(a => a[0] !== '#94a3b8').map(a => chipG(esc(a[1]), a[0])).join(' ')}</button>`).join('')}</div></div>` : ''}
    <div class="filtros"><div class="busca"><i class="fa-solid fa-magnifying-glass"></i><input class="campo" placeholder="Buscar chefia, titular ou substituto" value="${esc(chFil.q)}" oninput="chFil.q=this.value;clearTimeout(window.tCh);window.tCh=setTimeout(()=>{renderChefias();const i=document.querySelector('#ch-corpo .busca input');i.focus();i.setSelectionRange(i.value.length,i.value.length)},300)"></div>
      <select class="campo" onchange="chFil.area=this.value;renderChefias()"><option value="">Todas as áreas</option>${areas.map(a => `<option value="${esc(a)}" ${a === chFil.area ? 'selected' : ''}>${esc(nomeCurto(porId.get(a)))}</option>`).join('')}</select>
      <select class="campo" onchange="chFil.sit=this.value;renderChefias()"><option value="">Todas as situações</option>${Object.keys(SIT_CH).map(k => `<option ${k === chFil.sit ? 'selected' : ''}>${k}</option>`).join('')}</select>
      <button class="btn btn-s btn-sm" onclick="exportarChefias()"><i class="fa-solid fa-file-csv"></i>Exportar</button></div>
    <div class="tab-wrap"><table class="tab ch-tab"><thead><tr><th>Unidade</th><th>Símbolo</th><th>Titular</th><th>Situação</th><th>Desde</th><th>Ato</th><th>Substituto</th><th>Atenção</th></tr></thead><tbody>
    ${L.map(x => `<tr onclick="formChefia(${arg(x.s.id)})"><td class="nm" style="white-space:normal"><i class="fa-solid ${icTipo(x.s.tipo)}" style="color:${corTipo(x.s.tipo)};margin-right:6px"></i><b>${esc(x.s.nome)}</b><small style="display:block;color:var(--mut)">${esc(caminho(x.s.id).map(nomeCurto).join(' › ') || 'nível mais alto')}</small></td>
      <td>${x.simb ? chipG(esc(x.simb), '#7c3aed') : '—'}</td><td>${esc(x.c.titular || '—')}</td><td>${chipG(esc(x.c.situacao), SIT_CH[x.c.situacao] || '#94a3b8')}</td><td>${x.c.desde ? fmtDia(x.c.desde) + `<small style="display:block;color:var(--mut)">${diasDesdeData(x.c.desde)} dia(s)</small>` : '—'}</td>
      <td style="white-space:normal;max-width:180px">${esc(x.c.atoNomeacao || '—')}</td><td>${esc(x.c.substituto || '—')}</td><td style="white-space:normal">${x.a.map(a => chipG(esc(a[1]), a[0])).join(' ')}</td></tr>`).join('') || '<tr><td colspan="8" class="vazio">Nenhuma chefia com esses filtros.</td></tr>'}</tbody></table></div>`;
}
function formChefia(setorId){
  const s = porId.get(setorId); if (!s) return;
  if (!podeGestao()) return irPara(setorId);
  const c = chefiaDe(s);
  abrirModal({ titulo:'Chefia: ' + (s.sigla || s.nome), rotulo:'Salvar', largura:560,
    html:`<p style="margin-top:0">${esc(s.nome)}${simboloChefia(s.id) ? ' · cargo ' + esc(simboloChefia(s.id)) : ''}</p>
      <div class="g2"><label><span class="rot">Situação</span><select id="ch-sit" class="campo">${Object.keys(SIT_CH).filter(k => k !== 'Não informado').map(k => `<option ${k === c.situacao ? 'selected' : ''}>${k}</option>`).join('')}</select></label><label><span class="rot">Desde <small>nomeação, interinidade ou vacância</small></span><input id="ch-desde" type="date" class="campo" value="${esc(c.desde)}"></label></div>
      <label><span class="rot">Titular / ocupante</span><input id="ch-tit" class="campo" value="${esc(c.titular)}" placeholder="Nome de quem ocupa o cargo"></label>
      <label><span class="rot">Ato de nomeação</span><input id="ch-ato" class="campo" value="${esc(c.atoNomeacao)}" placeholder="ex.: Ato nº 1.234/2026, DOE de 10/03/2026"></label>
      <div class="g2"><label><span class="rot">Substituto</span><input id="ch-sub" class="campo" value="${esc(c.substituto)}"></label><label><span class="rot">Ato do substituto</span><input id="ch-atos" class="campo" value="${esc(c.atoSubstituto)}"></label></div>
      <label><span class="rot">Contato</span><input id="ch-cont" class="campo" value="${esc(c.contato)}"></label>
      <label><span class="rot">Observação</span><textarea id="ch-obs" class="campo">${esc(c.observacao)}</textarea></label>
      <p class="s" style="margin:0;font-size:12px;color:var(--mut)">O titular também passa a ser o responsável do setor no mapa.</p>`,
    aoConfirmar: async m => {
      const v = k => m.querySelector(k).value.trim(), o = { situacao:v('#ch-sit'), desde:v('#ch-desde'), titular:v('#ch-tit'), atoNomeacao:v('#ch-ato'), substituto:v('#ch-sub'), atoSubstituto:v('#ch-atos'), contato:v('#ch-cont'), observacao:v('#ch-obs') };
      if (o.situacao === 'Vago') o.titular = '';
      if (['Titular', 'Interino'].includes(o.situacao) && !o.titular) throw new Error('Informe o nome do titular ou mude a situação para Vago.');
      Object.assign(c, o, { setorId:s.id, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      if (!DB.chefias.includes(c)) { c.id = 'ch_' + s.id; DB.chefias.push(c); }
      enfileirar('chefias', c);
      const novoResp = o.situacao === 'Vago' ? '' : o.titular;
      if ((s.responsavel || '') !== novoResp) { const antes = s.responsavel; s.responsavel = novoResp; if (o.contato && !s.contato) s.contato = o.contato; s.atualizadoEm = agora(); s.atualizadoPor = cfg.usuario || ''; enfileirar('setores', s); registrar(s.id, `Chefia: ${antes || '(vago)'} → ${novoResp || '(vago)'} (${o.situacao})`); }
      renderChefias();
    } });
}
function exportarChefias(){
  const todas = setoresOficiais().filter(s => s.status !== 'Extinto' && CHEFIAS.includes(s.tipo));
  csvBaixar('gaborg-chefias', [['Unidade', 'Sigla', 'Tipo', 'Área', 'Símbolo', 'Titular', 'Situação', 'Desde', 'Ato de nomeação', 'Substituto', 'Ato do substituto', 'Contato', 'Alertas']].concat(todas.map(s => { const c = chefiaDe(s); return [s.nome, s.sigla, s.tipo, nomeCurto(porId.get(areaDe.get(s.id))), simboloChefia(s.id), c.titular, c.situacao, fmtDia(c.desde), c.atoNomeacao, c.substituto, c.atoSubstituto, c.contato, alertasChefia(s, c).map(a => a[1]).join('; ')]; })));
}

/* ===================== PACTO DE RESULTADOS ===================== */
let rsFil = { obj:'', area:'', st:'' };
const OBJETIVOS_PADRAO = ['Melhorar a aprendizagem dos estudantes', 'Reduzir o abandono e a evasão escolar', 'Ampliar a educação em tempo integral', 'Fortalecer a gestão escolar e regional', 'Garantir infraestrutura e condições adequadas nas escolas', 'Valorizar e formar os profissionais da educação', 'Aumentar a eficiência na gestão de recursos'];
const STATUS_META = { 'Não iniciada':'#94a3b8', 'No prazo':'#16a34a', 'Atenção':'#d97706', 'Atrasada':'#dc2626', 'Concluída':'#2563eb' };
const objetivosRS = () => { const o = param('objetivos', null); return Array.isArray(o) && o.length ? o : OBJETIVOS_PADRAO; };
function progressoMeta(m){ const b = numBR(m.linhaBase), alvo = numBR(m.meta), r = numBR(m.resultado); if (String(m.meta).trim() === '' || String(m.resultado).trim() === '' || alvo === b) return m.status === 'Concluída' ? 1 : null; return Math.max(0, Math.min(1, (r - b) / (alvo - b))); }
function situacaoMeta(m){ if (m.status === 'Concluída') return 'Concluída'; if (m.prazo && diasAte(m.prazo) < 0) return 'Atrasada'; return m.status || 'Não iniciada'; }
function renderResultados(){
  const el = $('#rs-corpo'); if (!el) return;
  const O = objetivosRS(), M = (DB.metas || []).filter(m => (!rsFil.obj || m.objetivo === rsFil.obj) && (!rsFil.area || areaDe.get(m.setorId) === rsFil.area) && (!rsFil.st || situacaoMeta(m) === rsFil.st));
  const todas = DB.metas || [], chef = setoresOficiais().filter(s => s.status !== 'Extinto' && CHEFIAS.includes(s.tipo) && (prof.get(s.id) || 0) <= 3 && s.tipo !== 'Núcleo Regional');
  const comMeta = new Set(todas.map(m => m.setorId)), semMeta = chef.filter(s => !comMeta.has(s.id)), objSem = O.filter(o => !todas.some(m => m.objetivo === o));
  const prs = todas.map(progressoMeta).filter(x => x !== null), med = prs.length ? Math.round(prs.reduce((a, b) => a + b, 0) / prs.length * 100) : 0;
  const atr = todas.filter(m => situacaoMeta(m) === 'Atrasada');
  const barra = p => p === null ? '<span style="color:var(--mut2)">—</span>' : `<span class="im-prog" style="width:90px;display:inline-block;vertical-align:middle"><i style="width:${Math.round(p * 100)}%;background:${p >= 1 ? '#2563eb' : p >= .6 ? '#16a34a' : p >= .3 ? '#d97706' : '#dc2626'}"></i></span> ${Math.round(p * 100)}%`;
  const porObj = O.map(o => { const l = todas.filter(m => m.objetivo === o), p = l.map(progressoMeta).filter(x => x !== null); return { o, n:l.length, set:new Set(l.map(m => m.setorId)).size, p:p.length ? p.reduce((a, b) => a + b, 0) / p.length : null, atr:l.filter(m => situacaoMeta(m) === 'Atrasada').length }; });
  el.innerHTML = avisoGestao() + `<div class="kpis">${kpiG('#be185d', 'fa-bullseye', 'Metas', fmtN(todas.length), `${comMeta.size} setores com meta`)}${kpiG('#16a34a', 'fa-gauge', 'Atingimento médio', prs.length ? med + '%' : '—', 'resultado atual em relação à meta')}${kpiG('#dc2626', 'fa-hourglass-end', 'Atrasadas', fmtN(atr.length), 'prazo vencido e não concluídas', "rsFil.st='Atrasada';renderResultados()")}${kpiG('#7c3aed', 'fa-sitemap', 'Chefias sem meta', fmtN(semMeta.length), `de ${chef.length} chefias dos 3 primeiros níveis`)}${kpiG('#d97706', 'fa-flag', 'Objetivos sem meta', fmtN(objSem.length), `de ${O.length} objetivos estratégicos`)}</div>
    <div class="cartao bl" style="--c:#be185d"><h3><i class="fa-solid fa-flag"></i>Objetivos estratégicos ${podeGestao() ? '<button class="btn btn-g btn-sm" style="margin-left:auto" onclick="formObjetivos()"><i class="fa-solid fa-pen"></i>Editar objetivos</button>' : ''}</h3><p class="s">Cada meta de setor se liga a um objetivo. Clique num objetivo para filtrar.</p>
      <div class="rs-objs">${porObj.map(x => `<button class="rs-obj ${rsFil.obj === x.o ? 'on' : ''} ${x.n ? '' : 'vz'}" onclick="rsFil.obj=rsFil.obj===${arg(x.o)}?'':${arg(x.o)};renderResultados()"><b>${esc(x.o)}</b><span>${x.n} meta(s) · ${x.set} setor(es)${x.atr ? ` · <em>${x.atr} atrasada(s)</em>` : ''}</span>${barra(x.p)}</button>`).join('')}</div></div>
    <div class="filtros"><select class="campo" onchange="rsFil.area=this.value;renderResultados()"><option value="">Todas as áreas</option>${areas.map(a => `<option value="${esc(a)}" ${a === rsFil.area ? 'selected' : ''}>${esc(nomeCurto(porId.get(a)))}</option>`).join('')}</select>
      <select class="campo" onchange="rsFil.st=this.value;renderResultados()"><option value="">Todas as situações</option>${Object.keys(STATUS_META).map(k => `<option ${k === rsFil.st ? 'selected' : ''}>${k}</option>`).join('')}</select>
      ${rsFil.obj || rsFil.area || rsFil.st ? `<button class="btn btn-g btn-sm" onclick="rsFil={obj:'',area:'',st:''};renderResultados()">limpar filtros</button>` : ''}
      ${podeGestao() ? '<button class="btn btn-p btn-sm" onclick="formMeta(\'\')"><i class="fa-solid fa-plus"></i>Nova meta</button>' : ''}<button class="btn btn-s btn-sm" onclick="exportarMetas()"><i class="fa-solid fa-file-csv"></i>Exportar</button></div>
    <div class="tab-wrap"><table class="tab"><thead><tr><th>Meta</th><th>Setor</th><th>Objetivo</th><th>Base → Meta</th><th>Resultado</th><th>Atingimento</th><th>Prazo</th><th>Situação</th></tr></thead><tbody>
    ${M.slice().sort((a, b) => O.indexOf(a.objetivo) - O.indexOf(b.objetivo) || String(a.prazo).localeCompare(String(b.prazo))).map(m => { const st = situacaoMeta(m); return `<tr onclick="formMeta(${arg(m.id)})"><td class="nm" style="white-space:normal"><b>${esc(m.titulo)}</b>${m.indicador ? `<small style="display:block;color:var(--mut)">${esc(m.indicador)}</small>` : ''}</td><td>${esc(nomeCurto(porId.get(m.setorId)))}</td><td style="white-space:normal;max-width:220px"><small>${esc(m.objetivo)}</small></td>
      <td>${esc(m.linhaBase || '—')} → <b>${esc(m.meta || '—')}</b> ${esc(m.unidade)}</td><td>${esc(m.resultado || '—')} ${m.resultado ? esc(m.unidade) : ''}</td><td>${barra(progressoMeta(m))}</td><td>${fmtDia(m.prazo)}</td><td>${chipG(st, STATUS_META[st] || '#94a3b8')}</td></tr>`; }).join('') || `<tr><td colspan="8" class="vazio">${todas.length ? 'Nenhuma meta com esses filtros.' : 'Nenhuma meta cadastrada. Cadastre as metas pactuadas com cada setor e ligue-as a um objetivo estratégico.'}</td></tr>`}</tbody></table></div>
    ${semMeta.length ? `<div class="cartao bl" style="--c:#7c3aed;margin-top:14px"><h3><i class="fa-solid fa-sitemap"></i>Chefias sem meta pactuada <span class="ct">${semMeta.length}</span></h3><p class="s">Setores dos três primeiros níveis que ainda não têm meta. Sem meta, a discussão sobre a estrutura fica só pelo tamanho.</p><div class="pend">${semMeta.slice(0, 40).map(s => `<button onclick="${podeGestao() ? `formMeta('',${arg(s.id)})` : `irPara(${arg(s.id)})`}"><i class="fa-solid ${icTipo(s.tipo)}" style="color:${corTipo(s.tipo)}"></i><span>${esc(s.nome)}</span><small>${podeGestao() ? '+ meta' : ''}</small></button>`).join('')}</div></div>` : ''}`;
}
function formObjetivos(){
  abrirModal({ titulo:'Objetivos estratégicos', rotulo:'Salvar', largura:560, html:`<p style="margin-top:0">Um objetivo por linha. Use os objetivos do planejamento estratégico da SEDUC (PPA, plano estadual de educação). Os iniciais são só sugestões.</p><textarea id="ob-t" class="campo" style="min-height:220px">${esc(objetivosRS().join('\n'))}</textarea>`,
    aoConfirmar: async m => { const l = m.querySelector('#ob-t').value.split('\n').map(x => x.trim()).filter(Boolean); if (!l.length) throw new Error('Informe ao menos um objetivo.'); salvarParam('objetivos', l); renderResultados(); } });
}
function formMeta(id, setorPadrao){
  if (!podeGestao()) return toast('Seu perfil é somente leitura.', 'aviso');
  const m0 = DB.metas.find(x => x.id === id) || novoReg('metas', { setorId:setorPadrao || '', objetivo:rsFil.obj || objetivosRS()[0], status:'Não iniciada' });
  abrirModal({ titulo:id ? 'Editar meta' : 'Nova meta', rotulo:'Salvar', largura:600,
    html:`<label><span class="rot">Meta</span><input id="mt-t" class="campo" required value="${esc(m0.titulo)}" placeholder="ex.: Reduzir o tempo médio de lotação de professores"></label>
      <div class="g2"><label><span class="rot">Setor responsável</span><select id="mt-s" class="campo" required><option value="">Escolha</option>${opcoesSetoresFin(m0.setorId)}</select></label><label><span class="rot">Objetivo estratégico</span><select id="mt-o" class="campo">${objetivosRS().map(o => `<option ${o === m0.objetivo ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label></div>
      <label><span class="rot">Indicador <small>como é medido</small></span><input id="mt-i" class="campo" value="${esc(m0.indicador)}" placeholder="ex.: dias entre a vaga e a lotação"></label>
      <div class="g2"><label><span class="rot">Linha de base</span><input id="mt-b" class="campo" value="${esc(m0.linhaBase)}" inputmode="decimal"></label><label><span class="rot">Valor da meta</span><input id="mt-m" class="campo" value="${esc(m0.meta)}" inputmode="decimal"></label></div>
      <div class="g2"><label><span class="rot">Resultado atual</span><input id="mt-r" class="campo" value="${esc(m0.resultado)}" inputmode="decimal"></label><label><span class="rot">Unidade</span><input id="mt-u" class="campo" value="${esc(m0.unidade)}" placeholder="%, dias, escolas..."></label></div>
      <div class="g2"><label><span class="rot">Prazo</span><input id="mt-p" type="date" class="campo" value="${esc(m0.prazo)}"></label><label><span class="rot">Situação</span><select id="mt-st" class="campo">${Object.keys(STATUS_META).map(k => `<option ${k === m0.status ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
      <label><span class="rot">Observação</span><textarea id="mt-ob" class="campo">${esc(m0.observacao)}</textarea></label>`,
    aoConfirmar: async m => {
      const v = k => m.querySelector(k).value.trim(), o = { titulo:v('#mt-t'), setorId:v('#mt-s'), objetivo:v('#mt-o'), indicador:v('#mt-i'), linhaBase:v('#mt-b'), meta:v('#mt-m'), resultado:v('#mt-r'), unidade:v('#mt-u'), prazo:v('#mt-p'), status:v('#mt-st'), observacao:v('#mt-ob') };
      if (!o.titulo || !o.setorId) throw new Error('Informe a meta e o setor responsável.');
      Object.assign(m0, o, { atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      if (!DB.metas.includes(m0)) { m0.id = novoId('mt'); DB.metas.push(m0); }
      enfileirar('metas', m0); renderResultados();
    } }).then(ok => { if (!ok || !id) return; });
}
function exportarMetas(){ csvBaixar('gaborg-metas', [['Objetivo', 'Meta', 'Indicador', 'Setor', 'Linha de base', 'Meta', 'Resultado', 'Unidade', 'Atingimento %', 'Prazo', 'Situação', 'Observação']].concat((DB.metas || []).map(m => { const p = progressoMeta(m); return [m.objetivo, m.titulo, m.indicador, nomeSetor(m.setorId), m.linhaBase, m.meta, m.resultado, m.unidade, p === null ? '' : Math.round(p * 100), fmtDia(m.prazo), situacaoMeta(m), m.observacao]; }))); }

/* ===================== GESTÃO REGIONAL (DREs) ===================== */
const REG_PADRAO = { custoKm:'1.20', visitas:'4' };
function dadosRegionais(){
  const X = distanciasMT(), E = escolasLista(), pr = Object.assign({}, REG_PADRAO, param('regional', {})), ck = numBR(pr.custoKm), vis = numBR(pr.visitas);
  return X.dres.map(d => {
    const s = setorDaDRE(d), equipe = s ? [s, ...[...descendentes(s.id)].map(i => porId.get(i)).filter(x => x && x.status !== 'Extinto')] : [];
    const l = X.lista.filter(o => o.e.dre === d), ser = equipe.reduce((t, x) => t + num(x.servidores), 0), km = l.reduce((t, o) => t + o.km, 0);
    const circuito = km * 2 * FATOR_ESTRADA, mun = new Set(l.map(o => o.e.municipio));
    // possível polo: município distante cujo entorno (80 km) concentra escolas da mesma DRE
    let polo = null; [...mun].forEach(m => { const lm = l.filter(o => o.e.municipio === m); const dm = lm.reduce((t, o) => t + o.km, 0) / lm.length; if (dm < 150) return;
      const c = [lm.reduce((t, o) => t + o.e.latitude, 0) / lm.length, lm.reduce((t, o) => t + o.e.longitude, 0) / lm.length], viz = l.filter(o => kmEntre(c, [o.e.latitude, o.e.longitude]) <= 80);
      if (viz.length >= 5 && (!polo || viz.length > polo.n)) polo = { m, n:viz.length, km:dm, mun:new Set(viz.map(o => o.e.municipio)).size }; });
    return { d, s, equipe, ser, chef:equipe.filter(x => CHEFIAS.includes(x.tipo)).length, n:l.length, mun:mun.size, rur:l.filter(o => o.e.localidade === 'RURAL').length, med:l.length ? km / l.length : 0, max:l.reduce((a, o) => o.km > a.km ? o : a, l[0] || { km:0 }), circuito, custo:circuito * ck * vis, horas:circuito / VEL_MEDIA * vis, outra:l.filter(o => o.prox && o.km - o.prox.km >= 40 && o.prox.km < o.km * .7), polo, escSer:ser ? l.length / ser : null };
  });
}
function renderRegional(){
  const el = $('#rg-corpo'); if (!el) return;
  const R = dadosRegionais(), dres = R.map(x => x.d), pr = Object.assign({}, REG_PADRAO, param('regional', {}));
  if (!R.length) { el.innerHTML = '<div class="cartao vazio">Sem base de escolas.</div>'; return; }
  const tot = R.reduce((t, x) => t + x.n, 0), totSer = R.reduce((t, x) => t + x.ser, 0), totCusto = R.reduce((t, x) => t + x.custo, 0), medN = tot / R.length;
  const comSer = R.filter(x => x.escSer !== null), medEsc = comSer.length ? comSer.map(x => x.escSer).sort((a, b) => a - b)[Math.floor(comSer.length / 2)] : null;
  const sug = [];
  R.forEach(x => {
    if (x.escSer !== null && medEsc && x.escSer > medEsc * 1.5) sug.push(['#dc2626', 'fa-user-plus', `<b>${esc(nomeDRE(x.d))}</b>: ${x.escSer.toLocaleString('pt-BR', { maximumFractionDigits:1 })} escolas por servidor, contra ${medEsc.toLocaleString('pt-BR', { maximumFractionDigits:1 })} na mediana das DREs. Avaliar reforço da equipe.`]);
    else if (x.escSer === null && x.n > medN * 1.3) sug.push(['#d97706', 'fa-users', `<b>${esc(nomeDRE(x.d))}</b> atende ${x.n} escolas (${(x.n / medN).toLocaleString('pt-BR', { maximumFractionDigits:1 })}× a média). Informe os servidores da DRE para medir a carga por pessoa.`]);
    if (x.polo) sug.push(['#7c3aed', 'fa-location-dot', `<b>${esc(nomeDRE(x.d))}</b>: avaliar um polo de apoio em <b>${esc(x.polo.m)}</b>. O município fica a ~${fmtKm(x.polo.km)} da sede e, num raio de 80 km, há ${x.polo.n} escolas da DRE em ${x.polo.mun} município(s).`]);
    if (x.outra.length >= 2) { const para = {}; x.outra.forEach(o => { para[o.prox.dre] = (para[o.prox.dre] || 0) + 1; }); sug.push(['#0891b2', 'fa-shuffle', `<b>${esc(nomeDRE(x.d))}</b>: ${x.outra.length} escola(s) ficam bem mais perto de outra sede (${Object.entries(para).map(([dd, n]) => `${n} da ${esc(nomeDRE(dd))}`).join(', ')}). Avaliar acompanhamento compartilhado ou nova subordinação.`]); }
  });
  const semR = R.filter(x => x.s && !x.s.responsavel); if (semR.length) sug.push(['#64748b', 'fa-user-xmark', `${semR.length === R.length ? 'Nenhuma DRE tem' : semR.length + ' DRE(s) sem'} responsável indicado${semR.length === R.length ? '' : ': ' + semR.map(x => '<b>' + esc(nomeDRE(x.d)) + '</b>').join(', ')}. Registre os titulares na seção <b>Chefias</b>.`]);
  const mxC = Math.max(...R.map(x => x.custo)), cardsOrd = R.slice().sort((a, b) => b.n - a.n);
  el.innerHTML = avisoGestao() + `<div class="kpis">${kpiG('#16a34a', 'fa-school', 'Escolas', fmtN(tot), `${R.length} DREs · média de ${Math.round(medN)} por DRE`)}${kpiG('#0891b2', 'fa-users', 'Servidores nas DREs', totSer ? fmtN(totSer) : '—', totSer ? `${(tot / totSer).toLocaleString('pt-BR', { maximumFractionDigits:1 })} escolas por servidor` : 'informe no campo Servidores das DREs')}${kpiG('#f97316', 'fa-road', 'Circuito anual estimado', fmtN(Math.round(R.reduce((t, x) => t + x.circuito, 0) * numBR(pr.visitas))) + ' km', `${pr.visitas} visita(s) por escola no ano`)}${kpiG('#dc2626', 'fa-gas-pump', 'Custo de deslocamento', fmtRc(totCusto), `a R$ ${String(pr.custoKm).replace('.', ',')}/km, por ano`)}${kpiG('#7c3aed', 'fa-lightbulb', 'Sugestões', fmtN(sug.length), 'reforço, polos e redistribuição')}</div>
    <div class="cartao bl" style="--c:#f97316"><h3><i class="fa-solid fa-sliders"></i>Parâmetros de deslocamento</h3><p class="s">Usados para estimar o custo de acompanhamento das escolas. As distâncias por estrada são estimadas (1,3 × linha reta).</p>
      <div class="g-metas" style="grid-template-columns:repeat(auto-fit,minmax(200px,260px))"><label><span class="rot">Custo por km rodado (R$) <small>combustível, veículo, manutenção</small></span><input id="rg-ck" class="campo" type="number" step="0.01" min="0" value="${esc(pr.custoKm)}" ${podeGestao() ? '' : 'disabled'}></label><label><span class="rot">Visitas por escola no ano</span><input id="rg-vis" class="campo" type="number" step="1" min="0" value="${esc(pr.visitas)}" ${podeGestao() ? '' : 'disabled'}></label>
      ${podeGestao() ? `<div style="align-self:end"><button class="btn btn-p btn-sm" onclick="salvarParam('regional',{custoKm:$('#rg-ck').value,visitas:$('#rg-vis').value});renderRegional()"><i class="fa-solid fa-floppy-disk"></i>Aplicar</button></div>` : ''}</div></div>
    ${sug.length ? `<div class="cartao bl" style="--c:#7c3aed"><h3><i class="fa-solid fa-lightbulb"></i>Sugestões para a rede regional</h3><p class="s">Pontos para discutir; confira com a equipe da DRE antes de decidir</p><div class="pend re-sug">${sug.map(([c, ic, t]) => `<div class="it"><i class="fa-solid ${ic}" style="color:${c}"></i><span>${t}</span></div>`).join('')}</div></div>` : ''}
    <div class="rg-cards">${cardsOrd.map(x => `<div class="cartao rg-card" style="--c:${corDRE(dres, x.d)}"><div class="h"><span class="pt"></span><b>${esc(nomeDRE(x.d))}</b>${x.s && x.s.responsavel ? `<small>${esc(x.s.responsavel)}</small>` : '<small class="sem">sem responsável</small>'}</div>
      <div class="nums"><div><b>${x.n}</b>escolas</div><div><b>${x.mun}</b>municípios</div><div><b>${x.ser || '—'}</b>servidores</div><div><b>${x.escSer !== null ? x.escSer.toLocaleString('pt-BR', { maximumFractionDigits:1 }) : '—'}</b>escolas/servidor</div></div>
      <div class="lin"><span>Distância média</span><b style="color:${faixaDist(x.med)[2]}">${fmtKm(x.med)}</b></div><div class="lin"><span>Escola mais distante</span><b>${fmtKm(x.max.km)}</b></div><div class="lin"><span>Rurais</span><b>${x.rur} (${pct(x.rur, x.n)}%)</b></div>
      <div class="lin"><span>Deslocamento/ano</span><b>${fmtRc(x.custo)}</b></div><span class="im-prog"><i style="width:${mxC ? x.custo / mxC * 100 : 0}%;background:${corDRE(dres, x.d)}"></i></span>
      <div class="acoes"><button class="btn btn-s btn-sm" onclick="trocarVista('escolas');setTimeout(()=>{modoMT('distancia');focarDREmt(${dres.indexOf(x.d)})},400)"><i class="fa-solid fa-map-location-dot"></i>Mapa</button>${x.s ? `<button class="btn btn-s btn-sm" onclick="trocarVista('mapa');setTimeout(()=>irPara(${arg(x.s.id)}),60)"><i class="fa-solid fa-sitemap"></i>Estrutura</button>` : ''}<button class="btn btn-g btn-sm" onclick="trocarVista('painel');abaInd('dist');indDistDRE=${arg(x.d)};renderPainelInd()"><i class="fa-solid fa-route"></i>Distâncias</button></div></div>`).join('')}</div>
    <div class="cartao bl" style="--c:#0e7490;margin-top:14px"><h3><i class="fa-solid fa-table"></i>Quadro regional</h3><div class="tab-wrap"><table class="tab ind-heat"><thead><tr><th>DRE</th><th>Escolas</th><th>Municípios</th><th>Servidores</th><th>Chefias</th><th>Escolas/servidor</th><th>Dist. média</th><th>Circuito (km)</th><th>Horas/ano</th><th>Custo/ano</th><th>Mais perto de outra</th></tr></thead><tbody>
      ${R.slice().sort((a, b) => b.custo - a.custo).map(x => `<tr onclick="trocarVista('escolas');setTimeout(()=>focarDREmt(${dres.indexOf(x.d)}),400)"><td class="nm"><span class="pt" style="background:${corDRE(dres, x.d)}"></span>${esc(nomeDRE(x.d))}</td><td>${x.n}</td><td>${x.mun}</td><td>${x.ser || '—'}</td><td>${x.chef}</td><td>${x.escSer !== null ? x.escSer.toLocaleString('pt-BR', { maximumFractionDigits:1 }) : '—'}</td><td>${fmtKm(x.med)}</td><td>${fmtN(Math.round(x.circuito))}</td><td>${fmtN(Math.round(x.horas))}</td><td style="background:linear-gradient(90deg,color-mix(in srgb,#f97316 22%,transparent) ${mxC ? x.custo / mxC * 100 : 0}%,transparent 0)"><b>${fmtRc(x.custo)}</b></td><td>${x.outra.length || '—'}</td></tr>`).join('')}</tbody></table></div></div>`;
}

/* ===================== REUNIÕES: PAUTA, APRESENTAÇÃO E DECISÕES ===================== */
let ruSel = '', ap = null;
const DECISOES = { '':'#94a3b8', 'Aprovado':'#16a34a', 'Aprovado com ajustes':'#0891b2', 'Adiado':'#d97706', 'Rejeitado':'#dc2626', 'Apenas informe':'#64748b' };
const TIPOS_ITEM = { estrutura:['fa-gauge-high', 'Situação da estrutura'], proposta:['fa-lightbulb', 'Proposta'], implantacao:['fa-list-check', 'Andamento da implantação'], chefias:['fa-user-tie', 'Chefias vagas e interinas'], regional:['fa-map-location-dot', 'Gestão regional'], resultados:['fa-bullseye', 'Pacto de resultados'], livre:['fa-comment', 'Assunto'] };
const itensReu = r => { try { const a = JSON.parse(r.itens || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
function gravarReu(r, itens){ if (itens) r.itens = JSON.stringify(itens); r.atualizadoEm = agora(); r.atualizadoPor = cfg.usuario || ''; enfileirar('reunioes', r); }
const tituloItem = it => it.tipo === 'proposta' ? 'Proposta: ' + (((DB.propostas || []).find(p => p.id === it.ref) || {}).nome || it.titulo || '(removida)') : it.titulo || TIPOS_ITEM[it.tipo][1];
function renderReunioes(){
  const el = $('#ru-corpo'); if (!el) return;
  const R = (DB.reunioes || []).slice().sort((a, b) => String(b.data).localeCompare(String(a.data)));
  const r = R.find(x => x.id === ruSel);
  const enc = []; R.forEach(x => itensReu(x).forEach(it => { if (it.encaminhamento && !it.feito) enc.push({ r:x, it }); }));
  enc.sort((a, b) => String(a.it.prazo || '9999').localeCompare(String(b.it.prazo || '9999')));
  const lista = `<div class="ru-lista">${podeGestao() ? '<button class="btn btn-p" onclick="formReuniao(\'\')" style="width:100%;justify-content:center"><i class="fa-solid fa-plus"></i>Nova reunião</button>' : ''}
    ${R.map(x => { const it = itensReu(x), dec = it.filter(i => i.decisao).length; return `<button class="ru-it ${x.id === ruSel ? 'on' : ''}" onclick="ruSel=${arg(x.id)};renderReunioes()"><b>${esc(x.titulo)}</b><small>${fmtData(x.data)}</small><span>${chipG(esc(x.status || 'Planejada'), x.status === 'Realizada' ? '#16a34a' : x.status === 'Cancelada' ? '#94a3b8' : '#2563eb')} ${it.length} item(ns) · ${dec} decisão(ões)</span></button>`; }).join('') || '<div class="vazio">Nenhuma reunião ainda.</div>'}</div>`;
  let det = '';
  if (r) { const it = itensReu(r);
    det = `<div class="cartao bl" style="--c:#6d28d9"><div class="ru-cab"><div><h3 style="margin:0"><i class="fa-solid fa-people-group"></i>${esc(r.titulo)}</h3><p class="s" style="margin:4px 0 0">${fmtData(r.data)}${r.participantes ? ' · ' + esc(r.participantes) : ''}</p></div>
      <div class="acoes" style="flex-wrap:wrap"><button class="btn btn-p btn-sm" onclick="apresentarReuniao(${arg(r.id)})" ${it.length ? '' : 'disabled'}><i class="fa-solid fa-display"></i>Apresentar</button><button class="btn btn-s btn-sm" onclick="exportarAta(${arg(r.id)},'word')"><i class="fa-solid fa-file-word"></i>Ata (Word)</button><button class="btn btn-s btn-sm" onclick="exportarAta(${arg(r.id)},'print')"><i class="fa-solid fa-print"></i>Imprimir</button>
      ${podeGestao() ? `<button class="btn btn-g btn-sm" onclick="formReuniao(${arg(r.id)})"><i class="fa-solid fa-pen"></i>Editar</button>${r.status !== 'Realizada' ? `<button class="btn btn-g btn-sm" onclick="statusReu(${arg(r.id)},'Realizada')"><i class="fa-solid fa-check"></i>Marcar como realizada</button>` : ''}<button class="btn btn-g btn-sm" onclick="excluirReuniao(${arg(r.id)})"><i class="fa-solid fa-trash"></i></button>` : ''}</div></div>
      <div class="ru-itens">${it.map((x, i) => `<div class="ru-item"><span class="n">${i + 1}</span><div class="t"><b><i class="fa-solid ${TIPOS_ITEM[x.tipo] ? TIPOS_ITEM[x.tipo][0] : 'fa-comment'}"></i>${esc(tituloItem(x))}</b>${x.notas ? `<small>${esc(x.notas)}</small>` : ''}
        ${x.decisao || x.encaminhamento ? `<div class="dec">${x.decisao ? chipG(esc(x.decisao), DECISOES[x.decisao]) : ''}${x.encaminhamento ? ` <span>${esc(x.encaminhamento)}</span>` : ''}${x.responsavel ? ` <small>· ${esc(x.responsavel)}</small>` : ''}${x.prazo ? ` <small>· até ${fmtDia(x.prazo)}</small>` : ''}</div>` : ''}</div>
        ${podeGestao() ? `<div class="b"><button class="btn btn-g btn-sm btn-i" title="Subir" onclick="moverItemReu(${arg(r.id)},${i},-1)" ${i ? '' : 'disabled'}><i class="fa-solid fa-arrow-up"></i></button><button class="btn btn-g btn-sm btn-i" title="Descer" onclick="moverItemReu(${arg(r.id)},${i},1)" ${i < it.length - 1 ? '' : 'disabled'}><i class="fa-solid fa-arrow-down"></i></button><button class="btn btn-g btn-sm btn-i" title="Decisão" onclick="formDecisao(${arg(r.id)},${i})"><i class="fa-solid fa-gavel"></i></button><button class="btn btn-g btn-sm btn-i" title="Remover" onclick="removerItemReu(${arg(r.id)},${i})"><i class="fa-solid fa-xmark"></i></button></div>` : ''}</div>`).join('') || '<div class="vazio">Pauta vazia.</div>'}</div>
      ${podeGestao() ? `<div class="ru-add"><select id="ru-tipo" class="campo" onchange="$('#ru-ref').style.display=this.value==='proposta'?'':'none';$('#ru-tit').style.display=this.value==='livre'?'':'none'">${Object.entries(TIPOS_ITEM).map(([k, [, n]]) => `<option value="${k}">${n}</option>`).join('')}</select><select id="ru-ref" class="campo" style="display:none">${(DB.propostas || []).map(p => `<option value="${esc(p.id)}">${esc(p.nome)}</option>`).join('')}</select><input id="ru-tit" class="campo" style="display:none" placeholder="Assunto"><button class="btn btn-s btn-sm" onclick="addItemReu(${arg(r.id)})"><i class="fa-solid fa-plus"></i>Incluir na pauta</button></div>` : ''}</div>`;
  } else det = `<div class="cartao vazio" style="padding:40px"><i class="fa-solid fa-people-group"></i>${R.length ? 'Escolha uma reunião ao lado.' : 'Crie uma reunião: o sistema monta a pauta com a situação da estrutura, as propostas em discussão, a implantação, as chefias e a gestão regional.'}<br><span style="font-size:12.5px">Na apresentação, cada assunto vira uma tela, e a decisão e o encaminhamento ficam registrados ali mesmo.</span></div>`;
  el.innerHTML = avisoGestao() + `<div class="ru-grade">${lista}<div>${det}
    <div class="cartao bl" style="--c:#d97706;margin-top:14px"><h3><i class="fa-solid fa-arrow-right-to-bracket"></i>Encaminhamentos em aberto <span class="ct">${enc.length}</span></h3><p class="s">Decisões que pedem uma ação, de todas as reuniões. Marque quando estiver feito.</p>
      <div class="pend">${enc.slice(0, 40).map(({ r: x, it }) => { const d = it.prazo ? diasAte(it.prazo) : null; return `<div class="it"><input type="checkbox" ${podeGestao() ? '' : 'disabled'} onchange="feitoEnc(${arg(x.id)},${arg(it.id)},this.checked)" title="Feito"><span><b>${esc(it.encaminhamento)}</b><small style="display:block;color:var(--mut)">${esc(tituloItem(it))} · ${esc(x.titulo)}${it.responsavel ? ' · ' + esc(it.responsavel) : ''}</small></span>${it.prazo ? chipG(d < 0 ? `atrasado ${-d}d` : fmtDia(it.prazo), d < 0 ? '#dc2626' : d <= 7 ? '#d97706' : '#64748b') : ''}</div>`; }).join('') || '<div class="vazio">Nenhum encaminhamento em aberto.</div>'}</div></div></div></div>`;
}
function formReuniao(id){
  if (!podeGestao()) return;
  const r = (DB.reunioes || []).find(x => x.id === id), d = new Date(); d.setMinutes(0); d.setHours(d.getHours() + 1);
  const dl = r ? String(r.data).slice(0, 16) : new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  const P = (DB.propostas || []).filter(p => p.status !== 'Arquivada');
  abrirModal({ titulo:r ? 'Editar reunião' : 'Nova reunião', rotulo:r ? 'Salvar' : 'Criar reunião', largura:580,
    html:`<label><span class="rot">Título</span><input id="ru-t" class="campo" required value="${esc(r ? r.titulo : 'Reunião de estrutura organizacional')}"></label>
      <div class="g2"><label><span class="rot">Data e hora</span><input id="ru-d" type="datetime-local" class="campo" value="${esc(dl)}"></label><label><span class="rot">Situação</span><select id="ru-s" class="campo">${['Planejada', 'Realizada', 'Cancelada'].map(k => `<option ${r && r.status === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label></div>
      <label><span class="rot">Participantes</span><input id="ru-p" class="campo" value="${esc(r ? r.participantes : '')}" placeholder="ex.: Secretária, adjuntos, assessoria"></label>
      ${r ? '' : `<span class="rot" style="margin-top:6px">Pauta inicial</span><div class="ru-chk">${['estrutura', 'implantacao', 'chefias', 'regional', 'resultados'].map(k => `<label class="lg-lembrar"><input type="checkbox" data-pauta="${k}" ${['estrutura', 'implantacao'].includes(k) ? 'checked' : ''}>${TIPOS_ITEM[k][1]}</label>`).join('')}
        ${P.map(p => `<label class="lg-lembrar"><input type="checkbox" data-prop="${esc(p.id)}" checked>Proposta: ${esc(p.nome)}</label>`).join('')}</div>`}`,
    aoConfirmar: async m => {
      const v = k => m.querySelector(k).value.trim(), o = { titulo:v('#ru-t'), data:v('#ru-d'), status:v('#ru-s'), participantes:v('#ru-p') };
      if (!o.titulo) throw new Error('Dê um título à reunião.');
      if (r) { Object.assign(r, o); gravarReu(r); }
      else { const it = []; m.querySelectorAll('[data-pauta]:checked').forEach(c => it.push({ id:novoId('it'), tipo:c.dataset.pauta })); m.querySelectorAll('[data-prop]:checked').forEach(c => it.splice(1, 0, { id:novoId('it'), tipo:'proposta', ref:c.dataset.prop }));
        const n = novoReg('reunioes', Object.assign({ id:novoId('ru'), criadoEm:agora(), criadoPor:cfg.usuario || '' }, o)); DB.reunioes.push(n); gravarReu(n, it); ruSel = n.id; }
      renderReunioes();
    } });
}
function statusReu(id, st){ const r = DB.reunioes.find(x => x.id === id); if (!r) return; r.status = st; gravarReu(r); renderReunioes(); }
async function excluirReuniao(id){ const r = DB.reunioes.find(x => x.id === id); if (!r || !await confirmar('Excluir reunião', `Excluir "<b>${esc(r.titulo)}</b>" com a pauta e as decisões?`, 'Excluir', true)) return; DB.reunioes = DB.reunioes.filter(x => x !== r); enfileirar('reunioes', r, true); ruSel = ''; renderReunioes(); }
function addItemReu(id){ const r = DB.reunioes.find(x => x.id === id), it = itensReu(r), t = $('#ru-tipo').value, o = { id:novoId('it'), tipo:t }; if (t === 'proposta') { o.ref = $('#ru-ref').value; if (!o.ref) return toast('Não há propostas.', 'aviso'); } if (t === 'livre') { o.titulo = $('#ru-tit').value.trim(); if (!o.titulo) return toast('Escreva o assunto.', 'aviso'); } it.push(o); gravarReu(r, it); renderReunioes(); }
function moverItemReu(id, i, d){ const r = DB.reunioes.find(x => x.id === id), it = itensReu(r); if (!it[i + d]) return; [it[i], it[i + d]] = [it[i + d], it[i]]; gravarReu(r, it); renderReunioes(); }
function removerItemReu(id, i){ const r = DB.reunioes.find(x => x.id === id), it = itensReu(r); it.splice(i, 1); gravarReu(r, it); renderReunioes(); }
function feitoEnc(rid, iid, v){ const r = DB.reunioes.find(x => x.id === rid), it = itensReu(r), x = it.find(y => y.id === iid); if (!x) return; x.feito = v; gravarReu(r, it); setTimeout(renderReunioes, 250); }
function formDecisao(rid, i){
  const r = DB.reunioes.find(x => x.id === rid), it = itensReu(r), x = it[i];
  abrirModal({ titulo:tituloItem(x), rotulo:'Registrar', largura:560, html:camposDecisao(x, 'fd'),
    aoConfirmar: async m => { lerDecisao(m, 'fd', x); gravarReu(r, it); renderReunioes(); } });
}
const camposDecisao = (x, p) => `<label><span class="rot">Notas</span><textarea id="${p}-n" class="campo" placeholder="Pontos levantados na discussão">${esc(x.notas || '')}</textarea></label>
  <label><span class="rot">Decisão</span><select id="${p}-d" class="campo">${Object.keys(DECISOES).map(k => `<option value="${k}" ${k === (x.decisao || '') ? 'selected' : ''}>${k || '— sem decisão —'}</option>`).join('')}</select></label>
  <label><span class="rot">Encaminhamento <small>o que será feito</small></span><input id="${p}-e" class="campo" value="${esc(x.encaminhamento || '')}"></label>
  <div class="g2"><label><span class="rot">Responsável</span><input id="${p}-r" class="campo" value="${esc(x.responsavel || '')}"></label><label><span class="rot">Prazo</span><input id="${p}-p" type="date" class="campo" value="${esc(x.prazo || '')}"></label></div>`;
function lerDecisao(m, p, x){ const v = k => m.querySelector('#' + p + '-' + k).value.trim(); Object.assign(x, { notas:v('n'), decisao:v('d'), encaminhamento:v('e'), responsavel:v('r'), prazo:v('p') }); }
/* conteúdo de cada tela da apresentação */
function telaItem(x){
  const kp = (c, r, v, s) => `<div class="ap-k" style="--c:${c}"><small>${r}</small><b>${v}</b>${s ? `<span>${s}</span>` : ''}</div>`;
  if (x.tipo === 'estrutura') { const D = dadosInd(''), ins = insightsInd(D, ''), cad = D.base.length ? Math.round(D.base.reduce((t, s) => t + cadSetor(s), 0) / D.base.length * 100) : 0;
    return `<div class="ap-ks">${kp('#1e3a8a', 'Setores ativos', fmtN(D.base.length), D.chefias.length + ' chefias')}${kp('#16a34a', 'Unidades escolares', fmtN(D.E.length), D.dres.length + ' DREs')}${kp('#7c3aed', 'Cadastro completo', cad + '%', '')}${kp('#dc2626', 'Setores em risco', fmtN(D.base.filter(emRisco).length), 'impacto alto sem validação ou responsável')}${kp('#2563eb', 'Custo anual', D.custo.Atual.a ? fmtRc(D.custo.Atual.a) : '—', '')}</div>
      <ul class="ap-l">${ins.filter(i => i[0] !== 'ok').slice(0, 6).map(([t, h]) => `<li class="${t}">${h}</li>`).join('')}</ul>`; }
  if (x.tipo === 'proposta') { const p = (DB.propostas || []).find(q => q.id === x.ref); if (!p) return '<p>Proposta removida.</p>';
    const X = diffCenarios('', p.id), c = t => X.est.filter(e => e.tipo === t), d = X.aB - X.aA, mt = Object.assign({}, METAS_PADRAO, param('metasReestr', {})), C = cenariosRe(), cen = C.find(q => q.id === p.id), av = cen ? avaliarCenario(cen, metricasEstrutura(cen.lista), C[0], mt) : [];
    return `${p.descricao ? `<p class="ap-desc">${esc(p.descricao)}</p>` : ''}<div class="ap-ks">${kp('#16a34a', 'Unidades criadas', c('novo').length + c('reativado').length, '')}${kp('#dc2626', 'Unidades extintas', c('extinto').length, '')}${kp('#2563eb', 'Movidas', c('movido').length, '')}${kp('#7c3aed', 'Renomeadas', c('renomeado').length + c('tipo').length, '')}${kp(d > 0 ? '#dc2626' : '#16a34a', 'Custo anual', fmtRc(X.aB), `${d >= 0 ? '+' : ''}${fmtRs(d)} sobre o atual`)}</div>
      ${av.length ? `<div class="ap-metas">${av.map(y => `<span class="${y.ok ? 'ok' : 'nok'}"><i class="fa-solid ${y.ok ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>${esc(y.nome)}: ${esc(y.valor)}</span>`).join('')}</div>` : ''}
      <ul class="ap-l">${X.est.filter(e => e.tipo !== 'editado').slice(0, 8).map(e => `<li>${e.txt}</li>`).join('')}${X.est.length > 8 ? `<li>e mais ${X.est.length - 8} alteração(ões)</li>` : ''}</ul>`; }
  if (x.tipo === 'implantacao') { const L = DB.etapas || [], co = L.filter(e => e.status === 'Concluída').length, at = L.filter(atrasada);
    return `<div class="ap-ks">${kp('#0f766e', 'Etapas', L.length, co + ' concluídas')}${kp('#2563eb', 'Andamento', (L.length ? Math.round(co * 100 / L.length) : 0) + '%', '')}${kp('#dc2626', 'Atrasadas', at.length, '')}${kp('#7f1d1d', 'Bloqueadas', L.filter(e => e.status === 'Bloqueada').length, '')}</div>
      <ul class="ap-l">${at.slice(0, 7).map(e => `<li class="alerta"><b>${esc(e.titulo)}</b> · ${esc(e.responsavel || 'sem responsável')} · venceu em ${fmtDia(e.prazo)}</li>`).join('') || '<li class="ok">Nenhuma etapa atrasada.</li>'}</ul>`; }
  if (x.tipo === 'chefias') { const T = setoresOficiais().filter(s => s.status !== 'Extinto' && CHEFIAS.includes(s.tipo)).map(s => ({ s, c:chefiaDe(s) })), n = k => T.filter(y => y.c.situacao === k).length;
    return `<div class="ap-ks">${kp('#16a34a', 'Com titular', n('Titular'), '')}${kp('#d97706', 'Interinos', n('Interino'), '')}${kp('#2563eb', 'Em nomeação', n('Em nomeação'), '')}${kp('#dc2626', 'Vagos', n('Vago'), '')}</div>
      <ul class="ap-l">${T.filter(y => ['Vago', 'Interino', 'Em nomeação'].includes(y.c.situacao)).sort((a, b) => (prof.get(a.s.id) || 0) - (prof.get(b.s.id) || 0)).slice(0, 8).map(y => `<li class="${y.c.situacao === 'Vago' ? 'alerta' : 'atencao'}"><b>${esc(y.s.nome)}</b> · ${esc(y.c.situacao)}${y.c.desde ? ` há ${diasDesdeData(y.c.desde)} dia(s)` : ''}</li>`).join('') || '<li class="ok">Nenhuma chefia vaga ou interina registrada.</li>'}</ul>`; }
  if (x.tipo === 'regional') { const R = dadosRegionais().sort((a, b) => b.custo - a.custo), dres = R.map(y => y.d).sort();
    return `<table class="ap-t"><thead><tr><th>DRE</th><th>Escolas</th><th>Dist. média</th><th>Mais distante</th><th>Deslocamento/ano</th></tr></thead><tbody>${R.slice(0, 13).map(y => `<tr><td><i style="background:${corDRE(dres, y.d)}"></i>${esc(nomeDRE(y.d))}</td><td>${y.n}</td><td>${fmtKm(y.med)}</td><td>${fmtKm(y.max.km)}</td><td>${fmtRc(y.custo)}</td></tr>`).join('')}</tbody></table>`; }
  if (x.tipo === 'resultados') { const M = DB.metas || [], at = M.filter(m => situacaoMeta(m) === 'Atrasada'), p = M.map(progressoMeta).filter(v => v !== null);
    return `<div class="ap-ks">${kp('#be185d', 'Metas', M.length, new Set(M.map(m => m.setorId)).size + ' setores')}${kp('#16a34a', 'Atingimento médio', p.length ? Math.round(p.reduce((a, b) => a + b, 0) / p.length * 100) + '%' : '—', '')}${kp('#dc2626', 'Atrasadas', at.length, '')}</div>
      <ul class="ap-l">${at.slice(0, 7).map(m => `<li class="alerta"><b>${esc(m.titulo)}</b> · ${esc(nomeCurto(porId.get(m.setorId)))} · prazo ${fmtDia(m.prazo)}</li>`).join('') || '<li class="ok">Nenhuma meta atrasada.</li>'}</ul>`; }
  return `<p class="ap-desc">${esc(x.notas || 'Assunto para discussão.')}</p>`;
}
function apresentarReuniao(id){
  const r = DB.reunioes.find(x => x.id === id); if (!r) return;
  ap = { id, i:0 }; let el = $('#ap-reu'); if (!el) { el = document.createElement('div'); el.id = 'ap-reu'; document.body.appendChild(el); }
  el.classList.remove('hidden'); desenharApresentacao();
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
}
function desenharApresentacao(){
  const r = DB.reunioes.find(x => x.id === ap.id), it = itensReu(r), n = it.length + 2, el = $('#ap-reu'); ap.i = Math.max(0, Math.min(n - 1, ap.i));
  let corpo;
  if (ap.i === 0) corpo = `<div class="ap-capa"><span class="ap-logo"><i class="fa-solid fa-sitemap"></i></span><h1>${esc(r.titulo)}</h1><p>${fmtData(r.data)}${r.participantes ? '<br>' + esc(r.participantes) : ''}</p><ol>${it.map(x => `<li>${esc(tituloItem(x))}</li>`).join('')}</ol></div>`;
  else if (ap.i === n - 1) corpo = `<div class="ap-fim"><h2><i class="fa-solid fa-gavel"></i>Decisões da reunião</h2><table class="ap-t"><thead><tr><th>Assunto</th><th>Decisão</th><th>Encaminhamento</th><th>Responsável</th><th>Prazo</th></tr></thead><tbody>${it.map(x => `<tr><td>${esc(tituloItem(x))}</td><td>${x.decisao ? chipG(esc(x.decisao), DECISOES[x.decisao]) : '—'}</td><td>${esc(x.encaminhamento || '—')}</td><td>${esc(x.responsavel || '—')}</td><td>${x.prazo ? fmtDia(x.prazo) : '—'}</td></tr>`).join('')}</tbody></table></div>`;
  else { const x = it[ap.i - 1];
    corpo = `<div class="ap-slide"><div class="ap-tit"><span>${ap.i} de ${it.length}</span><h2><i class="fa-solid ${TIPOS_ITEM[x.tipo] ? TIPOS_ITEM[x.tipo][0] : 'fa-comment'}"></i>${esc(tituloItem(x))}</h2></div><div class="ap-cont">${telaItem(x)}</div>
      ${podeGestao() ? `<form class="ap-dec" onsubmit="event.preventDefault();salvarDecisaoAp()"><div class="g4">${camposDecisao(x, 'ad')}</div><div class="acoes"><button class="btn btn-p btn-sm" type="submit"><i class="fa-solid fa-floppy-disk"></i>Registrar decisão</button>${x.decisao ? chipG('registrado: ' + esc(x.decisao), DECISOES[x.decisao]) : ''}</div></form>` : ''}</div>`; }
  el.innerHTML = `<div class="ap-topo"><b>GAB<span>Org</span></b><span>${esc(r.titulo)}</span><span class="esp"></span><button onclick="ap.i--;desenharApresentacao()" ${ap.i ? '' : 'disabled'} title="Anterior (←)"><i class="fa-solid fa-chevron-left"></i></button><span>${ap.i + 1}/${n}</span><button onclick="ap.i++;desenharApresentacao()" ${ap.i < n - 1 ? '' : 'disabled'} title="Próxima (→)"><i class="fa-solid fa-chevron-right"></i></button><button onclick="fecharApresentacao()" title="Sair (Esc)"><i class="fa-solid fa-xmark"></i></button></div><div class="ap-palco">${corpo}</div>`;
}
function salvarDecisaoAp(){ const r = DB.reunioes.find(x => x.id === ap.id), it = itensReu(r), x = it[ap.i - 1]; lerDecisao($('#ap-reu'), 'ad', x); gravarReu(r, it); toast('Decisão registrada.'); desenharApresentacao(); }
function fecharApresentacao(){ const el = $('#ap-reu'); if (el) { el.classList.add('hidden'); el.innerHTML = ''; } if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); ap = null; renderReunioes(); }
document.addEventListener('keydown', e => { if (!ap || e.target.closest('input,textarea,select')) return; if (e.key === 'ArrowRight' || e.key === 'PageDown') { ap.i++; desenharApresentacao(); } if (e.key === 'ArrowLeft' || e.key === 'PageUp') { ap.i--; desenharApresentacao(); } if (e.key === 'Escape') fecharApresentacao(); });
function exportarAta(id, modo){
  const r = DB.reunioes.find(x => x.id === id), it = itensReu(r);
  const h = `<h1>MEMÓRIA DE REUNIÃO</h1><p class="centro"><b>${esc(r.titulo)}</b><br>${fmtData(r.data)}</p>${r.participantes ? `<p><b>Participantes:</b> ${esc(r.participantes)}</p>` : ''}
    <h2>Pauta e deliberações</h2>${it.map((x, i) => `<p><b>${i + 1}. ${esc(tituloItem(x))}</b></p>${x.notas ? `<p>${esc(x.notas)}</p>` : ''}<p><b>Decisão:</b> ${esc(x.decisao || 'sem deliberação')}${x.encaminhamento ? `. <b>Encaminhamento:</b> ${esc(x.encaminhamento)}` : ''}${x.responsavel ? `. <b>Responsável:</b> ${esc(x.responsavel)}` : ''}${x.prazo ? `. <b>Prazo:</b> ${fmtDia(x.prazo)}` : ''}.</p>`).join('')}
    <h2>Quadro de encaminhamentos</h2><table><thead><tr><th>Assunto</th><th>Encaminhamento</th><th>Responsável</th><th>Prazo</th></tr></thead><tbody>${it.filter(x => x.encaminhamento).map(x => `<tr><td>${esc(tituloItem(x))}</td><td>${esc(x.encaminhamento)}</td><td>${esc(x.responsavel || '')}</td><td>${x.prazo ? fmtDia(x.prazo) : ''}</td></tr>`).join('') || '<tr><td colspan="4">Sem encaminhamentos.</td></tr>'}</tbody></table>
    <p class="pq">Gerado pelo GABOrg em ${new Date().toLocaleString('pt-BR')}.</p>`;
  if (modo === 'word') baixarWord('memoria-reuniao-' + String(r.data).slice(0, 10), 'Memória de reunião', h); else imprimirDoc('Memória de reunião', h);
}

/* ===================== FIGURAS VETORIAIS PARA RELATÓRIOS: ORGANOGRAMA E MAPAS ===================== */
const FIG_FONTE = 'Helvetica, Arial, sans-serif';
const MODOS_COR_ORG = { tipo:'Tipo de unidade', area:'Secretaria adjunta', impacto:'Impacto', validacao:'Situação da validação', chefia:'Situação da chefia' };
function quebrarTexto(t, max, linhas){ const p = String(t || '').split(/\s+/), r = []; let l = ''; p.forEach(w => { if ((l + ' ' + w).trim().length > max) { if (l) r.push(l); l = w; } else l = (l + ' ' + w).trim(); }); if (l) r.push(l); if (r.length > linhas) { r.length = linhas; r[linhas - 1] = r[linhas - 1].replace(/.{0,2}$/, '') + '…'; } return r; }
function corOrg(s, modo){
  if (modo === 'area') return corArea(areaDe.get(s.id) || s.id);
  if (modo === 'impacto') return (IMPACTO[num(s.impacto)] || IMPACTO[0])[1];
  if (modo === 'validacao') return STATUS_VAL[statusVal(s.id)] || '#94a3b8';
  if (modo === 'chefia') return CHEFIAS.includes(s.tipo) ? (SIT_CH[chefiaDe(s).situacao] || '#94a3b8') : '#cbd5e1';
  return corTipo(s.tipo);
}
function legendaOrg(lista, modo){
  const usados = new Map(); lista.forEach(s => { const c = corOrg(s, modo); let n;
    if (modo === 'area') n = nomeCurto(porId.get(areaDe.get(s.id) || s.id)); else if (modo === 'impacto') n = (IMPACTO[num(s.impacto)] || IMPACTO[0])[0]; else if (modo === 'validacao') n = statusVal(s.id); else if (modo === 'chefia') n = CHEFIAS.includes(s.tipo) ? chefiaDe(s).situacao : 'Não é chefia'; else n = s.tipo;
    const k = n; const o = usados.get(k) || { c, n:0 }; o.n++; usados.set(k, o); });
  return [...usados.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 18).map(([n, o]) => [o.c, `${n} (${o.n})`]);
}
/* organograma: caixas e conectores; listas de folhas empilhadas; muitos filhos quebram em linhas */
function orgSVG(lista, o){
  o = Object.assign({ raiz:'', nivelMax:99, modo:'tipo', vinculos:false, marcas:false, maxLinha:6 }, o || {});
  const ativos = lista.filter(s => s.status !== 'Extinto' || o.marcas), ids = new Set(ativos.map(s => s.id)), fil = new Map();
  ativos.forEach(s => { const p = ids.has(s.paiId) ? s.paiId : ''; if (!fil.has(p)) fil.set(p, []); fil.get(p).push(s); });
  fil.forEach(l => l.sort((a, b) => num(a.ordem) - num(b.ordem) || a.nome.localeCompare(b.nome, 'pt-BR')));
  const BW = 156, BH = 52, GX = 14, GY = 30, PIL = 7, IND = 16, desc = id => { let n = 0; (fil.get(id) || []).forEach(k => { n += 1 + desc(k.id); }); return n; };
  const raizes = o.raiz ? ativos.filter(s => s.id === o.raiz) : (fil.get('') || []);
  const kidsDe = (n, d) => d >= o.nivelMax ? [] : (fil.get(n.id) || []);
  function medir(n, d){
    const k = kidsDe(n, d); n._k = k; n._d = d; n._oc = d >= o.nivelMax ? desc(n.id) : 0;
    if (!k.length) { n._w = BW; n._h = BH; n._modo = 'folha'; return; }
    k.forEach(c => medir(c, d + 1));
    if (k.every(c => !c._k.length) && k.length >= 3) { n._modo = 'pilha'; n._nc = Math.ceil(k.length / 8); n._per = Math.ceil(k.length / n._nc); n._w = n._nc * (BW + IND) + (n._nc - 1) * GX; n._h = BH + GY * .6 + n._per * (BH + PIL); return; }
    n._modo = 'linhas'; let itens = k;
    const folhas = k.filter(c => !c._k.length); if (folhas.length >= 3) { const ramos = k.filter(c => c._k.length), cols = []; const porCol = Math.max(4, Math.ceil(folhas.length / Math.ceil(folhas.length / 8)));
      for (let i = 0; i < folhas.length; i += porCol) { const g = folhas.slice(i, i + porCol); cols.push({ _virt:true, _k:g, _w:BW + IND, _h:g.length * (BH + PIL) - PIL, _modo:'grupo' }); } itens = cols.concat(ramos); }
    n._rows = []; for (let i = 0; i < itens.length; i += o.maxLinha) n._rows.push(itens.slice(i, i + o.maxLinha));
    n._w = Math.max(BW, ...n._rows.map(r => r.reduce((t, c) => t + c._w, 0) + GX * (r.length - 1)));
    n._h = BH + n._rows.reduce((t, r) => t + GY + Math.max(...r.map(c => c._h)), 0);
  }
  const caixas = [], linhas = [];
  function pos(n, x, y){
    if (n._virt) { n._x = x; n._y = y; let yy = y; n._k.forEach((c, i) => { pos(c, x + IND, yy); linhas.push(`M${x + 7} ${i ? yy - PIL - BH / 2 : y - GY / 2}V${yy + BH / 2}H${x + IND}`); yy += BH + PIL; }); return; }
    n._x = x + (n._modo === 'pilha' && n._nc === 1 ? 0 : (n._w - BW) / 2); n._y = y; caixas.push(n);
    if (n._modo === 'pilha') { const yb = y + BH + GY * .3; if (n._nc > 1) { linhas.push(`M${n._x + BW / 2} ${y + BH}V${yb}`); linhas.push(`M${x + 7} ${yb}H${x + (n._nc - 1) * (BW + IND + GX) + 7}`); }
      n._k.forEach((c, i) => { const col = Math.floor(i / n._per), lin = i % n._per, cx0 = x + col * (BW + IND + GX), yy = y + BH + GY * .6 + lin * (BH + PIL); pos(c, cx0 + IND, yy);
        linhas.push(`M${cx0 + 7} ${lin ? yy - PIL - BH / 2 : (n._nc > 1 ? yb : y + BH)}V${yy + BH / 2}H${cx0 + IND}`); }); return; }
    if (n._modo !== 'linhas') return;
    const cx = n._x + BW / 2; let yy = y + BH;
    n._rows.forEach((r, ri) => { const rw = r.reduce((t, c) => t + c._w, 0) + GX * (r.length - 1); let xx = x + (n._w - rw) / 2; const bus = yy + GY / 2;
      const centros = r.map(c => { const cc = xx + c._w / 2; pos(c, xx, yy + GY); xx += c._w + GX; return c._virt ? c._x + 7 : c._modo === 'pilha' ? c._x + BW / 2 : cc; });
      linhas.push(`M${cx} ${yy - (ri ? GY / 2 : 0)}V${bus}`); linhas.push(`M${Math.min(cx, ...centros)} ${bus}H${Math.max(cx, ...centros)}`); centros.forEach((c, j) => { if (!r[j]._virt) linhas.push(`M${c} ${bus}V${yy + GY}`); });
      yy += GY + Math.max(...r.map(c => c._h)); });
  }
  let X = 0, H = 0; raizes.forEach(r => { medir(r, 0); pos(r, X, 0); X += r._w + GX * 2; H = Math.max(H, r._h); });
  const W = Math.max(BW, X - GX * 2), M = 10;
  const MARCA = { novo:['#16a34a', 'Criada'], extinto:['#dc2626', 'Extinta'], movido:['#2563eb', 'Movida'], renomeado:['#7c3aed', 'Renomeada'] };
  const caixa = s => { const c = corOrg(s, o.modo), mk = o.marcas && (s._marcas || []).find(m => MARCA[m]), nome = quebrarTexto(s.nome, 30, s.sigla ? 2 : 3), ext = s.status === 'Extinto';
    return `<g><rect x="${s._x}" y="${s._y}" width="${BW}" height="${BH}" rx="6" fill="${ext ? '#fef2f2' : '#ffffff'}" stroke="${mk ? MARCA[mk][0] : '#cbd5e1'}" stroke-width="${mk ? 2.4 : .8}" ${ext ? 'stroke-dasharray="4 3"' : ''}/><rect x="${s._x}" y="${s._y}" width="5" height="${BH}" rx="2" fill="${c}"/>
      ${s.sigla ? `<text x="${s._x + 11}" y="${s._y + 13}" font-family="${FIG_FONTE}" font-size="8.5" font-weight="bold" fill="${c}">${esc(s.sigla.slice(0, 26))}</text>` : ''}
      ${nome.map((l, i) => `<text x="${s._x + 11}" y="${s._y + (s.sigla ? 25 : 15) + i * 10.5}" font-family="${FIG_FONTE}" font-size="8.2" fill="#0f172a">${esc(l)}</text>`).join('')}
      ${s._oc ? `<rect x="${s._x + BW - 30}" y="${s._y + BH - 13}" width="26" height="11" rx="5" fill="#e2e8f0"/><text x="${s._x + BW - 17}" y="${s._y + BH - 4.5}" font-family="${FIG_FONTE}" font-size="7" text-anchor="middle" fill="#334155">+${s._oc}</text>` : ''}
      ${mk ? `<text x="${s._x + BW - 4}" y="${s._y + 10}" font-family="${FIG_FONTE}" font-size="7" font-weight="bold" text-anchor="end" fill="${MARCA[mk][0]}">${MARCA[mk][1].toUpperCase()}</text>` : ''}</g>`; };
  let vin = '';
  if (o.vinculos) { const mp = new Map(caixas.map(s => [s.id, s])); (DB.vinculos || []).forEach(v => { const a = mp.get(v.origemId), b = mp.get(v.destinoId); if (!a || !b) return; const x1 = a._x + BW / 2, y1 = a._y + BH / 2, x2 = b._x + BW / 2, y2 = b._y + BH / 2, cy = Math.min(y1, y2) - 40; vin += `<path d="M${x1} ${y1}Q${(x1 + x2) / 2} ${cy} ${x2} ${y2}" fill="none" stroke="#8b5cf6" stroke-width="1.2" stroke-dasharray="5 4" opacity=".75"/>`; }); }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-M} ${-M} ${W + 2 * M} ${H + 2 * M}" width="${W + 2 * M}" height="${H + 2 * M}"><rect x="${-M}" y="${-M}" width="${W + 2 * M}" height="${H + 2 * M}" fill="#ffffff"/><g fill="none" stroke="#94a3b8" stroke-width="1">${linhas.map(d => `<path d="${d}"/>`).join('')}</g>${vin}${caixas.map(caixa).join('')}</svg>`;
  const leg = legendaOrg(caixas, o.modo);
  if (o.vinculos && vin) leg.push(['#8b5cf6', 'Vínculo entre setores (tracejado)']);
  if (o.marcas) Object.values(MARCA).forEach(([c, n]) => leg.push([c, 'Borda: unidade ' + n.toLowerCase()]));
  if (caixas.some(s => s._oc)) leg.push(['#e2e8f0', '+N: unidades subordinadas não desenhadas neste nível']);
  return { svg, w:W + 2 * M, h:H + 2 * M, n:caixas.length, leg };
}
/* mapas de Mato Grosso (vetor, fundo claro) */
let _vizMun = null;
function coresVizinhosMT(){ if (_vizMun) return _vizMun; const obj = MALHA_MT.objects[Object.keys(MALHA_MT.objects)[0]], g = obj.geometries, viz = topojson.neighbors(g), PAL = ['#fde68a', '#a7f3d0', '#bfdbfe', '#fecaca', '#ddd6fe', '#fed7aa', '#a5f3fc', '#f5d0fe', '#d9f99d'], cor = [];
  g.map((x, i) => i).sort((a, b) => viz[b].length - viz[a].length).forEach(i => { const us = new Set(viz[i].map(j => cor[j])); let c = (i * 7) % PAL.length, t = 0; while (us.has(c) && t++ < PAL.length) c = (c + 1) % PAL.length; cor[i] = c; });
  return _vizMun = g.map((x, i) => PAL[cor[i] % PAL.length]); }
const halo = (x, y, t, at) => `<text x="${x}" y="${y}" ${at} stroke="#ffffff" stroke-width="3" stroke-linejoin="round">${t}</text><text x="${x}" y="${y}" ${at}>${t}</text>`;
function mapaSVG(o){
  o = Object.assign({ modo:'dre', dre:'', ligacoes:false, nomes:false, titulo:'' }, o || {});
  const obj = MALHA_MT.objects[Object.keys(MALHA_MT.objects)[0]], fc = topojson.feature(MALHA_MT, obj), X = distanciasMT(), dres = X.dres, porMun = dreDosMunicipios(), viz = o.modo === 'mun' ? coresVizinhosMT() : null;
  const kx = Math.cos(-13 * Math.PI / 180), anel = g => g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const inc = (lo, la) => { const x = lo * kx, y = -la; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; };
  const doDre = o.dre ? X.lista.filter(e => e.e.dre === o.dre) : null;
  if (doDre && doDre.length) { doDre.forEach(e => inc(e.e.longitude, e.e.latitude)); const s = X.sedes.get(o.dre); inc(s[1], s[0]); const pd = Math.max(x1 - x0, y1 - y0) * .12 + .15; x0 -= pd; x1 += pd; y0 -= pd; y1 += pd; }
  else fc.features.forEach(f => anel(f.geometry).forEach(pl => pl[0].forEach(([lo, la]) => inc(lo, la))));
  const det = !(doDre && doDre.length) && QUADRANTES_MT[o.recorte] ? o.recorte : '';
  if (det) { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, ox = (x1 - x0) * .04, oy = (y1 - y0) * .04; if (det[0] === 'n') y1 = my + oy; else y0 = my - oy; if (det[1] === 'o') x1 = mx + ox; else x0 = mx - ox; }
  const W = 1000, s = W / (x1 - x0), Hh = (y1 - y0) * s, P = (lo, la) => [(lo * kx - x0) * s, (-la - y0) * s], f1 = v => v.toFixed(1);
  const path = g => anel(g).map(pl => pl.map(r => 'M' + r.map(([lo, la]) => P(lo, la).map(f1).join(',')).join('L') + 'Z').join('')).join('');
  const dreMun = f => { const q = porMun.get(chaveMun(f.properties.nome)); return q ? Object.entries(q).sort((a, b) => b[1] - a[1])[0][0] : ''; };
  const cid = 'cl' + (++mapaSVG.n), zoom = !!(doDre && doDre.length), rp = zoom ? 8 : det ? 7.5 : 5.6, sw = zoom ? 1 : det ? .9 : .6;
  const mun = fc.features.map((f, i) => { const d = dreMun(f); let fill = '#f1f5f9', op = 1;
    if (o.modo === 'mun') fill = viz[i]; else if (d) { fill = corDRE(dres, d); op = o.dre && d !== o.dre ? .06 : .22; }
    return `<path d="${path(f.geometry)}" fill="${fill}" fill-opacity="${op}" stroke="#64748b" stroke-width="${sw}" stroke-opacity=".55"/>`; }).join('');
  const lista = doDre || X.lista, sedes = X.sedes;
  const lig = (o.ligacoes || o.modo === 'dist') ? lista.map(e => { const a = P(e.e.longitude, e.e.latitude), b = P(sedes.get(e.e.dre)[1], sedes.get(e.e.dre)[0]); return `<path d="M${f1(a[0])},${f1(a[1])}L${f1(b[0])},${f1(b[1])}" stroke="${o.modo === 'dist' ? faixaDist(e.km)[2] : corDRE(dres, e.e.dre)}" stroke-width="${zoom ? .9 : .5}" stroke-opacity=".55"/>`; }).join('') : '';
  const pts = lista.map(e => { const [x, y] = P(e.e.longitude, e.e.latitude), c = o.modo === 'dist' ? faixaDist(e.km)[2] : o.modo === 'mun' ? '#0f172a' : corDRE(dres, e.e.dre); return simbolo(formaTipo(e.e.tipo), x, y, rp, c); }).join('');
  const sd = dres.filter(d => !o.dre || d === o.dre).filter(d => { const [x, y] = P(sedes.get(d)[1], sedes.get(d)[0]); return x >= 0 && x <= W && y >= 0 && y <= Hh; }).map(d => { const [x, y] = P(sedes.get(d)[1], sedes.get(d)[0]), n = X.lista.filter(e => e.e.dre === d).length, c = corDRE(dres, d);
    return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${zoom ? 14 : det ? 12 : 10}" fill="${c}" stroke="#ffffff" stroke-width="2"/><text x="${f1(x)}" y="${f1(y + 3.2)}" text-anchor="middle" font-family="${FIG_FONTE}" font-size="${zoom ? 10 : 8.5}" font-weight="bold" fill="#ffffff">${n}</text>${halo(f1(x + (zoom ? 18 : 13)), f1(y + 4), esc(nomeDRE(d)), `font-family="${FIG_FONTE}" font-size="${zoom ? 13 : det ? 12 : 10.5}" font-weight="bold" fill="#0f172a"`)}`; }).join('');
  let nomes = '';
  if (o.nomes || zoom || det) { const vist = new Set(); fc.features.forEach(f => { const d = dreMun(f); if (o.dre && d !== o.dre) return; const k = chaveMun(f.properties.nome); if (vist.has(k)) return; vist.add(k); let a = 1e9, b = -1e9, c = 1e9, e2 = -1e9; anel(f.geometry).forEach(pl => pl[0].forEach(([lo, la]) => { const [x, y] = P(lo, la); a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); e2 = Math.max(e2, y); }));
    const mx2 = (a + b) / 2, my2 = (c + e2) / 2; if (mx2 < 0 || mx2 > W || my2 < 0 || my2 > Hh) return; nomes += halo(f1(mx2), f1(my2), esc(f.properties.nome), `text-anchor="middle" font-family="${FIG_FONTE}" font-size="${zoom ? 9 : det ? 8.5 : 6}" fill="#334155"`); }); }
  // escala e norte
  const kmPorUnid = 111.32 / s / 1, alvoKm = zoom ? 50 : det ? 100 : 200, lw = alvoKm / kmPorUnid, ey = Hh - 22;
  const extra = `<g font-family="${FIG_FONTE}" font-size="10" fill="#334155"><rect x="2" y="${f1(ey - 14)}" width="${f1(lw + 30)}" height="34" rx="4" fill="#ffffff" fill-opacity=".85"/><path d="M10 ${f1(ey)}h${f1(lw)}" stroke="#334155" stroke-width="2"/><path d="M10 ${f1(ey - 4)}v8M${f1(10 + lw)} ${f1(ey - 4)}v8M${f1(10 + lw / 2)} ${f1(ey - 3)}v6" stroke="#334155" stroke-width="1.2"/><text x="10" y="${f1(ey + 14)}">0</text><text x="${f1(10 + lw)}" y="${f1(ey + 14)}" text-anchor="middle">${alvoKm} km</text>
    <g transform="translate(${W - 20},20)"><circle r="17" cy="2" fill="#ffffff" fill-opacity=".85"/><path d="M0 -14L7 8L0 3L-7 8Z" fill="#0f172a"/><text y="20" text-anchor="middle" font-weight="bold">N</text></g></g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 ${W + 20} ${f1(Hh + 20)}" width="${W + 20}" height="${f1(Hh + 20)}"><rect x="-10" y="-10" width="${W + 20}" height="${f1(Hh + 20)}" fill="#ffffff"/>${det ? `<rect x="0" y="0" width="${W}" height="${f1(Hh)}" fill="none" stroke="#94a3b8" stroke-width="1"/>` : ''}<defs><clipPath id="${cid}"><rect x="0" y="0" width="${W}" height="${f1(Hh)}"/></clipPath></defs><g clip-path="url(#${cid})">${mun}<g fill="none">${lig}</g>${pts}${nomes}</g>${sd}${extra}</svg>`;
  let leg;
  if (o.modo === 'dist') leg = FAIXAS_DIST.map(f => [f[2], `${f[1]} (${lista.filter(e => faixaDist(e.km) === f).length})`]);
  else if (o.modo === 'mun') leg = [['#fde68a', 'Cada cor separa municípios vizinhos'], ['#0f172a', 'Unidade escolar']];
  else leg = dres.filter(d => !o.dre || d === o.dre).map(d => [corDRE(dres, d), `${nomeDRE(d)} (${X.lista.filter(e => e.e.dre === d).length})`]);
  leg.push(['#ffffff', 'Círculo grande: sede da DRE, com o número de escolas']);
  const ct = {}; lista.forEach(x => { const g = grupoTipo(x.e.tipo); ct[g] = (ct[g] || 0) + 1; }); Object.keys(FORMAS_TIPO).filter(k => ct[k]).forEach(k => leg.push(['#475569', `${k} (${ct[k]}) – ${NOMES_FORMA[FORMAS_TIPO[k]]}`, FORMAS_TIPO[k]]));
  if (lig) leg.push(['#94a3b8', 'Linha: ligação da escola com a sede da sua DRE']);
  return { svg, w:W + 20, h:Hh + 20, leg, mapa:true };
}
mapaSVG.n = 0;
const QUADRANTES_MT = { no:'Noroeste', ne:'Nordeste', so:'Sudoeste', se:'Sudeste' };
/* miniatura de MT com o quadrante destacado (localização do detalhe) */
function miniQuadranteMT(q){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 58" width="60" height="58"><rect x="1" y="1" width="58" height="56" rx="4" fill="#f8fafc" stroke="#cbd5e1"/>${Object.keys(QUADRANTES_MT).map(k => `<rect x="${k[1] === 'o' ? 5 : 31}" y="${k[0] === 'n' ? 5 : 30}" width="24" height="23" rx="2" fill="${k === q ? '#1e3a8a' : '#e2e8f0'}"/>`).join('')}</svg>`; }

/* ===================== DOCUMENTOS: MODELO ÚNICO → PRÉVIA, PDF, WORD E IMPRESSÃO ===================== */
const SISTEMA_NOME = 'GABOrg · Organização Institucional', SISTEMA_ORG = 'Secretaria de Estado de Educação de Mato Grosso – SEDUC-MT';
/* código de verificação: GAB-REL-20261025-K7Q2X (o último caractere confere os demais) */
function digitoCodigo(s){ let h = 7; for (const ch of s.replace(/-/g, '')) h = (h * 31 + ch.charCodeAt(0)) % 1000003; return '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'[h % 34]; }
function gerarCodigo(tipo){ const d = new Date(), dt = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'), al = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; let r = ''; for (let i = 0; i < 4; i++) r += al[Math.floor(Math.random() * al.length)]; const b = `GAB-${tipo}-${dt}-${r}`; return b + digitoCodigo(b); }
function codigoValido(c){ const m = String(c || '').trim().toUpperCase().match(/^(GAB-[A-Z]{3}-\d{8}-[0-9A-Z]{4})([0-9A-Z])$/); return !!m && digitoCodigo(m[1]) === m[2]; }
const emissoes = () => { const e = param('emissoes', []); return Array.isArray(e) ? e : []; };
function registrarEmissao(o){ const l = emissoes(); l.unshift(Object.assign({ em:agora(), por:cfg.usuario || cfg.login || '' }, o)); salvarParam('emissoes', l.slice(0, 500)); }
/* selo do sistema (SVG): texto em volta, marca no centro, data e código */
function seloSVG(codigo, data, t){
  t = t || 120; const c = t / 2, r = t * .4, txt = 'GABORG · SEDUC-MT · DOCUMENTO EMITIDO PELO SISTEMA · ', n = txt.length;
  const letras = [...txt].map((ch, i) => { const a = i / n * 360, rad = a * Math.PI / 180, x = c + r * Math.sin(rad), y = c - r * Math.cos(rad); return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" transform="rotate(${a.toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif" font-size="${(t * .062).toFixed(1)}" font-weight="bold" fill="#1e3a8a">${esc(ch)}</text>`; }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${t}" viewBox="0 0 ${t} ${t}"><circle cx="${c}" cy="${c}" r="${(c - 2).toFixed(1)}" fill="#ffffff" stroke="#1e3a8a" stroke-width="${(t * .025).toFixed(1)}"/><circle cx="${c}" cy="${c}" r="${(r - t * .06).toFixed(1)}" fill="#eff6ff" stroke="#1e3a8a" stroke-width="${(t * .01).toFixed(1)}"/>${letras}
    <text x="${c}" y="${(c - t * .04).toFixed(1)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${(t * .115).toFixed(1)}" font-weight="bold" fill="#1e3a8a">GABOrg</text>
    <text x="${c}" y="${(c + t * .06).toFixed(1)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${(t * .075).toFixed(1)}" fill="#1e3a8a">${esc(data || '')}</text>
    <text x="${c}" y="${(c + t * .16).toFixed(1)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${(t * .05).toFixed(1)}" font-weight="bold" fill="#0f172a">${esc(String(codigo || '').replace(/^GAB-[A-Z]+-/, ''))}</text></svg>`;
}
/* texto com trechos em negrito: [['texto', true], 'normal'] */
const runsHTML = x => Array.isArray(x) ? x.map(r => Array.isArray(r) ? (r[1] ? `<b>${esc(r[0])}</b>` : esc(r[0])) : esc(r)).join('') : esc(x);
const runsPDF = x => Array.isArray(x) ? x.map(r => Array.isArray(r) ? { text:String(r[0]), bold:!!r[1] } : { text:String(r) }) : String(x ?? '');
const celTxt = c => c && typeof c === 'object' && !Array.isArray(c) ? c.x : c;
function docHTML(blocos, o){
  o = o || {};
  const h = blocos.map(b => {
    switch (b.t) {
      case 'capa': return b.tipoNome ? capaHTML(b) : `<div class="d-capa"><div class="d-capa-sup"><span>${esc(SISTEMA_ORG)}</span></div><h1>${esc(b.titulo)}</h1>${b.sub ? `<p class="d-sub">${esc(b.sub)}</p>` : ''}<div class="d-capa-selo">${seloSVG(b.codigo, b.data, 150)}</div><table class="d-capa-tab">${(b.linhas || []).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table></div>`;
      case 'h1': return `<h1 class="d-h1">${esc(b.x)}</h1>`;
      case 'h2': return `<h2 class="d-h2">${esc(b.x)}</h2>`;
      case 'h3': return `<h3 class="d-h3">${esc(b.x)}</h3>`;
      case 'p': return `<p class="${b.centro ? 'd-c' : ''} ${b.ementa ? 'd-ementa' : ''}" style="${b.recuo ? 'margin-left:' + (b.recuo * 26) + 'px' : ''}">${runsHTML(b.x)}</p>`;
      case 'kpis': return `<div class="d-kpis">${b.it.map(([r, v, s, c]) => `<div class="d-kpi" style="border-top-color:${c || '#1e3a8a'}"><small>${esc(r)}</small><b>${esc(v)}</b>${s ? `<span>${esc(s)}</span>` : ''}</div>`).join('')}</div>`;
      case 'tab': return `<table class="d-tab ${b.pq ? 'pq' : ''}"><thead><tr>${b.cab.map((c, i) => `<th class="${(b.dir || []).includes(i) ? 'dir' : ''}">${esc(c)}</th>`).join('')}</tr></thead><tbody>${b.lin.map(l => `<tr>${l.map((c, i) => `<td class="${(b.dir || []).includes(i) ? 'dir' : ''}" style="${c && c.cor ? 'background:' + c.cor : ''}${c && c.b ? ';font-weight:bold' : ''}">${esc(celTxt(c) ?? '')}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${b.cab.length}" class="d-vz">Sem registros.</td></tr>`}</tbody></table>`;
      case 'barras': { if (!b.it.length) return '<p class="d-nota">Sem dados.</p>'; const mx = Math.max(1, ...b.it.map(x => x[1])); return `<div class="d-barras">${b.it.map(([n, v, r, c, f]) => `<div class="d-bar"><span class="n">${f ? `<svg viewBox="0 0 12 12" width="11" height="11" style="vertical-align:-1px;margin-right:4px">${simbolo(f, 6, 6, 5.6, c || '#2563eb')}</svg>` : ''}${esc(n)}</span><span class="t"><i style="width:${(v / mx * 100).toFixed(1)}%;background:${c || '#2563eb'}"></i></span><b>${esc(r ?? fmtN(v))}</b></div>`).join('')}</div>`; }
      case 'lista': return `<div class="d-lista">${b.it.map(([x, n]) => `<p style="margin-left:${(n || 0) * 20}px">${runsHTML(x)}</p>`).join('')}</div>`;
      case 'alertas': return `<div class="d-alertas">${b.it.map(([t, x]) => `<p class="d-al ${t}">${runsHTML(x)}</p>`).join('')}</div>`;
      case 'nota': return `<p class="d-nota">${runsHTML(b.x)}</p>`;
      case 'quebra': return '<div class="d-quebra"></div>';
      case 'sumario': return `<h1 class="d-h1">Sumário</h1><div class="d-lista">${b.it.map((x, i) => `<p><b>${i + 1}.</b> ${esc(x)}</p>`).join('')}</div>`;
      case 'legenda': return `<div class="d-leg">${b.it.map(([c, t, f]) => `<span>${f ? `<svg viewBox="0 0 12 12" width="11" height="11">${simbolo(f, 6, 6, 5.6, c)}</svg>` : `<i style="background:${c}"></i>`}${esc(t)}</span>`).join('')}</div>`;
      case 'fig': return `<figure class="d-fig ${b.paisagem ? 'pais' : ''}"><figcaption>Figura ${b.num} – ${esc(b.titulo)}</figcaption><div class="d-fig-img">${b.svg}</div>${b.leg && b.leg.length ? `<div class="d-leg"><b>Legenda</b>${b.leg.map(([c, t, f]) => `<span>${f ? `<svg viewBox="0 0 12 12" width="11" height="11">${simbolo(f, 6, 6, 5.6, c)}</svg>` : `<i style="background:${c}"></i>`}${esc(t)}</span>`).join('')}</div>` : ''}${b.nota ? `<p class="d-nota">${esc(b.nota)}</p>` : ''}<p class="d-fonte">${esc(b.fonte || '')}</p></figure>`;
      case 'ass': return `<p class="d-ass">______________________________________<br><b>${esc(b.x)}</b>${b.sub ? '<br>' + esc(b.sub) : ''}</p>`;
      case 'selo': return `<div class="d-aut"><div>${seloSVG(b.codigo, b.data, 110)}</div><div><b>Autenticação</b><p>Documento gerado pelo ${esc(SISTEMA_NOME)} em ${esc(b.quando)}${b.por ? ' por ' + esc(b.por) : ''}.</p><p>Código de verificação: <b>${esc(b.codigo)}</b></p><p class="pq">Para conferir, abra o GABOrg › Relatórios e minutas › Verificar código.</p></div></div>`;
    } return '';
  });
  const capaPrim = blocos[0] && blocos[0].t === 'capa' && blocos[0].tipoNome ? h[0] : '', hr = (capaPrim ? h.slice(1) : h).join('');
  return `<div class="d-doc ${o.minuta ? 'minuta' : ''}">${capaPrim}${o.minuta ? '<div class="d-marca">MINUTA</div>' : ''}${o.cabecalho ? (o.minuta ? `<div class="d-cab"><span>${esc(SISTEMA_NOME)}</span><span>${esc(o.cabecalho)}</span></div>` : `<div class="d-cab az"><span class="d-cab-l">${logoPDF(26)}<b>GAB<i>Org</i><small>Organização Institucional · SEDUC-MT</small></b></span><span class="d-cab-r">${esc(o.cabecalho)}</span></div>`) : ''}${hr}</div>`;
}
const ESTILO_REL = `.d-fig{margin:12px 0 18px;page-break-inside:avoid;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px}.d-fig figcaption{font-weight:bold;color:#1e3a8a;font-size:10.5pt;margin-bottom:6px}.d-fig-img svg{width:100%;height:auto;max-height:620px;display:block}.d-fig.pais .d-fig-img svg{max-height:720px}
.d-leg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:8.5pt;color:#334155;margin-top:6px}.d-leg b{width:100%;font-size:8.5pt}.d-leg span{display:inline-flex;gap:5px;align-items:center}.d-leg i{width:10px;height:10px;border-radius:2px;border:1px solid #94a3b8;display:inline-block}.d-fonte{font-size:7.5pt;color:#64748b;font-style:italic;margin:2px 0 0!important}
.d-doc{font-family:Helvetica,Arial,sans-serif;font-size:10.5pt;color:#0f172a;line-height:1.45;position:relative}
.d-doc.minuta{font-family:'Times New Roman',Times,serif;font-size:12pt}
.d-marca{position:absolute;top:240px;left:0;right:0;text-align:center;font-size:110px;font-weight:bold;color:rgba(30,58,138,.06);transform:rotate(-30deg);pointer-events:none;letter-spacing:.1em}
.d-cab{display:flex;justify-content:space-between;font-size:8.5pt;color:#64748b;border-bottom:1px solid #cbd5e1;padding-bottom:4px;margin-bottom:14px}
.d-cab.az{align-items:center;background:#1e40af;background:linear-gradient(90deg,#0f2557,#1e40af,#0e7490);color:#dbeafe;padding:9px 14px;border-radius:7px;border-bottom:3px solid #22d3ee;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.d-cab-l{display:flex;align-items:center;gap:9px}.d-cab-l svg{flex:none}.d-cab-l b{color:#fff;font-size:13pt;font-weight:900;letter-spacing:-.02em;line-height:1}.d-cab-l b i{font-style:normal;color:#7dd3fc}.d-cab-l small{display:block;font-size:7pt;font-weight:400;color:#bfdbfe;letter-spacing:0;margin-top:2px}.d-cab-r{text-align:right;color:#fff;font-weight:600}
.d-capa{text-align:center;padding:30px 0 10px;page-break-after:always}.d-capa-sup b{display:block;font-size:13pt;color:#1e3a8a}.d-capa-sup span{font-size:9.5pt;color:#475569}
.d-capa h1{font-size:22pt;margin:60px 0 8px;color:#0f172a}.d-sub{font-size:12pt;color:#475569;text-align:center}.d-capa-selo{margin:40px 0}
.d-capa.nova{position:relative;text-align:center;color:#fff;padding:26px 30px 18px;border-radius:14px;background:#0b1222;background:radial-gradient(600px 380px at 18% 0%,#1d4ed8 0%,transparent 62%),radial-gradient(520px 380px at 100% 100%,#0e7490 0%,transparent 58%),#0b1222;-webkit-print-color-adjust:exact;print-color-adjust:exact;page-break-after:always;break-after:page}
.dc-topo b{display:block;font-size:9.5pt;letter-spacing:.14em}.dc-topo span{font-size:9pt;color:#bfdbfe}
.dc-hero{margin:22px 0 18px}.dc-hero>svg{display:block;margin:0 auto 10px}.dc-marca{font-size:44pt;font-weight:900;letter-spacing:-.04em;line-height:1}.dc-marca i{font-style:normal;color:#7dd3fc}.dc-slogan{font-size:10pt;font-weight:700;letter-spacing:.32em;color:#bfdbfe;margin-top:6px}
.dc-nums{display:flex;justify-content:center;gap:26px;margin:14px 0 18px}.dc-nums span{display:flex;flex-direction:column;font-size:6.8pt;color:#93c5fd;letter-spacing:.08em;text-transform:uppercase}.dc-nums b{font-size:17pt;color:#fff;letter-spacing:0;text-transform:none}
.dc-pill{display:inline-block;padding:4px 16px;border-radius:99px;background:rgba(30,64,175,.55);border:1px solid #60a5fa;font-size:7.5pt;font-weight:700;letter-spacing:.16em;color:#dbeafe}
.d-capa.nova h1{font-size:21pt;color:#fff;margin:10px 0 4px;line-height:1.15}.dc-sub{color:#93c5fd!important;font-size:9.5pt;text-align:center!important;margin:0}
.dc-card{background:#fff;color:#0f172a;border-radius:14px;border-top:5px solid #22d3ee;padding:18px 20px 12px;text-align:left;box-shadow:0 10px 30px -10px rgba(0,0,0,.5)}
.dc-id{display:flex;gap:18px;align-items:center}.dc-selo{flex:none}.dc-info{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:10px 16px}.dc-info .lg{grid-column:1/-1}.dc-info small,.dc-fil small{display:block;font-size:6.5pt;color:#64748b;letter-spacing:.06em;text-transform:uppercase}.dc-info b{font-size:11pt;color:#0f2557}.dc-info .lg b{font-size:12.5pt}
.dc-fil{border-top:1px solid #e2e8f0;margin-top:14px;padding-top:10px}.dc-fil h4{margin:0 0 8px;font-size:7.5pt;letter-spacing:.12em;text-transform:uppercase;color:#1e3a8a}.dc-fil>div{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}.dc-fil p{margin:0!important;padding-left:8px;border-left:3px solid var(--c);text-align:left!important}.dc-fil b{font-size:8.5pt}
.dc-aut{font-size:7pt;color:#64748b;text-align:center!important;margin:10px 0 0!important}.dc-aut b{color:#1e3a8a}.dc-pe{font-size:7.5pt;color:#93c5fd;margin-top:14px}
.d-capa-tab{margin:0 auto;border-collapse:collapse;min-width:60%;font-size:10pt}.d-capa-tab th{text-align:left;color:#475569;font-weight:normal;padding:5px 12px;border-bottom:1px solid #e2e8f0}.d-capa-tab td{text-align:left;font-weight:bold;padding:5px 12px;border-bottom:1px solid #e2e8f0}
.d-h1{font-size:15pt;color:#1e3a8a;border-bottom:2px solid #1e3a8a;padding-bottom:4px;margin:22px 0 10px}.minuta .d-h1{border:0;color:#000;text-align:center;font-size:13pt}
.d-h2{font-size:12pt;color:#0f172a;margin:16px 0 6px}.minuta .d-h2{text-align:center;text-transform:uppercase}
.d-h3{font-size:11pt;color:#334155;margin:12px 0 4px}.minuta .d-h3{text-align:center}
.d-doc p{margin:0 0 6px;text-align:justify}.d-c{text-align:center!important}.d-ementa{margin-left:45%!important;font-style:italic}
.d-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0 12px}.d-kpi{border:1px solid #e2e8f0;border-top:3px solid #1e3a8a;border-radius:6px;padding:7px 9px}.d-kpi small{display:block;color:#64748b;font-size:8.5pt}.d-kpi b{display:block;font-size:15pt}.d-kpi span{display:block;font-size:8pt;color:#64748b}
.d-tab{width:100%;border-collapse:collapse;margin:6px 0 12px;font-size:9.5pt}.d-tab.pq{font-size:8.5pt}.d-tab th{background:#e2e8f0;text-align:left;padding:4px 6px;border:1px solid #cbd5e1}.d-tab td{padding:3px 6px;border:1px solid #e2e8f0;vertical-align:top}.d-tab .dir{text-align:right}.d-vz{text-align:center;color:#94a3b8}
.minuta .d-tab th{background:#eee;border-color:#000}.minuta .d-tab td{border-color:#000}
.d-barras{margin:6px 0 12px}.d-bar{display:grid;grid-template-columns:200px 1fr 90px;gap:8px;align-items:center;font-size:9.5pt;margin-bottom:3px}.d-bar .t{height:9px;background:#f1f5f9;border-radius:5px;overflow:hidden}.d-bar .t i{display:block;height:100%}.d-bar b{text-align:right}
.d-lista p{margin:0 0 2px}.d-alertas p{padding:5px 9px;border-left:3px solid #2563eb;background:#f8fafc;margin:0 0 4px}.d-al.alerta{border-color:#dc2626}.d-al.atencao{border-color:#d97706}.d-al.ok{border-color:#16a34a}
.d-nota{font-size:8.5pt;color:#64748b}.d-quebra{page-break-after:always;height:1px}
.d-ass{text-align:center!important;margin-top:40px}
.d-aut{display:flex;gap:16px;align-items:center;border:1px solid #cbd5e1;border-radius:8px;padding:12px;margin-top:24px;page-break-inside:avoid}.d-aut p{margin:2px 0;font-size:9.5pt}.d-aut .pq{color:#64748b;font-size:8.5pt}`;
/* ===================== CAPA DOS DOCUMENTOS (igual à página inicial) ===================== */
function numerosCapa(){
  try { const X = distanciasMT(), mun = new Set(X.lista.map(e => chaveMun(e.e.municipio || ''))).size;
    return [[fmtN(X.lista.length), 'escolas'], [fmtN(X.dres.length), 'DREs'], [fmtN(mun), 'municípios'], [fmtN(setoresOficiais().filter(s => s.status !== 'Extinto').length), 'setores']]; }
  catch (e) { return [['631', 'escolas'], ['13', 'DREs'], ['142', 'municípios']]; }
}
function blocoCapa(tipoNome, titulo, sub, emis, filtros){
  const d = new Date(), dia = d.toLocaleDateString('pt-BR', { weekday:'long' });
  return { t:'capa', tipoNome, titulo, sub:sub || SISTEMA_ORG, codigo:emis.codigo, data:emis.data, quando:emis.quando, dia:dia.charAt(0).toUpperCase() + dia.slice(1),
    hora:d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }), por:emis.por || '—', filtros:(filtros || []).filter(f => f && f[1] !== undefined && f[1] !== ''), nums:numerosCapa() };
}
function filtrosRel(F, sec, T){
  const FG = Object.assign({ cor:'tipo', vinculos:false, ligacoes:false, nomes:false, mapaTam:'pagina' }, F.fig || {}), sn = v => v ? 'Sim' : 'Não', P = DB.propostas || [];
  const temMapa = sec.some(k => /^mapa/.test(k)), temOrg = sec.some(k => /^org|ficha/.test(k));
  return [['Abrangência', relNomeArea(F.area)], ['DRE', F.dre ? nomeDRE(F.dre) : 'Todas as DREs'], F.setor ? ['Setor (ficha)', nomeSetor(F.setor)] : null,
    ['Propostas', F.props === '*' ? 'Todas (' + P.length + ')' : (F.props || []).map(id => (P.find(p => p.id === id) || {}).nome).filter(Boolean).join(', ') || 'Nenhuma'],
    ['Seções', `${sec.length} de ${Object.keys(T).length}`], temOrg ? ['Cores do organograma', MODOS_COR_ORG[FG.cor] || FG.cor] : null, temOrg ? ['Vínculos entre setores', sn(FG.vinculos)] : null,
    temMapa ? ['Tamanho dos mapas', { pagina:'Página inteira', ampliado:'Página inteira + 4 detalhes', compacto:'Compacto' }[FG.mapaTam] || FG.mapaTam] : null, temMapa ? ['Ligações escola–DRE', sn(FG.ligacoes)] : null, temMapa ? ['Nomes dos municípios', sn(FG.nomes)] : null,
    ['Orientação', F.orient === 'paisagem' ? 'Paisagem' : 'Retrato'], ['Sumário', sn(F.sumario !== false)], F.obs ? ['Observação', F.obs] : null].filter(Boolean);
}
function filtrosPort(o){
  const p = o.cenario && (DB.propostas || []).find(x => x.id === o.cenario), an = [o.comp && 'competências', o.cargos && 'quadro de chefias', o.titulares && 'titulares', o.alteracoes && 'alterações', o.implantacao && 'cronograma'].filter(Boolean);
  return [['Estrutura de base', p ? p.nome : 'Estrutura vigente'], ['Abrangência', relNomeArea(o.area)], ['Número / ano', `${o.numero || '[número]'} / ${o.ano || '—'}`], ['Data do ato', o.data ? fmtDia(o.data) : '—'],
    ['Decreto citado', o.decreto || '—'], ['Assinatura', o.signatario || 'Secretário(a) de Estado de Educação'], ['Conteúdo incluído', an.join(', ') || 'somente a estrutura']];
}
function filtrosDec(o){ const p = o.cenario && (DB.propostas || []).find(x => x.id === o.cenario);
  return [['Estrutura de base', p ? p.nome : 'Estrutura vigente'], ['Número', o.numero || '[número]'], ['Data', o.data ? fmtDia(o.data) : '—'], ['Ato alterado', o.ato || '—'], ['Competências', o.comp ? 'Incluídas' : 'Não'], ['Cargos', o.cargos ? 'Incluídos' : 'Não']]; }
const cortaTxt = (t, n) => { t = String(t ?? ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
/* fundo da capa (SVG da página inteira) */
function fundoCapaSVG(PW, PH, G){
  const art = (x, y, k, op) => `<g transform="translate(${x},${y}) scale(${k})" opacity="${op}"><g fill="none" stroke="#93c5fd" stroke-width="1.6"><path d="M300 120V170H120V230M300 170H480V230M300 170V230M120 290V340H60V390M120 340H180V390M300 290V340M480 290V340H420V390M480 340H540V390"/></g><g fill="#bfdbfe"><rect x="250" y="88" width="100" height="32" rx="7"/><rect x="70" y="230" width="100" height="60" rx="7" opacity=".7"/><rect x="250" y="230" width="100" height="60" rx="7" opacity=".7"/><rect x="430" y="230" width="100" height="60" rx="7" opacity=".7"/><rect x="30" y="390" width="60" height="34" rx="6" opacity=".45"/><rect x="150" y="390" width="60" height="34" rx="6" opacity=".45"/><rect x="270" y="340" width="60" height="34" rx="6" opacity=".45"/><rect x="390" y="390" width="60" height="34" rx="6" opacity=".45"/><rect x="510" y="390" width="60" height="34" rx="6" opacity=".45"/></g></g>`;
  const { cx, card:k, pill } = G;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" width="${PW}" height="${PH}"><defs>
    <radialGradient id="cg1" cx="0.18" cy="0" r="0.8"><stop offset="0" stop-color="#1d4ed8" stop-opacity=".95"/><stop offset=".6" stop-color="#1d4ed8" stop-opacity="0"/></radialGradient>
    <radialGradient id="cg2" cx="1" cy="1" r="0.7"><stop offset="0" stop-color="#0e7490" stop-opacity=".9"/><stop offset=".55" stop-color="#0e7490" stop-opacity="0"/></radialGradient>
    <linearGradient id="cg3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b82f6"/><stop offset=".5" stop-color="#22d3ee"/><stop offset="1" stop-color="#7dd3fc"/></linearGradient></defs>
    <rect width="${PW}" height="${PH}" fill="#0b1222"/><rect width="${PW}" height="${PH}" fill="url(#cg1)"/><rect width="${PW}" height="${PH}" fill="url(#cg2)"/>
    ${art(G.artX, G.artY, G.artK, .13)}${art(G.art2X, G.art2Y, G.art2K, .07)}
    <circle cx="${cx}" cy="${G.icY + G.ic / 2}" r="${G.ic * .95}" fill="#3b82f6" fill-opacity=".14"/>
    <rect x="${cx - pill / 2}" y="${G.pillY}" width="${pill}" height="20" rx="10" fill="#1e40af" fill-opacity=".55" stroke="#60a5fa" stroke-width=".8"/>
    <rect x="${k.x}" y="${k.y + 7}" width="${k.w}" height="${k.h}" rx="16" fill="#020617" fill-opacity=".35"/>
    <rect x="${k.x}" y="${k.y}" width="${k.w}" height="${k.h}" rx="14" fill="#ffffff"/>
    <rect x="${k.x}" y="${k.y}" width="${k.w}" height="12" rx="6" fill="url(#cg3)"/><rect x="${k.x}" y="${k.y + 5}" width="${k.w}" height="9" fill="#ffffff"/>
    <rect x="${k.x + 18}" y="${k.y + k.sep}" width="${k.w - 36}" height=".8" fill="#e2e8f0"/>
    <rect x="${G.fx}" y="${PH - 46}" width="${G.fw}" height=".6" fill="#93c5fd" fill-opacity=".35"/></svg>`;
}
function capaPDF(b, PW, PH){
  const land = PW > PH, A = (x, y, w, c) => ({ absolutePosition:{ x, y }, table:{ widths:[w], body:[[c]] }, layout:{ hLineWidth:() => 0, vLineWidth:() => 0, paddingLeft:() => 0, paddingRight:() => 0, paddingTop:() => 0, paddingBottom:() => 0 } });
  const hx = land ? 30 : 40, hw = land ? 400 : PW - 80, cx = hx + hw / 2;
  const G = land ? { ic:52, icY:84, brY:142, br:44, slY:196, nmY:222, pillY:292, tiY:320, tiMax:3, card:{ x:452, y:34, w:PW - 486, h:PH - 68 }, artX:-40, artY:300, artK:.75, art2X:560, art2Y:-60, art2K:.5 }
                 : { ic:60, icY:80, brY:148, br:50, slY:208, nmY:236, pillY:304, tiY:332, tiMax:2, card:{ x:36, y:430, w:PW - 72, h:PH - 430 - 62 }, artX:330, artY:-40, artK:.55, art2X:-90, art2Y:560, art2K:.5 };
  const k = G.card, tipo = String(b.tipoNome || 'Documento').toUpperCase(); G.cx = cx; G.pill = Math.max(110, tipo.length * 6.4 + 34); G.fx = hx; G.fw = hw;
  k.sep = land ? 182 : 146;
  let tf = 21, cpl = hw / (tf * .53), ln = Math.ceil(String(b.titulo).length / cpl); if (ln > G.tiMax) { tf = 16.5; cpl = hw / (tf * .53); ln = Math.min(G.tiMax + 1, Math.ceil(String(b.titulo).length / cpl)); }
  const N = [];
  N.push(A(hx, 34, hw, { stack:[{ text:'SECRETARIA DE ESTADO DE EDUCAÇÃO', bold:true, fontSize:9.5, color:'#ffffff', characterSpacing:1.3 }, { text:'Gabinete do Secretário', fontSize:9, color:'#bfdbfe', margin:[0, 2, 0, 0] }], alignment:'center' }));
  N.push({ svg:logoPDF(G.ic), width:G.ic, height:G.ic, absolutePosition:{ x:cx - G.ic / 2, y:G.icY } });
  N.push(A(hx, G.brY, hw, { text:[{ text:'GAB', color:'#ffffff' }, { text:'Org', color:'#7dd3fc' }], bold:true, fontSize:G.br, alignment:'center', characterSpacing:-1, lineHeight:1 }));
  N.push(A(hx, G.slY, hw, { text:'ORGANIZAÇÃO INSTITUCIONAL', bold:true, fontSize:10, color:'#bfdbfe', characterSpacing:3.2, alignment:'center' }));
  const nums = b.nums || [], nw = 78; N.push(A(cx - nums.length * nw / 2, G.nmY, nums.length * nw, { columns:nums.map(([v, r]) => ({ width:nw, stack:[{ text:v, bold:true, fontSize:17, color:'#ffffff', alignment:'center', lineHeight:1 }, { text:r.toUpperCase(), fontSize:6.5, color:'#93c5fd', characterSpacing:.8, alignment:'center', margin:[0, 3, 0, 0] }] })), columnGap:0 }));
  N.push(A(cx - G.pill / 2, G.pillY + 6, G.pill, { text:tipo, bold:true, fontSize:7.5, color:'#dbeafe', characterSpacing:1.5, alignment:'center', lineHeight:1 }));
  N.push(A(hx, G.tiY, hw, { stack:[{ text:b.titulo, bold:true, fontSize:tf, color:'#ffffff', alignment:'center', lineHeight:1.12 }, { text:b.sub || '', fontSize:9.5, color:'#93c5fd', alignment:'center', margin:[0, 6, 0, 0] }] }));
  // cartão
  const cel = (r, v, f) => ({ stack:[{ text:r.toUpperCase(), fontSize:6.3, color:'#64748b', characterSpacing:.6 }, { text:String(v), bold:true, fontSize:f || 10.5, color:'#0f2557', margin:[0, 2, 0, 0] }] });
  const sel = land ? 100 : 116, ix = k.x + 22 + sel + 18, iw = k.x + k.w - 20 - ix;
  N.push({ svg:seloSVG(b.codigo, b.data, sel), width:sel, height:sel, absolutePosition:{ x:k.x + 20, y:k.y + 26 } });
  if (land) { [['Dia', b.dia], ['Data', b.data], ['Hora', b.hora], ['Emitido por', b.por]].forEach(([r, v], i) => N.push(A(ix, k.y + 24 + i * 28, iw, cel(r, cortaTxt(v, 34), 10)))); N.push(A(k.x + 20, k.y + 142, k.w - 40, { columns:[cel('Código de verificação', b.codigo, 12), cel('Tipo de documento', b.tipoNome, 10)] })); }
  else { const cw = iw / 2; [[['Dia', b.dia], ['Data', b.data]], [['Hora', b.hora], ['Emitido por', cortaTxt(b.por, 30)]]].forEach((l, i) => N.push(A(ix, k.y + 26 + i * 38, iw, { columns:l.map(([r, v]) => Object.assign(cel(r, v), { width:cw })) }))); N.push(A(ix, k.y + 26 + 76, iw, cel('Código de verificação', b.codigo, 12.5))); }
  const fy = k.y + k.sep + 12, F = b.filtros || [], rh = land ? 25 : 21, maxR = Math.floor((k.y + k.h - 28 - (fy + 18)) / rh), col = F.length > maxR * 2 && !land ? 3 : 2, fwc = (k.w - 40 - 14 * (col - 1)) / col, cap = maxR * col;
  N.push(A(k.x + 20, fy, k.w - 40, { columns:[{ text:'FILTROS E OPÇÕES UTILIZADOS', bold:true, fontSize:7.5, color:'#1e3a8a', characterSpacing:1 }, { text:`${F.length} item(ns)`, fontSize:7, color:'#94a3b8', alignment:'right' }] }));
  const L = F.length > cap ? F.slice(0, cap - 1).concat([['…', `e mais ${F.length - cap + 1} opção(ões)`]]) : F;
  L.forEach(([r, v], i) => { const c = i % col, l = Math.floor(i / col); N.push(A(k.x + 20 + c * (fwc + 14), fy + 18 + l * rh, fwc, { columns:[{ canvas:[{ type:'rect', x:0, y:1, w:3, h:rh - 6, r:1.5, color:['#3b82f6', '#0e7490', '#7c3aed', '#16a34a', '#d97706', '#db2777'][i % 6] }], width:9 }, { stack:[{ text:String(r).toUpperCase(), fontSize:6, color:'#64748b', characterSpacing:.5 }, { text:cortaTxt(v, Math.floor(fwc / 4.4)), bold:true, fontSize:8.2, color:'#0f172a', margin:[0, 1, 0, 0] }] }] })); });
  N.push(A(k.x + 20, k.y + k.h - 22, k.w - 40, { text:[{ text:'Autenticidade: ', bold:true, color:'#1e3a8a' }, { text:'confira o código no GABOrg › Relatórios e minutas › Verificar código.', color:'#64748b' }], fontSize:7, alignment:'center' }));
  const pe = { stack:[{ text:'Governo de Mato Grosso · Secretaria de Estado de Educação', fontSize:7.5, color:'#93c5fd', alignment:'center' }, { text:'Documento gerado pelo GABOrg · ' + b.codigo, fontSize:6.5, color:'#64748b', alignment:'center', margin:[0, 2, 0, 0] }], margin:[hx, 12, PW - hx - hw, 0] };
  return { bg:fundoCapaSVG(PW, PH, G), nodes:N, pe };
}
/* capa em HTML (prévia, impressão e Word) */
function capaHTML(b){
  const F = b.filtros || [], nums = b.nums || [];
  return `<div class="d-capa nova"><div class="dc-topo"><b>SECRETARIA DE ESTADO DE EDUCAÇÃO</b><span>Gabinete do Secretário</span></div>
    <div class="dc-hero">${logoPDF(58)}<div class="dc-marca">GAB<i>Org</i></div><div class="dc-slogan">ORGANIZAÇÃO INSTITUCIONAL</div>
    <div class="dc-nums">${nums.map(([v, r]) => `<span><b>${esc(v)}</b>${esc(r)}</span>`).join('')}</div>
    <span class="dc-pill">${esc(String(b.tipoNome || 'Documento').toUpperCase())}</span><h1>${esc(b.titulo)}</h1><p class="dc-sub">${esc(b.sub || '')}</p></div>
    <div class="dc-card"><div class="dc-id"><div class="dc-selo">${seloSVG(b.codigo, b.data, 116)}</div><div class="dc-info">
      <div><small>Dia</small><b>${esc(b.dia || '')}</b></div><div><small>Data</small><b>${esc(b.data || '')}</b></div><div><small>Hora</small><b>${esc(b.hora || '')}</b></div><div><small>Emitido por</small><b>${esc(b.por || '—')}</b></div><div class="lg"><small>Código de verificação</small><b>${esc(b.codigo)}</b></div></div></div>
      ${F.length ? `<div class="dc-fil"><h4>Filtros e opções utilizados</h4><div>${F.map(([r, v], i) => `<p style="--c:${['#3b82f6', '#0e7490', '#7c3aed', '#16a34a', '#d97706', '#db2777'][i % 6]}"><small>${esc(r)}</small><b>${esc(v)}</b></p>`).join('')}</div></div>` : ''}
      <p class="dc-aut"><b>Autenticidade:</b> confira o código no GABOrg › Relatórios e minutas › Verificar código.</p></div>
    <div class="dc-pe">Governo de Mato Grosso · Secretaria de Estado de Educação</div></div>`;
}
/* ícone do sistema para o PDF (quadrado em degradê com o organograma) */
function logoPDF(t){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34" width="${t}" height="${t}"><defs><linearGradient id="lgP" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#0e7490"/></linearGradient></defs><rect width="34" height="34" rx="9" fill="url(#lgP)"/><rect x="0.6" y="0.6" width="32.8" height="32.8" rx="8.5" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="1"/>
  <g fill="#ffffff"><rect x="13" y="7" width="8" height="6" rx="1.4"/><rect x="6" y="21" width="7" height="6" rx="1.4"/><rect x="13.5" y="21" width="7" height="6" rx="1.4"/><rect x="21" y="21" width="7" height="6" rx="1.4"/></g><path d="M17 13v4M9.5 21v-4h15v4M17 17v4" fill="none" stroke="#ffffff" stroke-width="1.6"/></svg>`; }
/* PDF com pdfmake (texto real, cabeçalho, rodapé e páginas numeradas) */
async function carregarPdfMake(){
  if (window.pdfMake && pdfMake.vfs) return;
  await carregarScript(['https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js', 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.10/build/pdfmake.min.js']);
  await carregarScript(['https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/vfs_fonts.js', 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.10/build/vfs_fonts.js']);
}
function docPDF(blocos, o){
  const lc = '#cbd5e1', layoutTab = { hLineWidth:() => .5, vLineWidth:() => .5, hLineColor:() => lc, vLineColor:() => lc, paddingLeft:() => 4, paddingRight:() => 4, paddingTop:() => 2, paddingBottom:() => 2 };
  const base = o.paisagem ? 'landscape' : 'portrait', mg = o.minuta ? [85, 60, 57, 55] : [50, 58, 50, 50];
  const larg = or => (or === 'landscape' ? 842 : 595) - mg[0] - mg[2], alt = or => (or === 'landscape' ? 595 : 842) - mg[1] - mg[3];
  let orient = base, pend = false, primeiro = true, ultH1 = -1, capaBg = '', capaPe = null; const conteudo = [];
  const legendaPDF = (it, W, nc) => { const cols = nc || (W > 600 ? 3 : 2), lin = []; for (let i = 0; i < it.length; i += cols) lin.push(it.slice(i, i + cols)); return { table:{ widths:Array(cols).fill('*'), body:lin.map(l => l.concat(Array(cols - l.length).fill(null)).map(x => x ? { columns:[x[2] ? { width:15, stack:[{ svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="11" height="11">${simbolo(x[2], 6, 6, 5.6, x[0])}</svg>`, width:10, height:10, margin:[0, .5, 0, 0] }] } : { canvas:[{ type:'rect', x:0, y:1, w:9, h:9, r:2, color:x[0], lineColor:'#94a3b8', lineWidth:.5 }], width:13 }, { text:x[1], fontSize:7.5 }] } : '')) }, layout:'noBorders', margin:[0, 4, 0, 2] }; };
  blocos.forEach(b => {
    const quer = b.t === 'fig' && b.paisagem && base === 'portrait' ? 'landscape' : base, ns = [], W = larg(quer);
    if (quer !== orient && !primeiro) pend = true;
    if (b.t === 'fig' && b.pagina && !primeiro) pend = true;
    let cabFig = null; if (b.t === 'fig' && !o.minuta && ultH1 >= 0 && ultH1 === conteudo.length - 2) { cabFig = conteudo.splice(ultH1); if (cabFig[0].pageBreak) pend = true; delete cabFig[0].pageBreak; delete cabFig[0].pageOrientation; delete cabFig[0].headlineLevel; cabFig[1].canvas[0].x2 = W; }
    switch (b.t) {
      case 'capa': if (b.tipoNome) { const pw = base === 'landscape' ? 842 : 595, ph = base === 'landscape' ? 595 : 842, C = capaPDF(b, pw, ph); capaBg = C.bg; capaPe = C.pe; ns.push(...C.nodes); break; } ns.push({ stack:[o.minuta ? { text:SISTEMA_NOME, style:'capaSup' } : '', { text:SISTEMA_ORG, style:'capaOrg', margin:[0, o.minuta ? 0 : 24, 0, 0] }, { text:b.titulo, style:'capaTit' }, b.sub ? { text:b.sub, style:'capaSub' } : '', { svg:seloSVG(b.codigo, b.data, 150), width:150, alignment:'center', margin:[0, 30, 0, 30] },
        { table:{ widths:[150, '*'], body:(b.linhas || []).map(([k, v]) => [{ text:k, color:'#475569' }, { text:String(v), bold:true }]) }, layout:{ hLineWidth:(i) => i ? .5 : 0, vLineWidth:() => 0, hLineColor:() => '#e2e8f0' }, margin:[40, 0, 40, 0] }] }); break;
      case 'sumario': ns.push({ toc:{ title:{ text:'Sumário', style:'h1' }, numberStyle:{ bold:true } } }); break;
      case 'h1': ns.push({ text:b.x, style:o.minuta ? 'mh1' : 'h1', tocItem:!o.minuta, headlineLevel:1 }); if (!o.minuta) ns.push({ canvas:[{ type:'line', x1:0, y1:0, x2:W, y2:0, lineWidth:1.2, lineColor:'#1e3a8a' }], margin:[0, 0, 0, 6] }); break;
      case 'h2': ns.push({ text:b.x, style:o.minuta ? 'mh2' : 'h2', headlineLevel:2 }); break;
      case 'h3': ns.push({ text:b.x, style:o.minuta ? 'mh3' : 'h3', headlineLevel:3 }); break;
      case 'p': ns.push({ text:runsPDF(b.x), alignment:b.centro ? 'center' : 'justify', italics:!!b.ementa, margin:[b.ementa ? W * .45 : (b.recuo || 0) * 20, b.ementa ? 8 : 0, 0, b.ementa ? 10 : 5] }); break;
      case 'kpis': { const cw = (W - 27) / 4; for (let i = 0; i < b.it.length; i += 4) { const l = b.it.slice(i, i + 4); ns.push({ columns:l.map(([r, v, s, c]) => ({ stack:[{ canvas:[{ type:'line', x1:0, y1:0, x2:cw, y2:0, lineWidth:2.5, lineColor:c || '#1e3a8a' }] }, { text:r, fontSize:7.5, color:'#64748b', margin:[0, 4, 0, 0] }, { text:String(v), fontSize:14, bold:true }, s ? { text:s, fontSize:7, color:'#64748b' } : ''] })).concat(Array(4 - l.length).fill({ text:'' })), columnGap:9, margin:[0, 2, 0, 8] }); } break; }
      case 'tab': { const dir = b.dir || [];
        ns.push({ table:{ headerRows:1, keepWithHeaderRows:1, widths:b.larg || b.cab.map(() => '*'), dontBreakRows:true, body:[b.cab.map((c, i) => ({ text:c, bold:true, fillColor:o.minuta ? '#eeeeee' : '#e2e8f0', alignment:dir.includes(i) ? 'right' : 'left' }))].concat(b.lin.length ? b.lin.map(l => l.map((c, i) => ({ text:String(celTxt(c) ?? ''), alignment:dir.includes(i) ? 'right' : 'left', fillColor:c && c.cor ? c.cor : undefined, bold:!!(c && c.b) }))) : [[{ text:'Sem registros.', colSpan:b.cab.length, alignment:'center', color:'#94a3b8' }].concat(Array(b.cab.length - 1).fill(''))]) },
          layout:o.minuta ? { hLineWidth:() => .5, vLineWidth:() => .5, paddingLeft:() => 4, paddingRight:() => 4 } : layoutTab, fontSize:b.pq ? 7.5 : 8.5, margin:[0, 3, 0, 10] }); break; }
      case 'barras': { if (!b.it.length) { ns.push({ text:'Sem dados.', color:'#94a3b8', margin:[0, 2, 0, 8] }); break; } const mx = Math.max(1, ...b.it.map(x => x[1])), bw = W - 260;
        ns.push({ table:{ widths:[160, bw, 80], body:b.it.map(([n, v, r, c, f]) => [f ? { columns:[{ svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="10" height="10">${simbolo(f, 6, 6, 5.6, c || '#2563eb')}</svg>`, width:10, height:10, margin:[0, 1, 0, 0] }, { text:n, fontSize:8.5 }], columnGap:5 } : { text:n, fontSize:8.5 }, { canvas:[{ type:'rect', x:0, y:2, w:bw, h:7, r:3, color:'#f1f5f9' }, { type:'rect', x:0, y:2, w:Math.max(1, v / mx * bw), h:7, r:3, color:c || '#2563eb' }] }, { text:String(r ?? fmtN(v)), alignment:'right', bold:true, fontSize:8.5 }]) }, layout:'noBorders', margin:[0, 2, 0, 10] }); break; }
      case 'lista': b.it.forEach(([x, n]) => ns.push({ text:runsPDF(x), margin:[(n || 0) * 16, 0, 0, 2], fontSize:o.minuta ? 12 : 9.5 })); break;
      case 'alertas': if (!b.it.length) break; ns.push({ table:{ widths:[3, '*'], body:b.it.map(([t, x]) => [{ text:'', fillColor:{ alerta:'#dc2626', atencao:'#d97706', ok:'#16a34a' }[t] || '#2563eb' }, { text:runsPDF(x), fillColor:'#f8fafc', margin:[4, 2, 2, 2] }]) }, layout:{ hLineWidth:() => 2, hLineColor:() => '#ffffff', vLineWidth:() => 0 }, margin:[0, 2, 0, 10] }); break;
      case 'legenda': ns.push(legendaPDF(b.it, W)); break;
      case 'nota': ns.push({ text:runsPDF(b.x), fontSize:7.5, color:'#64748b', margin:[0, 2, 0, 8] }); break;
      case 'quebra': pend = true; break;
      case 'fig': { const sang = b.pagina ? Math.min(mg[0], mg[2]) - 18 : 0, WF = W + 2 * sang, lc_ = b.mapa && W > 450 ? 3 : W > 600 ? 3 : 2, nl = b.nota ? Math.ceil(b.nota.length / (W / 4.3)) : 0;
        const hMax = alt(quer) - 17 - 30 - nl * 10 - (b.leg && b.leg.length ? 18 + Math.ceil(b.leg.length / lc_) * 14.5 : 0) - (cabFig ? 50 : 0) - 10, esc_ = Math.min(WF / b.w, hMax / b.h, 1.6);
        const iw = b.w * esc_, img = { svg:b.svg, width:iw, height:b.h * esc_, margin:[(W - iw) / 2, 0, 0, 0] };
        ns.push({ stack:(cabFig || []).concat([b.mini ? { columns:[{ text:`Figura ${b.num} – ${b.titulo}`, bold:true, fontSize:10, color:'#1e3a8a', width:'*' }, { svg:b.mini, width:30, height:29 }], columnGap:8, margin:[0, 0, 0, 4] } : { text:`Figura ${b.num} – ${b.titulo}`, bold:true, fontSize:10, color:'#1e3a8a', margin:[0, 0, 0, 4] }, img,
          b.leg && b.leg.length ? { stack:[{ text:'Legenda', bold:true, fontSize:8, margin:[0, 6, 0, 0] }, legendaPDF(b.leg, W, lc_)] } : '', b.nota ? { text:b.nota, fontSize:7.5, color:'#475569', margin:[0, 3, 0, 0] } : '', { text:b.fonte || '', fontSize:7, color:'#64748b', italics:true, margin:[0, 2, 0, 8] }]), unbreakable:true });
        if (quer === 'landscape' && base === 'portrait') pend = true; break; }
      case 'ass': ns.push({ stack:[{ text:'______________________________________', alignment:'center', margin:[0, 30, 0, 0] }, { text:b.x, bold:true, alignment:'center' }, b.sub ? { text:b.sub, alignment:'center' } : ''], unbreakable:true }); break;
      case 'selo': ns.push({ table:{ widths:[100, '*'], body:[[{ svg:seloSVG(b.codigo, b.data, 96), width:96 }, { stack:[{ text:'Autenticação', bold:true, margin:[0, 6, 0, 4] }, { text:`Documento gerado pelo ${SISTEMA_NOME} em ${b.quando}${b.por ? ' por ' + b.por : ''}.`, fontSize:9 }, { text:[{ text:'Código de verificação: ', fontSize:9 }, { text:b.codigo, bold:true, fontSize:10 }], margin:[0, 4, 0, 4] }, { text:'Para conferir, abra o GABOrg › Relatórios e minutas › Verificar código.', fontSize:8, color:'#64748b' }] }]] }, layout:{ hLineWidth:() => .6, vLineWidth:() => .6, hLineColor:() => lc, vLineColor:() => lc, paddingLeft:() => 8, paddingTop:() => 6, paddingBottom:() => 6 }, margin:[0, 18, 0, 0], unbreakable:true }); break;
    }
    if (!ns.length) return;
    ultH1 = b.t === 'h1' ? conteudo.length : -1;
    if ((pend || quer !== orient) && !primeiro) { ns[0] = Object.assign(ns[0].stack || ns[0].table || ns[0].text !== undefined || ns[0].toc || ns[0].canvas || ns[0].columns ? ns[0] : { stack:[ns[0]] }, { pageBreak:'before', pageOrientation:quer }); }
    pend = (b.t === 'capa') || (b.t === 'fig' && ((quer === 'landscape' && base === 'portrait') || b.pagina)); orient = quer; primeiro = false;
    conteudo.push(...ns);
  });
  const capa1 = p => p === 1 && blocos[0] && blocos[0].t === 'capa', capaNova = p => capa1(p) && !!blocos[0].tipoNome;
  const cab = (p, n, pg) => { if (capaNova(p)) return null; if (o.minuta) return { columns:[{ text:SISTEMA_NOME, color:'#64748b', fontSize:7.5 }, { text:`${o.titulo} · ${o.quando}`, alignment:'right', color:'#64748b', fontSize:7.5 }], margin:[mg[0], 26, mg[2], 0] };
    const L = pg.width, hB = capa1(p) ? 62 : 40, ic = capa1(p) ? 32 : 22, yi = (hB - ic) / 2;
    return [{ canvas:[{ type:'rect', x:0, y:0, w:L, h:hB, linearGradient:['#0f2557', '#1e40af', '#0e7490'] }, { type:'rect', x:0, y:hB, w:L, h:2.5, linearGradient:['#3b82f6', '#22d3ee', '#7dd3fc'] }], absolutePosition:{ x:0, y:0 } },
      { svg:logoPDF(ic), width:ic, height:ic, absolutePosition:{ x:mg[0], y:yi } },
      { stack:[{ text:[{ text:'GAB', color:'#ffffff' }, { text:'Org', color:'#7dd3fc' }], bold:true, fontSize:capa1(p) ? 17 : 12.5, lineHeight:1 }, { text:capa1(p) ? 'Organização Institucional · ' + SISTEMA_ORG : 'Organização Institucional · SEDUC-MT', fontSize:capa1(p) ? 8 : 6.8, color:'#bfdbfe', lineHeight:1, margin:[0, 2, 0, 0] }], absolutePosition:{ x:mg[0] + ic + 9, y:capa1(p) ? 15 : 9.5 } },
      capa1(p) ? '' : { stack:[{ text:o.titulo, bold:true, fontSize:8.5, color:'#ffffff', alignment:'right', lineHeight:1 }, { text:`Emitido em ${o.quando} · ${o.codigo}`, fontSize:6.8, color:'#bfdbfe', alignment:'right', lineHeight:1, margin:[0, 2.5, 0, 0] }], margin:[L / 2, 11, mg[2], 0] }]; };
  return { pageSize:'A4', pageOrientation:base, pageMargins:mg, info:{ title:o.titulo, author:SISTEMA_NOME, subject:o.codigo, creator:'GABOrg' },
    watermark:o.minuta && !capaNova(1) ? { text:'MINUTA', color:'#1e3a8a', opacity:.06, bold:true } : undefined,
    background:(p, pg) => capaNova(p) && capaBg ? { svg:capaBg, width:pg.width, height:pg.height, absolutePosition:{ x:0, y:0 } } : o.minuta && capaNova(1) ? { svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pg.width} ${pg.height}" width="${pg.width}" height="${pg.height}"><text x="${pg.width / 2}" y="${pg.height / 2}" transform="rotate(-52 ${pg.width / 2} ${pg.height / 2})" text-anchor="middle" font-family="Helvetica" font-weight="bold" font-size="${pg.width / 4.6}" fill="#1e3a8a" fill-opacity=".06">MINUTA</text></svg>`, width:pg.width, height:pg.height, absolutePosition:{ x:0, y:0 } } : null,
    header:cab, footer:(p, n, pg) => capaNova(p) ? capaPe : o.minuta ? { columns:[{ text:`Código ${o.codigo} · emitido em ${o.quando}`, color:'#64748b', fontSize:7.5 }, { text:`Página ${p} de ${n}`, alignment:'right', color:'#64748b', fontSize:7.5 }], margin:[mg[0], 18, mg[2], 0] }
      : { stack:[{ canvas:[{ type:'rect', x:0, y:0, w:pg.width - mg[0] - mg[2], h:1.2, linearGradient:['#1e40af', '#0e7490', '#7dd3fc'] }] }, { columns:[{ text:[{ text:'GAB', bold:true, color:'#1e3a8a' }, { text:'Org', bold:true, color:'#0e7490' }, { text:`  ·  Código de verificação ${o.codigo}  ·  ${o.quando}`, color:'#64748b' }], fontSize:7.5 }, { text:[{ text:'Página ', color:'#64748b' }, { text:String(p), bold:true, color:'#1e3a8a' }, { text:` de ${n}`, color:'#64748b' }], alignment:'right', fontSize:7.5, width:80 }], margin:[0, 5, 0, 0] }], margin:[mg[0], 14, mg[2], 0] },
    content:conteudo, pageBreakBefore:(n) => !!n.headlineLevel && !n.pageBreak && n.startPosition && n.startPosition.verticalRatio > (n.headlineLevel === 1 ? .8 : .88),
    styles:{ h1:{ fontSize:14, bold:true, color:'#1e3a8a', margin:[0, 14, 0, 3] }, h2:{ fontSize:11.5, bold:true, margin:[0, 10, 0, 4] }, h3:{ fontSize:10, bold:true, color:'#334155', margin:[0, 8, 0, 3] }, mh1:{ fontSize:13, bold:true, alignment:'center', margin:[0, 6, 0, 6] }, mh2:{ fontSize:12, bold:true, alignment:'center', margin:[0, 12, 0, 6] }, mh3:{ fontSize:12, bold:true, alignment:'center', margin:[0, 8, 0, 4] },
      capaSup:{ fontSize:13, bold:true, color:'#1e3a8a', alignment:'center', margin:[0, 30, 0, 2] }, capaOrg:{ fontSize:9.5, color:'#475569', alignment:'center' }, capaTit:{ fontSize:22, bold:true, alignment:'center', margin:[0, 70, 0, 8] }, capaSub:{ fontSize:12, color:'#475569', alignment:'center' } },
    defaultStyle:{ font:'Roboto', fontSize:o.minuta ? 12 : 9.5, lineHeight:o.minuta ? 1.25 : 1.15 } };
}
/* emitir: gera o código, registra e entrega no formato pedido */
async function emitirDoc({ tipo, titulo, montar, minuta, formato, nomeArq, detalhe, paisagem, cfgRel, filtros }){
  const codigo = gerarCodigo(tipo), d = new Date(), data = d.toLocaleDateString('pt-BR'), quando = d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const emis = { codigo, data, quando, por:cfg.usuario || cfg.login || '' }, blocos = montar(emis), o = { codigo, data, quando, titulo, minuta, paisagem };
  if (!blocos.length || blocos[0].t !== 'capa' || !blocos[0].tipoNome) { if (blocos[0] && blocos[0].t === 'capa') blocos.shift(); blocos.unshift(blocoCapa({ REL:'Relatório', POR:'Minuta de portaria', DEC:'Minuta de decreto' }[tipo] || 'Documento', titulo, SISTEMA_ORG, emis, filtros)); }
  const nome = (nomeArq || 'gaborg') + '-' + codigo;
  if (formato === 'pdf') {
    toast('Gerando o PDF...');
    try { await carregarPdfMake(); } catch (e) { toast('Não foi possível carregar o gerador de PDF. Use Imprimir › Salvar como PDF.', 'aviso'); return; }
    await new Promise((ok, erro) => { try { pdfMake.createPdf(docPDF(blocos, o)).download(nome + '.pdf', ok); setTimeout(ok, 4000); } catch (e) { erro(e); } });
  } else if (formato === 'word') baixarWord(nome, titulo, `<style>${ESTILO_REL}</style>` + docHTML(blocos, { minuta, cabecalho:titulo + ' · ' + codigo }));
  else imprimirDoc(titulo, `<style>${ESTILO_REL}.d-capa{page-break-after:always}</style>` + docHTML(blocos, { minuta, cabecalho:titulo + ' · ' + codigo }));
  registrarEmissao(Object.assign({ c:codigo, tipo:{ REL:'Relatório', POR:'Minuta de portaria', DEC:'Minuta de decreto' }[tipo] || tipo, titulo, formato, det:detalhe || '' }, cfgRel ? { cfg:cfgRel } : {}));
  toast('Documento emitido: ' + codigo);
  return codigo;
}

/* ===================== RELATÓRIO COMPLETO: SEÇÕES SELECIONÁVEIS ===================== */
const REL_SECOES = [
  ['Visão geral', [['resumo', 'Resumo executivo e índice de maturidade'], ['kpis', 'Indicadores-chave'], ['areas', 'Painel por secretaria adjunta']]],
  ['Organogramas', [['orgGeral', 'Organograma geral (figura)'], ['orgAreas', 'Organograma de cada secretaria adjunta (figuras)'], ['orgProp', 'Organogramas das propostas com as alterações destacadas']]],
  ['Mapas de Mato Grosso', [['mapaMT', 'Mapa das escolas e DREs'], ['mapaDist', 'Mapa das distâncias até as DREs'], ['mapaMun', 'Mapa da divisão municipal'], ['mapaDRE', 'Mapa aproximado da DRE escolhida']]],
  ['Estrutura', [['estrutura', 'Estrutura hierárquica em lista'], ['quadro', 'Quadro de setores'], ['governanca', 'Amplitude de controle e qualidade do cadastro'], ['competencias', 'Competências repetidas e lacunas'], ['ficha', 'Ficha completa do setor escolhido']]],
  ['Pessoas e governança', [['servidores', 'Servidores: lotação, vínculos e cargos'], ['chefias', 'Chefias e sucessão'], ['riscos', 'Riscos e prioridades'], ['validacoes', 'Validações entre setores']]],
  ['Financeiro e propostas', [['financeiro', 'Custos e cargos em comissão'], ['propostas', 'Propostas: alterações, custo e metas']]],
  ['Rede escolar', [['rede', 'Rede escolar por DRE'], ['distancias', 'Distâncias das escolas até as DREs'], ['regional', 'Gestão regional e sugestões'], ['escolas', 'Lista de unidades escolares']]],
  ['Gestão', [['implantacao', 'Implantação: etapas e prazos'], ['metas', 'Pacto de resultados'], ['reunioes', 'Reuniões, decisões e encaminhamentos']]],
  ['Encerramento', [['notas', 'Notas metodológicas, fontes e legendas']]]
];
const REL_MODELOS = {
  executivo:['fa-briefcase', 'Executivo', ['resumo', 'kpis', 'orgGeral', 'mapaMT', 'areas', 'riscos', 'propostas', 'regional', 'notas']],
  completo:['fa-book', 'Completo', ['resumo', 'kpis', 'areas', 'orgGeral', 'orgAreas', 'mapaMT', 'mapaDist', 'estrutura', 'quadro', 'governanca', 'competencias', 'servidores', 'chefias', 'riscos', 'validacoes', 'financeiro', 'propostas', 'orgProp', 'rede', 'distancias', 'regional', 'implantacao', 'metas', 'reunioes', 'notas']],
  organograma:['fa-sitemap', 'Organogramas', ['kpis', 'orgGeral', 'orgAreas', 'governanca', 'chefias', 'notas']],
  mapas:['fa-map-location-dot', 'Mapas de MT', ['mapaMT', 'mapaDist', 'mapaMun', 'rede', 'notas']],
  rede:['fa-school', 'Rede escolar', ['rede', 'mapaMT', 'distancias', 'mapaDist', 'regional', 'escolas', 'notas']],
  financeiro:['fa-coins', 'Financeiro e propostas', ['kpis', 'financeiro', 'propostas', 'orgProp', 'implantacao', 'notas']],
  fichaDre:['fa-building-flag', 'Ficha de uma DRE', ['mapaDRE', 'rede', 'distancias', 'regional', 'escolas'], 'dre'],
  fichaSetor:['fa-id-card', 'Ficha de um setor', ['ficha', 'notas'], 'setor']
};
let relCfg = Object.assign({ titulo:'Relatório da estrutura organizacional', obs:'', area:'', dre:'', props:'*', secoes:REL_MODELOS.executivo[2].slice() }, store.get('gaborg_rel', {}));
const relNomeArea = a => a ? nomeCurto(porId.get(a)) : 'Toda a Secretaria';
function relTitulos(){ const m = {}; REL_SECOES.forEach(g => g[1].forEach(([k, n]) => m[k] = n)); return m; }
function montarRelatorio(F, emis){
  const T = relTitulos(), D = dadosInd(F.area), B = [], sec = F.secoes.filter(k => T[k]), FG = Object.assign({ cor:'tipo', vinculos:false, ligacoes:false, nomes:false, mapaTam:'pagina' }, F.fig || {});
  let nfig = 0; const FIG = (titulo, r, nota) => ({ t:'fig', num:++nfig, titulo, svg:r.svg, w:r.w, h:r.h, leg:r.leg, nota, fonte:'Fonte: GABOrg, dados de ' + emis.quando + (emis.codigo ? ' · ' + emis.codigo : ''), paisagem:r.w > r.h * 1.15, mapa:!!r.mapa, mini:r.mini || '', pagina:!!r.mapa && FG.mapaTam !== 'compacto' });
  const DET = (titulo, o, nota) => { if (FG.mapaTam !== 'ampliado') return; const ref = nfig; Object.keys(QUADRANTES_MT).forEach(q => { const r = mapaSVG(Object.assign({}, o, { recorte:q })); r.leg = []; r.mini = miniQuadranteMT(q); B.push(FIG(`${titulo} – detalhe ${QUADRANTES_MT[q]}`, r, `Ampliação do quadrante ${QUADRANTES_MT[q].toLowerCase()} da Figura ${ref}, com o nome dos municípios. Cores e símbolos conforme a legenda da Figura ${ref}.${nota ? ' ' + nota : ''}`)); }); };
  const E = distanciasMT(), dres = E.dres, dreOk = d => !F.dre || d === F.dre, P = (DB.propostas || []).filter(p => F.props === '*' || (F.props || []).includes(p.id));
  B.push(blocoCapa('Relatório', F.titulo || 'Relatório', SISTEMA_ORG, emis, filtrosRel(F, sec, T)));
  if (F.sumario !== false) B.push({ t:'sumario', it:sec.map(k => T[k]) });
  let n = 0; const H = k => B.push({ t:'h1', x:`${++n}. ${T[k]}` });
  const ser = D.base.reduce((t, s) => t + num(s.servidores), 0), cad = D.base.length ? Math.round(D.base.reduce((t, s) => t + cadSetor(s), 0) / D.base.length * 100) : 0;
  sec.forEach(k => {
    if (k === 'resumo') { H(k); const idx = D.porArea.length ? Math.round(D.porArea.reduce((t, x) => t + x.idx * x.n, 0) / Math.max(1, D.porArea.reduce((t, x) => t + x.n, 0))) : 0;
      B.push({ t:'kpis', it:[['Índice de maturidade', idx + ' / 100', '40% cadastro · 30% validação · 20% chefias · 10% risco', idx >= 75 ? '#16a34a' : idx >= 50 ? '#d97706' : '#dc2626']] });
      B.push({ t:'alertas', it:insightsInd(D, F.area).map(([t, h]) => [t, h.replace(/<[^>]+>/g, '')]) }); }
    if (k === 'kpis') { H(k); const ok = D.vals.filter(v => ['Aprovado', 'Aprovado com ressalvas'].includes(v.status)).length, M = metricasEstrutura(D.base);
      B.push({ t:'kpis', it:[['Setores ativos', fmtN(D.base.length), M.niveis + ' níveis hierárquicos'], ['Chefias', fmtN(D.chefias.length), D.chefias.filter(s => !s.responsavel).length + ' sem responsável', '#7c3aed'], ['Servidores informados', fmtN(ser), D.base.reduce((t, s) => t + num(s.comissionados), 0) + ' comissionados', '#0891b2'], ['Unidades escolares', fmtN(D.E.length), dres.length + ' DREs', '#16a34a'], ['Amplitude média', M.ampMedia.toLocaleString('pt-BR', { maximumFractionDigits:1 }), 'subordinados por chefia', '#0e7490'], ['Custo anual atual', fmtRc(D.custo.Atual.a), 'mensal ' + fmtRc(D.custo.Atual.m), '#2563eb'], ['Validações concluídas', pct(ok, D.vals.length) + '%', D.pend.length + ' pendentes', '#d97706'], ['Cadastro completo', cad + '%', 'responsável, competências, entregas...', '#7c3aed']] }); }
    if (k === 'areas') { H(k); B.push({ t:'tab', cab:['Área', 'Setores', 'Chefias', 'Servidores', 'Custo anual', 'Cadastro', 'Validados', 'Sem resp.', 'Em risco', 'Índice'], dir:[1, 2, 3, 4, 5, 6, 7, 8, 9], larg:['*', 38, 38, 48, 58, 40, 42, 36, 36, 34], pq:true,
      lin:D.porArea.slice().sort((a, b) => b.n - a.n).map(x => [x.nome, x.n, x.ch, fmtN(x.ser), x.ca ? fmtRc(x.ca) : '—', Math.round(x.cad) + '%', x.val + '%', x.semResp, x.risco, { x:x.idx, b:true, cor:x.idx >= 75 ? '#dcfce7' : x.idx >= 50 ? '#fef3c7' : '#fee2e2' }]) }); }
    if (k === 'estrutura') { H(k); const M = metricasEstrutura(D.base), lin = [];
      const vis = (pai, nv) => (M.fil.get(pai) || []).slice().sort((a, b) => num(a.ordem) - num(b.ordem) || a.nome.localeCompare(b.nome, 'pt-BR')).forEach(s => { lin.push([[[s.nome + (s.sigla ? ' (' + s.sigla + ')' : ''), nv < 2], ` — ${s.tipo}${s.responsavel ? ' · ' + s.responsavel : ''}${s.tipo === 'Unidades Escolares' && num(s.quantidade) ? ' · ' + fmtN(s.quantidade) + ' unidades' : ''}`], Math.min(nv, 6)]); vis(s.id, nv + 1); });
      vis('', 0); B.push({ t:'p', x:`${fmtN(D.base.length)} setores ativos em ${M.niveis} níveis${F.area ? ' na área ' + relNomeArea(F.area) : ''}.` }, { t:'lista', it:lin }); }
    if (k === 'quadro') { H(k); B.push({ t:'tab', pq:true, cab:['Setor', 'Tipo', 'Responsável', 'Serv.', 'Impacto', 'Validação'], larg:['*', 70, 90, 30, 50, 70], dir:[3], lin:D.base.slice().sort((a, b) => (prof.get(a.id) || 0) - (prof.get(b.id) || 0) || a.nome.localeCompare(b.nome, 'pt-BR')).map(s => [s.nome + (s.sigla ? ' · ' + s.sigla : ''), s.tipo, s.responsavel || '—', s.servidores || '—', IMPACTO[num(s.impacto)][0], statusVal(s.id)]) }); }
    if (k === 'governanca') { H(k); const M = metricasEstrutura(D.base);
      B.push({ t:'h3', x:'Qualidade do cadastro' }, { t:'barras', it:CAMPOS_CAD.map(([c, nm]) => { const v = pct(D.base.filter(s => c === 'impacto' ? num(s.impacto) > 0 : c === 'servidores' ? String(s.servidores ?? '') !== '' : String(s[c] || '').trim()).length, D.base.length); return [nm, v, v + '%', v >= 75 ? '#16a34a' : v >= 50 ? '#eab308' : '#dc2626']; }) });
      B.push({ t:'h3', x:'Chefias com mais de 8 setores subordinados' }, { t:'tab', cab:['Chefia', 'Subordinados diretos'], larg:['*', 90], dir:[1], lin:M.comSub.filter(x => x[1] > 8).sort((a, b) => b[1] - a[1]).map(([s, q]) => [s.nome, q]) });
      B.push({ t:'h3', x:'Chefias com apenas 1 setor subordinado' }, { t:'tab', cab:['Chefia', 'Único subordinado'], lin:M.comSub.filter(x => x[1] === 1).map(([s]) => [s.nome, ((M.fil.get(s.id) || [])[0] || {}).nome || '']) }); }
    if (k === 'competencias') { H(k); const C = baseCompetencias(), ref = String(param('atribuicoes', '') || '').split('\n').map(limparComp).filter(t => t.length > 8);
      B.push({ t:'p', x:`${fmtN(C.C.length)} competências cadastradas em ${new Set(C.C.map(c => c.s.id)).size} setores. ${C.pares.length} pares de competências parecidas em setores diferentes.` });
      B.push({ t:'tab', pq:true, cab:['Semelhança', 'Setor A', 'Competência A', 'Setor B', 'Competência B'], larg:[42, 70, '*', 70, '*'], lin:C.pares.slice(0, 60).map(p => [Math.round(p.sim * 100) + '%', nomeCurto(p.a.s), p.a.t, nomeCurto(p.b.s), p.b.t]) });
      if (ref.length) { const lac = ref.map(t => ({ t, m:melhorSetorPara(t, C) })).filter(x => !x.m || x.m.sim < .3 || x.m.n < 2); B.push({ t:'h3', x:`Atribuições de referência sem setor responsável (${lac.length} de ${ref.length})` }, { t:'lista', it:lac.map(x => ['• ' + x.t, 0]) }); } }
    if (k === 'servidores') { H(k); const ids = F.area ? new Set([F.area, ...descendentes(F.area)]) : null, sigA = F.area ? String((porId.get(F.area) || {}).sigla || '').toUpperCase() : '';
      const SL = svLista().filter(r => (!ids || ids.has(r.setorId) || (sigA && r.unidade === sigA)) && (!F.dre || norm(r.unidade) === norm(F.dre))), SD = svDados(SL), imp = param('servidoresImport', null);
      if (!SD.n) B.push({ t:'p', x:'Nenhum servidor importado para este recorte. Importe a planilha de lotação em Servidores › Importar planilha.' });
      else {
        B.push({ t:'kpis', it:[['Servidores', fmtN(SD.n), `${fmtN(SD.oc)} Órgão Central · ${fmtN(SD.dre)} DREs`, '#1e3a8a'], ['Efetivos', fmtN(SD.efet), pct(SD.efet, SD.n) + '% do total', '#16a34a'], ['Temporários', fmtN(SD.temp), pct(SD.temp, SD.n) + '% do total', '#d97706'], ['Professores fora da sala', fmtN(SD.prof), 'em unidades administrativas', '#2563eb'],
          ['Estagiários e residentes', fmtN(SD.est), '', '#65a30d'], ['Exclusivamente comissionados', fmtN(SD.com), '', '#b45309'], ['Vínculos a vencer (90 dias)', fmtN(SD.vence90.length), fmtN(SD.venceAno.length) + ' até o fim do ano', '#dc2626'], ['Fora da nova estrutura', fmtN([...SD.semCasar.values()].reduce((t, x) => t + x.l.length, 0)), SD.semCasar.size + ' lotações', '#7c3aed']] });
        B.push({ t:'h3', x:'Servidores por secretaria adjunta e DRE' }, { t:'tab', pq:true, cab:['Unidade', 'Servidores', 'Efetivos', 'Temporários', '% temp.', 'Professores', 'Estagiários'], dir:[1, 2, 3, 4, 5, 6], larg:['*', 52, 48, 58, 42, 58, 52], lin:[...SD.porUnid].sort((a, b) => b[1].length - a[1].length).map(([u, l]) => [svNomeUnid(u), fmtN(l.length), fmtN(l.filter(svEfet).length), fmtN(l.filter(svTemp).length), pct(l.filter(svTemp).length, l.length) + '%', fmtN(l.filter(r => svGrupoCargo(r.cargo) === 'Professor').length), fmtN(l.filter(r => ['Estagiário', 'Residente técnico'].includes(svGrupoCargo(r.cargo))).length)]) });
        B.push({ t:'h3', x:'Servidores por cargo' }, { t:'barras', it:Object.entries(SD.porCargo).sort((a, b) => b[1] - a[1]).map(([g, n]) => [g, n, fmtN(n) + ' · ' + pct(n, SD.n) + '%', svCorCargo(g)]) });
        const top = [...SD.porSetor].map(([id, l]) => [id, l]).sort((a, b) => b[1].length - a[1].length).slice(0, 15);
        B.push({ t:'h3', x:'Unidades da nova estrutura com mais servidores' }, { t:'tab', pq:true, cab:['Unidade', 'Área', 'Servidores', 'Efetivos', 'Temporários'], dir:[2, 3, 4], larg:['*', 110, 52, 48, 58], lin:top.map(([id, l]) => [nomeSetor(id), nomeCurto(porId.get(areaDe.get(id))) || '—', fmtN(l.length), fmtN(l.filter(svEfet).length), fmtN(l.filter(svTemp).length)]) });
        const sc = [...SD.semCasar.values()].sort((a, b) => b.l.length - a.l.length);
        if (sc.length) B.push({ t:'h3', x:`Lotações sem correspondência na nova estrutura (${sc.length})` }, { t:'tab', pq:true, cab:['Lotação na planilha de origem', 'Unidade', 'Servidores'], dir:[2], larg:['*', 130, 52], lin:sc.slice(0, 40).map(x => [x.nome || '—', svNomeUnid(x.unidade), fmtN(x.l.length)]) });
        const al = [];
        if (SD.vence90.length) al.push(['alerta', `${fmtN(SD.vence90.length)} vínculos terminam nos próximos 90 dias (${pct(SD.vence90.length, SD.n)}% da força de trabalho).`]);
        if (SD.venceAno.length > SD.vence90.length) al.push(['atencao', `${fmtN(SD.venceAno.length)} vínculos terminam até 31/12/${hojeISO().slice(0, 4)}.`]);
        if (SD.prof) al.push(['info', `${fmtN(SD.prof)} professores (${pct(SD.prof, SD.n)}%) estão lotados em unidades administrativas.`]);
        if (sc.length) al.push(['atencao', `${sc.length} lotações da planilha não existem na nova estrutura; os servidores delas precisam ser remanejados.`]);
        if (al.length) B.push({ t:'h3', x:'Pontos de atenção' }, { t:'alertas', it:al });
        B.push({ t:'nota', x:`Fonte: planilha de lotação ${imp && imp.arquivo ? '"' + imp.arquivo + '" ' : ''}importada em ${imp && imp.em ? fmtData(imp.em) : '—'}. O relatório não traz nomes, matrículas nem CPF.` });
      } }
    if (k === 'chefias') { H(k); const L = D.base.filter(s => CHEFIAS.includes(s.tipo)).map(s => ({ s, c:chefiaDe(s) })), cn = q => L.filter(x => x.c.situacao === q).length;
      B.push({ t:'kpis', it:[['Chefias', L.length, ''], ['Com titular', cn('Titular'), '', '#16a34a'], ['Interinas / em nomeação', cn('Interino') + cn('Em nomeação'), '', '#d97706'], ['Vagas', cn('Vago'), '', '#dc2626']] });
      const reg = x => !!(x.c.titular || x.c.substituto || x.c.desde || (x.c.situacao && x.c.situacao !== 'Não informado')), COM = L.filter(reg), SEM = L.filter(x => !reg(x));
      if (SEM.length) { const g = new Map(); SEM.forEach(x => { const a = nomeCurto(porId.get(areaDe.get(x.s.id))) || '—'; if (!g.has(a)) g.set(a, []); g.get(a).push(x.s.sigla || nomeCurto(x.s)); });
        B.push({ t:'h3', x:`Chefias ainda sem registro (${SEM.length})` }, { t:'tab', pq:true, cab:['Área', 'Qtde', 'Unidades'], larg:[110, 30, '*'], dir:[1], lin:[...g].sort((a, b) => b[1].length - a[1].length).map(([a, l]) => [a, l.length, l.join('; ')]) }); }
      if (COM.length) B.push({ t:'h3', x:`Chefias registradas (${COM.length})` });
      if (COM.length || !SEM.length) B.push({ t:'tab', pq:true, cab:['Unidade', 'Símbolo', 'Titular', 'Situação', 'Desde', 'Substituto', 'Atenção'], larg:['*', 34, 76, 50, 44, 64, 70], lin:COM.sort((a, b) => (prof.get(a.s.id) || 0) - (prof.get(b.s.id) || 0)).map(x => [x.s.nome, simboloChefia(x.s.id) || '—', x.c.titular || '—', { x:x.c.situacao, cor:{ Vago:'#fee2e2', Interino:'#fef3c7', 'Em nomeação':'#dbeafe' }[x.c.situacao] }, fmtDia(x.c.desde), x.c.substituto || '—', alertasChefia(x.s, x.c).map(a => a[1]).filter(a => a !== 'sem registro').join('; ')]) }); }
    if (k === 'riscos') { H(k); const r = D.base.filter(emRisco);
      B.push({ t:'h3', x:`Setores em risco (${r.length})` }, { t:'tab', pq:true, cab:['Setor', 'Impacto', 'Validação', 'Responsável', 'Pontos − / +'], larg:['*', 50, 70, 90, 50], lin:r.map(s => [s.nome, IMPACTO[num(s.impacto)][0], statusVal(s.id), s.responsavel || 'sem responsável', linhasDe(s.negativos).length + ' / ' + linhasDe(s.positivos).length]) });
      B.push({ t:'h3', x:'Validações pendentes mais antigas' }, { t:'tab', pq:true, cab:['Setor', 'Validador', 'Pedida em', 'Dias'], larg:['*', '*', 60, 34], dir:[3], lin:D.pend.slice().sort((a, b) => diasDesde(b.solicitadoEm) - diasDesde(a.solicitadoEm)).slice(0, 25).map(v => [nomeSetor(v.setorId), nomeSetor(v.validadorId), fmtDia(v.solicitadoEm), diasDesde(v.solicitadoEm)]) }); }
    if (k === 'validacoes') { H(k); const st = {}; D.vals.forEach(v => { const q = v.status || 'Pendente'; st[q] = (st[q] || 0) + 1; });
      B.push({ t:'barras', it:Object.entries(st).map(([q, c]) => [q, c, c, STATUS_VAL[q]]) }, { t:'tab', pq:true, cab:['Setor avaliado', 'Validador', 'Situação', 'Parecer', 'Pedida em'], larg:['*', '*', 60, '*', 55], lin:D.vals.map(v => [nomeSetor(v.setorId), nomeSetor(v.validadorId), v.status || 'Pendente', v.parecer || '—', fmtDia(v.solicitadoEm)]) }); }
    if (k === 'financeiro') { H(k); const porCat = {}, dga = new Map(); D.desp.filter(d => (d.cenario || 'Atual') === 'Atual').forEach(d => { const c = calcDesp(d); porCat[c.categoria] = (porCat[c.categoria] || 0) + c.anual; if (d.observacao === MARCA_CHEFIA || /^DGA/i.test(c.r.codigo || '')) { const o = dga.get(c.r.codigo || '—') || { q:0, m:0 }; o.q += c.qtd; o.m += c.mensal; dga.set(c.r.codigo || '—', o); } });
      B.push({ t:'kpis', it:[['Custo mensal atual', fmtM0(D.custo.Atual.m), ''], ['Custo anual atual', fmtM0(D.custo.Atual.a), '', '#0e7490'], ['Custo anual proposto', fmtM0(D.custo.Proposto.a), 'lançamentos marcados como Proposto', '#7c3aed'], ['Diferença', fmtRs(D.custo.Proposto.a - D.custo.Atual.a), '', '#dc2626']] });
      B.push({ t:'h3', x:'Custo anual por área' }, { t:'barras', it:D.porArea.filter(x => x.ca).sort((a, b) => b.ca - a.ca).map(x => [x.nome, x.ca, fmtRc(x.ca), x.cor]) });
      B.push({ t:'h3', x:'Custo anual por categoria' }, { t:'barras', it:Object.entries(porCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => [c, v, fmtRc(v), '#2563eb']) });
      B.push({ t:'h3', x:'Cargos em comissão por símbolo' }, { t:'tab', cab:['Símbolo', 'Quantidade', 'Custo mensal', 'Custo anual (12 meses)'], dir:[1, 2, 3], lin:[...dga.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'pt-BR', { numeric:true })).map(([c, o]) => [c, o.q, fmtM0(o.m), fmtM0(o.m * 12)]) }); }
    if (k === 'propostas') { H(k); if (!P.length) B.push({ t:'p', x:'Nenhuma proposta selecionada.' });
      const mt = Object.assign({}, METAS_PADRAO, param('metasReestr', {})), C = cenariosRe();
      P.forEach(p => { const X = diffCenarios('', p.id), c = t => X.est.filter(e => e.tipo === t).length, cen = C.find(q => q.id === p.id), av = cen ? avaliarCenario(cen, metricasEstrutura(cen.lista), C[0], mt) : [];
        B.push({ t:'h2', x:p.nome + (p.status ? ' · ' + p.status : '') }); if (p.descricao) B.push({ t:'p', x:p.descricao });
        B.push({ t:'kpis', it:[['Criadas', c('novo') + c('reativado'), '', '#16a34a'], ['Extintas', c('extinto'), '', '#dc2626'], ['Movidas / renomeadas', c('movido') + c('renomeado') + c('tipo'), '', '#2563eb'], ['Custo anual', fmtRc(X.aB), (X.aB - X.aA >= 0 ? '+' : '') + fmtRs(X.aB - X.aA) + ' sobre o atual', X.aB > X.aA ? '#dc2626' : '#16a34a']] });
        if (av.length) B.push({ t:'tab', pq:true, cab:['Meta da reorganização', 'Resultado', 'Situação'], larg:['*', 90, 60], lin:av.map(y => [y.nome, y.valor, { x:y.ok ? 'Atende' : 'Não atende', cor:y.ok ? '#dcfce7' : '#fee2e2' }]) });
        B.push({ t:'lista', it:X.est.filter(e => e.tipo !== 'editado').slice(0, 40).map(e => ['• ' + e.txt.replace(/<[^>]+>/g, ''), 0]) }); }); }
    if (k === 'rede') { H(k); const L = escolasLista().filter(e => dreOk(e.dre)), tp = {}; L.forEach(e => { const g = grupoTipo(e.tipo); tp[g] = (tp[g] || 0) + 1; });
      B.push({ t:'kpis', it:[['Alunos', fmtN(alunosDe(L)), `média de ${fmtN(Math.round(alunosDe(L) / Math.max(1, L.length)))} por escola`, '#7c3aed'], ['Unidades escolares', fmtN(L.length), F.dre || dres.length + ' DREs', '#16a34a'], ['Municípios', new Set(L.map(e => e.municipio)).size, '', '#0891b2'], ['Rurais', L.filter(e => e.localidade === 'RURAL').length, pct(L.filter(e => e.localidade === 'RURAL').length, L.length) + '% da rede', '#65a30d'], ['Indígenas e quilombolas', (tp['Indígena'] || 0) + (tp.Quilombola || 0), '', '#c2410c']] });
      B.push({ t:'tab', pq:true, cab:['DRE', 'Escolas', 'Alunos', 'Municípios', 'Rurais', 'Cívico-mil.', 'Campo', 'Indígena', 'Integral'], dir:[1, 2, 3, 4, 5, 6, 7, 8], lin:dres.filter(dreOk).map(d => { const l = L.filter(e => e.dre === d), c = g => l.filter(e => grupoTipo(e.tipo) === g).length; return [nomeDRE(d), l.length, fmtN(alunosDe(l)), new Set(l.map(e => e.municipio)).size, l.filter(e => e.localidade === 'RURAL').length, c('Cívico-militar'), c('Campo'), c('Indígena'), l.filter(e => /INTEGRAL/.test(e.tipo)).length]; }) });
      B.push({ t:'h3', x:'Escolas por tipo' }, { t:'barras', it:Object.entries(tp).sort((a, b) => b[1] - a[1]).map(([g, c]) => [g, c, c, CORES_TIPO[g] || '#94a3b8', FORMAS_TIPO[g] || 'circulo']) }, { t:'nota', x:'O ícone ao lado de cada tipo é a forma usada para essas unidades nos mapas do relatório e no Mapa de MT.' },
        { t:'h3', x:'Alunos por tipo de escola' }, { t:'barras', it:Object.keys(tp).map(g => [g, alunosDe(L.filter(e => grupoTipo(e.tipo) === g))]).sort((a, b) => b[1] - a[1]).map(([g, n]) => [g, n, fmtN(n) + ' · ' + pct(n, alunosDe(L)) + '%', CORES_TIPO[g] || '#94a3b8', FORMAS_TIPO[g] || 'ponto']) }); }
    if (k === 'distancias') { H(k); const L = E.lista.filter(o => dreOk(o.e.dre)), med = L.reduce((t, o) => t + o.km, 0) / Math.max(1, L.length);
      B.push({ t:'kpis', it:[['Distância média', fmtKm(med), 'em linha reta até a sede da DRE'], ['Por estrada (estimada)', '~' + fmtKm(med * FATOR_ESTRADA), '~' + fmtHoras(med) + ' de viagem', '#0e7490'], ['A mais de 100 km', L.filter(o => o.km > 100).length, pct(L.filter(o => o.km > 100).length, L.length) + '% das escolas', '#f97316'], ['Mais perto de outra DRE', L.filter(o => o.prox && o.km - o.prox.km >= 40 && o.prox.km < o.km * .7).length, 'ao menos 40 km mais perto', '#7c3aed']] });
      B.push({ t:'barras', it:FAIXAS_DIST.map(f => [f[1], L.filter(o => faixaDist(o.km) === f).length, null, f[2]]) });
      B.push({ t:'tab', pq:true, cab:['DRE', 'Escolas', 'Média', 'Mediana', 'Mais distante', '> 100 km'], dir:[1, 2, 3, 4, 5], lin:dres.filter(dreOk).map(d => { const l = E.lista.filter(o => o.e.dre === d), k2 = l.map(o => o.km).sort((a, b) => a - b), mx = l.reduce((a, o) => o.km > a.km ? o : a, l[0]); return [nomeDRE(d), l.length, fmtKm(k2.reduce((a, b) => a + b, 0) / k2.length), fmtKm(k2[Math.floor(k2.length / 2)]), fmtKm(mx.km) + ' (' + mx.e.municipio + ')', pct(l.filter(o => o.km > 100).length, l.length) + '%']; }) });
      B.push({ t:'h3', x:'Escolas mais distantes da sua DRE' }, { t:'tab', pq:true, cab:['Escola', 'Município', 'DRE', 'Linha reta', 'Estrada (est.)'], dir:[3, 4], lin:L.slice().sort((a, b) => b.km - a.km).slice(0, 25).map(o => [o.e.nome, o.e.municipio, nomeDRE(o.e.dre), fmtKm(o.km), '~' + fmtKm(o.km * FATOR_ESTRADA)]) });
      B.push({ t:'nota', x:`Distâncias em linha reta entre as coordenadas da escola e a sede da DRE; estrada e tempo estimados (${String(FATOR_ESTRADA).replace('.', ',')} × linha reta, ${VEL_MEDIA} km/h).` }); }
    if (k === 'regional') { H(k); const R = dadosRegionais().filter(x => dreOk(x.d));
      B.push({ t:'tab', pq:true, cab:['DRE', 'Escolas', 'Servidores', 'Esc./servidor', 'Dist. média', 'Circuito (km)', 'Custo/ano'], dir:[1, 2, 3, 4, 5, 6], lin:R.sort((a, b) => b.custo - a.custo).map(x => [nomeDRE(x.d), x.n, x.ser || '—', x.escSer !== null ? x.escSer.toLocaleString('pt-BR', { maximumFractionDigits:1 }) : '—', fmtKm(x.med), fmtN(Math.round(x.circuito)), fmtRc(x.custo)]) });
      const sug = []; R.forEach(x => { if (x.polo) sug.push(['info', `${nomeDRE(x.d)}: avaliar polo de apoio em ${x.polo.m} (${x.polo.n} escolas num raio de 80 km, a ~${fmtKm(x.polo.km)} da sede).`]); if (x.outra.length >= 2) sug.push(['atencao', `${nomeDRE(x.d)}: ${x.outra.length} escola(s) mais perto da sede de outra DRE.`]); });
      if (sug.length) B.push({ t:'h3', x:'Sugestões' }, { t:'alertas', it:sug }); }
    if (k === 'escolas') { H(k); const L = escolasLista().filter(e => dreOk(e.dre)).sort((a, b) => a.dre.localeCompare(b.dre) || a.municipio.localeCompare(b.municipio, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'));
      B.push({ t:'tab', pq:true, cab:['Código', 'Unidade escolar', 'Município', 'DRE', 'Tipo', 'Loc.', 'Alunos', 'Dist.'], larg:[36, '*', 66, 56, 58, 26, 36, 34], dir:[6, 7], lin:L.map(e => [e.codigo, e.nome, e.municipio, nomeDRE(e.dre), grupoTipo(e.tipo), e.localidade === 'RURAL' ? 'R' : 'U', num(e.alunos) ? fmtN(e.alunos) : '—', fmtKm(distEscola(e))]) }); }
    if (k === 'implantacao') { H(k); const L = (DB.etapas || []).filter(e => F.props === '*' || !e.propostaId || (F.props || []).includes(e.propostaId)), co = L.filter(e => e.status === 'Concluída').length;
      B.push({ t:'kpis', it:[['Etapas', L.length, co + ' concluídas'], ['Andamento', (L.length ? Math.round(co * 100 / L.length) : 0) + '%', '', '#2563eb'], ['Atrasadas', L.filter(atrasada).length, '', '#dc2626'], ['Bloqueadas', L.filter(e => e.status === 'Bloqueada').length, '', '#7f1d1d']] });
      B.push({ t:'tab', pq:true, cab:['Fase', 'Etapa', 'Responsável', 'Prazo', 'Situação'], larg:[70, '*', 80, 50, 60], lin:L.slice().sort((a, b) => FASES_IM.indexOf(a.fase) - FASES_IM.indexOf(b.fase) || String(a.prazo).localeCompare(String(b.prazo))).map(e => [e.fase, e.titulo, e.responsavel || '—', fmtDia(e.prazo), { x:atrasada(e) ? 'Atrasada' : e.status, cor:atrasada(e) ? '#fee2e2' : e.status === 'Concluída' ? '#dcfce7' : undefined }]) }); }
    if (k === 'metas') { H(k); const M = (DB.metas || []).filter(m => !F.area || areaDe.get(m.setorId) === F.area);
      objetivosRS().forEach(o => { const l = M.filter(m => m.objetivo === o); if (!l.length) return; B.push({ t:'h3', x:o }, { t:'tab', pq:true, cab:['Meta', 'Setor', 'Base → Meta', 'Resultado', 'Atingimento', 'Situação'], larg:['*', 70, 60, 46, 46, 50], lin:l.map(m => { const p = progressoMeta(m); return [m.titulo, nomeCurto(porId.get(m.setorId)), `${m.linhaBase || '—'} → ${m.meta || '—'} ${m.unidade}`, m.resultado || '—', p === null ? '—' : Math.round(p * 100) + '%', situacaoMeta(m)]; }) }); });
      if (!M.length) B.push({ t:'p', x:'Nenhuma meta cadastrada.' }); }
    if (k === 'reunioes') { H(k); const R = (DB.reunioes || []).slice().sort((a, b) => String(b.data).localeCompare(String(a.data)));
      R.slice(0, 12).forEach(r => { const it = itensReu(r); B.push({ t:'h3', x:`${r.titulo} · ${fmtData(r.data)} · ${r.status || 'Planejada'}` }, { t:'tab', pq:true, cab:['Assunto', 'Decisão', 'Encaminhamento', 'Responsável', 'Prazo'], larg:['*', 60, '*', 60, 46], lin:it.map(x => [tituloItem(x), x.decisao || '—', x.encaminhamento || '—', x.responsavel || '—', x.prazo ? fmtDia(x.prazo) : '—']) }); });
      if (!R.length) B.push({ t:'p', x:'Nenhuma reunião registrada.' }); }
    if (k === 'orgGeral') { H(k); const r = F.area ? orgSVG(setoresOficiais(), { raiz:F.area, modo:FG.cor, vinculos:FG.vinculos }) : orgSVG(setoresOficiais(), { nivelMax:2, modo:FG.cor, vinculos:FG.vinculos });
      B.push(FIG(F.area ? `Organograma de ${relNomeArea(F.area)}` : 'Organograma geral da SEDUC-MT (até o 3º nível)', r, `${r.n} unidades desenhadas. Cores: ${MODOS_COR_ORG[FG.cor].toLowerCase()}.`)); }
    if (k === 'orgAreas') { H(k); const L = setoresOficiais(), ats = (F.area ? [F.area] : areas).filter(a => L.some(s => s.paiId === a && s.status !== 'Extinto'));
      ats.forEach(a => { const r = orgSVG(L, { raiz:a, modo:FG.cor, vinculos:FG.vinculos }); B.push(FIG(`Organograma de ${(porId.get(a) || {}).nome || nomeCurto(porId.get(a))}`, r, `${r.n} unidades.`)); });
      const soltas = areas.filter(a => !ats.includes(a) && !F.area); if (soltas.length) B.push({ t:'h3', x:'Unidades ligadas diretamente ao Gabinete, sem subdivisões' }, { t:'lista', it:soltas.map(a => ['• ' + ((porId.get(a) || {}).nome || ''), 0]) }); }
    if (k === 'orgProp') { H(k); if (!P.length) B.push({ t:'p', x:'Nenhuma proposta selecionada.' });
      P.forEach(p => { const L = estruturaProposta(p).lista, mp = new Map(L.map(s => [s.id, s])), areaL = id => { let s = mp.get(id), g = 0; while (s && s.paiId && mp.get(s.paiId) && mp.get(s.paiId).paiId && g++ < 60) s = mp.get(s.paiId); return s ? s.id : ''; };
        const mud = L.filter(s => (s._marcas || []).some(m => ['novo', 'extinto', 'movido', 'renomeado'].includes(m))), afet = [...new Set(mud.map(s => areaL(s.id)).filter(Boolean))];
        B.push({ t:'h2', x:p.nome }, { t:'p', x:`${mud.length} unidade(s) alterada(s) em ${afet.length} área(s).` });
        afet.forEach(a => { const r = orgSVG(L, { raiz:a, modo:FG.cor, marcas:true }); B.push(FIG(`${p.nome}: ${(mp.get(a) || {}).nome || ''}`, r, 'Bordas coloridas indicam as alterações da proposta em relação à estrutura vigente.')); }); }); }
    if (k === 'mapaMT') { H(k); const r = mapaSVG({ modo:'dre', ligacoes:FG.ligacoes, nomes:FG.nomes }); B.push(FIG('Unidades escolares estaduais por Diretoria Regional de Educação', r, `${E.lista.length} unidades escolares, ${dres.length} DREs. Municípios coloridos pela DRE que atende a maior parte das suas escolas.`)); DET('Escolas por DRE', { modo:'dre', ligacoes:FG.ligacoes }); }
    if (k === 'mapaDist') { H(k); const r = mapaSVG({ modo:'dist', nomes:FG.nomes }); B.push(FIG('Distância das escolas até a sede da sua DRE', r, 'Cor da escola e da linha pela distância em linha reta até a sede da DRE a que é subordinada.')); DET('Distâncias até a DRE', { modo:'dist' }); }
    if (k === 'mapaMun') { H(k); const r = mapaSVG({ modo:'mun', nomes:true }); B.push(FIG('Divisão municipal de Mato Grosso e unidades escolares', r, 'Limites municipais (IBGE, malha simplificada) com o nome de cada município.')); DET('Divisão municipal', { modo:'mun' }); }
    if (k === 'mapaDRE') { H(k); if (!F.dre) B.push({ t:'p', x:'Escolha uma DRE nos filtros para gerar o mapa aproximado.' });
      else { const r = mapaSVG({ modo:'dre', dre:F.dre, ligacoes:true, nomes:true }); B.push(FIG(`${F.dre}: escolas, municípios e ligações com a sede`, r, `${E.lista.filter(o => o.e.dre === F.dre).length} unidades escolares.`)); } }
    if (k === 'ficha') { H(k); const s = F.setor && porId.get(F.setor);
      if (!s) B.push({ t:'p', x:'Escolha um setor nos filtros para gerar a ficha.' });
      else { const c = chefiaDe(s), sub = filhosDe(s.id).filter(x => x.status !== 'Extinto'), cam = caminho(s.id);
        B.push({ t:'h2', x:s.nome + (s.sigla ? ' – ' + s.sigla : '') });
        B.push({ t:'tab', cab:['Campo', 'Informação'], larg:[130, '*'], lin:[['Tipo', s.tipo], ['Subordinação', cam.map(x => x.sigla || x.nome).join(' › ') || 'nível mais alto'], ['Situação', s.status || 'Ativo'], ['Responsável', s.responsavel || '—'], ['Contato', s.contato || '—'], ['Servidores', s.servidores || '—'], ['Comissionados', s.comissionados || '—'], ['Impacto', (IMPACTO[num(s.impacto)] || IMPACTO[0])[0] + (s.impactoDescricao ? ' – ' + s.impactoDescricao : '')], ['Validação', statusVal(s.id)], ['Chefia', CHEFIAS.includes(s.tipo) ? `${c.situacao}${c.titular ? ' · ' + c.titular : ''}${c.substituto ? ' · substituto: ' + c.substituto : ''}${simboloChefia(s.id) ? ' · ' + simboloChefia(s.id) : ''}` : '—'], ['Atualizado em', fmtData(s.atualizadoEm) + (s.atualizadoPor ? ' por ' + s.atualizadoPor : '')]] });
        const lin = t => String(t || '').split(/\n|;\s*/).map(limparComp).filter(Boolean);
        if (lin(s.competencias).length) B.push({ t:'h3', x:'Competências' }, { t:'lista', it:lin(s.competencias).map((x, i) => [`${romano(i + 1)} – ${x}`, 0]) });
        if (lin(s.entregas).length) B.push({ t:'h3', x:'Entregas' }, { t:'lista', it:lin(s.entregas).map(x => ['• ' + x, 0]) });
        if (linhasDe(s.positivos).length || linhasDe(s.negativos).length) B.push({ t:'h3', x:'Pontos positivos e de atenção' }, { t:'alertas', it:linhasDe(s.positivos).map(x => ['ok', x]).concat(linhasDe(s.negativos).map(x => ['alerta', x])) });
        if (sub.length) { const r = orgSVG(setoresOficiais(), { raiz:s.id, modo:FG.cor, vinculos:FG.vinculos }); B.push(FIG(`Estrutura subordinada a ${s.sigla || s.nome}`, r, `${r.n} unidades.`)); }
        const vs = (valPorSetor.get(s.id) || []); if (vs.length) B.push({ t:'h3', x:'Validações' }, { t:'tab', pq:true, cab:['Validador', 'Situação', 'Parecer', 'Pedida em'], lin:vs.map(v => [nomeSetor(v.validadorId), v.status || 'Pendente', v.parecer || '—', fmtDia(v.solicitadoEm)]) });
        const vi = (DB.vinculos || []).filter(v => v.origemId === s.id || v.destinoId === s.id); if (vi.length) B.push({ t:'h3', x:'Vínculos com outros setores' }, { t:'tab', pq:true, cab:['Setor', 'Tipo', 'Descrição'], lin:vi.map(v => [nomeSetor(v.origemId === s.id ? v.destinoId : v.origemId), v.tipo, v.descricao || '—']) });
        const ds = DB.despesas.filter(d => d.setorId === s.id && (d.cenario || 'Atual') === 'Atual'); if (ds.length) B.push({ t:'h3', x:'Custos lançados' }, { t:'tab', pq:true, cab:['Item', 'Qtd.', 'Mensal', 'Anual'], dir:[1, 2, 3], lin:ds.map(d => { const x = calcDesp(d); return [x.r.codigo || d.descricao || x.categoria, x.qtd, fmtM(x.mensal), fmtM(x.anual)]; }) });
        const hs = DB.historico.filter(h => h.setorId === s.id).slice(0, 15); if (hs.length) B.push({ t:'h3', x:'Histórico recente' }, { t:'tab', pq:true, cab:['Data', 'Usuário', 'Alteração'], larg:[70, 80, '*'], lin:hs.map(h => [fmtData(h.data), h.usuario, h.acao]) }); } }
    if (k === 'notas') { H(k);
      B.push({ t:'h3', x:'Fontes dos dados' }, { t:'lista', it:[['• Estrutura, setores, chefias, metas e reuniões: planilha do GABOrg (Google Planilhas), na situação de ' + emis.quando + '.', 0], ['• Unidades escolares: base geolocalizada da SEDUC-MT (' + fmtN(escolasLista().length) + ' escolas).', 0], ['• Limites municipais: IBGE (malha municipal simplificada).', 0], ['• Valores de cargos: Tabela de valores do módulo Financeiro.', 0]] });
      B.push({ t:'h3', x:'Métodos' }, { t:'lista', it:[['• Índice de maturidade (0 a 100) = 40% cadastro completo + 30% setores validados + 20% chefias com responsável + 10% setores fora de risco.', 0], ['• Setor em risco: impacto alto ou crítico e, além disso, sem validação, sem responsável ou com mais pontos negativos que positivos.', 0], [`• Distâncias: linha reta entre a escola e a sede da DRE (ponto central das escolas urbanas da cidade-sede); estrada e tempo estimados como ${String(FATOR_ESTRADA).replace('.', ',')} × linha reta a ${VEL_MEDIA} km/h.`, 0], ['• Amplitude de controle: número de unidades diretamente subordinadas a cada chefia.', 0]] });
      B.push({ t:'h3', x:'Legenda dos tipos de unidade' }, { t:'legenda', it:Object.keys(TIPOS).filter(t => t !== 'Outro').map(t => [corTipo(t), t]) });
      B.push({ t:'h3', x:'Ícones dos tipos de unidade escolar (mapas)' }, { t:'legenda', it:Object.keys(FORMAS_TIPO).filter(k => k !== 'Outro').map(k => [CORES_TIPO[k], `${k} – ${NOMES_FORMA[FORMAS_TIPO[k]]}`, FORMAS_TIPO[k]]) });
      B.push({ t:'h3', x:'Legenda de impacto e validação' }, { t:'legenda', it:IMPACTO.map(([n, c]) => [c, 'Impacto: ' + n]).concat(Object.entries(STATUS_VAL).map(([n, c]) => [c, 'Validação: ' + n])) });
      B.push({ t:'h3', x:'Autenticidade' }, { t:'p', x:`Este documento tem o código ${emis.codigo}. Para conferir se é autêntico, abra o GABOrg › Relatórios e minutas › Verificar código.` }); }
  });
  B.push({ t:'selo', codigo:emis.codigo, data:emis.data, quando:emis.quando, por:emis.por });
  return B;
}

/* ===================== MINUTA DE PORTARIA (ESTRUTURA INTERNA POR PROPOSTA) ===================== */
const PORT_PADRAO = { cenario:'', area:'', numero:'', ano:String(new Date().getFullYear()), data:'', fundamento:'no uso das atribuições legais que lhe conferem o art. [__] da Constituição Estadual e o [ato de organização da Secretaria]', decreto:'Decreto nº 2.236, de 27 de agosto de 2026', signatario:'', comp:true, cargos:true, titulares:false, alteracoes:true, implantacao:true };
let portCfg = Object.assign({}, PORT_PADRAO, store.get('gaborg_port', {}));
function montarPortaria(o, emis){
  const p = o.cenario && (DB.propostas || []).find(x => x.id === o.cenario), A = setoresOficiais(), Blista = p ? estruturaProposta(p).lista : A;
  const M = metricasEstrutura(Blista), mA = new Map(A.map(s => [s.id, s])), mB = new Map(Blista.map(s => [s.id, s])), at = s => s && s.status !== 'Extinto';
  const nomeS = s => s.nome + (s.sigla && !s.nome.includes(s.sigla) ? ' – ' + s.sigla : '');
  const raiz = (M.fil.get('') || [])[0];
  let topo = raiz ? (M.fil.get(raiz.id) || []) : [];
  if (o.area) topo = topo.filter(s => s.id === o.area || (porId.get(o.area) && s.id === o.area));
  const ordem = l => l.slice().sort((a, b) => num(a.ordem) - num(b.ordem) || a.nome.localeCompare(b.nome, 'pt-BR'));
  const dataTxt = o.data ? new Date(o.data + 'T12:00:00').toLocaleDateString('pt-BR', { day:'numeric', month:'long', year:'numeric' }) : '[data]';
  let art = 0; const ART = () => [`Art. ${artN(++art)} `, true];
  const B = [];
  const areaS = o.area && mB.get(o.area);
  B.push({ t:'h1', x:`PORTARIA Nº ${o.numero || '[número]'}/${o.ano || '[ano]'}/GS/SEDUC-MT` });
  B.push({ t:'p', ementa:true, x:`${areaS ? `Dispõe sobre a estrutura interna e as competências das unidades do(a) ${nomeS(areaS)}` : 'Dispõe sobre a estrutura organizacional interna e as competências das unidades da Secretaria de Estado de Educação'}${p ? `, conforme a proposta "${p.nome}"` : ''}, e dá outras providências.` });
  B.push({ t:'p', x:[['O(A) SECRETÁRIO(A) DE ESTADO DE EDUCAÇÃO DE MATO GROSSO', true], `, ${o.fundamento || '[fundamento legal]'}, e considerando o disposto no ${o.decreto || '[decreto de estrutura]'}${p && p.descricao ? `, bem como a necessidade de ${p.descricao.replace(/^[A-ZÁÉÍÓÚ]/, c => c.toLowerCase()).replace(/[.;]+$/, '')}` : ''},`] });
  B.push({ t:'p', centro:true, x:[['R E S O L V E:', true]] });
  // Capítulo I
  B.push({ t:'h2', x:'Capítulo I' }, { t:'h3', x:'Das disposições preliminares' });
  B.push({ t:'p', x:[ART(), `Esta Portaria dispõe sobre a estrutura organizacional interna ${areaS ? `do(a) ${nomeS(areaS)}` : 'da Secretaria de Estado de Educação – SEDUC'}, a denominação, a subordinação e as competências das suas unidades administrativas.`] });
  B.push({ t:'p', x:[ART(), `A representação gráfica da estrutura de que trata esta Portaria consta do Anexo I${o.cargos ? ', e o quadro de cargos de direção e chefia, do Anexo II' : ''}.`] });
  // Capítulo II: estrutura por área (seções) com incisos e alíneas
  B.push({ t:'h2', x:'Capítulo II' }, { t:'h3', x:'Da estrutura organizacional' });
  if (!o.area && raiz) { B.push({ t:'p', x:[ART(), `O(A) ${nomeS(raiz)} tem a seguinte estrutura organizacional básica:`] }); ordem(topo).forEach((s, i, l) => B.push({ t:'p', recuo:1, x:`${romano(i + 1)} – ${nomeS(s)}${i === l.length - 1 ? '.' : ';'}` })); }
  let secN = 0;
  ordem(topo).forEach(a => {
    const filhos = ordem(M.fil.get(a.id) || []); if (!filhos.length) return;
    B.push({ t:'h3', x:`Seção ${romano(++secN)} – Do(a) ${a.nome}` });
    B.push({ t:'p', x:[ART(), `O(A) ${nomeS(a)} compõe-se das seguintes unidades:`] });
    const vis = (pai, nv) => ordem(M.fil.get(pai) || []).forEach((s, i, l) => {
      const mk = nv === 1 ? romano(i + 1) + ' –' : nv === 2 ? alinea(i) + ')' : (i + 1) + '.';
      const qt = s.tipo === 'Unidades Escolares' && num(s.quantidade) ? ` (${fmtN(s.quantidade)} unidades escolares)` : '';
      B.push({ t:'p', recuo:nv, x:`${mk} ${nomeS(s)}${qt}${i === l.length - 1 && nv === 1 ? '.' : ';'}` }); vis(s.id, nv + 1); });
    vis(a.id, 1);
  });
  // Capítulo III: competências
  const alvo = [], col = (pai) => ordem(M.fil.get(pai) || []).forEach(s => { if (!o.area || s.id === o.area || caminhoEm(s.id, M) .includes(o.area)) alvo.push(s); col(s.id); });
  const caminhoEm = (id, MM) => { const r = []; let s = mB.get(id), g = 0; while (s && s.paiId && mB.has(s.paiId) && g++ < 60) { r.push(s.paiId); s = mB.get(s.paiId); } return r; };
  col('');
  if (o.comp) {
    B.push({ t:'h2', x:'Capítulo III' }, { t:'h3', x:'Das competências das unidades' });
    const com = alvo.filter(s => String(s.competencias || '').trim()), sem = alvo.filter(s => CHEFIAS.includes(s.tipo) && !String(s.competencias || '').trim());
    com.forEach(s => { const it = String(s.competencias).split(/\n|;\s*/).map(limparComp).filter(Boolean); B.push({ t:'p', x:[ART(), `Compete ao(à) ${nomeS(s)}:`] }); it.forEach((t, i) => B.push({ t:'p', recuo:1, x:`${romano(i + 1)} – ${t.replace(/[.;]+$/, '')}${i === it.length - 1 ? '.' : ';'}` })); });
    if (sem.length) B.push({ t:'p', x:[ART(), `As competências das unidades a seguir serão detalhadas no regimento interno: ${sem.map(nomeS).join('; ')}.`] });
    if (!com.length && !sem.length) B.push({ t:'p', x:[ART(), 'As competências das unidades serão detalhadas no regimento interno.'] });
  }
  // Capítulo IV: direção e chefia
  const cap = o.comp ? 'IV' : 'III';
  B.push({ t:'h2', x:`Capítulo ${cap}` }, { t:'h3', x:'Da direção das unidades' });
  B.push({ t:'p', x:[ART(), 'As unidades administrativas serão dirigidas por titulares nomeados para os cargos em comissão correspondentes, que serão substituídos, em suas ausências e impedimentos, por servidor designado em ato próprio.'] });
  B.push({ t:'p', x:[ART(), 'Os titulares das unidades responderão pelo planejamento, pela execução e pelo acompanhamento das atividades de sua área, observadas as diretrizes do Gabinete do Secretário de Estado de Educação.'] });
  // Capítulo V: disposições finais
  const capF = o.comp ? 'V' : 'IV', novos = Blista.filter(s => at(s) && !at(mA.get(s.id))), ext = A.filter(s => at(s) && !at(mB.get(s.id)));
  B.push({ t:'h2', x:`Capítulo ${capF}` }, { t:'h3', x:'Das disposições finais e transitórias' });
  if (p && (novos.length || ext.length)) B.push({ t:'p', x:[ART(), `A instalação das unidades criadas e a desativação das unidades extintas por esta Portaria${o.implantacao && (DB.etapas || []).some(e => e.propostaId === p.id) ? ' observarão o cronograma do Anexo IV' : ' ocorrerão no prazo de [__] dias'}, com o remanejamento dos servidores, processos e acervos.`] });
  B.push({ t:'p', x:[ART(), 'Os casos omissos serão resolvidos pelo(a) Secretário(a) de Estado de Educação.'] });
  B.push({ t:'p', x:[ART(), 'Ficam revogadas as disposições em contrário.'] });
  B.push({ t:'p', x:[ART(), 'Esta Portaria entra em vigor na data de sua publicação.'] });
  B.push({ t:'p', centro:true, x:`Cuiabá-MT, ${dataTxt}.` });
  B.push({ t:'ass', x:o.signatario || '[NOME]', sub:'Secretário(a) de Estado de Educação' });
  // Anexo I: estrutura
  B.push({ t:'quebra' }, { t:'h2', x:'Anexo I' }, { t:'h3', x:'Estrutura organizacional' + (areaS ? ' – ' + areaS.nome : '') });
  const lin = []; const vis2 = (pai, nv) => ordem(M.fil.get(pai) || []).forEach(s => { if (o.area && nv === 0 && s.id !== raiz.id) return; if (o.area && nv === 1 && s.id !== o.area) return; lin.push([[[s.sigla ? s.sigla + ' – ' : '', true], s.nome, ` (${s.tipo})`], nv]); vis2(s.id, nv + 1); }); vis2('', 0);
  B.push({ t:'lista', it:lin });
  // Anexo II: cargos
  if (o.cargos) {
    const linhas = p ? custoProposta(p).linhas : DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual'), ids = new Set(alvo.map(s => s.id));
    const cg = linhas.filter(l => l.observacao === MARCA_CHEFIA && ids.has(l.setorId));
    B.push({ t:'quebra' }, { t:'h2', x:'Anexo II' }, { t:'h3', x:'Quadro de cargos de direção e chefia' });
    const cab = ['Unidade', 'Cargo', 'Símbolo'].concat(o.titulares ? ['Titular atual'] : []);
    B.push({ t:'tab', cab, larg:o.titulares ? ['*', 90, 46, 90] : ['*', 110, 50], lin:(cg.length ? cg.map(l => { const s = mB.get(l.setorId), c = calcDesp(l); return [s ? nomeS(s) : '', l.descricao || 'Titular', c.r.codigo || '—'].concat(o.titulares ? [s ? chefiaDe(s).titular || '—' : '—'] : []); }) : alvo.filter(s => CHEFIAS.includes(s.tipo)).map(s => [nomeS(s), 'Titular', simboloChefia(s.id) || '[símbolo]'].concat(o.titulares ? [chefiaDe(s).titular || '—'] : []))) });
    const porS = {}; cg.forEach(l => { const c = calcDesp(l), k = c.r.codigo || '—'; porS[k] = (porS[k] || 0) + c.qtd; });
    if (cg.length) B.push({ t:'tab', cab:['Símbolo', 'Quantidade'], larg:[120, 80], dir:[1], lin:Object.entries(porS).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR', { numeric:true })).map(([k, v]) => [k, v]).concat([[{ x:'Total', b:true }, { x:cg.reduce((t, l) => t + calcDesp(l).qtd, 0), b:true }]]) });
  }
  // Anexo III: alterações
  if (o.alteracoes && p) {
    const mov = Blista.filter(s => at(s) && at(mA.get(s.id)) && (mA.get(s.id).paiId || '') !== (s.paiId || '')), ren = Blista.filter(s => at(s) && at(mA.get(s.id)) && mA.get(s.id).nome !== s.nome);
    const pai = (m, s) => { const x = m.get(s.paiId); return x ? (x.sigla || x.nome) : '—'; };
    B.push({ t:'quebra' }, { t:'h2', x:'Anexo III' }, { t:'h3', x:'Quadro de alterações em relação à estrutura vigente' });
    B.push({ t:'tab', cab:['Alteração', 'Unidade', 'Detalhe'], larg:[70, '*', '*'], lin:[].concat(novos.map(s => ['Criada', nomeS(s), 'subordinada a ' + pai(mB, s)]), ext.map(s => ['Extinta', nomeS(s), 'era subordinada a ' + pai(mA, s)]), mov.map(s => ['Movida', nomeS(s), pai(mA, s) + ' → ' + pai(mB, s)]), ren.map(s => ['Renomeada', nomeS(s), 'antes: ' + mA.get(s.id).nome])) });
  }
  // Anexo IV: cronograma
  if (o.implantacao && p) { const et = (DB.etapas || []).filter(e => e.propostaId === p.id); if (et.length) { B.push({ t:'quebra' }, { t:'h2', x:'Anexo IV' }, { t:'h3', x:'Cronograma de implantação' }, { t:'tab', cab:['Fase', 'Etapa', 'Responsável', 'Prazo'], larg:[80, '*', 90, 56], lin:et.slice().sort((a, b) => FASES_IM.indexOf(a.fase) - FASES_IM.indexOf(b.fase) || String(a.prazo).localeCompare(String(b.prazo))).map(e => [e.fase, e.titulo, e.responsavel || '—', fmtDia(e.prazo)]) }); } }
  if (emis) B.push({ t:'selo', codigo:emis.codigo, data:emis.data, quando:emis.quando, por:emis.por });
  return B;
}

/* ===================== SEÇÃO RELATÓRIOS E MINUTAS ===================== */
let rmAba = store.get('gaborg_rm_aba', 'relatorio');
const RM_ABAS = [['relatorio','Relatório completo','fa-file-pdf'],['portaria','Minuta de portaria','fa-file-contract'],['decreto','Minuta de decreto','fa-file-signature'],['verificar','Verificar código','fa-shield-halved']];
function abaRm(a){ rmAba = a; store.set('gaborg_rm_aba', a); renderRelatorios(); }
function garantirEstiloRel(){ if (!$('#estilo-rel')) { const s = document.createElement('style'); s.id = 'estilo-rel'; s.textContent = ESTILO_REL; document.head.appendChild(s); } }
const emisPrevia = tipo => ({ codigo:`GAB-${tipo}-AAAAMMDD-XXXXX`, data:new Date().toLocaleDateString('pt-BR'), quando:'(gerado ao emitir)', por:cfg.usuario || '' });
function renderRelatorios(){
  const el = $('#rm-corpo'); if (!el) return; garantirEstiloRel();
  el.innerHTML = avisoGestao() + abasG(RM_ABAS, rmAba, 'abaRm') + `<div class="ind-corpo">${rmAba === 'portaria' ? rmPortaria() : rmAba === 'decreto' ? reMinuta() : rmAba === 'verificar' ? rmVerificar() : rmRelatorio()}</div>`;
  if (rmAba === 'relatorio') previaRel(); else if (rmAba === 'portaria') previaPort(); else if (rmAba === 'decreto') atualizarMinuta();
}
/* ---------- relatório ---------- */
/* ---------- relatório: interface ---------- */
function salvarRelCfg(){ store.set('gaborg_rel', relCfg); }
function relPadrao(){ relCfg = Object.assign({ titulo:'Relatório da estrutura organizacional', obs:'', area:'', dre:'', setor:'', props:'*', secoes:REL_MODELOS.executivo[2].slice(), orient:'retrato', capa:true, sumario:true }, relCfg); relCfg.fig = Object.assign({ cor:'tipo', vinculos:false, ligacoes:false, nomes:false, mapaTam:'pagina' }, relCfg.fig || {}); const T = relTitulos(); if (!Array.isArray(relCfg.secoes)) relCfg.secoes = REL_MODELOS.executivo[2].slice(); relCfg.secoes = relCfg.secoes.filter(k => T[k]); }
relPadrao();
function rmRelatorio(){
  relPadrao(); const c = relCfg, P = DB.propostas || [], sel = new Set(c.secoes), dres = distanciasMT().dres, T = relTitulos(), M = param('modelosRel', []);
  const passo = (n, t, corpo, ab) => `<details class="rm-passo" ${ab ? 'open' : ''}><summary><span>${n}</span>${t}</summary><div class="rm-pc">${corpo}</div></details>`;
  return `<div class="re-min rm-grade"><div class="cartao bl re-min-cfg rm-cfg" style="--c:#1e3a8a">
    <h3><i class="fa-solid fa-wand-magic-sparkles"></i>Monte o seu relatório</h3>
    ${passo(1, 'Ponto de partida', `<div class="rm-pres">${Object.entries(REL_MODELOS).map(([k, [ic, n, l, req]]) => `<button class="rm-pre ${JSON.stringify(c.secoes) === JSON.stringify(l) ? 'on' : ''}" onclick="aplicarModeloRel('${k}')"><i class="fa-solid ${ic}"></i><b>${n}</b><small>${l.length} seções${req ? ' · escolha ' + (req === 'dre' ? 'a DRE' : 'o setor') : ''}</small></button>`).join('')}</div>
      ${M.length ? `<span class="rot" style="margin-top:8px">Meus modelos</span><div class="rm-meus">${M.map((m, i) => `<div><button onclick="carregarModeloRel(${i})"><i class="fa-solid fa-bookmark"></i>${esc(m.nome)}</button>${podeGestao() ? `<button class="x" title="Excluir" onclick="excluirModeloRel(${i})"><i class="fa-solid fa-xmark"></i></button>` : ''}</div>`).join('')}</div>` : ''}
      ${podeGestao() ? '<button class="btn btn-g btn-sm" onclick="salvarModeloRel()"><i class="fa-solid fa-floppy-disk"></i>Salvar a configuração atual como modelo</button>' : ''}`, true)}
    ${passo(2, `Conteúdo <small>${sel.size} seções</small>`, `<div class="rm-secs">${REL_SECOES.map(([g, l]) => `<div class="rm-g"><div class="rm-gh"><b>${g}</b><button onclick="relAlternarGrupo('${g}')">${l.every(x => sel.has(x[0])) ? 'tirar todas' : 'incluir todas'}</button></div>${l.map(([k, n]) => `<label class="lg-lembrar"><input type="checkbox" data-rs="${k}" ${sel.has(k) ? 'checked' : ''} onchange="lerRel()">${n}</label>`).join('')}</div>`).join('')}</div>
      ${c.secoes.length ? `<span class="rot" style="margin-top:8px">Ordem no documento</span><ol class="rm-ord">${c.secoes.map((k, i) => `<li><span>${esc(T[k] || k)}</span><button title="Subir" onclick="moverSecRel(${i},-1)" ${i ? '' : 'disabled'}><i class="fa-solid fa-arrow-up"></i></button><button title="Descer" onclick="moverSecRel(${i},1)" ${i < c.secoes.length - 1 ? '' : 'disabled'}><i class="fa-solid fa-arrow-down"></i></button><button title="Tirar" onclick="relCfg.secoes.splice(${i},1);salvarRelCfg();renderRelatorios()"><i class="fa-solid fa-xmark"></i></button></li>`).join('')}</ol>` : ''}`, true)}
    ${passo(3, 'Filtros', `<label><span class="rot">Secretaria adjunta</span><select id="rl-area" class="campo" onchange="lerRel()"><option value="">Toda a Secretaria</option>${areas.map(a => `<option value="${esc(a)}" ${a === c.area ? 'selected' : ''}>${esc(nomeCurto(porId.get(a)))}</option>`).join('')}</select></label>
      <label><span class="rot">DRE <small>rede escolar, distâncias e mapa da DRE</small></span><select id="rl-dre" class="campo" onchange="lerRel()"><option value="">Todas as DREs</option>${dres.map(d => `<option value="${esc(d)}" ${d === c.dre ? 'selected' : ''}>${esc(nomeDRE(d))}</option>`).join('')}</select></label>
      <label><span class="rot">Setor <small>para a ficha do setor</small></span><select id="rl-setor" class="campo" onchange="lerRel()"><option value="">—</option>${opcoesSetoresFin(c.setor)}</select></label>
      ${P.length ? `<details class="rm-det" ${c.props !== '*' ? 'open' : ''}><summary>Propostas incluídas: ${c.props === '*' ? 'todas' : (c.props || []).length}</summary><label class="lg-lembrar"><input type="checkbox" id="rl-ptodas" ${c.props === '*' ? 'checked' : ''} onchange="lerRel()">Todas</label>${P.map(p => `<label class="lg-lembrar"><input type="checkbox" data-rp="${esc(p.id)}" ${c.props === '*' || (c.props || []).includes(p.id) ? 'checked' : ''} onchange="$('#rl-ptodas').checked=false;lerRel()">${esc(p.nome)}</label>`).join('')}</details>` : ''}`)}
    ${passo(4, 'Figuras e mapas', `<label><span class="rot">Cores do organograma</span><select id="rl-cor" class="campo" onchange="lerRel()">${Object.entries(MODOS_COR_ORG).map(([k, n]) => `<option value="${k}" ${k === c.fig.cor ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="lg-lembrar"><input type="checkbox" id="rl-vin" ${c.fig.vinculos ? 'checked' : ''} onchange="lerRel()">Traçar os vínculos entre setores no organograma</label>
      <label class="lg-lembrar"><input type="checkbox" id="rl-lig" ${c.fig.ligacoes ? 'checked' : ''} onchange="lerRel()">Traçar a ligação de cada escola com a sua DRE no mapa</label>
      <label class="lg-lembrar"><input type="checkbox" id="rl-nom" ${c.fig.nomes ? 'checked' : ''} onchange="lerRel()">Mostrar o nome dos municípios no mapa</label>
      <label><span class="rot">Tamanho dos mapas</span><select id="rl-mtam" class="campo" onchange="lerRel()">${[['pagina', 'Página inteira (mapa grande, de borda a borda)'], ['ampliado', 'Página inteira + 4 detalhes ampliados (NO, NE, SO, SE)'], ['compacto', 'Compacto (mapa dentro do texto)']].map(([k, n]) => `<option value="${k}" ${k === c.fig.mapaTam ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`)}
    ${passo(5, 'Capa e formato', `<label><span class="rot">Título</span><input id="rl-tit" class="campo" value="${esc(c.titulo)}" oninput="lerRel()"></label>
      <label><span class="rot">Observação na capa <small>opcional</small></span><input id="rl-obs" class="campo" value="${esc(c.obs)}" oninput="lerRel()" placeholder="ex.: preparado para a reunião de 30/10"></label>
      <div class="rm-seg"><button class="${c.orient !== 'paisagem' ? 'on' : ''}" onclick="relCfg.orient='retrato';salvarRelCfg();renderRelatorios()"><i class="fa-solid fa-file"></i>Retrato</button><button class="${c.orient === 'paisagem' ? 'on' : ''}" onclick="relCfg.orient='paisagem';salvarRelCfg();renderRelatorios()"><i class="fa-solid fa-file fa-rotate-90"></i>Paisagem</button></div>

      <label class="lg-lembrar"><input type="checkbox" id="rl-sum" ${c.sumario ? 'checked' : ''} onchange="lerRel()">Sumário com o número das páginas</label>
      <p class="s" style="margin:4px 0 0;font-size:11.5px;color:var(--mut)">Em retrato, os organogramas e mapas largos saem em páginas deitadas.</p>`)}
    <div class="rm-emit rm-emit-fixo"><button class="btn btn-p" onclick="emitirRelatorio('pdf')"><i class="fa-solid fa-file-pdf"></i>Baixar PDF</button><button class="btn btn-s" onclick="emitirRelatorio('print')"><i class="fa-solid fa-print"></i>Imprimir</button><button class="btn btn-s" onclick="emitirRelatorio('word')"><i class="fa-solid fa-file-word"></i>Word</button></div></div>
    <div class="re-papel"><div class="rm-barra-prev"><span><i class="fa-solid fa-eye"></i>Prévia</span><span id="rl-info"></span></div><div id="rl-doc" class="rm-folha ${c.orient === 'paisagem' ? 'pais' : ''}"></div></div></div>`;
}
function lerRel(){
  const v = id => { const e = $(id); return e ? e.value : ''; }, ck = id => { const e = $(id); return e ? e.checked : false; };
  relCfg.titulo = v('#rl-tit'); relCfg.obs = v('#rl-obs'); relCfg.area = v('#rl-area'); relCfg.dre = v('#rl-dre'); relCfg.setor = v('#rl-setor'); relCfg.sumario = ck('#rl-sum');
  relCfg.fig = { cor:v('#rl-cor') || 'tipo', vinculos:ck('#rl-vin'), ligacoes:ck('#rl-lig'), nomes:ck('#rl-nom'), mapaTam:v('#rl-mtam') || 'pagina' };
  const marc = [...document.querySelectorAll('[data-rs]:checked')].map(x => x.dataset.rs), antes = relCfg.secoes.length;
  relCfg.secoes = relCfg.secoes.filter(k => marc.includes(k)).concat(marc.filter(k => !relCfg.secoes.includes(k)));
  const t = $('#rl-ptodas'); relCfg.props = !t || t.checked ? '*' : [...document.querySelectorAll('[data-rp]:checked')].map(x => x.dataset.rp);
  salvarRelCfg();
  if (relCfg.secoes.length !== antes) { renderRelatorios(); return; }
  clearTimeout(lerRel.t); lerRel.t = setTimeout(previaRel, 300);
}
function moverSecRel(i, d){ const a = relCfg.secoes; if (!a[i + d]) return; [a[i], a[i + d]] = [a[i + d], a[i]]; salvarRelCfg(); renderRelatorios(); }
function relAlternarGrupo(g){ const l = REL_SECOES.find(x => x[0] === g)[1].map(x => x[0]), todas = l.every(k => relCfg.secoes.includes(k)); relCfg.secoes = todas ? relCfg.secoes.filter(k => !l.includes(k)) : relCfg.secoes.concat(l.filter(k => !relCfg.secoes.includes(k))); salvarRelCfg(); renderRelatorios(); }
function aplicarModeloRel(k){
  const [, n, l, req] = REL_MODELOS[k]; relCfg.secoes = l.slice(); if (!relCfg.titulo || Object.values(REL_MODELOS).some(m => relCfg.titulo === 'Relatório: ' + m[1]) || relCfg.titulo === 'Relatório da estrutura organizacional') relCfg.titulo = k === 'executivo' ? 'Relatório da estrutura organizacional' : 'Relatório: ' + n;
  if (req === 'dre' && !relCfg.dre) relCfg.dre = distanciasMT().dres[0];
  if (req === 'setor' && !relCfg.setor) { const s = setoresOficiais().find(x => CHEFIAS.includes(x.tipo) && x.paiId); relCfg.setor = s ? s.id : ''; }
  salvarRelCfg(); renderRelatorios();
  if (req) setTimeout(() => { const e = $(req === 'dre' ? '#rl-dre' : '#rl-setor'); if (e) { e.closest('details').open = true; e.focus(); e.classList.add('rm-pisca'); } toast(req === 'dre' ? 'Escolha a DRE nos filtros.' : 'Escolha o setor nos filtros.'); }, 80);
}
async function salvarModeloRel(){
  const nome = await abrirModal({ titulo:'Salvar como modelo', rotulo:'Salvar', html:'<label><span class="rot">Nome do modelo</span><input id="mr-n" class="campo" required placeholder="ex.: Relatório mensal ao Gabinete"></label>', aoConfirmar:async m => { const n = m.querySelector('#mr-n').value.trim(); if (!n) throw new Error('Dê um nome ao modelo.'); return n; } });
  if (!nome) return; const M = param('modelosRel', []).filter(x => x.nome !== nome); M.unshift({ nome, cfg:JSON.parse(JSON.stringify(relCfg)) }); salvarParam('modelosRel', M.slice(0, 30)); toast('Modelo salvo para todos os usuários.'); renderRelatorios();
}
function carregarModeloRel(i){ const m = param('modelosRel', [])[i]; if (!m) return; relCfg = JSON.parse(JSON.stringify(m.cfg)); relPadrao(); salvarRelCfg(); renderRelatorios(); toast('Modelo "' + m.nome + '" carregado.'); }
async function excluirModeloRel(i){ const M = param('modelosRel', []), m = M[i]; if (!m || !await confirmar('Excluir modelo', `Excluir o modelo "<b>${esc(m.nome)}</b>"?`, 'Excluir', true)) return; M.splice(i, 1); salvarParam('modelosRel', M); renderRelatorios(); }
function previaRel(){
  const d = $('#rl-doc'); if (!d) return; const t0 = performance.now();
  try { const B = montarRelatorio(relCfg, emisPrevia('REL')); d.innerHTML = docHTML(B, { cabecalho:relCfg.titulo }); const i = $('#rl-info'); if (i) i.textContent = `${relCfg.secoes.length} seções · ${B.filter(b => b.t === 'fig').length} figura(s) · ${B.filter(b => b.t === 'tab').length} tabela(s)`; }
  catch (e) { d.innerHTML = `<p style="color:#dc2626">Erro ao montar: ${esc(e.message)}</p>`; console.error(e); }
}
function emitirRelatorio(formato){
  lerRel(); if (!relCfg.secoes.length) return toast('Escolha ao menos uma seção.', 'aviso');
  const F = JSON.parse(JSON.stringify(relCfg));
  return emitirDoc({ tipo:'REL', titulo:F.titulo || 'Relatório', formato, paisagem:F.orient === 'paisagem', nomeArq:'relatorio', montar:e => montarRelatorio(F, e), detalhe:`${F.secoes.length} seções · ${relNomeArea(F.area)}${F.dre ? ' · ' + F.dre : ''}${F.setor ? ' · ' + nomeSetor(F.setor) : ''}`, cfgRel:F });
}

/* ---------- portaria ---------- */
function rmPortaria(){
  const o = portCfg, P = DB.propostas || [];
  const ck = (k, n) => `<label class="lg-lembrar"><input type="checkbox" data-pc="${k}" ${o[k] ? 'checked' : ''} onchange="lerPort()">${n}</label>`;
  return `<div class="re-min"><div class="cartao bl re-min-cfg rm-cfg" style="--c:#a16207"><h3><i class="fa-solid fa-file-contract"></i>Dados da portaria</h3><p class="s">A portaria detalha a estrutura interna, unidade por unidade, com as competências e o quadro de chefias, a partir da proposta escolhida.</p>
    <label><span class="rot">Estrutura de base</span><select id="pt-cen" class="campo" onchange="lerPort()"><option value="">Estrutura atual (vigente)</option>${P.map(p => `<option value="${esc(p.id)}" ${p.id === o.cenario ? 'selected' : ''}>${esc(p.nome)}${p.status ? ' · ' + esc(p.status) : ''}</option>`).join('')}</select></label>
    <label><span class="rot">Abrangência</span><select id="pt-area" class="campo" onchange="lerPort()"><option value="">Toda a Secretaria</option>${areas.map(a => `<option value="${esc(a)}" ${a === o.area ? 'selected' : ''}>${esc(nomeCurto(porId.get(a)))}</option>`).join('')}</select></label>
    <div class="g2"><label><span class="rot">Número</span><input id="pt-num" class="campo" value="${esc(o.numero)}" placeholder="[número]" oninput="lerPort()"></label><label><span class="rot">Ano</span><input id="pt-ano" class="campo" value="${esc(o.ano)}" oninput="lerPort()"></label></div>
    <label><span class="rot">Data</span><input id="pt-data" type="date" class="campo" value="${esc(o.data)}" oninput="lerPort()"></label>
    <label><span class="rot">Fundamento legal</span><textarea id="pt-fund" class="campo" oninput="lerPort()">${esc(o.fundamento)}</textarea></label>
    <label><span class="rot">Decreto de estrutura citado</span><input id="pt-dec" class="campo" value="${esc(o.decreto)}" oninput="lerPort()"></label>
    <label><span class="rot">Nome de quem assina</span><input id="pt-ass" class="campo" value="${esc(o.signatario)}" placeholder="Secretário(a) de Estado de Educação" oninput="lerPort()"></label>
    ${ck('comp', 'Incluir as competências de cada unidade')}${ck('cargos', 'Anexo II: quadro de cargos de chefia')}${ck('titulares', 'Mostrar os titulares atuais no Anexo II')}${ck('alteracoes', 'Anexo III: alterações em relação à estrutura vigente')}${ck('implantacao', 'Anexo IV: cronograma de implantação (se houver)')}
    <div class="rm-emit"><button class="btn btn-p" onclick="emitirPortaria('pdf')"><i class="fa-solid fa-file-pdf"></i>Gerar PDF</button><button class="btn btn-s" onclick="emitirPortaria('word')"><i class="fa-solid fa-file-word"></i>Word</button><button class="btn btn-s" onclick="emitirPortaria('print')"><i class="fa-solid fa-print"></i>Imprimir</button></div>
    <p class="s" style="margin:0;font-size:11.5px;color:var(--mut)">Minuta para revisão jurídica: os campos entre colchetes devem ser preenchidos antes da publicação.</p></div>
    <div class="re-papel"><div id="pt-doc" class="rm-folha minuta"></div></div></div>`;
}
function lerPort(){
  const v = id => { const e = $(id); return e ? e.value.trim() : ''; };
  Object.assign(portCfg, { cenario:v('#pt-cen'), area:v('#pt-area'), numero:v('#pt-num'), ano:v('#pt-ano'), data:v('#pt-data'), fundamento:v('#pt-fund'), decreto:v('#pt-dec'), signatario:v('#pt-ass') });
  document.querySelectorAll('[data-pc]').forEach(c => portCfg[c.dataset.pc] = c.checked);
  store.set('gaborg_port', portCfg); clearTimeout(lerPort.t); lerPort.t = setTimeout(previaPort, 250);
}
function previaPort(){ const d = $('#pt-doc'); if (!d) return; try { d.innerHTML = docHTML(montarPortaria(portCfg, null), { minuta:true }); } catch (e) { d.innerHTML = `<p style="color:#dc2626">Erro ao montar: ${esc(e.message)}</p>`; console.error(e); } }
function emitirPortaria(formato){
  lerPort(); const o = JSON.parse(JSON.stringify(portCfg)), p = o.cenario && DB.propostas.find(x => x.id === o.cenario);
  return emitirDoc({ tipo:'POR', titulo:`Minuta de portaria${p ? ' – ' + p.nome : ' – estrutura vigente'}`, formato, minuta:true, nomeArq:'minuta-portaria', filtros:filtrosPort(o), montar:e => montarPortaria(o, e), detalhe:(p ? p.nome : 'Estrutura vigente') + (o.area ? ' · ' + relNomeArea(o.area) : '') });
}
/* ---------- verificação ---------- */
let rmCod = '';
function rmVerificar(){
  const L = emissoes(), c = rmCod.trim().toUpperCase(), achado = c && L.find(x => x.c === c);
  const res = !c ? '' : !codigoValido(c) ? `<div class="rm-res nok"><i class="fa-solid fa-circle-xmark"></i><div><b>Código inválido</b><p>O formato ou o dígito de conferência não confere. Verifique se foi digitado corretamente.</p></div></div>`
    : achado ? `<div class="rm-res ok"><i class="fa-solid fa-circle-check"></i><div><b>Documento autêntico</b><p>${esc(achado.tipo)}: <b>${esc(achado.titulo)}</b></p><p>Emitido em ${fmtData(achado.em)}${achado.por ? ' por ' + esc(achado.por) : ''} · formato ${esc(String(achado.formato || '').toUpperCase())}${achado.det ? ' · ' + esc(achado.det) : ''}</p></div></div>`
    : `<div class="rm-res aviso"><i class="fa-solid fa-circle-question"></i><div><b>Código bem formado, mas não registrado</b><p>Não há emissão com este código na planilha do GABOrg. O documento pode ter sido gerado em outra base ou ainda não sincronizado.</p></div></div>`;
  return `<div class="cartao bl" style="--c:#16a34a"><h3><i class="fa-solid fa-shield-halved"></i>Verificar um documento</h3><p class="s">Digite o código impresso no rodapé ou no selo do documento.</p>
      <div class="rm-ver"><input id="rm-cod" class="campo" value="${esc(rmCod)}" placeholder="GAB-REL-20261025-XXXXX" onkeydown="if(event.key==='Enter'){rmCod=this.value;renderRelatorios()}"><button class="btn btn-p" onclick="rmCod=$('#rm-cod').value;renderRelatorios()"><i class="fa-solid fa-magnifying-glass"></i>Verificar</button></div>${res}</div>
    <div class="cartao bl" style="--c:#1e3a8a;margin-top:14px"><h3><i class="fa-solid fa-clock-rotate-left"></i>Documentos emitidos <span class="ct">${L.length}</span></h3>
      <div class="tab-wrap"><table class="tab"><thead><tr><th>Código</th><th>Tipo</th><th>Título</th><th>Formato</th><th>Emitido em</th><th>Por</th></tr></thead><tbody>${L.slice(0, 200).map(x => `<tr onclick="rmCod=${arg(x.c)};renderRelatorios()"><td><code>${esc(x.c)}</code></td><td>${esc(x.tipo)}</td><td style="white-space:normal">${esc(x.titulo)}${x.det ? `<small style="display:block;color:var(--mut)">${esc(x.det)}</small>` : ''}</td><td>${esc(String(x.formato || '').toUpperCase())}</td><td>${fmtData(x.em)}</td><td>${esc(x.por || '')}${x.cfg ? `<button class="btn btn-g btn-sm" title="Gerar de novo com a mesma configuração (novo código)" onclick="event.stopPropagation();relCfg=JSON.parse(JSON.stringify(emissoes().find(y=>y.c===${arg(x.c)}).cfg));relPadrao();salvarRelCfg();abaRm('relatorio')"><i class="fa-solid fa-rotate"></i></button>` : ''}</td></tr>`).join('') || '<tr><td colspan="6" class="vazio">Nenhum documento emitido ainda.</td></tr>'}</tbody></table></div></div>`;
}

/* ===================== ANIMAÇÕES E INTERATIVIDADE ===================== */
let animOn = store.get('gaborg_anim', true);
const animAtiva = () => animOn && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function aplicarAnim(){ document.body.classList.toggle('sem-anim', !animAtiva()); }
function alternarAnim(v){ animOn = v; store.set('gaborg_anim', v); aplicarAnim(); if (v) iniciarFundoLogin(); toast(v ? 'Animações ligadas.' : 'Animações desligadas.'); }
aplicarAnim();
/* números que sobem do zero (KPIs) */
const RE_NUM = /^(\D*?)(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)(\D*)$/;
function contarNumeros(root){
  if (!animAtiva() || !root) return;
  root.querySelectorAll('.kpi .v, .ap-k b, .mt-kpi b, .rg-card .nums b, .ind-nota .anel b, .lg-nums b, .tv-kpi .v').forEach(el => {
    if (el.childElementCount || el.dataset.contado) return; const m = el.textContent.trim().match(RE_NUM); if (!m) return;
    const dec = (m[2].split(',')[1] || '').length, alvo = Number(m[2].replace(/\./g, '').replace(',', '.')); if (!isFinite(alvo) || alvo === 0) return;
    const fmt = v => m[1] + v.toLocaleString('pt-BR', { minimumFractionDigits:dec, maximumFractionDigits:dec }) + m[3], t0 = performance.now(), dur = Math.min(1100, 500 + Math.log10(alvo + 1) * 160);
    el.dataset.contado = '1';
    const passo = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(dec ? alvo * e : Math.round(alvo * e)); if (p < 1) requestAnimationFrame(passo); else el.textContent = fmt(alvo); };
    requestAnimationFrame(passo);
  });
}
/* entrada de uma seção: cartões, KPIs e linhas aparecem em sequência */
const SEL_ENTRA = '.kpi, .cartao.bl, .cartao.vazio, .rg-card, .ru-item, .ru-it, .rs-obj, .mt-grp, .tab-wrap, .ind-abas, .filtros, .ind-filtro, .g-subabas, .re-pares .par, .rm-folha, .re-folha';
function animarEntrada(sec){
  if (!sec || !animAtiva()) return;
  sec.classList.remove('vista-entra'); void sec.offsetWidth; sec.classList.add('vista-entra');
  const grupos = new Map();
  sec.querySelectorAll(SEL_ENTRA).forEach(el => { const p = el.parentElement, n = grupos.get(p) || 0; grupos.set(p, n + 1); el.style.setProperty('--i', Math.min(n, 12)); });
  sec.querySelectorAll('.tab tbody tr').forEach((tr, i) => { if (i < 24) tr.style.setProperty('--i', i); });
  contarNumeros(sec);
  clearTimeout(sec._tEntra); sec._tEntra = setTimeout(() => sec.classList.remove('vista-entra'), 1300);
}
/* efeito de toque nos botões */
document.addEventListener('pointerdown', e => {
  if (!animAtiva() || e.button !== 0) return;
  const b = e.target.closest && e.target.closest('.btn, .nav-b, .ind-abas > button, .g-subabas button, .mt-caixa button, .tv-rot, .mt-chip, .lg-form .btn'); if (!b || b.disabled) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, box = document.createElement('span'), o = document.createElement('span');
  box.className = 'rp-box'; o.className = 'rp'; o.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  box.appendChild(o); if (getComputedStyle(b).position === 'static') b.style.position = 'relative'; b.appendChild(box); setTimeout(() => box.remove(), 650);
}, true);
/* ---------- busca rápida (Ctrl + K) ---------- */
const pal = { i:0, itens:[] };
function abrirPaleta(){
  if ($('#paleta') || $('#app').classList.contains('hidden')) return;
  const el = document.createElement('div'); el.id = 'paleta'; el.className = 'paleta';
  el.innerHTML = `<div class="pal-cx" role="dialog" aria-label="Busca rápida"><div class="pal-in"><i class="fa-solid fa-magnifying-glass"></i><input id="pal-q" placeholder="Ir para uma seção, setor, escola, proposta ou ação..." autocomplete="off"><kbd>Esc</kbd></div><div class="pal-l" id="pal-l"></div><div class="pal-pe"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Ctrl</kbd>+<kbd>K</kbd> abre de qualquer lugar</span></div></div>`;
  el.addEventListener('pointerdown', e => { if (e.target === el) fecharPaleta(); });
  document.body.appendChild(el); const q = $('#pal-q'); q.addEventListener('input', () => { pal.i = 0; listarPaleta(q.value); }); q.focus(); listarPaleta('');
}
function fecharPaleta(){ const el = $('#paleta'); if (el) el.remove(); }
function listarPaleta(txt){
  const q = norm(txt), r = [];
  document.querySelectorAll('.lado .nav-b[data-vista]:not(.sem-acesso)').forEach(b => r.push({ g:'Seções', ic:b.querySelector('i').className, t:b.title || b.textContent.trim(), a:() => trocarVista(b.dataset.vista) }));
  [['fa-solid fa-tv', 'Abrir o Modo TV', () => abrirModoTV()], ['fa-solid fa-file-pdf', 'Gerar um relatório em PDF', () => { trocarVista('relatorios'); abaRm('relatorio'); }], ['fa-solid fa-file-contract', 'Minuta de portaria', () => { trocarVista('relatorios'); abaRm('portaria'); }], ['fa-solid fa-shield-halved', 'Verificar o código de um documento', () => { trocarVista('relatorios'); abaRm('verificar'); }], ['fa-solid fa-people-group', 'Nova reunião', () => { trocarVista('reunioes'); setTimeout(() => formReuniao(''), 100); }], ['fa-solid fa-circle-half-stroke', 'Alternar tema claro/escuro', () => alternarTema()], ['fa-solid fa-route', 'Mapa de MT por distância até a DRE', () => { trocarVista('escolas'); setTimeout(() => modoMT('distancia'), 400); }]]
    .forEach(([ic, t, a]) => r.push({ g:'Ações', ic, t, a }));
  let L = q ? r.filter(x => norm(x.t).includes(q)) : r;
  if (q.length >= 2) {
    DB.setores.filter(s => s.status !== 'Extinto' && norm(s.nome + ' ' + (s.sigla || '') + ' ' + (s.responsavel || '')).includes(q)).slice(0, 8).forEach(s => L.push({ g:'Setores', ic:'fa-solid ' + icTipo(s.tipo), t:s.nome, s:[s.sigla, s.responsavel].filter(Boolean).join(' · '), a:() => { trocarVista('mapa'); setTimeout(() => irPara(s.id), 80); } }));
    (DB.propostas || []).filter(p => norm(p.nome).includes(q)).slice(0, 4).forEach(p => L.push({ g:'Propostas', ic:'fa-solid fa-lightbulb', t:p.nome, s:p.status, a:() => { trocarVista('propostas'); } }));
    escolasLista().filter(e => norm(e.nome + ' ' + e.codigo + ' ' + e.municipio).includes(q)).slice(0, 6).forEach(e => L.push({ g:'Escolas', ic:'fa-solid fa-school', t:e.nome, s:e.municipio + ' · ' + nomeDRE(e.dre), a:() => verEscolaNoMapa(e.codigo) }));
  }
  pal.itens = L.slice(0, 40); pal.i = Math.min(pal.i, Math.max(0, pal.itens.length - 1));
  let g = ''; $('#pal-l').innerHTML = pal.itens.map((x, i) => (x.g !== g ? `<div class="pal-g">${esc(g = x.g)}</div>` : '') + `<button class="pal-it ${i === pal.i ? 'on' : ''}" data-i="${i}" onmouseenter="pal.i=${i};marcarPaleta()" onclick="executarPaleta(${i})"><i class="${esc(x.ic)}"></i><span><b>${esc(x.t)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ''}</span><i class="fa-solid fa-arrow-turn-down fa-rotate-90 ent"></i></button>`).join('') || '<div class="pal-vz">Nada encontrado.</div>';
}
function marcarPaleta(){ document.querySelectorAll('.pal-it').forEach(b => b.classList.toggle('on', Number(b.dataset.i) === pal.i)); const o = document.querySelector('.pal-it.on'); if (o) o.scrollIntoView({ block:'nearest' }); }
function executarPaleta(i){ const x = pal.itens[i]; fecharPaleta(); if (x) x.a(); }
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#paleta') ? fecharPaleta() : abrirPaleta(); return; }
  if (!$('#paleta')) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fecharPaleta(); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); pal.i = Math.min(pal.itens.length - 1, pal.i + 1); marcarPaleta(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); pal.i = Math.max(0, pal.i - 1); marcarPaleta(); }
  else if (e.key === 'Enter') { e.preventDefault(); executarPaleta(pal.i); }
}, true);
/* ---------- tela de entrada viva ---------- */
const lgf = { raf:0, nos:[], mx:-1e4, my:-1e4, w:0, h:0, giro:0, tGiro:null };
const FRASES_LG = ['Mapa interativo da estrutura da SEDUC-MT', `${ESCOLAS_BASE.length} escolas geolocalizadas em ${ESCOLAS_DRES.length} DREs`, 'Propostas com custo, metas e comparativo', 'Relatórios em PDF com código de verificação', 'Minutas de portaria e de decreto por proposta', 'Chefias, implantação, metas e reuniões'];
function iniciarFundoLogin(){
  const box = $('.lg-marca'); if (!box || $('#login').classList.contains('hidden')) return;
  let cv = $('#lg-fundo'); if (!cv) { cv = document.createElement('canvas'); cv.id = 'lg-fundo'; box.prepend(cv); }
  const ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
  const medir = () => { const r = box.getBoundingClientRect(); lgf.w = r.width; lgf.h = r.height; cv.width = r.width * dpr; cv.height = r.height * dpr; cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(45, Math.max(18, r.width * r.height / 26000))); lgf.nos = Array.from({ length:n }, () => ({ x:Math.random() * r.width, y:Math.random() * r.height, vx:(Math.random() - .5) * .12, vy:(Math.random() - .5) * .12, r:.8 + Math.random() * 1.2 })); };
  medir(); if (!box._lgOk) { box._lgOk = true; window.addEventListener('resize', () => { if (!$('#login').classList.contains('hidden')) medir(); });
    if (false) box.addEventListener('pointermove', e => { const r = box.getBoundingClientRect(); lgf.mx = e.clientX - r.left; lgf.my = e.clientY - r.top; const hx = (lgf.mx / r.width - .5), hy = (lgf.my / r.height - .5); box.style.setProperty('--rx', (-hy * 10).toFixed(2) + 'deg'); box.style.setProperty('--ry', (hx * 14).toFixed(2) + 'deg'); box.style.setProperty('--mx', (lgf.mx / r.width * 100).toFixed(1) + '%'); box.style.setProperty('--my', (lgf.my / r.height * 100).toFixed(1) + '%'); });
    box.addEventListener('pointerleave', () => { lgf.mx = lgf.my = -1e4; box.style.setProperty('--rx', '0deg'); box.style.setProperty('--ry', '0deg'); }); }
  cancelAnimationFrame(lgf.raf);
  const desenhar = () => {
    ctx.clearRect(0, 0, lgf.w, lgf.h); const N = lgf.nos, D = 130;
    N.forEach(p => { if (animAtiva()) { const dx = p.x - lgf.mx, dy = p.y - lgf.my, d2 = dx * dx + dy * dy; if (false) { const f = (22000 - d2) / 22000 * .6; p.vx += dx / Math.sqrt(d2 + 1) * f * .08; p.vy += dy / Math.sqrt(d2 + 1) * f * .08; }
      p.vx *= .998; p.vy *= .998; if (Math.hypot(p.vx, p.vy) < .06) { p.vx += (Math.random() - .5) * .02; p.vy += (Math.random() - .5) * .02; } p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > lgf.w) p.vx *= -1; if (p.y < 0 || p.y > lgf.h) p.vy *= -1; } });
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) { const a = N[i], b = N[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < D) { ctx.strokeStyle = `rgba(125,211,252,${(1 - d / D) * .14})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
    N.forEach(p => {
      ctx.fillStyle = 'rgba(191,219,254,.45)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); });
    if (animAtiva() && !document.hidden && !$('#login').classList.contains('hidden')) lgf.raf = requestAnimationFrame(desenhar);
  };
  desenhar();
  // números e frases
  const nums = $('.lg-nums'); if (nums) { nums.querySelectorAll('b').forEach(b => { b.textContent = b.dataset.n; delete b.dataset.contado; }); setTimeout(() => contarNumeros(nums), 500); }
  clearInterval(lgf.tGiro); const g = $('#lg-giro');
  if (false) lgf.tGiro = setInterval(() => { if ($('#login').classList.contains('hidden')) return clearInterval(lgf.tGiro); lgf.giro = (lgf.giro + 1) % FRASES_LG.length; g.classList.remove('on'); setTimeout(() => { g.textContent = FRASES_LG[lgf.giro]; g.classList.add('on'); }, 260); }, 3400);
  const sd = $('#lg-saud'); if (sd) { const h = new Date().getHours(); sd.textContent = h < 12 ? 'Bom dia!' : h < 18 ? 'Boa tarde!' : 'Boa noite!'; }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) iniciarFundoLogin(); });
function tremerLogin(){ const f = $('#f-login'); if (!f || !animAtiva()) return; f.classList.remove('treme'); void f.offsetWidth; f.classList.add('treme'); }
function cartaoAparencia(){
  return `<div class="cartao bl"><h3><i class="fa-solid fa-wand-magic-sparkles"></i>Aparência e interação</h3><p class="s">Preferências deste navegador.</p>
    <label class="lg-lembrar"><input type="checkbox" ${animOn ? 'checked' : ''} onchange="alternarAnim(this.checked)">Animações da interface (entrada das telas, números que sobem, efeitos de toque)</label>
    ${window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? '<p class="s" style="color:#b45309;margin-top:6px">O seu sistema operacional pede movimento reduzido; por isso as animações ficam desligadas.</p>' : ''}
    <p class="s" style="margin-top:8px">Atalho: <kbd>Ctrl</kbd> + <kbd>K</kbd> abre a busca rápida para ir a qualquer seção, setor, escola ou ação.</p></div>`;
}

/* ===================== MENU LATERAL: RECOLHER E AJUSTAR LARGURA ===================== */
let ladoCfg = Object.assign({ mini:false, w:236 }, store.get('gaborg_lado', {}));
function aplicarLado(){
  const larga = window.innerWidth > 820;
  document.body.classList.toggle('lado-mini', larga && ladoCfg.mini);
  document.documentElement.style.setProperty('--lado-w', Math.max(180, Math.min(340, ladoCfg.w)) + 'px');
  const tg = document.querySelector('.lado-tg'); if (tg) tg.title = ladoCfg.mini ? 'Expandir o menu (tecla [ )' : 'Recolher o menu (tecla [ )';
  setTimeout(() => { if (vistaAtual === 'mapa') desenharMini(); }, 260);
}
function alternarLado(forcar){ ladoCfg.mini = forcar !== undefined ? forcar : !ladoCfg.mini; store.set('gaborg_lado', ladoCfg); aplicarLado(); }
(function(){
  const alca = document.querySelector('.lado-alca'), lado = document.querySelector('.lado'); if (!alca) return;
  let ini = null;
  alca.addEventListener('pointerdown', e => { ini = { x:e.clientX, w:lado.getBoundingClientRect().width }; alca.setPointerCapture(e.pointerId); alca.classList.add('on'); lado.classList.add('redim'); e.preventDefault(); });
  alca.addEventListener('pointermove', e => {
    if (!ini) return; const w = ini.w + e.clientX - ini.x;
    if (w < 130) { if (!ladoCfg.mini) { ladoCfg.mini = true; aplicarLado(); } return; }
    if (ladoCfg.mini) { ladoCfg.mini = false; aplicarLado(); }
    ladoCfg.w = Math.max(180, Math.min(340, w)); document.documentElement.style.setProperty('--lado-w', ladoCfg.w + 'px');
  });
  const fim = () => { if (!ini) return; ini = null; alca.classList.remove('on'); lado.classList.remove('redim'); store.set('gaborg_lado', ladoCfg); aplicarLado(); };
  alca.addEventListener('pointerup', fim); alca.addEventListener('pointercancel', fim);
  alca.addEventListener('dblclick', () => { ladoCfg.w = 236; alternarLado(false); });
})();
window.addEventListener('resize', aplicarLado);
document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea,select,[contenteditable]') || document.querySelector('.modal') || !$('#tv-modo').classList.contains('hidden')) return;
  if (e.key === '[' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); alternarLado(); }
});
aplicarLado();

/* ===================== MODO TV ===================== */
const tv = { slides:[], i:0, timer:null, prog:null, relogio:null, pausado:false, inicio:0, seg:Number(store.get('gaborg_tv_seg', 20)), ocioso:null, voltas:0 };
function fecharModoTV(){
  clearTimeout(tv.timer); cancelAnimationFrame(tv.prog); clearInterval(tv.relogio);
  $('#tv-modo').classList.add('hidden'); $('#tv-palco').innerHTML = '';
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  if (vistaAtual === 'mapa') desenharMapa();
}
function tvTelaCheia(){ if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); }
function tvRelogio(){ const d = new Date(); $('#tv-relogio').textContent = d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }); $('#tv-data').textContent = d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' }); }
function tvTempo(v){ tv.seg = Number(v); store.set('gaborg_tv_seg', tv.seg); tvAgendar(); }
function tvPausar(forcar){ tv.pausado = forcar !== undefined ? forcar : !tv.pausado; $('#tv-btn-pausa').innerHTML = `<i class="fa-solid ${tv.pausado ? 'fa-play' : 'fa-pause'}"></i>`; tvAgendar(); }
function tvPasso(d){ tvMostrar((tv.i + d + tv.slides.length) % tv.slides.length); }
function tvAgendar(){
  clearTimeout(tv.timer); cancelAnimationFrame(tv.prog);
  const bar = $('#tv-barra'); bar.style.width = '0';
  if (tv.pausado || !tv.seg) return;
  tv.inicio = performance.now(); const dur = tv.seg * 1000;
  const anima = () => { const p = Math.min(1, (performance.now() - tv.inicio) / dur); bar.style.width = (p * 100) + '%'; if (p < 1) tv.prog = requestAnimationFrame(anima); };
  anima(); tv.timer = setTimeout(() => tvPasso(1), dur);
}
const tvKpi = (c, l, v, s, m) => `<div class="tv-kpi" style="--c:${c}"><div class="l">${l}</div><div class="v ${m ? 'm' : ''}">${v}</div><div class="s">${s}</div></div>`;
const TV_SLIDE = {
  visao(){
    const at = DB.setores.filter(s => s.status !== 'Extinto'), soma = k => at.reduce((a, s) => a + num(s[k]), 0);
    const pend = DB.validacoes.filter(v => !v.status || v.status === 'Pendente').length, f = totaisFin(DB.despesas);
    return `<div class="tv-h" style="--c:#60a5fa"><i class="fa-solid fa-building-columns"></i>Secretaria de Estado de Educação<small>Decreto nº 2.236/2026</small></div>
      <div class="tv-kpis">${tvKpi('#3b82f6', 'Setores ativos', at.length.toLocaleString('pt-BR'), `${areas.length} áreas${(() => { const e = at.filter(s => s.tipo === 'Unidades Escolares').reduce((t, s) => t + num(s.quantidade), 0); return e ? ' · ' + e.toLocaleString('pt-BR') + ' escolas' : ''; })()}`)}${tvKpi('#22c55e', 'Servidores', soma('servidores').toLocaleString('pt-BR'), `${soma('comissionados').toLocaleString('pt-BR')} comissionados`)}${tvKpi('#a855f7', 'Custo mensal', fmtRc(f.Atual.m), f.Proposto.m ? `proposto ${fmtRc(f.Proposto.m)}` : 'lançamentos atuais', true)}${tvKpi('#f59e0b', 'Validações pendentes', pend, `${DB.validacoes.length} no total`)}${tvKpi('#ef4444', 'Sem responsável', at.filter(s => !s.responsavel && filhosDe(s.id).length).length, 'chefias a definir')}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Setores por tipo</h4>${tvBarras(Object.entries(at.reduce((a, s) => (a[s.tipo] = (a[s.tipo] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, n]) => [t, n, corTipo(t), n]))}</div>
      <div class="tv-caixa"><h4>Maiores áreas (setores)</h4>${tvBarras(areas.map(a => [nomeCurto(porId.get(a)), DB.setores.filter(s => areaDe.get(s.id) === a && s.status !== 'Extinto').length, corArea(a)]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => [x[0], x[1], x[2], x[1]]))}</div></div>`;
  },
  mapa(){ return `<div class="tv-h" style="--c:#22d3ee"><i class="fa-solid fa-diagram-project"></i>Mapa da estrutura<small>${visiveis.length} setores visíveis</small></div><div class="tv-mapa" id="tv-mapa"><div class="mundo-tv" id="tv-mundo"></div><span class="tv-dica"><i class="fa-solid fa-hand"></i> arraste para mover · roda ou pinça para zoom · duplo clique centraliza</span></div>`; },
  areas(){
    const f = new Map(); DB.despesas.filter(d => d.cenario !== 'Proposto').forEach(d => { const a = areaDe.get(d.setorId); f.set(a, (f.get(a) || 0) + calcDesp(d).mensal); });
    return `<div class="tv-h" style="--c:#a78bfa"><i class="fa-solid fa-sitemap"></i>Estrutura por área<small>${areas.length} unidades ligadas ao Gabinete</small></div>
      <div class="tv-grade">${(() => {
        const grandes = areas.filter(a => DB.setores.filter(x => areaDe.get(x.id) === a).length > 1), unicas = areas.filter(a => !grandes.includes(a));
        const card = (cor, tit, sub, lst, fm) => `<div class="tv-area" style="--c:${cor}"><b>${esc(tit)}</b><small>${esc(sub)}</small><div class="nums"><span><b>${lst.length}</b>setores</span><span><b>${lst.reduce((t, x) => t + num(x.servidores), 0).toLocaleString('pt-BR')}</b>servidores</span>${fm ? `<span><b>${fmtRc(fm)}</b>por mês</span>` : ''}</div></div>`;
        const ativos = a => DB.setores.filter(x => areaDe.get(x.id) === a && x.status !== 'Extinto');
        return grandes.sort((x, y) => ativos(y).length - ativos(x).length).map(a => card(corArea(a), nomeCurto(porId.get(a)), (porId.get(a) || {}).nome || '', ativos(a), f.get(a)).replace('<div class="tv-area"', `<div class="tv-area tv-clic" onclick="tvDetalhe('area',${arg(a)})" title="Ver o detalhe"`)).join('')
          + (unicas.length ? card('#94a3b8', 'Unidades do Gabinete', unicas.map(a => nomeCurto(porId.get(a))).join(' · '), unicas.flatMap(ativos), unicas.reduce((t, a) => t + (f.get(a) || 0), 0)) : '');
      })()}</div>`;
  },
  fin(){
    const t = totaisFin(DB.despesas), dif = t.Proposto.a - t.Atual.a;
    const porCat = {}; DB.despesas.forEach(d => { if (d.cenario === 'Proposto') return; const c = calcDesp(d); porCat[c.categoria] = (porCat[c.categoria] || 0) + c.anual; });
    const porSet = new Map(); DB.despesas.forEach(d => { if (d.cenario === 'Proposto') return; porSet.set(d.setorId, (porSet.get(d.setorId) || 0) + calcDesp(d).mensal); });
    return `<div class="tv-h" style="--c:#4ade80"><i class="fa-solid fa-sack-dollar"></i>Financeiro<small>valores com encargos</small></div>
      <div class="tv-kpis" style="grid-template-columns:repeat(4,1fr)">${tvKpi('#3b82f6', 'Mensal · atual', fmtRc(t.Atual.m), `${t.Atual.n} lançamentos`, true)}${tvKpi('#06b6d4', 'Anual · atual', fmtRc(t.Atual.a), '', true)}${tvKpi('#a855f7', 'Anual · proposto', fmtRc(t.Proposto.a), `${t.Proposto.n} lançamentos`, true)}${tvKpi(dif > 0 ? '#ef4444' : '#22c55e', 'Diferença anual', (dif > 0 ? '+' : '') + fmtRc(Math.abs(dif)).replace('R$', dif < 0 ? '−R$' : 'R$'), 'proposto − atual', true)}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Custo anual por tipo (atual)</h4>${tvBarras(Object.entries(porCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v, (CATEG_FIN[k] || CATEG_FIN.Outro)[0], fmtRc(v)]))}</div>
      <div class="tv-caixa"><h4>Setores com maior custo mensal</h4><div class="tv-lista">${[...porSet.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7).map(([id, v]) => `<div><span>${esc(nomeCurto(porId.get(id)))} · ${esc((porId.get(id) || {}).nome || '')}</span><b>${fmtRc(v)}</b></div>`).join('')}</div></div></div>`;
  },
  val(){
    const cont = {}; DB.validacoes.forEach(v => cont[v.status || 'Pendente'] = (cont[v.status || 'Pendente'] || 0) + 1);
    const pend = DB.validacoes.filter(v => !v.status || v.status === 'Pendente').slice(0, 7);
    const alto = DB.setores.filter(s => num(s.impacto) >= 4 && s.status !== 'Extinto').sort((a, b) => num(b.impacto) - num(a.impacto)).slice(0, 7);
    return `<div class="tv-h" style="--c:#fbbf24"><i class="fa-solid fa-stamp"></i>Validações e impacto</div>
      <div class="tv-kpis" style="grid-template-columns:repeat(4,1fr)">${['Pendente', 'Aprovado', 'Aprovado com ressalvas', 'Reprovado'].map(k => tvKpi(STATUS_VAL[k] || '#64748b', k, cont[k] || 0, 'validações', false)).join('')}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Aguardando validação</h4><div class="tv-lista">${pend.length ? pend.map(v => `<div><span>${esc(nomeCurto(porId.get(v.setorId)))} → ${esc(nomeCurto(porId.get(v.validadorId)))}</span><b>${v.solicitadoEm ? new Date(v.solicitadoEm).toLocaleDateString('pt-BR') : ''}</b></div>`).join('') : '<div><span>Nenhuma pendência</span><b>✓</b></div>'}</div></div>
      <div class="tv-caixa"><h4>Setores de impacto alto ou crítico</h4><div class="tv-lista">${alto.length ? alto.map(s => `<div><span>${esc(nomeCurto(s))} · ${esc(s.nome)}</span><b style="color:${IMPACTO[num(s.impacto)][1]}">${IMPACTO[num(s.impacto)][0]}</b></div>`).join('') : '<div><span>Nenhum setor avaliado com impacto alto</span><b>—</b></div>'}</div></div></div>`;
  }
};
function tvBarras(itens){ const max = Math.max(1, ...itens.map(x => x[1])); return itens.map(([n, v, c, rot]) => `<div class="tv-bar" style="--c:${c}"><span class="n">${esc(n)}</span><span class="t"><span style="width:${v / max * 100}%"></span></span><span class="v">${rot ?? v}</span></div>`).join(''); }
function tvMontarMapa(){
  const cx = $('#tv-mapa'), mundo = $('#tv-mundo'); if (!cx) return;
  const L = limites();
  let ar = ''; visiveis.forEach(s => filhosVis(s.id).forEach(k => { if (pos.has(k.id)) ar += `<path d="${caminhoAresta(s, k)}"/>`; }));
  mundo.innerHTML = `<svg style="position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible">${ar}</svg>` + visiveis.map(cardHTML).join('').replace(/ sel /g, ' ').replace(/ msel /g, ' ');
  const r = cx.getBoundingClientRect();
  const fit = () => { const k = Math.min((r.width - 40) / (L.x1 - L.x0), (r.height - 40) / (L.y1 - L.y0), 1.2); return { k, x:(r.width - (L.x1 - L.x0) * k) / 2 - L.x0 * k, y:(r.height - (L.y1 - L.y0) * k) / 2 - L.y0 * k }; };
  let v = fit(); const ap = () => { mundo.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.k})`; }; ap();
  let arr = null;
  cx.addEventListener('pointerdown', e => { arr = { x:e.clientX, y:e.clientY, vx:v.x, vy:v.y }; cx.setPointerCapture(e.pointerId); cx.classList.add('pan'); tvPausar(true); });
  cx.addEventListener('pointermove', e => { if (!arr) return; v.x = arr.vx + e.clientX - arr.x; v.y = arr.vy + e.clientY - arr.y; ap(); });
  const solta = () => { arr = null; cx.classList.remove('pan'); }; cx.addEventListener('pointerup', solta); cx.addEventListener('pointercancel', solta);
  cx.addEventListener('wheel', e => { e.preventDefault(); tvPausar(true); const b = cx.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top, k = Math.max(.08, Math.min(3, v.k * Math.exp(-e.deltaY * .0015))), q = k / v.k; v = { k, x:mx - (mx - v.x) * q, y:my - (my - v.y) * q }; ap(); }, { passive:false });
  cx.addEventListener('dblclick', () => { v = fit(); ap(); });
  tv.moverMapa = (dx, dy, z) => { if (z) { const b = cx.getBoundingClientRect(), mx = b.width / 2, my = b.height / 2, k = Math.max(.08, Math.min(3, v.k * z)), q = k / v.k; v = { k, x:mx - (mx - v.x) * q, y:my - (my - v.y) * q }; } else { v.x += dx; v.y += dy; } ap(); };
}
/* ===================== MODO TV: ROTEIROS, TELAS NOVAS E INTERAÇÃO ===================== */
const ROTEIROS_TV = {
  panorama:['fa-earth-americas', 'Panorama completo', 'Todas as telas, da estrutura à rede escolar', ['visao', 'indicadores', 'mapa', 'areas', 'chefias', 'riscos', 'rede', 'mapamt', 'distancias', 'regional', 'fin', 'props', 'implantacao', 'metas', 'agenda', 'val']],
  estrutura:['fa-sitemap', 'Estrutura e pessoas', 'Organograma, áreas, chefias, riscos e validações', ['visao', 'mapa', 'areas', 'chefias', 'riscos', 'val']],
  rede:['fa-school', 'Rede escolar', 'As 631 escolas, o mapa de MT, distâncias e DREs', ['rede', 'mapamt', 'distancias', 'regional']],
  gestao:['fa-compass-drafting', 'Gestão e decisões', 'Maturidade, propostas, implantação, metas e agenda', ['indicadores', 'props', 'implantacao', 'metas', 'agenda']],
  propostas:['fa-lightbulb', 'Propostas', 'Uma tela para cada proposta, com custo e metas', ['props']],
  personalizado:['fa-hand-pointer', 'Personalizado', 'Você escolhe as telas', null]
};
const TELAS_TV = { visao:'Visão geral', indicadores:'Maturidade e alertas', mapa:'Mapa da estrutura', areas:'Estrutura por área', chefias:'Chefias', riscos:'Riscos', rede:'Rede escolar', mapamt:'Mapa de Mato Grosso', distancias:'Distâncias até as DREs', regional:'Gestão regional', fin:'Financeiro', props:'Propostas (uma por tela)', implantacao:'Implantação', metas:'Pacto de resultados', agenda:'Agenda e encaminhamentos', val:'Validações e impacto' };
Object.assign(tv, { roteiro:store.get('gaborg_tv_rot', 'panorama'), pers:store.get('gaborg_tv_pers', ['visao', 'rede', 'mapamt']), trans:store.get('gaborg_tv_trans', 'deslizar'), ticker:store.get('gaborg_tv_ticker', true), cont:null, det:null });
function tvSlides(){
  const r = ROTEIROS_TV[tv.roteiro] || ROTEIROS_TV.panorama, base = r[3] || tv.pers, L = [];
  base.forEach(k => {
    if (k === 'fin' && !DB.despesas.length) return;
    if (k === 'implantacao' && !(DB.etapas || []).length) return;
    if (k === 'metas' && !(DB.metas || []).length) return;
    if (k === 'agenda' && !(DB.reunioes || []).length) return;
    if (k === 'props') { (DB.propostas || []).filter(p => p.status !== 'Arquivada').forEach(p => L.push(['prop', 'Proposta: ' + p.nome, p.id])); return; }
    if (TV_SLIDE[k]) L.push([k, TELAS_TV[k] || k]);
  });
  return L.length ? L : [['visao', 'Visão geral']];
}
function abrirModoTV(){
  if (vistaAtual !== 'mapa') { const v = vistaAtual; vistaAtual = 'mapa'; calcularLayout(); vistaAtual = v; } else calcularLayout();
  tv.pausado = false; tv.voltas = 0; tv.det = null;
  $('#tv-seg').value = String(tv.seg);
  const el = $('#tv-modo'); el.classList.remove('hidden'); el.focus();
  if (document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  tvRelogio(); clearInterval(tv.relogio); tv.relogio = setInterval(tvRelogio, 1000);
  tvMenu();
}
function tvMenu(){
  clearTimeout(tv.timer); cancelAnimationFrame(tv.prog); clearInterval(tv.cont); tv.det = null; tv.slides = tvSlides(); tv.i = 0;
  $('#tv-titulo-slide').textContent = 'Escolha a apresentação'; $('#tv-pontos').innerHTML = ''; $('#tv-barra').style.width = '0';
  let n = 12;
  $('#tv-palco').innerHTML = `<div class="tv-slide tv-menu"><div class="tv-h" style="--c:#60a5fa"><i class="fa-solid fa-display"></i>Modo TV<small id="tv-cont">começa sozinho em ${n} s</small></div>
    <div class="tv-rots">${Object.entries(ROTEIROS_TV).map(([k, [ic, nm, d]]) => `<button class="tv-rot ${tv.roteiro === k ? 'on' : ''}" onclick="tvIniciar('${k}')"><i class="fa-solid ${ic}"></i><b>${nm}</b><span>${d}</span>${k !== 'personalizado' ? `<small>${tvContar(k)} telas</small>` : ''}</button>`).join('')}</div>
    <div class="tv-opcoes"><div class="tv-pers"><b>Telas do roteiro personalizado</b><div>${Object.entries(TELAS_TV).map(([k, nm]) => `<label><input type="checkbox" data-tvp="${k}" ${tv.pers.includes(k) ? 'checked' : ''} onchange="tvPersMudou()">${nm}</label>`).join('')}</div></div>
      <div class="tv-cfgs"><label>Transição<select onchange="tv.trans=this.value;store.set('gaborg_tv_trans',tv.trans);tvParar()">${[['deslizar', 'Deslizar'], ['esmaecer', 'Esmaecer'], ['zoom', 'Aproximar'], ['virar', 'Virar']].map(([k, nm]) => `<option value="${k}" ${tv.trans === k ? 'selected' : ''}>${nm}</option>`).join('')}</select></label>
        <label><input type="checkbox" ${tv.ticker ? 'checked' : ''} onchange="tv.ticker=this.checked;store.set('gaborg_tv_ticker',tv.ticker);tvTicker();tvParar()">Faixa de alertas no rodapé</label>
        <p>Teclas: ← → mudar de tela · espaço pausar · S sumário · M este menu · 1 a 9 ir para a tela · F tela cheia · Esc sair. Clique nas áreas, DREs e propostas para ver o detalhe.</p></div></div></div>`;
  tv.cont = setInterval(() => { n--; const c = $('#tv-cont'); if (c) c.textContent = `começa sozinho em ${n} s`; if (n <= 0) tvIniciar(tv.roteiro); }, 1000);
}
function tvParar(){ clearInterval(tv.cont); const c = $('#tv-cont'); if (c) c.textContent = 'escolha um roteiro'; }
function tvContar(k){ const a = tv.roteiro; tv.roteiro = k; const n = tvSlides().length; tv.roteiro = a; return n; }
function tvPersMudou(){ tvParar(); tv.pers = [...document.querySelectorAll('[data-tvp]:checked')].map(x => x.dataset.tvp); store.set('gaborg_tv_pers', tv.pers); }
function tvIniciar(k){ clearInterval(tv.cont); tv.roteiro = k; store.set('gaborg_tv_rot', k); tv.slides = tvSlides(); tv.i = 0; tv.det = null; tvTicker(); tvMostrar(0); }
async function tvMostrar(i){
  clearInterval(tv.cont); tv.det = null;
  if (i === 0 && tv.voltas++ > 0 && online()) { try { await lerNuvem(); calcularLayout(); tv.slides = tvSlides(); tvTicker(); } catch (e) {} }
  if (!tv.slides.length) tv.slides = tvSlides();
  tv.i = Math.max(0, Math.min(i, tv.slides.length - 1));
  const [k, t, a] = tv.slides[tv.i];
  $('#tv-titulo-slide').textContent = t + ' · ' + (tv.i + 1) + '/' + tv.slides.length + ' · ' + (ROTEIROS_TV[tv.roteiro] || [, ''])[1];
  $('#tv-pontos').innerHTML = tv.slides.map((s, j) => `<button class="${j === tv.i ? 'on' : ''}" title="${esc(s[1])}" onclick="tvMostrar(${j})"></button>`).join('');
  let html; try { html = TV_SLIDE[k](a); } catch (e) { console.error(e); html = `<div class="tv-h">${esc(t)}</div><p>Não foi possível montar esta tela.</p>`; }
  $('#tv-palco').innerHTML = `<div class="tv-slide tr-${tv.trans}">${html}</div>`;
  if (k === 'mapa') tvMontarMapa();
  tvAgendar();
}
function tvSumario(){
  tvPausar(true); tv.det = 'sumario';
  $('#tv-palco').innerHTML = `<div class="tv-slide tr-esmaecer"><div class="tv-h" style="--c:#60a5fa"><i class="fa-solid fa-table-cells"></i>Telas desta apresentação<small>clique para ir</small></div>
    <div class="tv-sum">${tv.slides.map((s, j) => `<button class="${j === tv.i ? 'on' : ''}" onclick="tvPausar(false);tvMostrar(${j})"><span>${j + 1}</span><b>${esc(s[1])}</b></button>`).join('')}</div>
    <div class="tv-acoes"><button onclick="tvMenu()"><i class="fa-solid fa-layer-group"></i>Trocar de apresentação</button><button onclick="tvPausar(false);tvMostrar(tv.i)"><i class="fa-solid fa-arrow-left"></i>Voltar</button></div></div>`;
}
/* faixa de alertas */
function tvTicker(){
  const el = $('#tv-ticker'); if (!el) return;
  if (!tv.ticker) { el.classList.add('hidden'); return; }
  const it = [];
  try { insightsInd(dadosInd(''), '').filter(x => x[0] === 'alerta' || x[0] === 'atencao').forEach(x => it.push(x[1].replace(/<[^>]+>/g, ''))); } catch (e) {}
  const at = (DB.etapas || []).filter(atrasada); if (at.length) it.push(`${at.length} etapa(s) de implantação atrasada(s): ${at.slice(0, 3).map(e => e.titulo).join('; ')}`);
  const vag = setoresOficiais().filter(s => s.status !== 'Extinto' && CHEFIAS.includes(s.tipo) && chefiaDe(s).situacao === 'Vago'); if (vag.length) it.push(`${vag.length} chefia(s) vaga(s): ${vag.slice(0, 4).map(s => s.sigla || s.nome).join(', ')}`);
  (DB.reunioes || []).forEach(r => itensReu(r).forEach(x => { if (x.encaminhamento && !x.feito && x.prazo && diasAte(x.prazo) <= 7) it.push(`Encaminhamento ${diasAte(x.prazo) < 0 ? 'atrasado' : 'vence em breve'}: ${x.encaminhamento}${x.responsavel ? ' (' + x.responsavel + ')' : ''}`); }));
  if (!it.length) it.push('Nenhum alerta no momento.');
  el.classList.remove('hidden');
  el.innerHTML = `<span class="tg"><i class="fa-solid fa-bell"></i>Alertas</span><div class="fx"><div class="tr" style="animation-duration:${Math.max(30, it.join(' ').length / 7)}s">${it.concat(it).map(x => `<span>${esc(x)}</span>`).join('')}</div></div>`;
}
/* detalhe ao clicar (pausa a apresentação) */
function tvDetalhe(tipo, ref){
  tvPausar(true); tv.det = tipo; let h = '';
  if (tipo === 'area') { const a = porId.get(ref), l = DB.setores.filter(s => areaDe.get(s.id) === ref && s.status !== 'Extinto'), tp = {}; l.forEach(s => tp[s.tipo] = (tp[s.tipo] || 0) + 1);
    const ch = l.filter(s => CHEFIAS.includes(s.tipo)), vag = ch.filter(s => chefiaDe(s).situacao === 'Vago' || !s.responsavel);
    h = `<div class="tv-h" style="--c:${corArea(ref)}"><i class="fa-solid fa-building-columns"></i>${esc(a ? a.nome : '')}<small>${l.length} setores</small></div>
      <div class="tv-kpis" style="grid-template-columns:repeat(4,1fr)">${tvKpi('#3b82f6', 'Setores', l.length, Object.keys(tp).length + ' tipos')}${tvKpi('#22c55e', 'Servidores', fmtN(l.reduce((t, s) => t + num(s.servidores), 0)), 'informados')}${tvKpi('#a855f7', 'Chefias', ch.length, vag.length + ' sem titular')}${tvKpi('#f97316', 'Impacto alto', l.filter(s => num(s.impacto) >= 4).length, 'alto ou crítico')}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Setores por tipo</h4>${tvBarras(Object.entries(tp).sort((x, y) => y[1] - x[1]).map(([t, n]) => [t, n, corTipo(t), n]))}</div><div class="tv-caixa"><h4>Chefias</h4><div class="tv-lista">${ch.slice(0, 9).map(s => `<div><span>${esc(s.nome)}</span><b>${esc(s.responsavel || 'sem titular')}</b></div>`).join('')}</div></div></div>`; }
  if (tipo === 'dre') { const X = distanciasMT(), l = X.lista.filter(o => o.e.dre === ref), mun = {}; l.forEach(o => mun[o.e.municipio] = (mun[o.e.municipio] || 0) + 1);
    const med = l.reduce((t, o) => t + o.km, 0) / Math.max(1, l.length), s = setorDaDRE(ref), cor = corDRE(X.dres, ref);
    h = `<div class="tv-h" style="--c:${cor}"><i class="fa-solid fa-building-flag"></i>${esc(ref)}<small>${s && s.responsavel ? esc(s.responsavel) : ''}</small></div>
      <div class="tv-kpis" style="grid-template-columns:repeat(4,1fr)">${tvKpi(cor, 'Escolas', l.length, Object.keys(mun).length + ' municípios')}${tvKpi('#65a30d', 'Rurais', l.filter(o => o.e.localidade === 'RURAL').length, pct(l.filter(o => o.e.localidade === 'RURAL').length, l.length) + '%')}${tvKpi('#f97316', 'Distância média', fmtKm(med), '~' + fmtHoras(med) + ' por estrada', true)}${tvKpi('#dc2626', 'Mais distante', fmtKm(Math.max(0, ...l.map(o => o.km))), 'em linha reta', true)}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Escolas por município</h4>${tvBarras(Object.entries(mun).sort((x, y) => y[1] - x[1]).slice(0, 9).map(([m, n]) => [m, n, cor, n]))}</div><div class="tv-caixa"><h4>Escolas mais distantes da sede</h4><div class="tv-lista">${l.slice().sort((x, y) => y.km - x.km).slice(0, 8).map(o => `<div><span>${esc(o.e.nome)} · ${esc(o.e.municipio)}</span><b>${fmtKm(o.km)}</b></div>`).join('')}</div></div></div>`; }
  $('#tv-palco').innerHTML = `<div class="tv-slide tr-zoom">${h}<div class="tv-acoes"><button onclick="tvPausar(false);tvMostrar(tv.i)"><i class="fa-solid fa-arrow-left"></i>Voltar à apresentação</button></div></div>`;
}
/* projeção simples para o mapa de MT na TV (SVG leve, sem bibliotecas externas) */
function tvMapaMT(dresSel){
  const fc = topojson.feature(MALHA_MT, MALHA_MT.objects[Object.keys(MALHA_MT.objects)[0]]), X = distanciasMT(), dres = X.dres, porMun = dreDosMunicipios();
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const kx = Math.cos(-13 * Math.PI / 180);
  const pts = []; fc.features.forEach(f => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).forEach(pl => pl[0].forEach(([lo, la]) => { const x = lo * kx, y = -la; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; })));
  const W = 1000, s = W / (x1 - x0), Hh = (y1 - y0) * s, P = (lo, la) => [((lo * kx - x0) * s).toFixed(1), ((-la - y0) * s).toFixed(1)];
  const path = g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map(pl => pl.map(r => 'M' + r.map(([lo, la]) => P(lo, la).join(',')).join('L') + 'Z').join('')).join('');
  const mun = fc.features.map(f => { const o = porMun.get(chaveMun(f.properties.nome)), d = o ? Object.entries(o).sort((a, b) => b[1] - a[1])[0][0] : ''; return `<path d="${path(f.geometry)}" fill="${d ? corDRE(dres, d) : '#334155'}" fill-opacity="${d && (!dresSel || dresSel === d) ? .42 : .06}" stroke="#0b1220" stroke-width="1"><title>${esc(f.properties.nome)}${d ? ' · ' + esc(nomeDRE(d)) : ''}</title></path>`; }).join('');
  const esc_ = X.lista.filter(o => !dresSel || o.e.dre === dresSel).map(o => { const [x, y] = P(o.e.longitude, o.e.latitude); return simbolo(formaTipo(o.e.tipo), x, y, 4.2, corDRE(dres, o.e.dre)); }).join('');
  const sedes = dres.map(d => { const [x, y] = P(X.sedes.get(d)[1], X.sedes.get(d)[0]), n = X.lista.filter(o => o.e.dre === d).length; return `<g class="tv-sede" onclick="tvDetalhe('dre',${arg(d)})" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="13" fill="${corDRE(dres, d)}" stroke="#fff" stroke-width="2.5"/><text x="${x}" y="${(+y + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${n}</text><text x="${(+x + 17).toFixed(1)}" y="${(+y + 4).toFixed(1)}" font-size="13" font-weight="700" fill="#e2e8f0" stroke="#0b1220" stroke-width="3" paint-order="stroke">${esc(nomeDRE(d))}</text></g>`; }).join('');
  return `<svg viewBox="-10 -10 ${W + 140} ${(Hh + 20).toFixed(0)}" preserveAspectRatio="xMidYMid meet" class="tv-svgmt">${mun}${esc_}${sedes}</svg>`;
}
Object.assign(TV_SLIDE, {
  indicadores(){ const D = dadosInd(''), ins = insightsInd(D, ''), idx = D.porArea.length ? Math.round(D.porArea.reduce((t, x) => t + x.idx * x.n, 0) / Math.max(1, D.porArea.reduce((t, x) => t + x.n, 0))) : 0, cor = idx >= 75 ? '#22c55e' : idx >= 50 ? '#f59e0b' : '#ef4444';
    return `<div class="tv-h" style="--c:${cor}"><i class="fa-solid fa-gauge-high"></i>Maturidade da estrutura<small>leitura automática dos dados</small></div>
      <div class="tv-duas" style="grid-template-columns:.8fr 2fr"><div class="tv-caixa tv-gauge" style="--c:${cor}"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" class="f"/><circle cx="18" cy="18" r="15.9" class="v" stroke-dasharray="${idx} 100"/></svg><b>${idx}</b><span>índice de maturidade (0 a 100)</span></div>
      <div class="tv-caixa"><h4>Pontos de atenção</h4><div class="tv-ins">${ins.slice(0, 7).map(([t, h]) => `<div class="${t}">${h}</div>`).join('')}</div></div></div>`; },
  rede(){ const E = escolasLista(), dres = dresDe(E), rur = E.filter(e => e.localidade === 'RURAL').length, tp = {}; E.forEach(e => { const g = grupoTipo(e.tipo); tp[g] = (tp[g] || 0) + 1; });
    return `<div class="tv-h" style="--c:#4ade80"><i class="fa-solid fa-school"></i>Rede estadual de ensino<small>clique numa DRE para detalhar</small></div>
      <div class="tv-kpis">${tvKpi('#22c55e', 'Unidades escolares', fmtN(E.length), dres.length + ' DREs')}${tvKpi('#06b6d4', 'Municípios', new Set(E.map(e => e.municipio)).size, 'atendidos')}${tvKpi('#84cc16', 'Rurais', rur, pct(rur, E.length) + '% da rede')}${tvKpi('#f97316', 'Indígenas', tp['Indígena'] || 0, (tp.Quilombola || 0) + ' quilombolas')}${tvKpi('#14b8a6', 'Cívico-militares', tp['Cívico-militar'] || 0, (tp.Militar || 0) + ' militares')}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Escolas por DRE</h4>${dres.map(d => [d, E.filter(e => e.dre === d).length]).sort((a, b) => b[1] - a[1]).map(([d, n]) => `<div class="tv-bar tv-clic" style="--c:${corDRE(dres, d)}" onclick="tvDetalhe('dre',${arg(d)})"><span class="n">${esc(nomeDRE(d))}</span><span class="t"><span style="width:${n / Math.max(...dres.map(x => E.filter(e => e.dre === x).length)) * 100}%"></span></span><span class="v">${n}</span></div>`).join('')}</div>
      <div class="tv-caixa"><h4>Escolas por tipo</h4>${tvBarras(Object.entries(tp).sort((a, b) => b[1] - a[1]).map(([g, n]) => [g, n, CORES_TIPO[g] || '#94a3b8', n]))}</div></div>`; },
  mapamt(){ return `<div class="tv-h" style="--c:#22d3ee"><i class="fa-solid fa-map-location-dot"></i>Mato Grosso: escolas e DREs<small>clique numa sede para detalhar</small></div><div class="tv-mapa tv-mapamt">${tvMapaMT()}</div>`; },
  distancias(){ const X = distanciasMT(), l = X.lista, med = l.reduce((t, o) => t + o.km, 0) / l.length, por = X.dres.map(d => { const x = l.filter(o => o.e.dre === d); return [d, x.reduce((t, o) => t + o.km, 0) / x.length]; }).sort((a, b) => b[1] - a[1]);
    return `<div class="tv-h" style="--c:#fb923c"><i class="fa-solid fa-route"></i>Distância das escolas até a sua DRE<small>em linha reta</small></div>
      <div class="tv-kpis" style="grid-template-columns:repeat(4,1fr)">${tvKpi('#3b82f6', 'Média', fmtKm(med), '~' + fmtHoras(med) + ' por estrada', true)}${tvKpi('#f97316', 'A mais de 100 km', l.filter(o => o.km > 100).length, pct(l.filter(o => o.km > 100).length, l.length) + '% das escolas')}${tvKpi('#dc2626', 'A mais de 300 km', l.filter(o => o.km > 300).length, 'escolas')}${tvKpi('#a855f7', 'Mais perto de outra DRE', l.filter(o => o.prox && o.km - o.prox.km >= 40 && o.prox.km < o.km * .7).length, '40 km ou mais')}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Distância média por DRE</h4>${por.map(([d, v]) => `<div class="tv-bar tv-clic" style="--c:${faixaDist(v)[2]}" onclick="tvDetalhe('dre',${arg(d)})"><span class="n">${esc(nomeDRE(d))}</span><span class="t"><span style="width:${v / por[0][1] * 100}%"></span></span><span class="v">${fmtKm(v)}</span></div>`).join('')}</div>
      <div class="tv-caixa"><h4>Escolas mais distantes</h4><div class="tv-lista">${l.slice().sort((a, b) => b.km - a.km).slice(0, 8).map(o => `<div><span>${esc(o.e.nome)} · ${esc(o.e.municipio)}</span><b>${fmtKm(o.km)}</b></div>`).join('')}</div></div></div>`; },
  regional(){ const R = dadosRegionais().sort((a, b) => b.custo - a.custo), dres = R.map(x => x.d).sort();
    return `<div class="tv-h" style="--c:#f472b6"><i class="fa-solid fa-building-flag"></i>Gestão regional<small>custo estimado de deslocamento por ano</small></div>
      <div class="tv-grade">${R.map(x => `<div class="tv-area tv-clic" style="--c:${corDRE(dres, x.d)}" onclick="tvDetalhe('dre',${arg(x.d)})"><b>${esc(nomeDRE(x.d))}</b><small>${x.s && x.s.responsavel ? esc(x.s.responsavel) : 'sem responsável indicado'}</small><div class="nums"><span><b>${x.n}</b>escolas</span><span><b>${fmtKm(x.med)}</b>média</span><span><b>${fmtRc(x.custo)}</b>/ano</span></div></div>`).join('')}</div>`; },
  chefias(){ const T = setoresOficiais().filter(s => s.status !== 'Extinto' && CHEFIAS.includes(s.tipo)).map(s => ({ s, c:chefiaDe(s) })), n = k => T.filter(y => y.c.situacao === k).length;
    return `<div class="tv-h" style="--c:#818cf8"><i class="fa-solid fa-user-tie"></i>Chefias e sucessão<small>${T.length} chefias</small></div>
      <div class="tv-kpis" style="grid-template-columns:repeat(5,1fr)">${tvKpi('#22c55e', 'Com titular', n('Titular'), pct(n('Titular'), T.length) + '%')}${tvKpi('#f59e0b', 'Interinos', n('Interino'), '')}${tvKpi('#3b82f6', 'Em nomeação', n('Em nomeação'), '')}${tvKpi('#ef4444', 'Vagos', n('Vago'), '')}${tvKpi('#94a3b8', 'Sem registro', n('Não informado'), 'a cadastrar')}</div>
      <div class="tv-caixa" style="flex:1"><h4>Vagas e interinidades</h4><div class="tv-lista">${T.filter(y => ['Vago', 'Interino', 'Em nomeação'].includes(y.c.situacao)).sort((a, b) => (prof.get(a.s.id) || 0) - (prof.get(b.s.id) || 0)).slice(0, 8).map(y => `<div><span>${esc(y.s.nome)}</span><b style="color:${SIT_CH[y.c.situacao]}">${esc(y.c.situacao)}${y.c.desde ? ' há ' + diasDesdeData(y.c.desde) + ' dias' : ''}</b></div>`).join('') || '<div><span>Nenhuma vaga ou interinidade registrada.</span></div>'}</div></div>`; },
  riscos(){ const D = dadosInd(''), r = D.base.filter(emRisco), M = metricasEstrutura(D.base);
    return `<div class="tv-h" style="--c:#f87171"><i class="fa-solid fa-triangle-exclamation"></i>Riscos e prioridades</div>
      <div class="tv-kpis" style="grid-template-columns:repeat(4,1fr)">${tvKpi('#ef4444', 'Setores em risco', r.length, 'impacto alto com ponto fraco')}${tvKpi('#f59e0b', 'Validações pendentes', D.pend.length, D.pend.filter(v => diasDesde(v.solicitadoEm) > 15).length + ' há mais de 15 dias')}${tvKpi('#a855f7', 'Chefias sobrecarregadas', M.comSub.filter(x => x[1] > 8).length, 'mais de 8 subordinados')}${tvKpi('#64748b', 'Chefias sem responsável', M.semResp, 'de ' + M.chefias.length)}</div>
      <div class="tv-caixa" style="flex:1"><h4>Setores de impacto alto ou crítico com ponto fraco</h4><div class="tv-lista">${r.slice(0, 8).map(s => `<div><span>${esc(s.nome)}</span><b style="color:${IMPACTO[num(s.impacto)][1]}">${IMPACTO[num(s.impacto)][0]} · ${esc(statusVal(s.id))}</b></div>`).join('') || '<div><span>Nenhum setor em risco.</span></div>'}</div></div>`; },
  prop(id){ const p = (DB.propostas || []).find(x => x.id === id); if (!p) return '<div class="tv-h">Proposta removida</div>';
    const X = diffCenarios('', p.id), c = t => X.est.filter(e => e.tipo === t).length, d = X.aB - X.aA, mt = Object.assign({}, METAS_PADRAO, param('metasReestr', {})), C = cenariosRe(), cen = C.find(q => q.id === p.id), av = cen ? avaliarCenario(cen, metricasEstrutura(cen.lista), C[0], mt) : [];
    return `<div class="tv-h" style="--c:#fbbf24"><i class="fa-solid fa-lightbulb"></i>${esc(p.nome)}<small>${esc(p.status || 'Em elaboração')}</small></div>${p.descricao ? `<p class="tv-desc">${esc(p.descricao)}</p>` : ''}
      <div class="tv-kpis">${tvKpi('#22c55e', 'Criadas', c('novo') + c('reativado'), 'unidades')}${tvKpi('#ef4444', 'Extintas', c('extinto'), 'unidades')}${tvKpi('#3b82f6', 'Movidas', c('movido'), '')}${tvKpi('#a855f7', 'Renomeadas', c('renomeado') + c('tipo'), '')}${tvKpi(d > 0 ? '#ef4444' : '#22c55e', 'Custo anual', fmtRc(X.aB), (d >= 0 ? '+' : '') + fmtRs(d) + ' sobre o atual', true)}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Principais alterações</h4><div class="tv-lista">${X.est.filter(e => e.tipo !== 'editado').slice(0, 7).map(e => `<div><span>${e.txt}</span><b>${esc(e.tipo)}</b></div>`).join('') || '<div><span>Sem alterações de unidades.</span></div>'}</div></div>
      <div class="tv-caixa"><h4>Metas da reorganização</h4><div class="tv-ins">${av.map(y => `<div class="${y.ok ? 'ok' : 'alerta'}">${y.ok ? '✓' : '✗'} ${esc(y.nome)}: <b>${esc(y.valor)}</b></div>`).join('') || '<div class="info">Defina as metas em Reestruturação.</div>'}</div></div></div>`; },
  implantacao(){ const L = DB.etapas || [], co = L.filter(e => e.status === 'Concluída').length, at = L.filter(atrasada);
    return `<div class="tv-h" style="--c:#2dd4bf"><i class="fa-solid fa-list-check"></i>Implantação<small>${pct(co, L.length)}% concluído</small></div>
      <div class="tv-kpis" style="grid-template-columns:repeat(4,1fr)">${tvKpi('#14b8a6', 'Etapas', L.length, co + ' concluídas')}${tvKpi('#3b82f6', 'Em andamento', L.filter(e => e.status === 'Em andamento').length, '')}${tvKpi('#ef4444', 'Atrasadas', at.length, '')}${tvKpi('#7f1d1d', 'Bloqueadas', L.filter(e => e.status === 'Bloqueada').length, '')}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Andamento por fase</h4>${tvBarras(FASES_IM.map(f => { const l = L.filter(e => e.fase === f); return [f, l.length ? Math.round(l.filter(e => e.status === 'Concluída').length * 100 / l.length) : 0, '#14b8a6', l.length ? Math.round(l.filter(e => e.status === 'Concluída').length * 100 / l.length) + '%' : '—']; }))}</div>
      <div class="tv-caixa"><h4>Atrasadas</h4><div class="tv-lista">${at.slice(0, 7).map(e => `<div><span>${esc(e.titulo)}</span><b style="color:#f87171">${fmtDia(e.prazo)}</b></div>`).join('') || '<div><span>Nenhuma etapa atrasada.</span></div>'}</div></div></div>`; },
  metas(){ const M = DB.metas || [], O = objetivosRS();
    return `<div class="tv-h" style="--c:#f472b6"><i class="fa-solid fa-bullseye"></i>Pacto de resultados<small>${M.length} metas</small></div>
      <div class="tv-caixa" style="flex:1"><h4>Atingimento por objetivo estratégico</h4>${tvBarras(O.map(o => { const p = M.filter(m => m.objetivo === o).map(progressoMeta).filter(v => v !== null), v = p.length ? Math.round(p.reduce((a, b) => a + b, 0) / p.length * 100) : 0; return [o, v, v >= 60 ? '#22c55e' : v >= 30 ? '#f59e0b' : '#ef4444', p.length ? v + '%' : '—']; }))}</div>`; },
  agenda(){ const R = (DB.reunioes || []).slice().sort((a, b) => String(a.data).localeCompare(String(b.data))), prox = R.filter(r => r.status !== 'Realizada' && tData(r.data) >= Date.now() - 864e5), enc = []; R.forEach(r => itensReu(r).forEach(x => { if (x.encaminhamento && !x.feito) enc.push({ r, x }); }));
    return `<div class="tv-h" style="--c:#c084fc"><i class="fa-solid fa-people-group"></i>Agenda e encaminhamentos</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Próximas reuniões</h4><div class="tv-lista">${prox.slice(0, 6).map(r => `<div><span>${esc(r.titulo)}</span><b>${fmtData(r.data)}</b></div>`).join('') || '<div><span>Nenhuma reunião marcada.</span></div>'}</div></div>
      <div class="tv-caixa"><h4>Encaminhamentos em aberto</h4><div class="tv-lista">${enc.sort((a, b) => String(a.x.prazo || '9').localeCompare(String(b.x.prazo || '9'))).slice(0, 7).map(({ x }) => `<div><span>${esc(x.encaminhamento)}${x.responsavel ? ' · ' + esc(x.responsavel) : ''}</span><b style="color:${x.prazo && diasAte(x.prazo) < 0 ? '#f87171' : '#e2e8f0'}">${x.prazo ? fmtDia(x.prazo) : '—'}</b></div>`).join('') || '<div><span>Nenhum encaminhamento em aberto.</span></div>'}</div></div></div>`; }
});

document.addEventListener('keydown', e => {
  if ($('#tv-modo').classList.contains('hidden')) return;
  const noMapa = tv.slides[tv.i] && tv.slides[tv.i][0] === 'mapa' && tv.pausado && tv.moverMapa;
  if (e.target.closest && e.target.closest('input,select,textarea')) { if (e.key === 'Escape') fecharModoTV(); return; }
  if (e.key === 'Escape') { e.preventDefault(); if (tv.det && tv.slides.length) { tvPausar(false); tvMostrar(tv.i); } else fecharModoTV(); }
  else if (e.key.toLowerCase() === 's' && tv.slides.length) { e.preventDefault(); tvSumario(); }
  else if (e.key.toLowerCase() === 'm') { e.preventDefault(); tvMenu(); }
  else if (/^[1-9]$/.test(e.key) && tv.slides.length) { e.preventDefault(); tvPausar(false); tvMostrar(Number(e.key) - 1); }
  else if (noMapa && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)) { e.preventDefault(); const p = 60; ({ ArrowLeft:() => tv.moverMapa(p, 0), ArrowRight:() => tv.moverMapa(-p, 0), ArrowUp:() => tv.moverMapa(0, p), ArrowDown:() => tv.moverMapa(0, -p), '+':() => tv.moverMapa(0, 0, 1.2), '=':() => tv.moverMapa(0, 0, 1.2), '-':() => tv.moverMapa(0, 0, 1 / 1.2) })[e.key](); }
  else if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); tvPasso(1); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); tvPasso(-1); }
  else if (e.key === ' ') { e.preventDefault(); tvPausar(); }
  else if (e.key.toLowerCase() === 'f') tvTelaCheia();
  e.stopImmediatePropagation();
}, true);
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && !$('#tv-modo').classList.contains('hidden')) { /* continua em tela normal */ } });
$('#tv-modo').addEventListener('pointermove', () => { const el = $('#tv-modo'); el.classList.remove('ocioso'); clearTimeout(tv.ocioso); tv.ocioso = setTimeout(() => el.classList.add('ocioso'), 3000); });

/* Erros inesperados depois de aberto: avisa em vez de falhar em silêncio */
window.addEventListener('error', e => { if (window.GABORG_INICIADO && e.message && typeof toast === 'function') toast('Erro: ' + e.message + ' — recarregue a página. Se repetir, envie esta mensagem ao suporte.', 'erro'); });
window.addEventListener('unhandledrejection', e => { const m = e.reason && (e.reason.message || String(e.reason)); if (window.GABORG_INICIADO && m && !/abort/i.test(m) && typeof toast === 'function') console.warn('GABOrg:', m); });

/* ===================== AVISO DE ATUALIZAÇÃO DO APP ===================== */
/* Consulta o index.html publicado (sem cache). Se a versão lá for mais nova que a que está rodando, avisa e oferece atualizar. */
const atu = { nova:'', dispensadaEm:0, ultima:0 };
function compararVersao(a, b){ const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0 ? 1 : -1; } return 0; }
async function verificarAtualizacao(manual){
  if (!/^https?:$/.test(location.protocol)) { if (manual) toast('A verificação só funciona com o sistema publicado (GitHub Pages).', 'aviso'); return; }
  atu.ultima = Date.now();
  try {
    const r = await fetch(location.pathname.replace(/[^/]*$/, '') + 'index.html?nc=' + Date.now(), { cache:'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const h = await r.text(), m = h.match(/GABORG_VERSAO_HTML\s*=\s*'([\d.]+)'/) || h.match(/arquivo\.js\?v=([\d.]+)/), n = h.match(/GABORG_NOVIDADES\s*=\s*"([^"]*)"/);
    const nova = m && m[1];
    if (nova && compararVersao(nova, VERSAO) > 0) { atu.nova = nova; mostrarAtualizacao(nova, n ? n[1] : '', manual); }
    else if (manual) toast(`Você já está na versão mais recente (${VERSAO}).`);
  } catch (e) { if (manual) toast('Não foi possível verificar agora: ' + e.message, 'aviso'); }
}
function mostrarAtualizacao(nova, novidades, manual){
  if (!manual && atu.dispensadaEm && Date.now() - atu.dispensadaEm < 30 * 60 * 1000) return;
  let el = $('#atu-app');
  if (!el) { el = document.createElement('div'); el.id = 'atu-app'; el.className = 'atu-app'; el.setAttribute('role', 'alert'); document.body.appendChild(el); }
  const pend = (typeof fila !== 'undefined' && fila.length) ? fila.length : 0;
  el.innerHTML = `<div class="ic"><i class="fa-solid fa-rotate"></i></div>
    <div class="tx"><b>Nova versão do GABOrg disponível</b><small>Versão ${esc(nova)} · você está na ${esc(VERSAO)}</small>
      ${novidades ? `<p>${esc(novidades)}</p>` : ''}
      ${pend ? `<p class="pd"><i class="fa-solid fa-cloud-arrow-up"></i>${pend} alteração(ões) ainda não enviada(s) ficam guardadas e são enviadas depois de atualizar.</p>` : ''}</div>
    <div class="bt"><button class="btn btn-p btn-sm" onclick="atualizarApp()"><i class="fa-solid fa-rotate"></i>Atualizar agora</button><button class="btn btn-s btn-sm" onclick="dispensarAtualizacao()">Depois</button></div>`;
  requestAnimationFrame(() => el.classList.add('on'));
}
function dispensarAtualizacao(){ atu.dispensadaEm = Date.now(); const el = $('#atu-app'); if (el) { el.classList.remove('on'); setTimeout(() => el.remove(), 300); } }
function atualizarApp(){
  const el = $('#atu-app'); if (el) el.querySelector('.bt').innerHTML = '<span class="s"><i class="fa-solid fa-spinner fa-spin"></i> Atualizando...</span>';
  try { if (typeof salvarLocal === 'function') salvarLocal(); } catch (e) {}
  window.GABORG_LIMPAR();
}
setTimeout(() => verificarAtualizacao(false), 8000);
setInterval(() => { if (!document.hidden) verificarAtualizacao(false); }, 15 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - atu.ultima > 5 * 60 * 1000) verificarAtualizacao(false); });

/* ===================== MENU DO USUÁRIO ===================== */
function menuUsuario(){
  const sync = $('#sync') ? $('#sync').outerHTML : '';
  const m = document.createElement('div'); m.className = 'modal';
  const escuro = document.documentElement.dataset.tema === 'escuro';
  m.innerHTML = `<div class="cx" role="dialog" aria-modal="true" style="max-width:380px"><div class="menu-u">
    <div class="cab"><span class="av">${esc(iniciais(cfg.usuario || cfg.login))}</span><div style="min-width:0"><b>${esc(cfg.usuario || cfg.login || 'Usuário')}</b><small>${esc(cfg.login || '')} · ${esc(cfg.perfil || '')}</small>${sync}</div></div>
    ${appInstalavel() ? '<button class="it" data-a="instalar"><i class="fa-solid fa-download"></i>Instalar o GABOrg como app</button>' : ''}
    <button class="it" data-a="atualizar"><i class="fa-solid fa-rotate"></i>${atu.nova ? `Atualizar para a versão ${esc(atu.nova)}` : 'Verificar atualização'}<small style="margin-left:auto;color:var(--mut2)">v${VERSAO}</small></button>
    <button class="it" data-a="busca"><i class="fa-solid fa-magnifying-glass"></i>Busca rápida</button>
    <button class="it" data-a="tv"><i class="fa-solid fa-tv"></i>Modo TV (apresentação)</button>
    <button class="it" data-a="tema"><i class="fa-solid fa-circle-half-stroke"></i>${escuro ? 'Tema claro' : 'Tema escuro'}</button>
    <button class="it" data-a="senha"><i class="fa-solid fa-key"></i>Alterar minha senha</button>
    <button class="it" data-a="config"><i class="fa-solid fa-gear"></i>Configurações</button>
    <button class="it perigo" data-a="sair"><i class="fa-solid fa-power-off"></i>Sair</button>
    <button class="it" data-a="fechar" style="justify-content:center;color:var(--mut)">Fechar</button>
  </div></div>`;
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b && e.target !== m) return;
    m.remove(); const a = b && b.dataset.a;
    if (a === 'instalar') instalarApp();
    if (a === 'atualizar') { if (atu.nova) atualizarApp(); else verificarAtualizacao(true); }
    if (a === 'busca') setTimeout(abrirPaleta, 50);
    if (a === 'tv') abrirModoTV();
    if (a === 'tema') alternarTema();
    if (a === 'senha') modalTrocarSenha(false);
    if (a === 'config') trocarVista('config');
    if (a === 'sair') sair();
  });
  document.body.appendChild(m);
}

/* ===================== APP INSTALÁVEL (PWA) ===================== */
let pedidoInstalacao = null;
const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const rodandoComoApp = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const appInstalavel = () => !rodandoComoApp() && (!!pedidoInstalacao || (ehIOS() && location.protocol === 'https:'));
function atualizarInstalavel(){ document.body.classList.toggle('pode-instalar', appInstalavel()); }
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalacao = e; atualizarInstalavel(); });
window.addEventListener('appinstalled', () => { pedidoInstalacao = null; atualizarInstalavel(); toast('GABOrg instalado. Abra pelo ícone na tela inicial.'); });
async function instalarApp(){
  if (pedidoInstalacao) {
    pedidoInstalacao.prompt();
    try { await pedidoInstalacao.userChoice; } catch (e) {}
    pedidoInstalacao = null; atualizarInstalavel(); return;
  }
  if (ehIOS()) return abrirModal({ titulo:'Instalar no iPhone ou iPad', rotulo:'Entendi', semCancelar:true,
    html:`<p>No <b>Safari</b>:</p><ol style="margin:0;padding-left:20px;font-size:13.5px;line-height:1.9;color:var(--txt2)"><li>Toque em <b>Compartilhar</b> <i class="fa-solid fa-arrow-up-from-bracket"></i> na barra do navegador.</li><li>Escolha <b>Adicionar à Tela de Início</b>.</li><li>Confirme em <b>Adicionar</b>. O GABOrg abre em tela cheia, como um app.</li></ol>` });
  toast('Use o menu do navegador › "Instalar app" ou "Adicionar à tela inicial".');
}
// Sem service worker: o app é só index.html + arquivo.js. Remove o de versões anteriores (sw.js), se houver.
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
atualizarInstalavel();

window.GABORG_VERSAO_JS = VERSAO;
(async function iniciar(){
  window.GABORG_INICIADO = true;
  if (window.GABORG_VERSAO_HTML && window.GABORG_VERSAO_HTML !== VERSAO) setTimeout(() => toast(`Versões diferentes: index.html ${window.GABORG_VERSAO_HTML} × arquivo.js ${VERSAO}. Envie os dois arquivos da mesma versão ao GitHub.`, 'aviso'), 1500);
  $('#lg-login').value = cfg.login || ''; $('#lg-url').value = cfg.url || URL_PADRAO;
  $('#lg-lembrar').checked = sessao.lembrado();
  if (!cfg.token || !cfg.url || cfg.modo !== 'nuvem') return mostrarLogin();
  const d = store.get('gaborg_db', null);
  if (d && Array.isArray(d.setores) && d.setores.length) { DB = d; TABS_DB.forEach(t => DB[t] = (DB[t] || []).map(x => novoReg(t, x))); abrirApp(); }
  try {
    const me = await chamar({ action:'me' }, 30000);
    if (me.status !== 'success') { if (me.code !== 'AUTH') throw new Error(me.message); return; }
    aplicarUsuario(me.usuario);
    if (me.usuario.trocarSenha === 'Sim') { const ok = await modalTrocarSenha(true); if (!ok) return; }
    await carregarNuvem();
    if (!$('#app').classList.contains('hidden')) redesenharTudo(); else abrirApp();
    statusSync();
  } catch (e) {
    ultimoErro = e.message; statusSync();
    if ($('#app').classList.contains('hidden')) mostrarLogin(e.message);
  }
})();
