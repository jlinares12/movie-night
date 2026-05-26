FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

ENV PATH=/workspace/node_modules/.bin:$PATH
