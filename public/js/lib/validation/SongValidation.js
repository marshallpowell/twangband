var SongValidation = {};


SongValidation.validateUiFormData = function(name, divId){

    var errors = SongValidation.validate(name);

    if(errors.length){
        NotificationUtil.error(errors.join("\n<br/> * "), true, divId);
        return false;
    }
    else{
        return true;
    }
};

SongValidation.validate = function(songDto){

    var errors = [];
    var name = (songDto && songDto.name)? songDto.name.trim() : '';
    var description = (songDto && songDto.description) ? songDto.description.trim() : '';

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

SongValidation.isAdmin = function(userDto, songDto){

    //if unsaved song
    if(songDto == null){
        return false;
    }

    //song is already saved

    if(userDto == null){
        return false;
    }

    if(userDto.id == songDto.creatorId){
        return true;
    }

};

SongValidation.canAddTrack = function(userDto, songDto){

    //if unsaved song
    if(songDto == null){
        return true;
    }

    //song is already saved

    if(userDto == null){
        return false;
    }

    if(userDto.id == songDto.creatorId){
        return true;
    }

    if(songDto.collaborators.length > 0){
         var collaboratorDto = null;

        for(var i = 0; i < songDto.collaborators.length && collaboratorDto == null; i ++){
            if(userDto.id === songDto.collaborators[i].id){
                collaboratorDto = songDto.collaborators[i];
            }
        }

        if(collaboratorDto == null){
            return false;
        }


        if ( collaboratorDto.roles.indexOf(AppConstants.ROLES.ADD_TRACK) > -1 ){
            return true;
        }
    }


    return false;
};



try{module.exports = SongValidation;} catch(err){}
