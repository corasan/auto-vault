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
	membershipId: string          // Bungie.net membership ID
	displayName: string
	profilePicture?: string
	// Platform-specific membership IDs (e.g., Xbox, PSN, Steam)
	platformMemberships?: Record<number, string>
	// Primary platform (most recently played)
	primaryMembershipType?: number
	primaryMembershipId?: string
	// Last played character
	lastPlayedCharacterId?: string
}

export interface TokenResponse {
	access_token: string
	token_type: string
	expires_in: number
	refresh_token: string
}

export interface DestinyCharacter {
	characterId: string
	classType: string
	light: number
	emblemPath: string
	dateLastPlayed: string
}

export interface DestinyItem {
	itemId: string
	itemInstanceId: string
	name: string
	description?: string
	icon: string
	itemType: string // Weapon, Armor, etc.
	itemSubType?: string // Scout Rifle, Helmet, etc.
	tierType: string // Common, Uncommon, Rare, Legendary, Exotic
	power?: number
	location: 'inventory' | 'postmaster' | 'vault'
	bucketHash: number // inventory bucket hash
}

export interface InventoryResponse {
	characters: DestinyCharacter[]
	items: {
		inventory: DestinyItem[]
		postmaster: DestinyItem[]
		vault: DestinyItem[]
	}
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
		// Get user info to get platform details
		const user = await this.getBungieUser()
		
		if (!user.primaryMembershipId || !user.primaryMembershipType) {
			throw new Error('No primary platform membership found. Please link a Destiny 2 platform account to your Bungie.net profile.')
		}
		
		console.log(`Vaulting postmaster items for character ${characterId} on platform ${user.primaryMembershipType}`)
		
		return this.request<VaultPostmasterResponse>('/api/vault-postmaster-items', {
			method: 'POST',
			body: JSON.stringify({ 
				characterId,
				membershipType: user.primaryMembershipType,
				destinyMembershipId: user.primaryMembershipId
			}),
		})
	},

	/**
	 * Check API health status
	 */
	async checkHealth(): Promise<{ status: string }> {
		return this.request<{ status: string }>('/api/health')
	},

	/**
	 * Get character inventory, postmaster, and vault items
	 * Uses Bungie's GetProfile endpoint:
	 * https://bungie-net.github.io/multi/operation_get_Destiny2-GetProfile.html
	 */
	async getDestinyInventory(destinyMembershipId: string, membershipType: number): Promise<InventoryResponse> {
		// Use the official Bungie API through our worker
		return this.request<InventoryResponse>('/api/destiny2/profile', {
			method: 'POST',
			body: JSON.stringify({
				destinyMembershipId,
				membershipType,
				// Request components we need based on Bungie API documentation:
				// 100 = Profile, 102 = ProfileInventories, 201 = Characters, 205 = CharacterInventories, 
				// 300 = ItemInstances, 301 = ItemObjectives, 302 = ItemPerks, 304 = ItemStats
				components: [100, 102, 201, 205, 300, 301, 302, 304]
			})
		})
	},
	
	/**
	 * Get character inventory (backwards compatibility wrapper for getDestinyInventory)
	 */
	async getInventory(): Promise<InventoryResponse> {
		// Get user info to get membership details
		const user = await this.getBungieUser()
		
		// Use the primary (most recently played) platform membership
		if (!user.primaryMembershipId || !user.primaryMembershipType) {
			throw new Error('No primary platform membership found. Please link a Destiny 2 platform account to your Bungie.net profile.')
		}
		
		console.log(`Using primary platform: ${user.primaryMembershipType} with ID: ${user.primaryMembershipId}`)
		return this.getDestinyInventory(user.primaryMembershipId, user.primaryMembershipType)
	},

	/**
	 * Get vault items only (backwards compatibility wrapper for getDestinyInventory)
	 */
	async getVaultContents(): Promise<DestinyItem[]> {
		const inventory = await this.getInventory()
		return inventory.items.vault
	},
	
	/**
	 * Transfer an item using Bungie's TransferItem endpoint:
	 * https://bungie-net.github.io/multi/operation_post_Destiny2-TransferItem.html
	 */
	async transferItem(itemReferenceHash: number, itemId: string, characterId: string, transferToVault: boolean, membershipType: number): Promise<boolean> {
		return this.request<boolean>('/api/destiny2/transfer-item', {
			method: 'POST',
			body: JSON.stringify({
				itemReferenceHash,
				itemId,
				characterId,
				transferToVault,
				stackSize: 1,
				membershipType
			})
		})
	},
}
