// ============================================================
// utils.js — shared helpers
// ============================================================

function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

// Wrap ALL-CAPS runs (2+ letters, incl. accented ES / EN caps) in <span class="cap">
// so key sociological/historical terms stand out inside the essay prose.
function highlightCaps(text) {
  const capRun = /\b([A-ZÁÉÍÓÚÑÜ]{2,}(?:[\s-][A-ZÁÉÍÓÚÑÜ]{2,}){0,3})\b/g;
  return esc(text).replace(capRun, (m) => `<span class="cap">${m}</span>`);
}

function paragraphsHTML(paragraphs, opts = {}) {
  return paragraphs.map((p, i) => {
    const cls = (opts.dropcap && i === 0) ? "dropcap" : "";
    return `<p class="${cls}">${highlightCaps(p)}</p>`;
  }).join("\n");
}

function renderIcons(root = document) {
  if (window.lucide) {
    window.lucide.createIcons({ nameAttr: "data-lucide", attrs: {}, root });
  }
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function entregaWordCount(entrega, lang) {
  let n = 0;
  entrega.sections.forEach(s => s.paragraphs[lang].forEach(p => n += wordCount(p)));
  return n;
}

function totalWordCount(lang) {
  return window.SITE_CONTENT.entregas.reduce((sum, e) => sum + entregaWordCount(e, lang), 0);
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function findEntrega(numero) {
  return window.SITE_CONTENT.entregas.find(e => e.numero === Number(numero));
}

function findBlockOf(entrega) {
  return window.SITE_CONTENT.blocks.find(b => b.num === entrega.bloque_num);
}
