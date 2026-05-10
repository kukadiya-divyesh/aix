import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Package, MapPin, Hash, Calendar, CheckCircle, AlertTriangle } from 'lucide-react-native';

const InboundDetailScreen = ({ route, navigation }) => {
  const { inbound } = route.params;
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    Alert.alert(
      'Complete Task',
      'Mark this Inbound task as DONE?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Done', 
          onPress: async () => {
            setLoading(true);
            try {
              // We'll need a generic update endpoint or specific status endpoint
              await axios.put(`/api/inbound/${inbound.id}`, { ...inbound, status: 'DONE' });
              Alert.alert('Success', 'Task marked as DONE');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || err.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reference Details</Text>
          <DetailItem icon={<Package size={18} color="#3b82f6" />} label="PO Number" value={inbound.po_no} />
          <DetailItem icon={<Hash size={18} color="#3b82f6" />} label="Invoice No" value={inbound.inv_no || 'N/A'} />
          <DetailItem icon={<Hash size={18} color="#3b82f6" />} label="AWB Number" value={inbound.awb_no || 'N/A'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          <Text style={styles.productDesc}>{inbound.product_description}</Text>
          <View style={styles.statsRow}>
            <StatBox label="Boxes" value={inbound.no_of_box} />
            <StatBox label="Total Qty" value={inbound.quantity} />
            <StatBox label="Status" value={inbound.status} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logistics</Text>
          <DetailItem icon={<MapPin size={18} color="#10b981" />} label="Location" value={inbound.warehouse_location || 'Not Set'} />
          <DetailItem icon={<Calendar size={18} color="#f59e0b" />} label="Bond Date" value={inbound.bond_date ? new Date(inbound.bond_date).toLocaleDateString() : 'N/A'} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => navigation.navigate('Placement', { inbound })}
          >
            <MapPin color="white" size={20} />
            <Text style={styles.actionBtnText}>Placement Workflow</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.exceptionBtn]} 
            onPress={() => navigation.navigate('Exception', { inbound })}
          >
            <AlertTriangle color="white" size={20} />
            <Text style={styles.actionBtnText}>Report Exception</Text>
          </TouchableOpacity>

          {inbound.status !== 'DONE' && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.doneBtn]} 
              onPress={handleComplete}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : (
                <>
                  <CheckCircle color="white" size={20} />
                  <Text style={styles.actionBtnText}>Mark as Completed</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <View style={styles.detailItem}>
    {icon}
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const StatBox = ({ label, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValueText}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 15 },
  card: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, marginBottom: 30 },
  section: { marginBottom: 25 },
  sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  detailContent: { marginLeft: 15 },
  detailLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' },
  detailValue: { color: 'white', fontSize: 15, fontWeight: '600', marginTop: 2 },
  productDesc: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, alignItems: 'center' },
  statLabel: { color: '#94a3b8', fontSize: 10, textTransform: 'uppercase' },
  statValueText: { color: 'white', fontSize: 14, fontWeight: '800', marginTop: 4 },
  actions: { marginTop: 10, gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, gap: 10 },
  actionBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  exceptionBtn: { backgroundColor: '#f59e0b' },
  doneBtn: { backgroundColor: '#10b981', marginTop: 10 },
});

export default InboundDetailScreen;
