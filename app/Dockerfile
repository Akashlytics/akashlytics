FROM node:14-alpine as build

# Create app directory
WORKDIR /app

# Bundle app source
COPY . .

RUN npm ci
RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]