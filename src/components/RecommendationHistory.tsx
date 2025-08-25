'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/lib/ui/Button'
import { 
  Calendar, 
  MapPin, 
  Trophy, 
  Clock, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Trash2,
  Download,
  Filter,
  Search,
  Plus,
  Mountain,
  Star,
  Users
} from 'lucide-react'
import { Input } from '@/lib/ui/Input'

interface RecommendationSummary {
  id: string
  intakeId: string
  createdAt: string
  topRoutes: Array<{
    rank: number
    routeName: string
    mountainName: string
    score: number
  }>
}

interface HistoryResponse {
  recommendations: RecommendationSummary[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

interface RecommendationHistoryProps {
  userId: string
}

export default function RecommendationHistory({ userId }: RecommendationHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score'>('newest')
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<HistoryResponse>({
    queryKey: ['recommendations-history', currentPage, searchQuery, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        mine: '1',
        page: currentPage.toString(),
        limit: '10',
        sort: sortBy,
      })
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      const response = await fetch(`/api/recommendations?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }
      return response.json()
    },
  })

  const handleDeleteRecommendation = async (recommendationId: string) => {
    if (!confirm('Are you sure you want to delete this recommendation? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/recommendations/${recommendationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete recommendation')
      }

      // Refresh the current page
      queryClient.invalidateQueries({ queryKey: ['recommendations-history'] })
      
      // Show success message (you could add a toast here)
      alert('Recommendation deleted successfully')
    } catch (error) {
      console.error('Error deleting recommendation:', error)
      alert('Failed to delete recommendation')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when searching
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-48"></div>
                  <div className="h-3 bg-muted rounded w-32"></div>
                </div>
                <div className="h-8 bg-muted rounded w-20"></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-16 bg-muted rounded"></div>
                <div className="h-16 bg-muted rounded"></div>
                <div className="h-16 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-destructive">
          <svg className="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">Failed to Load History</h3>
        <p className="text-muted-foreground">We couldn't load your recommendation history.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    )
  }

  const recommendations = data?.recommendations || []
  const pagination = data?.pagination

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
          <Mountain className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">No Recommendations Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {searchQuery ? 
              `No recommendations found matching "${searchQuery}". Try adjusting your search.` :
              "You haven't created any hiking recommendations yet. Start by taking our recommendation wizard!"
            }
          </p>
        </div>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/wizard">
              <Plus className="h-4 w-4 mr-2" />
              Create First Recommendation
            </Link>
          </Button>
          {searchQuery && (
            <Button variant="outline" onClick={() => handleSearch('')}>
              Clear Search
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recommendations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-input rounded-md px-3 py-2 bg-background"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="score">Best Match</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} recommendations
          </span>
          <span>{pagination.totalPages} pages</span>
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-6">
        {recommendations.map((recommendation) => (
          <div key={recommendation.id} className="border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold">
                    Recommendation from {new Date(recommendation.createdAt).toLocaleDateString()}
                  </h3>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">
                    {recommendation.topRoutes.length} routes
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(recommendation.createdAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(recommendation.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/result/${recommendation.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRecommendation(recommendation.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Top Recommendations Preview */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Top Recommendations:</h4>
              <div className="grid gap-3">
                {recommendation.topRoutes.slice(0, 3).map((route, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        route.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        route.rank === 2 ? 'bg-gray-100 text-gray-800' :
                        route.rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {route.rank}
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{route.routeName}</div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Mountain className="h-3 w-3" />
                          <span>{route.mountainName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm font-medium">{Math.round(route.score * 100)}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">match</div>
                    </div>
                  </div>
                ))}
                
                {recommendation.topRoutes.length > 3 && (
                  <div className="text-center">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/result/${recommendation.id}`}>
                        +{recommendation.topRoutes.length - 3} more recommendations
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Best match: <span className="font-medium">{recommendation.topRoutes[0]?.routeName}</span>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/result/${recommendation.id}`}>View Full Results</Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {/* Page Numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(
                  pagination.totalPages - 4,
                  pagination.page - 2
                )) + i
                
                if (pageNum > pagination.totalPages) return null
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}