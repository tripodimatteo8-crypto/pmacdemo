"""Composizione locale (nessuna chiamata a fal): cover.png a griglia e post-singolo.png."""
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

D = "/home/user/pmacdemo/output-gta/"
FONT = "/tmp/claude-0/-home-user-pmacdemo/7fb488ce-b537-54a4-9ed2-445fe4d30954/scratchpad/fonts/Anton-Regular.ttf"
W, H = 1080, 1350
CORAL, NAVY = (217, 103, 90), (27, 53, 80)


def panel(name, box, cx=0.5, cy=0.5):
    x0, y0, x1, y1 = box
    im = Image.open(D + name).convert("RGB")
    return ImageOps.fit(im, (x1 - x0, y1 - y0), Image.LANCZOS, centering=(cx, cy)), (x0, y0)


def outlined_text(img, xy, text, size, fill=(255, 255, 255), stroke=10, shadow=(10, 12), anchor="ms", spacing=0):
    f = ImageFont.truetype(FONT, size)
    # ombra morbida
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((xy[0] + shadow[0], xy[1] + shadow[1]), text, font=f, fill=(0, 0, 0, 170),
                            stroke_width=stroke, stroke_fill=(0, 0, 0, 170), anchor=anchor)
    sh = sh.filter(ImageFilter.GaussianBlur(4))
    img.alpha_composite(sh)
    ImageDraw.Draw(img).text(xy, text, font=f, fill=fill, stroke_width=stroke, stroke_fill=(0, 0, 0), anchor=anchor)


def fit_size(text, max_w, start):
    s = start
    while s > 20:
        f = ImageFont.truetype(FONT, s)
        if f.getbbox(text)[2] <= max_w:
            return s
        s -= 2
    return s


def cover():
    g = 16  # bordi bianchi spessi
    c = Image.new("RGBA", (W, H), "white")
    boxes = [
        ("00-hero-napoli-city.png", (g, g, 668, 500), 0.3, 0.5),
        ("01-host-vicecity.png", (668 + g, g, W - g, 500), 0.62, 0.55),
        ("02-loft-golfo.png", (g, 500 + g, 430, 790), 0.5, 0.5),
        ("04-vespa-lungomare.png", (430 + g, 500 + g, W - g, 790), 0.5, 0.55),
        ("03-ospiti-quartieri.png", (g, 790 + g, 380, H - g), 0.45, 0.85),
        ("05-rooftop-piscina.png", (380 + g, 790 + g, 720, H - g), 0.45, 0.95),
        ("06-investitore.png", (720 + g, 790 + g, W - g, H - g), 0.5, 0.2),
    ]
    for name, box, cx, cy in boxes:
        p, pos = panel(name, box, cx, cy)
        c.paste(p, pos)
    # sfumatura scura in basso per leggibilità del titolo
    grad = Image.new("L", (1, 300))
    for y in range(300):
        grad.putpixel((0, y), int(150 * (y / 299) ** 2.2))
    shade = Image.new("RGBA", (W - 2 * g, 300), (10, 8, 30, 255))
    shade.putalpha(grad.resize((W - 2 * g, 300)))
    c.alpha_composite(shade, (g, H - g - 300))
    # titolo
    t = "IMMOBILIARENDITA"
    size = fit_size(t, W - 230, 150)
    outlined_text(c, (W // 2, H - 48), t, size, stroke=10)
    # nastro corallo con sottotitolo
    f = ImageFont.truetype(FONT, 38)
    sub = "AFFITTI BREVI A NAPOLI"
    bw = f.getbbox(sub)[2] + 44
    rib = Image.new("RGBA", (bw, 60), CORAL + (255,))
    ImageDraw.Draw(rib).text((bw // 2, 31), sub, font=f, fill="white", anchor="mm")
    rib = ImageOps.expand(rib, border=5, fill="black").rotate(-3, expand=True, resample=Image.BICUBIC)
    c.alpha_composite(rib, ((W - rib.width) // 2, H - 48 - int(size * 0.92) - rib.height + 14))
    c.convert("RGB").save(D + "cover.png")


def singolo():
    c = Image.new("RGBA", (W, H))
    p, _ = panel("00-hero-napoli-city.png", (0, 0, W, H), 0.5, 0.5)
    c.paste(p, (0, 0))
    # box bianco inclinato con messaggio, come nel riferimento
    f = ImageFont.truetype(FONT, 50)
    lines = ["CASA TUA A NAPOLI", "LAVORA MENTRE TU", "TI GODI IL TRAMONTO"]
    bw, lh = 760, 60
    box = Image.new("RGBA", (bw, lh * len(lines) + 40), (255, 255, 255, 255))
    d = ImageDraw.Draw(box)
    for i, l in enumerate(lines):
        d.text((bw // 2, 20 + lh * i + lh // 2), l, font=f, fill=NAVY, anchor="mm")
    box = box.rotate(1.5, expand=True, resample=Image.BICUBIC)
    sh = Image.new("RGBA", box.size, (0, 0, 0, 0))
    sh.putalpha(box.split()[3].point(lambda a: int(a * 0.45)))
    sh = sh.filter(ImageFilter.GaussianBlur(8))
    y = 945
    c.alpha_composite(sh, ((W - box.width) // 2 + 10, y + 12))
    c.alpha_composite(box, ((W - box.width) // 2, y))
    t = "IMMOBILIARENDITA"
    outlined_text(c, (W // 2, 1300), t, fit_size(t, W - 160, 140), stroke=9)
    c.convert("RGB").save(D + "post-singolo.png")


cover()
singolo()
print("ok")
