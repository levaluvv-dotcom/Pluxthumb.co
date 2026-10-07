// Общие клиентские поведения сайта. Подключается один раз в Base.astro.
// Компоненты используют их через data-атрибуты:
//   [data-reveal]                — плавное появление при прокрутке (задержка: style="--reveal-delay: 120ms");
//                                  внутри [data-hero] — появляется сразу при загрузке, по очереди
//   a[href^="#"]                 — плавная прокрутка к якорю через Lenis с учётом шапки
//   [data-copy="текст"]          — копирование в буфер + всплывающее «Copied!»
//   [data-count="2000"]          — счётчик, отсчитывает от 0 вместе с появлением блока (суффикс: data-count-suffix="+")
//   [data-marquee]               — бегущая лента; при наведении плавно останавливается
//   [data-marquee-toggle]        — кнопка «пауза» для всех бегущих лент (aria-pressed)
//   события document: 'scroll:lock' / 'scroll:unlock' — остановить/вернуть прокрутку страницы (модалки, меню)
import Lenis from 'lenis';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

// Отступ под шапку задаёт html { scroll-padding-top: var(--header-h) }: его учитывают и Lenis, и scrollIntoView.
export function scrollToTarget(hash: string) {
  if (hash === '#top' || hash === '#') {
    lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    return true;
  }
  const el = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!el) return false;
  if (lenis) lenis.scrollTo(el, { offset: 1 });
  else el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  return true;
}

document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const hash = a.getAttribute('href')!;
  if (!scrollToTarget(hash)) return;
  e.preventDefault();
  if (hash !== '#top') history.replaceState(null, '', hash);
  else history.replaceState(null, '', location.pathname + location.search);
  // Перенести фокус к секции, чтобы следующий Tab шёл с неё, а не с начала страницы
  const target = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (target) {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
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

/* ---------- Счётчики ---------- */
const formatNumber = (n: number) => String(n);
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
    const p = Math.min(1, Math.max(0, (now - start) / duration));
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = formatNumber(Math.round(target * eased)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
// Счётчики внутри появляющегося блока стартуют вместе с его появлением (с учётом задержки)
const startCountersIn = (root: Element) => {
  const delay = parseFloat((root as HTMLElement).style.getPropertyValue('--reveal-delay')) || 0;
  root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => window.setTimeout(() => runCounter(el), delay));
};

/* ---------- Появление при прокрутке ---------- */
const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal]');
const reveal = (el: Element) => {
  el.classList.add('is-in');
  startCountersIn(el);
};
if (reduceMotion || !('IntersectionObserver' in window)) {
  // Счётчики уже отрисованы сервером с итоговыми значениями
  revealEls.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          reveal(entry.target);
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  revealEls.forEach((el) => {
    if (!el.closest('[data-hero]')) io.observe(el);
  });
  // Первый экран появляется по очереди сразу при загрузке, где бы ни были элементы.
  // Двойной rAF: сначала отрисовать скрытое состояние, чтобы переход сыграл.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.querySelectorAll('[data-hero] [data-reveal]').forEach(reveal)),
  );

  // Счётчики вне появляющихся блоков — по собственному наблюдателю
  const orphanCounters = [...document.querySelectorAll<HTMLElement>('[data-count]')].filter(
    (el) => !el.closest('[data-reveal]'),
  );
  if (orphanCounters.length) {
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
    orphanCounters.forEach((el) => cio.observe(el));
  }
}
// Скрипт отработал — запасной вариант в Base.astro (показать всё без анимаций) не нужен
(window as unknown as { __pluxReady?: boolean }).__pluxReady = true;

/* ---------- Копирование + подсказка ---------- */
const toast = document.getElementById('toast');
let toastTimer: number | undefined;
export function showToast(text?: string) {
  if (!toast) return;
  toast.textContent = text || toast.dataset.default || 'Copied!';
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

async function copyText(text: string, from: HTMLElement) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Запасной путь (старые/встроенные браузеры). Поле ставим рядом с кнопкой, чтобы фокус
    // не уходил из виджета (иначе, например, закрывается панель чата), и возвращаем фокус обратно.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.tabIndex = -1;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    (from.parentElement ?? document.body).appendChild(ta);
    ta.focus({ preventScroll: true });
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    from.focus({ preventScroll: true });
    return ok;
  }
}

document.addEventListener('click', async (e) => {
  const el = (e.target as Element).closest<HTMLElement>('[data-copy]');
  if (!el) return;
  e.preventDefault();
  if (await copyText(el.dataset.copy!, el)) {
    showToast(el.dataset.copiedLabel);
    el.classList.add('is-copied');
    window.setTimeout(() => el.classList.remove('is-copied'), 1800);
  }
});

/* ---------- Бегущие ленты ---------- */
// Каждый [data-marquee] содержит [data-marquee-track] с CSS-анимацией translate3d(0 → -50%).
// Наведение мыши или фокус с клавиатуры плавно снижают playbackRate до 0, уход — плавно возвращают к 1.
const tweenIds = new WeakMap<HTMLElement, number>();
const isKeyboardFocus = (el: Element) => {
  try {
    return el.matches(':focus-visible');
  } catch {
    return true;
  }
};

/** Сдвинуть картинку ленты на dx пикселей (dx > 0 — вправо), изменив фазу анимации. */
function shiftTrack(track: HTMLElement, dx: number) {
  const anim = track.getAnimations()[0];
  const timing = anim?.effect?.getTiming();
  const dur = Number(timing?.duration);
  const half = track.offsetWidth / 2; // один набор = один цикл анимации
  if (!anim || !timing || !dur || !half || anim.currentTime == null) return;
  // Лента влево: translateX = -half·p, вправо: translateX = -half·(1 − p)
  const dp = (track.dataset.direction === 'right' ? dx : -dx) / half;
  const delay = Number(timing.delay) || 0; // отрицательная задержка задаёт начальную фазу
  let t = Number(anim.currentTime) + dp * dur;
  while (t + -delay < 0) t += dur; // остаёмся в активной фазе
  anim.currentTime = t;
}

document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((root) => {
  const tracks = [...root.querySelectorAll<HTMLElement>('[data-marquee-track]')];
  let hovered = false;
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
      const p = Math.min(1, Math.max(0, (now - start) / dur));
      const eased = 1 - Math.pow(1 - p, 3);
      anim.updatePlaybackRate(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const keyboardInside = () => {
    const a = document.activeElement;
    return !!a && root.contains(a) && isKeyboardFocus(a);
  };
  const resume = () => {
    if (!hovered && !keyboardInside()) tracks.forEach((t) => tween(t, 1));
  };

  root.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    hovered = true;
    tracks.forEach((t) => tween(t, 0));
  });
  root.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    hovered = false;
    resume();
  });
  root.addEventListener('focusin', (e) => {
    const el = e.target as HTMLElement;
    // Пауза только для фокуса с клавиатуры: после тапа/клика нет pointerleave, лента бы застряла
    if (!isKeyboardFocus(el)) return;
    tracks.forEach((t) => tween(t, 0));
    // Плитка за краем ленты: overflow-hidden нельзя прокрутить в минус, поэтому
    // подвигаем саму анимацию так, чтобы плитка оказалась по центру.
    const track = el.closest<HTMLElement>('[data-marquee-track]');
    if (!track) return;
    normalizeScroll();
    const r = root.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const edge = r.width * 0.08; // ширина затухания по краям
    if (b.left >= r.left + edge && b.right <= r.right - edge) return;
    shiftTrack(track, r.left + r.width / 2 - (b.left + b.width / 2));
  });
  root.addEventListener('focusout', () => {
    // Дождаться, куда ушёл фокус (может остаться внутри ленты)
    requestAnimationFrame(resume);
  });

  // Фокус прокручивает overflow-hidden ленту (scrollLeft ≠ 0) — тогда в конце цикла справа
  // появилась бы пустота. Переводим прокрутку в фазу анимации (картинка не двигается).
  const normalizeScroll = () => {
    const sl = root.scrollLeft;
    if (!sl || reduceMotion) return;
    tracks.forEach((t) => shiftTrack(t, -sl));
    root.scrollLeft = 0;
  };
  root.addEventListener('scroll', normalizeScroll, { passive: true });

  // Не тратить ресурсы на ленты вне экрана
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      for (const entry of entries) root.classList.toggle('is-offscreen', !entry.isIntersecting);
    }).observe(root);
  }
});

// Кнопка паузы для всех бегущих лент (нужна на тач-устройствах, где нет наведения)
document.querySelectorAll<HTMLButtonElement>('[data-marquee-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const paused = document.documentElement.classList.toggle('marquees-paused');
    document
      .querySelectorAll('[data-marquee-toggle]')
      .forEach((b) => b.setAttribute('aria-pressed', String(paused)));
  });
});
