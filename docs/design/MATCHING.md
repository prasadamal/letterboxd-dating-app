# How ReelMates matches people

**Taste comes first.** The score only looks at films both people rated in the daily game:

| Both people said… | Effect |
|---|---|
| I like | shared like → raises the match |
| I don't like | shared dislike → raises the match by the same amount |
| one liked, the other didn't | clash → lowers the match |
| only one of you rated it | ignored |
| either of you said *Haven't seen* | ignored (not a dislike) |

- **Rarity weighting:** agreeing on an obscure film (e.g. *Supa Modo*) counts up to 2× more than agreeing on
  *The Godfather*, using each film's popularity (35–90) from the catalog. Shared films are listed rarest first.
- **Evidence, not luck:** the match starts at 50% and moves as shared films add up:
  `match = (agree + 1.5) / (agree + clash + 3)` (agree/clash are rarity-weighted). One shared like ≈ 67%;
  three shared likes ≈ 80%; three likes + two dislikes ≈ 86%; five agreements but three clashes ≈ 60%.
- **Who can appear:** interest has to go both ways (my *Show me* includes your gender and yours includes mine). Before
  the global launch, a country that opened on its own only shows people from that country. Code:
  `server/lib/datingEligibility.js`, `server/lib/regionLaunch.js`.
- **Deck order:** match %, then number of films in common. Age range, country, gender, photo and profile
  completeness decide *who* can appear; they never change the score.

- **All-time favourite (one film each):** the same favourite adds 4 to *agree*. Liking the other person's
  favourite adds 2 to *agree*; disliking it adds 2 to *clash* (both directions). The card shows their favourite and
  whether it's *Same as yours*, *You liked it too* or *You didn't like it*.

Code: `server/lib/tasteMatch.js` (tests: `server/tests/tasteMatch.test.js`).

## Haven't seen

Every film can be rated **Like**, **Dislike** or **Haven't seen** (daily game bucket/button and everywhere in Explore).
*Haven't seen* is stored (rating `skip`) so the film isn't asked again and counts in your stats, but it never affects
matching or the people's chart.

## People's chart (best films, ranked by members)

`score = (likes + 2) / (likes + dislikes + 4)` — the share of likes, pulled toward 50% until enough people have voted,
so one early like can't top the chart. Films with votes are ranked by score; films nobody has rated yet follow, most
famous first. Filter by collection: The canon, World cinema, Indian cinema, Malayalam cinema, Crowd favourites,
Underseen gems, Love it or hate it, Most debated (from the curated list in `server/data/curatedFilmList.txt`).
Cached 5 minutes. Code: `server/services/filmService.js` (tests: `server/tests/filmChart.test.js`).

## Film friends and Watch together

Anyone can add anyone by friend code (the referral code) — family, friends, people you'd never date — and works before
dating opens. Compare shows the same taste score, both favourites, shared likes/dislikes, and **Watch together**: films
one of you loved that the other hasn't rated, rarest first. Compare is also open between mutual matches, never with
blocked users. Code: `server/services/friendsService.js`.

## Daily films (the same for everyone)

Every player gets the **same films each day** (UTC), so anyone active builds up films in common with everyone else —
up to 10 more per day. The catalog is shuffled once per cycle and handed out 10 films a day, so nothing repeats until
every film has been shown (≈44 days with the current 436 films); the next cycle reshuffles, and re-rating a film
updates the earlier answer. Code: `sharedDailySet` in `server/lib/dailyMovies.js`.

To keep it fresh for long-term players, grow the catalog (`npm run db:seed` loads `server/movieCatalog.js`).

## Film personality

A shareable identity from what someone liked, compared with the catalog as a whole
(`server/lib/filmPersonality.js`, tests: `server/tests/personality.test.js`).

- Revealed after **8 likes + dislikes** (until then: *Fresh Reel* with progress dots). *Haven't seen* doesn't count.
- Each signal (romance, thrillers, horror, sci-fi/fantasy, animation, feel-good, action, drama, documentaries, Indian
  cinema, other non-English cinema, the canon, underseen gems) gets `share² / baseline`: *share* is the fraction of
  your liked films that match it, *baseline* the fraction of the catalog that does (floor 3%). That rewards both how
  much of your taste it is and how unusual that is: lots of romance (7% of the catalog) says more than lots of drama.
- The best signal with **≥ 30%** of your likes and **≥ 1.5×** its catalog share wins. Nothing qualifies → **Genre
  Hopper**. Without the lift rule, a mixed taste in a catalog that is 36% non-English always came out *World Cinema
  Nomad*.
- **Traits** (up to three): *Easy to please* (like rate ≥ 80%) or *Tough critic* (≤ 40%), the runner-up signal
  (≥ 25% share, ≥ 1.3× lift), and *Film buff* at 100 rated films.
- Lists and cards get a compact badge (`personalityBadge`). Two matches with the same personality get a starter:
  "Apparently we're both Hopeless Romantics. Which film made you one?"

## Daily results

`server/services/dailyService.js` (tests: `server/tests/daily.test.js`).

- Every film in today's set carries `community.likedPercent` and `votes` from `movie_rating_stats` (likes ÷ likes +
  dislikes). The app reveals it after each swipe.
- **Agreement:** your own vote is taken out first, then you agree when you side with the rest of the crowd's majority.
  Films you haven't seen, films nobody else voted on and ties are left out.
- **Crowd favourite / most divisive:** the highest liked % and the one closest to 50%, among films with ≥ 4 votes.
- **Share text:** `ReelMates Daily #N 🎬`, one square per film (🟩 loved, 🟥 nah, ⬜ haven't seen, ⬛ not played),
  `Agreed with the crowd on a/c · 🔥 streak` (streak from 2 days), and the app link (`APP_PUBLIC_URL`). Day #1 is
  1 October 2026 (UTC).

## Card layout

1. Big photo with **name, age and place** on it, the **match %**, a verified tag and the **personality** badge
2. Like / pass buttons on the photo's bottom edge (swipe works too)
3. **Films in common** — shared likes and dislikes, rarest first
4. **All-time favourite** and whether it's *Same as yours*, *You liked it too* or *You didn't like it*
5. Up to three **prompts**, then the bio (if any)

Other people's full like/dislike lists are not shown or sent — only what you agree on.

## Previews

`docs/design/preview/` has the current screens at iPhone 13 size (`mobile-*.png`), the web landing and taste card
(`web-*.png`) and an overview sheet. They are rendered from the real screens with React Native Web against sample
data; photos are monogram placeholders. Native builds use the system font for body text and the system status bar,
so small details differ.
