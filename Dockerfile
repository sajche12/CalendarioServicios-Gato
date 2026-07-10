# ==============================================================================
# Dockerfile para TourFlow (Next.js con pnpm)
# ==============================================================================

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./

# --- Etapa 1: Instalación de Dependencias ---
FROM base AS deps
RUN pnpm install --frozen-lockfile

# --- Etapa 2: Compilación de la Aplicación ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Argumentos de compilación para inyectar variables NEXT_PUBLIC_* en el bundle
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

# --- Etapa 3: Entorno de Ejecución ---
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000

# Ejecutar el servidor de producción Next.js
CMD ["pnpm", "run", "start"]
