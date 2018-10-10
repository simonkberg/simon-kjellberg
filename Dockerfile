FROM mhart/alpine-node:10 as base
WORKDIR /app
ENV YARN_VERSION 1.10.1
RUN apk add --no-cache curl
RUN curl -o- -L https://yarnpkg.com/install.sh | sh -s -- --version $YARN_VERSION
ENV PATH="/root/.yarn/bin:/root/.config/yarn/global/node_modules/.bin:$PATH"
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . ./
RUN yarn build
RUN yarn install --production --ignore-scripts --prefer-offline


FROM mhart/alpine-node:base-10
WORKDIR /app
ENV PORT 3000
ENV NODE_ENV production
COPY --from=base /app .
EXPOSE $PORT
CMD ["node", "index.js", "serve"]
