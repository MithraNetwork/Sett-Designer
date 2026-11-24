# Stitches the tiles from shoot.mjs into one PNG per page and size, then writes the
# previews (thumbs/) and the list (index.json) that studio/screenshots.html reads.
import datetime, json, os, shutil
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
T = os.path.join(HERE, "tiles")
for d in sorted(os.listdir(T)):
    m = json.load(open(os.path.join(T, d, "meta.json")))
    out = Image.new("RGB", (m["W"], m["total"]), (6, 12, 26))
    y = 0
    for t in m["meta"]:
        im = Image.open(os.path.join(T, d, t["f"])).convert("RGB")
        out.paste(im.crop((0, t["crop"], m["W"], t["crop"] + t["keep"])), (0, y)); y += t["keep"]
    out.save(os.path.join(HERE, d + ".png"), optimize=True)
    print(d, out.size)
shutil.rmtree(T)
TH = os.path.join(HERE, "thumbs"); os.makedirs(TH, exist_ok=True)
items = []
for f in sorted(x for x in os.listdir(HERE) if x.endswith(".png")):
    im = Image.open(os.path.join(HERE, f)); w, h = im.size
    top = im.crop((0, 0, w, min(h, int(w * 1.25)))).convert("RGB"); top.thumbnail((640, 800))
    top.save(os.path.join(TH, f[:-4] + ".jpg"), quality=82)
    page, size = f[:-4].rsplit("-", 1)
    items.append({"file": f, "page": page, "size": size, "width": w, "height": h, "mb": round(os.path.getsize(os.path.join(HERE, f)) / 1e6, 1),
                  "made": datetime.datetime.fromtimestamp(os.path.getmtime(os.path.join(HERE, f))).strftime("%Y-%m-%d %H:%M")})
json.dump(items, open(os.path.join(HERE, "index.json"), "w"), indent=1)
print("index.json:", len(items), "screenshots")
