FROM node:20.14-alpine3.20 as build-stage

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /usr/src/app

COPY ./package*.json ./
RUN ls -la
RUN npm ci

COPY . .
WORKDIR /usr/src/app/projects/filters
RUN npm ci
RUN npm run build

WORKDIR /usr/src/app/projects/filters/commons
RUN npm ci
RUN npm run build

WORKDIR /usr/src/app/projects/filters/demos/evaluation
RUN npm ci
RUN npm run build
RUN npm run build:server

FROM node:20.14-alpine3.20 as production-stage

WORKDIR /usr/src/app

COPY --from=build-stage /usr/src/app /usr/src/app

WORKDIR /usr/src/app/projects/filters/demos/evaluation

EXPOSE 5000

CMD ["npm", "run", "start:server"]

FROM nginx:alpine as nginx-stage

COPY --from=build-stage /usr/src/app/projects/filters/demos/evaluation/dist /usr/share/nginx/html

COPY --from=build-stage /usr/src/app/projects/filters/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
