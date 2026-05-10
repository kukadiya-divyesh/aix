import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { Truck, ChevronRight, Hash, User, AlertTriangle } from 'lucide-react-native';

const OutboundListScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const resp = await axios.get('/api/dashboard/tasks/outbound');
      setTasks(resp.data);
    } catch (err) {
      console.error('Error fetching outbound tasks:', err);
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
      onPress={() => navigation.navigate('OutboundDetail', { line: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Truck color="#f59e0b" size={20} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.customer}>{item.outbound?.inbound?.po_no}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <ChevronRight color="#475569" size={20} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <Hash color="#94a3b8" size={14} />
          <Text style={styles.detailText}>SB: {item.sbNo} | Flight: {item.flightNo}</Text>
        </View>
        <View style={styles.detailRow}>
          <User color="#94a3b8" size={14} />
          <Text style={styles.detailText}>{item.quantityIssued} Units | {item.noOfBoxes} Boxes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'IN_PROCESS': return '#f59e0b';
      case 'DONE': return '#10b981';
      default: return '#94a3b8';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <Text style={styles.emptyText}>No pending outbound tasks assigned to you.</Text>
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
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(245, 158, 11, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerText: { flex: 1 },
  customer: { color: 'white', fontSize: 16, fontWeight: '700' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  statusText: { color: 'white', fontSize: 10, fontWeight: '800' },
  cardBody: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailText: { color: '#94a3b8', fontSize: 13 },
  desc: { color: '#64748b', fontSize: 12, marginTop: 4 },
  empty: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 }
});

export default OutboundListScreen;
