"""Ritaglio per componenti delle tavole 3×3 del ramo gpt/immagini, condiviso dagli import delle icone.

Le tavole non sono una griglia esatta: un gambo può scendere oltre il terzo del foglio, un cappello largo
può superare il confine della colonna. Tagliare a terzi fissi lascia i disegni mozzati. Qui si cercano le
macchie di disegno connesse (alfa > 16, 8 vicini) e ognuna va alla cella del suo baricentro; il riquadro di
una cella è l'unione delle sue macchie. Le macchie minuscole (polvere dell'antialias) contano solo se cadono
dentro il riquadro di un disegno: non spostano né allargano nulla.

Errori (la tavola è rifiutata): un disegno tocca il bordo del foglio; i riquadri di due celle si sovrappongono.
"""
import sys
import numpy as np
from PIL import Image

ALPHA = 16
NOISE = 0.0002  # macchie sotto lo 0,02% del foglio: polvere dell'antialias
STATE_OK = "pronta da integrare"


def components(mask):
    """Etichetta le macchie connesse (8 vicini) per corse orizzontali: (etichette, n). Veloce anche su 1254 px."""
    h, w = mask.shape
    parent = []

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    rows = []  # per riga: lista di (inizio, fine esclusa, id)
    for y in range(h):
        m = np.concatenate(([0], mask[y].astype(np.int8), [0]))
        d = np.diff(m)
        starts, ends = np.nonzero(d == 1)[0], np.nonzero(d == -1)[0]
        cur = []
        prev = rows[-1] if rows else []
        j = 0
        for s, e in zip(starts.tolist(), ends.tolist()):
            rid = len(parent)
            parent.append(rid)
            # 8 vicini: si toccano le corse della riga sopra che coprono [s-1, e]
            while j < len(prev) and prev[j][1] < s:
                j += 1
            k = j
            while k < len(prev) and prev[k][0] <= e:
                a, b = find(prev[k][2]), find(rid)
                if a != b:
                    parent[max(a, b)] = min(a, b)
                k += 1
            cur.append((s, e, rid))
        rows.append(cur)
    lab = np.zeros((h, w), np.int32)
    ids = {}
    for y, cur in enumerate(rows):
        for s, e, rid in cur:
            r = find(rid)
            if r not in ids:
                ids[r] = len(ids) + 1
            lab[y, s:e] = ids[r]
    return lab, len(ids)


def drawings(im, name, k=2):
    """{cella: (x0, y0, x1, y1)} dei disegni di una tavola RGBA, per componenti (vedi sopra)."""
    W, H = im.size
    lab, n = components(np.array(im.getchannel("A").resize((W // k, H // k), Image.NEAREST)) > ALPHA)
    boxes = {}
    if n:
        idx = np.arange(1, n + 1)
        flat = lab.ravel()
        ys, xs = np.divmod(np.nonzero(flat)[0], lab.shape[1])
        labs = flat[flat > 0]
        cnt = np.bincount(labs, minlength=n + 1)
        sy, sx = np.bincount(labs, ys, n + 1), np.bincount(labs, xs, n + 1)
        x0s = np.full(n + 1, 1 << 30); y0s = x0s.copy(); x1s = np.full(n + 1, -1); y1s = x1s.copy()
        np.minimum.at(x0s, labs, xs); np.minimum.at(y0s, labs, ys)
        np.maximum.at(x1s, labs, xs); np.maximum.at(y1s, labs, ys)
        for i in idx:
            box = (int(x0s[i]) * k, int(y0s[i]) * k, (int(x1s[i]) + 1) * k, (int(y1s[i]) + 1) * k)
            if cnt[i] * k * k < NOISE * W * H:
                continue
            x0, y0, x1, y1 = box
            if x0 <= 1 or y0 <= 1 or x1 >= W - 1 or y1 >= H - 1:
                sys.exit(f"{name}: un disegno tocca il bordo del foglio ({x0},{y0}–{x1},{y1})")
            cy, cx = sy[i] / cnt[i] * k, sx[i] / cnt[i] * k
            cell = min(int(cy // (H / 3)), 2) * 3 + min(int(cx // (W / 3)), 2)
            b = boxes.get(cell)
            boxes[cell] = box if not b else (min(b[0], x0), min(b[1], y0), max(b[2], x1), max(b[3], y1))
    cells = sorted(boxes)
    for i, c in enumerate(cells):
        for d in cells[i + 1:]:
            a, b = boxes[c], boxes[d]
            if a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]:
                sys.exit(f"{name}: i disegni delle celle {c} e {d} si sovrappongono")
    return boxes


def sheet_states(path):
    """Stato di ogni tavola in incoming/bozze/STATO.md: {percorso sotto incoming/: stato}. Vale l'ultima riga."""
    out = {}
    for line in open(path, encoding="utf-8"):
        cols = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cols) < 3 or not cols[0] or cols[0].startswith("---") or "/" not in cols[0]:
            continue
        f = cols[0].strip("`").removeprefix("incoming/")
        # due formati di tabella: «File | Stato | Note» e «File | Specie | Stato | Note»
        state = next((c for c in cols[1:3] if c.lower().replace("*", "").startswith(("ok", "pronta", "non ", "da ", "esempio", "approvat", "in attesa", "verifica", "scartat"))), cols[1])
        out[f] = state.replace("*", "").strip()
    return out


def ready_sheets(path, accept=(STATE_OK,)):
    """Tavole che si possono integrare: stato in STATO.md tra quelli accettati (di norma «pronta da integrare»)."""
    acc = [a.lower() for a in accept]
    return {f for f, s in sheet_states(path).items() if s.lower() in acc}
