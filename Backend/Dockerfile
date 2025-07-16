FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache g++ make python3

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=5000
EXPOSE 5000
CMD ["npm", "start"]
