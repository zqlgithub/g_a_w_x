var conf = require('../config.js')
var util = require('util.js')

var url = conf.websocket_url;

var connect = function (group_id){

  var sessionid = wx.getStorageSync('sessionid');

  wx.connectSocket({
    url: url + '/ws/group/live?group_id=' + group_id,
    data: {
      group_id: group_id
    },
    header: {
      'authorization': sessionid,
      'content-type': 'application/json'
    },
    method: "GET",
    success:function(data){
      // debugger;
    },fail:function(err){
      // debugger
    }
  });
}



module.exports = {
  connect
}