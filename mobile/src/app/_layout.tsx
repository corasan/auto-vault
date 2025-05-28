import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import 'react-native-reanimated'
import 'expo-dev-client'
import { useReactQueryDevTools } from '@dev-plugins/react-query'
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native'
import { AuthProvider, useAuth } from '~/contexts/AuthContext'
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme'
import { NAV_THEME } from '~/theme'

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			retry: 1,
		},
	},
})

SplashScreen.preventAutoHideAsync()

function RootLayoutNav() {
	const { isAuthenticated, isLoading } = useAuth()
	const segments = useSegments()
	const router = useRouter()

	useEffect(() => {
		if (isLoading) return

		const inAuthGroup = segments[0] === '(auth)'

		if (isAuthenticated && inAuthGroup) {
			router.replace('/(tabs)')
		} else if (!isAuthenticated && !inAuthGroup) {
			router.replace('/(auth)/login')
		}
	}, [isAuthenticated, isLoading, segments])

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(auth)" options={{ headerShown: false }} />
			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
		</Stack>
	)
}

export default function RootLayout() {
	useReactQueryDevTools(queryClient)
	useInitialAndroidBarSync()
	const { colorScheme, isDarkColorScheme } = useColorScheme()
	const [loaded] = useFonts({
		SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
	})

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync()
		}
	}, [loaded])

	if (!loaded) {
		return null
	}

	return (
		<QueryClientProvider client={queryClient}>
			<StatusBar
				key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
				style={isDarkColorScheme ? 'light' : 'dark'}
			/>
			<NavThemeProvider value={NAV_THEME[colorScheme]}>
				<AuthProvider>
					<RootLayoutNav />
					<StatusBar style="auto" />
				</AuthProvider>
			</NavThemeProvider>
		</QueryClientProvider>
	)
}
