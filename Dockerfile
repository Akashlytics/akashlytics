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

RUN npm ci
RUN npm run build

WORKDIR /app/api
RUN npm ci --only=production

RUN npm rebuild

WORKDIR /app/newApi
RUN npm ci
RUN npm run build

EXPOSE 3080

WORKDIR /
RUN npm install -g concurrently
CMD ["concurrently", "node /app/api/server.js", "node /app/newApi/dist/server.js"]
