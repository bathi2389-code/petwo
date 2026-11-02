FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY shared ./shared
COPY apps/provider-web ./apps/provider-web

RUN npm install
RUN npm run build --workspace=@petwo/shared
RUN npm run build --workspace=petwo-provider-web

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/apps/provider-web/.next/standalone ./
COPY --from=builder /app/apps/provider-web/.next/static ./apps/provider-web/.next/static
COPY --from=builder /app/apps/provider-web/public ./apps/provider-web/public

EXPOSE 3000
CMD ["node", "apps/provider-web/server.js"]
