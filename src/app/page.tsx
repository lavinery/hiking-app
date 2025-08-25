'use client'

import Link from 'next/link'
import { Button } from '@/lib/ui/Button'
import { Input } from '@/lib/ui/Input'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/lib/ui/Dialog'
import { useZodForm, createFieldProps } from '@/lib/forms/rhf'
import { z } from 'zod'

// Demo form schema
const demoFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
})

type DemoFormData = z.infer<typeof demoFormSchema>

export default function HomePage() {
  const form = useZodForm(demoFormSchema)

  const handleSubmit = (data: DemoFormData) => {
    console.log('Form submitted:', data)
    // Close dialog on successful submit
    form.reset()
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              Gear Recommendation System
            </h1>
            
            {/* Demo Dialog Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Test UI Components
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={form.handleSubmit(handleSubmit)}>
                  <DialogHeader>
                    <DialogTitle>UI Components Demo</DialogTitle>
                    <DialogDescription>
                      Testing our Button, Input, and Dialog components with React Hook Form + Zod validation.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <Input
                      label="Name"
                      placeholder="Enter your name"
                      {...createFieldProps(form.register, form.formState.errors, 'name')}
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="Enter your email"
                      {...createFieldProps(form.register, form.formState.errors, 'email')}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      Submit Demo
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container max-w-4xl text-center py-16">
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold text-foreground">
                Find Your Perfect
                <span className="block text-primary">Gear Match</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get personalized gear recommendations based on your needs, budget, 
                and preferences. Our intelligent system analyzes multiple factors 
                to suggest the best equipment for your adventures.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="p-6 rounded-lg border border-border bg-card">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced algorithms analyze your requirements and preferences
                </p>
              </div>

              <div className="p-6 rounded-lg border border-border bg-card">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Budget Friendly</h3>
                <p className="text-sm text-muted-foreground">
                  Find the best value options within your budget range
                </p>
              </div>

              <div className="p-6 rounded-lg border border-border bg-card">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Trusted Results</h3>
                <p className="text-sm text-muted-foreground">
                  Recommendations based on proven methodologies and real data
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-8">
              <Button asChild size="lg" className="text-lg px-8 py-4">
                <Link href="/wizard">
                  Start Recommendation Wizard
                  <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </Button>
            </div>

            {/* Secondary Links */}
            <div className="pt-4 space-x-6">
              <Button variant="link" asChild>
                <Link href="/history">View History</Link>
              </Button>
              <span className="text-border">•</span>
              <Button variant="link" asChild>
                <Link href="/wizard">How it Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 Gear Recommendation System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}