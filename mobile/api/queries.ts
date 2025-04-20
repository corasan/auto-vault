import { useMutation, useQuery } from '@tanstack/react-query'
import { useBungieServerProfile } from '../hooks/useBungieServerProfile'
import { apiClient } from './client'

// Re-export the server hooks
export { useBungieServerProfile }

/**
 * Hook to check the API health status
 */
export function useHealthCheck() {
	return useQuery({
		queryKey: ['health'],
		queryFn: () => apiClient.checkHealth(),
	})
}

/**
 * Hook to vault postmaster items for a character
 */
export function useVaultPostmaster() {
	return useMutation({
		mutationFn: (characterId: string) => apiClient.vaultPostmasterItems(characterId),
		onError: error => {
			console.error('Failed to vault postmaster items', error)
		},
	})
}

/**
 * Hook to get character inventory and postmaster items
 */
export function useInventory() {
	return useQuery({
		queryKey: ['inventory'],
		queryFn: () => apiClient.getInventory(),
		staleTime: 60 * 1000, // 1 minute
		// refetchInterval: 2 * 60 * 1000, // 2 minutes
	})
}

/**
 * Hook to get vault contents
 */
export function useVaultContents() {
	return useQuery({
		queryKey: ['vault'],
		queryFn: () => apiClient.getVaultContents(),
		staleTime: 60 * 1000, // 1 minute
		// refetchInterval: 2 * 60 * 1000, // 2 minutes
	})
}
