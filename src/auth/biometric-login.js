// biometric-login.js import { supabase } from '../auth/supabase-client.js';

console.log('✅ biometric-login.js loaded');

document.addEventListener('DOMContentLoaded', () => { const bioBtn = document.getElementById('biometric-login'); if (!bioBtn) { console.warn('❌ biometric-login button not found'); return; }

// Show the button regardless (for debugging) bioBtn.style.display = 'block'; console.log('👁️ Showing biometric login button');

bioBtn.addEventListener('click', async () => { console.log('👆 biometric-login button clicked');

const storedId = localStorage.getItem('biometricCredentialId');
const email = localStorage.getItem('biometricEmail');

if (!storedId || !email) {
  alert('No biometric registration found. Please set it up first.');
  return;
}

try {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: new Uint8Array(32),
      allowCredentials: [
        {
          id: Uint8Array.from(atob(storedId), c => c.charCodeAt(0)),
          type: 'public-key'
        }
      ],
      timeout: 60000,
      userVerification: 'preferred'
    }
  });

  console.log('✅ Biometric assertion success:', assertion);

  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) {
    console.error('❌ Supabase magic link error:', error);
    alert('Biometric login failed. Try logging in manually.');
    return;
  }

  alert('✅ Face ID login success — check your email for login link');
} catch (err) {
  console.error('❌ WebAuthn error:', err);
  alert('Biometric login failed or was cancelled.');
}

}); });

