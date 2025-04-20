import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

/**
 * Hook to handle incoming URL/deep links
 */
export function useURLHandler() {
	const router = useRouter()

	useEffect(() => {
		// Handle URLs that the app was opened with
		const handleInitialURL = async () => {
			const initialURL = await Linking.getInitialURL()
			if (initialURL) {
				handleURL(initialURL)
			}
		}

		// Handle URLs while the app is running
		const subscription = Linking.addEventListener('url', event => {
			handleURL(event.url)
		})

		handleInitialURL()

		return () => {
			subscription.remove()
		}
	}, [router])

	/**
	 * Parse and handle an incoming URL
	 */
	const handleURL = (url: string) => {
		if (!url) return
		const parsedURL = Linking.parse(url)
	}
}
