/**
 * render.js — transforma um slide declarado em presentation.config.js no
 * markup do telão.
 *
 * Todo texto é escapado antes de receber a marcação inline curta:
 *   **negrito**   *ênfase*   `código`   ==destaque na cor da marca==
 *
 * Tipos de slide disponíveis:
 *   cover, section, statement, concept, graph, definition, table, code,
 *   compare, steps, exercise, list, quote, poll, closing
 */

import { graphSvg } from './graph-draw.js';

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

/** Escapa e aplica a marcação inline mínima. */
const text = value => escapeHtml(value)
  .replaceAll(/==([^=]+)==/g, '<span class="highlight">$1</span>')
  .replaceAll(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replaceAll(/(^|[\s(])\*([^*]+)\*/g, '$1<em>$2</em>')
  .replaceAll(/`([^`]+)`/g, '<code>$1</code>');

const eyebrowOf = slide => slide.eyebrow ? `<p class="eyebrow">${text(slide.eyebrow)}</p>` : '';

const titleOf = (slide, className = 'statement-title') =>
  slide.title ? `<h1 class="${className}">${text(slide.title)}</h1>` : '';

const descriptionOf = slide =>
  slide.description ? `<p class="slide-description">${text(slide.description)}</p>` : '';

const pointsOf = slide => Array.isArray(slide.points) && slide.points.length
  ? `<ul class="slide-points">${slide.points.map(point => `<li>${text(point)}</li>`).join('')}</ul>`
  : '';

const NOTE_LABELS = { warn: 'Armadilha', tip: 'Dica', key: 'Ideia-chave', check: 'Verificação' };

const noteOf = slide => {
  const note = slide.note;
  if (!note) return '';
  const kind = NOTE_LABELS[note.kind] ? note.kind : 'key';
  return `<aside class="callout callout--${kind}">
      <p class="callout-title">${text(note.title || NOTE_LABELS[kind])}</p>
      <p class="callout-text">${text(note.text)}</p>
    </aside>`;
};

const graphOf = slide => slide.graph ? graphSvg(slide.graph) : '';

// Links declarados no conteúdo: protocolo restrito, texto sempre escapado.
const safeHref = value => /^(https?:\/\/|\/(?!\/))/.test(String(value)) ? escapeHtml(value) : '#';
const linksOf = slide => slide.links?.length ? `<nav class="source-links" aria-label="Material de estudo">${slide.links.map(l=>`<a href="${safeHref(l.href)}" target="_blank" rel="noopener">${text(l.label)} ↗</a>`).join('')}</nav>` : '';

/**
 * As fórmulas formam UM bloco monoespaçado, não uma caixa por linha.
 *
 * Isso é o que faz três coisas funcionarem: a linha em branco vira espaço de
 * verdade (e não uma caixa vazia), a continuação de uma fórmula longa fica
 * junto dela, e o alinhamento por espaços é preservado — as colunas que eu
 * alinho no array chegam alinhadas na tela.
 */
const formulasOf = slide => {
  const formulas = slide.formulas || (slide.formula ? [slide.formula] : []);
  if (!formulas.length) return '';
  // Remove linhas em branco nas pontas: espaço lá é sobra, não intenção.
  const linhas = [...formulas];
  while (linhas.length && !String(linhas[0]).trim()) linhas.shift();
  while (linhas.length && !String(linhas[linhas.length - 1]).trim()) linhas.pop();
  if (!linhas.length) return '';
  return `<pre class="formula"><code>${linhas.map(linha => text(linha)).join('\n')}</code></pre>`;
};

/**
 * Capa enxuta: título, integrantes, QR e contagem de conectados.
 *
 * O endereço em texto foi retirado de propósito — quem está na sala lê o QR,
 * e o link escrito só competia com o título.
 */
function coverSlide(slide) {
  const nomes = Array.isArray(slide.names) && slide.names.length
    ? `<p class="cover-names">${slide.names.map(nome => text(nome)).join(' · ')}</p>`
    : '';
  return `<div class="slide-content cover-layout">
      <div>
        ${eyebrowOf(slide)}
        <h1 class="slide-title">${text(slide.title)} <span class="highlight">${text(slide.highlight || '')}</span></h1>
        ${nomes}
        ${descriptionOf(slide)}
      </div>
      <div>
        <div class="qr-card qr-card--limpo">
          <button class="cover-qr-button" type="button" aria-label="Ampliar QR code de participação" aria-haspopup="dialog" aria-controls="qrDialog"><canvas class="cover-qr" aria-hidden="true"></canvas></button>
        </div>
        <p class="live-count"><strong data-connected>0</strong> pessoas conectadas</p>
      </div>
    </div>`;
}

function pollSlide(slide, polls) {
  const poll = polls?.[slide.poll];
  if (!poll) return '<div class="slide-content"><p>Enquete não encontrada.</p></div>';
  return `<div class="slide-content">
      <p class="eyebrow">${text(slide.eyebrow || 'Enquete ao vivo')}</p>
      <h1 class="statement-title">${text(poll.question)}</h1>
      <div class="poll-results" data-poll-results="${escapeHtml(slide.poll)}"></div>
      <p class="result-summary" data-poll-summary="${escapeHtml(slide.poll)}">Aguardando respostas…</p>
    </div>`;
}

function sectionSlide(slide) {
  return `<div class="slide-content section-layout">
      ${slide.kicker ? `<p class="section-number">${text(slide.kicker)}</p>` : ''}
      <h1 class="section-title">${text(slide.title)}</h1>
      ${descriptionOf(slide)}
      ${Array.isArray(slide.topics) && slide.topics.length
        ? `<ul class="section-topics">${slide.topics.map(topic => `<li>${text(topic)}</li>`).join('')}</ul>`
        : ''}
    </div>`;
}

/** Texto à esquerda, diagrama à direita — o layout principal de conceito. */
function conceptSlide(slide) {
  const diagram = graphOf(slide);
  return `<div class="slide-content ${diagram ? 'split-layout' : ''}">
      <div class="split-text">
        ${eyebrowOf(slide)}
        ${titleOf(slide, 'concept-title')}
        ${descriptionOf(slide)}
        ${pointsOf(slide)}
        ${noteOf(slide)}
      </div>
      ${diagram ? `<div class="split-visual">${diagram}</div>` : ''}
    </div>`;
}

/** Diagrama grande, texto compacto embaixo. */
function graphSlide(slide) {
  return `<div class="slide-content stage-layout">
      <div class="stage-head">${eyebrowOf(slide)}${titleOf(slide, 'concept-title')}${descriptionOf(slide)}</div>
      <div class="stage-visual">${graphOf(slide)}</div>
      ${pointsOf(slide)}
      ${noteOf(slide)}
    </div>`;
}

function definitionSlide(slide) {
  const diagram = graphOf(slide);
  return `<div class="slide-content ${diagram ? 'split-layout' : ''}">
      <div class="split-text">
        ${eyebrowOf(slide)}
        ${titleOf(slide, 'concept-title')}
        ${formulasOf(slide)}
        ${descriptionOf(slide)}
        ${pointsOf(slide)}
        ${noteOf(slide)}
      </div>
      ${diagram ? `<div class="split-visual">${diagram}</div>` : ''}
    </div>`;
}

function tableSlide(slide) {
  const headers = (slide.headers || []).map(header => `<th scope="col">${text(header)}</th>`).join('');
  const rows = (slide.rows || []).map(row => {
    const cells = row.map((cell, index) => index === 0
      ? `<th scope="row">${text(cell)}</th>`
      : `<td>${text(cell)}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<div class="slide-content">
      ${eyebrowOf(slide)}
      ${titleOf(slide, 'concept-title')}
      ${descriptionOf(slide)}
      <div class="table-scroll">
        <table class="slide-table">
          ${headers ? `<thead><tr>${headers}</tr></thead>` : ''}
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${noteOf(slide)}
    </div>`;
}

function codeSlide(slide) {
  const diagram = graphOf(slide);
  const code = `<pre class="pseudocode"><code>${(slide.lines || []).map(line => text(line)).join('\n')}</code></pre>`;
  return `<div class="slide-content ${diagram ? 'split-layout' : ''}">
      <div class="split-text">
        ${eyebrowOf(slide)}
        ${titleOf(slide, 'concept-title')}
        ${descriptionOf(slide)}
        ${code}
        ${noteOf(slide)}
      </div>
      ${diagram ? `<div class="split-visual">${diagram}</div>` : ''}
    </div>`;
}

function compareSlide(slide) {
  // Cada coluna pode trazer o próprio diagrama: é o que permite mostrar a
  // MESMA rede sendo percorrida de três jeitos, lado a lado.
  const columns = (slide.columns || []).map(column => `<div class="compare-card">
      <p class="compare-title">${text(column.title)}</p>
      ${column.description ? `<p class="compare-description">${text(column.description)}</p>` : ''}
      ${column.graph ? `<div class="compare-visual">${graphSvg(column.graph)}</div>` : ''}
      ${Array.isArray(column.items) && column.items.length
        ? `<ul>${column.items.map(item => `<li>${text(item)}</li>`).join('')}</ul>`
        : ''}
    </div>`).join('');
  return `<div class="slide-content">
      ${eyebrowOf(slide)}
      ${titleOf(slide, 'concept-title')}
      ${descriptionOf(slide)}
      <div class="compare-grid" data-columns="${(slide.columns || []).length}">${columns}</div>
      ${noteOf(slide)}
    </div>`;
}

function stepsSlide(slide) {
  const diagram = graphOf(slide);
  const items = (slide.items || []).map((item, index) => `<li>
      <span class="step-index" aria-hidden="true">${index + 1}</span>
      <span class="step-body">
        <strong>${text(item.title)}</strong>
        ${item.text ? `<span>${text(item.text)}</span>` : ''}
      </span>
    </li>`).join('');
  return `<div class="slide-content ${diagram ? 'split-layout' : ''}">
      <div class="split-text">
        ${eyebrowOf(slide)}
        ${titleOf(slide, 'concept-title')}
        ${descriptionOf(slide)}
        <ol class="step-list">${items}</ol>
        ${noteOf(slide)}
      </div>
      ${diagram ? `<div class="split-visual">${diagram}</div>` : ''}
    </div>`;
}

/**
 * Passo de execução de um algoritmo: o grafo no estado atual à esquerda, a
 * tabela de estado à direita. É o mesmo grafo slide após slide — só mudam os
 * destaques e os números, para a plateia acompanhar sem se reorientar.
 */
function carouselMarkup(slide) {
  const start = slide.carouselStart || 0;
  return `<div class="table-carousel" role="region" aria-label="${escapeHtml(slide.carouselLabel || 'Passagens de Bellman–Ford')}" aria-roledescription="carrossel" data-carousel data-step="${start}">
    <div class="carousel-controls"><button type="button" data-carousel-prev aria-label="Passagem anterior" ${start === 0 ? 'disabled' : ''}>←</button>
      <span data-carousel-status aria-live="polite">${start + 1} / ${slide.carousel.length} · ${text(slide.carousel[start].title)}</span>
      <button type="button" data-carousel-next aria-label="Próxima passagem" ${start === slide.carousel.length - 1 ? 'disabled' : ''}>→</button></div>
    ${slide.carousel.map((frame, index) => `<div data-carousel-panel ${index === start ? '' : 'hidden'}>
      <table class="slide-table trace-table"><thead><tr>${slide.headers.map(h => `<th scope="col">${text(h)}</th>`).join('')}</tr></thead>
      <tbody>${frame.rows.map((row, rowIndex) => `<tr class="${frame.changedRows.includes(rowIndex) ? 'carousel-changed' : ''}">${row.map((cell, i) => i ? `<td class="${frame.changedCells?.some(([r, c]) => r === rowIndex && c === i) ? 'carousel-cell-changed' : ''}">${text(cell)}</td>` : `<th scope="row">${text(cell)}</th>`).join('')}</tr>`).join('')}</tbody></table>
      ${frame.description ? `<p class="carousel-description">${text(frame.description)}</p>` : ''}
    </div>`).join('')}
    <div class="carousel-steps" aria-label="Escolher passagem">${slide.carousel.map((frame, index) => `<button type="button" data-carousel-goto="${index}" data-title="${escapeHtml(frame.title)}" aria-label="${escapeHtml(frame.title)}" aria-pressed="${index === start}">${index}</button>`).join('')}</div>
  </div>`;
}

function traceSlide(slide) {
  const cabecalho = (slide.headers || []).map(h => `<th scope="col">${text(h)}</th>`).join('');
  const corpo = (slide.rows || []).map(row => {
    const celulas = row.map((cell, index) => index === 0
      ? `<th scope="row">${text(cell)}</th>`
      : `<td>${text(cell)}</td>`).join('');
    return `<tr>${celulas}</tr>`;
  }).join('');

  return `<div class="slide-content trace-layout">
      <div class="trace-visual">${slide.graphFrames ? slide.graphFrames.map((graph, i) => `<div data-carousel-graph ${i === (slide.carouselStart || 0) ? '' : 'hidden'}>${graphSvg(graph)}</div>`).join('') : graphOf(slide)}</div>
      <div class="trace-side">
        ${eyebrowOf(slide)}
        ${titleOf(slide, 'trace-title')}
        ${descriptionOf(slide)}
        ${slide.carousel ? carouselMarkup(slide) : cabecalho || corpo ? `<div class="table-scroll">
          <table class="slide-table trace-table">
            ${cabecalho ? `<thead><tr>${cabecalho}</tr></thead>` : ''}
            <tbody>${corpo}</tbody>
          </table>
        </div>` : ''}
        ${noteOf(slide)}
      </div>
    </div>`;
}

const LETRAS = 'ABCDE';

/**
 * Questão de prova — um único layout em dois estados.
 *
 * `reveal: false` → sala vota, cada alternativa mostra a barra de votos ao vivo.
 * `reveal: true`  → a correta acende, as demais esmaecem e entra o porquê.
 *
 * Manter o MESMO layout nos dois estados é proposital: a plateia não precisa
 * reencontrar as alternativas quando o gabarito aparece.
 */
function questionSlide(slide) {
  if (slide.original && !slide.reveal) return originalQuestionSlide(slide);
  const revelado = Boolean(slide.reveal);
  const alternativas = slide.alternatives || [];
  const correta = String(slide.answer || '').toLowerCase();

  const itens = alternativas.map((alternativa, indice) => {
    const id = alternativa.id || LETRAS[indice].toLowerCase();
    const acertou = revelado && id === correta;
    const errou = revelado && id !== correta;
    const classes = ['alt', acertou ? 'alt--correta' : '', errou ? 'alt--descartada' : ''].filter(Boolean).join(' ');
    const barra = slide.poll
      ? `<span class="alt-bar" aria-hidden="true"><span class="alt-fill" data-alt-fill="${escapeHtml(id)}"></span></span>
         <span class="alt-pct" data-alt-pct="${escapeHtml(id)}">—</span>`
      : '';
    return `<li class="${classes}" data-alt="${escapeHtml(id)}">
        <span class="alt-letter">${LETRAS[indice] || '•'}</span>
        <span class="alt-text">${text(alternativa.text ?? alternativa)}</span>
        ${barra}
      </li>`;
  }).join('');

  const afirmacoes = Array.isArray(slide.claims) && slide.claims.length
    ? `<ol class="claims">${slide.claims.map(claim => `<li>${text(claim)}</li>`).join('')}</ol>`
    : '';

  const rodape = revelado
    ? `<aside class="answer-panel">
        <p class="answer-head">${text(slide.answerLabel || 'Gabarito')} · ${escapeHtml((correta || '').toUpperCase())}</p>
        ${slide.why ? `<p class="answer-why">${text(slide.why)}</p>` : ''}
      </aside>`
    : slide.poll
      ? `<p class="vote-hint" data-poll-summary="${escapeHtml(slide.poll)}">Aguardando respostas…</p>`
      : '';

  const diagrama = graphOf(slide);

  return `<div class="slide-content question-layout${diagrama ? ' question-layout--split' : ''}">
      <div class="question-main">
        <p class="question-source">${text(slide.source || 'Questão')}</p>
        ${slide.statement ? `<p class="question-statement">${text(slide.statement)}</p>` : ''}
        <h1 class="question-prompt">${text(slide.question)}</h1>
        ${afirmacoes}
        <ol class="alternatives-grid"${slide.poll ? ` data-poll-alternatives="${escapeHtml(slide.poll)}"` : ''}>${itens}</ol>
        ${rodape}
      </div>
      ${diagrama ? `<div class="question-visual">${diagrama}</div>` : ''}
    </div>`;
}

/**
 * Questão de prova: o recorte original, as alternativas e os votos.
 *
 * Nada mais aparece — nem instrução de tempo, nem resumo aberto. O enunciado
 * completo continua no markup como texto só para leitor de tela, porque a
 * imagem sozinha deixaria a questão inacessível; ele não ocupa espaço na tela.
 */
function originalQuestionSlide(slide) {
  const images = slide.images || [];
  const participationLayout = slide.id === 'poscomp_floyd-pergunta' ? ' exam-participation--below'
    : slide.id === 'enade_gulosa-pergunta' ? ' exam-participation--halves' : '';
  return `<div class="slide-content original-layout">
    <header class="original-head"><p class="question-source">${text(slide.source)}</p></header>
    <div class="exam-participation${participationLayout}"><div class="exam-pages${images.length > 1 ? ' exam-pages--two' : ''}">${images.map((name,i)=>`<span class="exam-image"><img src="/provas/recortes/${escapeHtml(name)}.png" alt="${escapeHtml(slide.source)} — ${escapeHtml(slide.question)}${images.length>1?` — parte ${i+1}`:''}" loading="lazy"></span>`).join('')}</div>
    <aside class="exam-qr"><button class="exam-qr-button" type="button" aria-label="Ampliar QR code de participação" aria-haspopup="dialog" aria-controls="qrDialog"><canvas class="exam-qr-canvas" aria-hidden="true"></canvas></button></aside></div>
    <footer class="exam-footer"><div class="exam-votes" data-poll-alternatives="${escapeHtml(slide.poll)}">${slide.alternatives.map(a=>`<span class="alt"><b>${escapeHtml(a.id.toUpperCase())}</b><span class="alt-pct" data-alt-pct="${escapeHtml(a.id)}">—</span></span>`).join('')}</div><p data-poll-summary="${escapeHtml(slide.poll)}">Aguardando respostas…</p></footer>
    <div class="apenas-leitor-de-tela">${slide.statement ? `<p>${text(slide.statement)}</p>` : ''}<p>${text(slide.question)}</p><ol>${slide.alternatives.map(a=>`<li>${text(a.text)}</li>`).join('')}</ol></div>
  </div>`;
}

function articleSlide(slide) {
  return `<div class="slide-content article-layout"><aside class="article-date"><p class="eyebrow">${text(slide.period)}</p><span>${text(slide.year)}</span><p class="article-paper">${text(slide.paper)}</p><p class="article-authors">${text(slide.authors)}</p></aside><div>${titleOf(slide,'concept-title')}${pointsOf(slide)}<p class="article-connection">${text(slide.connection)}</p><p class="article-limit"><strong>Limitações.</strong> ${text(slide.limit)}</p></div></div>`;
}

/** Pergunta com resposta escondida: o <details> abre no clique ou no Enter. */
function exerciseSlide(slide) {
  const diagram = graphOf(slide);
  const alternatives = Array.isArray(slide.alternatives) && slide.alternatives.length
    ? `<ul class="alternatives">${slide.alternatives.map((alternative, index) =>
        `<li><span class="alternative-letter">${'abcde'[index] || '•'}</span>${text(alternative)}</li>`).join('')}</ul>`
    : '';
  return `<div class="slide-content ${diagram ? 'split-layout' : ''}">
      <div class="split-text">
        <p class="eyebrow">${text(slide.eyebrow || 'Exercício')}</p>
        <h1 class="concept-title">${text(slide.question)}</h1>
        ${alternatives}
        <details class="answer">
          <summary>Mostrar a resposta</summary>
          <div class="answer-body">
            ${slide.answer ? `<p class="answer-line">${text(slide.answer)}</p>` : ''}
            ${slide.why ? `<p>${text(slide.why)}</p>` : ''}
          </div>
        </details>
      </div>
      ${diagram ? `<div class="split-visual">${diagram}</div>` : ''}
    </div>`;
}

function listSlide(slide) {
  return `<div class="slide-content">
      ${eyebrowOf(slide)}
      ${titleOf(slide)}
      <ul class="slide-list">${(slide.items || []).map(item => `<li>${text(item)}</li>`).join('')}</ul>
      ${noteOf(slide)}
    </div>`;
}

function quoteSlide(slide) {
  return `<div class="slide-content">
      ${eyebrowOf(slide)}
      <blockquote class="quote-text">${text(slide.quote)}</blockquote>
      ${slide.attribution ? `<p class="quote-attribution">— ${text(slide.attribution)}</p>` : ''}
    </div>`;
}

function statementSlide(slide) {
  return `<div class="slide-content">
      ${eyebrowOf(slide)}
      ${titleOf(slide)}
      ${descriptionOf(slide)}
      ${pointsOf(slide)}
      ${noteOf(slide)}
      ${linksOf(slide)}
    </div>`;
}

const RENDERERS = {
  article: articleSlide,
  question: questionSlide,
  trace: traceSlide,
  section: sectionSlide,
  concept: conceptSlide,
  graph: graphSlide,
  definition: definitionSlide,
  table: tableSlide,
  code: codeSlide,
  compare: compareSlide,
  steps: stepsSlide,
  exercise: exerciseSlide,
  list: listSlide,
  quote: quoteSlide
};

export function slideMarkup(slide, { polls = {}, participantUrl = '' } = {}) {
  if (slide.type === 'cover') return coverSlide(slide, participantUrl);
  if (slide.type === 'poll') return pollSlide(slide, polls);
  const render = RENDERERS[slide.type];
  return render ? render(slide) : statementSlide(slide);
}
