import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function AdditionalServicesScreen() {
  const router = useRouter();

  const [selectedService, setSelectedService] = useState<string>('Home Loans');
  const [fullName, setFullName] = useState('Arjun Kumar');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [propertyReq, setPropertyReq] = useState('Goa Beachfront Villa');
  const [budget, setBudget] = useState('₹50,00,000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const servicesList = [
    { title: 'Home Loans', icon: '🏦', partner: 'HDFC, SBI & ICICI Tie-up', desc: 'Get lowest interest rates with instant pre-approvals for your fractional real estate investments.' },
    { title: 'Interior Works', icon: '🛋️', partner: 'Livspace & RealShare Interiors', desc: 'Turnkey interior packages, modular kitchens, Italian marble flooring, and smart home automation.' },
    { title: 'Home Insurance', icon: '🏠', partner: 'Tata AIG & ICICI Lombard', desc: 'Protect your holiday villas and commercial suites against structural damage, fire, and natural perils.' },
    { title: 'Auto & Health Insurance', icon: '🛡️', partner: 'Star Health & HDFC ERGO', desc: 'Exclusive bundled family health policies and luxury vehicle comprehensive coverage plans.' },
    { title: 'Property Management', icon: '🔑', partner: 'RealShare Facility Services', desc: 'Hassle-free tenant screening, rental collection, repairs, maintenance, and 24/7 guest concierge.' },
  ];

  const handleSubmitInquiry = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Value-Added Services</Text>
      </View>

      <View style={styles.content}>
        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Comprehensive Real Estate Services</Text>
          <Text style={styles.introDesc}>
            RealShare provides institutional-grade ancillary services to enhance your property ownership and investment yields.
          </Text>
        </View>

        {/* Services List Cards */}
        <Text style={styles.sectionHeader}>Select a Service:</Text>
        <View style={styles.servicesGrid}>
          {servicesList.map((srv) => (
            <TouchableOpacity
              key={srv.title}
              style={[
                styles.serviceCard,
                selectedService === srv.title && styles.serviceCardActive,
              ]}
              onPress={() => {
                setSelectedService(srv.title);
                setSubmitted(false);
              }}
            >
              <Text style={styles.serviceIcon}>{srv.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceTitle}>{srv.title}</Text>
                <Text style={styles.partnerBadge}>{srv.partner}</Text>
                <Text style={styles.serviceDesc}>{srv.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lead Application Form */}
        <View style={styles.formCard}>
          {!submitted ? (
            <>
              <Text style={styles.formTitle}>Request Callback for {selectedService}</Text>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Property / Project Reference</Text>
              <TextInput
                style={styles.input}
                value={propertyReq}
                onChangeText={setPropertyReq}
              />

              <Text style={styles.label}>Estimated Budget / Loan Value</Text>
              <TextInput
                style={styles.input}
                value={budget}
                onChangeText={setBudget}
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitInquiry}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Service Request</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successBox}>
              <Text style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>✅</Text>
              <Text style={styles.successTitle}>Inquiry Submitted Successfully!</Text>
              <Text style={styles.successDesc}>
                Our specialized team for {selectedService} will contact you at {phone} within 2 business hours.
              </Text>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setSubmitted(false)}
              >
                <Text style={styles.doneBtnText}>Submit Another Request</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  content: {
    padding: 20,
  },
  introCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 18,
  },
  introTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  introDesc: {
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  servicesGrid: {
    gap: 10,
    marginBottom: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    alignItems: 'flex-start',
  },
  serviceCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#F0F7FF',
  },
  serviceIcon: {
    fontSize: 26,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  partnerBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 2,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    fontSize: 12,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  successDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  doneBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
});
