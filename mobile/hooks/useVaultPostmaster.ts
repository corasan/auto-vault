import { useState } from 'react'

// Define the API response type
interface VaultPostmasterResponse {
	success: boolean
	transferred: number
	total: number
	error?: string
	code?: string
	message?: string
}

/**
 * Hook to handle vaulting postmaster items
 */
export function useVaultPostmaster() {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [result, setResult] = useState<{ transferred: number; total: number } | null>(null)

	/**
	 * Triggers the API to vault postmaster items
	 */
	const vaultPostmasterItems = async (characterId: string, membershipType: number, destinyMembershipId: string): Promise<boolean> => {
		setIsLoading(true)
		setError(null)
		setResult(null)

		try {
			// Get API URL from environment variables
			const apiUrl = `${process.env.EXPO_PUBLIC_WORKER_URL || 'http://localhost:8787'}/api/vault-postmaster-items`
			
			// Get token from secure storage
			const token = await getAuthToken()
			
			if (!token) {
				throw new Error("Not authenticated")
			}
			
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ 
					characterId,
					membershipType,
					destinyMembershipId 
				})
			})

			const data: VaultPostmasterResponse = await response.json()

			if (!response.ok) {
				throw new Error(data.message || data.error || 'Failed to vault postmaster items')
			}

			if (data.success) {
				setResult({
					transferred: data.transferred,
					total: data.total
				})
				return true
			} else {
				throw new Error(data.error || 'Unknown error')
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An unexpected error occurred')
			return false
		} finally {
			setIsLoading(false)
		}
	}

	// Get auth token from secure storage
	const getAuthToken = async (): Promise<string | null> => {
		// Use SecureStore to get the token
		const { getAuthToken } = await import('../api/client')
		return getAuthToken()
	}

	return {
		vaultPostmasterItems,
		isLoading,
		error,
		result
	}
}