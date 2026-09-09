import { bellmanCarouselSlides } from './bellman-carousel.js';
/**
 * Execuções detalhadas — um slide por mudança de estado.
 *
 * Estes geradores são usados quando a mudança de estado faz parte do conteúdo
 * ensinado. Exemplos parciais e visões gerais recebem esse nome no próprio slide.
 *
 * Os estados e tabelas vêm da execução dos algoritmos. Os textos explicativos
 * são escritos separadamente e precisam ser conferidos com esses estados.
 */

import { tracoBfs, tracoDfs, tracoDijkstra, tracoKruskal, tracoKahn, tracoColoracao } from '../lib/trace.js';
import { adjacencia, aumentar } from '../equilibrada/simulacoes.js';
import * as G from '../equilibrada/modelos.js';
import { destacar, negativo } from './modelos.js';

/** Duração padrão fora do seminário; index.js aplica o orçamento do roteiro. */
const POR_PASSO = 0.4;

/** Carimba id único e duração nos slides que o gerador devolveu. */
const numerar = (slides, prefixo) => slides.map((slide, i) => ({
  ...slide,
  id: `${prefixo}-${i + 1}`,
  minutes: POR_PASSO,
  eyebrow: `${slide.eyebrow || prefixo} · passo ${i + 1}/${slides.length}`
}));

// ---------------------------------------------------------------------------
// Geradores que faltavam. Prim e Bellman-Ford não tinham trace no repositório.
// ---------------------------------------------------------------------------

/**
 * Prim passo a passo: uma extração por slide.
 * Mostra a chave de cada vértice e qual aresta cruzou o corte.
 */
export function tracoPrim({ base, origem, eyebrow = 'Prim' }) {
  const adj = adjacencia(base);
  const ids = base.nodes.map(n => n.id);
  const chave = new Map(ids.map(id => [id, Infinity]));
  const pai = new Map(ids.map(id => [id, null]));
  chave.set(origem, 0);
  const dentro = new Set();
  const arvore = [];
  const slides = [];

  while (dentro.size < ids.length) {
    const abertos = ids.filter(id => !dentro.has(id));
    const u = abertos.reduce((a, b) => (chave.get(a) <= chave.get(b) ? a : b));
    if (chave.get(u) === Infinity) break;
    dentro.add(u);
    if (pai.get(u)) arvore.push([pai.get(u), u]);

    const melhoras = [];
    for (const { to, weight } of adj.get(u) || []) {
      const peso = weight ?? 1;
      if (!dentro.has(to) && peso < chave.get(to)) {
        chave.set(to, peso);
        pai.set(to, u);
        melhoras.push(`${to} → ${peso}`);
      }
    }

    const custo = arvore.reduce((soma, [a, b]) => {
      const aresta = (adj.get(a) || []).find(x => x.to === b);
      return soma + (aresta?.weight ?? 1);
    }, 0);

    slides.push({
      type: 'trace',
      eyebrow,
      title: pai.get(u)
        ? `Entra ${u} pela aresta ${pai.get(u)}–${u} (chave ${chave.get(u)})`
        : `Começa em ${u}`,
      description: melhoras.length
        ? `A chave é o menor peso de uma aresta que liga o vértice à árvore. Após incluir ${u}, melhoram: ${melhoras.join(' · ')}.`
        : `Nenhuma chave melhorou com a entrada de ${u}.`,
      graph: destacar(base, {
        nodes: Object.fromEntries([...dentro].map(id => [id, 'done'])),
        edges: arvore,
        notes: Object.fromEntries(ids.map(id => [id, dentro.has(id) ? '✓' : (chave.get(id) === Infinity ? '∞' : String(chave.get(id)))])),
        caption: `Dentro: {${[...dentro].join(', ')}} · custo acumulado ${custo}`
      }),
      headers: ['vértice', 'chave', 'ligado por'],
      rows: ids.map(id => [
        id,
        dentro.has(id) ? 'na árvore' : (chave.get(id) === Infinity ? '∞' : String(chave.get(id))),
        pai.get(id) || '—'
      ])
    });
  }
  return slides;
}

/**
 * Bellman-Ford passo a passo: uma passagem completa por slide.
 * Mostra quais arestas relaxaram e o que ainda pode melhorar.
 */
export function tracoBellmanFord({ base, origem, eyebrow = 'Bellman-Ford' }) {
  const ids = base.nodes.map(n => n.id);
  // Sem esta checagem, uma origem errada produz NaN em silêncio e o trace sai
  // vazio dizendo "nada mudou" — exatamente o que aconteceu com 's' vs 'S'.
  if (!ids.includes(origem)) {
    throw new Error(`origem "${origem}" não existe no grafo. Vértices: ${ids.join(', ')}`);
  }
  const d = new Map(ids.map(id => [id, id === origem ? 0 : Infinity]));
  const pai = new Map(ids.map(id => [id, null]));
  const slides = [];
  const arestas = base.edges.map(e => ({ ...e, peso: e.weight ?? 1 }));

  for (let passagem = 1; passagem <= ids.length - 1; passagem += 1) {
    const antes = new Map(d);
    const relaxadas = [];
    for (const { from, to, peso } of arestas) {
      if (d.get(from) + peso < d.get(to)) {
        d.set(to, d.get(from) + peso);
        pai.set(to, from);
        relaxadas.push([from, to]);
      }
    }

    slides.push({
      type: 'trace',
      eyebrow,
      title: relaxadas.length
        ? `Passagem ${passagem}: ${relaxadas.length} atualizações de distância`
        : `Passagem ${passagem}: nenhuma distância mudou`,
      description: relaxadas.length
        ? `Ordem dos testes: ${arestas.map(e => `${e.from}→${e.to}`).join(', ')}. Cada atualização vale imediatamente. Melhorias por: ${relaxadas.map(([a, b]) => `${a}→${b}`).join(', ')}.`
        : 'Uma passagem completa sem melhora permite encerrar. As estimativas dos vértices alcançáveis já são as distâncias mínimas.',
      graph: destacar(base, {
        edges: relaxadas,
        notes: Object.fromEntries(ids.map(id => [id, d.get(id) === Infinity ? '∞' : String(d.get(id))])),
        caption: `Estimativas após a passagem ${passagem}`
      }),
      headers: ['vértice', 'antes', 'depois', 'veio de'],
      rows: ids.map(id => [
        id,
        antes.get(id) === Infinity ? '∞' : String(antes.get(id)),
        d.get(id) === Infinity ? '∞' : String(d.get(id)),
        pai.get(id) || '—'
      ]),
      note: passagem === ids.length - 1 ? {
        kind: arestas.some(({from,to,peso}) => d.get(from) + peso < d.get(to)) ? 'warn' : 'check',
        title: 'Verificação de ciclo negativo',
        text: arestas.some(({from,to,peso}) => d.get(from) + peso < d.get(to))
          ? 'Após n−1 passagens ainda há uma aresta que melhora uma distância. Existe ciclo negativo alcançável da origem.'
          : 'Após n−1 passagens nenhuma aresta permite nova melhora. Não há ciclo negativo alcançável da origem.'
      } : undefined
    });

    if (!relaxadas.length) break;
  }
  return slides;
}

/**
 * Ford–Fulkerson passo a passo: um caminho aumentante por slide.
 * A tabela compara o fluxo antes e depois; o desenho destaca tanto os arcos
 * usados para a frente quanto o arco residual reverso que cancela fluxo.
 */
export function tracoFordFulkerson({ base, origem, destino, caminhos, eyebrow = 'Ford–Fulkerson' }) {
  const execucao = aumentar(base, origem, destino, caminhos);
  const zero = base.edges.map(() => 0);

  return execucao.frames.map((frame, i) => {
    const antes = i === 0 ? zero : execucao.frames[i - 1].flows;
    const arcos = frame.path.slice(1).map((v, j) => [frame.path[j], v]);
    const caminho = frame.path.join('→');
    const reversos = arcos.filter(([u, v]) =>
      !base.edges.some(e => e.from === u && e.to === v)
      && base.edges.some(e => e.from === v && e.to === u));

    const edges = base.edges.map((e, j) => {
      const direto = arcos.some(([u, v]) => e.from === u && e.to === v);
      const reverso = arcos.some(([u, v]) => e.from === v && e.to === u);
      return {
        ...e,
        weight: undefined,
        label: `${frame.flows[j]}/${e.weight}`,
        state: reverso ? 'warn' : direto ? 'tree' : undefined
      };
    });

    const valorAnterior = i === 0 ? 0 : execucao.frames[i - 1].value;
    const correcao = reversos.length
      ? `O trecho ${reversos.map(([u, v]) => `${u}→${v}`).join(', ')} é residual: ele reduz o fluxo no sentido oposto e libera uma rota melhor.`
      : `O gargalo do caminho é ${frame.delta}; essa quantidade é somada a todos os seus arcos.`;

    return {
      type: 'trace',
      eyebrow,
      title: reversos.length
        ? `Aumento ${i + 1}: ${caminho} corrige o fluxo anterior`
        : `Aumento ${i + 1}: ${caminho} leva ${frame.delta}`,
      description: `${i === 0 ? 'O fluxo começa em zero. ' : ''}${correcao} O valor total passa de ${valorAnterior} para ${frame.value}.`,
      graph: {
        ...base,
        edges,
        caption: reversos.length
          ? `Após o aumento ${i + 1}: fluxo/capacidade. B→A reduz A→B em uma unidade.`
          : `Rótulos: fluxo/capacidade após o aumento ${i + 1}. Verde: caminho usado nesta etapa.`
      },
      headers: ['aresta', 'antes', 'depois', 'capacidade'],
      rows: base.edges.map((e, j) => [
        `${e.from}→${e.to}`,
        String(antes[j]),
        String(frame.flows[j]),
        String(e.weight)
      ])
    };
  });
}

/**
 * Welsh–Powell: ordenar por grau e preencher uma classe de cor por varredura.
 * O último slide separa a execução da prova de que, neste exemplo, três cores
 * são realmente necessárias.
 */
export function tracoWelshPowell({ base, eyebrow = 'Welsh–Powell' }) {
  if (base.directed) throw new Error('Welsh–Powell exige grafo não dirigido');
  const adj = adjacencia(base);
  const ids = base.nodes.map(n => n.id);
  const grau = new Map(ids.map(id => [id, adj.get(id).length]));
  const ordem = [...ids].sort((a, b) => grau.get(b) - grau.get(a) || a.localeCompare(b));
  const cor = new Map();
  const classes = [];
  const slides = [{
    type: 'trace',
    eyebrow,
    title: `Primeiro, ordenar: ${ordem.join(', ')}`,
    description: 'Welsh–Powell coloca primeiro os vértices de maior grau. Nos empates, este exemplo usa ordem alfabética para que a execução seja determinística.',
    graph: destacar(base, {
      nodes: Object.fromEntries(ids.map(id => [id, 'dim'])),
      notes: Object.fromEntries(ids.map(id => [id, `grau ${grau.get(id)}`])),
      caption: 'A ordem fica fixa antes de começar a colorir.'
    }),
    headers: ['posição', 'vértice', 'grau'],
    rows: ordem.map((id, i) => [String(i + 1), id, String(grau.get(id))])
  }];

  while (cor.size < ids.length) {
    const numero = classes.length + 1;
    const anteriores = new Set(cor.keys());
    const classe = [];
    const decisoes = new Map();

    for (const id of ordem) {
      if (anteriores.has(id)) {
        decisoes.set(id, 'já colorido');
        continue;
      }
      const conflitos = classe.filter(outro => (adj.get(id) || []).some(v => v.to === outro));
      if (conflitos.length) {
        decisoes.set(id, `aguarda: vizinho de ${conflitos.join(', ')}`);
      } else {
        classe.push(id);
        cor.set(id, numero);
        decisoes.set(id, `entra na cor ${numero}`);
      }
    }
    classes.push(classe);

    const faltam = ordem.filter(id => !cor.has(id));
    const estados = ['active', 'done', 'warn', 'dim'];
    slides.push({
      type: 'trace',
      eyebrow,
      title: `Cor ${numero}: ${classe.join(' e ')}`,
      description: `Uma varredura percorre ${ordem.join(', ')}. Um vértice entra nesta cor somente se não for adjacente a nenhum vértice já colocado na mesma classe.`,
      graph: destacar(base, {
        nodes: Object.fromEntries(ids.map(id => [id, cor.has(id) ? estados[(cor.get(id) - 1) % estados.length] : 'dim'])),
        notes: Object.fromEntries(ids.map(id => [id, cor.has(id) ? `cor ${cor.get(id)}` : 'sem cor'])),
        caption: `Cor ${numero} = {${classe.join(', ')}}${faltam.length ? ` · faltam ${faltam.join(', ')}` : ' · todos coloridos'}`
      }),
      headers: ['vértice', 'grau', 'decisão nesta varredura', 'cor'],
      rows: ordem.map(id => [id, String(grau.get(id)), decisoes.get(id), cor.has(id) ? String(cor.get(id)) : '—'])
    });
  }

  slides.push({
    type: 'trace',
    eyebrow,
    title: 'Resultado: três cores, e três são necessárias',
    description: `As classes são ${classes.map((c, i) => `cor ${i + 1} = {${c.join(', ')}}`).join(' · ')}. Como A, B e D formam uma clique, precisam de cores diferentes. O algoritmo usou três, então atingiu o mínimo neste grafo.`,
    graph: destacar(base, {
      nodes: Object.fromEntries(ids.map(id => [id, ['active', 'done', 'warn', 'dim'][(cor.get(id) - 1) % 4]])),
      edges: [['A', 'B'], ['A', 'D'], ['B', 'D']],
      notes: Object.fromEntries(ids.map(id => [id, `cor ${cor.get(id)}`])),
      caption: 'O triângulo A–B–D prova χ ≥ 3; a coloração construída prova χ ≤ 3.'
    }),
    headers: ['cor', 'vértices da classe'],
    rows: classes.map((classe, i) => [String(i + 1), classe.join(', ')])
  });

  return slides;
}

// ---------------------------------------------------------------------------
// Os passo a passo do seminário.
// ---------------------------------------------------------------------------

export const passosBfs = numerar(tracoBfs({ base: G.rede, origem: 'A', eyebrow: 'BFS de A' }), 'p-bfs');
export const passosDfs = numerar(tracoDfs({ base: G.rede, origem: 'A', eyebrow: 'DFS de A' }), 'p-dfs');
export const passosKruskal = numerar(tracoKruskal({ base: G.ponderado, eyebrow: 'Kruskal' }), 'p-kruskal');
export const passosPrim = numerar(tracoPrim({ base: G.ponderado, origem: 'A', eyebrow: 'Prim de A' }), 'p-prim');
export const passosKahn = numerar(tracoKahn({ base: G.dag, eyebrow: 'Ordenação topológica' }), 'p-kahn');
export const passosCores = numerar(
  tracoColoracao({ base: G.rede, ordem: G.rede.nodes.map(n => n.id), eyebrow: 'Coloração gulosa' }),
  'p-cores'
);
export const passosWelsh = numerar(
  tracoWelshPowell({ base: G.cores, eyebrow: 'Welsh–Powell' }),
  'p-welsh'
);
export const passosBellman = numerar(
  bellmanCarouselSlides,
  'p-bellman'
);
/** Dijkstra completo no grafo da rede — o da prova já tem trace próprio. */
export const passosDijkstra = numerar(
  tracoDijkstra({ base: G.rotas, origem: 'S', eyebrow: 'Dijkstra de S' }),
  'p-dijkstra'
);
export const passosFluxo = numerar(
  tracoFordFulkerson({
    base: G.fluxo,
    origem: 'S',
    destino: 'T',
    caminhos: G.aumentantes,
    eyebrow: 'Ford–Fulkerson'
  }),
  'p-fluxo'
);
