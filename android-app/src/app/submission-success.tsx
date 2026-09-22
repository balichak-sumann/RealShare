import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GoldSystem, Neutrals } from '@/constants/design';
import { useUser } from '@/contexts/UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubmissionSuccessScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const params = useLocalSearchParams();
  const propertyId = params.id as string;
  const title = params.title as string;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}>
        <View style={styles.container}>
          <Ionicons name="checkmark-circle" size={80} color="#10B981" style={{ marginBottom: 20 }} />
          
          <Text style={styles.title}>
            Success! 🎉
          </Text>
          
          <Text style={styles.message}>
            Property <Text style={{ fontWeight: '700' }}>"{title || 'Listing'}"</Text> has been submitted successfully.
          </Text>
          
          <Text style={styles.submessage}>
            {profile?.role === 'admin' 
              ? 'Your property is now LIVE and visible to all users.' 
              : 'The Admin will review and approve it shortly. Once approved, it will be visible on the platform.'}
          </Text>
          
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                if (propertyId && propertyId !== 'draft') {
                  router.replace(`/property/${propertyId}`);
                } else {
                  router.replace('/');
                }
              }}
            >
              <Text style={styles.primaryButtonText}>View Listing</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                if (profile?.role === 'agent') {
                  router.replace('/agent-portal');
                } else if (profile?.role === 'builder') {
                  router.replace('/builder-portal');
                } else {
                  router.replace('/profile');
                }
              }}
            >
              <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 500,
    marginTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Neutrals.obsidian,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Neutrals.gray800,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  submessage: {
    fontSize: 14,
    color: Neutrals.gray600,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: GoldSystem.primaryGold,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: Neutrals.gray800,
    fontWeight: '600',
    fontSize: 15,
  }
});
