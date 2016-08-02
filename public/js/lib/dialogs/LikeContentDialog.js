
$(document).ready(function () {
    (function (tb, $, undefined) {

        var log = new Logger('DEBUG');
        var template = Handlebars.compile($("#likesUserListPartial").html());
        var likeIconTemplate = Handlebars.compile($("#likeIconPartial").html());

        var buildElId = function(entityId, tagName){
            return '_'+entityId+'_'+tagName;
        };

        tb.dialogs.activities.toggleLike = function(entityId){

            log.debug('enter tb.dialogs.activities.toggleLike' );

            var likeContentDto = JSON.parse(document.getElementById(buildElId(entityId,'likeDto')).value);
            likeContentDto.like = (likeContentDto.like)? false : true; //toggle like

            $.ajax({
                method: "POST",
                cache: false,
                contentType: 'application/json',
                processData: false,
                url: "/likeContent",
                data: JSON.stringify(likeContentDto),
                success : function(data){

                    if(data.errors.length){
                        var message = "There were errors with your submission:\n * "+data.errors.join("\n * ");
                        $.notify(message, {autoHide: false, arrowShow:true, className: 'error'});
                    }
                    else{

                        console.log('received likeContentDto: ' + JSON.stringify(data));
                        var message = (data.result.count > 0)? '+' + data.result.count : '';

                        $('#'+buildElId(likeContentDto.entityId, 'likeInfo')).text(message);
                        $('#_'+data.result.entityId+'_likeLinkTxt').html((data.result.like)? '(unlike)' : 'like');
                        document.getElementById(buildElId(entityId,'likeDto')).value = JSON.stringify(data.result);

                    }

                },
                error : function(error){

                    NotificationUtil.error("There was an error processing your submission: " + error);

                }
            });


        };



        tb.dialogs.activities.showLikes = function(type, id){
            $.ajax({
                method: "GET",
                cache: true,
                url: "/getLikes?id="+id+"&type="+type+"&showUsers=true",
                success : function(data){

                    if(data.errors.length){
                        var message = "There were errors with your submission:\n * "+data.errors.join("\n * ");
                        $.notify(message, {autoHide: false, arrowShow:true, className: 'error'});
                    }
                    else{
                        log.debug('received like info: ' + JSON.stringify(data));

                        var context = {};
                        context.users = data.result;

                        $('#likesUserListDialogBody').html(template(context));
                        $('#likesUserListDialog').modal('toggle');
                    }

                },
                error : function(error){

                    NotificationUtil.error("There was an error processing your submission: " + error);

                }
            });
        };

        tb.dialogs.activities.addLikeButton = function(type, id, el){

            $.ajax({
                method: "GET",
                cache: true,
                url: "/getLikes?id="+id+"&type="+type,
                success : function(data){

                    if(data.errors.length){
                        var message = "There were errors with your submission:\n * "+data.errors.join("\n * ");
                        $.notify(message, {autoHide: false, arrowShow:true, className: 'error'});
                    }
                    else{
                        log.debug('received like info: ' + JSON.stringify(data));

                        var context = {};
                        context.likeDto = data.result;

                        $(el).html(likeIconTemplate(context));

                    }

                },
                error : function(error){

                    NotificationUtil.error("There was an error processing your submission: " + error);

                }
            });

        };


    }(window.tb = window.tb || {}, jQuery));
});
