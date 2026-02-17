export interface Project {
  slug: string;
  title: string;
  tagline: string;
  cardDescription: string;
  cardStack: string[];
  date: string;
  role: string;
  repoUrl: string;
  stack: string[];
  image?: string;
  thumbnail?: string;
}

export const projects: Project[] = [
  {
    slug: 'Hurricaine',
    title: 'HurricAIne',
    tagline: 'Deep learning system that predicts hurricane position 6 hours ahead using atmospheric reanalysis and a custom CNN—from data acquisition to deployable inference.',
    cardDescription: 'Deep learning system for predicting 6-hour hurricane displacement vectors using gridded ERA5 atmospheric reanalysis data and CNN-based regression.',
    date: '2024',
    role: 'ML Engineer & Data Pipeline Architect',
    repoUrl: 'https://github.com/crowmoed/HurricAIne---Python',
    stack: ['Python', 'TensorFlow/Keras', 'xarray', 'ERA5 API', 'Plotly', 'XGBoost'],
    image: '/hurricAIne-poster.png',
    thumbnail: '/hurricAIne-poster.png',
    cardStack: ['Python', 'TensorFlow', 'CNN', 'ERA5'],
  },
  {
    slug: 'MythMetal',
    title: 'Myth & Metal',
    tagline: 'A Minecraft mod that adds tiered loot, procedural dungeons, and custom boss fights—with way too much rendering code.',
    cardDescription: 'Minecraft Forge mod featuring procedural dungeon generation, custom boss fights, tiered item rarity system with custom glint rendering.',
    date: '2024',
    role: 'Mod Developer & Systems Architect',
    repoUrl: 'https://github.com/crowmoed/Myth-Metal---Java',
    stack: ['Java', 'Minecraft Forge', 'Mixins', 'Terrablender', 'OpenGL/RenderTypes'],
    image: '/myth_and_metal.gif',
    thumbnail: '/myth_and_metal.gif',
    cardStack: ['Java', 'Minecraft Forge', 'Mixins'],
  },
  {
    slug: 'Pilly',
    title: 'Pilly',
    tagline: 'A 2D game engine from scratch—SDL3, raw pointers, and all the footguns that come with them.',
    cardDescription: 'Hardware-accelerated 2D game engine built on SDL3 with Euler-integrated physics, AABB collision detection, and sprite-based rendering pipeline.',
    date: '2024',
    role: 'Engine Developer',
    repoUrl: 'https://github.com/crowmoed/Pilly---C',
    stack: ['C++', 'SDL3', 'STB Image', 'CMake', 'OpenGL/Metal/D3D (via SDL3)'],
    image: undefined,
    thumbnail: undefined,
    cardStack: ['C++', 'SDL3', 'CMake'],
  },
  {
    slug: 'WebScraper',
    title: 'Web Scraper',
    tagline: 'Fanfiction discovery tool with keyword filtering and local LLM classification.',
    cardDescription: 'Dual-target fanfiction scraping system with two-stage content filtering: keyword matching followed by local LLM classification via Ollama.',
    date: '2024',
    role: 'Developer',
    repoUrl: 'https://github.com/crowmoed/Webscraper---Python',
    stack: ['Python', 'SeleniumBase', 'Ollama', 'Google Sheets API', 'gspread'],
    image: '/data-scraper.png',
    thumbnail: '/data-scraper.png',
    cardStack: ['Python', 'SeleniumBase', 'Ollama'],
  },
  {
    slug: 'CalendarApp',
    title: 'Calendar Notes',
    tagline: 'A simple calendar with per-day notes—no database, just text files.',
    cardDescription: 'Month-view calendar application with per-day note-taking functionality, flat-file persistence, and grid-based navigation.',
    date: '2024',
    role: 'Developer',
    repoUrl: 'https://github.com/crowmoed/Calendar-Notes-App---Python',
    stack: ['Python', 'CustomTkinter', 'datetime', 'File I/O'],
    image: '/calendar-app.png',
    thumbnail: '/calendar-app.png',
    cardStack: ['Python', 'CustomTkinter', 'File I/O'],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
