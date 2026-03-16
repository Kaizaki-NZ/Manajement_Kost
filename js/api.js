/* ============================================
   KOST FINANCE — API Client (Railway)
   ============================================ */

const API_URL = 'https://manajementkost-production.up.railway.app/api';

const KostAPI = (() => {
  'use strict';

  // ---- Token Storage (for Cross-Origin Better Auth) ----
  function getToken() {
    return localStorage.getItem('kost_finance_token');
  }

  function setToken(token) {
    if (token) localStorage.setItem('kost_finance_token', token);
    else localStorage.removeItem('kost_finance_token');
  }

  // Helper untuk menambahkan header Auth
  function getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Helper fetch wrapper untuk menangani error seragam
  async function fetchAPI(endpoint, options = {}) {
    try {
      const isFormData = options.body instanceof FormData;
      
      const config = {
        credentials: 'omit', // Railway cross-origin mungkin bermasalah dengan cookie bawaan, kita gunakan pendekatan token/session standar
        ...options,
        headers: isFormData ? {} : getHeaders() // Jangan set Content-Type untuk FormData
      };

      if (options.headers) {
        config.headers = { ...config.headers, ...options.headers };
      }

      const res = await fetch(`${API_URL}${endpoint}`, config);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || `Error ${res.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // ---- Authentication API ----
  const auth = {
    async signIn(email, password) {
      return fetchAPI('/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },
    async signUp(name, email, password) {
      return fetchAPI('/auth/sign-up/email', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
    },
    async signOut() {
      return fetchAPI('/auth/sign-out', { method: 'POST' });
    },
    async getSession() {
      // Endpoint Better Auth
      try {
        const res = await fetch(`${API_URL}/auth/get-session`);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    }
  };

  // ---- Transaksi API ----
  const transaksi = {
    async getAll(filter = {}) {
      const q = new URLSearchParams(filter).toString();
      return fetchAPI(`/transaksi${q ? '?'+q : ''}`);
    },
    async getById(id) {
      return fetchAPI(`/transaksi/${id}`);
    },
    async create(data) {
      return fetchAPI('/transaksi', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async update(id, data) {
      return fetchAPI(`/transaksi/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    async delete(id) {
      return fetchAPI(`/transaksi/${id}`, { method: 'DELETE' });
    }
  };

  // ---- Kategori API ----
  const kategori = {
    async getAll(tipe = '') {
      return fetchAPI(`/kategori${tipe ? '?tipe='+tipe : ''}`);
    },
    async autoSeed() {
      // Memanggil endpoint untuk memasukkan kategori bawaan pertama kali login
      try {
        await fetchAPI('/isi-kategori-bawaan', { method: 'POST' });
      } catch (e) {
        console.log('Seed kategori info:', e.message);
      }
    }
  };

  // ---- Dasbor API ----
  const dasbor = {
    async getSummary() {
      return fetchAPI('/dasbor/ringkasan');
    },
    async getChart(hari = 7) {
      return fetchAPI(`/dasbor/grafik?hari=${hari}`);
    }
  };

  // ---- Protection Guard ----
  async function requireAuth() {
    // Karena kita tidak memakai session cookie di cross-origin sederhana,
    // kita asumsikan jika ada token/session (diimplementasi nanti jika perlu token manual)
    // Untuk Better Auth cross-origin tanpa token manual, pastikan kredensial diaktifkan di server Railway.
  }

  return {
    auth,
    transaksi,
    kategori,
    dasbor,
    requireAuth,
    getToken,
    setToken
  };
})();
