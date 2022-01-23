FROM node:14-alpine as build

ARG API_BASE_URL=http://localhost:3080

# Create app directory
WORKDIR /app

# Bundle app source
COPY . .

RUN npm ci
RUN npm run build

# production environment
FROM nginx:stable-alpine
ARG API_BASE_URL=http://localhost:3080
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s|<API_BASE_URL>|$API_BASE_URL|g" /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]