# Build the web app: password-reset and email-verification links open its pages, and /admin lives there.
FROM node:22-alpine AS web
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

# Runtime: API plus the built web app, production dependencies only, non-root user.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server ./server
COPY --from=web /app/dist ./dist
USER node
EXPOSE 4000
CMD ["node", "server/index.js"]
