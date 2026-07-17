FROM node:22-alpine

WORKDIR /app/services/enrollment-service

COPY services/enrollment-service/package*.json ./
RUN npm install --omit=dev

COPY protos /app/protos
COPY services/enrollment-service ./

EXPOSE 50053 3003

CMD ["npm", "run", "start:docker"]
