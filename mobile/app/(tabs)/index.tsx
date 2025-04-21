import hello from '@/actions/hello'
import { DestinyCharacter, type DestinyItem } from '@/api/client'
import { useBungieServerProfile, useInventory } from '@/api/queries'
import {
	type DestinyItemProps,
	DestinyItem as ItemComponent,
	ItemsList,
} from '@/components/DestinyItem'
import { ThemedView } from '@/components/ThemedView'
import { useAuth } from '@/context/AuthContext'
import React, { Suspense } from 'react'
import { ActivityIndicator, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const UserName = () => {
	const { data, error } = useBungieServerProfile({
		includeCharacters: true,
	})

	if (error) return <Text>Error: {error.message}</Text>
	if (!data) return <Text>No data</Text>

	return <Text>{data.displayName}</Text>
}

// Main Home Screen Component
export default function HomeScreen() {
	const { top } = useSafeAreaInsets()

	return (
		<ThemedView style={[styles.container, { paddingTop: top + 20 }]}>
			<Text>Recent Items</Text>
			<Suspense fallback={<ActivityIndicator />}>
				<UserName />
			</Suspense>
		</ThemedView>
	)
}

// Helper function to map API item to component props
function mapDestinyItemToProps(
	item: DestinyItem,
	isInPostmaster = false,
): DestinyItemProps {
	return {
		id: item.itemId,
		name: item.name,
		type: item.itemType,
		subType: item.itemSubType,
		icon: item.icon,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		rarity: item.tierType as any, // Cast to rarity type
		power: item.power,
		isInPostmaster: isInPostmaster || item.location === 'postmaster',
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContentContainer: {
		paddingHorizontal: 16,
		paddingBottom: 100,
	},
	headerContainer: {
		marginBottom: 16,
	},
	userInfoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 16,
		borderRadius: 8,
		backgroundColor: 'rgba(245, 145, 30, 0.1)', // Destiny orange with opacity
	},
	profilePicture: {
		width: 50,
		height: 50,
		borderRadius: 25,
		borderWidth: 2,
		borderColor: '#f5911e',
	},
	characterInfo: {
		fontSize: 12,
		opacity: 0.8,
	},
	loadingContainer: {
		padding: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	loadingText: {
		marginTop: 10,
	},
	errorContainer: {
		padding: 20,
		borderRadius: 8,
		backgroundColor: 'rgba(255, 59, 48, 0.1)',
		marginBottom: 16,
	},
	errorText: {
		color: '#ff3b30',
	},
	postmasterContainer: {
		marginBottom: 24,
	},
	latestItemsContainer: {
		marginBottom: 16,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	sectionDescription: {
		marginBottom: 12,
		fontStyle: 'italic',
	},
	itemCount: {
		fontSize: 14,
		opacity: 0.7,
	},
})
