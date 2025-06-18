document.addEventListener('DOMContentLoaded', async () => {
  const biometricReady = localStorage.getItem('smartfinance_biometric_ready');
  const email = localStorage.getItem('smartfinance_email');

  if (!biometricReady || !email) {
    console.log('ℹ️ Biometric login not available.');
    return;
  }

  if (!window.PublicKeyCredential) {
    console.warn('❌ WebAuthn is not supported in this browser.');
    return;
  }

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32), // Normally from your server
        userVerification: 'preferred',
        timeout: 60000
      }
    });

    console.log('✅ Biometric login successful:', assertion);

    // You can validate/assert the credential here if connected to a backend
    // For now, we just simulate successful login
    alert('✅ Welcome back! You’ve been logged in with biometrics.');
    window.location.href = '/SmartFinanceAI/src/core/dashboard.html';
  } catch (err) {
    console.error('❌ Biometric login failed:', err);
    alert('Biometric login was cancelled or failed. Please log in manually.');
  }
});