import { router } from 'expo-router'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
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
			<View style={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>Auto Vault</Text>
					{user && <Text style={styles.welcome}>Welcome back, {user.displayName}!</Text>}
				</View>

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
					<Pressable style={styles.actionButton}>
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
