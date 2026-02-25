import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { N8N_BRAND_COLOR } from '@/src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  size: number;
}) {
  return <MaterialCommunityIcons {...props} />;
}

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: N8N_BRAND_COLOR,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Workflows',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="source-branch" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="executions"
        options={{
          title: 'Executions',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="history" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
