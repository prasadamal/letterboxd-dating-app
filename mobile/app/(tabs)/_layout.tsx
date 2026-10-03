import { Tabs } from 'expo-router'
import { usePlatform } from '../../lib/platform'
import { colors } from '../../lib/theme'

export default function TabsLayout() {
  const { platform } = usePlatform()

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.pink,
        tabBarInactiveTintColor: colors.muted
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Launch' }} />
      <Tabs.Screen name="taste" options={{ title: 'Daily game' }} />
      <Tabs.Screen
        name="dating"
        options={{
          title: 'Dating',
          href: platform?.datingLaunched ? undefined : null
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          href: platform?.datingLaunched ? undefined : null
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          href: platform?.datingLaunched ? undefined : null
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="discover" options={{ href: null }} />
    </Tabs>
  )
}
