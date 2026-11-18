"""Carosello 1080x1350 con scritte HUD stile videogioco (solo locale, nessuna chiamata a fal)."""
import math, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

D = "/home/user/pmacdemo/output-gta/"
OUT = D + "carosello/"
ANTON = "/tmp/claude-0/-home-user-pmacdemo/7fb488ce-b537-54a4-9ed2-445fe4d30954/scratchpad/fonts/Anton-Regular.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
W, H = 1080, 1350
CORAL, GOLD, GREEN, CYAN = (238, 110, 95), (255, 200, 40), (110, 220, 90), (90, 230, 240)
WHITE, BLACK = (255, 255, 255), (0, 0, 0)


def F(path, s):
    return ImageFont.truetype(path, s)


def base(name, cx=0.5, cy=0.5):
    im = Image.open(D + name).convert("RGB")
    return ImageOps.fit(im, (W, H), Image.LANCZOS, centering=(cx, cy)).convert("RGBA")


def shadow_text(img, xy, text, font, fill=WHITE, stroke=8, anchor="la", blur=5, off=(6, 8)):
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((xy[0] + off[0], xy[1] + off[1]), text, font=font, fill=(0, 0, 0, 180),
                            stroke_width=stroke, stroke_fill=(0, 0, 0, 180), anchor=anchor)
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    ImageDraw.Draw(img).text(xy, text, font=font, fill=fill, stroke_width=stroke, stroke_fill=BLACK, anchor=anchor)


def mission_box(img, y, title, lines, accent=GOLD):
    """Riquadro obiettivo: titolo piccolo colorato + testo bianco; segmenti [testo, colore]."""
    ft, fb = F(ANTON, 40), F(SANS, 36)
    pad, lh = 34, 50
    bw = W - 120
    bh = pad * 2 + 52 + lh * len(lines)
    box = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    d = ImageDraw.Draw(box)
    d.rounded_rectangle((0, 0, bw - 1, bh - 1), 18, fill=(8, 6, 24, 200))
    d.rectangle((0, 18, 9, bh - 19), fill=accent)
    d.text((pad, pad - 6), title, font=ft, fill=accent)
    for i, segs in enumerate(lines):
        x = pad
        for t, c in segs:
            d.text((x, pad + 56 + lh * i), t, font=fb, fill=c)
            x += fb.getlength(t)
    img.alpha_composite(box, ((W - bw) // 2, y))


def star(d, cx, cy, r, fill, outline=BLACK, w=4):
    pts = []
    for k in range(10):
        a = -math.pi / 2 + k * math.pi / 5
        rr = r if k % 2 == 0 else r * 0.45
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=fill, outline=outline, width=w)


def stars_hud(img, n_full, x=W - 60, y=70, r=30):
    d = ImageDraw.Draw(img)
    for i in range(5):
        star(d, x - i * (2 * r + 10) - r, y + r, r, GOLD if i < n_full else (255, 255, 255, 90))


def money_hud(img, text, y=60):
    shadow_text(img, (W - 50, y), text, F(ANTON, 72), fill=GREEN, stroke=6, anchor="ra")


def clock_hud(img, text, y=60):
    shadow_text(img, (50, y), text, F(ANTON, 64), fill=WHITE, stroke=6)


def top_fade(img, h=260, a=150):
    g = Image.new("L", (1, h))
    for y in range(h):
        g.putpixel((0, y), int(a * (1 - y / (h - 1)) ** 1.5))
    l = Image.new("RGBA", (W, h), (5, 3, 20, 255))
    l.putalpha(g.resize((W, h)))
    img.alpha_composite(l, (0, 0))


def big_title(img, y, text, color=GOLD, size=150, sub=None, sub_color=WHITE):
    f = F(ANTON, size)
    while f.getlength(text) > W - 100:
        size -= 6; f = F(ANTON, size)
    shadow_text(img, (W // 2, y), text, f, fill=color, stroke=10, anchor="ms", off=(8, 10))
    if sub:
        shadow_text(img, (W // 2, y + 72), sub, F(ANTON, 60), fill=sub_color, stroke=6, anchor="ms")


def tag(img, xy, text):
    f = F(SANS, 26)
    shadow_text(img, xy, text, f, fill=WHITE, stroke=3, off=(2, 3), blur=2)


def save(img, n):
    os.makedirs(OUT, exist_ok=True)
    img = img.convert("RGB")
    img.save(OUT + f"{n:02d}.png")
    return img


# 01 – cover (già con titolo): aggiungo HUD
c = Image.open(D + "cover.png").convert("RGBA")
shadow_text(c, (40, 40), "NUOVA MISSIONE", F(ANTON, 46), fill=GOLD, stroke=6)
save(c, 1)

# 02 – hero
s = base("00-hero-napoli-city.png", 0.5, 0.5); top_fade(s)
clock_hud(s, "19:30"); money_hud(s, "€ 0")
mission_box(s, 960, "MISSIONE 1 · NAPOLI CITY", [
    [("Hai una casa a Napoli che resta ", WHITE), ("vuota", CORAL), ("?", WHITE)],
    [("Trasformala in una ", WHITE), ("rendita", GOLD), (" con gli ", WHITE), ("affitti brevi", CYAN), (".", WHITE)],
], accent=GOLD)
save(s, 2)

# 03 – host con chiavi
s = base("01-host-vicecity.png", 0.62, 0.5); top_fade(s)
clock_hud(s, "20:15"); stars_hud(s, 3, y=150)
money_hud(s, "€ 0")
mission_box(s, 1010, "OBIETTIVO", [
    [("Recupera le ", WHITE), ("chiavi", GOLD), (" e prendi in carico", WHITE)],
    [("la casa. Da qui ", WHITE), ("guidiamo noi", CYAN), (".", WHITE)],
])
save(s, 3)

# 04 – loft: checklist allestimento
s = base("02-loft-golfo.png", 0.6, 0.5); top_fade(s)
clock_hud(s, "GIORNO 3")
big_title(s, 330, "ALLESTISCI", color=CYAN, size=150, sub="OBIETTIVO COMPLETATO", sub_color=GOLD)
mission_box(s, 930, "CHECKLIST", [
    [("✔ ", GREEN), ("Arredo e kit ospiti", WHITE)],
    [("✔ ", GREEN), ("Foto professionali", WHITE)],
    [("✔ ", GREEN), ("Annuncio online su Airbnb e Booking", WHITE)],
], accent=CYAN)
save(s, 4)

# 05 – ospiti: CHECK-IN ALLE 23:00
s = base("03-ospiti-quartieri.png", 0.5, 0.5); top_fade(s)
clock_hud(s, "23:00"); money_hud(s, "+ €")
big_title(s, 340, "CHECK-IN ALLE 23:00", color=WHITE, size=130, sub="NESSUN PROBLEMA", sub_color=GOLD)
mission_box(s, 1010, "SECONDARIA", [
    [("Volo in ritardo? ", WHITE), ("Self check-in", CYAN), (" o un nostro", WHITE)],
    [("host ad aspettarli. ", WHITE), ("Tu dormi", GOLD), (".", WHITE)],
], accent=CORAL)
save(s, 5)

# 06 – vespa
s = base("04-vespa-lungomare.png", 0.55, 0.5); top_fade(s)
clock_hud(s, "10:00"); money_hud(s, "+ €")
big_title(s, 330, "GLI OSPITI ESPLORANO", color=WHITE, size=110, sub="TU NON MUOVI UN DITO", sub_color=CYAN)
mission_box(s, 1010, "IN CORSO", [
    [("Pulizie, biancheria, messaggi H24:", WHITE)],
    [("ci pensa ", WHITE), ("immobiliarendita", CORAL), (".", WHITE)],
], accent=CYAN)
save(s, 6)

# 07 – rooftop: recensioni 5 stelle
s = base("05-rooftop-piscina.png", 0.55, 0.5); top_fade(s, h=420, a=170)
clock_hud(s, "CHECK-OUT")
d = ImageDraw.Draw(s)
for i in range(5):
    star(d, W // 2 + (i - 2) * 130, 200, 55, GOLD, w=6)
big_title(s, 395, "RECENSIONE 5 STELLE", color=GOLD, size=110)
mission_box(s, 1010, "BONUS SBLOCCATO", [
    [("Più recensioni = più prenotazioni", WHITE)],
    [("= più ", WHITE), ("rendita", GOLD), (" per te.", WHITE)],
], accent=GOLD)
save(s, 7)

# 08 – investitore: MISSION PASSED
s = base("06-investitore.png", 0.5, 0.0)
shade = Image.new("RGBA", (W, H), (5, 3, 20, 70)); s.alpha_composite(shade)
big_title(s, 330, "MISSION PASSED!", color=GOLD, size=150, sub="RENDITA SBLOCCATA", sub_color=WHITE)
mission_box(s, 1000, "PROSSIMA MISSIONE", [
    [("Investi · Allestisci · Guadagna", GOLD)],
    [("Scrivici in DM · ", WHITE), ("immobiliarendita.com", CYAN)],
], accent=CORAL)
save(s, 8)

# anteprima
th = [Image.open(OUT + f"{i:02d}.png").resize((270, 337)) for i in range(1, 9)]
sheet = Image.new("RGB", (270 * 4, 337 * 2), "white")
for i, t in enumerate(th):
    sheet.paste(t, ((i % 4) * 270, (i // 4) * 337))
sheet.save("/tmp/claude-0/-home-user-pmacdemo/7fb488ce-b537-54a4-9ed2-445fe4d30954/scratchpad/carosello-sheet.jpg")
print("ok")
