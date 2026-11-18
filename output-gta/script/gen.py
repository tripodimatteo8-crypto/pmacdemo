"""Genera UNA vignetta con fal-ai/nano-banana, rispettando il budget in spesa.log.
Uso: FAL_KEY=... python3 gen.py <nome> <aspect_ratio> "<prompt>"
La chiave è letta solo dall'ambiente e non viene mai stampata né scritta.
"""
import datetime, json, os, sys, urllib.request

PROJ = "/home/user/pmacdemo"
LOG = os.path.join(PROJ, "spesa.log")
OUT = os.path.join(PROJ, "output-gta")
MODEL = "fal-ai/nano-banana"
COST = 0.0398
CAP = 1.00


def spent():
    if not os.path.exists(LOG):
        return 0.0
    tot = 0.0
    for line in open(LOG):
        if "cumulativo=" in line:
            tot = float(line.split("cumulativo=")[1].split("$")[0])
    return tot


def log(name, attempt, status, cum):
    with open(LOG, "a") as f:
        f.write(f"{datetime.datetime.now().isoformat(timespec='seconds')} | {MODEL} | {name} | "
                f"tentativo {attempt} | {status} | costo_stimato={COST:.4f}$ | cumulativo={cum:.4f}$\n")


def call(prompt, aspect):
    body = json.dumps({"prompt": prompt, "num_images": 1, "aspect_ratio": aspect,
                       "output_format": "png"}).encode()
    req = urllib.request.Request(f"https://fal.run/{MODEL}", data=body, method="POST", headers={
        "Authorization": "Key " + os.environ["FAL_KEY"], "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.load(r)


def main():
    name, aspect, prompt = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(OUT, exist_ok=True)
    for attempt in (1, 2):  # max 1 retry, solo se fallisce
        cum = spent()
        if cum + COST > CAP:
            print(f"STOP: {cum:.4f}$ + {COST}$ supererebbe {CAP}$"); sys.exit(2)
        try:
            res = call(prompt, aspect)
            url = res["images"][0]["url"]
            path = os.path.join(OUT, f"{name}.png")
            urllib.request.urlretrieve(url, path)
            log(name, attempt, "OK", cum + COST)
            print(f"OK {path} | cumulativo {cum + COST:.4f}$")
            return
        except Exception as e:  # conteggio prudente: anche il fallimento è messo a budget
            msg = str(e).replace(os.environ.get("FAL_KEY", "§"), "***")[:200]
            log(name, attempt, f"ERRORE {type(e).__name__}", cum + COST)
            print(f"ERRORE tentativo {attempt}: {msg}")
    sys.exit(1)


if __name__ == "__main__":
    main()
