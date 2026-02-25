import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';

interface TagChipProps {
  name: string;
  onPress?: () => void;
}

export function TagChip({ name, onPress }: TagChipProps) {
  const theme = useTheme();

  return (
    <Chip
      compact
      mode="outlined"
      onPress={onPress}
      style={[styles.chip, { borderColor: theme.colors.outlineVariant }]}
      textStyle={[styles.text, { color: theme.colors.onSurfaceVariant }]}
    >
      {name}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 26,
    marginRight: 6,
    marginBottom: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '500',
  },
});
