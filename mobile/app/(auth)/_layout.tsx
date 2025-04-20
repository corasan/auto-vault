import React from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function AuthLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
      </Stack>
      <StatusBar style="auto" />
    </>
  )
}