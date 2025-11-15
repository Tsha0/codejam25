# Authentication Page

A modern, stylish login and sign-up page designed with MongoDB authentication in mind.

## Features

### 🎨 Design
- Clean, modern UI with smooth animations
- Animated gradient background with pulsing effects
- Glassmorphism card design with backdrop blur
- Fully responsive layout
- Dark mode compatible

### 🔐 Authentication Fields

#### Sign In
- Email address
- Password
- "Forgot password?" link

#### Sign Up
- Full name
- Email address
- Password
- Confirm password

### 🔗 OAuth Integration (Ready for Implementation)
- GitHub OAuth button
- Google OAuth button

### ✨ User Experience
- Smooth toggle between Sign In and Sign Up modes
- Loading states with spinner animation
- Hover and focus states for all interactive elements
- Button scale animations for feedback
- Form validation (HTML5 + ready for custom validation)

## MongoDB Schema Preparation

The form is designed to work with a MongoDB user schema like:

```typescript
interface User {
  _id: ObjectId
  name: string
  email: string
  password: string  // Should be hashed with bcrypt
  createdAt: Date
  updatedAt: Date
  // Optional fields for OAuth
  googleId?: string
  githubId?: string
}
```

## Usage

Navigate to `/auth` in your application:

```bash
npm run dev
# Visit http://localhost:3000/auth
```

## Implementation Checklist

When you're ready to connect to your backend:

- [ ] Set up MongoDB database
- [ ] Create User model/schema
- [ ] Implement password hashing (bcrypt)
- [ ] Set up JWT or session-based authentication
- [ ] Create API routes for:
  - [ ] `/api/auth/signup`
  - [ ] `/api/auth/login`
  - [ ] `/api/auth/logout`
  - [ ] `/api/auth/forgot-password`
- [ ] Implement OAuth providers:
  - [ ] GitHub OAuth
  - [ ] Google OAuth
- [ ] Add form validation
- [ ] Add error handling and user feedback
- [ ] Set up protected routes

## Backend Integration Example

```typescript
// Example API route structure (Next.js App Router)
// app/api/auth/signup/route.ts

import { NextResponse } from 'next/server'
import { connectToMongoDB } from '@/lib/mongodb'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()
    
    // Connect to MongoDB
    const db = await connectToMongoDB()
    
    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create user
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    return NextResponse.json(
      { message: 'User created successfully', userId: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Customization

### Colors
The page uses your application's design tokens from `globals.css`. All colors automatically adapt to your theme.

### Add More OAuth Providers
To add more OAuth providers, follow the pattern of the existing GitHub and Google buttons:

```tsx
<Button
  type="button"
  variant="outline"
  disabled={isLoading}
  onClick={() => console.log("Provider OAuth")}
  className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
>
  <YourProviderIcon className="w-4 h-4" />
  Provider Name
</Button>
```

## Security Notes

⚠️ **Important security considerations for backend implementation:**

1. **Never store plain-text passwords** - Always use bcrypt or argon2
2. **Validate on the server** - Don't trust client-side validation alone
3. **Use HTTPS** - Especially important for production
4. **Implement rate limiting** - Prevent brute force attacks
5. **Use CSRF tokens** - Protect against cross-site request forgery
6. **Set secure cookies** - Use httpOnly, secure, and sameSite flags
7. **Implement email verification** - Confirm user email addresses
8. **Add 2FA option** - For enhanced security

## Dependencies

- `@radix-ui/react-label` - Accessible label component
- `class-variance-authority` - For component variants
- `tailwind-merge` - For className merging

All other dependencies are already in your project.

