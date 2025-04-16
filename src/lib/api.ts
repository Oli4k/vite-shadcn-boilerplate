import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
})

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      })

      // If we get a 401, we should redirect to login
      if (error.response.status === 401) {
        window.location.href = '/login'
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', error.request)
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message)
    }
    return Promise.reject(error)
  }
)

export { api } 