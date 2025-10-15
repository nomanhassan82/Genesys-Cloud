import { LS_STATE_KEY, LS_VERIF_KEY, setCookie, getCookie, hexRand, pkceChallengeFromVerifier } from './util.js';

/**
 * IMPORTANT:
 * - Replace CLIENT_ID with your real Google OAuth 2.0 Web client ID.
 * - REDIRECT_URI must EXACTLY match the one registered in Google Cloud Console.
 *   For GitHub Pages in your repo it’s usually:
 *   https://nomanhassan82.github.io/Genesys-Cloud/oauth-callback.html
 */
const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const REDIRECT_URI = "https://nomanhassan82.github.io/Genesys-Cloud/oauth-callback.html";

const debug = (html) => { document.getElementById('debug').innerHTML = html; };

document.getElementById('signin').addEventListener('click', async () => {
  try {
    // 1) Generate state + PKCE
    const state = hexRand(32);
    const verifier = hexRand(64);
    const challenge = await pkceChallengeFromVerifier(verifier);

    // 2) Persist (localStorage + cookie fallbacks)
    localStorage.setItem(LS_STATE_KEY, state);
    localStorage.setItem(LS_VERIF_KEY, verifier);
    setCookie('oauth_state', state);
    setCookie('pkce_verifier', verifier);

    // 3) Build Google authorize URL
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
      access_type: "offline",
      prompt: "consent"
    });

    const authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    debug(`
      <div>Auth URL built.</div>
      <div>State: <code>${state}</code></div>
      <div>Verifier: <code>${verifier}</code></div>
      <div>Cookie state: <code>${getCookie('oauth_state') || '(none)'}</code></div>
    `);

    // 4) Redirect
    window.location.assign(authorizeUrl);
  } catch (e) {
    alert(`Failed to start OAuth: ${e.message}`);
  }
});

