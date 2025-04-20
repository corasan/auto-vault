'use server'

import { Text } from 'react-native'

export default async function hello({ name }: { name: string }) {
	// Securely fetch data from an API, and read environment variables...
	return <Text>Hello, {name}!</Text>
}
