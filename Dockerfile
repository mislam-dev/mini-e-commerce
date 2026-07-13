FROM node:22-alpine AS base

# Install pnpm and setup environment
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy package files
COPY ./* ./

RUN pnpm install
RUN pnpm run migration:run

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]
