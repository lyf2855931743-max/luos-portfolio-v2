(() => {
  'use strict';
  const stage = document.querySelector('.intro-stage');
  const surface = document.querySelector('.work-surface');
  const hero = document.querySelector('.hero');
  const main = document.querySelector('main');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let queued = 0;
  let lastCovered = false;
  let height = 1, scrolled = 0, target = 0, current = 0, lastTime = 0;

  function sinkProgress(progress) {
    // The slowest point is one third of the actual displacement, reached
    // after 55% of the scroll runway. Both phases share the same low slope.
    const pivot = .55, distance = 1 / 3, slowest = .06;
    if (progress <= pivot) {
      const initial = 2 * distance / pivot - slowest;
      return initial * progress + (slowest - initial) * progress * progress / (2 * pivot);
    }
    const remaining = progress - pivot, span = 1 - pivot;
    return distance + slowest * remaining
      + (1 - distance - slowest * span) * (remaining / span) ** 2;
  }

  function update(time) {
    queued = 0;
    const dt = Math.min(64, Math.max(0, time - lastTime));
    lastTime = time;
    // Frame-rate independent damping, without bounce or wheel interception.
    current += (target - current) * (1 - Math.exp(-dt / 130));
    if (motion.matches || document.hidden || Math.abs(target - current) < .0001) current = target;
    // Gentle initial rise, increasing speed as the black surface moves up.
    const rise = motion.matches ? current : .2 * current + .8 * current * current;
    // Compensate normal document scrolling using untransformed main geometry.
    // Reading the transformed surface here would create a feedback loop.
    const offset = motion.matches ? 0 : (target - rise) * height;
    surface.style.transform = Math.abs(offset) < .01 ? 'none' : `translate3d(0,${offset}px,0)`;
    const top = height - scrolled + offset;
    const coverage = Math.max(0, Math.min(1, (height - top) / height));
    stage.style.setProperty('--sink', `${motion.matches ? 0 : sinkProgress(current) * height * .10}px`);
    stage.style.setProperty('--intro-opacity', String(1 - Math.min(1, coverage * 1.8)));
    const covered = top <= 0;
    if (covered !== lastCovered) {
      lastCovered = covered;
      stage.inert = covered;
      hero.dispatchEvent(new CustomEvent('hero-occlusion', {detail: {covered}}));
    }
    // Update cursor state even when the pointer is still during damped scrolling.
    document.dispatchEvent(new CustomEvent('portfolio-transition', {detail: {surfaceTop: top}}));
    if (current !== target && !document.hidden) queued = requestAnimationFrame(update);
  }
  function schedule() {
    height = Math.max(1, stage.offsetHeight);
    scrolled = Math.max(0, -main.getBoundingClientRect().top);
    target = Math.max(0, Math.min(1, scrolled / height));
    if (!queued) {
      lastTime = performance.now();
      queued = requestAnimationFrame(update);
    }
  }
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule);
  addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  new ResizeObserver(schedule).observe(stage);
  schedule();
})();
