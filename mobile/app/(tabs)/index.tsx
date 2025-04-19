import { Image, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { VaultPostmasterButton } from '@/components/VaultPostmasterButton';
import { useHealthCheck } from '@/api/queries';

export default function HomeScreen() {
  // Example of using a query from the API
  const { isLoading, isError, data } = useHealthCheck();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Auto Vault</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.apiStatusContainer}>
        <ThemedText type="subtitle">API Status</ThemedText>
        {isLoading ? (
          <ThemedText>Checking API status...</ThemedText>
        ) : isError ? (
          <ThemedText style={styles.errorText}>API is unavailable</ThemedText>
        ) : (
          <ThemedText style={styles.successText}>
            API Status: {data?.status || 'Unknown'}
          </ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Vault Postmaster Items</ThemedText>
        <ThemedText>
          Click the button below to move items from your postmaster to the vault.
        </ThemedText>
        <VaultPostmasterButton characterId="mock-character-id" />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Features</ThemedText>
        <ThemedText>
          • Automatically moves weapons and armor from postmaster to vault{'\n'}
          • Prevents loss of valuable items when postmaster is full{'\n'}
          • Uses Bungie's official API for safe item transfers
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apiStatusContainer: {
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff3b30',
  },
  successText: {
    color: '#34c759',
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});