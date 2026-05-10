import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Truck, Package, Hash, User, CheckCircle, AlertTriangle, Scan, ArrowRight } from 'lucide-react-native';

const OutboundDetailScreen = ({ route, navigation }) => {
  const { line } = route.params;
  const [loading, setLoading] = useState(false);
  const [scannedCount, setScannedCount] = useState(line.scannedRfids?.length || 0);

  const handlePickup = () => {
    // Simulate RFID scanning for pickup
    if (scannedCount < line.noOfBoxes) {
      setScannedCount(scannedCount + 1);
    } else {
      Alert.alert('Scan Complete', 'All boxes for this shipment have been scanned.');
    }
  };

  const handleComplete = async () => {
    if (scannedCount < line.noOfBoxes) {
      Alert.alert('Incomplete Scan', `Please scan all ${line.noOfBoxes} boxes before finalizing.`);
      return;
    }

    Alert.alert(
      'Finalize Dispatch',
      'Confirm dispatch for this shipment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            setLoading(true);
            try {
              await axios.patch(`/api/outbound/ledger/finalize/${line.id}`);
              Alert.alert('Success', 'Shipment dispatched');
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
          <Text style={styles.sectionTitle}>Shipment Header</Text>
          <DetailItem icon={<Truck size={18} color="#f59e0b" />} label="Flight / Vehicle" value={line.flightNo} />
          <DetailItem icon={<Hash size={18} color="#f59e0b" />} label="Shipping Bill" value={line.sbNo} />
          <DetailItem icon={<Package size={18} color="#3b82f6" />} label="Linked PO" value={line.outbound?.inbound?.po_no} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Workflow</Text>
          <View style={styles.statsRow}>
            <StatBox label="Total Boxes" value={`${line.noOfBoxes}`} />
            <StatBox label="Scanned" value={`${scannedCount}`} color={scannedCount === line.noOfBoxes ? '#10b981' : '#f59e0b'} />
          </View>
          
          <TouchableOpacity 
            style={[styles.scanBtn, scannedCount === line.noOfBoxes && styles.disabledBtn]} 
            onPress={handlePickup}
            disabled={scannedCount === line.noOfBoxes}
          >
            <Scan color="white" size={24} />
            <Text style={styles.actionBtnText}>
              {scannedCount === line.noOfBoxes ? 'Scanning Complete' : 'Scan Box RFID'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.exceptionBtn]} 
            onPress={() => navigation.navigate('Exception', { outboundLineId: line.id, po_no: line.outbound?.inbound?.po_no })}
          >
            <AlertTriangle color="white" size={20} />
            <Text style={styles.actionBtnText}>Report Exception</Text>
          </TouchableOpacity>

          {line.status !== 'DISPATCHED' && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.doneBtn, scannedCount < line.noOfBoxes && styles.disabledBtn]} 
              onPress={handleComplete}
              disabled={loading || scannedCount < line.noOfBoxes}
            >
              {loading ? <ActivityIndicator color="white" /> : (
                <>
                  <CheckCircle color="white" size={20} />
                  <Text style={styles.actionBtnText}>Confirm Dispatch</Text>
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

const StatBox = ({ label, value, color = 'white' }) => (
  <View style={styles.statBox}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValueText, { color }]}>{value}</Text>
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
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 15 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10, alignItems: 'center' },
  statLabel: { color: '#94a3b8', fontSize: 10, textTransform: 'uppercase' },
  statValueText: { color: 'white', fontSize: 18, fontWeight: '800', marginTop: 4 },
  actions: { marginTop: 10, gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 10 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, gap: 10, marginBottom: 10 },
  actionBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  doneBtn: { backgroundColor: '#10b981' },
  exceptionBtn: { backgroundColor: '#ef4444' },
  disabledBtn: { opacity: 0.5, backgroundColor: '#475569' }
});

export default OutboundDetailScreen;
