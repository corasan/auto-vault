import { 
	getPostmasterItems, 
	hasVaultSpace, 
	transferItemToVault, 
	exchangeCodeForToken,
	getBungieUser
} from './bungie'
import { Item, ItemType } from './types'

export interface Env {
	// KV Namespace for storing user data
	USERS_KV: KVNamespace
	
	// Environment variables
	BUNGIE_API_KEY: string
	BUNGIE_CLIENT_ID: string
	BUNGIE_CLIENT_SECRET: string
	
	// Not used in this example, but would be needed for production
	// BUNGIE_AUTH_URL: string
	// BUNGIE_API_URL: string
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)
		
		// Health check endpoint
		if (url.pathname === '/api/health') {
			return new Response(JSON.stringify({ status: 'ok' }), {
				headers: { 'Content-Type': 'application/json' },
			})
		}

		// Handle Bungie API endpoint
		if (url.pathname === '/api/vault-postmaster-items') {
			try {
				// This would extract from request/KV/etc in production
				const token = 'mock-token'
				const destinyMembershipId = 'mock-membership-id'
				const characterId = 'mock-character-id'
				
				// Check if vault has space
				const hasSpace = await hasVaultSpace(token, destinyMembershipId)
				
				if (!hasSpace) {
					return new Response(
						JSON.stringify({ error: 'Vault is full', code: 'VAULT_FULL' }),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json' },
						}
					)
				}
				
				// Get postmaster items
				const items = await getPostmasterItems(token, destinyMembershipId, characterId)
				
				// Only transfer weapons and armor
				const transferableItems = items.filter(
					item => item.itemType === ItemType.Weapon || item.itemType === ItemType.Armor
				)
				
				// Transfer each item
				const results = await Promise.all(
					transferableItems.map(item => 
						transferItemToVault(token, item.itemInstanceId, characterId)
					)
				)
				
				const successCount = results.filter(Boolean).length
				
				return new Response(
					JSON.stringify({
						success: true,
						transferred: successCount,
						total: transferableItems.length,
					}),
					{
						headers: { 'Content-Type': 'application/json' },
					}
				)
			} catch (error) {
				console.error('Error transferring postmaster items:', error)
				
				return new Response(
					JSON.stringify({ 
						error: 'Failed to transfer postmaster items',
						message: error instanceof Error ? error.message : 'Unknown error' 
					}),
					{
						status: 500,
						headers: { 'Content-Type': 'application/json' },
					}
				)
			}
		}

		// Token exchange endpoint
		if (url.pathname === '/api/auth/token' && request.method === 'POST') {
			try {
				const body = await request.json();
				
				if (!body.code) {
					return new Response(
						JSON.stringify({ error: 'Missing authorization code' }),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}
				
				// Exchange code for token
				const tokenResponse = await exchangeCodeForToken(
					env,
					body.code,
					body.redirect_uri || 'autovault://auth'
				);
				
				return new Response(JSON.stringify(tokenResponse), {
					headers: { 'Content-Type': 'application/json' },
				});
			} catch (error) {
				console.error('Error exchanging token:', error);
				
				return new Response(
					JSON.stringify({
						error: 'Failed to exchange token',
						message: error instanceof Error ? error.message : 'Unknown error',
					}),
					{
						status: 500,
						headers: { 'Content-Type': 'application/json' },
					}
				);
			}
		}
		
		// Get user profile endpoint
		if (url.pathname === '/api/auth/user') {
			try {
				// Get token from Authorization header
				const authHeader = request.headers.get('Authorization');
				
				if (!authHeader || !authHeader.startsWith('Bearer ')) {
					return new Response(
						JSON.stringify({ error: 'Missing or invalid authorization header' }),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}
				
				const token = authHeader.substring(7);
				
				// Get user profile
				const userProfile = await getBungieUser(env, token);
				
				return new Response(JSON.stringify(userProfile), {
					headers: { 'Content-Type': 'application/json' },
				});
			} catch (error) {
				console.error('Error getting user profile:', error);
				
				return new Response(
					JSON.stringify({
						error: 'Failed to get user profile',
						message: error instanceof Error ? error.message : 'Unknown error',
					}),
					{
						status: 500,
						headers: { 'Content-Type': 'application/json' },
					}
				);
			}
		}

		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			});
		}

		return new Response('Not found', { status: 404 })
	},
}