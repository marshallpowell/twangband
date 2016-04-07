FROM centos:centos7
MAINTAINER The CentOS Project <cloud-ops@centos.org>

RUN yum -y update; yum clean all
RUN yum -y install epel-release; yum clean all
COPY mongodb.repo /etc/yum.repos.d/
RUN yum -y install mongodb-org mongodb-org-server; yum clean all
RUN mkdir -p /data/db

COPY run.sh /
COPY password_setup.sh /
EXPOSE 27017
ENTRYPOINT ["/run.sh"]

#docker build -t gcr.io/marshallpowell/mongo-server .
#docker run -p 27018:27017 -e MONGO_DB_PASS=test1234 --name twang-mongo gcr.io/marshallpowell/mongo-server
#gcloud docker push gcr.io/marshallpowell/mongo-server
