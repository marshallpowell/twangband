FROM    grc.io/marshallpowell/twang-ffmpeg

# Declare constants
ENV NVM_VERSION v0.30.1
ENV NODE_VERSION v5.3.0

# Replace shell with bash so we can source files
COPY gcsfuse.repo /etc/yum.repos.d/
RUN rm /bin/sh && \
ln -s /bin/bash /bin/sh && \
yum update; yum clean all && \
yum -y install curl build-essential gcc gcc-c++ make fuse gcsfuse && \
curl -o- https://raw.githubusercontent.com/creationix/nvm/${NVM_VERSION}/install.sh | bash && \
source ~/.nvm/nvm.sh && \
    nvm install ${NODE_VERSION} && \
    ln -s /root/.nvm/versions/node/${NODE_VERSION}/bin/node /usr/bin/node && \
    ln -s /root/.nvm/versions/node/${NODE_VERSION}/lib/node /usr/lib/node && \
    ln -s /root/.nvm/versions/node/${NODE_VERSION}/bin/npm /usr/bin/npm && \
    mkdir /src && mkdir /logs && mkdir -p /uploads
#docker build -t gcr.io/marshallpowell/twang-nodejs .
#gcloud docker push gcr.io/marshallpowell/twang-nodejs