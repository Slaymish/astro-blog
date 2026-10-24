"""Cover for personal-language-corpus, plotted from the published reference profile.

Values come from outputs/reference/nietzsche-profile.json in Slaymish/personal-language-corpus
(the public Nietzsche reference profile; no personal corpus data is used).

Each point is one work: mean heuristic sentence length along x, exclamation marks per
1,000 words up y. The two ends of Nietzsche's register separate cleanly, which is what
the plot is for.

Run: ~/.hermes/tools/python-3.14.*/bin/python3 corpus-register-cover.py
"""

import json
import pathlib

import matplotlib

matplotlib.use("Agg")
import matplotlib.patheffects as pe
import matplotlib.pyplot as plt

PAPER = "#fdfdfb"
INK = "#10130f"
MUTED = "#545c52"
LINE = "#e0e3d9"
ACCENT = "#b4442a"

PROFILE = pathlib.Path(
    "~/Developer/personal-language-corpus/outputs/reference/nietzsche-profile.json"
).expanduser()
documents = json.loads(PROFILE.read_text())["per_document"]

LABELS = {
    "birth-of-tragedy": "Birth of Tragedy",
    "zarathustra": "Zarathustra",
    "poems-and-dithyrambs": "Poems and Dithyrambs",
    "gay-science": "The Gay Science",
}
# Label offsets in points, nudged by hand so nothing overlaps.
OFFSETS = {
    "birth-of-tragedy": (-8, 10),
    "zarathustra": (9, -13),
    "poems-and-dithyrambs": (0, 13),
    "gay-science": (8, 4),
}

points = []
for key, doc in documents.items():
    words = doc["words"]
    x = doc["mean_sentence_words_heuristic"]
    y = doc["punctuation_per_1000_words"]["exclamations"]
    points.append((key, x, y, words))

fig, ax = plt.subplots(figsize=(8, 4.5), dpi=200)
fig.patch.set_facecolor(PAPER)
ax.set_facecolor(PAPER)

xs = [p[1] for p in points]
ys = [p[2] for p in points]
sizes = [22 + (p[3] / 1000) * 0.35 for p in points]

for side in ("top", "right"):
    ax.spines[side].set_visible(False)
for side in ("left", "bottom"):
    ax.spines[side].set_color(LINE)
ax.tick_params(colors=MUTED, labelsize=9, length=0)
ax.grid(color=LINE, linewidth=0.7, zorder=0)
ax.set_axisbelow(True)

ax.scatter(xs, ys, s=sizes, color=MUTED, alpha=0.6, edgecolor="none", zorder=3)
highlight = [p for p in points if p[0] in ("zarathustra", "poems-and-dithyrambs", "birth-of-tragedy")]
ax.scatter([p[1] for p in highlight], [p[2] for p in highlight], s=[22 + (p[3] / 1000) * 0.35 for p in highlight],
           color=ACCENT, edgecolor="none", zorder=4)

for key, x, y, _ in points:
    if key not in LABELS:
        continue
    dx, dy = OFFSETS.get(key, (6, 8))
    ax.annotate(LABELS[key], (x, y), textcoords="offset points", xytext=(dx, dy),
                color=INK if key in ("zarathustra", "poems-and-dithyrambs", "birth-of-tragedy") else MUTED,
                fontsize=9.5, ha="center" if dx == 0 else ("left" if dx > 0 else "right"), va="bottom" if dy > 0 else "top",
                path_effects=[pe.withStroke(linewidth=3, foreground=PAPER)])

ax.set_xlim(10, 47)
ax.set_ylim(-1, 31)
ax.set_xlabel("mean sentence length, words", color=MUTED, fontsize=9.5, labelpad=6)
ax.set_ylabel("exclamations per 1,000 words", color=MUTED, fontsize=9.5, labelpad=9)
ax.set_title("Nietzsche's register, one point per work", color=INK, fontsize=11.5, pad=9)

fig.subplots_adjust(left=0.105, right=0.985, top=0.92, bottom=0.14)
fig.savefig("corpus-register-cover.png", facecolor=PAPER)
print("wrote corpus-register-cover.png from", len(points), "works")
