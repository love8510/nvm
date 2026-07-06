/**
 * auth-guard.js
 * 다른 페이지(assessment.html 등)에 <script type="module" src="./js/auth-guard.js"> 로 추가.
 * 세션이 없으면 index.html로 리다이렉트한다.
 */
import { supabase } from './supabase-client.js';

const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  const root = new URL('./index.html', window.location.href).href;
  window.location.replace(root);
}

export { session };
