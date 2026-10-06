import { supabase } from '../supabaseClient.js'
import { notifyUser } from '../services/notificationService.js'
import { selectAll, selectAllIn } from '../lib/paging.js'
import { utcDay } from '../lib/streaks.js'

// Push copy: people with a streak worth protecting hear about the streak.
export function reminderCopy(streak) {
  if (streak >= 2) {
    return { title: `🔥 ${streak}-day streak on the line`, body: "Today's 10 films are in. Swipe them to keep it going." }
  }
  return { title: "Today's films just dropped 🎬", body: 'Swipe 10 films, see how everyone voted and find your film people.' }
}

// Reminds everyone with a device who hasn't played today. streak_last_day is set by the first rating of each UTC day.
export async function sendDailyGameReminders(now = new Date()) {
  const day = utcDay(now)
  const yesterday = utcDay(new Date(now.getTime() - 86_400_000))

  const tokenRows = await selectAll(() => supabase.from('push_tokens').select('user_id').order('id'))
  const userIds = [...new Set(tokenRows.map((row) => row.user_id))]
  const users = await selectAllIn(userIds, (ids) =>
    supabase
      .from('users')
      .select('id, streak_current, streak_last_day, deleted_at, is_active')
      .in('id', ids)
      .order('id')
  )

  let sent = 0
  let skipped = 0
  for (const user of users) {
    if (user.deleted_at || user.is_active === false || user.streak_last_day === day) {
      skipped += 1
      continue
    }
    const streak = user.streak_last_day === yesterday ? user.streak_current || 0 : 0
    await notifyUser(user.id, 'daily_game', reminderCopy(streak))
    sent += 1
  }

  return { day, sent, skipped, candidates: userIds.length }
}
