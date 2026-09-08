// ============================================================
// app.js — Home dashboard: stats, block timeline, search
// ============================================================

const CONTENT = window.SITE_CONTENT;
let activeFilter = null; // glossary term key, when arriving from glossary.html
let searchQuery = "";

function renderStats() {
  const lang = I18N.lang;
  const totalWords = totalWordCount(lang);
  const stats = [
    { icon: "scroll-text", value: CONTENT.entregas.length, label: I18N.t("stat_entregas") },
    { icon: "layout-grid", value: CONTENT.blocks.length, label: I18N.t("stat_bloques") },
    { icon: "calendar-days", value: "30", label: I18N.t("stat_dias") },
    { icon: "type", value: totalWords.toLocaleString(lang === "en" ? "en-US" : "es-PE"), label: I18N.t("stat_palabras") },
  ];
  document.getElementById("stats-row").innerHTML = stats.map(s => `
    <div class="glass rounded-2xl px-4 py-5 flex flex-col items-center gap-1.5 text-white bg-white/10 border-white/20">
      <i data-lucide="${s.icon}" class="w-5 h-5 text-gold-500"></i>
      <div class="font-display font-bold text-2xl">${s.value}</div>
      <div class="text-[11px] uppercase tracking-wider text-marble-100/70">${s.label}</div>
    </div>
  `).join("");
}

function entregaMatches(entrega, query, filterTerm) {
  if (filterTerm) {
    const inGlossary = entrega.glosario.es.includes(filterTerm) || entrega.glosario.en.includes(filterTerm);
    if (!inGlossary) return false;
  }
  if (query) {
    const q = query.toLowerCase();
    const lang = I18N.lang;
    const hay = [
      entrega.titulo[lang], entrega.subtitulo[lang],
      String(entrega.numero), entrega.bloque_nombre[lang],
      ...entrega.glosario[lang]
    ].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function entregaCard(entrega) {
  const lang = I18N.lang;
  return `
  <a href="entrega.html?n=${entrega.numero}" class="entrega-card glass rounded-2xl overflow-hidden flex flex-col group">
    <div class="h-28 bg-gradient-to-br from-aegean-900 to-ionian-600 relative flex items-center justify-center">
      <i data-lucide="${entrega.icon}" class="w-9 h-9 text-marble-50/90"></i>
      <span class="num-badge absolute top-3 left-3 text-gold-500 text-sm bg-aegean-950/40 px-2.5 py-0.5 rounded-full border border-gold-500/40">
        ${entrega.numero}<span class="opacity-60">/30</span>
      </span>
    </div>
    <div class="p-5 flex flex-col gap-2 flex-1">
      <div class="text-[10px] uppercase tracking-widest text-ionian-600 font-semibold">${entrega.fecha_emision[lang]}</div>
      <h3 class="font-display font-bold text-aegean-900 text-lg leading-snug group-hover:text-terracotta transition">${esc(entrega.titulo[lang])}</h3>
      <p class="font-serif text-ink-600 text-[0.95rem] leading-snug flex-1">${esc(entrega.subtitulo[lang])}</p>
      <div class="gold-rule my-1"></div>
      <div class="flex items-center justify-between text-xs text-aegean-800/70">
        <span data-i18n="card_read">Leer entrega</span>
        <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition"></i>
      </div>
    </div>
  </a>`;
}

function blockSection(block) {
  const lang = I18N.lang;
  const entregas = block.entregas.map(n => findEntrega(n));
  const visible = entregas.filter(e => entregaMatches(e, searchQuery, activeFilter));
  if (visible.length === 0) return "";
  return `
  <section class="block-section" data-block="${block.num}">
    <div class="flex items-center gap-4 mb-6">
      <div class="w-12 h-12 rounded-xl glass-deep flex items-center justify-center shrink-0">
        <i data-lucide="${block.icon}" class="w-6 h-6 text-gold-500"></i>
      </div>
      <div>
        <div class="text-xs uppercase tracking-widest text-terracotta font-semibold">${I18N.t("block_days")} ${block.dias}</div>
        <h2 class="font-display font-bold text-aegean-900 text-2xl md:text-3xl">${esc(block.nombre[lang])}</h2>
      </div>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      ${visible.map(entregaCard).join("")}
    </div>
  </section>`;
}

function renderBlocks() {
  const html = CONTENT.blocks.map(blockSection).join("");
  document.getElementById("blocks-container").innerHTML = html;
  const anyVisible = html.trim().length > 0;
  document.getElementById("search-empty").classList.toggle("hidden", anyVisible);
  renderIcons();
}

function renderAll() {
  I18N.applyStatic();
  renderStats();
  renderBlocks();
  renderIcons();
}

// search
document.getElementById("global-search").addEventListener("input", (e) => {
  searchQuery = e.target.value.trim();
  renderBlocks();
});

// arrive from glossary.html?term=...
const urlTerm = getParam("term");
if (urlTerm) activeFilter = urlTerm;

I18N.init(() => renderAll());
renderAll();

// clear-filter banner
if (activeFilter) {
  const banner = document.createElement("div");
  banner.className = "max-w-7xl mx-auto px-5 md:px-8 -mt-8 mb-8";
  banner.innerHTML = `
    <div class="glass rounded-full px-5 py-2.5 inline-flex items-center gap-3 text-sm text-aegean-900">
      <i data-lucide="filter" class="w-4 h-4 text-terracotta"></i>
      <span>${esc(activeFilter)}</span>
      <a href="index.html" class="text-terracotta font-semibold hover:underline" data-i18n="glossary_clear">Limpiar filtro</a>
    </div>`;
  document.getElementById("bloques").prepend(banner);
  renderIcons();
}
