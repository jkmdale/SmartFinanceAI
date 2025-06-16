// src/auth/biometric.js
import { supabase } from '../js/supabase/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const biometricBtn = document.getElementById('biometric-login');
  if (!biometricBtn) return;

  biometricBtn.addEventListener('click', async () => {
    // Prompt user for their email (can be replaced with a saved value)
    const email = prompt('Enter your email to log in with Face ID / Fingerprint:');

    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          flowType: 'passkey' // triggers biometric login using WebAuthn
        }
      });

      if (error) {
        console.error('Biometric login failed:', error.message);
        alert(error.message || 'Biometric login failed.');
        return;
      }

      // Success - redirect to dashboard
      window.location.href = '../dashboard/index.html';
    } catch (err) {
      console.error('Unexpected biometric login error:', err);
      alert('Something went wrong with biometric login.');
    }
  });
});