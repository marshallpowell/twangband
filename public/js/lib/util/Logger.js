
var Logger = function(logLevel){
    this.logLevel = logLevel;
    this.void = function (out){};
    this.error = (['ERROR','INFO','DEBUG','TRACE'].indexOf(this.logLevel) > -1)? console.error.bind(console) : this.void;
    this.info = (['INFO','DEBUG','TRACE'].indexOf(this.logLevel) > -1)? console.info.bind(console) : this.void;
    this.trace = (['DEBUG','TRACE'].indexOf(this.logLevel) > -1)? console.info.bind(console) : this.void;
    this.debug = (['DEBUG'].indexOf(this.logLevel) > -1)? console.info.bind(console) : this.void;

};


