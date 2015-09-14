
var UserProfile = {};


UserProfile.saveUser = function(){

    console.log("enter saveUserBtn.click");

    var user = new UserDto();
    user.firstName = $("#firstName").val();
    user.lastName = $("#lastName").val();
    user.email = $("#email").val();
    user.userName = $("#userName").val();
    user.password = $("#password").val();
    user.confirmPassword = $("#confirmPassword").val();
    user.id = $("#id").val();

    var errors = UserValidation.validateUser(user);
    if(errors.length){

        var message = "there were errors with your submission:\n<br /> * "+errors.join("\n<br/> * ");

        NotificationUtil.error(message);
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

                NotificationUtil.success("Your profile has been created/updated. Click <b></b><a href='/login'>here</a></b> to sign in");
                $("#id").val(data.user.id);
            },
            error : function(error){

                NotificationUtil.error("There was an error processing your submission: " + error);

            }
        });

    }
}
