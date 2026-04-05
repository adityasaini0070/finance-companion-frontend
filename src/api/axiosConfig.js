import axios from 'axios';

// Android emulator → 10.0.2.2 | Physical device → your machine's LAN IP e.g. 192.168.1.x
const BASE_URL = 'http://localhost:8084/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  config => { console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`); return config; },
  error => Promise.reject(error)
);
api.interceptors.response.use(
  res => res,
  error => { console.error('[API Error]', error.response?.data || error.message); return Promise.reject(error); }
);

export const TransactionAPI = {
  getAll:        ()             => api.get('/transactions'),
  getSummary:    ()             => api.get('/transactions/summary'),
  getByType:     (type)        => api.get(`/transactions/filter/type/${type}`),
  getByCategory: (cat)         => api.get(`/transactions/filter/category/${cat}`),
  getByDate:     (start, end)  => api.get(`/transactions/filter/date?start=${start}&end=${end}`),
  search:        (keyword)     => api.get(`/transactions/search?keyword=${encodeURIComponent(keyword)}`),
  create:        (data)        => api.post('/transactions', data),
  update:        (id, data)    => api.put(`/transactions/${id}`, data),
  delete:        (id)          => api.delete(`/transactions/${id}`),
};

export const GoalAPI = {
  getAll:    ()               => api.get('/goals'),
  getCurrent:(month, year)    => api.get(`/goals/current?month=${month}&year=${year}`),
  create:    (data)           => api.post('/goals', data),
  update:    (id, data)       => api.put(`/goals/${id}`, data),
  refresh:   (id)             => api.put(`/goals/${id}/refresh`),
  delete:    (id)             => api.delete(`/goals/${id}`),
};

export const InsightAPI = {
  getAI: () => api.get('/insights/ai'),
};

export default api;