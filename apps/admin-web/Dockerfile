FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY shared ./shared
COPY apps/admin-web ./apps/admin-web

RUN npm install
RUN npm run build --workspace=@petwo/shared
RUN npm run build --workspace=petwo-admin-web

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/apps/admin-web/.next/standalone ./
COPY --from=builder /app/apps/admin-web/.next/static ./apps/admin-web/.next/static
COPY --from=builder /app/apps/admin-web/public ./apps/admin-web/public

EXPOSE 3001
CMD ["node", "apps/admin-web/server.js"]
