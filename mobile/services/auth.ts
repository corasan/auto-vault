import * as SecureStore from 'expo-secure-store'
import * as WebBrowser from 'expo-web-browser'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
const BUNGIE_CLIENT_ID = process.env.EXPO_PUBLIC_BUNGIE_CLIENT_ID || '49563'
const REDIRECT_URI = process.env.EXPO_PUBLIC_REDIRECT_URI || 'autovault://auth'

export interface Platform {
	membershipType: number
	membershipId: string
	displayName: string
	isPublic: boolean
	platformName: string
}

export interface User {
	id: string
	displayName: string
	bungieNetId: string
	membershipType: number
	membershipId: string
	platformDisplayName: string
	crossSaveOverride: number
	platforms: Platform[]
}

export interface AuthTokens {
	accessToken: string
	refreshToken: string
	expiresIn: number
	expiresAt: number
}

export interface Character {
	characterId: string
	classType: number
	light: number
	emblemPath: string
	dateLastPlayed: string
}

export interface AuthResponse {
	success: boolean
	user: User
	tokens: AuthTokens
	characters: Character[]
}

export interface AuthError {
	error: string
}

class AuthService {
	async isAuthenticated(): Promise<boolean> {
		try {
			const accessToken = await SecureStore.getItemAsync('accessToken')
			const expiresAt = await SecureStore.getItemAsync('expiresAt')

			if (!accessToken || !expiresAt) {
				return false
			}

			const expiration = Number.parseInt(expiresAt, 10)
			const now = Date.now()

			if (now >= expiration - 300000) {
				return await this.refreshTokenIfNeeded()
			}

			return true
		} catch {
			return false
		}
	}

	generateBungieAuthUrl(): string {
		const baseUrl = 'https://www.bungie.net/en/OAuth/Authorize'
		const params = new URLSearchParams({
			client_id: BUNGIE_CLIENT_ID,
			response_type: 'code',
			redirect_uri: REDIRECT_URI,
		})

		return `${baseUrl}?${params.toString()}`
	}

	async authenticateWithCode(code: string): Promise<AuthResponse> {
		const response = await fetch(`${API_BASE_URL}/auth/exchange`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ code }),
		})

		const data = await response.json()

		if (!response.ok) {
			throw new Error(data.error || 'Authentication failed')
		}

		if (data.success) {
			await this.storeTokens(data.tokens)
			await this.storeUser(data.user)
		}

		return data
	}

	async authenticateWithBungie(): Promise<AuthResponse> {
		try {
			const authUrl = this.generateBungieAuthUrl()

			const result = await WebBrowser.openAuthSessionAsync(
				authUrl,
				REDIRECT_URI,
				{
					showInRecents: true,
				},
			)

			if (result.type !== 'success' || !result.url) {
				throw new Error('Authentication was cancelled or failed')
			}

			const url = new URL(result.url)
			const code = url.searchParams.get('code')
			const error = url.searchParams.get('error')

			if (error) {
				throw new Error(`OAuth error: ${error}`)
			}

			if (!code) {
				throw new Error('No authorization code received')
			}

			return await this.authenticateWithCode(code)
		} catch (error) {
			console.error('Bungie authentication error:', error)
			throw error
		}
	}

	async refreshTokenIfNeeded(): Promise<boolean> {
		try {
			const refreshToken = await SecureStore.getItemAsync('refreshToken')
			const userId = await SecureStore.getItemAsync('userId')

			if (!refreshToken) {
				return false
			}

			const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ refreshToken, userId }),
			})

			const data = await response.json()

			if (!response.ok || !data.success) {
				await this.logout()
				return false
			}

			await SecureStore.setItemAsync('accessToken', data.accessToken)
			await SecureStore.setItemAsync('refreshToken', data.refreshToken)
			await SecureStore.setItemAsync('expiresAt', data.expiresAt.toString())

			return true
		} catch (error) {
			console.error('Token refresh error:', error)
			await this.logout()
			return false
		}
	}

	async getAccessToken(): Promise<string | null> {
		const isValid = await this.isAuthenticated()
		if (!isValid) {
			return null
		}

		return await SecureStore.getItemAsync('accessToken')
	}

	async getCurrentUser(): Promise<User | null> {
		try {
			const userId = await SecureStore.getItemAsync('userId')
			const displayName = await SecureStore.getItemAsync('userDisplayName')
			const bungieNetId = await SecureStore.getItemAsync('bungieNetId')
			const membershipType = await SecureStore.getItemAsync('membershipType')
			const membershipId = await SecureStore.getItemAsync('membershipId')
			const platformDisplayName = await SecureStore.getItemAsync('platformDisplayName')
			const crossSaveOverride = await SecureStore.getItemAsync('crossSaveOverride')
			const platformsStr = await SecureStore.getItemAsync('platforms')



			if (!userId || !displayName) {
				return null
			}

			let platforms: Platform[] = []
			if (platformsStr) {
				try {
					platforms = JSON.parse(platformsStr)
				} catch {
					platforms = []
				}
			}

			const user = {
				id: userId,
				displayName,
				bungieNetId: bungieNetId || '',
				membershipType: membershipType ? Number.parseInt(membershipType, 10) : 0,
				membershipId: membershipId || '',
				platformDisplayName: platformDisplayName || '',
				crossSaveOverride: crossSaveOverride ? Number.parseInt(crossSaveOverride, 10) : 0,
				platforms,
			}

			return user
		} catch (error) {
			return null
		}
	}

	async logout(): Promise<void> {
		try {
			const userId = await SecureStore.getItemAsync('userId')

			if (userId) {
				await fetch(`${API_BASE_URL}/auth/logout`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ userId }),
				}).catch(() => {})
			}

			await SecureStore.deleteItemAsync('accessToken')
			await SecureStore.deleteItemAsync('refreshToken')
			await SecureStore.deleteItemAsync('userId')
			await SecureStore.deleteItemAsync('userDisplayName')
			await SecureStore.deleteItemAsync('bungieNetId')
			await SecureStore.deleteItemAsync('membershipType')
			await SecureStore.deleteItemAsync('membershipId')
			await SecureStore.deleteItemAsync('platformDisplayName')
			await SecureStore.deleteItemAsync('crossSaveOverride')
			await SecureStore.deleteItemAsync('platforms')
			await SecureStore.deleteItemAsync('expiresAt')
		} catch (error) {
			console.error('Logout error:', error)
		}
	}

	private async storeTokens(tokens: AuthTokens): Promise<void> {
		await SecureStore.setItemAsync('accessToken', tokens.accessToken)
		await SecureStore.setItemAsync('refreshToken', tokens.refreshToken)
		await SecureStore.setItemAsync('expiresAt', tokens.expiresAt.toString())
	}

	private async storeUser(user: User): Promise<void> {
		await SecureStore.setItemAsync('userId', user.id)
		await SecureStore.setItemAsync('userDisplayName', user.displayName)
		await SecureStore.setItemAsync('bungieNetId', user.bungieNetId)
		await SecureStore.setItemAsync('membershipType', user.membershipType.toString())
		await SecureStore.setItemAsync('membershipId', user.membershipId)
		await SecureStore.setItemAsync('platformDisplayName', user.platformDisplayName)
		await SecureStore.setItemAsync('crossSaveOverride', user.crossSaveOverride.toString())
		await SecureStore.setItemAsync('platforms', JSON.stringify(user.platforms))
	}
}

export const authService = new AuthService()
