const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Get stored token
const getToken = () => localStorage.getItem('token')

// API request helper
async function request(endpoint, options = {}) {
  const token = getToken()

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

// Auth API
export const authAPI = {
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  getMe: () => request('/auth/me'),
}

// Companies API
export const companiesAPI = {
  getBySlug: (slug) => request(`/companies/slug/${slug}`),

  update: (id, data) => request(`/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
}

// Sections API
export const sectionsAPI = {
  getPublic: (companyId) => request(`/sections/public/${companyId}`),

  getAll: (companyId) => request(`/sections/company/${companyId}`),

  create: (data) => request('/sections', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, data) => request(`/sections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  updateOrder: (sections) => request('/sections/bulk/order', {
    method: 'PUT',
    body: JSON.stringify({ sections }),
  }),

  delete: (id) => request(`/sections/${id}`, {
    method: 'DELETE',
  }),
}

// Jobs API
export const jobsAPI = {
  getPublic: (companyId) => request(`/jobs/public/${companyId}`),

  getAll: (companyId) => request(`/jobs/company/${companyId}`),

  getOne: (id) => request(`/jobs/${id}`),

  create: (data) => request('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, data) => request(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id) => request(`/jobs/${id}`, {
    method: 'DELETE',
  }),
}

export default { authAPI, companiesAPI, sectionsAPI, jobsAPI }
