import { ScrollView, StyleSheet, View } from 'react-native'
import { FilmExplorer } from '../../components/FilmExplorer'
import { ScreenHeader } from '../../components/ui'
import { colors } from '../../lib/theme'

// Explore: search and rate any film, and browse the People's Chart and collections.
export default function ExploreScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Explore" subtitle="Rate anything you've seen. Every rating sharpens your matches." />
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
