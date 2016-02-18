## Satellite 6.1 Client Configuration for a OSE3 disconnected installation

After the Satellite server has been installed, you will need to download the katello consumer packages from the server, and install the rpms.

    cd /usr/share/rhn
    curl -O --insecure https://your.satellite.instance:8003/pub/katello-ca-consumer-latest.noarch.rpm

Download and save the katello server public cert to the default location of /usr/share/rhn

    curl -O --insecure https://your.satellite.instance:8003/pub/katello-server-ca.crt

From here you can run subscription-manager as usual to download the ose3 packages and theoretically follow the same installation procedure as a connected server.

    #register the server 
    subscription-manager register 

    #list all the packages, and locate the ose3 packages
    subscription-manager list --available 

    #attach the subscription pool
    subscription-manager attach --pool=2c921b95520fbb8c01520fea392604bc 

## Configure your remote git repo through Satellite
TODO
## Configure your remote Docker registry through Satellite
TODO
## Start installation
From here you should be able to follow the standard Ansible playbooks for installing Openshift.

For further reference of the Satellite consumer installation, you can reference: https://access.redhat.com/documentation/en-US/Red_Hat_Satellite/6.0/pdf/Installation_Guide/Red_Hat_Satellite-6.0-Installation_Guide-en-US.pdf 

## Satellite 5 client installation
Download and install the katello consumer packages as described for the Satellite 6.1 install.

Update the /etc/sysconfig/rhn/up2date and set the below variables with your server information: 

    noSSLServerURL=http://your.satellite.server/XMLRPC
    serverURL=https://your.satellite.server/XMLRPC
    sslCACert=/usr/share/rhn/katello-server-ca.crt

Now run the below command for registering your server with Satellite. This will open up a GUI to walk you through the registration process.

    rhn_register

For further reference follow the Satellite 5.6 installation guide: https://access.redhat.com/documentation/en-US/Red_Hat_Satellite/5.6/pdf/Client_Configuration_Guide/Red_Hat_Satellite-5.6-Client_Configuration_Guide-en-US.pdf 

### Setting up a Git repo
You can set up a local HTTP server to host quick start OSE3 examples. Your first steps will be to copy all the quick starts onto a server which has access to the 
internet, or copy them on your laptop and upload them. Quick starts can be found here: https://github.com/openshift-quickstart

Create a Apache instance on a server that is accessible by your OSE3 installation. You can use Yum to install Apache:

    yum -y install httpd
    
Edit /etc/httpd/conf/httpd.conf and make sure the dav_module is loaded to apache and create a location for the git repo:
    
    #load dav_module
    LoadModule dav_module modules/mod_dav.so
    
    #make sure DAV lock file is set
    DAVLockDB "/usr/local/apache2/temp/DAV.lock"
    
    #create a location and add basic auth with read/write permissions
    <Location /quickstarts/mediawiki-example.git>
       DAV on
       AuthType Basic
       AuthName "Git"
       AuthUserFile /etc/httpd/conf/passwd.git
       Require valid-user
    
                    <Limit GET HEAD OPTIONS PROPFIND>
                            Require user write_user read_user
                    </Limit>
    </Location>

    RewriteEngine On
    RewriteCond %{QUERY_STRING} service=git-receive-pack [OR]
    RewriteCond %{REQUEST_URI} /git-receive-pack$
    RewriteRule ^/git/ - [E=AUTHREQUIRED]
    <Files "git-http-backend">
        AuthType Basic
        AuthName "Git Access"
        AuthUserFile /opt/git/.htpasswd
        Require valid-user
        Order deny,allow
        Deny from env=AUTHREQUIRED
        Satisfy any
    </Files>
    
Add a user and create a htpasswd file for them
    useradd git
    htpasswd -c /etc/httpd/conf/passwd.git git
    
Create a bare git repo in the http www path

    mkdir -p /quickstarts/mediawiki-example.git
    cd mediawiki-example.git/
    git init --bare
    
Clone the github repos and push them into your new bare repos

    cd ~
    git clone https://github.com/openshift-quickstart/mediawiki-example.git
    cd mediawiki-example.git
    
    git remote add mylocal http://10.3.10.179/quickstarts/mediawiki-example.git
    git push mylocal master
    
You should now be able to access your OSE3 quick-starts from a http local server: http://10.3.10.179/quickstarts/mediawiki-example.git

  https://github.com/tayterz/openshift-playbooks
  
  
  

    
    
    