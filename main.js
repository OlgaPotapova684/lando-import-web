const button = document.querySelector('.menu-button');
const nav = document.querySelector('.nav');
const headerContent = document.querySelector('.header__content');
const isEnglish = document.documentElement.lang === 'en';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
button?.addEventListener('click', () => {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  headerContent?.classList.toggle('is-open');
});
document.querySelectorAll('.nav a').forEach(link => link.addEventListener('click', () => {
  headerContent?.classList.remove('is-open');
  button?.setAttribute('aria-expanded', 'false');
}));
document.querySelector('.header__cta')?.addEventListener('click', () => {
  headerContent?.classList.remove('is-open');
  button?.setAttribute('aria-expanded', 'false');
});

function scrollToAnchor(anchor, updateHistory = true) {
  const target = document.querySelector(anchor);
  if (!target) return false;

  const headerHeight = document.querySelector('.header')?.offsetHeight ?? 0;
  const heading = target.matches('section') ? target.querySelector('h2') ?? target : target;
  const top = anchor === '#top'
    ? 0
    : window.scrollY + heading.getBoundingClientRect().top - headerHeight - 24;

  window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  if (updateHistory && window.location.hash !== anchor) window.history.pushState(null, '', anchor);
  return true;
}

document.querySelectorAll('.header a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const anchor = link.getAttribute('href');
  if (anchor && scrollToAnchor(anchor)) event.preventDefault();
}));

const slides = [...document.querySelectorAll('.hero__slide')];
const dots = [...document.querySelectorAll('.hero__dots button')];
const number = document.querySelector('.hero__number');
let activeSlide = 0;
let sliderTimer;

function heroImageSet(src) {
  const jpg = src.replace(/\.png$/i, '.jpg');
  const webp = jpg.replace(/\.jpe?g$/i, '.webp');
  return `image-set(url("${webp}") type("image/webp"), url("${jpg}") type("image/jpeg"))`;
}

function ensureHeroImage(slide) {
  if (!slide || slide.dataset.heroReady === '1') return;
  const src = slide.dataset.heroImage;
  const wide = slide.dataset.heroImageWide || src;
  if (!src) return;
  slide.style.setProperty('--hero-image', heroImageSet(src));
  slide.style.setProperty('--hero-image-wide', heroImageSet(wide));
  slide.dataset.heroReady = '1';
}

function showSlide(index, userInitiated = false) {
  activeSlide = (index + slides.length) % slides.length;
  ensureHeroImage(slides[activeSlide]);
  ensureHeroImage(slides[(activeSlide + 1) % slides.length]);
  slides.forEach((slide, i) => {
    const active = i === activeSlide;
    slide.classList.toggle('is-active', active);
    slide.setAttribute('aria-hidden', String(!active));
    slide.querySelectorAll('a').forEach(link => link.tabIndex = active ? 0 : -1);
  });
  dots.forEach((dot, i) => {
    const active = i === activeSlide;
    dot.classList.toggle('is-active', active);
    dot.setAttribute('aria-selected', String(active));
  });
  if (number) number.innerHTML = `${String(activeSlide + 1).padStart(2, '0')} <i>/ ${String(slides.length).padStart(2, '0')}</i>`;
  if (userInitiated) startSlider();
}
function stopSlider() { window.clearInterval(sliderTimer); }
function startSlider() {
  stopSlider();
  if (!reduceMotion.matches) sliderTimer = window.setInterval(() => showSlide(activeSlide + 1), 4000);
}
dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i, true)));
document.querySelector('.hero__arrow--prev')?.addEventListener('click', () => showSlide(activeSlide - 1, true));
document.querySelector('.hero__arrow--next')?.addEventListener('click', () => showSlide(activeSlide + 1, true));
reduceMotion.addEventListener('change', startSlider);
ensureHeroImage(slides[0]);
ensureHeroImage(slides[1]);
startSlider();

const form = document.querySelector('#request-form');
form?.addEventListener('submit', event => {
  event.preventDefault();
  const note = form.querySelector('.form-note');
  if (!form.checkValidity()) {
    note.textContent = isEnglish ? 'Please complete all form fields.' : 'Заполните, пожалуйста, все поля формы.';
    note.className = 'form-note is-error';
    form.reportValidity();
    return;
  }
  note.textContent = isEnglish ? 'Thank you! We will get in touch shortly.' : 'Спасибо! Мы свяжемся с вами.';
  note.className = 'form-note is-success';
  form.reset();
});

document.querySelectorAll('[data-delivery]').forEach(button => button.addEventListener('click', () => {
  const route = form?.querySelector('[name="route"]');
  if (route) route.value = isEnglish ? `Shipping method: ${button.dataset.delivery}. ` : `Вид доставки: ${button.dataset.delivery}. `;
  scrollToAnchor('#request');
}));

document.querySelector('#consult-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const current = event.currentTarget;
  if (!current.checkValidity()) return current.reportValidity();
  current.reset();
  current.insertAdjacentHTML('beforeend', `<small class="form-note is-success">${isEnglish ? 'Thank you! We will get in touch shortly.' : 'Спасибо! Мы свяжемся с вами.'}</small>`);
});

const backToTop = document.querySelector('.back-to-top');
function updateBackToTop() {
  backToTop?.classList.toggle('is-visible', window.scrollY > 600);
}
window.addEventListener('scroll', updateBackToTop, { passive: true });
backToTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
});
updateBackToTop();
