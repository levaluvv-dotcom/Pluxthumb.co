// Собирает данные клиентов для блока WORKED WITH со страниц их YouTube-каналов:
// название, аватар и число подписчиков. Запуск: npm run clients
// Список каналов — scripts/clients.txt (по одной ссылке на строку).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const avatarsDir = path.join(root, 'src/assets/clients');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

// "1.06M" -> 1060000, чтобы сортировать по убыванию
const toNumber = (s) => {
  const m = /^([\d.,]+)\s*([KMB])?$/i.exec(s.trim());
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return n * ({ K: 1e3, M: 1e6, B: 1e9 }[(m[2] || '').toUpperCase()] || 1);
};

const urls = (await readFile(path.join(root, 'scripts/clients.txt'), 'utf8'))
  .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

await mkdir(avatarsDir, { recursive: true });
const clients = [];

for (const raw of urls) {
  const handle = /youtube\.com\/(@[^/?#]+)/.exec(raw)?.[1];
  if (!handle) { console.warn(`skip: ${raw}`); continue; }
  const url = `https://www.youtube.com/${handle}`;
  const html = await (await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en-US,en' } })).text();

  const name = decode(/<meta property="og:title" content="([^"]+)"/.exec(html)?.[1] ?? handle);
  const image = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];
  // Подписчики берутся из шапки канала (metadataParts), а не из блока рекомендованных каналов
  const subscribers = /"metadataParts":\[\{"text":\{"content":"([\d.,]+[KMB]?) subscribers?"/.exec(html)?.[1];
  if (!image || !subscribers) { console.warn(`no data: ${handle}`); continue; }

  const slug = handle.slice(1).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const avatarUrl = image.replace(/=s\d+-/, '=s240-');
  const buf = Buffer.from(await (await fetch(avatarUrl, { headers: { 'user-agent': UA } })).arrayBuffer());
  await writeFile(path.join(avatarsDir, `${slug}.jpg`), buf);

  clients.push({ name, subscribers, avatar: `${slug}.jpg`, url });
  console.log(`${name.padEnd(20)} ${subscribers}`);
}

clients.sort((a, b) => toNumber(b.subscribers) - toNumber(a.subscribers));
await writeFile(path.join(root, 'src/data/clients.json'), JSON.stringify(clients, null, 2) + '\n');
console.log(`\n${clients.length} clients -> src/data/clients.json`);
