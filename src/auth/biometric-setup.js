document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('biometric-setup-form');
  const emailInput = document.getElementById('email');

  // Autofill email if previously saved
  const savedEmail = localStorage.getItem('smartfinance_email');
  if (savedEmail) {
    emailInput.value = savedEmail;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert('Please enter your email to set up biometrics.');
      return;
    }

    const userId = email; // or generate a stable hash/userId

    try {
      // Save email for future use
      localStorage.setItem('smartfinance_email', email);

      if (!window.PublicKeyCredential) {
        alert('Biometric login is not supported on this device.');
        return;
      }

      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32), // in production, get from server
          rp: { name: "SmartFinanceAI" },
          user: {
            id: new TextEncoder().encode(userId),
            name: email,
            displayName: email
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // fingerprint/Face ID
            userVerification: "preferred"
          },
          timeout: 60000,
          attestation: "none"
        }
      });

      console.log("✅ Biometric credential created:", cred);

      // Store a local flag to enable biometric login later
      localStorage.setItem('smartfinance_biometric_ready', 'true');
      alert('✅ Biometric login enabled! You can now use Face ID or fingerprint to log in.');

      window.location.href = '/SmartFinanceAI/src/core/dashboard.html';
    } catch (err) {
      console.error('❌ Biometric setup failed:', err);
      alert('Something went wrong setting up biometric login.');
    }
  });
});