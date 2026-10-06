import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

// Small, consistent haptics. No-ops on web and never throws (some Android devices have no vibrator).
const enabled = Platform.OS === 'ios' || Platform.OS === 'android'

export const haptic = {
  tap: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null),
  swipe: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null),
  select: () => enabled && Haptics.selectionAsync().catch(() => null),
  success: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null),
  warning: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => null)
}
