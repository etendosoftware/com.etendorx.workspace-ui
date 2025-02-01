FROM postgres:16

RUN addgroup -S nonroot \
    && adduser -S nonroot -G nonroot

USER nonroot

ENV PGDATA=/var/lib/postgresql/customdata
ENV INITDB_SKIP_TZINFO=yes
