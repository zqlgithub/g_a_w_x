// pages/me/me.js
const util = require('../../utils/util.js')

var app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: undefined,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var self = this;
    // debugger;
      app.getUserInfo(function () {
        self.setData({
          userInfo: app.globalData.userInfo
        });
      });
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
    return util.onShare();
  },
  tapFavorite: function () {
    app.globalData.activityKey = 'favorite';
    app.globalData.activityValue = true;
    wx.switchTab({
      url: '../activity/activitylist',
    });
  },
  tapFavoriteArticle: function () {
    wx.navigateTo({
      url: '../article/myarticlelist',
    });
  },
  tapTucao() {
    if (!wx.canIUse('navigateToMiniProgram')) {
      wx.showModal({
        title: '提示',
        confirmText: '好的',
        showCancel: false,
        content: '此版本小程序不支持此功能，请更新微信后再试：）',
      });
      return;
    }

    var res = wx.getSystemInfoSync();
    console.log(res);
    var data = {
      osVersion: res.system,
      os: res.brand,
      clientVersion: res.SDKVersion,
      customInfo: wx.getStorageSync('userInfo').wxapp_openid + "|" + wx.getStorageSync('userInfo').nickName
    };
    wx.getNetworkType({
      success: function (res) {
        data.netType = res.networkType;
        console.log(data);
        wx.navigateToMiniProgram({
          appId: 'wx8abaf00ee8c3202e',
          extraData: {
            id: '17684',
            customData: data
          },
          success() {
            // debugger;
          },
          fail() {
            // debugger;
          }
        })
      }
    });
  },
})