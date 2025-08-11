import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';

import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import RouteScreen from './src/screens/RouteScreen';
import BathroomListScreen from './src/screens/BathroomListScreen';
import { LocationContext } from './src/context/LocationContext';

export type RootStackParamList = {
  Home: undefined;
  Map: undefined;
  Route: undefined;
  BathroomList: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
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
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setLoading(false);
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation);
        setLoading(false);
      } catch (error) {
        setErrorMsg('Error getting location');
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Getting your location...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
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
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'iPee - Bathroom Finder' }}
          />
          <Stack.Screen 
            name="Map" 
            component={MapScreen} 
            options={{ title: 'Find Bathrooms' }}
          />
          <Stack.Screen 
            name="Route" 
            component={RouteScreen} 
            options={{ title: 'Plan Route' }}
          />
          <Stack.Screen 
            name="BathroomList" 
            component={BathroomListScreen} 
            options={{ title: 'Nearby Bathrooms' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </LocationContext.Provider>
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
