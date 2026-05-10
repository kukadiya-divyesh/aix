import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { Package, ChevronRight, Hash, FileText, AlertCircle } from 'lucide-react-native';

const InboundListScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = async (retries = 3) => {
    try {
      setError(null);
      const resp = await axios.get('/api/dashboard/tasks/inbound');
      setTasks(resp.data);
    } catch (err) {
      console.error('Error fetching inbound tasks:', err);
      
      if (err.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        navigation.navigate('Login');
      } else if (retries > 0) {
        console.log(`Retrying... (${retries} attempts left)`);
        setTimeout(() => fetchTasks(retries - 1), 1000);
      } else {
        setError('Failed to load tasks. Pull to refresh.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('InboundDetail', { inbound: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Package color="#3b82f6" size={20} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.poNo}>PO: {item.po_no}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <ChevronRight color="#475569" size={20} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <FileText color="#94a3b8" size={14} />
          <Text style={styles.detailText}>Inv: {item.inv_no || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Hash color="#94a3b8" size={14} />
          <Text style={styles.detailText}>{item.no_of_box} Boxes | {item.quantity} units</Text>
        </View>
        <Text style={styles.desc} numberOfLines={1}>{item.product_description}</Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return '#64748b';
      case 'IN_PROCESS': return '#3b82f6';
      case 'DONE': return '#10b981';
      case 'EXCEPTION': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle color="#fca5a5" size={16} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No pending inbound tasks assigned to you.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  list: { padding: 15 },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  errorBanner: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftColor: '#ef4444',
    borderLeftWidth: 4,
    padding: 12,
    margin: 15,
    borderRadius: 8,
    gap: 8
  },
  errorText: { color: '#fca5a5', fontSize: 13, flex: 1 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerText: { flex: 1 },
  poNo: { color: 'white', fontSize: 16, fontWeight: '700' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  statusText: { color: 'white', fontSize: 10, fontWeight: '800' },
  cardBody: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailText: { color: '#94a3b8', fontSize: 13 },
  desc: { color: '#64748b', fontSize: 12, marginTop: 4 },
  empty: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 }
});

export default InboundListScreen;
