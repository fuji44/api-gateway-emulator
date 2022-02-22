FROM node:16-alpine

WORKDIR /usr/local/api-geteway/
COPY package.json yarn.lock /usr/local/api-geteway/
RUN yarn --production --non-interactive

COPY . /usr/local/api-geteway/
RUN yarn build

CMD ["node", "dist/server.js"]
