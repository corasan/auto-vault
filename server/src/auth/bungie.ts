interface TokenResponse {
	access_token: string
	token_type: string
	expires_in: number
	refresh_token: string
	membership_id: string
}

interface BungieUser {
	bungieNetUser: {
		membershipId: string
		displayName: string
		profilePicture?: string
	}
	destinyMemberships: Array<{
		membershipType: number
		membershipId: string
		displayName: string
		crossSaveOverride: number
		applicableMembershipTypes: number[]
		isPublic: boolean
		membershipData: {
			displayName: string
			iconPath: string
		}
	}>
}

interface BungieCharacter {
	characterId: string
	dateLastPlayed: string
	minutesPlayedThisSession: string
	minutesPlayedTotal: string
	light: number
	stats: Record<string, any>
	raceType: number
	genderType: number
	classType: number
	raceHash: number
	genderHash: number
	classHash: number
	emblemPath: string
	emblemBackgroundPath: string
	emblemHash: number
	emblemColor: {
		red: number
		green: number
		blue: number
		alpha: number
	}
	levelProgression: any
	baseCharacterLevel: number
	percentToNextLevel: number
}

interface PostmasterItem {
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

interface InventoryData {
	characters: Record<string, BungieCharacter>
	postmasterItems: Record<string, PostmasterItem[]>
	vaultSpace: {
		used: number
		total: number
	}
}

export class BungieAuthService {
	private readonly baseUrl = 'https://www.bungie.net/Platform'
	private readonly authUrl = 'https://www.bungie.net/en/OAuth/Authorize'
	private readonly tokenUrl = 'https://www.bungie.net/platform/app/oauth/token/'

	constructor(
		private readonly apiKey: string,
		private readonly clientId: string,
		private readonly clientSecret: string,
		private readonly redirectUri: string
	) {}

	generateAuthUrl(state?: string): string {
		const params = new URLSearchParams({
			client_id: this.clientId,
			response_type: 'code',
			redirect_uri: this.redirectUri,
		})

		if (state) {
			params.set('state', state)
		}

		return `${this.authUrl}?${params.toString()}`
	}

	async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
		const body = new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			client_id: this.clientId,
			client_secret: this.clientSecret,
			redirect_uri: this.redirectUri,
		})

		const response = await fetch(this.tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: body.toString(),
		})

		if (!response.ok) {
			const errorData = await response.text()
			throw new Error(`Token exchange failed: ${response.status} ${errorData}`)
		}

		return await response.json()
	}

	async refreshToken(refreshToken: string): Promise<TokenResponse> {
		const body = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
			client_id: this.clientId,
			client_secret: this.clientSecret,
		})

		const response = await fetch(this.tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: body.toString(),
		})

		if (!response.ok) {
			const errorData = await response.text()
			throw new Error(`Token refresh failed: ${response.status} ${errorData}`)
		}

		return await response.json()
	}

	async getBungieUser(accessToken: string): Promise<BungieUser> {
		const response = await this.makeApiRequest(
			'/User/GetMembershipsForCurrentUser/',
			accessToken
		)

		return response.Response
	}

	async getCharacters(
		accessToken: string,
		membershipType: number,
		membershipId: string
	): Promise<Record<string, BungieCharacter>> {
		const response = await this.makeApiRequest(
			`/Destiny2/${membershipType}/Profile/${membershipId}/?components=200`,
			accessToken
		)

		return response.Response?.characters?.data || {}
	}

	async getInventoryData(
		accessToken: string,
		membershipType: number,
		membershipId: string
	): Promise<InventoryData> {
		const components = [
			'200', // Characters
			'201', // CharacterInventories
			'102', // ProfileInventories (vault)
		].join(',')

		const response = await this.makeApiRequest(
			`/Destiny2/${membershipType}/Profile/${membershipId}/?components=${components}`,
			accessToken
		)

		const profileData = response.Response

		const characters = profileData?.characters?.data || {}
		const characterInventories = profileData?.characterInventories?.data || {}
		const profileInventory = profileData?.profileInventory?.data?.items || []

		const postmasterItems: Record<string, PostmasterItem[]> = {}
		const POSTMASTER_BUCKET_HASH = 215593132

		Object.entries(characterInventories).forEach(([characterId, inventory]: [string, any]) => {
			const items = inventory.items || []
			postmasterItems[characterId] = items.filter((item: any) => 
				item.bucketHash === POSTMASTER_BUCKET_HASH
			)
		})

		const vaultSpace = {
			used: profileInventory.length,
			total: 500
		}

		return {
			characters,
			postmasterItems,
			vaultSpace
		}
	}

	async getPostmasterItems(
		accessToken: string,
		membershipType: number,
		membershipId: string
	): Promise<Record<string, PostmasterItem[]>> {
		const inventoryData = await this.getInventoryData(accessToken, membershipType, membershipId)
		return inventoryData.postmasterItems
	}

	async validateToken(accessToken: string): Promise<boolean> {
		try {
			await this.makeApiRequest('/User/GetMembershipsForCurrentUser/', accessToken)
			return true
		} catch {
			return false
		}
	}

	isTokenExpired(expiresAt: number): boolean {
		return Date.now() > expiresAt - 300000
	}

	private async makeApiRequest(endpoint: string, accessToken?: string): Promise<any> {
		const headers: Record<string, string> = {
			'X-API-Key': this.apiKey,
			'Content-Type': 'application/json',
		}

		if (accessToken) {
			headers.Authorization = `Bearer ${accessToken}`
		}

		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method: 'GET',
			headers,
		})

		if (!response.ok) {
			const errorData = await response.text()
			throw new Error(`API request failed: ${response.status} ${errorData}`)
		}

		return await response.json()
	}
}

export { type TokenResponse, type BungieUser, type BungieCharacter, type PostmasterItem, type InventoryData }