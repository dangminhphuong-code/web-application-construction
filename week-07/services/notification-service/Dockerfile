FROM node:22-alpine

WORKDIR /app/services/notification-service

COPY services/notification-service/package*.json ./
RUN npm install --omit=dev

COPY services/notification-service ./

EXPOSE 3004

CMD ["npm", "run", "start"]

