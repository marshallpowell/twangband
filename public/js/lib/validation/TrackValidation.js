var TrackValidation = {};

TrackValidation.validateTrack = function(trackDto){

    var errors = [];

    if(trackDto.name.trim() == ""){
        errors.push("Name cannot be blank");
    }

    return errors;
};

try{module.exports = TrackValidation;} catch(err){}

