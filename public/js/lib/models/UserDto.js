/**
 * Created by mpowell on 6/4/2015.
 */

var method = UserDto.prototype;

function UserDto(){

    this.firstName;
    this.lastName;
    this.email;
    this.userName;
    this.password;
    this.confirmPassword;
    this.id;
    this.profilePic;
    this.instruments=[];
    this.tags=[];
    this.loginType;
    this.uiId;

}

try{module.exports = UserDto;} catch(err){}