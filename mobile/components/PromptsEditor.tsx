import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors } from '../lib/theme'
import { MAX_PROMPTS, PROFILE_PROMPTS } from '../lib/profileOptions'
import type { ProfilePrompt } from '../lib/types'

type Props = {
  prompts: ProfilePrompt[]
  onChange: (prompts: ProfilePrompt[]) => void
}

// Up to three film prompts shown on your dating card (and used for conversation starters).
export function PromptsEditor({ prompts, onChange }: Props) {
  const [picking, setPicking] = useState(false)
  const used = new Set(prompts.map((p) => p.key))
  const available = Object.keys(PROFILE_PROMPTS).filter((key) => !used.has(key))

  return (
    <View style={styles.block}>
      <Text style={styles.title}>Film prompts</Text>
      <Text style={styles.hint}>Shown on your card. Great conversation starters.</Text>

      {prompts.map((prompt, index) => (
        <View key={prompt.key} style={styles.prompt}>
          <View style={styles.promptHead}>
            <Text style={styles.question}>{PROFILE_PROMPTS[prompt.key]}</Text>
            <Pressable
              onPress={() => onChange(prompts.filter((_, i) => i !== index))}
              hitSlop={8}
              accessibilityLabel={`Remove prompt: ${PROFILE_PROMPTS[prompt.key]}`}
            >
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.input}
            value={prompt.answer}
            maxLength={120}
            placeholder="Your answer"
            placeholderTextColor={colors.muted}
            onChangeText={(answer) => onChange(prompts.map((p, i) => (i === index ? { ...p, answer } : p)))}
          />
        </View>
      ))}

      {prompts.length < MAX_PROMPTS && !picking && (
        <Pressable style={styles.add} onPress={() => setPicking(true)}>
          <Text style={styles.addText}>+ Add a prompt</Text>
        </Pressable>
      )}

      {picking && (
        <View style={styles.choices}>
          {available.map((key) => (
            <Pressable
              key={key}
              style={styles.choice}
              onPress={() => {
                onChange([...prompts, { key, answer: '' }])
                setPicking(false)
              }}
            >
              <Text style={styles.choiceText}>{PROFILE_PROMPTS[key]}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setPicking(false)}>
            <Text style={styles.remove}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 8 },
  title: { color: colors.text, fontWeight: '700' },
  hint: { color: colors.muted, fontSize: 12 },
  prompt: { gap: 6 },
  promptHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  question: { color: colors.peach, fontWeight: '700', flex: 1 },
  remove: { color: colors.muted, fontSize: 12, textDecorationLine: 'underline' },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, color: colors.text, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  add: { borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  addText: { color: colors.text, fontWeight: '600' },
  choices: { gap: 6 },
  choice: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  choiceText: { color: colors.soft }
})
