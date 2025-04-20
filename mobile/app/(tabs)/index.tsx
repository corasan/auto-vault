import { Image, ScrollView, StyleSheet, View } from 'react-native'

import { useHealthCheck } from '@/api/queries'
import { HelloWave } from '@/components/HelloWave'
import ParallaxScrollView from '@/components/ParallaxScrollView'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { VaultPostmasterButton } from '@/components/VaultPostmasterButton'
import { useAuth } from '@/context/AuthContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function HomeScreen() {
	// Example of using a query from the API
	const { isLoading, isError, data } = useHealthCheck()
	const { user } = useAuth()
	const { top } = useSafeAreaInsets()

	return (
		<View style={{ flex: 1 }}>
			<ScrollView
				contentContainerStyle={[styles.contentContainerStyle, { paddingTop: top + 20 }]}
			>
				{/* Welcome message with user info */}
				{user && (
					<ThemedView style={styles.welcomeContainer}>
						<ThemedView style={styles.userInfoContainer}>
							{user.profilePicture && (
								<Image
									source={{ uri: user.profilePicture }}
									style={styles.profilePicture}
								/>
							)}
							<ThemedView>
								<ThemedText type="subtitle">Welcome, {user.displayName}!</ThemedText>
								<ThemedText style={styles.membershipId}>
									Membership ID: {user.membershipId}
								</ThemedText>
							</ThemedView>
						</ThemedView>
						<ThemedText style={styles.connectedText}>
							Your Bungie account is connected and ready to use Auto Vault.
						</ThemedText>
					</ThemedView>
				)}

				<ThemedView style={styles.apiStatusContainer}>
					<ThemedText type="subtitle">API Status</ThemedText>
					{isLoading ? (
						<ThemedText>Checking API status...</ThemedText>
					) : isError ? (
						<ThemedText style={styles.errorText}>API is unavailable</ThemedText>
					) : (
						<ThemedText style={styles.successText}>
							API Status: {data?.status || 'Unknown'}
						</ThemedText>
					)}
				</ThemedView>

				<ThemedView style={styles.stepContainer}>
					<ThemedText type="subtitle">Vault Postmaster Items</ThemedText>
					<ThemedText>
						Click the button below to move items from your postmaster to the vault.
					</ThemedText>
					{user ? (
						<VaultPostmasterButton characterId={user.membershipId} />
					) : (
						<ThemedText style={styles.errorText}>
							Please log in to use this feature
						</ThemedText>
					)}
				</ThemedView>

				<ThemedView style={styles.stepContainer}>
					<ThemedText type="subtitle">Features</ThemedText>
					<ThemedText>
						• Automatically moves weapons and armor from postmaster to vault{'\n'}•
						Prevents loss of valuable items when postmaster is full{'\n'}• Uses Bungie's
						official API for safe item transfers
					</ThemedText>
				</ThemedView>
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	contentContainerStyle: {
		gap: 8,
		paddingBottom: 100,
		paddingHorizontal: 16,
	},
	titleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	welcomeContainer: {
		gap: 12,
		marginBottom: 16,
		padding: 16,
		borderRadius: 8,
		backgroundColor: 'rgba(245, 145, 30, 0.1)', // Destiny orange with opacity
	},
	userInfoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	profilePicture: {
		width: 50,
		height: 50,
		borderRadius: 25,
		borderWidth: 2,
		borderColor: '#f5911e',
	},
	membershipId: {
		fontSize: 12,
		opacity: 0.8,
	},
	connectedText: {
		marginTop: 4,
	},
	apiStatusContainer: {
		gap: 8,
		marginBottom: 16,
	},
	errorText: {
		color: '#ff3b30',
	},
	successText: {
		color: '#34c759',
	},
	stepContainer: {
		gap: 8,
		marginBottom: 16,
	},
	reactLogo: {
		height: 178,
		width: 290,
		bottom: 0,
		left: 0,
		position: 'absolute',
	},
})
