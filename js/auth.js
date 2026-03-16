/* ============================================
   KOST FINANCE — Authentication Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('auth-form');
  const btnToggle = document.getElementById('btn-toggle-mode');
  const toggleText = document.getElementById('toggle-text');
  const registerFields = document.getElementById('register-fields');
  const btnSubmit = document.getElementById('btn-submit');
  const title = document.querySelector('.page-header__title');
  
  const inputName = document.getElementById('input-name');
  const inputEmail = document.getElementById('input-email');
  const inputPassword = document.getElementById('input-password');

  let isLoginMode = true;

  // Toggle Login/Register UI
  btnToggle.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
      registerFields.style.display = 'none';
      inputName.removeAttribute('required');
      btnSubmit.textContent = 'Masuk';
      toggleText.textContent = 'Belum punya akun?';
      btnToggle.textContent = 'Daftar di sini';
      title.textContent = 'Masuk ke Kost Finance';
    } else {
      registerFields.style.display = 'block';
      inputName.setAttribute('required', 'true');
      btnSubmit.textContent = 'Daftar Akun Baru';
      toggleText.textContent = 'Sudah punya akun?';
      btnToggle.textContent = 'Masuk di sini';
      title.textContent = 'Daftar Kost Finance';
    }
  });

  // Handle Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = inputEmail.value.trim();
    const password = inputPassword.value.trim();
    
    // Simple validation
    if (!email || !password) {
      alert('Email dan Password wajib diisi!');
      return;
    }

    try {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Memproses...';

      if (isLoginMode) {
        // ---- LOGIN ----
        const res = await KostAPI.auth.signIn(email, password);
        
        // Better Auth API returns token in session object
        if (res && res.session && res.session.token) {
          KostAPI.setToken(res.session.token);
        } else if (res && res.token) {
          KostAPI.setToken(res.token);
        }
        
        alert('Berhasil masuk! Mengalihkan ke Dashboard...');
        window.location.href = 'index.html';

      } else {
        // ---- REGISTER ----
        const name = inputName.value.trim();
        if (!name) return alert('Nama wajib diisi!');
        
        const res = await KostAPI.auth.signUp(name, email, password);
        
        if (res && res.session && res.session.token) {
          KostAPI.setToken(res.session.token);
        } else if (res && res.token) {
          KostAPI.setToken(res.token);
        }

        // Jalankan auto-seed kategori bawaan setelah register
        try {
          await KostAPI.kategori.autoSeed();
        } catch (err) {
          console.warn('Auto seed kategori peringatan:', err);
        }

        alert('Pendaftaran berhasil! Mengalihkan ke Dashboard...');
        window.location.href = 'index.html';
      }

    } catch (error) {
      alert(`Gagal: ${error.message}`);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = isLoginMode ? 'Masuk' : 'Daftar Akun Baru';
    }
  });

  // Check if already logged in
  const token = KostAPI.getToken();
  if (token) {
    // Verifikasi token (opsional, untuk UX lebih baik bisa langsung redirect lalu divalidasi di index)
    window.location.href = 'index.html';
  }
});
