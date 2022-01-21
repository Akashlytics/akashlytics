FROM node:14-alpine as build

# Create app directory

#RUN mkdir app
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
#COPY app/package*.json ./

# Bundle app source
COPY . .

RUN npm ci
RUN npm run build

EXPOSE 3080
CMD [ "node", "/app/dist/server.js" ]