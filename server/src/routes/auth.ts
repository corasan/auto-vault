import { BungieAuthService, type TokenResponse, type BungieUser } from '../auth/bungie'

interface AuthSession {
	userId: string
	accessToken: string
	refreshToken: string
	expiresAt: number
	membershipType: number
	membershipId: string
	displayName: string
}

function getPlatformName(membershipType: number): string {
	switch (membershipType) {
		case 1: return 'Xbox'
		case 2: return 'PlayStation'
		case 3: return 'Steam'
		case 4: return 'Blizzard'
		case 5: return 'Stadia'
		case 6: return 'Epic Games'
		case 10: return 'Demon'
		case 254: return 'Bungie Next'
		default: return 'Unknown'
	}
}

export class AuthRoutes {
	private readonly sessions = new Map<string, AuthSession>()

	constructor(private readonly bungieAuth: BungieAuthService) {}

	async handleInitAuth(request: Request): Promise<Response> {
		try {
			const url = new URL(request.url)
			const state = url.searchParams.get('state')

			const authUrl = this.bungieAuth.generateAuthUrl(state || undefined)

			return new Response(
				JSON.stringify({ authUrl }),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		} catch (error) {
			return new Response(
				JSON.stringify({ error: 'Failed to generate auth URL' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		}
	}

	async handleCallback(request: Request): Promise<Response> {
		try {
			const url = new URL(request.url)
			const code = url.searchParams.get('code')
			const error = url.searchParams.get('error')

			if (error) {
				return new Response(
					JSON.stringify({ error: `OAuth error: ${error}` }),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					}
				)
			}

			if (!code) {
				return new Response(
					JSON.stringify({ error: 'Missing authorization code' }),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					}
				)
			}

			const tokens = await this.bungieAuth.exchangeCodeForTokens(code)
			const user = await this.bungieAuth.getBungieUser(tokens.access_token)

			if (!user.destinyMemberships.length) {
				return new Response(
					JSON.stringify({ error: 'No Destiny 2 accounts found' }),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					}
				)
			}

			const primaryMembership = user.destinyMemberships[0]
			const session: AuthSession = {
				userId: user.bungieNetUser.membershipId,
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				expiresAt: Date.now() + tokens.expires_in * 1000,
				membershipType: primaryMembership?.membershipType ?? 0,
				membershipId: primaryMembership?.membershipId ?? '',
				displayName: user.bungieNetUser.displayName,
			}

			this.sessions.set(session.userId, session)

			return new Response(
				JSON.stringify({
					success: true,
					userId: session.userId,
					displayName: session.displayName,
					accessToken: tokens.access_token,
					expiresIn: tokens.expires_in,
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		} catch (error) {
			console.error('Auth callback error:', error)
			return new Response(
				JSON.stringify({ error: 'Authentication failed' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		}
	}

	async handleExchangeCode(request: Request): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response(
				JSON.stringify({ error: 'Method not allowed' }),
				{
					status: 405,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		}

		try {
			const body = await request.json()
			const { code } = body

			if (!code) {
				return new Response(
					JSON.stringify({ error: 'Missing authorization code' }),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					}
				)
			}

			const tokens = await this.bungieAuth.exchangeCodeForTokens(code)
			const user = await this.bungieAuth.getBungieUser(tokens.access_token)

			if (!user.destinyMemberships.length) {
				return new Response(
					JSON.stringify({ error: 'No Destiny 2 accounts found' }),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					}
				)
			}

			const primaryMembership = user.destinyMemberships[0]
			const characters = await this.bungieAuth.getCharacters(
				tokens.access_token,
				primaryMembership?.membershipType ?? 0,
				primaryMembership?.membershipId ?? ''
			)

			const session: AuthSession = {
				userId: user.bungieNetUser.membershipId,
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				expiresAt: Date.now() + tokens.expires_in * 1000,
				membershipType: primaryMembership?.membershipType ?? 0,
				membershipId: primaryMembership?.membershipId ?? '',
				displayName: user.bungieNetUser.displayName,
			}

			this.sessions.set(session.userId, session)

			return new Response(
				JSON.stringify({
					success: true,
					user: {
						id: session.userId,
						displayName: session.displayName,
						bungieNetId: user.bungieNetUser.membershipId,
						membershipType: session.membershipType,
						membershipId: session.membershipId,
						platformDisplayName: primaryMembership.displayName,
						crossSaveOverride: primaryMembership.crossSaveOverride || 0,
						platforms: user.destinyMemberships.map(membership => ({
							membershipType: membership.membershipType,
							membershipId: membership.membershipId,
							displayName: membership.displayName,
							isPublic: membership.isPublic,
							platformName: getPlatformName(membership.membershipType),
						})),
					},
					tokens: {
						accessToken: tokens.access_token,
						refreshToken: tokens.refresh_token,
						expiresIn: tokens.expires_in,
						expiresAt: session.expiresAt,
					},
					characters: Object.values(characters).map(char => ({
						characterId: char.characterId,
						classType: char.classType,
						light: char.light,
						emblemPath: char.emblemPath,
						dateLastPlayed: char.dateLastPlayed,
					})),
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json',
						'Cache-Control': 'no-store',
					},
				}
			)
		} catch (error) {
			console.error('Code exchange error:', error)
			return new Response(
				JSON.stringify({ error: 'Failed to exchange authorization code' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		}
	}

	async handleRefreshToken(request: Request): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response(
				JSON.stringify({ error: 'Method not allowed' }),
				{
					status: 405,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		}

		try {
			const body = await request.json()
			const { refreshToken, userId } = body

			if (!refreshToken) {
				return new Response(
					JSON.stringify({ error: 'Missing refresh token' }),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					}
				)
			}

			const tokens = await this.bungieAuth.refreshToken(refreshToken)

			if (userId) {
				const session = this.sessions.get(userId)
				if (session) {
					session.accessToken = tokens.access_token
					session.refreshToken = tokens.refresh_token
					session.expiresAt = Date.now() + tokens.expires_in * 1000
					this.sessions.set(userId, session)
				}
			}

			return new Response(
				JSON.stringify({
					success: true,
					accessToken: tokens.access_token,
					refreshToken: tokens.refresh_token,
					expiresIn: tokens.expires_in,
					expiresAt: Date.now() + tokens.expires_in * 1000,
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json',
						'Cache-Control': 'no-store',
					},
				}
			)
		} catch (error) {
			console.error('Token refresh error:', error)
			return new Response(
				JSON.stringify({ error: 'Failed to refresh token' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		}
	}

	async handleValidateToken(request: Request): Promise<Response> {
		try {
			const authHeader = request.headers.get('Authorization')
			if (!authHeader || !authHeader.startsWith('Bearer ')) {
				return new Response(
					JSON.stringify({ valid: false, error: 'Missing or invalid authorization header' }),
					{
						status: 401,
						headers: { 'Content-Type': 'application/json' },
					}
				)
			}

			const token = authHeader.substring(7)
			const isValid = await this.bungieAuth.validateToken(token)

			return new Response(
				JSON.stringify({ valid: isValid }),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		} catch (error) {
			console.error('Token validation error:', error)
			return new Response(
				JSON.stringify({ valid: false, error: 'Token validation failed' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		}
	}

	async handleLogout(request: Request): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response(
				JSON.stringify({ error: 'Method not allowed' }),
				{
					status: 405,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		}

		try {
			const body = await request.json()
			const { userId } = body

			if (userId && this.sessions.has(userId)) {
				this.sessions.delete(userId)
			}

			return new Response(
				JSON.stringify({ success: true }),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		} catch (error) {
			console.error('Logout error:', error)
			return new Response(
				JSON.stringify({ error: 'Logout failed' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		}
	}

	getSession(userId: string): AuthSession | undefined {
		return this.sessions.get(userId)
	}

	async ensureValidSession(userId: string): Promise<AuthSession | null> {
		const session = this.sessions.get(userId)
		if (!session) return null

		if (this.bungieAuth.isTokenExpired(session.expiresAt)) {
			try {
				const tokens = await this.bungieAuth.refreshToken(session.refreshToken)
				session.accessToken = tokens.access_token
				session.refreshToken = tokens.refresh_token
				session.expiresAt = Date.now() + tokens.expires_in * 1000
				this.sessions.set(userId, session)
				return session
			} catch (error) {
				console.error('Failed to refresh token for session:', error)
				this.sessions.delete(userId)
				return null
			}
		}

		return session
	}
}
