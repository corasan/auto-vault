import React from 'react'
import { Image, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from './ThemedText'
import { ThemedView } from './ThemedView'

// Rarity colors based on Destiny 2
const rarityColors = {
	Common: '#c3bcb4', // white/grey
	Uncommon: '#366f42', // green
	Rare: '#5076a3', // blue
	Legendary: '#522f65', // purple
	Exotic: '#ceae33', // yellow/gold
}

export interface DestinyItemProps {
	id: string
	name: string
	type: string
	subType?: string
	icon: string
	rarity: keyof typeof rarityColors
	power?: number
	isInPostmaster?: boolean
	onPress?: (id: string) => void
}

export function DestinyItem({
	id,
	name,
	type,
	subType,
	icon,
	rarity,
	power,
	isInPostmaster = false,
	onPress,
}: DestinyItemProps) {
	const handlePress = () => {
		if (onPress) {
			onPress(id)
		}
	}

	return (
		<TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
			<ThemedView style={[styles.itemContainer, isInPostmaster && styles.postmasterItem]}>
				{/* <Image
          source={{ uri: icon }}
          style={styles.itemIcon}
        /> */}

				<ThemedView style={styles.itemDetails}>
					<ThemedText style={styles.itemName}>{name}</ThemedText>
					<ThemedView style={styles.itemSubDetails}>
						<ThemedView
							style={[styles.rarityIndicator, { backgroundColor: rarityColors[rarity] }]}
						/>
						<ThemedText style={styles.itemType}>
							{subType ? `${subType} ${type}` : type}
						</ThemedText>
						{power && <ThemedText style={styles.powerLevel}>{power}</ThemedText>}
					</ThemedView>
				</ThemedView>

				{isInPostmaster && (
					<ThemedView style={styles.postmasterBadge}>
						<ThemedText style={styles.postmasterText}>Postmaster</ThemedText>
					</ThemedView>
				)}
			</ThemedView>
		</TouchableOpacity>
	)
}

export function ItemsList({
	title,
	items,
	onItemPress,
}: {
	title: string
	items: DestinyItemProps[]
	onItemPress?: (id: string) => void
}) {
	if (items.length === 0) {
		return null
	}

	return (
		<ThemedView style={styles.sectionContainer}>
			<ThemedText type="subtitle">{title}</ThemedText>
			<ThemedView style={styles.itemsGrid}>
				{items.map(item => (
					<DestinyItem key={item.id} {...item} onPress={onItemPress} />
				))}
			</ThemedView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		marginVertical: 4,
		width: '100%',
	},
	itemContainer: {
		flexDirection: 'row',
		borderRadius: 8,
		padding: 10,
		backgroundColor: 'rgba(30, 30, 30, 0.3)',
		alignItems: 'center',
	},
	postmasterItem: {
		borderLeftWidth: 3,
		borderLeftColor: '#ff9e21', // Orange for postmaster items
	},
	itemIcon: {
		width: 50,
		height: 50,
		borderRadius: 4,
		marginRight: 12,
	},
	itemDetails: {
		flex: 1,
		justifyContent: 'center',
	},
	itemName: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	itemSubDetails: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	rarityIndicator: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 6,
	},
	itemType: {
		fontSize: 12,
		opacity: 0.8,
		flex: 1,
	},
	powerLevel: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#f5911e', // Destiny orange for power level
	},
	postmasterBadge: {
		backgroundColor: '#ff9e21',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
		marginLeft: 8,
	},
	postmasterText: {
		color: '#000',
		fontSize: 10,
		fontWeight: 'bold',
	},
	sectionContainer: {
		marginBottom: 16,
		width: '100%',
	},
	itemsGrid: {
		marginTop: 8,
	},
})
