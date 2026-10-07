import type { ImageMetadata } from 'astro';
import layout from '../data/thumbwall.json';

export interface Thumb {
  id: string;
  src: ImageMetadata;
}

// Все превью из папки thumbnails/ в корне репозитория. Номер берётся из имени файла: thumb-07.jpg -> "07".
const files = import.meta.glob<{ default: ImageMetadata }>('/thumbnails/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
});

const idOf = (file: string) => {
  const name = file.split('/').pop()!.replace(/\.[^.]+$/, '');
  return name.match(/(\d+)/)?.[1]?.padStart(2, '0') ?? name;
};

export const allThumbs: Thumb[] = Object.entries(files)
  .map(([file, mod]) => ({ id: idOf(file), src: mod.default }))
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

/** Превью, разложенные по 3 рядам: сначала по раскладке из thumbwall.json, остальные — в конец рядов по кругу. */
export function thumbRows(): Thumb[][] {
  const byId = new Map(allThumbs.map((t) => [t.id, t]));
  const used = new Set<string>();
  const rows: Thumb[][] = layout.rows.map((ids) =>
    ids.flatMap((id) => {
      const t = byId.get(id);
      if (!t || used.has(id)) return [];
      used.add(id);
      return [t];
    }),
  );
  allThumbs
    .filter((t) => !used.has(t.id))
    .forEach((t, i) => rows[i % rows.length].push(t));
  return rows;
}
