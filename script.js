const body = document.body;
let currentLanguage = 'en';
const header = document.querySelector('.header');
const burger = document.querySelector('.burger');
const menu = document.querySelector('.menu');
const menuClose = document.querySelector('.menu__close');
const menuShade = document.querySelector('.menu-shade');

function setMenu(open) {
  if (!menu || menu.classList.contains('active') === open) return;
  menu.inert = !open;
  body.classList.toggle('menu-open', open);
  menu?.classList.toggle('active', open);
  if (open) menuClose?.focus();
  else if (menu.contains(document.activeElement)) burger?.focus();
  menu?.setAttribute('aria-hidden', String(!open));
  burger?.setAttribute('aria-expanded', String(open));
  burger?.setAttribute('aria-label', languageCopy[currentLanguage][open ? 'closeMenu' : 'openMenu']);
}

burger?.addEventListener('click', () => setMenu(!menu?.classList.contains('active')));
menuClose?.addEventListener('click', () => setMenu(false));
menuShade?.addEventListener('click', () => setMenu(false));
document.querySelectorAll('.menu a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setMenu(false);
    setReviewModal(false);
  }
  if (event.key !== 'Tab') return;
  const panel = reviewModal?.classList.contains('active') ? reviewModal
    : menu?.classList.contains('active') ? menu : null;
  if (!panel) return;
  const controls = [...panel.querySelectorAll('a[href], button, input, textarea, select, [tabindex="0"]')]
    .filter((element) => !element.disabled && !element.hidden && element.getClientRects().length);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (!first) return;
  if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
});

function updateHeader() {
  const fixed = window.scrollY > 20;
  if (header && header.classList.contains('fixed') !== fixed) header.classList.toggle('fixed', fixed);
}
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('reveal-pending');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -40px', threshold: 0.01 });
  document.querySelectorAll('.reveal').forEach((item) => {
    item.classList.add('reveal-pending');
    observer.observe(item);
  });
}

document.querySelectorAll('.faq__item').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.faq__item[open]').forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

const track = document.querySelector('.reviews__track');
const dots = document.querySelector('.reviews__dots');
const prev = document.querySelector('.slider-button--prev');
const next = document.querySelector('.slider-button--next');
const reviewModal = document.querySelector('#reviewModal');
const reviewForm = document.querySelector('.review-form');
const reviewFormStatus = document.querySelector('.review-form__status');
const reviewSubmit = document.querySelector('.review-form__submit');
const reviewPhotoInput = document.querySelector('.review-form__photo-input');
const reviewPhotoImage = document.querySelector('.review-form__photo-image');
const reviewPhotoPlus = document.querySelector('.review-form__photo-plus');
const reviewPhotoRemove = document.querySelector('.review-form__photo-remove');
const legacyReviewStorageKey = 'aitidev-visitor-reviews';
const reviewStorageKey = 'aitidev-visitor-reviews-v2';
let cards = [...document.querySelectorAll('.review-card')];
let slide = 0;
let lastReviewFocus = null;
let reviewFeedbackKey = null;
let pendingReviewPhoto = '';
let photoSelectionId = 0;
let photoProcessing = false;
let reviewSubmitting = false;

const reviewFeedback = {
  invalid: {
    ru: 'Заполните все поля. Текст отзыва должен содержать не меньше 20 символов.',
    en: 'Please complete every field. The review must contain at least 20 characters.'
  },
  saved: {
    ru: 'Спасибо! Ваш отзыв добавлен.',
    en: 'Thank you! Your review has been added.'
  },
  session: {
    ru: 'Отзыв добавлен на время этой сессии.',
    en: 'The review has been added for this session.'
  },
  photoProcessing: {
    ru: 'Подготавливаем фото…',
    en: 'Preparing your photo…'
  },
  photoTooLarge: {
    ru: 'Выберите фото размером до 10 МБ.',
    en: 'Please choose a photo smaller than 10 MB.'
  },
  photoInvalid: {
    ru: 'Не удалось открыть фото. Выберите другое изображение.',
    en: 'This photo could not be opened. Please choose another image.'
  }
};

function showReviewFeedback(key) {
  reviewFeedbackKey = key;
  if (reviewFormStatus) reviewFormStatus.textContent = reviewFeedback[key]?.[currentLanguage] ?? '';
}

try {
  localStorage.removeItem(legacyReviewStorageKey);
} catch (error) {
  // The site still works when local storage is unavailable.
}

function createReviewId() {
  return window.crypto?.randomUUID?.() ?? `review-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getSavedReviews() {
  try {
    const raw = localStorage.getItem(reviewStorageKey) || '[]';
    if (raw.length > 3500000) return [];
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];
    let needsMigration = false;
    const reviews = saved.slice(-20).filter((item) => isValidReview(item))
      .map((item) => {
        const hasId = typeof item.id === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(item.id);
        if (!hasId) needsMigration = true;
        return {
          id: hasId ? item.id : createReviewId(),
          name: item.name.trim(), role: item.role.trim(), company: item.company.trim(),
          review: item.review.trim(), photo: isSavedReviewPhoto(item.photo) ? item.photo : ''
        };
      });
    if (needsMigration) {
      try {
        localStorage.setItem(reviewStorageKey, JSON.stringify(reviews));
      } catch (error) {
        // Reviews remain available in this session even if migration cannot be saved.
      }
    }
    return reviews;
  } catch (error) {
    return [];
  }
}

function isValidReview(review) {
  if (!review || typeof review !== 'object') return false;
  const limits = { name: 60, role: 80, company: 80, review: 800 };
  return Object.entries(limits).every(([key, limit]) => typeof review[key] === 'string'
    && review[key].trim().length > 0 && review[key].length <= limit)
    && review.review.trim().length >= 20;
}

let savedReviews = getSavedReviews();

function saveReview(review) {
  if (!isValidReview(review)) return false;
  try {
    const next = [...savedReviews, review].slice(-20);
    localStorage.setItem(reviewStorageKey, JSON.stringify(next));
    savedReviews = next;
    return true;
  } catch (error) {
    return false;
  }
}

function deleteReview(reviewId, card) {
  const english = currentLanguage === 'en';
  if (!window.confirm(english ? 'Delete your review? This cannot be undone.' : 'Удалить ваш отзыв? Это действие нельзя отменить.')) return;

  if (savedReviews.some((review) => review.id === reviewId)) {
    const next = savedReviews.filter((review) => review.id !== reviewId);
    try {
      localStorage.setItem(reviewStorageKey, JSON.stringify(next));
      savedReviews = next;
    } catch (error) {
      window.alert(english ? 'Could not delete the review. Please try again.' : 'Не удалось удалить отзыв. Попробуйте ещё раз.');
      return;
    }
  }

  const removedIndex = cards.indexOf(card);
  card.remove();
  rebuildReviewDots();
  goToSlide(removedIndex < slide ? slide - 1 : Math.min(slide, cards.length - 1));
}

function getInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function getAvatarHue(name) {
  return [...name].reduce((value, character) => value + character.charCodeAt(0), 0) % 280 + 20;
}

function isSavedReviewPhoto(photo) {
  return typeof photo === 'string'
    && photo.length < 160000
    && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo);
}

function appendReviewCard(review) {
  if (!track) return;

  const card = document.createElement('article');
  card.className = 'review-card review-card--visitor';

  let avatar;
  if (isSavedReviewPhoto(review.photo)) {
    avatar = document.createElement('img');
    avatar.className = 'review-card__avatar';
    avatar.src = review.photo;
    avatar.alt = review.name;
    avatar.loading = 'lazy';
    avatar.decoding = 'async';
  } else {
    avatar = document.createElement('div');
    avatar.className = 'review-card__avatar review-card__avatar--initials';
    avatar.style.setProperty('--avatar-hue', String(getAvatarHue(review.name)));
    avatar.textContent = getInitials(review.name);
    avatar.setAttribute('aria-hidden', 'true');
  }

  const identity = document.createElement('div');
  const name = document.createElement('h3');
  const meta = document.createElement('span');
  meta.className = 'review-card__meta';
  name.textContent = review.name;
  meta.textContent = `${review.role} · ${review.company}`;
  identity.append(name, meta);

  const quote = document.createElement('b');
  quote.textContent = '“';
  quote.setAttribute('aria-hidden', 'true');

  const text = document.createElement('p');
  text.textContent = review.review;
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'review-card__delete';
  deleteButton.dataset.ruText = 'Удалить мой отзыв';
  deleteButton.dataset.enText = 'Delete my review';
  deleteButton.textContent = deleteButton.dataset[`${currentLanguage}Text`];
  deleteButton.addEventListener('click', () => deleteReview(review.id, card));
  card.append(avatar, identity, quote, text, deleteButton);
  track.append(card);
}

function rebuildReviewDots() {
  cards = [...document.querySelectorAll('.review-card')];
  dots?.replaceChildren();
  const label = document.documentElement.lang === 'en' ? 'Show review' : 'Показать отзыв';

  cards.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `${label} ${index + 1}`);
    dot.addEventListener('click', () => goToSlide(index));
    dots?.append(dot);
  });
}

function goToSlide(index) {
  if (!track || !cards.length) return;
  slide = (index + cards.length) % cards.length;
  const cardWidth = cards[0].getBoundingClientRect().width;
  const gap = parseFloat(getComputedStyle(cards[0]).marginRight) || 0;
  track.style.transform = `translateX(-${slide * (cardWidth + gap)}px)`;
  dots?.querySelectorAll('button').forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === slide));
  const activeDot = dots?.querySelector('button.active');
  if (activeDot && dots) {
    dots.scrollLeft = activeDot.offsetLeft - dots.offsetLeft - (dots.clientWidth - activeDot.clientWidth) / 2;
  }
}

prev?.addEventListener('click', () => goToSlide(slide - 1));
next?.addEventListener('click', () => goToSlide(slide + 1));
let reviewResizeFrame = 0;
window.addEventListener('resize', () => {
  if (reviewResizeFrame) return;
  reviewResizeFrame = requestAnimationFrame(() => {
    reviewResizeFrame = 0;
    goToSlide(slide);
  });
});
savedReviews.forEach(appendReviewCard);
rebuildReviewDots();
goToSlide(0);

let reviewTouchStart = null;
track?.addEventListener('touchstart', (event) => {
  reviewTouchStart = event.touches.length === 1
    ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
}, { passive: true });
track?.addEventListener('touchend', (event) => {
  if (!reviewTouchStart || !event.changedTouches.length) return;
  const distance = event.changedTouches[0].clientX - reviewTouchStart.x;
  const verticalDistance = event.changedTouches[0].clientY - reviewTouchStart.y;
  reviewTouchStart = null;
  if (Math.abs(distance) > 45 && Math.abs(distance) > Math.abs(verticalDistance)) {
    goToSlide(slide + (distance < 0 ? 1 : -1));
  }
}, { passive: true });
track?.addEventListener('touchcancel', () => { reviewTouchStart = null; }, { passive: true });

function clearReviewPhoto() {
  photoSelectionId += 1;
  photoProcessing = false;
  pendingReviewPhoto = '';
  if (reviewPhotoInput) reviewPhotoInput.value = '';
  if (reviewPhotoImage) {
    reviewPhotoImage.hidden = true;
    reviewPhotoImage.removeAttribute('src');
  }
  if (reviewPhotoPlus) reviewPhotoPlus.hidden = false;
  if (reviewPhotoRemove) reviewPhotoRemove.hidden = true;
  if (reviewSubmit) reviewSubmit.disabled = reviewSubmitting;
}

function resizeReviewPhoto(file) {
  return new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const image = new Image();
    const releaseSource = () => URL.revokeObjectURL(source);

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context || !image.naturalWidth || !image.naturalHeight) throw new Error('Invalid image');
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        const left = (image.naturalWidth - side) / 2;
        const top = (image.naturalHeight - side) / 2;
        let photo = '';

        for (const [size, quality] of [[256, 0.78], [192, 0.68], [160, 0.58]]) {
          canvas.width = size;
          canvas.height = size;
          context.fillStyle = '#fff';
          context.fillRect(0, 0, size, size);
          context.drawImage(image, left, top, side, side, 0, 0, size, size);
          photo = canvas.toDataURL('image/jpeg', quality);
          if (isSavedReviewPhoto(photo)) break;
        }

        if (!isSavedReviewPhoto(photo)) throw new Error('Image too large');
        resolve(photo);
      } catch (error) {
        reject(error);
      } finally {
        releaseSource();
      }
    };
    image.onerror = () => {
      releaseSource();
      reject(new Error('Image could not be loaded'));
    };
    image.src = source;
  });
}

reviewPhotoInput?.addEventListener('change', async () => {
  if (reviewSubmitting) return;
  const file = reviewPhotoInput.files?.[0];
  if (!file) return;
  clearReviewPhoto();
  const selectionId = photoSelectionId;

  if (file.size > 10 * 1024 * 1024) {
    showReviewFeedback('photoTooLarge');
    return;
  }
  if (file.type && !file.type.startsWith('image/')) {
    showReviewFeedback('photoInvalid');
    return;
  }

  photoProcessing = true;
  reviewSubmit.disabled = true;
  showReviewFeedback('photoProcessing');
  try {
    const photo = await resizeReviewPhoto(file);
    if (selectionId !== photoSelectionId) return;
    pendingReviewPhoto = photo;
    reviewPhotoImage.src = photo;
    reviewPhotoImage.hidden = false;
    reviewPhotoPlus.hidden = true;
    reviewPhotoRemove.hidden = false;
    reviewFeedbackKey = null;
    reviewFormStatus.textContent = '';
  } catch (error) {
    if (selectionId === photoSelectionId) showReviewFeedback('photoInvalid');
  } finally {
    if (selectionId === photoSelectionId) {
      photoProcessing = false;
      reviewSubmit.disabled = false;
    }
  }
});

reviewPhotoRemove?.addEventListener('click', () => {
  if (reviewSubmitting) return;
  clearReviewPhoto();
  reviewFeedbackKey = null;
  reviewFormStatus.textContent = '';
});

function setReviewModal(open) {
  if (!reviewModal || reviewModal.classList.contains('active') === open) return;
  reviewModal.inert = !open;
  reviewModal.classList.toggle('active', open);
  body.classList.toggle('review-modal-open', open);

  if (open) {
    lastReviewFocus = document.activeElement;
    reviewFeedbackKey = null;
    reviewFormStatus.textContent = '';
    requestAnimationFrame(() => {
      if (reviewModal.classList.contains('active')) reviewForm?.querySelector('input')?.focus();
    });
  } else if (lastReviewFocus instanceof HTMLElement) {
    lastReviewFocus.focus();
  }
  reviewModal.setAttribute('aria-hidden', String(!open));
}

document.querySelector('[data-review-open]')?.addEventListener('click', () => setReviewModal(true));
document.querySelector('[data-review-close]')?.addEventListener('click', () => setReviewModal(false));
reviewModal?.addEventListener('click', (event) => {
  if (event.target === reviewModal) setReviewModal(false);
});

reviewForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (reviewSubmitting) return;
  if (photoProcessing) {
    showReviewFeedback('photoProcessing');
    return;
  }
  const submittedForm = event.currentTarget;
  const formData = new FormData(submittedForm);
  const review = {
    id: createReviewId(),
    name: String(formData.get('name') || '').trim(),
    role: String(formData.get('role') || '').trim(),
    company: String(formData.get('company') || '').trim(),
    review: String(formData.get('review') || '').trim(),
    photo: pendingReviewPhoto
  };
  if (!isValidReview(review)) {
    showReviewFeedback('invalid');
    return;
  }

  const persisted = saveReview(review);
  appendReviewCard(review);
  rebuildReviewDots();
  goToSlide(cards.length - 1);
  reviewSubmitting = true;
  reviewSubmit.disabled = true;
  showReviewFeedback(persisted ? 'saved' : 'session');

  window.setTimeout(() => {
    submittedForm.reset();
    reviewSubmitting = false;
    clearReviewPhoto();
    setReviewModal(false);
  }, 700);
});

document.querySelector('[data-year]').textContent = new Date().getFullYear();

function registerText(selector, englishValues) {
  document.querySelectorAll(selector).forEach((element, index) => {
    element.dataset.ruText = element.textContent.trim();
    element.dataset.enText = englishValues[index] ?? englishValues[0] ?? element.textContent.trim();
  });
}

function registerHtml(selector, englishValues) {
  document.querySelectorAll(selector).forEach((element, index) => {
    element.dataset.ruHtml = element.innerHTML;
    element.dataset.enHtml = englishValues[index] ?? englishValues[0] ?? element.innerHTML;
  });
}

function registerAttribute(selector, attribute, englishValues, russianValues = []) {
  document.querySelectorAll(selector).forEach((element, index) => {
    element.setAttribute(`data-ru-${attribute}`, russianValues[index] ?? element.getAttribute(attribute) ?? '');
    element.setAttribute(`data-en-${attribute}`, englishValues[index] ?? englishValues[0] ?? '');
  });
}

registerText('.menu__nav a', [
  'Services', 'Portfolio', 'About me', 'Skills', 'Experience', 'Important details', 'FAQ', 'Reviews', 'Contacts'
]);
registerText('.menu__contacts > span', ['Contact me']);
registerAttribute('.menu__brand', 'aria-label', ['AITIDEV — home']);
registerAttribute('.header-language-group', 'aria-label', ['Choose language'], ['Выбор языка']);
registerHtml('.intro__title', ['IT.<br>Development.<br>Solutions.']);
registerText('.statistics__item p', [
  'Completed portfolio projects',
  'Development areas in my skill set',
  'Skills and technologies in my toolkit'
]);
registerText('.round-button span', ['Portfolio']);
registerText('.intro__down', ['Down ↓']);

registerText('#services .section-title', ['#services']);
registerText('.service__text h3', [
  'Mobile app development',
  'Website design',
  'Website development',
  'Admin panel development',
  'Template-based websites',
  'UX/UI website audit',
  'Website administration'
]);
registerText('.service__text p', [
  'Development of modern mobile applications for iOS and Android with an intuitive interface, API integrations and publishing.',
  'Competitor research, sitemap, content preparation, prototype, visual concept and responsive design for desktop, tablet and mobile.',
  'Responsive development with HTML, CSS and JavaScript, library integration, domain and hosting setup, and website deployment.',
  'Easy management of pages, text, images and products without coding, plus clear instructions for everyday use.',
  'WordPress template selection and setup, content population and training for independent website management.',
  'A review of design, usability and marketing logic with clear explanations of issues and practical recommendations.',
  'Publishing pages and articles, updating content, managing catalogues, technical improvements and ongoing support.'
]);
registerText('.service__price', ['Negotiable', 'from $200', 'from $100', 'from $100', 'from $100', 'from $100', 'from $60/mo.']);

registerText('.cta__title', [
  "Let's discuss your project, timeline and budget.",
  'Have an idea for a project?'
]);
registerHtml('.cta__buttons a', [
  '<span class="cta__icon">TG</span>Telegram',
  '<span class="cta__icon">WA</span>WhatsApp',
  '<span class="cta__icon">→</span>Discuss the project'
]);

registerText('#portfolio .section-title', ['#portfolio']);
registerText('.project-live', ['OPEN PROJECT', 'OPEN PROJECT', 'OPEN PROJECT']);
registerText('.project__info h3', ['PLANES — Project Management', 'Denta.Land — Dental Clinic Management', 'VANTA DRIVE — Luxury Car Rental']);
registerText('.project__skills-label', ['Skills used', 'Skills used', 'Skills used']);
registerAttribute('.project', 'aria-label', ['Open the PLANES project', 'Open the Denta.Land project', 'Open the VANTA DRIVE project']);
registerAttribute('.project-cover', 'alt', ['PLANES project cover', 'Denta.Land project cover', 'VANTA DRIVE project cover']);

registerText('#about .section-title', ['#about me']);
registerHtml('.about__content h3', ['Welcome!<br>My name is <span>Aitenir.</span>']);
registerText('.about__description p', [
  'I am Aitenir, an IT specialist, programmer and freelancer from Bishkek, Kyrgyzstan. I build websites, web applications, server-side solutions, mobile applications, bots and automation solutions.',
  'I work as an IT specialist and system administrator at AUTOCOM JAPAN INC. Alongside this role, I develop frontend and backend solutions, build APIs and collaborate with a team on commercial projects.'
]);
registerText('.about__links > span', ['Contact me:']);
registerAttribute('.about__photo img', 'alt', ['Aitenir — AITIDEV IT specialist']);

registerText('#skills .section-title', ['#skills']);
registerHtml('.skills__lead h3', ['From idea and algorithm<br>to a finished product.']);
registerText('.skills__lead > p:last-child', [
  'Web, backend, mobile apps, integrations and automation — technology is selected to fit the task, not the other way around.'
]);
registerText('.skill-direction p', [
  'Responsive interfaces, landing pages, online stores and modern web applications.',
  'Server-side logic, databases, REST APIs, admin panels, modules and external integrations.',
  'Cross-platform and native mobile applications, as well as game development.',
  'Bots, chatbots, scripts, process automation, integrations, optimization and bug fixing.'
]);

const skillTranslations = {
  'Автоматизация процессов': 'Process automation',
  'Адаптивная верстка': 'Responsive layout',
  'Анализ кода': 'Code analysis',
  'Верстка блоков': 'UI block development',
  'Верстка лендингов': 'Landing page development',
  'Верстка сайтов': 'Website development',
  'Верстка страниц': 'Web page development',
  'Доработка сайтов': 'Website improvements',
  'Интеграция API': 'API integration',
  'Интеграция верстки': 'Frontend integration',
  'Интеграция платежных систем': 'Payment system integration',
  'Написание скриптов': 'Script development',
  'Оптимизация кода': 'Code optimization',
  'Разработка API': 'API development',
  'Разработка алгоритмов': 'Algorithm development',
  'Разработка бэкенда': 'Backend development',
  'Разработка игр': 'Game development',
  'Разработка мобильных приложений': 'Mobile app development',
  'Разработка модулей': 'Module development',
  'Разработка программ': 'Software development',
  'Разработка фронтенда': 'Frontend development',
  'Создание ботов': 'Bot development',
  'Создание веб-приложений': 'Web app development',
  'Создание интернет-магазинов': 'E-commerce development',
  'Создание калькуляторов': 'Calculator development',
  'Создание одностраничных сайтов': 'Single-page websites',
  'Создание чат-ботов': 'Chatbot development',
  'Устранение ошибок': 'Bug fixing',
  'Командная работа': 'Teamwork',
  'Коммуникабельность': 'Communication',
  'Ориентированность на результат': 'Results-oriented',
  'Внимание к деталям': 'Attention to detail',
  'Ответственность': 'Responsibility',
  'Обучаемость': 'Fast learner',
  'Битрикс24': 'Bitrix24'
};

document.querySelectorAll('.skill-tools span').forEach((element) => {
  if (element.textContent.trim() !== 'Битрикс24') return;
  element.dataset.ruText = 'Битрикс24';
  element.dataset.enText = 'Bitrix24';
});

document.querySelectorAll('.skills-cloud span').forEach((element) => {
  const russian = element.textContent.trim();
  element.dataset.ruText = russian;
  element.dataset.enText = skillTranslations[russian] ?? russian;
});
registerAttribute('.skills-cloud', 'aria-label', ["Aitenir's skills"]);

registerText('#experience .section-title', ['#experience']);
registerText('#experience .important-card h3', [
  'AUTOCOM JAPAN INC. — System Administrator / IT Specialist',
  'Frontend — Polytechnic',
  'Geeks Pro',
  'Education — OshTU'
]);
registerText('#experience .important-card p', [
  'I work as a system administrator and IT specialist, supporting users, internal systems and stable technical processes.',
  'I worked as a junior frontend developer at Kyrgyz State Technical University, focusing on layout, responsiveness, optimization, testing and bug fixing.',
  'I gained commercial development experience and helped build the Kyrgyz Techwomen foundation website as a junior team lead.',
  'I graduated from Osh Technological College in 2023. I am earning a bachelor’s degree in Information Systems and Technologies at Osh Technological University, graduating in 2026, and completed the Frontend course at Geeks IT Academy in 2025.'
]);

registerText('#important .section-title', ['#important details']);
registerText('#important .important-card h3', [
  'I require a deposit',
  'Deposit refund policy',
  'Changes after approval cost extra',
  'The client completes a brief'
]);
registerText('#important .important-card p', [
  'I start work after receiving a 50% deposit. The exception is ongoing work with legal entities after a contract has been signed.',
  'The deposit reserves dedicated project time. If the client ends the project, it is non-refundable. If the project is not completed due to my fault, the deposit is refunded in full.',
  'The project is divided into stages: prototype, design, development and integration. Revisions are unlimited until a stage is approved; changes after approval are billed separately.',
  'The brief helps me understand the client’s goals, tasks and preferences. Completing it speeds up development and reduces the number of revisions.'
]);

registerText('#faq .section-title', ['#faq']);
registerText('.faq__item summary strong', [
  'What kinds of projects do you work with?',
  'How does payment work?',
  'What do you need from me to get started?',
  'Can I update the content later?',
  'Can you help with a domain and hosting?',
  'Can you help with website copy?',
  'How long does development take?'
]);
registerText('.faq__item > p', [
  'I develop landing pages, corporate websites, online stores, web applications, admin panels and mobile applications. I also provide frontend and backend development, API and payment integration, bot development and process automation. Before starting, I review the task and recommend the most suitable implementation approach.',
  'Payment can be made through mobile banking services such as Sberbank Online or Tinkoff, or by bank transfer for legal entities. You can also pay by transfer to a Visa card, BTC or USDT.',
  'I need a project overview, its goals, target audience, examples you like and a completed brief. If you already have a logo, brand colours, copy, images, a domain or hosting, please provide them as well. If the materials are not ready yet, I will help you determine what needs to be prepared.',
  'Yes. I can connect a user-friendly CMS or develop an admin panel so you can update text, images, pages and products without editing code. After launch, I provide clear instructions and can offer ongoing website administration if needed.',
  'Yes. I can help select a domain and hosting plan, configure DNS and SSL, and deploy the finished website. The domain and hosting are registered in the client’s name and paid separately and directly to the selected provider.',
  'Yes. I can help structure the pages, edit supplied materials and prepare basic copy using information about your business. Full copywriting, large volumes of content or translation are estimated separately.',
  'A template-based website takes about 5 days. Website design takes at least 10 days, frontend development at least 5 days, and CMS integration at least 3 days.'
]);

registerText('#reviews .section-title', ['#reviews']);
registerText('.review-card--sample h3', ['Kurmanjan', 'Timur', 'Aksana']);
registerText('.review-card--sample .review-card__meta', [
  'Project Manager · PLANES · sample review',
  'Clinic Administrator · Denta.Land · sample review',
  'Service Manager · VANTA DRIVE · sample review'
]);
registerText('.review-card--sample p', [
  'Aitenir quickly understood the PLANES requirements, suggested a clear structure and always stayed in touch. The project is polished, fast and easy to use, and every stage was completed within the agreed timeline.',
  'The Denta.Land project ran smoothly and transparently from prototype to launch. I especially appreciated the attention to detail, convenient interfaces and clear guidance on managing the platform afterwards.',
  'VANTA DRIVE received a modern website that perfectly conveys the project’s premium style. Aitenir listened to our requests, helped with technical questions and delivered a finished site.'
]);
registerAttribute('.review-card--sample img.review-card__avatar', 'alt', [
  'Portrait of Kurmanjan',
  'Portrait of Timur',
  'Portrait of Aksana'
]);
registerText('.review-add-button__label', ['Leave a review']);
registerText('.review-modal__eyebrow', ['New review']);
registerText('#reviewModalTitle', ['Tell us about your experience']);
registerText('.review-modal__intro', ['Complete the fields and, if you like, add a photo. Your review will appear here after submission.']);
registerText('.review-form label > span', ['Name', 'Role', 'Company', 'Review']);
registerText('.review-form__photo-title', ['Profile photo (optional)']);
registerText('.review-form__photo-hint', ['Choose a photo from your device · up to 10 MB']);
registerText('.review-form__photo-remove', ['Remove']);
registerAttribute('.review-form input:not([type="file"])', 'placeholder', ['Your name', 'For example, Project Manager', 'Company name']);
registerAttribute('.review-form textarea', 'placeholder', ['Tell us about the task, the process and the result']);
registerText('.review-form__submit-label', ['Submit review']);
registerText('.review-form__note', ['Your review and photo are saved only in this browser and can be deleted here.']);
registerAttribute('.reviews__dots', 'aria-label', ['Review navigation']);

registerHtml('.footer__left h2', ['I would love<br>to work<br>with you.']);
registerText('.footer__meta a', ['Back to top ↑']);
registerText('.contact-form label > span', ['Your name', 'Your contact', 'Service', 'Tell me about the project']);
registerAttribute('.contact-form input', 'placeholder', ['How should I address you?', 'Telegram / WhatsApp']);
registerAttribute('.contact-form textarea', 'placeholder', ['Briefly describe your task']);
registerText('.contact-form option', [
  'Website design',
  'Website development',
  'Admin panel development',
  'Template-based website',
  'UX/UI audit',
  'Website administration',
  'Another IT task'
]);
registerHtml('.contact-form button', ['Send via Telegram <span>↗</span>']);
registerText('.contact-form small', ['Telegram will open a chat with @AitiDev and a prepared enquiry message.']);

const languageCopy = {
  ru: {
    title: 'AITIDEV — Айтенир, программист и IT-фрилансер',
    description: 'AITIDEV — портфолио Айтенира, IT-специалиста, программиста и фрилансера.',
    headerLabel: 'Шапка сайта',
    navLabel: 'Основное меню',
    openMenu: 'Открыть меню',
    closeMenu: 'Закрыть меню',
    previousReview: 'Предыдущий отзыв',
    nextReview: 'Следующий отзыв',
    review: 'Показать отзыв',
    closeReview: 'Закрыть окно',
    formStatus: 'Заявка сформирована. Отправьте готовое сообщение в открывшемся чате Telegram.'
  },
  en: {
    title: 'AITIDEV — Aitenir, Programmer & IT Freelancer',
    description: 'AITIDEV — portfolio of Aitenir, an IT specialist, programmer and freelancer.',
    headerLabel: 'Website header',
    navLabel: 'Main navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    previousReview: 'Previous review',
    nextReview: 'Next review',
    review: 'Show review',
    closeReview: 'Close dialog',
    formStatus: 'Your enquiry is ready. Send the prepared message in the Telegram chat that just opened.'
  }
};

// Ignore an older saved RU preference so existing visitors also see the new English default.
const languageStorageKey = 'aitidev-language-v2';
try {
  const savedLanguage = localStorage.getItem(languageStorageKey);
  currentLanguage = savedLanguage === 'ru' || savedLanguage === 'en' ? savedLanguage : 'en';
} catch (error) {
  currentLanguage = 'en';
}

function applyLanguage(language) {
  currentLanguage = language === 'en' ? 'en' : 'ru';
  const copy = languageCopy[currentLanguage];

  document.documentElement.lang = currentLanguage;
  document.title = copy.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', copy.description);

  document.querySelectorAll('[data-ru-text]').forEach((element) => {
    element.textContent = element.dataset[`${currentLanguage}Text`];
  });
  document.querySelectorAll('[data-ru-html]').forEach((element) => {
    element.innerHTML = element.dataset[`${currentLanguage}Html`];
  });
  ['placeholder', 'alt', 'aria-label'].forEach((attribute) => {
    document.querySelectorAll(`[data-ru-${attribute}]`).forEach((element) => {
      element.setAttribute(attribute, element.getAttribute(`data-${currentLanguage}-${attribute}`) ?? '');
    });
  });

  document.querySelector('.header')?.setAttribute('aria-label', copy.headerLabel);
  document.querySelector('.menu__nav')?.setAttribute('aria-label', copy.navLabel);
  burger?.setAttribute('aria-label', menu?.classList.contains('active') ? copy.closeMenu : copy.openMenu);
  menuClose?.setAttribute('aria-label', copy.closeMenu);
  prev?.setAttribute('aria-label', copy.previousReview);
  next?.setAttribute('aria-label', copy.nextReview);
  document.querySelector('[data-review-close]')?.setAttribute('aria-label', copy.closeReview);
  dots?.querySelectorAll('button').forEach((dot, index) => dot.setAttribute('aria-label', `${copy.review} ${index + 1}`));

  document.querySelectorAll('[data-lang]').forEach((button) => {
    const active = button.dataset.lang === currentLanguage;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  const status = document.querySelector('.form-status');
  if (status?.textContent.trim()) status.textContent = copy.formStatus;
  if (reviewFeedbackKey) showReviewFeedback(reviewFeedbackKey);

  try {
    localStorage.setItem(languageStorageKey, currentLanguage);
  } catch (error) {
    // The site still works when local storage is unavailable.
  }
}

document.querySelectorAll('[data-lang]').forEach((button) => {
  button.addEventListener('click', () => applyLanguage(button.dataset.lang));
});

applyLanguage(currentLanguage);

document.querySelector('.contact-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const name = String(formData.get('name') ?? '').trim();
  const contact = String(formData.get('contact') ?? '').trim();
  const service = String(formData.get('service') ?? '').trim();
  const details = String(formData.get('message') ?? '').trim();
  const message = currentLanguage === 'en'
    ? `New enquiry from AITIDEV website\n\nName: ${name}\nContact: ${contact}\nService: ${service}\nProject details: ${details || 'Not provided'}`
    : `Новая заявка с сайта AITIDEV\n\nИмя: ${name}\nКонтакт: ${contact}\nУслуга: ${service}\nО проекте: ${details || 'Не указано'}`;
  const telegramUrl = `https://t.me/AitiDev?text=${encodeURIComponent(message)}`;
  const telegramLink = document.createElement('a');
  telegramLink.href = telegramUrl;
  telegramLink.target = '_blank';
  telegramLink.rel = 'noopener noreferrer';
  telegramLink.click();
  const status = event.currentTarget.querySelector('.form-status');
  status.textContent = languageCopy[currentLanguage].formStatus;
});
