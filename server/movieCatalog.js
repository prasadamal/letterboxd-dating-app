import { FIRST_ID, INDIAN_FILMS } from './data/indianFilms.js'
import { INDIAN_LANGUAGES } from './lib/genres.js'

const baseCatalog = [
  {
    "id": 1,
    "title": "The Shawshank Redemption",
    "year": 1994,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 85,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 2,
    "title": "The Godfather",
    "year": 1972,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 90,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 3,
    "title": "Parasite",
    "year": 2019,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Korean",
    "popularity": 88,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 4,
    "title": "Spirited Away",
    "year": 2001,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 86,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 5,
    "title": "Cinema Paradiso",
    "year": 1988,
    "genres": [
      "Drama"
    ],
    "origin_language": "Italian",
    "popularity": 70,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 6,
    "title": "Pan's Labyrinth",
    "year": 2006,
    "genres": [
      "Fantasy"
    ],
    "origin_language": "Spanish",
    "popularity": 75,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 7,
    "title": "Amélie",
    "year": 2001,
    "genres": [
      "Romance"
    ],
    "origin_language": "French",
    "popularity": 78,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 8,
    "title": "City of God",
    "year": 2002,
    "genres": [
      "Crime"
    ],
    "origin_language": "Portuguese",
    "popularity": 72,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 9,
    "title": "Oldboy",
    "year": 2003,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Korean",
    "popularity": 74,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 10,
    "title": "In the Mood for Love",
    "year": 2000,
    "genres": [
      "Romance"
    ],
    "origin_language": "Mandarin",
    "popularity": 68,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 11,
    "title": "Crouching Tiger, Hidden Dragon",
    "year": 2000,
    "genres": [
      "Action"
    ],
    "origin_language": "Mandarin",
    "popularity": 80,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 12,
    "title": "Lagaan",
    "year": 2001,
    "genres": [
      "Drama"
    ],
    "origin_language": "Hindi",
    "popularity": 65,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 13,
    "title": "3 Idiots",
    "year": 2009,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Hindi",
    "popularity": 82,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 14,
    "title": "Dangal",
    "year": 2016,
    "genres": [
      "Drama"
    ],
    "origin_language": "Hindi",
    "popularity": 79,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 15,
    "title": "RRR",
    "year": 2022,
    "genres": [
      "Action"
    ],
    "origin_language": "Telugu",
    "popularity": 84,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 16,
    "title": "Baahubali: The Beginning",
    "year": 2015,
    "genres": [
      "Fantasy"
    ],
    "origin_language": "Telugu",
    "popularity": 77,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 17,
    "title": "Drishyam",
    "year": 2013,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Malayalam",
    "popularity": 60,
    "in_deck": true,
    "tags": [
      "indian",
      "malayalam"
    ]
  },
  {
    "id": 18,
    "title": "Vikram Vedha",
    "year": 2017,
    "genres": [
      "Crime"
    ],
    "origin_language": "Tamil",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 19,
    "title": "Pather Panchali",
    "year": 1955,
    "genres": [
      "Drama"
    ],
    "origin_language": "Bengali",
    "popularity": 55,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 20,
    "title": "The Lunchbox",
    "year": 2013,
    "genres": [
      "Romance"
    ],
    "origin_language": "Hindi",
    "popularity": 62,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 21,
    "title": "Timbuktu",
    "year": 2014,
    "genres": [
      "Drama"
    ],
    "origin_language": "Arabic",
    "popularity": 52,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 22,
    "title": "A Separation",
    "year": 2011,
    "genres": [
      "Drama"
    ],
    "origin_language": "Persian",
    "popularity": 71,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 23,
    "title": "The Salesman",
    "year": 2016,
    "genres": [
      "Drama"
    ],
    "origin_language": "Persian",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 24,
    "title": "Tsotsi",
    "year": 2005,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 48,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 25,
    "title": "Black Panther",
    "year": 2018,
    "genres": [
      "Action"
    ],
    "origin_language": "English",
    "popularity": 83,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 26,
    "title": "Moonlight",
    "year": 2016,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 76,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 27,
    "title": "Get Out",
    "year": 2017,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 77,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 28,
    "title": "Everything Everywhere All at Once",
    "year": 2022,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 85,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 29,
    "title": "The Matrix",
    "year": 1999,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 88,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 30,
    "title": "Blade Runner 2049",
    "year": 2017,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 74,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 31,
    "title": "Arrival",
    "year": 2016,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 73,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 32,
    "title": "Interstellar",
    "year": 2014,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 84,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 33,
    "title": "Mad Max: Fury Road",
    "year": 2015,
    "genres": [
      "Action"
    ],
    "origin_language": "English",
    "popularity": 81,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 34,
    "title": "The Dark Knight",
    "year": 2008,
    "genres": [
      "Action"
    ],
    "origin_language": "English",
    "popularity": 89,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 35,
    "title": "Whiplash",
    "year": 2014,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 78,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 36,
    "title": "La La Land",
    "year": 2016,
    "genres": [
      "Musical"
    ],
    "origin_language": "English",
    "popularity": 80,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 37,
    "title": "The Grand Budapest Hotel",
    "year": 2014,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 76,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 38,
    "title": "Lady Bird",
    "year": 2017,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 70,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 39,
    "title": "Nomadland",
    "year": 2020,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 68,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 40,
    "title": "Minari",
    "year": 2020,
    "genres": [
      "Drama"
    ],
    "origin_language": "Korean",
    "popularity": 66,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 41,
    "title": "Past Lives",
    "year": 2023,
    "genres": [
      "Romance"
    ],
    "origin_language": "Korean",
    "popularity": 72,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 42,
    "title": "Train to Busan",
    "year": 2016,
    "genres": [
      "Horror"
    ],
    "origin_language": "Korean",
    "popularity": 75,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 43,
    "title": "Your Name",
    "year": 2016,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 83,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 44,
    "title": "Perfect Blue",
    "year": 1997,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Japanese",
    "popularity": 64,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 45,
    "title": "Grave of the Fireflies",
    "year": 1988,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 67,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 46,
    "title": "Shoplifters",
    "year": 2018,
    "genres": [
      "Drama"
    ],
    "origin_language": "Japanese",
    "popularity": 69,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 47,
    "title": "Drive My Car",
    "year": 2021,
    "genres": [
      "Drama"
    ],
    "origin_language": "Japanese",
    "popularity": 61,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 48,
    "title": "Godzilla Minus One",
    "year": 2023,
    "genres": [
      "Action"
    ],
    "origin_language": "Japanese",
    "popularity": 70,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 49,
    "title": "The Handmaiden",
    "year": 2016,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Korean",
    "popularity": 68,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 50,
    "title": "Memories of Murder",
    "year": 2003,
    "genres": [
      "Crime"
    ],
    "origin_language": "Korean",
    "popularity": 66,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 51,
    "title": "Burning",
    "year": 2018,
    "genres": [
      "Drama"
    ],
    "origin_language": "Korean",
    "popularity": 55,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 52,
    "title": "The Wailing",
    "year": 2016,
    "genres": [
      "Horror"
    ],
    "origin_language": "Korean",
    "popularity": 60,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 53,
    "title": "Roma",
    "year": 2018,
    "genres": [
      "Drama"
    ],
    "origin_language": "Spanish",
    "popularity": 71,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 54,
    "title": "Y Tu Mamá También",
    "year": 2001,
    "genres": [
      "Drama"
    ],
    "origin_language": "Spanish",
    "popularity": 63,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 55,
    "title": "The Secret in Their Eyes",
    "year": 2009,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Spanish",
    "popularity": 58,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 56,
    "title": "A Fantastic Woman",
    "year": 2017,
    "genres": [
      "Drama"
    ],
    "origin_language": "Spanish",
    "popularity": 52,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 57,
    "title": "Portrait of a Lady on Fire",
    "year": 2019,
    "genres": [
      "Romance"
    ],
    "origin_language": "French",
    "popularity": 65,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 58,
    "title": "Blue Is the Warmest Color",
    "year": 2013,
    "genres": [
      "Romance"
    ],
    "origin_language": "French",
    "popularity": 62,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 59,
    "title": "The Intouchables",
    "year": 2011,
    "genres": [
      "Comedy"
    ],
    "origin_language": "French",
    "popularity": 79,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 60,
    "title": "Persepolis",
    "year": 2007,
    "genres": [
      "Animation"
    ],
    "origin_language": "French",
    "popularity": 57,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 61,
    "title": "The Battle of Algiers",
    "year": 1966,
    "genres": [
      "War"
    ],
    "origin_language": "Arabic",
    "popularity": 54,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 62,
    "title": "Capernaum",
    "year": 2018,
    "genres": [
      "Drama"
    ],
    "origin_language": "Arabic",
    "popularity": 59,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 63,
    "title": "Wadjda",
    "year": 2012,
    "genres": [
      "Drama"
    ],
    "origin_language": "Arabic",
    "popularity": 48,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 64,
    "title": "Theeb",
    "year": 2014,
    "genres": [
      "Adventure"
    ],
    "origin_language": "Arabic",
    "popularity": 45,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 65,
    "title": "District 9",
    "year": 2009,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 72,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 66,
    "title": "The Gods Must Be Crazy",
    "year": 1980,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 50,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 67,
    "title": "Queen of Katwe",
    "year": 2016,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 46,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 68,
    "title": "Slumdog Millionaire",
    "year": 2008,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 78,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 69,
    "title": "Gangs of Wasseypur",
    "year": 2012,
    "genres": [
      "Crime"
    ],
    "origin_language": "Hindi",
    "popularity": 56,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 70,
    "title": "Andhadhun",
    "year": 2018,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Hindi",
    "popularity": 61,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 71,
    "title": "Article 15",
    "year": 2019,
    "genres": [
      "Crime"
    ],
    "origin_language": "Hindi",
    "popularity": 53,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 72,
    "title": "Court",
    "year": 2014,
    "genres": [
      "Drama"
    ],
    "origin_language": "Marathi",
    "popularity": 42,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 73,
    "title": "Sairat",
    "year": 2016,
    "genres": [
      "Romance"
    ],
    "origin_language": "Marathi",
    "popularity": 49,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 74,
    "title": "Kumbalangi Nights",
    "year": 2019,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 44,
    "in_deck": true,
    "tags": [
      "indian",
      "malayalam"
    ]
  },
  {
    "id": 75,
    "title": "Premam",
    "year": 2015,
    "genres": [
      "Romance"
    ],
    "origin_language": "Malayalam",
    "popularity": 51,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 76,
    "title": "Super Deluxe",
    "year": 2019,
    "genres": [
      "Drama"
    ],
    "origin_language": "Tamil",
    "popularity": 47,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 77,
    "title": "Kaithi",
    "year": 2019,
    "genres": [
      "Action"
    ],
    "origin_language": "Tamil",
    "popularity": 50,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 78,
    "title": "Jersey",
    "year": 2019,
    "genres": [
      "Drama"
    ],
    "origin_language": "Telugu",
    "popularity": 43,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 79,
    "title": "Coco",
    "year": 2017,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 82,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 80,
    "title": "Inside Out",
    "year": 2015,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 80,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 81,
    "title": "Spider-Man: Into the Spider-Verse",
    "year": 2018,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 81,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 82,
    "title": "The Lion King",
    "year": 1994,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 85,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 83,
    "title": "WALL-E",
    "year": 2008,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 79,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 84,
    "title": "Finding Nemo",
    "year": 2003,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 78,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 85,
    "title": "Toy Story",
    "year": 1995,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 84,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 86,
    "title": "The Princess Bride",
    "year": 1987,
    "genres": [
      "Fantasy"
    ],
    "origin_language": "English",
    "popularity": 74,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 87,
    "title": "The Shining",
    "year": 1980,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 82,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 88,
    "title": "Hereditary",
    "year": 2018,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 68,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 89,
    "title": "The Witch",
    "year": 2015,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 90,
    "title": "A Quiet Place",
    "year": 2018,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 70,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 91,
    "title": "Scream",
    "year": 1996,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 72,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 92,
    "title": "The Exorcist",
    "year": 1973,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 75,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 93,
    "title": "Halloween",
    "year": 1978,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 68,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 94,
    "title": "Psycho",
    "year": 1960,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 77,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 95,
    "title": "The Silence of the Lambs",
    "year": 1991,
    "genres": [
      "Thriller"
    ],
    "origin_language": "English",
    "popularity": 83,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 96,
    "title": "Se7en",
    "year": 1995,
    "genres": [
      "Thriller"
    ],
    "origin_language": "English",
    "popularity": 79,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 97,
    "title": "Zodiac",
    "year": 2007,
    "genres": [
      "Thriller"
    ],
    "origin_language": "English",
    "popularity": 71,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 98,
    "title": "Prisoners",
    "year": 2013,
    "genres": [
      "Thriller"
    ],
    "origin_language": "English",
    "popularity": 67,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 99,
    "title": "No Country for Old Men",
    "year": 2007,
    "genres": [
      "Thriller"
    ],
    "origin_language": "English",
    "popularity": 76,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 100,
    "title": "Fargo",
    "year": 1996,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 73,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 101,
    "title": "Pulp Fiction",
    "year": 1994,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 86,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 102,
    "title": "Goodfellas",
    "year": 1990,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 82,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 103,
    "title": "The Departed",
    "year": 2006,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 77,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 104,
    "title": "Casino",
    "year": 1995,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 70,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 105,
    "title": "Heat",
    "year": 1995,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 72,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 106,
    "title": "The Usual Suspects",
    "year": 1995,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 69,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 107,
    "title": "L.A. Confidential",
    "year": 1997,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 66,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 108,
    "title": "Chinatown",
    "year": 1974,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 64,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 109,
    "title": "Double Indemnity",
    "year": 1944,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 110,
    "title": "The Maltese Falcon",
    "year": 1941,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 52,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 111,
    "title": "Before Sunrise",
    "year": 1995,
    "genres": [
      "Romance"
    ],
    "origin_language": "English",
    "popularity": 65,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 112,
    "title": "Eternal Sunshine of the Spotless Mind",
    "year": 2004,
    "genres": [
      "Romance"
    ],
    "origin_language": "English",
    "popularity": 74,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 113,
    "title": "Call Me by Your Name",
    "year": 2017,
    "genres": [
      "Romance"
    ],
    "origin_language": "English",
    "popularity": 73,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 114,
    "title": "The Notebook",
    "year": 2004,
    "genres": [
      "Romance"
    ],
    "origin_language": "English",
    "popularity": 68,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 115,
    "title": "Pride & Prejudice",
    "year": 2005,
    "genres": [
      "Romance"
    ],
    "origin_language": "English",
    "popularity": 70,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 116,
    "title": "Brooklyn",
    "year": 2015,
    "genres": [
      "Romance"
    ],
    "origin_language": "English",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 117,
    "title": "Carol",
    "year": 2015,
    "genres": [
      "Romance"
    ],
    "origin_language": "English",
    "popularity": 60,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 118,
    "title": "Phantom Thread",
    "year": 2017,
    "genres": [
      "Romance"
    ],
    "origin_language": "English",
    "popularity": 57,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 119,
    "title": "The Shape of Water",
    "year": 2017,
    "genres": [
      "Fantasy"
    ],
    "origin_language": "English",
    "popularity": 71,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 120,
    "title": "The Lord of the Rings: The Fellowship of the Ring",
    "year": 2001,
    "genres": [
      "Fantasy"
    ],
    "origin_language": "English",
    "popularity": 87,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 121,
    "title": "Harry Potter and the Prisoner of Azkaban",
    "year": 2004,
    "genres": [
      "Fantasy"
    ],
    "origin_language": "English",
    "popularity": 80,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 122,
    "title": "Howl's Moving Castle",
    "year": 2004,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 76,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 123,
    "title": "The Wizard of Oz",
    "year": 1939,
    "genres": [
      "Fantasy"
    ],
    "origin_language": "English",
    "popularity": 72,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 124,
    "title": "Dune",
    "year": 2021,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 78,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 125,
    "title": "2001: A Space Odyssey",
    "year": 1968,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 74,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 126,
    "title": "Alien",
    "year": 1979,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 76,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 127,
    "title": "The Thing",
    "year": 1982,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 65,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 128,
    "title": "Children of Men",
    "year": 2006,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 67,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 129,
    "title": "Ex Machina",
    "year": 2014,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 66,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 130,
    "title": "Annihilation",
    "year": 2018,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 60,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 131,
    "title": "Snowpiercer",
    "year": 2013,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "Korean",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 132,
    "title": "Okja",
    "year": 2017,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "Korean",
    "popularity": 54,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 133,
    "title": "Stalker",
    "year": 1979,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "Russian",
    "popularity": 50,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 134,
    "title": "Solaris",
    "year": 1972,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "Russian",
    "popularity": 48,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 135,
    "title": "Metropolis",
    "year": 1927,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "German",
    "popularity": 55,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 136,
    "title": "Das Boot",
    "year": 1981,
    "genres": [
      "War"
    ],
    "origin_language": "German",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 137,
    "title": "Downfall",
    "year": 2004,
    "genres": [
      "War"
    ],
    "origin_language": "German",
    "popularity": 62,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 138,
    "title": "Come and See",
    "year": 1985,
    "genres": [
      "War"
    ],
    "origin_language": "Russian",
    "popularity": 53,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 139,
    "title": "Apocalypse Now",
    "year": 1979,
    "genres": [
      "War"
    ],
    "origin_language": "English",
    "popularity": 71,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 140,
    "title": "Saving Private Ryan",
    "year": 1998,
    "genres": [
      "War"
    ],
    "origin_language": "English",
    "popularity": 74,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 141,
    "title": "1917",
    "year": 2019,
    "genres": [
      "War"
    ],
    "origin_language": "English",
    "popularity": 69,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 142,
    "title": "Dunkirk",
    "year": 2017,
    "genres": [
      "War"
    ],
    "origin_language": "English",
    "popularity": 68,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 143,
    "title": "The Hurt Locker",
    "year": 2008,
    "genres": [
      "War"
    ],
    "origin_language": "English",
    "popularity": 61,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 144,
    "title": "Full Metal Jacket",
    "year": 1987,
    "genres": [
      "War"
    ],
    "origin_language": "English",
    "popularity": 64,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 145,
    "title": "Platoon",
    "year": 1986,
    "genres": [
      "War"
    ],
    "origin_language": "English",
    "popularity": 60,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 146,
    "title": "The Searchers",
    "year": 1956,
    "genres": [
      "Western"
    ],
    "origin_language": "English",
    "popularity": 52,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 147,
    "title": "Unforgiven",
    "year": 1992,
    "genres": [
      "Western"
    ],
    "origin_language": "English",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 148,
    "title": "The Good, the Bad and the Ugly",
    "year": 1966,
    "genres": [
      "Western"
    ],
    "origin_language": "Italian",
    "popularity": 70,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 149,
    "title": "Raging Bull",
    "year": 1980,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 63,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 150,
    "title": "Taxi Driver",
    "year": 1976,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 68,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 151,
    "title": "There Will Be Blood",
    "year": 2007,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 66,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 152,
    "title": "The Master",
    "year": 2012,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 55,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 153,
    "title": "Magnolia",
    "year": 1999,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 57,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 154,
    "title": "Boyhood",
    "year": 2014,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 59,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 155,
    "title": "The Florida Project",
    "year": 2017,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 54,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 156,
    "title": "The Farewell",
    "year": 2019,
    "genres": [
      "Drama"
    ],
    "origin_language": "Mandarin",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 157,
    "title": "A Taxi Driver",
    "year": 2017,
    "genres": [
      "Drama"
    ],
    "origin_language": "Korean",
    "popularity": 56,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 158,
    "title": "PK",
    "year": 2014,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Hindi",
    "popularity": 60,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 159,
    "title": "Hera Pheri",
    "year": 2000,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Hindi",
    "popularity": 52,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 160,
    "title": "Andaz Apna Apna",
    "year": 1994,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Hindi",
    "popularity": 55,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 161,
    "title": "Superbad",
    "year": 2007,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 64,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 162,
    "title": "Bridesmaids",
    "year": 2011,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 62,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 163,
    "title": "The Big Lebowski",
    "year": 1998,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 67,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 164,
    "title": "Groundhog Day",
    "year": 1993,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 66,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 165,
    "title": "Monty Python and the Holy Grail",
    "year": 1975,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 61,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 166,
    "title": "Borat",
    "year": 2006,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 167,
    "title": "The Grand Seduction",
    "year": 2013,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 40,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 168,
    "title": "Hunt for the Wilderpeople",
    "year": 2016,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 49,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 169,
    "title": "What We Do in the Shadows",
    "year": 2014,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 51,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 170,
    "title": "The Square",
    "year": 2017,
    "genres": [
      "Drama"
    ],
    "origin_language": "Swedish",
    "popularity": 45,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 171,
    "title": "Force Majeure",
    "year": 2014,
    "genres": [
      "Drama"
    ],
    "origin_language": "Swedish",
    "popularity": 44,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 172,
    "title": "The Lives of Others",
    "year": 2006,
    "genres": [
      "Thriller"
    ],
    "origin_language": "German",
    "popularity": 63,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 173,
    "title": "Head-On",
    "year": 2004,
    "genres": [
      "Drama"
    ],
    "origin_language": "Turkish",
    "popularity": 46,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 174,
    "title": "Once Upon a Time in Anatolia",
    "year": 2011,
    "genres": [
      "Crime"
    ],
    "origin_language": "Turkish",
    "popularity": 50,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 175,
    "title": "Mustang",
    "year": 2015,
    "genres": [
      "Drama"
    ],
    "origin_language": "Turkish",
    "popularity": 43,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 176,
    "title": "Incendies",
    "year": 2010,
    "genres": [
      "Drama"
    ],
    "origin_language": "French",
    "popularity": 57,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 177,
    "title": "The Class",
    "year": 2008,
    "genres": [
      "Drama"
    ],
    "origin_language": "French",
    "popularity": 42,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 178,
    "title": "Atlantics",
    "year": 2019,
    "genres": [
      "Romance"
    ],
    "origin_language": "French",
    "popularity": 41,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 179,
    "title": "Rafiki",
    "year": 2018,
    "genres": [
      "Romance"
    ],
    "origin_language": "Swahili",
    "popularity": 38,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 180,
    "title": "Supa Modo",
    "year": 2018,
    "genres": [
      "Drama"
    ],
    "origin_language": "Swahili",
    "popularity": 35,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 181,
    "title": "The Band's Visit",
    "year": 2007,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Arabic",
    "popularity": 44,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 182,
    "title": "Caramel",
    "year": 2007,
    "genres": [
      "Drama"
    ],
    "origin_language": "Arabic",
    "popularity": 40,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 183,
    "title": "Omar",
    "year": 2013,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Arabic",
    "popularity": 39,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 184,
    "title": "Uncle Boonmee Who Can Recall His Past Lives",
    "year": 2010,
    "genres": [
      "Fantasy"
    ],
    "origin_language": "Thai",
    "popularity": 42,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 185,
    "title": "Bad Genius",
    "year": 2017,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Thai",
    "popularity": 48,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 186,
    "title": "The Raid",
    "year": 2011,
    "genres": [
      "Action"
    ],
    "origin_language": "Indonesian",
    "popularity": 54,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 187,
    "title": "The Act of Killing",
    "year": 2012,
    "genres": [
      "Documentary"
    ],
    "origin_language": "Indonesian",
    "popularity": 52,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 188,
    "title": "Honeyland",
    "year": 2019,
    "genres": [
      "Documentary"
    ],
    "origin_language": "Macedonian",
    "popularity": 41,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 189,
    "title": "Free Solo",
    "year": 2018,
    "genres": [
      "Documentary"
    ],
    "origin_language": "English",
    "popularity": 55,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 190,
    "title": "March of the Penguins",
    "year": 2005,
    "genres": [
      "Documentary"
    ],
    "origin_language": "French",
    "popularity": 46,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 191,
    "title": "13th",
    "year": 2016,
    "genres": [
      "Documentary"
    ],
    "origin_language": "English",
    "popularity": 53,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 192,
    "title": "Won't You Be My Neighbor?",
    "year": 2018,
    "genres": [
      "Documentary"
    ],
    "origin_language": "English",
    "popularity": 50,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 193,
    "title": "Searching for Sugar Man",
    "year": 2012,
    "genres": [
      "Documentary"
    ],
    "origin_language": "English",
    "popularity": 47,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 194,
    "title": "The Last Dance",
    "year": 2020,
    "genres": [
      "Documentary"
    ],
    "origin_language": "English",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 195,
    "title": "Singin' in the Rain",
    "year": 1952,
    "genres": [
      "Musical"
    ],
    "origin_language": "English",
    "popularity": 62,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 196,
    "title": "West Side Story",
    "year": 1961,
    "genres": [
      "Musical"
    ],
    "origin_language": "English",
    "popularity": 60,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 197,
    "title": "Chicago",
    "year": 2002,
    "genres": [
      "Musical"
    ],
    "origin_language": "English",
    "popularity": 56,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 198,
    "title": "The Sound of Music",
    "year": 1965,
    "genres": [
      "Musical"
    ],
    "origin_language": "English",
    "popularity": 64,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 199,
    "title": "Dil Se..",
    "year": 1998,
    "genres": [
      "Romance"
    ],
    "origin_language": "Hindi",
    "popularity": 50,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 200,
    "title": "Devdas",
    "year": 2002,
    "genres": [
      "Romance"
    ],
    "origin_language": "Hindi",
    "popularity": 48,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 201,
    "title": "Barfi!",
    "year": 2012,
    "genres": [
      "Romance"
    ],
    "origin_language": "Hindi",
    "popularity": 52,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 202,
    "title": "Swades",
    "year": 2004,
    "genres": [
      "Drama"
    ],
    "origin_language": "Hindi",
    "popularity": 54,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 203,
    "title": "Queen",
    "year": 2013,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Hindi",
    "popularity": 53,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 204,
    "title": "Udaan",
    "year": 2010,
    "genres": [
      "Drama"
    ],
    "origin_language": "Hindi",
    "popularity": 45,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 205,
    "title": "Ship of Theseus",
    "year": 2012,
    "genres": [
      "Drama"
    ],
    "origin_language": "Hindi",
    "popularity": 40,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 206,
    "title": "Tumbbad",
    "year": 2018,
    "genres": [
      "Horror"
    ],
    "origin_language": "Hindi",
    "popularity": 46,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 207,
    "title": "Stree",
    "year": 2018,
    "genres": [
      "Horror"
    ],
    "origin_language": "Hindi",
    "popularity": 44,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 208,
    "title": "Us",
    "year": 2019,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 62,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 209,
    "title": "Nope",
    "year": 2022,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 210,
    "title": "The Babadook",
    "year": 2014,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 55,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 211,
    "title": "Let the Right One In",
    "year": 2008,
    "genres": [
      "Horror"
    ],
    "origin_language": "Swedish",
    "popularity": 53,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 212,
    "title": "Raw",
    "year": 2016,
    "genres": [
      "Horror"
    ],
    "origin_language": "French",
    "popularity": 42,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 213,
    "title": "A Girl Walks Home Alone at Night",
    "year": 2014,
    "genres": [
      "Horror"
    ],
    "origin_language": "Persian",
    "popularity": 41,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 214,
    "title": "Under the Shadow",
    "year": 2016,
    "genres": [
      "Horror"
    ],
    "origin_language": "Persian",
    "popularity": 38,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 215,
    "title": "The Host",
    "year": 2006,
    "genres": [
      "Horror"
    ],
    "origin_language": "Korean",
    "popularity": 57,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 216,
    "title": "Mother",
    "year": 2009,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Korean",
    "popularity": 52,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 217,
    "title": "The Chaser",
    "year": 2008,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Korean",
    "popularity": 49,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 218,
    "title": "I Saw the Devil",
    "year": 2010,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Korean",
    "popularity": 51,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 219,
    "title": "A Bittersweet Life",
    "year": 2005,
    "genres": [
      "Crime"
    ],
    "origin_language": "Korean",
    "popularity": 44,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 220,
    "title": "The Man from Nowhere",
    "year": 2010,
    "genres": [
      "Action"
    ],
    "origin_language": "Korean",
    "popularity": 50,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 221,
    "title": "Ong-Bak",
    "year": 2003,
    "genres": [
      "Action"
    ],
    "origin_language": "Thai",
    "popularity": 46,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 222,
    "title": "Ip Man",
    "year": 2008,
    "genres": [
      "Action"
    ],
    "origin_language": "Cantonese",
    "popularity": 55,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 223,
    "title": "Hero",
    "year": 2002,
    "genres": [
      "Action"
    ],
    "origin_language": "Mandarin",
    "popularity": 62,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 224,
    "title": "House of Flying Daggers",
    "year": 2004,
    "genres": [
      "Action"
    ],
    "origin_language": "Mandarin",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 225,
    "title": "Raise the Red Lantern",
    "year": 1991,
    "genres": [
      "Drama"
    ],
    "origin_language": "Mandarin",
    "popularity": 50,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 226,
    "title": "Farewell My Concubine",
    "year": 1993,
    "genres": [
      "Drama"
    ],
    "origin_language": "Mandarin",
    "popularity": 52,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 227,
    "title": "Still Life",
    "year": 2006,
    "genres": [
      "Drama"
    ],
    "origin_language": "Mandarin",
    "popularity": 38,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 228,
    "title": "A Touch of Sin",
    "year": 2013,
    "genres": [
      "Crime"
    ],
    "origin_language": "Mandarin",
    "popularity": 40,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 229,
    "title": "Nobody Knows",
    "year": 2004,
    "genres": [
      "Drama"
    ],
    "origin_language": "Japanese",
    "popularity": 43,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 230,
    "title": "Like Father, Like Son",
    "year": 2013,
    "genres": [
      "Drama"
    ],
    "origin_language": "Japanese",
    "popularity": 45,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 231,
    "title": "Our Little Sister",
    "year": 2015,
    "genres": [
      "Drama"
    ],
    "origin_language": "Japanese",
    "popularity": 41,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 232,
    "title": "After the Storm",
    "year": 2016,
    "genres": [
      "Drama"
    ],
    "origin_language": "Japanese",
    "popularity": 39,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 233,
    "title": "The Taste of Tea",
    "year": 2004,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Japanese",
    "popularity": 36,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 234,
    "title": "Perfect Days",
    "year": 2023,
    "genres": [
      "Drama"
    ],
    "origin_language": "Japanese",
    "popularity": 48,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 235,
    "title": "The Fabelmans",
    "year": 2022,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 57,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 236,
    "title": "The Holdovers",
    "year": 2023,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 56,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 237,
    "title": "Anatomy of a Fall",
    "year": 2023,
    "genres": [
      "Thriller"
    ],
    "origin_language": "French",
    "popularity": 60,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 238,
    "title": "The Zone of Interest",
    "year": 2023,
    "genres": [
      "Drama"
    ],
    "origin_language": "German",
    "popularity": 55,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 239,
    "title": "All Quiet on the Western Front",
    "year": 2022,
    "genres": [
      "War"
    ],
    "origin_language": "German",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 240,
    "title": "Decision to Leave",
    "year": 2022,
    "genres": [
      "Romance"
    ],
    "origin_language": "Korean",
    "popularity": 54,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 241,
    "title": "Broker",
    "year": 2022,
    "genres": [
      "Drama"
    ],
    "origin_language": "Korean",
    "popularity": 46,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 242,
    "title": "The Worst Person in the World",
    "year": 2021,
    "genres": [
      "Romance"
    ],
    "origin_language": "Norwegian",
    "popularity": 50,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 243,
    "title": "Another Round",
    "year": 2020,
    "genres": [
      "Drama"
    ],
    "origin_language": "Danish",
    "popularity": 52,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 244,
    "title": "The Hand of God",
    "year": 2021,
    "genres": [
      "Drama"
    ],
    "origin_language": "Italian",
    "popularity": 44,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 245,
    "title": "The Great Beauty",
    "year": 2013,
    "genres": [
      "Drama"
    ],
    "origin_language": "Italian",
    "popularity": 51,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 246,
    "title": "Il Postino",
    "year": 1994,
    "genres": [
      "Romance"
    ],
    "origin_language": "Italian",
    "popularity": 48,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 247,
    "title": "Life Is Beautiful",
    "year": 1997,
    "genres": [
      "Drama"
    ],
    "origin_language": "Italian",
    "popularity": 62,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 248,
    "title": "The Bicycle Thieves",
    "year": 1948,
    "genres": [
      "Drama"
    ],
    "origin_language": "Italian",
    "popularity": 54,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 249,
    "title": "The Platform",
    "year": 2019,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Spanish",
    "popularity": 49,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 250,
    "title": "The Orphanage",
    "year": 2007,
    "genres": [
      "Horror"
    ],
    "origin_language": "Spanish",
    "popularity": 47,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 251,
    "title": "Talk to Her",
    "year": 2002,
    "genres": [
      "Romance"
    ],
    "origin_language": "Spanish",
    "popularity": 50,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 252,
    "title": "All About My Mother",
    "year": 1999,
    "genres": [
      "Drama"
    ],
    "origin_language": "Spanish",
    "popularity": 53,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 253,
    "title": "Volver",
    "year": 2006,
    "genres": [
      "Drama"
    ],
    "origin_language": "Spanish",
    "popularity": 46,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 254,
    "title": "The Skin I Live In",
    "year": 2011,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Spanish",
    "popularity": 44,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 255,
    "title": "The Motorcycle Diaries",
    "year": 2004,
    "genres": [
      "Drama"
    ],
    "origin_language": "Spanish",
    "popularity": 51,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 256,
    "title": "Central Station",
    "year": 1998,
    "genres": [
      "Drama"
    ],
    "origin_language": "Portuguese",
    "popularity": 45,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 257,
    "title": "City of Men",
    "year": 2007,
    "genres": [
      "Drama"
    ],
    "origin_language": "Portuguese",
    "popularity": 40,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 258,
    "title": "Elite Squad",
    "year": 2007,
    "genres": [
      "Action"
    ],
    "origin_language": "Portuguese",
    "popularity": 43,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 259,
    "title": "The Second Mother",
    "year": 2015,
    "genres": [
      "Drama"
    ],
    "origin_language": "Portuguese",
    "popularity": 41,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 260,
    "title": "Aquarius",
    "year": 2016,
    "genres": [
      "Drama"
    ],
    "origin_language": "Portuguese",
    "popularity": 38,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 261,
    "title": "Bacurau",
    "year": 2019,
    "genres": [
      "Western"
    ],
    "origin_language": "Portuguese",
    "popularity": 42,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 262,
    "title": "Wolfwalkers",
    "year": 2020,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 47,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 263,
    "title": "Song of the Sea",
    "year": 2014,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 44,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 264,
    "title": "The Breadwinner",
    "year": 2017,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 43,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 265,
    "title": "The Red Turtle",
    "year": 2016,
    "genres": [
      "Animation"
    ],
    "origin_language": "French",
    "popularity": 40,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 266,
    "title": "Mirai",
    "year": 2018,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 42,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 267,
    "title": "The Boy and the Heron",
    "year": 2023,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 268,
    "title": "Belle",
    "year": 2021,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 45,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 269,
    "title": "Puss in Boots: The Last Wish",
    "year": 2022,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 56,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 270,
    "title": "Turning Red",
    "year": 2022,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 52,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 271,
    "title": "Encanto",
    "year": 2021,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 54,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 272,
    "title": "Moana",
    "year": 2016,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 57,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 273,
    "title": "Zootopia",
    "year": 2016,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 55,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 274,
    "title": "The Mitchells vs. the Machines",
    "year": 2021,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 50,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 275,
    "title": "Klaus",
    "year": 2019,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 48,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 276,
    "title": "The Iron Giant",
    "year": 1999,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 46,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 277,
    "title": "Akira",
    "year": 1988,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 52,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 278,
    "title": "Ghost in the Shell",
    "year": 1995,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 54,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 279,
    "title": "Redline",
    "year": 2009,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 38,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 280,
    "title": "The Tale of The Princess Kaguya",
    "year": 2013,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 44,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 281,
    "title": "A Silent Voice",
    "year": 2016,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 50,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 282,
    "title": "Weathering with You",
    "year": 2019,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 48,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 283,
    "title": "The Wind Rises",
    "year": 2013,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 47,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 284,
    "title": "Nausicaä of the Valley of the Wind",
    "year": 1984,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 49,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 285,
    "title": "Castle in the Sky",
    "year": 1986,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 48,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 286,
    "title": "My Neighbor Totoro",
    "year": 1988,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 55,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 287,
    "title": "Kiki's Delivery Service",
    "year": 1989,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 50,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 288,
    "title": "Princess Mononoke",
    "year": 1997,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 58,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 289,
    "title": "The Cat Returns",
    "year": 2002,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 42,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 290,
    "title": "Ponyo",
    "year": 2008,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 46,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 291,
    "title": "The Secret World of Arrietty",
    "year": 2010,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 41,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 292,
    "title": "When Marnie Was There",
    "year": 2014,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 39,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 293,
    "title": "The Boy and the Beast",
    "year": 2015,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 37,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 294,
    "title": "Lu Over the Wall",
    "year": 2017,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 35,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 295,
    "title": "The First Slam Dunk",
    "year": 2022,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 46,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 296,
    "title": "Suzume",
    "year": 2022,
    "genres": [
      "Animation"
    ],
    "origin_language": "Japanese",
    "popularity": 47,
    "in_deck": true,
    "tags": []
  },
  {
    "id": 297,
    "title": "The Rules of the Game",
    "year": 1939,
    "genres": [
      "Drama"
    ],
    "origin_language": "French",
    "popularity": 58,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 298,
    "title": "Citizen Kane",
    "year": 1941,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 82,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 299,
    "title": "Casablanca",
    "year": 1942,
    "genres": [
      "Romance"
    ],
    "origin_language": "English",
    "popularity": 84,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 300,
    "title": "Bicycle Thieves",
    "year": 1948,
    "genres": [
      "Drama"
    ],
    "origin_language": "Italian",
    "popularity": 66,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 301,
    "title": "Rashomon",
    "year": 1950,
    "genres": [
      "Mystery"
    ],
    "origin_language": "Japanese",
    "popularity": 70,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 302,
    "title": "Sunset Boulevard",
    "year": 1950,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 70,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 303,
    "title": "Ikiru",
    "year": 1952,
    "genres": [
      "Drama"
    ],
    "origin_language": "Japanese",
    "popularity": 58,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 304,
    "title": "Tokyo Story",
    "year": 1953,
    "genres": [
      "Drama"
    ],
    "origin_language": "Japanese",
    "popularity": 62,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 305,
    "title": "Seven Samurai",
    "year": 1954,
    "genres": [
      "Action"
    ],
    "origin_language": "Japanese",
    "popularity": 76,
    "in_deck": true,
    "tags": [
      "canon",
      "world"
    ]
  },
  {
    "id": 306,
    "title": "12 Angry Men",
    "year": 1957,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 76,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 307,
    "title": "Mother India",
    "year": 1957,
    "genres": [
      "Drama"
    ],
    "origin_language": "Hindi",
    "popularity": 52,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 308,
    "title": "The Seventh Seal",
    "year": 1957,
    "genres": [
      "Drama"
    ],
    "origin_language": "Swedish",
    "popularity": 66,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 309,
    "title": "Vertigo",
    "year": 1958,
    "genres": [
      "Thriller"
    ],
    "origin_language": "English",
    "popularity": 76,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 310,
    "title": "The 400 Blows",
    "year": 1959,
    "genres": [
      "Drama"
    ],
    "origin_language": "French",
    "popularity": 64,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 311,
    "title": "La Dolce Vita",
    "year": 1960,
    "genres": [
      "Drama"
    ],
    "origin_language": "Italian",
    "popularity": 68,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 312,
    "title": "Mughal-e-Azam",
    "year": 1960,
    "genres": [
      "Romance"
    ],
    "origin_language": "Hindi",
    "popularity": 50,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 313,
    "title": "Harakiri",
    "year": 1962,
    "genres": [
      "Drama"
    ],
    "origin_language": "Japanese",
    "popularity": 50,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 314,
    "title": "8½",
    "year": 1963,
    "genres": [
      "Drama"
    ],
    "origin_language": "Italian",
    "popularity": 66,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 315,
    "title": "High and Low",
    "year": 1963,
    "genres": [
      "Crime"
    ],
    "origin_language": "Japanese",
    "popularity": 52,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 316,
    "title": "Charulata",
    "year": 1964,
    "genres": [
      "Drama"
    ],
    "origin_language": "Bengali",
    "popularity": 42,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 317,
    "title": "Chemmeen",
    "year": 1965,
    "genres": [
      "Romance"
    ],
    "origin_language": "Malayalam",
    "popularity": 40,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 318,
    "title": "Guide",
    "year": 1965,
    "genres": [
      "Drama"
    ],
    "origin_language": "Hindi",
    "popularity": 44,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 319,
    "title": "Persona",
    "year": 1966,
    "genres": [
      "Drama"
    ],
    "origin_language": "Swedish",
    "popularity": 62,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 320,
    "title": "A Clockwork Orange",
    "year": 1971,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 80,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 321,
    "title": "Anand",
    "year": 1971,
    "genres": [
      "Drama"
    ],
    "origin_language": "Hindi",
    "popularity": 44,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 322,
    "title": "Swayamvaram",
    "year": 1972,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 323,
    "title": "The Conversation",
    "year": 1974,
    "genres": [
      "Thriller"
    ],
    "origin_language": "English",
    "popularity": 60,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 324,
    "title": "The Godfather Part II",
    "year": 1974,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 86,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 325,
    "title": "Deewaar",
    "year": 1975,
    "genres": [
      "Crime"
    ],
    "origin_language": "Hindi",
    "popularity": 46,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 326,
    "title": "Jaws",
    "year": 1975,
    "genres": [
      "Thriller"
    ],
    "origin_language": "English",
    "popularity": 82,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 327,
    "title": "One Flew Over the Cuckoo's Nest",
    "year": 1975,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 80,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 328,
    "title": "Sholay",
    "year": 1975,
    "genres": [
      "Action"
    ],
    "origin_language": "Hindi",
    "popularity": 56,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 329,
    "title": "Sorcerer",
    "year": 1977,
    "genres": [
      "Thriller"
    ],
    "origin_language": "English",
    "popularity": 44,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 330,
    "title": "The Empire Strikes Back",
    "year": 1980,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 86,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 331,
    "title": "Elippathayam",
    "year": 1981,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 332,
    "title": "Raiders of the Lost Ark",
    "year": 1981,
    "genres": [
      "Adventure"
    ],
    "origin_language": "English",
    "popularity": 82,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 333,
    "title": "Thief",
    "year": 1981,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 44,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 334,
    "title": "The King of Comedy",
    "year": 1982,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 56,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 335,
    "title": "Yavanika",
    "year": 1982,
    "genres": [
      "Mystery"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 336,
    "title": "Jaane Bhi Do Yaaro",
    "year": 1983,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Hindi",
    "popularity": 40,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 337,
    "title": "The Breakfast Club",
    "year": 1985,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 74,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 338,
    "title": "Namukku Parkkan Munthirithoppukal",
    "year": 1986,
    "genres": [
      "Romance"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 339,
    "title": "Nadodikkattu",
    "year": 1987,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Malayalam",
    "popularity": 37,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 340,
    "title": "Nayakan",
    "year": 1987,
    "genres": [
      "Crime"
    ],
    "origin_language": "Tamil",
    "popularity": 46,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 341,
    "title": "Thoovanathumbikal",
    "year": 1987,
    "genres": [
      "Romance"
    ],
    "origin_language": "Malayalam",
    "popularity": 38,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 342,
    "title": "Wings of Desire",
    "year": 1987,
    "genres": [
      "Fantasy"
    ],
    "origin_language": "German",
    "popularity": 60,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 343,
    "title": "Chithram",
    "year": 1988,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 344,
    "title": "Kireedam",
    "year": 1989,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 38,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 345,
    "title": "Mathilukal",
    "year": 1990,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 346,
    "title": "Perumthachan",
    "year": 1990,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 347,
    "title": "A Brighter Summer Day",
    "year": 1991,
    "genres": [
      "Drama"
    ],
    "origin_language": "Mandarin",
    "popularity": 48,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 348,
    "title": "Bharatham",
    "year": 1991,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 349,
    "title": "Kilukkam",
    "year": 1991,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Malayalam",
    "popularity": 38,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 350,
    "title": "Sandesham",
    "year": 1991,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Malayalam",
    "popularity": 37,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 351,
    "title": "Aakashadoothu",
    "year": 1993,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 352,
    "title": "Devasuram",
    "year": 1993,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 37,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 353,
    "title": "Manichitrathazhu",
    "year": 1993,
    "genres": [
      "Horror"
    ],
    "origin_language": "Malayalam",
    "popularity": 42,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 354,
    "title": "Schindler's List",
    "year": 1993,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 86,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 355,
    "title": "The Piano",
    "year": 1993,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 64,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 356,
    "title": "Forrest Gump",
    "year": 1994,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 86,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 357,
    "title": "Spadikam",
    "year": 1995,
    "genres": [
      "Action"
    ],
    "origin_language": "Malayalam",
    "popularity": 38,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 358,
    "title": "Guru",
    "year": 1997,
    "genres": [
      "Fantasy"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 359,
    "title": "Titanic",
    "year": 1997,
    "genres": [
      "Romance"
    ],
    "origin_language": "English",
    "popularity": 88,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 360,
    "title": "The Truman Show",
    "year": 1998,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 80,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 361,
    "title": "Eyes Wide Shut",
    "year": 1999,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 70,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 362,
    "title": "Fight Club",
    "year": 1999,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 86,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 363,
    "title": "The Green Mile",
    "year": 1999,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 78,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 364,
    "title": "The Straight Story",
    "year": 1999,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 52,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 365,
    "title": "Vanaprastham",
    "year": 1999,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 37,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 366,
    "title": "Gladiator",
    "year": 2000,
    "genres": [
      "Action"
    ],
    "origin_language": "English",
    "popularity": 84,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 367,
    "title": "Yi Yi",
    "year": 2000,
    "genres": [
      "Drama"
    ],
    "origin_language": "Mandarin",
    "popularity": 54,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 368,
    "title": "Dil Chahta Hai",
    "year": 2001,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Hindi",
    "popularity": 50,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 369,
    "title": "Donnie Darko",
    "year": 2001,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 72,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 370,
    "title": "The Lord of the Rings: The Two Towers",
    "year": 2002,
    "genres": [
      "Fantasy"
    ],
    "origin_language": "English",
    "popularity": 86,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 371,
    "title": "Love Actually",
    "year": 2003,
    "genres": [
      "Romance"
    ],
    "origin_language": "English",
    "popularity": 74,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 372,
    "title": "The Lord of the Rings: The Return of the King",
    "year": 2003,
    "genres": [
      "Fantasy"
    ],
    "origin_language": "English",
    "popularity": 88,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 373,
    "title": "Crash",
    "year": 2004,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 64,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 374,
    "title": "Kiss Kiss Bang Bang",
    "year": 2005,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 52,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 375,
    "title": "Southland Tales",
    "year": 2006,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 42,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 376,
    "title": "The Fall",
    "year": 2006,
    "genres": [
      "Fantasy"
    ],
    "origin_language": "English",
    "popularity": 46,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 377,
    "title": "The Fountain",
    "year": 2006,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 56,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 378,
    "title": "The Prestige",
    "year": 2006,
    "genres": [
      "Thriller"
    ],
    "origin_language": "English",
    "popularity": 80,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 379,
    "title": "The Assassination of Jesse James by the Coward Robert Ford",
    "year": 2007,
    "genres": [
      "Western"
    ],
    "origin_language": "English",
    "popularity": 58,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 380,
    "title": "The Man from Earth",
    "year": 2007,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 44,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 381,
    "title": "Avatar",
    "year": 2009,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 88,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 382,
    "title": "Fantastic Mr. Fox",
    "year": 2009,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 66,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 383,
    "title": "The Blind Side",
    "year": 2009,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 64,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 384,
    "title": "The Secret of Kells",
    "year": 2009,
    "genres": [
      "Animation"
    ],
    "origin_language": "English",
    "popularity": 46,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 385,
    "title": "Inception",
    "year": 2010,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 88,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 386,
    "title": "The Social Network",
    "year": 2010,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 78,
    "in_deck": true,
    "tags": [
      "canon"
    ]
  },
  {
    "id": 387,
    "title": "The Tree of Life",
    "year": 2011,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 64,
    "in_deck": true,
    "tags": [
      "canon",
      "divisive"
    ]
  },
  {
    "id": 388,
    "title": "Cloud Atlas",
    "year": 2012,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 66,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 389,
    "title": "Django Unchained",
    "year": 2012,
    "genres": [
      "Western"
    ],
    "origin_language": "English",
    "popularity": 82,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 390,
    "title": "Spring Breakers",
    "year": 2012,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 56,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 391,
    "title": "The Avengers",
    "year": 2012,
    "genres": [
      "Action"
    ],
    "origin_language": "English",
    "popularity": 86,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 392,
    "title": "The Hunt",
    "year": 2012,
    "genres": [
      "Drama"
    ],
    "origin_language": "Danish",
    "popularity": 56,
    "in_deck": true,
    "tags": [
      "world"
    ]
  },
  {
    "id": 393,
    "title": "Ustad Hotel",
    "year": 2012,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 38,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 394,
    "title": "Coherence",
    "year": 2013,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 42,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 395,
    "title": "Fandry",
    "year": 2013,
    "genres": [
      "Drama"
    ],
    "origin_language": "Marathi",
    "popularity": 38,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 396,
    "title": "Only God Forgives",
    "year": 2013,
    "genres": [
      "Thriller"
    ],
    "origin_language": "English",
    "popularity": 50,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 397,
    "title": "The Wolf of Wall Street",
    "year": 2013,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 84,
    "in_deck": true,
    "tags": [
      "crowd"
    ]
  },
  {
    "id": 398,
    "title": "The Lobster",
    "year": 2015,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 62,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 399,
    "title": "The Revenant",
    "year": 2015,
    "genres": [
      "Adventure"
    ],
    "origin_language": "English",
    "popularity": 80,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 400,
    "title": "Aruvi",
    "year": 2016,
    "genres": [
      "Drama"
    ],
    "origin_language": "Tamil",
    "popularity": 38,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 401,
    "title": "Maheshinte Prathikaaram",
    "year": 2016,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Malayalam",
    "popularity": 38,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 402,
    "title": "Paterson",
    "year": 2016,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 50,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 403,
    "title": "The Neon Demon",
    "year": 2016,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 54,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 404,
    "title": "The Nice Guys",
    "year": 2016,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 62,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 405,
    "title": "A Ghost Story",
    "year": 2017,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 52,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 406,
    "title": "Angamaly Diaries",
    "year": 2017,
    "genres": [
      "Crime"
    ],
    "origin_language": "Malayalam",
    "popularity": 38,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 407,
    "title": "Baahubali 2: The Conclusion",
    "year": 2017,
    "genres": [
      "Action"
    ],
    "origin_language": "Telugu",
    "popularity": 60,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 408,
    "title": "mother!",
    "year": 2017,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 62,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 409,
    "title": "The Greatest Showman",
    "year": 2017,
    "genres": [
      "Musical"
    ],
    "origin_language": "English",
    "popularity": 70,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 410,
    "title": "The Rider",
    "year": 2017,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 42,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 411,
    "title": "Thondimuthalum Driksakshiyum",
    "year": 2017,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 412,
    "title": "Bohemian Rhapsody",
    "year": 2018,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 78,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 413,
    "title": "Ee.Ma.Yau.",
    "year": 2018,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 414,
    "title": "Green Book",
    "year": 2018,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 74,
    "in_deck": true,
    "tags": [
      "debated"
    ]
  },
  {
    "id": 415,
    "title": "Sudani from Nigeria",
    "year": 2018,
    "genres": [
      "Comedy"
    ],
    "origin_language": "Malayalam",
    "popularity": 37,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 416,
    "title": "Jallikattu",
    "year": 2019,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Malayalam",
    "popularity": 40,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 417,
    "title": "Joker",
    "year": 2019,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 86,
    "in_deck": true,
    "tags": [
      "divisive",
      "debated"
    ]
  },
  {
    "id": 418,
    "title": "Midsommar",
    "year": 2019,
    "genres": [
      "Horror"
    ],
    "origin_language": "English",
    "popularity": 70,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 419,
    "title": "The Irishman",
    "year": 2019,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 72,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 420,
    "title": "The Vast of Night",
    "year": 2019,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 42,
    "in_deck": true,
    "tags": [
      "underseen"
    ]
  },
  {
    "id": 421,
    "title": "Tenet",
    "year": 2020,
    "genres": [
      "Sci-Fi"
    ],
    "origin_language": "English",
    "popularity": 78,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 422,
    "title": "Jai Bhim",
    "year": 2021,
    "genres": [
      "Drama"
    ],
    "origin_language": "Tamil",
    "popularity": 46,
    "in_deck": true,
    "tags": [
      "indian"
    ]
  },
  {
    "id": 423,
    "title": "Joji",
    "year": 2021,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 38,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 424,
    "title": "Minnal Murali",
    "year": 2021,
    "genres": [
      "Action"
    ],
    "origin_language": "Malayalam",
    "popularity": 42,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 425,
    "title": "The Great Indian Kitchen",
    "year": 2021,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 40,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 426,
    "title": "Babylon",
    "year": 2022,
    "genres": [
      "Drama"
    ],
    "origin_language": "English",
    "popularity": 64,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 427,
    "title": "Nanpakal Nerathu Mayakkam",
    "year": 2022,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 428,
    "title": "The Banshees of Inisherin",
    "year": 2022,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 70,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 429,
    "title": "The Batman",
    "year": 2022,
    "genres": [
      "Crime"
    ],
    "origin_language": "English",
    "popularity": 80,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 430,
    "title": "2018",
    "year": 2023,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Malayalam",
    "popularity": 40,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 431,
    "title": "Aattam",
    "year": 2023,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 432,
    "title": "Beau Is Afraid",
    "year": 2023,
    "genres": [
      "Comedy"
    ],
    "origin_language": "English",
    "popularity": 52,
    "in_deck": true,
    "tags": [
      "divisive"
    ]
  },
  {
    "id": 433,
    "title": "Bramayugam",
    "year": 2024,
    "genres": [
      "Horror"
    ],
    "origin_language": "Malayalam",
    "popularity": 40,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 434,
    "title": "Manjummel Boys",
    "year": 2024,
    "genres": [
      "Thriller"
    ],
    "origin_language": "Malayalam",
    "popularity": 42,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 435,
    "title": "Premalu",
    "year": 2024,
    "genres": [
      "Romance"
    ],
    "origin_language": "Malayalam",
    "popularity": 40,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  },
  {
    "id": 436,
    "title": "Ullozhukku",
    "year": 2024,
    "genres": [
      "Drama"
    ],
    "origin_language": "Malayalam",
    "popularity": 36,
    "in_deck": true,
    "tags": [
      "malayalam",
      "indian"
    ]
  }
]

// Indian films get the "indian" collection plus their language's collection, so Explore can filter by language.
const LANGUAGE_COLLECTIONS = { Malayalam: 'malayalam', Tamil: 'tamil', Telugu: 'telugu', Hindi: 'hindi', Bengali: 'bengali', Kannada: 'kannada', Marathi: 'marathi' }

function withLanguageTags(film) {
  if (!INDIAN_LANGUAGES.has(film.origin_language)) return film
  const tags = new Set(film.tags || [])
  tags.add('indian')
  if (LANGUAGE_COLLECTIONS[film.origin_language]) tags.add(LANGUAGE_COLLECTIONS[film.origin_language])
  return { ...film, tags: [...tags] }
}

const indianAdditions = INDIAN_FILMS.map(([title, year, language, genre, popularity, extraTags], index) => ({
  id: FIRST_ID + index,
  title,
  year,
  genres: [genre],
  origin_language: language,
  popularity,
  in_deck: true,
  tags: extraTags ? extraTags.split(' ') : []
}))

export const movieCatalog = [...baseCatalog, ...indianAdditions].map(withLanguageTags)
