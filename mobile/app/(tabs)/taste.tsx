import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, View } from 'react-native'
import { FilmExplorer } from '../../components/FilmExplorer'
import { Button, ScreenHeader } from '../../components/ui'
import { colors } from '../../lib/theme'

// Explore: search and rate any film, and browse the People's Chart and collections.
export default function ExploreScreen() {
  const router = useRouter()
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <ScreenHeader
        title="Explore"
        subtitle="Rate anything you've seen. Every rating sharpens your matches."
      />
      <View style={styles.body}>
        <View style={styles.shortcuts}>
          <Button title="Film diary" size="sm" variant="secondary" icon="book-outline" onPress={() => router.push('/diary')} style={{ flex: 1 }} />
          <Button title="Watchlist" size="sm" variant="secondary" icon="bookmark-outline" onPress={() => router.push('/watchlist')} style={{ flex: 1 }} />
        </View>
        <FilmExplorer />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 20 },
  shortcuts: { flexDirection: 'row', gap: 10, marginBottom: 14 }
})
