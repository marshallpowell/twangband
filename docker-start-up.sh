#!/usr/bin/env bash

#set up gcsfuse
#sed -i "s/{{GCLOUD_PRIVATE_KEY_ID}}/${GCLOUD_PRIVATE_KEY_ID}/g;" /src/gcloud_service_account.json
#sed -i "s/{{GCLOUD_CLIENT_ID}}/${GCLOUD_CLIENT_ID}/g;" /src/gcloud_service_account.json
#sed -i "s/{{GCLOUD_PRIVATE_KEY}}/${GCLOUD_PRIVATE_KEY}/g;" /src/gcloud_service_account.json
#export GOOGLE_APPLICATION_CREDENTIALS=/src/key.json

#todo mount bucket should be based on env
gcsfuse --key-file=/src/gcloud_credentials.json ${UPLOADS_BUCKET} /uploads


# Env says we're using SSL
if [ -n "${ENABLE_WEBSOCKETS+1}" ] && [ "${ENABLE_WEBSOCKETS,,}" = "true" ]; then
    echo "Enabling WEBSOCKETS SERVER..."
    node /src/wsServer.js
else
    echo "Enabling HTTP SERVER..."
    node /src/server.js
fi
