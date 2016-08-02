
$(document).ready(function () {
    (function (tb, $, undefined) {

        var log = new Logger('DEBUG');
        var template;

        $.notify.addStyle('userProfile', {
            html: "<div><span data-notify-html/></div>"
        });


        tb.dialogs.showUserProfile = function(userDto, el){

            if(template == null){
                template = Handlebars.compile($("#userProfilePartial").html());
            }
            var context = {};
            context.userDto = userDto;
            log.debug('template: ' + template(context));
            //$('#userProfileBody').html(template(context));


            $(el).notify(template(context),{style: 'userProfile', autoHide:false, position:'bottom left'});
        };

        tb.dialogs.saveUser = function(){

            console.log("enter saveUserBtn.click, tags: " + JSON.stringify($("#tags").val()));

            var user = new UserDto();
            user.firstName = $("#firstName").val();
            user.lastName = $("#lastName").val();
            user.email = $("#email").val();
            user.userName = $("#userName").val();
            user.password = $("#password").val();
            user.id = $("#id").val();
            user.socialId = $("#socialId").val();
            user.tags = $("#tags").val();
            user.profilePic = $("#profilePic").val();

            var fileUploaded=false;
            var errors = [];
            errors = UserValidation.validateUser(user);
            errors = errors.concat(TagValidation.validate(user.tags));

            if(errors.length){

                var message = "There were errors with your submission:\n * "+errors.join("\n * ");

                $.notify(message, {autoHide: false, arrowShow:true, className: 'error'});
            }
            else{
                var formData = new FormData();
                formData.append("user", JSON.stringify(user));

                if(document.getElementById("profileImg").files[0]) {
                    formData.append("profileImage", document.getElementById("profileImg").files[0], document.getElementById("profileImg").files[0].name);
                    fileUploaded=true;
                }

                $.ajax({
                    method: "POST",
                    cache: false,
                    contentType: false,
                    processData: false,
                    url: "/user/save",
                    data: formData,
                    success : function(data){

                        if(data.errors.length){
                            var message = "There were errors with your submission:\n * "+data.errors.join("\n * ");
                            //NotificationUtil.error(message);
                            $.notify(message, {autoHide: false, arrowShow:true, className: 'error'});
                            fileUploaded=false;
                        }
                        else{

                            if($("#id").val().length){
                                // NotificationUtil.success("Your profile has been updated.");
                                $.notify('Your profile has been updated.', 'success');

                                if(fileUploaded){
                                    document.getElementById("displayProfilePic").src = '/img/loading.gif';
                                    setTimeout(function(){
                                        document.getElementById("displayProfilePic").src = tb.CDN +'/users/profile/'+data.user.profilePic+'?ts='+Date.now();
                                    },2000);
                                    document.getElementById("profileImg").value=null;
                                    fileUploaded=false;
                                }

                            }
                            else{
                                NotificationUtil.success("Your profile has been created.");
                                $("#id").val(data.user.id);
                            }

                        }


                    },
                    error : function(error){

                        NotificationUtil.error("There was an error processing your submission: " + error);

                    }
                });

            }
        };



    }(window.tb = window.tb || {}, jQuery));
});
