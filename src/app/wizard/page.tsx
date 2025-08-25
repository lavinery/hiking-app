'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/lib/ui/Button'
import { Input } from '@/lib/ui/Input'
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'

// Import types from API
import type { QuestionsResponse, Question, QuestionStep } from '@/app/api/questions/route'

// Field components with proper controlled state
const TextField = ({ question, field, error }: any) => (
  <Input
    label={question.title}
    placeholder={question.placeholder}
    helperText={question.description}
    error={error}
    value={field.value || ''} // Always provide a string value
    onChange={field.onChange}
    onBlur={field.onBlur}
  />
)

const SelectField = ({ question, field, error }: any) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">{question.title}</label>
    {question.description && (
      <p className="text-sm text-muted-foreground">{question.description}</p>
    )}
    <select
      value={field.value || ''} // Always provide a string value
      onChange={field.onChange}
      onBlur={field.onBlur}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        error ? 'border-destructive' : ''
      }`}
    >
      <option value="">Select an option...</option>
      {question.options?.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
)

const RadioField = ({ question, field, error }: any) => (
  <div className="space-y-4">
    <div>
      <label className="text-sm font-medium">{question.title}</label>
      {question.description && (
        <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
      )}
    </div>
    <div className="space-y-3">
      {question.options?.map((option: any) => (
        <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
          <input
            type="radio"
            name={question.id}
            value={option.value}
            checked={field.value === option.value}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            className="mt-1 h-4 w-4 text-primary border-gray-300 focus:ring-primary"
          />
          <div className="flex-1">
            <div className="text-sm font-medium">{option.label}</div>
            {option.description && (
              <div className="text-sm text-muted-foreground">{option.description}</div>
            )}
          </div>
        </label>
      ))}
    </div>
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
)

const CheckboxField = ({ question, field, error }: any) => {
  const currentValues = Array.isArray(field.value) ? field.value : []
  
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      field.onChange([...currentValues, optionValue])
    } else {
      field.onChange(currentValues.filter((v: string) => v !== optionValue))
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">{question.title}</label>
        {question.description && (
          <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
        )}
      </div>
      <div className="space-y-3">
        {question.options?.map((option: any) => (
          <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={currentValues.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              onBlur={field.onBlur}
              className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <div className="flex-1">
              <div className="text-sm font-medium">{option.label}</div>
              {option.description && (
                <div className="text-sm text-muted-foreground">{option.description}</div>
              )}
            </div>
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

const SliderField = ({ question, field, error }: any) => {
  const value = field.value !== undefined ? field.value : question.min || 1
  
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">{question.title}</label>
        {question.description && (
          <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
        )}
      </div>
      <div className="space-y-2">
        <input
          type="range"
          min={question.min}
          max={question.max}
          step={question.step}
          value={value}
          onChange={(e) => field.onChange(parseInt(e.target.value))}
          onBlur={field.onBlur}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{question.min}</span>
          <span className="font-medium">
            {value} {question.unit}
          </span>
          <span>{question.max}</span>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

const GroupField = ({ question, register, control, errors }: any) => (
  <div className="space-y-6 p-4 border rounded-lg bg-muted/20">
    <div>
      <h3 className="text-lg font-medium">{question.title}</h3>
      {question.description && (
        <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
      )}
    </div>
    <div className="space-y-4">
      {question.children?.map((childQuestion: Question) => (
        <DynamicField
          key={childQuestion.id}
          question={childQuestion}
          register={register}
          control={control}
          errors={errors}
        />
      ))}
    </div>
  </div>
)

const DynamicField = ({ question, register, control, errors }: any) => {
  const error = errors[question.id]?.message

  // Get default values based on question type
  const getDefaultValue = () => {
    switch (question.type) {
      case 'text':
      case 'select':
      case 'radio':
        return ''
      case 'checkbox':
        return []
      case 'slider':
        return question.min || 1
      default:
        return ''
    }
  }

  switch (question.type) {
    case 'text':
      return (
        <Controller
          name={question.id}
          control={control}
          defaultValue={getDefaultValue()}
          rules={{ required: question.required }}
          render={({ field }) => (
            <TextField question={question} field={field} error={error} />
          )}
        />
      )
    case 'select':
      return (
        <Controller
          name={question.id}
          control={control}
          defaultValue={getDefaultValue()}
          rules={{ required: question.required }}
          render={({ field }) => (
            <SelectField question={question} field={field} error={error} />
          )}
        />
      )
    case 'radio':
      return (
        <Controller
          name={question.id}
          control={control}
          defaultValue={getDefaultValue()}
          rules={{ required: question.required }}
          render={({ field }) => (
            <RadioField question={question} field={field} error={error} />
          )}
        />
      )
    case 'checkbox':
      return (
        <Controller
          name={question.id}
          control={control}
          defaultValue={getDefaultValue()}
          render={({ field }) => (
            <CheckboxField question={question} field={field} error={error} />
          )}
        />
      )
    case 'slider':
      return (
        <Controller
          name={question.id}
          control={control}
          defaultValue={getDefaultValue()}
          rules={{ required: question.required }}
          render={({ field }) => (
            <SliderField question={question} field={field} error={error} />
          )}
        />
      )
    case 'group':
      return (
        <GroupField
          question={question}
          register={register}
          control={control}
          errors={errors}
        />
      )
    default:
      return null
  }
}

export default function WizardPage() {
  const router = useRouter()
  const [currentStepId, setCurrentStepId] = useState<string>('')
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch questions schema
  const { data: questionsData, isLoading, error } = useQuery<QuestionsResponse>({
    queryKey: ['questions'],
    queryFn: async () => {
      const response = await fetch('/api/questions')
      if (!response.ok) throw new Error('Failed to fetch questions')
      return response.json()
    },
  })

  const currentStep = questionsData?.steps.find(step => step.id === currentStepId)
  const totalSteps = questionsData?.steps.length || 0
  const currentStepIndex = questionsData?.steps.findIndex(step => step.id === currentStepId) || 0

  // Create dynamic schema for current step with proper defaults
  const createStepSchema = (step: QuestionStep) => {
    const schemaFields: Record<string, any> = {}
    
    const processQuestion = (question: Question) => {
      if (question.type === 'group' && question.children) {
        question.children.forEach(processQuestion)
      } else {
        let fieldSchema: any

        switch (question.type) {
          case 'text':
            fieldSchema = question.required 
              ? z.string().min(1, `${question.title} is required`)
              : z.string().optional()
            break
          case 'select':
          case 'radio':
            const validValues = question.options?.map(opt => opt.value) || []
            if (validValues.length > 0) {
              fieldSchema = question.required
                ? z.enum(validValues as [string, ...string[]])
                : z.enum(validValues as [string, ...string[]]).optional()
            } else {
              fieldSchema = question.required 
                ? z.string().min(1, `${question.title} is required`)
                : z.string().optional()
            }
            break
          case 'checkbox':
            fieldSchema = z.array(z.string()).default([])
            break
          case 'slider':
            fieldSchema = question.required
              ? z.number().min(question.min || 0).max(question.max || 100)
              : z.number().min(question.min || 0).max(question.max || 100).optional()
            break
          default:
            fieldSchema = z.any().optional()
        }

        schemaFields[question.id] = fieldSchema
      }
    }

    step.questions.forEach(processQuestion)
    return z.object(schemaFields)
  }

  // Initialize form with proper default values
  const form = useForm({
    resolver: currentStep ? zodResolver(createStepSchema(currentStep)) : undefined,
    defaultValues: (() => {
      const defaults: Record<string, any> = {}
      
      // Set defaults based on existing formData and question types
      if (currentStep) {
        currentStep.questions.forEach(question => {
          const existingValue = formData[question.id]
          
          if (existingValue !== undefined) {
            defaults[question.id] = existingValue
          } else {
            // Set appropriate default based on question type
            switch (question.type) {
              case 'text':
              case 'select':
              case 'radio':
                defaults[question.id] = ''
                break
              case 'checkbox':
                defaults[question.id] = []
                break
              case 'slider':
                defaults[question.id] = question.min || 1
                break
              default:
                defaults[question.id] = ''
            }
          }
        })
      }
      
      return defaults
    })(),
  })

  // Initialize with first step
  useEffect(() => {
    if (questionsData && !currentStepId) {
      setCurrentStepId(questionsData.startStep)
    }
  }, [questionsData, currentStepId])

  // Reset form when step changes with proper values
  useEffect(() => {
    if (currentStep) {
      const stepDefaults: Record<string, any> = {}
      
      currentStep.questions.forEach(question => {
        const existingValue = formData[question.id]
        
        if (existingValue !== undefined) {
          stepDefaults[question.id] = existingValue
        } else {
          switch (question.type) {
            case 'text':
            case 'select':
            case 'radio':
              stepDefaults[question.id] = ''
              break
            case 'checkbox':
              stepDefaults[question.id] = []
              break
            case 'slider':
              stepDefaults[question.id] = question.min || 1
              break
            default:
              stepDefaults[question.id] = ''
          }
        }
      })
      
      form.reset(stepDefaults)
    }
  }, [currentStepId, currentStep, form, formData])

  // Submit complete wizard
  const submitWizard = async (finalData: Record<string, any>) => {
    setIsSubmitting(true)
    
    try {
      console.log('Submitting wizard with data:', finalData)
      
      // 1. Create intake
      const intakeResponse = await fetch('/api/intakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answersJson: finalData }),
      })

      if (!intakeResponse.ok) {
        const errorData = await intakeResponse.json()
        throw new Error(errorData.error || 'Failed to save intake')
      }

      const { id: intakeId } = await intakeResponse.json()
      console.log('Intake created:', intakeId)

      // 2. Generate recommendations
      const recommendationResponse = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeId }),
      })

      if (!recommendationResponse.ok) {
        const errorData = await recommendationResponse.json()
        throw new Error(errorData.error || 'Failed to generate recommendations')
      }

      const { id: recommendationId } = await recommendationResponse.json()
      console.log('Recommendation created:', recommendationId)

      // 3. Redirect to results
      router.push(`/result/${recommendationId}`)
    } catch (error) {
      console.error('Error submitting wizard:', error)
      alert(`Failed to submit: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = async (stepData: any) => {
    console.log('Step data:', stepData)
    
    // Save current step data
    const newFormData = { ...formData, ...stepData }
    setFormData(newFormData)
    
    // Mark current step as completed
    if (!completedSteps.includes(currentStepId)) {
      setCompletedSteps([...completedSteps, currentStepId])
    }

    // Determine next step
    const firstQuestion = currentStep?.questions[0]
    if (!firstQuestion?.next) {
      // End of wizard - submit everything
      console.log('End of wizard, submitting:', newFormData)
      await submitWizard(newFormData)
      return
    }

    let nextStepId: string
    if (typeof firstQuestion.next === 'string') {
      nextStepId = firstQuestion.next
    } else {
      // Conditional branching based on answer
      const branchingQuestion = currentStep?.questions.find(q => 
        typeof q.next === 'object' && q.next !== null
      )
      if (branchingQuestion && typeof branchingQuestion.next === 'object') {
        const answerValue = stepData[branchingQuestion.id]
        nextStepId = branchingQuestion.next[answerValue] || Object.values(branchingQuestion.next)[0]
      } else {
        nextStepId = firstQuestion.next as string
      }
    }

    console.log('Moving to next step:', nextStepId)
    setCurrentStepId(nextStepId)
  }

  const handlePrevious = () => {
    const currentIndex = questionsData?.steps.findIndex(step => step.id === currentStepId) || 0
    if (currentIndex > 0) {
      const prevStep = questionsData?.steps[currentIndex - 1]
      if (prevStep) {
        setCurrentStepId(prevStep.id)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to load questions: {error.message}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  // Submitting state
  if (isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <h2 className="text-xl font-semibold">Generating Your Recommendations</h2>
          <p className="text-muted-foreground">Analyzing your preferences and matching with hiking routes...</p>
        </div>
      </div>
    )
  }

  if (!currentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Check className="h-12 w-12 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold">Wizard Completed!</h2>
          <p className="text-muted-foreground">Redirecting to your recommendations...</p>
        </div>
      </div>
    )
  }

  const isLastStep = currentStep.questions.some(q => !q.next)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold hover:text-primary">
              ← Hiking Gear Recommendation
            </Link>
            <div className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {totalSteps}
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-muted/30">
        <div className="container py-2">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container py-8 max-w-2xl">
        <form onSubmit={form.handleSubmit(handleNext)} className="space-y-8">
          {/* Step header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">{currentStep.title}</h1>
            {currentStep.description && (
              <p className="text-lg text-muted-foreground">{currentStep.description}</p>
            )}
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {currentStep.questions.map((question) => (
              <DynamicField
                key={question.id}
                question={question}
                register={form.register}
                control={form.control}
                errors={form.formState.errors}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <Button type="submit" disabled={form.formState.isSubmitting || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : isLastStep ? (
                'Generate Recommendations'
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Debug info (development only) */}
        {false && process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Debug Info:</h3>
            <div className="text-sm space-y-1">
              <div>Current Step: {currentStepId}</div>
              <div>Completed Steps: {completedSteps.join(', ')}</div>
              <div>Is Last Step: {isLastStep ? 'Yes' : 'No'}</div>
              <div>Form Valid: {form.formState.isValid ? 'Yes' : 'No'}</div>
              <div>Form Errors: {Object.keys(form.formState.errors).length}</div>
              <details>
                <summary className="cursor-pointer">Form Data ({Object.keys(formData).length} fields)</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-40">{JSON.stringify(formData, null, 2)}</pre>
              </details>
              <details>
                <summary className="cursor-pointer">Current Form Values</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-40">{JSON.stringify(form.getValues(), null, 2)}</pre>
              </details>
              {Object.keys(form.formState.errors).length > 0 && (
                <details>
                  <summary className="cursor-pointer text-destructive">Form Errors</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-40">{JSON.stringify(form.formState.errors, null, 2)}</pre>
                </details>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}