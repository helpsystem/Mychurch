#!/bin/bash
cd /var/www/html
TIMESTAMP=$(date +%s)
sed -i "s/index-Bq697ij1.js?v=[0-9]*/index-Bq697ij1.js?v=$TIMESTAMP/g" index.html
echo "Updated to timestamp: $TIMESTAMP"
grep 'index-Bq697ij1.js' index.html
