FROM node:10 as base
WORKDIR /app
COPY package.json yarn.lock .yarnrc ./
COPY .yarn ./.yarn
RUN yarn install --frozen-lockfile --offline
COPY . ./
RUN yarn build
RUN yarn install --production --ignore-scripts --offline
RUN rm -r .yarn

FROM node:10-alpine
WORKDIR /app
ENV PORT 3000
ENV NODE_ENV production
COPY --from=base /app .
EXPOSE $PORT
CMD ["node", "scripts/serve.js"]
