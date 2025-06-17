// src/auth/biometric-setup.js
import { supabase } from '../js/supabase/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('biometric-setup-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = form.email.value.trim();

    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          flowType: 'passkey', // 🔐 WebAuthn biometric registration
        }
      });

      if (error) {
        alert(error.message || 'Biometric registration failed.');
        return;
      }

      alert('✅ Biometric authentication registered successfully!');
      window.location.href = 'login.html';
    } catch (err) {
      console.error('Unexpected biometric setup error:', err);
      alert('Something went wrong with biometric setup.');
    }
  });
});