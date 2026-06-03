// Horizontal category navigation — arrows only when content overflows

document.addEventListener('DOMContentLoaded', function() {
  const wrap = document.getElementById('categoryNavWrap');
  const track = document.getElementById('categoryNavTrack');
  const prev = document.getElementById('categoryNavPrev');
  const next = document.getElementById('categoryNavNext');

  if (!wrap || !track || !prev || !next) return;

  const scrollAmount = 220;

  function updateArrows() {
    const overflows = track.scrollWidth > wrap.clientWidth + 2;
    prev.classList.toggle('is-hidden', !overflows);
    next.classList.toggle('is-hidden', !overflows);
    wrap.classList.toggle('has-overflow', overflows);
  }

  prev.addEventListener('click', () => {
    wrap.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  next.addEventListener('click', () => {
    wrap.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(updateArrows);
    observer.observe(wrap);
    observer.observe(track);
  }

  window.addEventListener('resize', updateArrows);
  window.addEventListener('load', updateArrows);
  updateArrows();

  const active = track.querySelector('.category-nav-chip.active');
  if (active) {
    active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  if (window.location.hash === '#allCategoriesNav' || window.location.search.includes('explore=categories')) {
    document.getElementById('allCategoriesNav')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
