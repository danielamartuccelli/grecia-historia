// ============================================================
// i18n.js — language state + static UI string dictionary
// ============================================================

const UI_STRINGS = {
  es: {
    site_name: "Grecia · Plan de Formación",
    site_tag: "30 entregas · Atenas — Corfú — Paxos",
    nav_home: "Inicio",
    nav_glossary: "Glosario",
    nav_search_ph: "Buscar por concepto, lugar o entrega…",
    hero_kicker: "Plan de formación analítico y narrativo",
    hero_title: "Grecia, en treinta entregas",
    hero_sub: "Un recorrido histórico y sociológico para el viaje de septiembre de 2026 — de los palacios micénicos al debate público de hoy, con la mirada puesta siempre en el espejo peruano.",
    hero_cta: "Empezar por la Entrega 1",
    hero_cta2: "Ver todos los bloques",
    stat_entregas: "Entregas",
    stat_bloques: "Bloques",
    stat_dias: "Días de viaje",
    stat_palabras: "Palabras",
    block_days: "Días",
    block_open: "Ver bloque",
    card_read: "Leer entrega",
    card_of: "de 30",
    search_results: "resultados",
    search_empty: "No se encontraron entregas para esta búsqueda.",
    glossary_title: "Glosario y conceptos",
    glossary_sub: "Filtra las 30 entregas por los conceptos sociológicos e históricos que las atraviesan.",
    glossary_clear: "Limpiar filtro",
    back_home: "Volver al inicio",
    prev_entrega: "Entrega anterior",
    next_entrega: "Entrega siguiente",
    toc_title: "Índice",
    reading_progress: "Progreso de lectura",
    coda_title: "Coda de campo — qué mirar",
    coda_sub: "Marca cada punto cuando lo verifiques en el viaje. Se guarda en este dispositivo.",
    coda_reset: "Reiniciar checklist",
    coda_next: "En la próxima entrega",
    resonancias_title: "Resonancias contemporáneas",
    glossary_in_entrega: "Conceptos en esta entrega",
    meta_issued: "Fecha de emisión",
    meta_trip: "Viaje",
    meta_for: "Destinataria",
    meta_register: "Registro",
    footer_note: "Plan de formación privado — CliO Consulting · 2026",
    lang_note_missing: "Traducción al inglés pendiente para esta sección.",
  },
  en: {
    site_name: "Greece · Training Plan",
    site_tag: "30 dispatches · Athens — Corfu — Paxos",
    nav_home: "Home",
    nav_glossary: "Glossary",
    nav_search_ph: "Search by concept, place or dispatch…",
    hero_kicker: "An analytical and narrative training plan",
    hero_title: "Greece, in thirty dispatches",
    hero_sub: "A historical and sociological journey for the September 2026 trip — from the Mycenaean palaces to today's public debate, always with an eye on the Peruvian mirror.",
    hero_cta: "Start with Dispatch 1",
    hero_cta2: "See all blocks",
    stat_entregas: "Dispatches",
    stat_bloques: "Blocks",
    stat_dias: "Trip days",
    stat_palabras: "Words",
    block_days: "Days",
    block_open: "Open block",
    card_read: "Read dispatch",
    card_of: "of 30",
    search_results: "results",
    search_empty: "No dispatches matched this search.",
    glossary_title: "Glossary & concepts",
    glossary_sub: "Filter the 30 dispatches by the sociological and historical concepts running through them.",
    glossary_clear: "Clear filter",
    back_home: "Back to home",
    prev_entrega: "Previous dispatch",
    next_entrega: "Next dispatch",
    toc_title: "Contents",
    reading_progress: "Reading progress",
    coda_title: "Field coda — what to look for",
    coda_sub: "Check off each point as you verify it on the trip. Saved on this device.",
    coda_reset: "Reset checklist",
    coda_next: "Coming up next",
    resonancias_title: "Contemporary resonances",
    glossary_in_entrega: "Concepts in this dispatch",
    meta_issued: "Issue date",
    meta_trip: "Trip",
    meta_for: "For",
    meta_register: "Register",
    footer_note: "Private training plan — CliO Consulting · 2026",
    lang_note_missing: "English translation pending for this section.",
  }
};

const I18N = {
  key: "grecia30_lang",
  get lang() {
    return localStorage.getItem(this.key) || "es";
  },
  set lang(v) {
    try { localStorage.setItem(this.key, v); } catch (e) {}
    document.documentElement.lang = v === "en" ? "en" : "es";
  },
  t(k) {
    const dict = UI_STRINGS[this.lang] || UI_STRINGS.es;
    return dict[k] || UI_STRINGS.es[k] || k;
  },
  applyStatic(root = document) {
    root.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = this.t(el.getAttribute("data-i18n"));
    });
    root.querySelectorAll("[data-i18n-ph]").forEach(el => {
      el.setAttribute("placeholder", this.t(el.getAttribute("data-i18n-ph")));
    });
    root.querySelectorAll(".lang-toggle button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.lang === this.lang);
    });
  },
  init(onChange) {
    document.documentElement.lang = this.lang === "en" ? "en" : "es";
    document.querySelectorAll(".lang-toggle button").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.lang === this.lang) return;
        this.lang = btn.dataset.lang;
        this.applyStatic();
        if (onChange) onChange(this.lang);
      });
    });
    this.applyStatic();
  }
};
