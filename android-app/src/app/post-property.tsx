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
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import { getApiUrl } from '@/lib/api';
import { Neutrals, GoldSystem, Radius, Typography } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MapPicker } from '@/components/ui/MapPicker';

const CATEGORIES = ['Commercial', 'Fractional', 'Residential', 'Holiday', 'Plots & Farms'] as const;

const MAJOR_CITIES = [
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Bengaluru', state: 'Karnataka' },
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Delhi NCR', state: 'Delhi' },
  { name: 'Gurugram', state: 'Haryana' },
  { name: 'Noida', state: 'Uttar Pradesh' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Goa', state: 'Goa' },
  { name: 'Kochi', state: 'Kerala' },
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string>('');

  // Form states
  const [listingType, setListingType] = useState<'fractional' | 'outright' | 'rental' | 'resale'>('fractional');
  const [category, setCategory] = useState<string>('Commercial');
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [areaSqft, setAreaSqft] = useState('');
  const [areaSqftMax, setAreaSqftMax] = useState('');
  const [reraNumber, setReraNumber] = useState('');
  const [permissionNumber, setPermissionNumber] = useState('');
  const [district, setDistrict] = useState('Hyderabad');
  const [customDistrict, setCustomDistrict] = useState('');
  const [stateName, setStateName] = useState('Telangana');
  const [locality, setLocality] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  // Dynamic Property State
  const [newProp, setNewProp] = useState({
    areaUnit: "sqft" as "sqft" | "acres",
    subType: "",
    floorType: "",
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    flooring: "",
    kitchenType: "",
    parkingCount: null as number | null,
    clubHouse: false,
    amenities: "",
    furnished: false,
    plugAndPlay: false,
    centralAc: false,
    preleased: false,
    maintenanceAvail: false,
    fencing: false,
    electricityAvail: false,
    farmShed: false,
    boreWells: false,
    plantsAvailable: false,
    loanAvailability: false,
    landRegistered: false,
    passBook: false,
    raithuBharosa: false,
    approachRoad: "",
    underIrrigation: false,
    foodCourts: false,
    ownershipType: "Single",
  });

  const [bhkAreas, setBhkAreas] = useState<Record<string, string>>({});

  // Financials
  const [price, setPrice] = useState('');
  const [totalPriceStr, setTotalPriceStr] = useState('');
  const [totalFractions, setTotalFractions] = useState('');
  const [bookingAmount, setBookingAmount] = useState('');
  const [assuredYield, setAssuredYield] = useState('');
  const [targetIrr, setTargetIrr] = useState('');
  
  // Rental Financials
  const [rentalAmount, setRentalAmount] = useState('');
  const [depositType, setDepositType] = useState('months');
  const [depositMonths, setDepositMonths] = useState('3');
  const [depositAmount, setDepositAmount] = useState('');

  // Media
  const [localImageUris, setLocalImageUris] = useState<string[]>([]);
  const [localDocumentUris, setLocalDocumentUris] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submittedPropertyId, setSubmittedPropertyId] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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

  const handlePickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map((a: any) => a.uri);
        setLocalDocumentUris(prev => [...prev, ...uris]);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Could not open document picker: ' + e.message);
    }
  };

  const handleRemoveDocument = (index: number) => {
    setLocalDocumentUris(prev => prev.filter((_, idx) => idx !== index));
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

  // ── Validate all required fields ──
  const validateAndPreview = () => {
    const errors: string[] = [];
    if (!title.trim()) errors.push('Property Title is required.');
    if (!description.trim() || description.trim().length < 5) errors.push('Description must be at least 5 characters.');
    if (!areaSqft || Number(areaSqft) <= 0) errors.push('A valid built-up area is required.');
    const finalDistrict = district === 'Other' ? customDistrict.trim() : district;
    if (!locality.trim() || !finalDistrict) errors.push('Locality and District are required.');
    if (!price || Number(price) < 0) errors.push('A valid price is required.');
    if (!acceptedTerms) errors.push('You must accept the Terms of Service to post this property.');
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors([]);
    setShowPreviewModal(true);
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
      setStep(4);
      return;
    }
    if (!price || Number(price) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid price (0 or greater).');
      setStep(1);
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

      // 2. Upload documents
      const uploadedDocUrls: string[] = [];
      if (localDocumentUris.length > 0) {
        for (let i = 0; i < localDocumentUris.length; i++) {
          setStatusMessage(`Uploading document ${i + 1} of ${localDocumentUris.length}...`);
          try {
            const url = await uploadFileToServer(localDocumentUris[i], token);
            uploadedDocUrls.push(url);
          } catch (e: any) {
            console.error('Document upload failed:', e);
          }
        }
      }

      if (uploadedUrls.length === 0) {
        uploadedUrls.push('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop');
      }

      setStatusMessage('Creating property listing in database...');

      const payload = {
        title: title.trim(),
        short_description: shortDescription.trim() || undefined,
        description: description.trim(),
        property_type: category,
        listing_type: listingType,
        area_sqft: Number(areaSqft),
        area_sqft_max: areaSqftMax ? Number(areaSqftMax) : undefined,
        area_unit: newProp.areaUnit || 'sqft',
        rera_number: reraNumber.trim() || undefined,
        permission_number: permissionNumber.trim() || undefined,
        state: stateName.trim() || 'Telangana',
        district: finalDistrict,
        locality: locality.trim(),
        full_address: fullAddress.trim() || undefined,
        google_maps_url: googleMapsUrl.trim() || undefined,
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        // Fractional: fraction price = totalPrice / totalFractions; else direct price
        price_per_fraction: listingType === 'fractional'
          ? Math.round(Number(totalPriceStr || 0) / Math.max(1, Number(totalFractions)))
          : Number(price),
        total_fractions: listingType === 'fractional' ? Number(totalFractions) || 100 : 1,
        available_fractions: listingType === 'fractional' ? Number(totalFractions) || 100 : 1,
        booking_amount: listingType === 'fractional'
          ? (bookingAmount ? Number(bookingAmount) : Math.round(Number(totalPriceStr || 0) / Math.max(1, Number(totalFractions)) * 0.1))
          : (bookingAmount ? Number(bookingAmount) : Math.round(Number(price) * 0.1)),
        // Yield / IRR (non-rental)
        assured_yield: listingType !== 'rental' && assuredYield ? Number(assuredYield) : undefined,
        target_irr: listingType !== 'rental' && targetIrr ? Number(targetIrr) : undefined,
        video_url: videoUrl.trim() || undefined,
        image_urls: uploadedUrls,
        document_urls: uploadedDocUrls,
        speciality: speciality.trim() || undefined,
        // Rental specific
        rental_amount: listingType === 'rental' ? Number(rentalAmount) || undefined : undefined,
        deposit_type: listingType === 'rental' ? depositType : undefined,
        deposit_months: listingType === 'rental' && depositType === 'months' ? Number(depositMonths) : undefined,
        deposit_amount: listingType === 'rental' && depositType === 'amount' ? Number(depositAmount) : undefined,
        // Shared
        sub_type: newProp.subType || undefined,
        floor_type: newProp.floorType || undefined,
        // Residential
        bedrooms: newProp.bedrooms ?? undefined,
        bathrooms: newProp.bathrooms ?? undefined,
        flooring: newProp.flooring || undefined,
        kitchen_type: newProp.kitchenType || undefined,
        parking_count: newProp.parkingCount ?? undefined,
        club_house: newProp.clubHouse,
        amenities: newProp.amenities || undefined,
        // Commercial
        furnished: newProp.furnished,
        plug_and_play: newProp.plugAndPlay,
        central_ac: newProp.centralAc,
        preleased: newProp.preleased,
        maintenance_avail: newProp.maintenanceAvail,
        food_courts: newProp.foodCourts,
        // Farm/Plot
        fencing: newProp.fencing,
        electricity_avail: newProp.electricityAvail,
        farm_shed: newProp.farmShed,
        bore_wells: newProp.boreWells,
        plants_available: newProp.plantsAvailable,
        loan_availability: newProp.loanAvailability,
        land_registered: newProp.landRegistered,
        pass_book: newProp.passBook,
        raithu_bharosa: newProp.raithuBharosa,
        approach_road: newProp.approachRoad || undefined,
        under_irrigation: newProp.underIrrigation,
        ownership_type: newProp.ownershipType || undefined,
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

      setShowPreviewModal(false);
      setSubmittedPropertyId(data.id || 'draft');
      router.replace(`/submission-success?id=${data.id || 'draft'}&title=${encodeURIComponent(title)}`);
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
  if (profile && (profile.role === 'agent' || profile.role === 'builder') && profile.is_approved === false) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="time-outline" size={80} color={GoldSystem.primaryGold} style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 24, fontWeight: '700', color: Neutrals.obsidian, marginBottom: 12, textAlign: 'center' }}>
          Account Under Review
        </Text>
        <Text style={{ fontSize: 16, color: Neutrals.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 }}>
          Your {profile.role} account is currently pending administrator approval. You can browse the app, but you will not be able to post properties until approved.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: Neutrals.obsidian, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 }}
          onPress={() => router.replace('/')}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackNavigation}>
          <Ionicons name="arrow-back" size={24} color={Neutrals.obsidian} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post New Property</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step {step}/5</Text>
        </View>
      </View>

      {/* Stepper Progress Bar */}
      <View style={styles.stepProgressBarBg}>
        <View style={[styles.stepProgressBarFill, { width: `${(step / 5) * 100}%` }]} />
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
            <View style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>💰 Pricing & Investment Metrics</Text>

              {/* FRACTIONAL MODE */}
              {listingType === 'fractional' && (
                <>
                  <Text style={styles.inputLabel}>Total Property Price (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="e.g. 25000000"
                    value={totalPriceStr}
                    onChangeText={(val) => {
                      setTotalPriceStr(val);
                      const pricePer = Math.round(Number(val) / Math.max(1, Number(totalFractions || 1)));
                      setPrice(pricePer.toString());
                    }}
                  />
                  <View style={[styles.grid2Row, { marginTop: 12 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>No. of Fractions *</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="e.g. 100"
                        value={totalFractions}
                        onChangeText={(val) => {
                          setTotalFractions(val);
                          const pricePer = Math.round(Number(totalPriceStr || 0) / Math.max(1, Number(val || 1)));
                          setPrice(pricePer.toString());
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Price Per Fraction (₹) — Auto</Text>
                      <View style={[styles.textInput, { backgroundColor: '#F0FDF4', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#065F46' }}>
                          ₹ {price && Number(price) > 0 ? Number(price).toLocaleString('en-IN') : '—'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Calculated automatically</Text>
                    </View>
                  </View>
                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Booking Amount Per Fraction (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder={`Auto: ₹${price && Number(price) > 0 ? Math.round(Number(price) * 0.1).toLocaleString('en-IN') : '—'} (10%)`}
                    value={bookingAmount}
                    onChangeText={setBookingAmount}
                  />
                  <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Leave blank for auto 10% of fraction price</Text>
                </>
              )}

              {/* OUTRIGHT / RESALE MODE */}
              {(listingType === 'outright' || listingType === 'resale') && (
                <>
                  <View style={styles.grid2Row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Total Price (₹) *</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="e.g. 50000000"
                        value={totalPriceStr}
                        onChangeText={(val) => {
                          setTotalPriceStr(val);
                          setPrice(val);
                        }}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Assured Yield (%)</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="8.5"
                        value={assuredYield}
                        onChangeText={setAssuredYield}
                      />
                    </View>
                  </View>
                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Target IRR (%)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="15.0"
                    value={targetIrr}
                    onChangeText={setTargetIrr}
                  />
                </>
              )}

              {/* RENTAL MODE */}
              {listingType === 'rental' && (
                <>
                  <Text style={styles.inputLabel}>Monthly Rent (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="e.g. 45000"
                    value={rentalAmount}
                    onChangeText={(val) => {
                      setRentalAmount(val);
                      setPrice(val);
                    }}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>Security Deposit Type *</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <TouchableOpacity
                      style={[styles.modeCard, { flex: 1, padding: 12 }, depositType === 'months' && styles.modeCardActive]}
                      onPress={() => setDepositType('months')}
                    >
                      <Text style={[styles.modeCardLabel, { fontSize: 13 }, depositType === 'months' && styles.modeCardLabelActive]}>By Months</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modeCard, { flex: 1, padding: 12 }, depositType === 'amount' && styles.modeCardActive]}
                      onPress={() => setDepositType('amount')}
                    >
                      <Text style={[styles.modeCardLabel, { fontSize: 13 }, depositType === 'amount' && styles.modeCardLabelActive]}>Fixed Amount</Text>
                    </TouchableOpacity>
                  </View>

                  {depositType === 'months' ? (
                    <>
                      <Text style={[styles.inputLabel, { marginTop: 12 }]}>Number of Months *</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                        {[1,2,3,4,5,6].map(m => (
                          <TouchableOpacity
                            key={m}
                            style={[styles.tagBtn, { paddingHorizontal: 14 }, depositMonths === m.toString() && styles.tagBtnActive]}
                            onPress={() => setDepositMonths(m.toString())}
                          >
                            <Text style={[styles.tagBtnText, depositMonths === m.toString() && styles.tagBtnTextActive]}>{m}M</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.inputLabel, { marginTop: 12 }]}>Deposit Amount (₹) *</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="e.g. 100000"
                        value={depositAmount}
                        onChangeText={setDepositAmount}
                      />
                    </>
                  )}

                  {/* Deposit Summary */}
                  <View style={[styles.textInput, { backgroundColor: '#F0FDF4', marginTop: 10, justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#065F46' }}>
                      Deposit: {depositType === 'amount'
                        ? `₹ ${Number(depositAmount || 0).toLocaleString('en-IN')} (Custom)`
                        : `₹ ${(Number(rentalAmount || 0) * Number(depositMonths || 2)).toLocaleString('en-IN')} (${depositMonths || 2} months)`
                      }
                    </Text>
                  </View>
                </>
              )}

              {/* Yield & IRR for fractional only (outright/resale handled above) */}
              {listingType === 'fractional' && (
                <View style={[styles.grid2Row, { marginTop: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Assured Yield (%)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="8.5"
                      value={assuredYield}
                      onChangeText={setAssuredYield}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Target IRR (%)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="15.0"
                      value={targetIrr}
                      onChangeText={setTargetIrr}
                    />
                  </View>
                </View>
              )}
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

            {/* Category, Sub-type & Area — matching admin Section 3 */}
            <View style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>📐 Category, Sub-type & Area</Text>
              <Text style={styles.inputLabel}>Category *</Text>
              <View style={styles.categoriesContainer}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryPillText, category === cat && styles.categoryPillTextActive]}>
                      {cat === 'Commercial' ? '🏢 ' : cat === 'Fractional' ? '📊 ' : cat === 'Residential' ? '🏠 ' : cat === 'Holiday' ? '🌴 ' : '🌾 '}{cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Sub-Type</Text>
              <View style={[styles.grid2, { marginBottom: 4 }]}>
                {((category === 'Residential' || category === 'Holiday')
                  ? ['Apartment', 'Villa', 'Independent House', 'Row House', 'Studio', 'Penthouse']
                  : (category === 'Plots & Farms')
                  ? ['Open Plot', 'Farm Land', 'Agricultural Land']
                  : ['Office Space', 'Retail Shop', 'Showroom', 'Warehouse', 'Co-working']
                ).map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.tagBtn, newProp.subType === s && styles.tagBtnActive]}
                    onPress={() => setNewProp({ ...newProp, subType: s })}
                  >
                    <Text style={[styles.tagBtnText, newProp.subType === s && styles.tagBtnTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {['Residential', 'Holiday'].includes(category) ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.inputLabel}>Available Configurations *</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 16 }}>
                    {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', '5+ BHK'].map(bhk => (
                      <TouchableOpacity
                        key={bhk}
                        style={[styles.tagBtn, bhkAreas[bhk] !== undefined && styles.tagBtnActive]}
                        onPress={() => {
                          const newAreas = { ...bhkAreas };
                          if (newAreas[bhk] !== undefined) {
                            delete newAreas[bhk];
                          } else {
                            newAreas[bhk] = '';
                          }
                          setBhkAreas(newAreas);
                        }}
                      >
                        <Text style={[styles.tagBtnText, bhkAreas[bhk] !== undefined && styles.tagBtnTextActive]}>{bhk}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {Object.keys(bhkAreas).length > 0 && (
                    <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 4 }}>
                      <Text style={[styles.inputLabel, { marginBottom: 12 }]}>Enter Area (Sq.Ft) for selected configurations:</Text>
                      {Object.keys(bhkAreas).sort().map(bhk => (
                        <View key={bhk} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                          <Text style={{ width: 70, fontWeight: '600', color: '#475569' }}>{bhk}</Text>
                          <TextInput
                            style={[styles.textInput, { flex: 1, height: 40, marginBottom: 0 }]}
                            placeholder={`e.g. ${bhk === '1 BHK' ? '600' : bhk === '2 BHK' ? '1200' : '1800'}`}
                            keyboardType="numeric"
                            value={bhkAreas[bhk]}
                            onChangeText={(val) => setBhkAreas({ ...bhkAreas, [bhk]: val })}
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.grid2Row, { marginTop: 12 }]}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.inputLabel}>Area (Min) *</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TextInput
                        style={[styles.textInput, { flex: 2 }]}
                        placeholder={newProp.areaUnit === 'acres' ? 'e.g. 4' : newProp.areaUnit === 'sqyards' as any ? 'e.g. 150' : 'e.g. 1200'}
                        placeholderTextColor={Neutrals.gray400}
                        keyboardType="numeric"
                        value={areaSqft}
                        onChangeText={setAreaSqft}
                      />
                      <TouchableOpacity
                        style={[styles.textInput, { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingHorizontal: 4 }]}
                        onPress={() => {
                          const units = ['sqft', 'sqyards', 'acres'];
                          const current = newProp.areaUnit || 'sqft';
                          const nextIdx = (units.indexOf(current) + 1) % units.length;
                          setNewProp({ ...newProp, areaUnit: units[nextIdx] as any });
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}>
                          {(newProp.areaUnit as any) === 'sqyards' ? 'Sq.Yds' : newProp.areaUnit === 'acres' ? 'Acres' : 'Sq.Ft'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Area (Max)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={newProp.areaUnit === 'acres' ? 'e.g. 6' : 'e.g. 1500'}
                      placeholderTextColor={Neutrals.gray400}
                      keyboardType="numeric"
                      value={areaSqftMax}
                      onChangeText={setAreaSqftMax}
                    />
                    <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Optional</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Property Title */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Property Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Rajapushpa Provincia, Financial District"
              placeholderTextColor={Neutrals.gray400}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Short Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Visible on the home screen property cards"
              placeholderTextColor={Neutrals.gray400}
              value={shortDescription}
              onChangeText={setShortDescription}
            />

            {/* RERA & Permission Numbers — matching admin */}
            <View style={[styles.grid2Row, { marginTop: 14 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>RERA Number <Text style={{ fontSize: 10, color: '#94A3B8' }}>(Optional)</Text></Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. P02400001234"
                  placeholderTextColor={Neutrals.gray400}
                  value={reraNumber}
                  onChangeText={setReraNumber}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Permission No. <Text style={{ fontSize: 10, color: '#94A3B8' }}>(Optional)</Text></Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. HMDA/123/2024"
                  placeholderTextColor={Neutrals.gray400}
                  value={permissionNumber}
                  onChangeText={setPermissionNumber}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Property Description *</Text>
            <TextInput
              style={[styles.textInput, { height: 110, textAlignVertical: 'top' }]}
              placeholder="Detailed overview of features, tenant profile, lease terms, amenities..."
              placeholderTextColor={Neutrals.gray400}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            {/* Property Speciality — matching admin Section 5.9 */}
            <View style={{ backgroundColor: '#FFFBEB', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A', marginTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Text style={{ fontSize: 18 }}>⭐</Text>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#92400E' }}>Property Speciality</Text>
                  <Text style={{ fontSize: 11, color: '#B45309' }}>Optional — Highlighted card on property detail page</Text>
                </View>
              </View>
              <TextInput
                style={[styles.textInput, { height: 80, textAlignVertical: 'top', borderColor: '#FDE68A' }]}
                placeholder="e.g. Prime location • Award-winning architecture • IGBC Gold Rated • 5 mins from Metro"
                placeholderTextColor={Neutrals.gray400}
                multiline
                numberOfLines={3}
                value={speciality}
                onChangeText={setSpeciality}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
                <Text style={styles.secondaryButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 2 }]}
                onPress={() => {
                  let finalAreaSqft = areaSqft;
                  
                  // For Residential, calculate min/max from selected BHKs
                  if (['Residential', 'Holiday'].includes(category)) {
                    const areas = Object.values(bhkAreas).map(v => Number(v)).filter(v => v > 0);
                    if (areas.length > 0) {
                      const min = Math.min(...areas);
                      const max = Math.max(...areas);
                      finalAreaSqft = min.toString();
                      setAreaSqft(finalAreaSqft);
                      if (max > min) setAreaSqftMax(max.toString());
                      
                      // Also auto-set bedrooms if a single BHK was selected
                      if (areas.length === 1) {
                        const bhkKey = Object.keys(bhkAreas)[0];
                        const bhkNum = parseInt(bhkKey);
                        if (!isNaN(bhkNum)) setNewProp(p => ({ ...p, bedrooms: bhkNum }));
                      }
                    } else {
                      finalAreaSqft = ''; // Reset if nothing selected
                    }
                  }

                  if (!title.trim() || !description.trim() || !finalAreaSqft) {
                    setStepError('Please fill in Title, Description, and select/enter Area.');
                    return;
                  }
                  setStepError('');
                  setStep(3);
                }}
              >
                <Text style={styles.primaryButtonText}>Continue to Features →</Text>
              </TouchableOpacity>
            </View>
            {stepError ? <Text style={{ color: '#EF4444', textAlign: 'center', marginTop: 12, fontSize: 13, fontWeight: '600' }}>{stepError}</Text> : null}
          </View>
        )}

        {/* STEP 3: Property Features (Dynamic) — matching admin Section 5.5 */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>
              {(category === 'Residential' || category === 'Holiday') ? '🏠 Apartment / Residential Details'
                : category === 'Plots & Farms' ? '🌾 Plot / Farm Land Details'
                : '🏢 Commercial Property Details'}
            </Text>
            <Text style={styles.stepSubtitle}>Provide specific amenities and features based on asset type.</Text>

            {(category === 'Residential' || category === 'Holiday') && (
              <>
                <Text style={styles.inputLabel}>Floor Type</Text>
                <View style={[styles.grid2, { marginBottom: 16 }]}>
                  {["High Rise", "Low Rise", "Multiple"].map(f => (
                    <TouchableOpacity key={f} style={[styles.tagBtn, newProp.floorType === f && styles.tagBtnActive]} onPress={() => setNewProp({ ...newProp, floorType: f })}>
                      <Text style={[styles.tagBtnText, newProp.floorType === f && styles.tagBtnTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.grid2Row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Bedrooms</Text>
                    <TextInput style={styles.textInput} keyboardType="numeric" placeholder="e.g. 3" value={newProp.bedrooms ? newProp.bedrooms.toString() : ''} onChangeText={t => setNewProp({...newProp, bedrooms: Number(t) || null})} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Bathrooms</Text>
                    <TextInput style={styles.textInput} keyboardType="numeric" placeholder="e.g. 3" value={newProp.bathrooms ? newProp.bathrooms.toString() : ''} onChangeText={t => setNewProp({...newProp, bathrooms: Number(t) || null})} />
                  </View>
                </View>
                <View style={styles.grid2Row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { marginTop: 14 }]}>Parking Count</Text>
                    <TextInput style={styles.textInput} keyboardType="numeric" placeholder="e.g. 2" value={newProp.parkingCount ? newProp.parkingCount.toString() : ''} onChangeText={t => setNewProp({...newProp, parkingCount: Number(t) || null})} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { marginTop: 14 }]}>Flooring</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {['Vitrified Tiles', 'Marble', 'Wooden', 'Other'].map(flr => (
                        <TouchableOpacity key={flr} style={[styles.tagBtn, { paddingVertical: 6, paddingHorizontal: 10 }, newProp.flooring === flr && styles.tagBtnActive]} onPress={() => setNewProp({...newProp, flooring: flr})}>
                          <Text style={[styles.tagBtnText, { fontSize: 11 }, newProp.flooring === flr && styles.tagBtnTextActive]}>{flr.split(' ')[0]}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Kitchen Type</Text>
                <View style={[styles.grid2, { marginBottom: 16 }]}>
                  {["Modular", "Open", "Semi-Modular"].map(k => (
                    <TouchableOpacity key={k} style={[styles.tagBtn, newProp.kitchenType === k && styles.tagBtnActive]} onPress={() => setNewProp({ ...newProp, kitchenType: k })}>
                      <Text style={[styles.tagBtnText, newProp.kitchenType === k && styles.tagBtnTextActive]}>{k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Features</Text>
                <View style={[styles.grid2, { marginBottom: 16 }]}>
                  <TouchableOpacity style={[styles.tagBtn, newProp.clubHouse && styles.tagBtnActive]} onPress={() => setNewProp({ ...newProp, clubHouse: !newProp.clubHouse })}>
                    <Text style={[styles.tagBtnText, newProp.clubHouse && styles.tagBtnTextActive]}>Club House</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Amenities</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {[
                    'Swimming Pool', 'Gymnasium', 'Creche / Day care', 'Lounge', 
                    'Childrens Play area / TOT LOT', 'Theatre', 'Rooftop Lounge', 
                    'Landscape Garden', 'Food Court', 'Convenience store', 'Cafeteria', 
                    'ATM', 'Senior citizen Lounge', 'Fire safety system', 'Power Backup', 
                    '24/7 Security', 'CCTV', 'Central air conditioning', 'High Speed lifts', 
                    'Conference room', 'Party hall', 'Games room', 'Outdoor Seating'
                  ].map(amenity => {
                    const isSelected = (newProp.amenities || '').split(',').includes(amenity);
                    return (
                      <TouchableOpacity
                        key={amenity}
                        style={[styles.tagBtn, isSelected && styles.tagBtnActive, { marginBottom: 4, marginRight: 0 }]}
                        onPress={() => {
                          const arr = (newProp.amenities || '').split(',').filter(Boolean);
                          setNewProp({ ...newProp, amenities: (isSelected ? arr.filter(x => x !== amenity) : [...arr, amenity]).join(',') });
                        }}
                      >
                        <Text style={[styles.tagBtnText, isSelected && styles.tagBtnTextActive]}>{amenity}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {(newProp.amenities || '').split(',').filter(Boolean).filter(a => ![
                    'Swimming Pool', 'Gymnasium', 'Creche / Day care', 'Lounge', 
                    'Childrens Play area / TOT LOT', 'Theatre', 'Rooftop Lounge', 
                    'Landscape Garden', 'Food Court', 'Convenience store', 'Cafeteria', 
                    'ATM', 'Senior citizen Lounge', 'Fire safety system', 'Power Backup', 
                    '24/7 Security', 'CCTV', 'Central air conditioning', 'High Speed lifts', 
                    'Conference room', 'Party hall', 'Games room', 'Outdoor Seating'
                  ].includes(a)).map(customA => (
                    <TouchableOpacity
                      key={customA}
                      style={[styles.tagBtn, styles.tagBtnActive, { marginBottom: 4 }]}
                      onPress={() => {
                        const arr = (newProp.amenities || '').split(',').filter(Boolean);
                        setNewProp({ ...newProp, amenities: arr.filter(x => x !== customA).join(',') });
                      }}
                    >
                      <Text style={[styles.tagBtnText, styles.tagBtnTextActive]}>{customA} ✕</Text>
                    </TouchableOpacity>
                  ))}
                  
                  <TouchableOpacity
                    style={[styles.tagBtn, { borderStyle: 'dashed', backgroundColor: '#F8FAFC' }]}
                    onPress={() => {
                      Alert.prompt(
                        "Add Custom Amenity",
                        "Enter the name of the amenity",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Add", onPress: (val?: string) => {
                            if (val && val.trim()) {
                              const arr = (newProp.amenities || '').split(',').filter(Boolean);
                              if (!arr.includes(val.trim())) {
                                setNewProp({ ...newProp, amenities: [...arr, val.trim()].join(',') });
                              }
                            }
                          }}
                        ],
                        "plain-text"
                      );
                    }}
                  >
                    <Text style={[styles.tagBtnText, { color: '#64748B' }]}>+ Add Custom</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {(category === 'Commercial' || category === 'Fractional') && !(['Residential', 'Holiday', 'Plots & Farms'].includes(category)) && (
              <>
                <Text style={styles.inputLabel}>Floor Type</Text>
                <View style={[styles.grid2, { marginBottom: 16 }]}>
                  {["High Rise", "Low Rise", "Multiple"].map(f => (
                    <TouchableOpacity key={f} style={[styles.tagBtn, newProp.floorType === f && styles.tagBtnActive]} onPress={() => setNewProp({ ...newProp, floorType: f })}>
                      <Text style={[styles.tagBtnText, newProp.floorType === f && styles.tagBtnTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.grid2Row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { marginTop: 14 }]}>Parking Count</Text>
                    <TextInput style={styles.textInput} keyboardType="numeric" placeholder="e.g. 5" value={newProp.parkingCount ? newProp.parkingCount.toString() : ''} onChangeText={t => setNewProp({...newProp, parkingCount: Number(t) || null})} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { marginTop: 14 }]}>Flooring</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {['Vitrified Tiles', 'Marble', 'Wooden', 'Other'].map(flr => (
                        <TouchableOpacity key={flr} style={[styles.tagBtn, { paddingVertical: 6, paddingHorizontal: 10 }, newProp.flooring === flr && styles.tagBtnActive]} onPress={() => setNewProp({...newProp, flooring: flr})}>
                          <Text style={[styles.tagBtnText, { fontSize: 11 }, newProp.flooring === flr && styles.tagBtnTextActive]}>{flr.split(' ')[0]}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Features & Status</Text>
                <View style={[styles.grid2, { marginBottom: 16 }]}>
                  {[
                    { key: 'furnished', label: 'Furnished' },
                    { key: 'plugAndPlay', label: 'Plug & Play' },
                    { key: 'centralAc', label: 'Central AC' },
                    { key: 'preleased', label: 'Preleased' },
                    { key: 'maintenanceAvail', label: 'Maintenance' },
                    { key: 'foodCourts', label: 'Food Courts' },
                  ].map(f => (
                    <TouchableOpacity key={f.key} style={[styles.tagBtn, (newProp as any)[f.key] && styles.tagBtnActive]} onPress={() => setNewProp({ ...newProp, [f.key]: !(newProp as any)[f.key] })}>
                      <Text style={[styles.tagBtnText, (newProp as any)[f.key] && styles.tagBtnTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Amenities</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {[
                    'Cafeteria', 'Conference room', 'High Speed lifts', 'Central air conditioning',
                    '24/7 Security', 'CCTV', 'Power Backup', 'Fire safety system', 'Lounge',
                    'ATM', 'Food Court', 'Convenience store', 'Outdoor Seating'
                  ].map(amenity => {
                    const isSelected = (newProp.amenities || '').split(',').includes(amenity);
                    return (
                      <TouchableOpacity
                        key={amenity}
                        style={[styles.tagBtn, isSelected && styles.tagBtnActive, { marginBottom: 4, marginRight: 0 }]}
                        onPress={() => {
                          const arr = (newProp.amenities || '').split(',').filter(Boolean);
                          setNewProp({ ...newProp, amenities: (isSelected ? arr.filter(x => x !== amenity) : [...arr, amenity]).join(',') });
                        }}
                      >
                        <Text style={[styles.tagBtnText, isSelected && styles.tagBtnTextActive]}>{amenity}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {(newProp.amenities || '').split(',').filter(Boolean).filter(a => ![
                    'Cafeteria', 'Conference room', 'High Speed lifts', 'Central air conditioning',
                    '24/7 Security', 'CCTV', 'Power Backup', 'Fire safety system', 'Lounge',
                    'ATM', 'Food Court', 'Convenience store', 'Outdoor Seating'
                  ].includes(a)).map(customA => (
                    <TouchableOpacity
                      key={customA}
                      style={[styles.tagBtn, styles.tagBtnActive, { marginBottom: 4 }]}
                      onPress={() => {
                        const arr = (newProp.amenities || '').split(',').filter(Boolean);
                        setNewProp({ ...newProp, amenities: arr.filter(x => x !== customA).join(',') });
                      }}
                    >
                      <Text style={[styles.tagBtnText, styles.tagBtnTextActive]}>{customA} ✕</Text>
                    </TouchableOpacity>
                  ))}
                  
                  <TouchableOpacity
                    style={[styles.tagBtn, { borderStyle: 'dashed', backgroundColor: '#F8FAFC' }]}
                    onPress={() => {
                      Alert.prompt(
                        "Add Custom Amenity",
                        "Enter the name of the amenity",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Add", onPress: (val?: string) => {
                            if (val && val.trim()) {
                              const arr = (newProp.amenities || '').split(',').filter(Boolean);
                              if (!arr.includes(val.trim())) {
                                setNewProp({ ...newProp, amenities: [...arr, val.trim()].join(',') });
                              }
                            }
                          }}
                        ],
                        "plain-text"
                      );
                    }}
                  >
                    <Text style={[styles.tagBtnText, { color: '#64748B' }]}>+ Add Custom</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {(category === 'Plots & Farms' || category === 'Buyer') && (
              <>
                <Text style={styles.inputLabel}>Area Unit</Text>
                <View style={[styles.grid2, { marginBottom: 16 }]}>
                  {["sqft", "acres"].map(u => (
                    <TouchableOpacity key={u} style={[styles.tagBtn, newProp.areaUnit === u && styles.tagBtnActive]} onPress={() => setNewProp({ ...newProp, areaUnit: u as any })}>
                      <Text style={[styles.tagBtnText, newProp.areaUnit === u && styles.tagBtnTextActive]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Ownership Type</Text>
                <View style={[styles.grid2, { marginBottom: 16 }]}>
                  {["Single", "Multiple"].map(o => (
                    <TouchableOpacity key={o} style={[styles.tagBtn, newProp.ownershipType === o && styles.tagBtnActive]} onPress={() => setNewProp({ ...newProp, ownershipType: o })}>
                      <Text style={[styles.tagBtnText, newProp.ownershipType === o && styles.tagBtnTextActive]}>{o}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Approach Road</Text>
                <View style={[styles.grid2, { marginBottom: 16 }]}>
                  {["BT Road", "Village Road", "Katcha"].map(r => (
                    <TouchableOpacity key={r} style={[styles.tagBtn, newProp.approachRoad === r && styles.tagBtnActive]} onPress={() => setNewProp({ ...newProp, approachRoad: r })}>
                      <Text style={[styles.tagBtnText, newProp.approachRoad === r && styles.tagBtnTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Features</Text>
                <View style={[styles.grid2, { marginBottom: 16 }]}>
                  {[
                    { key: 'fencing', label: 'Fencing' },
                    { key: 'electricityAvail', label: 'Electricity' },
                    { key: 'farmShed', label: 'Farm Shed' },
                    { key: 'boreWells', label: 'Bore Wells' },
                    { key: 'plantsAvailable', label: 'Plants Available' },
                    { key: 'loanAvailability', label: 'Loan Available' },
                    { key: 'landRegistered', label: 'Land Registered' },
                    { key: 'passBook', label: 'Pass Book' },
                    { key: 'raithuBharosa', label: 'Raithu Bharosa' },
                    { key: 'underIrrigation', label: 'Under Irrigation' },
                  ].map(f => (
                    <TouchableOpacity key={f.key} style={[styles.tagBtn, (newProp as any)[f.key] && styles.tagBtnActive]} onPress={() => setNewProp({ ...newProp, [f.key]: !(newProp as any)[f.key] })}>
                      <Text style={[styles.tagBtnText, (newProp as any)[f.key] && styles.tagBtnTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(2)}>
                <Text style={styles.secondaryButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { flex: 2 }]} onPress={() => setStep(4)}>
                <Text style={styles.primaryButtonText}>Continue to Location →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 4: Location & Google Maps */}
        {step === 4 && (
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
                <TextInput style={styles.textInput} value={stateName} onChangeText={setStateName} placeholder="State" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Locality / Area *</Text>
                <TextInput style={styles.textInput} placeholder="e.g. Gachibowli" value={locality} onChangeText={setLocality} />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Full Street Address</Text>
            <TextInput style={styles.textInput} placeholder="e.g. Tower B, Financial District" value={fullAddress} onChangeText={setFullAddress} />

            {/* Google Maps Link with Coords extraction */}
            <View style={styles.mapsCard}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: Neutrals.obsidian, marginBottom: 4 }}>
                📍 Select Location on Map or Enter Coordinates
              </Text>

              {/* Leaflet Map Picker */}
              <MapPicker 
                lat={parseFloat(lat) || 17.3850} 
                lng={parseFloat(lng) || 78.4867} 
                onLocationChange={(newLat, newLng) => {
                  setLat(newLat.toString());
                  setLng(newLng.toString());
                }} 
              />

              <Text style={{ fontSize: 12, fontWeight: '600', color: Neutrals.gray600, marginTop: 12, marginBottom: 4 }}>
                Or extract from Google Maps Link:
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
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(3)}>
                <Text style={styles.secondaryButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { flex: 2 }]} onPress={() => {
                  if (!locality.trim()) {
                    setStepError('Please enter the locality.');
                    return;
                  }
                  setStepError('');
                  setStep(5);
              }}>
                <Text style={styles.primaryButtonText}>Continue to Media →</Text>
              </TouchableOpacity>
            </View>
            {stepError ? <Text style={{ color: '#EF4444', textAlign: 'center', marginTop: 12, fontSize: 13, fontWeight: '600' }}>{stepError}</Text> : null}
          </View>
        )}

        {/* STEP 5: Media & Submit */}
        {step === 5 && (
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

            <Text style={[styles.inputLabel, { marginTop: 18 }]}>Property Documents (PDF, Word, Excel)</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={handlePickDocuments}>
              <Ionicons name="document-attach-outline" size={32} color={GoldSystem.primaryGold} />
              <Text style={styles.uploadBoxTitle}>Tap to select documents</Text>
              <Text style={styles.uploadBoxSub}>Attach brochures, floor plans, or legal documents</Text>
            </TouchableOpacity>

            {localDocumentUris.length > 0 && (
              <View style={{ marginTop: 12, gap: 8 }}>
                {localDocumentUris.map((uri, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons name="document-text" size={20} color="#64748B" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 13, color: '#334155', flex: 1 }} numberOfLines={1}>
                        {uri.split('/').pop() || `Document ${idx + 1}`}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveDocument(idx)} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

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

        {/* Inline Validation Error Banner */}
            {formErrors.length > 0 && (
              <View style={{
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FECACA',
                borderRadius: 10,
                padding: 14,
                marginTop: 16,
              }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626', marginBottom: 6 }}>
                  ⚠️ Please fill in all required fields:
                </Text>
                {formErrors.map((err, i) => (
                  <Text key={i} style={{ fontSize: 12, color: '#B91C1C', marginBottom: 3 }}>• {err}</Text>
                ))}
              </View>
            )}

            {isSubmitting && (
              <View style={styles.submittingStatus}>
                <ActivityIndicator size="small" color={GoldSystem.primaryGold} />
                <Text style={styles.submittingText}>{statusMessage}</Text>
              </View>
            )}

            {/* Inline Terms and Conditions */}
            <View style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginTop: 24, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>
                Important Guidelines & Cyber Laws
              </Text>
              
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: '#64748B', marginRight: 8 }}>•</Text>
                <Text style={{ fontSize: 13, color: '#475569', flex: 1, lineHeight: 18 }}>
                  <Text style={{ fontWeight: '600' }}>Legal Ownership:</Text> You confirm you are the legal owner or an authorized representative to list this property.
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: '#64748B', marginRight: 8 }}>•</Text>
                <Text style={{ fontSize: 13, color: '#475569', flex: 1, lineHeight: 18 }}>
                  <Text style={{ fontWeight: '600' }}>Accurate Information:</Text> Posting false, misleading, or fraudulent property details is strictly prohibited under IT Act 2000 & 2008 amendments.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: '#64748B', marginRight: 8 }}>•</Text>
                <Text style={{ fontSize: 13, color: '#475569', flex: 1, lineHeight: 18 }}>
                  <Text style={{ fontWeight: '600' }}>No Fraudulent Media:</Text> Uploading unauthorized images or copyright-infringing content may result in permanent account suspension and legal action.
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ fontSize: 13, color: '#64748B', marginRight: 8 }}>•</Text>
                <Text style={{ fontSize: 13, color: '#475569', flex: 1, lineHeight: 18 }}>
                  <Text style={{ fontWeight: '600' }}>Platform Policy:</Text> Realshare reserves the right to unlist properties that violate our internal terms of service without prior notice.
                </Text>
              </View>
            </View>

            {/* Terms and Conditions Checkbox */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 16, marginBottom: 10, paddingHorizontal: 4 }}>
              <TouchableOpacity onPress={() => setAcceptedTerms(!acceptedTerms)} style={{ marginRight: 10, marginTop: 2 }}>
                <Ionicons 
                  name={acceptedTerms ? "checkbox" : "square-outline"} 
                  size={22} 
                  color={acceptedTerms ? GoldSystem.primaryGold : Neutrals.gray400} 
                />
              </TouchableOpacity>
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 13, color: Neutrals.gray600, lineHeight: 20 }} onPress={() => setAcceptedTerms(!acceptedTerms)}>
                  I confirm that I have the legal authority to list this property and that all provided information is accurate. I agree to Realshare's{' '}
                </Text>
                <TouchableOpacity onPress={() => router.push('/terms-of-service')}>
                  <Text style={{ color: GoldSystem.primaryGold, fontWeight: '600', fontSize: 13, lineHeight: 20 }}>Terms of Service</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 13, color: Neutrals.gray600, lineHeight: 20 }} onPress={() => setAcceptedTerms(!acceptedTerms)}>
                  {' '}and{' '}
                </Text>
                <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
                  <Text style={{ color: GoldSystem.primaryGold, fontWeight: '600', fontSize: 13, lineHeight: 20 }}>Privacy Policy</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 13, color: Neutrals.gray600, lineHeight: 20 }} onPress={() => setAcceptedTerms(!acceptedTerms)}>
                  .
                </Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(4)} disabled={isSubmitting}>
                <Text style={styles.secondaryButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 2 }, isSubmitting && { opacity: 0.6 }]}
                onPress={validateAndPreview}
                disabled={isSubmitting}
              >
                <Text style={styles.primaryButtonText}>
                  👁️ Preview &amp; Publish
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Property Preview Modal (Property Details Page Replica) ── */}
      <Modal visible={showPreviewModal} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          
          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 36, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
             <Text style={{ fontSize: 14, color: '#64748B' }}>Home  &gt;  Properties  &gt;  <Text style={{ fontWeight: '600', color: '#1E293B' }}>{title || 'Draft Property'}</Text></Text>
             <TouchableOpacity onPress={() => setShowPreviewModal(false)} style={{ padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20 }}>
               <Ionicons name="close" size={20} color="#64748B" />
             </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 40 : 0 }}>
                  
                  {/* Main Content (Left on Desktop) */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 32, marginBottom: 32 }}>
                      
                      {/* Text Column */}
                      <View style={{ width: isDesktop ? 340 : '100%' }}>
                        <Text style={{ fontSize: isDesktop ? 28 : 22, fontWeight: '800', color: '#1E293B', marginBottom: 4 }}>
                          {title || 'Property Title'}
                        </Text>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                          <Text style={{ fontSize: 14, color: '#475569', fontWeight: '500' }}>📍 {[locality, district === 'Other' ? customDistrict : district, stateName].filter(Boolean).join(', ')}</Text>
                          <Text style={{ color: '#1E293B', fontWeight: '700', fontSize: 13, marginLeft: 16 }}>Open in Google Maps ↗</Text>
                        </View>

                        <Text style={{ fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 20 }} numberOfLines={4}>
                          {description || 'Premium property with excellent investment potential and high capital growth prospects. Located in a prime area with seamless connectivity.'}
                        </Text>

                        {/* Quick Stats Container */}
                        <View style={{ marginTop: 16, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 16 }}>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, columnGap: 12 }}>
                            <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Ionicons name="business-outline" size={20} color="#64748B" />
                              <View>
                                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Type</Text>
                                <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700', textTransform: 'capitalize' }}>{listingType}</Text>
                              </View>
                            </View>
                            <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Ionicons name="resize-outline" size={20} color="#64748B" />
                              <View>
                                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Area</Text>
                                <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>{Number(areaSqft || 0).toLocaleString('en-IN')} {newProp.areaUnit}</Text>
                              </View>
                            </View>
                            <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Ionicons name="shield-checkmark-outline" size={20} color="#B48811" />
                              <View>
                                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>Facilities</Text>
                                <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700' }}>24x7 Security</Text>
                              </View>
                            </View>
                          </View>
                        </View>

                        {/* Posted By */}
                        <View style={{ marginTop: 16, padding: 14, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="person" size={24} color="#94A3B8" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>PROPERTY POSTED BY YOU</Text>
                            <Text style={{ fontSize: 15, color: '#1E293B', fontWeight: '700', marginTop: 2 }}>Realshare User</Text>
                          </View>
                          <Ionicons name="checkmark-circle" size={20} color="#059669" />
                        </View>
                      </View>

                      {/* Gallery Column */}
                      <View style={{ flex: 1, width: isDesktop ? undefined : '100%', marginTop: isDesktop ? 0 : 24 }}>
                        <View style={{ width: '100%', height: isDesktop ? 420 : 240, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E2E8F0', marginBottom: 12 }}>
                          {localImageUris.length > 0 ? (
                             <Image source={{ uri: localImageUris[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          ) : (
                             <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                               <Ionicons name="image-outline" size={48} color="#94A3B8" />
                               <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 8 }}>No cover image selected</Text>
                             </View>
                          )}
                          <View style={{ position: 'absolute', top: 16, right: 72, width: 44, height: 44, backgroundColor: '#fff', borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="heart-outline" size={22} color="#1E293B" />
                          </View>
                          <View style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, backgroundColor: '#fff', borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="share-social-outline" size={22} color="#1E293B" />
                          </View>
                        </View>
                      </View>

                    </View>

                    {/* Static Tabs Mock */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 8, marginBottom: 24, gap: 24 }}>
                      {['Overview', 'Property Details', 'Amenities', 'Location', 'Developer', 'Documents'].map((tab, idx) => (
                        <View key={tab}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: idx === 0 ? '#D4AF37' : '#64748B', paddingBottom: 4 }}>{tab}</Text>
                          {idx === 0 && <View style={{ position: 'absolute', bottom: -9, left: 0, right: 0, height: 2, backgroundColor: '#D4AF37' }} />}
                        </View>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Right Column (Price Cards) */}
                  <View style={{ width: isDesktop ? 320 : '100%' }}>
                     <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2, marginBottom: 24 }}>
                        <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '600', marginBottom: 4 }}>Estimated Price</Text>
                        <Text style={{ fontSize: 32, fontWeight: '800', color: '#D4AF37', marginBottom: 20 }}>
                           ₹{Number(price || 0).toLocaleString('en-IN')}
                        </Text>
                        <View style={{ width: '100%', backgroundColor: '#B48811', paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                           <Ionicons name="calendar-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                           <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Request Details</Text>
                        </View>
                     </View>

                     <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                           <Text style={{ fontSize: 18 }}>🧮</Text>
                           <Text style={{ fontSize: 17, fontWeight: '800', color: '#1E293B', marginLeft: 8 }}>Payment Calculator</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>Property Price (₹)</Text>
                        <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                           <Text style={{ fontSize: 14, color: '#1E293B' }}>{Number(price || 0).toLocaleString('en-IN')}</Text>
                        </View>
                     </View>
                  </View>
                </View>
          </ScrollView>

          {/* Fixed Action Buttons */}
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            flexDirection: 'row', gap: 12, padding: 20,
            backgroundColor: '#fff',
            borderTopWidth: 1, borderTopColor: '#E2E8F0',
            paddingBottom: Platform.OS === 'ios' ? 36 : 20,
          }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              onPress={() => setShowPreviewModal(false)}

              disabled={isSubmitting}
            >
              <Text style={{ fontWeight: '700', color: '#334155', fontSize: 15 }}>← Back to Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[{ flex: 2, backgroundColor: '#059669', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }, isSubmitting && { opacity: 0.7 }]}
              onPress={async () => {
                setShowPreviewModal(false);
                await handleSubmit();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ fontWeight: '700', color: '#fff', fontSize: 15 }}>🚀 Post Property</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  tagBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBtnActive: {
    borderColor: GoldSystem.primaryGold,
    backgroundColor: GoldSystem.paleGold,
  },
  tagBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Neutrals.textSecondary,
  },
  tagBtnTextActive: {
    color: GoldSystem.darkGold,
    fontWeight: '700',
  },
});
