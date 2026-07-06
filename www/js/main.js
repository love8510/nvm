import { supabase } from './supabase-client.js';

const GOOGLE_CLIENT_ID = '28947279725-ci9lfn44vbfuakap0861g1scb89g8spl.apps.googleusercontent.com';

// ── DOM refs ─────────────────────────────────────────────────────
const loginView       = document.getElementById('login-view');
const mainView        = document.getElementById('main-view');
const profileName     = document.getElementById('profile-name');
const profileAvatar   = document.getElementById('profile-avatar');
const profileBtn      = document.getElementById('profile-btn');
const profileDropdown = document.getElementById('profile-dropdown');
const hamburger       = document.getElementById('hamburger');
const navMenu         = document.getElementById('nav-menu');
const loginError      = document.getElementById('login-error');

// ── Auth state ───────────────────────────────────────────────────
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    renderMain(session.user);
  } else {
    renderLogin();
  }
});

function renderLogin() {
  mainView.hidden  = true;
  loginView.hidden = false;
  // 로그아웃 후 버튼 재초기화
  const container = document.getElementById('gsi-btn-container');
  if (container) container.removeAttribute('data-rendered');
  onGISReady(initGoogleButton);
}

function renderMain(user) {
  loginView.hidden = true;
  mainView.hidden  = false;
  const meta = user.user_metadata ?? {};
  profileName.textContent = meta.full_name ?? meta.name ?? user.email ?? '';
  if (meta.avatar_url) {
    profileAvatar.src    = meta.avatar_url;
    profileAvatar.hidden = false;
  }
}

// ── Google 로그인 (GIS renderButton + signInWithIdToken) ─────────
function onGISReady(fn) {
  if (window._gisLoaded) { fn(); return; }
  (window._gisCallbacks = window._gisCallbacks || []).push(fn);
}

function initGoogleButton() {
  const container = document.getElementById('gsi-btn-container');
  if (!container || container.dataset.rendered || !window.google?.accounts?.id) return;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: async ({ credential }) => {
      loginError.style.display = 'none';
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
      });
      if (error) {
        loginError.textContent  = '로그인 오류: ' + error.message;
        loginError.style.display = 'block';
      }
    },
    ux_mode: 'popup',
  });

  google.accounts.id.renderButton(container, {
    type: 'standard', shape: 'rectangular', theme: 'outline',
    text: 'signin_with', size: 'large', locale: 'ko', width: 280,
  });

  container.dataset.rendered = '1';
}

onGISReady(initGoogleButton);

// ── 로그아웃 ─────────────────────────────────────────────────────
document.getElementById('btn-logout').addEventListener('click', async () => {
  closeDropdown();
  await supabase.auth.signOut();
});

// ── 프로필 드롭다운 ───────────────────────────────────────────────
profileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = profileDropdown.classList.toggle('open');
  profileBtn.setAttribute('aria-expanded', isOpen);
});

document.addEventListener('click', () => closeDropdown());
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDropdown(); });

function closeDropdown() {
  profileDropdown.classList.remove('open');
  profileBtn.setAttribute('aria-expanded', 'false');
}

// ── 햄버거 메뉴 ───────────────────────────────────────────────────
hamburger.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  hamburger.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
});

navMenu.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => {
    navMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});
