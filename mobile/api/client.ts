import * as SecureStore from 'expo-secure-store'

// Define API response types
export interface VaultPostmasterResponse {
	success: boolean
	transferred: number
	total: number
	error?: string
	code?: string
	message?: string
}

// API base URL
// In a real app, this would come from environment variables or constants
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

// Token storage key
const AUTH_TOKEN_KEY = 'auth_token'

/**
 * Get the stored authentication token
 */
export async function getAuthToken(): Promise<string | null> {
	return SecureStore.getItemAsync(AUTH_TOKEN_KEY)
}

/**
 * Store the authentication token securely
 */
export async function setAuthToken(token: string): Promise<void> {
	return SecureStore.setItemAsync(AUTH_TOKEN_KEY, token)
}

/**
 * Remove the stored authentication token
 */
export async function removeAuthToken(): Promise<void> {
	return SecureStore.deleteItemAsync(AUTH_TOKEN_KEY)
}

/**
 * API client for making requests to the Auto Vault API
 */
export const apiClient = {
	/**
	 * Make a request to the API
	 */
	async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const token = await getAuthToken()
		const url = `${API_BASE_URL}${endpoint}`

		const headers = {
			'Content-Type': 'application/json',
			...options.headers,
		}

		if (token) {
			headers['Authorization'] = `Bearer ${token}`
		}

		const config = {
			...options,
			headers,
		}

		const response = await fetch(url, config)

		// Parse the JSON response
		const data = await response.json()

		if (!response.ok) {
			throw new Error(data.message || data.error || 'API request failed')
		}

		return data as T
	},

	/**
	 * Trigger the vaulting of postmaster items for a character
	 */
	async vaultPostmasterItems(characterId: string): Promise<VaultPostmasterResponse> {
		return this.request<VaultPostmasterResponse>('/api/vault-postmaster-items', {
			method: 'POST',
			body: JSON.stringify({ characterId }),
		})
	},

	/**
	 * Check API health status
	 */
	async checkHealth(): Promise<{ status: string }> {
		return this.request<{ status: string }>('/api/health')
	},
}
