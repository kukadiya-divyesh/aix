import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Box, AlertTriangle, LogOut, Package, LayoutGrid, ArrowDownCircle, ArrowUpCircle, Calendar } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const DashboardScreen = ({ user, navigation, onLogout }) => {
  const [taskCounts, setTaskCounts] = useState({ inboundCount: 0, outboundCount: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const fetchTaskCounts = async (retries = 3) => {
    try {
      setError(null);
      
      // Verify token exists before making request
      const token = await SecureStore.getItemAsync('token');
      console.log('DASHBOARD: Token check before API call:', token ? 'Found' : 'NOT FOUND');
      
      if (!token) {
        console.error('DASHBOARD: No token found, cannot make API call');
        if (!isFirstLoad) {
          Alert.alert('Session Expired', 'Please login again', [
            { text: 'OK', onPress: onLogout }
          ]);
        }
        return;
      }

      console.log('DASHBOARD: Fetching task counts...');
      const resp = await axios.get('/api/dashboard/user-tasks');
      console.log('DASHBOARD: Task counts received:', resp.data);
      setTaskCounts(resp.data);
      setIsFirstLoad(false);
    } catch (err) {
      console.error('DASHBOARD: Error fetching task counts:', err.response?.status, err.message);
      
      if (err.response?.status === 401) {
        console.error('DASHBOARD: Got 401 - Session expired or token invalid');
        if (!isFirstLoad) {
          Alert.alert('Session Expired', 'Please login again', [
            { text: 'OK', onPress: onLogout }
          ]);
        } else {
          console.log('DASHBOARD: First load 401, retrying...');
          if (retries > 0) {
            setTimeout(() => fetchTaskCounts(retries - 1), 500);
          }
        }
      } else if (retries > 0) {
        console.log(`DASHBOARD: Retrying... (${retries} attempts left)`);
        setTimeout(() => fetchTaskCounts(retries - 1), 1000);
      } else {
        setError('Failed to load tasks. Please try again.');
        setIsFirstLoad(false);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('DASHBOARD: Screen focused');
      // Add small delay to ensure token is available
      setTimeout(() => {
        fetchTaskCounts();
      }, 100);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTaskCounts();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.name}>{user?.name || 'Personnel'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <LogOut color="#ef4444" size={18} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateBar}>
        <Calendar color="#64748b" size={14} />
        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>TASKS ASSIGNED TO ME</Text>
      <View style={styles.statsRow}>
        <TouchableOpacity 
          style={[styles.statCard, { borderLeftColor: '#3b82f6', borderLeftWidth: 4 }]}
          onPress={() => navigation.navigate('InboundList')}
        >
          <ArrowDownCircle color="#3b82f6" size={28} />
          <Text style={styles.statValue}>{taskCounts.inboundCount}</Text>
          <Text style={styles.statLabel}>Pending Inbound</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.statCard, { borderLeftColor: '#f59e0b', borderLeftWidth: 4 }]}
          onPress={() => navigation.navigate('OutboundList')}
        >
          <ArrowUpCircle color="#f59e0b" size={28} />
          <Text style={styles.statValue}>{taskCounts.outboundCount}</Text>
          <Text style={styles.statLabel}>Pending Outbound</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  welcome: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftColor: '#ef4444',
    borderLeftWidth: 4,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  menuDesc: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
});

export default DashboardScreen;
