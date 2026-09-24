FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS build
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ARG LEGAL_UPDATED
ENV NODE_ENV=production
RUN bun run build

FROM base AS release

ENV BODY_SIZE_LIMIT=128M
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV SHARE_STORAGE_DIR=/app/uploads

COPY --from=install /temp/prod/node_modules node_modules
COPY --from=install /temp/prod/package.json ./package.json
COPY --from=build /usr/src/app/build ./build
COPY --from=build /usr/src/app/scripts/healthcheck.ts ./healthcheck.ts

RUN mkdir -p /app/uploads && chown -R bun:bun /app/uploads
VOLUME /app/uploads

USER bun
EXPOSE 3000/tcp
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD ["bun", "healthcheck.ts"]
CMD ["bun", "build/index.js"]