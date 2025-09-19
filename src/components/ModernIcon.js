import React from 'react';
import { View, StyleSheet } from 'react-native';

// Modern icon component for UI elements
export default function ModernIcon({ name, size = 20, color = '#6B7280', focused = false }) {
  console.log('ModernIcon rendering:', { name, size, color });
  
  const renderIcon = () => {
    switch (name) {
      case 'edit':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.editIcon,
              { 
                borderColor: color,
                width: size * 0.7,
                height: size * 0.7,
              }
            ]} />
            <View style={[
              styles.editTip,
              { 
                backgroundColor: color,
                width: size * 0.2,
                height: size * 0.2,
              }
            ]} />
          </View>
        );
        
      case 'sync':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.syncIcon,
              { 
                borderColor: color,
                width: size * 0.8,
                height: size * 0.8,
              }
            ]}>
              <View style={[
                styles.syncArrow,
                { backgroundColor: color }
              ]} />
            </View>
          </View>
        );
        
      case 'action':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.actionIcon,
              { 
                backgroundColor: color,
                width: size * 0.8,
                height: size * 0.8,
              }
            ]} />
          </View>
        );
        
      case 'training':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.trainingIcon,
              { 
                borderColor: color,
                backgroundColor: focused ? color : 'transparent',
                width: size * 0.7,
                height: size * 0.7,
              }
            ]} />
            <View style={[
              styles.trainingCenter,
              { 
                backgroundColor: focused ? 'white' : color,
                width: size * 0.3,
                height: size * 0.3,
              }
            ]} />
          </View>
        );
        
      case 'coach':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.coachIcon,
              { 
                backgroundColor: focused ? color : 'transparent',
                borderColor: color,
                width: size * 0.7,
                height: size * 0.7,
              }
            ]}>
              <View style={[
                styles.coachInner,
                { 
                  backgroundColor: focused ? 'white' : color,
                  width: size * 0.3,
                  height: size * 0.3,
                }
              ]} />
            </View>
          </View>
        );
        
      case 'progress':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.progressIcon,
              { 
                borderColor: color,
                width: size * 0.8,
                height: size * 0.8,
              }
            ]} />
            <View style={[
              styles.progressFill,
              { 
                backgroundColor: color,
                width: size * 0.6,
                height: size * 0.3,
              }
            ]} />
          </View>
        );
        
      case 'challenge':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.challengeIcon,
              { 
                backgroundColor: color,
                width: size * 0.6,
                height: size * 0.8,
              }
            ]} />
            <View style={[
              styles.challengeStar,
              { 
                backgroundColor: 'white',
                width: size * 0.3,
                height: size * 0.3,
              }
            ]} />
          </View>
        );
        
      case 'activity':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.activityIcon,
              { 
                backgroundColor: color,
                width: size * 0.5,
                height: size * 0.8,
              }
            ]} />
          </View>
        );
        
      case 'settings':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.settingsIcon,
              { 
                borderColor: color,
                width: size * 0.7,
                height: size * 0.7,
              }
            ]}>
              {[0, 1, 2, 3].map(i => (
                <View 
                  key={i}
                  style={[
                    styles.settingsDot,
                    { 
                      backgroundColor: color,
                      width: size * 0.15,
                      height: size * 0.15,
                      transform: [{ rotate: `${i * 90}deg` }],
                    }
                  ]} 
                />
              ))}
            </View>
          </View>
        );
        
      case 'help':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.helpIcon,
              { 
                borderColor: color,
                width: size * 0.8,
                height: size * 0.8,
              }
            ]}>
              <View style={[
                styles.helpQuestion,
                { 
                  backgroundColor: color,
                  width: size * 0.3,
                  height: size * 0.5,
                }
              ]} />
            </View>
          </View>
        );
        
      case 'logout':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.logoutIcon,
              { 
                borderColor: color,
                width: size * 0.6,
                height: size * 0.8,
              }
            ]} />
            <View style={[
              styles.logoutArrow,
              { 
                backgroundColor: color,
                width: size * 0.4,
                height: size * 0.2,
              }
            ]} />
          </View>
        );
        
      case 'back':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.backArrow,
              { 
                borderColor: color,
                width: size * 0.6,
                height: size * 0.6,
              }
            ]} />
          </View>
        );
        
      case 'target':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.targetOuter,
              { 
                borderColor: color,
                width: size * 0.8,
                height: size * 0.8,
              }
            ]} />
            <View style={[
              styles.targetCenter,
              { 
                backgroundColor: color,
                width: size * 0.3,
                height: size * 0.3,
              }
            ]} />
          </View>
        );
        
      case 'time':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.timeIcon,
              { 
                borderColor: color,
                width: size * 0.8,
                height: size * 0.8,
              }
            ]} />
            <View style={[
              styles.timeHand,
              { 
                backgroundColor: color,
                width: size * 0.08,
                height: size * 0.4,
              }
            ]} />
          </View>
        );
        
      case 'play':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.playIcon,
              { 
                backgroundColor: color,
                width: size * 0.6,
                height: size * 0.6,
              }
            ]} />
          </View>
        );
        
      case 'pause':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.pauseIcon1,
              { 
                backgroundColor: color,
                width: size * 0.2,
                height: size * 0.6,
              }
            ]} />
            <View style={[
              styles.pauseIcon2,
              { 
                backgroundColor: color,
                width: size * 0.2,
                height: size * 0.6,
              }
            ]} />
          </View>
        );
        
      case 'checkmark':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.checkIcon,
              { 
                backgroundColor: color,
                width: size * 0.8,
                height: size * 0.8,
              }
            ]} />
            <View style={[
              styles.checkMark,
              { 
                backgroundColor: 'white',
                width: size * 0.4,
                height: size * 0.2,
              }
            ]} />
          </View>
        );
        
      case 'close':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.closeIcon,
              { 
                backgroundColor: color,
                width: size * 0.8,
                height: size * 0.8,
              }
            ]} />
            <View style={[
              styles.closeLine1,
              { 
                backgroundColor: 'white',
                width: size * 0.5,
                height: size * 0.08,
              }
            ]} />
            <View style={[
              styles.closeLine2,
              { 
                backgroundColor: 'white',
                width: size * 0.5,
                height: size * 0.08,
              }
            ]} />
          </View>
        );
        
      case 'star':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.starIcon,
              { 
                backgroundColor: color,
                width: size * 0.7,
                height: size * 0.7,
              }
            ]} />
          </View>
        );
        
      case 'share':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.shareIcon,
              { 
                borderColor: color,
                width: size * 0.6,
                height: size * 0.6,
              }
            ]} />
            <View style={[
              styles.shareArrow,
              { 
                backgroundColor: color,
                width: size * 0.3,
                height: size * 0.2,
              }
            ]} />
          </View>
        );
        
        default:
        console.log('ModernIcon: Unknown icon name:', name);
        return (
          <View style={[
            styles.defaultIcon,
            { 
              backgroundColor: color,
              width: size * 0.6,
              height: size * 0.6,
            }
          ]} />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderIcon()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  // Edit icon (pencil)
  editIcon: {
    borderRadius: 2,
    borderWidth: 1.5,
    transform: [{ rotate: '45deg' }],
  },
  editTip: {
    borderRadius: 2,
    position: 'absolute',
    top: '10%',
    right: '10%',
  },
  
  // Sync icon (circular arrow)
  syncIcon: {
    borderRadius: 50,
    borderWidth: 1.5,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncArrow: {
    width: 3,
    height: 6,
    borderRadius: 1,
  },
  
  // Action icon (circle)
  actionIcon: {
    borderRadius: 50,
  },
  
  // Training icon (target)
  trainingIcon: {
    borderRadius: 50,
    borderWidth: 2,
    position: 'absolute',
  },
  trainingCenter: {
    borderRadius: 50,
    position: 'absolute',
  },
  
  // Coach icon (diamond)
  coachIcon: {
    borderWidth: 1.5,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachInner: {
    borderRadius: 50,
  },
  
  // Progress icon (chart)
  progressIcon: {
    borderRadius: 4,
    borderWidth: 1.5,
    position: 'absolute',
  },
  progressFill: {
    borderRadius: 2,
    position: 'absolute',
    bottom: '20%',
  },
  
  // Challenge icon (trophy)
  challengeIcon: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeStar: {
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  
  // Activity icon (bar)
  activityIcon: {
    borderRadius: 2,
  },
  
  // Settings icon (gear)
  settingsIcon: {
    borderRadius: 50,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  settingsDot: {
    borderRadius: 50,
    position: 'absolute',
  },
  
  // Help icon (question mark)
  helpIcon: {
    borderRadius: 50,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpQuestion: {
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  
  // Logout icon (door with arrow)
  logoutIcon: {
    borderWidth: 1.5,
    borderRadius: 2,
    position: 'absolute',
  },
  logoutArrow: {
    borderRadius: 1,
    position: 'absolute',
    right: '-20%',
  },
  
  // Back arrow
  backArrow: {
    borderRadius: 50,
    borderWidth: 1.5,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '225deg' }],
  },
  
  // Target icon
  targetOuter: {
    borderRadius: 50,
    borderWidth: 2,
    position: 'absolute',
  },
  targetCenter: {
    borderRadius: 50,
    position: 'absolute',
  },
  
  // Time icon (clock)
  timeIcon: {
    borderRadius: 50,
    borderWidth: 1.5,
    position: 'absolute',
  },
  timeHand: {
    borderRadius: 1,
    position: 'absolute',
    top: '20%',
  },
  
  // Play icon (triangle)
  playIcon: {
    borderRadius: 2,
  },
  
  // Pause icon (two bars)
  pauseIcon1: {
    borderRadius: 1,
    position: 'absolute',
    left: '30%',
  },
  pauseIcon2: {
    borderRadius: 1,
    position: 'absolute',
    right: '30%',
  },
  
  // Checkmark icon
  checkIcon: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  
  // Close icon (X)
  closeIcon: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLine1: {
    borderRadius: 1,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
  closeLine2: {
    borderRadius: 1,
    position: 'absolute',
    transform: [{ rotate: '-45deg' }],
  },
  
  // Star icon
  starIcon: {
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  
  // Share icon
  shareIcon: {
    borderRadius: 50,
    borderWidth: 1.5,
    position: 'absolute',
  },
  shareArrow: {
    borderRadius: 1,
    position: 'absolute',
    top: '20%',
    right: '-10%',
  },
  
  // Default fallback
  defaultIcon: {
    borderRadius: 50,
  },
});
