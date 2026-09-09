import test from 'node:test';
import assert from 'node:assert/strict';
import { bellmanGraph, bellmanTables } from '../public/slides/seminario/bellman-carousel.js';

test('tabelas da referência correspondem às passagens síncronas do grafo de seis vértices', () => {
  let distances = Object.fromEntries(bellmanGraph.nodes.map(n => [n.id, n.id === 'c' ? 0 : Infinity]));
  let predecessors = Object.fromEntries(bellmanGraph.nodes.map(n => [n.id, '—']));
  for (let pass = 0; pass < bellmanTables.length; pass++) {
    const previous = { ...distances };
    if (pass) {
      distances = { ...previous };
      for (const edge of bellmanGraph.edges) {
        const candidate = previous[edge.from] + edge.weight;
        if (candidate < distances[edge.to]) {
          distances[edge.to] = candidate;
          predecessors[edge.to] = edge.from;
        }
      }
    }
    for (const [vertex, distance, predecessor] of bellmanTables[pass].rows) {
      assert.equal(distance, distances[vertex] === Infinity ? '∞' : String(distances[vertex]), `passagem ${pass}, ${vertex}`);
      assert.equal(predecessor, predecessors[vertex]);
    }
    const changed = bellmanTables[pass].rows.flatMap(([vertex], row) => pass && previous[vertex] !== distances[vertex] ? [row] : []);
    assert.deepEqual(bellmanTables[pass].changedRows, changed);
  }
});
