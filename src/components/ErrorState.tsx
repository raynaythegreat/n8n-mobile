import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton, Button, useTheme } from 'react-native-paper';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <IconButton icon="alert-circle" size={64} iconColor={theme.colors.error} />
      <Text style={[styles.title, { color: theme.colors.error }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>{message}</Text>
      {onRetry && (
        <Button
          mode="contained"
          onPress={onRetry}
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
        >
          Retry
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
  message: {
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
