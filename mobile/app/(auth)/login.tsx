import React from 'react'
import { StyleSheet, Image, TouchableOpacity, ActivityIndicator, View } from 'react-native'
import { useAuth } from '@/context/AuthContext'
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import * as Haptics from 'expo-haptics'

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth()

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await signIn()
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Auto Vault
      </ThemedText>
      
      <ThemedText style={styles.subtitle}>
        for Destiny 2
      </ThemedText>
      
      <ThemedText style={styles.description}>
        Automatically move weapons and armor from your postmaster to your vault
      </ThemedText>
      
      <ThemedText style={styles.instructions}>
        Login with your Bungie account to get started. 
        This app requires authorization to manage your Destiny 2 inventory.
      </ThemedText>
      
      <TouchableOpacity 
        style={styles.loginButton} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.loginButtonText}>
            Sign in with Bungie.net
          </ThemedText>
        )}
      </TouchableOpacity>
      
      <ThemedText style={styles.disclaimer}>
        This app is not affiliated with Bungie, Inc. 
        Destiny and Bungie are registered trademarks of Bungie, Inc.
      </ThemedText>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#f5911e', // Destiny-like color (orange)
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 20,
    opacity: 0.8,
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#f5911e', // Destiny-like color (orange)
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 250,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
    maxWidth: '80%',
  },
})