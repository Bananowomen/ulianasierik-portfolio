'use strict';

const menu = document.getElementById('menu-toggle');
const nav = document.getElementById('navigation');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
});
nav?.addEventListener('click', event => {
  if (event.target.closest('a')) {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav?.classList.contains('open')) {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.focus();
  }
});

const form = document.getElementById('brief-form');
const draft = document.getElementById('message-draft');
const status = document.getElementById('form-status');
const copy = JSON.parse(document.getElementById('form-copy').textContent);
form?.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const url = data.get('url').trim();
  const goal = data.get('problem').trim();
  const email = data.get('email').trim();
  const phone = data.get('phone').trim();
  const contactLine = phone ? `\nKontakt: ${email}, ${phone}` : `\nKontakt: ${email}`;
  draft.value = `Dobrý deň, posielam vám stránku našej služby.\n${url}\n\n${goal}\n${contactLine}\n\nČo by ste na stránke upravili ako prvé?`;
  document.getElementById('draft-result').hidden = false;
  status.textContent = copy.draftReady;
  draft.focus();
});
document.getElementById('copy-draft')?.addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(draft.value);
    status.textContent = copy.copySuccess;
  } catch {
    draft.focus();
    draft.select();
    status.textContent = copy.copyFallback;
  }
});
