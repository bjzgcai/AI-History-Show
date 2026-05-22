FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000
EXPOSE 3001

CMD ["npm", "run", "start:preview"]
