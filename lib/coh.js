var keystone = require('keystone');


var appConfig = new Array();


if(keystone.get('env') == 'development'){
	
	appConfig.paths= new Array();
	appConfig.paths.keystone ="/var/www/coh/cluckoldhen/node_modules/keystone";
}
else if(keystone.get('env') == 'production'){
	
	appConfig.paths= new Array();
	appConfig.paths.keystone ="/var/www/coh/cluckoldhen/node_modules/keystone";
}