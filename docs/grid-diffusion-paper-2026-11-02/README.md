# Grid Diffusion AD paper, 2026-11-02

The master's report, staged as a `report` document so it renders at
`/reports/grid-diffusion-anomaly-detection` in the site's PDF viewer, and linked
from the `Grid Diffusion AD` work story as an artifact.

## Where the PDF came from

`report/main.pdf` in the private repo `Slaymish/grid-diffusion-ad`, fetched with the
GitHub API on 2026-11-02. 95 pages, A4, 963KB, compiled 2026-02-08 from
`report/main.tex`. `main-10jan-annotated.pdf` and `main-13jan-annotated.pdf` in the
same folder are working drafts and were not used.

Title as printed on the title page: *Anomaly (Out-of-Distribution) Detection for
Electrical Distribution Networks using Discrete Diffusion Methods*. Supervisors
Dr. Bastiaan Kleijn and Dr. Fiona Stevens McFadden.

## Order of operations

1. `node publish-paper.mjs --check`, then with the token,
   `SANITY_WRITE_ACK=1 node publish-paper.mjs --write`.
2. `cd ../positioning-2026-11-02 && node publish-copy.mjs --check`, then
   `SANITY_WRITE_ACK=1 node publish-copy.mjs --write`.

The second one carries the story patch that sets `artifacts` to reference the new
report, which is what puts a "From this project" section on the story page. It
references `report-grid-diffusion-anomaly-detection` by id, so step 1 has to land
first.

## Copy decisions

The description and body use the paper's own numbers rather than softening them:
AUROC 0.548 and PR-AUC 0.336 against a prevalence of 0.279, reconstruction 0.515
and 0.347, and thresholds calibrated to a false-alarm budget still producing alert
rates nobody would run. That is what the abstract says, and it is the more
interesting story than a claim of a working detector.
