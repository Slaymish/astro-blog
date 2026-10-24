"""Cover for conversational-timing-lab, plotted from the committed run output.

Every number below is copied from results/e0_ami_full.txt (commit e46e7a1) in
Slaymish/conversational-timing-lab. Nothing is modelled or invented.

Top panel: the pause to turn-end rate lookup the E0c baseline learned, which runs
backwards. Bottom panel: the false-interruption rate of the three E0 baselines
next to the 5% interruption budget the lab reports against.

Run: ~/.hermes/tools/python-3.14.*/bin/python3 turn-timing-cover.py
"""

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

PAPER = "#fdfdfb"
INK = "#10130f"
MUTED = "#545c52"
LINE = "#e0e3d9"
ACCENT = "#b4442a"

# results/e0_ami_full.txt: "P(turn ended | silence so far): 100ms -> 0.633  300ms -> 0.589  500ms -> 0.543  1000ms -> 0.435"
SILENCE_MS = [100, 300, 500, 1000]
P_TURN_ENDED = [0.633, 0.589, 0.543, 0.435]
BASE_RATE = 0.561

# results/e0_ami_full.txt, FIR at the F1-optimal threshold
BASELINES = ["majority\nclass", "pause shorter\nthan 300 ms", "pause to rate\nlookup"]
FIR = [1.000, 0.531, 0.781]
BUDGET = 0.05

fig, (ax1, ax2) = plt.subplots(
    2, 1, figsize=(8, 4.5), dpi=200, gridspec_kw={"height_ratios": [1, 1], "hspace": 0.62}
)
fig.patch.set_facecolor(PAPER)

for ax in (ax1, ax2):
    ax.set_facecolor(PAPER)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color(LINE)
    ax.tick_params(colors=MUTED, labelsize=8.5, length=0)
    ax.set_axisbelow(True)

# --- top panel: the learned conditional -------------------------------------------------
ax1.axhline(BASE_RATE, color=MUTED, linewidth=0.9, linestyle=(0, (4, 4)), zorder=1)
ax1.plot(SILENCE_MS, P_TURN_ENDED, color=ACCENT, linewidth=2.2, zorder=3)
ax1.scatter(SILENCE_MS, P_TURN_ENDED, s=42, color=ACCENT, zorder=4)
for x, y in zip(SILENCE_MS, P_TURN_ENDED):
    ax1.annotate(f"{y:.3f}", (x, y), textcoords="offset points", xytext=(0, 9),
                 ha="center", color=INK, fontsize=8.5)
ax1.annotate("base rate 0.561", xy=(1035, BASE_RATE), xytext=(1035, BASE_RATE + 0.021),
             color=MUTED, fontsize=8, ha="right", va="bottom",
             bbox={"boxstyle": "round,pad=0.22", "fc": PAPER, "ec": "none"})
ax1.set_xlim(20, 1080)
ax1.set_ylim(0.41, 0.67)
ax1.set_xticks(SILENCE_MS)
ax1.set_xticklabels([f"{v} ms" for v in SILENCE_MS])
ax1.set_yticks([0.45, 0.50, 0.55, 0.60, 0.65])
ax1.set_xlabel("silence heard so far", color=MUTED, fontsize=8.5, labelpad=6)
ax1.set_ylabel("P(turn ended)", color=MUTED, fontsize=8.5, labelpad=8)
ax1.set_title("Turn-end probability by silence so far", color=INK, fontsize=10.5, pad=8)
ax1.grid(axis="y", color=LINE, linewidth=0.7, zorder=0)

# --- bottom panel: false interruption rate against the budget ---------------------------
bars = ax2.bar(range(len(FIR)), FIR, width=0.52, color=MUTED, zorder=3)
ax2.set_xlim(-0.62, len(FIR) - 0.38)
bars[1].set_color(ACCENT)
for i, v in enumerate(FIR):
    ax2.annotate(f"{v:.3f}", (i, v), textcoords="offset points", xytext=(0, 4),
                 ha="center", color=INK, fontsize=8.5)
ax2.axhline(BUDGET, color=ACCENT, linewidth=1.2, linestyle=(0, (4, 4)), zorder=4)
ax2.annotate("5% budget", xy=(-0.42, BUDGET), xytext=(-0.42, BUDGET + 0.045),
             color=ACCENT, fontsize=8, ha="left", va="bottom",
             bbox={"boxstyle": "round,pad=0.22", "fc": PAPER, "ec": "none"})
ax2.set_xticks(range(len(FIR)))
ax2.set_xticklabels(BASELINES, fontsize=8.5)
ax2.set_ylim(0, 1.15)
ax2.set_yticks([0, 0.25, 0.50, 0.75, 1.00])
ax2.set_ylabel("false interruption rate", color=MUTED, fontsize=8.5, labelpad=8)
ax2.set_title("E0 baselines at their best threshold, against the 5% budget",
              color=INK, fontsize=10.5, pad=8)
ax2.grid(axis="y", color=LINE, linewidth=0.7, zorder=0)

fig.subplots_adjust(left=0.105, right=0.985, top=0.935, bottom=0.125)
fig.savefig("turn-timing-cover.png", facecolor=PAPER)
print("wrote turn-timing-cover.png")
