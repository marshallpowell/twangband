FROM          gcr.io/marshallpowell/twang-nodejs:latest

WORKDIR /
# Bundle app source, make sure you get latest package file from app
COPY ./package.json /src/

RUN cd /src && npm install


#docker build -t gcr.io/marshallpowell/twang-web-packages .
#gcloud docker push gcr.io/marshallpowell/twang-web-packages