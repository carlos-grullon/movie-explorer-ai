# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies for the API package only (not the whole monorepo)
COPY services/api/package.json services/api/package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY services/api/ ./

# Prisma client needs to be generated during build
RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only
COPY services/api/package.json services/api/package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# Prisma generate runs during build, but "npm ci" in the runner stage overwrites node_modules.
# Copy the generated Prisma client artifacts into the runtime image.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Ensure @prisma/client matches the generated artifacts from the build stage.
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 4000

CMD ["node", "dist/src/index.js"]
