import { View, Text, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Pressable } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginScreen() {
	const { login, isLoading } = useAuth()

	const handleBungieLogin = async () => {
		try {
			await login()
			router.replace('/(tabs)')
		} catch (error) {
			console.error('Login error:', error)
			Alert.alert(
				'Authentication Failed', 
				error instanceof Error ? error.message : 'Something went wrong during authentication'
			)
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar style="light" />
			<View style={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>Auto Vault</Text>
					<Text style={styles.subtitle}>
						Automatically move items from your Destiny 2 postmaster to vault
					</Text>
				</View>

				<View style={styles.features}>
					<FeatureItem 
						icon="🎯" 
						text="Never lose loot to a full postmaster again" 
					/>
					<FeatureItem 
						icon="⚡" 
						text="Automatic transfers when postmaster fills up" 
					/>
					<FeatureItem 
						icon="🔒" 
						text="Secure authentication with Bungie.net" 
					/>
				</View>

				<View style={styles.authSection}>
					<Pressable
						style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
						onPress={handleBungieLogin}
						disabled={isLoading}
					>
						<Text style={styles.loginButtonText}>
							{isLoading ? 'Connecting...' : 'Connect with Bungie.net'}
						</Text>
						<Text style={styles.loginButtonSubtext}>
							{isLoading ? 'Please wait' : 'Sign in to get started'}
						</Text>
					</Pressable>

					<Text style={styles.disclaimer}>
						By signing in, you authorize Auto Vault to access your Destiny 2 character data and manage your inventory.
					</Text>
				</View>
			</View>
		</SafeAreaView>
	)
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
	return (
		<View style={styles.featureItem}>
			<Text style={styles.featureIcon}>{icon}</Text>
			<Text style={styles.featureText}>{text}</Text>
		</View>
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
		paddingVertical: 32,
		justifyContent: 'space-between',
	},
	header: {
		alignItems: 'center',
		marginTop: 60,
	},
	title: {
		fontSize: 42,
		fontWeight: '700',
		color: '#fff',
		marginBottom: 12,
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 18,
		color: '#888',
		textAlign: 'center',
		lineHeight: 24,
		maxWidth: 300,
	},
	features: {
		gap: 24,
		marginVertical: 40,
	},
	featureItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	featureIcon: {
		fontSize: 24,
		width: 32,
	},
	featureText: {
		fontSize: 16,
		color: '#ccc',
		flex: 1,
		lineHeight: 22,
	},
	authSection: {
		gap: 16,
		marginBottom: 40,
	},
	loginButton: {
		backgroundColor: '#1e40af',
		paddingVertical: 18,
		paddingHorizontal: 32,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 64,
	},
	loginButtonDisabled: {
		backgroundColor: '#374151',
	},
	loginButtonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 4,
	},
	loginButtonSubtext: {
		color: '#bfdbfe',
		fontSize: 14,
	},
	disclaimer: {
		fontSize: 12,
		color: '#666',
		textAlign: 'center',
		lineHeight: 16,
		marginTop: 8,
	},
})