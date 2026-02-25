import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { PaperProvider } from 'react-native-paper';
import { useColorScheme } from '@/components/useColorScheme';
import { N8nProvider } from '@/src/context/N8nContext';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function PaperThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const paperTheme = isDark ? darkTheme : lightTheme;
  
  return (
    <PaperProvider theme={paperTheme}>
      {children}
    </PaperProvider>
  );
}

function NavigationThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;
  
  return (
    <NavigationThemeProvider value={navigationTheme}>
      {children}
    </NavigationThemeProvider>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  
  useEffect(() => {
    const inAuthGroup = segments[0] === 'connection';
    
    if (!inAuthGroup) {
    }
  }, [segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <N8nProvider>
      <ThemeProvider>
        <PaperThemeWrapper>
          <NavigationThemeWrapper>
            <AuthGuard>
              <RootLayoutNav />
            </AuthGuard>
          </NavigationThemeWrapper>
        </PaperThemeWrapper>
      </ThemeProvider>
    </N8nProvider>
  );
}

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="connection" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="workflow/[id]" 
        options={{ 
          headerShown: true,
          title: 'Workflow',
        }} 
      />
      <Stack.Screen 
        name="execution/[id]" 
        options={{ 
          headerShown: true,
          title: 'Execution',
        }} 
      />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
