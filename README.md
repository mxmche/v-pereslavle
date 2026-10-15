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

## Docker-образы

Образы `api`, `web` и `caddy` (профиль `prod`):

```bash
docker compose --profile prod build              # собрать все
docker compose --profile prod build api          # или один сервис

docker compose --profile prod up -d              # postgres + api + web + caddy
docker compose --profile prod up -d api          # только api (и postgres)
docker compose --profile prod ps
docker compose --profile prod logs -f api
docker compose --profile prod down
```

Миграции применяются отдельно:

```bash
docker compose --profile prod run --rm api prisma migrate deploy --schema prisma/schema.prisma
```

Для `caddy` в `.env` должен быть задан `DOMAIN` (авто-HTTPS). Локально `api` не публикует порт наружу — проверка внутри сети:

```bash
docker compose --profile prod exec api node -e "fetch('http://localhost:3001/health').then(r=>r.text()).then(console.log)"
```
