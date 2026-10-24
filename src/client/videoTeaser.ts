/**
 * Drives a looping cover clip: plays it while it is on screen, pauses it when
 * it scrolls away, and leaves it still for anyone who prefers reduced motion.
 *
 * The markup carries no autoplay attribute, because that fires before the
 * motion preference can be read. Playback starts here or not at all, which also
 * means the pause control ships hidden and is revealed once this runs.
 */
const PLAY_LABEL = 'Play animation';
export const PAUSE_LABEL = 'Pause animation';
/** Enough of the clip on screen to be worth playing. */
const VISIBLE_RATIO = 0.1;

export function initVideoTeaser(root: HTMLElement): void {
  const video = root.querySelector<HTMLVideoElement>('[data-video-teaser]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-teaser-toggle]');
  if (!video || !toggle) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  let visible = false;

  toggle.hidden = false;

  // The button is icon-only, so aria-label carries the whole accessible name
  // and names the action. data-playing picks which glyph the stylesheet shows;
  // it is not aria-pressed, which on top of a changing label reads as nonsense.
  const sync = (): void => {
    toggle.setAttribute('aria-label', video.paused ? PLAY_LABEL : PAUSE_LABEL);
    toggle.dataset.playing = String(!video.paused);
  };

  // play() rejects when the browser refuses autoplay, iOS low-power mode being
  // the usual cause. Resyncing keeps the label honest about what happened.
  const play = (): void => {
    void video.play().catch(sync);
  };

  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);

  toggle.addEventListener('click', () => {
    userPaused = !video.paused;
    if (video.paused) play();
    else video.pause();
  });

  // Play once enough of the clip is on screen, but only stop when nothing of it
  // is left. Pausing at the same 10% boundary makes the two states flap while a
  // thumb rests near it, and every restart is a frame the element may have to
  // paint from scratch.
  new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      visible = entry.isIntersecting;
      if (!entry.isIntersecting) video.pause();
      else if (entry.intersectionRatio >= VISIBLE_RATIO && !reducedMotion.matches && !userPaused) play();
    },
    { threshold: [0, VISIBLE_RATIO] },
  ).observe(video);

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) video.pause();
    else if (visible && !userPaused) play();
  });

  sync();
}
