# How ReelMates matches people

**Taste comes first.** The score only looks at films both people rated in the daily game:

| Both people said… | Effect |
|---|---|
| I like | shared like → raises the match |
| I don't like | shared dislike → raises the match by the same amount |
| one liked, the other didn't | clash → lowers the match |
| only one of you rated it | ignored |

- **Rarity weighting:** agreeing on an obscure film (e.g. *Supa Modo*) counts up to 2× more than agreeing on
  *The Godfather*, using each film's popularity (35–90) from the catalog. Shared films are listed rarest first.
- **Evidence, not luck:** the match starts at 50% and moves as shared films add up:
  `match = (agree + 1.5) / (agree + clash + 3)` (agree/clash are rarity-weighted). One shared like ≈ 67%;
  three shared likes ≈ 80%; three likes + two dislikes ≈ 86%; five agreements but three clashes ≈ 60%.
- **Deck order:** match %, then number of films in common. Age range, country, gender, photo and profile
  completeness decide *who* can appear; they never change the score.

Code: `server/lib/tasteMatch.js` (tests: `server/tests/tasteMatch.test.js`).

## Daily films (the same for everyone)

Every player gets the **same films each day** (UTC), so anyone active builds up films in common with everyone else —
up to 10 more per day. The catalog is shuffled once per cycle and handed out 10 films a day, so nothing repeats until
every film has been shown (≈29 days with the current 296 films); the next cycle reshuffles, and re-rating a film
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
