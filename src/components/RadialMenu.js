import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const RadialMenu = ({ visible, position, options, onSelect, onDismiss }) => {
  const [highlightedOption, setHighlightedOption] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(position);
  const scaleAnims = useRef({});
  
  // Fade and scale animations for the entire menu
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Debug: Log when component mounts/unmounts
  useEffect(() => {
    console.log('🎯 RadialMenu MOUNTED');
    return () => console.log('🎯 RadialMenu UNMOUNTED');
  }, []);

  // Update current position when visible changes
  useEffect(() => {
    console.log('🎯 RadialMenu visible changed:', visible, 'position:', position, 'options:', options.length);
    if (visible) {
      setCurrentPosition(position);
    }
  }, [visible, position]);

  // Initialize scale animations for each option
  useEffect(() => {
    if (options.length > 0) {
      options.forEach(option => {
        if (!scaleAnims.current[option.id]) {
          scaleAnims.current[option.id] = new Animated.Value(1);
        }
      });
    }
  }, [options]);
  
  // Animate menu appearance/disappearance
  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Calculate if touch is near an option
  const getOptionAtPosition = (x, y) => {
    const totalOptions = options.length;
    
    for (let index = 0; index < totalOptions; index++) {
      let angle;
      if (totalOptions === 3) {
        angle = index === 0 ? -90 : index === 1 ? 135 : 45;
      } else {
        angle = -90 + (index * 90);
      }
      
      const radius = 90; // Increased from 80 for easier sliding
      const radian = (angle * Math.PI) / 180;
      const optionX = position.x + Math.cos(radian) * radius;
      const optionY = position.y + Math.sin(radian) * radius;
      
      // Check if touch is within 50px of option center
      const distance = Math.sqrt(Math.pow(x - optionX, 2) + Math.pow(y - optionY, 2));
      if (distance < 50) {
        return options[index];
      }
    }
    return null;
  };

  const onGestureEvent = (event) => {
    const { nativeEvent } = event;
    
    // onGestureEvent fires continuously during movement, regardless of state
    const touchX = nativeEvent.absoluteX;
    const touchY = nativeEvent.absoluteY;
    
    console.log('🔵 RadialMenu onGestureEvent - Moving:', touchX, touchY);
    
    // Update center indicator position to follow finger
    setCurrentPosition({ x: touchX, y: touchY });
    
    const option = getOptionAtPosition(touchX, touchY);
    
    if (option && option.id !== highlightedOption) {
      console.log('✅ RadialMenu - Highlighting:', option.label);
      // Haptic feedback on selection change
      Haptics.selectionAsync();
      
      // Reset previous highlighted option
      if (highlightedOption && scaleAnims.current[highlightedOption]) {
        Animated.spring(scaleAnims.current[highlightedOption], {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 8,
        }).start();
      }
      
      // Highlight new option
      setHighlightedOption(option.id);
      Animated.spring(scaleAnims.current[option.id], {
        toValue: 1.15,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }).start();
    } else if (!option && highlightedOption) {
      console.log('⚪ RadialMenu - Moving away from options');
      // Reset when moving away
      Animated.spring(scaleAnims.current[highlightedOption], {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }).start();
      setHighlightedOption(null);
    }
  };

  const onHandlerStateChange = (event) => {
    const { nativeEvent } = event;
    
    console.log('🟢 RadialMenu onHandlerStateChange - state:', nativeEvent.state, 'BEGAN:', State.BEGAN, 'END:', State.END);
    
    if (nativeEvent.state === State.BEGAN) {
      console.log('🟢 RadialMenu - Touch BEGAN at:', nativeEvent.absoluteX, nativeEvent.absoluteY);
      setCurrentPosition({
        x: nativeEvent.absoluteX,
        y: nativeEvent.absoluteY,
      });
    } else if (nativeEvent.state === State.END) {
      console.log('🟢 RadialMenu - Touch END, highlighted:', highlightedOption);
      if (highlightedOption) {
        // Light haptic on selection
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        console.log('✅ RadialMenu - Selecting option:', highlightedOption);
        onSelect(highlightedOption);
        // Reset all animations
        Object.keys(scaleAnims.current).forEach(key => {
          scaleAnims.current[key].setValue(1);
        });
        setHighlightedOption(null);
      } else {
        console.log('❌ RadialMenu - No option selected, dismissing');
        onDismiss();
      }
    }
  };

  if (!visible) return null;

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      enabled={visible}
      shouldCancelWhenOutside={false}
      activeOffsetX={[-10, 10]}
      activeOffsetY={[-10, 10]}
    >
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          }
        ]} 
      >
        <Animated.View 
          style={[
            styles.menuContainer,
            {
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
        {options.map((option, index) => {
          const totalOptions = options.length;
          let angle;
          if (totalOptions === 3) {
            angle = index === 0 ? -90 : index === 1 ? 135 : 45;
          } else {
            angle = -90 + (index * 90);
          }
          
          const radius = 90; // Increased from 80 for easier sliding
          const radian = (angle * Math.PI) / 180;
          const x = position.x + Math.cos(radian) * radius;
          const y = position.y + Math.sin(radian) * radius;
          
          const isHighlighted = highlightedOption === option.id;
          const scale = scaleAnims.current[option.id] || new Animated.Value(1);
          
          return (
            <Animated.View
              key={option.id}
              style={[
                styles.menuItem,
                {
                  left: x - 40,
                  top: y - 20,
                  borderColor: option.color,
                  backgroundColor: isHighlighted ? option.color : '#FFFFFF',
                  transform: [{ scale }],
                },
              ]}
            >
              <Text
                style={[
                  styles.menuItemText,
                  isHighlighted && styles.menuItemTextHighlighted,
                ]}
              >
                {option.label}
              </Text>
            </Animated.View>
          );
        })}
        
        {/* Center indicator - follows finger */}
        <View
          style={[
            styles.centerIndicator,
            {
              left: currentPosition.x - 15,
              top: currentPosition.y - 15,
            },
          ]}
        />
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // Lighter overlay
    zIndex: 1000,
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  menuItemTextHighlighted: {
    color: '#FFFFFF',
  },
  centerIndicator: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});

export default RadialMenu;

