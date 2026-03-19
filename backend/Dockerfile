# InwitClipps backend — Node.js 22 + yt-dlp + ffmpeg
FROM node:22-slim

# System binaries required by workers
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# yt-dlp (latest stable)
ADD https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp /usr/local/bin/yt-dlp
RUN chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Temp directory for video processing
RUN mkdir -p /tmp/inwitclipps

EXPOSE 3001

CMD ["node", "src/server.js"]
