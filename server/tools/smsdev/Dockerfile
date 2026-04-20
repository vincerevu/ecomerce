FROM node:20-alpine

RUN npm install -g @relay-works/sms-dev

EXPOSE 4000 4001

CMD ["node", "/usr/local/lib/node_modules/@relay-works/sms-dev/dist/cli.js", "start", "--api-port", "4001", "--ui-port", "4000", "--api-url", "http://localhost:4001"]
