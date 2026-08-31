import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Shadows, Radius } from '@/constants/design';
import { GoldButton } from './GoldButton';

interface GuestViewProps {
  title: string;
  description: string;
  icon?: string;
}

export function GuestView({ title, description, icon = '🔒' }: GuestViewProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        
        <GoldButton 
          title="Sign In to Continue" 
          onPress={() => router.push('/(auth)/sign-in')} 
          style={{ width: '100%', marginTop: 24 }}
        />
        <GoldButton 
          title="Create Account" 
          onPress={() => router.push('/(auth)/sign-up')} 
          variant="outline"
          style={{ width: '100%', marginTop: 12 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Neutrals.surface,
    padding: 32,
    borderRadius: Radius.xl,
    width: '100%',
    alignItems: 'center',
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    ...Typography.headlineLarge,
    color: Neutrals.obsidian,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    ...Typography.bodyLarge,
    color: Neutrals.gray500,
    textAlign: 'center',
    lineHeight: 24,
  },
});
