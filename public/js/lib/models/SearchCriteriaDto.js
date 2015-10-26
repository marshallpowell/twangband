
var method = SearchCriteriaDto.prototype;

function SearchCriteriaDto(){
    this.firstName=null;
    this.lastName=null;
    this.email=null;
    this.userIds=[];
    this.tags = [];
    this.matchCriteria='ANY'; //ALL, NONE
    this.searchType=null;
}

try{module.exports = SearchCriteriaDto;} catch(err){}
