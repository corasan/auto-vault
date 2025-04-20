import { apiClient, setAuthToken, setUserInfo } from '@/api/client'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { useAuth } from '@/context/AuthContext'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert } from 'react-native'

export default function AuthCallbackScreen() {
	const { code, error } = useLocalSearchParams()
	const router = useRouter()
	const { setUserData } = useAuth() // Get auth context
	const [status, setStatus] = useState('Authenticating with Bungie...')

	useEffect(() => {
		async function handleAuth() {
			try {
				if (error) {
					setStatus('Authentication error. Redirecting...')
					setTimeout(() => router.replace('/login'), 1500)
					return
				}

				if (code) {
					setStatus('Exchanging authorization code for token...')

					try {
						const tokenResponse = await apiClient.exchangeCodeForToken(code.toString())
						await setAuthToken(tokenResponse.access_token)
						setStatus('Fetching user profile...')
						const userProfile = await apiClient.getBungieUser()
						await setUserInfo(userProfile)
						setUserData(userProfile)
						setStatus('Authentication successful! Redirecting...')
						setTimeout(() => router.replace('/'), 1000)
					} catch (tokenError) {
						console.error('Error exchanging token:', tokenError)
						setStatus('Authentication failed. Redirecting to login...')
						Alert.alert(
							'Authentication Failed',
							'Could not complete the authentication process. Please try again.',
							[{ text: 'OK', onPress: () => router.replace('/login') }],
						)
					}
				} else {
					setStatus('Missing authorization code. Redirecting...')
					setTimeout(() => router.replace('/login'), 1500)
				}
			} catch (err) {
				console.error('Error handling auth callback:', err)
				setStatus('An unexpected error occurred. Redirecting...')
				setTimeout(() => router.replace('/login'), 1500)
			}
		}

		handleAuth()
	}, [code, error, router, setUserData])

	return (
		<ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
			<ActivityIndicator size="large" color="#5662f6" />
			<ThemedText style={{ marginTop: 20 }}>{status}</ThemedText>
		</ThemedView>
	)
}
