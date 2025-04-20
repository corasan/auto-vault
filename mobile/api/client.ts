import Constants from 'expo-constants'
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

export interface BungieUserResponse {
	membershipId: string
	displayName: string
	profilePicture?: string
	// Other Bungie user properties would be here
}

export interface TokenResponse {
	access_token: string
	token_type: string
	expires_in: number
	refresh_token: string
}

// API base URL from environment variables with fallback
export const API_BASE_URL = process.env.EXPO_PUBLIC_WORKER_URL || 'http://localhost:8787'

// Token storage keys
const AUTH_TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'bungie_user'

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
 * Store the user information securely
 */
export async function setUserInfo(user: BungieUserResponse): Promise<void> {
	return SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
}

/**
 * Get the stored user information
 */
export async function getUserInfo(): Promise<BungieUserResponse | null> {
	const userStr = await SecureStore.getItemAsync(USER_KEY)
	if (userStr) {
		return JSON.parse(userStr)
	}
	return null
}

/**
 * Clear all stored authentication data
 */
export async function clearAuthData(): Promise<void> {
	await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY)
	await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
	await SecureStore.deleteItemAsync(USER_KEY)
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
			Authorization: '',
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
	 * Exchange authorization code for token
	 */
	async exchangeCodeForToken(code: string): Promise<TokenResponse> {
		// Call the worker API to exchange the code for a token
		return this.request<TokenResponse>('/api/auth/token', {
			method: 'POST',
			body: JSON.stringify({
				code,
				client_id: process.env.EXPO_PUBLIC_BUNGIE_CLIENT_ID,
				grant_type: 'authorization_code',
				redirect_uri: process.env.EXPO_PUBLIC_REDIRECT_URI,
			}),
		})
	},

	/**
	 * Get Bungie user profile information
	 */
	async getBungieUser(): Promise<BungieUserResponse> {
		return this.request<BungieUserResponse>('/api/auth/user')
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