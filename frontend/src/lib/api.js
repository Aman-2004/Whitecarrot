import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || 'Request failed'
    throw new Error(message)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
}

// Companies API
export const companiesAPI = {
  getBySlug: (slug) => api.get(`/companies/slug/${slug}`),
  update: (id, data) => api.put(`/companies/${id}`, data),
  uploadFile: async (id, file, type) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/companies/${id}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    return response.json()
  },
}

// Sections API
export const sectionsAPI = {
  getPublic: (companyId) => api.get(`/sections/public/${companyId}`),
  getAll: (companyId) => api.get(`/sections/company/${companyId}`),
  create: (data) => api.post('/sections', data),
  update: (id, data) => api.put(`/sections/${id}`, data),
  updateOrder: (sections) => api.put('/sections/bulk/order', { sections }),
  delete: (id) => api.delete(`/sections/${id}`),
}

// Jobs API
export const jobsAPI = {
  getPublic: (companyId) => api.get(`/jobs/public/${companyId}`),
  getAll: (companyId) => api.get(`/jobs/company/${companyId}`),
}

export default { authAPI, companiesAPI, sectionsAPI, jobsAPI }

