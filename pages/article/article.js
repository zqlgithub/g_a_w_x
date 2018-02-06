// pages/article/article.js
const md = require('../../utils/md.js');
var requests = require('../../utils/requests.js')
var util = require('../../utils/util.js')

var app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: undefined,
    userInfo: undefined,
    content: [],
    time:undefined,
    article: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      id: options.id
    });
    wx.showLoading({
      title: '加载中',
    });
    this._init();
    // var s = wx.getSystemInfoSync();
    // this.setData({
    //   availableHeight: s.windowHeight
    // });
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
    var ret = {
      title: this.data.userInfo.nickName + "邀请你一起阅读《" + this.data.pageName + "》"
    };
    return ret;
  },
  _initContent: function (content, index, cb) {
    if (!content[index]) {
      console.log("done");
      // cb(content);
      return;
    }
    var self = this;
    var item = content[index];
    if (item[0] == 'para' && item[1] && item[1][0] == 'inlinecode') {
      var msg = item[1][1];
      var msgArr = msg.split('=');
      if (msgArr[0] == 'showcard') {

      } else if (msgArr[0] == 'showactivity') {
        new AV.Query('CardActivity').get(msgArr[1]).then(activity => {
          content[index].push({
            'activity': activity,
            'type': 'activity'
          });
          self._initContent(content, index + 1, cb);
        });
      } else {
        self._initContent(content, index + 1, cb);
      }
    } else {
      self._initContent(content, index + 1, cb);
    }
  },
  _init: function () {
    var self = this;
    requests.get({
      url: '/user/billboard/detail',
      data: {
        id: this.data.id
      },
      success: function (resp) {
        self.setData({
          article:resp.data,
          content: md.parse(resp.data.page),
          time: util.formatTime2 (new Date(resp.data.createTime * 1000))
        });
        wx.setNavigationBarTitle({
          title: resp.data.title,
        })
        wx.hideLoading();
        // self._initContent(resp.data.page);
        // debugger;
      }
    })
  },
  
})