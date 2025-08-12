import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
// Web map for route page
let RouteMapWeb: any;
if (typeof window !== 'undefined' && Platform.OS === 'web') {
  RouteMapWeb = require('./RouteMap.web').default;
}
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';
import { BathroomService } from '../services/bathroomService';
import { fetchPlaceSuggestions, fetchPlaceDetails } from '../services/googlePlaces';
import { Bathroom, Route, RoutePoint } from '../types/bathroom';
import { reverseGeocodeAsync } from '../services/reverseGeocode';
import { geocodeAddressAsync } from '../services/geocode';
import { LinearGradient } from 'expo-linear-gradient';
import { speak } from '../services/voice';
function RouteScreen() {
  // Helper to strip HTML from Google instructions
  function stripHtml(html: string) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  const { location } = useLocation();
  const [startLocation, setStartLocation] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [startLocationEdited, setStartLocationEdited] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [endLocation, setEndLocation] = useState('');
  const [routeBathrooms, setRouteBathrooms] = useState<Bathroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  // Google Places typeahead for start/end
  // Navigation state
  const [navigating, setNavigating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  // Step-by-step directions (web only)
  const [directionsSteps, setDirectionsSteps] = useState<Array<{ instruction: string; distance: string; duration: string }>>([]);
  const [currentDirectionStep, setCurrentDirectionStep] = useState(0);
  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<any[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  const [activeStartSuggestion, setActiveStartSuggestion] = useState(0);
  const [activeEndSuggestion, setActiveEndSuggestion] = useState(0);
  const endInputRef = useRef(null);
  const startInputRef = useRef(null);


  // Google Places typeahead for web
  const handlePlaceTypeahead = async (input: string, setSuggestions: any) => {
    if (Platform.OS === 'web' && input.length > 1) {
      const suggestions = await fetchPlaceSuggestions(input);
      setSuggestions(suggestions);
    } else {
      setSuggestions([]);
    }
  };


  // Google-style suggestions for start/end
  const getStartSuggestions = () => (Platform.OS === 'web' ? startSuggestions : []);
  const getEndSuggestions = () => (Platform.OS === 'web' ? endSuggestions : []);

  // Keyboard navigation for Google Places suggestions (web only)
  const handleKeyDown = (e: any, which: 'start' | 'end') => {
    if (Platform.OS !== 'web') return;
    const suggestions = which === 'start' ? getStartSuggestions() : getEndSuggestions();
    const show = which === 'start' ? showStartSuggestions : showEndSuggestions;
    const active = which === 'start' ? activeStartSuggestion : activeEndSuggestion;
    const setActive = which === 'start' ? setActiveStartSuggestion : setActiveEndSuggestion;
    const setShow = which === 'start' ? setShowStartSuggestions : setShowEndSuggestions;
    const setValue = which === 'start' ? setStartLocation : setEndLocation;
    if (!show || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      setActive((prev: number) => (prev + 1) % suggestions.length);
      e.preventDefault && e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setActive((prev: number) => (prev - 1 + suggestions.length) % suggestions.length);
      e.preventDefault && e.preventDefault();
    } else if (e.key === 'Enter') {
      if (suggestions[active]) {
        setValue(suggestions[active].description);
        setShow(false);
        e.preventDefault && e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      setShow(false);
      e.preventDefault && e.preventDefault();
    }
  };

  // Attach real keydown event for web (start and end fields)
  useEffect(() => {
    if (Platform.OS === 'web' && startInputRef.current) {
      // @ts-ignore
      const node = startInputRef.current._inputElement || startInputRef.current;
      if (!node) return;
      const listener = (e: KeyboardEvent) => handleKeyDown(e, 'start');
      node.addEventListener('keydown', listener);
      return () => node.removeEventListener('keydown', listener);
    }
  }, [showStartSuggestions, activeStartSuggestion, startLocation, startSuggestions]);
  useEffect(() => {
    if (Platform.OS === 'web' && endInputRef.current) {
      // @ts-ignore
      const node = endInputRef.current._inputElement || endInputRef.current;
      if (!node) return;
      const listener = (e: KeyboardEvent) => handleKeyDown(e, 'end');
      node.addEventListener('keydown', listener);
      return () => node.removeEventListener('keydown', listener);
    }
  }, [showEndSuggestions, activeEndSuggestion, endLocation, endSuggestions]);

  // Highlight match helper
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <Text style={styles.suggestionHighlight}>{text.slice(idx, idx + query.length)}</Text>
        {text.slice(idx + query.length)}
      </>
    );
  };

  useEffect(() => {
    const fetchAddress = async () => {
      console.log('Location object:', location);
      if (location) {
        setAddressLoading(true);
  const addr = await reverseGeocodeAsync(location.coords.latitude, location.coords.longitude);
  console.log('Reverse geocode result:', addr);
  let fallback = 'Current Location';
  const displayAddr = addr && addr.trim() !== '' ? addr : fallback;
  setCurrentAddress(displayAddr);
  setAddressLoading(false);
  // Only set startLocation if user hasn't edited it
  setStartLocation(prev => (startLocationEdited ? prev : displayAddr));
      } else {
        setCurrentAddress('');
        setStartLocation('');
        setAddressLoading(false);
      }
    };
    fetchAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const planRoute = async () => {
    setNavigating(false);
    setCurrentStep(0);
    if (!endLocation) {
      Alert.alert('Error', 'Please enter an end location');
      return;
    }

    // If startLocation is empty or 'Current Location', use GPS
    let startLat = null;
    let startLng = null;
    let startName = startLocation;
    if (!startLocation || startLocation === 'Current Location') {
      if (!location) {
        Alert.alert('Error', 'Location not available');
        return;
      }
      startLat = location.coords.latitude;
      startLng = location.coords.longitude;
      startName = 'Current Location';
    } else {
      // Geocode the start location
      const startCoords = await geocodeAddressAsync(startLocation);
      if (!startCoords) {
        Alert.alert('Error', 'Could not find the start location');
        return;
      }
      startLat = startCoords.latitude;
      startLng = startCoords.longitude;
    }

    setLoading(true);
    try {
      // Geocode the end location to get coordinates
      const endCoords = await geocodeAddressAsync(endLocation);
      if (!endCoords) {
        Alert.alert('Error', 'Could not find the end location');
        setLoading(false);
        return;
      }

      // Calculate distance using Haversine formula
      function toRad(x: number) { return x * Math.PI / 180; }
      function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371000; // meters
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      }
      const totalDistance = Math.round(haversine(startLat, startLng, endCoords.latitude, endCoords.longitude));
      // Estimate time: assume 40 miles/hour average (urban driving)
      const miles = totalDistance * 0.000621371;
  const estimatedTime = Math.round((miles / 55) * 60); // in minutes

      const bathrooms = await BathroomService.searchAlongRoute(
        startLat,
        startLng,
        endCoords.latitude,
        endCoords.longitude,
        {
          maxDistance: 10000, // 10km
          isFree: false,
          isAccessible: false,
          hasChangingTable: false,
          isOpen: true,
          minRating: 0,
        }
      );

      setRouteBathrooms(bathrooms);

      // Create a route with real coordinates
      const route: Route = {
        id: Date.now().toString(),
        startPoint: {
          latitude: startLat,
          longitude: startLng,
          name: startName,
          type: 'start',
        },
        endPoint: {
          latitude: endCoords.latitude,
          longitude: endCoords.longitude,
          name: endLocation,
          type: 'end',
        },
        bathrooms: bathrooms,
        totalDistance,
        estimatedTime,
        createdAt: new Date().toISOString(),
      };

      setCurrentRoute(route);
    } catch (error) {
      console.error('Error in planRoute:', error);
      Alert.alert('Error', 'Failed to plan route');
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (location) {
      setStartLocation('Current Location');
    }
  };

  // Navigation steps: start, each bathroom, end
  const getNavigationSteps = () => {
    if (!currentRoute) return [];
    const steps = [
      { type: 'start', name: currentRoute.startPoint.name, latitude: currentRoute.startPoint.latitude, longitude: currentRoute.startPoint.longitude },
      ...currentRoute.bathrooms.map((b) => ({ type: 'bathroom', name: b.name, latitude: b.latitude, longitude: b.longitude })),
      { type: 'end', name: currentRoute.endPoint.name, latitude: currentRoute.endPoint.latitude, longitude: currentRoute.endPoint.longitude },
    ];
    return steps;
  };

  // Google Maps-like step one: "Head toward [next stop]"
  // Adds ETA and distance to each instruction
  const getNavigationInstruction = () => {
    const steps = getNavigationSteps();
    if (!navigating || !steps.length) return '';
    const step = steps[currentStep];
    if (!step) return '';

    // Helper to format ETA and distance
    const getEtaAndDistance = (fromIdx: number, toIdx: number) => {
      if (!currentRoute) return '';
      const allPoints = [currentRoute.startPoint, ...currentRoute.bathrooms, currentRoute.endPoint];
      if (fromIdx < 0 || toIdx >= allPoints.length) return '';
      // Haversine distance
      const toRad = (x: number) => x * Math.PI / 180;
      const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      let dist = 0;
      for (let i = fromIdx; i < toIdx; i++) {
        dist += haversine(
          allPoints[i].latitude, allPoints[i].longitude,
          allPoints[i+1].latitude, allPoints[i+1].longitude
        );
      }
      const miles = dist * 0.000621371;
      const timeMin = Math.round((miles / 55) * 60);
      const eta = timeMin > 60 ? `${Math.floor(timeMin/60)}h ${timeMin%60}m` : `${timeMin} min`;
      return `(${miles.toFixed(2)} mi, ETA: ${eta})`;
    };

    if (currentStep === 0) {
      // Step one: Head toward first bathroom or destination
      const next = steps[1];
      if (next) {
        const etaDist = getEtaAndDistance(0, 1);
        if (next.type === 'bathroom') return `Head toward bathroom: ${next.name} ${etaDist}`;
        if (next.type === 'end') return `Head toward your destination: ${next.name} ${etaDist}`;
      }
      return `Start at ${step.name}`;
    }
    if (step.type === 'bathroom') {
      const etaDist = getEtaAndDistance(currentStep-1, currentStep);
      return `Stop at bathroom: ${step.name} ${etaDist}`;
    }
    if (step.type === 'end') {
      const etaDist = getEtaAndDistance(currentStep-1, currentStep);
      return `Arrive at destination: ${step.name} ${etaDist}`;
    }
    return '';
  };

  const handleStartNavigation = () => {
    setNavigating(true);
    setCurrentStep(0);
    setCurrentDirectionStep(0);
    setTimeout(() => {
      if (directionsSteps.length > 0) {
        const step = directionsSteps[0];
        if (step && step.instruction) speak(stripHtml(step.instruction) + `, ${step.distance}, ${step.duration}`);
      } else {
        const instruction = getNavigationInstruction();
        if (instruction) speak(instruction);
      }
    }, 300);
  };

  const handleNextStep = () => {
    if (directionsSteps.length > 0) {
      if (currentDirectionStep < directionsSteps.length - 1) {
        setCurrentDirectionStep((prev) => {
          const next = prev + 1;
          setTimeout(() => {
            const step = directionsSteps[next];
            if (step && step.instruction) speak(stripHtml(step.instruction) + `, ${step.distance}, ${step.duration}`);
          }, 300);
          return next;
        });
      } else {
        setNavigating(false);
        setCurrentStep(0);
        setCurrentDirectionStep(0);
        speak('You have arrived at your destination!');
        Alert.alert('Route Complete', 'You have arrived at your destination!');
      }
      return;
    }
    // Fallback: old logic
    const steps = getNavigationSteps();
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => {
        const next = prev + 1;
        setTimeout(() => {
          const instruction = getNavigationInstructionForStep(next);
          if (instruction) speak(instruction);
        }, 300);
        return next;
      });
    } else {
      setNavigating(false);
      setCurrentStep(0);
      speak('You have arrived at your destination!');
      Alert.alert('Route Complete', 'You have arrived at your destination!');
    }
  };

  // Helper to get instruction for a specific step
  const getNavigationInstructionForStep = (stepIdx: number) => {
    const steps = getNavigationSteps();
    const step = steps[stepIdx];
    if (!step) return '';
    const getEtaAndDistance = (fromIdx: number, toIdx: number) => {
      if (!currentRoute) return '';
      const allPoints = [currentRoute.startPoint, ...currentRoute.bathrooms, currentRoute.endPoint];
      if (fromIdx < 0 || toIdx >= allPoints.length) return '';
      const toRad = (x: number) => x * Math.PI / 180;
      const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      let dist = 0;
      for (let i = fromIdx; i < toIdx; i++) {
        dist += haversine(
          allPoints[i].latitude, allPoints[i].longitude,
          allPoints[i+1].latitude, allPoints[i+1].longitude
        );
      }
      const miles = dist * 0.000621371;
      const timeMin = Math.round((miles / 55) * 60);
      const eta = timeMin > 60 ? `${Math.floor(timeMin/60)}h ${timeMin%60}m` : `${timeMin} min`;
      return `(${miles.toFixed(2)} mi, ETA: ${eta})`;
    };
    if (stepIdx === 0) {
      const next = steps[1];
      if (next) {
        const etaDist = getEtaAndDistance(0, 1);
        if (next.type === 'bathroom') return `Head toward bathroom: ${next.name} ${etaDist}`;
        if (next.type === 'end') return `Head toward your destination: ${next.name} ${etaDist}`;
      }
      return `Start at ${step.name}`;
    }
    if (step.type === 'bathroom') {
      const etaDist = getEtaAndDistance(stepIdx-1, stepIdx);
      return `Stop at bathroom: ${step.name} ${etaDist}`;
    }
    if (step.type === 'end') {
      const etaDist = getEtaAndDistance(stepIdx-1, stepIdx);
      return `Arrive at destination: ${step.name} ${etaDist}`;
    }
    return '';
  };

  const handleStopNavigation = () => {
    setNavigating(false);
    setCurrentStep(0);
  };

  const getRouteSummary = () => {
    if (!currentRoute) return null;

    return (
      <View style={styles.routeSummary}>
        <Text style={styles.routeSummaryTitle}>Route Summary</Text>
        <View style={styles.routeInfo}>
          <View style={styles.routeInfoItem}>
            <Ionicons name="location" size={16} color="#4A90E2" />
            <Text style={styles.routeInfoText}>
              Start: {currentRoute.startPoint.name}
            </Text>
          </View>
          <View style={styles.routeInfoItem}>
            <Ionicons name="flag" size={16} color="#FF6B6B" />
            <Text style={styles.routeInfoText}>
              End: {currentRoute.endPoint.name}
            </Text>
          </View>
          <View style={styles.routeInfoItem}>
            <Ionicons name="map" size={16} color="#50C878" />
            <Text style={styles.routeInfoText}>
              Distance: {(currentRoute.totalDistance * 0.000621371).toFixed(2)} mi
            </Text>
          </View>
          <View style={styles.routeInfoItem}>
            <Ionicons name="time" size={16} color="#FFD700" />
            <Text style={styles.routeInfoText}>
              Time: {(() => {
                const h = Math.floor(currentRoute.estimatedTime / 60);
                const m = currentRoute.estimatedTime % 60;
                return h > 0 ? `${h}h ${m}m` : `${m} min`;
              })()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const getBathroomCard = (bathroom: Bathroom, index: number) => (
    <View key={bathroom.id} style={styles.bathroomCard}>
      <View style={styles.bathroomHeader}>
        <View style={styles.bathroomNumber}>
          <Text style={styles.bathroomNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.bathroomInfo}>
          <Text style={styles.bathroomName}>{bathroom.name}</Text>
          <Text style={styles.bathroomAddress}>{bathroom.address}</Text>
        </View>
        <View style={styles.bathroomRating}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>
            {bathroom.rating?.toFixed(1) || 'N/A'}
          </Text>
        </View>
      </View>
      
      <View style={styles.bathroomDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="location" size={14} color="#4A90E2" />
            <Text style={styles.detailText}>
              {(bathroom.distance || 0) / 1000}km away
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time" size={14} color="#50C878" />
            <Text style={styles.detailText}>
              {bathroom.hours || 'Hours N/A'}
            </Text>
          </View>
        </View>
        
        <View style={styles.bathroomFeatures}>
          {bathroom.isFree && (
            <View style={styles.featureTag}>
              <Text style={styles.featureTagText}>Free</Text>
            </View>
          )}
          {bathroom.isAccessible && (
            <View style={styles.featureTag}>
              <Text style={styles.featureTagText}>Accessible</Text>
            </View>
          )}
          {bathroom.hasChangingTable && (
            <View style={styles.featureTag}>
              <Text style={styles.featureTagText}>Changing Table</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plan Your Route</Text>
        <Text style={styles.headerSubtitle}>
          Find bathrooms along your journey
        </Text>
      </View>


      <View style={styles.inputContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Start Location</Text>
          <View style={[styles.inputRow, { position: 'relative', marginBottom: (Platform.OS === 'web' && showStartSuggestions && getStartSuggestions().length > 0) ? 260 : 0 }]}> 
            <TextInput
              ref={startInputRef}
              style={styles.textInput}
              value={addressLoading ? 'Fetching address…' : (startLocation || 'Current Location')}
              editable={!addressLoading}
              onChangeText={async text => {
                setStartLocation(text);
                setStartLocationEdited(true);
                if (Platform.OS === 'web') {
                  setShowStartSuggestions(!!text);
                  setActiveStartSuggestion(0);
                  await handlePlaceTypeahead(text, setStartSuggestions);
                }
              }}
              placeholder="Enter start location"
              placeholderTextColor="#999"
              onFocus={() => Platform.OS === 'web' && setShowStartSuggestions(!!startLocation)}
              onBlur={() => Platform.OS === 'web' && setTimeout(() => setShowStartSuggestions(false), 250)}
            />
            {Platform.OS === 'web' && showStartSuggestions && getStartSuggestions().length > 0 && (
              <View style={styles.suggestionsDropdown}>
                {getStartSuggestions().map((suggestion, idx) => (
                  <TouchableOpacity
                    key={suggestion.place_id}
                    style={[styles.suggestionItem, idx === activeStartSuggestion && styles.suggestionItemActive]}
                    onPress={async () => {
                      setShowStartSuggestions(false);
                      setActiveStartSuggestion(idx);
                      setStartLocation(suggestion.description);
                      setStartLocationEdited(true);
                      const details = await fetchPlaceDetails(suggestion.place_id);
                      if (details && details.geometry && details.geometry.location) {
                        // setStartCoords(details.geometry.location)
                      }
                    }}
                  >
                    <Text style={styles.suggestionText}>{suggestion.structured_formatting?.main_text || suggestion.description}</Text>
                    <Text style={styles.suggestionSubText}>{suggestion.structured_formatting?.secondary_text || ''}</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.suggestionPowered}><Ionicons name="logo-google" size={14} color="#888" /><Text style={styles.suggestionPoweredText}>Google Places</Text></View>
              </View>
            )}
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={async () => {
                if (location) {
                  const addr = await reverseGeocodeAsync(location.coords.latitude, location.coords.longitude);
                  setCurrentAddress(addr);
                  setStartLocation('Current Location');
                  // If end location is filled, immediately plan route
                  if (endLocation) {
                    await planRoute();
                  }
                }
              }}
            >
              <Ionicons name="location" size={20} color="#4A90E2" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>End Location</Text>
          <View style={[styles.inputRow, { position: 'relative', marginBottom: (Platform.OS === 'web' && showEndSuggestions && getEndSuggestions().length > 0) ? 260 : 0 }]}>
            <TextInput
              ref={endInputRef}
              style={styles.textInput}
              value={endLocation}
              onChangeText={async text => {
                setEndLocation(text);
                if (Platform.OS === 'web') {
                  setShowEndSuggestions(!!text);
                  setActiveEndSuggestion(0);
                  await handlePlaceTypeahead(text, setEndSuggestions);
                }
              }}
              placeholder="Enter destination"
              placeholderTextColor="#999"
              onFocus={() => Platform.OS === 'web' && setShowEndSuggestions(!!endLocation)}
              onBlur={() => Platform.OS === 'web' && setTimeout(() => setShowEndSuggestions(false), 250)}
            />
            {Platform.OS === 'web' && showEndSuggestions && getEndSuggestions().length > 0 && (
              <View style={styles.suggestionsDropdown}>
                {getEndSuggestions().map((suggestion, idx) => (
                  <TouchableOpacity
                    key={suggestion.place_id}
                    style={[styles.suggestionItem, idx === activeEndSuggestion && styles.suggestionItemActive]}
                    onPress={async () => {
                      setShowEndSuggestions(false);
                      setActiveEndSuggestion(idx);
                      setEndLocation(suggestion.description);
                      const details = await fetchPlaceDetails(suggestion.place_id);
                      if (details && details.geometry && details.geometry.location) {
                        // setEndCoords(details.geometry.location)
                      }
                    }}
                  >
                    <Text style={styles.suggestionText}>{suggestion.structured_formatting?.main_text || suggestion.description}</Text>
                    <Text style={styles.suggestionSubText}>{suggestion.structured_formatting?.secondary_text || ''}</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.suggestionPowered}><Ionicons name="logo-google" size={14} color="#888" /><Text style={styles.suggestionPoweredText}>Google Places</Text></View>
              </View>
            )}
          </View>
        </View>


        {/* Show Find Route button until a route is picked, then show Start/Stop Route buttons */}
        {!currentRoute && !loading && (
          <TouchableOpacity
            style={styles.planButton}
            onPress={() => { planRoute(); }}
            disabled={loading}
          >
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.planButtonGradient}
            >
              <Ionicons name="search" size={20} color="white" />
              <Text style={styles.planButtonText}>Find Route</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {currentRoute && !navigating && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 16 }}>
            <TouchableOpacity
              style={[styles.planButton, { backgroundColor: '#4A90E2', flex: 1 }]}
              onPress={handleStartNavigation}
            >
              <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                style={styles.planButtonGradient}
              >
                <Ionicons name="play" size={20} color="white" />
                <Text style={styles.planButtonText}>Start Route</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.planButton, { backgroundColor: '#FF6B6B', flex: 1 }]}
              onPress={() => setCurrentRoute(null)}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8C8C']}
                style={styles.planButtonGradient}
              >
                <Ionicons name="stop" size={20} color="white" />
                <Text style={styles.planButtonText}>Stop Route</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        {currentRoute && navigating && (
          <View style={{ flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
            {directionsSteps.length > 0 ? (
              <>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                  Step {currentDirectionStep + 1} of {directionsSteps.length}
                </Text>
                <Text style={{ fontSize: 16, marginBottom: 12 }}>
                  {stripHtml(directionsSteps[currentDirectionStep]?.instruction)}
                  {directionsSteps[currentDirectionStep]?.distance ? ` (${directionsSteps[currentDirectionStep]?.distance}, ${directionsSteps[currentDirectionStep]?.duration})` : ''}
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>{getNavigationInstruction()}</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity
                style={[styles.planButton, { backgroundColor: '#4A90E2', flex: 1 }]}
                onPress={handleNextStep}
              >
                <LinearGradient
                  colors={['#4A90E2', '#357ABD']}
                  style={styles.planButtonGradient}
                >
                  <Ionicons name="arrow-forward" size={20} color="white" />
                  <Text style={styles.planButtonText}>Next</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.planButton, { backgroundColor: '#FF6B6B', flex: 1 }]}
                onPress={handleStopNavigation}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8C8C']}
                  style={styles.planButtonGradient}
                >
                  <Ionicons name="stop" size={20} color="white" />
                  <Text style={styles.planButtonText}>Stop</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {currentRoute && getRouteSummary()}


      {routeBathrooms.length > 0 && (
        <View style={styles.bathroomsSection}>
          <Text style={styles.sectionTitle}>
            Bathrooms Along Route ({routeBathrooms.length})
          </Text>
          {routeBathrooms.map((bathroom, index) => 
            getBathroomCard(bathroom, index)
          )}
        </View>
      )}

      {/* Show map for route on web */}
      {typeof window !== 'undefined' && Platform.OS === 'web' && currentRoute && (
        <RouteMapWeb
          start={currentRoute.startPoint}
          end={currentRoute.endPoint}
          bathrooms={routeBathrooms}
          navigationStep={navigating ? currentStep : null}
          onDirectionsReady={setDirectionsSteps}
        />
      )}

      {!loading && !currentRoute && (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={64} color="#CCC" />
          <Text style={styles.emptyStateText}>
            Enter your start and end locations to plan a route with bathroom stops
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  elevation: 20,
  zIndex: 2000,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  marginBottom: 24, // Add space below dropdown
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    backgroundColor: '#FFF',
    flexDirection: 'column',
  },
  suggestionItemActive: {
    backgroundColor: '#F0F6FF',
  },
  suggestionText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  suggestionSubText: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  suggestionHighlight: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  suggestionPowered: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    justifyContent: 'flex-end',
    backgroundColor: '#F9F9F9',
  },
  suggestionPoweredText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  inputContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  currentLocationButton: {
    marginLeft: 12,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  planButton: {
  borderRadius: 12,
  overflow: 'hidden',
  marginTop: 24, // Add space above button
  zIndex: 0, // Lowered so dropdown is always above
  },
  planButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  planButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  routeSummary: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  routeInfo: {
    gap: 12,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  bathroomsSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  bathroomCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bathroomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bathroomNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bathroomNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bathroomInfo: {
    flex: 1,
  },
  bathroomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bathroomAddress: {
    fontSize: 14,
    color: '#666',
  },
  bathroomRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  bathroomDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  bathroomFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featureTagText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
});

export default RouteScreen;
