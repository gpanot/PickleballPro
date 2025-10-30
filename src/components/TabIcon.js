import React from 'react';
import { View, StyleSheet } from 'react-native';

// Modern tab icon component with geometric shapes
export default function TabIcon({ name, focused, size = 24, color = '#000' }) {
  const renderIcon = () => {
    switch (name) {
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
                width: size * 0.8,
                height: size * 0.8,
              }
            ]}>
              <View style={[
                styles.coachInner,
                { 
                  backgroundColor: focused ? 'white' : color,
                  width: size * 0.4,
                  height: size * 0.4,
                }
              ]} />
            </View>
          </View>
        );
        
      case 'logbook':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.logbookIcon,
              { 
                backgroundColor: focused ? color : 'transparent',
                borderColor: color,
                width: size * 0.7,
                height: size * 0.8,
              }
            ]}>
              <View style={[
                styles.logbookLine1,
                { 
                  backgroundColor: focused ? 'white' : color,
                  width: size * 0.4,
                  height: size * 0.08,
                }
              ]} />
              <View style={[
                styles.logbookLine2,
                { 
                  backgroundColor: focused ? 'white' : color,
                  width: size * 0.5,
                  height: size * 0.08,
                }
              ]} />
              <View style={[
                styles.logbookLine3,
                { 
                  backgroundColor: focused ? 'white' : color,
                  width: size * 0.3,
                  height: size * 0.08,
                }
              ]} />
            </View>
          </View>
        );
        
      case 'profile':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.profileHead,
              { 
                backgroundColor: focused ? color : 'transparent',
                borderColor: color,
                width: size * 0.4,
                height: size * 0.4,
              }
            ]} />
            <View style={[
              styles.profileBody,
              { 
                backgroundColor: focused ? color : 'transparent',
                borderColor: color,
                width: size * 0.7,
                height: size * 0.4,
                marginTop: size * 0.05,
              }
            ]} />
          </View>
        );
        
      case 'training2':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.training2Icon,
              { 
                backgroundColor: focused ? color : 'transparent',
                borderColor: color,
                width: size * 0.8,
                height: size * 0.8,
              }
            ]}>
              <View style={[
                styles.training2Plus1,
                { 
                  backgroundColor: focused ? 'white' : color,
                  width: size * 0.5,
                  height: size * 0.1,
                }
              ]} />
              <View style={[
                styles.training2Plus2,
                { 
                  backgroundColor: focused ? 'white' : color,
                  width: size * 0.1,
                  height: size * 0.5,
                }
              ]} />
            </View>
          </View>
        );
        
      case 'feedback':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.feedbackIcon,
              { 
                backgroundColor: focused ? color : 'transparent',
                borderColor: color,
                width: size * 0.8,
                height: size * 0.7,
              }
            ]}>
              <View style={[
                styles.feedbackHeart,
                { 
                  backgroundColor: focused ? 'white' : color,
                  width: size * 0.3,
                  height: size * 0.3,
                }
              ]} />
            </View>
          </View>
        );
        
      case 'search':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.searchIcon,
              { 
                backgroundColor: focused ? color : 'transparent',
                borderColor: color,
                width: size * 0.6,
                height: size * 0.6,
              }
            ]} />
            <View style={[
              styles.searchHandle,
              { 
                backgroundColor: color,
                width: size * 0.15,
                height: size * 0.25,
                transform: [{ rotate: '45deg' }],
                position: 'absolute',
                right: size * 0.1,
                bottom: size * 0.1,
              }
            ]} />
          </View>
        );
        
      case 'dashboard':
        return (
          <View style={[styles.iconContainer, { width: size, height: size }]}>
            <View style={[
              styles.dashboardIcon,
              { 
                backgroundColor: focused ? color : 'transparent',
                borderColor: color,
                width: size * 0.8,
                height: size * 0.8,
              }
            ]}>
              <View style={[
                styles.dashboardLine1,
                { 
                  backgroundColor: focused ? 'white' : color,
                  width: size * 0.25,
                  height: size * 0.04,
                }
              ]} />
              <View style={[
                styles.dashboardLine2,
                { 
                  backgroundColor: focused ? 'white' : color,
                  width: size * 0.25,
                  height: size * 0.04,
                }
              ]} />
              <View style={[
                styles.dashboardLine3,
                { 
                  backgroundColor: focused ? 'white' : color,
                  width: size * 0.25,
                  height: size * 0.04,
                }
              ]} />
            </View>
          </View>
        );
        
      default:
        return (
          <View style={[
            styles.defaultIcon,
            { 
              backgroundColor: focused ? color : 'transparent',
              borderColor: color,
              width: size * 0.7,
              height: size * 0.7,
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
  // Training icon (target/bullseye)
  trainingIcon: {
    borderRadius: 50,
    borderWidth: 2,
    position: 'absolute',
  },
  trainingCenter: {
    borderRadius: 50,
    position: 'absolute',
  },
  // Coach icon (diamond/gem shape)
  coachIcon: {
    borderWidth: 2,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachInner: {
    borderRadius: 50,
  },
  // Logbook icon (notebook with lines)
  logbookIcon: {
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  logbookLine1: {
    borderRadius: 1,
  },
  logbookLine2: {
    borderRadius: 1,
  },
  logbookLine3: {
    borderRadius: 1,
  },
  // Profile icon (person silhouette)
  profileHead: {
    borderRadius: 50,
    borderWidth: 2,
  },
  profileBody: {
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderWidth: 2,
    borderBottomWidth: 0,
  },
  // Training2 icon (plus in circle)
  training2Icon: {
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  training2Plus1: {
    borderRadius: 1,
    position: 'absolute',
  },
  training2Plus2: {
    borderRadius: 1,
    position: 'absolute',
  },
  // Feedback icon (heart shape)
  feedbackIcon: {
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  feedbackHeart: {
    borderRadius: 50,
    transform: [{ rotate: '-45deg' }],
  },
  // Search icon (magnifying glass)
  searchIcon: {
    borderRadius: 50,
    borderWidth: 2,
  },
  searchHandle: {
    borderRadius: 1,
  },
  // Dashboard icon (clipboard/dashboard)
  dashboardIcon: {
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 3,
    gap: 2,
  },
  dashboardLine1: {
    borderRadius: 2,
    marginTop: 3,
  },
  dashboardLine2: {
    borderRadius: 2,
  },
  dashboardLine3: {
    borderRadius: 2,
  },
  // Default fallback
  defaultIcon: {
    borderRadius: 50,
    borderWidth: 2,
  },
});
