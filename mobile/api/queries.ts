import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient, VaultPostmasterResponse } from './client';

/**
 * Hook to check the API health status
 */
export function useHealthCheck() {
	return useQuery({
		queryKey: ['health'],
		queryFn: () => apiClient.checkHealth(),
	});
}

/**
 * Hook to vault postmaster items for a character
 */
export function useVaultPostmaster() {
	return useMutation({
		mutationFn: (characterId: string) => apiClient.vaultPostmasterItems(characterId),
		onError: (error) => {
			console.error('Failed to vault postmaster items', error);
		},
	});
}