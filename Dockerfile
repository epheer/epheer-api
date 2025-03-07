FROM node:22

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn global add pm2

EXPOSE 3000

CMD ["pm2-runtime", "start", "app.js", "--name", "epheer-api"]