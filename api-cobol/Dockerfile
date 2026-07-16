# Build context is the repo root (not api-cobol/) -- this image needs
# cobol/programs, cobol/copybooks, cobol/scripts, and cobol/seed-data
# alongside the Node adapter itself.

FROM debian:bookworm-slim AS cobol-builder
RUN apt-get update && apt-get install -y --no-install-recommends gnucobol4 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY cobol/copybooks ./cobol/copybooks
COPY cobol/programs ./cobol/programs
RUN mkdir -p /build/bin && \
    for f in cobol/programs/*.cbl; do \
      name=$(basename "$f" .cbl); \
      lower=$(echo "$name" | tr '[:upper:]' '[:lower:]'); \
      cobc -x -free -I cobol/copybooks -o "/build/bin/$lower" "$f"; \
    done

FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends libcob5 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY api-cobol/package.json api-cobol/package-lock.json ./
RUN npm ci --omit=dev

COPY api-cobol/index.js ./
COPY api-cobol/lib ./lib
COPY api-cobol/middleware ./middleware
COPY api-cobol/routes ./routes
COPY api-cobol/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY cobol/scripts ./cobol/scripts
COPY cobol/seed-data ./seed-data
COPY --from=cobol-builder /build/bin ./bin

ENV BIN_DIR=/app/bin
ENV DATA_DIR=/data
ENV BATCH_SCRIPT=/app/cobol/scripts/run-batch.sh
VOLUME /data
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "index.js"]
