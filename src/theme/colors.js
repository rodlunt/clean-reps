export const colors = {
  light: {
    primary: '#14B8A6', // Teal accent
    background: '#FFFFFF',
    card: '#F3F4F6',
    text: '#1F2937',
    textSecondary: '#6B7280',
    placeholder: '#9CA3AF',
    border: '#E5E7EB',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    // Super subtle gradient pairs (barely perceptible ~2% difference)
    cardGradient: ['#F5F6F8', '#F1F2F4'],
    backgroundGradient: ['#FFFFFF', '#FCFCFD'],
  },
  dark: {
    primary: '#14B8A6', // Teal accent (same in both modes)
    background: '#1F2937',
    card: '#374151',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    placeholder: '#6B7280',
    border: '#4B5563',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    // Super subtle gradient pairs (barely perceptible ~2% difference)
    cardGradient: ['#3A4556', '#343E4D'],
    backgroundGradient: ['#212A38', '#1D2533'],
  },
};

// Shadow presets for elevation - light mode (standard drop shadows)
export const shadowsLight = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
};

// Shadow presets for dark mode (subtle glow/lift effect)
export const shadowsDark = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
};

// Legacy export for backwards compatibility
export const shadows = shadowsLight;
