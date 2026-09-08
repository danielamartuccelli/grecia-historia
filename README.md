# Grecia · 30 Entregas — sitio web bilingüe

Sitio estático (HTML + Tailwind vía CDN + JavaScript vanilla, **sin paso de build**) que
convierte las 30 entregas del plan de formación sobre Grecia en un sitio público,
bilingüe (ES/EN), con dashboard por bloques, vista de lectura enriquecida, checklist
de campo, glosario filtrable y buscador.

No necesitas Node, npm, ni ningún paso de compilación: subes estos archivos tal cual a
GitHub y GitHub Pages los sirve directamente.

---

## 1. Estructura del proyecto

```
/                          ← esto es la raíz del repositorio (y de GitHub Pages)
├── index.html              Dashboard: hero + línea de tiempo por bloques + buscador
├── entrega.html             Vista de lectura de una entrega (?n=1 … ?n=30)
├── glossary.html            Nube de conceptos / glosario filtrable
├── assets/
│   ├── css/style.css        Sistema de diseño (paleta, glassmorphism, tipografía)
│   └── js/
│       ├── content.js       ← TODO el contenido de las 30 entregas (ES+EN), generado
│       ├── i18n.js           Diccionario de textos de interfaz (ES/EN) + toggle de idioma
│       ├── utils.js          Helpers de render (resaltado de términos, iconos, etc.)
│       ├── app.js             Lógica del dashboard (index.html)
│       └── reader.js          Lógica de la vista de lectura (entrega.html)
│
└── fuente-contenido/        ← NO se usa en el sitio en vivo; es la "cocina" del contenido
    ├── data/
    │   ├── raw/entrega-01.json … entrega-30.json    Español, extraído de los .docx
    │   └── en/entrega-01.json … entrega-30.json      Inglés, traducción completa
    └── scripts/
        ├── extract.py         .docx → JSON estructurado (español)
        └── build_content.py   data/raw + data/en → assets/js/content.js
```

**Todo el contenido de las 30 entregas vive en un solo archivo:** `assets/js/content.js`.
Es un archivo JSON envuelto en `window.SITE_CONTENT = {...}`, generado automáticamente
por `fuente-contenido/scripts/build_content.py`. El resto del sitio (HTML/CSS/JS) es
"motor" genérico: no tiene texto de las entregas incrustado, todo se renderiza desde
`content.js` en tiempo de carga.

---

## 2. Cómo se hizo el contenido (documentación metodológica)

1. **Extracción (`extract.py`)**: cada uno de los 30 `Entrega_NN_*.docx` se parseó con
   `python-docx`. El script detecta automáticamente: título, subtítulo, bloque temático,
   rango de días, metadatos (fecha, viaje, destinataria, registro), las secciones
   numeradas en romanos (I, II, III…), la sección de "Resonancias contemporáneas", la
   sección comparativa "El mundo simultáneo", y la coda final ("qué mirar en el viaje"),
   que se divide automáticamente en ítems de checklist (un ítem por párrafo, salvo el
   párrafo final cuando es un enlace hacia la siguiente entrega). También extrae los
   términos en VERSALES del texto (STASIS, TALASOCRACIA, PATRIMONIALISMO…) como
   candidatos a glosario.
2. **Traducción (EN)**: las 30 entregas completas se tradujeron al inglés preservando
   estructura párrafo a párrafo (mismo número de secciones y párrafos en ambos idiomas,
   para que el sitio pueda alternar idioma sin recargar la página). Registro editorial
   analítico, no turístico.
3. **Limpieza de glosario (`build_content.py`)**: la extracción automática de términos en
   VERSALES puede capturar fragmentos de frase en vez de conceptos limpios (p. ej. restos
   de negritas mal cortadas en el Word original). El script filtra automáticamente
   fragmentos que empiezan/terminan en preposiciones o artículos sueltos, pero **no es
   perfecto** — al revisar `glossary.html` es posible que veas 2-3 entradas raras entre
   las 167 términos detectados. Es un problema cosmético y fácil de arreglar a mano (ver
   sección 5).
4. **Cuadro comparativo (requisito 7)**: las 30 entregas no contienen tablas explícitas en
   el Word original — la "simultaneidad" (Grecia / Persia / Zhou / Chavín-Caral, o
   Grecia / Perú según la entrega) está redactada como prosa analítica dentro de una
   sección llamada "El mundo simultáneo" (o equivalente). Para no inventar datos
   tabulares que el texto original no formula como tales, el sitio detecta esa sección
   automáticamente y la presenta en una caja visual distinta (borde punteado, ícono de
   columnas) en vez de fabricar una tabla con celdas que no existían en la fuente. Si en
   algún momento quieres una tabla de verdad con columnas Grecia/Persia/Zhou/Perú, te
   recomiendo construirla entrega por entrega a partir de esos párrafos — es un trabajo
   editorial, no de extracción.

---

## 3. Requisitos de diseño — cómo se resolvió cada uno

| # | Requisito | Dónde vive |
|---|---|---|
| 1 | Paleta Egeo/Jónico/Mármol/Terracota/Oro | `assets/css/style.css` (`:root` variables) + `tailwind.config` en cada HTML |
| 2 | Tipografía editorial (serif cuerpo / sans nav) | Cormorant Garamond + Playfair Display (serif) / Jost (sans), vía Google Fonts |
| 3 | Iconografía (Lucide) | CDN `unpkg.com/lucide`, íconos temáticos por bloque y por entrega |
| 4 | Toggle ES/EN | `i18n.js` + botón fijo en cada navbar; re-renderiza todo el contenido dinámico sin recargar |
| 5 | Dashboard por bloques con tarjetas | `index.html` + `app.js` → `blockSection()` / `entregaCard()` |
| 6 | Vista de lectura: progreso, TOC flotante, notas | `entrega.html` + `reader.js` |
| 7 | Glassmorphism / mármol-océano | Clases `.glass`, `.glass-deep`, fondo con textura sutil en `style.css` |
| 8 | Resonancias contemporáneas | Caja destacada (`.resonancias-box`) detectada automáticamente por encabezado de sección |
| 9 | Cuadro comparativo | Caja de "lectura comparativa" con borde punteado (ver sección 2, punto 4) |
| 10 | Barra de progreso + TOC flotante | `#reading-progress` (scroll) + panel lateral en desktop / drawer en móvil |
| 11 | Checklist interactiva de campo | `#checklist` en cada entrega, con estado guardado en `localStorage` (por dispositivo) |
| 12 | Buscador + glosario por tags | `glossary.html` (nube de 167 términos) + buscador en `index.html`, ambos filtran las 30 tarjetas |

---

## 4. Desplegar en GitHub Pages (lo más simple posible)

No necesitas terminal avanzada ni Git instalado si usas la interfaz web de GitHub.

### Opción A — Subiendo por la web de GitHub (sin usar la terminal)

1. Entra a [github.com](https://github.com) y crea una cuenta si no tienes una.
2. Haz clic en **New repository** (botón verde). Nómbralo, por ejemplo, `grecia-30-entregas`.
   Déjalo en **Public** (necesario para GitHub Pages gratis) y no marques ninguna opción
   de inicialización (README, .gitignore, licencia) — el repo debe quedar vacío.
3. En la pantalla del repo vacío, haz clic en **uploading an existing file**.
4. Arrastra **todo el contenido** de esta carpeta (los archivos `index.html`,
   `entrega.html`, `glossary.html`, la carpeta `assets/` y, si quieres conservar la
   documentación, `fuente-contenido/` y este `README.md`) — arrastra los archivos y
   carpetas, no la carpeta contenedora.
5. Baja y haz clic en **Commit changes**.
6. Ve a **Settings → Pages** (menú lateral izquierdo).
7. En "Build and deployment", en **Source** elige **Deploy from a branch**.
8. En **Branch**, elige `main` y la carpeta **/ (root)**. Guarda.
9. Espera 1–2 minutos. GitHub te mostrará la URL pública, algo como:
   `https://tu-usuario.github.io/grecia-30-entregas/`

Listo — ese link ya es el sitio en vivo, bilingüe, con las 30 entregas.

### Opción B — Con Git desde la terminal

```bash
cd ruta/a/esta/carpeta
git init
git add .
git commit -m "Sitio Grecia 30 entregas"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/grecia-30-entregas.git
git push -u origin main
```

Luego repite los pasos 6–9 de la Opción A (Settings → Pages → Deploy from branch → main → / root).

### Actualizar el sitio más adelante

- **Cambiar textos, colores o diseño**: edita los archivos `.html`, `.css` o `.js`
  directamente y vuelve a subirlos (arrastrar de nuevo en la web de GitHub sobrescribe
  los archivos, o `git add . && git commit -m "..." && git push` por terminal).
- **Corregir el texto de una entrega o una traducción**: es más simple editar
  directamente `assets/js/content.js` buscando el número de entrega (`"numero": 5`) y
  corrigiendo el texto ahí — es JSON, cualquier editor de texto sirve. No hace falta
  tocar Python ni volver a extraer nada para una corrección puntual.
- **Regenerar todo desde cero** (si reescribes un Word original): edita
  `fuente-contenido/data/raw/entrega-NN.json` o `fuente-contenido/data/en/entrega-NN.json`
  a mano, y corre `python3 scripts/build_content.py` desde dentro de `fuente-contenido/`
  (requiere Python 3 instalado). Esto regenera `assets/js/content.js` completo.

---

## 5. Limitaciones conocidas / próximos pasos sugeridos

- El **glosario automático** (167 términos) puede tener 2-3 entradas que son fragmentos
  de frase en vez de un concepto limpio, por errores menores de segmentación de negritas
  en los Word originales. Revisa `glossary.html` una vez publicado y edita
  `assets/js/content.js` si quieres depurar alguna entrada puntual (buscar el array
  `"glosario"` de la entrega correspondiente).
- El **checklist de campo** se generó automáticamente separando los párrafos de la
  sección de cierre de cada entrega. En la mayoría de los casos el resultado es limpio
  (un ítem por lugar/observación), pero en 2-3 entregas el primer o último párrafo quedó
  como texto introductorio/de cierre en vez de ítem — es una decisión editorial menor que
  puedes ajustar directamente en `content.js` (mover texto entre los arrays `intro`,
  `items` y `closing` de cada `coda`).
- El **cuadro comparativo** (requisito 7) se resolvió como una caja de lectura
  destacada, no como una tabla de columnas fijas Grecia/Persia/Zhou/Perú, porque el
  texto original no está estructurado en filas y columnas — construir esa tabla real
  requeriría una síntesis editorial adicional entrega por entrega. Está documentado en la
  sección 2.
- Los estilos, tipografías e íconos se cargan desde CDNs externos (Tailwind, Google
  Fonts, Lucide) — el sitio necesita conexión a internet para verse con su diseño
  completo (funciona igual en local si abres `index.html` con conexión activa, o mejor
  aún, una vez publicado en GitHub Pages).
