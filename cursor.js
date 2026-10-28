(() => {
  'use strict';
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const surface = document.querySelector('.work-surface');
  const wordmark = document.querySelector('.hero h1');
  const cursor = document.createElement('div');
  cursor.className = 'portfolio-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  const dot = document.createElement('span');
  dot.className = 'portfolio-cursor-dot';
  dot.innerHTML = '<svg class="portfolio-cursor-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  cursor.append(dot);
  document.body.append(cursor);
  let x = 0, y = 0, present = false, small = false;

  function hide() {
    present = false;
    cursor.classList.remove('is-visible');
    root.classList.remove('custom-cursor-active');
  }

  function refresh(surfaceTop = surface.getBoundingClientRect().top) {
    if (!finePointer.matches || document.hidden || document.fullscreenElement) {
      hide();
      return;
    }
    // Modal dialogs live in the top layer; move the cursor into the active one.
    const dialogs = [...document.querySelectorAll('dialog[open]')];
    const dialog = dialogs[dialogs.length - 1];
    const host = dialog || document.body;
    if (cursor.parentElement !== host) host.append(cursor);
    const wordBottom = wordmark.getBoundingClientRect().bottom;
    const touching = surfaceTop <= wordBottom + (small ? 6 : 0);
    if (small !== touching) {
      small = touching;
      cursor.classList.toggle('is-small', small);
    }
    // Color follows the region beneath the pointer, not just scroll position.
    cursor.classList.toggle('is-dark-region', !!dialog || y >= surfaceTop);
    const overWordmark = !dialog && y < surfaceTop && !!wordmark.containsInkAt?.(x, y);
    cursor.classList.toggle('is-over-wordmark', overWordmark);
    const overVideo = present && document.elementFromPoint(x, y)?.closest('video');
    const visible = present && !overVideo;
    cursor.classList.toggle('is-visible', visible);
    root.classList.toggle('custom-cursor-active', visible);
  }

  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !finePointer.matches) { hide(); return; }
    x = event.clientX; y = event.clientY; present = true;
    cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
    refresh();
  }, {passive: true});
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) hide(); });
  addEventListener('blur', hide);
  addEventListener('resize', () => refresh());
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  document.addEventListener('fullscreenchange', () => refresh());
  document.addEventListener('portfolio-transition', event => refresh(event.detail.surfaceTop));
  finePointer.addEventListener('change', () => { hide(); refresh(); });
  const dialogObserver = new MutationObserver(() => refresh());
  document.querySelectorAll('dialog').forEach(dialog => {
    dialogObserver.observe(dialog, {attributes: true, attributeFilter: ['open']});
    dialog.addEventListener('scroll', () => refresh(), {passive: true});
  });
  refresh();
})();
