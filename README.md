#Overview
This is an older project I created to record and mix music online. The app worked well, but I abandonded due to lack of time. Hopefully someone can make use of it as it was a fun exercise. Feel free to use however you like. The below readme is just helpful info I recorded for managing the project locally and in gcp. All the key, password info is garbage.

# Environment Info

## Docker base image layers

1. centos7
2. twang-ffmpeg - has all required ffmpeg libraries installed
3. twang-nodejs - has nvm and node.js v5.3.0 installed along with gcsfuse
4. twang-packages - has a cached version of all of the twang npm packages
5. twang-web - this is the Dockerfile in the root directory. it contains all the node.js code for the web app

## Local Env

    #get IP address of laptop
    ifconfig | grep "inet " | grep -v 127.0.0.1
    
### Local Libraries and setup
FFMPEG and http://sharp.dimens.io/en/stable/install/ where installed through brew
    
### Docker set env
    eval "$(docker-machine env default)"

### Node.js Server

    #this sets env vars and starts node
    ./startLocalDev.sh
    
#### Docker build and push
    docker build -t gcr.io/marshallpowell/twang-web .
    gcloud docker push gcr.io/marshallpowell/twang-web

#### Run the docker container
    docker run -p 3000:3000 \
    --privileged \
    -e MONGO_SERVICE_HOST=192.168.99.100 \
    -e MONGO_SERVICE_PORT=27017 \
    -e MONGO_DB_NAME=cluckoldhen \
    -e UPLOADS_BUCKET=uploads \
    -e UPLOADS_DIR=/uploads \
    -e LOG_DIR=/logs/ \
    --link mongo \
    --name twang-web \
    gcr.io/marshallpowell/twang-web

    -e GCLOUD_CLIENT_ID=107681766997312391062 \
    -e GCLOUD_PRIVATE_KEY='MY PRIVATE KEY' \
    -e GCLOUD_PRIVATE_KEY_ID='1104b3efa3eefc0e64f6dd5427542d5fe9bd92b1' \
    -e GOOGLE_APPLICATION_CREDENTIALS=/src/gcloud_service_account.json \
    -e GCLOUD_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\GARBAGEBAQCKpKUwEVb0JrVn\n2S2HaCvzUKCKD00N8WSfDc36z/CNO5ETluAQ/hgQ/juv3CtMQFlqXxQIuoRlV+k7\nsHgrn4fje2d6pUJ+ouH1xidTVwjy8mP9lj7xia+0CenBg0lOAfDKIfTg6oD6akQT\nUb1v83RYi6Eb6XLE3OHJoEwxTKb2T7Uj4GUBcNo+KEQoxeopNIbSh9lZLH87qkhE\nLAmuFJA962620zBz83CP+Ok/NY5vpBgRHgZ5HjXCZFes4BV9utSUNHnh5A2dDtxW\nmjg87nc4QiTgKBjUXWoizTm7nq+uwBEr2JP/eaSeSAneZ65rWOze9/PlC99cirB1\nTkpQQUM1AgMBAAECggEAUMr3lFZWdLrl9dmChaj4C7eNhka6YYitWV7jDOkGRldT\nCLZgZqacAbMVtzq3ZJ0PPkSf2SJQKvqa6PTCYrF5r9/nAnqxkDh9MwtBOXi7t0/3\nYvyeO4VABcvNE77dBf9tgW1eVX9yn/szJor4uPeHcl4UCb716bDKRwQJwqTnmxsk\n8bcPzk3KZliQp2aZlJRQnHLaAS9GdiH5DLi6ahegvzvZ0BWIDMNEvLx1gILVa+a7\nk2u+8DYm8dSoV9W0qjC7jXHWz8wr++Jn4urIzeISgtbcoZlecPWKbIz0+FbEd7C6\nuMs2lnV69QO2B+4K9n8dspnvTEW77pm1rmqcOrPPQQKBgQDTPBNhdeG58zAkGuU3\ntY9oN3uXB9YUTivHWClNa3hk3BBmqRFRm8BKtcJ4G1M7Jpms46t9VaF0oPL87PUr\nLyBeBohcgHuGHPisJh6+9Si4qmrHptI/OyWE3HRGEsXZjWE7Zuqo/Tifs4ZcEMW4\nfARfK4iYMdyzlXJJyj62OASCMQKBgQCoBlOyXhglsB640bjR9kiMOwWsa/DETE6r\nL/SOrFvQR9md5XnMHSxOqvexMheuz9jCLvJeeuVSj/JnAaX9eNgNqUzSMZaRaD9m\nlwk4bfsxUAW2mcYInLll3FdfgSqHbqt7mFBKdr9go70pIwznSO5GisvXnOxCQEpp\nTvNvMRXsRQKBgQDRzbieM5yIud+V7NTAOWf/piPuBY1/S4k2DP2w9M52txDfNouK\nF/2s9sz5yIIpnRRD4TmiWhvsIDRYPO7h/oPSgACOh9qogTwImDAvkIbqq/E07h+j\nSBbi2KfwNZMnmsH5YyYtxJyqGoCYDtyjeSJKeI3KRLQl9oi2e9c/23G28QKBgQCN\nYF12HFQHCgyfh98R0z8xtsvMSzpXgLlEsuH8ViwesQX7JEV6KCXKv3IQB00ECuCg\nau4F7zQbZwEYCLwI7XAk9omr5ouBJ40JHhZlA60yzdkwzmxhfLVGbsKZmk4VjFn/\ncaZFMWtPvhYAkfxecvACLPDdJ61nBT9XIlYT/eIrXQKBgE5vXlclAfqfOer56IWq\nt4B9tAdjEINNafCIqS2yKYMocqei7+gUIsT62X2jYMo0s43NYDdLn3bJo1IT55SD\nXkUkvyOxMS+1Z6wfFOuWsYj2eOhwqiKhP1Ye+gZUkNZoVmsYM0htPUSPx5ot/gCY\nY+lkAwcL7LGrLKPNKMmB/qDQ\n-----END PRIVATE KEY-----\n' \

### Mongo Server
    #note you cannot mount a data dir from osx to a virtual box machine
    docker run --name musicilo-mongo -d -p 27017:27017  musicilo/mongo-server 
    
    docker run \
    -p 27018:27017 \
    -e ADMIN_MONGO_DB_USER=tb \ 
    -e ADMIN_MONGO_DB_PASS=test1234 \
    -e TB_MONGO_DB_USER=tb \ 
    -e TB_MONGO_DB_PASS=test1234 \
    --name twang-mongo gcr.io/marshallpowell/mongo-server
    
    db.createUser({user: 'tb', pwd: 'test1234', roles:[{role:'dbOwner',db:'twangband'}]})
        

    #connect to the server from commandline on the container
    mongo 127.0.0.1:27017/twangband -u tb -p fuzzyWUZZYhadnohair102938476garbage
### Ngnix Web Server

    docker run  \
      -e ENABLE_SSL=true \
      -e ENABLE_BASIC_AUTH=false \
      -e TARGET_SERVICE=192.168.99.1:3000 \
      -e CDN_TARGET_SERVICE=192.168.99.1:3000 \
      -e CDN_TARGET_PATH=uploads \
      -e WEBSOCKET_TARGET_SERVICE=192.168.99.1:3001 \
      --name=nginx \
      -v /Users/marshallpowell/dev/sslCert/twangband.com.crt:/etc/secrets/proxycert \
      -v /Users/marshallpowell/dev/sslCert/twangband.com.key:/etc/secrets/proxykey \
      -v /Users/marshallpowell/dev/sslCert/dhparam.pem:/etc/secrets/dhparam \
      -p 80:80 \
      -p 443:443 \
      gcr.io/marshallpowell/nginx-ssl-proxy

### FFMpeg Server
    #run image locally
    docker run musicilo/ffmpeg-server -i http://nodejs-musicilo.rhcloud.com/uploads/5f4183d5c36ee835b9c396a3d022671c.wav -acodec libvorbis audio.ogg

## Gcloud Info
Gcloud API ref: https://cloud.google.com/sdk/gcloud/reference/info

    #If authentication stops working (ex "invalid_grant") try the below command
    gcloud auth login

    #This is how to upgrade the master and nodes for kubernetes. For more info: https://cloud.google.com/container-engine/docs/clusters/upgrade
    gcloud container clusters upgrade prod-cluster --master
    gcloud container clusters upgrade prod-cluster

## Gcloud Dev Env
    #make sure you switch to the dev cluster
    gcloud config configurations activate default
    #verify active config
    gcloud info
    
#### Kubernetes Cluster Info
    #switch to dev cluster:
    gcloud container clusters get-credentials dev-cluster --zone us-east1-b

## Gcloud Prod Env

#### gcloud config setting
    #make sure you switch to the production cluster 
    gcloud config configurations activate production-cluster
    #verify active config
    gcloud info
       
#### Kubernetes Cluster Info
    #switch to prod cluster
    gcloud container clusters get-credentials prod-cluster --zone us-central1-c

## Docker commands for gcloud
Push a image to gcloud

    gcloud docker push gcr.io/marshallpowell/mongo-server

## Kubernetes commands
http://kubernetes.io/docs/user-guide/kubectl-cheatsheet/

    #show cluster info: 
    kubectl cluster-info
    
    #show all pods
    kubectl get pods
    
    #to delete/add a replication controller, for instance if you needed to update the docker image, you could run the below (there are better ways to do this with versioning...)
     kubectl delete rc web-controller
     kubectl create -f dev-web-controller.yaml
     
     #show logs for a given pod
     kubectl logs websocket-controller-ow7lp

    # show environment info:
    kubectl exec web-controller-v0.0.1-c6241 env
    #shows....
    KUBERNETES_PORT_443_TCP_PORT=443
    MONGO_PORT_27017_TCP_ADDR=10.11.250.216
    NGINX_SSL_PROXY_SERVICE_PORT_HTTPS=443
    ....
    
    #get a shell on a container
    kubectl exec -it web-controller-v0.0.1-c6241 bash
    
    # create a secrets file for use in a cluster (this is where ssl cert info is currently stored)
    # see http://kubernetes.io/docs/user-guide/secrets/
    # all values in the secrets file must be base64 encoded (ex. echo -n "admin" | base64)
    
    #create secrets file:
    kubectl create -f ./prod-secrets.yaml
    # update secrets file:
    kubectl apply -f ./prod-secrets.yaml
    # show the current secrets files in a cluster
    kubectl get secrets

#### Example create for services, replication controllers, secrets

    kubectl create -f dev-mongo-service.yaml
    kubectl create -f dev-mongo-controller.yaml

#### Example create disks
the zone needs to be the same as the container (this can also be done through the console)

    gcloud compute disks create dev-mongodb-disk --zone us-east1-b —-size 10GB

## GIT Info

###create branches as you develop code, this ensures your mainline stays clean of bugs
    #https://www.atlassian.com/git/tutorials/using-branches/git-merge

	#create the branch
	git branch <branch name>

	#then check out the branch
	git checkout <branch name>

	#when complete with the changes merge them back into trunk
    #check out master to change the current branch to master
    git checkout master

    #merge your branch back into master
    git merge <branch name>

    #upload new updates into the openshift repo:
    git push -f openshift HEAD
    
#tag the code when preparing to release
git tag -a v1.0.1 -m "Track model simplified, FFProbe enabled"
### Openshift Git commands
	#added openshift as a up-stream repo, only need to run this once inside of the bitbucket git repo
	git remote add openshift -f ssh://556cb525500446bb3b00019b@nodejs-musicilo.rhcloud.com/~/git/nodejs.git/
	
    #merge the remote location with the local 
    git merge openshift/master -s recursive -X HEAD
    
    
## SSL Info

### create ssl cert
    openssl req \
           -newkey rsa:2048 -nodes -keyout twangband.com.key \
           -x509 -days 365 -out twangband.com.crt

### create csr 
    openssl req -new -sha256 -key twangband.com.key -out twangband.com.csr
    
### base64 encode ssl key and cert for replication controller file
    cat twangband.com.key | base64
    cat twangband.com.crt | base64
    openssl dhparam -out dhparam.pem 2048
    base64 -i dhparam.pem
    
    # add this base64 info to the secrets file
    kubectl create -f secrets.yaml

## Mongo Commands

    # find tracks with specific tag – consider lower casing all tags
    db.tracks.find( { tags: "Acoustic guitar" } )
    db.songs.find( { tags: "Acoustic guitar" } )
    
    #update a track
    db.tracks.update(
    	{ _id : ObjectId("567589a6d2ba915f770c672c") },
    	{
    	$set : { fileName : "c13591c5e9326183b596a68dc639d089.ogg" }
    	}
    );

    # find songs which match multiple tags
    db.songs.find( { tags: { $all: [ "guitar", "harmonica" ] } } );

    # find songs which a user is a collaborator in
    db.songs.find(
       {
          collaborators: {
                    $elemMatch: {
                         user : ObjectId("562836c59eda23da4b80bb1d")
                    }
          }
       }
    )
    
    # mo po: ObjectId("562836c59eda23da4b80bb1d")
    #songs.find({ creator: ObjectId("562836c59eda23da4b80bb1d") })
    db.songs.find(
       {
          creator : ObjectId("562836c59eda23da4b80bb1d")
       }
    )
    
    #find all public tracks
    db.tracks.find( { isPublic : false } )
    
## Recording Data
  
The web audio api by default records in PCM format.
https://subvisual.co/blog/posts/39-tutorial-html-audio-capture-streaming-to-node-js-no-browser-extensions
### Latency Times
You can measure latency using the sound.io/latency app. You need to compile a long list of reference computers for this. Then you can match the reference
latency from the user's computer specs
1. My Mac 42ms (.042s)
2. My Windows 66ms (.066s)

## FFMPEG Commands

    #create ogg from wav
    ffmpeg -i audio.wav  -acodec libvorbis audio.ogg    
    
    #sample command to convert wav to ogg
    ffmpeg -i uploads/5f4183d5c36ee835b9c396a3d022671c.wav  -acodec libvorbis uploads/audio.ogg
    
    #sample ffmpeg to convert wav to ogg on openshift
    ${OPENSHIFT_DATA_DIR}bin/ffmpeg -nostdin -i ${OPENSHIFT_DATA_DIR}uploads/3e18bfb28efb62e9bf0993b1ded4def8.wav -acodec libvorbis ${OPENSHIFT_DATA_DIR}uploads/test.ogg

    #sample command to merge 3 files together
    ffmpeg -i file1.ogg -i file2.ogg -i file3.ogg -filter_complex amix=inputs=3:duration=first:dropout_transition=3 mergedFiles.ogg
    
##OPENSHIFT V2 RHC Commands:
 
     #ssh into a cartridge
     ssh 556cb525500446bb3b00019b@nodejs-musicilo.rhcloud.com
     
     #show info about your app
     rhc app show -a dev-musicilo.rhcloud.com
     
     #tail logs for a cartridge
     rhc tail -a nodejs	
     
     #locate logs on openshift
     cd $OPENSHIFT_LOG_DIR

##Recording process

* Create time stamp right before recorder.record() happens
* Pass the timestamp into record() and set a class variable
* pass the timestamp to the worker command 'record' and post it to the ws only once
* the ws protocol should expect the timestamp after the JSON message
