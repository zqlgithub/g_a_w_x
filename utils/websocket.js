var conf = require('../config.js')
var util = require('util.js')

var url = 'wss://galbum.1yuanduomei.com';

var connect = function (group_id){

  var sessionid = wx.getStorageSync('sessionid');

  wx.connectSocket({
    url: url + '/test/ws/group/live?group_id=' + group_id,
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