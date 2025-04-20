import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { apiClient, setAuthToken, setUserInfo } from '@/api/client'
import { useAuth } from '@/context/AuthContext'

export default function AuthCallbackScreen() {
  const { code, error } = useLocalSearchParams()
  const router = useRouter()
  const { setUserData } = useAuth() // Get auth context
  const [status, setStatus] = useState('Authenticating with Bungie...')

  useEffect(() => {
    async function handleAuth() {
      try {
        if (error) {
          console.error('Auth error:', error)
          setStatus('Authentication error. Redirecting...')
          // Handle auth error, redirect back to login
          setTimeout(() => router.replace('/login'), 1500)
          return
        }

        if (code) {
          console.log('Received auth code')
          setStatus('Exchanging authorization code for token...')
          
          try {
            // Exchange the code for a token using our worker
            const tokenResponse = await apiClient.exchangeCodeForToken(code.toString())
            
            // Store the token
            await setAuthToken(tokenResponse.access_token)
            
            // Get user info
            setStatus('Fetching user profile...')
            const userProfile = await apiClient.getBungieUser()
            
            // Store user info in secure storage
            await setUserInfo(userProfile)
            
            // Update the context with the user data
            setUserData(userProfile)
            
            // Redirect to home page
            setStatus('Authentication successful! Redirecting...')
            setTimeout(() => router.replace('/'), 1000)
          } catch (tokenError) {
            console.error('Error exchanging token:', tokenError)
            setStatus('Authentication failed. Redirecting to login...')
            Alert.alert(
              'Authentication Failed',
              'Could not complete the authentication process. Please try again.',
              [{ text: 'OK', onPress: () => router.replace('/login') }]
            )
          }
        } else {
          // No code present, redirect to login
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
      <ThemedText style={{ marginTop: 20 }}>
        {status}
      </ThemedText>
    </ThemedView>
  )
}