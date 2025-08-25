/**
 * Distance utility functions for geographical calculations
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Calculate distance between two points using Haversine formula
 * @param coord1 First coordinate point
 * @param coord2 Second coordinate point
 * @returns Distance in kilometers
 */
export function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371 // Earth's radius in kilometers
  
  const lat1Rad = toRadians(coord1.latitude)
  const lat2Rad = toRadians(coord2.latitude)
  const deltaLatRad = toRadians(coord2.latitude - coord1.latitude)
  const deltaLonRad = toRadians(coord2.longitude - coord1.longitude)
  
  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Get coordinates for common Indonesian locations
 */
export const LOCATION_COORDINATES: Record<string, Coordinates> = {
  jakarta: { latitude: -6.2088, longitude: 106.8456 },
  bandung: { latitude: -6.9175, longitude: 107.6191 },
  yogyakarta: { latitude: -7.7956, longitude: 110.3695 },
  surabaya: { latitude: -7.2575, longitude: 112.7521 },
  bali: { latitude: -8.4095, longitude: 115.1889 },
  lombok: { latitude: -8.5069, longitude: 116.1944 }, // Rinjani area
  malang: { latitude: -7.9666, longitude: 112.6326 }, // Semeru area
  magelang: { latitude: -7.4698, longitude: 110.2182 }, // Merapi area
}

/**
 * Calculate transportation distance from user location to mountain
 */
export function calculateTransportDistance(
  userLocation: string,
  mountainLocation: string
): number {
  const userCoords = LOCATION_COORDINATES[userLocation.toLowerCase()]
  const mountainCoords = LOCATION_COORDINATES[mountainLocation.toLowerCase()]
  
  if (!userCoords || !mountainCoords) {
    // Default distance if coordinates not found
    return 300 // km
  }
  
  return haversineDistance(userCoords, mountainCoords)
}