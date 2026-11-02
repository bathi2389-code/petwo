FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package.json and workspace definitions
COPY package.json ./
COPY shared ./shared
COPY backend ./backend

# Install dependencies and build shared + backend
RUN npm install
RUN npm run build --workspace=@petwo/shared
RUN npm run build --workspace=@petwo/backend

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json

EXPOSE 4000
CMD ["node", "backend/dist/server.js"]
