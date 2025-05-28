import { BungieAuthService } from './src/auth/bungie'
import { AuthRoutes } from './src/routes/auth'
import { PostmasterRoutes } from './src/routes/postmaster'

const BUNGIE_API_KEY = process.env.BUNGIE_API_KEY || ''
const BUNGIE_CLIENT_ID = process.env.BUNGIE_CLIENT_ID || ''
const BUNGIE_CLIENT_SECRET = process.env.BUNGIE_CLIENT_SECRET || ''
const REDIRECT_URI = process.env.BUNGIE_REDIRECT_URI || 'http://localhost:3000/auth/callback'

if (!BUNGIE_API_KEY || !BUNGIE_CLIENT_ID || !BUNGIE_CLIENT_SECRET) {
	throw new Error('Missing required Bungie API credentials')
}

const bungieAuth = new BungieAuthService(
	BUNGIE_API_KEY,
	BUNGIE_CLIENT_ID,
	BUNGIE_CLIENT_SECRET,
	REDIRECT_URI
)

const authRoutes = new AuthRoutes(bungieAuth)
const postmasterRoutes = new PostmasterRoutes(bungieAuth)

const server = Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url)

		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		}

		if (req.method === 'OPTIONS') {
			return new Response(null, { status: 200, headers: corsHeaders })
		}

		try {
			if (url.pathname === '/' && req.method === 'GET') {
				return new Response('Auto Vault API Server', {
					headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
				})
			}

			if (url.pathname === '/health' && req.method === 'GET') {
				return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				})
			}

			if (url.pathname === '/auth/init') {
				const response = await authRoutes.handleInitAuth(req)
				Object.entries(corsHeaders).forEach(([key, value]) => {
					response.headers.set(key, value)
				})
				return response
			}

			if (url.pathname === '/auth/callback') {
				const response = await authRoutes.handleCallback(req)
				Object.entries(corsHeaders).forEach(([key, value]) => {
					response.headers.set(key, value)
				})
				return response
			}

			if (url.pathname === '/auth/exchange' && req.method === 'POST') {
				const response = await authRoutes.handleExchangeCode(req)
				Object.entries(corsHeaders).forEach(([key, value]) => {
					response.headers.set(key, value)
				})
				return response
			}

			if (url.pathname === '/auth/refresh' && req.method === 'POST') {
				const response = await authRoutes.handleRefreshToken(req)
				Object.entries(corsHeaders).forEach(([key, value]) => {
					response.headers.set(key, value)
				})
				return response
			}

			if (url.pathname === '/auth/validate') {
				const response = await authRoutes.handleValidateToken(req)
				Object.entries(corsHeaders).forEach(([key, value]) => {
					response.headers.set(key, value)
				})
				return response
			}

			if (url.pathname === '/auth/logout' && req.method === 'POST') {
				const response = await authRoutes.handleLogout(req)
				Object.entries(corsHeaders).forEach(([key, value]) => {
					response.headers.set(key, value)
				})
				return response
			}

			if (url.pathname === '/postmaster/items' && req.method === 'GET') {
				const response = await postmasterRoutes.handleGetItems(req)
				Object.entries(corsHeaders).forEach(([key, value]) => {
					response.headers.set(key, value)
				})
				return response
			}

			if (url.pathname === '/postmaster/transfer' && req.method === 'POST') {
				const response = await postmasterRoutes.handleTransferItems(req)
				Object.entries(corsHeaders).forEach(([key, value]) => {
					response.headers.set(key, value)
				})
				return response
			}

			return new Response(JSON.stringify({ error: 'Not found' }), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			})

		} catch (error) {
			console.error('Server error:', error)
			return new Response(JSON.stringify({ error: 'Internal server error' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			})
		}
	},
})

console.log(`Auto Vault API Server listening on ${server.url}`)
