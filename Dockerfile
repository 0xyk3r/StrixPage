FROM nginx
MAINTAINER 0xyk3r<anjiongyi@163.com>
RUN rm -rf /etc/nginx/conf.d/default.conf
ADD ./nginx-strix.conf /etc/nginx/conf.d
RUN mkdir /mnt/strixweb
ADD ./dist/* /mnt/strixweb
CMD nginx -s reload
