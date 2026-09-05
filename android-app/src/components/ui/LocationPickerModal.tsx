import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { useLocation } from '@/contexts/LocationContext';

// RealShare is currently live (has real listings) only in Hyderabad. The rest
// of the cities are shown honestly as upcoming markets rather than hidden or
// silently faked with Hyderabad data under a different city's name.
const LIVE_CITIES = ['Hyderabad'];

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LocationPickerModal({ visible, onClose }: LocationPickerModalProps) {
  const { city, setCity, availableCities } = useLocation();

  const handleSelect = (selected: string) => {
    setCity(selected);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose your city</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Neutrals.gray600} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            RealShare listings are currently live in Hyderabad. Other cities are launching soon.
          </Text>

          <View style={styles.list}>
            {availableCities.map((c) => {
              const isSelected = c === city;
              const isLive = LIVE_CITIES.includes(c);
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => handleSelect(c)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowText, isSelected && styles.rowTextSelected]}>{c}</Text>
                    {!isLive && <Text style={styles.comingSoonTag}>Coming soon</Text>}
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={GoldSystem.primaryGold} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 26, 0.55)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  card: {
    backgroundColor: Neutrals.surface,
    borderTopLeftRadius: Platform.OS === 'web' ? Radius.lg : 24,
    borderTopRightRadius: Platform.OS === 'web' ? Radius.lg : 24,
    borderBottomLeftRadius: Platform.OS === 'web' ? Radius.lg : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? Radius.lg : 0,
    padding: 24,
    width: Platform.OS === 'web' ? 380 : '100%',
    maxWidth: '100%',
    ...Shadows.strong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    marginBottom: 16,
    lineHeight: 18,
  },
  list: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  rowSelected: {
    backgroundColor: Neutrals.gray100,
  },
  rowText: {
    ...Typography.bodyLarge,
    color: Neutrals.obsidian,
    fontWeight: '600',
  },
  rowTextSelected: {
    color: GoldSystem.primaryGold,
  },
  comingSoonTag: {
    ...Typography.caption,
    color: Neutrals.gray400,
    marginTop: 2,
  },
});
