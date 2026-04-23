import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Box, CheckCircle, AlertTriangle, Scan } from 'lucide-react-native';

const PlacementScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [gridCode, setGridCode] = useState(null);
  const [rfidTags, setRfidTags] = useState([]);
  const [mode, setMode] = useState('grid'); // 'grid' or 'rfid'

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    if (mode === 'grid') {
      setGridCode(data);
      setMode('rfid');
      Alert.alert('Grid Scanned', `Grid ${data} selected. Now scan RFID tags.`);
    } else {
      if (!rfidTags.includes(data)) {
        setRfidTags([...rfidTags, data]);
      }
    }
    // Simulation: Reset scanner after 2 seconds
    setTimeout(() => setScanned(false), 2000);
  };

  const submitPlacement = () => {
    Alert.alert('Success', `${rfidTags.length} boxes mapped to Grid ${gridCode}`);
    setGridCode(null);
    setRfidTags([]);
    setMode('grid');
  };

  if (hasPermission === null) return <Text>Requesting camera permission...</Text>;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PLACEMENT WORKFLOW</Text>
        <Text style={styles.subtitle}>
          {mode === 'grid' ? 'Step 1: Scan Grid Barcode' : `Step 2: Scan RFID Tags for Grid ${gridCode}`}
        </Text>
      </View>

      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        {scanned && <View style={styles.overlay}><CheckCircle color="white" size={60} /></View>}
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Scanned RFIDs ({rfidTags.length})</Text>
        <ScrollView style={styles.list}>
          {rfidTags.map((tag, i) => (
            <View key={i} style={styles.tagItem}>
              <CheckCircle size={16} color="#10b981" />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity 
        style={[styles.submitBtn, { opacity: gridCode && rfidTags.length > 0 ? 1 : 0.5 }]} 
        disabled={!gridCode || rfidTags.length === 0}
        onPress={submitPlacement}
      >
        <Text style={styles.submitBtnText}>Confirm Placement</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 50, backgroundColor: '#1e293b', paddingTop: 60 },
  title: { color: 'white', fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  scannerContainer: { height: 300, backgroundColor: 'black', margin: 20, borderRadius: 12, overflow: 'hidden' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(16, 185, 129, 0.4)', justifyContent: 'center', alignItems: 'center' },
  listContainer: { flex: 1, padding: 20 },
  listTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  list: { flex: 1 },
  tagItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#1e293b', borderRadius: 8, marginBottom: 8 },
  tagText: { color: 'white', fontWeight: '600' },
  submitBtn: { margin: 20, backgroundColor: '#d32f2f', padding: 18, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: 'white', fontWeight: '700', fontSize: 16 }
});

export default PlacementScreen;
