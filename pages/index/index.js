//index.js
//获取应用实例
var requests = require('../../utils/requests.js')
var upyun = require('../../utils/upyun.js')

var app = getApp()
Page({
  data: {
    motto: '这一刻，留住我们的感动',
    userInfo: null
  },
  init: function() {
    var that = this
    wx.showNavigationBarLoading()
    app.getUserInfo(function(userInfo){
      wx.hideNavigationBarLoading()

      //更新数据
      that.setData({
        userInfo:userInfo
      })

      // wx.redirectTo({
      //   url: '../slider/slider'
      // })

      wx.redirectTo({
        url: '../group/group_list'
      })
    })
  },

  onLoad: function () {
  },

  onReady:function(){
    // 页面渲染完成
  },
  onShow:function(){
    if(!this.inited){
      this.inited = true
      this.init()
    }
  },
  onHide:function(){
    this.inited = false
  },
  onUnload:function(){
  },
})
