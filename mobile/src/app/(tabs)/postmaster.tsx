import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { postmasterService, type PostmasterData, type CharacterWithPostmaster, type PostmasterItem } from '../../services/postmaster'

export default function PostmasterScreen() {
	const { user } = useAuth()
	const [postmasterData, setPostmasterData] = useState<PostmasterData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isRefreshing, setIsRefreshing] = useState(false)

	const onRefresh = async () => {
		if (!user) return
		
		setIsRefreshing(true)
		try {
			const data = await postmasterService.getPostmasterItems(
				user.membershipType,
				user.membershipId
			)
			setPostmasterData(data)
		} catch (error) {
			console.error('Failed to load postmaster items:', error)
			Alert.alert('Error', 'Failed to load postmaster items')
		} finally {
			setIsRefreshing(false)
		}
	}

	useEffect(() => {
		const loadPostmasterItems = async () => {
			if (!user) return

			try {
				setIsLoading(true)
				const data = await postmasterService.getPostmasterItems(
					user.membershipType,
					user.membershipId
				)
				setPostmasterData(data)
			} catch (error) {
				console.error('Failed to load postmaster items:', error)
				Alert.alert('Error', 'Failed to load postmaster items')
			} finally {
				setIsLoading(false)
			}
		}

		loadPostmasterItems()
	}, [user])

	const renderCharacterCard = ({ item: character }: { item: CharacterWithPostmaster }) => (
		<View style={styles.characterCard}>
			<View style={styles.characterHeader}>
				<Text style={styles.characterClass}>
					{postmasterService.getClassTypeName(character.classType)}
				</Text>
				<Text style={styles.characterLight}>💡 {character.light}</Text>
			</View>
			
			<View style={styles.itemsSection}>
				<Text style={styles.itemsCount}>
					Postmaster Items: {character.postmasterItems.length}/21
				</Text>
				{character.postmasterItems.length === 0 ? (
					<Text style={styles.emptyText}>✅ Postmaster is empty</Text>
				) : (
					<>
						{character.postmasterItems.length >= 18 && (
							<Text style={styles.warningText}>⚠️ Postmaster is getting full!</Text>
						)}
						{character.postmasterItems.slice(0, 5).map((item, index) => (
							<View key={`${item.itemInstanceId}-${index}`} style={styles.itemRow}>
								<Text style={styles.itemText}>
									{postmasterService.getItemTypeName(item.bucketHash)}
								</Text>
								<Text style={styles.itemQuantity}>
									{item.quantity > 1 ? `×${item.quantity}` : ''}
								</Text>
							</View>
						))}
						{character.postmasterItems.length > 5 && (
							<Text style={styles.moreItemsText}>
								+{character.postmasterItems.length - 5} more items
							</Text>
						)}
					</>
				)}
			</View>
		</View>
	)

	if (isLoading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#1e40af" />
					<Text style={styles.loadingText}>Loading postmaster data...</Text>
				</View>
			</SafeAreaView>
		)
	}

	if (!postmasterData) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>Failed to load postmaster data</Text>
				</View>
			</SafeAreaView>
		)
	}

	const totalItems = postmasterService.getTotalPostmasterItems(postmasterData.characters)

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Postmaster</Text>
				<Text style={styles.subtitle}>
					Total items across all characters: {totalItems}
				</Text>
			</View>

			<View style={styles.vaultStatus}>
				<Text style={styles.vaultTitle}>Vault Space</Text>
				<View style={styles.vaultBar}>
					<View 
						style={[
							styles.vaultFill, 
							{ 
								width: `${(postmasterData.vaultSpace.used / postmasterData.vaultSpace.total) * 100}%`,
								backgroundColor: postmasterService.isVaultNearFull(postmasterData.vaultSpace) ? '#dc2626' : '#22c55e'
							}
						]} 
					/>
				</View>
				<Text style={styles.vaultText}>
					{postmasterData.vaultSpace.used}/{postmasterData.vaultSpace.total} 
					({postmasterData.vaultSpace.available} available)
				</Text>
			</View>

			<FlatList
				data={postmasterData.characters}
				keyExtractor={(item) => item.characterId}
				renderItem={renderCharacterCard}
				contentContainerStyle={styles.listContainer}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={onRefresh}
						tintColor="#1e40af"
					/>
				}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>No characters found</Text>
					</View>
				}
			/>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0a0a0a',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		color: '#888',
		marginTop: 16,
		fontSize: 16,
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	errorText: {
		color: '#dc2626',
		fontSize: 16,
	},
	header: {
		paddingHorizontal: 24,
		paddingVertical: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#333',
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		color: '#fff',
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: '#888',
	},
	vaultStatus: {
		paddingHorizontal: 24,
		paddingVertical: 16,
		backgroundColor: '#1a1a1a',
		borderBottomWidth: 1,
		borderBottomColor: '#333',
	},
	vaultTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#fff',
		marginBottom: 8,
	},
	vaultBar: {
		height: 8,
		backgroundColor: '#333',
		borderRadius: 4,
		marginBottom: 8,
	},
	vaultFill: {
		height: '100%',
		borderRadius: 4,
	},
	vaultText: {
		fontSize: 14,
		color: '#888',
	},
	listContainer: {
		padding: 24,
	},
	characterCard: {
		backgroundColor: '#1a1a1a',
		borderRadius: 12,
		padding: 20,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#333',
	},
	characterHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	characterClass: {
		fontSize: 18,
		fontWeight: '600',
		color: '#fff',
	},
	characterLight: {
		fontSize: 14,
		color: '#888',
	},
	itemsSection: {
		gap: 8,
	},
	itemsCount: {
		fontSize: 16,
		fontWeight: '600',
		color: '#ccc',
		marginBottom: 8,
	},
	warningText: {
		fontSize: 14,
		color: '#f59e0b',
		marginBottom: 8,
	},
	itemRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 4,
	},
	itemText: {
		fontSize: 14,
		color: '#888',
		flex: 1,
	},
	itemQuantity: {
		fontSize: 14,
		color: '#ccc',
		fontWeight: '600',
	},
	moreItemsText: {
		fontSize: 14,
		color: '#666',
		fontStyle: 'italic',
		marginTop: 4,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 40,
	},
	emptyText: {
		fontSize: 14,
		color: '#22c55e',
	},
})