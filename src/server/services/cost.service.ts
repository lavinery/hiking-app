import { calculateTransportDistance } from './distance.util'
import type { Decimal } from '@prisma/client/runtime/library'

/**
 * Cost calculation service for hiking trips
 */

export interface CostBreakdown {
  transportation: number
  permits: number
  guide: number
  accommodation: number
  meals: number
  equipment: number
  miscellaneous: number
  total: number
}

export interface CostCalculationInput {
  userLocation: string
  mountainLocation: string
  routeDifficulty: string
  duration: number // days
  groupSize: number
  needsGuide: boolean
  needsEquipment: boolean
  budgetLevel: 'budget' | 'standard' | 'premium'
}

/**
 * Calculate transportation cost
 */
function calculateTransportationCost(
  userLocation: string,
  mountainLocation: string,
  groupSize: number
): number {
  const distance = calculateTransportDistance(userLocation, mountainLocation)
  
  // Motor: (km/30) * 10000 per person for fuel
  const motorCostPerPerson = (distance / 30) * 10000
  
  // Public transport: base + per km
  const publicTransportBase = 50000 // base fare
  const publicTransportPerKm = 500
  const publicTransportCost = publicTransportBase + (publicTransportPerKm * distance)
  
  // Choose cheaper option for budget calculation
  const costPerPerson = Math.min(motorCostPerPerson, publicTransportCost)
  
  // For groups > 4, consider car rental
  if (groupSize > 4) {
    const carRentalCost = distance * 2000 + 300000 // per day rental
    return Math.min(costPerPerson * groupSize, carRentalCost)
  }
  
  return costPerPerson * groupSize
}

/**
 * Calculate permit costs based on mountain and route
 */
function calculatePermitCost(
  mountainLocation: string,
  routeDifficulty: string,
  groupSize: number
): number {
  const permitRates: Record<string, number> = {
    lombok: 150000, // Rinjani
    malang: 200000, // Semeru
    magelang: 100000, // Merapi
    default: 120000
  }
  
  const basePermit = permitRates[mountainLocation] || permitRates.default
  
  // Add difficulty multiplier
  const difficultyMultiplier = {
    'Easy': 1.0,
    'Moderate': 1.2,
    'Hard': 1.5,
    'Expert': 2.0
  }[routeDifficulty] || 1.0
  
  return basePermit * groupSize * difficultyMultiplier
}

/**
 * Calculate guide costs
 */
function calculateGuideCost(
  routeDifficulty: string,
  duration: number,
  groupSize: number,
  needsGuide: boolean
): number {
  if (!needsGuide) return 0
  
  const baseDailyRate = {
    'Easy': 200000,
    'Moderate': 300000,
    'Hard': 400000,
    'Expert': 500000
  }[routeDifficulty] || 300000
  
  // One guide per 4 people
  const guidesNeeded = Math.ceil(groupSize / 4)
  
  return baseDailyRate * duration * guidesNeeded
}

/**
 * Calculate accommodation costs
 */
function calculateAccommodationCost(
  duration: number,
  groupSize: number,
  budgetLevel: 'budget' | 'standard' | 'premium'
): number {
  const ratesPerPersonPerNight = {
    budget: 75000,
    standard: 150000,
    premium: 300000
  }
  
  const nightsNeeded = Math.max(0, duration - 1) // camping nights
  return ratesPerPersonPerNight[budgetLevel] * groupSize * nightsNeeded
}

/**
 * Calculate meal costs
 */
function calculateMealCost(
  duration: number,
  groupSize: number,
  budgetLevel: 'budget' | 'standard' | 'premium'
): number {
  const mealRatesPerPersonPerDay = {
    budget: 50000,
    standard: 75000,
    premium: 125000
  }
  
  return mealRatesPerPersonPerDay[budgetLevel] * groupSize * duration
}

/**
 * Calculate equipment rental costs
 */
function calculateEquipmentCost(
  needsEquipment: boolean,
  duration: number,
  groupSize: number,
  routeDifficulty: string
): number {
  if (!needsEquipment) return 0
  
  const baseEquipmentCostPerPerson = {
    'Easy': 100000,
    'Moderate': 150000,
    'Hard': 200000,
    'Expert': 300000
  }[routeDifficulty] || 150000
  
  return baseEquipmentCostPerPerson * groupSize * duration
}

/**
 * Main cost calculation function
 */
export function calculateTripCost(input: CostCalculationInput): CostBreakdown {
  const transportation = calculateTransportationCost(
    input.userLocation,
    input.mountainLocation,
    input.groupSize
  )
  
  const permits = calculatePermitCost(
    input.mountainLocation,
    input.routeDifficulty,
    input.groupSize
  )
  
  const guide = calculateGuideCost(
    input.routeDifficulty,
    input.duration,
    input.groupSize,
    input.needsGuide
  )
  
  const accommodation = calculateAccommodationCost(
    input.duration,
    input.groupSize,
    input.budgetLevel
  )
  
  const meals = calculateMealCost(
    input.duration,
    input.groupSize,
    input.budgetLevel
  )
  
  const equipment = calculateEquipmentCost(
    input.needsEquipment,
    input.duration,
    input.groupSize,
    input.routeDifficulty
  )
  
  const miscellaneous = (transportation + permits + guide + accommodation + meals + equipment) * 0.1 // 10% buffer
  
  const total = transportation + permits + guide + accommodation + meals + equipment + miscellaneous
  
  return {
    transportation: Math.round(transportation),
    permits: Math.round(permits),
    guide: Math.round(guide),
    accommodation: Math.round(accommodation),
    meals: Math.round(meals),
    equipment: Math.round(equipment),
    miscellaneous: Math.round(miscellaneous),
    total: Math.round(total)
  }
}

/**
 * Convert user budget range to cost estimate
 */
export function parseBudgetRange(budgetRange: string): { min: number; max: number } {
  const budgetMap: Record<string, { min: number; max: number }> = {
    'under_500k': { min: 0, max: 500000 },
    '500k_1m': { min: 500000, max: 1000000 },
    '1m_2m': { min: 1000000, max: 2000000 },
    '2m_5m': { min: 2000000, max: 5000000 },
    'above_5m': { min: 5000000, max: 10000000 }
  }
  
  return budgetMap[budgetRange] || { min: 0, max: 2000000 }
}