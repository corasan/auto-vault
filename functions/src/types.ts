export interface Item {
	itemId: string
	itemInstanceId: string
	name: string
	description: string
	itemType: ItemType
	rarity: ItemRarity
	quantity: number
	isEquipped: boolean
}

export enum ItemType {
	Weapon = 'Weapon',
	Armor = 'Armor',
	Consumable = 'Consumable',
	Bounty = 'Bounty',
	Quest = 'Quest',
	Material = 'Material',
	Mod = 'Mod',
}

export enum ItemRarity {
	Common = 'Common',
	Uncommon = 'Uncommon',
	Rare = 'Rare',
	Legendary = 'Legendary',
	Exotic = 'Exotic',
}

export interface User {
	id: string
	bungieNetUser: {
		membershipId: string
		displayName: string
	}
	destinyMemberships: {
		membershipType: number
		membershipId: string
		displayName: string
	}[]
	characters: {
		characterId: string
		class: string
		light: number
		emblemPath: string
	}[]
}

export interface TokenResponse {
	access_token: string
	token_type: string
	expires_in: number
	refresh_token: string
	membership_id: string
}

export interface BungieUserResponse {
	membershipId: string          // Bungie.net membership ID
	displayName: string
	profilePicture?: string
	// Platform-specific membership IDs (e.g., Xbox, PSN, Steam)
	platformMemberships?: Record<number, string>
	// Primary platform (most recently played)
	primaryMembershipType?: number
	primaryMembershipId?: string
	// Last played character
	lastPlayedCharacterId?: string
}

export interface DestinyCharacter {
	characterId: string
	classType: string
	light: number
	emblemPath: string
	dateLastPlayed: string
}

export interface DestinyItem {
	itemId: string
	itemInstanceId: string
	name: string
	description?: string
	icon: string
	itemType: string  // Weapon, Armor, etc.
	itemSubType?: string // Scout Rifle, Helmet, etc.
	tierType: string // Common, Uncommon, Rare, Legendary, Exotic
	power?: number
	location: 'inventory' | 'postmaster' | 'vault'
	bucketHash: number // inventory bucket hash
}

export interface InventoryResponse {
	characters: DestinyCharacter[],
	items: {
		inventory: DestinyItem[],
		postmaster: DestinyItem[],
		vault: DestinyItem[]
	}
}