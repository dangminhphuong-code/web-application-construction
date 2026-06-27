FROM node:22-alpine

WORKDIR /app/services/chat-service

COPY services/chat-service/package*.json ./
RUN npm install --omit=dev

COPY services/chat-service ./

EXPOSE 3005

CMD ["npm", "run", "start:docker"]

