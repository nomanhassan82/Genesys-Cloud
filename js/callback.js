import { LS_STATE_KEY, LS_VERIF_KEY, getCookie, delCookie } from './util.js';

/**
 * IMPORTANT:
 * - BACKEND_URL must point to your deployed server that exchanges the code with Google.
 *   Example: https://oauth.yourdomain.com/oauth/google/token
 *   (Enable CORS for https://nomanhassan82.github.io)
 */
const BACKEND_URL = "https://<your-backend-domain>/oauth/google/token";

const resultEl = document.getElementById('result');

document.addEventListener('DOMContentLoaded', async () => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const returnedState = url.searchParams.get('state');

  if (error) { resultEl.textContent = `Error: ${error}`; return; }

  const savedState =
    localStorage.getItem(LS_STATE_KEY) ||
    sessionStorage.getItem(LS_STATE_KEY) ||
    getCookie('oauth_state');

  if (!returnedState || !savedState || returnedState !== savedState) {
    resultEl.innerHTML = `
      <strong>Error: Invalid state parameter</strong>
      <div style="text-align:left; margin-top:10px; font-size:.9rem;">
        <div>Returned state: <code>${returnedState || '(none)'}</code></div>
        <div>Saved state: <code>${savedState || '(none)'}</code></div>
        <div>Origin: <code>${location.origin}</code></div>
      </div>`;
    return;
  }

  // Clear state
  localStorage.removeItem(LS_STATE_KEY);
  sessionStorage.removeItem(LS_STATE_KEY);
  delCookie('oauth_state');

  if (!code) { resultEl.textContent = 'Error: No authorization code received'; return; }

  const verifier =
    localStorage.getItem(LS_VERIF_KEY) ||
    sessionStorage.getItem(LS_VERIF_KEY) ||
    getCookie('pkce_verifier');

  localStorage.removeItem(LS_VERIF_KEY);
  sessionStorage.removeItem(LS_VERIF_KEY);
  delCookie('pkce_verifier');

  if (!verifier) { resultEl.textContent = 'Error: Missing PKCE verifier'; return; }

  // Use the actual callback URL you’re on (prevents redirect_uri mismatch)
  const redirect_uri = location.origin + location.pathname;

  resultEl.innerHTML = `<h3>Success!</h3><p>Exchanging code for tokens…</p>`;

  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, code_verifier: verifier, redirect_uri })
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("Backend error:", res.status, text);
      throw new Error(`Token HTTP ${res.status}`);
    }
    const data = JSON.parse(text);
    console.log('Token response:', data);

    resultEl.innerHTML = `
      <h3>Signed in!</h3>
      <p>access_token: <code>${String(data.access_token || '').slice(0,24)}…</code></p>
      <p>id_token present: <code>${Boolean(data.id_token)}</code></p>
    `;
  } catch (err) {
    console.error(err);
    resultEl.textContent = 'Token exchange failed. See console for details.';
  }
});

