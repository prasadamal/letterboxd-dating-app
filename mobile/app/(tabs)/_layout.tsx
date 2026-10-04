import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import type { ComponentProps } from 'react'
import type { ColorValue } from 'react-native'
import { usePlatform } from '../../lib/platform'
import { colors } from '../../lib/theme'

type IconName = ComponentProps<typeof Ionicons>['name']
const icon =
  (name: IconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} size={size} color={color} />

export default function TabsLayout() {
  const { platform } = usePlatform()

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.pink,
        tabBarInactiveTintColor: colors.muted
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Launch', tabBarIcon: icon('rocket-outline') }} />
      <Tabs.Screen name="taste" options={{ title: 'Daily game', tabBarLabel: 'Films', tabBarIcon: icon('film-outline') }} />
      <Tabs.Screen
        name="dating"
        options={{
          title: 'Dating',
          tabBarIcon: icon('heart-outline'),
          href: platform?.datingLaunched ? undefined : null
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: icon('sparkles-outline'),
          href: platform?.datingLaunched ? undefined : null
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarLabel: 'Chats',
          tabBarIcon: icon('chatbubbles-outline'),
          href: platform?.datingLaunched ? undefined : null
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-circle-outline') }} />
      <Tabs.Screen name="discover" options={{ href: null }} />
    </Tabs>
  )
}
