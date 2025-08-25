'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/lib/ui/Button'
import Link from 'next/link'
import { 
  Trophy, 
  MapPin, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Backpack,
  Mountain,
  Star,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  Share2
} from 'lucide-react'

interface RecommendationData {
  id: string
  intakeId: string
  createdAt: string
  userName: string
  isOwn: boolean
  intakeAnswers: any
  topsisAnalysis: any
  routes: Array<{
    rank: number
    score: number
    route: {
      id: string
      name: string
      difficulty: string
      distance: number
      duration: number
      description: string
      mountain: {
        id: string
        name: string
        location: string
        elevation: number
        description: string
      }
      criterionValues: Array<{
        criterion: string
        factor: string
        value: number
        isBenefit: boolean
      }>
    }
  }>
  summary: {
    totalRoutes: number
    averageScore: number
    topRoute: string
    generatedAt: string
  }
}

interface RecommendationResultsProps {
  recommendationId: string
}

export default function RecommendationResults({ recommendationId }: RecommendationResultsProps) {
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'gear'>('overview')

  const { data, isLoading, error } = useQuery<RecommendationData>({
    queryKey: ['recommendation', recommendationId],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations/${recommendationId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch recommendation')
      }
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold">Loading Your Recommendations</h2>
          <p className="text-muted-foreground">Analyzing your perfect hiking matches...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-destructive">
            <svg className="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Failed to Load Recommendations</h2>
          <p className="text-muted-foreground">We couldn't retrieve your hiking recommendations.</p>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="outline" asChild>
              <Link href="/wizard">Create New Recommendation</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const topRoute = data.routes[0]
  const topsisData = data.topsisAnalysis as any

  // Calculate factor contributions
  const factorContributions = topsisData?.methodology?.factors?.map((factor: any) => ({
    name: factor.name,
    weight: factor.weight,
    description: factor.description
  })) || []

  // Get gear recommendations from TOPSIS analysis
  const gearRecommendations = topsisData?.gearRecommendations || {
    essential: [],
    recommended: [],
    optional: []
  }

  // Get cost breakdown from TOPSIS analysis
  const costBreakdown = topsisData?.costBreakdown || {
    transportation: 0,
    permits: 0,
    guide: 0,
    accommodation: 0,
    meals: 0,
    equipment: 0,
    miscellaneous: 0,
    total: 0
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground">Your Hiking Recommendations</h1>
              <p className="text-muted-foreground">
                Personalized recommendations generated on {new Date(data.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button asChild>
                <Link href="/wizard">New Recommendation</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Top Pick Hero Section */}
        {topRoute && (
          <div className="mb-8 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-8">
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <span className="text-sm font-medium text-primary">TOP RECOMMENDATION</span>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-foreground">{topRoute.route.name}</h2>
                  <div className="flex items-center space-x-4 text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Mountain className="h-4 w-4" />
                      <span>{topRoute.route.mountain.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{topRoute.route.mountain.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{topRoute.route.difficulty}</span>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground max-w-2xl">
                  {topRoute.route.description || topRoute.route.mountain.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">{Math.round(topRoute.score * 100)}%</div>
                    <div className="text-sm text-muted-foreground">Match Score</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{topRoute.route.distance}km</div>
                    <div className="text-sm text-muted-foreground">Distance</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{Math.round(topRoute.route.duration / 24) || 1}</div>
                    <div className="text-sm text-muted-foreground">Days</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{topRoute.route.mountain.elevation}m</div>
                    <div className="text-sm text-muted-foreground">Elevation</div>
                  </div>
                </div>

                {/* Why Recommended */}
                {topsisData?.routes?.[0]?.explanations && (
                  <div className="pt-4">
                    <h3 className="font-semibold mb-2">Why this route is perfect for you:</h3>
                    <ul className="space-y-1">
                      {topsisData.routes[0].explanations.map((explanation: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{explanation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Score Visualization */}
              <div className="ml-8 text-center">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${topRoute.score * 100}, 100`}
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{Math.round(topRoute.score * 100)}</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-2">Match Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border mb-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'All Recommendations', icon: Trophy },
              { id: 'analysis', label: 'Analysis & Costs', icon: TrendingUp },
              { id: 'gear', label: 'Gear Recommendations', icon: Backpack },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">All Recommendations ({data.routes.length})</h2>
              <div className="text-sm text-muted-foreground">
                Average Score: {Math.round(data.summary.averageScore * 100)}%
              </div>
            </div>

            <div className="grid gap-6">
              {data.routes.map((route) => (
                <div
                  key={route.route.id}
                  className={`rounded-lg border p-6 transition-all ${
                    route.rank === 1 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          route.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                          route.rank === 2 ? 'bg-gray-100 text-gray-800' :
                          route.rank === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          #{route.rank}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{route.route.name}</h3>
                          <p className="text-muted-foreground">{route.route.mountain.name} • {route.route.mountain.location}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>{route.route.difficulty}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{route.route.distance}km</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{Math.round(route.route.duration / 24) || 1} days</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mountain className="h-4 w-4 text-muted-foreground" />
                          <span>{route.route.mountain.elevation}m</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{Math.round(route.score * 100)}% match</span>
                        </div>
                      </div>

                      {route.route.description && (
                        <p className="text-sm text-muted-foreground">{route.route.description}</p>
                      )}

                      {/* Expandable Details */}
                      <div className="pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedRoute(
                            expandedRoute === route.route.id ? null : route.route.id
                          )}
                        >
                          {expandedRoute === route.route.id ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              View Details
                            </>
                          )}
                        </Button>

                        {expandedRoute === route.route.id && (
                          <div className="mt-4 p-4 bg-muted/30 rounded-lg space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Why this route matches your preferences:</h4>
                              <ul className="space-y-1 text-sm">
                                {topsisData?.routes?.find((r: any) => r.routeId === route.route.id)?.explanations?.map((explanation: string, idx: number) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <Star className="h-3 w-3 text-yellow-500 mt-1 flex-shrink-0" />
                                    <span className="text-muted-foreground">{explanation}</span>
                                  </li>
                                )) || ['Detailed analysis available in full report']}
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Criterion Scores:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {route.route.criterionValues.slice(0, 6).map((cv, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span className="text-muted-foreground">{cv.criterion}:</span>
                                    <span className="font-medium">{cv.value}{cv.criterion.includes('Cost') ? ' IDR' : ''}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Score Display */}
                    <div className="text-right ml-6">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(route.score * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Match</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Factor Analysis */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Decision Factors</h2>
              
              <div className="space-y-4">
                {factorContributions.map((factor, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{factor.name}</span>
                      <span className="text-sm text-muted-foreground">{Math.round(factor.weight * 100)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${factor.weight * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground">{factor.description}</p>
                  </div>
                ))}
              </div>

              {/* Methodology */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium mb-2">Analysis Method</h3>
                <p className="text-sm text-muted-foreground">
                  {topsisData?.methodology?.explanation || 
                   'Routes analyzed using TOPSIS multi-criteria decision analysis, considering your preferences, experience level, and constraints.'}
                </p>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Estimated Costs</h2>
              
              <div className="space-y-4">
                {Object.entries(costBreakdown).map(([category, amount]) => {
                  if (category === 'total') return null
                  const displayName = category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')
                  return (
                    <div key={category} className="flex justify-between items-center">
                      <span className="capitalize">{displayName}</span>
                      <span className="font-medium">Rp {(amount as number).toLocaleString('id-ID')}</span>
                    </div>
                  )
                })}
                <div className="border-t pt-4 flex justify-between items-center text-lg font-semibold">
                  <span>Total Estimated Cost</span>
                  <span className="text-primary">Rp {costBreakdown.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  * Costs are estimates based on your group size and preferences. Actual costs may vary depending on season, specific service providers, and current rates.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gear' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold">Gear Recommendations</h2>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Essential Gear */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-destructive">Essential Items</h3>
                <p className="text-sm text-muted-foreground">Must-have items for safety and basic comfort</p>
                <div className="space-y-3">
                  {(gearRecommendations.essential || [
                    { name: 'Hiking Boots', description: 'Sturdy, ankle-supporting boots' },
                    { name: 'Backpack', description: 'Appropriate capacity for trip duration' },
                    { name: 'Water System', description: '2-3L capacity per person' },
                    { name: 'First Aid Kit', description: 'Basic medical supplies' },
                    { name: 'Headlamp', description: 'LED with extra batteries' }
                  ]).map((item: any, index: number) => (
                    <div key={index} className="p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Gear */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-yellow-600">Recommended Items</h3>
                <p className="text-sm text-muted-foreground">Strongly suggested for comfort and safety</p>
                <div className="space-y-3">
                  {(gearRecommendations.recommended || [
                    { name: 'Trekking Poles', description: 'For stability and joint support' },
                    { name: 'Rain Gear', description: 'Waterproof jacket and pants' },
                    { name: 'Insulation Layer', description: 'Fleece or down jacket' },
                    { name: 'Navigation', description: 'GPS device or smartphone with offline maps' }
                  ]).map((item: any, index: number) => (
                    <div key={index} className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Gear */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">Optional Items</h3>
                <p className="text-sm text-muted-foreground">Nice-to-have items for enhanced experience</p>
                <div className="space-y-3">
                  {(gearRecommendations.optional || [
                    { name: 'Camera', description: 'For capturing scenic views' },
                    { name: 'Camp Chair', description: 'Lightweight portable comfort' },
                    { name: 'Power Bank', description: 'Extra battery for devices' },
                    { name: 'Binoculars', description: 'For wildlife observation' }
                  ]).map((item: any, index: number) => (
                    <div key={index} className="p-3 border border-muted rounded-lg bg-muted/30">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Gear recommendations are based on your selected route difficulty, weather conditions, and trip duration. 
                Consider renting specialized equipment if you don't own it.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-12 flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/wizard">Create New Recommendation</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/history">View All Recommendations</Link>
          </Button>
          <Button variant="ghost" asChild size="lg">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}