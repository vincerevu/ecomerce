FROM node:20-alpine

RUN npm install -g @relay-works/sms-dev

EXPOSE 4000 4001

ENV SMSDEV_PUBLIC_API_URL=http://localhost:4001

CMD ["sh", "-c", "node /usr/local/lib/node_modules/@relay-works/sms-dev/dist/cli.js start --api-port 4001 --ui-port 4000 --api-url \"$SMSDEV_PUBLIC_API_URL\""]
