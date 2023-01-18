FROM --platform=$BUILDPLATFORM node:18.3.0 AS build

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

RUN npm run build

FROM node:18.3.0

WORKDIR /app

COPY --from=build /app/dist /app

EXPOSE 3000

ENTRYPOINT ["npx", "serve", "-s", "."]