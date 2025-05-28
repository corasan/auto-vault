export interface AuthInitResponse {
	authUrl: string
}

export interface AuthCallbackResponse {
	success: boolean
	userId: string
	displayName: string
	accessToken: string
	expiresIn: number
}

export interface ExchangeCodeRequest {
	code: string
}

export interface ExchangeCodeResponse {
	success: boolean
	user: {
		id: string
		displayName: string
		membershipType: number
		membershipId: string
	}
	tokens: {
		accessToken: string
		refreshToken: string
		expiresIn: number
		expiresAt: number
	}
	characters: Array<{
		characterId: string
		classType: number
		light: number
		emblemPath: string
		dateLastPlayed: string
	}>
}

export interface RefreshTokenRequest {
	refreshToken: string
	userId?: string
}

export interface RefreshTokenResponse {
	success: boolean
	accessToken: string
	refreshToken: string
	expiresIn: number
	expiresAt: number
}

export interface ValidateTokenResponse {
	valid: boolean
	error?: string
}

export interface LogoutRequest {
	userId: string
}

export interface LogoutResponse {
	success: boolean
}

export interface ApiErrorResponse {
	error: string
}

export interface HealthResponse {
	status: string
	timestamp: string
}