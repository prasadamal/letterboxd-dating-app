# How ReelMates picks films and matches people

Everything in ReelMates comes back to films: the daily ten, the connection score between two people, the dating deck and the challenge link. This page explains each one in plain words. The code is linked at the end of each section.

## Film facts

Each catalog film has a genre, language, year, popularity estimate and a few tags. On top of that, `server/data/filmFacts.js` records:
- the director, filled in only where it is certain
- the franchise or studio "family": Marvel, DC, Studio Ghibli, Pixar, A24 and so on
- whether the film is art-house

From these, every film gets a primary genre, language group, decade, and blockbuster and art-house flags (`server/lib/films/filmFeatures.js`).

**Seen and liked odds.** For every film the app estimates two things (`server/lib/films/filmStats.js`):
- **Seen:** how likely a film fan is to have seen it.
- **Liked:** how likely they liked it, if they saw it.

The estimates start from the catalog. Seen starts from popularity, with a boost for Indian-language films because the launch audience is in India. Liked starts from the tags: canon films higher, divisive ones lower. Each real "liked", "didn't like" and "haven't seen" answer then moves them. So a film that turns out to be well known locally gets treated as well known.

The same odds measure how much an answer tells you about a person. A film everyone loves tells you little; a film that splits people tells you a lot.

## The daily ten

Everyone gets the same ten films each day, one from each "corner" of cinema:

| Slot | What it is |
|---|---|
| Crowd favourite | One almost every fan has seen and liked |
| New-ish | From the last few years |
| Dark side | Horror, thriller or crime |
| Indian cinema | Rotates: Malayalam, Hindi, South Indian, Marathi/Bengali |
| Director's pick | A film by a signature director, rotating: Nolan, Tarantino, Scorsese, Kubrick, Miyazaki, Bong, Lijo… |
| World cinema | Rotates: East Asia, Europe, Latin America, Middle East and beyond |
| Feel-good | Comedy, romance, musical or animation |
| Blockbuster | Franchises and big spectacle |
| Art house | Slow, bold, festival films (or "Divisive" when the day has none) |
| Hidden gem | The one most people haven't seen, and the only one allowed to be that obscure |

One day a week is a **face-off day**: the director and blockbuster slots become a pair shown side by side. Examples: Marvel vs DC, Nolan vs Villeneuve, Tarantino vs Scorsese, Ghibli vs Pixar, Lijo vs Dileesh.

**Rules every day:**
- no director or franchise twice
- at most five English films
- genres, languages and decades spread out
- only the hidden gem may be a film most people haven't seen
- a film rests 40 days before it comes back, and a director 14 days

**How a film wins its slot.** The hardest slots are filled first. Each candidate scores on four things:
- how well it fits the slot
- how much its answers tell us about people (films that split opinion score higher)
- how likely a fan is to have seen it
- how different it is from the films already chosen

A small seeded random factor keeps the days varied. If a slot can't be filled, it is honestly labelled "Wildcard". The day's set is saved once (`daily_sets`), so everyone, every challenge and the next day's picker see the same ten.

**Checked by simulation** (`node server/scripts/simulateDaily.js 365 --show 3`). Over a year on the real catalog:
- no rule was broken
- a fan has likely seen 7.1 of the 10 on average (never under 6)
- each day has about 8 genres, 6 languages and 6 decades

Code: `server/lib/films/dailyPicker.js` and `server/services/dailySetService.js`.

## Connection score (how alike two people's taste is)

1. **Agreement, weighted by surprise.** For each film both answered, agreeing or disagreeing counts by how unlikely it would be between two random fans:
   - Both loving The Godfather barely counts, because almost everyone does.
   - Both disliking it counts a lot.
   - Both loving a film that splits people counts a lot.
   - Disagreeing on a film everyone loves counts more than disagreeing on a divisive one.
2. **Stars.** If both logged the film in their diary, the gap between their stars shades the agreement: 8 and 9 are close, 8 and 3 are not.
3. **Seen or not.** Both having seen a rare film, or both not having seen a famous one, is a small sign of shared taste.
4. **Favourites.** The same all-time favourite counts a lot. Liking or disliking the other person's favourite counts too.
5. **Taste profile.** Each person's likes and dislikes become a profile over genre, language, decade, director, franchise and style. This lets two people match before they've rated the same films, for example a Ghibli fan and a Shinkai fan. It also gives the "why you match" reasons, like "You both like Malayalam cinema". The profile matters less as real shared films pile up.

The result starts at 50% ("strangers") and moves with the evidence. Along with the percentage it carries a cautious estimate and a confidence level (low, medium or high). One lucky shared film can't make someone a 95% match.

**Checked by simulation** (`node server/scripts/evaluateMatching.js`). 360 simulated fans in six taste groups played the real daily ten. The table shows the share of each fan's top-five matches who really share their taste:

| Days played | Old formula | New formula |
|---|---|---|
| 3 | 44% | 51% |
| 7 | 59% | 69% |
| 14 | 69% | 76% |
| 30 | 84% | 87% |

Code: `server/lib/tasteMatch.js`.

## Dating deck (who you see next)

Dating is two-sided, so a good card is someone you'd like **and** who would like you back. Each person gets a value from five things:
- **Taste:** a draw from the connection estimate, rather than the bare number. A well-proven 85% usually comes first, but a promising 70% with little evidence sometimes jumps ahead. That way new and quiet members get seen, and the score keeps learning. The draw is fixed per viewer per day, so the deck doesn't reshuffle on every refresh.
- **Likely to like you back:** certain if they already liked you; otherwise based on how often they like people.
- **Active lately:** people active this week rank above people gone for a month.
- **Not flooded:** people already buried in unanswered likes are shown a bit less, which spreads attention across more profiles.
- **New this week:** a small lift, so newcomers get a first match early.

Code: `server/lib/deckRanking.js`.

## Challenge links

1. After today's ten, a member taps **Challenge a friend** and shares the link (`/c/ABCD2345`) anywhere: WhatsApp, Instagram, Telegram.
2. Whoever opens it rates the same ten in a browser. They need no account, and they don't see the sharer's answers until they finish.
3. They see their connection score.

| Answers | Counts as |
|---|---|
| Same answer, including both "haven't seen" | 1 |
| Liked vs didn't like | 0 |
| Seen vs haven't seen | 0.5 (not a clash of taste, just not shared yet) |

Films where people's answers usually vary count a little more. Identical answers are always **100%**, and anything else is at most 99%. The result shows:
- a verdict, from "Film soulmates" down to "Opposites attract?"
- every film side by side
- something to watch next

The sharer gets a notification and sees everyone who answered on their results card.

Code: `server/lib/challenge.js`, `server/services/challengeService.js` and `src/pages/ChallengePage.jsx`.

## Tuning

Every rule above is a named constant at the top of its file, such as how long films rest, the English cap or the profile's influence. After changing one, re-run the two scripts above and `npm test`.
