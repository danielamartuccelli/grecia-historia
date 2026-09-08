// ============================================================
// reader.js — single-entrega reading view
// ============================================================

const CONTENT = window.SITE_CONTENT;
const entregaNum = Number(getParam("n")) || 1;
const entrega = findEntrega(entregaNum);
const block = entrega ? findBlockOf(entrega) : null;

if (!entrega) {
  document.getElementById("article-root").innerHTML = `<p class="font-serif text-xl">Entrega no encontrada.</p>`;
} else {
  buildArticle();
  I18N.init(() => { buildArticle(); wireScrollFx(); });
  wireScrollFx();
  wireTocDrawer();
}

function sectionAnchor(i) { return `sec-${i}`; }

function isComparativeSection(section) {
  const h = (section.heading.es + " " + section.heading.en).toLowerCase();
  return h.includes("mundo simultáneo") || h.includes("simultaneous world") || h.includes("simultaneidad");
}

function buildArticle() {
  const lang = I18N.lang;
  document.getElementById("page-title").textContent = `${entrega.titulo[lang]} · Grecia — 30 Entregas`;

  const resonanciasIdx = entrega.sections.findIndex(s => s.is_resonancias);
  const comparativeIdx = entrega.sections.findIndex(isComparativeSection);
  const codaIdx = entrega.sections.findIndex(s => s.is_coda);

  const sectionsHTML = entrega.sections.map((s, i) => {
    if (i === codaIdx) return ""; // rendered separately as the interactive field coda below
    const heading = `
      <div class="flex items-baseline gap-3 mt-14 mb-5">
        ${s.num ? `<span class="font-display text-terracotta text-2xl font-bold">${s.num}.</span>` : ""}
        <h2 class="font-display font-bold text-aegean-900 text-2xl md:text-[1.7rem]">${esc(s.heading[lang])}</h2>
      </div>`;
    const paras = paragraphsHTML(s.paragraphs[lang], { dropcap: i === 0 });

    if (i === resonanciasIdx) {
      return `
      <section id="${sectionAnchor(i)}" class="scroll-mt-28">
        ${heading}
        <div class="resonancias-box rounded-2xl p-6 md:p-8 my-2">
          <div class="flex items-center gap-2 mb-4 text-terracotta font-semibold text-sm uppercase tracking-widest">
            <i data-lucide="scale" class="w-4 h-4"></i>
            <span data-i18n="resonancias_title">Resonancias contemporáneas</span>
          </div>
          <div class="prose-essay text-[1.08rem]">${paras}</div>
        </div>
      </section>`;
    }
    if (i === comparativeIdx) {
      return `
      <section id="${sectionAnchor(i)}" class="scroll-mt-28">
        ${heading}
        <div class="rounded-2xl p-6 md:p-8 my-2 bg-aegean-900/[0.035] border border-ionian-400/30 border-dashed">
          <div class="flex items-center gap-2 mb-4 text-ionian-600 font-semibold text-sm uppercase tracking-widest">
            <i data-lucide="columns-3" class="w-4 h-4"></i>
            <span>${lang === "en" ? "Simultaneity — comparative reading" : "Simultaneidad — lectura comparativa"}</span>
          </div>
          <div class="prose-essay text-[1.08rem]">${paras}</div>
        </div>
      </section>`;
    }
    return `
    <section id="${sectionAnchor(i)}" class="scroll-mt-28">
      ${heading}
      <div class="prose-essay">${paras}</div>
    </section>`;
  }).join("");

  const glossaryPills = entrega.glosario[lang].map((term, i) => {
    const esTerm = entrega.glosario.es[i];
    return `<a href="index.html?term=${encodeURIComponent(esTerm)}" class="term-pill">${esc(term)}</a>`;
  }).join("");

  const prevN = entregaNum > 1 ? entregaNum - 1 : null;
  const nextN = entregaNum < 30 ? entregaNum + 1 : null;
  const prevE = prevN ? findEntrega(prevN) : null;
  const nextE = nextN ? findEntrega(nextN) : null;

  document.getElementById("article-root").innerHTML = `
    <!-- meta header -->
    <div class="mb-10">
      <div class="flex flex-wrap items-center gap-2 mb-5 text-xs">
        <span class="glass px-3 py-1 rounded-full text-aegean-900 font-semibold flex items-center gap-1.5">
          <i data-lucide="${block.icon}" class="w-3.5 h-3.5 text-terracotta"></i>
          ${esc(block.nombre[lang])}
        </span>
        <span class="text-aegean-800/60">${I18N.t("block_days")} ${entrega.dias}</span>
        <span class="ml-auto font-display font-bold text-terracotta">${entregaNum}<span class="text-aegean-800/40"> / 30</span></span>
      </div>
      <h1 class="font-display font-extrabold text-aegean-900 text-3xl md:text-[2.6rem] leading-[1.1] mb-3">${esc(entrega.titulo[lang])}</h1>
      <p class="font-serif text-ink-600 text-xl md:text-2xl leading-snug mb-6">${esc(entrega.subtitulo[lang])}</p>

      <div class="grid sm:grid-cols-2 gap-3 text-sm mb-6">
        <div class="flex items-center gap-2 text-aegean-800/80"><i data-lucide="calendar" class="w-4 h-4 text-gold-500"></i> <b class="font-semibold" data-i18n="meta_issued"></b>: ${esc(entrega.fecha_emision[lang])}</div>
        <div class="flex items-center gap-2 text-aegean-800/80"><i data-lucide="ship" class="w-4 h-4 text-gold-500"></i> <b class="font-semibold" data-i18n="meta_trip"></b>: ${esc(entrega.viaje[lang])}</div>
        <div class="flex items-center gap-2 text-aegean-800/80"><i data-lucide="user" class="w-4 h-4 text-gold-500"></i> <b class="font-semibold" data-i18n="meta_for"></b>: ${esc(entrega.destinataria[lang])}</div>
        <div class="flex items-center gap-2 text-aegean-800/80"><i data-lucide="bookmark" class="w-4 h-4 text-gold-500"></i> <b class="font-semibold" data-i18n="meta_register"></b>: ${esc(entrega.registro[lang])}</div>
      </div>
      <div class="gold-rule"></div>
    </div>

    ${sectionsHTML}

    <!-- CODA / checklist -->
    <section id="${sectionAnchor(entrega.sections.length)}" class="scroll-mt-28 mt-16">
      <div class="flex items-baseline gap-3 mb-5">
        <i data-lucide="map-pin-check" class="w-6 h-6 text-terracotta"></i>
        <h2 class="font-display font-bold text-aegean-900 text-2xl md:text-[1.7rem]" data-i18n="coda_title">Coda de campo — qué mirar</h2>
      </div>
      <p class="text-sm text-aegean-800/60 mb-5" data-i18n="coda_sub"></p>
      ${entrega.coda.intro[lang].length ? `<div class="prose-essay text-[1.05rem] mb-4">${paragraphsHTML(entrega.coda.intro[lang])}</div>` : ""}

      <div id="checklist" class="space-y-3 my-4"></div>

      ${entrega.coda.closing[lang].length ? `<div class="prose-essay text-[1.05rem] mt-6 italic opacity-90">${paragraphsHTML(entrega.coda.closing[lang])}</div>` : ""}

      <div class="flex justify-end mt-3">
        <button id="reset-checklist" class="text-xs text-aegean-800/50 hover:text-terracotta transition flex items-center gap-1">
          <i data-lucide="rotate-ccw" class="w-3 h-3"></i> <span data-i18n="coda_reset">Reiniciar checklist</span>
        </button>
      </div>

      ${entrega.coda.next_hint[lang] ? `
      <div class="glass rounded-2xl p-5 mt-8 flex items-start gap-3">
        <i data-lucide="arrow-right-circle" class="w-5 h-5 text-gold-600 shrink-0 mt-0.5"></i>
        <div>
          <div class="text-[11px] uppercase tracking-widest text-gold-600 font-semibold mb-1" data-i18n="coda_next">En la próxima entrega</div>
          <p class="font-serif text-ink-600">${esc(entrega.coda.next_hint[lang])}</p>
        </div>
      </div>` : ""}
    </section>

    ${entrega.glosario[lang].length ? `
    <div class="mt-12">
      <div class="text-xs uppercase tracking-widest text-aegean-800/50 font-semibold mb-3" data-i18n="glossary_in_entrega">Conceptos en esta entrega</div>
      <div class="flex flex-wrap gap-2">${glossaryPills}</div>
    </div>` : ""}

    <!-- prev/next -->
    <div class="grid sm:grid-cols-2 gap-4 mt-14 pt-8 border-t border-gold-500/20">
      ${prevE ? `
      <a href="entrega.html?n=${prevN}" class="glass rounded-2xl p-4 flex items-center gap-3 group">
        <i data-lucide="arrow-left" class="w-5 h-5 text-terracotta group-hover:-translate-x-1 transition"></i>
        <div class="min-w-0">
          <div class="text-[10px] uppercase tracking-widest text-aegean-800/50" data-i18n="prev_entrega">Entrega anterior</div>
          <div class="font-display font-semibold text-aegean-900 truncate">${esc(prevE.titulo[lang])}</div>
        </div>
      </a>` : `<div></div>`}
      ${nextE ? `
      <a href="entrega.html?n=${nextN}" class="glass rounded-2xl p-4 flex items-center gap-3 justify-end text-right group">
        <div class="min-w-0">
          <div class="text-[10px] uppercase tracking-widest text-aegean-800/50" data-i18n="next_entrega">Entrega siguiente</div>
          <div class="font-display font-semibold text-aegean-900 truncate">${esc(nextE.titulo[lang])}</div>
        </div>
        <i data-lucide="arrow-right" class="w-5 h-5 text-terracotta group-hover:translate-x-1 transition"></i>
      </a>` : `<div></div>`}
    </div>
  `;

  buildTOC();
  buildChecklist();
  I18N.applyStatic();
  renderIcons();
}

function buildTOC() {
  const lang = I18N.lang;
  const entries = entrega.sections
    .map((s, i) => ({ id: sectionAnchor(i), label: `${s.num ? s.num + ". " : ""}${s.heading[lang]}`, skip: s.is_coda }))
    .filter(e => !e.skip);
  entries.push({ id: sectionAnchor(entrega.sections.length), label: I18N.t("coda_title") });

  const linksHTML = entries.map(e => `<a href="#${e.id}" class="toc-link" data-target="${e.id}">${esc(e.label)}</a>`).join("");
  document.getElementById("toc-links").innerHTML = linksHTML;
  document.getElementById("toc-links-mobile").innerHTML = linksHTML;
}

function buildChecklist() {
  const lang = I18N.lang;
  const storageKey = `grecia30_checklist_${entregaNum}`;
  let state = {};
  try { state = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch (e) {}

  const html = entrega.coda.items.map((item, i) => {
    const checked = !!state[i];
    const label = item.label[lang] ? `<span class="font-semibold text-terracotta">${esc(item.label[lang])}. </span>` : "";
    return `
    <div class="checklist-item ${checked ? "checked" : ""} glass rounded-xl p-4 flex items-start gap-3" data-idx="${i}">
      <span class="check-circle mt-0.5"><i data-lucide="check" class="stroke-[3]"></i></span>
      <span class="item-text font-serif text-[1.05rem] leading-snug">${label}${highlightCaps(item.text[lang])}</span>
    </div>`;
  }).join("");
  document.getElementById("checklist").innerHTML = html;
  renderIcons(document.getElementById("checklist"));

  document.querySelectorAll(".checklist-item").forEach(el => {
    el.addEventListener("click", () => {
      const idx = el.dataset.idx;
      el.classList.toggle("checked");
      state[idx] = el.classList.contains("checked");
      try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (e) {}
    });
  });

  const resetBtn = document.getElementById("reset-checklist");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      try { localStorage.removeItem(storageKey); } catch (e) {}
      buildChecklist();
    });
  }
}

function wireScrollFx() {
  // reading progress
  const bar = document.getElementById("reading-progress");
  const article = document.getElementById("article-root");
  function onScroll() {
    const rect = article.getBoundingClientRect();
    const total = article.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
    const pct = total > 0 ? (scrolled / total) * 100 : 0;
    bar.style.width = pct + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // TOC active highlighting
  const sections = document.querySelectorAll("article section[id]");
  const tocLinks = document.querySelectorAll(".toc-link");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        tocLinks.forEach(l => l.classList.toggle("active", l.dataset.target === en.target.id));
      }
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  sections.forEach(s => io.observe(s));
}

function wireTocDrawer() {
  const drawer = document.getElementById("toc-drawer");
  const open = () => drawer.classList.remove("hidden");
  const close = () => drawer.classList.add("hidden");
  document.getElementById("toc-toggle").addEventListener("click", open);
  document.getElementById("toc-close").addEventListener("click", close);
  document.getElementById("toc-backdrop").addEventListener("click", close);
  document.querySelectorAll("#toc-links-mobile a").forEach(a => a.addEventListener("click", close));
}
