import { type UseQueryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { getBungieUser, getBungieUserWithCharacters } from '../actions/getBungieUser'
import { getAuthToken } from '../api/client'
import type { BungieUserResponse } from '../api/client'

// Query keys for React Query
export const bungieUserKeys = {
	all: ['bungieUser'] as const,
	profile: () => [...bungieUserKeys.all, 'profile'] as const,
	profileWithCharacters: () => [...bungieUserKeys.all, 'profileWithCharacters'] as const,
}

/**
 * Fetcher function to get Bungie user profile
 * @param includeCharacters Whether to include character data
 * @returns Promise resolving to Bungie user profile data
 */
export async function fetchBungieProfile(
	includeCharacters = false,
): Promise<BungieUserResponse> {
	const token = await getAuthToken()

	if (!token) {
		throw new Error('Authentication token not found. Please sign in again.')
	}

	return includeCharacters ? getBungieUserWithCharacters(token) : getBungieUser(token)
}

/**
 * Hook to fetch Bungie user profile using React Query and server functions
 * @param options Options for fetching profile data and configuring React Query
 * @returns React Query result object with data, status, and more
 */
export function useBungieServerProfile(
	options: {
		includeCharacters?: boolean
		enabled?: boolean
		queryOptions?: Omit<
			UseQueryOptions<BungieUserResponse, Error>,
			'queryKey' | 'queryFn' | 'enabled'
		>
	} = {},
) {
	const { includeCharacters = false, enabled = true, queryOptions = {} } = options

	// Use the appropriate query key based on whether we're including characters
	const queryKey = includeCharacters
		? bungieUserKeys.profileWithCharacters()
		: bungieUserKeys.profile()

	return useSuspenseQuery({
		queryKey,
		queryFn: () => fetchBungieProfile(includeCharacters),
		staleTime: 5 * 60 * 1000, // 5 minutes
		...queryOptions,
	})
}
