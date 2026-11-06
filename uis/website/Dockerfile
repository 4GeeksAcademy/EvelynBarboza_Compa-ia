FROM node:22-alpine

WORKDIR /app

ARG BACKEND_URL=http://backend:8000
ENV BACKEND_URL=$BACKEND_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY uis/website/package*.json ./uis/website/
RUN npm ci --prefix ./uis/website

COPY uis/website ./uis/website
WORKDIR /app/uis/website

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]