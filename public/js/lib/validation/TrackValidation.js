var TrackValidation = {};

TrackValidation.validate = function(trackDto){


    var errors = [];
    var name = (trackDto && trackDto.name)? trackDto.name.trim() : '';
    var description = (trackDto && trackDto.description) ? trackDto.description.trim() : '';

    var nameMaxLength = 50;
    var descMaxLength = 500;

    if(name == ""){

        errors.push("Name cannot be blank");
    }
    if(name.length > nameMaxLength){
        errors.push("Name is " + name.length + " characters long. Max length is "+nameMaxLength + " characters");
    }
    if(description.length > descMaxLength){
        errors.push("Description is " + description.length + " characters long. Max length is "+descMaxLength+ " characters");
    }

    return errors;
};

try{module.exports = TrackValidation;} catch(err){}

