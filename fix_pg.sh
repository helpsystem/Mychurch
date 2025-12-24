#!/bin/bash
head -n -1 /etc/postgresql/16/main/postgresql.conf > /tmp/pg.conf
echo "listen_addresses = '0.0.0.0'" >> /tmp/pg.conf
mv /tmp/pg.conf /etc/postgresql/16/main/postgresql.conf
systemctl restart postgresql@16-main
