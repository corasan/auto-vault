import type { BungieUserResponse, Item, TokenResponse } from '../types'

/**
 * Fetches all items in the player's postmaster
 *
 * @param token Bungie API token
 * @param destinyMembershipId The player's Destiny membership ID
 * @param characterId The character ID
 * @returns A list of items in the postmaster
 */
export async function getPostmasterItems(
	token: string,
	destinyMembershipId: string,
	characterId: string,
): Promise<Item[]> {
	// This would be implemented to fetch from the Bungie API
	// https://bungie-net.github.io/multi/operation_get_Destiny2-GetPostGameCarnageReport.html

	console.log(`Fetching postmaster items for character ${characterId}`)

	// Mock implementation
	return []
}

/**
 * Transfers an item to the vault
 *
 * @param token Bungie API token
 * @param itemId The item ID to transfer
 * @param characterId The character ID
 * @returns Success status
 */
export async function transferItemToVault(
	token: string,
	itemId: string,
	characterId: string,
): Promise<boolean> {
	// This would be implemented to call the Bungie API transfer endpoint
	// https://bungie-net.github.io/multi/operation_post_Destiny2-TransferItem.html

	console.log(`Transferring item ${itemId} to vault from character ${characterId}`)

	// Mock implementation
	return true
}

/**
 * Checks if vault has space for more items
 *
 * @param token Bungie API token
 * @param destinyMembershipId The player's Destiny membership ID
 * @returns Whether there is space in the vault
 */
export async function hasVaultSpace(
	token: string,
	destinyMembershipId: string,
): Promise<boolean> {
	// Mock implementation
	return true
}

/**
 * Exchange authorization code for an access token
 *
 * @param env Environment variables
 * @param code Authorization code received from Bungie
 * @param redirectUri The redirect URI registered with Bungie
 * @returns Token response
 */
export async function exchangeCodeForToken(
	env: { BUNGIE_CLIENT_ID: string; BUNGIE_CLIENT_SECRET: string },
	code: string,
	redirectUri: string,
): Promise<TokenResponse> {
	const tokenUrl = 'https://www.bungie.net/platform/app/oauth/token/'

	const body = new URLSearchParams()
	body.append('grant_type', 'authorization_code')
	body.append('code', code)
	body.append('client_id', env.BUNGIE_CLIENT_ID)

	// Use client_secret in production
	if (env.BUNGIE_CLIENT_SECRET) {
		body.append('client_secret', env.BUNGIE_CLIENT_SECRET)
	}

	body.append('redirect_uri', redirectUri)

	const response = await fetch(tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: body.toString(),
	})

	if (!response.ok) {
		const error: Record<string, string> = await response.json()
		throw new Error(
			`Failed to exchange code: ${error.error_description || error.error || response.statusText}`,
		)
	}

	return response.json()
}

/**
 * Get Bungie user profile information
 *
 * @param env Environment variables
 * @param accessToken Bungie access token
 * @returns User profile information
 */
export async function getBungieUser(
	env: { BUNGIE_API_KEY: string },
	accessToken: string,
): Promise<BungieUserResponse> {
	const response = await fetch(
		'https://www.bungie.net/Platform/User/GetCurrentBungieNetUser/',
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'X-API-Key': env.BUNGIE_API_KEY,
			},
		},
	)

	if (!response.ok) {
		const error: Record<string, string> = await response.json()
		throw new Error(`Failed to get user: ${error.Message || response.statusText}`)
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const data: Record<string, any> = await response.json()
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const user = data.Response as Record<string, any>

	return {
		membershipId: user.membershipId,
		displayName: user.displayName,
		profilePicture: user.profilePicturePath
			? `https://www.bungie.net${user.profilePicturePath}`
			: undefined,
	}
}
