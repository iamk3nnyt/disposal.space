# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.11.0

# Copy workspace configuration
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./

# Copy all package.json files to establish workspace structure
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.11.0

# Build arguments for environment variables
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY 
ARG CLERK_SECRET_KEY
ARG DATABASE_URL
ARG CLERK_WEBHOOK_SECRET
ARG USER_SALT
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_S3_BUCKET_NAME
ARG AWS_REGION

# Set them as environment variables during build
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV CLERK_WEBHOOK_SECRET=$CLERK_WEBHOOK_SECRET
ENV USER_SALT=$USER_SALT
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ENV AWS_S3_BUCKET_NAME=$AWS_S3_BUCKET_NAME
ENV AWS_REGION=$AWS_REGION

# Copy everything from deps stage
COPY --from=deps /app ./

# Copy source code
COPY apps/web ./apps/web

# Build packages
RUN pnpm --filter "@ketryon/database" build
RUN pnpm --filter "@ketryon/aws" build

# Build the web app
RUN pnpm --filter "web" build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install pnpm in production
RUN npm install -g pnpm@10.11.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy everything from builder
COPY --from=builder --chown=nextjs:nodejs /app ./

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use pnpm filter as requested
CMD ["pnpm", "--filter", "web", "start"] 