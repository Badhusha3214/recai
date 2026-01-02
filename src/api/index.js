import { reactive } from 'vue';

const API_URL = 'http://localhost:3001/api';

// Token expiration time in milliseconds (24 hours) - must match backend
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

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
    throw new Error(data.error || 'Request failed');
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
      // Store expiration time from backend or calculate it
      const expiresAt = data.expiresAt || (Date.now() + TOKEN_EXPIRY_MS);
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());
      
      return data;
    } finally {
      authState.loading = false;
    }
  },

  async register(name, email, password) {
    authState.loading = true;
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      
      authState.token = data.token;
      authState.user = data.user;
      authState.isAuthenticated = true;
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Store expiration time from backend or calculate it
      const expiresAt = data.expiresAt || (Date.now() + TOKEN_EXPIRY_MS);
      localStorage.setItem('tokenExpiresAt', expiresAt.toString());
      
      return data;
    } finally {
      authState.loading = false;
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

  async getOne(id) {
    return apiRequest(`/recordings/${id}`);
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
  }
};
