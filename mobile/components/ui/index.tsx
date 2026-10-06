import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps, ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { haptic } from '../../lib/haptics'
import { colors, fonts, radii, type } from '../../lib/theme'

export type IconName = ComponentProps<typeof Ionicons>['name']
export { Avatar } from './Avatar'
export { Poster } from './Poster'
export { PersonalityBadge, PersonalityCard } from './Personality'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'love' | 'danger'

const BUTTON_PALETTE: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.lime, fg: colors.onLime, border: colors.lime },
  secondary: { bg: colors.cardHigh, fg: colors.text, border: colors.borderStrong },
  ghost: { bg: 'transparent', fg: colors.text, border: 'transparent' },
  love: { bg: colors.pink, fg: '#fff', border: colors.pink },
  danger: { bg: 'transparent', fg: colors.red, border: 'rgba(255, 92, 108, 0.45)' }
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  size = 'lg',
  style,
  accessibilityLabel
}: {
  title: string
  onPress?: () => void
  variant?: ButtonVariant
  icon?: IconName
  loading?: boolean
  disabled?: boolean
  size?: 'lg' | 'md' | 'sm'
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}) {
  const palette = BUTTON_PALETTE[variant]
  return (
    <Pressable
      onPress={() => {
        haptic.tap()
        onPress?.()
      }}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        size === 'md' && styles.buttonMd,
        size === 'sm' && styles.buttonSm,
        { backgroundColor: palette.bg, borderColor: palette.border },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 15 : 18} color={palette.fg} />}
          <Text style={[type.button, { color: palette.fg }, size === 'sm' && styles.buttonSmText]} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  )
}

// Round icon button, used for swipe actions and toolbars.
export function IconButton({
  icon,
  onPress,
  size = 56,
  color = colors.text,
  background = colors.cardHigh,
  border = colors.borderStrong,
  accessibilityLabel,
  disabled = false,
  style
}: {
  icon: IconName
  onPress?: () => void
  size?: number
  color?: string
  background?: string
  border?: string
  accessibilityLabel: string
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      onPress={() => {
        haptic.tap()
        onPress?.()
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background, borderColor: border },
        styles.iconButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.44)} color={color} />
    </Pressable>
  )
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  accessibilityRole = 'button'
}: {
  label: string
  selected?: boolean
  onPress?: () => void
  icon?: IconName
  accessibilityRole?: 'button' | 'radio' | 'checkbox' | 'tab'
}) {
  return (
    <Pressable
      onPress={() => {
        haptic.select()
        onPress?.()
      }}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityRole === 'checkbox' ? { checked: selected } : { selected }}
      style={({ pressed }) => [styles.chip, selected && styles.chipOn, pressed && styles.pressed]}
    >
      {icon && <Ionicons name={icon} size={14} color={selected ? colors.onLime : colors.soft} />}
      <Text style={[styles.chipText, selected && styles.chipTextOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  )
}

const TONES = {
  lime: colors.lime,
  pink: colors.pink,
  violet: colors.violet,
  cyan: colors.cyan,
  orange: colors.orange,
  red: colors.red,
  green: colors.green,
  neutral: colors.soft
}
export type Tone = keyof typeof TONES

// Static label. Tinted background in the tone colour.
export function Tag({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const color = TONES[tone]
  return (
    <View style={[styles.tag, { backgroundColor: `${color}1F`, borderColor: `${color}40` }]}>
      {icon && <Ionicons name={icon} size={12} color={color} />}
      <Text style={[styles.tagText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          haptic.tap()
          onPress()
        }}
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    )
  }
  return <View style={[styles.card, style]}>{children}</View>
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={type.label}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  )
}

// Big in-content title used instead of a navigation bar on the main tabs.
export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={{ flex: 1 }}>
        <Text style={type.h1} accessibilityRole="header">
          {title}
        </Text>
        {!!subtitle && <Text style={[type.small, { marginTop: 2 }]}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  )
}

export function ProgressBar({ value, color = colors.lime, height = 8 }: { value: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <View style={[styles.track, { height, borderRadius: height }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <View style={{ width: `${pct}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  )
}

export function MatchPill({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const big = size === 'lg'
  return (
    <View style={[styles.matchPill, big && styles.matchPillLg, size === 'sm' && styles.matchPillSm]}>
      <Text style={[styles.matchValue, big && styles.matchValueLg, size === 'sm' && styles.matchValueSm]}>{Math.round(score)}%</Text>
      <Text style={[styles.matchLabel, size === 'sm' && { fontSize: 10 }]}>match</Text>
    </View>
  )
}

export function StatTile({ value, label, color = colors.text }: { value: string | number; label: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[type.number, styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export function EmptyState({ emoji = '🎬', title, body, children }: { emoji?: string; title: string; body?: string; children?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={[type.h2, { textAlign: 'center' }]}>{title}</Text>
      {!!body && <Text style={[type.body, styles.emptyBody]}>{body}</Text>}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  buttonMd: { minHeight: 46, paddingHorizontal: 18 },
  buttonSm: { minHeight: 36, paddingHorizontal: 14, gap: 6 },
  buttonSmText: { fontSize: 14 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  iconButton: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  chipOn: { backgroundColor: colors.lime, borderColor: colors.lime },
  chipText: { fontFamily: fonts.semi, fontSize: 14, color: colors.soft },
  chipTextOn: { color: colors.onLime },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '100%'
  },
  tagText: { fontFamily: fonts.semi, fontSize: 12 },
  card: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  sectionAction: { fontFamily: fonts.semi, color: colors.lime, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  track: { backgroundColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', width: '100%' },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: colors.lime,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start'
  },
  matchPillLg: { paddingHorizontal: 18, paddingVertical: 8 },
  matchPillSm: { paddingHorizontal: 9, paddingVertical: 3 },
  matchValue: { fontFamily: fonts.display, fontSize: 17, color: colors.onLime, letterSpacing: -0.5 },
  matchValueLg: { fontSize: 30, letterSpacing: -1 },
  matchValueSm: { fontSize: 13 },
  matchLabel: { fontFamily: fonts.semi, fontSize: 12, color: colors.onLime },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 26 },
  statLabel: { fontSize: 12, color: colors.muted },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 52 },
  emptyBody: { textAlign: 'center', color: colors.muted, maxWidth: 320 }
})
