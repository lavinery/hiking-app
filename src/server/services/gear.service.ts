/**
 * Gear recommendation service based on hiking conditions
 */

export interface GearItem {
  id: string
  name: string
  category: 'clothing' | 'footwear' | 'equipment' | 'safety' | 'navigation' | 'food_water'
  priority: 'essential' | 'recommended' | 'optional'
  description: string
  quantity?: string
  alternatives?: string[]
}

export interface GearRecommendationInput {
  days: number
  technicality: 'easy' | 'moderate' | 'hard' | 'expert'
  weather: 'dry' | 'wet' | 'cold' | 'variable'
  season: 'dry' | 'wet'
  groupSize: number
  hasExperience: boolean
}

/**
 * Base essential gear for any hiking trip
 */
const BASE_ESSENTIAL_GEAR: GearItem[] = [
  {
    id: 'hiking_boots',
    name: 'Hiking Boots',
    category: 'footwear',
    priority: 'essential',
    description: 'Sturdy, ankle-supporting boots with good grip',
    alternatives: ['Trail running shoes (for easy trails)']
  },
  {
    id: 'daypack',
    name: 'Daypack/Backpack',
    category: 'equipment',
    priority: 'essential',
    description: 'Comfortable pack with proper capacity',
  },
  {
    id: 'water_bottles',
    name: 'Water Bottles/Hydration System',
    category: 'food_water',
    priority: 'essential',
    description: 'At least 2L capacity per person',
    quantity: '2-3 bottles'
  },
  {
    id: 'first_aid',
    name: 'First Aid Kit',
    category: 'safety',
    priority: 'essential',
    description: 'Basic medical supplies for emergencies',
  },
  {
    id: 'headlamp',
    name: 'Headlamp',
    category: 'equipment',
    priority: 'essential',
    description: 'LED headlamp with extra batteries',
    alternatives: ['Flashlight (backup)']
  },
  {
    id: 'sun_protection',
    name: 'Sun Protection',
    category: 'safety',
    priority: 'essential',
    description: 'Sunscreen, hat, and sunglasses',
  }
]

/**
 * Additional gear based on trip duration
 */
function getDurationBasedGear(days: number): GearItem[] {
  const gear: GearItem[] = []
  
  if (days >= 2) {
    gear.push(
      {
        id: 'tent',
        name: 'Tent',
        category: 'equipment',
        priority: 'essential',
        description: 'Lightweight, weather-appropriate tent',
      },
      {
        id: 'sleeping_bag',
        name: 'Sleeping Bag',
        category: 'equipment',
        priority: 'essential',
        description: 'Temperature-rated sleeping bag',
      },
      {
        id: 'sleeping_pad',
        name: 'Sleeping Pad',
        category: 'equipment',
        priority: 'recommended',
        description: 'Insulating sleeping pad for comfort',
      },
      {
        id: 'cooking_gear',
        name: 'Cooking Equipment',
        category: 'food_water',
        priority: 'essential',
        description: 'Portable stove, fuel, and cookware',
      },
      {
        id: 'extra_clothing',
        name: 'Extra Clothing',
        category: 'clothing',
        priority: 'essential',
        description: 'Complete change of clothes',
        quantity: `${days - 1} days worth`
      }
    )
  }
  
  if (days >= 3) {
    gear.push(
      {
        id: 'water_filter',
        name: 'Water Filter/Purification',
        category: 'food_water',
        priority: 'essential',
        description: 'Water filter or purification tablets',
      },
      {
        id: 'camp_shoes',
        name: 'Camp Shoes',
        category: 'footwear',
        priority: 'recommended',
        description: 'Lightweight shoes for camp comfort',
      }
    )
  }
  
  return gear
}

/**
 * Gear based on technical difficulty
 */
function getTechnicalGear(technicality: string): GearItem[] {
  const gear: GearItem[] = []
  
  if (technicality === 'moderate' || technicality === 'hard' || technicality === 'expert') {
    gear.push(
      {
        id: 'trekking_poles',
        name: 'Trekking Poles',
        category: 'equipment',
        priority: 'recommended',
        description: 'Adjustable trekking poles for stability',
      },
      {
        id: 'gps_device',
        name: 'GPS Device/App',
        category: 'navigation',
        priority: 'recommended',
        description: 'GPS device or smartphone with offline maps',
      }
    )
  }
  
  if (technicality === 'hard' || technicality === 'expert') {
    gear.push(
      {
        id: 'helmet',
        name: 'Climbing Helmet',
        category: 'safety',
        priority: 'essential',
        description: 'Lightweight climbing helmet for rockfall protection',
      },
      {
        id: 'rope',
        name: 'Climbing Rope',
        category: 'safety',
        priority: 'essential',
        description: 'Dynamic climbing rope for technical sections',
      },
      {
        id: 'harness',
        name: 'Climbing Harness',
        category: 'safety',
        priority: 'essential',
        description: 'Comfortable climbing harness',
      }
    )
  }
  
  if (technicality === 'expert') {
    gear.push(
      {
        id: 'technical_gear',
        name: 'Technical Climbing Gear',
        category: 'safety',
        priority: 'essential',
        description: 'Carabiners, belay devices, anchors as needed',
      }
    )
  }
  
  return gear
}

/**
 * Weather-specific gear
 */
function getWeatherGear(weather: string, season: string): GearItem[] {
  const gear: GearItem[] = []
  
  // Rain gear for wet conditions or wet season
  if (weather === 'wet' || season === 'wet') {
    gear.push(
      {
        id: 'rain_jacket',
        name: 'Rain Jacket',
        category: 'clothing',
        priority: 'essential',
        description: 'Waterproof, breathable rain jacket',
      },
      {
        id: 'rain_pants',
        name: 'Rain Pants',
        category: 'clothing',
        priority: 'recommended',
        description: 'Waterproof rain pants',
      },
      {
        id: 'pack_cover',
        name: 'Pack Rain Cover',
        category: 'equipment',
        priority: 'essential',
        description: 'Waterproof cover for backpack',
      }
    )
  }
  
  // Cold weather gear
  if (weather === 'cold') {
    gear.push(
      {
        id: 'insulation_layer',
        name: 'Insulation Layer',
        category: 'clothing',
        priority: 'essential',
        description: 'Fleece or down jacket for warmth',
      },
      {
        id: 'warm_hat',
        name: 'Warm Hat',
        category: 'clothing',
        priority: 'essential',
        description: 'Insulating hat that covers ears',
      },
      {
        id: 'gloves',
        name: 'Gloves',
        category: 'clothing',
        priority: 'essential',
        description: 'Insulating gloves for cold conditions',
      }
    )
  }
  
  // Variable weather preparations
  if (weather === 'variable') {
    gear.push(
      {
        id: 'layering_system',
        name: 'Layering System',
        category: 'clothing',
        priority: 'essential',
        description: 'Base layer, insulating layer, and shell layer',
      }
    )
  }
  
  return gear
}

/**
 * Additional gear for beginners
 */
function getBeginnerGear(hasExperience: boolean): GearItem[] {
  if (hasExperience) return []
  
  return [
    {
      id: 'emergency_whistle',
      name: 'Emergency Whistle',
      category: 'safety',
      priority: 'recommended',
      description: 'Loud whistle for emergency signaling',
    },
    {
      id: 'emergency_blanket',
      name: 'Emergency Blanket',
      category: 'safety',
      priority: 'recommended',
      description: 'Lightweight emergency blanket',
    },
    {
      id: 'duct_tape',
      name: 'Duct Tape',
      category: 'equipment',
      priority: 'optional',
      description: 'Small roll for emergency repairs',
    }
  ]
}

/**
 * Main gear recommendation function
 */
export function recommendGear(input: GearRecommendationInput): {
  essential: GearItem[]
  recommended: GearItem[]
  optional: GearItem[]
  totalItems: number
} {
  const allGear: GearItem[] = [
    ...BASE_ESSENTIAL_GEAR,
    ...getDurationBasedGear(input.days),
    ...getTechnicalGear(input.technicality),
    ...getWeatherGear(input.weather, input.season),
    ...getBeginnerGear(input.hasExperience)
  ]
  
  // Remove duplicates by ID
  const uniqueGear = allGear.filter((item, index, self) => 
    index === self.findIndex(i => i.id === item.id)
  )
  
  const essential = uniqueGear.filter(item => item.priority === 'essential')
  const recommended = uniqueGear.filter(item => item.priority === 'recommended')
  const optional = uniqueGear.filter(item => item.priority === 'optional')
  
  return {
    essential,
    recommended,
    optional,
    totalItems: uniqueGear.length
  }
}

/**
 * Get gear category summary
 */
export function getGearSummary(gear: GearItem[]): Record<string, number> {
  return gear.reduce((summary, item) => {
    summary[item.category] = (summary[item.category] || 0) + 1
    return summary
  }, {} as Record<string, number>)
}