FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run generate && npm prune --omit=dev

FROM node:22-alpine AS admin

WORKDIR /app

COPY --from=build /app /app

ENV NODE_ENV=production
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
COPY --from=build /app/index.html /usr/share/nginx/html/
COPY --from=build /app/dual-screen.html /usr/share/nginx/html/
COPY --from=build /app/milestones-data.js /usr/share/nginx/html/
COPY --from=build /app/milestones-data-default.js /usr/share/nginx/html/
COPY --from=build /app/shared /usr/share/nginx/html/shared
COPY --from=build /app/resources /usr/share/nginx/html/resources

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8000/ || exit 1
