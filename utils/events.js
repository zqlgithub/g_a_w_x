
function event_center() {
    var event_cb_map = {}
    var target_id_list = []
    var uid = 0         

    function get_target_id(target){
        for(var i in target_id_list){
            if(target === target_id_list[i][0]){
                return target_id_list[i][1]
            }
        }
        target_id_list.push([target, uid])
        return uid++
    }

    return {
        dispatch: function(event_type, data=null) {
            if(!(event_type in event_cb_map)){
                event_cb_map[event_type] = {}
            }
            for(var key in event_cb_map[event_type]){
                for(var i in event_cb_map[event_type][key]){
                    event_cb_map[event_type][key][i](data)
                }
            }
        },
        listen: function(event_type, target, cb) {
            if(!(event_type in event_cb_map)){
                event_cb_map[event_type] = {}
            }
            var target_cb_map = event_cb_map[event_type]

            var target_id = get_target_id(target)
            if(!(target_id in target_cb_map)){
                target_cb_map[target_id] = []
            }
            target_cb_map[target_id].push(cb)
        },
        remove: function(event_type, target) {
            var target_id = get_target_id(target)
            if(target_id in event_cb_map[event_type]){
                delete event_cb_map[event_type][target_id]
            }
        },
        detail: function(){
            return event_cb_map
        }
    }
}

module.exports = {
    center: event_center()
}