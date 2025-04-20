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
	membershipId: string
	displayName: string
	profilePicture?: string
}