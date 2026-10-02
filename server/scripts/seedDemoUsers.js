import dotenv from 'dotenv'

dotenv.config()

const bcrypt = (await import('bcryptjs')).default
const { supabase } = await import('../supabaseClient.js')

const hash = await bcrypt.hash('123456', 10)

const demoUsers = [
  {
    email: 'maya@example.com',
    display_name: 'Maya',
    bio: 'I love thoughtful cinema and slow-burn romances.',
    hobbies: ['Cinema', 'Hiking', 'Travel'],
    city: 'Brooklyn',
    age: 27,
    loves: [1, 2, 4, 26],
    hates: [25, 208]
  },
  {
    email: 'anna@example.com',
    display_name: 'Anna',
    bio: 'I collect great performances and midnight screenings.',
    hobbies: ['Film clubs', 'Cooking', 'Road trips'],
    city: 'Austin',
    age: 29,
    loves: [1, 2, 115, 26],
    hates: [25, 81]
  },
  {
    email: 'luca@example.com',
    display_name: 'Luca',
    bio: 'Classic films, deep conversations, and film history.',
    hobbies: ['Photography', 'Chess', 'Jazz'],
    city: 'Chicago',
    age: 31,
    loves: [7, 4, 31, 37],
    hates: [34, 258]
  }
]

for (const demo of demoUsers) {
  const email = demo.email.toLowerCase()
  const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle()

  let userId = existing?.id
  if (!userId) {
    const { data: created, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hash,
        display_name: demo.display_name,
        bio: demo.bio,
        hobbies: demo.hobbies,
        city: demo.city,
        age: demo.age,
        is_demo: true
      })
      .select('id')
      .single()
    if (error) throw error
    userId = created.id
  } else {
    const { error } = await supabase
      .from('users')
      .update({
        password_hash: hash,
        display_name: demo.display_name,
        bio: demo.bio,
        hobbies: demo.hobbies,
        city: demo.city,
        age: demo.age,
        is_demo: true
      })
      .eq('id', userId)
    if (error) throw error
  }

  const ratings = [
    ...demo.loves.map((movie_id) => ({ user_id: userId, movie_id, rating: 'love' })),
    ...demo.hates.map((movie_id) => ({ user_id: userId, movie_id, rating: 'hate' }))
  ]

  const { error: ratingError } = await supabase.from('user_ratings').upsert(ratings, { onConflict: 'user_id,movie_id' })
  if (ratingError) throw ratingError
  console.log(`Demo user ready: ${email}`)
}
