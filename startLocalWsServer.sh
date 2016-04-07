#!/usr/bin/env bash


export MONGO_SERVICE_HOST=192.168.99.100
export MONGO_SERVICE_PORT=27017
export MONGO_DB_NAME=twangband
export TB_MONGO_DB_USER=tb
export TB_MONGO_DB_PASS=test1234
export LOG_DIR=/Users/marshallpowell/dev/musicilo2/musicilo/logs/
export UPLOADS_DIR=/Users/marshallpowell/dev/musicilo2/uploads/
export FB_CLIENTID=1558894697697443
export FB_CALLBACKURL=https://local.twangband.com/auth/facebook/callback
export FB_CLIENTSECRET=964ee6d698f152d81cc9e8dadaed50e3
export BASE_URL=https://local.twangband.com

node wsServer.js