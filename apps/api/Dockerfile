FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile && pnpm turbo run build --filter=@vp/api...
RUN pnpm deploy --filter=@vp/api --prod --legacy /out && cp -r apps/api/dist /out/dist && cp -r packages/db/prisma /out/prisma

FROM node:22-alpine
RUN npm i -g prisma@6.19.3
WORKDIR /app
COPY --from=build /out .
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
