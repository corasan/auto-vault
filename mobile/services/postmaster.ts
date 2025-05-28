import { authService } from './auth'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export interface PostmasterItem {
	itemHash: number
	itemInstanceId: string
	quantity: number
	bindStatus: number
	location: number
	bucketHash: number
	transferStatus: number
	lockable: boolean
	state: number
	dismantlePermission: number
	isWrapper: boolean
}

export interface CharacterWithPostmaster {
	characterId: string
	classType: number
	light: number
	emblemPath: string
	postmasterItems: PostmasterItem[]
}

export interface VaultSpace {
	used: number
	total: number
	available: number
}

export interface PostmasterData {
	success: boolean
	characters: CharacterWithPostmaster[]
	vaultSpace: VaultSpace
}

export interface TransferRequest {
	membershipType: number
	membershipId: string
	characterId: string
	items: PostmasterItem[]
}

export interface TransferResponse {
	success: boolean
	message: string
	transferredItems?: number
	failedItems?: number
}

class PostmasterService {
	async getPostmasterItems(membershipType: number, membershipId: string): Promise<PostmasterData> {
		const accessToken = await authService.getAccessToken()
		
		if (!accessToken) {
			throw new Error('No valid access token available')
		}

		const url = new URL(`${API_BASE_URL}/postmaster/items`)
		url.searchParams.set('membershipType', membershipType.toString())
		url.searchParams.set('membershipId', membershipId)

		const response = await fetch(url.toString(), {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		})

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}))
			throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch postmaster items`)
		}

		return await response.json()
	}

	async transferItems(transferRequest: TransferRequest): Promise<TransferResponse> {
		const accessToken = await authService.getAccessToken()
		
		if (!accessToken) {
			throw new Error('No valid access token available')
		}

		const response = await fetch(`${API_BASE_URL}/postmaster/transfer`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(transferRequest),
		})

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}))
			throw new Error(errorData.error || `HTTP ${response.status}: Failed to transfer items`)
		}

		return await response.json()
	}

	getClassTypeName(classType: number): string {
		switch (classType) {
			case 0: return 'Titan'
			case 1: return 'Hunter'
			case 2: return 'Warlock'
			default: return 'Unknown'
		}
	}

	getItemTypeName(bucketHash: number): string {
		const bucketTypes: Record<number, string> = {
			1498876634: 'Kinetic Weapons',
			2465295065: 'Energy Weapons',
			953998645: 'Power Weapons',
			3448274439: 'Helmet',
			3551918588: 'Gauntlets',
			14239492: 'Chest Armor',
			20886954: 'Leg Armor',
			1585787867: 'Class Armor',
			4023194814: 'Ghost',
			2025709351: 'Vehicle',
			284967655: 'Ships',
			4274335291: 'Emblems',
			1469714392: 'Consumables',
			1367666825: 'Modifications',
			138197802: 'General Items',
		}

		return bucketTypes[bucketHash] || 'Unknown Item'
	}

	getTotalPostmasterItems(characters: CharacterWithPostmaster[]): number {
		return characters.reduce((total, character) => 
			total + character.postmasterItems.length, 0
		)
	}

	getPostmasterItemsByCharacter(characters: CharacterWithPostmaster[], characterId: string): PostmasterItem[] {
		const character = characters.find(char => char.characterId === characterId)
		return character?.postmasterItems || []
	}

	isVaultNearFull(vaultSpace: VaultSpace, threshold = 0.9): boolean {
		return (vaultSpace.used / vaultSpace.total) >= threshold
	}

	canTransferToVault(vaultSpace: VaultSpace, itemCount: number): boolean {
		return vaultSpace.available >= itemCount
	}
}

export const postmasterService = new PostmasterService()