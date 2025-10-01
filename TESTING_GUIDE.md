# 🧪 User Program Implementation - Testing Guide

## 📋 Testing Checklist

### **Phase 1: Database Migration Testing**
### **Phase 2: Basic Function Testing**  
### **Phase 3: Frontend Integration Testing**
### **Phase 4: Program Sharing Testing**
### **Phase 5: Hybrid Storage Testing**

---

## 🗃️ **Phase 1: Database Migration Testing**

### Step 1: Apply the Migration
```sql
-- Run this in your Supabase SQL Editor:
-- Copy and paste the entire user_program_standardized_migration.sql file
```

### Step 2: Verify Tables Created
```sql
-- Check if new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_programs', 'program_shares');

-- Check if new columns added to programs table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'programs' 
AND column_name IN ('program_type', 'is_shareable', 'shared_count', 'visibility');
```

### Step 3: Verify Functions Created
```sql
-- Check if user functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%_as_user';
```

**Expected Results:**
- ✅ `user_programs` table exists
- ✅ `program_shares` table exists  
- ✅ New columns in `programs` table
- ✅ Functions like `create_program_as_user`, `update_program_as_user`, etc.

---

## ⚙️ **Phase 2: Basic Function Testing**

### Test 1: Create Program as User
```sql
-- Test user program creation
SELECT * FROM create_program_as_user(
  program_name := 'My Test Program',
  program_description := 'Testing user program creation',
  program_category := 'Custom',
  program_tier := 'Beginner'
);
```

**Expected Result:**
- ✅ Program created with `program_type = 'user'`
- ✅ `created_by` = your user ID
- ✅ `is_shareable = true` by default

### Test 2: Get User Programs
```sql
-- Test getting user's programs
SELECT * FROM get_user_programs();
```

**Expected Result:**
- ✅ Shows the program you just created
- ✅ `access_type = 'created'`

### Test 3: Add Program to Collection
```sql
-- First, find a published admin program
SELECT id, name FROM programs WHERE is_published = true AND program_type = 'admin' LIMIT 1;

-- Then add it to your collection (replace with actual program ID)
SELECT * FROM add_program_to_user_collection('your-program-id-here');
```

**Expected Result:**
- ✅ Program added to user's collection
- ✅ `added_count` increased by 1

### Test 4: Program Statistics
```sql
-- Test user stats
SELECT * FROM get_user_program_stats();
```

**Expected Result:**
- ✅ Shows counts of created/added programs
- ✅ Numbers match your test data

---

## 📱 **Phase 3: Frontend Integration Testing**

### Step 1: Add ProgramProvider to App.js
```javascript
// In your App.js or main component file:
import { ProgramProvider } from './src/context/ProgramContext';

// Wrap your app:
export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <LogbookProvider>
          <ProgramProvider>  {/* Add this */}
            <YourAppContent />
          </ProgramProvider>
        </LogbookProvider>
      </UserProvider>
    </AuthProvider>
  );
}
```

### Step 2: Test Context in ProgramScreen
```javascript
// In ProgramScreen.js, replace existing state with context:
import { usePrograms } from '../context/ProgramContext';

export default function ProgramScreen({ navigation, route }) {
  // OLD: const [programs, setPrograms] = useState([]);
  
  // NEW:
  const {
    getAllPrograms,
    createProgram,
    isLoading,
    getUserCreatedPrograms,
    getUserCollectedPrograms
  } = usePrograms();

  // Test loading programs
  console.log('All Programs:', getAllPrograms());
  console.log('Created Programs:', getUserCreatedPrograms());
  console.log('Collected Programs:', getUserCollectedPrograms());

  // Test creating a program
  const handleCreateProgram = async () => {
    const result = await createProgram({
      name: 'Test Frontend Program',
      description: 'Testing from React Native',
      category: 'Custom'
    });
    
    console.log('Create Result:', result);
  };

  // ... rest of your component
}
```

### Step 3: Test Program Creation from UI
1. **Open your app**
2. **Navigate to ProgramScreen**
3. **Try creating a new program**
4. **Check console logs for success/failure**

**Expected Results:**
- ✅ Program appears in UI immediately
- ✅ Console shows successful database save
- ✅ Program persists after app restart

---

## 🤝 **Phase 4: Program Sharing Testing**

### Test 1: Share Program (Database)
```sql
-- Create a test user if needed, or use existing user email
-- Replace with actual program ID and target email
SELECT * FROM share_program_as_user(
  program_id := 'your-program-id',
  target_user_email := 'test@example.com',
  share_message := 'Check out my program!'
);
```

### Test 2: Check Pending Shares
```sql
-- Switch to the target user account and check pending shares
SELECT * FROM get_pending_program_shares();
```

### Test 3: Accept Shared Program
```sql
-- Use the share_id from the previous query
SELECT * FROM accept_shared_program('your-share-id-here');
```

### Test 4: Frontend Sharing
```javascript
// Test sharing from React Native
const { shareProgram, acceptSharedProgram, pendingShares } = usePrograms();

// Share a program
const handleShare = async () => {
  const result = await shareProgram(
    'program-id', 
    'friend@example.com', 
    'Try my workout!'
  );
  console.log('Share Result:', result);
};

// Accept a shared program
const handleAcceptShare = async (shareId) => {
  const result = await acceptSharedProgram(shareId);
  console.log('Accept Result:', result);
};

// Check pending shares
console.log('Pending Shares:', pendingShares);
```

**Expected Results:**
- ✅ Share notification created
- ✅ Target user sees pending share
- ✅ Accepted program appears in user's collection
- ✅ UI updates in real-time

---

## 💾 **Phase 5: Hybrid Storage Testing**

### Test 1: Offline Program Creation
1. **Disconnect internet/WiFi**
2. **Create a new program in the app**
3. **Check if program appears in UI**
4. **Reconnect internet**
5. **Check if program syncs to database**

### Test 2: Database vs Local Storage
```javascript
// Test the hybrid storage behavior
const { createProgram, syncPendingChanges } = usePrograms();

// Create program offline
const testOfflineSync = async () => {
  // This should save locally if database fails
  const result = await createProgram({
    name: 'Offline Test Program',
    description: 'Testing offline creation'
  });
  
  console.log('Offline Create:', result);
  
  // Later, sync to database
  const syncResult = await syncPendingChanges();
  console.log('Sync Result:', syncResult);
};
```

### Test 3: AsyncStorage Fallback
```javascript
// Test local storage directly
import AsyncStorage from '@react-native-async-storage/async-storage';

const testLocalStorage = async () => {
  // Check what's stored locally
  const createdPrograms = await AsyncStorage.getItem('@user_created_programs');
  const userPrograms = await AsyncStorage.getItem('@user_programs');
  
  console.log('Local Created Programs:', JSON.parse(createdPrograms || '[]'));
  console.log('Local User Programs:', JSON.parse(userPrograms || '[]'));
};
```

**Expected Results:**
- ✅ Programs work offline
- ✅ Local storage contains backup data
- ✅ Programs sync when connection restored
- ✅ No data loss during offline usage

---

## 🔍 **Phase 6: Enhanced Explore Screen Testing**

### Test 1: Unified Program Display
```sql
-- Test the enhanced explore query
SELECT 
  id, name, program_type, created_by, is_published,
  'admin' as source_type
FROM programs 
WHERE is_published = true 
ORDER BY program_type, created_at DESC;
```

### Test 2: Frontend Explore Enhancement
```javascript
// Update ExploreTrainingScreen.js to show both admin and user programs
import { getAllPublishedPrograms } from '../lib/userProgramsApi';

const fetchAllPrograms = async () => {
  const { data: programs, error } = await getAllPublishedPrograms();
  
  if (programs) {
    console.log('All Published Programs:', programs);
    
    // Separate admin vs user programs
    const adminPrograms = programs.filter(p => p.is_official);
    const communityPrograms = programs.filter(p => p.is_community);
    
    console.log('Admin Programs:', adminPrograms);
    console.log('Community Programs:', communityPrograms);
  }
};
```

**Expected Results:**
- ✅ Explore shows both admin and user programs
- ✅ Admin programs have "Official" badge
- ✅ User programs have "Community" badge
- ✅ Creator names displayed correctly

---

## 🚨 **Troubleshooting Common Issues**

### Issue 1: "Permission denied" errors
**Solution:** Check RLS policies are correctly applied
```sql
-- Verify policies exist
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('programs', 'user_programs', 'program_shares');
```

### Issue 2: Functions not found
**Solution:** Check function creation
```sql
-- Verify functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%_as_user';
```

### Issue 3: Context not working
**Solution:** Verify ProgramProvider is wrapping your app correctly
```javascript
// Check if usePrograms() is called inside ProgramProvider
import { usePrograms } from '../context/ProgramContext';

// This should not throw an error:
const programContext = usePrograms();
console.log('Context loaded:', !!programContext);
```

### Issue 4: Local storage not working
**Solution:** Check AsyncStorage permissions and imports
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Test basic AsyncStorage functionality
const testStorage = async () => {
  await AsyncStorage.setItem('test', 'value');
  const value = await AsyncStorage.getItem('test');
  console.log('AsyncStorage works:', value === 'value');
};
```

---

## ✅ **Success Criteria**

### Database Level:
- ✅ All functions execute without errors
- ✅ RLS policies allow/deny access correctly
- ✅ Data is stored in correct tables with correct relationships

### Frontend Level:
- ✅ Programs can be created, updated, deleted
- ✅ Sharing works between users
- ✅ Offline functionality works
- ✅ Explore screen shows unified content

### User Experience:
- ✅ Fast performance (local-first)
- ✅ Works offline
- ✅ Real-time sharing
- ✅ Consistent with admin experience

---

## 📞 **Next Steps After Testing**

1. **If tests pass:** Deploy to production and monitor usage
2. **If tests fail:** Check troubleshooting section and debug specific issues
3. **Performance testing:** Test with large numbers of programs
4. **User acceptance testing:** Have real users test the sharing features

Let me know which test phase you'd like to start with! 🚀
