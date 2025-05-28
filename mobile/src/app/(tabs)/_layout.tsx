import { Tabs } from 'expo-router'
import React from 'react'
import { Platform } from 'react-native'
import TabBarBackground from '~/components/ui/TabBarBackground'

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: {
						position: 'absolute',
					},
					default: {},
				}),
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Home',
				}}
			/>
			<Tabs.Screen
				name="postmaster"
				options={{
					title: 'Postmaster',
				}}
			/>
		</Tabs>
	)
}
