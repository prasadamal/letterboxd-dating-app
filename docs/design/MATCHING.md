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

## Card layout

1. Big photo with **name, age and place** on it (like any dating app)
2. **Match %** and **films in common**
3. **You both liked** — shared likes, rarest first
4. **You both disliked** — shared dislikes, rarest first
5. One-line bio

Other people's full like/dislike lists are not shown or sent — only what you agree on.

## Previews

`docs/design/preview/` has screenshots at iPhone 15 Pro and Pixel 7 sizes and a short recording of the deck.
They are rendered from the real app screens with React Native Web against sample data; photos are placeholders.
Native builds use SF Pro (iOS) / Roboto (Android) and the system status bar, so small details differ.
