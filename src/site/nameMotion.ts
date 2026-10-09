/** Hand-authored pen routes in the bundled font's coordinate system.
 * Each letter has its own stroke order, rather than an expanding silhouette.
 */
export const NAME_STROKES: Record<string, { d: string; start: number; duration: number }[]> = {
  a: [
    { d: 'M95 380Q110 505 270 505Q440 505 440 325L440 40L525 40', start: 0, duration: 270 },
    { d: 'M440 280Q85 285 85 140Q85 28 230 28Q440 28 440 220', start: 120, duration: 260 },
  ],
  m: [
    { d: 'M122 0L122 530', start: 0, duration: 130 },
    { d: 'M122 320Q122 502 288 502Q438 502 438 317L438 0', start: 60, duration: 250 },
    { d: 'M438 320Q438 502 602 502Q755 502 755 317L755 0', start: 185, duration: 260 },
  ],
  i: [
    { d: 'M122 0L122 530', start: 0, duration: 140 },
    { d: 'M122 662L122 664', start: 230, duration: 55 },
  ],
  s: [
    { d: 'M430 375Q410 502 264 502Q108 502 108 380Q108 292 270 260Q432 230 432 142Q432 28 273 28Q100 28 88 170', start: 0, duration: 360 },
  ],
  h: [
    { d: 'M122 0L122 710', start: 0, duration: 150 },
    { d: 'M122 316Q122 505 306 505Q459 505 459 317L459 0', start: 100, duration: 290 },
  ],
  u: [
    { d: 'M122 530L122 210Q122 28 276 28Q453 28 453 214L453 530', start: 0, duration: 330 },
  ],
  r: [
    { d: 'M122 0L122 530', start: 0, duration: 140 },
    { d: 'M122 320Q122 490 284 490L335 490', start: 80, duration: 210 },
  ],
  k: [
    { d: 'M122 0L122 710', start: 0, duration: 150 },
    { d: 'M480 530L122 150', start: 80, duration: 180 },
    { d: 'M280 285L490 0', start: 200, duration: 190 },
  ],
  e: [
    { d: 'M110 276L475 276', start: 0, duration: 150 },
    { d: 'M475 285Q475 502 283 502Q86 502 86 265Q86 28 287 28Q445 28 465 150', start: 80, duration: 320 },
  ],
};

/** Deliberate overlaps: the two words answer each other, rather than march in lockstep. */
export const LETTER_CUES = [0, 1120, 1250, 1500, 1570, 1740, 0, 1220, 1460, 1620, 1850] as const;
