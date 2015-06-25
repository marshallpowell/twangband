/**
 * Created by mpowell on 6/4/2015.
 */

var method = UserDto.prototype;

function UserDto(){

    this.firstName;
    this.lastName;
    this.email;
    this.id;
    this.instruments=[];

}

try{module.exports = UserDto;} catch(err){}