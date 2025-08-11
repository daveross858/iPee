export interface Bathroom {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  rating?: number;
  isOpen: boolean;
  isFree: boolean;
  isAccessible: boolean;
  hasChangingTable: boolean;
  hours?: string;
  phone?: string;
  website?: string;
  photos?: string[];
  reviews?: Review[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  date: string;
  userName: string;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  name: string;
  type: 'start' | 'end' | 'bathroom' | 'waypoint';
}

export interface Route {
  id: string;
  startPoint: RoutePoint;
  endPoint: RoutePoint;
  bathrooms: Bathroom[];
  totalDistance: number;
  estimatedTime: number;
  createdAt: string;
}

export interface SearchFilters {
  maxDistance: number;
  isFree: boolean;
  isAccessible: boolean;
  hasChangingTable: boolean;
  isOpen: boolean;
  minRating: number;
}
