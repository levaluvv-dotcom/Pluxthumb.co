// Общие клиентские поведения сайта. Подключается один раз в Base.astro.
// Компоненты используют их через data-атрибуты:
//   [data-reveal]                — плавное появление при прокрутке (задержка: style="--reveal-delay: 120ms")
//   a[href^="#"]                 — плавная прокрутка к якорю через Lenis с учётом шапки
//   [data-copy="текст"]          — копирование в буфер + всплывающее «Copied!»
//   [data-count="2000"]          — счётчик, отсчитывает от 0 при появлении (суффикс: data-count-suffix="+")
//   [data-marquee]               — бегущая лента; при наведении плавно останавливается (см. marquee.css)
//   события document: 'scroll:lock' / 'scroll:unlock' — остановить/вернуть прокрутку страницы (модалки, меню)
import Lenis from 'lenis';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js');

/* ---------- Плавный скролл ---------- */
let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), wheelMultiplier: 1 });
  const raf = (time: number) => {
    lenis!.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}
(window as unknown as { lenis: Lenis | null }).lenis = lenis;

const headerOffset = () => {
  const h = getComputedStyle(document.documentElement).getPropertyValue('--header-h');
  return -(parseFloat(h) || 72) + 1;
};

export function scrollToTarget(hash: string) {
  if (hash === '#top' || hash === '#') {
    lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    return true;
  }
  const el = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!el) return false;
  if (lenis) lenis.scrollTo(el, { offset: headerOffset() });
  else el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  return true;
}

document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
  const hash = a.getAttribute('href')!;
  if (scrollToTarget(hash)) {
    e.preventDefault();
    if (hash !== '#top') history.replaceState(null, '', hash);
    else history.replaceState(null, '', location.pathname + location.search);
  }
});

// Пришли по ссылке с якорем (например, после переключения языка) — докрутить к секции
window.addEventListener('load', () => {
  if (location.hash.length > 1) setTimeout(() => scrollToTarget(location.hash), 60);
});

let locks = 0;
document.addEventListener('scroll:lock', () => {
  if (locks++ === 0) {
    lenis?.stop();
    document.documentElement.style.overflow = 'hidden';
  }
});
document.addEventListener('scroll:unlock', () => {
  if (locks > 0 && --locks === 0) {
    lenis?.start();
    document.documentElement.style.overflow = '';
  }
});

/* ---------- Появление при прокрутке ---------- */
const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  revealEls.forEach((el) => io.observe(el));
}

/* ---------- Счётчики ---------- */
const formatNumber = (n: number) => String(n);
const counters = document.querySelectorAll<HTMLElement>('[data-count]');
const runCounter = (el: HTMLElement) => {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.countSuffix ?? '';
  if (reduceMotion) {
    el.textContent = formatNumber(target) + suffix;
    return;
  }
  const duration = 1600 + Math.min(target, 2000) * 0.2;
  const start = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = formatNumber(Math.round(target * eased)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
if ('IntersectionObserver' in window) {
  const cio = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          runCounter(entry.target as HTMLElement);
          cio.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.5 },
  );
  counters.forEach((el) => cio.observe(el));
} else counters.forEach(runCounter);

/* ---------- Копирование + подсказка ---------- */
const toast = document.getElementById('toast');
let toastTimer: number | undefined;
export function showToast(text?: string) {
  if (!toast) return;
  if (text) toast.textContent = text;
  else toast.textContent = toast.dataset.default ?? 'Copied!';
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

document.addEventListener('click', async (e) => {
  const el = (e.target as Element).closest<HTMLElement>('[data-copy]');
  if (!el) return;
  e.preventDefault();
  if (await copyText(el.dataset.copy!)) {
    showToast(el.dataset.copiedLabel);
    el.classList.add('is-copied');
    window.setTimeout(() => el.classList.remove('is-copied'), 1800);
  }
});

/* ---------- Бегущие ленты: плавная остановка при наведении ---------- */
// Каждый [data-marquee] содержит [data-marquee-track] с CSS-анимацией.
// Наведение плавно снижает playbackRate до 0, уход — плавно возвращает к 1.
const tweenIds = new WeakMap<HTMLElement, number>();
document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((root) => {
  const tracks = root.querySelectorAll<HTMLElement>('[data-marquee-track]');
  const hoverTarget = root.dataset.marqueeHover === 'track' ? null : root;
  const tween = (track: HTMLElement, to: number) => {
    const anim = track.getAnimations()[0];
    if (!anim) return;
    const from = anim.playbackRate;
    const start = performance.now();
    const dur = 650;
    const id = (tweenIds.get(track) ?? 0) + 1;
    tweenIds.set(track, id);
    const step = (now: number) => {
      if (tweenIds.get(track) !== id) return;
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      anim.updatePlaybackRate(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const bind = (target: HTMLElement, list: Iterable<HTMLElement>) => {
    target.addEventListener('pointerenter', (e) => {
      if ((e as PointerEvent).pointerType === 'mouse') for (const t of list) tween(t, 0);
    });
    target.addEventListener('pointerleave', (e) => {
      if ((e as PointerEvent).pointerType === 'mouse') for (const t of list) tween(t, 1);
    });
    target.addEventListener('focusin', () => {
      for (const t of list) tween(t, 0);
    });
    target.addEventListener('focusout', () => {
      for (const t of list) tween(t, 1);
    });
  };
  if (hoverTarget) bind(hoverTarget, tracks);
  else tracks.forEach((t) => bind(t, [t]));

  // Не тратить ресурсы на ленты вне экрана
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      for (const entry of entries) root.classList.toggle('is-offscreen', !entry.isIntersecting);
    }).observe(root);
  }
});
