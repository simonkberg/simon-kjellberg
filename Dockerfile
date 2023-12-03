FROM node:20 as base
WORKDIR /app
ENV YARN_VERSION 1.22.19
RUN curl -o- -L https://yarnpkg.com/install.sh | sh -s -- --version $YARN_VERSION
ENV PATH="/root/.yarn/bin:/root/.config/yarn/global/node_modules/.bin:$PATH"
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . ./
RUN yarn build
RUN yarn install --production --ignore-scripts --prefer-offline


FROM node:20-alpine
WORKDIR /app
ENV PORT 3000
ENV NODE_ENV production
RUN npm install pm2 -g
COPY --from=base /app .
EXPOSE $PORT
CMD ["pm2-runtime", "scripts/serve.js"]
