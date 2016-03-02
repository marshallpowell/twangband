var SongValidation = {};


SongValidation.validateUiFormData = function(name, divId){

    var errors = SongValidation.validateSongFieldData(name);

    if(errors.length){
        NotificationUtil.error(errors.join("\n<br/> * "), true, divId);
        return false;
    }
    else{
        return true;
    }
};

SongValidation.validateSongFieldData = function(name){

    var errors = [];

    if(name.trim() == ""){

        errors.push("Name cannot be blank");
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
