FROM          gcr.io/marshallpowell/twang-web-packages:latest

# Bundle app source
COPY ./ /src/

RUN cd /src && npm install

EXPOSE  3000

#Define the command to start your node application
ENTRYPOINT ["bash", "/src/docker-start-up.sh"]


