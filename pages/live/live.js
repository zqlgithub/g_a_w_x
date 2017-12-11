// pages/live/live.js
var requests = require('../../utils/requests.js')
var util = require('../../utils/util.js')
var upyun = require('../../utils/upyun.js')
var events = require('../../utils/events.js')
var websocket = require('../../utils/websocket.js');

var app = getApp()

var socketOpen = false;
var socketMsgQueue = [];

Page({

  /**
   * 页面的初始数据
   */
  data: {
      userInfo:undefined,
      group_id:undefined,
      live_mode:true,
      live_member_count:1,
      member_count:1,
      is_master:true,
      name:'',

      co_edit:true,
      cover_pic:undefined,
      newPhotoNum: 0,
      showNewPhotoNum:false,
      photos:[],
      loading:false,
      theme:{
      },
      showAllMember:false,
      mode:{
        value:"new",
        text:"最新"
      },
      members:[
        {
          avatarUrl:"https://wx.qlogo.cn/mmopen/vi_32/hROB0xxrKibCEsLkSUgxOFL0Fp4K1ib0szicSicqTH04fwsXFibfuuqVHWnb6o8rSYtzYKCg4pE8kic7VNhtlEW34kew/0",
          name:'泰迪'
        },
        {
          avatarUrl: "https://wx.qlogo.cn/mmopen/vi_32/hROB0xxrKibCEsLkSUgxOFL0Fp4K1ib0szicSicqTH04fwsXFibfuuqVHWnb6o8rSYtzYKCg4pE8kic7VNhtlEW34kew/0",
          name: '泰迪'
        },
        {
          avatarUrl: "https://wx.qlogo.cn/mmopen/vi_32/hROB0xxrKibCEsLkSUgxOFL0Fp4K1ib0szicSicqTH04fwsXFibfuuqVHWnb6o8rSYtzYKCg4pE8kic7VNhtlEW34kew/0",
          name: '泰迪'
        },
        {
          avatarUrl: "https://wx.qlogo.cn/mmopen/vi_32/hROB0xxrKibCEsLkSUgxOFL0Fp4K1ib0szicSicqTH04fwsXFibfuuqVHWnb6o8rSYtzYKCg4pE8kic7VNhtlEW34kew/0",
          name: '泰迪'
        },
        {
          avatarUrl: "https://wx.qlogo.cn/mmopen/vi_32/hROB0xxrKibCEsLkSUgxOFL0Fp4K1ib0szicSicqTH04fwsXFibfuuqVHWnb6o8rSYtzYKCg4pE8kic7VNhtlEW34kew/0",
          name: '泰迪'
        },
        {
          avatarUrl: "https://wx.qlogo.cn/mmopen/vi_32/hROB0xxrKibCEsLkSUgxOFL0Fp4K1ib0szicSicqTH04fwsXFibfuuqVHWnb6o8rSYtzYKCg4pE8kic7VNhtlEW34kew/0",
          name: '泰迪'
        },
        {
          avatarUrl: "https://wx.qlogo.cn/mmopen/vi_32/hROB0xxrKibCEsLkSUgxOFL0Fp4K1ib0szicSicqTH04fwsXFibfuuqVHWnb6o8rSYtzYKCg4pE8kic7VNhtlEW34kew/0",
          name: '泰迪'
        },
        {
          avatarUrl: "https://wx.qlogo.cn/mmopen/vi_32/hROB0xxrKibCEsLkSUgxOFL0Fp4K1ib0szicSicqTH04fwsXFibfuuqVHWnb6o8rSYtzYKCg4pE8kic7VNhtlEW34kew/0",
          name: '泰迪'
        },
        {
          avatarUrl: "https://wx.qlogo.cn/mmopen/vi_32/hROB0xxrKibCEsLkSUgxOFL0Fp4K1ib0szicSicqTH04fwsXFibfuuqVHWnb6o8rSYtzYKCg4pE8kic7VNhtlEW34kew/0",
          name: '泰迪'
        },
        {
          avatarUrl: "https://wx.qlogo.cn/mmopen/vi_32/hROB0xxrKibCEsLkSUgxOFL0Fp4K1ib0szicSicqTH04fwsXFibfuuqVHWnb6o8rSYtzYKCg4pE8kic7VNhtlEW34kew/0",
          name: '泰迪'
        },
      ]
  },
  sendSocketMessage: function(msg) {
    if(socketOpen) {
      // debugger;
      wx.sendSocketMessage({
        data: msg,
        success:function(e){
          // debugger;
        },
        fail:function(e){
          // debugger;
        }
      })
    } else {
      // debugger;
      socketMsgQueue.push(msg)
    }
  },

  websocketHandle: function (group_id){
    var self = this;
    websocket.connect(group_id);
    
    wx.onSocketMessage(function (res) {
      // debugger;
      console.log('收到服务器内容：' + res.data)
    });

    wx.onSocketOpen(function (res) {
      console.log('WebSocket连接已打开！')
      socketOpen = true;
      // debugger;
      for (var i = 0; i < socketMsgQueue.length; i++) {
        self.sendSocketMessage(socketMsgQueue[i])
      }
      socketMsgQueue = []
    });

    
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this
    var group_id = options.id;

    this.websocketHandle(group_id);
    // wx.showToast({
    //   title: "加载中",
    //   icon: "loading",
    //   duration: 100000
    // });

    if (group_id) {
      console.log('打开相册 id ' + group_id)
      this.setData({
        group_id: group_id
      });

      app.getUserInfo(function (userInfo) {
        self.setData({
          userInfo: userInfo,
        });
        // debugger;
        self.sendSocketMessage({
          "action": "enter_group",  // 表示本次协议的动作
          "data": {
            "id": userInfo.id,
            "name": userInfo.nickName,
            "avatar": userInfo.avatarUrl
          },
          "msg": userInfo.nickName + "加入了相册"
        });
        self.getGroupLiveData()
      })

    } else {
      wx.showToast({
        title: '链接无效，稍后再试试？'
      })
      wx.navigateBack({
        delta: 1, // 回退前 delta(默认为1) 页面
        complete: function (res) {
          console.log('跳到相册详情失败，没有传入id参数')
        }
      })
    }

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

  setMode:function(){
      var mode = this.data.mode;
      if(mode.value=="new"){
        this.setData({
          mode:{
            "value":"hot",
            "text":"最热"
          }
        });
        wx.showToast({
          title: '热门的在前面',
        });
      }else{
        this.setData({
          mode: {
            "value": "new",
            "text": "最新"
          }
        });
        wx.showToast({
          title: '刚发布的在前面',
        });
      }
  },
  getGroupLiveData: function () {
    var group_id = this.data.group_id;
    var self = this;
    requests.get({
      url: '/album/group/live',
      data: {
        group_id: group_id,
      },
      success: function(res){
        debugger;
          self.setData({
            live_member_count: res.data.live_member_count,
            member_count: res.data.member_count,
            name: res.data.name,
            group_id: res.data.id,
            live_mode: res.data.live_mode,
            loading:false
          });
          // if(self.data.userInfo.id == res.data.)
          wx.setNavigationBarTitle({
            title: res.data.name,
          });
      },
      fail: function(msg){
        debugger;
      }
    });
    
  },
  // 响应点击添加照片的事件
  onAddPhoto: function (e) {
    if (!this.data.is_master && !this.data.co_edit) {
      wx.showToast({
        title: '群主设置了权限，您暂时不能上传照片哦',
      })
      return
    }

    var self = this
    var group_id = this.data.group_id;

    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        // success
        console.log('SELECT PHOTO SUCCESS')
        console.log(res)
        for (var i = 0; i < res.tempFilePaths.length; i++) {
          self.uploadPhoto(group_id, res.tempFilePaths[i])
        }
      }
    })
  },
  // 上传单张照片
  uploadPhoto: function (group_id, file_path) {
    var self = this
    var temp_id = 'upload_' + String(Date.now())

    // this.addPhoto(group_id, temp_id, file_path, true)
    upyun.upload({
      file_path: file_path,
      data: {
        group_id: group_id
      },
      success: function (resp) {
        var data = resp.data
        requests.post({
          url: '/album/photo/create',
          data: {
            group_id: group_id,
            photo_url: data.url,
            upload_data: JSON.stringify(data)
          },
          success: function (resp) {
            console.log(resp)
            
          },
          fail: function (resp) {
            console.log('UPLOAD FAILLLLL!')
            // self.removePhoto(group_id, temp_id)
            if (resp.msg != null) {
              wx.showToast({
                title: resp.msg
              })
            }
          }
        })
      },
      fail: function (resp) {
        console.log('UPLOAD FAILLLLL!')
        // self.removePhoto(group_id, temp_id)
        if (resp.msg && resp.msg != null) {
          wx.showToast({
            title: resp.msg
          })
        }
      }
    })
  },
  // 响应点击添加封面的事件
  onSetFrontPic: function (e) {
    debugger;
    if (!this.data.is_master) {
      return
    }

    var self = this
    var group_id = this.data.group_id;

    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        // success
        console.log('SELECT PHOTO SUCCESS')
        console.log(res)
        self.uploadFrontPic(group_id, res.tempFilePaths[0]);
      }
    })
  },
  // 上传单张照片
  uploadFrontPic: function (group_id, file_path) {
    var self = this
    var temp_id = 'upload_' + String(Date.now())
    wx.showLoading({
      title: '设置封面中...',
    });
    // this.addPhoto(group_id, temp_id, file_path, true)
    upyun.upload({
      file_path: file_path,
      data: {
        group_id: group_id
      },
      success: function (resp) {
        var data = resp.data
        requests.post({
          url: '/album/group/update',
          data: {
            id: group_id,
            cover_url: data.url
          },
          success: function (resp) {
            console.log(resp);
            
            wx.hideLoading();
            debugger;
            self.setData({
              cover_pic: data.url
            })
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
        })
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
  onTapSettings: function (e) {
    var curr_group_id = this.data.group_id;
    var is_master = this.data.is_master ? 1 : 0
    wx.navigateTo({
      url: '../group/group_settings/group_settings?id=' + curr_group_id + '&is_master=' + is_master
    });
  },
  showMembers:function(){
    // debugger;
    if (this.data.showAllMember) {
      this.setData({
        showAllMember: false
      });
    }else{
      this.setData({
        showAllMember: true
      });
    }
  },
  tapMask:function(){
    if (this.data.showAllMember){
      this.setData({
        showAllMember:false
      });
    }
  }
})