import { supabase } from './supabase-client.js';

const GOOGLE_CLIENT_ID = '28947279725-ci9lfn44vbfuakap0861g1scb89g8spl.apps.googleusercontent.com';

const isNativeApp = () => !!window.Capacitor?.isNativePlatform?.();

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

  if (isNativeApp()) {
    // 앱: Capacitor SocialLogin 버튼 표시
    document.getElementById('gsi-btn-container').style.display = 'none';
    document.getElementById('btn-native-login').style.display  = 'flex';
  } else {
    // 웹: GIS renderButton
    document.getElementById('btn-native-login').style.display  = 'none';
    document.getElementById('gsi-btn-container').style.display = 'flex';
    const container = document.getElementById('gsi-btn-container');
    if (container) container.removeAttribute('data-rendered');
    onGISReady(initGoogleButton);
  }
}

function renderMain() {
  window.location.href = './app.html';
}

// ── 웹: GIS renderButton + signInWithIdToken ─────────────────────
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
        loginError.textContent   = '로그인 오류: ' + error.message;
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

// ── 앱: Capacitor SocialLogin ────────────────────────────────────
document.getElementById('btn-native-login').addEventListener('click', async () => {
  loginError.style.display = 'none';
  try {
    const SocialLogin = window.Capacitor?.Plugins?.SocialLogin;
    if (!SocialLogin) throw new Error('SocialLogin 플러그인을 찾을 수 없습니다');

    await SocialLogin.initialize({ google: { webClientId: GOOGLE_CLIENT_ID, mode: 'online' } });
    const res = await SocialLogin.login({ provider: 'google' });
    const idToken = res?.result?.idToken ?? res?.result?.authentication?.idToken;
    if (!idToken) throw new Error('ID 토큰을 받지 못했습니다');

    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) throw error;
  } catch (e) {
    loginError.textContent   = '로그인 오류: ' + e.message;
    loginError.style.display = 'block';
  }
});

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

// ── 낙상예방 위험도 추적 드롭다운 ─────────────────────────────────
const fallDrop    = document.getElementById('nav-fall-drop');
const fallDropBtn = fallDrop?.querySelector('.nav-drop-btn');

if (fallDropBtn) {
  fallDropBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = fallDrop.classList.toggle('open');
    fallDropBtn.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', () => {
    fallDrop.classList.remove('open');
    fallDropBtn.setAttribute('aria-expanded', 'false');
  });

  fallDrop.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      fallDrop.classList.remove('open');
      fallDropBtn.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}
