FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
COPY frontend/package.json frontend/package.json
RUN npm install --no-audit --no-fund --legacy-peer-deps

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace @dsr/web

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/frontend/package.json ./frontend/package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/frontend/.next ./frontend/.next
COPY --from=build /app/frontend/public ./frontend/public
COPY --from=build /app/frontend/next.config.ts ./frontend/next.config.ts
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "@dsr/web"]
