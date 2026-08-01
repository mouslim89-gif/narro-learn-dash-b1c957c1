import { Book } from './books';

export interface Collection {
  id: string;
  title: string;
  subtitle?: string;
  match: (book: Book) => boolean;
}

export const collections: Collection[] = [
  {
    id: 'start-here',
    title: 'Start Here',
    subtitle: 'Gentle introductions (N4 / N3)',
    match: (b) => b.jlptLevel === 'N4' || b.jlptLevel === 'N3'
  },
  {
    id: 'short-reads',
    title: 'Short Reads',
    subtitle: 'Under 10 minutes',
    match: (b) => b.readingTimeMin <= 10
  },
  {
    id: 'dazai-osamu',
    title: 'Dazai Osamu',
    subtitle: 'Master of modern Japanese fiction',
    match: (b) => b.author === 'Dazai Osamu'
  }
];
