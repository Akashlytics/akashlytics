FROM node:14-alpine as build

# Create app directory

#RUN mkdir app
WORKDIR /app

# Bundle app source
COPY . .

RUN npm ci
RUN npm run build

EXPOSE 3080
CMD [ "node", "/app/dist/server.js" ]