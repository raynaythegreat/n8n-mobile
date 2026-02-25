import React from 'react';
import { Portal, Dialog, Text, Button, useTheme } from 'react-native-paper';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor,
}: ConfirmDialogProps) {
  const theme = useTheme();
  const buttonColor = confirmColor || theme.colors.primary;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel}>{cancelText}</Button>
          <Button onPress={onConfirm} textColor={buttonColor}>
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
