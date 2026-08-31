import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';

const POSTS = [
  { id: '1', author: 'Anita Rao', role: 'Real Estate Expert', time: '2 hours ago', content: 'The Gachibowli extension phase is driving a massive 15% YoY appreciation. Great time to invest!', likes: 124, comments: 18 },
  { id: '2', author: 'Rahul Sharma', role: 'Homeowner', time: '5 hours ago', content: 'Just used RealShare AI to find my dream apartment. The legal verification feature saved me from a major dispute. Highly recommend!', likes: 89, comments: 5 },
];

export default function CommunityScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Write Post */}
        <View style={styles.writePostCard}>
          <View style={styles.writePostHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>Y</Text>
            </View>
            <Text style={styles.writePostPlaceholder}>Share an update or ask a question...</Text>
          </View>
          <View style={styles.writePostActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Text>📷 Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.postBtn}>
              <Text style={styles.postBtnText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feed */}
        {POSTS.map(post => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={[styles.avatar, { backgroundColor: Neutrals.gray100 }]}>
                <Text style={[styles.avatarText, { color: Neutrals.obsidian }]}>{post.author.charAt(0)}</Text>
              </View>
              <View style={styles.postMeta}>
                <Text style={styles.postAuthor}>{post.author}</Text>
                <Text style={styles.postRole}>{post.role} • {post.time}</Text>
              </View>
            </View>
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.postFooter}>
              <TouchableOpacity style={styles.interactionBtn}>
                <Text style={styles.interactionIcon}>👍</Text>
                <Text style={styles.interactionText}>{post.likes}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.interactionBtn}>
                <Text style={styles.interactionIcon}>💬</Text>
                <Text style={styles.interactionText}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.interactionBtn}>
                <Text style={styles.interactionIcon}>↗️</Text>
                <Text style={styles.interactionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Neutrals.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: Neutrals.surface,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 24,
    color: Neutrals.obsidian,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  writePostCard: {
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 24,
    ...Shadows.soft,
  },
  writePostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GoldSystem.paleGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    ...Typography.labelMedium,
    color: GoldSystem.darkGold,
  },
  writePostPlaceholder: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    flex: 1,
  },
  writePostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Neutrals.gray100,
    paddingTop: 12,
  },
  actionBtn: {
    padding: 8,
  },
  postBtn: {
    backgroundColor: Neutrals.obsidian,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  postBtnText: {
    ...Typography.labelMedium,
    color: Neutrals.surface,
  },
  postCard: {
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
    marginBottom: 16,
    ...Shadows.soft,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postMeta: {
    flex: 1,
  },
  postAuthor: {
    ...Typography.labelLarge,
    color: Neutrals.obsidian,
  },
  postRole: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  postContent: {
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
    lineHeight: 22,
    marginBottom: 16,
  },
  postFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Neutrals.gray100,
    paddingTop: 12,
  },
  interactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  interactionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  interactionText: {
    ...Typography.labelMedium,
    color: Neutrals.gray600,
  },
});
