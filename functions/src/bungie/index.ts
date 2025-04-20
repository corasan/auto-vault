import type { DestinyItem, InventoryResponse, TokenResponse } from '../types'

// Constants for Bungie API
const BUNGIE_API_BASE = 'https://www.bungie.net/Platform'
const BUNGIE_API_AUTH_BASE = 'https://www.bungie.net/en/OAuth/Authorize'
const BUNGIE_TOKEN_URL = 'https://www.bungie.net/platform/app/oauth/token/'
const MEMBERSHIP_TYPE_ALL = '-1'

interface BungieApiOptions {
	apiKey: string
	accessToken?: string
}

// Helper function to make API requests to Bungie
async function bungieApiRequest(
	endpoint: string,
	options: BungieApiOptions,
	method = 'GET',
	body?: any,
): Promise<any> {
	const headers = new Headers({
		'X-API-Key': options.apiKey,
		'Content-Type': 'application/json',
	})

	if (options.accessToken) {
		headers.append('Authorization', `Bearer ${options.accessToken}`)
	}

	const response = await fetch(`${BUNGIE_API_BASE}${endpoint}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	})

	if (!response.ok) {
		const errorData = await response.json()
		throw new Error(`Bungie API Error: ${errorData.ErrorStatus || response.statusText}`)
	}

	return response.json()
}

// Get user information
export async function getBungieUser(accessToken: string, apiKey: string): Promise<any> {
	const response = await bungieApiRequest('/User/GetMembershipsForCurrentUser/', {
		apiKey,
		accessToken,
	})
	return response.Response
}

// Refresh the user's access token
export async function refreshToken(
	refreshToken: string,
	clientId: string,
	clientSecret: string,
): Promise<TokenResponse> {
	const body = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: refreshToken,
		client_id: clientId,
		client_secret: clientSecret,
	})

	const response = await fetch(BUNGIE_TOKEN_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: body.toString(),
	})

	if (!response.ok) {
		throw new Error('Failed to refresh token')
	}

	const data = await response.json()
	return data as TokenResponse
}

// Get the inventory for a specific character
export async function getInventory(
	apiKey: string,
	accessToken: string,
	membershipType: number,
	membershipId: string,
): Promise<InventoryResponse> {
	// Get profile data with inventory components
	const components = [
		'100', // Profile
		'102', // ProfileInventories
		'201', // CharacterInventories
		'205', // CharacterEquipment
		'300', // ItemInstances
		'301', // ItemObjectives
		'303', // ItemPerks
		'304', // ItemRenderData
		'307', // ItemTalentGrids
		'309', // ItemSockets
	].join(',')

	const profileResponse = await bungieApiRequest(
		`/Destiny2/${membershipType}/Profile/${membershipId}/?components=${components}`,
		{ apiKey, accessToken },
	)

	const { profileInventory, characterInventories, characters } = processProfileData(
		profileResponse.Response,
	)

	return {
		characters: Object.values(characters),
		items: {
			inventory: characterInventories,
			postmaster: getPostmasterItems(profileResponse.Response),
			vault: getVaultItems(profileResponse.Response),
		},
	}
}

// Process profile data to extract inventory
function processProfileData(profileData: any) {
	const characters: Record<string, any> = {}
	const characterInventories: DestinyItem[] = []
	const profileInventory: DestinyItem[] = []

	// Process character data
	if (profileData.characters?.data) {
		Object.entries(profileData.characters.data).forEach(
			([characterId, data]: [string, any]) => {
				characters[characterId] = {
					characterId,
					classType: getClassName(data.classType),
					light: data.light,
					emblemPath: data.emblemPath,
					dateLastPlayed: data.dateLastPlayed,
				}
			},
		)
	}

	return {
		profileInventory,
		characterInventories,
		characters,
	}
}

// Get class name from class type
function getClassName(classType: number): string {
	switch (classType) {
		case 0:
			return 'Titan'
		case 1:
			return 'Hunter'
		case 2:
			return 'Warlock'
		default:
			return 'Unknown'
	}
}

// Get items in the postmaster
export function getPostmasterItems(profileData: any): DestinyItem[] {
	const postmasterItems: DestinyItem[] = []
	const itemDefinitions = profileData.itemComponents?.instances?.data || {}

	// Postmaster bucket hash
	const POSTMASTER_BUCKET_HASH = 215593132

	// Process character inventories
	if (profileData.characterInventories?.data) {
		Object.entries(profileData.characterInventories.data).forEach(
			([characterId, data]: [string, any]) => {
				const items = data.items || []

				items.forEach((item: any) => {
					if (item.bucketHash === POSTMASTER_BUCKET_HASH) {
						postmasterItems.push({
							itemId: item.itemHash.toString(),
							itemInstanceId: item.itemInstanceId,
							name: `Item ${item.itemHash}`, // This would be replaced with actual item name from definitions
							icon: `/img/destiny_content/icons/${item.itemHash}.jpg`, // Placeholder
							itemType: getItemType(item.itemHash),
							tierType: getItemTier(item.itemHash),
							location: 'postmaster',
							bucketHash: item.bucketHash,
						})
					}
				})
			},
		)
	}

	return postmasterItems
}

// Get items in the vault
export function getVaultItems(profileData: any): DestinyItem[] {
	const vaultItems: DestinyItem[] = []

	// Vault bucket hashes
	const VAULT_BUCKET_HASHES = [
		138197802, // General
		2465295065, // Weapons
		3448274439, // Armor
	]

	// Process profile inventory (vault is in profile inventory)
	if (profileData.profileInventory?.data?.items) {
		profileData.profileInventory.data.items.forEach((item: any) => {
			if (VAULT_BUCKET_HASHES.includes(item.bucketHash)) {
				vaultItems.push({
					itemId: item.itemHash.toString(),
					itemInstanceId: item.itemInstanceId,
					name: `Item ${item.itemHash}`, // This would be replaced with actual item name from definitions
					icon: `/img/destiny_content/icons/${item.itemHash}.jpg`, // Placeholder
					itemType: getItemType(item.itemHash),
					tierType: getItemTier(item.itemHash),
					location: 'vault',
					bucketHash: item.bucketHash,
				})
			}
		})
	}

	return vaultItems
}

// Placeholder functions for item metadata (would use manifest in full implementation)
function getItemType(itemHash: number): string {
	// Would use manifest to get actual item type
	return 'Unknown'
}

function getItemTier(itemHash: number): string {
	// Would use manifest to get actual item tier
	return 'Unknown'
}

// Transfer item from postmaster to vault
export async function transferPostmasterItemToVault(
	apiKey: string,
	accessToken: string,
	membershipType: number,
	membershipId: string,
	characterId: string,
	itemReferenceHash: number,
	itemId: string,
	stackSize: number,
): Promise<boolean> {
	try {
		// First pull from postmaster to character inventory
		await bungieApiRequest(
			'/Destiny2/Actions/Items/PullFromPostmaster/',
			{ apiKey, accessToken },
			'POST',
			{
				itemReferenceHash,
				itemId,
				characterId,
				membershipType,
				stackSize,
			},
		)

		// Then transfer from character to vault
		await bungieApiRequest(
			'/Destiny2/Actions/Items/TransferItem/',
			{ apiKey, accessToken },
			'POST',
			{
				itemReferenceHash,
				itemId,
				characterId,
				membershipType,
				transferToVault: true,
				stackSize,
			},
		)

		return true
	} catch (error) {
		console.error('Error transferring item:', error)
		return false
	}
}

// Check if vault has space
export async function hasVaultSpace(
	apiKey: string,
	accessToken: string,
	membershipType: number,
	membershipId: string,
): Promise<boolean> {
	const inventory = await getInventory(apiKey, accessToken, membershipType, membershipId)

	// Vault has a limit of 500 items
	const VAULT_LIMIT = 500

	// Count items currently in vault
	const vaultItemCount = inventory.items.vault.length

	return vaultItemCount < VAULT_LIMIT
}
