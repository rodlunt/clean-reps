import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  PanResponder,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { spacing, fontSize, borderRadius } from '../../theme';

const ROLLER_HEIGHT = 40;
const ITEM_HEIGHT = 32;

export default function WeightRoller({
  value,
  onChange,
  placeholder,
  min = 0,
  max = 500,
  step = 0.5,
}) {
  const { colors } = useTheme();
  const { units } = useSettings();
  const [showRoller, setShowRoller] = useState(false);
  const [manualInput, setManualInput] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const scrollY = useRef(new Animated.Value(0)).current;

  // Generate weight options based on step
  const weightOptions = [];
  for (let w = min; w <= max; w += step) {
    weightOptions.push(w);
  }

  // Find current index
  const currentValue = parseFloat(value) || 0;
  const currentIndex = Math.max(0, weightOptions.findIndex(w => w >= currentValue));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        scrollY.setOffset(scrollY._value);
      },
      onPanResponderMove: (_, gestureState) => {
        scrollY.setValue(-gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        scrollY.flattenOffset();

        // Calculate new index based on gesture
        const newOffset = scrollY._value + gestureState.dy * -0.5;
        let newIndex = Math.round(newOffset / ITEM_HEIGHT);
        newIndex = Math.max(0, Math.min(weightOptions.length - 1, newIndex));

        // Snap to nearest value
        Animated.spring(scrollY, {
          toValue: newIndex * ITEM_HEIGHT,
          useNativeDriver: true,
          friction: 7,
        }).start();

        onChange(weightOptions[newIndex].toString());
      },
    })
  ).current;

  useEffect(() => {
    if (showRoller) {
      Animated.timing(scrollY, {
        toValue: currentIndex * ITEM_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showRoller]);

  const handleIncrement = () => {
    const current = parseFloat(value) || 0;
    const newValue = Math.min(max, current + step);
    onChange(newValue.toString());
  };

  const handleDecrement = () => {
    const current = parseFloat(value) || 0;
    const newValue = Math.max(min, current - step);
    onChange(newValue.toString());
  };

  const handleManualSubmit = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      // Round to nearest step
      const rounded = Math.round(parsed / step) * step;
      onChange(rounded.toString());
    }
    setManualInput(false);
    setShowRoller(false);
  };

  if (manualInput) {
    return (
      <View style={styles.manualContainer}>
        <TextInput
          style={[styles.manualInput, {
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: colors.primary
          }]}
          value={inputValue}
          onChangeText={setInputValue}
          keyboardType="numeric"
          autoFocus
          onBlur={handleManualSubmit}
          onSubmitEditing={handleManualSubmit}
          selectTextOnFocus
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.rollerRow}>
        <TouchableOpacity
          style={[styles.stepButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleDecrement}
        >
          <Text style={[styles.stepButtonText, { color: colors.text }]}>-</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.valueDisplay, {
            backgroundColor: colors.background,
            borderColor: colors.border
          }]}
          onPress={() => {
            // If no value but there's a placeholder, use the placeholder value
            if (!value && placeholder) {
              onChange(placeholder.toString());
            } else {
              setManualInput(true);
            }
          }}
          onLongPress={() => setManualInput(true)}
        >
          <Text style={[styles.valueText, { color: value ? colors.text : colors.placeholder }]}>
            {value || placeholder || units}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleIncrement}
        >
          <Text style={[styles.stepButtonText, { color: colors.text }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  rollerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepButton: {
    width: 28,
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  valueDisplay: {
    width: 60,
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  manualContainer: {
    alignItems: 'center',
  },
  manualInput: {
    width: 70,
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    fontSize: fontSize.md,
    textAlign: 'center',
    fontWeight: '500',
  },
});
