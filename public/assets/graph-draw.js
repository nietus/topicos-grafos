/**
 * graph-draw.js — desenha um grafo declarativo como SVG inline.
 *
 * O spec vem do arquivo de configuração e nunca do público, mas todo texto
 * passa por escape para o SVG continuar válido.
 *
 * spec = {
 *   view: [largura, altura],        // default 760x420
 *   directed: boolean,              // desenha setas
 *   nodes: [{ id, x, y, label, note, state }],
 *   edges: [{ from, to, weight, label, state, curve, labelOffset: [dx, dy] }],
 *   caption: 'texto sob o desenho'
 * }
 *
 * state em vértice: 'active' | 'done' | 'dim' | 'warn'
 * state em aresta:  'active' | 'tree' | 'dim' | 'warn'
 *
 * O vértice se ADAPTA ao rótulo: rótulo curto vira círculo, rótulo longo vira
 * cápsula. Nenhum texto pode vazar para fora da forma — é isso que a função
 * nodeShape() garante.
 */

const NODE_RADIUS = 26;
const LABEL_SIZE = 21;
/** Largura média de um caractere em relação ao corpo da fonte (peso 750). */
const CHAR_RATIO = 0.6;
const LABEL_PADDING = 14;
const DEFAULT_VIEW = [760, 420];

const escapeXml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const nodeById = (nodes, id) => nodes.find(node => node.id === id);

const labelOf = node => String(node.label ?? node.id);

/**
 * Mede o rótulo e devolve os semieixos da forma do vértice.
 * Círculo quando o texto cabe; cápsula (rx > ry) quando não cabe.
 */
export function nodeShape(node) {
  const text = labelOf(node);
  const textWidth = text.length * LABEL_SIZE * CHAR_RATIO;
  const rx = Math.max(NODE_RADIUS, textWidth / 2 + LABEL_PADDING);
  return { rx, ry: NODE_RADIUS, isPill: rx > NODE_RADIUS + 0.5 };
}

/** Ponto onde a reta centro->alvo cruza a borda eliptica do vertice. */
function borderPoint(node, towardX, towardY) {
  const { rx, ry } = nodeShape(node);
  const dx = towardX - node.x;
  const dy = towardY - node.y;
  if (dx === 0 && dy === 0) return { x: node.x + rx, y: node.y };
  const scale = 1 / Math.hypot(dx / rx, dy / ry);
  return { x: node.x + dx * scale, y: node.y + dy * scale };
}

function edgeGeometry(from, to, curve) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;
  const bend = curve || 0;
  const controlX = midX + normalX * bend;
  const controlY = midY + normalY * bend;

  const aim = bend ? { x: controlX, y: controlY } : null;
  const start = borderPoint(from, aim ? aim.x : to.x, aim ? aim.y : to.y);
  const end = borderPoint(to, aim ? aim.x : from.x, aim ? aim.y : from.y);

  return {
    path: bend
      ? `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`
      : `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${(midX + normalX * 2.4).toFixed(1)} ${(midY + normalY * 2.4).toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`,
    // No traço reto a etiqueta sai do caminho pela normal; na curva ela
    // acompanha a barriga da curva (ponto médio da Bézier = 1/2 do controle).
    labelX: bend ? midX + normalX * (bend * 0.55) : midX + normalX * 18,
    labelY: bend ? midY + normalY * (bend * 0.55) : midY + normalY * 18
  };
}

function loopGeometry(node) {
  const { ry } = nodeShape(node);
  const x = node.x;
  const y = node.y;
  return {
    path: `M ${x - 11} ${y - ry + 3} C ${x - 60} ${y - 92} ${x + 60} ${y - 92} ${x + 11} ${y - ry + 3}`,
    labelX: x,
    labelY: y - 78
  };
}

function drawEdge(spec, edge, prefix) {
  const from = nodeById(spec.nodes, edge.from);
  const to = nodeById(spec.nodes, edge.to);
  if (!from || !to) return '';

  const geometry = from === to ? loopGeometry(from) : edgeGeometry(from, to, edge.curve);
  const state = edge.state ? ` gd-edge--${escapeXml(edge.state)}` : '';
  const markerVariant = edge.state === 'updated' ? 'updated' : edge.state === 'active' || edge.state === 'tree'
    ? 'active'
    : edge.state === 'dim' ? 'dim' : 'base';
  const marker = spec.directed ? ` marker-end="url(#${prefix}-arrow-${markerVariant})"` : '';
  const text = edge.label ?? (edge.weight === undefined ? '' : edge.weight);

  const [labelDx, labelDy] = edge.labelOffset || [0, 0];
  const label = text === '' ? '' : `
      <text class="gd-edge-label${state}" x="${(geometry.labelX + labelDx).toFixed(1)}" y="${(geometry.labelY + labelDy).toFixed(1)}">${escapeXml(text)}</text>`;

  return `<path class="gd-edge${state}" d="${geometry.path}"${marker} />${label}`;
}

function drawNode(node) {
  const state = node.state ? ` gd-node--${escapeXml(node.state)}` : '';
  const { rx, ry, isPill } = nodeShape(node);
  const body = isPill
    ? `<rect x="${(node.x - rx).toFixed(1)}" y="${(node.y - ry).toFixed(1)}" width="${(rx * 2).toFixed(1)}" height="${(ry * 2).toFixed(1)}" rx="${ry}" />`
    : `<circle cx="${node.x}" cy="${node.y}" r="${rx.toFixed(1)}" />`;
  const note = node.note
    ? `<text class="gd-node-note" x="${node.x}" y="${(node.y + ry + 22).toFixed(1)}">${escapeXml(node.note)}</text>`
    : '';
  // Duas voltas discretamente diferentes de caneta; posições e rótulos estáveis.
  const outline = [0, 1].map(pass => {
    const points = Array.from({length:73}, (_,i)=>{
      const angle=i/72*Math.PI*2;
      const wobble=Math.sin(angle*3+node.x*.01+pass)*.85+Math.sin(angle*5+pass)*.4;
      return `${(node.x+Math.cos(angle)*(rx+wobble+pass*.5)).toFixed(1)},${(node.y+Math.sin(angle)*(ry+wobble)).toFixed(1)}`;
    });
    return `<path class="gd-ink gd-ink--${pass}" d="M ${points.join(' L ')} Z" />`;
  }).join('');
  return `<g class="gd-node${state}">
      ${body}
      ${outline}
      <text class="gd-node-label" x="${node.x}" y="${(node.y + 7).toFixed(1)}">${escapeXml(labelOf(node))}</text>
      ${note}
    </g>`;
}

const ARROW_VARIANTS = [
  ['base', 'var(--color-line-strong, rgb(255 255 255 / 45%))'],
  ['active', 'var(--color-accent)'],
  ['updated', '#b65019'],
  ['dim', 'var(--color-line)']
];

const markers = prefix => ARROW_VARIANTS.map(([name, fill]) => `<marker id="${prefix}-arrow-${name}" viewBox="0 0 10 10"
      refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${fill}" />
    </marker>`).join('');

/**
 * Calcula a caixa que contém o desenho inteiro — formas, notas e laços — e
 * devolve um viewBox com folga. Assim nada é cortado pela borda do SVG,
 * independentemente das coordenadas escolhidas no spec.
 */
function viewBoxFor(spec) {
  const [width, height] = spec.view || DEFAULT_VIEW;
  let minX = 0;
  let minY = 0;
  let maxX = width;
  let maxY = height;

  for (const node of spec.nodes) {
    const { rx, ry } = nodeShape(node);
    minX = Math.min(minX, node.x - rx);
    maxX = Math.max(maxX, node.x + rx);
    // O laço sobe ~92px acima do vértice; a nota desce ~30px abaixo.
    minY = Math.min(minY, node.y - ry - 95);
    maxY = Math.max(maxY, node.y + ry + (node.note ? 32 : 4));
  }
  for (const node of spec.nodes) {
    const { rx } = nodeShape(node);
    if (node.note) {
      const noteHalf = String(node.note).length * 17 * CHAR_RATIO / 2;
      minX = Math.min(minX, node.x - Math.max(rx, noteHalf));
      maxX = Math.max(maxX, node.x + Math.max(rx, noteHalf));
    }
  }

  const pad = 10;
  return [minX - pad, minY - pad, (maxX - minX) + pad * 2, (maxY - minY) + pad * 2]
    .map(value => Number(value.toFixed(1)))
    .join(' ');
}

/** Retorna o markup SVG completo (com legenda opcional) para um spec. */
let graphInstance = 0;
export function graphSvg(spec) {
  if (!spec || !Array.isArray(spec.nodes) || spec.nodes.length === 0) return '';
  const prefix = `gd-${++graphInstance}`;
  const edges = (spec.edges || []).map(edge => drawEdge(spec, edge, prefix)).filter(Boolean).join('\n    ');
  const nodes = spec.nodes.map(drawNode).join('\n    ');
  const caption = spec.caption
    ? `<figcaption class="gd-caption">${escapeXml(spec.caption)}</figcaption>`
    : '';

  return `<figure class="graph-figure">
    <svg class="graph-draw" viewBox="${viewBoxFor(spec)}" role="img"
      aria-label="${escapeXml(spec.alt || spec.caption || 'Diagrama de grafo')}" preserveAspectRatio="xMidYMid meet">
      <defs>${markers(prefix)}</defs>
      ${edges}
      ${nodes}
    </svg>
    ${caption}
  </figure>`;
}
