import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { useN8nConnection, N8nCredentials } from '@/src/hooks/useN8nConnection';
import { SafeAreaView } from 'react-native-safe-area-context';

const N8N_BRAND_COLOR = '#ff6d5a';

interface ConnectionScreenProps {
  onConnectionSuccess?: () => void;
}

export function ConnectionScreen({ onConnectionSuccess }: ConnectionScreenProps) {
  const { testConnection, isTesting, error, isConnected, credentials, clearError } = useN8nConnection();
  
  const [instanceUrl, setInstanceUrl] = useState(credentials?.instanceUrl || '');
  const [apiKey, setApiKey] = useState(credentials?.apiKey || '');
  const [urlError, setUrlError] = useState<string | null>(null);

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('Instance URL is required');
      return false;
    }
    
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setUrlError('URL must start with http:// or https://');
        return false;
      }
    } catch {
      setUrlError('Please enter a valid URL');
      return false;
    }
    
    setUrlError(null);
    return true;
  };

  const handleConnect = async () => {
    clearError();
    
    if (!validateUrl(instanceUrl)) {
      return;
    }
    
    if (!apiKey.trim()) {
      Alert.alert('Error', 'API key is required');
      return;
    }

    const creds: N8nCredentials = {
      instanceUrl: instanceUrl.trim(),
      apiKey: apiKey.trim(),
    };

    const success = await testConnection(creds);
    
    if (success && onConnectionSuccess) {
      onConnectionSuccess();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>n8n</Text>
            </View>
            <Text style={styles.title}>Connect to n8n</Text>
            <Text style={styles.subtitle}>
              Enter your n8n instance details to get started
            </Text>
          </View>

          <Surface style={styles.formContainer} elevation={0}>
            <View style={styles.inputGroup}>
              <TextInput
                label="Instance URL"
                placeholder="http://localhost:5678"
                value={instanceUrl}
                onChangeText={(text) => {
                  setInstanceUrl(text);
                  setUrlError(null);
                  clearError();
                }}
                mode="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                autoComplete="url"
                error={!!urlError}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                left={<TextInput.Icon icon="web" />}
              />
              {urlError && (
                <HelperText type="error" visible={!!urlError}>
                  {urlError}
                </HelperText>
              )}
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                label="API Key"
                placeholder="Your n8n API key"
                value={apiKey}
                onChangeText={(text) => {
                  setApiKey(text);
                  clearError();
                }}
                mode="outlined"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                outlineStyle={styles.inputOutline}
                left={<TextInput.Icon icon="key" />}
              />
              <HelperText type="info">
                Find your API key in n8n Settings → API
              </HelperText>
            </View>

            {error && (
              <Surface style={styles.errorContainer} elevation={0}>
                <Text style={styles.errorText}>{error}</Text>
              </Surface>
            )}

            {isConnected && !error && (
              <Surface style={styles.successContainer} elevation={0}>
                <Text style={styles.successText}>✓ Connected successfully!</Text>
              </Surface>
            )}

            <Button
              mode="contained"
              onPress={handleConnect}
              loading={isTesting}
              disabled={isTesting}
              style={styles.connectButton}
              buttonColor={N8N_BRAND_COLOR}
              contentStyle={styles.buttonContent}
            >
              {isTesting ? 'Connecting...' : 'Connect'}
            </Button>
          </Surface>

          <View style={styles.footer}>
            <Text style={styles.helpText}>
              Don't have an API key?{'\n'}
              Go to your n8n instance → Settings → API → Create Key
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: N8N_BRAND_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'transparent',
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
  },
  inputOutline: {
    borderColor: '#e0e0e0',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  connectButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  buttonContent: {
    height: 52,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 32,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ConnectionScreen;
