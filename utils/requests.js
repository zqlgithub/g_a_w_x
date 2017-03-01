var conf = require('../config.js')
var util = require('util.js')

function get(obj){
  obj.method = 'GET'
  req(obj)
}

function post(obj){
  obj.method = 'POST'
  req(obj)
}

function req(obj) {
  obj.url = conf.server_url + obj.url
  obj.header = {
    'content-type': 'application/x-www-form-urlencoded'
  }
  try {
    var sessionid = wx.getStorageSync('sessionid')
    if (sessionid) {
        obj.header['authorization'] = sessionid
    }
  } catch (e) {
  }

  // 获取原来的callback
  var to_success = obj.success
  var to_fail = obj.fail || function(resp) {
    console.log('to fail')
    if(resp.code && resp.code == 9){
      wx.showModal({
        title: "提示",
        content: resp.msg,
        showCancel: true,
        confirmText: '马上创建',
        success: function(resp) {
          if(resp.confirm){
            wx.redirectTo({
              url: '/pages/group/group_list'
            })
          }
        }
      })
    }else{
      wx.showToast({
        title: resp.msg || resp.errmsg
      })
    }
  }
  obj.success = function(res){
    if(res.data.code == 0){
      to_success(res.data)
    } else{
      console.log('业务请求失败: ' + obj.url)
      if(to_fail)
        to_fail(res.data)
    }
  }

  obj.fail = function(res) {
    console.log('网络请求失败: ' + obj.url, res)
    if(to_fail){
        to_fail({
        errcode: 1,
        errmsg: '网络请求失败'
      })
    }
    
  }
  // console.log('TO REQUEST...')
  // console.log(obj)
  wx.request(obj)
}

module.exports = {
  get: get,
  post: post
}