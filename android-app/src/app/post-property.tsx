import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import { getApiUrl } from '@/lib/api';
import { Neutrals, GoldSystem, Radius, Typography } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const CATEGORIES = ['Commercial', 'Fractional', 'Residential', 'Holiday', 'Investor'] as const;

const MAJOR_CITIES = [
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Bengaluru', state: 'Karnataka' },
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Delhi NCR', state: 'Delhi' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Goa', state: 'Goa' },
  { name: 'Other', state: '' },
];

function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  try {
    if (!url) return null;
    const match = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    const qMatch = url.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?)[,%2C]+(-?\d+(?:\.\d+)?)/i);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    const placeMatch = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (placeMatch) return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
  } catch (e) {
    console.error('Google Maps parse error:', e);
  }
  return null;
}

export default function PostPropertyScreen() {
  const router = useRouter();
  const { profile } = useUser();

  const [step, setStep] = useState(1);

  // Form states
  const [listingType, setListingType] = useState<'fractional' | 'outright' | 'rental' | 'resale'>('fractional');
  const [category, setCategory] = useState<string>('Commercial');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [areaSqft, setAreaSqft] = useState('');
  const [district, setDistrict] = useState('Hyderabad');
  const [customDistrict, setCustomDistrict] = useState('');
  const [stateName, setStateName] = useState('Telangana');
  const [locality, setLocality] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  // Financials
  const [price, setPrice] = useState('500000');
  const [totalFractions, setTotalFractions] = useState('100');
  const [bookingAmount, setBookingAmount] = useState('50000');
  const [assuredYield, setAssuredYield] = useState('8.5');
  const [targetIrr, setTargetIrr] = useState('15.0');

  // Media
  const [localImageUris, setLocalImageUris] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handlePickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map(a => a.uri);
        setLocalImageUris(prev => [...prev, ...uris]);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Could not open image picker: ' + e.message);
    }
  };

  const handleRemoveImage = (index: number) => {
    setLocalImageUris(prev => prev.filter((_, idx) => idx !== index));
  };

  const [isResolvingCoords, setIsResolvingCoords] = useState(false);

  const handleExtractCoords = async () => {
    if (!googleMapsUrl || !googleMapsUrl.trim()) {
      Alert.alert('Empty URL', 'Please paste a Google Maps link first.');
      return;
    }

    const trimmedUrl = googleMapsUrl.trim();
    const coords = parseGoogleMapsUrl(trimmedUrl);
    if (coords && !trimmedUrl.includes('goo.gl') && !trimmedUrl.includes('maps.app')) {
      setLat(coords.lat.toString());
      setLng(coords.lng.toString());
      Alert.alert('Coordinates Found', `Latitude: ${coords.lat.toFixed(5)}\nLongitude: ${coords.lng.toFixed(5)}`);
      return;
    }

    // Call resolve API
    setIsResolvingCoords(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/maps/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.lat && data.lng) {
        setLat(data.lat.toString());
        setLng(data.lng.toString());
        if (data.placeName && !title) {
          setTitle(data.placeName);
        }
        Alert.alert(
          'Location Pinned',
          `Latitude: ${data.lat.toFixed(5)}\nLongitude: ${data.lng.toFixed(5)}${data.placeName ? `\nPlace: ${data.placeName}` : ''}`
        );
      } else {
        if (coords) {
          setLat(coords.lat.toString());
          setLng(coords.lng.toString());
          Alert.alert('Coordinates Found', `Latitude: ${coords.lat.toFixed(5)}\nLongitude: ${coords.lng.toFixed(5)}`);
        } else {
          Alert.alert('Not Found', data.error || 'Could not extract coordinates from this Google Maps URL. You can type Latitude & Longitude manually.');
        }
      }
    } catch (e: any) {
      if (coords) {
        setLat(coords.lat.toString());
        setLng(coords.lng.toString());
        Alert.alert('Coordinates Found', `Latitude: ${coords.lat.toFixed(5)}\nLongitude: ${coords.lng.toFixed(5)}`);
      } else {
        Alert.alert('Error', 'Could not resolve URL. Please enter coordinates manually.');
      }
    } finally {
      setIsResolvingCoords(false);
    }
  };

  const uploadFileToServer = async (fileUri: string, token: string): Promise<string> => {
    const apiUrl = getApiUrl();
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const res = await fetch(fileUri);
      const blob = await res.blob();
      formData.append('file', blob, `prop_${Date.now()}.jpg`);
    } else {
      const filename = fileUri.split('/').pop() || 'upload.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      // @ts-ignore
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type,
      });
    }

    const res = await fetch(`${apiUrl}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload image');
    }

    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a property title.');
      setStep(2);
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      Alert.alert('Validation Error', 'Please enter a description (at least 5 characters).');
      setStep(2);
      return;
    }
    if (!areaSqft || Number(areaSqft) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid built-up area in sq.ft.');
      setStep(2);
      return;
    }
    const finalDistrict = district === 'Other' ? customDistrict.trim() : district;
    if (!locality.trim() || !finalDistrict) {
      Alert.alert('Validation Error', 'Please enter district and locality.');
      setStep(3);
      return;
    }
    if (!price || Number(price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price.');
      setStep(4);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Uploading property media...');

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Authentication Error', 'You must be signed in to list a property.');
        setIsSubmitting(false);
        return;
      }
      const token = await user.getIdToken();

      // 1. Upload local images
      const uploadedUrls: string[] = [];
      if (localImageUris.length > 0) {
        for (let i = 0; i < localImageUris.length; i++) {
          setStatusMessage(`Uploading image ${i + 1} of ${localImageUris.length}...`);
          try {
            const url = await uploadFileToServer(localImageUris[i], token);
            uploadedUrls.push(url);
          } catch (e: any) {
            console.error('Image upload failed:', e);
          }
        }
      }

      if (uploadedUrls.length === 0) {
        uploadedUrls.push('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop');
      }

      setStatusMessage('Creating property listing in database...');

      const payload = {
        title: title.trim(),
        description: description.trim(),
        property_type: category,
        listing_type: listingType,
        area_sqft: Number(areaSqft),
        state: stateName.trim() || 'Telangana',
        district: finalDistrict,
        locality: locality.trim(),
        full_address: fullAddress.trim() || undefined,
        google_maps_url: googleMapsUrl.trim() || undefined,
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        price_per_fraction: Number(price),
        total_fractions: listingType === 'fractional' ? Number(totalFractions) || 100 : 1,
        available_fractions: listingType === 'fractional' ? Number(totalFractions) || 100 : 1,
        booking_amount: bookingAmount ? Number(bookingAmount) : 50000,
        assured_yield: assuredYield ? Number(assuredYield) : undefined,
        target_irr: targetIrr ? Number(targetIrr) : undefined,
        video_url: videoUrl.trim() || undefined,
        image_urls: uploadedUrls,
      };

      const res = await fetch(`${getApiUrl()}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create listing');
      }

      Alert.alert(
        'Success! 🎉',
        `Property "${title}" has been submitted successfully${profile?.role === 'admin' ? ' and is now LIVE' : ' and is pending admin approval'}.`,
        [
          {
            text: 'View Property',
            onPress: () => {
              if (data.id) {
                router.replace(`/property/${data.id}`);
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            },
          },
          {
            text: 'Return to Portal',
            onPress: () => {
              if (profile?.role === 'agent') {
                router.replace('/agent-portal');
              } else if (profile?.role === 'builder') {
                router.replace('/builder-portal');
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit property listing.');
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  const handleBackNavigation = () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (router.canGoBack()) {
      router.back();
    } else if (profile?.role === 'agent') {
      router.replace('/agent-portal');
    } else if (profile?.role === 'builder') {
      router.replace('/builder-portal');
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackNavigation}>
          <Ionicons name="arrow-back" size={24} color={Neutrals.obsidian} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post New Property</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step {step}/4</Text>
        </View>
      </View>

      {/* Stepper Progress Bar */}
      <View style={styles.stepProgressBarBg}>
        <View style={[styles.stepProgressBarFill, { width: `${(step / 4) * 100}%` }]} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* STEP 1: Listing Mode, Pricing & Category */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Listing Mode & Financials</Text>
            <Text style={styles.stepSubtitle}>Choose participation type and configure pricing metrics.</Text>

            <Text style={styles.inputLabel}>1. Listing Mode *</Text>
            <View style={styles.grid2}>
              {(
                [
                  { key: 'fractional', label: 'Fractional', sub: 'Invest / Share Pool', icon: 'pie-chart-outline' },
                  { key: 'outright', label: 'Outright', sub: 'Buy / 100% Title', icon: 'home-outline' },
                  { key: 'rental', label: 'Rental', sub: 'Monthly Yielding', icon: 'cash-outline' },
                  { key: 'resale', label: 'Resale', sub: 'Secondary Market', icon: 'repeat-outline' },
                ] as const
              ).map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.modeCard, listingType === item.key && styles.modeCardActive]}
                  onPress={() => setListingType(item.key)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={listingType === item.key ? GoldSystem.primaryGold : Neutrals.gray500}
                  />
                  <Text style={[styles.modeCardLabel, listingType === item.key && styles.modeCardLabelActive]}>
                    {item.label}
                  </Text>
                  <Text style={styles.modeCardSub}>{item.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pricing & Financials (Directly below Listing Mode) */}
            <Text style={[styles.inputLabel, { marginTop: 20 }]}>
              2. {listingType === 'fractional' ? 'Price Per Fraction (₹) *' : listingType === 'rental' ? 'Monthly Rent (₹) *' : 'Total Asking Price (₹) *'}
            </Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              placeholder="e.g. 500000"
              value={price}
              onChangeText={setPrice}
            />

            {listingType === 'fractional' && (
              <>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Total Fractions in Pool *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 100"
                  value={totalFractions}
                  onChangeText={setTotalFractions}
                />

                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Booking Amount Per Fraction (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 50000"
                  value={bookingAmount}
                  onChangeText={setBookingAmount}
                />
              </>
            )}

            <View style={styles.grid2Row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Assured Yield (%)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="8.5"
                  value={assuredYield}
                  onChangeText={setAssuredYield}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Target IRR (%)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="15.0"
                  value={targetIrr}
                  onChangeText={setTargetIrr}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 24 }]}>3. Asset Category *</Text>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryPillText, category === cat && styles.categoryPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
              <Text style={styles.primaryButtonText}>Continue to Details →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: Basic Info & Area */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Property Details & Area</Text>
            <Text style={styles.stepSubtitle}>Provide title, description, and built-up area specifications.</Text>

            <Text style={styles.inputLabel}>Property Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Phoenix One Cyber Suites"
              placeholderTextColor={Neutrals.gray400}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Built-up Area (Sq. Ft.) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 1500"
              placeholderTextColor={Neutrals.gray400}
              keyboardType="numeric"
              value={areaSqft}
              onChangeText={setAreaSqft}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Description *</Text>
            <TextInput
              style={[styles.textInput, { height: 110, textAlignVertical: 'top' }]}
              placeholder="Detailed description of property highlights, tenant profile, amenities, lease terms..."
              placeholderTextColor={Neutrals.gray400}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
                <Text style={styles.secondaryButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 2 }]}
                onPress={() => {
                  if (!title.trim() || !description.trim() || !areaSqft) {
                    Alert.alert('Required Fields', 'Please fill in Title, Description, and Area.');
                    return;
                  }
                  setStep(3);
                }}
              >
                <Text style={styles.primaryButtonText}>Continue to Location →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: Location & Google Maps */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Location & Google Maps</Text>
            <Text style={styles.stepSubtitle}>Specify exact location and paste Google Maps share link.</Text>

            <Text style={styles.inputLabel}>City / District *</Text>
            <View style={styles.cityGrid}>
              {MAJOR_CITIES.map(c => (
                <TouchableOpacity
                  key={c.name}
                  style={[styles.cityPill, district === c.name && styles.cityPillActive]}
                  onPress={() => {
                    setDistrict(c.name);
                    if (c.state) setStateName(c.state);
                  }}
                >
                  <Text style={[styles.cityPillText, district === c.name && styles.cityPillTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {district === 'Other' && (
              <TextInput
                style={[styles.textInput, { marginTop: 8 }]}
                placeholder="Type custom city"
                placeholderTextColor={Neutrals.gray400}
                value={customDistrict}
                onChangeText={setCustomDistrict}
              />
            )}

            <View style={styles.grid2Row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>State *</Text>
                <TextInput
                  style={styles.textInput}
                  value={stateName}
                  onChangeText={setStateName}
                  placeholder="State"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Locality / Area *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Gachibowli"
                  value={locality}
                  onChangeText={setLocality}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Full Street Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Tower B, Financial District"
              value={fullAddress}
              onChangeText={setFullAddress}
            />

            {/* Google Maps Link with Coords extraction */}
            <View style={styles.mapsCard}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Neutrals.obsidian, marginBottom: 4 }}>
                📍 Google Maps Share Link
              </Text>
              <TextInput
                style={[styles.textInput, { fontSize: 13, height: 42 }]}
                placeholder="https://maps.google.com/?q=..."
                placeholderTextColor={Neutrals.gray400}
                value={googleMapsUrl}
                onChangeText={setGoogleMapsUrl}
              />
              <TouchableOpacity
                style={[styles.extractBtn, isResolvingCoords && { opacity: 0.7 }]}
                disabled={isResolvingCoords}
                onPress={handleExtractCoords}
              >
                {isResolvingCoords ? (
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                ) : (
                  <Ionicons name="location-outline" size={16} color="#fff" />
                )}
                <Text style={styles.extractBtnText}>
                  {isResolvingCoords ? 'Resolving Link...' : 'Extract Coordinates'}
                </Text>
              </TouchableOpacity>

              <View style={styles.grid2Row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniLabel}>Latitude</Text>
                  <TextInput
                    style={[styles.textInput, { fontSize: 12, height: 38 }]}
                    placeholder="e.g. 17.3850"
                    keyboardType="numeric"
                    value={lat}
                    onChangeText={setLat}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniLabel}>Longitude</Text>
                  <TextInput
                    style={[styles.textInput, { fontSize: 12, height: 38 }]}
                    placeholder="e.g. 78.4867"
                    keyboardType="numeric"
                    value={lng}
                    onChangeText={setLng}
                  />
                </View>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(2)}>
                <Text style={styles.secondaryButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 2 }]}
                onPress={() => {
                  if (!locality.trim()) {
                    Alert.alert('Locality Required', 'Please enter the locality.');
                    return;
                  }
                  setStep(4);
                }}
              >
                <Text style={styles.primaryButtonText}>Continue to Media →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 4: Media & Submit */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Media & Final Review</Text>
            <Text style={styles.stepSubtitle}>Upload high-resolution property images and video walkthrough.</Text>

            <Text style={styles.inputLabel}>Property Images ({localImageUris.length} selected)</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={handlePickImages}>
              <Ionicons name="cloud-upload-outline" size={32} color={GoldSystem.primaryGold} />
              <Text style={styles.uploadBoxTitle}>Tap to select images from gallery</Text>
              <Text style={styles.uploadBoxSub}>First selected image will be used as the primary cover</Text>
            </TouchableOpacity>

            {localImageUris.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
                {localImageUris.map((uri, idx) => (
                  <View key={idx} style={styles.thumbWrap}>
                    <Image source={{ uri }} style={styles.thumbImage} />
                    {idx === 0 && (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>Cover</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.thumbRemove} onPress={() => handleRemoveImage(idx)}>
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <Text style={[styles.inputLabel, { marginTop: 18 }]}>Video Walkthrough URL (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. https://youtu.be/... or server video url"
              value={videoUrl}
              onChangeText={setVideoUrl}
            />

            {/* Summary Preview Box */}
            <View style={styles.reviewCard}>
              <Text style={styles.reviewCardTitle}>📋 Listing Summary</Text>
              <Text style={styles.reviewItem}>
                <Text style={{ fontWeight: '700' }}>Title: </Text>{title || 'Untitled'}
              </Text>
              <Text style={styles.reviewItem}>
                <Text style={{ fontWeight: '700' }}>Mode: </Text>{listingType.toUpperCase()} • {category}
              </Text>
              <Text style={styles.reviewItem}>
                <Text style={{ fontWeight: '700' }}>Area: </Text>{areaSqft ? `${areaSqft} sqft` : '—'}
              </Text>
              <Text style={styles.reviewItem}>
                <Text style={{ fontWeight: '700' }}>Location: </Text>{locality}, {district}, {stateName}
              </Text>
              <Text style={styles.reviewItem}>
                <Text style={{ fontWeight: '700' }}>Pricing: </Text>₹{Number(price).toLocaleString('en-IN')}{listingType === 'fractional' ? ' / fraction' : ''}
              </Text>
              <Text style={styles.reviewItem}>
                <Text style={{ fontWeight: '700' }}>Images: </Text>{localImageUris.length} attached
              </Text>
            </View>

            {isSubmitting && (
              <View style={styles.submittingStatus}>
                <ActivityIndicator size="small" color={GoldSystem.primaryGold} />
                <Text style={styles.submittingText}>{statusMessage}</Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(4)} disabled={isSubmitting}>
                <Text style={styles.secondaryButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 2 }, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? 'Publishing...' : 'Publish Listing 🚀'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Neutrals.obsidian,
  },
  stepBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Neutrals.gray600,
  },
  stepProgressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  stepProgressBarFill: {
    height: 4,
    backgroundColor: GoldSystem.primaryGold,
  },
  content: {
    flex: 1,
    padding: 18,
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg || 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Neutrals.obsidian,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: Neutrals.gray500,
    marginBottom: 20,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Neutrals.obsidian,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Neutrals.obsidian,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modeCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  modeCardActive: {
    borderColor: GoldSystem.primaryGold,
    backgroundColor: '#FEF9C3',
  },
  modeCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Neutrals.obsidian,
  },
  modeCardLabelActive: {
    color: '#92400E',
  },
  modeCardSub: {
    fontSize: 11,
    color: Neutrals.gray500,
    textAlign: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  categoryPillActive: {
    borderColor: GoldSystem.primaryGold,
    backgroundColor: GoldSystem.primaryGold,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Neutrals.obsidian,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  cityPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cityPillActive: {
    borderColor: GoldSystem.primaryGold,
    backgroundColor: '#FEF9C3',
  },
  cityPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Neutrals.gray600,
  },
  cityPillTextActive: {
    color: '#92400E',
  },
  grid2Row: {
    flexDirection: 'row',
    gap: 10,
  },
  mapsCard: {
    marginTop: 14,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    padding: 12,
  },
  extractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingVertical: 7,
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  extractBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Neutrals.gray500,
    marginBottom: 2,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: GoldSystem.primaryGold,
    borderRadius: 12,
    backgroundColor: '#FEFCE8',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Neutrals.obsidian,
  },
  uploadBoxSub: {
    fontSize: 12,
    color: Neutrals.gray500,
    textAlign: 'center',
  },
  thumbScroll: {
    flexDirection: 'row',
    marginTop: 12,
  },
  thumbWrap: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: GoldSystem.primaryGold,
    paddingVertical: 2,
  },
  coverBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  thumbRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCard: {
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Neutrals.obsidian,
    marginBottom: 8,
  },
  reviewItem: {
    fontSize: 12,
    color: Neutrals.gray600,
    marginBottom: 4,
  },
  submittingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  submittingText: {
    fontSize: 13,
    fontWeight: '600',
    color: GoldSystem.primaryGold,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: GoldSystem.primaryGold,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Neutrals.obsidian,
    fontWeight: '700',
    fontSize: 14,
  },
});
