
var UserValidation = {}

UserValidation.validateUser = function(user){

    var errors = [];

    if(user.firstName.trim() == ""){

        errors.push("First name cannot be blank");
    }
    if(user.lastName.trim() == ""){

        errors.push("Last name cannot be blank");
    }
    if(user.email.trim() == ""){

        errors.push("Email cannot be blank");
    }
    if(!user.id && user.password.trim() == ""){

        errors.push("Password cannot be blank");
    }
    else if(user.confirmPassword != user.password){
        errors.push("Passwords must match, password: " + user.password + ", cp: " + user.confirmPassword);
    }

    return errors;
}

try{module.exports = UserValidation;} catch(err){}
