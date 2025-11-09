# Coach-Student Long Press Soft Delete Feature

## Overview
Coaches can now **long-press** on a student card in the Coach Dashboard to remove the connection while **preserving all database history and assessment data**. If they reconnect later, all previous history will still be accessible.

## Implementation Details

### 1. User Interface Changes
- **File**: `src/screens/coach/CoachDashboardScreen.js`
- **Change**: Student cards now use `Pressable` component instead of `TouchableOpacity`
- **Behavior**: 
  - **Tap**: Opens student profile (existing behavior)
  - **Long Press**: Shows removal confirmation dialog (NEW)

### 2. Soft Delete Mechanism
When a coach long-presses a student:

1. **Confirmation Dialog** appears with clear messaging:
   - "Remove Student Connection"
   - Explains that all history will be preserved
   - Shows "Remove" (destructive style) and "Cancel" buttons

2. **Database Update** (Soft Delete):
   ```javascript
   // Sets is_active = false instead of deleting the record
   UPDATE coach_students 
   SET is_active = false 
   WHERE coach_id = ? AND student_id = ?
   ```

3. **Success Feedback**:
   - Shows confirmation alert
   - Refreshes the student list
   - Student is immediately removed from view

### 3. Database Query Updates
- **File**: `src/lib/supabase.js`
- **Function**: `getCoachStudents()`
- **Change**: Now filters by `is_active = true`
  ```javascript
  .eq('coach_id', coachId)
  .eq('is_active', true)  // ← NEW: Only show active connections
  ```

### 4. Reconnection Support
When a coach adds a student they previously removed:

**Updated Function**: `addStudentByCode()`

**Logic Flow**:
1. Check if a relationship already exists (active or inactive)
2. **If inactive**: Reactivate by setting `is_active = true`
   - All previous history becomes accessible again
   - No duplicate records created
3. **If active**: Show "Student already added" error
4. **If new**: Create new connection with `is_active = true`

## What Data is Preserved?

When a connection is removed (soft delete), the following data remains intact:

✅ **Preserved**:
- All assessment history and scores
- Coach-student relationship record
- Historical performance data
- All linked database records

❌ **NOT Deleted**:
- The coach_students record itself
- Any related assessment data
- Any historical tracking information

## Database Schema

The `coach_students` table has an `is_active` column:

```sql
CREATE TABLE coach_students (
  id UUID PRIMARY KEY,
  coach_id UUID NOT NULL,
  student_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,  -- ← Enables soft delete
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(coach_id, student_id)
);
```

## User Experience Flow

### Removing a Student:
1. Coach opens Coach Dashboard
2. Navigates to Students tab
3. **Long-presses** on a student card
4. Sees confirmation dialog with reassuring message
5. Taps "Remove"
6. Student disappears from list
7. Sees success message confirming history is preserved

### Reconnecting with a Student:
1. Coach taps "+" button to add student
2. Enters the same student code
3. System detects inactive relationship
4. Automatically reactivates the connection
5. Student appears in list **with all historical data intact**
6. No "duplicate" error occurs

## Testing Checklist

- [ ] Long-press on student card shows removal dialog
- [ ] Regular tap still opens student profile
- [ ] Removing student updates database correctly (is_active = false)
- [ ] Student disappears from list after removal
- [ ] Re-adding same student code reactivates connection
- [ ] Historical assessment data is still accessible after reconnection
- [ ] No duplicate records are created on reconnection
- [ ] Success messages display correctly

## Technical Benefits

1. **Data Integrity**: No loss of valuable assessment history
2. **User Confidence**: Clear messaging that data is safe
3. **Flexibility**: Easy reconnection without data loss
4. **Performance**: Queries filter efficiently with indexed is_active column
5. **Auditing**: Connection history preserved for potential analytics

## Files Modified

1. `src/screens/coach/CoachDashboardScreen.js`
   - Added `Pressable` import
   - Added `handleRemoveStudent()` function
   - Changed student cards to use `Pressable` with `onLongPress`

2. `src/lib/supabase.js`
   - Updated `getCoachStudents()` to filter by `is_active = true`
   - Updated `addStudentByCode()` to handle reconnection logic
   - (Note: `getStudentCoach()` already had `is_active` filter)

## Migration Note

The database already has the `is_active` column from the original migration:
- File: `create_coach_students_table_migration.sql`
- Column: `is_active BOOLEAN DEFAULT true`
- No additional migration needed ✅

