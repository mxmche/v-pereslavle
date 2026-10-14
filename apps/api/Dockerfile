FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile && pnpm turbo run build --filter=@vp/api...
RUN pnpm deploy --filter=@vp/api --prod /out && cp -r apps/api/dist /out/dist && cp -r packages/db/prisma /out/prisma
# pnpm deploy reinstalls deps without the generated Prisma client; copy it over from the build tree
RUN for d in node_modules/.pnpm/@prisma+client@*/node_modules; do cp -r "$d/.prisma" "/out/$d/"; done

FROM node:22-alpine
RUN npm i -g prisma@6.19.3
WORKDIR /app
COPY --from=build /out .
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
