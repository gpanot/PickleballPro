# 6-Point Tracker Game Guide

## Overview

The **6-Point Tracker** is a specialized pickleball analytics tool designed to track and analyze the first 6 points of a doubles match. It captures detailed information about each point, including who made winning shots, who made errors, and from which court position (zone) these actions occurred.

## Game Structure

### Teams and Players
- **Team A**: Players A1 and A2
- **Team B**: Players B1 and B2

### Court Zones
Each player can make shots from two distinct zones:

| Zone | Position | Description |
|------|----------|-------------|
| **Back** | Baseline | Back court position, typically used for serves, returns, and baseline shots |
| **Volley** | Net | Front court position at the kitchen line, used for dinks, volleys, and net play |

### Scoring
- First team to reach **6 points** wins
- Each point is tracked with detailed shot type and zone information
- Score is displayed in real-time at the top of the screen

---

## Game Flow

The 6-Point Tracker uses a **4-step workflow** to capture each point:

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Point Maker Selection                              │
│  "Who made the winning shot?"                               │
│  → Tap player zone (Back or Volley)                        │
│  → Or long-press for radial menu (advanced)                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Winning Shot Type Selection                        │
│  "Winning Shot Type"                                        │
│  → Select from available shot types                         │
│  → Available shots filtered by zone (back/volley)           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Error Maker Selection                              │
│  "Who made the error?"                                      │
│  → Tap opposing team player zone                            │
│  → Only losing team players are selectable                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Error Shot Type Selection                          │
│  "Error Type"                                               │
│  → Select from available error types                        │
│  → Auto-confirms point once selected                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
                  Point Recorded ✓
```

### Step Details

#### Step 1: Point Maker Selection
- **Action**: Tap the zone (Back or Volley) of the player who made the winning shot
- **Advanced**: Long-press for radial menu to directly select shot type
- **Effect**: 
  - Flashes GREEN on the selected player zone
  - Automatically determines winning team
  - Moves to Step 2

#### Step 2: Winning Shot Type Selection
- **Action**: Select the type of shot that won the point
- **Constraints**: Only shots valid for the selected zone are shown
- **Flexibility**: Can change the point maker if needed (same team only)
- **Effect**: Records winning shot type and moves to Step 3

#### Step 3: Error Maker Selection
- **Action**: Tap the zone (Back or Volley) of the player who made the error
- **Constraints**: Only opposing team players are selectable
- **Effect**: 
  - Flashes RED on the selected player zone
  - Moves to Step 4

#### Step 4: Error Shot Type Selection
- **Action**: Select the type of error that lost the point
- **Constraints**: Only errors valid for the selected zone are shown
- **Flexibility**: Can change the error maker if needed (opposite team only)
- **Effect**: 
  - Auto-confirms the point
  - Updates score
  - Resets for next point (or ends game if 6 points reached)

### Special Case: Bad Serve Shortcut

For efficiency, there's a **one-tap shortcut** for service errors:

- **Location**: Bottom of Step 1 screen
- **Action**: Tap the player who missed their serve
- **Label**: "Or tap who missed his service:"
- **Effect**: 
  - Immediately records the point
  - Opposing team gets the point
  - No need to go through all 4 steps
  - Error type is automatically set to "Bad Serve"

---

## Shot Type Matrices

### Winning Shot Types (Point Makers)

| ID | Label | Color | Zone Restriction | Description |
|----|-------|-------|------------------|-------------|
| `serve` | Serve | 🔵 Blue (#3B82F6) | **Back Only** | Winning serve (ace) |
| `3rd-shot-drop` | 3rd-Shot Drop | 🟢 Green (#10B981) | **Back Only** | Successful 3rd shot drop that wins the point |
| `return` | Return | 🟣 Purple (#8B5CF6) | **Back Only** | Winning return of serve |
| `drive-smash` | Drive/Smash | 🔴 Red (#EF4444) | **Back Only** | Winning drive or smash from baseline |
| `dink-drop` | Dink/Drop | 🔷 Cyan (#06B6D4) | **Volley Only** | Winning dink or drop shot from net |
| `block-reset` | Block/Reset | 🟣 Purple (#8B5CF6) | **Volley Only** | Winning block or reset at the net |
| `smash` | Smash | 🟠 Orange (#F59E0B) | **Volley Only** | Winning smash/putaway at the net |

### Error Shot Types (Error Makers)

| ID | Label | Color | Zone Restriction | Description |
|----|-------|-------|------------------|-------------|
| `serve` | Bad Serve | 🔵 Blue (#3B82F6) | **Back Only** | Service fault or missed serve |
| `3rd-shot-drop` | Bad 3rd-Shot Drop | 🟢 Green (#10B981) | **Back Only** | Failed 3rd shot drop attempt |
| `return` | Bad Return | 🟣 Purple (#8B5CF6) | **Back Only** | Failed return of serve |
| `drive-smash` | Bad Drive/Smash | 🔴 Red (#EF4444) | **Back Only** | Failed drive/smash from baseline |
| `dink-error` | Dink Error | 🔷 Cyan (#06B6D4) | **Volley Only** | Failed dink at the net |
| `block-error` | Block Error | 🟣 Purple (#8B5CF6) | **Volley Only** | Failed block/reset at the net |
| `smash` | Bad Smash | 🟠 Orange (#F59E0B) | **Volley Only** | Failed smash/putaway at the net |

### Zone Restrictions

**Back Only Shots** (Baseline):
- ✅ Serve
- ✅ 3rd-Shot Drop
- ✅ Return
- ✅ Drive/Smash

**Volley Only Shots** (Net/Kitchen Line):
- ✅ Dink/Drop (Dink Error)
- ✅ Block/Reset (Block Error)
- ✅ Smash

---

## User Interface Features

### Visual Feedback

#### Color Coding
- **Team A**: Green (#27AE60)
- **Team B**: Blue (#2D9CDB)
- **Point Maker**: Green flash with green border
- **Error Maker**: Red flash with red border
- **Leading Score**: Green highlight (#27AE60)

#### Animations
- **Flash Green**: When point maker is selected
- **Flash Red**: When error maker is selected
- **Button Press**: Bad serve buttons turn blue when pressed

### Navigation Controls

#### Back Button
- **Location**: Top-left arrow in prompt area
- **Functionality**:
  - Step 2 → Back to Step 1 (resets selections)
  - Step 3 → Back to Step 2 (keeps point maker)
  - Step 4 → Back to Step 3 (keeps winner info)
  - Step 1 (with previous points) → Edit last point

#### Edit Last Point
When on Step 1 with points already recorded:
- Press back button to edit the previous point
- **Bad Serve Points**: Immediately undoes the point
- **Regular Points**: Enters edit mode starting at Step 4
- Can modify all aspects of the previous point

### Haptic Feedback
- **Medium Impact**: Point maker selection, bad serve
- **Light Impact**: Shot type selection, error maker selection
- **Success Notification**: Point confirmation

---

## Data Captured

Each point records the following information:

```javascript
{
  pointNumber: 1-6,              // Sequential point number
  winnerTeam: 'A' | 'B',         // Team that won the point
  pointMaker: 'A1' | 'A2' | 'B1' | 'B2' | null,  // Player who made winning shot
  pointMakerZone: 'back' | 'volley' | null,      // Zone of winning shot
  pointShotType: string | null,                   // ID of winning shot type
  pointShotTypeLabel: string | null,              // Display label of winning shot
  errorMaker: 'A1' | 'A2' | 'B1' | 'B2',         // Player who made error
  errorMakerZone: 'back' | 'volley',             // Zone of error
  errorShotType: string,                          // ID of error type
  errorShotTypeLabel: string,                     // Display label of error
  timestamp: number                               // Unix timestamp
}
```

**Note**: For bad serve points, `pointMaker` and related winning shot fields are `null`.

---

## Game Completion

### End Conditions
- Game ends when either team reaches **6 points**
- Automatically navigates to **6-Point Summary Screen**

### Summary Screen Data
The summary screen receives:
- Complete array of all points
- Player information
- Final scores (Team A and Team B)
- Detailed analytics and statistics

---

## Advanced Features

### Radial Menu (Experimental)
- **Activation**: Long-press on a player zone in Step 1
- **Purpose**: Direct shot type selection without going to Step 2
- **Visual**: Circular menu appears at touch location
- **Options**: Filtered based on zone (back/volley)
- **Status**: Currently implemented but can be toggled

### Scroll Behavior
- Auto-scrolls to top after each point confirmation
- Smooth animated scrolling for better UX
- Maintains scroll position during multi-step workflow

---

## Tips for Users

1. **Quick Entry**: Use the bad serve shortcut when applicable
2. **Visual Cues**: Watch for green (winner) and red (error) flashes
3. **Zone Selection**: Pay attention to which zone the shot was made from
4. **Editing**: Use the back button to correct mistakes immediately
5. **Court Layout**: Team A at top (baseline up, net down), Team B at bottom (net up, baseline down)

---

## Technical Notes

### State Management
The tracker maintains state for:
- Current step (1-4)
- Selected team and player
- Shot types and zones
- Point history array
- Current scores
- Edit mode flag

### Validation Rules
- Point maker must be from winning team
- Error maker must be from losing team
- Shot types must match selected zone restrictions
- All required fields must be filled before confirmation (except bad serve)

---

## Future Enhancements

Potential improvements to consider:
- [ ] Undo/redo functionality for multiple points
- [ ] Real-time statistics display
- [ ] Shot type heatmaps by zone
- [ ] Player performance metrics
- [ ] Export data to CSV/JSON
- [ ] Voice input for faster tracking
- [ ] Video integration for post-match review

