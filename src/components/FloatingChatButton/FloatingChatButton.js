import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, scale } from '../../utils';

const { width, height } = Dimensions.get('window');

const FloatingSupportButton = ({ onPress }) => {
  // Position the button at bottom-right with proper spacing
  const [pan] = useState(new Animated.ValueXY({ 
    x: width - 60, // 60px from right edge
    y: height - 120 // 120px from bottom (to avoid bottom tab)
  }));

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event(
      [
        null,
        {
          dx: pan.x,
          dy: pan.y,
        },
      ],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (e, gesture) => {
      let finalX = gesture.moveX;
      let finalY = gesture.moveY;

      // Ensure the button stays within screen bounds with some padding
      const buttonSize = 40;
      const padding = 10;
      const bottomTabHeight = 80; // Approximate bottom tab height
      
      if (finalX < padding) finalX = padding;
      if (finalX > width - buttonSize - padding) finalX = width - buttonSize - padding;
      if (finalY < padding) finalY = padding;
      if (finalY > height - buttonSize - bottomTabHeight - padding) {
        finalY = height - buttonSize - bottomTabHeight - padding;
      }

      Animated.spring(pan, {
        toValue: { x: finalX - buttonSize/2, y: finalY - buttonSize/2 },
        useNativeDriver: false,
        friction: 5,
        tension: 40
      }).start();
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <MaterialIcons name="support-agent" size={20} color={colors.white} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    width: scale(40),
    height: scale(40),
    borderRadius: 20,
    backgroundColor: colors.btncolor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default FloatingSupportButton; 