import { reactive } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Fallback expiry used only when the server doesn't return expiresAt (e.g. old tokens).
// Backend issues 7-day tokens; this constant is just the safety fallback.
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// Check if token is expired
const isTokenExpired = () => {
  const expiresAt = localStorage.getItem('tokenExpiresAt');
  if (!expiresAt) return true;
  return Date.now() >= parseInt(expiresAt, 10);
};

// Auth state
export const authState = reactive({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token') && !isTokenExpired(),
  loading: false
});

// Initialize auth from localStorage
export const initAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // Check if token exists and is not expired
  if (token && user && !isTokenExpired()) {
    authState.token = token;
    authState.user = JSON.parse(user);
    authState.isAuthenticated = true;
  } else if (token) {
    // Token expired, clear storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiresAt');
    authState.token = null;
    authState.user = null;
    authState.isAuthenticated = false;
  }
};

// API helper
const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authState.token) {
    headers['Authorization'] = `Bearer ${authState.token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = response.status;
    throw err;
  }

  return data;
};

// Auth API
export const authApi = {
  async login(email, password) {
    authState.loading = true;
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      authState.token = data.token;
      authState.user = data.user;
      authState.isAuthenticated = true;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      const expiresAt = data.expiresAt || (Date.now() + TOKEN_EXPIRY_MS);
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());
      return data;
    } finally {
      authState.loading = false;
    }
  },

  async register(name, email, password, profile = {}) {
    authState.loading = true;
    try {
      return await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, ...profile })
      });
    } finally {
      authState.loading = false;
    }
  },

  async sendVerification(email) {
    return apiRequest('/auth/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async verifyEmail(email, otp) {
    const data = await apiRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
    authState.token = data.token;
    authState.user = data.user;
    authState.isAuthenticated = true;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    const expiresAt = data.expiresAt || (Date.now() + TOKEN_EXPIRY_MS);
    localStorage.setItem('tokenExpiresAt', expiresAt.toString());
    return data;
  },

  async forgotPassword(email) {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(email, otp, newPassword) {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword })
    });
  },

  async googleLogin(idToken) {
    authState.loading = true;
    try {
      const data = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken })
      });
      authState.token = data.token;
      authState.user = data.user;
      authState.isAuthenticated = true;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      const expiresAt = data.expiresAt || (Date.now() + TOKEN_EXPIRY_MS);
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());
      return data;
    } finally {
      authState.loading = false;
    }
  },

  // Auto-login using a JWT passed from the mobile app via URL param (?token=...)
  async loginWithToken(token) {
    try {
      console.log('[loginWithToken] calling /auth/me with token:', token?.slice(0, 30) + '...');
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[loginWithToken] response status:', response.status);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('[loginWithToken] failed:', err);
        return false;
      }
      const data = await response.json();
      const user = data.user;
      console.log('[loginWithToken] success, user:', user?.email);
      authState.token = token;
      authState.user = user;
      authState.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('tokenExpiresAt', (Date.now() + TOKEN_EXPIRY_MS).toString());
      return true;
    } catch (e) {
      console.error('[loginWithToken] exception:', e);
      return false;
    }
  },

  logout() {
    authState.token = null;
    authState.user = null;
    authState.isAuthenticated = false;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiresAt');
  }
};

// Recordings API
export const recordingsApi = {
  async getAll() {
    return apiRequest('/recordings');
  },

  async getLimits() {
    return apiRequest('/recordings/limits');
  },

  async getOne(id) {
    return apiRequest(`/recordings/${id}`);
  },

  // Stream a single recorded chunk to the server (no totalChunks needed)
  async uploadChunk(uploadId, chunkIndex, base64Data) {
    return apiRequest('/recordings/upload-chunk', {
      method: 'POST',
      body: JSON.stringify({ uploadId, chunkIndex, chunk: base64Data }),
    });
  },

  // Assemble streamed chunks into a recording and kick off transcription
  async finalizeUpload(uploadId, { duration, mimeType, title }) {
    return apiRequest('/recordings/finalize-upload', {
      method: 'POST',
      body: JSON.stringify({ uploadId, duration, mimeType, title }),
    });
  },

  // Get presigned URL for direct upload to R2
  async getUploadUrl(mimeType) {
    return apiRequest('/recordings/upload-url', {
      method: 'POST',
      body: JSON.stringify({ mimeType })
    });
  },

  // Upload file directly to R2 using presigned URL
  async uploadToR2(uploadUrl, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
      
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'audio/webm');
      xhr.send(file);
    });
  },

  async create(recordingData) {
    return apiRequest('/recordings', {
      method: 'POST',
      body: JSON.stringify(recordingData)
    });
  },

  async update(id, data) {
    return apiRequest(`/recordings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async delete(id) {
    return apiRequest(`/recordings/${id}`, {
      method: 'DELETE'
    });
  },

  async transcribe(id) {
    return apiRequest(`/recordings/${id}/transcribe`, {
      method: 'POST'
    });
  },

  async summarize(id, transcript) {
    return apiRequest(`/recordings/${id}/summarize`, {
      method: 'POST',
      body: JSON.stringify({ transcript })
    });
  },

  async generateMinutes(id) {
    return apiRequest(`/recordings/${id}/minutes`, {
      method: 'POST'
    });
  },

  async extractActions(id) {
    return apiRequest(`/recordings/${id}/actions`, {
      method: 'POST'
    });
  },

  async generateTitle(id) {
    return apiRequest(`/recordings/${id}/generate-title`, {
      method: 'POST'
    });
  }
};

// Admin API
export const adminApi = {
  async getStats() {
    return apiRequest('/admin/stats');
  },
  async getUsers(page = 1, search = '') {
    return apiRequest(`/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
  },
  async getUser(id) {
    return apiRequest(`/admin/users/${id}`);
  },
  async deleteUser(id) {
    return apiRequest(`/admin/users/${id}`, { method: 'DELETE' });
  },
  async updateUserOverrides(id, overrides) {
    return apiRequest(`/admin/users/${id}/overrides`, {
      method: 'PATCH',
      body: JSON.stringify(overrides),
    });
  },
  async getRecordings(page = 1, search = '') {
    return apiRequest(`/admin/recordings?page=${page}&search=${encodeURIComponent(search)}`);
  },
  async getActivity(limit = 30) {
    return apiRequest(`/admin/activity?limit=${limit}`);
  },
  async getAnalytics(days = 30) {
    return apiRequest(`/admin/analytics?days=${days}`);
  },
  async getCosts(days = 30) {
    return apiRequest(`/admin/costs?days=${days}`);
  },
  async getSubscriptions() {
    return apiRequest('/admin/subscriptions');
  },
};

// Payments API
export const paymentsApi = {
  async createOrder(plan, couponCode) {
    return apiRequest('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ plan, couponCode: couponCode || undefined }),
    });
  },
  async validateCoupon(code, plan) {
    return apiRequest('/payments/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ code, plan }),
    });
  },
  async verifyPayment(payload, plan) {
    return apiRequest('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ ...payload, plan }),
    });
  },
  async getStatus() {
    return apiRequest('/payments/status');
  },
};

// Coupons admin API
export const couponsApi = {
  async getAll() { return apiRequest('/admin/coupons'); },
  async create(data) {
    return apiRequest('/admin/coupons', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id, data) {
    return apiRequest(`/admin/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  async remove(id) {
    return apiRequest(`/admin/coupons/${id}`, { method: 'DELETE' });
  },
};


// Plans API (public fetch + admin update)
export const plansApi = {
  async getAll() { return apiRequest('/plans'); },
  async update(plan, features, monthlyPrice, annualMonthly, annualTotal, monthlyPaise, gates) {
    return apiRequest(`/admin/plans/${plan}`, { method: 'PUT', body: JSON.stringify({ features, monthlyPrice, annualMonthly, annualTotal, monthlyPaise, gates }) });
  },
};
