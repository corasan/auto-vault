import { router } from 'expo-router'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../contexts/AuthContext'

export default function HomeScreen() {
	const { user, logout, isLoading } = useAuth()

	const handleLogout = async () => {
		Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Sign Out',
				style: 'destructive',
				onPress: async () => {
					try {
						await logout()
						router.replace('/(auth)/login')
					} catch (error) {
						console.error('Logout error:', error)
						Alert.alert('Error', 'Failed to sign out')
					}
				},
			},
		])
	}

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={{ paddingBottom: 70 }}>
				<View style={styles.content}>
					<View style={styles.header}>
						<Text style={styles.title}>Auto Vault</Text>
						{user && (
							<Text style={styles.welcome}>Welcome back, {user.displayName}!</Text>
						)}
					</View>

					{user && (
						<View style={styles.userSection}>
							<Text style={styles.sectionTitle}>Guardian Profile</Text>
							<View style={styles.userCard}>
								<View style={styles.userInfo}>
									<Text style={styles.userDisplayName}>{user.displayName}</Text>
									<Text style={styles.userSubtext}>
										Bungie.net ID: {user.bungieNetId || 'Not available'}
									</Text>
									<Text style={styles.userSubtext}>
										Platform: {user.platformDisplayName || 'Not available'}
									</Text>
									<Text style={styles.userSubtext}>
										Primary Platform:{' '}
										{user.platforms?.find(p => p.membershipType === user.membershipType)
											?.platformName || 'Unknown'}
									</Text>
								</View>
								{user.platforms && user.platforms.length > 1 && (
									<View style={styles.platformsInfo}>
										<Text style={styles.platformsTitle}>Available Platforms:</Text>
										{user.platforms.map(platform => (
											<Text
												key={`${platform.membershipType}-${platform.membershipId}`}
												style={styles.platformItem}
											>
												• {platform.platformName} - {platform.displayName}
											</Text>
										))}
									</View>
								)}
							</View>
						</View>
					)}

					<View style={styles.statusSection}>
						<Text style={styles.sectionTitle}>Status</Text>
						<View style={styles.statusCard}>
							<Text style={styles.statusText}>🟢 Connected to Bungie.net</Text>
							<Text style={styles.statusSubtext}>
								Auto vault is ready to protect your loot
							</Text>
						</View>
					</View>

					<View style={styles.actionsSection}>
						<Pressable
							style={styles.actionButton}
							onPress={() => router.push('/(tabs)/postmaster')}
						>
							<Text style={styles.actionButtonText}>View Postmaster</Text>
							<Text style={styles.actionButtonSubtext}>Check current items</Text>
						</Pressable>

						<Pressable style={styles.actionButton}>
							<Text style={styles.actionButtonText}>Vault Status</Text>
							<Text style={styles.actionButtonSubtext}>See available space</Text>
						</Pressable>

						<Pressable style={styles.actionButton}>
							<Text style={styles.actionButtonText}>Settings</Text>
							<Text style={styles.actionButtonSubtext}>Configure auto vault</Text>
						</Pressable>
					</View>

					<View style={styles.footer}>
						<Pressable
							style={[
								styles.logoutButton,
								{ backgroundColor: '#f59e0b', marginBottom: 12 },
							]}
							onPress={async () => {
								await logout()
								router.replace('/(auth)/login')
							}}
							disabled={isLoading}
						>
							<Text style={styles.logoutButtonText}>Force Fresh Login (Debug)</Text>
						</Pressable>
						<Pressable
							style={styles.logoutButton}
							onPress={handleLogout}
							disabled={isLoading}
						>
							<Text style={styles.logoutButtonText}>
								{isLoading ? 'Signing Out...' : 'Sign Out'}
							</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#0a0a0a',
	},
	content: {
		flex: 1,
		paddingHorizontal: 24,
		paddingVertical: 20,
	},
	header: {
		alignItems: 'center',
		marginBottom: 32,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		color: '#fff',
		marginBottom: 8,
	},
	welcome: {
		fontSize: 16,
		color: '#888',
		textAlign: 'center',
	},
	userSection: {
		marginBottom: 24,
	},
	userCard: {
		backgroundColor: '#1a1a1a',
		padding: 20,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#333',
	},
	userInfo: {
		marginBottom: 16,
	},
	userDisplayName: {
		fontSize: 18,
		fontWeight: '600',
		color: '#fff',
		marginBottom: 4,
	},
	userSubtext: {
		fontSize: 14,
		color: '#888',
		marginBottom: 2,
	},
	platformsInfo: {
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: '#333',
	},
	platformsTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#ccc',
		marginBottom: 8,
	},
	platformItem: {
		fontSize: 13,
		color: '#888',
		marginBottom: 4,
	},
	statusSection: {
		marginBottom: 32,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: '#fff',
		marginBottom: 16,
	},
	statusCard: {
		backgroundColor: '#1a1a1a',
		padding: 20,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#333',
	},
	statusText: {
		fontSize: 16,
		color: '#fff',
		marginBottom: 4,
	},
	statusSubtext: {
		fontSize: 14,
		color: '#888',
	},
	actionsSection: {
		flex: 1,
		gap: 12,
	},
	actionButton: {
		backgroundColor: '#1a1a1a',
		padding: 20,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#333',
	},
	actionButtonText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#fff',
		marginBottom: 4,
	},
	actionButtonSubtext: {
		fontSize: 14,
		color: '#888',
	},
	footer: {
		marginTop: 20,
	},
	logoutButton: {
		backgroundColor: '#dc2626',
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
		alignItems: 'center',
	},
	logoutButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
})
