import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useVaultPostmaster } from '../api/queries'
import { ThemedText } from './ThemedText'
import { ThemedView } from './ThemedView'

interface VaultPostmasterButtonProps {
	characterId: string
}

export function VaultPostmasterButton({ characterId }: VaultPostmasterButtonProps) {
	const { mutate, isPending, isError, error, data, isSuccess } = useVaultPostmaster()

	const handlePress = async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
		mutate(characterId)
	}

	return (
		<ThemedView style={styles.container}>
			<TouchableOpacity 
				style={styles.button} 
				onPress={handlePress}
				disabled={isPending}
			>
				{isPending ? (
					<ActivityIndicator color="#fff" />
				) : (
					<Text style={styles.buttonText}>Vault Postmaster Items</Text>
				)}
			</TouchableOpacity>
			
			{isError && (
				<ThemedText style={styles.error}>
					{error instanceof Error ? error.message : 'An error occurred'}
				</ThemedText>
			)}
			
			{isSuccess && data && (
				<ThemedText style={styles.result}>
					Transferred {data.transferred} of {data.total} items to vault
				</ThemedText>
			)}
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		alignItems: 'center'
	},
	button: {
		backgroundColor: '#5662f6',
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 6,
		minWidth: 200,
		alignItems: 'center'
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16
	},
	error: {
		color: '#ff3b30',
		marginTop: 10
	},
	result: {
		marginTop: 10
	}
})