import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton, Button, useTheme } from 'react-native-paper';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <IconButton icon={icon} size={64} iconColor={theme.colors.outline} />
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {description}
        </Text>
      )}
      {action && (
        <Button
          mode="contained"
          onPress={action.onPress}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
        >
          {action.label}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
  },
});
