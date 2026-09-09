// Estados da referência: cada passagem lê as distâncias da passagem anterior.
const vertices = ['a', 'b', 'c', 'd', 'e', 'f'];
const distances = [
  ['∞', '∞', '0', '∞', '∞', '∞'],
  ['5', '∞', '0', '∞', '1', '∞'],
  ['5', '2', '0', '∞', '1', '9'],
  ['5', '2', '0', '3', '1', '9'],
  ['5', '2', '0', '3', '1', '4'],
  ['5', '2', '0', '3', '1', '4']
];
const predecessors = [
  ['—', '—', '—', '—', '—', '—'],
  ['c', '—', '—', '—', 'c', '—'],
  ['c', 'e', '—', '—', 'c', 'e'],
  ['c', 'e', '—', 'b', 'c', 'e'],
  ['c', 'e', '—', 'b', 'c', 'd'],
  ['c', 'e', '—', 'b', 'c', 'd']
];
export const bellmanTables = distances.map((values, index) => ({
  title: index ? `${index}ª passagem` : 'Inicialização',
  rows: vertices.map((vertex, row) => [vertex, values[row], predecessors[index][row]]),
  changedRows: index ? values.flatMap((value, row) => value !== distances[index - 1][row] ? [row] : []) : []
}));
export const bellmanGraph = {
  view: [800, 440], directed: true,
  nodes: [
    {id:'c',x:65,y:220}, {id:'a',x:245,y:80}, {id:'e',x:245,y:360},
    {id:'b',x:555,y:80}, {id:'f',x:555,y:360}, {id:'d',x:735,y:220}
  ],
  edges: [
    {from:'c',to:'a',weight:5}, {from:'c',to:'e',weight:1},
    {from:'a',to:'b',weight:6}, {from:'e',to:'b',weight:1,labelOffset:[75,-65]},
    {from:'e',to:'f',weight:8}, {from:'b',to:'d',weight:1},
    {from:'d',to:'f',weight:1}, {from:'f',to:'b',weight:1},
    {from:'f',to:'a',weight:2,labelOffset:[-75,-65]}
  ],
  caption: 'Grafo dirigido · origem c'
};
export const bellmanGraphFrames = bellmanTables.map(frame => {
  const changed = new Set(frame.changedRows.map(index => frame.rows[index][0]));
  const rows = Object.fromEntries(frame.rows.map(row => [row[0], row]));
  return {
    ...bellmanGraph,
    nodes: bellmanGraph.nodes.map(node => ({...node, note: `d = ${rows[node.id][1]}`, state: changed.has(node.id) ? 'active' : undefined})),
    edges: bellmanGraph.edges.map(edge => ({...edge,
      state: rows[edge.to][2] === edge.from ? (changed.has(edge.to) ? 'updated' : 'tree') : undefined
    })),
    caption: `${frame.title} · ${changed.size ? 'Laranja: arestas que melhoraram distâncias nesta passagem.' : 'Nenhuma distância atualizada.'} Verde: demais predecessores atuais.`
  };
});
export const bellmanCarouselSlides = [
  {title:'De c aos demais vértices',description:'Teste todas as arestas usando as distâncias da passagem anterior.',carouselStart:0},
  {title:'Cinco passagens, distâncias estáveis',description:'Na 4ª passagem, f melhora para 4 via d. A 5ª não altera nenhuma distância.',carouselStart:0,graphFrames:bellmanGraphFrames}
].map(slide => ({...slide,type:'trace',eyebrow:'Bellman–Ford · origem c',graph:bellmanGraph,headers:['Vértice','dist','pred'],carousel:bellmanTables}));
