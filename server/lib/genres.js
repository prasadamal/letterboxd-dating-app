// One spelling per genre, whatever the catalog or an older database row says.
const ALIASES = { 'Science Fiction': 'Sci-Fi', 'Sci Fi': 'Sci-Fi', SciFi: 'Sci-Fi', Music: 'Musical' }

export function canonicalGenre(genre) {
  return ALIASES[genre] || genre
}

export function canonicalGenres(genres) {
  return [...new Set((genres || []).map(canonicalGenre).filter(Boolean))]
}

// Languages counted as Indian cinema (film personality, collections).
export const INDIAN_LANGUAGES = new Set(['Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Kannada', 'Punjabi', 'Gujarati', 'Assamese', 'Odia'])
