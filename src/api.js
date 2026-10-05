const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const ACCESS_TOKEN_KEY = 'mark6_access_token'
const REFRESH_TOKEN_KEY = 'mark6_refresh_token'

export function getTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  }
}

export function saveTokens(tokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

async function parseResponse(response) {
  const responseText = await response.text()
  let payload = {}
  if (responseText !== '') {
    try {
      payload = JSON.parse(responseText)
    } catch {
      throw new Error('The LavaLust API returned an invalid response.')
    }
  }
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Request failed (${response.status}).`)
  }
  return payload
}

async function refreshAccessToken() {
  const { refreshToken } = getTokens()
  if (!refreshToken) {
    throw new Error('Your session has expired. Please log in again.')
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  const payload = await parseResponse(response)
  saveTokens(payload.tokens)
  return payload.tokens.access_token
}

export async function apiRequest(path, options = {}, retry = true) {
  const { accessToken } = getTokens()
  const headers = new Headers(options.headers || {})
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Unable to reach the LavaLust API. Check the API URL and server status.')
  }

  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    try {
      const refreshedToken = await refreshAccessToken()
      headers.set('Authorization', `Bearer ${refreshedToken}`)
      response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
    } catch (error) {
      clearTokens()
      throw error
    }
  }

  return parseResponse(response)
}

export async function login(identity, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identity, password }),
  }, false)
}

export async function logout() {
  const { refreshToken } = getTokens()
  return apiRequest('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  }, false)
}

export function fetchProducts() {
  return apiRequest('/products')
}

export function createProduct(product) {
  return apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  })
}

export function updateProduct(id, product) {
  return apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  })
}

export function deleteProduct(id) {
  return apiRequest(`/products/${id}`, { method: 'DELETE' })
}
