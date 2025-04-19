import { getPostmasterItems, hasVaultSpace, transferItemToVault } from './bungie'
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

		// Handle auth callback (not implemented in this example)
		if (url.pathname === '/api/auth/callback') {
			return new Response(JSON.stringify({ status: 'authorized' }), {
				headers: { 'Content-Type': 'application/json' },
			})
		}

		return new Response('Not found', { status: 404 })
	},
}