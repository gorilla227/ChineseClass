FROM nginx:stable-alpine

ARG IMAGE_VERSION=dev

COPY index.html /usr/share/nginx/html/index.html
COPY Games/ /usr/share/nginx/html/Games/
RUN printf '%s\n' "$IMAGE_VERSION" > /usr/share/nginx/html/version.txt

EXPOSE 80