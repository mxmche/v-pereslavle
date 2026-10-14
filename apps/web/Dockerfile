FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile && pnpm turbo run build --filter=@vp/web...

FROM node:22-alpine
WORKDIR /app
COPY --from=build /repo/apps/web/.next/standalone .
COPY --from=build /repo/apps/web/.next/static apps/web/.next/static
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
