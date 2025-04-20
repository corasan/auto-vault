import { DestinyCharacter, type DestinyItem } from '@/api/client'
import { useInventory } from '@/api/queries'
import {
	type DestinyItemProps,
	DestinyItem as ItemComponent,
	ItemsList,
} from '@/components/DestinyItem'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { VaultPostmasterButton } from '@/components/VaultPostmasterButton'
import { useAuth } from '@/context/AuthContext'
import { LegendList } from '@legendapp/list'
import React from 'react'
import { ActivityIndicator, Image, RefreshControl, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Main Home Screen Component
export default function HomeScreen() {
	const { user } = useAuth()
	const { top } = useSafeAreaInsets()

	// Use the actual query or mock data for development
	const {
		data: inventoryData,
		isLoading,
		isError,
		error,
		refetch,
		isRefetching,
	} = useInventory()

	// Use mock data for development
	const data = inventoryData

	// Prepare postmaster items for display
	const postmasterItems =
		data?.items.postmaster.map(item => mapDestinyItemToProps(item, true)) || []

	// Prepare latest items (sort by most recent)
	const latestItems =
		data?.items.inventory
			.slice()
			.sort((a, b) => (b.itemInstanceId > a.itemInstanceId ? 1 : -1))
			.slice(0, 10)
			.map(item => mapDestinyItemToProps(item)) || []

	// Handle item press
	const handleItemPress = (itemId: string) => {
		console.log('Item pressed:', itemId)
		// TODO: Show item details or options
	}

	// Get active character
	const activeCharacter = data?.characters[0]

	return (
		<ThemedView style={styles.container}>
			<LegendList
				data={[]}
				estimatedItemSize={100}
				ListHeaderComponent={
					<>
						{/* User Welcome & Character Info */}
						{user && activeCharacter && (
							<ThemedView style={styles.headerContainer}>
								<ThemedView style={styles.userInfoContainer}>
									{/* {user.profilePicture && (
										<Image
											source={{ uri: user.profilePicture }}
											style={styles.profilePicture}
										/>
									)} */}
									<ThemedView>
										<ThemedText type="subtitle">Welcome, {user.displayName}!</ThemedText>
										<ThemedText style={styles.characterInfo}>
											{activeCharacter.classType} · Power {activeCharacter.light}
										</ThemedText>
									</ThemedView>
								</ThemedView>
							</ThemedView>
						)}

						{/* Loading State */}
						{isLoading && (
							<ThemedView style={styles.loadingContainer}>
								<ActivityIndicator size="large" color="#f5911e" />
								<ThemedText style={styles.loadingText}>
									Loading your Guardian inventory...
								</ThemedText>
							</ThemedView>
						)}

						{/* Error State */}
						{isError && (
							<ThemedView style={styles.errorContainer}>
								<ThemedText style={styles.errorText}>
									Error loading inventory:{' '}
									{error instanceof Error ? error.message : 'Unknown error'}
								</ThemedText>
							</ThemedView>
						)}

						{/* Postmaster Items Section */}
						{postmasterItems.length > 0 && (
							<ThemedView style={styles.postmasterContainer}>
								<ThemedView style={styles.sectionHeader}>
									<ThemedText type="subtitle">Postmaster Items</ThemedText>
									<ThemedText style={styles.itemCount}>
										{postmasterItems.length} items
									</ThemedText>
								</ThemedView>

								<ThemedText style={styles.sectionDescription}>
									These items are at risk! They'll be lost if your postmaster fills up.
								</ThemedText>

								<ItemsList
									title=""
									items={postmasterItems}
									onItemPress={handleItemPress}
								/>

								<VaultPostmasterButton characterId={user?.membershipId || 'unknown'} />
							</ThemedView>
						)}

						{/* Latest Items Section */}
						{latestItems.length > 0 && (
							<ThemedView style={styles.latestItemsContainer}>
								<ThemedView style={styles.sectionHeader}>
									<ThemedText type="subtitle">Recent Items</ThemedText>
									<ThemedText style={styles.itemCount}>
										{latestItems.length} items
									</ThemedText>
								</ThemedView>

								<ItemsList title="" items={latestItems} onItemPress={handleItemPress} />
							</ThemedView>
						)}
					</>
				}
				renderItem={() => null}
				contentContainerStyle={[styles.listContentContainer, { paddingTop: top + 20 }]}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={refetch}
						colors={['#f5911e']}
						tintColor="#f5911e"
					/>
				}
			/>
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
