$(document).ready(function () {

    (function (tb, $, undefined) {
        /**
         * http://appendto.com/2010/10/how-good-c-habits-can-encourage-bad-javascript-habits-part-1/
         * contains the functions to support the new song form dialog
         */

        var template = Handlebars.compile($("#mixerCollaboratorDialogPartial").html());
        var searchResultsTemplate = Handlebars.compile($("#mixerCollaboratorSearchResultPartial").html());
        var collaboratorsListTemplate = Handlebars.compile($("#songCollaboratorResultsPartial").html());
        var songDto = null;
        var user = null;
        var collaborators;
        var log = new Logger('DEBUG');

        tb.dialogs.mixer.openMixerCollaboratorDialog = function (mixerUser, mixerSongDto) {

            if(!SongValidation.isAdmin(mixerUser, mixerSongDto)){
                $.notify('You must be an admin to perform this action', 'error');
                return;
            }
            songDto = mixerSongDto;
            user = mixerUser;

            var context = {};
            context.songDto = songDto;


            //load collaborators
            var searchDto = new SearchCriteriaDto();
            searchDto.type = "USER_IDS";

            for(var i = 0; i < songDto.collaborators.length; i++){
                searchDto.userIds.push(songDto.collaborators[i].id);
            }

            //TODO we should load in the collaborator info server side
            $.ajax({
                url: '/search',
                data: JSON.stringify(searchDto),
                cache: false,
                contentType: 'application/json',
                processData: false,
                type: 'POST',
                success: function(data){
                    log.debug('found collaborators: '+ JSON.stringify(data));
                    collaborators = data;
                    context.collaborators=collaborators;
                    $('#mixerCollaboratorDialogBody').html(template(context));
                    $('#mixerCollaboratorDialog').modal('toggle');
                }
            });

            log.debug('open songDto.collaborators.length: ' + songDto.collaborators.length);
        };


        tb.dialogs.mixer.addCollaborator = function(userDto) {

            log.debug('enter chooseCollaborator with : ' + JSON.stringify(userDto));

            var collaborator = new SongCollaboratorDto();
            collaborator.id = userDto.id;
            collaborator.firstName = userDto.firstName;
            collaborator.lastName = userDto.lastName;
            collaborator.profilePic = userDto.profilePic;
            collaborator.roles.push(AppConstants.ROLES.ADD_TRACK);
            songDto.collaborators.push(collaborator);
            var context = {};
            context.collaborators = songDto.collaborators;

            $('#mixerCollaboratorsList').html(collaboratorsListTemplate(context));

        };

        tb.dialogs.mixer.removeCollaborator = function(userId){

            log.debug('enter removeCollaborator with id: ' + userId);

            log.debug('songDto.collaborators.length: ' + songDto.collaborators.length);

            for(var i=0; i < songDto.collaborators.length; i++){
                log.debug('songDto.collaborators[i].id: ' + songDto.collaborators[i].id);
                if(songDto.collaborators[i].id == userId){
                    songDto.collaborators.splice(i,1);
                    $("#mixerCollaborator_"+userId).remove();
                    log.debug('removed user from collaborators');
                    return;
                }
            }


        };

        tb.dialogs.mixer.searchCollaborators = function () {

            var searchDto = {
                type : "USER",
                keywords : document.getElementById("mixerCollaboratorDialogKeywords").value
            };

            $.ajax({
                url: '/search',
                data : JSON.stringify(searchDto),
                cache: false,
                contentType: 'application/json',
                processData: false,
                type: 'POST',
                success: function(data){
                    log.debug(JSON.stringify(data));
                    //display search results

                    var context = {};
                    context.users = data;

                    //fix data element name
                    $('#mixerCollaboratorDialogSearchUsersData').html(searchResultsTemplate(context));

                }
            });
        };

        tb.dialogs.mixer.saveCollaborators = function () {


            var errors = [];

            if (errors.length) {
                NotificationUtil.error(errors.join("\n<br/> * "), false, 'mixerCollaboratorDialogNotifications');
                return;
            }
            else {
                log.debug('songDto.collaborators.length: ' + songDto.collaborators.length);
                log.debug('mixer.currentSongDto.collaborators.length: ' + mixer.currentSongDto.collaborators.length);
                mixer.currentSongDto.collaborators = songDto.collaborators;

                log.debug('mixer.currentSongDto.collaborators.length after: ' + mixer.currentSongDto.collaborators.length);

                mixer.saveSong('mixerCollaboratorDialogNotifications');
                return;
            }
        };

    }(window.tb = window.tb || {}, jQuery));
});