# base node image
FROM node:20-bookworm-slim

ARG ARCH
ENV ARCH=$ARCH
ARG PUPPETEER_SKIP_DOWNLOAD
ENV PUPPETEER_SKIP_DOWNLOAD=$PUPPETEER_SKIP_DOWNLOAD

# Copied from https://github.com/puppeteer/puppeteer/blob/aefbde60d7993c37ca5289e034f3ca90945c20ff/docker/Dockerfile#L6
#
# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chrome that Puppeteer
# installs, work.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && if [ $ARCH = 'arm64' ]; then \
        apt-get install -y chromium \
       ; else \ 
        wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
        && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
        && apt-get update \
        && apt-get install -y google-chrome-stable \
       ; fi \
    && apt-get install -y fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm i -g npm@latest && npm ci --verbose

ARG WIX_URLS
ENV WIX_URLS=$WIX_URLS

COPY . .
RUN npm run build

ENV NODE_ENV=production

CMD ./scripts/run-prod.sh
