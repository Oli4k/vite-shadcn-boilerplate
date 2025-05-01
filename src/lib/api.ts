const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface ApiOptions {
  method?: string
  body?: any
  headers?: Record<string, string>
  params?: Record<string, string>
}

function buildUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`${API_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }
  return url.toString()
}

async function api(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, headers = {}, params } = options

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  }

  const response = await fetch(buildUrl(endpoint, params), {
    method,
    headers: defaultHeaders,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'API request failed')
  }

  return data
}

export const apiClient = {
  get: (endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) => 
    api(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, body: any, options?: Omit<ApiOptions, 'method'>) => 
    api(endpoint, { ...options, method: 'POST', body }),
    
  put: (endpoint: string, body: any, options?: Omit<ApiOptions, 'method'>) => 
    api(endpoint, { ...options, method: 'PUT', body }),
    
  delete: (endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) => 
    api(endpoint, { ...options, method: 'DELETE' }),
}

export default apiClient 