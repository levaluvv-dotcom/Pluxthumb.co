# Plux Design — сайт-портфолио

Сайт дизайнера превью для YouTube. Английская версия открывается на главной странице, русская на `/ru/`.

Адрес: https://pluxthumb.space/

Сайт пересобирается и публикуется сам при каждом изменении в ветке `main`, примерно за 1–2 минуты.

## Как добавить новые превью

1. Откройте папку [`thumbnails`](thumbnails) на GitHub.
2. Нажмите **Add file → Upload files** и перетащите картинки. За раз лучше загружать до 10 штук.
3. Называйте файлы с номером: `thumb-28.jpg`, `thumb-29.jpg`…
4. Нажмите **Commit changes**.

Новые превью сами добавятся в конец бегущих рядов.

- Лучший формат: JPG 1920×1080 (16:9), до 5 МБ.
- Порядок превью в рядах задан в [`src/data/thumbwall.json`](src/data/thumbwall.json).
- Картинки не переименовывайте через редактор GitHub (значок карандаша): это ломает файл. Называйте файлы правильно ещё на компьютере.

## Как добавить клиента в блок «Worked with»

1. Добавьте ссылку на YouTube-канал в [`scripts/clients.txt`](scripts/clients.txt).
2. Запустите `npm run clients`: скрипт сам скачает название, аватар и число подписчиков.

## Где лежат тексты и контакты

| Что | Файл |
| --- | --- |
| Все тексты сайта на английском | [`src/i18n/en.json`](src/i18n/en.json) |
| Все тексты сайта на русском | [`src/i18n/ru.json`](src/i18n/ru.json) |
| WhatsApp, Telegram, почта, Discord | [`src/data/contacts.json`](src/data/contacts.json) |
| Соцсети (X, Instagram, Behance…) | [`src/data/socials.json`](src/data/socials.json) |
| Клиенты | [`src/data/clients.json`](src/data/clients.json) |
| Фото на первом экране | [`src/assets/about/maxim.jpg`](src/assets/about/maxim.jpg) |

## Публикация (один раз)

1. **Settings → General → Danger Zone → Change visibility → Public.**
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**

## Свой домен (позже)

1. В `astro.config.mjs` заменить `site` на свой домен (`https://pluxthumb.co`) и удалить строку `base`.
2. Создать файл `public/CNAME` с доменом внутри.
3. У регистратора домена добавить DNS-записи GitHub Pages ([инструкция](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site)).
4. В **Settings → Pages** указать домен.

## Для разработчика

```bash
npm install
npm run dev       # локальный сервер
npm run build     # проверка типов + сборка в dist/
npm run preview   # просмотр собранного сайта
```

Стек: Astro 5, Tailwind CSS 4, Lenis (плавный скролл). Шрифты Montserrat и Inter подключены локально.
