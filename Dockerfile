FROM nginx:stable-alpine

COPY index.html /usr/share/nginx/html/index.html
COPY Games/ /usr/share/nginx/html/Games/

EXPOSE 80