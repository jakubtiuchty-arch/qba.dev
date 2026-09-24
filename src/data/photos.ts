import type { ImageMetadata } from 'astro';
import { site } from './site';

// Zdjęcia z sesji trzymamy w src/assets/people/. Nazwę pliku wpisujesz w site.person.photo.
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/people/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

export function personPhoto(): { src: ImageMetadata; alt: string } | null {
  const name = site.person.photo;
  if (!name) return null;
  const entry = Object.entries(files).find(([path]) => path.endsWith(`/${name}`));
  if (!entry) throw new Error(`Brak zdjęcia src/assets/people/${name} (ustawione w site.person.photo).`);
  return { src: entry[1].default, alt: site.person.photoAlt };
}
