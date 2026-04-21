const body = document.body;
const navToggle = document.querySelector('[data-nav-toggle]');
const navDrawer = document.querySelector('[data-nav-drawer]');
const cookieBanner = document.querySelector('[data-cookie-banner]');
const cookieAccept = document.querySelector('[data-cookie-accept]');

if (navToggle && navDrawer) {
  navToggle.addEventListener('click', () => {
    body.classList.toggle('nav-open');
  });
}

document.querySelectorAll('[data-faq-trigger]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('[data-faq-item]');
    if (!item) return;
    item.classList.toggle('open');
  });
});

document.querySelectorAll('[data-code-tabs]').forEach((wrapper) => {
  const buttons = wrapper.querySelectorAll('[data-code-tab]');
  const panels = wrapper.querySelectorAll('[data-code-panel]');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-code-tab');

      buttons.forEach((candidate) => {
        candidate.classList.toggle('active', candidate === button);
      });

      panels.forEach((panel) => {
        panel.classList.toggle('active', panel.getAttribute('data-code-panel') === target);
      });
    });
  });
});

if (cookieBanner && cookieAccept) {
  const cookieKey = 'inwitclipps-cookie-accepted';
  const accepted = window.localStorage.getItem(cookieKey);

  if (accepted === 'true') {
    cookieBanner.classList.add('is-hidden');
  }

  cookieAccept.addEventListener('click', () => {
    window.localStorage.setItem(cookieKey, 'true');
    cookieBanner.classList.add('is-hidden');
  });
}
