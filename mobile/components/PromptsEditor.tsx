import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { MAX_PROMPTS, PROFILE_PROMPTS } from '../lib/profileOptions'
import { colors, fonts, radii, type } from '../lib/theme'
import type { ProfilePrompt } from '../lib/types'
import { Chip } from './ui'

type Props = {
  prompts: ProfilePrompt[]
  onChange: (prompts: ProfilePrompt[]) => void
}

// Up to three film prompts shown on your card (and used for conversation starters).
export function PromptsEditor({ prompts, onChange }: Props) {
  const [picking, setPicking] = useState(false)
  const used = new Set(prompts.map((p) => p.key))
  const available = Object.keys(PROFILE_PROMPTS).filter((key) => !used.has(key))

  return (
    <View style={styles.wrap}>
      {prompts.map((prompt, index) => (
        <View key={prompt.key} style={styles.prompt}>
          <View style={styles.promptHead}>
            <Text style={styles.question}>{PROFILE_PROMPTS[prompt.key]}</Text>
            <Pressable onPress={() => onChange(prompts.filter((_, i) => i !== index))} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove prompt: ${PROFILE_PROMPTS[prompt.key]}`}>
              <Ionicons name="close-circle" size={20} color={colors.faint} />
            </Pressable>
          </View>
          <TextInput
            style={styles.answer}
            value={prompt.answer}
            maxLength={120}
            placeholder="Your answer"
            placeholderTextColor={colors.faint}
            onChangeText={(answer) => onChange(prompts.map((p, i) => (i === index ? { ...p, answer } : p)))}
            multiline
          />
        </View>
      ))}

      {prompts.length < MAX_PROMPTS && !picking && (
        <Pressable style={styles.add} onPress={() => setPicking(true)} accessibilityRole="button">
          <Ionicons name="add" size={18} color={colors.lime} />
          <Text style={styles.addText}>Add a prompt ({prompts.length}/{MAX_PROMPTS})</Text>
        </Pressable>
      )}

      {picking && (
        <View style={styles.choices}>
          <Text style={type.small}>Pick a question</Text>
          <View style={styles.chipWrap}>
            {available.map((key) => (
              <Chip
                key={key}
                label={PROFILE_PROMPTS[key]}
                onPress={() => {
                  onChange([...prompts, { key, answer: '' }])
                  setPicking(false)
                }}
              />
            ))}
          </View>
          <Pressable onPress={() => setPicking(false)} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  prompt: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 },
  promptHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  question: { fontFamily: fonts.semi, color: colors.lime, fontSize: 14, flex: 1 },
  answer: { fontFamily: fonts.bold, color: colors.text, fontSize: 18, paddingVertical: 4, minHeight: 32 },
  add: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.borderStrong, borderStyle: 'dashed', borderRadius: radii.lg, paddingVertical: 14 },
  addText: { fontFamily: fonts.semi, color: colors.text, fontSize: 14 },
  choices: { gap: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cancel: { color: colors.muted, textAlign: 'center', textDecorationLine: 'underline' }
})
