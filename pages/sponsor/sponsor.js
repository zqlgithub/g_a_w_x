// pages/sponsor/sponsor.js
var requests = require('../../utils/requests.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id:undefined,
    sponsor:{
      // covers:[
      //   'http://ac-dxntna3i.clouddn.com/057030de43b41435e3f9.jpeg',
      //   'http://ac-dxntna3i.clouddn.com/c7e5b9c63577a70844c2.png',
      //   'https://dn-dxntna3i.qbox.me/96477da7e95c77ca3b71.png'
      // ],
      // name:'泰迪',
      // logo:'http://ac-dxntna3i.clouddn.com/eb8f0d3f9ab14d2fe01f.png',

      // desc:'我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述',
      // content: [{
      //   "contentType": "text",
      //   "content": "我说你是不是傻"
      // }, {
      //   "contentType": "img",
      //   "content": "http://ac-dxntna3i.clouddn.com/2748cb406933019b61d4.png"
      //   }, {
      //     "contentType": "text",
      //     "content": "我说你是不是傻2我说你是不是傻2我说你是不是傻2我说你是不是傻2我说你是不是傻2我说你是不是傻2"
      //   }, {
      //     "contentType": "img",
      //     "content": "http://ac-dxntna3i.clouddn.com/2748cb406933019b61d4.png"
      //   }]
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      id:options.id
    });
    this.getData(options.id);
  },
  getData:function(id){
    var self = this;
    requests.get({
      url: '/business/ad/detail',
      data: {
        id: id
      },
      success: function (resp) {
        var data = resp.data;
        // data.email = '123123123@qq.com';
        // data.weixin = 'ysmlc'
        self.setData({sponsor:data});
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  call:function(){
    wx.makePhoneCall({
      phoneNumber: this.data.sponsor.phone
    })
  },
  copyEmail:function(){
    wx.setClipboardData({
      data: this.data.sponsor.email,
      success: function (res) {
        wx.showToast({
          title: '邮箱复制好了',
        })
      }
    })
  },
  copyWeixin: function () {
    wx.setClipboardData({
      data: this.data.sponsor.weixin,
      success: function (res) {
        wx.showToast({
          title: '微信号复制好了',
        })
      }
    })
  },
  preview:function(e){
    var index = e.currentTarget.dataset.idx;
    wx.previewImage({
      current: this.data.sponsor.covers[index], // 当前显示图片的http链接
      urls: this.data.sponsor.covers // 需要预览的图片http链接列表
    })
  }
})