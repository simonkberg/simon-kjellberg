FROM node:10-alpine as base
WORKDIR /home/node/app
ENV YARN_VERSION 1.10.1
RUN apk add --no-cache curl
RUN curl -o- -L https://yarnpkg.com/install.sh | sh -s -- --version $YARN_VERSION
ENV PATH="/root/.yarn/bin:/root/.config/yarn/global/node_modules/.bin:$PATH"
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . ./
RUN yarn build
RUN yarn install --production --ignore-scripts --prefer-offline


FROM node:10-slim
WORKDIR /home/node/app
ENV PORT 3000
ENV NODE_ENV production
COPY --from=base /home/node/app .
EXPOSE $PORT
USER node
CMD ["node", "index.js", "serve"]
