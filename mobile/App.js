import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { LogOut } from 'lucide-react-native';
import axios from 'axios';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PlacementScreen from './src/screens/PlacementScreen';
import ExceptionScreen from './src/screens/ExceptionScreen';
import InboundListScreen from './src/screens/InboundListScreen';
import OutboundListScreen from './src/screens/OutboundListScreen';
import InboundDetailScreen from './src/screens/InboundDetailScreen';
import OutboundDetailScreen from './src/screens/OutboundDetailScreen';

const API_URL = 'http://192.168.29.57:5001';
axios.defaults.baseURL = API_URL;

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup axios interceptors on mount
  useEffect(() => {
    console.log('APP: Setting up axios interceptors');
    
    // Request interceptor
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        try {
          const token = await SecureStore.getItemAsync('token');
          console.log('MOBILE DEBUG: Request URL:', config.url);
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('MOBILE DEBUG: Auth Header: Bearer', token.substring(0, 20) + '...');
          } else {
            console.log('MOBILE DEBUG: Auth Header: MISSING');
          }
        } catch (error) {
          console.error('APP: Error reading token from SecureStore:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error('MOBILE DEBUG: Unauthorized - Token may be expired');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Restore session on app start
  useEffect(() => {
    const restoreSession = async () => {
      try {
        console.log('APP: Restoring session...');
        const savedUser = await SecureStore.getItemAsync('user');
        const savedToken = await SecureStore.getItemAsync('token');

        if (savedUser && savedToken) {
          const parsedUser = JSON.parse(savedUser);
          console.log('APP: Session restored for user:', parsedUser.email);
          setUser(parsedUser);
        } else {
          console.log('APP: No saved session found');
        }
      } catch (error) {
        console.error('APP: Error restoring session:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleLogin = async (loginData) => {
    try {
      console.log('APP: Handling login...');
      console.log('APP: Token received:', loginData.token ? 'Yes' : 'No');

      // Store token in SecureStore
      await SecureStore.setItemAsync('token', loginData.token);
      console.log('APP: Token stored in SecureStore');

      // Store user in SecureStore
      await SecureStore.setItemAsync('user', JSON.stringify(loginData.user));
      console.log('APP: User stored in SecureStore');

      // Update state
      setUser(loginData.user);
      console.log('APP: User state updated');
    } catch (error) {
      console.error('APP: Error during login:', error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('APP: Logging out...');
      setUser(null);
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('token');
      delete axios.defaults.headers.common['Authorization'];
      console.log('APP: Logout complete');
    } catch (error) {
      console.error('APP: Error during logout:', error);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {!user ? (
          <Stack.Screen
            name="Login"
            options={{ headerShown: false }}
          >
            {(props) => (
              <LoginScreen {...props} onLoginSuccess={handleLogin} />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="Dashboard"
              options={{ headerShown: false }}
            >
              {(props) => (
                <DashboardScreen
                  {...props}
                  user={user}
                  onLogout={handleLogout}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="InboundList"
              component={InboundListScreen}
              options={{ title: 'My Inbound Tasks' }}
            />
            <Stack.Screen
              name="OutboundList"
              component={OutboundListScreen}
              options={{ title: 'My Outbound Tasks' }}
            />
            <Stack.Screen
              name="InboundDetail"
              component={InboundDetailScreen}
              options={{ title: 'Inbound Details' }}
            />
            <Stack.Screen
              name="OutboundDetail"
              component={OutboundDetailScreen}
              options={{ title: 'Outbound Details' }}
            />
            <Stack.Screen
              name="Placement"
              component={PlacementScreen}
              options={{ title: 'Placement Workflow' }}
            />
            <Stack.Screen
              name="Exception"
              component={ExceptionScreen}
              options={{ title: 'Report Exception', headerBackTitle: 'Back' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
