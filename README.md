# Hiking Gear Recommendation System

A comprehensive web application for personalized hiking route recommendations using TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution) multi-criteria decision analysis.

## Features

- **Intelligent Recommendation Engine**: Uses TOPSIS algorithm to analyze multiple criteria
- **Dynamic Questionnaire**: Adaptive questions based on user experience level
- **Comprehensive Analysis**: Considers physical demand, logistics, cost, and experience quality
- **User Authentication**: Secure login/register system with NextAuth.js
- **Recommendation History**: Track and manage past recommendations
- **Detailed Results**: Complete analysis with explanations and gear recommendations
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL
- **Authentication**: NextAuth.js with credentials provider
- **UI Components**: Radix UI primitives with custom styling
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack Query for server state

## Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL database
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd hiking-gear-recommendation
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database and authentication settings:
```env
DATABASE_URL="mysql://username:password@localhost:3306/hiking_gear_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

4. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed
```

5. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Accounts

After seeding the database, you can use these demo accounts:

- **Admin**: admin@hiking-gear.com / password123
- **User**: hiker@example.com / password123

## Usage

1. **Home Page**: Overview of the system and features
2. **Recommendation Wizard**: Complete the adaptive questionnaire
3. **Results Page**: View detailed recommendations with TOPSIS analysis
4. **History Page**: Manage your past recommendations (requires login)
5. **Authentication**: Register/login to save recommendations

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── wizard/            # Recommendation wizard
│   ├── result/            # Results pages
│   └── history/           # User history
├── components/            # React components
├── lib/                   # Utilities and UI components
├── server/                # Server-side logic
│   ├── auth/             # Authentication
│   ├── db.ts             # Database connection
│   ├── security/         # Security middleware
│   └── services/         # Business logic
└── types/                # TypeScript definitions
```

## Key Features Explained

### TOPSIS Algorithm
The system uses TOPSIS multi-criteria decision analysis to rank hiking routes based on:
- **Physical Demand**: Difficulty, distance, elevation gain
- **Logistics & Cost**: Total cost, duration, accessibility
- **Experience Quality**: Scenic value, crowding level

### Dynamic Questionnaire
Questions adapt based on user responses:
- Beginners get safety-focused questions
- Experts get technical challenge questions
- Budget considerations adjust cost-related queries

### Comprehensive Cost Analysis
Automatic cost calculation including:
- Transportation (based on distance)
- Permits and fees
- Guide services
- Accommodation
- Meals and equipment rental

## Database Schema

The application uses a comprehensive schema with:
- User management with profiles
- Mountain and route data
- Multi-criteria decision framework
- Recommendation storage with TOPSIS results

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the GitHub repository.