FROM docker.io/oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ARG LEGAL_UPDATED
ENV LEGAL_UPDATED=${LEGAL_UPDATED}
ENV NODE_ENV=production
RUN bun run build

FROM base AS release
COPY --from=prerelease /usr/src/app/package.json ./package.json
COPY --from=prerelease /usr/src/app/build ./build
COPY --from=prerelease /usr/src/app/scripts/hosting.ts ./scripts/hosting.ts
COPY --from=prerelease /usr/src/app/scripts/serve_build.ts ./scripts/serve_build.ts
COPY --from=prerelease /usr/src/app/healthcheck.ts ./healthcheck.ts
COPY --from=prerelease /usr/src/app/server.ts ./server.ts

ENV PORT=4173
ENV HOST=0.0.0.0

USER bun
EXPOSE 4173/tcp
ENTRYPOINT [ "bun", "server.ts" ]
