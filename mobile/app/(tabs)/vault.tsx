import type { DestinyItem } from '@/api/client'
import { useVaultContents } from '@/api/queries'
import {
	type DestinyItemProps,
	DestinyItem as ItemComponent,
	ItemsList,
} from '@/components/DestinyItem'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { useAuth } from '@/context/AuthContext'
import { LegendList } from '@legendapp/list'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, RefreshControl, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Filter options
type FilterOption = 'all' | 'weapons' | 'armor'
type SortOption = 'newest' | 'rarity' | 'power'

export default function VaultScreen() {
	const { user } = useAuth()
	const { top } = useSafeAreaInsets()
	const [filter, setFilter] = useState<FilterOption>('all')
	const [sort, setSort] = useState<SortOption>('newest')

	// Use the vault query or mock data for development
	const { data, isLoading, isError, error, refetch, isRefetching } = useVaultContents()

	// Apply filtering
	const filteredItems = useMemo(
		() =>
			data?.filter(item => {
				if (filter === 'all') return true
				if (filter === 'weapons') return item.itemType === 'Weapon'
				if (filter === 'armor') return item.itemType === 'Armor'
				return true
			}) ?? [],
		[data, filter],
	)

	// Apply sorting
	const sortedItems = [...filteredItems].sort((a, b) => {
		if (sort === 'newest') {
			return b.itemInstanceId > a.itemInstanceId ? 1 : -1
		}
		if (sort === 'rarity') {
			const rarityOrder = { Exotic: 0, Legendary: 1, Rare: 2, Uncommon: 3, Common: 4 }
			return (
				(rarityOrder[a.tierType as keyof typeof rarityOrder] || 99) -
				(rarityOrder[b.tierType as keyof typeof rarityOrder] || 99)
			)
		}
		if (sort === 'power') {
			return (b.power || 0) - (a.power || 0)
		}
		return 0
	})

	// Map to component props
	const vaultItems = sortedItems.map(item => mapDestinyItemToProps(item))

	// Handle item press
	const handleItemPress = (itemId: string) => {
		console.log('Vault item pressed:', itemId)
		// TODO: Show item details or options
	}

	// Calculate vault stats
	const vaultCapacity = 500 // Maximum vault capacity in Destiny 2
	const vaultUsed = data?.length ?? 0
	const vaultPercentage = Math.round((vaultUsed / vaultCapacity) * 100)

	// Toggle filter
	const toggleFilter = (option: FilterOption) => {
		setFilter(option)
	}

	// Toggle sort
	const toggleSort = (option: SortOption) => {
		setSort(option)
	}

	return (
		<ThemedView style={styles.container}>
			<LegendList
				data={[]}
				estimatedItemSize={100}
				ListHeaderComponent={
					<>
						{/* Vault Stats */}
						<ThemedView style={styles.statsContainer}>
							<ThemedText type="title">Vault</ThemedText>

							<ThemedView style={styles.capacityContainer}>
								<ThemedView style={styles.capacityTextContainer}>
									<ThemedText style={styles.capacityText}>
										{vaultUsed} / {vaultCapacity} items
									</ThemedText>
									<ThemedText style={styles.percentageText}>
										{vaultPercentage}% Full
									</ThemedText>
								</ThemedView>
								<ThemedView style={styles.progressBarBackground}>
									<ThemedView
										style={[
											styles.progressBar,
											{
												width: `${vaultPercentage}%`,
												backgroundColor: vaultPercentage > 90 ? '#ff3b30' : '#f5911e',
											},
										]}
									/>
								</ThemedView>
							</ThemedView>

							{/* Filter & Sort Controls */}
							<ThemedView style={styles.filtersContainer}>
								<ThemedView style={styles.filterRow}>
									<ThemedText style={styles.filterLabel}>Filter:</ThemedText>
									<ThemedView style={styles.filterButtonsContainer}>
										<FilterButton
											label="All"
											isActive={filter === 'all'}
											onPress={() => toggleFilter('all')}
										/>
										<FilterButton
											label="Weapons"
											isActive={filter === 'weapons'}
											onPress={() => toggleFilter('weapons')}
										/>
										<FilterButton
											label="Armor"
											isActive={filter === 'armor'}
											onPress={() => toggleFilter('armor')}
										/>
									</ThemedView>
								</ThemedView>

								<ThemedView style={styles.filterRow}>
									<ThemedText style={styles.filterLabel}>Sort:</ThemedText>
									<ThemedView style={styles.filterButtonsContainer}>
										<FilterButton
											label="Newest"
											isActive={sort === 'newest'}
											onPress={() => toggleSort('newest')}
										/>
										<FilterButton
											label="Rarity"
											isActive={sort === 'rarity'}
											onPress={() => toggleSort('rarity')}
										/>
										<FilterButton
											label="Power"
											isActive={sort === 'power'}
											onPress={() => toggleSort('power')}
										/>
									</ThemedView>
								</ThemedView>
							</ThemedView>
						</ThemedView>

						{/* Loading State */}
						{isLoading && (
							<ThemedView style={styles.loadingContainer}>
								<ActivityIndicator size="large" color="#f5911e" />
								<ThemedText style={styles.loadingText}>Loading your vault...</ThemedText>
							</ThemedView>
						)}

						{/* Error State */}
						{isError && (
							<ThemedView style={styles.errorContainer}>
								<ThemedText style={styles.errorText}>
									Error loading vault:{' '}
									{error instanceof Error ? error.message : 'Unknown error'}
								</ThemedText>
							</ThemedView>
						)}

						{/* Vault Items */}
						{vaultItems.length > 0 ? (
							<ItemsList title="" items={vaultItems} onItemPress={handleItemPress} />
						) : (
							!isLoading && (
								<ThemedView style={styles.emptyStateContainer}>
									<ThemedText style={styles.emptyStateText}>
										No {filter === 'all' ? '' : filter} items found in your vault.
									</ThemedText>
								</ThemedView>
							)
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

// Filter Button Component
function FilterButton({
	label,
	isActive,
	onPress,
}: {
	label: string
	isActive: boolean
	onPress: () => void
}) {
	return (
		<ThemedView
			style={[styles.filterButton, isActive && styles.activeFilterButton]}
			onTouchEnd={onPress}
		>
			<ThemedText
				style={[styles.filterButtonText, isActive && styles.activeFilterButtonText]}
			>
				{label}
			</ThemedText>
		</ThemedView>
	)
}

// Helper function to map API item to component props
function mapDestinyItemToProps(item: DestinyItem): DestinyItemProps {
	return {
		id: item.itemId,
		name: item.name,
		type: item.itemType,
		subType: item.itemSubType,
		icon: item.icon,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		rarity: item.tierType as any, // Cast to rarity type
		power: item.power,
		isInPostmaster: item.location === 'postmaster',
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
	statsContainer: {
		marginBottom: 20,
	},
	capacityContainer: {
		marginTop: 12,
		marginBottom: 20,
	},
	capacityTextContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	capacityText: {
		fontSize: 14,
		fontWeight: 'bold',
	},
	percentageText: {
		fontSize: 14,
	},
	progressBarBackground: {
		height: 8,
		backgroundColor: 'rgba(150, 150, 150, 0.2)',
		borderRadius: 4,
		overflow: 'hidden',
	},
	progressBar: {
		height: '100%',
		borderRadius: 4,
	},
	filtersContainer: {
		gap: 12,
	},
	filterRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	filterLabel: {
		width: 50,
		fontSize: 14,
	},
	filterButtonsContainer: {
		flexDirection: 'row',
		flex: 1,
		gap: 8,
	},
	filterButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		backgroundColor: 'rgba(150, 150, 150, 0.2)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	activeFilterButton: {
		backgroundColor: '#f5911e',
	},
	filterButtonText: {
		fontSize: 12,
	},
	activeFilterButtonText: {
		color: '#fff',
		fontWeight: 'bold',
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
	emptyStateContainer: {
		padding: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyStateText: {
		opacity: 0.7,
		textAlign: 'center',
	},
})
