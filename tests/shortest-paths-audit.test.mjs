import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../public/presentation.config.js';
import { bellmanGraph, bellmanTables, bellmanGraphFrames } from '../public/slides/seminario/bellman-carousel.js';
import { floydGraph, floydTables, floydVertices, floydGraphFrames } from '../public/slides/seminario/floyd-carousel.js';

// Oráculo independente: enumera caminhos simples, sem usar relaxação ou a recorrência de Floyd.
function shortest(graph, source, target, maxEdges, allowedInternal) {
  let best = Infinity;
  function visit(vertex, seen, cost, length) {
    if (vertex === target) { best = Math.min(best, cost); return; }
    if (length === maxEdges) return;
    if (vertex !== source && allowedInternal && !allowedInternal.has(vertex)) return;
    for (const edge of graph.edges.filter(edge => edge.from === vertex)) {
      if (!seen.has(edge.to)) visit(edge.to, new Set([...seen, edge.to]), cost + edge.weight, length + 1);
    }
  }
  visit(source, new Set([source]), 0, 0);
  return Number.isFinite(best) ? String(best) : '∞';
}
const triples = graph => graph.edges.map(e => `${e.from}>${e.to}:${e.weight}`).sort();
const common = ['c>a:5','c>e:1','a>b:6','e>b:1','e>f:8','b>d:1','d>f:1','f>b:1'];

test('grafos ativos reproduzem as nove arestas e a diferença de direção das referências', () => {
  assert.deepEqual(triples(bellmanGraph), [...common,'f>a:2'].sort());
  assert.deepEqual(triples(floydGraph), [...common,'a>f:2'].sort());
  assert.deepEqual(CONFIG.slides.slice(46,48).map(s=>s.id), ['p-bellman-1','p-bellman-2']);
  assert.equal(CONFIG.slides[49].id,'floyd-quadro');
  for (const [slide,graph] of [[CONFIG.slides[46],bellmanGraph],[CONFIG.slides[47],bellmanGraph],[CONFIG.slides[49],floydGraph]]) {
    assert.deepEqual(triples(slide.graph),triples(graph));
    assert.equal(graph.directed,true);
    assert.equal(new Set(graph.nodes.map(n=>n.id)).size,6);
  }
});

test('cada distância de Bellman corresponde ao mínimo de caminhos com até k arestas; predecessores e cores corretos', () => {
  bellmanTables.forEach((frame,k) => {
    frame.rows.forEach(([vertex,distance,pred]) => {
      assert.equal(distance,shortest(bellmanGraph,'c',vertex,k),`Bellman k=${k}, ${vertex}`);
      if (pred !== '—') {
        const edge=bellmanGraph.edges.find(e=>e.from===pred && e.to===vertex);
        assert.ok(edge);
        const prev=bellmanTables[k-1].rows.find(r=>r[0]===pred)[1];
        // Um predecessor retido pode ter melhorado depois: sua distância anterior ainda deve
        // justificar o valor aqui para estes estados específicos da referência.
        assert.equal(Number(prev)+edge.weight,Number(distance));
      }
      const node=bellmanGraphFrames[k].nodes.find(n=>n.id===vertex);
      assert.equal(node.note,`d = ${distance}`);
      const changed=k>0 && distance!==bellmanTables[k-1].rows.find(r=>r[0]===vertex)[1];
      assert.equal(node.state,changed?'active':undefined);
    });
    for(const edge of bellmanGraphFrames[k].edges) {
      const row=frame.rows.find(r=>r[0]===edge.to);
      const changed=k>0 && row[1]!==bellmanTables[k-1].rows.find(r=>r[0]===edge.to)[1];
      assert.equal(edge.state,row[2]===edge.from?(changed?'updated':'tree'):undefined);
    }
    assert.deepEqual(triples(bellmanGraphFrames[k]),triples(bellmanGraph));
  });
});

test('todas as 252 células de Floyd coincidem com caminhos enumerados com intermediários permitidos', () => {
  floydTables.forEach((frame,k) => {
    const allowed=new Set(floydVertices.slice(0,k));
    const expectedChanges=[];
    frame.rows.forEach(([source,...distances],i) => {
      distances.forEach((distance,j) => {
        assert.equal(distance,shortest(floydGraph,source,floydVertices[j],5,allowed),`Floyd k=${k} ${source}>${floydVertices[j]}`);
        if(k && distance!==floydTables[k-1].rows[i][j+1])expectedChanges.push([i,j+1]);
      });
    });
    assert.deepEqual(frame.changedCells,expectedChanges);
    assert.deepEqual(triples(floydGraphFrames[k]),triples(floydGraph));
    assert.ok(floydGraphFrames[k].nodes.every(n=>n.note===undefined));
  });
});
