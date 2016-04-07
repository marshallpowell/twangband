#!/bin/bash
set -m

cmd="/usr/bin/mongod --auth "

$cmd &

if [ ! -f /data/db/.mongodb_password_set ]; then
    /password_setup.sh
fi

fg