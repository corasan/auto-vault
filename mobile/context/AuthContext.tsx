import Constants from 'expo-constants'
import { useRouter, useSegments } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from 'react'
import { Alert } from 'react-native'
import {
	type BungieUserResponse,
	apiClient,
	clearAuthData,
	getUserInfo,
	setAuthToken,
	setUserInfo,
} from '../api/client'

// Auth context interface
interface AuthContextType {
	user: BungieUserResponse | null
	isLoading: boolean
	signIn: () => Promise<void>
	signOut: () => Promise<void>
	setUserData: (userData: BungieUserResponse) => void
}

// Default context values
const defaultContext: AuthContextType = {
	user: null,
	isLoading: true,
	signIn: async () => {},
	signOut: async () => {},
	setUserData: () => {},
}

// Create auth context
const AuthContext = createContext<AuthContextType>(defaultContext)

// Auth provider props
interface AuthProviderProps {
	children: ReactNode
}

// Create an AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<BungieUserResponse | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const segments = useSegments()
	const router = useRouter()
	const [token, setToken] = useState<string | null>(null)

	// Check if the user is authenticated on mount
	useEffect(() => {
		loadUser()
	}, [])

	// Handle routing based on authentication state
	useEffect(() => {
		if (isLoading) return

		const inAuthGroup = segments[0] === '(auth)'

		if (!token && !inAuthGroup) {
			// If user is not signed in and not on auth screen, redirect to auth
			router.replace('/login')
		} else if (token && inAuthGroup) {
			// If user is signed in but on auth screen, redirect to home
			router.replace('/')
		}
	}, [token, segments, isLoading])

	// Load user from secure storage
	const loadUser = async () => {
		try {
			const storedUser = await getUserInfo()
			if (storedUser) {
				setUser(storedUser)
			}
		} catch (error) {
			console.error('Failed to load user from secure storage:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// Sign in function
	const signIn = async () => {
		try {
			const redirectUri = process.env.EXPO_PUBLIC_REDIRECT_URI
			const clientId = process.env.EXPO_PUBLIC_BUNGIE_CLIENT_ID

			if (!redirectUri || !clientId) {
				throw new Error(
					'Missing EXPO_PUBLIC_REDIRECT_URI or EXPO_PUBLIC_BUNGIE_CLIENT_ID in .env file',
				)
			}

			const authUrl = `https://www.bungie.net/en/OAuth/Authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`
			const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri)

			if (result.type === 'success') {
				const url = result.url
				const urlObj = new URL(url)
				const code = urlObj.searchParams.get('code')
				if (!code) {
					throw new Error('No authorization code found in the response')
				}
				const tokenResponse = await apiClient.exchangeCodeForToken(code)
				await setAuthToken(tokenResponse.access_token)
				setToken(tokenResponse.access_token)
				// const userProfile = await apiClient.getBungieUser()
				// await setUserInfo(userProfile)
				// setUser(userProfile)
			} else {
				Alert.alert(
					'Authentication Canceled',
					'You canceled the authentication process or it failed. Please try again.',
					[{ text: 'OK' }],
				)
			}
		} catch (error) {
			console.error('Error during sign in:', error)
			Alert.alert(
				'Authentication Error',
				'Could not connect to Bungie. Please check your internet connection and try again.',
				[
					{
						text: 'Try Again',
						onPress: () => signIn(),
					},
				],
			)
		}
	}

	const signOut = async () => {
		try {
			await clearAuthData()
			setUser(null)
		} catch (error) {
			console.error('Error during sign out:', error)
		}
	}

	const setUserData = (userData: BungieUserResponse) => {
		setUser(userData)
	}

	return (
		<AuthContext.Provider value={{ user, isLoading, signIn, signOut, setUserData }}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)

	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}

	return context
}
