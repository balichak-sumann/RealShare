import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '@/lib/firebase';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = (await auth.currentUser?.getIdToken()) || 'MOCK_TOKEN';
      const res = await fetch('http://localhost:3000/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && !data.error) {
        setUser(data);
      } else {
        // Fallback mock user for local testing
        setUser({
          full_name: auth.currentUser?.displayName || 'Rahul Sharma',
          email: auth.currentUser?.email || 'rahul@example.com',
          phone_number: '+91 98765 43210',
          avatar_url: null,
          wallet_balance: 0,
          kyc_status: 'not_submitted',
          role: 'investor',
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      // Fallback mock user
      setUser({
        full_name: auth.currentUser?.displayName || 'Rahul Sharma',
        email: auth.currentUser?.email || 'rahul@example.com',
        phone_number: '+91 98765 43210',
        avatar_url: null,
        wallet_balance: 0,
        kyc_status: 'not_submitted',
        role: 'investor',
        created_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarEdit = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setUser({ ...user, avatar_url: imageUri });
        // In a real app, we would upload this to Firebase Storage/S3 here
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/sign-in' as any);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getKycStatusStyle = (status: string) => {
    switch (status) {
      case 'verified': return { bg: '#D1FAE5', text: '#059669', label: '✓ Verified' };
      case 'pending': return { bg: '#FEF3C7', text: '#D97706', label: '⏳ Pending Review' };
      case 'rejected': return { bg: '#FEE2E2', text: '#DC2626', label: '✕ Rejected' };
      default: return { bg: '#F3F4F6', text: '#6B7280', label: 'Not Submitted' };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  const kycInfo = getKycStatusStyle(user?.kyc_status || 'not_submitted');
  const initials = (user?.full_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarBtn} onPress={handleAvatarEdit}>
              <Text style={styles.editAvatarText}>📷</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          <Text style={styles.userRole}>{(user?.role || 'investor').charAt(0).toUpperCase() + (user?.role || 'investor').slice(1)}</Text>

          {/* KYC Badge */}
          <View style={[styles.kycBadge, { backgroundColor: kycInfo.bg }]}>
            <Text style={[styles.kycBadgeText, { color: kycInfo.text }]}>{kycInfo.label}</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Text style={styles.infoIcon}>📧</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{user?.email || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Text style={styles.infoIcon}>📱</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Mobile Number</Text>
                <Text style={styles.infoValue}>{user?.phone_number || 'Not provided'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Text style={styles.infoIcon}>📅</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* KYC Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>KYC Documents</Text>
            <TouchableOpacity onPress={() => router.push('/kyc' as any)}>
              <Text style={styles.manageText}>Manage →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.docCard}>
            <View style={styles.docRow}>
              <View style={styles.docIconBox}>
                <Text style={styles.docIcon}>🪪</Text>
              </View>
              <View style={styles.docContent}>
                <Text style={styles.docTitle}>Aadhar Card</Text>
                <Text style={styles.docSubtext}>
                  {user?.kyc_status === 'verified' ? 'XXXX XXXX 4567' : 'Upload your Aadhar card'}
                </Text>
              </View>
              <View style={[styles.docStatusPill, { backgroundColor: kycInfo.bg }]}>
                <Text style={[styles.docStatusText, { color: kycInfo.text }]}>
                  {user?.kyc_status === 'verified' ? 'Verified' : user?.kyc_status === 'pending' ? 'Pending' : 'Upload'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.docRow}>
              <View style={styles.docIconBox}>
                <Text style={styles.docIcon}>💳</Text>
              </View>
              <View style={styles.docContent}>
                <Text style={styles.docTitle}>PAN Card</Text>
                <Text style={styles.docSubtext}>
                  {user?.kyc_status === 'verified' ? 'ABCDE1234F' : 'Upload your PAN card'}
                </Text>
              </View>
              <View style={[styles.docStatusPill, { backgroundColor: kycInfo.bg }]}>
                <Text style={[styles.docStatusText, { color: kycInfo.text }]}>
                  {user?.kyc_status === 'verified' ? 'Verified' : user?.kyc_status === 'pending' ? 'Pending' : 'Upload'}
                </Text>
              </View>
            </View>
          </View>

          {user?.kyc_status !== 'verified' && (
            <TouchableOpacity style={styles.completeKycBtn} onPress={() => router.push('/kyc' as any)}>
              <Text style={styles.completeKycText}>Complete KYC Verification</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Wallet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <View style={styles.walletCard}>
            <View>
              <Text style={styles.walletLabel}>Available Balance</Text>
              <Text style={styles.walletAmount}>₹ {Number(user?.wallet_balance || 0).toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity style={styles.walletBtn}>
              <Text style={styles.walletBtnText}>+ Add Money</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.linksCard}>
            {[
              { icon: '📈', label: 'My Investments', route: '/portfolio?from=profile' },
              { icon: '🔍', label: 'Explore Properties', route: '/explore?from=profile' },
              { icon: '📄', label: 'Transaction History', route: '/portfolio?from=profile' },
              { icon: '❓', label: 'Help & Support', route: '/support' },
              { icon: '⚙️', label: 'Settings', route: '/settings' },
            ].map((link, idx) => (
              <React.Fragment key={link.label}>
                {idx > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.linkRow}
                  onPress={() => link.route ? router.push(link.route as any) : null}
                >
                  <View style={styles.linkIconBox}>
                    <Text style={styles.linkIcon}>{link.icon}</Text>
                  </View>
                  <Text style={styles.linkText}>{link.label}</Text>
                  <Text style={styles.linkArrow}>›</Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪  Logout</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#1A56DB',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E1EFFE',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editAvatarText: {
    fontSize: 14,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  kycBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  kycBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  manageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A56DB',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  docIcon: {
    fontSize: 18,
  },
  docContent: {
    flex: 1,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  docSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  docStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  docStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  completeKycBtn: {
    backgroundColor: '#1A56DB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  completeKycText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  walletLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  walletBtn: {
    backgroundColor: '#E1EFFE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  walletBtnText: {
    color: '#1A56DB',
    fontWeight: '700',
    fontSize: 13,
  },
  linksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  linkIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  linkIcon: {
    fontSize: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  linkArrow: {
    fontSize: 22,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 15,
  },
});
