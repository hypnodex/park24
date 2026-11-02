# /// script
# dependencies = ["pypdf", "pillow"]
# ///
"""Park24 — PDF „Standardy boxu" z Figmy.

Zdrojem PDF je Figma (Park24 – Smeczka, sekce „Section 1", node 264:2475):
devět rámů 01–09 v poměru A4 na šířku (1689 × 1193,5 px). Postup:

  1. Každý rám exportovat z Figmy jako PDF (01.pdf … 09.pdf).
  2. pdfunite 0*.pdf merged.pdf && pdfimages -list merged.pdf > images.txt
  3. npm run pdf:standards -- merged.pdf images.txt

Skript fotky převzorkuje na 300 ppi při tisku na A4 (Figma je exportuje
v plném rozlišení, celé PDF by mělo ~17 MB). Výsledek:
public/assets/Park24-standardy-boxu.pdf

Stránky záměrně NEzmenšujeme na A4 (zůstávají 1689 × 1193,5 pt, poměr A4):
Apple (Safari, iOS, Náhled) pod jakoukoli škálou chybně vykreslí soft masky
z Figmy (blur, průhlednosti) — ze stránky zůstane jen levá dolní čtvrtina.
Při tisku se stránka přizpůsobí papíru sama.
"""
import io
import sys
import zlib
from pathlib import Path

from PIL import Image
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, NumberObject

src, images_list = sys.argv[1], sys.argv[2]
out = Path(__file__).resolve().parents[2] / "public/assets/Park24-standardy-boxu.pdf"

FIGMA_W = 1689
A4W = 841.89  # šířka A4 na šířku v pt — jen pro výpočet ppi
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
    if s < 1:
        im = Image.open(io.BytesIO(obj._data))
        icc = im.info.get("icc_profile")
        im = im.convert("RGB").resize((round(W * s), round(H * s)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=85, optimize=True, icc_profile=icc)
        obj._data = buf.getvalue()
        W, H = im.width, im.height
        obj[NameObject("/Width")] = NumberObject(W)
        obj[NameObject("/Height")] = NumberObject(H)
    # SMask musí mít stejné rozměry jako obrázek — PDF to sice nevyžaduje,
    # ale Apple (Safari / Náhled / iOS) jinak vykreslí jen výřez fotky.
    if "/SMask" in obj:
        m = obj["/SMask"].get_object()
        if (m["/Width"], m["/Height"]) != (W, H) and m.get("/BitsPerComponent") == 8:
            mask = Image.frombytes("L", (m["/Width"], m["/Height"]), m.get_data())
            m._data = zlib.compress(mask.resize((W, H), Image.LANCZOS).tobytes(), 9)
            m[NameObject("/Filter")] = NameObject("/FlateDecode")
            m.pop("/DecodeParms", None)
            m[NameObject("/Width")] = NumberObject(W)
            m[NameObject("/Height")] = NumberObject(H)

for page in w.pages:
    page.compress_content_streams(level=9)
w.compress_identical_objects()
w.add_metadata({"/Title": "Park24 — Standardy boxu", "/Author": "Park24 Lelekovice"})
with open(out, "wb") as f:
    w.write(f)
print(f"{out} ({out.stat().st_size / 1e6:.1f} MB)")
