FROM node:14-alpine

# Create app directory
WORKDIR /app

RUN mkdir app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY app/package*.json ./

# Bundle app source
COPY . .

WORKDIR /app/app

RUN npm ci --only=production
RUN npm run build

WORKDIR /app/api
RUN npm ci --only=production

RUN npm rebuild

EXPOSE 3080
CMD [ "node", "/app/api/server.js" ]
