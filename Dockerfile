FROM node:16
MAINTAINER 0xyk3r<anjiongyi@163.com>
RUN mkdir dist
ADD ./dist/* dist
