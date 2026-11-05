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

const FORM_RECIPIENTS = ['sale@lando-import.ru', 'info@lando-import.ru'];
const form = document.querySelector('#request-form');

function copy(ru, en) {
  return isEnglish ? en : ru;
}

function setNote(current, type, message) {
  const note = current.querySelector('.form-note');
  if (!note) return;
  note.className = type ? `form-note is-${type}` : 'form-note';
  note.textContent = message;
}

function openMailClient(payload) {
  const lines = [
    payload.source,
    '',
    `${isEnglish ? 'Name' : 'Имя'}: ${payload.name}`,
    `${isEnglish ? 'Phone' : 'Телефон'}: ${payload.phone}`
  ];
  if (payload.email) lines.push(`Email: ${payload.email}`);
  if (payload.route) lines.push(`${isEnglish ? 'Route' : 'Маршрут'}: ${payload.route}`);
  if (payload.page) lines.push(`${isEnglish ? 'Page' : 'Страница'}: ${payload.page}`);

  const href = `mailto:${FORM_RECIPIENTS[0]}?cc=${encodeURIComponent(FORM_RECIPIENTS[1])}&subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  const link = document.createElement('a');
  link.href = href;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function sendSubmission(payload) {
  openMailClient(payload);
}

function bindForm(current, buildPayload) {
  if (!current) return;
  current.addEventListener('submit', async event => {
    event.preventDefault();
    if (!current.checkValidity()) {
      setNote(current, 'error', copy('Заполните, пожалуйста, все поля формы.', 'Please complete all form fields.'));
      current.reportValidity();
      return;
    }

    const payload = buildPayload(new FormData(current));
    if (payload.company_url) {
      setNote(current, 'success', copy('Спасибо! Мы свяжемся с вами.', 'Thank you! We will get in touch shortly.'));
      current.reset();
      return;
    }

    const button = current.querySelector('[type="submit"]');
    if (button) button.disabled = true;
    setNote(current, 'pending', copy('Открываем письмо…', 'Opening your email app…'));
    try {
      await sendSubmission(payload);
      setNote(current, 'success', copy(
        'Проверьте почтовую программу и нажмите «Отправить» — заявка уйдёт на sale@lando-import.ru и info@lando-import.ru.',
        'Check your email app and send the message — it will go to sale@lando-import.ru and info@lando-import.ru.'
      ));
      current.reset();
    } catch {
      setNote(current, 'error', copy(
        'Не удалось открыть почтовую программу. Напишите на sale@lando-import.ru или info@lando-import.ru.',
        'Could not open your email app. Please write to sale@lando-import.ru or info@lando-import.ru.'
      ));
    } finally {
      if (button) button.disabled = false;
    }
  });
}

bindForm(form, data => ({
  source: isEnglish ? 'Route calculation request' : 'Заявка на расчёт маршрута',
  name: String(data.get('name') || '').trim(),
  phone: String(data.get('phone') || '').trim(),
  route: String(data.get('route') || '').trim(),
  company_url: String(data.get('company_url') || '').trim(),
  page: window.location.href,
  _subject: isEnglish ? 'Lando Import: route calculation request' : 'Ландо Импорт: заявка на расчёт маршрута'
}));

bindForm(document.querySelector('#consult-form'), data => ({
  source: isEnglish ? 'Consultation request' : 'Форма консультации',
  name: String(data.get('consult-name') || '').trim(),
  email: String(data.get('consult-email') || '').trim(),
  phone: String(data.get('consult-phone') || '').trim(),
  company_url: String(data.get('company_url') || '').trim(),
  page: window.location.href,
  _subject: isEnglish ? 'Lando Import: consultation request' : 'Ландо Импорт: заявка на консультацию'
}));

document.querySelectorAll('[data-delivery]').forEach(button => button.addEventListener('click', () => {
  const route = form?.querySelector('[name="route"]');
  if (route) route.value = isEnglish ? `Shipping method: ${button.dataset.delivery}. ` : `Вид доставки: ${button.dataset.delivery}. `;
  scrollToAnchor('#request');
}));

const backToTop = document.querySelector('.back-to-top');
function updateBackToTop() {
  backToTop?.classList.toggle('is-visible', window.scrollY > 600);
}
window.addEventListener('scroll', updateBackToTop, { passive: true });
backToTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
});
updateBackToTop();
