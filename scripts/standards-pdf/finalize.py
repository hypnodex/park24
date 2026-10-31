# /// script
# dependencies = ["pypdf", "pillow"]
# ///
"""Park24 — PDF „Standardy boxu" z Figmy.

Zdrojem PDF je Figma (Park24 – Smeczka, sekce „Section 1", node 264:2475):
devět rámů 01–09 v poměru A4 na šířku (1689 × 1193,5 px). Postup:

  1. Každý rám exportovat z Figmy jako PDF (01.pdf … 09.pdf).
  2. pdfunite 0*.pdf merged.pdf && pdfimages -list merged.pdf > images.txt
  3. npm run pdf:standards -- merged.pdf images.txt

Skript stránky zmenší na A4 (841,89 × 595,28 pt) a fotky převzorkuje
na 300 ppi v umístěné velikosti (Figma je exportuje v plném rozlišení,
celé PDF by mělo ~17 MB). Výsledek: public/assets/Park24-standardy-boxu.pdf
"""
import io
import sys
from pathlib import Path

from PIL import Image
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, NumberObject

src, images_list = sys.argv[1], sys.argv[2]
out = Path(__file__).resolve().parents[2] / "public/assets/Park24-standardy-boxu.pdf"

FIGMA_W = 1689
A4W, A4H = 841.89, 595.28
TARGET_PPI = 300
MAX_EDGE = 2400  # px, strop i pro celostránkové fotky

# `pdfimages -list` zdroje: rozměr obrázku → efektivní ppi na stránce A4
PPI: dict[tuple[int, int], float] = {}
for line in Path(images_list).read_text().splitlines()[2:]:
    c = line.split()
    if c[2] == "image":
        k, v = (int(c[3]), int(c[4])), float(c[12]) * FIGMA_W / A4W
        PPI[k] = min(v, PPI.get(k, v))  # sdílený obrázek: největší umístění

w = PdfWriter(clone_from=PdfReader(src))
for obj in w._objects:
    if not hasattr(obj, "get") or obj.get("/Subtype") != "/Image":
        continue
    if obj.get("/Filter") not in ("/DCTDecode", ["/DCTDecode"]):
        continue
    W, H = obj["/Width"], obj["/Height"]
    s = min(MAX_EDGE / max(W, H), TARGET_PPI / PPI.get((W, H), TARGET_PPI))
    if s >= 1:
        continue
    im = Image.open(io.BytesIO(obj._data))
    icc = im.info.get("icc_profile")
    im = im.convert("RGB").resize((round(W * s), round(H * s)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=85, optimize=True, icc_profile=icc)
    # SMask zůstává v původním rozlišení — PDF nevyžaduje shodné rozměry
    obj._data = buf.getvalue()
    obj[NameObject("/Width")] = NumberObject(im.width)
    obj[NameObject("/Height")] = NumberObject(im.height)

for page in w.pages:
    page.scale_to(A4W, A4H)
    page.compress_content_streams(level=9)
w.compress_identical_objects()
w.add_metadata({"/Title": "Park24 — Standardy boxu", "/Author": "Park24 Lelekovice"})
with open(out, "wb") as f:
    w.write(f)
print(f"{out} ({out.stat().st_size / 1e6:.1f} MB)")
