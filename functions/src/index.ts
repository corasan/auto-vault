import { 
	getPostmasterItems, 
	hasVaultSpace, 
	transferItemToVault, 
	exchangeCodeForToken,
	getBungieUser,
	processProfileResponse
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
				// Get token from Authorization header
				const authHeader = request.headers.get('Authorization')
				
				if (!authHeader || !authHeader.startsWith('Bearer ')) {
					return new Response(
						JSON.stringify({ error: 'Missing or invalid authorization header' }),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						}
					)
				}
				
				const token = authHeader.substring(7)
				const requestBody = await request.json()
				const { characterId, membershipType, destinyMembershipId } = requestBody
				
				if (!characterId || !membershipType || !destinyMembershipId) {
					return new Response(
						JSON.stringify({ error: 'Missing required parameters' }),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json' },
						}
					)
				}
				
				// Check if vault has space
				const hasSpace = await hasVaultSpace(token, destinyMembershipId, membershipType, env.BUNGIE_API_KEY)
				
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
				const items = await getPostmasterItems(token, destinyMembershipId, characterId, membershipType, env.BUNGIE_API_KEY)
				
				// Only transfer weapons and armor
				const transferableItems = items.filter(
					item => item.itemType === ItemType.Weapon || item.itemType === ItemType.Armor
				)
				
				// Transfer each item
				const results = await Promise.all(
					transferableItems.map(item => 
						transferItemToVault(token, item.itemHash, item.itemInstanceId, characterId, membershipType, env.BUNGIE_API_KEY)
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
		
		// Bungie API endpoints - these make actual Bungie API calls
		if (url.pathname === '/api/destiny2/profile' && request.method === 'POST') {
			try {
				// Get token from Authorization header
				const authHeader = request.headers.get('Authorization')
				
				if (!authHeader || !authHeader.startsWith('Bearer ')) {
					return new Response(
						JSON.stringify({ error: 'Missing or invalid authorization header' }),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						}
					)
				}
				
				const token = authHeader.substring(7)
				const body = await request.json()
				
				if (!body.destinyMembershipId || !body.membershipType || !body.components) {
					return new Response(
						JSON.stringify({ error: 'Missing required parameters' }),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json' },
						}
					)
				}
				
				// Get membership info from body
				const { destinyMembershipId, membershipType, components } = body
				
				// Call the Bungie API to get profile data
				const url = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${destinyMembershipId}/?components=${components.join(',')}`
				
				const bungieResponse = await fetch(url, {
					headers: {
						'Authorization': `Bearer ${token}`,
						'X-API-Key': env.BUNGIE_API_KEY
					}
				})
				
				if (!bungieResponse.ok) {
					const error = await bungieResponse.json()
					throw new Error(`Bungie API error: ${error.Message || bungieResponse.statusText}`)
				}
				
				// Process the Bungie response into our app's format
				const bungieData = await bungieResponse.json()
				const processedData = processProfileResponse(bungieData.Response)
				
				return new Response(JSON.stringify(processedData), {
					headers: { 'Content-Type': 'application/json' },
				})
			} catch (error) {
				console.error('Error getting Destiny profile:', error)
				
				return new Response(
					JSON.stringify({
						error: 'Failed to get Destiny profile',
						message: error instanceof Error ? error.message : 'Unknown error',
					}),
					{
						status: 500,
						headers: { 'Content-Type': 'application/json' },
					}
				)
			}
		}
		
		if (url.pathname === '/api/destiny2/transfer-item' && request.method === 'POST') {
			try {
				// Get token from Authorization header
				const authHeader = request.headers.get('Authorization')
				
				if (!authHeader || !authHeader.startsWith('Bearer ')) {
					return new Response(
						JSON.stringify({ error: 'Missing or invalid authorization header' }),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						}
					)
				}
				
				const token = authHeader.substring(7)
				const body = await request.json()
				
				if (!body.itemReferenceHash || !body.itemId || !body.characterId || body.transferToVault === undefined || !body.membershipType) {
					return new Response(
						JSON.stringify({ error: 'Missing required parameters' }),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json' },
						}
					)
				}
				
				// Call Bungie's TransferItem API
				const url = 'https://www.bungie.net/Platform/Destiny2/Actions/Items/TransferItem/'
				
				const payload = {
					itemReferenceHash: body.itemReferenceHash,
					itemId: body.itemId,
					characterId: body.characterId,
					transferToVault: body.transferToVault,
					stackSize: body.stackSize || 1,
					membershipType: body.membershipType
				}
				
				const bungieResponse = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
						'X-API-Key': env.BUNGIE_API_KEY
					},
					body: JSON.stringify(payload)
				})
				
				if (!bungieResponse.ok) {
					const error = await bungieResponse.json()
					throw new Error(`Bungie API error: ${error.Message || bungieResponse.statusText}`)
				}
				
				const data = await bungieResponse.json()
				return new Response(JSON.stringify(data.ErrorCode === 1), {
					headers: { 'Content-Type': 'application/json' },
				})
			} catch (error) {
				console.error('Error transferring item:', error)
				
				return new Response(
					JSON.stringify({
						error: 'Failed to transfer item',
						message: error instanceof Error ? error.message : 'Unknown error',
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
				console.log('Handling /api/auth/user request')
				
				// Get token from Authorization header
				const authHeader = request.headers.get('Authorization');
				console.log(`Authorization header present: ${!!authHeader}`)
				
				if (!authHeader) {
					return new Response(
						JSON.stringify({ error: 'Missing authorization header' }),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}
				
				if (!authHeader.startsWith('Bearer ')) {
					console.log('Invalid authorization header format')
					return new Response(
						JSON.stringify({ error: 'Invalid authorization header format. Expected: Bearer [token]' }),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}
				
				const token = authHeader.substring(7);
				console.log(`Token length: ${token.length}`)
				
				if (!token || token.trim() === '') {
					return new Response(
						JSON.stringify({ error: 'Empty authorization token' }),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}
				
				// Check that the API key is available
				if (!env.BUNGIE_API_KEY) {
					console.error('Missing BUNGIE_API_KEY in environment variables')
					return new Response(
						JSON.stringify({ error: 'Server configuration error: Missing API key' }),
						{
							status: 500,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}
				
				console.log('Calling getBungieUser function with token and API key')
				// Get user profile
				const userProfile = await getBungieUser(env, token);
				console.log('Successfully retrieved Bungie user profile')
				
				return new Response(JSON.stringify(userProfile), {
					headers: { 'Content-Type': 'application/json' },
				});
			} catch (error) {
				console.error('Error getting user profile:', error);
				
				// Determine if this is an auth error
				let statusCode = 500;
				if (error instanceof Error && 
					(error.message.includes('401') || 
					 error.message.includes('unauthorized') || 
					 error.message.toLowerCase().includes('auth'))) {
					statusCode = 401;
				}
				
				return new Response(
					JSON.stringify({
						error: 'Failed to get user profile',
						message: error instanceof Error ? error.message : 'Unknown error',
						status: statusCode
					}),
					{
						status: statusCode,
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