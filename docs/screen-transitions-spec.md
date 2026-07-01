# Screen Transition Spec (Pickleball Hero Mobile)

Portable spec for reusing the same navigation and in-screen animations in another React Native app.

---

## Stack

| Item | Value |
|------|--------|
| Framework | React Native + Expo |
| Navigation | `@react-navigation/native` v6 + `@react-navigation/stack` v6 |
| Gesture support | `react-native-gesture-handler` |
| Native screens | `react-native-screens` (recommended) |

---

## 1. Stack screen transitions (push / pop)

**Library:** `@react-navigation/stack`  
**Navigator:** `createStackNavigator()`

### Current behavior (implicit defaults)

No custom animation config — platform defaults apply.

| Platform | Push | Pop / back | Swipe-back |
|----------|------|------------|------------|
| **iOS** | Slide in from right | Slide out to right | Enabled |
| **Android** | Fade + slight scale from bottom | Fade out | Disabled |
| **Web** | Same as iOS (horizontal slide) | Same | N/A |

**Duration (approx.):** ~350ms open, ~250ms close (React Navigation defaults).

**Header:** Hidden (`headerShown: false`). Back is custom in-screen UI.

### Recommended for cross-platform reuse

Use one explicit preset so both platforms match the iOS-style Academy feel:

```javascript
import { TransitionPresets } from '@react-navigation/stack';

export const stackScreenOptions = {
  headerShown: false,
  cardStyle: { flex: 1 },
  ...TransitionPresets.SlideFromRightIOS,
};
```

Apply to every `Stack.Navigator` via `screenOptions={stackScreenOptions}`.

**Equivalent manual config:**

```javascript
import { CardStyleInterpolators } from '@react-navigation/stack';

{
  headerShown: false,
  cardStyle: { flex: 1 },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
}
```

### Navigation semantics

| Action | Behavior | Animation |
|--------|----------|-----------|
| `navigation.push('Screen')` | New card on stack | Push |
| `navigation.goBack()` | Pop top card | Pop (reverse) |
| `navigation.navigate('ExistingScreen')` | Pop to existing route if in stack | Reverse pop |
| Navigate to screen on parent stack | Bubbles to root stack | Same push/pop |

### Where this applies in Pickleball Hero

- Root stack: `App.js`
- Academy tab: `src/navigation/CoachNavigator.js`
- Onboarding: `src/navigation/OnboardingNavigator.js`

---

## 2. Bottom tab transitions

**Library:** `@react-navigation/bottom-tabs` v6

| Behavior | Spec |
|----------|------|
| Tab switch | Instant — no slide/fade between tabs |
| Tab bar | Fixed; screens lazy-mount |
| Feedback | Optional light haptic on tab press (not required for animation parity) |

No custom tab animation config in source app.

---

## 3. Modal transitions (overlays)

**Library:** React Native `Modal` (not stack navigator)

| Modal type | `animationType` | Use case |
|------------|-----------------|----------|
| **Sheet / form** | `"slide"` | Add student, assign program |
| **Overlay / detail** | `"fade"` | Expanded skill card, confirmations |

**Common props:**

```javascript
<Modal
  visible={visible}
  animationType="slide"   // or "fade"
  transparent={false}     // true for fade overlays with dimmed backdrop
  onRequestClose={onClose}
>
```

Same API on iOS and Android.

---

## 4. In-screen horizontal slide (wizard / questionnaire)

Used inside a single screen (e.g. assessment questions), not stack navigation.

| Property | Value |
|----------|--------|
| API | React Native `Animated` |
| Driver | `useNativeDriver: true` |
| Axis | Horizontal (`translateX`) |
| Duration | **200ms** |
| Easing | Default (`Easing.inOut` via `Animated.timing`) |

### Forward (next question)

1. Animate current content `translateX: 0 → -screenWidth` (200ms)
2. Swap content
3. Set `translateX: screenWidth`, animate to `0` (200ms)

### Back (previous question)

1. Animate `translateX: 0 → screenWidth` (200ms)
2. Swap content
3. Set `translateX: -screenWidth`, animate to `0` (200ms)

```javascript
const SCREEN_WIDTH = Dimensions.get('window').width;

Animated.timing(slideAnim, {
  toValue: -SCREEN_WIDTH, // or SCREEN_WIDTH for back
  duration: 200,
  useNativeDriver: true,
}).start(callback);
```

Wrap content in:

```javascript
<Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
  {/* question content */}
</Animated.View>
```

**Reference implementation:** `src/screens/coach/FirstTimeAssessmentScreen.js`

---

## 5. Back button UI (cosmetic, not transition)

| Platform | Icon |
|----------|------|
| iOS | `chevron-back` |
| Android | `arrow-back` |

Does not affect transition animation.

---

## 6. Minimal implementation checklist (new app)

1. Install: `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`
2. Create `screenTransitions.js` with `stackScreenOptions` (Section 1)
3. Use `Stack.Navigator screenOptions={stackScreenOptions}` for all stacks
4. Use `createBottomTabNavigator()` with no animation overrides for tabs
5. Use RN `Modal` with `slide` / `fade` for overlays
6. Use `Animated` 200ms horizontal slide for multi-step flows inside one screen

---

## 7. What this spec does *not* include

- Shared element / hero transitions
- Custom spring physics
- `@react-navigation/native-stack` (native stack — different defaults)
- Reanimated layout animations
- Lottie or SVG motion

---

## 8. One-line summary

**Stack:** horizontal slide (iOS default); unify with `TransitionPresets.SlideFromRightIOS`. **Tabs:** instant. **Modals:** `slide` or `fade`. **Wizards:** 200ms horizontal `Animated` slide inside one screen.
