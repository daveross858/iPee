console.log('App loaded - latest build');
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';


import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './MapScreen';
import RouteScreen from './src/screens/RouteScreen';
import BathroomListScreen from './src/screens/BathroomListScreen';
import { LocationProvider } from './src/context/LocationContext';

import Constants from 'expo-constants';
import { loadGoogleMapsScript } from './src/services/loadGoogleMapsScript';

export type RootStackParamList = {
  Home: undefined;
  Map: undefined;
  Route: undefined;
  BathroomList: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  // Load Google Maps JS API for web (with Places library)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      if (apiKey) {
        loadGoogleMapsScript(apiKey);
      }
    }
  }, []);
  // Inject global style for web scroll fix
  React.useEffect(() => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.innerHTML = `
        html, body, #root {
          height: 100% !important;
          min-height: 100% !important;
          width: 100% !important;
          overflow-y: auto !important;
          background: #F5F5F5 !important;
        }
        body {
          position: relative !important;
        }
      `;
      style.setAttribute('data-global-scroll-fix', 'true');
      document.head.appendChild(style);
      return () => {
        if (style.parentNode) style.parentNode.removeChild(style);
      };
    }
  }, []);

  return (
    <LocationProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4A90E2',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'iPee - Bathroom Finder' }} />
          <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Find Bathrooms' }} />
          <Stack.Screen name="Route" component={RouteScreen} options={{ title: 'Plan Route' }} />
          <Stack.Screen name="BathroomList" component={BathroomListScreen} options={{ title: 'Nearby Bathrooms' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </LocationProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});
