import { supabase } from './supabase-client.js';

// ── DOM refs ────────────────────────────────────────────────────
const loginView       = document.getElementById('login-view');
const mainView        = document.getElementById('main-view');
const profileName     = document.getElementById('profile-name');
const profileAvatar   = document.getElementById('profile-avatar');
const profileBtn      = document.getElementById('profile-btn');
const profileDropdown = document.getElementById('profile-dropdown');
const hamburger       = document.getElementById('hamburger');
const navMenu         = document.getElementById('nav-menu');

// ── Auth state ──────────────────────────────────────────────────
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

// ── Google 로그인 ────────────────────────────────────────────────
document.getElementById('btn-google-login').addEventListener('click', async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    },
  });
});

// ── 로그아웃 ────────────────────────────────────────────────────
document.getElementById('btn-logout').addEventListener('click', async () => {
  closeDropdown();
  await supabase.auth.signOut();
});

// ── 프로필 드롭다운 ─────────────────────────────────────────────
profileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = profileDropdown.classList.toggle('open');
  profileBtn.setAttribute('aria-expanded', isOpen);
});

document.addEventListener('click', (e) => {
  if (!profileBtn.contains(e.target)) closeDropdown();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDropdown();
});

function closeDropdown() {
  profileDropdown.classList.remove('open');
  profileBtn.setAttribute('aria-expanded', 'false');
}

// ── 햄버거 메뉴 (모바일) ────────────────────────────────────────
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
