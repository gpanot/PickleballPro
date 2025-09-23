# 🏓 PicklePro MVP Backend & Admin PRD
*Minimum Viable Product - Backend Infrastructure and Admin Dashboard*

---

## 1. 🎯 MVP Objective

Deliver a **streamlined backend and admin system** to support the current PicklePro mobile app with essential features for user management, content delivery, and basic analytics. This MVP focuses on core functionality without payment processing, providing a solid foundation for future enhancements.

### Key MVP Goals
- **User Management**: Registration, authentication, and profile management
- **Content Delivery**: Serve predefined programs and exercises from Explore screen (read-only)
- **Local Program Storage**: Users add programs locally without server-side tracking
- **Progress Tracking**: Log and track user exercise completion only
- **Coach Directory**: Basic coach profiles and discovery
- **Admin Dashboard**: Essential content management and user oversight
- **Data Analytics**: Basic user engagement and content performance metrics

### What's NOT in MVP
- ❌ Payment processing and subscriptions
- ❌ Server-side program/routine storage (handled locally on device)
- ❌ Advanced analytics and business intelligence
- ❌ Real-time coaching features
- ❌ Social features and user communities
- ❌ Advanced AI recommendations
- ❌ Video analysis capabilities

---

## 2. 🏗️ MVP System Architecture

### Simplified Architecture
```
┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Admin Web     │
│  (React Native) │    │    (React)      │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (Supabase)    │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │  Core Backend   │    │  File Storage   │
│   (Supabase)    │    │  (Supabase)     │    │  (Supabase)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (Supabase)    │
                    └─────────────────┘
```

### MVP Core Components

#### 1. **API Gateway & Backend (Supabase)**
- **REST API**: Auto-generated from PostgreSQL schema
- **Authentication**: JWT-based auth with basic user roles
- **Row Level Security**: Basic data access control
- **Edge Functions**: Minimal custom logic for DUPR integration

#### 2. **Database (PostgreSQL)**
- **Core tables**: Users, programs, exercises, progress tracking
- **Simplified schema**: Focus on essential relationships
- **Basic indexing**: Performance optimization for common queries

#### 3. **File Storage (Supabase Storage)**
- **Exercise media**: Videos, images, and thumbnails
- **Basic CDN**: Content delivery for mobile app
- **Simple access control**: Public read access for published content

#### 4. **External Integrations (MVP)**
- **DUPR API**: Basic rating sync (if available)
- **Email service**: Simple notifications via Supabase
- **Basic analytics**: Essential usage tracking

---

## 3. 📱 MVP Data Storage Strategy

### Local vs Server Storage

#### **Local Storage (Device)**
- **User Programs**: Programs added from Explore are stored locally
- **Program Progress**: Routine completion, current position stored on device
- **Custom Programs**: User-created programs remain local
- **App Settings**: User preferences and configuration

#### **Server Storage (Database)**
- **User Profiles**: Authentication and basic profile data
- **Published Content**: Programs, routines, exercises from admin
- **Exercise Progress**: Individual exercise completions (for analytics)
- **Logbook Entries**: Training session logs
- **Coach Profiles**: Coach directory information

### Benefits of Hybrid Approach
- ✅ **Reduced API Calls**: No server requests for program management
- ✅ **Offline Capability**: Programs work without internet
- ✅ **Faster Performance**: Local data access is instant
- ✅ **Simplified Backend**: Less complex data relationships
- ✅ **Better UX**: No loading states for program navigation

### Example User Flow
```
1. User opens Explore screen
   → API call: GET /programs (list of published programs)

2. User taps "Ben Johns Pro Training"
   → API call: GET /programs/ben_johns_program (full program data)
   → App stores complete program data locally

3. User adds program to "Your Programs"
   → No API call - stored locally in AsyncStorage/SQLite

4. User navigates program routines/exercises
   → No API calls - all data available locally

5. User completes an exercise
   → API call: POST /exercises/:id/complete (for analytics only)
```

---

## 4. 🗄️ MVP Database Schema

### Core MVP Tables

#### **users** (User Profiles)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  
  -- DUPR Integration (optional in MVP)
  dupr_id TEXT UNIQUE,
  dupr_rating DECIMAL(2,1),
  dupr_synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Basic profile
  tier TEXT CHECK (tier IN ('Beginner', 'Intermediate', 'Advanced', 'Pro')),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  rating_type TEXT CHECK (rating_type IN ('dupr', 'self', 'none')),
  
  -- Onboarding (from current app)
  goal TEXT CHECK (goal IN ('dupr', 'basics', 'consistency', 'tournament')),
  time_commitment TEXT CHECK (time_commitment IN ('low', 'medium', 'high')),
  focus_areas JSONB DEFAULT '[]',
  coach_preference TEXT CHECK (coach_preference IN ('yes', 'no')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **programs** (Predefined Training Programs)
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'Pro Training', 'Fundamentals'
  tier TEXT CHECK (tier IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
  
  -- Display info
  thumbnail_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  added_count INTEGER DEFAULT 0,
  
  -- Content organization
  tags JSONB DEFAULT '[]',
  order_index INTEGER DEFAULT 0,
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Creator
  created_by UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **routines** (Sessions within Programs)
```sql
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  time_estimate_minutes INTEGER,
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **exercises** (Individual Drills)
```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g., "1.1", "ben1.2"
  title TEXT NOT NULL,
  description TEXT,
  goal_text TEXT,
  instructions TEXT, -- Markdown format
  
  -- Target configuration
  target_type TEXT CHECK (target_type IN ('count', 'streak', 'percent', 'passfail', 'time')),
  target_value INTEGER,
  target_unit TEXT, -- 'shots', 'seconds', 'percent'
  
  -- Difficulty
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  requires_coach BOOLEAN DEFAULT false,
  
  -- Media
  demo_video_url TEXT,
  demo_image_url TEXT,
  thumbnail_url TEXT,
  
  -- Categorization
  skill_category TEXT, -- 'dinks', 'drives', 'serves', 'returns', 'volleys'
  tier_level TEXT CHECK (tier_level IN ('Beginner', 'Intermediate', 'Advanced', 'Pro')),
  tags JSONB DEFAULT '[]',
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  
  -- Creator
  created_by UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **routine_exercises** (Junction Table)
```sql
CREATE TABLE routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  
  -- Custom settings for this routine
  custom_target_value INTEGER,
  is_optional BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(routine_id, exercise_id)
);
```

-- ❌ user_programs table NOT needed in MVP
-- Programs are stored locally on device after being fetched from Explore
-- This eliminates the need for user_programs API calls and simplifies the system

#### **user_progress** (Exercise Completion)
```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  routine_id UUID REFERENCES routines(id), -- Optional
  
  -- Result data
  result_value INTEGER,
  target_value INTEGER,
  passed BOOLEAN NOT NULL,
  attempts INTEGER DEFAULT 1,
  
  -- Context
  session_type TEXT DEFAULT 'practice', -- 'practice', 'routine', 'custom'
  notes TEXT,
  feeling_rating INTEGER CHECK (feeling_rating BETWEEN 1 AND 5),
  
  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_user_progress_user_exercise (user_id, exercise_id),
  INDEX idx_user_progress_completed (completed_at)
);
```

#### **coaches** (Basic Coach Profiles)
```sql
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Profile
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  
  -- Credentials
  dupr_rating DECIMAL(2,1),
  specialties JSONB DEFAULT '[]', -- ['Technique', 'Mental Game', 'Beginners']
  
  -- Contact info
  hourly_rate INTEGER, -- in cents (for display only in MVP)
  location TEXT,
  email TEXT,
  phone TEXT,
  
  -- Ratings (calculated from reviews)
  rating_avg DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **logbook_entries** (Training Session Logs)
```sql
CREATE TABLE logbook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session details
  date DATE NOT NULL,
  hours DECIMAL(3,1) NOT NULL,
  session_type TEXT CHECK (session_type IN ('single', 'double', 'class', 'social')),
  training_focus TEXT CHECK (training_focus IN ('dinks', 'drives', 'serves', 'returns', 'volleys')),
  
  -- Subjective data
  feeling INTEGER CHECK (feeling BETWEEN 1 AND 5),
  notes TEXT,
  
  -- Location
  location TEXT,
  
  -- Linked data
  routine_id UUID REFERENCES routines(id), -- If part of structured routine
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_logbook_user_date (user_id, date)
);
```

#### **admin_users** (Admin Access)
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Simple role system for MVP
  role TEXT CHECK (role IN ('admin', 'content_editor')) NOT NULL DEFAULT 'content_editor',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id)
);
```

### Supporting MVP Tables

#### **user_badges** (Achievement System)
```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- 'level_complete', 'tier_complete', 'streak'
  badge_data JSONB NOT NULL, -- Badge-specific data
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, badge_type, badge_data)
);
```

---

## 4. 🔧 MVP API Endpoints

### Authentication & Users
```
POST   /auth/signup                 # User registration
POST   /auth/signin                 # User login
POST   /auth/signout                # User logout
GET    /auth/user                   # Get current user
PUT    /auth/user                   # Update user profile
POST   /auth/dupr/sync              # Sync DUPR rating (if available)
```

### Programs & Content (Read-Only)
```
GET    /programs                    # List published programs for Explore screen
GET    /programs/:id                # Get program details with full routine/exercise data
GET    /programs/:id/routines       # Get program routines
GET    /routines/:id                # Get routine details
GET    /routines/:id/exercises      # Get routine exercises with full details
```

### Exercises & Progress
```
GET    /exercises                   # List exercises (with basic filters)
GET    /exercises/:id               # Get exercise details
POST   /exercises/:id/complete      # Log exercise completion
GET    /progress                    # Get user progress summary
GET    /progress/exercises          # Get exercise progress history
GET    /progress/badges             # Get user badges
```

### Coaches (Read-Only in MVP)
```
GET    /coaches                     # List coaches (with basic filters)
GET    /coaches/:id                 # Get coach profile
```

### Logbook
```
GET    /logbook                     # Get user logbook entries
POST   /logbook                     # Create logbook entry
PUT    /logbook/:id                 # Update logbook entry
DELETE /logbook/:id                 # Delete logbook entry
GET    /logbook/summary             # Get logbook statistics
```

### Admin API (MVP)
```
# Content Management
GET    /admin/programs              # List all programs
POST   /admin/programs              # Create program
PUT    /admin/programs/:id          # Update program
DELETE /admin/programs/:id          # Delete program
POST   /admin/programs/:id/publish  # Publish program

GET    /admin/exercises             # List all exercises
POST   /admin/exercises             # Create exercise
PUT    /admin/exercises/:id         # Update exercise
DELETE /admin/exercises/:id         # Delete exercise

# Coach Management
GET    /admin/coaches               # List all coaches
POST   /admin/coaches               # Create coach profile
PUT    /admin/coaches/:id           # Update coach
DELETE /admin/coaches/:id           # Delete coach

# User Management
GET    /admin/users                 # List users (basic info)
GET    /admin/users/:id             # Get user details
PUT    /admin/users/:id             # Update user (admin actions)

# Basic Analytics
GET    /admin/analytics/overview    # Basic dashboard metrics
GET    /admin/analytics/users       # User registration and activity
GET    /admin/analytics/content     # Content usage statistics
```

---

## 5. 🖥️ MVP Admin Dashboard Features

### Dashboard Overview
- **Key Metrics**: Total users, published programs, active exercises
- **Recent Activity**: New user registrations, content updates
- **Quick Actions**: Publish content, add coaches
- **System Status**: Basic health indicators

### Content Management (MVP)

#### **Program Manager**
- **Program List**: View all programs with status indicators
- **Create Program**: Simple form to create new programs
- **Edit Program**: Update program details and settings
- **Routine Management**: Add/remove routines within programs
- **Exercise Assignment**: Assign exercises to routines
- **Publish/Unpublish**: Control content visibility

#### **Exercise Library**
- **Exercise List**: Browse all exercises with filters
- **Create Exercise**: Form-based exercise creation
- **Edit Exercise**: Update exercise details and media
- **Media Upload**: Simple file upload for videos/images
- **Categorization**: Tag and categorize exercises
- **Bulk Actions**: Publish/unpublish multiple exercises

### User Management (MVP)
- **User List**: View registered users with basic info
- **User Details**: View individual user progress and activity
- **Basic Actions**: Activate/deactivate users
- **Search & Filter**: Find users by name, email, or registration date

### Coach Management (MVP)
- **Coach Directory**: List all coach profiles
- **Add Coach**: Create new coach profiles
- **Edit Coach**: Update coach information
- **Verification**: Mark coaches as verified
- **Status Management**: Activate/deactivate coach profiles

### Analytics (MVP)
- **User Metrics**: Registration trends, active users
- **Content Performance**: Most popular programs and exercises
- **Engagement Stats**: Exercise completion rates
- **Basic Reports**: Simple data exports

---

## 6. 🔐 MVP Security & Permissions

### Authentication
- **JWT Tokens**: Supabase Auth integration
- **Basic Roles**: User, Admin, Content Editor
- **Row Level Security**: Basic data access control
- **Session Management**: Standard session handling

### Data Protection
- **HTTPS Only**: All communications encrypted
- **Basic Input Validation**: Prevent common attacks
- **File Upload Security**: Basic file type validation
- **Rate Limiting**: Basic API rate limiting

### Admin Security
- **Admin Authentication**: Separate admin login
- **Role-Based Access**: Content editors vs full admins
- **Activity Logging**: Basic admin action tracking

---

## 7. 📊 MVP Analytics & Monitoring

### Basic Monitoring
- **API Health**: Endpoint availability and response times
- **Database Performance**: Basic query performance
- **Error Tracking**: Log and track application errors
- **User Activity**: Basic usage patterns

### Business Metrics (MVP)
- **User Growth**: Registration and retention trends
- **Content Engagement**: Exercise completions (individual exercises only)
- **Exercise Performance**: Completion rates by exercise type
- **Coach Discovery**: Coach profile views
- **Content Discovery**: Program views from Explore screen

---

## 8. 🚀 MVP Deployment Strategy

### Environment Setup
- **Development**: Local development with Supabase
- **Staging**: Pre-production testing
- **Production**: Supabase Cloud deployment

### MVP Hosting
- **Supabase Cloud**: Managed PostgreSQL and API
- **Supabase Storage**: File hosting with CDN
- **Simple Scaling**: Basic auto-scaling features

### CI/CD (MVP)
- **Version Control**: Git-based development
- **Basic Testing**: Essential unit tests
- **Deployment Pipeline**: Simple automated deployment
- **Database Migrations**: Version-controlled schema changes

---

## 9. 📋 MVP Implementation Timeline

### Phase 1: Foundation (Weeks 1-3)
- **Database Setup**: Create core tables and relationships
- **Authentication**: User registration and login
- **Basic API**: Core CRUD operations for programs/exercises
- **Admin Setup**: Basic admin dashboard structure

### Phase 2: Content System (Weeks 4-6)
- **Program Management**: Create and manage training programs
- **Exercise Library**: Exercise creation and organization
- **Content Publishing**: Publish programs to mobile app
- **Media Upload**: Basic file upload for exercise media

### Phase 3: User Features (Weeks 7-9)
- **Progress Tracking**: Exercise completion and progress
- **Logbook Integration**: Training session logging
- **Coach Directory**: Basic coach profiles and discovery
- **User Dashboard**: Basic user management features

### Phase 4: Polish & Launch (Weeks 10-12)
- **Mobile Integration**: Connect mobile app to backend
- **Basic Analytics**: Essential metrics and reporting
- **Testing & QA**: Comprehensive testing
- **Documentation**: API and admin documentation
- **Launch Preparation**: Production deployment

---

## 10. 🎯 MVP Success Metrics

### Technical Metrics
- **API Performance**: < 300ms average response time
- **Uptime**: 99.5% availability
- **Error Rate**: < 1% error rate
- **User Capacity**: Support 1,000+ registered users

### Business Metrics
- **Content Creation**: 50+ exercises, 10+ programs at launch
- **User Engagement**: 50%+ users complete first exercise
- **Content Discovery**: 70%+ users browse Explore programs
- **Local Adoption**: 60%+ users add programs locally from Explore
- **Admin Efficiency**: 80% reduction in manual content management

### User Experience Metrics
- **Onboarding**: 80%+ users complete registration
- **Content Access**: 90%+ programs load successfully
- **Progress Tracking**: 70%+ users log exercise results
- **Coach Discovery**: 40%+ users view coach profiles

---

## 11. 🔮 Post-MVP Roadmap

### Immediate Next Steps (After MVP)
- **Enhanced Analytics**: Detailed user behavior tracking
- **Advanced Content Features**: Video streaming, interactive exercises
- **Improved Admin Tools**: Bulk operations, advanced filtering
- **Performance Optimization**: Caching, query optimization

### Future Enhancements
- **Payment Integration**: Subscription system (from full PRD)
- **Real-time Features**: Live progress updates
- **Social Features**: User communities and challenges
- **AI Recommendations**: Personalized program suggestions
- **Advanced Coach Features**: Booking and communication tools

---

## 12. 💡 MVP vs Full System Comparison

| Feature | MVP | Full System |
|---------|-----|-------------|
| **User Management** | Basic profiles | Advanced profiles + preferences |
| **Content System** | Static programs | Dynamic, personalized content |
| **Payment Processing** | ❌ None | ✅ Full subscription system |
| **Analytics** | Basic metrics | Advanced BI and reporting |
| **Coach Features** | Directory only | Booking, payments, communication |
| **Real-time Features** | ❌ None | ✅ Live updates and notifications |
| **Admin Dashboard** | Essential tools | Comprehensive management suite |
| **Mobile Integration** | Basic API | Advanced features and offline sync |

---

This MVP PRD provides a focused, achievable foundation that supports your current mobile app while establishing the infrastructure for future growth. The streamlined approach ensures faster time-to-market while maintaining the flexibility to add advanced features later.

**Key MVP Benefits:**
- ✅ **Fast Launch**: 12-week implementation timeline
- ✅ **Cost Effective**: Minimal infrastructure and development costs
- ✅ **Scalable Foundation**: Easy to extend with payment and advanced features
- ✅ **User Validation**: Test core concepts before major investment
- ✅ **Learning Platform**: Gather user feedback for future enhancements
