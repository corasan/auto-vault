'use server'

import Constants from 'expo-constants'
import type { BungieUserResponse } from '../api/client'

// Bungie API base URL
const BUNGIE_API_BASE = 'https://www.bungie.net/Platform'

/**
 * Server function to fetch Bungie user profile data
 * This runs on the server with the user's authentication token
 *
 * @param authToken The authentication token to use for Bungie API requests
 * @returns Bungie user profile data with memberships
 */
export async function getBungieUser(authToken: string): Promise<BungieUserResponse> {
	if (!authToken) {
		throw new Error('Authentication token is required')
	}

	// Get Bungie API key from environment variables
	const bungieApiKey = process.env.BUNGIE_API_KEY

	if (!bungieApiKey) {
		throw new Error('Missing BUNGIE_API_KEY environment variable')
	}

	try {
		// Call Bungie API to get user profile and memberships
		const response = await fetch(
			`${BUNGIE_API_BASE}/User/GetMembershipsForCurrentUser/`,
			{
				method: 'GET',
				headers: {
					'X-API-Key': bungieApiKey,
					Authorization: `Bearer ${authToken}`,
					'Content-Type': 'application/json',
				},
			},
		)

		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(`Bungie API Error: ${errorData.ErrorStatus || response.statusText}`)
		}

		const data = await response.json()
		const bungieNetUser = data.Response.bungieNetUser
		const destinyMemberships = data.Response.destinyMemberships || []

		// Get the primary (most recently played) membership if available
		let primaryMembershipType: number | undefined
		let primaryMembershipId: string | undefined

		if (data.Response.primaryMembershipId) {
			primaryMembershipId = data.Response.primaryMembershipId

			// Find the membership type for the primary ID
			const primaryMembership = destinyMemberships.find(
				(m: any) => m.membershipId === primaryMembershipId,
			)

			if (primaryMembership) {
				primaryMembershipType = primaryMembership.membershipType
			}
		} else if (destinyMemberships.length > 0) {
			// If no primary membership is specified, use the first one
			primaryMembershipType = destinyMemberships[0].membershipType
			primaryMembershipId = destinyMemberships[0].membershipId
		}

		// Format platform memberships as a record
		const platformMemberships: Record<number, string> = {}
		destinyMemberships.forEach((membership: any) => {
			platformMemberships[membership.membershipType] = membership.membershipId
		})

		// Construct the user response
		const userResponse: BungieUserResponse = {
			membershipId: bungieNetUser.membershipId,
			displayName: bungieNetUser.displayName,
			profilePicture: bungieNetUser.profilePicturePath
				? `https://www.bungie.net${bungieNetUser.profilePicturePath}`
				: undefined,
			platformMemberships,
			primaryMembershipType,
			primaryMembershipId,
		}

		return userResponse
	} catch (error) {
		console.error('Failed to fetch Bungie user data:', error)
		throw new Error('Failed to retrieve your Bungie profile. Please try again later.')
	}
}

/**
 * Server function to fetch Bungie user data with character information
 * This is an extended version that also fetches character data for the primary membership
 *
 * @param authToken The authentication token to use for Bungie API requests
 * @returns Bungie user profile data with memberships and characters
 */
export async function getBungieUserWithCharacters(
	authToken: string,
): Promise<BungieUserResponse> {
	// First get basic user data
	const userData = await getBungieUser(authToken)

	// If there's no primary membership, we can't get characters
	if (!userData.primaryMembershipId || !userData.primaryMembershipType) {
		return userData
	}

	// Get Bungie API key from environment variables
	const bungieApiKey = process.env.BUNGIE_API_KEY

	if (!bungieApiKey) {
		throw new Error('Missing BUNGIE_API_KEY environment variable')
	}

	try {
		// Get characters for the primary membership
		const url = `${BUNGIE_API_BASE}/Destiny2/${userData.primaryMembershipType}/Profile/${userData.primaryMembershipId}/?components=200` // 200 = Characters component

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'X-API-Key': bungieApiKey,
				Authorization: `Bearer ${authToken}`,
				'Content-Type': 'application/json',
			},
		})

		if (!response.ok) {
			// Return the user data without characters if we can't get them
			return userData
		}

		const data = await response.json()

		// If we have character data, find the most recently played character
		if (data.Response?.characters?.data) {
			const characterEntries = Object.entries(data.Response.characters.data)

			if (characterEntries.length > 0) {
				// Sort by dateLastPlayed to find most recent
				characterEntries.sort((a: any, b: any) => {
					return (
						new Date(b[1].dateLastPlayed).getTime() -
						new Date(a[1].dateLastPlayed).getTime()
					)
				})

				// Get the ID of the most recently played character
				const lastPlayedCharacterId = characterEntries[0][0]

				// Add to user data
				return {
					...userData,
					lastPlayedCharacterId,
				}
			}
		}

		return userData
	} catch (error) {
		// If character fetch fails, still return the basic user data
		console.error('Failed to fetch character data:', error)
		return userData
	}
}
