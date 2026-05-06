const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),

  getDocuments: () => request('GET', '/documents'),
  getDocument: (id) => request('GET', `/documents/${id}`),
  createDocument: (title, content) => request('POST', '/documents', { title, content }),
  updateDocument: (id, updates) => request('PUT', `/documents/${id}`, updates),
  deleteDocument: (id) => request('DELETE', `/documents/${id}`),

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE}/documents/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  getShares: (docId) => request('GET', `/documents/${docId}/shares`),
  shareDocument: (docId, email) => request('POST', `/documents/${docId}/shares`, { email }),
  removeShare: (docId, userId) => request('DELETE', `/documents/${docId}/shares/${userId}`),
};
