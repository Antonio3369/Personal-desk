FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=6789
ENV HOSTNAME=0.0.0.0
# Build-time placeholder; runtime uses /app/data via compose env
ENV DATABASE_URL="file:/app/data/dev.db"

RUN mkdir -p /app/data /app/public/uploads/todos /app/public/uploads/notes \
  && npx prisma generate \
  && npx prisma migrate deploy \
  && npm run build

EXPOSE 6789

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
