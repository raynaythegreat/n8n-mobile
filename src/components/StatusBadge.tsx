import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

type Status = 'success' | 'error' | 'running' | 'waiting' | 'unknown';

interface StatusBadgeProps {
  status: Status;
}

const statusConfig: Record<Status, { label: string; backgroundColor: string; textColor: string }> = {
  success: { label: 'Success', backgroundColor: '#d4edda', textColor: '#155724' },
  error: { label: 'Error', backgroundColor: '#f8d7da', textColor: '#721c24' },
  running: { label: 'Running', backgroundColor: '#cce5ff', textColor: '#004085' },
  waiting: { label: 'Waiting', backgroundColor: '#fff3cd', textColor: '#856404' },
  unknown: { label: 'Unknown', backgroundColor: '#e2e3e5', textColor: '#383d41' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const theme = useTheme();
  const config = statusConfig[status];

  if (status === 'running') {
    config.backgroundColor = `${theme.colors.primary}20`;
    config.textColor = theme.colors.primary;
  }

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.text, { color: config.textColor }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
