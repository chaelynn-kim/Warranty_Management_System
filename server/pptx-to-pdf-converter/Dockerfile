FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libreoffice-impress \
    libreoffice-writer \
    fontconfig \
    fonts-liberation \
    fonts-noto-cjk \
  && rm -rf /var/lib/apt/lists/* \
  && fc-cache -fv

COPY fontconfig/local.conf /etc/fonts/local.conf
COPY libreoffice/registrymodifications.xcu /etc/libreoffice/registrymodifications.xcu
RUN fc-cache -fv

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY index.mjs ./

ENV PORT=8080
ENV HOME=/tmp
ENV LANG=ko_KR.UTF-8
ENV LC_ALL=ko_KR.UTF-8
RUN mkdir -p /tmp/.config/libreoffice/4/user \
  && cp /etc/libreoffice/registrymodifications.xcu /tmp/.config/libreoffice/4/user/registrymodifications.xcu

EXPOSE 8080

CMD ["npm", "start"]
