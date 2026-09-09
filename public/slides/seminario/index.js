import { floydCarouselSlide } from './floyd-carousel.js';
import * as G from '../equilibrada/modelos.js';
import * as A from '../equilibrada/simulacoes.js';
import * as M from './modelos.js';
import { pergunta, resposta, polls } from './questoes.js';
import { artigos } from './artigos.js';
import { heuristicas } from './heuristicas.js';
import * as ALG from './algoritmos.js';
import * as P from './passos.js';

/** Insere slides logo depois do slide de id `alvo`; estoura se o id sumir. */
function inserir(bloco, alvo, novos) {
  const i = bloco.findIndex(s => s.id === alvo);
  if (i < 0) throw new Error('id não encontrado no bloco: ' + alvo);
  return [...bloco.slice(0, i + 1), ...novos, ...bloco.slice(i + 1)];
}
export { polls };
const step=(title,text)=>({title,text});
const d=A.dijkstra(M.provaDijkstra,'D');
const traceD=(i)=>({id:`prova-dijkstra-passo-${i+1}`,type:'trace',minutes:1,
  eyebrow:`Dijkstra · resolução passo a passo · ${i+1}/2`,title:i===0?'Retirar D; registrar quatro estimativas':'Retirar F; melhorar E e descobrir G',
  description:i===0?'Partindo de D=0, os arcos de D dão as primeiras estimativas para A, B, E e F. C e G continuam com ∞.':'F tem a menor estimativa entre os abertos: 1. Por F, E passa de 5 para 1+3=4, e G recebe 1+1=2.',
  graph:M.destacar(M.provaDijkstra,{nodes:Object.fromEntries(d.frames.slice(0,i+1).map(f=>[f.u,'done'])),edges:i===0?[['D','A'],['D','B'],['D','E'],['D','F']]:[['F','E'],['F','G']],notes:Object.fromEntries(Object.entries(d.frames[i].distance).map(([v,c])=>[v,A.mostrar(c)])),caption:'Traços verdes: arcos relaxados neste passo. Anotações: estimativas atuais.'}),
  headers:['vértice','antes','depois'],rows:['A','B','C','D','E','F','G'].map(v=>[v,i===0?(v==='D'?'0':'∞'):A.mostrar(d.frames[i-1].distance[v]),A.mostrar(d.frames[i].distance[v])])});

const bloco1=[
  {id:'abertura',type:'cover',minutes:2,
    title:'Seminário de',highlight:'Grafos',
    names:['Antonio Neto','Thales Matheus','Ji Xinyi','Lucas Emerick']},
  {id:'agenda',type:'compare',minutes:1,eyebrow:'Índice',title:'Quatro partes',
    columns:[
      {title:'Parte 1 · Modelagem e busca',items:[
        'G = (V, E): famílias, matrizes de incidência e adjacência',
        'BFS: fila, níveis e árvore de caminhos mínimos',
        'DFS: pilha, tempos de descoberta e término',
        'Passeio, trajeto, caminho e componentes conexos',
        'Dijkstra: relaxamento e menor estimativa em aberto']},
      {title:'Parte 2 · Caminhos mínimos',items:[
        'Raio, diâmetro e excentricidade a partir da BFS',
        'Dijkstra em rede: uma árvore por origem',
        'Peso negativo: onde a garantia quebra',
        'Bellman–Ford: passagens e ciclo negativo',
        'Floyd–Warshall: todos os pares, um intermediário por vez']},
      {title:'Parte 3 · Árvores, ordem e fluxo',items:[
        'Árvore geradora e a propriedade do corte seguro',
        'Kruskal com união-busca · Prim por corte',
        'Ordenação topológica e fechos transitivos',
        'Kosaraju: componentes fortemente conexos',
        'Euler e Hamilton · Ford–Fulkerson e corte mínimo']},
      {title:'Parte 4 · Heurística e aplicações',items:[
        'Gulosa, Dijkstra e A*: qual número decide',
        'Coloração: guloso, efeito da ordem e Welsh–Powell',
        'Três artigos: logística, compiladores e química']}
    ]},
  // Este slide abre o seminário: não pode citar algoritmo nenhum, porque
  // nenhum foi apresentado ainda. A tabela que liga pergunta a algoritmo está
  // no fim da parte 2, quando BFS, Dijkstra e os demais já existem.
  {id:'modelo',type:'concept',minutes:2,title:'O que vira vértice e o que vira aresta',graph:G.rotas,
    description:'G = (V, E) reúne os vértices e suas ligações. n = |V| é o número de vértices e m = |E|, o de arestas. A modelagem define o que esses elementos representam.',
    points:[
      '**Vértice**: o objeto sobre o qual a pergunta fala. Em rotas, a cidade — não a estrada.',
      '**Aresta**: a relação que a pergunta usa. Aqui, existe ligação direta entre dois pontos.',
      '**Peso**: representa uma medida da ligação, como distância, tempo ou capacidade. A pergunta define como essa medida será usada.',
      '**Direção**: uma seta indica o sentido permitido. Ligações nos dois sentidos podem ser uma aresta não dirigida ou dois arcos.'
    ],
    note:{kind:'key',title:'Exemplo: pontes de Königsberg',
      text:'As regiões de terra são vértices e as pontes são arestas. Assim, atravessar cada ponte uma vez vira uma pergunta sobre percorrer as arestas.'}},
  {id:'representacao',type:'code',minutes:2,title:'Listas e matrizes favorecem operações diferentes',graph:G.rotas,lines:['S: (A,2), (B,5)','A: (B,1), (T,7)','B: (T,3)','T: []'],description:'Na lista, acessar a lista de um vértice custa O(1), mas percorrer todos os seus vizinhos custa O(grau de saída). Na matriz, testar um arco custa O(1) e percorrer uma linha custa O(n).',note:{kind:'key',title:'Como ler o exemplo',text:'S→A e A→B existem; seus reversos não foram declarados. n=4 e m=5.'}},
  {id:'bfs-regra',type:'code',minutes:2,title:'BFS: descobrir por camadas',lines:['d[s] = 0; demais d[v] = ∞','fila = [s]','enquanto fila não vazia:','  u = retirar do início','  para cada vizinho v ainda não descoberto:','    d[v] = d[u]+1; pai[v] = u','    inserir v no fim da fila'],description:'Marcar ao enfileirar evita duplicatas. As distâncias contam arestas. Com listas, tempo O(n+m).'},
  {id:'bfs-quadro',type:'trace',minutes:2,title:'A fila conta a história da busca',graph:M.destacar(G.rede,{edges:[['A','B'],['A','C'],['B','D'],['D','E']],notes:{A:'0',B:'1',C:'1',D:'2',E:'3'},caption:'Vizinhos em ordem alfabética. C encontra D já descoberto.'}),headers:['retira','fila depois','novos'],rows:A.bfs(G.rede,'A').frames.map(f=>[f.u,f.queue.join(', ')||'vazia',f.discovered.join(', ')||'nenhum']),description:'A árvore de pais recupera A–B–D–E. Três arestas: nenhuma rota com menos arestas chega a E.'},
  {id:'dfs-regra',type:'compare',minutes:2,title:'BFS e DFS mudam a ordem da exploração',columns:[{title:'BFS',items:['Usa uma fila.','Explora primeiro os vértices mais próximos da origem.','Calcula o menor número de arestas.']},{title:'DFS',items:['Usa uma pilha, explícita ou pela recursão.','Segue um ramo até não encontrar vizinho novo.','Registra descoberta e término.']}],description:'As duas buscas visitam todos os vértices alcançáveis em O(n+m). A ordem da visita determina quais propriedades cada uma revela.'},
  {id:'dijkstra-invariante',type:'code',minutes:2,title:'Dijkstra finaliza a menor estimativa em aberto',lines:['d[s] = 0; demais d[v] = ∞','enquanto houver vértice aberto com d finito:','  extrair e finalizar u com menor d[u]','  para cada arco u→v com v ainda aberto:','    se d[u] + peso(u,v) < d[v]:','      d[v] = d[u] + peso(u,v); pai[v] = u','      atualizar a prioridade de v'],description:'Aberto: distância ainda provisória. Com pesos não negativos, a menor estimativa em aberto já é definitiva e pode ser finalizada.',note:{kind:'key',title:'Relaxamento e custo',text:'Relaxar é comparar um custo candidato com d[v] e atualizar se for menor. Com heap binário e listas: O((n+m) log n). Com varredura: O(n²+m).'}},
  // A questão vem DEPOIS do algoritmo e do passo a passo dele: a sala precisa
  // ter visto Dijkstra rodar antes de ser cobrada num trace de Dijkstra.
  pergunta('enade_dijkstra'),traceD(0),traceD(1),resposta('enade_dijkstra'),
];
const bloco2=[
  {id:'ospf-modelo',type:'concept',minutes:2,title:'Cada roteador calcula suas próprias rotas',graph:G.rotas,description:'Os roteadores trocam informações sobre conexões e custos. Assim, cada um mantém uma visão da topologia e executa Dijkstra usando a si mesmo como origem.',points:['O custo da rota é a soma dos pesos, não a quantidade de conexões.','S–A–T: duas conexões, custo 9.','S–A–B–T: três conexões, custo 6.','Uma origem diferente pode produzir outra árvore de caminhos mínimos.'],note:{kind:'tip',title:'Leitura da prova',text:'A questão simplifica o sistema autônomo. Em OSPF real, a organização em áreas delimita o escopo das bases de estado de enlace.'}},
  pergunta('enade_ospf'),resposta('enade_ospf'),
  {id:'peso-negativo',type:'concept',minutes:2,title:'Pesos negativos quebram a garantia de Dijkstra',graph:M.negativo,description:'Dijkstra finalizaria A com custo 2 antes de B. Porém, o caminho S→B→A custa 5−4=1. Com esse arco negativo, finalizar A nesse momento produz uma resposta incorreta.',note:{kind:'check',title:'Diagnóstico',text:'Não basta decorar o algoritmo. Verifique a origem, o objetivo, o sentido das arestas e os sinais dos pesos.'}},
  {id:'bellman-ford',type:'steps',minutes:2,title:'Bellman–Ford: propagar melhorias por passagens',items:[step('Inicializar','Origem com zero; demais com infinito.'),step('Relaxar todas as arestas','Até n−1 passagens. Após a passagem k, caminhos com até k arestas já foram considerados. Atualizações imediatas podem avançar além disso.'),step('Detectar ciclo negativo','Se ainda houver melhora após n−1 passagens, existe ciclo negativo alcançável da origem.')],description:'O(nm). Sem ciclo negativo alcançável, existe um caminho mínimo simples para cada destino alcançável, com até n−1 arestas.'},
  {id:'floyd-regra',type:'code',minutes:2,title:'Floyd–Warshall: caminhos mínimos entre todos os pares',lines:['D[i][j] = menor peso de i→j, ou ∞','D[i][i] = min(0, D[i][i])','para k de 1 até n:','  para i de 1 até n:','    para j de 1 até n:','      D[i][j] = min(D[i][j], D[i][k]+D[k][j])'],description:'Em cada rodada, um novo vértice pode participar como intermediário. Ao final, D[i][j] guarda a menor distância de i até j. Tempo O(n³), espaço O(n²).',note:{kind:'warn',title:'Condição',text:'Admite pesos negativos. Uma diagonal negativa indica ciclo negativo. Um par perde o mínimo finito se pode passar por esse ciclo e chegar ao destino.'}},
  floydCarouselSlide,
  pergunta('poscomp_floyd'),resposta('poscomp_floyd'),
  {id:'escolha-caminhos',type:'table',minutes:2,title:'Resumo de caminho mínimo',headers:['Entrada / saída','Algoritmo','Custo usual'],rows:[['Uma origem, menos arestas','BFS','O(n+m)'],['Uma origem, pesos ≥0','Dijkstra + heap','O((n+m) log n)'],['Uma origem, pesos negativos','Bellman–Ford','O(nm)'],['Todos os pares','Floyd–Warshall','O(n³)']],note:{kind:'key',title:'Conexão com logística',text:'Uma matriz de distâncias entre depósitos e clientes pode alimentar outro problema: decidir a ordem das visitas.'}},
];
const bloco3=[
  {id:'agm-intro',type:'section',minutes:1,title:'Árvores geradoras mínimas',description:'Uma árvore geradora mínima conecta todos os vértices com a menor soma possível dos pesos das arestas.'},
  {id:'agm-versus-caminho',type:'compare',minutes:2,title:'AGM e caminhos mínimos minimizam coisas diferentes',columns:[{title:'Árvore geradora mínima',items:['Conecta todos os vértices.','Minimiza a soma das arestas da árvore.','Grafo não dirigido, conexo e ponderado.']},{title:'Árvore de caminhos mínimos',items:['Parte de uma origem escolhida.','Minimiza a distância da origem a cada vértice.','Não minimiza o custo total da infraestrutura.']}],description:'Em um grafo desconexo, Prim/Kruskal podem ser usados para obter uma floresta geradora mínima.'},
  {id:'kruskal-quadro',type:'trace',minutes:3,title:'Kruskal: aceitar só o que une componentes',graph:M.destacar(G.ponderado,{edges:[['A','B'],['A','D'],['C','E'],['B','E']],caption:'AB=2, AD=3, CE=3, BE=5. Total 13; quatro arestas para cinco vértices.'}),headers:['aresta','peso','decisão'],rows:[['A–B','2','aceitar'],['A–D','3','aceitar'],['C–E','3','aceitar'],['B–D','4','rejeitar: forma ciclo'],['B–E','5','aceitar: conecta os grupos']],description:'Ordenar custa O(m log m). O teste de ciclo pode usar Union–Find.'},
  {id:'prim-quadro',type:'trace',minutes:2,title:'Prim: crescer a partir de um conjunto',graph:M.destacar(G.ponderado,{edges:[['A','B'],['A','D'],['B','E'],['E','C']],caption:'Mesma AGM, outra ordem de construção. Começar em A.'}),headers:['dentro','menor aresta que sai','custo total'],rows:[['{A}','A–B: 2','2'],['{A,B}','A–D: 3','5'],['{A,B,D}','B–E: 5','10'],['{A,B,D,E}','E–C: 3','13']],description:'Escolher a menor aresta que cruza o corte. Não escolher a menor distância acumulada desde A.'},
  {id:'union-find',type:'steps',minutes:2,title:'Union–Find mantém os componentes do Kruskal',items:[step('Consultar os representantes','find(u) e find(v) identificam o componente de cada ponta.'),step('Representantes iguais','A aresta fecharia um ciclo e deve ser rejeitada.'),step('Representantes diferentes','A aresta une dois componentes e pode ser aceita.')],description:'Compressão de caminhos e união por tamanho tornam cada operação quase constante em média. Em Kruskal, o maior custo vem da ordenação das arestas.'},
  {id:'topologica',type:'trace',minutes:3,title:'Ordenação topológica pela ordem de término da DFS',graph:G.dag,headers:['DFS a partir de 1','ordem'],rows:[['Descoberta (vizinhos crescentes)','1, 2, 4, 5, 3'],['Término','5, 4, 2, 3, 1'],['Término invertido','1, 3, 2, 4, 5']],description:'Em um DAG (dígrafo acíclico), inverter a ordem de término coloca cada origem antes do destino de seus arcos.',note:{kind:'check',title:'Outra abordagem: Kahn',text:'Os próximos passos removem vértices de grau de entrada zero. Kahn produz 1,2,3,4,5 neste exemplo. As duas ordens são válidas.'}},
  {id:'kosaraju',type:'steps',minutes:3,eyebrow:'Visão geral · três fases',title:'Kosaraju: duas buscas separam componentes fortes',graph:G.dirigido,items:[step('Primeira DFS no original','Guardar término: d, c, b, a, começando por a.'),step('Inverter todos os arcos','No transposto, visitar a, b, c, d por término decrescente.'),step('Cada nova árvore é uma CFC','Componentes: {a}, {b,c}, {d}. Custo O(n+m).')],description:'O slide resume as fases e o resultado neste grafo. b e c alcançam um ao outro; a chega até d, mas d não retorna a a.'},
  pergunta('poscomp_familias'),resposta('poscomp_familias'),
  {id:'fila-nao-e-bfs',type:'compare',minutes:1,title:'Fila FIFO e fila de prioridade têm regras distintas',columns:[{title:'BFS',items:['Primeiro a entrar, primeiro a sair.','Camadas por quantidade de arestas.']},{title:'Prim / Dijkstra',items:['Prim: menor aresta cruzando o corte.','Dijkstra: menor distância estimada.']}],description:'Na BFS, os vértices saem na ordem em que entraram. Prim e Dijkstra escolhem pela menor prioridade, que pode mudar durante a execução.'},
];
const bloco4=[
  {id:'heuristicas-intro',type:'section',minutes:.5,title:'Busca com heurísticas e aplicações de grafos',description:'A questão da transportadora introduz o uso de estimativas. Depois, três artigos mostram outras perguntas que podem ser modeladas com grafos.'},
  heuristicas,
  pergunta('enade_gulosa'),
  {id:'gulosa-quadro',type:'trace',minutes:2,title:'Quatro escolhas, sempre olhando h',graph:M.destacar(M.cidades,{edges:[['Manaus','P. Velho'],['P. Velho','Cuiabá'],['Cuiabá','Goiânia'],['Goiânia','S. Paulo']],caption:M.cidades.caption}),headers:['em','comparar estimativas','ir para'],rows:[['Manaus','2464 < 2665','P. Velho'],['P. Velho','1326 < 1489 < 2693','Cuiabá'],['Cuiabá','809 < 2464','Goiânia'],['Goiânia','0 < 1326 < 1489','São Paulo']],description:'A escolha segue a regra local do enunciado. Nenhum custo de trecho foi somado.'},
  resposta('enade_gulosa'),
];
// Insere as execuções detalhadas junto das explicações correspondentes.
// Floyd–Warshall, Kosaraju e Fleury têm exemplos delimitados; A* aparece só na
// comparação de prioridades, e os métodos dos artigos são conceituais.
const pegarPorId = (bloco, id) => {
  const slide = bloco.find(s => s.id === id);
  if (!slide) throw new Error('id não encontrado no bloco: ' + id);
  return slide;
};

// Primeiro vem a linguagem do grafo; depois, como armazená-lo. Só então entram
// percursos, conectividade e buscas.
let b1 = [
  ...bloco1.slice(0, 3),
  ...ALG.baseFundamentos,
  pegarPorId(bloco1, 'representacao'),
  ...ALG.baseConectividade,
  ...bloco1.slice(4, 6),
  pegarPorId(bloco1, 'dfs-regra'),
  ...ALG.detalheDfs,
  ...bloco1.slice(7)
];
b1 = inserir(b1, 'bfs-quadro', P.passosBfs);
b1 = inserir(b1, 'alg-dfs-execucao', P.passosDfs);
b1 = inserir(b1, 'dijkstra-invariante', P.passosDijkstra);
let b2 = [
  ...ALG.metricas.map(s => ({ ...s, eyebrow: 'Da BFS às medidas de distância' })),
  ...bloco2
];
b2 = inserir(b2, 'bellman-ford', P.passosBellman);
let b3 = inserir(bloco3, 'agm-intro', ALG.teoriaArvores);
b3 = inserir(b3, 'topologica', ALG.alcance);
// Union–Find explica o teste de ciclo antes da execução de Kruskal. A comparação
// das filas fecha a preparação da questão; Kahn fica depois, como outra solução.
b3 = b3.filter(s => !['union-find', 'fila-nao-e-bfs'].includes(s.id));
b3 = inserir(b3, 'agm-versus-caminho', [
  pegarPorId(bloco3, 'union-find')
]);
b3 = inserir(b3, 'kosaraju', [
  pegarPorId(bloco3, 'fila-nao-e-bfs')
]);
b3 = inserir(b3, 'kruskal-quadro', P.passosKruskal);
b3 = inserir(b3, 'prim-quadro', P.passosPrim);
b3 = inserir(b3, 'poscomp_familias-resposta', P.passosKahn);
b3 = inserir(b3, 'p-kahn-6', [...ALG.eulerHamilton, ...ALG.fluxoMaximo]);
b3 = inserir(b3, 'alg-ford-fulkerson', P.passosFluxo);
b3 = b3.map(s => s.id === 'p-kahn-1'
  ? { ...s, eyebrow: 'Outra forma de ordenar · passo 1/6' }
  : s.id === 'topologica'
    ? { ...s, eyebrow: 'Dependências em dígrafos' }
  : s.id === 'alg-euler-hamilton'
    ? { ...s, eyebrow: 'Percursos especiais' }
    : s.id === 'alg-fleury'
      ? { ...s, eyebrow: 'Exemplo de percurso · resultado comentado' }
    : s.id === 'alg-fluxo-viavel'
      ? { ...s, eyebrow: 'Fluxo em redes' }
      : s);
// Coloração entra ANTES dos artigos: ela é o que dá sentido ao de Chaitin,
// em que alocar registradores é literalmente colorir um grafo.
let b4 = inserir(bloco4, 'enade_gulosa-resposta', ALG.coloracao);
b4 = inserir(b4, 'alg-guloso-cores', P.passosCores);
b4 = inserir(b4, 'alg-ordem-cores', [...P.passosWelsh, ...artigos]);
b4 = b4.map(s => s.id === 'alg-coloracao'
  ? { ...s, eyebrow: 'Outro problema com escolha gulosa' }
  : s.id === 'artigo-dantzig'
    ? { ...s, eyebrow: 'Aplicações em diferentes áreas' }
    : s);
/**
 * Resumos que uma execução detalhada tornou redundantes.
 *
 * Cada um destes era UM slide contando o que o algoritmo faz. Agora existe a
 * execução completa, passo por passo, do mesmo algoritmo — manter os dois é
 * repetir o conteúdo e gastar o tempo que o seminário não tem.
 */
const SUPERADOS = new Set([
  'bfs-quadro',        // 6 passos de BFS
  'alg-dfs-execucao',  // 11 passos de DFS
  'kruskal-quadro',    // 6 passos de Kruskal
  'prim-quadro',       // 5 passos de Prim
  'alg-ford-fulkerson',// 4 aumentos de Ford–Fulkerson
  'alg-guloso-cores'   // 5 passos de coloração
]);

/**
 * Orçamento por tipo de slide, em minutos. É a ÚNICA fonte da duração:
 * os minutos escritos à mão em cada slide são substituídos por estes.
 *
 * O seminário tem 1h20. Mexer aqui é como esticar ou encolher a apresentação
 * inteira sem tirar conteúdo.
 */
const ORCAMENTO = {
  passo: 0.25,       // 15 segundos: só muda o estado, o desenho já é conhecido
  cover: 1,
  section: 0.5,
  compare: 0.75,
  table: 1,
  list: 1,
  concept: 1,
  code: 1,
  definition: 1,
  trace: 1,
  steps: 1.25,
  article: 8 / 3,      // 2min40s: os três artigos preservam os oito minutos do bloco
  votacao: 2,        // ler o enunciado da prova, pensar e votar
  gabarito: 1        // resolução comentada
};

const orcar = slide => {
  if (/^p-/.test(slide.id)) return ORCAMENTO.passo;
  if (slide.id === 'dfs-regra') return 1.25;
  if (slide.type === 'question') return slide.reveal ? ORCAMENTO.gabarito : ORCAMENTO.votacao;
  return ORCAMENTO[slide.type] ?? 1;
};

const aplicar = bloco => bloco
  .filter(s => !SUPERADOS.has(s.id))
  .map(({ note, ...s }) => ({ ...s, minutes: orcar(s) }));

export const MODULOS=[b1,b2,b3,b4].map(aplicar).map((slides,i)=>({id:`bloco-${i+1}`,minutes:slides.reduce((t,s)=>t+s.minutes,0),slides}));
export const DURACAO_ESTIMADA=MODULOS.reduce((t,m)=>t+m.minutes,0);
export const slides=MODULOS.flatMap((m,i)=>m.slides.map(s=>({...s,module:m.id,parte:i+1})));
