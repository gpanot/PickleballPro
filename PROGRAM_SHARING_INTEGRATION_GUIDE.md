# Program Sharing - Phase 1 Implementation Guide

## 🎯 **What's Implemented**

✅ **QR Code Generation & Display**  
✅ **Share Button with Native Share Sheet**  
✅ **Database Schema for Sharing**  
✅ **Deep Link Structure & Handling**  
✅ **Add to My Programs Flow**  

## 🔧 **Integration Steps**

### 1. **Run Database Migration**
Execute the SQL migration to add sharing fields:
```bash
# Run this in your Supabase SQL editor
cat add_program_sharing_fields_migration.sql
```

### 2. **Configure Deep Links in App Config**
Add to `app.json`:
```json
{
  "expo": {
    "scheme": "pickleballhero",
    "ios": {
      "associatedDomains": ["applinks:pickleballhero.app"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "pickleballhero"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### 3. **Initialize Deep Link Handling**
Add to your main navigation component (e.g., `App.js`):
```javascript
import { initializeDeepLinkHandling } from './src/lib/deepLinkHandler';

// In your main component
useEffect(() => {
  const cleanup = initializeDeepLinkHandling(navigation);
  return cleanup;
}, [navigation]);
```

### 4. **Install Required Dependencies**
Already installed:
- `react-native-qrcode-svg`
- `react-native-svg`

## 📱 **How It Works**

### **For Program Owners (Sharing)**
1. **Open Program**: Navigate to any owned program
2. **See QR Code**: QR code appears below sessions list
3. **Share Options**: 
   - Scan QR code (in-person sharing)
   - Tap "Share Link" button (remote sharing)
4. **Share Token**: Automatically generated on first share

### **For Recipients (Receiving)**
1. **Scan QR Code** or **Tap Share Link**
2. **App Opens**: Deep link opens app (or app store if not installed)
3. **Confirmation Dialog**: "Add Shared Program" dialog appears
4. **Add to Collection**: Program added to user's personal collection

## 🔗 **Deep Link Structure**
```
pickleballhero://program/share/{program_id}?token={share_token}
```

**Example:**
```
pickleballhero://program/share/123e4567-e89b-12d3-a456-426614174000?token=1703123456789_x7k9m2p4q
```

## 🎨 **UI Components Added**

### **Sharing Section** (ProgramDetailScreen)
- **Location**: Below sessions list
- **Visibility**: Only for owned programs (not explore programs)
- **Components**:
  - QR Code with app logo
  - Program name and stats
  - Share button with native sheet

### **Visual Design**
```
┌─────────────────────────────┐
│     Share Program           │
│  Let others add this        │
│  program to their collection│
│                             │
│     ┌─────────────┐         │
│     │ [QR CODE]   │         │
│     │   with 🏓   │         │
│     └─────────────┘         │
│                             │
│   "Master the Soft Game"    │
│   2 sessions • 8 exercises  │
│                             │
│      [📱 Share Link]        │
└─────────────────────────────┘
```

## 🔒 **Security Features**

- **Unique Share Tokens**: Generated per program
- **Owner Verification**: Only program owners can generate shares
- **Shareable Flag**: Programs can be made private
- **Database Validation**: Share tokens validated server-side
- **Read-Only Access**: Recipients get copies, not original access

## 📊 **Database Schema Added**

```sql
-- New columns in programs table
share_token TEXT UNIQUE,           -- Unique sharing token
is_shareable BOOLEAN DEFAULT true, -- Can be shared
share_count INTEGER DEFAULT 0,     -- Track share popularity
last_shared_at TIMESTAMP          -- Last share timestamp
```

## 🚀 **Testing the Feature**

### **Test Sharing Flow**
1. Create a program with sessions
2. Scroll down to see sharing section
3. Tap "Share Link" → Native share sheet opens
4. Share via any method (Messages, WhatsApp, etc.)

### **Test Receiving Flow**
1. Open shared link on another device/account
2. App should open with "Add Shared Program" dialog
3. Tap "Add Program" → Program appears in collection
4. Verify program has all sessions and exercises

## 🔄 **Next Steps (Phase 2)**

- [ ] Share statistics dashboard
- [ ] Program attribution ("Created by @username")
- [ ] Privacy controls (public/private toggle)
- [ ] Share expiration dates
- [ ] Program update notifications for recipients

## 🐛 **Troubleshooting**

### **QR Code Not Showing**
- Check if `source !== 'explore'` (only shows for owned programs)
- Verify QR code library installation
- Check console for generation errors

### **Deep Links Not Working**
- Verify app.json scheme configuration
- Test with `npx uri-scheme open pickleballhero://program/share/test?token=test --ios`
- Check deep link handler initialization

### **Share Token Issues**
- Run database migration
- Check RPC function permissions
- Verify user authentication

The Phase 1 implementation is now complete and ready for testing! 🎉
