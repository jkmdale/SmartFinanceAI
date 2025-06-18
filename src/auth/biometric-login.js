// biometric-login.js import { supabase } from '../auth/supabase-client.js';

const biometricLoginButton = document.getElementById('biometric-login');

// Check for WebAuthn support const supportsWebAuthn = window.PublicKeyCredential !== undefined;

biometricLoginButton.style.display = supportsWebAuthn ? 'block' : 'none';

biometricLoginButton.addEventListener('click', async () => { try { const storedCredentialId = localStorage.getItem('biometricCredentialId'); if (!storedCredentialId) { alert('No biometric login set up on this device.'); return; }

const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: Uint8Array.from(window.crypto.getRandomValues(new Uint8Array(32))),
    allowCredentials: [
      {
        id: Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0)),
        type: 'public-key',
      },
    ],
    timeout: 60000,
    userVerification: 'preferred',
  },
});

// Decode assertion and authenticate user
// NOTE: This step normally verifies signature server-side
// For demo: assume valid and call Supabase magic link or session
const email = localStorage.getItem('biometricEmail');
if (!email) {
  alert('Stored email missing. Please log in manually once and enable biometrics again.');
  return;
}

const { error } = await supabase.auth.signInWithOtp({ email });
if (error) {
  alert('Biometric login failed. Try regular login.');
  return;
}

alert('✅ Login link sent. Check your email to complete login.');

} catch (err) { console.error('Biometric login error:', err); alert('Something went wrong with biometric login.'); } });

