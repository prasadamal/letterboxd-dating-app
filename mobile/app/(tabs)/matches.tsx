import { Redirect } from 'expo-router'

// Matches now live in Chats (new matches row + conversations); kept for old links and notifications.
export default function MatchesRedirect() {
  return <Redirect href="/(tabs)/messages" />
}
