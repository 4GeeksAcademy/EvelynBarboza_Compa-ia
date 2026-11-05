FROM node:22-alpine

WORKDIR /app

ARG BACKEND_URL=http://backend:8000
ENV BACKEND_URL=$BACKEND_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY backoffice/package*.json ./backoffice/

RUN npm ci --prefix ./backoffice

COPY . .

RUN npm --prefix ./backoffice run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "--prefix", "/app/backoffice", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]
