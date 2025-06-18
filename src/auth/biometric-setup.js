// ✅ biometric-setup.js import { base64urlEncode } from '/SmartFinanceAI/src/utils/base64.js';

console.log('✅ biometric-setup.js loaded');

document.addEventListener('DOMContentLoaded', () => { const form = document.getElementById('biometric-setup-form'); if (!form) return;

form.addEventListener('submit', async (e) => { e.preventDefault();

const email = form.email.value.trim();
if (!email) return alert('Please enter a valid email.');

try {
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: new Uint8Array(32),
      rp: { name: 'SmartFinanceAI' },
      user: {
        id: new TextEncoder().encode(email),
        name: email,
        displayName: email
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: { userVerification: 'preferred' },
      timeout: 60000,
      attestation: 'direct'
    }
  });

  const id = credential.rawId;
  const idBase64 = base64urlEncode(id);

  localStorage.setItem('biometric_email', email);
  localStorage.setItem('biometric_id', idBase64);

  alert('✅ Biometric setup successful. You can now use Face ID / Fingerprint to log in!');
} catch (err) {
  console.error('❌ Biometric setup failed', err);
  alert('Biometric setup failed or was cancelled.');
}

}); });

// utils/base64.js export function base64urlEncode(buffer) { return btoa(String.fromCharCode(...new Uint8Array(buffer))) .replace(/+/g, '-') .replace(///g, '_') .replace(/=+$/, ''); }

export function base64urlToUint8Array(base64urlString) { const padding = '='.repeat((4 - base64urlString.length % 4) % 4); const base64 = (base64urlString + padding) .replace(/-/g, '+') .replace(/_/g, '/'); const rawData = atob(base64); return new Uint8Array([...rawData].map(char => char.charCodeAt(0))); }

