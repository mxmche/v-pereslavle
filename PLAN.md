# В Переславле — план разработки

SaaS-агрегатор предстоящих событий Переславля-Залесского и района. События парсятся с сайтов и соцсетей; список источников управляется в админке; парсинг — каждые 3 часа.

**Стек:** TypeScript, NestJS (API), Next.js (публичная часть), React + Vite (админка), Prisma, PostgreSQL 16 + pgvector, pnpm + Turborepo, Docker Compose, Caddy, Timeweb VPS, GigaChat.

## Структура монорепо

```
apps/
  api/        NestJS: REST, планировщик, краулеры, LLM-пайплайн
  web/        Next.js (App Router, ISR): публичная афиша, SEO
  admin/      React + Vite: источники, модерация, события, площадки
packages/
  db/         Prisma-схема, клиент, миграции, сиды
  shared/     zod-схемы, DTO, типы (общие для api/web/admin)
  llm/        LlmProvider + GigaChatProvider, промпты
  crawlers/   адаптеры: html-*, vk, telegram, rss
infra/        docker-compose, Caddyfile, скрипты бэкапа
```

## Фаза 0 — каркас и инфраструктура (2–3 дня)
- [ ] Timeweb VPS 2 vCPU / 4 ГБ / 50 ГБ NVMe, Ubuntu 24.04; домен, A-записи `@`, `api.`, `admin.`
- [x] Docker Compose: `pgvector/pgvector:pg16`, `api`, `web`, `admin` (статика через Caddy), `caddy` (авто-HTTPS)
- [x] CI (GitHub Actions): lint/typecheck/test → build образов в GHCR → SSH → `docker compose pull` → `prisma migrate deploy` → `up -d`
- [ ] Секреты в `.env` на VPS: `DATABASE_URL`, `GIGACHAT_CREDENTIALS`, `VK_SERVICE_TOKEN`, `TG_SESSION`, `ADMIN_*`, `JWT_SECRET`
- [ ] GigaChat: регистрация, freemium-ключ, scope `GIGACHAT_API_PERS`

**Контрольная точка:** push в `main` → API за HTTPS отвечает `/health`, миграции применены.

## Фаза 1 — данные и краулеры (1 неделя)
- [x] Prisma-схема: `Source`, `CrawlRun`, `RawPost`, `Event`, `EventSource`, `Location`, `Organizer`, `ModerationItem`, `User`, `Subscription` (`tier`, `expiresAt`), `LlmCache`
- [x] `Source`: `type` (HTML/RSS/VK/TELEGRAM/MANUAL), `adapter`, `config` (Json), `enabled`, `priority`, `scheduleCron` (по умолчанию `0 */3 * * *`), `lastRunAt/Status/Error`
- [x] Сид `Source` из реестра ниже (включены MVP: №1, 2, 4, 15)
- [ ] Сид `Location`: 100–150 точек с гео и алиасами
- [x] Интерфейс `CrawlerAdapter { fetch(source): Promise<RawItem[]> }` + реестр по ключу `adapter`
- [ ] HTML-адаптеры (ofetch + cheerio): ~~tourismpereslavl.ru~~ ✅ (календарь `/kalendar-turisticheskikh-sobytiy/`), museumpereslavl.ru (список + detail), admpereslavl.ru — пишут **сразу в `Event`**
- [ ] VK-адаптер (`vk-io`, `wall.get`): anons_pz, oskar.amigopz → `RawPost`
- [ ] Планировщик: `@nestjs/schedule` тикает каждые 5 мин, выбирает источники с наступившим `scheduleCron` ✅; очередь pg-boss (без Redis), concurrency 2–3, ретраи с backoff — пока in-process `CrawlQueue` (concurrency 2, дедуп по источнику), без ретраев и pg-boss
- [x] Идемпотентность: upsert по `(sourceId, externalId)` (`IngestService`); «Запустить сейчас» ставит ту же задачу

**Контрольная точка:** события сайтов появляются каждые 3 ч; посты ВК копятся; `CrawlRun` логирует запуски.

## Фаза 2 — LLM-пайплайн, только GigaChat (1 неделя)
- [x] `GigaChatProvider`: OAuth с кэшем токена (refresh за 60 с до истечения), function calling, temperature 0.1, семафор на 1 поток (freemium). Интерфейс `LlmProvider` сохраняем
- [ ] Классификатор «событие/не событие» (Lite, zod); `confidence < 0.6` → `SKIPPED`
- [ ] Экстрактор → zod `EventExtraction` (даты относительно `publishedAt`, location-текст, цена, категория, confidence); 1 ретрай с ошибкой zod → `ModerationItem`; `confidence < 0.8` → модерация
- [ ] Кэш по `sha256(normalizedText)` в `LlmCache`
- [ ] Матчинг площадки: `pg_trgm` по `Location.name/aliases`; не найдено → модерация
- [ ] Дедуп: эмбеддинг → `Unsupported("vector(1024)")` → `$queryRaw` по кандидатам ±1 день, `embedding <=> $vec < 0.08` → мердж (добавить `EventSource`, дозаполнить поля). Применяется и к HTML-событиям

**Контрольная точка:** пост ВК → карточка <5 мин после краулинга; автопубликация ≥70%.

## Фаза 3 — админка (1 неделя, параллельно с фазой 2)
- [ ] Auth: JWT, роли admin/moderator
- [ ] Источники: CRUD, вкл/выкл, расписание, JSON-конфиг, «Запустить сейчас», dry-run, история `CrawlRun`
- [ ] Модерация: очередь, исходный текст рядом с полями, правка, опубликовать/отклонить/слить
- [ ] События, площадки, организаторы: списки, фильтры, редактирование
- [ ] Дашборд: здоровье источников, события/день, % автопубликации, расход токенов

## Фаза 4 — публичный сайт Next.js (1 неделя)
- [ ] `/` ближайшие; фильтры по дате (сегодня/выходные/диапазон), категории, площадке
- [ ] `/events/[slug]`, `/locations/[slug]`; ссылка на первоисточник
- [ ] ISR + `revalidateTag` при публикации; JSON-LD `Event`; sitemap; OG-картинки
- [ ] Карта площадок (Яндекс.Карты), ICS «добавить в календарь»
- [ ] Автоархивация прошедших событий

## Фаза 5 — запуск и эксплуатация
- [ ] Бэкапы: ночной `pg_dump` → S3 Timeweb, ротация 14 дней, ежемесячная проверка восстановления
- [ ] Мониторинг: uptime-пинг, алерт в Telegram при 3 падениях источника подряд или 0 событий за 24 ч; логи pino
- [ ] Подключение остальных источников (№3, 5–14), Telegram №17 через GramJS; Instagram отложен
- [ ] Вежливый краулинг: robots.txt, User-Agent, ≤1 rps на домен

## Реестр источников

| # | Источник | URL | Метод | MVP |
|---|---|---|---|---|
| 1 | Туристический Переславль | https://tourismpereslavl.ru | HTML | ✅ |
| 2 | Администрация района | https://admpereslavl.ru | RSS/HTML | ✅ |
| 3 | Культура Ярославской области | https://culture76.ru | HTML | |
| 4 | Переславский музей-заповедник | https://museumpereslavl.ru | HTML | ✅ |
| 5 | Кинотеатр «Оскар» | https://kino-oskar.ru | HTML | |
| 6 | Отель «Оскар» | https://hoteloskar.ru/events | HTML | |
| 7 | Феодоровский монастырь | https://feodor-monastyr.ru | HTML | |
| 8 | Паломническая служба | https://feosobor.ru | HTML | |
| 9 | Pereslove | https://pereslove.ru | HTML | |
| 10 | ТутЛю | https://tutly.ru | HTML | |
| 11 | Qtickets | https://qtickets.ru | HTML/API | |
| 12 | Яр-ШОУ | https://yar-show.ru | HTML | |
| 13 | Артефакт | https://ar.culture.ru | HTML | |
| 14 | RussiaDiscovery | https://russiadiscovery.ru | HTML | |
| 15 | ВК «Анонсы мероприятий в ПЗ» | https://vk.ru/anons_pz | VK API | ✅ |
| 16 | ВК кинотеатра «Оскар» | https://vk.ru/oskar.amigopz | VK API | |
| 17 | TG «Полёты в Переславле» | https://t.me/fly_pereslavl | GramJS | |
| 18 | Instagram ТИЦ | https://www.instagram.com/tourismpereslavl/ | вручную | отложен |

## LLM: бюджет
~150 классификаций + ~40 экстракций/день ≈ 106 тыс. токенов/день → GigaChat Lite ≈ 210 ₽/мес (sync), эмбеддинги ≈ 30 ₽/мес. Первый год — freemium (0 ₽). Резервный провайдер YandexGPT Lite — за интерфейсом `LlmProvider`, не реализуем в MVP.

## Риски
- Смена вёрстки → dry-run, алерт на «0 найдено», snapshot-тесты адаптеров на сохранённом HTML
- Квоты GigaChat → кэш, дешёвый классификатор, семафор, переход на pay-as-you-go (мин. 600 ₽/мес)
- Ложный дедуп → калибровка порога на реальных данных; пограничные пары — в модерацию

**Срок:** ~5–6 недель до публичного запуска (1 разработчик).
