import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Neutrals, GoldSystem, Radius, Typography, Shadows } from '@/constants/design';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onVoicePress?: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onFocus,
  onVoicePress,
  placeholder = 'Search locality, project, builder...',
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor={Neutrals.gray400}
      />
      {onVoicePress && (
        <TouchableOpacity style={styles.voiceBtn} onPress={onVoicePress}>
          <Text style={styles.voiceIcon}>🎤</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Neutrals.surface,
    height: 54,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    ...Shadows.soft,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  searchIcon: {
    fontSize: 18,
    color: GoldSystem.metallicGold,
    marginRight: 12,
  },
  input: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Neutrals.text,
    height: '100%',
  },
  voiceBtn: {
    padding: 8,
  },
  voiceIcon: {
    fontSize: 18,
    color: GoldSystem.metallicGold,
  },
});
