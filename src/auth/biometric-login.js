// ✅ biometric-login.js import { supabase } from '/SmartFinanceAI/src/js/supabase/supabaseClient.js'; import { base64UrlToBuffer } from '/SmartFinanceAI/src/utils/base64.js';

console.log('✅ biometric-login.js loaded');

document.addEventListener('DOMContentLoaded', () => { const bioBtn = document.getElementById('biometric-login'); if (!bioBtn) { console.warn('❌ biometric-login button not found'); return; }

// Always show button for debug purposes bioBtn.style.display = 'block';

bioBtn.addEventListener('click', async () => { console.log('👆 biometric-login button clicked');

const credId = localStorage.getItem('biometric_cred_id');
const email = localStorage.getItem('biometric_user_id');

if (!credId || !email) {
  alert('No biometric credentials found. Please register first.');
  return;
}

try {
  const publicKey = {
    challenge: new Uint8Array(32), // placeholder; in production, should come from server
    allowCredentials: [{
      id: base64UrlToBuffer(credId),
      type: 'public-key',
      transports: ['internal']
    }],
    timeout: 60000,
    userVerification: 'preferred'
  };

  const assertion = await navigator.credentials.get({ publicKey });
  console.log('✅ Biometric assertion success:', assertion);

  // Use magic link login as fallback auth (until we implement full WebAuthn verification)
  const { error } = await supabase.auth.signInWithOtp({ email });

  if (error) {
    console.error('❌ Supabase magic link error:', error);
    alert('Biometric login failed. Try logging in manually.');
    return;
  }

  alert('✅ Face ID login triggered — check your email for the login link.');
} catch (err) {
  console.error('❌ WebAuthn biometric error:', err);
  alert('Biometric login cancelled or failed.');
}

}); });

