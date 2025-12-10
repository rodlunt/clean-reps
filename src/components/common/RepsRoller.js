import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { fontSize, borderRadius } from '../../theme';

export default function RepsRoller({
  value,
  onChange,
  placeholder,
  min = 0,
  max = 100,
  step = 1,
}) {
  const { colors } = useTheme();
  const [manualInput, setManualInput] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  const handleIncrement = () => {
    const current = parseInt(value) || 0;
    const newValue = Math.min(max, current + step);
    onChange(newValue.toString());
  };

  const handleDecrement = () => {
    const current = parseInt(value) || 0;
    const newValue = Math.max(min, current - step);
    onChange(newValue.toString());
  };

  const handleManualSubmit = () => {
    const parsed = parseInt(inputValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped.toString());
    }
    setManualInput(false);
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
            setInputValue(value || '');
            setManualInput(true);
          }}
          onLongPress={() => {
            setInputValue(value || '');
            setManualInput(true);
          }}
        >
          <Text style={[styles.valueText, { color: value ? colors.text : colors.placeholder }]}>
            {value || placeholder || 'reps'}
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
    width: 50,
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
    width: 60,
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    fontSize: fontSize.md,
    textAlign: 'center',
    fontWeight: '500',
  },
});
