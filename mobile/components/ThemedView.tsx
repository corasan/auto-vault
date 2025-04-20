'use client'

import { StyleSheet, View, type ViewProps } from 'react-native'

import { useThemeColor } from '@/hooks/useThemeColor'

export type ThemedViewProps = ViewProps & {
	lightColor?: string
	darkColor?: string
}

export function ThemedView({
	style,
	lightColor,
	darkColor,
	...otherProps
}: ThemedViewProps) {
	const backgroundColor = useThemeColor(
		{ light: lightColor, dark: darkColor },
		'background',
	)

	return <View style={[{ backgroundColor }, styles.container, style]} {...otherProps} />
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 12,
	},
})
