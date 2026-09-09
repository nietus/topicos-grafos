import { bellmanGraph } from './bellman-carousel.js';

export const floydVertices = ['a', 'b', 'c', 'd', 'e', 'f'];
export const floydGraph = {
  ...bellmanGraph,
  edges: bellmanGraph.edges.map(edge => edge.from === 'f' && edge.to === 'a'
    ? {...edge, from:'a', to:'f'} : {...edge}),
  caption: 'Grafo dirigido · distâncias entre todos os pares'
};
const format = value => Number.isFinite(value) ? String(value) : '∞';
let matrix = floydVertices.map((from, i) => floydVertices.map((to, j) => i === j ? 0
  : floydGraph.edges.find(edge => edge.from === from && edge.to === to)?.weight ?? Infinity));
export const floydTables = [];
export const floydGraphFrames = [];
for (let step = 0; step <= floydVertices.length; step++) {
  const previous = matrix.map(row => [...row]);
  const changedCells = [];
  const updates = [];
  const k = step - 1;
  if (step) {
    matrix = previous.map((row, i) => row.map((value, j) => {
      const candidate = previous[i][k] + previous[k][j];
      if (candidate < value) {
        changedCells.push([i, j + 1]);
        updates.push(`${floydVertices[i]}→${floydVertices[j]} = ${previous[i][k]} + ${previous[k][j]} = ${candidate}`);
        return candidate;
      }
      return value;
    }));
  }
  const intermediary = floydVertices[k];
  const title = step ? `D(${step}) · intermediário ${intermediary}` : 'D(0) · arestas diretas';
  floydTables.push({title, changedRows:[], changedCells,
    rows: matrix.map((row, i) => [floydVertices[i], ...row.map(format)]),
    description: step ? (updates.length ? updates.join('; ') + '.' : `Não houve atualizações usando ${intermediary}.`) : 'Distâncias diretas das arestas; diagonal zero.'
  });
  floydGraphFrames.push({...floydGraph,
    caption: title
  });
}
export const floydCarouselSlide = {
  id:'floyd-quadro',type:'trace',minutes:2,eyebrow:'Floyd–Warshall · todos os pares',
  title:'Um intermediário por rodada',
  description:'Linhas são origens; colunas, destinos. Células destacadas melhoraram nesta rodada.',
  graph:floydGraph,graphFrames:floydGraphFrames,headers:['de / para',...floydVertices],
  carousel:floydTables,carouselStart:0,carouselLabel:'Matrizes de Floyd–Warshall'
};
