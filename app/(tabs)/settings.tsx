import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  List,
  Switch,
  Divider,
  Button,
  Surface,
  useTheme,
  Dialog,
  Portal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme as useAppTheme, ThemeMode } from '@/src/context/ThemeContext';
import { useN8n } from '@/src/context/N8nContext';
import { useRouter } from 'expo-router';
import { N8N_BRAND_COLOR } from '@/src/theme';

export default function SettingsTab() {
  const theme = useTheme();
  const { themeMode, setThemeMode, isDark } = useAppTheme();
  const { isConnected, baseUrl, clearConfig, connectionError } = useN8n();
  const router = useRouter();
  const [disconnectDialogVisible, setDisconnectDialogVisible] = useState(false);

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
  };

  const handleDisconnect = async () => {
    try {
      await clearConfig();
      setDisconnectDialogVisible(false);
      router.replace('/connection');
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect');
    }
  };

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Appearance
          </Text>
          <Surface style={styles.surface}>
            <List.Section>
              <List.Subheader>Theme</List.Subheader>
              {themeOptions.map((option) => (
                <List.Item
                  key={option.value}
                  title={option.label}
                  onPress={() => handleThemeChange(option.value)}
                  right={() => (
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radio,
                          {
                            borderColor: theme.colors.primary,
                            backgroundColor:
                              themeMode === option.value
                                ? theme.colors.primary
                                : 'transparent',
                          },
                        ]}
                      />
                    </View>
                  )}
                />
              ))}
            </List.Section>
          </Surface>
        </View>

        <Divider />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Connection
          </Text>
          <Surface style={styles.surface}>
            <List.Item
              title="Instance URL"
              description={baseUrl || 'Not configured'}
              left={(props) => <List.Icon {...props} icon="web" />}
            />
            <Divider />
            <List.Item
              title="Status"
              description={isConnected ? 'Connected' : 'Disconnected'}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={isConnected ? 'check-circle' : 'alert-circle'}
                  color={isConnected ? '#4CAF50' : theme.colors.error}
                />
              )}
            />
            {connectionError && (
              <>
                <Divider />
                <List.Item
                  title="Error"
                  description={connectionError}
                  left={(props) => <List.Icon {...props} icon="alert" color={theme.colors.error} />}
                />
              </>
            )}
          </Surface>
        </View>

        <Divider />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Account
          </Text>
          <Surface style={styles.surface}>
            <List.Item
              title="Disconnect"
              description="Remove saved credentials and disconnect from n8n"
              left={(props) => <List.Icon {...props} icon="logout" />}
              onPress={() => setDisconnectDialogVisible(true)}
              titleStyle={{ color: theme.colors.error }}
            />
          </Surface>
        </View>

        <Divider />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            About
          </Text>
          <Surface style={styles.surface}>
            <List.Item
              title="n8n Mobile"
              description="Version 1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            <Divider />
            <List.Item
              title="Open Source Licenses"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              onPress={() => {}}
            />
          </Surface>
        </View>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Made with ❤️ for n8n
          </Text>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={disconnectDialogVisible}
          onDismiss={() => setDisconnectDialogVisible(false)}
        >
          <Dialog.Title>Disconnect?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This will remove your saved credentials and you will need to reconnect to your n8n instance.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDisconnectDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleDisconnect}
              textColor={theme.colors.error}
            >
              Disconnect
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    opacity: 0.7,
  },
  surface: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  radioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.5,
  },
});
