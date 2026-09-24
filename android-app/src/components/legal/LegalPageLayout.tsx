import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, Typography } from '@/constants/design';
import { useResponsive } from '@/hooks/useResponsive';
import { WebFooter } from '@/components/layout/WebFooter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface LegalSection {
  heading: string;
  body: string[];
}

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

export function LegalPageLayout({ title, lastUpdated, intro, sections }: LegalPageLayoutProps) {
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    // On web (especially mobile Safari), Expo Router's canGoBack() can
    // report true while router.back() silently fails because the in-app
    // router history and browser history are out of sync.  Using the
    // browser's native history.back() is more reliable.  If there's no
    // prior page (e.g. user opened the URL directly), we fall back to
    // navigating home.
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      } else {
        router.replace('/');
      }
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 18 : Math.max(insets.top, 50) }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={[styles.body, isDesktop && styles.bodyDesktop]}>
          <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
          <Text style={styles.intro}>{intro}</Text>

          {sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={styles.sectionHeading}>{section.heading}</Text>
              {section.body.map((para, i) => (
                <Text key={i} style={styles.paragraph}>{para}</Text>
              ))}
            </View>
          ))}
        </View>
        <WebFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutrals.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Neutrals.surface, borderBottomWidth: 1, borderBottomColor: Neutrals.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backIcon: { fontSize: 24, color: Neutrals.obsidian },
  headerTitle: { ...Typography.headlineMedium, color: Neutrals.obsidian },
  body: { padding: 24 },
  bodyDesktop: { maxWidth: 780, width: '100%', alignSelf: 'center', paddingHorizontal: 0, paddingTop: 32 },
  lastUpdated: { ...Typography.caption, color: Neutrals.gray400, marginBottom: 16 },
  intro: { ...Typography.bodyLarge, color: Neutrals.gray600, lineHeight: 23, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionHeading: { ...Typography.headlineMedium, color: Neutrals.obsidian, marginBottom: 10 },
  paragraph: { ...Typography.bodyMedium, color: Neutrals.gray600, lineHeight: 21, marginBottom: 10 },
});

export default LegalPageLayout;
