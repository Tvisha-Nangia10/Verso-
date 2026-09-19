/**
 * The piece-identity taxonomy from the original TH-INK prototype,
 * extracted verbatim from its markup.
 */

export type MetaGroup = 'genre' | 'form' | 'theme' | 'tone';

export type MetaSection = { label: string; items: string[] };

export const META_TAXONOMY: Record<MetaGroup, MetaSection[]> = {
  "genre": [
    {
      "label": "📖 Fiction",
      "items": [
        "Literary Fiction",
        "Historical Fiction",
        "Sci-Fi",
        "Fantasy",
        "Mystery",
        "Thriller",
        "Horror",
        "Romance",
        "Adventure",
        "Drama",
        "Crime Fiction",
        "Magical Realism",
        "Dystopian",
        "Paranormal",
        "Satire",
        "Coming-of-Age",
        "YA",
        "Flash Fiction",
        "Speculative Fiction",
        "Urban Fiction",
        "Fan Fiction"
      ]
    },
    {
      "label": "📚 Non-Fiction",
      "items": [
        "Memoir",
        "Biography",
        "Autobiography",
        "True Crime",
        "Journalism",
        "History",
        "Travel Writing",
        "Science Writing",
        "Philosophy",
        "Psychology",
        "Self-Help",
        "Spirituality",
        "Political Writing",
        "Cultural Criticism",
        "Health & Wellness",
        "Environmental Writing",
        "Business & Economics",
        "Technology & Innovation",
        "Parenting & Family",
        "Personal Narrative",
        "Academic"
      ]
    }
  ],
  "form": [
    {
      "label": "",
      "items": [
        "Short Story",
        "Novel Excerpt",
        "Novella",
        "Essay",
        "Personal Essay",
        "Lyric Essay",
        "Flash Fiction",
        "Haiku",
        "Sonnet",
        "Free Verse",
        "Prose Poetry",
        "Villanelle",
        "Journal Entry",
        "Letter",
        "Vignette",
        "Monologue",
        "Script / Screenplay",
        "Interview",
        "How-To Guide",
        "Research Paper",
        "Review / Critique",
        "Travelogue"
      ]
    }
  ],
  "theme": [
    {
      "label": "",
      "items": [
        "Grief",
        "Identity",
        "Memory",
        "Nature",
        "Love",
        "Loss",
        "Family",
        "Power & Control",
        "Justice",
        "Coming of Age",
        "Survival",
        "Solitude",
        "Betrayal",
        "Redemption",
        "Faith & Doubt",
        "Technology & Humanity",
        "Class & Privilege",
        "Race & Culture",
        "War",
        "Time & Aging",
        "Ambition",
        "Freedom",
        "Mental Health",
        "Belonging",
        "Climate & Environment"
      ]
    }
  ],
  "tone": [
    {
      "label": "",
      "items": [
        "Dark",
        "Humorous",
        "Romantic",
        "Melancholic",
        "Hopeful",
        "Tense",
        "Lyrical",
        "Satirical",
        "Reflective",
        "Unsettling",
        "Playful",
        "Raw & Honest",
        "Philosophical",
        "Nostalgic",
        "Urgent",
        "Calm & Measured",
        "Angry",
        "Ethereal",
        "Ironic",
        "Intimate"
      ]
    }
  ]
};

export const META_LABELS: Record<MetaGroup, string> = {
  genre: 'Genre',
  form: 'Form',
  theme: 'Theme',
  tone: 'Tone',
};

export const META_COLORS: Record<MetaGroup, string> = {
  genre: 'var(--amber)',
  form: 'var(--sage)',
  theme: 'var(--sky)',
  tone: 'var(--lavender)',
};
