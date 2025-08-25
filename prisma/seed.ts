import { PrismaClient, UserRole } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()



async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data (in reverse order of dependencies)
  await prisma.recommendationItem.deleteMany()
  await prisma.recommendation.deleteMany()
  await prisma.intake.deleteMany()
  await prisma.routeCriterionValue.deleteMany()
  await prisma.factorWeight.deleteMany()
  await prisma.criterion.deleteMany()
  await prisma.factor.deleteMany()
  await prisma.route.deleteMany()
  await prisma.mountain.deleteMany()
  await prisma.userProfile.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Cleaned existing data')

  

  // Create test users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hiking-gear.com',
      password: await bcrypt.hash('password123', 12),
      role: UserRole.ADMIN,
      profile: {
        create: {
          name: 'Admin User',
          location: 'Jakarta, Indonesia',
        },
      },
    },
  })

  const testUser = await prisma.user.create({
    data: {
      email: 'hiker@example.com',
      password: await bcrypt.hash('password123', 12),
      role: UserRole.USER,
      profile: {
        create: {
          name: 'Test Hiker',
          phone: '+62-812-3456-7890',
          location: 'Bandung, Indonesia',
        },
      },
    },
  })

  console.log('👥 Created users')

  // Create mountains
  const mountRinjani = await prisma.mountain.create({
    data: {
      name: 'Mount Rinjani',
      location: 'Lombok, West Nusa Tenggara',
      elevation: 3726,
      description: 'Second highest volcano in Indonesia, famous for its stunning crater lake.',
    },
  })

  const mountSemeru = await prisma.mountain.create({
    data: {
      name: 'Mount Semeru',
      location: 'East Java',
      elevation: 3676,
      description: 'Highest mountain in Java, known as Mahameru (Great Mountain).',
    },
  })

  const mountMerapi = await prisma.mountain.create({
    data: {
      name: 'Mount Merapi',
      location: 'Central Java / Yogyakarta',
      elevation: 2968,
      description: 'One of the most active volcanoes in Indonesia.',
    },
  })

  console.log('🏔️ Created mountains')

  // Create routes
  const rinjaniSummit = await prisma.route.create({
    data: {
      mountainId: mountRinjani.id,
      name: 'Rinjani Summit via Senaru',
      difficulty: 'Hard',
      distance: new Decimal('24.5'),
      duration: 18,
      description: '3D2N trek to summit with crater lake view.',
    },
  })

  const rinjaniCrater = await prisma.route.create({
    data: {
      mountainId: mountRinjani.id,
      name: 'Rinjani Crater Rim',
      difficulty: 'Moderate',
      distance: new Decimal('16.8'),
      duration: 12,
      description: '2D1N trek to crater rim.',
    },
  })

  const semeruSummit = await prisma.route.create({
    data: {
      mountainId: mountSemeru.id,
      name: 'Semeru Summit via Ranu Pane',
      difficulty: 'Expert',
      distance: new Decimal('28.0'),
      duration: 20,
      description: '4D3N challenging trek to Java\'s highest peak.',
    },
  })

  const merapiSummit = await prisma.route.create({
    data: {
      mountainId: mountMerapi.id,
      name: 'Merapi Summit via Selo',
      difficulty: 'Moderate',
      distance: new Decimal('8.4'),
      duration: 6,
      description: 'Day hike to active volcano summit.',
    },
  })

  console.log('🗺️ Created routes')

  // Create factors
  const physicalDemand = await prisma.factor.create({
    data: {
      name: 'Physical Demand',
      description: 'Factors related to physical difficulty and endurance requirements',
      order: 1,
    },
  })

  const logistics = await prisma.factor.create({
    data: {
      name: 'Logistics & Cost',
      description: 'Practical considerations including cost, duration, and accessibility',
      order: 2,
    },
  })

  const experience = await prisma.factor.create({
    data: {
      name: 'Experience Quality',
      description: 'Scenic beauty, uniqueness, and overall hiking experience',
      order: 3,
    },
  })

  console.log('📊 Created factors')

  // Create criteria for Physical Demand
  const difficultyLevel = await prisma.criterion.create({
    data: {
      factorId: physicalDemand.id,
      name: 'Difficulty Level',
      description: 'Technical difficulty rating (1=Easy, 5=Expert)',
      isBenefit: false, // lower difficulty is better for beginners
      weightInFactor: new Decimal('0.4'),
      unit: 'level',
      order: 1,
    },
  })

  const trekDistance = await prisma.criterion.create({
    data: {
      factorId: physicalDemand.id,
      name: 'Trek Distance',
      description: 'Total hiking distance in kilometers',
      isBenefit: false, // shorter distance preferred for easier hikes
      weightInFactor: new Decimal('0.3'),
      unit: 'km',
      order: 2,
    },
  })

  const elevation = await prisma.criterion.create({
    data: {
      factorId: physicalDemand.id,
      name: 'Elevation Gain',
      description: 'Total elevation gain in meters',
      isBenefit: false, // less elevation gain is easier
      weightInFactor: new Decimal('0.3'),
      unit: 'm',
      order: 3,
    },
  })

  // Create criteria for Logistics
  const estimatedCost = await prisma.criterion.create({
    data: {
      factorId: logistics.id,
      name: 'Estimated Cost',
      description: 'Total estimated cost including guides, permits, accommodation',
      isBenefit: false, // lower cost is better
      weightInFactor: new Decimal('0.5'),
      unit: 'IDR',
      order: 1,
    },
  })

  const duration = await prisma.criterion.create({
    data: {
      factorId: logistics.id,
      name: 'Trek Duration',
      description: 'Total time required in hours',
      isBenefit: false, // shorter duration more accessible
      weightInFactor: new Decimal('0.3'),
      unit: 'hours',
      order: 2,
    },
  })

  const accessibility = await prisma.criterion.create({
    data: {
      factorId: logistics.id,
      name: 'Accessibility',
      description: 'How easy to reach starting point (1=Hard, 5=Easy)',
      isBenefit: true, // higher accessibility is better
      weightInFactor: new Decimal('0.2'),
      unit: 'rating',
      order: 3,
    },
  })

  // Create criteria for Experience
  const scenicValue = await prisma.criterion.create({
    data: {
      factorId: experience.id,
      name: 'Scenic Value',
      description: 'Beauty and uniqueness of views (1-5 rating)',
      isBenefit: true, // higher scenic value is better
      weightInFactor: new Decimal('0.6'),
      unit: 'rating',
      order: 1,
    },
  })

  const crowding = await prisma.criterion.create({
    data: {
      factorId: experience.id,
      name: 'Crowding Level',
      description: 'How crowded the trail typically is (1=Empty, 5=Very Crowded)',
      isBenefit: false, // less crowding is better
      weightInFactor: new Decimal('0.4'),
      unit: 'rating',
      order: 2,
    },
  })

  console.log('📏 Created criteria')

  // Set factor weights (should sum to 1.0)
  await prisma.factorWeight.createMany({
    data: [
      { factorId: physicalDemand.id, weight: new Decimal('0.4') },
      { factorId: logistics.id, weight: new Decimal('0.3') },
      { factorId: experience.id, weight: new Decimal('0.3') },
    ],
  })

  console.log('⚖️ Created factor weights')

  // Create route criterion values - FIXED VALUES (smaller numbers)
  const routeCriterionValues = [
    // Rinjani Summit
    { routeId: rinjaniSummit.id, criterionId: difficultyLevel.id, value: '4.0' }, // Hard (1-5 scale)
    { routeId: rinjaniSummit.id, criterionId: trekDistance.id, value: '24.5' }, // 24.5 km
    { routeId: rinjaniSummit.id, criterionId: elevation.id, value: '2200.0' }, // 2200m elevation gain
    { routeId: rinjaniSummit.id, criterionId: estimatedCost.id, value: '2500.0' }, // 2.5M IDR (in thousands)
    { routeId: rinjaniSummit.id, criterionId: duration.id, value: '18.0' }, // 18 hours
    { routeId: rinjaniSummit.id, criterionId: accessibility.id, value: '3.0' }, // Moderate accessibility
    { routeId: rinjaniSummit.id, criterionId: scenicValue.id, value: '5.0' }, // Excellent views
    { routeId: rinjaniSummit.id, criterionId: crowding.id, value: '4.0' }, // Quite crowded

    // Rinjani Crater
    { routeId: rinjaniCrater.id, criterionId: difficultyLevel.id, value: '3.0' }, // Moderate
    { routeId: rinjaniCrater.id, criterionId: trekDistance.id, value: '16.8' }, // 16.8 km
    { routeId: rinjaniCrater.id, criterionId: elevation.id, value: '1800.0' }, // 1800m elevation gain
    { routeId: rinjaniCrater.id, criterionId: estimatedCost.id, value: '2000.0' }, // 2M IDR (in thousands)
    { routeId: rinjaniCrater.id, criterionId: duration.id, value: '12.0' }, // 12 hours
    { routeId: rinjaniCrater.id, criterionId: accessibility.id, value: '3.0' }, // Moderate accessibility
    { routeId: rinjaniCrater.id, criterionId: scenicValue.id, value: '4.0' }, // Good views
    { routeId: rinjaniCrater.id, criterionId: crowding.id, value: '3.0' }, // Moderately crowded

    // Semeru Summit
    { routeId: semeruSummit.id, criterionId: difficultyLevel.id, value: '5.0' }, // Expert
    { routeId: semeruSummit.id, criterionId: trekDistance.id, value: '28.0' }, // 28 km
    { routeId: semeruSummit.id, criterionId: elevation.id, value: '2400.0' }, // 2400m elevation gain
    { routeId: semeruSummit.id, criterionId: estimatedCost.id, value: '3000.0' }, // 3M IDR (in thousands)
    { routeId: semeruSummit.id, criterionId: duration.id, value: '20.0' }, // 20 hours
    { routeId: semeruSummit.id, criterionId: accessibility.id, value: '2.0' }, // Difficult access
    { routeId: semeruSummit.id, criterionId: scenicValue.id, value: '5.0' }, // Excellent views
    { routeId: semeruSummit.id, criterionId: crowding.id, value: '2.0' }, // Less crowded

    // Merapi Summit
    { routeId: merapiSummit.id, criterionId: difficultyLevel.id, value: '3.0' }, // Moderate
    { routeId: merapiSummit.id, criterionId: trekDistance.id, value: '8.4' }, // 8.4 km
    { routeId: merapiSummit.id, criterionId: elevation.id, value: '1400.0' }, // 1400m elevation gain
    { routeId: merapiSummit.id, criterionId: estimatedCost.id, value: '800.0' }, // 800K IDR (in thousands)
    { routeId: merapiSummit.id, criterionId: duration.id, value: '6.0' }, // 6 hours
    { routeId: merapiSummit.id, criterionId: accessibility.id, value: '4.0' }, // Good accessibility
    { routeId: merapiSummit.id, criterionId: scenicValue.id, value: '4.0' }, // Good views
    { routeId: merapiSummit.id, criterionId: crowding.id, value: '3.0' }, // Moderately crowded
  ]

  for (const rcv of routeCriterionValues) {
    await prisma.routeCriterionValue.create({
      data: {
        routeId: rcv.routeId,
        criterionId: rcv.criterionId,
        valueDecimal: new Decimal(rcv.value),
      },
    })
  }

  console.log('🎯 Created route criterion values')

  // Create a sample intake and recommendation
  const sampleIntake = await prisma.intake.create({
    data: {
      userId: testUser.id,
      answersJson: {
        experience_level: 'intermediate',
        fitness_level: 4,
        budget_range: '2000000-3000000',
        time_available: '2-3 days',
        group_size: 2,
        preferred_difficulty: 'moderate',
        interests: ['scenic_views', 'photography'],
        concerns: ['weather', 'altitude'],
      },
    },
  })

  const sampleRecommendation = await prisma.recommendation.create({
    data: {
      intakeId: sampleIntake.id,
      userId: testUser.id,
      topsisScoreJson: {
        normalized_matrix: {},
        weighted_matrix: {},
        ideal_solutions: {},
        distances: {},
        final_scores: {},
      },
      items: {
        create: [
          {
            routeId: rinjaniCrater.id,
            rank: 1,
            score: new Decimal('0.825'),
          },
          {
            routeId: merapiSummit.id,
            rank: 2,
            score: new Decimal('0.742'),
          },
          {
            routeId: rinjaniSummit.id,
            rank: 3,
            score: new Decimal('0.634'),
          },
          {
            routeId: semeruSummit.id,
            rank: 4,
            score: new Decimal('0.453'),
          },
        ],
      },
    },
  })

  console.log('🎯 Created sample intake and recommendation')

  // Print summary
  const counts = {
    users: await prisma.user.count(),
    mountains: await prisma.mountain.count(),
    routes: await prisma.route.count(),
    factors: await prisma.factor.count(),
    criteria: await prisma.criterion.count(),
    factorWeights: await prisma.factorWeight.count(),
    routeCriterionValues: await prisma.routeCriterionValue.count(),
    intakes: await prisma.intake.count(),
    recommendations: await prisma.recommendation.count(),
    recommendationItems: await prisma.recommendationItem.count(),
  }

  console.log('✅ Seed completed successfully!')
  console.log('📊 Database summary:', counts)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })