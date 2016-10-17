function LikeContentDto(userId, likesContent, entityId, entityType, count, dateCreated){

    this.userId = userId;
    this.like = likesContent;
    this.entityId = entityId;
    this.entityType = entityType;
    this.count = count;
    this.dateCreated = dateCreated;

}

try{module.exports = LikeContentDto;} catch(err){}
