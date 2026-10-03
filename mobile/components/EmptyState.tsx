import { StyleSheet, Text, View } from 'react-native'
import { colors, radii, typography } from '../lib/theme'

type Props = {
  title: string
  body: string
  emoji?: string
}

export function EmptyState({ title, body, emoji = '🎬' }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8
  },
  emoji: { fontSize: 36 },
  title: { color: colors.text, ...typography.title, textAlign: 'center' },
  body: { color: colors.muted, textAlign: 'center', lineHeight: 22, maxWidth: 280 }
})
