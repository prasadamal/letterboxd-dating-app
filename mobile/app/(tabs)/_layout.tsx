import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import type { ComponentProps } from 'react'
import type { ColorValue } from 'react-native'
import { useAuth } from '../../lib/auth'
import { usePlatform } from '../../lib/platform'
import { colors, fonts } from '../../lib/theme'

type IconName = ComponentProps<typeof Ionicons>['name']
const icon =
  (outline: IconName, filled: IconName) =>
  ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={focused ? filled : outline} size={size} color={color} />
  )

export default function TabsLayout() {
  const { platform } = usePlatform()
  const { user } = useAuth()
  // Dating is opt-in ("Here for: films & friends / dating too"). People who paused dating keep Chats
  // while they still have matches.
  const datingOn = user?.dating_enabled !== false
  const showChats = Boolean(platform?.datingLaunched) && (datingOn || Boolean(platform?.hasMatches))

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border, borderTopWidth: 1, height: 64, paddingTop: 6 },
        tabBarItemStyle: { paddingBottom: 6 },
        tabBarLabelStyle: { fontFamily: fonts.semi, fontSize: 11 },
        tabBarActiveTintColor: colors.lime,
        tabBarInactiveTintColor: colors.faint,
        sceneStyle: { backgroundColor: colors.bg }
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Today', tabBarIcon: icon('ticket-outline', 'ticket') }} />
      <Tabs.Screen name="taste" options={{ title: 'Explore', tabBarIcon: icon('compass-outline', 'compass') }} />
      <Tabs.Screen
        name="dating"
        options={{ title: 'Match', tabBarIcon: icon('heart-outline', 'heart'), href: datingOn ? undefined : null }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: 'Chats', tabBarIcon: icon('chatbubbles-outline', 'chatbubbles'), href: showChats ? undefined : null }}
      />
      <Tabs.Screen name="profile" options={{ title: 'You', tabBarIcon: icon('person-circle-outline', 'person-circle') }} />
      <Tabs.Screen name="matches" options={{ href: null }} />
      <Tabs.Screen name="discover" options={{ href: null }} />
    </Tabs>
  )
}
