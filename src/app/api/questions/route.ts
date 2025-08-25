import { NextResponse } from 'next/server'

export type QuestionType = 'text' | 'select' | 'radio' | 'checkbox' | 'slider' | 'group'

export interface QuestionOption {
  value: string
  label: string
  description?: string
}

export interface Question {
  id: string
  type: QuestionType
  title: string
  description?: string
  required?: boolean
  options?: QuestionOption[]
  min?: number
  max?: number
  step?: number
  unit?: string
  placeholder?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  next?: string | Record<string, string> // string for static next, object for conditional branching
  children?: Question[] // for group type
}

export interface QuestionStep {
  id: string
  title: string
  description?: string
  questions: Question[]
}

export interface QuestionsResponse {
  steps: QuestionStep[]
  startStep: string
}

// Mock dynamic questions schema for hiking gear recommendations
const questionsSchema: QuestionsResponse = {
  startStep: 'personal_info',
  steps: [
    {
      id: 'personal_info',
      title: 'Personal Information',
      description: 'Tell us about yourself to get personalized recommendations',
      questions: [
        {
          id: 'name',
          type: 'text',
          title: 'What should we call you?',
          placeholder: 'Enter your name',
          required: true,
          next: 'experience_level'
        },
        {
          id: 'location',
          type: 'select',
          title: 'Where are you based?',
          description: 'This helps us recommend nearby hiking locations',
          required: true,
          options: [
            { value: 'jakarta', label: 'Jakarta & Surrounding' },
            { value: 'bandung', label: 'Bandung & West Java' },
            { value: 'yogyakarta', label: 'Yogyakarta & Central Java' },
            { value: 'surabaya', label: 'Surabaya & East Java' },
            { value: 'bali', label: 'Bali & Nusa Tenggara' },
            { value: 'other', label: 'Other Location' },
          ],
          next: 'experience_level'
        }
      ]
    },
    {
      id: 'experience_level',
      title: 'Hiking Experience',
      description: 'Help us understand your hiking background',
      questions: [
        {
          id: 'hiking_experience',
          type: 'radio',
          title: 'What is your hiking experience level?',
          required: true,
          options: [
            { 
              value: 'beginner', 
              label: 'Beginner', 
              description: 'New to hiking, prefer easy trails under 5km' 
            },
            { 
              value: 'intermediate', 
              label: 'Intermediate', 
              description: 'Some experience, comfortable with 5-15km trails' 
            },
            { 
              value: 'advanced', 
              label: 'Advanced', 
              description: 'Experienced hiker, can handle 15km+ and multi-day treks' 
            },
            { 
              value: 'expert', 
              label: 'Expert', 
              description: 'Highly experienced, comfortable with technical routes' 
            }
          ],
          next: {
            'beginner': 'preferences_beginner',
            'intermediate': 'preferences_general',
            'advanced': 'preferences_general',
            'expert': 'preferences_advanced'
          }
        }
      ]
    },
    {
      id: 'preferences_beginner',
      title: 'Your Preferences',
      description: 'Let us know what matters most to you',
      questions: [
        {
          id: 'fitness_level',
          type: 'slider',
          title: 'How would you rate your current fitness level?',
          min: 1,
          max: 5,
          step: 1,
          required: true,
          next: 'budget_timeframe'
        },
        {
          id: 'concerns',
          type: 'checkbox',
          title: 'What are your main concerns as a beginner?',
          description: 'Select all that apply',
          options: [
            { value: 'safety', label: 'Safety and guided tours' },
            { value: 'fitness', label: 'Physical fitness requirements' },
            { value: 'equipment', label: 'What gear to bring' },
            { value: 'weather', label: 'Weather conditions' },
            { value: 'cost', label: 'Total cost and budgeting' },
            { value: 'time', label: 'Time commitment' }
          ],
          next: 'budget_timeframe'
        }
      ]
    },
    {
      id: 'preferences_general',
      title: 'Your Preferences',
      description: 'Tell us what kind of hiking experience you\'re looking for',
      questions: [
        {
          id: 'fitness_level',
          type: 'slider',
          title: 'How would you rate your current fitness level?',
          min: 1,
          max: 10,
          step: 1,
          required: true,
          next: 'interests'
        },
        {
          id: 'interests',
          type: 'checkbox',
          title: 'What interests you most in hiking?',
          description: 'Select all that apply',
          options: [
            { value: 'scenic_views', label: 'Scenic views and photography' },
            { value: 'physical_challenge', label: 'Physical challenge and fitness' },
            { value: 'nature_wildlife', label: 'Nature and wildlife observation' },
            { value: 'solitude', label: 'Solitude and peaceful environment' },
            { value: 'social', label: 'Social hiking with groups' },
            { value: 'adventure', label: 'Adventure and exploration' }
          ],
          next: 'budget_timeframe'
        }
      ]
    },
    {
      id: 'preferences_advanced',
      title: 'Advanced Preferences',
      description: 'As an expert hiker, tell us about your specific preferences',
      questions: [
        {
          id: 'technical_preferences',
          type: 'group',
          title: 'Technical Hiking Preferences',
          children: [
            {
              id: 'preferred_difficulty',
              type: 'select',
              title: 'Preferred difficulty level',
              options: [
                { value: 'moderate', label: 'Moderate (occasional technical sections)' },
                { value: 'hard', label: 'Hard (regular technical sections)' },
                { value: 'expert', label: 'Expert (highly technical, multi-day)' }
              ],
              required: true
            },
            {
              id: 'max_elevation',
              type: 'slider',
              title: 'Maximum elevation gain you\'re comfortable with (meters)',
              min: 500,
              max: 3000,
              step: 100,
              unit: 'm',
              required: true
            }
          ],
          next: 'budget_timeframe'
        },
        {
          id: 'special_interests',
          type: 'checkbox',
          title: 'Special interests for advanced hikers',
          options: [
            { value: 'peak_bagging', label: 'Peak bagging and summits' },
            { value: 'night_hiking', label: 'Night hiking and sunrise views' },
            { value: 'multi_day', label: 'Multi-day camping treks' },
            { value: 'off_trail', label: 'Off-trail and bushwhacking' },
            { value: 'photography', label: 'Landscape photography' },
            { value: 'minimize_crowds', label: 'Avoiding crowded trails' }
          ],
          next: 'budget_timeframe'
        }
      ]
    },
    {
      id: 'budget_timeframe',
      title: 'Budget & Time',
      description: 'Let\'s talk about practical considerations',
      questions: [
        {
          id: 'budget_range',
          type: 'select',
          title: 'What\'s your budget range for this hiking trip?',
          description: 'Including guides, permits, accommodation, and transportation',
          required: true,
          options: [
            { value: 'under_500k', label: 'Under Rp 500,000', description: 'Day hikes, minimal costs' },
            { value: '500k_1m', label: 'Rp 500,000 - 1,000,000', description: 'Day hikes with guide' },
            { value: '1m_2m', label: 'Rp 1,000,000 - 2,000,000', description: '1-2 day trips' },
            { value: '2m_5m', label: 'Rp 2,000,000 - 5,000,000', description: 'Multi-day adventures' },
            { value: 'above_5m', label: 'Above Rp 5,000,000', description: 'Premium experiences' }
          ],
          next: 'time_commitment'
        },
        {
          id: 'time_commitment',
          type: 'radio',
          title: 'How much time do you have available?',
          required: true,
          options: [
            { value: 'half_day', label: 'Half day (4-6 hours)' },
            { value: 'full_day', label: 'Full day (8-12 hours)' },
            { value: '2_days', label: '2 days, 1 night' },
            { value: '3_days', label: '3 days, 2 nights' },
            { value: '4_plus_days', label: '4+ days' }
          ],
          next: 'group_logistics'
        }
      ]
    },
    {
      id: 'group_logistics',
      title: 'Group & Logistics',
      description: 'Final details about your hiking plans',
      questions: [
        {
          id: 'group_size',
          type: 'slider',
          title: 'How many people in your group?',
          min: 1,
          max: 12,
          step: 1,
          unit: 'people',
          required: true,
          next: 'additional_requirements'
        },
        {
          id: 'group_composition',
          type: 'checkbox',
          title: 'Group composition (select all that apply)',
          options: [
            { value: 'solo', label: 'Solo hiker' },
            { value: 'couple', label: 'Couple' },
            { value: 'family', label: 'Family with children' },
            { value: 'friends', label: 'Group of friends' },
            { value: 'mixed_experience', label: 'Mixed experience levels' },
            { value: 'seniors', label: 'Senior hikers (55+)' }
          ],
          next: 'additional_requirements'
        }
      ]
    },
    {
      id: 'additional_requirements',
      title: 'Additional Requirements',
      description: 'Any special considerations?',
      questions: [
        {
          id: 'special_needs',
          type: 'checkbox',
          title: 'Do you have any special requirements?',
          description: 'This helps us recommend suitable routes and preparations',
          options: [
            { value: 'vegetarian_food', label: 'Vegetarian/vegan meal options' },
            { value: 'mobility_assistance', label: 'Mobility assistance needed' },
            { value: 'medical_conditions', label: 'Medical conditions to consider' },
            { value: 'equipment_rental', label: 'Need to rent hiking equipment' },
            { value: 'photography_focus', label: 'Photography-focused trip' },
            { value: 'cultural_sites', label: 'Interest in cultural/historical sites' }
          ],
          next: null // End of questions
        },
        {
          id: 'additional_notes',
          type: 'text',
          title: 'Anything else you\'d like us to know?',
          description: 'Optional additional information',
          placeholder: 'Any other preferences, concerns, or requirements...',
          required: false,
          next: null // End of questions
        }
      ]
    }
  ]
}

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return NextResponse.json(questionsSchema)
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}