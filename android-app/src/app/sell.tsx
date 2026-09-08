import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Neutrals, GoldSystem, Typography, Radius, Shadows } from '@/constants/design';
import { auth } from '@/lib/firebase';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToFirebase } from '@/lib/uploadImage';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrl } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function SellScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mainTab, setMainTab] = useState<'sell' | 'rent' | null>(null);
  const currentUser = auth.currentUser;
  
  // Autocomplete states
  const [properties, setProperties] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'Residential',
    listing_type: 'outright',
    price: '',
    total_fractions: '100',
    available_fractions: '100',
    state: '',
    district: '',
    locality: '',
    image_url: '',
    video_url: '',
  });

  // Fetch properties on mount for autocomplete
  useEffect(() => {
    fetch(`${getApiUrl()}/api/properties`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProperties(data);
        } else if (data.properties && Array.isArray(data.properties)) {
          setProperties(data.properties);
        }
      })
      .catch(err => console.error("Error fetching properties for autocomplete:", err));
  }, []);

  const propertyTypes = ['Residential', 'Commercial', 'Fractional', 'Holiday', 'Investor'];
  
  const sellListingTypes = [
    { label: 'Outright Sale', value: 'outright' },
    { label: 'Fractional Sale', value: 'fractional' },
    { label: 'Resale', value: 'resale' }
  ];
  const rentListingTypes = [
    { label: 'Rental', value: 'rental' }
  ];

  const currentListingTypes = mainTab === 'sell' ? sellListingTypes : rentListingTypes;

  const handleTabChange = (tab: 'sell' | 'rent') => {
    setMainTab(tab);
    setFormData({
      ...formData,
      listing_type: tab === 'sell' ? 'outright' : 'rental'
    });
  };

  const handleSelectProperty = (property: any) => {
    setFormData({
      ...formData,
      title: property.title,
      description: property.description || '',
      property_type: property.property_type || formData.property_type,
      state: property.state || '',
      district: property.district || '',
      locality: property.locality || '',
      image_url: property.image_url || '',
      video_url: property.video_url || '',
      price: property.price_per_fraction ? property.price_per_fraction.toString() : '',
    });
    setShowDropdown(false);
  };

  const handleSave = async () => {
    console.log("Submit clicked!", formData);
    if (!formData.title || !formData.price || !formData.state || !formData.district || !formData.locality) {
      console.error("Missing required fields:", { title: formData.title, price: formData.price, state: formData.state, district: formData.district, locality: formData.locality });
      Alert.alert('Missing Fields', 'Please fill in all the required details (Title, Price, and Location).');
      return;
    }

    try {
      console.log("Form valid, starting submission...");
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        console.error("User not authenticated.");
        Alert.alert('Authentication Required', 'Please sign in to list a property.');
        setLoading(false);
        return;
      }

      let finalImageUrl = formData.image_url;
      let finalVideoUrl = formData.video_url;

      // If they selected a local image, upload it first
      if (formData.image_url && !formData.image_url.startsWith('http')) {
        try {
          console.log("Uploading image...");
          finalImageUrl = await uploadImageToFirebase(formData.image_url, 'property_images');
          console.log("Image uploaded successfully:", finalImageUrl);
        } catch (error) {
          console.error("Image upload error:", error);
          Alert.alert('Upload Failed', 'Failed to upload the image. Please try again.');
          setLoading(false);
          return;
        }
      }

      // If they selected a local video, upload it
      if (formData.video_url && !formData.video_url.startsWith('http')) {
        try {
          console.log("Uploading video...");
          finalVideoUrl = await uploadImageToFirebase(formData.video_url, 'property_videos');
          console.log("Video uploaded successfully:", finalVideoUrl);
        } catch (error) {
          console.error("Video upload error:", error);
          Alert.alert('Upload Failed', 'Failed to upload the video. Please try again.');
          setLoading(false);
          return;
        }
      }

      console.log("Getting ID token...");
      const token = await user.getIdToken();
      console.log("Sending POST request to API...");
      const res = await fetch(`${getApiUrl()}/api/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          property_type: formData.property_type,
          listing_type: formData.listing_type,
          price_per_fraction: Number(formData.price),
          total_fractions: formData.listing_type === 'fractional' ? Number(formData.total_fractions) : 1,
          available_fractions: formData.listing_type === 'fractional' ? Number(formData.available_fractions) : 1,
          state: formData.state,
          district: formData.district,
          locality: formData.locality,
          image_url: finalImageUrl || undefined,
          video_url: finalVideoUrl || undefined,
        })
      });

      if (res.ok) {
        console.log("Property successfully submitted!");
        if (Platform.OS === 'web') {
          window.alert("Property Submitted! Your property has been successfully submitted and is pending admin approval.");
          router.back();
        } else {
          Alert.alert(
            'Property Submitted!', 
            'Your property has been successfully submitted and is pending admin approval.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      } else {
        const err = await res.json();
        console.error("API returned error:", err);
        Alert.alert('Submission Error', err.error || 'Failed to submit property.');
      }
    } catch (err) {
      console.error("Network or execution error:", err);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter properties based on input
  const filteredProperties = formData.title.length > 0 
    ? properties.filter(p => p.title && p.title.toLowerCase().includes(formData.title.toLowerCase()))
    : [];

  // ── AUTH GATE: Block access for unauthenticated users ──
  if (!currentUser) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitleBig}>List Property</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.authGateContainer}>
          <View style={styles.authGateCard}>
            <View style={styles.authGateIconCircle}>
              <Ionicons name="lock-closed" size={48} color={GoldSystem.primaryGold} />
            </View>
            <Text style={styles.authGateTitle}>Sign In Required</Text>
            <Text style={styles.authGateSubtitle}>
              You need to create an account or sign in before you can list a property on RealShare.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/sign-in' as any)}
              activeOpacity={0.85}
              style={{ width: '100%' }}
            >
              <LinearGradient
                colors={[GoldSystem.primaryGold, GoldSystem.darkGold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.authGateBtn}
              >
                <Ionicons name="log-in-outline" size={20} color={Neutrals.white} />
                <Text style={styles.authGateBtnText}>Sign In / Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.authGateBackLink}>← Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitleBig}>List Property</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        
        {/* BIG BOXES FOR SELL OR RENT */}
        <Text style={styles.chooseLabel}>What would you like to do?</Text>
        <View style={styles.bigBoxContainer}>
          <TouchableOpacity 
            style={[styles.bigBox, mainTab === 'sell' && styles.bigBoxActive]} 
            onPress={() => handleTabChange('sell')}
            activeOpacity={0.8}
          >
            <View style={[styles.boxIconWrapper, mainTab === 'sell' && styles.boxIconWrapperActive]}>
              <Ionicons name="home-outline" size={32} color={mainTab === 'sell' ? Neutrals.white : GoldSystem.primaryGold} />
            </View>
            <Text style={[styles.bigBoxText, mainTab === 'sell' && styles.bigBoxTextActive]}>Sell</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.bigBox, mainTab === 'rent' && styles.bigBoxActive]} 
            onPress={() => handleTabChange('rent')}
            activeOpacity={0.8}
          >
            <View style={[styles.boxIconWrapper, mainTab === 'rent' && styles.boxIconWrapperActive]}>
              <Ionicons name="key-outline" size={32} color={mainTab === 'rent' ? Neutrals.white : GoldSystem.primaryGold} />
            </View>
            <Text style={[styles.bigBoxText, mainTab === 'rent' && styles.bigBoxTextActive]}>Rent</Text>
          </TouchableOpacity>
        </View>

        {/* ONLY SHOW FORM IF A BOX IS CLICKED */}
        {mainTab !== null && (
          <View style={{ marginTop: 24 }}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Details</Text>
              
              <View style={{ position: 'relative', zIndex: 10 }}>
                <Text style={styles.label}>Property Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={mainTab === 'sell' ? "e.g. Luxury 3BHK for Sale in Gachibowli" : "e.g. 3BHK for Rent in Gachibowli"}
                  value={formData.title}
                  onChangeText={(val) => {
                    setFormData({ ...formData, title: val });
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />

                {/* Autocomplete Dropdown */}
                {showDropdown && filteredProperties.length > 0 && (
                  <View style={styles.dropdownContainer}>
                    {filteredProperties.slice(0, 5).map((prop, index) => (
                      <TouchableOpacity 
                        key={prop.id || index} 
                        style={styles.dropdownItem}
                        onPress={() => handleSelectProperty(prop)}
                      >
                        {prop.image_url && <Image source={{ uri: prop.image_url }} style={styles.dropdownImage} />}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dropdownTitle} numberOfLines={1}>{prop.title}</Text>
                          {prop.locality && <Text style={styles.dropdownSubtitle}>{prop.locality}</Text>}
                        </View>
                        <Ionicons name="arrow-forward" size={16} color={Neutrals.gray400} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Describe the property..."
                multiline
                numberOfLines={3}
                value={formData.description}
                onChangeText={(val) => setFormData({ ...formData, description: val })}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Listing & Pricing</Text>

              {mainTab === 'sell' && (
                <>
                  <Text style={styles.label}>Listing Type *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                    {currentListingTypes.map((type) => (
                      <TouchableOpacity 
                        key={type.value}
                        style={[styles.typePill, formData.listing_type === type.value && styles.typePillActive]}
                        onPress={() => setFormData({ ...formData, listing_type: type.value })}
                      >
                        <Text style={[styles.typePillText, formData.listing_type === type.value && styles.typePillTextActive]}>{type.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

          <Text style={styles.label}>Property Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
            {propertyTypes.map((pt) => (
              <TouchableOpacity 
                key={pt}
                style={[styles.typePill, formData.property_type === pt && styles.typePillActive]}
                onPress={() => setFormData({ ...formData, property_type: pt })}
              >
                <Text style={[styles.typePillText, formData.property_type === pt && styles.typePillTextActive]}>{pt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>{formData.listing_type === 'fractional' ? 'Price per Fraction (₹) *' : 'Total Price (₹) *'}</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15000000"
            keyboardType="numeric"
            value={formData.price}
            onChangeText={(val) => setFormData({ ...formData, price: val })}
          />

          {formData.listing_type === 'fractional' && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Total Fractions</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={formData.total_fractions}
                  onChangeText={(val) => setFormData({ ...formData, total_fractions: val })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Available Fractions</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={formData.available_fractions}
                  onChangeText={(val) => setFormData({ ...formData, available_fractions: val })}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Telangana"
            value={formData.state}
            onChangeText={(val) => setFormData({ ...formData, state: val })}
          />

          <Text style={styles.label}>District *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Hyderabad"
            value={formData.district}
            onChangeText={(val) => setFormData({ ...formData, district: val })}
          />

          <Text style={styles.label}>Locality / Area *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Jubilee Hills"
            value={formData.locality}
            onChangeText={(val) => setFormData({ ...formData, locality: val })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Media</Text>
          <Text style={styles.label}>Property Image (Optional)</Text>
          
          <TouchableOpacity 
            style={styles.imagePickerBtn}
            onPress={async () => {
              const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (permissionResult.granted === false) {
                Alert.alert("Permission Refused", "You need to grant permission to access your photos.");
                return;
              }
              const pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
              });
              if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                setFormData({ ...formData, image_url: pickerResult.assets[0].uri });
              }
            }}
          >
            {formData.image_url ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: formData.image_url }} style={styles.imagePreview} />
                <View style={styles.changeImageOverlay}>
                  <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
                  <Text style={styles.changeImageText}>Change Photo</Text>
                </View>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="cloud-upload-outline" size={48} color={Neutrals.gray400} />
                <Text style={styles.imagePlaceholderText}>Tap to select a photo</Text>
                <Text style={styles.imagePlaceholderSub}>Supported formats: JPG, PNG, WEBP</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: 16 }]}>Property Video (Optional)</Text>
          <TouchableOpacity 
            style={styles.imagePickerBtn}
            onPress={async () => {
              const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (permissionResult.granted === false) {
                Alert.alert("Permission Refused", "You need to grant permission to access your videos.");
                return;
              }
              const pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                quality: 0.8,
              });
              if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                setFormData({ ...formData, video_url: pickerResult.assets[0].uri });
              }
            }}
          >
            {formData.video_url ? (
              <View style={styles.imagePreviewContainer}>
                <View style={[styles.imagePreview, { backgroundColor: Neutrals.gray800, justifyContent: 'center', alignItems: 'center' }]}>
                   <Ionicons name="videocam" size={48} color="#FFF" />
                </View>
                <View style={styles.changeImageOverlay}>
                  <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
                  <Text style={styles.changeImageText}>Change Video</Text>
                </View>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="videocam-outline" size={48} color={Neutrals.gray400} />
                <Text style={styles.imagePlaceholderText}>Tap to select a video</Text>
                <Text style={styles.imagePlaceholderSub}>Supported formats: MP4, MOV</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Neutrals.obsidian} />
          ) : (
            <Text style={styles.saveBtnText}>Submit Property for Approval</Text>
          )}
        </TouchableOpacity>
        </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutrals.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: Platform.OS === 'web' ? 18 : 50, backgroundColor: Neutrals.surface,
    borderBottomWidth: 1, borderBottomColor: Neutrals.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  backIcon: { fontSize: 24, color: Neutrals.obsidian },
  headerTitleBig: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
  },
  chooseLabel: {
    ...Typography.titleLarge,
    color: Neutrals.obsidian,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  bigBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  bigBox: {
    flex: 1,
    backgroundColor: Neutrals.white,
    borderWidth: 2,
    borderColor: Neutrals.gray200,
    borderRadius: Radius.xl,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigBoxActive: {
    borderColor: GoldSystem.primaryGold,
    backgroundColor: Neutrals.surface,
  },
  boxIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Neutrals.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  boxIconWrapperActive: {
    backgroundColor: GoldSystem.primaryGold,
  },
  bigBoxText: {
    ...Typography.titleMedium,
    color: Neutrals.gray500,
  },
  bigBoxTextActive: {
    color: Neutrals.obsidian,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 70, // Just below the input
    left: 0,
    right: 0,
    backgroundColor: Neutrals.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Neutrals.gray200,
    ...Shadows.md,
    maxHeight: 250,
    zIndex: 1000,
    elevation: 10, // For Android z-index
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.gray100,
  },
  dropdownImage: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Neutrals.gray200,
    marginRight: 12,
  },
  dropdownTitle: {
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
    fontWeight: '600',
  },
  dropdownSubtitle: {
    ...Typography.caption,
    color: Neutrals.gray500,
  },
  section: {
    marginBottom: 24,
    backgroundColor: Neutrals.surface,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutrals.border,
  },
  sectionTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Neutrals.border,
    paddingBottom: 8,
  },
  label: { ...Typography.labelMedium, color: Neutrals.obsidian, marginBottom: 8 },
  input: {
    backgroundColor: Neutrals.background,
    borderWidth: 1, borderColor: Neutrals.border,
    borderRadius: Radius.md,
    padding: 12,
    ...Typography.bodyMedium,
    color: Neutrals.obsidian,
    marginBottom: 16,
  },
  pillScroll: {
    marginBottom: 16,
  },
  typePill: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Neutrals.border,
    marginRight: 8,
    backgroundColor: Neutrals.background,
  },
  typePillActive: {
    backgroundColor: Neutrals.obsidian,
    borderColor: Neutrals.obsidian,
  },
  typePillText: {
    ...Typography.labelMedium, color: Neutrals.gray600,
  },
  typePillTextActive: {
    color: GoldSystem.primaryGold,
  },
  saveBtn: {
    backgroundColor: GoldSystem.primaryGold,
    padding: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginVertical: 10,
  },
  saveBtnText: {
    ...Typography.labelLarge, color: Neutrals.obsidian, fontWeight: '700'
  },
  imagePickerBtn: {
    width: '100%',
    height: 200,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Neutrals.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: Neutrals.gray100,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imagePlaceholderText: {
    ...Typography.bodyLarge,
    color: Neutrals.gray600,
    fontWeight: '600',
    marginTop: 12,
  },
  imagePlaceholderSub: {
    ...Typography.caption,
    color: Neutrals.gray400,
    marginTop: 4,
  },
  imagePreviewContainer: {
    flex: 1,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  changeImageText: {
    color: '#FFF',
    ...Typography.labelMedium,
    fontWeight: '700',
  },
  authGateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: Neutrals.background,
  },
  authGateCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Neutrals.white,
    borderRadius: Radius.xxl,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Neutrals.gray200,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        } as any)
      : {
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
        }),
  },
  authGateIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(212,175,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  authGateTitle: {
    ...Typography.headlineMedium,
    color: Neutrals.obsidian,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  authGateSubtitle: {
    ...Typography.bodyMedium,
    color: Neutrals.gray500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  authGateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: Radius.full,
    width: '100%',
  },
  authGateBtnText: {
    ...Typography.labelLarge,
    color: Neutrals.white,
    fontWeight: '700',
    fontSize: 16,
  },
  authGateBackLink: {
    ...Typography.labelMedium,
    color: Neutrals.gray500,
    marginTop: 20,
    fontSize: 14,
  },
});
