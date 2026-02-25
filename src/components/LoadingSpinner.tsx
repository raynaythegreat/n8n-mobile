import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { N8N_BRAND_COLOR } from '../theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export function LoadingSpinner({ size = 'large', color }: LoadingSpinnerProps) {
  const theme = useTheme();
  const spinnerColor = color || theme.colors.primary || N8N_BRAND_COLOR;

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={spinnerColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
