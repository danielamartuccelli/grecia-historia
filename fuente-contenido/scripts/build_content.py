#!/usr/bin/env python3
"""Combine ES+EN entrega JSON into a single content.js bundle for the site,
with a cleaned glossary (drop extraction fragments) and block metadata."""
import json, glob, os, re

# Run this script from inside fuente-contenido/ (i.e. `python3 scripts/build_content.py`)
RAW_DIR = "data/raw"
EN_DIR = "data/en"
OUT_JS = "../assets/js/content.js"  # writes into the repo root's assets/js/

ES_STOP = {"DE","DEL","LA","LAS","EL","LOS","UN","UNA","QUE","CON","SIN","POR","PARA",
           "SU","SUS","Y","O","A","EN","ES","SE","AL","JUNTO","RESPALDE","SOBRE","COMO",
           "MÁS","MENOS","ENTRE","DESDE","HASTA","NI","LE","LO"}
EN_STOP = {"OF","THE","A","AN","TO","FOR","WITH","WITHOUT","ON","IN","AND","OR","BY",
           "FROM","ITS","THAT","AS","IS","AT","IT","BE","THAN","INTO"}
ROMAN_ONLY = re.compile(r'^[IVXLCDM]+$')

BLOCK_ICONS = {
    "I": "anchor",       # Cimientos antiguos
    "II": "moon-star",   # Mundo otomano y renacimiento
    "III": "flag",       # Independencia y siglo XIX
    "IV": "flame",       # Cataclismos del siglo XX
    "V": "landmark",     # Grecia contemporánea
}

DAY_ICONS = [
    "waves","sailboat","columns-3","scroll","map","compass","anchor","landmark",
    "moon-star","building-2","key-round","ship","feather","shield",
    "flag","crown","banknote","swords","users","building",
    "snowflake","percent","shield-alert","handshake","calculator",
    "scale","gavel","filter","wind","eye"
]

def clean_term(t, stop):
    words = t.split()
    if not words:
        return False
    if ROMAN_ONLY.match(words[0]) or ROMAN_ONLY.match(words[-1]):
        return False
    if words[0] in stop or words[-1] in stop:
        return False
    if len(words) > 3:
        return False
    if len(t) < 3:
        return False
    return True

def build_sections(sections_es, sections_en):
    coda_idx = next((i for i, s in enumerate(sections_es) if "coda" in s['heading'].lower()), len(sections_es) - 1)
    out = []
    for i, (s_es, s_en) in enumerate(zip(sections_es, sections_en)):
        out.append({
            "num": s_es['num'],
            "heading": {"es": s_es['heading'], "en": s_en['heading']},
            "paragraphs": {"es": s_es['paragraphs'], "en": s_en['paragraphs']},
            "is_resonancias": "resonancias" in s_es['heading'].lower(),
            "is_coda": i == coda_idx,
        })
    return out

def main():
    raw_files = sorted(glob.glob(os.path.join(RAW_DIR, "entrega-*.json")))
    entregas = []
    blocks = {}
    glossary_index = {}  # term_es -> {en, entregas:[nums]}

    for rf in raw_files:
        es = json.load(open(rf, encoding="utf-8"))
        en = json.load(open(os.path.join(EN_DIR, os.path.basename(rf)), encoding="utf-8"))
        n = es['numero']

        keep_idx = [i for i, t in enumerate(es['glosario']) if clean_term(t, ES_STOP) and clean_term(en['glosario'][i], EN_STOP)]
        glos_es = [es['glosario'][i] for i in keep_idx]
        glos_en = [en['glosario'][i] for i in keep_idx]

        for te, ten in zip(glos_es, glos_en):
            key = te
            if key not in glossary_index:
                glossary_index[key] = {"es": te, "en": ten, "entregas": []}
            glossary_index[key]["entregas"].append(n)

        entrega = {
            "numero": n,
            "bloque_num": es['bloque_num'],
            "dias": es['dias'],
            "icon": DAY_ICONS[(n-1) % len(DAY_ICONS)],
            "fecha_emision": {"es": es['fecha_emision'], "en": en['fecha_emision']},
            "viaje": {"es": es['viaje'], "en": en['viaje']},
            "destinataria": {"es": es['destinataria'], "en": en['destinataria']},
            "registro": {"es": es['registro'], "en": en['registro']},
            "titulo": {"es": es['titulo'], "en": en['titulo']},
            "subtitulo": {"es": es['subtitulo'], "en": en['subtitulo']},
            "bloque_nombre": {"es": es['bloque_nombre'], "en": en['bloque_nombre']},
            "glosario": {"es": glos_es, "en": glos_en},
            "sections": build_sections(es['sections'], en['sections']),
            "coda": {
                "heading": {"es": es['coda']['heading'], "en": en['coda']['heading']},
                "intro": {"es": es['coda']['intro'], "en": en['coda']['intro']},
                "items": [
                    {"label": {"es": i_es['label'], "en": i_en['label']},
                     "text": {"es": i_es['text'], "en": i_en['text']}}
                    for i_es, i_en in zip(es['coda']['items'], en['coda']['items'])
                ],
                "closing": {"es": es['coda']['closing'], "en": en['coda']['closing']},
                "next_hint": {"es": es['coda']['next_hint'], "en": en['coda']['next_hint']},
            }
        }
        entregas.append(entrega)

        b = es['bloque_num']
        if b not in blocks:
            blocks[b] = {
                "num": b,
                "nombre": {"es": es['bloque_nombre'], "en": en['bloque_nombre']},
                "dias": es['dias'],
                "icon": BLOCK_ICONS.get(b, "book-open"),
                "entregas": []
            }
        blocks[b]["entregas"].append(n)

    ROMAN_ORDER = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7}
    blocks_list = [blocks[k] for k in sorted(blocks.keys(), key=lambda r: ROMAN_ORDER.get(r, 99))]
    glossary_list = sorted(glossary_index.values(), key=lambda g: g['es'])

    payload = {
        "entregas": entregas,
        "blocks": blocks_list,
        "glossary": glossary_list,
    }

    os.makedirs(os.path.dirname(OUT_JS), exist_ok=True)
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("// Auto-generated content bundle — do not edit by hand.\n")
        f.write("// Regenerate with scripts/build_content.py from data/raw + data/en.\n")
        f.write("window.SITE_CONTENT = ")
        json.dump(payload, f, ensure_ascii=False, indent=1)
        f.write(";\n")

    print(f"Wrote {OUT_JS}: {len(entregas)} entregas, {len(blocks_list)} blocks, {len(glossary_list)} glossary terms.")

if __name__ == "__main__":
    main()
