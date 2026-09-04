import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { auth } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import { getSocket } from '@/lib/socket';
import { LinearGradient } from 'expo-linear-gradient';

interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender: { full_name: string; role: string };
}

interface NewMessageEvent {
  conversation_id: string;
  message: ConversationMessage;
}

export default function ConversationThreadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { profile } = useUser();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const otherPartyName = messages.find((m) => m.sender_id !== profile?.id)?.sender.full_name;

  const fetchMessages = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/conversations/${id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const markRead = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/conversations/${id}/read`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.warn('Failed to mark conversation as read', err);
    }
  }, [id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Live delivery: append incoming messages for this conversation directly
  // to the list (no refetch needed). `connect` fires on the initial
  // connection and on every reconnect, so it doubles as a catch-up refetch
  // for anything missed while the socket was down -- Socket.io's own
  // reconnect logic handles that automatically. A 45s poll stays as a
  // lightweight safety net in case a socket silently stalls without ever
  // firing a `disconnect` event; the normal case is covered by the two
  // listeners above, so this is a rare-case fallback only.
  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (payload: NewMessageEvent) => {
      if (payload.conversation_id !== id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.message.id)) return prev;
        return [...prev, payload.message];
      });
    };

    const handleConnect = () => {
      fetchMessages();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('connect', handleConnect);

    const interval = setInterval(fetchMessages, 45000);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('connect', handleConnect);
      clearInterval(interval);
    };
  }, [id, fetchMessages]);

  useFocusEffect(
    useCallback(() => {
      markRead();
    }, [markRead])
  );

  const sendMessage = async () => {
    const body = inputText.trim();
    if (!body) return;
    setSending(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      setInputText('');

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || 'https://realshare-5l24.onrender.com'}/api/conversations/${id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body }),
        }
      );

      if (res.ok) {
        await fetchMessages();
      } else {
        setInputText(body); // restore so the user doesn't lose what they typed
      }
    } catch (err) {
      console.error('Failed to send', err);
      setInputText(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#111827', '#1E293B']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {otherPartyName || 'Secure Chat'}
        </Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      {loading && messages.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <ScrollView
          style={styles.messagesContainer}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No messages yet. Send a greeting!</Text>
            </View>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === profile?.id;
            return (
              <View key={msg.id} style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
                {!isMine && <Text style={styles.senderName}>{msg.sender.full_name}</Text>}
                <Text style={[styles.messageText, isMine && { color: '#0F172A' }]}>{msg.body}</Text>
                <Text style={styles.timeText}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          <Text style={styles.sendBtnText}>{sending ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 8 },
  backBtnText: { color: '#D4AF37', fontSize: 16, fontWeight: '700' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesContainer: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyStateText: { color: '#94A3B8', fontSize: 14 },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FDE68A', // Soft gold/yellow
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  senderName: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  messageText: { fontSize: 15, color: '#1E293B', lineHeight: 22 },
  timeText: { fontSize: 10, color: '#94A3B8', alignSelf: 'flex-end', marginTop: 4 },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 48,
    maxHeight: 120,
    fontSize: 15,
    color: '#0F172A',
  },
  sendBtn: {
    backgroundColor: '#111827',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendBtnText: {
    color: '#D4AF37',
    fontWeight: '800',
    fontSize: 14,
  },
});
