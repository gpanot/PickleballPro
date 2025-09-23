# PicklePro Training Programs Data Structure

> **Purpose**: This document extracts the Program > Routine(s) > Exercise(s) hierarchy from the ExploreTrainingScreen.js and related files for future Supabase database implementation.

---

## 📊 Database Schema Overview

### **Programs** (Training Programs)
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'Pro Training', 'Fundamentals'
  tier TEXT, -- 'Beginner', 'Intermediate', 'Advanced', 'Elite'
  thumbnail_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  added_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Routines** (Sessions within Programs)
```sql
CREATE TABLE routines (
  id UUID PRIMARY KEY,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  time_estimate_minutes INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Exercises** (Individual Drills)
```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g., "1.1", "ben1.2"
  title TEXT NOT NULL,
  description TEXT,
  goal_text TEXT,
  instructions TEXT,
  target_type TEXT, -- 'count', 'streak', 'percent', 'passfail', 'time'
  target_value INTEGER,
  target_unit TEXT, -- 'shots', 'seconds', 'percent'
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  requires_coach BOOLEAN DEFAULT false,
  skill_category TEXT, -- 'dinks', 'drives', 'serves', 'returns', 'volleys'
  tier_level TEXT, -- 'Beginner', 'Intermediate', 'Advanced', 'Pro'
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Routine_Exercises** (Junction Table)
```sql
CREATE TABLE routine_exercises (
  id UUID PRIMARY KEY,
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  custom_target_value INTEGER,
  is_optional BOOLEAN DEFAULT false,
  UNIQUE(routine_id, exercise_id)
);
```

---

## 🏆 Sample Programs to Import

### **Program 1: Master the Soft Game (4 weeks)**
```json
{
  "name": "Master the Soft Game (4 weeks)",
  "description": "Focus on developing consistent dinking, drop shots, and net play fundamentals",
  "category": "Fundamentals",
  "tier": "Intermediate",
  "rating": 4.5,
  "added_count": 2156,
  "routines": [...]
}
```

#### **Routine 1.1: Session A - Dinking Focus**
- **Description**: Build consistency and accuracy in dinking exchanges
- **Time Estimate**: 30 minutes
- **Order Index**: 1

**Exercises:**
1. **Target Dinks** (1.1)
   - Target: "20 in zone"
   - Difficulty: 2
   - Description: "Practice dinking to specific target areas"

2. **Dink & Move** (1.2)
   - Target: "10 each side"
   - Difficulty: 3
   - Description: "Dink while moving laterally"

3. **Skinny Singles** (s3.1)
   - Target: "play to 11"
   - Difficulty: 3
   - Description: "Practice game situations"

#### **Routine 1.2: Session B - Drop Shot Focus**
- **Description**: Master the critical third shot drop
- **Time Estimate**: 35 minutes
- **Order Index**: 2

**Exercises:**
1. **3rd Shot Drop** (7.1)
   - Target: "15 in a row"
   - Difficulty: 3
   - Description: "Consecutive drops into kitchen"

2. **Drop-Advance** (7.2)
   - Target: "10 sequences"
   - Difficulty: 4
   - Description: "Drop then advance to net"

3. **Transition Zone Reset** (s5.3)
   - Target: "15 resets"
   - Difficulty: 3
   - Description: "Reset from transition zone"

#### **Routine 1.3: Session C - Net Defense & Speed**
- **Description**: Develop quick reflexes and defensive skills at the net
- **Time Estimate**: 40 minutes
- **Order Index**: 3

**Exercises:**
1. **Block Volleys** (v1)
   - Target: "10 blocks"
   - Difficulty: 3
   - Description: "Defensive volley blocks"

2. **Speed Up & Reset** (s3.2)
   - Target: "10 resets"
   - Difficulty: 4
   - Description: "Counter speed-ups with resets"

3. **Live Point Pressure** (s6.3)
   - Target: "start 9-9, win 3"
   - Difficulty: 4
   - Description: "High pressure point situations"

---

## 🎯 Exercise Library by Category

### **Dinks**
| Code | Title | Target | Difficulty | Description |
|------|-------|--------|------------|-------------|
| 1.1 | Dink Wall Drill | 15 consecutive soft dinks | 2 | Practice consistent dinking against a wall |
| 1.2 | Cross-Court Dinks | 8 consecutive cross-court dinks | 2 | Develop cross-court dinking accuracy |
| 1.3 | Dink Targets | 6/12 land in NVZ cones | 3 | Precision dinking to specific targets |
| s3.1 | Advanced Cross-Court Dinks | 12/15 in NVZ | 3 | From Net Play Excellence session |

### **Drives**
| Code | Title | Target | Difficulty | Description |
|------|-------|--------|------------|-------------|
| 2.1 | FH Drive Depth | 7/10 beyond NVZ | 2 | Forehand drive depth control |
| 2.2 | BH Drive Depth | 6/10 beyond NVZ | 3 | Backhand drive depth control |
| 2.3 | Drive & Recover | 5-drive sequence | 3 | Drive and return to ready position |
| s4.1 | Power Drive Targets | 7/12 to corners | 4 | From Power & Placement session |

### **Serves**
| Code | Title | Target | Difficulty | Description |
|------|-------|--------|------------|-------------|
| 6.1 | Deep Serve Mastery | 7/10 in back third | 3 | Consistent deep serving |
| 6.2 | Spin Serve | 5/10 with visible spin | 4 | Develop spin serve technique |
| 6.3 | Serve Placement Drill | 4/6 to chosen corner | 3 | Precise serve placement |
| s1.1 | Corner Placement Serves | 8/12 to chosen corners | 3 | From Serve & Return Mastery session |

### **Returns**
| Code | Title | Target | Difficulty | Description |
|------|-------|--------|------------|-------------|
| s1.2 | Deep Return Practice | 7/10 past midline | 3 | Return serves deep into court |
| s1.3 | Return & Approach | 5/8 successful approaches | 4 | Return and move to net |
| r1 | Defensive Returns | 6/10 successful defensive returns | 3 | Master defensive return shots |

### **Volleys**
| Code | Title | Target | Difficulty | Description |
|------|-------|--------|------------|-------------|
| s3.2 | Volley Positioning | 8/10 clean volleys | 3 | Perfect volley positioning |
| s3.3 | Attack the High Ball | 6/8 putaway attempts | 4 | Aggressive high ball volleys |
| v1 | Reflex Volleys | 10/15 quick volleys | 4 | Improve volley reaction time |

### **Other Skills**
| Code | Title | Target | Difficulty | Description |
|------|-------|--------|------------|-------------|
| 7.1 | Drop Consistency | 6/10 into NVZ | 3 | Master the critical third shot |
| 7.2 | Target Drops | 4/10 to backhand corner | 4 | Precision third shot drops |
| s4.2 | Lob Placement | 5/8 over opponent | 3 | Effective lob placement |
| s5.3 | Court Positioning | 8/10 optimal positions | 4 | Maintain optimal court position |
| s6.3 | Endurance Rally | 25+ shot rallies | 4 | Long rally endurance training |

---

## 🔄 Current Integration Status

### **API Integration**
- ✅ ExploreTrainingScreen.js fetches programs from Supabase
- ✅ `getPrograms()` and `transformProgramData()` functions implemented
- ✅ Loading states, error handling, and retry functionality

### **Sample Data in Database**
According to INTEGRATION_SUCCESS.md, the following sample programs are already loaded:

1. **Ben Johns Pro Training** (Elite) - 4.8★ - 15,685 added
   - 2 routines, 5 exercises

2. **Meghan Dizon Fundamentals** (Advanced) - 4.6★ - 8,934 added
   - 2 routines, 5 exercises

3. **Beginner Basics** (Beginner) - 4.5★ - 12,543 added

4. **Court Movement Mastery** (Intermediate) - 4.3★ - 8,291 added

### **Data Transformation**
The `transformProgramData()` function in `src/lib/supabase.js` handles the conversion from Supabase format to app format:

```javascript
export const transformProgramData = (programs) => {
  return programs.map(program => ({
    id: program.id,
    name: program.name,
    description: program.description,
    category: program.category,
    tier: program.tier,
    thumbnail: null,
    rating: parseFloat(program.rating),
    addedCount: program.added_count,
    routines: program.routines
      .sort((a, b) => a.order_index - b.order_index)
      .map(routine => ({
        id: routine.id,
        name: routine.name,
        description: routine.description,
        timeEstimate: `${routine.time_estimate_minutes} min`,
        exercises: routine.routine_exercises
          .sort((a, b) => a.order_index - b.order_index)
          .map(re => ({
            id: re.exercises.code,
            name: re.exercises.title,
            target: `${re.custom_target_value || re.exercises.target_value} ${re.exercises.target_unit}`,
            difficulty: re.exercises.difficulty,
            description: re.exercises.description,
            routineExerciseId: re.exercises.id
          }))
      })),
    createdAt: program.created_at
  }));
};
```

---

## 📝 Implementation Notes

### **Exercise Codes**
- **Standard format**: Numbers like "1.1", "2.3", "6.1"
- **Session codes**: Prefixed with "s" like "s3.1", "s1.2"
- **Specialty codes**: Letters like "v1" (volleys), "r1" (returns)

### **Difficulty Scale**
- **1-2**: Beginner level exercises
- **3**: Intermediate level exercises  
- **4-5**: Advanced/Pro level exercises

### **Target Types**
- **Count**: "20 in zone", "7/10 beyond NVZ"
- **Sequence**: "15 in a row", "10 sequences"
- **Game**: "play to 11", "start 9-9, win 3"
- **Time**: "25+ shot rallies"

### **Categories**
- **Pro Training**: Elite-level programs
- **Fundamentals**: Core skill development
- **Specialized**: Focus on specific skills

---

## 🚀 Next Steps for Supabase Implementation

1. **Import Exercise Library**: Add all exercises from the tables above
2. **Create Program Templates**: Use the sample program structure
3. **Setup Routine Relationships**: Link routines to programs with proper order
4. **Configure Exercise Assignments**: Map exercises to routines via junction table
5. **Add Media URLs**: Include demo videos and images
6. **Setup Content Management**: Admin interface for adding new content

This data structure provides a solid foundation for the PicklePro training system in Supabase.
