FROM centos:centos7
MAINTAINER The CentOS Project <cloud-ops@centos.org>

RUN yum -y update; yum clean all
RUN yum -y install epel-release; yum clean all
COPY mongodb.repo /etc/yum.repos.d/
RUN yum -y install mongodb-org mongodb-org-server; yum clean all
RUN mkdir -p /data/db

EXPOSE 27017
ENTRYPOINT ["/usr/bin/mongod"]
