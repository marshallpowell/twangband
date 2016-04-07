#!/bin/bash

ADMIN_USER=${ADMIN_MONGO_DB_USER}
ADMIN_PASS=${ADMIN_MONGO_DB_PASS}

USER=${TB_MONGO_DB_USER}
PASS=${TB_MONGO_DB_PASS}
DATABASE=${MONGO_DB_NAME}


RET=1
while [[ RET -ne 0 ]]; do
    echo "=> Waiting for confirmation of MongoDB service startup"
    sleep 5
    mongo admin --eval "help" >/dev/null 2>&1
    RET=$?
done

echo "=> Creating an user/password $USER / $PASS in MongoDB"
mongo admin --eval "db.createUser({user: '$ADMIN_USER', pwd: '$ADMIN_PASS', roles:[{role:'root',db:'admin'}]});"
mongo admin -u $ADMIN_USER -p $ADMIN_PASS << EOF
use $DATABASE
db.createUser({user: '$USER', pwd: '$PASS', roles:[{role:'dbOwner',db:'$DATABASE'}]})
EOF

echo "=> Passwords set!"
touch /data/db/.mongodb_password_set

