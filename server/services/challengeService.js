// Taste challenges: share today's ten answers as a link; anyone answers the same ten (no account
// needed) and sees how connected they are. Scoring lives in lib/challenge.js.
import crypto from 'node:crypto'
import { supabase } from '../supabaseClient.js'
import { env } from '../config/env.js'
import { AppError } from '../middleware/errors.js'
import { canonicalGenres } from '../lib/genres.js'
import { scoreChallenge, validateAnswers } from '../lib/challenge.js'
import { utcDay } from '../lib/streaks.js'
import { containsBlockedContent } from '../lib/contentFilter.js'
import { getDailySet, slotInfo } from './dailySetService.js'
import { filmDetails } from '../lib/films/filmFeatures.js'
import { getCommunityOdds } from './filmOddsService.js'
import { notifyUser } from './notificationService.js'
import { dailyNumber } from './dailyService.js'

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O, 1/I/L
const CODE_LENGTH = 8
const RESPONSES_SHOWN = 50

const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'A ReelMates member'
const dayNumberLabel = (day) => dailyNumber(new Date(`${day}T12:00:00Z`))

export function newCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH)
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')
}

export function normalizeCode(code) {
  const value = String(code || '').trim().toUpperCase()
  if (!new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`).test(value)) throw new AppError('Challenge not found', 404, 'NOT_FOUND')
  return value
}

function publicUrl(code) {
  const base = (env.APP_PUBLIC_URL || 'https://reelmates.app').replace(/\/$/, '')
  return `${base}/c/${code}`
}

export function shareText(name, number, url) {
  return `I rated today's 10 films on ReelMates (Daily #${number}). Rate the same 10 and see how connected our film taste is 🎬\n${url}`
}

async function films(ids) {
  const { data, error } = await supabase.from('movies').select('id, title, year, genres, origin_language').in('id', ids)
  if (error) throw error
  const byId = new Map((data || []).map((f) => [f.id, { ...f, genres: canonicalGenres(f.genres) }]))
  return ids.map((id) => byId.get(id)).filter(Boolean)
}

async function readChallenge(code) {
  const { data, error } = await supabase
    .from('challenges')
    .select('code, owner_id, day, movie_ids, answers, owner:users!challenges_owner_id_fkey(display_name, deleted_at, is_active)')
    .eq('code', code)
    .maybeSingle()
  if (error) throw error
  if (!data || data.owner?.deleted_at || data.owner?.is_active === false) throw new AppError('Challenge not found', 404, 'NOT_FOUND')
  return data
}

/** Create (or refresh) today's challenge for this member. Needs all of today's films answered. */
export async function createChallenge(userId, now = new Date()) {
  const day = utcDay(now)
  const set = await getDailySet(day)
  const ids = set.movie_ids || []
  if (!ids.length) throw new AppError("Today's films aren't ready yet.", 409, 'NO_DAILY')

  const { data: rated, error } = await supabase.from('user_ratings').select('movie_id, rating').eq('user_id', userId).in('movie_id', ids)
  if (error) throw error
  const answers = Object.fromEntries((rated || []).filter((r) => ['love', 'hate', 'skip'].includes(r.rating)).map((r) => [r.movie_id, r.rating]))
  if (ids.some((id) => !answers[id])) {
    throw new AppError("Rate all of today's films first, then challenge a friend.", 409, 'DAILY_NOT_FINISHED')
  }

  const { data: existing, error: existingError } = await supabase.from('challenges').select('code').eq('owner_id', userId).eq('day', day).maybeSingle()
  if (existingError) throw existingError
  let code = existing?.code
  if (code) {
    const { error: updateError } = await supabase
      .from('challenges')
      .update({ answers, movie_ids: ids, updated_at: new Date().toISOString() })
      .eq('code', code)
    if (updateError) throw updateError
  } else {
    for (let attempt = 0; attempt < 5 && !code; attempt += 1) {
      const candidate = newCode()
      const { error: insertError } = await supabase.from('challenges').insert({ code: candidate, owner_id: userId, day, movie_ids: ids, answers })
      if (!insertError) code = candidate
      else if (insertError.code === '23505') {
        // Either the code was taken (try another) or a second tap already created today's challenge.
        const { data: raced } = await supabase.from('challenges').select('code').eq('owner_id', userId).eq('day', day).maybeSingle()
        if (raced?.code) code = raced.code
      } else throw insertError
    }
    if (!code) throw new AppError('Could not create the challenge. Try again.', 500, 'CHALLENGE_FAILED')
  }

  const { data: me } = await supabase.from('users').select('display_name').eq('id', userId).maybeSingle()
  const url = publicUrl(code)
  const number = dayNumberLabel(day)
  return { code, url, day, number, shareText: shareText(firstName(me?.display_name), number, url) }
}

/** What someone opening the link sees before answering: who, which day, which films. No answers. */
export async function getPublicChallenge(rawCode) {
  const code = normalizeCode(rawCode)
  const challenge = await readChallenge(code)
  const [list, set, countResult] = await Promise.all([
    films(challenge.movie_ids),
    getDailySet(challenge.day).catch(() => null),
    supabase.from('challenge_responses').select('id', { count: 'exact', head: true }).eq('code', code)
  ])
  const slots = slotInfo(set)
  return {
    code,
    name: firstName(challenge.owner?.display_name),
    day: challenge.day,
    number: dayNumberLabel(challenge.day),
    responses: countResult.count || 0,
    films: list.map((f) => ({ ...f, details: filmDetails(f), slot: slots.get(f.id) || null }))
  }
}

/** Answer a challenge. Returns the result with both people's answers. */
export async function answerChallenge(rawCode, { name, answers }, viewerId = null) {
  const code = normalizeCode(rawCode)
  const challenge = await readChallenge(code)
  if (viewerId && viewerId === challenge.owner_id) throw new AppError("This is your own challenge. Share it with a friend.", 400, 'OWN_CHALLENGE')

  const cleanName = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 40)
  if (!cleanName) throw new AppError('Add your name so they know who answered.', 400, 'NAME_REQUIRED')
  if (containsBlockedContent(cleanName)) throw new AppError('Please use a different name.', 400, 'NAME_BLOCKED')

  let mine
  try {
    mine = validateAnswers(answers, challenge.movie_ids)
  } catch (error) {
    throw new AppError(error.message, 400, 'ANSWERS_INCOMPLETE')
  }

  const [list, odds] = await Promise.all([films(challenge.movie_ids), getCommunityOdds()])
  const titles = new Map(list.map((f) => [f.id, f.title]))
  const result = scoreChallenge({ filmIds: challenge.movie_ids, mine, theirs: challenge.answers, odds, titles })

  const { data: row, error } = await supabase
    .from('challenge_responses')
    .insert({ code, responder_name: cleanName, responder_id: viewerId, answers: mine, score: result.score, same_count: result.same })
    .select('id')
    .single()
  if (error) throw error

  const owner = firstName(challenge.owner?.display_name)
  notifyUser(challenge.owner_id, 'challenge_answered', {
    title: `${cleanName} took your film challenge`,
    body: `${result.score}% connected · ${result.verdict.title}`,
    code
  }).catch(() => null)

  return { id: row.id, owner, name: cleanName, day: challenge.day, number: dayNumberLabel(challenge.day), ...result, filmsInfo: list }
}

/** The member's challenge for today (if any) and who has answered it, best match first. */
export async function getMyChallenge(userId, now = new Date()) {
  const day = utcDay(now)
  const { data: challenge, error } = await supabase.from('challenges').select('code, day').eq('owner_id', userId).eq('day', day).maybeSingle()
  if (error) throw error
  if (!challenge) return { challenge: null }
  const { data: rows, error: responsesError } = await supabase
    .from('challenge_responses')
    .select('id, responder_name, score, same_count, created_at')
    .eq('code', challenge.code)
    .order('created_at', { ascending: false })
    .limit(RESPONSES_SHOWN)
  if (responsesError) throw responsesError
  const url = publicUrl(challenge.code)
  const number = dayNumberLabel(day)
  const { data: me } = await supabase.from('users').select('display_name').eq('id', userId).maybeSingle()
  return {
    challenge: {
      code: challenge.code,
      url,
      day,
      number,
      shareText: shareText(firstName(me?.display_name), number, url),
      responses: (rows || [])
        .map((r) => ({ id: r.id, name: r.responder_name, score: r.score, same: r.same_count, at: r.created_at }))
        .sort((a, b) => b.score - a.score)
    }
  }
}
