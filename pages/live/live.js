// pages/live/live.js
var requests = require('../../utils/requests.js')
var util = require('../../utils/util.js')
var upyun = require('../../utils/upyun.js')
var events = require('../../utils/events.js')
var websocket = require('../../utils/websocket.js');

var app = getApp()

var socketOpen = false;
var socketMsgQueue = [];

var loadingMorePhoto = false;

var loadingMoreMembers = false;
// var members = [
//   {
//     role: 1,
//     avatar: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     name: 'Ted阿恒泰迪',

//     id: 4,

//     avatar_thumbnail: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     live: true,
//     pagination: [0]
//   },
//   {
//     role: 1,
//     avatar: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     name: 'Ted阿恒泰迪',

//     id: 4,

//     avatar_thumbnail: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     live: true,
//     pagination: [0]
//   },
//   {
//     role: 1,
//     avatar: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     name: 'Ted阿恒泰迪',

//     id: 4,

//     avatar_thumbnail: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     live: true,
//     pagination: [0]
//   }, {
//     role: 1,
//     avatar: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     name: 'Ted阿恒泰迪',

//     id: 4,

//     avatar_thumbnail: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     live: true,
//     pagination: [0]
//   }, {
//     role: 1,
//     avatar: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     name: 'Ted阿恒泰迪',

//     id: 4,

//     avatar_thumbnail: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     live: true,
//     pagination: [0]
//   }, {
//     role: 1,
//     avatar: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     name: 'Ted阿恒泰迪',

//     id: 4,

//     avatar_thumbnail: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     live: true,
//     pagination: [0]
//   }, {
//     role: 1,
//     avatar: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     name: 'Ted阿恒泰迪',

//     id: 4,

//     avatar_thumbnail: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     live: true,
//     pagination: [0]
//   }, {
//     role: 1,
//     avatar: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     name: 'Ted阿恒泰迪',

//     id: 4,

//     avatar_thumbnail: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     live: true,
//     pagination: [0]
//   }, {
//     role: 1,
//     avatar: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     name: 'Ted阿恒泰迪',

//     id: 4,

//     avatar_thumbnail: 'https://wx.qlogo.cn/mmopen/vi_32/w8ibVjVnu6Fus9uPlbnjZujUuqO5fJNTnwJyEMrl2AOqteSvJ3V5tfQqYOian22ia93Ryc9vxsQzjYnr4VGVyFWvg/0',
//     live: true,
//     pagination: [0]
//   },
// ];

Page({

  /**
   * 页面的初始数据
   */
  data: {
      loading:true,
      loadAll:false,
      userInfo:undefined,
      group_id:undefined,
      live_album_id:undefined,
      live_mode:true,
      live_member_count:1,
      member_count:1,
      is_master:false,
      name:'',
      scroll_height:undefined,

      co_edit:true,
      cover_pic:undefined,
      newPhotoNum: 0,
      showNewPhotoNum:false,
      photos:[],
      photosLeft:[],
      photosRight:[],
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
      ],
      isInTop:true,
      lastAddPosition:'Right',
      waitingAddNewPhotos:[],
      scrollTop:0
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
        var photo = ret.data;
        self.addNewPhoto(photo);
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

    try {
      var res = wx.getSystemInfoSync()
      var scroll_height = Math.floor(750 * res.windowHeight / res.windowWidth);
      this.setData({
        scroll_height: scroll_height,
      })
    } catch (e) {
      // Do something when catch error
    }


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
      self.getMemberList(true);
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
    wx.stopPullDownRefresh();
    this.getPhotos(true);
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
      title: userInfo.name + '邀请你加入《' + this.data.name + "》相册",
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
      this.getPhotos(true);
      var self = this;
      wx.pageScrollTo({
        scrollTop: 0
      })
      
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
          live_album_id: resp.data.live_album_id,
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
  loadMoreOnlineMember:function(){
    this.getMemberList()
  },
  getMemberList:function(init){
    var group_id = this.data.group_id;
    var self = this;
    
    if (loadingMoreMembers){
      return;
    }
    loadingMoreMembers = true;
    if(init){
      this.setData({
        memberPagination: null,
        members:[]
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
    // debugger;
    // var themembers = self.data.members.concat(members).concat(members);
    // self.setData({
    //   members: themembers
    // });
    // loadingMoreMembers = false;

    requests.get({
      url: '/album/group/member/list',
      data: param,
      success: function (res) {
        // debugger;
    loadingMoreMembers = false
        self.setData({
          members: self.data.members.concat(res.data) ,
          memberPageNum: res.data.length>0 ? res.data[res.data.length - 1].pagination : null
        });
      },
      fail: function (msg) {
    loadingMoreMembers = false
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
            // debugger;
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
    // debugger;
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
            // debugger;
            self.setData({
              cover_pic: resp.data.url
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
        // debugger;
        console.log(res);
      },
      fail: function (msg) {
        // debugger;
        console.log(msg);
      }
    });
  },
  getPhotos:function(init,cb){
    // debugger;
    console.log('getPhotos');
    if (loadingMorePhoto) {
      return;
    }

    loadingMorePhoto = true;

    var self = this;
    var param = {
      order: this.data.mode.value,
      group_id: this.data.group_id
    }
    if(init){
      this.setData({
        photoPagination:null,
        photos:[],
        photosLeft:[],
        photosRight:[]
      });
    }

    if(this.data.photoPagination){
      param.pagination = this.data.photoPagination
    }

    requests.get({
      url: '/album/group/photo/list',
      data: param,
      success: function (resp) {
        // debugger;
        console.log('GET photo LIST SUCCESS');
        if (resp.data.length <= 0) {
          loadingMorePhoto = false;
          self.setData({
            loadAll: true
          });
          if (cb) {
            cb();
          }
          return
        }

        if(init){
          self.setData({
            photoPagination: resp.data.length > 0 ? resp.data[resp.data.length - 1].pagination : null,
            photos: resp.data
          });
          self.addToLeftOrRight(resp.data,function(){
            loadingMorePhoto = false;
            if (cb) {
              cb();
            }
          });
        }else{
          var photos = self.data.photos;
          
          photos = photos.concat(resp.data);
          self.setData({
            photoPagination: resp.data.length > 0 ? resp.data[resp.data.length - 1].pagination : null,
            photos: photos
          });
          self.addToLeftOrRight(resp.data, function () {
            loadingMorePhoto = false;
            if (cb) {
              cb();
            }
          });
        }
        
        
      },
      complete: function (e) {
      }
    }) 
  },
  addToLeftOrRight:function(photos, cb){
    var self = this;
    var photosLeft = self.data.photosLeft;
    var photosRight = self.data.photosRight;
    
    var addOne = function(index){
      if(index>=photos.length){
        console.log("done");
        self.setData({
          photosLeft,
          photosRight
        });
        if(cb){
          cb();
        }
        return;
      }

      if(photosLeft.length==0){
        console.log("left0");
        var photo = self._renderTime(photos[index]);
        photosLeft.push(photo);
        self.setData({
          photosLeft
        },function(){
            addOne(index + 1);
        });
      }else if(photosRight.length==0){
        console.log("right0");
        var photo = self._renderTime(photos[index]);
        photosRight.push(photo);
        self.setData({
          photosRight
        }, function () {
            addOne(index + 1);
        });
      } else if (photosLeft.length == 1) {
        console.log("left1");
        var photo = self._renderTime(photos[index]);
        photosLeft.push(photo);
        self.setData({
          photosLeft
        }, function () {
          addOne(index + 1);
        });
      } else if (photosRight.length == 1) {
        console.log("right1");
        var photo = self._renderTime(photos[index]);
        photosRight.push(photo);
        self.setData({
          photosRight
        }, function () {
          addOne(index + 1);
        });
      }else {
        wx.createSelectorQuery().selectAll('.flow-list').boundingClientRect(function(rects){
          var leftHeight = rects[0].height;
          var rightHeight = rects[1].height;
          
        if (leftHeight > rightHeight) {
          var photo = self._renderTime(photos[index]);
          photosRight.push(photo);
          console.log(index + "right|leftHeight=" + leftHeight + ";rightHeight=" + rightHeight);
          self.setData({
            photosRight
          }, function () {
            setTimeout(function () {
            addOne(index + 1);
            }, 100)
          })
        } else {
          console.log(index + "left|leftHeight=" + leftHeight + ";rightHeight=" + rightHeight);
          var photo = self._renderTime(photos[index]);
          photosLeft.push(photo);
          self.setData({
            photosLeft
          }, function () {
            setTimeout(function () {
            addOne(index + 1);
            }, 100)
          })
        }
    }).exec()
      }
    }

    addOne(0);
    
  },
  loadMorePhotos:function(){
    console.log("loadMorePhotos");
    this.getPhotos(false);
  },
  scrolling:function(e){
    var isInTop = this.data.isInTop;
    
    this.setData({
      scrollTop: e.detail.scrollTop
    });
    
    if (isInTop){
      if (e.detail.scrollTop > 100) {
        this.setData({
          isInTop:false,
          
        })
      }
      
      
    }else{
      if (e.detail.scrollTop < 100) {
        this.setData({
          isInTop: true
        });
      }
    }
  },
  addNewPhoto:function(image){
    if(this.data.isInTop){
      var lastPositon = this.data.lastAddPosition == 'Right' ? 'Left' :'Right';
      this.data['photos'+ lastPositon].unshift(image);
      this.setData({
        lastAddPosition: lastPositon,
      });
      if(lastPositon=='Right'){
        this.setData({
          photosRight: this.data['photos' + lastPositon],
        });
      }else{
        this.setData({
          photosLeft: this.data['photos' + lastPositon],
        });
      }
    } else {
      var waitingAddNewPhotos = this.data.waitingAddNewPhotos;
      waitingAddNewPhotos.unshift(image);
      this.setData({
        waitingAddNewPhotos
      });
    }
  },
  addWaitingPhotos:function(){
    var waitingAddNewPhotos = this.data.waitingAddNewPhotos;
    if(waitingAddNewPhotos.length==0){
      return
    }
    var left = this.data.photosLeft;
    var right = this.data.photosRight;
    waitingAddNewPhotos.map(function(v,k){
      if(k%2==0){
        left.unshift(v);
      }else{
        right.unshift(v);
      }
    });
    this.setData({
      waitingAddNewPhotos:[],
      photosLeft:left,
      photosRight:right
    });
  },
  tapPhoto:function(e){
    // var 
    // debugger;
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/photo/photo_detail?live=1&album_id=' + this.data.live_album_id + '&init_photo=' + id + '&order='+ this.data.mode.value
    });
  },
  _renderTime:function(photo){
    var date = new Date(photo.createTime *1000);
    var now = new Date();
    if(now - date < 60*1000){
      photo.time = '刚刚';
    }else if(+now - (+date) < 60 * 60 * 1000){
      var rest = +now - (+date)/60000
      photo.time = rest +'分钟前'
    } else if (+now - (+date) < 24 * 60 * 60 * 1000 ){
      if(now.getDate()==date.getDate()){
        photo.time = (date.getHours() > 10 ? date.getHours() : '0' + date.getHours()) + ":" + (date.getMinutes() > 10 ? date.getMinutes() : '0' + date.getMinutes())
      }else{
        photo.time = '昨天' + (date.getHours() > 10 ? date.getHours() : '0' + date.getHours()) + ":" + (date.getMinutes() > 10 ? date.getMinutes() : '0' + date.getMinutes())
      }
    } else {
      photo.time = util.formatTime2(date);
      // photo.time = (date.getMonth() > 10 ? date.getMonth() : '0' + date.getMonth()) + "-" + (date.getDate() > 10 ? date.getDate() : '0' + date.getDate())
    }
    return photo;
  }
})