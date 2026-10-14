# Caddy with the admin SPA baked in as static files
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile && pnpm turbo run build --filter=@vp/admin...

FROM caddy:2
COPY infra/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /repo/apps/admin/dist /srv/admin
