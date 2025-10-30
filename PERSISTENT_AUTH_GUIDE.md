# Persistent Authentication Implementation Guide

## Overview

This implementation ensures that users remain logged in after app updates, providing a seamless experience. The authentication state is preserved using multiple layers of persistence and recovery mechanisms.

## Key Features

### 1. **Supabase Native Persistence**
- Configured with custom AsyncStorage adapter for React Native
- Automatic token refresh enabled
- Session persistence across app restarts

### 2. **Backup Session Recovery**
- Creates backup of session data in AsyncStorage
- Attempts session recovery if primary session fails
- Automatic cleanup of expired backup sessions (7 days)

### 3. **App Version Management**
- Tracks app version changes
- Preserves sessions across minor/patch updates
- Configurable behavior for major version updates

### 4. **Graceful Fallback**
- Multiple fallback mechanisms if primary auth fails
- User data recovery from backup
- Clear error handling and logging

## Implementation Details

### Files Modified

1. **`src/lib/supabase.js`**
   - Added custom AsyncStorage adapter
   - Configured Supabase client with persistence options
   - Enabled automatic token refresh

2. **`src/context/AuthContext.js`**
   - Added session backup and recovery logic
   - Implemented app version checking
   - Enhanced initialization with fallback mechanisms

3. **`src/lib/appVersion.js`** (New)
   - Centralized version management
   - Helper functions for version comparison
   - Configurable session preservation rules

### Storage Keys Used

- `@pickleball_hero:app_version` - Stores current app version
- `@pickleball_hero:session_backup` - Backup session data
- Supabase native keys (managed automatically)

## How It Works

### 1. **Initial Authentication**
```javascript
// When user logs in
1. Supabase creates session with tokens
2. Session is automatically stored by Supabase
3. Backup copy is created in AsyncStorage
4. App version is tracked
```

### 2. **App Restart/Update**
```javascript
// When app starts
1. Check for stored app version
2. Try to get current Supabase session
3. If session fails, attempt recovery from backup
4. If backup fails, user needs to log in again
5. Update app version if changed
```

### 3. **Session Recovery Process**
```javascript
// Recovery steps
1. Check if backup session exists
2. Validate backup age (max 7 days)
3. Try to refresh session using stored refresh token
4. If refresh succeeds, restore full session
5. If refresh fails, use backup user data for basic auth
6. Clear invalid backup data
```

## Configuration

### App Version Updates

To update the app version, simply update the version in `package.json`:

```json
{
  "version": "1.1.0"  // Update this for new releases
}
```

The system will automatically:
- Detect version changes
- Preserve sessions for minor/patch updates
- Optionally clear data for major updates (configurable)

### Session Backup Settings

Current settings:
- **Backup Duration**: 7 days maximum
- **Auto Refresh**: Enabled
- **Persistence**: Enabled across app restarts

To modify these settings, edit the constants in `AuthContext.js`:

```javascript
// Modify backup duration (in milliseconds)
const BACKUP_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Modify session preservation rules in appVersion.js
export const shouldPreserveSession = (oldVersion, newVersion) => {
  // Customize logic here
  return true; // Always preserve for now
};
```

## Testing

### Test Scenarios

1. **Normal Login/Logout**
   - User logs in → session persists
   - User logs out → session cleared

2. **App Restart**
   - Close app completely
   - Reopen app → user should still be logged in

3. **App Update (Minor)**
   - Update app version in package.json
   - Restart app → user should still be logged in

4. **Network Issues**
   - Disconnect network during app start
   - App should attempt recovery from backup

5. **Expired Session**
   - Wait for session to expire (or manually expire)
   - App should attempt refresh or recovery

### Debug Logging

The implementation includes comprehensive logging. Look for these log prefixes:

- `🔐` - Supabase authentication events
- `🔄` - AuthContext operations
- `Storage` - AsyncStorage operations

## Troubleshooting

### Common Issues

1. **User gets logged out after update**
   - Check if app version was updated correctly
   - Verify `shouldPreserveSession` logic
   - Check backup session age

2. **Session not persisting**
   - Verify AsyncStorage permissions
   - Check Supabase configuration
   - Review error logs

3. **Recovery not working**
   - Check backup session data in AsyncStorage
   - Verify refresh token validity
   - Review network connectivity

4. **App gets stuck in loading state / Retry button doesn't work**
   - **FIXED**: Added multiple timeout mechanisms (5s initialization, 3s session fetch, 4s recovery)
   - **FIXED**: Loading state is now always cleared, even if recovery fails
   - **FIXED**: Early returns in initialization now properly set loading to false
   - **FIXED**: Race conditions with async operations are handled with Promise.race()
   - If issue persists, check console logs for timeout warnings

### Debug Commands

```javascript
// Check stored data
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check app version
const version = await AsyncStorage.getItem('@pickleball_hero:app_version');

// Check backup session
const backup = await AsyncStorage.getItem('@pickleball_hero:session_backup');

// Clear all auth data (for testing)
await AsyncStorage.multiRemove([
  '@pickleball_hero:app_version',
  '@pickleball_hero:session_backup'
]);
```

## Security Considerations

1. **Token Storage**: Tokens are stored securely by Supabase and AsyncStorage
2. **Backup Cleanup**: Expired backups are automatically removed
3. **Session Validation**: All sessions are validated before use
4. **Error Handling**: Sensitive data is not logged

## Future Enhancements

1. **Biometric Authentication**: Add fingerprint/face ID for additional security
2. **Session Encryption**: Encrypt backup session data
3. **Multi-Device Sync**: Sync sessions across devices
4. **Advanced Recovery**: More sophisticated recovery mechanisms

## Maintenance

### Regular Tasks

1. **Update App Version**: When releasing new versions
2. **Monitor Logs**: Check for authentication issues
3. **Test Updates**: Verify persistence after each update
4. **Clean Storage**: Periodically clear old backup data

### Version History

- **v1.0.0**: Initial implementation with basic persistence
- **v1.1.0**: Added backup recovery and version management
- **v1.2.0**: Enhanced error handling and logging

---

This implementation provides robust authentication persistence that should handle most app update scenarios while maintaining security and user experience.
