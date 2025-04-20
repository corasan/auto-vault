import type { BungieUserResponse, DestinyCharacter, DestinyItem, InventoryResponse, Item, TokenResponse } from '../types'

/**
 * Fetches all items in the player's postmaster
 *
 * @param token Bungie API token
 * @param destinyMembershipId The player's Destiny membership ID
 * @param characterId The character ID
 * @param membershipType The membership type (e.g., 1 for Xbox, 2 for PSN, 3 for Steam)
 * @param apiKey Bungie API key
 * @returns A list of items in the postmaster
 */
export async function getPostmasterItems(
	token: string,
	destinyMembershipId: string,
	characterId: string,
	membershipType: number,
	apiKey: string,
): Promise<Item[]> {
	console.log(`Fetching postmaster items for character ${characterId}`)

	// Get character inventory components from Bungie API
	const url = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${destinyMembershipId}/Character/${characterId}/?components=201,205,300,301,304`
	
	const response = await fetch(url, {
		headers: {
			'Authorization': `Bearer ${token}`,
			'X-API-Key': apiKey
		}
	})

	if (!response.ok) {
		throw new Error(`Failed to fetch postmaster items: ${response.status} ${response.statusText}`)
	}

	const data = await response.json()
	const items: Item[] = []

	// Parse the response to extract postmaster items
	// Real implementation would parse the Bungie API response and extract postmaster items
	// This requires checking the bucket hash for postmaster (4046403665)
	const postmasterBucketHash = '4046403665'
	
	// Process items - this is simplified and would need to be expanded in a real implementation
	if (data.Response && 
		data.Response.inventory && 
		data.Response.inventory.data && 
		data.Response.inventory.data.items) {
		
		const characterItems = data.Response.inventory.data.items
		const itemInstances = data.Response.itemComponents.instances.data || {}
		
		// Filter for postmaster items
		const postmasterItems = characterItems.filter((item: any) => 
			item.bucketHash.toString() === postmasterBucketHash
		)
		
		// Convert to our Item format
		for (const item of postmasterItems) {
			const instance = itemInstances[item.itemInstanceId] || {}
			
			items.push({
				itemInstanceId: item.itemInstanceId,
				itemHash: item.itemHash,
				quantity: item.quantity,
				bucketHash: item.bucketHash,
				itemType: instance.itemType || 0,
				isEquipped: item.isEquipped || false
			})
		}
	}
	
	return items
}

/**
 * Transfers an item to the vault
 *
 * @param token Bungie API token
 * @param itemReferenceHash The item reference hash
 * @param itemId The item instance ID to transfer
 * @param characterId The character ID
 * @param membershipType The membership type (e.g., 1 for Xbox, 2 for PSN, 3 for Steam)
 * @param apiKey Bungie API key
 * @returns Success status
 */
export async function transferItemToVault(
	token: string,
	itemReferenceHash: number,
	itemId: string,
	characterId: string,
	membershipType: number,
	apiKey: string,
): Promise<boolean> {
	console.log(`Transferring item ${itemId} to vault from character ${characterId}`)

	// Use Bungie's TransferItem endpoint
	const url = 'https://www.bungie.net/Platform/Destiny2/Actions/Items/TransferItem/'
	
	const payload = {
		itemReferenceHash,
		itemId,
		characterId,
		transferToVault: true,
		stackSize: 1,
		membershipType
	}
	
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
			'X-API-Key': apiKey
		},
		body: JSON.stringify(payload)
	})

	if (!response.ok) {
		const errorData = await response.json()
		console.error('Transfer error:', errorData)
		throw new Error(`Failed to transfer item: ${response.status} ${response.statusText}`)
	}

	const data = await response.json()
	return data.Response && data.ErrorCode === 1
}

/**
 * Checks if vault has space for more items
 *
 * @param token Bungie API token
 * @param destinyMembershipId The player's Destiny membership ID
 * @param membershipType The membership type (e.g., 1 for Xbox, 2 for PSN, 3 for Steam)
 * @param apiKey Bungie API key
 * @returns Whether there is space in the vault
 */
export async function hasVaultSpace(
	token: string,
	destinyMembershipId: string,
	membershipType: number,
	apiKey: string,
): Promise<boolean> {
	// The vault capacity in Destiny 2 is 500 items
	const VAULT_CAPACITY = 500

	// Get profile inventory to check vault space
	const url = `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${destinyMembershipId}/?components=102,201`
	
	const response = await fetch(url, {
		headers: {
			'Authorization': `Bearer ${token}`,
			'X-API-Key': apiKey
		}
	})

	if (!response.ok) {
		throw new Error(`Failed to check vault space: ${response.status} ${response.statusText}`)
	}

	const data = await response.json()
	
	// Count items in the vault bucket (hash: 138197802)
	let vaultItemCount = 0
	
	// Check profile inventories
	if (data.Response && 
		data.Response.profileInventory && 
		data.Response.profileInventory.data && 
		data.Response.profileInventory.data.items) {
		
		// Count items in the vault buckets
		const vaultItems = data.Response.profileInventory.data.items.filter(
			(item: any) => [
				138197802,  // General vault
				2973005342, // Weapons vault
				3448274439, // Armor vault
				1469714392  // General items vault
			].includes(item.bucketHash)
		)
		
		vaultItemCount = vaultItems.length
	}
	
	console.log(`Vault contains ${vaultItemCount}/${VAULT_CAPACITY} items`)
	return vaultItemCount < VAULT_CAPACITY
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

	// Client secret is required for production
	if (env.BUNGIE_CLIENT_SECRET) {
		body.append('client_secret', env.BUNGIE_CLIENT_SECRET)
	}

	body.append('redirect_uri', redirectUri)

	try {
		const response = await fetch(tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: body.toString(),
		})

		const data = await response.json()

		if (!response.ok) {
			console.error('Token exchange error:', data)
			throw new Error(
				`Failed to exchange code: ${data.error_description || data.error || response.statusText}`,
			)
		}

		console.log('Successfully obtained access token')
		return data
	} catch (error) {
		console.error('Error in exchangeCodeForToken:', error)
		throw error
	}
}

/**
 * Get Bungie user profile information and linked platform memberships
 *
 * @param env Environment variables
 * @param accessToken Bungie access token
 * @returns User profile information including platform-specific membership IDs
 */
export async function getBungieUser(
	env: { BUNGIE_API_KEY: string },
	accessToken: string,
): Promise<BungieUserResponse> {
	console.log("Getting Bungie user profile with access token")
	
	// Make sure we have a valid API key and token
	if (!env.BUNGIE_API_KEY) {
		throw new Error("Missing Bungie API key")
	}
	
	if (!accessToken) {
		throw new Error("Missing access token")
	}
	
	try {
		// Step 1: Get the Bungie.net user profile
		console.log("Fetching Bungie.net user profile")
		const response = await fetch(
			'https://www.bungie.net/Platform/User/GetCurrentBungieNetUser/',
			{
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'X-API-Key': env.BUNGIE_API_KEY,
				},
			},
		)
		
		console.log(`Bungie User API response status: ${response.status} ${response.statusText}`)
		
		// Get the response body even if it's an error
		const data = await response.json()
		
		// Log error details if the response was not successful
		if (!response.ok) {
			console.error('Error response from Bungie API:', data)
			throw new Error(`Failed to get user: ${data.Message || response.statusText} (Status: ${response.status})`)
		}

		// Process successful response
		if (!data.Response) {
			console.error('Unexpected response format from Bungie API:', data)
			throw new Error('Unexpected response format from Bungie API')
		}

		const user = data.Response
		const bungieNetMembershipId = user.membershipId
		
		// Step 2: Get the linked platform accounts (Destiny memberships)
		console.log(`Fetching linked platform accounts for Bungie.net ID: ${bungieNetMembershipId}`)
		const membershipResponse = await fetch(
			`https://www.bungie.net/Platform/Destiny2/254/Profile/${bungieNetMembershipId}/LinkedProfiles/`,
			{
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'X-API-Key': env.BUNGIE_API_KEY,
				},
			},
		)
		
		if (!membershipResponse.ok) {
			const membershipError = await membershipResponse.json()
			console.error('Error fetching linked profiles:', membershipError)
			throw new Error(`Failed to get linked profiles: ${membershipError.Message || membershipResponse.statusText}`)
		}
		
		const membershipData = await membershipResponse.json()
		
		// Get the platform memberships
		const platformMemberships = membershipData.Response?.profiles || []
		console.log(`Found ${platformMemberships.length} linked platform account(s)`)
		
		// Create a map of platform type to membership ID
		const platformMembershipsMap = platformMemberships.reduce((acc, profile) => {
			acc[profile.membershipType] = profile.membershipId
			return acc
		}, {})
		
		// Log the available platforms
		console.log('Available platforms:')
		Object.entries(platformMembershipsMap).forEach(([type, id]) => {
			console.log(`Platform ${type}: ${id}`)
		})
		
		// Default to the most recently played platform
		let primaryMembershipType = null
		let primaryMembershipId = null
		let lastPlayedCharacterId = null
		
		if (platformMemberships.length > 0) {
			// Sort by dateLastPlayed to find the most recent
			const sortedProfiles = [...platformMemberships].sort((a, b) => {
				const dateA = new Date(a.dateLastPlayed || 0)
				const dateB = new Date(b.dateLastPlayed || 0)
				return dateB.getTime() - dateA.getTime()
			})
			
			primaryMembershipType = sortedProfiles[0].membershipType
			primaryMembershipId = sortedProfiles[0].membershipId
			
			console.log(`Selected primary platform: ${primaryMembershipType} with ID: ${primaryMembershipId}`)
			
			// Try to get the last played character
			if (membershipData.Response?.characters?.length > 0) {
				// Sort characters by dateLastPlayed
				const sortedCharacters = [...membershipData.Response.characters].sort((a, b) => {
					const dateA = new Date(a.dateLastPlayed || 0)
					const dateB = new Date(b.dateLastPlayed || 0)
					return dateB.getTime() - dateA.getTime()
				})
				
				lastPlayedCharacterId = sortedCharacters[0].characterId
				console.log(`Last played character ID: ${lastPlayedCharacterId}`)
			}
		}
		
		return {
			membershipId: bungieNetMembershipId,
			displayName: user.displayName,
			profilePicture: user.profilePicturePath
				? `https://www.bungie.net${user.profilePicturePath}`
				: undefined,
			// Add platform-specific membership IDs
			platformMemberships: platformMembershipsMap,
			primaryMembershipType,
			primaryMembershipId,
			lastPlayedCharacterId,
		}
	} catch (error) {
		console.error('Failed to fetch Bungie user:', error)
		throw error
	}
}

/**
 * Process Bungie API response and transform it into our app's InventoryResponse format
 * 
 * @param profileResponse The response from Bungie's GetProfile API
 * @returns Formatted inventory response for our app
 */
export function processProfileResponse(profileResponse: any): InventoryResponse {
  const characters: DestinyCharacter[] = [];
  const inventoryItems: DestinyItem[] = [];
  const postmasterItems: DestinyItem[] = [];
  const vaultItems: DestinyItem[] = [];
  
  // Extract character data
  if (profileResponse.characters && profileResponse.characters.data) {
    Object.values(profileResponse.characters.data).forEach((char: any) => {
      characters.push({
        characterId: char.characterId,
        classType: getClassType(char.classType),
        light: char.light,
        emblemPath: `https://www.bungie.net${char.emblemPath}`,
        dateLastPlayed: char.dateLastPlayed
      });
    });
  }
  
  // Process all item instances
  const itemInstances: Record<string, any> = profileResponse.itemComponents?.instances?.data || {};
  const itemDefinitions: Record<string, any> = {}; // In a real app, you'd use the Destiny Manifest
  
  // Process character inventories
  if (profileResponse.characterInventories && profileResponse.characterInventories.data) {
    Object.entries(profileResponse.characterInventories.data).forEach(([characterId, inventory]: [string, any]) => {
      inventory.items.forEach((item: any) => {
        // Check if it's a postmaster item (bucket hash 4046403665)
        const isPostmaster = item.bucketHash === 4046403665;
        const instance = itemInstances[item.itemInstanceId];
        const definition = itemDefinitions[item.itemHash] || {};
        
        const processedItem: DestinyItem = {
          itemId: item.itemHash.toString(),
          itemInstanceId: item.itemInstanceId,
          name: definition.displayProperties?.name || `Item ${item.itemHash}`,
          description: definition.displayProperties?.description,
          icon: definition.displayProperties?.icon ? `https://www.bungie.net${definition.displayProperties.icon}` : '',
          itemType: instance?.itemType === 3 ? 'Weapon' : 'Armor',
          itemSubType: instance?.itemSubType,
          tierType: getTierType(instance?.tierType) || 'Common',
          power: instance?.primaryStat?.value,
          location: isPostmaster ? 'postmaster' : 'inventory',
          bucketHash: item.bucketHash
        };
        
        if (isPostmaster) {
          postmasterItems.push(processedItem);
        } else {
          inventoryItems.push(processedItem);
        }
      });
    });
  }
  
  // Process vault items (profileInventory contains vault items)
  if (profileResponse.profileInventory && profileResponse.profileInventory.data) {
    const vaultBucketHashes = [138197802, 2973005342, 3448274439, 1469714392];
    
    profileResponse.profileInventory.data.items.forEach((item: any) => {
      if (vaultBucketHashes.includes(item.bucketHash)) {
        const instance = itemInstances[item.itemInstanceId];
        const definition = itemDefinitions[item.itemHash] || {};
        
        vaultItems.push({
          itemId: item.itemHash.toString(),
          itemInstanceId: item.itemInstanceId,
          name: definition.displayProperties?.name || `Item ${item.itemHash}`,
          description: definition.displayProperties?.description,
          icon: definition.displayProperties?.icon ? `https://www.bungie.net${definition.displayProperties.icon}` : '',
          itemType: instance?.itemType === 3 ? 'Weapon' : 'Armor',
          itemSubType: instance?.itemSubType,
          tierType: getTierType(instance?.tierType) || 'Common',
          power: instance?.primaryStat?.value,
          location: 'vault',
          bucketHash: item.bucketHash
        });
      }
    });
  }
  
  return {
    characters,
    items: {
      inventory: inventoryItems,
      postmaster: postmasterItems,
      vault: vaultItems
    }
  };
}

/**
 * Convert Bungie's class type number to string
 */
function getClassType(classType: number): string {
  const classTypes: Record<number, string> = {
    0: 'Titan',
    1: 'Hunter',
    2: 'Warlock'
  };
  return classTypes[classType] || 'Unknown';
}

/**
 * Convert Bungie's tier type number to string
 */
function getTierType(tierType: number): string {
  const tierTypes: Record<number, string> = {
    1: 'Common',
    2: 'Uncommon',
    3: 'Rare',
    4: 'Legendary',
    5: 'Exotic'
  };
  return tierTypes[tierType] || 'Common';
}