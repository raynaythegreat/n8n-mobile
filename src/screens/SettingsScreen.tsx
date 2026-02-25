import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import {
  Text,
  List,
  Switch,
  Button,
  Divider,
  Surface,
  Dialog,
  Portal,
  RadioButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useN8nConnection } from '@/src/hooks/useN8nConnection';
import { useTheme, ThemeMode } from '@/src/context/ThemeContext';

const APP_VERSION = '1.0.0';
const N8N_DOCS_URL = 'https://docs.n8n.io';
const N8N_WEBSITE_URL = 'https://n8n.io';

const AUTO_REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '5 minutes', value: 300 },
];

export function SettingsScreen() {
  const { credentials, disconnect, isConnected } = useN8nConnection();
  const { themeMode, setThemeMode, isDark } = useTheme();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(60);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const maskApiKey = (key: string): string => {
    if (!key || key.length < 8) return '••••••••';
    return `${key.slice(0, 4)}${'•'.repeat(Math.min(key.length - 8, 20))}${key.slice(-4)}`;
  };

  const handleDisconnect = useCallback(() => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from n8n? You will need to enter your credentials again to reconnect.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setIsDisconnecting(true);
            try {
              await disconnect();
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect');
            } finally {
              setIsDisconnecting(false);
            }
          },
        },
      ]
    );
  }, [disconnect]);

  const handleThemeSelect = useCallback(async (mode: ThemeMode) => {
    await setThemeMode(mode);
    setShowThemeDialog(false);
  }, [setThemeMode]);

  const handleRefreshSelect = useCallback((value: number) => {
    setAutoRefreshInterval(value);
    setShowRefreshDialog(false);
  }, []);

  const openDocs = useCallback(() => {
    Linking.openURL(N8N_DOCS_URL).catch(() => {
      Alert.alert('Error', 'Could not open documentation');
    });
  }, []);

  const openWebsite = useCallback(() => {
    Linking.openURL(N8N_WEBSITE_URL).catch(() => {
      Alert.alert('Error', 'Could not open website');
    });
  }, []);

  const getThemeLabel = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
    }
  };

  const getRefreshLabel = (value: number): string => {
    const option = AUTO_REFRESH_OPTIONS.find(o => o.value === value);
    return option?.label || 'Off';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <List.Section>
          <List.Subheader>Connection</List.Subheader>
          {isConnected && credentials ? (
            <Surface style={styles.connectionCard} elevation={0}>
              <View style={styles.connectionInfo}>
                <View style={styles.connectionRow}>
                  <Text style={styles.connectionLabel}>Instance URL</Text>
                  <Text style={styles.connectionValue}>{credentials.instanceUrl}</Text>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.connectionRow}>
                  <Text style={styles.connectionLabel}>API Key</Text>
                  <Text style={styles.connectionValue}>{maskApiKey(credentials.apiKey)}</Text>
                </View>
              </View>
              <Button
                mode="outlined"
                onPress={handleDisconnect}
                loading={isDisconnecting}
                disabled={isDisconnecting}
                style={styles.disconnectButton}
                textColor="#ff6d5a"
              >
                Disconnect
              </Button>
            </Surface>
          ) : (
            <List.Item
              title="Not connected"
              description="Connect to an n8n instance to get started"
              left={props => <List.Icon {...props} icon="cloud-off-outline" />}
            />
          )}
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Preferences</List.Subheader>
          
          <List.Item
            title="Theme"
            description={getThemeLabel(themeMode)}
            left={props => <List.Icon {...props} icon="palette-outline" />}
            onPress={() => setShowThemeDialog(true)}
          />
          
          <List.Item
            title="Auto-refresh interval"
            description={getRefreshLabel(autoRefreshInterval)}
            left={props => <List.Icon {...props} icon="refresh" />}
            onPress={() => setShowRefreshDialog(true)}
          />
          
          <List.Item
            title="Notifications"
            description="Get alerts for workflow executions"
            left={props => <List.Icon {...props} icon="bell-outline" />}
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            )}
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>About</List.Subheader>
          
          <List.Item
            title="n8n Mobile"
            description={`Version ${APP_VERSION}`}
            left={props => <List.Icon {...props} icon="information-outline" />}
          />
          
          <List.Item
            title="Documentation"
            description="Learn how to use n8n"
            left={props => <List.Icon {...props} icon="book-open-variant" />}
            onPress={openDocs}
          />
          
          <List.Item
            title="n8n Website"
            description="Visit n8n.io for more information"
            left={props => <List.Icon {...props} icon="web" />}
            onPress={openWebsite}
          />
        </List.Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for workflow automation
          </Text>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={showThemeDialog} onDismiss={() => setShowThemeDialog(false)}>
          <Dialog.Title>Theme</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => handleThemeSelect(value as ThemeMode)}
              value={themeMode}
            >
              {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                <RadioButton.Item
                  key={mode}
                  label={getThemeLabel(mode)}
                  value={mode}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowThemeDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showRefreshDialog} onDismiss={() => setShowRefreshDialog(false)}>
          <Dialog.Title>Auto-refresh Interval</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => handleRefreshSelect(Number(value))}
              value={autoRefreshInterval.toString()}
            >
              {AUTO_REFRESH_OPTIONS.map((option) => (
                <RadioButton.Item
                  key={option.value}
                  label={option.label}
                  value={option.value.toString()}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRefreshDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  connectionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  connectionInfo: {
    marginBottom: 12,
  },
  connectionRow: {
    paddingVertical: 8,
  },
  connectionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  connectionValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  divider: {
    marginVertical: 4,
  },
  disconnectButton: {
    borderColor: '#ff6d5a',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#888',
  },
});

export default SettingsScreen;
