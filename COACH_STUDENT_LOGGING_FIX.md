# Coach Student Logging Fix

## Problem
When a coach added a log for a student from the player profile, the log was being saved to the **coach's account** instead of the **student's account**. This caused:
- Coach could see the log history in the "Add Log" modal (their own logs)
- Student couldn't see any logs in "See Logs" button (no logs in their account)

## Root Cause
The `studentId` was not being passed through the navigation chain when coaches accessed student programs:

```
PlayerProfileScreen → ProgramDetailScreen → RoutineDetailScreen → AddLogExercise_from_routine
        ❌ No studentId passed through the chain
```

When `AddLogExercise_from_routine` saved the log, it used the LogbookContext which saves to the **currently logged-in user** (the coach), not the student.

## Solution
Pass the `studentId` through the entire navigation chain and use it to save logs directly to the student's account.

### Files Modified

#### 1. `src/screens/coach/PlayerProfileScreen.js`
**Added:** Pass `studentId` when navigating to ProgramDetail

```javascript
navigation.navigate('ProgramDetail', {
  program: program.programs,
  source: 'coach',
  isStudentView: isStudentView,
  studentId: studentId // ✅ Added
});
```

#### 2. `src/screens/ProgramDetailScreen.js`
**Added:** Pass `studentId` when navigating to RoutineDetail

```javascript
navigation.navigate('RoutineDetail', { 
  program,
  routine: transformedRoutine,
  source,
  isStudentView: isStudentView,
  studentId: studentId, // ✅ Added
  onUpdateRoutine: (updatedRoutine) => { ... }
});
```

#### 3. `src/screens/RoutineDetailScreen.js`
**Changed:** 
1. Receive `studentId` from route params
2. Pass `studentId` to AddLogExercise_from_routine

```javascript
// Receive from route params
const { program, routine, source, isStudentView, studentId } = route.params;

// Pass to component
<AddLogExercise_from_routine
  visible={showQuickLogModal}
  onClose={closeQuickLogModal}
  exercise={selectedExercise}
  program={program}
  routine={routine}
  studentId={studentId} // ✅ Added
  onResultSaved={handleResultSaved}
/>
```

#### 4. `src/components/AddLogExercise_from_routine.js`
**Changed:** Save logs to student's account when studentId is provided

```javascript
// Import createLogbookEntry
import { getLogbookEntriesByUserId, createLogbookEntry } from '../lib/supabase';

// In saveLogEntry function:
if (studentId) {
  console.log('💾 [AddLogExercise] Saving log for student:', studentId);
  await createLogbookEntry(entry, studentId); // ✅ Save directly to database with studentId
} else {
  console.log('💾 [AddLogExercise] Saving log for current user');
  await addLogbookEntry(entry); // Use context for current user
}
```

## How It Works Now

### Coach Flow:
1. Coach navigates to student's profile
2. Taps on a program → **studentId passed**
3. Taps on a routine → **studentId passed**
4. Taps "Add Log" on exercise → **studentId passed**
5. Saves log → **Saved to STUDENT's account** ✅

### Student Flow:
1. Student opens their program
2. Taps on a routine → **No studentId** (undefined)
3. Taps "See Logs" → **studentId = current user's ID**
4. Views history → **Shows THEIR logs** ✅

## Data Flow Diagram

### Before Fix:
```
Coach → Add Log → createLogbookEntry(entry, coach.id) ❌
                  ↓
                  Coach's logbook_entries

Student → See Logs → Query student.id ❌
                     ↓
                     No matching logs (empty)
```

### After Fix:
```
Coach → Add Log (studentId=10a37...) → createLogbookEntry(entry, studentId) ✅
                                        ↓
                                        Student's logbook_entries

Student → See Logs → Query student.id ✅
                     ↓
                     Logs found! (33, 19, 18, etc.)
```

## Testing Steps

### As Coach:
1. ✅ Navigate to student's profile
2. ✅ Open a program (check console for studentId)
3. ✅ Open a routine (check console for studentId)
4. ✅ Add a log for an exercise
5. ✅ Check console: Should say "Saving log for student: [studentId]"
6. ✅ Verify in database: logbook_entries should have user_id = studentId

### As Student:
1. ✅ Open the same program
2. ✅ Open the same routine
3. ✅ Tap "See Logs" on the exercise
4. ✅ Should now see the logs the coach created!

## Console Logs to Verify

### When Coach Saves:
```
💾 [AddLogExercise] Saving log for student: 10a37275-c732-40d6-b3b8-4cd7a0f5b286
🏓 [SUPABASE] Creating logbook entry: { userId: "10a37275...", ... }
```

### When Student Views:
```
🔍 [ExerciseHistoryModal] StudentId: 10a37275-c732-40d6-b3b8-4cd7a0f5b286
📊 [ExerciseHistoryModal] Total entries found: 3
📊 [ExerciseHistoryModal] Filtered history count: 3
```

## Database Verification

Query the database to verify logs are saved to the student:

```sql
SELECT 
  id, 
  user_id, 
  date, 
  exercise_details->>'exerciseName' as exercise_name,
  exercise_details->>'result' as result
FROM logbook_entries
WHERE user_id = '10a37275-c732-40d6-b3b8-4cd7a0f5b286'
  AND exercise_details->>'exerciseName' = 'Endurance Rallies (15 min)'
ORDER BY created_at DESC;
```

Should return:
- 3 entries (33, 19, 18)
- user_id = student's ID (not coach's ID)
- exercise_details populated correctly

## Summary

The fix ensures that:
1. ✅ Coach logs are saved to **student's account**
2. ✅ Student can see **all logs** created by coach
3. ✅ "See Logs" button now works for students
4. ✅ Exercise history shows in both Add Log modal (coach) and See Logs modal (student)
5. ✅ No breaking changes to existing functionality

## Backward Compatibility

- ✅ Students logging their own exercises still works (no studentId = use context)
- ✅ Existing logs are not affected
- ✅ All existing features continue to work as before

