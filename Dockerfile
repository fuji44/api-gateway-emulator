FROM node:16-alpine

WORKDIR /usr/local/api-gateway/
COPY package.json yarn.lock /usr/local/api-gateway/
RUN yarn --production --non-interactive

COPY . /usr/local/api-gateway/
RUN yarn build

CMD ["node", "dist/server.js"]
