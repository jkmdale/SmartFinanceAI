// biometric-setup.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('biometric-setup-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = form.email.value.trim();
    if (!email) {
      alert('Please enter a valid email address.');
      return;
    }

    // Check for WebAuthn support
    if (!window.PublicKeyCredential) {
      alert('Biometric authentication is not supported on this device.');
      return;
    }

    try {
      // Create new WebAuthn credentials
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "SmartFinanceAI"
          },
          user: {
            id: Uint8Array.from(email, c => c.charCodeAt(0)),
            name: email,
            displayName: email
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },    // ES256
            { type: "public-key", alg: -257 }   // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "none"
        }
      });

      if (!credential) {
        alert('Biometric registration was cancelled or failed.');
        return;
      }

      // Store credential ID and email locally
      const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem('biometricCredentialId', credId);
      localStorage.setItem('biometricEmail', email);

      alert('✅ Biometric setup successful. You can now use Face ID / Fingerprint to log in!');
      window.location.href = '/SmartFinanceAI/src/auth/login.html';
    } catch (err) {
      console.error('Biometric setup failed:', err);
      alert('Biometric setup failed. Please try again.');
    }
  });
});