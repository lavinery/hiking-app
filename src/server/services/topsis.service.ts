import { db } from '@/server/db'
import { calculateTripCost, parseBudgetRange, type CostCalculationInput } from './cost.service'
import { calculateTransportDistance } from './distance.util'
import type { Decimal } from '@prisma/client/runtime/library'

/**
 * TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution) Service
 * Multi-criteria decision analysis for hiking route recommendations
 */

export interface UserPreferences {
  experience_level: string
  fitness_level: number
  budget_range: string
  time_commitment: string
  location: string
  group_size: number
  interests: string[]
  concerns?: string[]
}

export interface CriterionValue {
  criterionId: string
  criterionName: string
  factorName: string
  value: number
  weight: number
  isBenefit: boolean
  normalizedValue: number
  weightedValue: number
}

export interface RouteEvaluation {
  routeId: string
  routeName: string
  mountainName: string
  difficulty: string
  distance: number
  duration: number
  criteria: CriterionValue[]
  distanceToPositive: number
  distanceToNegative: number
  topsisScore: number
  rank: number
  explanations: string[]
}

export interface TopsisResult {
  routes: RouteEvaluation[]
  methodology: {
    algorithm: string
    factors: Array<{
      name: string
      weight: number
      description: string
    }>
    userPreferenceWeights: Record<string, number>
    explanation: string
  }
  summary: {
    totalRoutes: number
    averageScore: number
    topRecommendation: string
    analysisDate: string
  }
}

/**
 * Build decision matrix with all routes and criteria
 */
async function buildDecisionMatrix() {
  // Get all routes with their criterion values
  const routes = await db.route.findMany({
    include: {
      mountain: true,
      criterionValues: {
        include: {
          criterion: {
            include: {
              factor: true
            }
          }
        }
      }
    }
  })

  // Get factor weights
  const factorWeights = await db.factorWeight.findMany({
    include: {
      factor: true
    }
  })

  return { routes, factorWeights }
}

/**
 * Calculate user preference weights based on their answers
 */
function calculateUserWeights(preferences: UserPreferences): Record<string, number> {
  const weights: Record<string, number> = {
    'Physical Demand': 0.33,
    'Logistics & Cost': 0.33,
    'Experience Quality': 0.34
  }

  // Adjust weights based on user preferences
  if (preferences.experience_level === 'beginner') {
    weights['Physical Demand'] = 0.2  // Less emphasis on difficulty
    weights['Logistics & Cost'] = 0.5  // More emphasis on cost/accessibility
    weights['Experience Quality'] = 0.3
  } else if (preferences.experience_level === 'expert') {
    weights['Physical Demand'] = 0.5  // More emphasis on challenge
    weights['Logistics & Cost'] = 0.2
    weights['Experience Quality'] = 0.3
  }

  // Adjust for budget concerns
  if (preferences.budget_range === 'under_500k' || preferences.budget_range === '500k_1m') {
    weights['Logistics & Cost'] += 0.1
    weights['Physical Demand'] -= 0.05
    weights['Experience Quality'] -= 0.05
  }

  // Adjust for interests
  if (preferences.interests?.includes('physical_challenge')) {
    weights['Physical Demand'] += 0.1
    weights['Experience Quality'] -= 0.1
  }
  if (preferences.interests?.includes('scenic_views')) {
    weights['Experience Quality'] += 0.1
    weights['Physical Demand'] -= 0.1
  }

  // Normalize to sum to 1
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
  Object.keys(weights).forEach(key => {
    weights[key] = weights[key] / total
  })

  return weights
}

/**
 * Add dynamic criteria based on user preferences
 */
function addDynamicCriteria(
  routes: any[],
  preferences: UserPreferences,
  criteria: any[]
): any[] {
  return routes.map(route => {
    const dynamicValues = [...route.criterionValues]

    // Add cost criterion dynamically calculated
    const costInput: CostCalculationInput = {
      userLocation: preferences.location || 'jakarta',
      mountainLocation: route.mountain.location.toLowerCase().split(',')[0].trim(),
      routeDifficulty: route.difficulty,
      duration: Math.ceil(route.duration / 24) || 1,
      groupSize: preferences.group_size || 2,
      needsGuide: preferences.experience_level === 'beginner',
      needsEquipment: preferences.concerns?.includes('equipment') || false,
      budgetLevel: preferences.budget_range === 'under_500k' ? 'budget' : 
                  preferences.budget_range === 'above_5m' ? 'premium' : 'standard'
    }

    const costBreakdown = calculateTripCost(costInput)
    
    // Add calculated cost as a criterion
    dynamicValues.push({
      criterionId: 'calculated_cost',
      criterion: {
        name: 'Total Trip Cost',
        isBenefit: false, // lower cost is better
        factor: { name: 'Logistics & Cost' },
        weightInFactor: new Decimal(0.6) // 60% of logistics factor
      },
      valueDecimal: new Decimal(costBreakdown.total)
    })

    // Add accessibility score based on distance
    const distance = calculateTransportDistance(
      preferences.location || 'jakarta',
      route.mountain.location.toLowerCase().split(',')[0].trim()
    )
    
    const accessibilityScore = Math.max(1, 6 - (distance / 100)) // 5 = very accessible, 1 = hard to reach
    
    dynamicValues.push({
      criterionId: 'accessibility_score',
      criterion: {
        name: 'Accessibility Score',
        isBenefit: true, // higher accessibility is better
        factor: { name: 'Logistics & Cost' },
        weightInFactor: new Decimal(0.4)
      },
      valueDecimal: new Decimal(accessibilityScore)
    })

    return {
      ...route,
      criterionValues: dynamicValues
    }
  })
}

/**
 * Normalize decision matrix using vector normalization
 */
function normalizeMatrix(routes: any[]): any[] {
  // Get all unique criteria
  const allCriteria = new Set<string>()
  routes.forEach(route => {
    route.criterionValues.forEach((cv: any) => {
      allCriteria.add(cv.criterionId || cv.criterion.name)
    })
  })

  // Calculate normalization factors for each criterion
  const normalizationFactors: Record<string, number> = {}
  
  allCriteria.forEach(criterionKey => {
    const values = routes.map(route => {
      const criterionValue = route.criterionValues.find((cv: any) => 
        (cv.criterionId || cv.criterion.name) === criterionKey
      )
      return criterionValue ? parseFloat(criterionValue.valueDecimal.toString()) : 0
    })
    
    // Vector normalization: sqrt(sum of squares)
    const sumOfSquares = values.reduce((sum, value) => sum + (value * value), 0)
    normalizationFactors[criterionKey] = Math.sqrt(sumOfSquares)
  })

  // Apply normalization
  return routes.map(route => ({
    ...route,
    criterionValues: route.criterionValues.map((cv: any) => {
      const criterionKey = cv.criterionId || cv.criterion.name
      const originalValue = parseFloat(cv.valueDecimal.toString())
      const normalizedValue = normalizationFactors[criterionKey] > 0 
        ? originalValue / normalizationFactors[criterionKey] 
        : 0

      return {
        ...cv,
        normalizedValue
      }
    })
  }))
}

/**
 * Apply weights to normalized matrix
 */
function applyWeights(
  routes: any[], 
  factorWeights: any[], 
  userWeights: Record<string, number>
): any[] {
  return routes.map(route => ({
    ...route,
    criterionValues: route.criterionValues.map((cv: any) => {
      const factorName = cv.criterion.factor.name
      const factorWeight = factorWeights.find(fw => fw.factor.name === factorName)?.weight || 0.33
      const userWeight = userWeights[factorName] || 0.33
      const criterionWeight = parseFloat(cv.criterion.weightInFactor.toString())
      
      const totalWeight = parseFloat(factorWeight.toString()) * userWeight * criterionWeight
      const weightedValue = cv.normalizedValue * totalWeight

      return {
        ...cv,
        weight: totalWeight,
        weightedValue
      }
    })
  }))
}

/**
 * Find ideal and negative-ideal solutions (A+ and A-)
 */
function findIdealSolutions(routes: any[]): {
  positiveIdeal: Record<string, number>
  negativeIdeal: Record<string, number>
} {
  const positiveIdeal: Record<string, number> = {}
  const negativeIdeal: Record<string, number> = {}

  // Get all unique criteria
  const allCriteria = new Set<string>()
  routes.forEach(route => {
    route.criterionValues.forEach((cv: any) => {
      allCriteria.add(cv.criterionId || cv.criterion.name)
    })
  })

  // For each criterion, find the best and worst weighted values
  allCriteria.forEach(criterionKey => {
    const criterionValues = routes.map(route => {
      const cv = route.criterionValues.find((c: any) => 
        (c.criterionId || c.criterion.name) === criterionKey
      )
      return {
        weightedValue: cv?.weightedValue || 0,
        isBenefit: cv?.criterion.isBenefit || true
      }
    })

    const weightedValues = criterionValues.map(cv => cv.weightedValue)
    const isBenefit = criterionValues[0]?.isBenefit || true

    if (isBenefit) {
      // For benefit criteria, positive ideal is max, negative ideal is min
      positiveIdeal[criterionKey] = Math.max(...weightedValues)
      negativeIdeal[criterionKey] = Math.min(...weightedValues)
    } else {
      // For cost criteria, positive ideal is min, negative ideal is max
      positiveIdeal[criterionKey] = Math.min(...weightedValues)
      negativeIdeal[criterionKey] = Math.max(...weightedValues)
    }
  })

  return { positiveIdeal, negativeIdeal }
}

/**
 * Calculate distances to ideal solutions
 */
function calculateDistances(
  routes: any[], 
  positiveIdeal: Record<string, number>,
  negativeIdeal: Record<string, number>
): any[] {
  return routes.map(route => {
    let distanceToPositive = 0
    let distanceToNegative = 0

    route.criterionValues.forEach((cv: any) => {
      const criterionKey = cv.criterionId || cv.criterion.name
      const weightedValue = cv.weightedValue

      // Euclidean distance
      const diffPositive = weightedValue - positiveIdeal[criterionKey]
      const diffNegative = weightedValue - negativeIdeal[criterionKey]

      distanceToPositive += diffPositive * diffPositive
      distanceToNegative += diffNegative * diffNegative
    })

    distanceToPositive = Math.sqrt(distanceToPositive)
    distanceToNegative = Math.sqrt(distanceToNegative)

    // TOPSIS score: C = D- / (D+ + D-)
    const topsisScore = distanceToNegative / (distanceToPositive + distanceToNegative)

    return {
      ...route,
      distanceToPositive,
      distanceToNegative,
      topsisScore
    }
  })
}

/**
 * Generate explanations for route recommendations
 */
function generateExplanations(route: any, preferences: UserPreferences): string[] {
  const explanations: string[] = []

  // Experience level match
  const difficultyMap = { 'Easy': 1, 'Moderate': 2, 'Hard': 3, 'Expert': 4 }
  const experienceMap = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 }
  
  const routeDifficulty = difficultyMap[route.difficulty as keyof typeof difficultyMap] || 2
  const userExperience = experienceMap[preferences.experience_level as keyof typeof experienceMap] || 2

  if (Math.abs(routeDifficulty - userExperience) <= 1) {
    explanations.push(`Perfect match for your ${preferences.experience_level} experience level`)
  } else if (routeDifficulty > userExperience) {
    explanations.push(`Challenging route to advance your ${preferences.experience_level} skills`)
  } else {
    explanations.push(`Comfortable difficulty level for your experience`)
  }

  // Fitness level consideration
  const fitnessScore = preferences.fitness_level || 5
  const routePhysicalDemand = routeDifficulty * 2.5 // Scale to 1-10

  if (Math.abs(routePhysicalDemand - fitnessScore) <= 2) {
    explanations.push(`Good match for your fitness level (${fitnessScore}/10)`)
  }

  // Interest-based explanations
  const interests = preferences.interests || []
  if (interests.includes('scenic_views')) {
    const scenicCriterion = route.criterionValues.find((cv: any) => 
      cv.criterion.name.includes('Scenic')
    )
    if (scenicCriterion && parseFloat(scenicCriterion.valueDecimal.toString()) >= 4) {
      explanations.push('Excellent scenic views for photography and sightseeing')
    }
  }

  if (interests.includes('physical_challenge') && routeDifficulty >= 3) {
    explanations.push('Provides the physical challenge you\'re seeking')
  }

  if (interests.includes('solitude')) {
    const crowdingCriterion = route.criterionValues.find((cv: any) => 
      cv.criterion.name.includes('Crowding')
    )
    if (crowdingCriterion && parseFloat(crowdingCriterion.valueDecimal.toString()) <= 2) {
      explanations.push('Less crowded trail for peaceful hiking experience')
    }
  }

  // Time commitment match
  const routeDays = Math.ceil(route.duration / 24) || 1
  const timeMap: Record<string, number> = {
    'half_day': 0.5,
    'full_day': 1,
    '2_days': 2,
    '3_days': 3,
    '4_plus_days': 4
  }
  
  const preferredDays = timeMap[preferences.time_commitment] || 2
  if (Math.abs(routeDays - preferredDays) <= 1) {
    explanations.push(`Fits well within your ${preferences.time_commitment.replace('_', ' ')} timeframe`)
  }

  // Budget consideration
  const budgetRange = parseBudgetRange(preferences.budget_range)
  const costCriterion = route.criterionValues.find((cv: any) => 
    cv.criterionId === 'calculated_cost'
  )
  
  if (costCriterion) {
    const estimatedCost = parseFloat(costCriterion.valueDecimal.toString())
    if (estimatedCost <= budgetRange.max) {
      explanations.push(`Within your budget range (estimated Rp ${estimatedCost.toLocaleString('id-ID')})`)
    }
  }

  return explanations.slice(0, 4) // Limit to 4 key explanations
}

/**
 * Main TOPSIS algorithm implementation
 */
export async function runTopsisAnalysis(
  preferences: UserPreferences
): Promise<TopsisResult> {
  // 1. Build decision matrix
  const { routes, factorWeights } = await buildDecisionMatrix()
  
  // 2. Add dynamic criteria
  const routesWithDynamicCriteria = addDynamicCriteria(routes, preferences, [])
  
  // 3. Calculate user preference weights
  const userWeights = calculateUserWeights(preferences)
  
  // 4. Normalize the matrix
  const normalizedRoutes = normalizeMatrix(routesWithDynamicCriteria)
  
  // 5. Apply weights
  const weightedRoutes = applyWeights(normalizedRoutes, factorWeights, userWeights)
  
  // 6. Find ideal solutions
  const { positiveIdeal, negativeIdeal } = findIdealSolutions(weightedRoutes)
  
  // 7. Calculate distances and TOPSIS scores
  const routesWithScores = calculateDistances(weightedRoutes, positiveIdeal, negativeIdeal)
  
  // 8. Sort by TOPSIS score (descending)
  const rankedRoutes = routesWithScores
    .sort((a, b) => b.topsisScore - a.topsisScore)
    .map((route, index) => ({
      ...route,
      rank: index + 1
    }))
  
  // 9. Build result with explanations
  const routeEvaluations: RouteEvaluation[] = rankedRoutes.map(route => ({
    routeId: route.id,
    routeName: route.name,
    mountainName: route.mountain.name,
    difficulty: route.difficulty,
    distance: parseFloat(route.distance.toString()),
    duration: route.duration || 0,
    criteria: route.criterionValues.map((cv: any) => ({
      criterionId: cv.criterionId || cv.criterion.name,
      criterionName: cv.criterion.name,
      factorName: cv.criterion.factor.name,
      value: parseFloat(cv.valueDecimal.toString()),
      weight: cv.weight || 0,
      isBenefit: cv.criterion.isBenefit,
      normalizedValue: cv.normalizedValue || 0,
      weightedValue: cv.weightedValue || 0
    })),
    distanceToPositive: route.distanceToPositive,
    distanceToNegative: route.distanceToNegative,
    topsisScore: route.topsisScore,
    rank: route.rank,
    explanations: generateExplanations(route, preferences)
  }))

  const averageScore = routeEvaluations.reduce((sum, route) => sum + route.topsisScore, 0) / routeEvaluations.length

  return {
    routes: routeEvaluations,
    methodology: {
      algorithm: 'TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)',
      factors: factorWeights.map(fw => ({
        name: fw.factor.name,
        weight: userWeights[fw.factor.name] || 0.33,
        description: fw.factor.description || `${fw.factor.name} related criteria`
      })),
      userPreferenceWeights: userWeights,
      explanation: `Your answers were analyzed using TOPSIS multi-criteria decision analysis. Routes are evaluated across ${Object.keys(positiveIdeal).length} criteria including difficulty, cost, accessibility, and scenic value. The algorithm finds the route closest to the ideal solution based on your preferences.`
    },
    summary: {
      totalRoutes: routeEvaluations.length,
      averageScore: Math.round(averageScore * 1000) / 1000,
      topRecommendation: routeEvaluations[0]?.routeName || 'No routes found',
      analysisDate: new Date().toISOString()
    }
  }
}

/**
 * Save TOPSIS results to database
 */
export async function saveTopsisResults(
  intakeId: string,
  userId: string | null,
  topsisResult: TopsisResult
): Promise<string> {
  // Create recommendation record
  const recommendation = await db.recommendation.create({
    data: {
      intakeId,
      userId,
      topsisScoreJson: topsisResult as any, // Store complete TOPSIS analysis
    },
  })

  // Create recommendation items for top routes
  const topRoutes = topsisResult.routes.slice(0, 5) // Top 5 recommendations
  
  await db.recommendationItem.createMany({
    data: topRoutes.map(route => ({
      recommendationId: recommendation.id,
      routeId: route.routeId,
      rank: route.rank,
      score: new Decimal(route.topsisScore)
    }))
  })

  return recommendation.id
}