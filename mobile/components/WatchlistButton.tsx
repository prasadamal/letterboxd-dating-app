import { Alert } from 'react-native'
import { ApiError } from '../lib/api'
import { colors } from '../lib/theme'
import { toggleWatchlist, useWatchlist } from '../lib/watchlist'
import { IconButton } from './ui'

// Bookmark toggle: save a film to watch later, or take it off the list.
export function WatchlistButton({ filmId, title, size = 34 }: { filmId: number; title: string; size?: number }) {
  const { ids, pending, owner } = useWatchlist()
  if (!owner) return null
  const saved = ids.has(filmId)
  return (
    <IconButton
      icon={saved ? 'bookmark' : 'bookmark-outline'}
      size={size}
      color={saved ? colors.lime : colors.muted}
      background={colors.card}
      border={saved ? colors.lime : colors.border}
      disabled={pending.has(filmId)}
      accessibilityLabel={saved ? `Remove ${title} from your watchlist` : `Save ${title} to your watchlist`}
      onPress={() => {
        toggleWatchlist(filmId).catch((error) => {
          const full = error instanceof ApiError && error.code === 'WATCHLIST_FULL'
          Alert.alert(full ? 'Watchlist full' : 'Not saved', full ? error.message : 'Check your connection and try again.')
        })
      }}
    />
  )
}
