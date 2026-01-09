FROM golang:1.25.5-trixie AS build

COPY . /build

RUN cd /build && go build && mkdir /app && \
    mv zis /app/backend && mv /build/config /app \
    && rm -r /build

WORKDIR /app

ENV STAGE=prod

EXPOSE 8080

ENTRYPOINT [ "./backend" ]