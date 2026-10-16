# В Переславле

Агрегатор афиши Переславля-Залесского. План — [PLAN.md](PLAN.md).

```bash
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm db:migrate     # first run: creates init migration
pnpm db:seed
pnpm dev            # api :3001, web :3000, admin :5173
```

## Сборка

Всё сразу (workspace-пакеты, api, web, admin):

```bash
pnpm install
pnpm db:generate    # Prisma client — нужен до сборки
pnpm build          # turbo: db → shared/llm/crawlers → api, web, admin
pnpm typecheck
pnpm test
```

## Docker: сборка и запуск

Профиль `prod` поднимает `postgres`, `api`, `web` и `caddy`. Админка (статика) запекается в образ `caddy`, поэтому **любое изменение кода требует пересборки образов** — `up -d` без `--build` запустит старые.

### Первый запуск

```bash
cp .env.example .env
```

В `.env` задайте:

| Переменная | Что это |
|---|---|
| `DOMAIN` | домен для Caddy (авто-HTTPS). Локально — `localhost` |
| `JWT_SECRET` | секрет для токенов админки (в production `change-me` не принимается) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | логин и пароль админки |

Дальше:

```bash
# 1. собрать образы api, web, caddy (с админкой)
docker compose --profile prod build

# 2. поднять базу и применить миграции
docker compose --profile prod up -d postgres
docker compose --profile prod run --rm api prisma migrate deploy --schema prisma/schema.prisma

# 3. залить площадки и источники (с хоста, нужен pnpm install)
pnpm install
set -a; source .env; set +a      # DATABASE_URL собирается из POSTGRES_* в .env
pnpm db:seed

# 4. запустить всё
docker compose --profile prod up -d
```

Адреса (при `DOMAIN=localhost` браузер попросит принять сертификат Caddy):

- сайт — `https://$DOMAIN/`
- админка — `https://admin.$DOMAIN/` (при `localhost` — `https://admin.localhost/`)
- API — `https://api.$DOMAIN/`

События появятся после первого краулинга: планировщик запускает источники по их cron (каждые 3 часа), либо нажмите «Запустить сейчас» в админке, в разделе «Источники».

### Обновление после изменений в коде

```bash
docker compose --profile prod up -d --build              # пересобрать изменившееся и перезапустить
docker compose --profile prod up -d --build web          # или один сервис (admin пересобирается вместе с caddy)
docker compose --profile prod run --rm api prisma migrate deploy --schema prisma/schema.prisma   # если есть новые миграции
```

### Полезные команды

```bash
docker compose --profile prod ps
docker compose --profile prod logs -f api
docker compose --profile prod down            # остановить (данные в volume pgdata сохраняются)
```

Порт `api` наружу не публикуется — проверка изнутри сети:

```bash
docker compose --profile prod exec api node -e "fetch('http://localhost:3001/health').then(r=>r.text()).then(console.log)"
```

> Сид только добавляет отсутствующие записи и не меняет существующие. Если адаптер или состояние источника изменились в сиде, поправьте их в админке.
