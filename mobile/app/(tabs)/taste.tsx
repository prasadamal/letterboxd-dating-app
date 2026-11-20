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
        right={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Diary" size="sm" variant="secondary" icon="book-outline" onPress={() => router.push('/diary')} />
            <Button title="Watchlist" size="sm" variant="secondary" icon="bookmark-outline" onPress={() => router.push('/watchlist')} />
          </View>
        }
      />
      <View style={styles.body}>
        <FilmExplorer />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 20 }
})
