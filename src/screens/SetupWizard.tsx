import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  HelperText,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useN8nConnection, N8nCredentials } from '@/src/hooks/useN8nConnection';

const { width } = Dimensions.get('window');
const N8N_BRAND_COLOR = '#ff6d5a';

interface SetupWizardProps {
  onComplete: () => void;
}

type WizardStep = 'welcome' | 'url' | 'apikey' | 'connecting' | 'success';

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const theme = useTheme();
  const { testConnection, isTesting, error, clearError } = useN8nConnection();
  
  const [step, setStep] = useState<WizardStep>('welcome');
  const [instanceUrl, setInstanceUrl] = useState('http://10.0.0.184:5678');
  const [apiKey, setApiKey] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(1));

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = (callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(callback);
  };

  const goToStep = (newStep: WizardStep) => {
    fadeOut(() => {
      setStep(newStep);
      fadeIn();
    });
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('Instance URL is required');
      return false;
    }
    
    let urlToTest = url.trim();
    if (!urlToTest.startsWith('http://') && !urlToTest.startsWith('https://')) {
      urlToTest = 'http://' + urlToTest;
    }
    
    try {
      const parsed = new URL(urlToTest);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        setUrlError('URL must start with http:// or https://');
        return false;
      }
      setInstanceUrl(urlToTest);
    } catch {
      setUrlError('Please enter a valid URL');
      return false;
    }
    
    setUrlError(null);
    return true;
  };

  const handleUrlNext = () => {
    clearError();
    if (validateUrl(instanceUrl)) {
      goToStep('apikey');
    }
  };

  const handleConnect = async () => {
    clearError();
    
    if (!apiKey.trim()) {
      return;
    }

    goToStep('connecting');

    const creds: N8nCredentials = {
      instanceUrl: instanceUrl.trim(),
      apiKey: apiKey.trim(),
    };

    const success = await testConnection(creds);
    
    if (success) {
      goToStep('success');
      setTimeout(() => {
        onComplete();
      }, 1500);
    } else {
      goToStep('apikey');
    }
  };

  const handleBack = () => {
    if (step === 'apikey') {
      goToStep('url');
    } else if (step === 'url') {
      goToStep('welcome');
    }
  };

  const renderWelcomeStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <View style={styles.welcomeContent}>
        <View style={styles.logoLarge}>
          <Text style={styles.logoTextLarge}>n8n</Text>
        </View>
        
        <Text style={styles.welcomeTitle}>Welcome to n8n Mobile</Text>
        <Text style={styles.welcomeSubtitle}>
          Manage your workflows, monitor executions, and control your automation from anywhere.
        </Text>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureText}>View & manage workflows</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>Monitor executions</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔄</Text>
            <Text style={styles.featureText}>Activate & run workflows</Text>
          </View>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={() => goToStep('url')}
        style={styles.mainButton}
        buttonColor={N8N_BRAND_COLOR}
        contentStyle={styles.buttonContent}
      >
        Get Started
      </Button>
    </Animated.View>
  );

  const renderUrlStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <View style={styles.stepHeader}>
        <Button 
          mode="text" 
          onPress={handleBack}
          textColor="#666"
          icon="arrow-left"
        >
          Back
        </Button>
      </View>

      <View style={styles.stepContent}>
        <Text style={styles.stepNumber}>Step 1 of 2</Text>
        <Text style={styles.stepTitle}>Enter your n8n URL</Text>
        <Text style={styles.stepDescription}>
          This is the address where your n8n instance is running. 
          If running locally, use your computer's IP address.
        </Text>

        <View style={styles.inputSection}>
          <TextInput
            label="n8n Instance URL"
            placeholder="http://192.168.1.100:5678"
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
            left={<TextInput.Icon icon="web" />}
          />
          {urlError && (
            <HelperText type="error" visible={!!urlError}>
              {urlError}
            </HelperText>
          )}
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>💡 Tip</Text>
          <Text style={styles.tipText}>
            For local development, use your computer's IP address instead of localhost. 
            Find it with: ifconfig (Mac/Linux) or ipconfig (Windows)
          </Text>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={handleUrlNext}
        style={styles.mainButton}
        buttonColor={N8N_BRAND_COLOR}
        contentStyle={styles.buttonContent}
      >
        Continue
      </Button>
    </Animated.View>
  );

  const renderApiKeyStep = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <View style={styles.stepHeader}>
        <Button 
          mode="text" 
          onPress={handleBack}
          textColor="#666"
          icon="arrow-left"
        >
          Back
        </Button>
      </View>

      <View style={styles.stepContent}>
        <Text style={styles.stepNumber}>Step 2 of 2</Text>
        <Text style={styles.stepTitle}>Enter your API Key</Text>
        <Text style={styles.stepDescription}>
          Create an API key in your n8n instance to allow this app to connect securely.
        </Text>

        <View style={styles.inputSection}>
          <TextInput
            label="API Key"
            placeholder="n8n_api_xxxxxxxx"
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
            left={<TextInput.Icon icon="key" />}
          />
        </View>

        <View style={styles.howToBox}>
          <Text style={styles.howToTitle}>How to get your API key:</Text>
          <Text style={styles.howToStep}>1. Open n8n in your browser</Text>
          <Text style={styles.howToStep}>2. Go to Settings → API</Text>
          <Text style={styles.howToStep}>3. Click "Create API Key"</Text>
          <Text style={styles.howToStep}>4. Copy and paste it here</Text>
        </View>

        {error && (
          <Surface style={styles.errorBox} elevation={0}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </Surface>
        )}
      </View>

      <Button
        mode="contained"
        onPress={handleConnect}
        loading={isTesting}
        disabled={isTesting || !apiKey.trim()}
        style={styles.mainButton}
        buttonColor={N8N_BRAND_COLOR}
        contentStyle={styles.buttonContent}
      >
        {isTesting ? 'Connecting...' : 'Connect to n8n'}
      </Button>
    </Animated.View>
  );

  const renderConnectingStep = () => (
    <Animated.View style={[styles.stepContainer, styles.centeredStep, { opacity: fadeAnim }]}>
      <View style={styles.logoMedium}>
        <Text style={styles.logoTextMedium}>n8n</Text>
      </View>
      <Text style={styles.connectingTitle}>Connecting...</Text>
      <Text style={styles.connectingSubtitle}>
        Verifying your credentials
      </Text>
    </Animated.View>
  );

  const renderSuccessStep = () => (
    <Animated.View style={[styles.stepContainer, styles.centeredStep, { opacity: fadeAnim }]}>
      <View style={styles.successIcon}>
        <Text style={styles.successIconText}>✓</Text>
      </View>
      <Text style={styles.successTitle}>Connected!</Text>
      <Text style={styles.successSubtitle}>
        You're all set. Loading your workflows...
      </Text>
    </Animated.View>
  );

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return renderWelcomeStep();
      case 'url':
        return renderUrlStep();
      case 'apikey':
        return renderApiKeyStep();
      case 'connecting':
        return renderConnectingStep();
      case 'success':
        return renderSuccessStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {renderStep()}
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
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  centeredStep: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stepContent: {
    flex: 1,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logoLarge: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: N8N_BRAND_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoTextLarge: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  logoMedium: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: N8N_BRAND_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoTextMedium: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featuresList: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  stepNumber: {
    fontSize: 14,
    color: N8N_BRAND_COLOR,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
  },
  inputSection: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#fff',
    fontSize: 16,
  },
  tipBox: {
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  howToBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  howToTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 12,
  },
  howToStep: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    paddingLeft: 8,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#c62828',
  },
  mainButton: {
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonContent: {
    height: 56,
  },
  connectingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  connectingSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4caf50',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default SetupWizard;
