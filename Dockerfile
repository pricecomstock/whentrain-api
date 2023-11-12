FROM oven/bun:1 as production

# Create app directory
WORKDIR /app

# Copy current directory in
COPY package*.json ./

# install everything
RUN bun install

COPY . .

ENV PORT 80

EXPOSE 80

CMD ["bun", "src/index.ts"]