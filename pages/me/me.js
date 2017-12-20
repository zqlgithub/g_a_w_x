// pages/me/me.js
const util = require('../../utils/util.js')
var upyun = require('../../utils/upyun.js')
var requests = require('../../utils/requests.js')

var app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: undefined,
    nickName:'',
    editing:false
  },
  editNickName:function(){
    if(!this.data.editing){
      this.setData({
        nickName: this.data.userInfo.name
      });
    }
    this.setData({
      editing: !this.data.editing
    });
  },
  bindInput:function(e){
    var val = e.detail.value;
    this.setData({
      nickName:val
    });
  },
  confirmNickName: function(){
    var self = this;
    if(!this.data.nickName){
      wx.showToast({
        title: '请输入昵称',
        icon: 'danger'
      });
      return;
    }
    requests.post({
      url: '/user/update',
      data: {
        name: this.data.nickName
      },
      success: function (resp) {
        console.log(resp);

        wx.hideLoading();
        // debugger;
        var userInfo = self.data.userInfo;
        userInfo.name = self.data.nickName
        self.setData({
          userInfo,
          editing:false
        });
        app.globalData.userInfo = userInfo;

      },
      fail: function (resp) {
        console.log('UPLOAD FAILLLLL!')
        wx.hideLoading();
        // self.removePhoto(group_id, temp_id)
        if (resp.msg != null) {
          wx.showToast({
            title: resp.msg
          })
        }
      }
    });
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
        // debugger;
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
  // 响应点击添加封面的事件
  onSetAvatar: function (e) {

    debugger;
    var self = this;

    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        // success
        console.log('SELECT PHOTO SUCCESS')
        console.log(res)
        self.uploadAvatar(res.tempFilePaths[0]);
      }
    })
  },
  // 上传封面照片
  uploadAvatar: function (file_path) {
    var self = this
    debugger;
    var temp_id = 'upload_' + String(Date.now())
    wx.showLoading({
      title: '上传头像中...',
    });
    // this.addPhoto(group_id, temp_id, file_path, true)
    upyun.upload({
      file_path: file_path,
      data: {
      },
      success: function (resp) {
        var data = resp.data
        requests.post({
          url: '/user/avatar/update',
          data: {
            photo_url: data.url,
            upload_data: JSON.stringify(data)
          },
          success: function (resp) {
            console.log(resp);

            wx.hideLoading();
            // debugger;
            var userInfo = self.data.userInfo;
            userInfo.avatar = resp.data.url
            self.setData({
              userInfo
            });
            app.globalData.userInfo = userInfo;
          },
          fail: function (resp) {
            console.log('UPLOAD FAILLLLL!')
            wx.hideLoading();
            // self.removePhoto(group_id, temp_id)
            if (resp.msg != null) {
              wx.showToast({
                title: resp.msg
              })
            }
          }
        });
      },
      fail: function (resp) {
        console.log('UPLOAD FAILLLLL!')
        // self.removePhoto(group_id, temp_id)
        wx.hideLoading();
        if (resp.msg && resp.msg != null) {
          wx.showToast({
            title: resp.msg
          })
        }
      }
    })
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
    // debugger;
    var res = wx.getSystemInfoSync();
    console.log(res);
    var data = {
      osVersion: res.system,
      os: res.brand,
      clientVersion: res.SDKVersion,
      customInfo: this.data.userInfo.id + "|" + this.data.userInfo.name
    };
    wx.getNetworkType({
      success: function (res) {
        data.netType = res.networkType;
        console.log(data);
        wx.navigateToMiniProgram({
          appId: 'wx8abaf00ee8c3202e',
          extraData: {
            id: '19850',
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