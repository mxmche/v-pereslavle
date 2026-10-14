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
