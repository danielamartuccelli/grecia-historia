#!/usr/bin/env python3
"""Extract structured ES content from the 30 'Entrega' docx files into JSON."""
import re, json, glob, os
from docx import Document

# Run this script from inside fuente-contenido/ (i.e. `python3 scripts/extract.py`).
# Point SRC_DIR at the folder containing the 30 "Entrega_NN_*.docx" files.
SRC_DIR = "../../historias"  # adjust to wherever your original .docx files live
OUT_DIR = "data/raw"
os.makedirs(OUT_DIR, exist_ok=True)

ROMAN_RE = re.compile(r'^(X{0,3}(IX|IV|V?I{0,3}))\.\s+(.*)$')
ORDINALS = ["Primera", "Segunda", "Tercera", "Cuarta", "Quinta", "Sexta", "Séptima",
            "Octava", "Novena", "Décima"]
ORDINAL_RE = re.compile(r'^(' + "|".join(ORDINALS) + r')[,\.]\s+(.*)$')

# find ALL-CAPS technical terms (>=4 letters incl. accented, allow internal spaces of up to 3 words)
CAPS_WORD = r'[A-ZÁÉÍÓÚÑÜ]{2,}'
CAPS_TERM_RE = re.compile(r'\b(' + CAPS_WORD + r'(?:\s+' + CAPS_WORD + r'){0,3})\b')

STOPWORDS_CAPS = {"I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"}

def clean_terms(text):
    terms = set()
    for m in CAPS_TERM_RE.finditer(text):
        t = m.group(1).strip()
        words = t.split()
        if all(w in STOPWORDS_CAPS for w in words):
            continue
        if len(t) < 4:
            continue
        terms.add(t)
    return terms

def parse_file(path):
    doc = Document(path)
    paras = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

    meta = {}
    # paras[0] = master title, paras[1] = ENTREGA N · BLOQUE ... (DÍAS ...)
    m = re.match(r'ENTREGA\s+(\d+)\s*·\s*BLOQUE\s+([IVX]+):\s*(.+?)\s*\(D[ÍI]AS\s+(.+?)\)', paras[1])
    if m:
        meta['numero'] = int(m.group(1))
        meta['bloque_num'] = m.group(2)
        meta['bloque_nombre'] = m.group(3).strip()
        meta['dias'] = m.group(4).strip()
    else:
        raise ValueError(f"Header line didn't match in {path}: {paras[1]}")

    meta['titulo'] = paras[2]
    meta['subtitulo'] = paras[3]

    idx = 4
    while idx < len(paras) and not paras[idx].startswith("Fecha de emisión"):
        idx += 1
    meta['fecha_emision'] = paras[idx].replace("Fecha de emisión:", "").strip()
    idx += 1
    meta['viaje'] = paras[idx].replace("Viaje:", "").strip()
    idx += 1
    meta['destinataria'] = paras[idx].replace("Destinataria:", "").strip()
    idx += 1
    meta['registro'] = paras[idx].replace("Registro:", "").strip()
    idx += 1

    # remaining paragraphs = body
    body = paras[idx:]
    sections = []
    cur = None
    for p in body:
        rm = ROMAN_RE.match(p)
        if rm and len(rm.group(3)) > 0 and len(p) < 140:
            if cur:
                sections.append(cur)
            cur = {"num": rm.group(1), "heading": rm.group(3).strip(), "paragraphs": []}
        else:
            if cur is None:
                cur = {"num": "", "heading": "", "paragraphs": []}
            cur["paragraphs"].append(p)
    if cur:
        sections.append(cur)

    # glossary terms across whole doc
    all_terms = set()
    for s in sections:
        for p in s["paragraphs"]:
            all_terms |= clean_terms(p)
    meta['glosario'] = sorted(all_terms)

    # coda = last section (contains "Coda" in heading, or fallback to last)
    coda_section = None
    for s in sections:
        if "coda" in s["heading"].lower():
            coda_section = s
            break
    if coda_section is None:
        coda_section = sections[-1]

    FORWARD_RE = re.compile(r'^(La próxima entrega|El bloque\s+[IVX]+\s+(empieza|cierra))', re.IGNORECASE)
    ITEM_START_RE = re.compile(
        r'^(Primer[ao]|Segund[ao]|Tercer[ao]|Cuart[ao]|Quint[ao]|Sext[ao]|Séptim[ao]|'
        r'En\s+[A-ZÁÉÍÓÚÑ]|Un ejercicio|Una pregunta|Y una pregunta|Frente a)',
    )

    coda_paras = coda_section["paragraphs"][:]
    next_hint = None
    if coda_paras and FORWARD_RE.match(coda_paras[-1]):
        next_hint = coda_paras.pop()

    coda_items = []
    coda_intro = []
    coda_closing = []
    for i, p in enumerate(coda_paras):
        om = ORDINAL_RE.match(p)
        is_item = bool(ITEM_START_RE.match(p))
        if om:
            coda_items.append({"label": om.group(1), "text": om.group(2)})
        elif is_item:
            coda_items.append({"label": "", "text": p})
        elif i == 0 and not coda_items:
            coda_intro.append(p)
        elif not coda_items:
            # still nothing captured as an item yet, but doesn't match a
            # recognizable opener -> treat conservatively as an item anyway
            coda_items.append({"label": "", "text": p})
        else:
            coda_closing.append(p)
    meta['coda'] = {
        "heading": coda_section["heading"],
        "intro": coda_intro,
        "items": coda_items,
        "closing": coda_closing,
        "next_hint": next_hint
    }

    # resonancias section = section with "Resonancias" in heading
    reson_section = None
    for s in sections:
        if "resonancias" in s["heading"].lower():
            reson_section = s
            break
    meta['resonancias'] = reson_section

    meta['sections'] = sections
    return meta

def main():
    files = sorted(glob.glob(os.path.join(SRC_DIR, "Entrega_*.docx")))
    all_meta = []
    for f in files:
        try:
            meta = parse_file(f)
            meta['_file'] = os.path.basename(f)
            all_meta.append(meta)
        except Exception as e:
            print(f"ERROR parsing {f}: {e}")
    all_meta.sort(key=lambda m: m['numero'])
    for m in all_meta:
        with open(os.path.join(OUT_DIR, f"entrega-{m['numero']:02d}.json"), "w", encoding="utf-8") as fh:
            json.dump(m, fh, ensure_ascii=False, indent=2)
    print(f"Parsed {len(all_meta)} entregas.")
    # sanity: check numbers 1..30 present
    nums = sorted(m['numero'] for m in all_meta)
    missing = [n for n in range(1,31) if n not in nums]
    if missing:
        print("MISSING:", missing)
    else:
        print("All 30 present.")

if __name__ == "__main__":
    main()
