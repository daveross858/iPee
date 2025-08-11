import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useLocation } from '../context/LocationContext';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { location } = useLocation();

  const menuItems = [
    {
      title: 'Find Nearby Bathrooms',
      subtitle: 'Discover bathrooms around you',
      icon: 'location',
      route: 'Map',
      color: '#4A90E2',
    },
    {
      title: 'Plan Route',
      subtitle: 'Find bathrooms along your journey',
      icon: 'map',
      route: 'Route',
      color: '#50C878',
    },
    {
      title: 'Bathroom List',
      subtitle: 'Browse all available bathrooms',
      icon: 'list',
      route: 'BathroomList',
      color: '#FF6B6B',
    },
  ];

  const handleNavigation = (route: keyof RootStackParamList) => {
    navigation.navigate(route);
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="water" size={40} color="white" />
            <Text style={styles.appTitle}>iPee</Text>
          </View>
          <Text style={styles.appSubtitle}>Bathroom Finder</Text>
          {location && (
            <View style={styles.locationInfo}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.locationText}>Location Active</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="location" size={24} color="#4A90E2" />
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Nearby</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.statNumber}>4.2</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#50C878" />
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleNavigation(item.route as keyof RootStackParamList)}
          >
            <LinearGradient
              colors={[item.color, `${item.color}80`]}
              style={styles.menuItemGradient}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemIcon}>
                  <Ionicons name={item.icon as any} size={28} color="white" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureGrid}>
            <View style={styles.featureItem}>
              <Ionicons name="accessibility" size={20} color="#4A90E2" />
              <Text style={styles.featureText}>Accessible</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="woman" size={20} color="#4A90E2" />
              <Text style={styles.featureText}>Changing Tables</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="card" size={20} color="#4A90E2" />
              <Text style={styles.featureText}>Free Options</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="time" size={20} color="#4A90E2" />
              <Text style={styles.featureText}>24/7 Available</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  appSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  locationText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  menuItem: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItemGradient: {
    padding: 20,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  featuresContainer: {
    marginTop: 20,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 2,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});
