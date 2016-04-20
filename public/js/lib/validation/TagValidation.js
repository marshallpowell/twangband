var TagValidation = {};

TagValidation.validate = function(tags){

    console.log('tags: ' + tags);
    console.log('json tags: ' + JSON.stringify(tags));

    if(!tags){
        return [];
    }

    var maxTagLength = 50;
    var errors = [];
    var tag = '';

    for(var i = 0; i < tags.length; i++){

        tag = (tags[i])? tags[i].trim() : '';

        if(tag.length > maxTagLength){
            console.log("Tag: " + tag + " is " + tag.length + " characters long. Max length is "+maxTagLength+ " characters");
            errors.push("Tag: " + tag + " is " + tag.length + " characters long. Max length is "+maxTagLength+ " characters");
        }
    }

    return errors;
};

try{module.exports = TagValidation;} catch(err){}
