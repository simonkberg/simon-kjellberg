FROM node:10 as base
WORKDIR /app
ENV YARN_VERSION 1.15.2
RUN curl -o- -L https://yarnpkg.com/install.sh | sh -s -- --version $YARN_VERSION
ENV PATH="/root/.yarn/bin:/root/.config/yarn/global/node_modules/.bin:$PATH"
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . ./
RUN yarn build
RUN yarn install --production --ignore-scripts --prefer-offline


FROM node:10-alpine
WORKDIR /app
ENV PORT 3000
ENV NODE_ENV production
COPY --from=base /app .
EXPOSE $PORT
CMD ["node", "scripts/serve.js"]
