'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useMoodData } from '@/app/hooks/useMoodData'
import { MoodEntry } from '@/lib/mood-core/models'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function TrendsPage() {
  const {
    moodEntries,
    isLoading,
    isInitialized,
    error,
    clearError
  } = useMoodData({
    autoSync: true
  })
  
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [filteredMoods, setFilteredMoods] = useState<MoodEntry[]>([])

  useEffect(() => {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const filtered = moodEntries
      .filter(mood => new Date(mood.entryDate + 'T00:00:00') >= startDate)
      .sort((a, b) => new Date(a.entryDate + 'T00:00:00').getTime() - new Date(b.entryDate + 'T00:00:00').getTime())

    setFilteredMoods(filtered)
  }, [moodEntries, period])

  const getChartData = () => {
    if (filteredMoods.length === 0) {
      return {
        labels: [],
        datasets: []
      }
    }

    const labels = filteredMoods.map(mood => new Date(mood.entryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    const data = filteredMoods.map(mood => mood.rating)

    return {
      labels,
      datasets: [
        {
          label: 'Mood Rating',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    }
  }

  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: `Mood Trends - ${period.charAt(0).toUpperCase() + period.slice(1)}`,
          font: {
            size: 16,
            weight: 'bold' as const
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          callbacks: {
            title: (context: any) => {
              const dataIndex = context[0].dataIndex
              const mood = filteredMoods[dataIndex]
              return new Date(mood.entryDate + 'T00:00:00').toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            },
            label: (context: any) => {
              const dataIndex = context.dataIndex
              const mood = filteredMoods[dataIndex]
              const rating = context.parsed.y
              let description = ''
              
              if (rating <= 3) description = 'Very Low'
              else if (rating <= 5) description = 'Low'
              else if (rating <= 7) description = 'Good'
              else description = 'High'
              
              return [
                `Rating: ${rating}/10 (${description})`,
                mood.notes ? `Notes: ${mood.notes}` : ''
              ].filter(Boolean)
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date'
          },
          grid: {
            display: false
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Mood Rating (1-10)'
          },
          min: 1,
          max: 10,
          ticks: {
            stepSize: 1
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index' as const
      }
    }
  }

  const getStats = () => {
    if (filteredMoods.length === 0) return null

    const ratings = filteredMoods.map((mood: MoodEntry) => mood.rating)
    const average = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length
    const highest = Math.max(...ratings)
    const lowest = Math.min(...ratings)
    const withNotes = filteredMoods.filter((mood: MoodEntry) => mood.notes && mood.notes.trim().length > 0).length

    return {
      average: average.toFixed(1),
      highest,
      lowest,
      withNotes,
      total: filteredMoods.length
    }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200" role="navigation" aria-label="Main navigation">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">
              MoodTracker
            </Link>
            <div className="flex space-x-4">
              <Link 
                href="/mood" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Log Mood
              </Link>
              <Link 
                href="/mood/history" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                History
              </Link>
              <Link 
                href="/trends" 
                className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-blue-50"
                aria-current="page"
              >
                Trends
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mood Trends
              </h1>
              <p className="text-lg text-gray-600">
                Analyze your mood patterns and emotional journey over time
              </p>
            </div>
            <Link
              href="/mood"
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Log New Mood
            </Link>
          </div>

          {/* Period Filter */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-4">Time Period:</span>
              {[
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'Last 30 Days' },
                { value: 'quarter', label: 'Last 90 Days' },
                { value: 'year', label: 'Last Year' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value as any)}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    period === option.value
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading trend data...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
                  ) : filteredMoods.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No mood data available</h3>
              <p className="text-gray-600 mb-4">
                You need to log some moods before you can view trends. Start tracking your emotional journey today!
              </p>
              <Link
                href="/mood"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Log Your First Mood
              </Link>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.average}</div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="text-2xl font-bold text-green-600">{stats.highest}</div>
                    <div className="text-sm text-gray-600">Highest Rating</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="text-2xl font-bold text-red-600">{stats.lowest}</div>
                    <div className="text-sm text-gray-600">Lowest Rating</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total Entries</div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="h-96">
                  <Line data={getChartData()} options={getChartOptions()} />
                </div>
              </div>

              {/* Insights */}
              {stats && stats.total > 1 && (
                <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Insights</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <p className="text-sm text-gray-700">
                        Your average mood over the selected period is <span className="font-medium">{stats.average}/10</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <p className="text-sm text-gray-700">
                        Your best day was rated <span className="font-medium">{stats.highest}/10</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      <p className="text-sm text-gray-700">
                        Your most challenging day was rated <span className="font-medium">{stats.lowest}/10</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      </div>
                      <p className="text-sm text-gray-700">
                        You've added notes to <span className="font-medium">{stats.withNotes}</span> out of <span className="font-medium">{stats.total}</span> entries
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
