
$(document).ready(function () {
    (function (tb, $, undefined) {

        var log = new Logger('DEBUG');
        var template = null;

        tb.dialogs.showUserProfile = function(userDto){

            log.debug('enter showUserProfile with: ' + JSON.stringify(userDto));

            if(template == null){
              template = Handlebars.compile($("#userProfilePartial").html());
            }
            var context = {};
            context.userDto = userDto;
            log.debug('template: ' + template(context));
            $('#userProfileBody').html(template(context));
            $('#userProfileDialog').modal('toggle');

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

            errors=[];
           // var errors = UserValidation.validateUser(user);

            if(errors.length){

                var message = "There were errors with your submission:\n * "+errors.join("\n * ");

                $.notify(message, {autoHide: false, arrowShow:true, className: 'error'});
            }
            else{
                var formData = new FormData();
                formData.append("user", JSON.stringify(user));

                if(document.getElementById("profileImg").files[0]) {
                    formData.append("profileImage", document.getElementById("profileImg").files[0], document.getElementById("profileImg").files[0].name);
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
                        }
                        else{

                            if($("#id").val().length){
                                // NotificationUtil.success("Your profile has been updated.");
                                $.notify('Your profile has been updated.', 'success');
                            }
                            else{
                                NotificationUtil.success("Your profile has been created. Click <b></b><a href='/login'>here</a></b> to sign in");
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
