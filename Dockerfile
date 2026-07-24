FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run validate:archive && npm run generate && npm run build:static && npm prune --omit=dev

FROM node:22-alpine AS admin

WORKDIR /app

COPY --from=build /app /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/admin').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "manage/server.js"]

# Containerized version of DEPLOYMENT.md option 1:
# generate the static exhibit files, copy them into an Nginx web root,
# and let Nginx serve the presentation as the cloud server would.
FROM nginx:1.27-alpine AS presentation

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.tmp/static-site/ /usr/share/nginx/html/

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8000/ || exit 1
