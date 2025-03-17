FROM node:22

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn global add pm2

EXPOSE 3000

CMD ["yarn", "start"]