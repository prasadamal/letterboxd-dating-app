// Conversation starters for a new match, built from what the two people actually share.
// Inputs are display labels ("Title (Year)"); output is up to `limit` ready-to-send hellos.

function shortTitle(label) {
  return String(label || '').replace(/\s*\(\d{4}\)\s*$/, '')
}

// Openers for the other person's profile prompts (keys from lib/profilePrompts.js), written to them.
const PROMPT_OPENERS = {
  defend_forever: (a) => `You'd defend ${a} forever? I need to hear the case.`,
  overrated: (a) => `${a}, overrated? Bold. Defend yourself 😤`,
  first_date: (a) => `${a} as a first-date film. Tell me why that works.`,
  cried: (a) => `${a} made you cry? Which scene got you?`,
  comfort: (a) => `${a} as a comfort rewatch is elite. How many times so far?`,
  character: (a) => `You relate most to ${a}? Explain yourself 👀`,
  quote: (a) => `Okay, I need the context for "${a}".`,
  cinema: (a) => `Best cinema experience: ${a}? Tell me everything.`,
  guilty: (a) => `${a} as a guilty pleasure, no shame. Why that one?`,
  sequel: (a) => `A sequel to ${a}? What happens in it?`
}

export function buildIcebreakers(
  { sharedLoved = [], sharedHated = [], favorite = null, myFavorite = null, watchForBoth = [], prompts = [], sharedPersonality = null } = {},
  limit = 4
) {
  const ideas = []
  const add = (text) => {
    if (text && !ideas.includes(text)) ideas.push(text)
  }

  if (favorite?.relation === 'same') add(`We have the same all-time favourite! What got you hooked on ${shortTitle(favorite.title)}?`)
  if (sharedPersonality) add(`Apparently we're both ${sharedPersonality}s. Which film made you one?`)
  if (sharedLoved[0]) add(`We both loved ${shortTitle(sharedLoved[0])}. Favourite scene?`)
  if (favorite?.relation === 'you_liked') add(`${shortTitle(favorite.title)} is your favourite and I liked it too. When did you first see it?`)
  if (sharedHated[0]) add(`Neither of us liked ${shortTitle(sharedHated[0])}. What went wrong for you?`)
  const opener = prompts[0] && PROMPT_OPENERS[prompts[0].key]
  if (opener) add(opener(prompts[0].answer))
  if (watchForBoth[0]) add(`Neither of us has seen ${shortTitle(watchForBoth[0])} yet. Watch it and compare notes?`)
  if (favorite?.relation === 'you_disliked') add(`I'll be honest, ${shortTitle(favorite.title)} didn't work for me. Convince me?`)
  if (sharedLoved[1]) add(`${shortTitle(sharedLoved[1])} too! Would you rewatch it?`)
  if (myFavorite) add(`My all-time favourite is ${shortTitle(myFavorite)}. Have you seen it?`)
  add("What's the best film you've seen this year?")
  add('Cinema or couch: where do you watch your favourites?')

  return ideas.slice(0, limit)
}
