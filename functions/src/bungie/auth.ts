import type { TokenResponse } from '../types'

const BUNGIE_TOKEN_URL = 'https://www.bungie.net/platform/app/oauth/token/'
const BUNGIE_AUTH_URL = 'https://www.bungie.net/en/OAuth/Authorize'

export interface AuthConfig {
	clientId: string
	clientSecret: string
	redirectUri: string
}

export interface AuthTokens {
	accessToken: string
	refreshToken: string
	expiresAt: number
	membershipId: string
}

export interface AuthResult {
	success: boolean
	tokens?: AuthTokens
	error?: string
}

export class BungieAuth {
	private config: AuthConfig

	constructor(config: AuthConfig) {
		this.config = config
	}

	generateAuthUrl(state?: string): string {
		const params = new URLSearchParams({
			client_id: this.
