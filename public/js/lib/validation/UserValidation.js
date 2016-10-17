
var UserValidation = {};

UserValidation.validateUser = function(user){

    var errors = [];
    var nameMaxLength = 50;
    var emailMaxLength = 100;


    if(user.firstName.trim() == ""){

        errors.push("First name cannot be blank");
    }
    if(user.firstName.length > nameMaxLength){
        errors.push("First Name is " + user.firstName.length + " characters long. Max length is "+nameMaxLength + " characters");
    }
    if(user.lastName.trim() == ""){

        errors.push("Last name cannot be blank");
    }
    if(user.lastName.length > nameMaxLength){
        errors.push("Last Name is " + user.lastName.length + " characters long. Max length is "+nameMaxLength + " characters");
    }
    if(user.email.trim() == ""){

        errors.push("Email cannot be blank");
    }
    if(user.email.length > emailMaxLength){
        errors.push("Email is " + user.email.length + " characters long. Max length is "+emailMaxLength + " characters");
    }
    if(!user.id && !user.socialId){

        errors = errors.concat(UserValidation.validatePassword(user.password));
    }

    return errors;
};

UserValidation.validatePassword = function(password){

    var passwordMinLength = 8;
    var passwordMaxLength = 25;
    var errors = [];

    if(password.trim() == ""){

        errors.push("Password cannot be blank");
    }
    if(password.length > passwordMaxLength){
        errors.push("Password is " + password.length + " characters long. Max length is "+passwordMaxLength + " characters");
    }
    if(password.length < passwordMinLength){
        errors.push("Password is " + password.length + " characters long. It must be at least "+passwordMinLength + " characters");
    }

    return errors;
};

try{module.exports = UserValidation;} catch(err){}
