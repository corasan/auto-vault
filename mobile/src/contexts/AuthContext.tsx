import { createContext, useContext, useEffect, useState } from 'react'
import { type User, authService } from '../services/auth'

interface AuthContextType {
	user: User | null
	isLoading: boolean
	isAuthenticated: boolean
	login: () => Promise<void>
	logout: () => Promise<void>
	checkAuthStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isAuthenticated, setIsAuthenticated] = useState(false)

	const checkAuthStatus = async () => {
		try {
			setIsLoading(true)
			const authenticated = await authService.isAuthenticated()
			setIsAuthenticated(authenticated)

			if (authenticated) {
				const currentUser = await authService.getCurrentUser()
				setUser(currentUser)
			} else {
				setUser(null)
			}
		} catch (error) {
			console.error('Auth check error:', error)
			setIsAuthenticated(false)
			setUser(null)
		} finally {
			setIsLoading(false)
		}
	}

	const login = async () => {
		try {
			setIsLoading(true)
			const authResponse = await authService.authenticateWithBungie()

			console.log(authResponse)

			if (authResponse.success) {
				setUser(authResponse.user)
				setIsAuthenticated(true)
			}
		} catch (error) {
			console.error('Login error:', error)
			throw error
		} finally {
			setIsLoading(false)
		}
	}

	const logout = async () => {
		try {
			setIsLoading(true)
			await authService.logout()
			setUser(null)
			setIsAuthenticated(false)
		} catch (error) {
			console.error('Logout error:', error)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		checkAuthStatus()
	}, [])

	const value: AuthContextType = {
		user,
		isLoading,
		isAuthenticated,
		login,
		logout,
		checkAuthStatus,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
