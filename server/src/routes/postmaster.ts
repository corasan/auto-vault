import { BungieAuthService, type PostmasterItem, type InventoryData } from '../auth/bungie'

interface PostmasterResponse {
	success: boolean
	characters: Array<{
		characterId: string
		classType: number
		light: number
		emblemPath: string
		postmasterItems: PostmasterItem[]
	}>
	vaultSpace: {
		used: number
		total: number
		available: number
	}
}

export class PostmasterRoutes {
	constructor(private readonly bungieAuth: BungieAuthService) {}

	async handleGetItems(request: Request): Promise<Response> {
		try {
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

			const accessToken = authHeader.substring(7)
			const url = new URL(request.url)
			const membershipType = url.searchParams.get('membershipType')
			const membershipId = url.searchParams.get('membershipId')

			if (!membershipType || !membershipId) {
				return new Response(
					JSON.stringify({ error: 'Missing membershipType or membershipId' }),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					}
				)
			}

			const inventoryData = await this.bungieAuth.getInventoryData(
				accessToken,
				parseInt(membershipType, 10),
				membershipId
			)

			const charactersWithPostmaster = Object.entries(inventoryData.characters).map(
				([characterId, character]) => ({
					characterId,
					classType: character.classType,
					light: character.light,
					emblemPath: character.emblemPath,
					postmasterItems: inventoryData.postmasterItems[characterId] || [],
				})
			)

			const response: PostmasterResponse = {
				success: true,
				characters: charactersWithPostmaster,
				vaultSpace: {
					...inventoryData.vaultSpace,
					available: inventoryData.vaultSpace.total - inventoryData.vaultSpace.used,
				},
			}

			return new Response(JSON.stringify(response), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
		} catch (error) {
			console.error('Postmaster items error:', error)
			return new Response(
				JSON.stringify({ error: 'Failed to retrieve postmaster items' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		}
	}

	async handleTransferItems(request: Request): Promise<Response> {
		try {
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

			const accessToken = authHeader.substring(7)
			const body = await request.json()
			const { membershipType, membershipId, characterId, items } = body

			if (!membershipType || !membershipId || !characterId || !items || !Array.isArray(items)) {
				return new Response(
					JSON.stringify({ error: 'Missing required fields' }),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					}
				)
			}

			// TODO: Implement actual transfer logic
			// This would involve calling Bungie's transfer APIs
			
			return new Response(
				JSON.stringify({ 
					success: true, 
					message: 'Transfer functionality not yet implemented' 
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		} catch (error) {
			console.error('Transfer items error:', error)
			return new Response(
				JSON.stringify({ error: 'Failed to transfer items' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			)
		}
	}
}