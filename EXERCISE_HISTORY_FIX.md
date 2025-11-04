# Exercise History Fix - Missing exerciseDetails

## Problem
After implementing the exercise history feature and running the SQL migration, logs were being saved but the `exercise_details` field was always `null` in the database. This prevented the exercise history from displaying because the filter couldn't find any matching exercise names.

From the terminal logs:
```javascript
"exercise_details": null  // ❌ Should contain exercise information
```

## Root Cause
The `LogbookContext.js` file was not including the `exerciseDetails` field when transforming entries to save to Supabase. The transformation function was missing this field in several places:

1. `addLogbookEntry()` - when creating the supabaseEntry object
2. `addLogbookEntry()` - when transforming the response back to local format
3. `updateLogbookEntry()` - when creating the supabaseEntry object
4. `updateLogbookEntry()` - when transforming the response back to local format

Additionally, the `updateLogbookEntry()` function in `supabase.js` was also missing the `exercise_details` field.

## Solution

### 1. Fixed `src/context/LogbookContext.js`

**Added exerciseDetails to addLogbookEntry transformation:**
```javascript
const supabaseEntry = {
  date: entry.date,
  hours: entry.hours,
  sessionType: entry.sessionType,
  trainingFocus: entry.trainingFocus,
  difficulty: entry.difficulty,
  feeling: entry.feeling,
  notes: entry.notes,
  location: entry.location,
  exerciseDetails: entry.exerciseDetails || null  // ✅ ADDED
};
```

**Added exerciseDetails to response transformation (addLogbookEntry):**
```javascript
const transformedEntry = {
  id: savedEntry.id,
  date: savedEntry.date,
  hours: savedEntry.hours,
  sessionType: savedEntry.session_type,
  trainingFocus: trainingFocus,
  difficulty: difficulty,
  feeling: savedEntry.feeling,
  notes: savedEntry.notes,
  location: savedEntry.location,
  createdAt: savedEntry.created_at,
  exerciseDetails: savedEntry.exercise_details || null  // ✅ ADDED
};
```

**Added exerciseDetails to updateLogbookEntry transformation:**
```javascript
const supabaseEntry = {
  date: updatedEntry.date,
  hours: updatedEntry.hours,
  sessionType: updatedEntry.sessionType,
  trainingFocus: updatedEntry.trainingFocus,
  difficulty: updatedEntry.difficulty,
  feeling: updatedEntry.feeling,
  notes: updatedEntry.notes,
  location: updatedEntry.location,
  exerciseDetails: updatedEntry.exerciseDetails || null  // ✅ ADDED
};
```

**Added exerciseDetails to response transformation (updateLogbookEntry):**
```javascript
const transformedEntry = {
  id: updatedSupabaseEntry.id,
  date: updatedSupabaseEntry.date,
  hours: updatedSupabaseEntry.hours,
  sessionType: updatedSupabaseEntry.session_type,
  trainingFocus: trainingFocus,
  difficulty: difficulty,
  feeling: updatedSupabaseEntry.feeling,
  notes: updatedSupabaseEntry.notes,
  location: updatedSupabaseEntry.location,
  createdAt: updatedSupabaseEntry.created_at,
  exerciseDetails: updatedSupabaseEntry.exercise_details || null  // ✅ ADDED
};
```

### 2. Fixed `src/lib/supabase.js`

**Added exercise_details to updateLogbookEntry:**
```javascript
const { data, error } = await supabase
  .from('logbook_entries')
  .update({
    user_id: userId,
    date: entryData.date,
    hours: entryData.hours,
    session_type: entryData.sessionType,
    training_focus: entryData.trainingFocus,
    difficulty: entryData.difficulty,
    feeling: entryData.feeling,
    notes: entryData.notes,
    location: entryData.location,
    exercise_details: entryData.exerciseDetails || null  // ✅ ADDED
  })
  .eq('id', id)
  .select()
  .single();
```

## What This Fixes

✅ **exerciseDetails now saves to database:** The `exercise_details` field will contain:
```json
{
  "exerciseName": "Dink to 3rd Shot Drop",
  "target": "8/10",
  "result": "7",
  "routineName": "Basic Skills",
  "programName": "Beginner Program"
}
```

✅ **Exercise history now displays:** The filter can now find matching exercises:
```javascript
const history = entries.filter(entry => {
  if (entry.exerciseDetails && entry.exerciseDetails.exerciseName) {
    return entry.exerciseDetails.exerciseName === exercise.name;
  }
  // ...
});
```

✅ **Updates preserve exerciseDetails:** When updating a logbook entry, the exercise details are maintained

✅ **Backward compatible:** Old logs without exerciseDetails will still work (falls back to checking notes)

## Testing

To verify the fix works:

1. **Create a new log:**
   - Open a program/routine
   - Click "Add Log" on an exercise
   - Enter a result and save
   - Check the terminal logs - you should see `exercise_details` populated

2. **View exercise history:**
   - Open the same exercise again
   - The "Previous Results" section should now show your previous log
   - You should see date, result, and any notes

3. **Database verification:**
   - In Supabase, query: `SELECT exercise_details FROM logbook_entries WHERE exercise_details IS NOT NULL`
   - You should see entries with the exerciseDetails JSONB data

## Expected Terminal Output (After Fix)

When saving a log, you should now see:
```javascript
LOG  🏓 [SUPABASE] ✅ Logbook entry created successfully: {
  // ...
  "exercise_details": {
    "exerciseName": "Endurance Rallies (15 min)",
    "target": "10/10",
    "result": "7",
    "routineName": "Basic Skills",
    "programName": "Beginner Program"
  },
  // ...
}
```

## Summary

The issue was that the `exerciseDetails` field was not being included in the data transformations between the app and the database. Now all create and update operations properly save and retrieve the exercise details, enabling the exercise history feature to work correctly.

## Files Modified
- `src/context/LogbookContext.js` - Added exerciseDetails to 4 transformation points
- `src/lib/supabase.js` - Added exercise_details to updateLogbookEntry function

