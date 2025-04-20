import {
	getBungieUser,
	getInventory,
	getPostmasterItems,
	hasVaultSpace,
	refreshToken,
	transferPostmasterItemToVault,
} from './bungie'
import type { TokenResponse } from './types'

// Define interfaces for our environment and storage
interface Env {
	BUNGIE_API_KEY: string
	BUNGIE_CLIENT_ID: string
	BUNGIE_CLIENT_SECRET: string
	AUTO_VAULT_USERS: KVNamespace
}

interface StoredUserData {
	userId: string
	accessToken: string
	refreshToken: string
	membershipType: number
	membershipId: string
	characters: { characterId: string }[]
	expiresAt: number
}

export default {
	// Worker scheduled to run every 15 seconds
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		await processAllUsers(env)
	},

	// Optional HTTP endpoint for manual triggers and UI
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)

		// Manual trigger endpoint
		if (url.pathname === '/api/trigger-vault-transfer') {
			ctx.waitUntil(processAllUsers(env))
			return new Response('Auto vault transfer triggered', { status: 200 })
		}

		// User authentication endpoint
		if (url.pathname === '/api/auth-callback') {
			try {
				return await handleAuthCallback(request, env)
			} catch (error) {
				console.error('Auth callback error:', error)
				return new Response('Authentication failed', { status: 500 })
			}
		}

		// Exchange auth code for tokens endpoint (for client usage)
		if (url.pathname === '/api/auth/token') {
			try {
				return await handleExchangeCode(request, env)
			} catch (error) {
				console.error('Code exchange error:', error)
				return new Response(JSON.stringify({ error: 'Failed to exchange code' }), {
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				})
			}
		}

		// User status endpoint
		if (url.pathname === '/api/status') {
			return await handleStatusRequest(request, env)
		}

		return new Response('Not found', { status: 404 })
	},
}

// Process all authenticated users
async function processAllUsers(env: Env): Promise<void> {
	console.log('Starting scheduled auto-vault process')

	// List all users from KV storage
	const usersList = await env.AUTO_VAULT_USERS.list()

	// Process each user in parallel
	const promises = usersList.keys.map(async key => {
		const userDataStr = await env.AUTO_VAULT_USERS.get(key.name)
		if (!userDataStr) return

		const userData: StoredUserData = JSON.parse(userDataStr)

		// Check if token is expired and refresh if needed
		await ensureValidToken(userData, env)

		// Process postmaster items for this user
		await processUserPostmaster(userData, env)
	})

	await Promise.allSettled(promises)
	console.log('Completed auto-vault process')
}

// Ensure the user has a valid token
async function ensureValidToken(
	userData: StoredUserData,
	env: Env,
): Promise<StoredUserData> {
	const now = Date.now()

	// If token is expired (with 5 min buffer), refresh it
	if (userData.expiresAt - 300000 < now) {
		try {
			const newToken = await refreshToken(
				userData.refreshToken,
				env.BUNGIE_CLIENT_ID,
				env.BUNGIE_CLIENT_SECRET,
			)

			// Update user data with new tokens
			userData.accessToken = newToken.access_token
			userData.refreshToken = newToken.refresh_token
			userData.expiresAt = now + newToken.expires_in * 1000

			// Save updated user data
			await env.AUTO_VAULT_USERS.put(userData.userId, JSON.stringify(userData))

			console.log(`Refreshed token for user ${userData.userId}`)
		} catch (error) {
			console.error(`Token refresh failed for user ${userData.userId}:`, error)
			// If refresh fails, we might need to remove the user or mark them as needing re-auth
		}
	}

	return userData
}

// Process a single user's postmaster items
async function processUserPostmaster(userData: StoredUserData, env: Env): Promise<void> {
	try {
		console.log(`Processing postmaster for user ${userData.userId}`)

		// Check if vault has space
		const hasSpace = await hasVaultSpace(
			env.BUNGIE_API_KEY,
			userData.accessToken,
			userData.membershipType,
			userData.membershipId,
		)

		if (!hasSpace) {
			console.log(`Vault is full for user ${userData.userId}, skipping`)
			return
		}

		// Get inventory data for all characters
		const inventory = await getInventory(
			env.BUNGIE_API_KEY,
			userData.accessToken,
			userData.membershipType,
			userData.membershipId,
		)

		// Process each character
		for (const character of userData.characters) {
			// Find postmaster items for this character
			const postmasterItems = inventory.items.postmaster.filter(item => {
				// In a real implementation, we would need to know which character each postmaster item belongs to
				// This is simplified for now
				return true
			})

			console.log(
				`Found ${postmasterItems.length} postmaster items for character ${character.characterId}`,
			)

			// Process each postmaster item
			for (const item of postmasterItems) {
				const success = await transferPostmasterItemToVault(
					env.BUNGIE_API_KEY,
					userData.accessToken,
					userData.membershipType,
					userData.membershipId,
					character.characterId,
					Number.parseInt(item.itemId),
					item.itemInstanceId,
					1, // Stack size, would need to get the actual quantity
				)

				if (success) {
					console.log(
						`Successfully moved item ${item.itemId} to vault for user ${userData.userId}`,
					)
				} else {
					console.log(
						`Failed to move item ${item.itemId} to vault for user ${userData.userId}`,
					)
				}
			}
		}
	} catch (error) {
		console.error(`Error processing postmaster for user ${userData.userId}:`, error)
	}
}

// Handle OAuth callback for user authentication
async function handleAuthCallback(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const code = url.searchParams.get('code')

	if (!code) {
		return new Response('Missing authorization code', { status: 400 })
	}

	try {
		// Exchange code for tokens
		const tokenResponse = await exchangeCodeForToken(code, env)

		// Get user data from Bungie
		const bungieUser = await getBungieUser(tokenResponse.access_token, env.BUNGIE_API_KEY)

		// Store user data
		const userData: StoredUserData = {
			userId: bungieUser.bungieNetUser.membershipId,
			accessToken: tokenResponse.access_token,
			refreshToken: tokenResponse.refresh_token,
			membershipType: bungieUser.destinyMemberships[0].membershipType,
			membershipId: bungieUser.destinyMemberships[0].membershipId,
			characters: bungieUser.characters || [],
			expiresAt: Date.now() + tokenResponse.expires_in * 1000,
		}

		await env.AUTO_VAULT_USERS.put(userData.userId, JSON.stringify(userData))

		// Redirect to success page
		return new Response('Authentication successful! You can close this page.', {
			status: 200,
			headers: {
				'Content-Type': 'text/html',
			},
		})
	} catch (error) {
		console.error('Auth error:', error)
		return new Response('Authentication failed', { status: 500 })
	}
}

// Exchange authorization code for access token
async function exchangeCodeForToken(code: string, env: Env): Promise<TokenResponse> {
	const tokenUrl = 'https://www.bungie.net/platform/app/oauth/token/'

	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		client_id: env.BUNGIE_CLIENT_ID,
		client_secret: env.BUNGIE_CLIENT_SECRET,
	})

	const response = await fetch(tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: body.toString(),
	})

	if (!response.ok) {
		throw new Error('Failed to exchange code for token')
	}

	return await response.json()
}

// Handle code exchange request for client applications
async function handleExchangeCode(request: Request, env: Env): Promise<Response> {
	// Only allow POST requests
	if (request.method !== 'POST') {
		return new Response(JSON.stringify({ error: 'Method not allowed' }), {
			status: 405,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	// Get the request body
	let requestData
	try {
		requestData = await request.json()
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	// Check for authorization code
	const { code } = requestData
	if (!code) {
		return new Response(JSON.stringify({ error: 'Missing authorization code' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	try {
		// Exchange code for tokens
		const tokenResponse = await exchangeCodeForToken(code, env)

		// Get user data from Bungie
		const bungieUser = await getBungieUser(tokenResponse.access_token, env.BUNGIE_API_KEY)

		// Store user data in KV
		const userData: StoredUserData = {
			userId: bungieUser.bungieNetUser.membershipId,
			accessToken: tokenResponse.access_token,
			refreshToken: tokenResponse.refresh_token,
			membershipType: bungieUser.destinyMemberships[0].membershipType,
			membershipId: bungieUser.destinyMemberships[0].membershipId,
			characters: bungieUser.characters || [],
			expiresAt: Date.now() + tokenResponse.expires_in * 1000,
		}

		await env.AUTO_VAULT_USERS.put(userData.userId, JSON.stringify(userData))

		// Return the token and user info to the client
		return new Response(
			JSON.stringify({
				access_token: tokenResponse.access_token,
				// expires_in: tokenResponse.expires_in,
				// membership_id: bungieUser.bungieNetUser.membershipId,
				// display_name: bungieUser.bungieNetUser.displayName,
				// destiny_memberships: bungieUser.destinyMemberships,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'no-store',
				},
			},
		)
	} catch (error) {
		console.error('Token exchange error:', error)
		return new Response(JSON.stringify({ error: 'Failed to exchange code for token' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}

// Handle status request
async function handleStatusRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const userId = url.searchParams.get('userId')

	if (!userId) {
		return new Response('Missing user ID', { status: 400 })
	}

	const userData = await env.AUTO_VAULT_USERS.get(userId)

	if (!userData) {
		return new Response(JSON.stringify({ authenticated: false }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}

	return new Response(JSON.stringify({ authenticated: true }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	})
}
