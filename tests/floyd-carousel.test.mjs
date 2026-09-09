import test from 'node:test';
import assert from 'node:assert/strict';
import { floydTables, floydGraph, floydGraphFrames } from '../public/slides/seminario/floyd-carousel.js';
test('as sete matrizes e destaques coincidem com a referência fornecida', () => {
  const expected = [
    ['0','6','∞','∞','∞','2'], ['∞','0','∞','1','∞','∞'],
    ['5','∞','0','∞','1','∞'], ['∞','∞','∞','0','∞','1'],
    ['∞','1','∞','∞','0','8'], ['∞','1','∞','∞','∞','0']
  ];
  const changes = [[], [[2,1,'11'],[2,5,'7']], [[0,3,'7'],[2,3,'12'],[4,3,'2'],[5,3,'2']], [],
    [[1,5,'2'],[4,5,'3']], [[2,1,'2'],[2,3,'3'],[2,5,'4']], [[0,1,'3'],[0,3,'4'],[3,1,'2']]];
  assert.equal(floydTables.length, 7);
  for(let step=0;step<7;step++) {
    changes[step].forEach(([row,col,value]) => {expected[row][col]=value;});
    assert.deepEqual(floydTables[step].rows.map(row=>row.slice(1)), expected);
    assert.deepEqual(floydTables[step].changedCells, changes[step].map(([row,col])=>[row,col+1]));
    floydGraphFrames[step].nodes.forEach(node => {
      assert.equal(node.note, undefined);
    });
  }
  assert.ok(floydGraph.edges.some(e=>e.from==='a' && e.to==='f' && e.weight===2));
  assert.ok(!floydGraph.edges.some(e=>e.from==='f' && e.to==='a'));
});
