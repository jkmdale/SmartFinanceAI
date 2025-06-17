document.addEventListener('DOMContentLoaded', () => {
  const biometricBtn = document.getElementById('biometric-setup-btn');
  if (!biometricBtn) return;

  biometricBtn.addEventListener('click', () => {
    alert('🔐 Biometric setup is not yet implemented in this version.');
    // Future: integrate Face ID / fingerprint setup using WebAuthn here
  });
});