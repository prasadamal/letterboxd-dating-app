import dotenv from 'dotenv'

dotenv.config()

const { seedMoviesIfEmpty } = await import('../db.js')

try {
  const result = await seedMoviesIfEmpty()
  console.log(result.seeded ? `Seeded ${result.seeded} movies` : `Movies already present (${result.total})`)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
