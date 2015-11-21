/**
 * Created by marshallpowell on 11/20/15.
 */

var method = EditDto.prototype;

function EditDto(userId, edit){

    this.userId=userId;
    this.edit=edit;
    this.dateTime=new Date().toString();

}

try{module.exports = EditDto;} catch(err){}
