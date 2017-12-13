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
      loading:true,
      userInfo:undefined,
      group_id:undefined,
      live_mode:true,
      live_member_count:1,
      member_count:1,
      is_master:false,
      name:'',

      co_edit:true,
      cover_pic:undefined,
      newPhotoNum: 0,
      showNewPhotoNum:false,
      photos:[],
      theme:{
      },
      showAllMember:false,
      mode:{
        value:"new",
        text:"最新"
      },
      memberPagination:undefined,
      photoPagination: undefined,
      members:[
        // {
        //   avatarUrl:"https://wx.qlogo.cn/mmopen/vi_32/hROB0xxrKibCEsLkSUgxOFL0Fp4K1ib0szicSicqTH04fwsXFibfuuqVHWnb6o8rSYtzYKCg4pE8kic7VNhtlEW34kew/0",
        //   name:'泰迪'
        // },
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
      console.log('收到服务器内容：' + res.data);
      var ret = JSON.parse(res.data);
      if (ret.action=='enter_group'){
        //todo
        // debugger;
        var members = self.data.members;
        var member = {
          id: ret.data.id,
          name: ret.data.name,
          avatar: ret.data.avatar
        }
        members.unshift(member);
        self.setData({
          live_member_count: ret.data.live_member_count,
          member_count: ret.data.member_count,
          members: members
        });
      } else if (ret.action == 'send_photo'){
        // var photo = 
      } else if (ret.action == 'leave_group') {
        var members = self.data.members;
        // debugger;
        members = members.filter(function(v){
          return v.id != ret.data.id
        });
        self.setData({
          live_member_count: self.data.live_member_count - 1,
          members: members
        });

      }
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
    if (group_id) {
      console.log('打开相册 id ' + group_id)
      this.setData({
        group_id: group_id
      });
      self.init();
    }else{
      wx.showToast({
        title: '链接无效，稍后再试试？'
      })
      wx.navigateBack({
        delta: 1, // 回退前 delta(默认为1) 页面
        complete: function (res) {
          console.log('跳到相册详情失败，没有传入id参数')
        }
      });
    }
    if (options.action == 'join_group') {
      self.setData({
        invite_code: options.invite_code
      });
    }
  },
  init:function(){
    var self = this;
    app.getUserInfo(function (userInfo) {
      self.setData({
        userInfo: userInfo,
      });
      self.getGroupLiveData();
      self.getMemberList();
      self.getPhotos(true);
    })
    if(self.data.invite_code){
      self.joinGroup(self.data.invite_code);
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
    // debugger;
      wx.closeSocket()
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
    var userInfo = this.data.userInfo;
    var inviteCode = userInfo ? userInfo.invite_code : '';
    var o = {
      title: userInfo.nickName + '邀请你加入《' + this.data.name + "》相册",
      path: '/pages/group/group_list?action=join_group&id=' + this.data.group_id + '&invite_code=' + inviteCode+'&live=1'
    }
    if (this.data.cover_pic){
      o.imageUrl = this.data.cover_pic
    }
    return  o;
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
      url: '/album/group/detail?group_id=' + group_id,
      success: function (resp) {
        console.log('GET MEMBER LIST SUCCESS');
        // debugger;
        self.setData({
          // group_data: resp.data,
          name: resp.data.name,
          is_master: resp.data.master,
          member_count: resp.data.member_count,
          live_member_count: resp.data.live_member_count,
          group_id: resp.data.id,
          live_mode: resp.data.live_mode,
          cover_pic: resp.data.front_cover,
          co_edit: resp.data.co_edit,
        });
        setTimeout(function(){
          self.setData({
            loading:false
          });
        },10);
      },
      complete: function (e) {
      }
    })    
  },
  getMemberList:function(init){
    var group_id = this.data.group_id;
    var self = this;
    
    if(init){
      this.setData({
        memberPagination: null
      });
    }
    var page = this.data.memberPageNum;
    var param = {
      group_id: group_id,
      live: 1
    };
    if(page){
      param.pagination = page;
    }
    requests.get({
      url: '/album/group/member/list',
      data: param,
      success: function (res) {
        // debugger;
        self.setData({
          members:res.data,
          memberPageNum: res.data.length>0 ? res.data[res.data.length - 1].pagination : null
        });
      },
      fail: function (msg) {
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
            add_to:'live',
            photo_url: data.url,
            upload_data: JSON.stringify(data)
          },
          success: function (resp) {
            console.log(resp);
            debugger;
            wx.showToast({
              title: '上传图片成功',
            })
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
  // 上传封面照片
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
          url: '/album/photo/create',
          data: {
            group_id: group_id,
            add_to: 'cover',
            photo_url: data.url,
            upload_data: JSON.stringify(data)
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
  },
  joinGroup: function (invite_code){
    var self = this;
    console.log("joinGroup");
    console.log(self.data.group_id);
    console.log(invite_code);

    requests.post({
      url: '/album//group/join',
      data: {
        group_id: self.data.group_id ,
        invite_code: invite_code
      },
      success: function (res) {
        debugger;
        console.log(res);
      },
      fail: function (msg) {
        debugger;
        console.log(msg);
      }
    });
  },
  getPhotos:function(init){
    var self = this;
    var param = {
      order: this.data.mode.value,
      group_id: this.data.group_id
    }
    if(init){
      this.setData({
        photoPagination:null,
        photos:[]
      });
    }

    if(this.data.photoPagination){
      param.pagination = this.data.photoPagination
    }

    requests.get({
      url: '/album/group/photo/list',
      data: param,
      success: function (resp) {
        console.log('GET MEMBER LIST SUCCESS');
        // debugger;
        self.setData({
          photoPagination: resp.data.length > 0 ? resp.data[resp.data.length - 1].pagination : null,
          photos:resp.data
        });
      },
      complete: function (e) {
      }
    }) 
  }
})