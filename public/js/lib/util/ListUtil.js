
var LIST_DATA = {};
ListUtil = {};
/**
 *
 * @param type - The type of list data you want returned
 * @param mylist - The list array variable you want populated
 */
ListUtil.initListData = function(type, mylist){

    if(LIST_DATA[type] != null){
        mylist = LIST_DATA[type];
    }
    else{

        $.ajax({
            url: '/listData?type='+type,
            cache: false,
            type: 'GET',
            success: function(data){
                console.log(data);
                LIST_DATA[type] = data;

            }
        });
    }
}
