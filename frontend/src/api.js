import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000,
})

export const searchProducts = async (params = {}) => {
  const { data } = await API.get('/api/search', { params })
  return data
}

export const getCategories = async () => {
  const { data } = await API.get('/api/categories')
  return data
}

export const getProduct = async (id) => {
  const { data } = await API.get(`/api/products/${id}`)
  return data
}

export const getStores = async () => {
  const { data } = await API.get('/api/stores')
  return data
}

export const getStats = async () => {
  const { data } = await API.get('/api/stats')
  return data
}

export const createBooking = async (payload) => {
  const { data } = await API.post('/api/booking', payload)
  return data
}
