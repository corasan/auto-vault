import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { useAuth } from '@/context/AuthContext'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'

export default function ProfileScreen() {
	const { user, signOut } = useAuth()

	const handleSignOut = async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

		Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Sign Out',
				style: 'destructive',
				onPress: async () => {
					await signOut()
				},
			},
		])
	}

	return (
		<ScrollView>
			<ThemedView style={styles.container}>
				<ThemedView style={styles.profileHeader}>
					<ThemedText type="title">Profile</ThemedText>

					{user && (
						<ThemedView style={styles.userInfo}>
							<ThemedText type="subtitle">{user.displayName}</ThemedText>
							<ThemedText>Membership ID: {user.membershipId}</ThemedText>
						</ThemedView>
					)}
				</ThemedView>

				<ThemedView style={styles.section}>
					<ThemedText type="subtitle">Account Settings</ThemedText>

					{/* Placeholder for future settings */}
					<ThemedText>Additional settings will appear here</ThemedText>
				</ThemedView>

				<ThemedView style={styles.section}>
					<ThemedText type="subtitle">About</ThemedText>

					<ThemedText style={styles.aboutText}>
						Auto Vault is a tool for Destiny 2 players to automatically transfer items
						from postmaster to vault to prevent them from being lost when postmaster fills
						up during gameplay.
					</ThemedText>
				</ThemedView>

				<TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
					<ThemedText style={styles.signOutText}>Sign Out</ThemedText>
				</TouchableOpacity>
			</ThemedView>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	profileHeader: {
		marginBottom: 30,
	},
	userInfo: {
		marginTop: 15,
		paddingVertical: 15,
		paddingHorizontal: 15,
		borderRadius: 8,
		backgroundColor: 'rgba(86, 98, 246, 0.1)',
	},
	section: {
		marginBottom: 25,
	},
	aboutText: {
		marginTop: 10,
		lineHeight: 22,
	},
	signOutButton: {
		marginTop: 'auto',
		backgroundColor: '#ff3b30',
		paddingVertical: 15,
		borderRadius: 8,
		alignItems: 'center',
	},
	signOutText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
})
