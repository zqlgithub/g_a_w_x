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

var uploadTotalCount = 0;
var uploadTotalCurrentCount = 0;

Page({

  /**
   * 页面的初始数据
   */
  data: {
      keepConnecting:0, // 0 初始态; 1 进入group setting ;-1 其他
      loading:true,
      loadAll:false,
      userInfo:undefined,
      group_id:undefined,
      live_album_id:undefined,
      live_mode:true,
      live_member_count:0,
      member_count:0,
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
      scrollTop:0,
      tapLikeArray:[
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
      ],
      feedArray:[
      ],
      onceLikeCount:0,
      onceLikeCountTimeout:null,
      likeNum:0,
      tapLike:false,
      refreshInterval:null,
      uploadTips:'',
      uploadPercent:0,

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
    // debugger;
    wx.onSocketMessage(function (res) {
      // debugger;
      console.log('收到服务器内容：' + res.data);
      var ret = JSON.parse(res.data);
      
      if (ret.action=='enter_group'){
        //todo
        // debugger;
        self.addFeed(ret.data.name, ret.action);
        var members = self.data.members;
        var member = {
          id: ret.data.id,
          name: ret.data.name,
          avatar: ret.data.avatar
        }

        // if (member.id != self.data.userInfo.id){
          members.unshift(member);
          self.setData({
            live_member_count: ret.data.live_member_count ,
            member_count: ret.data.member_count,
            members: members
          });
        // }        
        
      } else if (ret.action == 'send_photo'){
        self.addFeed(ret.data.user.name, ret.action);
        var photo = ret.data;
        var photo = self._renderTime(photo);
        self.addNewPhoto(photo);
      } else if (ret.action == 'leave_group') {
        self.addFeed(ret.data.name, ret.action);
        var members = self.data.members;
        // debugger;
        members = members.filter(function(v){
          return v.id != ret.data.id
        });
        self.setData({
          live_member_count: ret.data.live_member_count,
          member_count: ret.data.member_count,
          members: members
        });

      } else if (ret.action == "like_group"){
        // debugger;
        self.addFeed({ name: ret.data.user.name, user_like_count: ret.data.user_like_count}, ret.action);
        // debugger;
        if (ret.data.user.id != self.data.userInfo.id){
          for (var i = 0; i < ret.data.user_like_count;i++){
            self.showLikeAnimation(ret.data.like_count - ret.data.user_like_count + i);
          }
          
        }
        
        
      } else if (ret.action == "group_unlive") {
        if (!self.data.is_master){
          wx.showModal({
            title: '提示',
            content: '相册已切换为普通相册，为您转换中',
            showCancel: false,
            complete: function () {
              wx.redirectTo({
                url: '/pages/timeline/timeline?id=' + self.data.group_id,
              });
            }
          })
        }
        
      
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

    wx.onSocketError(function (res) {
      console.log(res)
    })

    
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
  },
  init:function(){
    var self = this;
    app.getUserInfo(function (userInfo) {
      self.setData({
        userInfo: userInfo,
      });
      self.getGroupLiveData(function(){
        self.getMemberList(true, function(){
          self.websocketHandle(self.data.group_id);
        });
      });
      
      self.getPhotos(true);
      self.refreshFeeds();
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
    // debugger;
    if (app.globalData.live_mode === false){
      app.globalData.live_mode = undefined;
      wx.redirectTo({
        url: '../timeline/timeline?id=' + this.data.group_id,
      });
    }
    if (this.data.keepConnecting == -1){
      this.init();
    }
    this.setData({
      keepConnecting: 0
    });    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // debugger;
    if (this.data.keepConnecting != 1 ){
      this.setData({
        keepConnecting:-1
      });
      wx.closeSocket();
    }
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

    this.setData({
      keepConnecting: 1
    });   

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
  getGroupLiveData: function (cb) {
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
          likeNum: resp.data.like_count,
          is_master: resp.data.master,
          live_album_id: resp.data.live_album_id,
          member_count: resp.data.member_count,
          live_member_count: resp.data.live_member_count,
          group_id: resp.data.id,
          live_mode: resp.data.live_mode,
          cover_pic: resp.data.front_cover,
          co_edit: resp.data.co_edit,
        });
        
        wx.setNavigationBarTitle({
          title: resp.data.name,
        })
        setTimeout(function(){
          self.setData({
            loading:false
          });
        },10);
      },
      complete: function (e) {
        if (cb) {
          cb();
        }
      }
    })    
  },
  loadMoreOnlineMember:function(){
    this.getMemberList()
  },
  getMemberList:function(init, cb){
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
        },function(){
            if (cb) {
              cb();
            }
          
        });
        
      },
      fail: function (msg) {
    loadingMoreMembers = false
        // debugger;
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
    
    this.setData({
      keepConnecting: 1
    });

    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        // success
        console.log('SELECT PHOTO SUCCESS')
        console.log(res)
        uploadTotalCount = res.tempFilePaths.length;
        uploadTotalCurrentCount = 0;
        self.setData({
          uploadTips: '上传中',
          uploadPercent: 0
        });
        
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
            uploadTotalCurrentCount++;
            if (uploadTotalCurrentCount == uploadTotalCount){
              self.setData({
                uploadTips: 'ok',
                uploadPercent: 100
              });
              setTimeout(function(){
                uploadTotalCount = 0;
                uploadTotalCurrentCount = 0;
                self.setData({
                  uploadTips: '',
                  uploadPercent: 0
                });
              },2000)
            }else{
              self.setData({
                uploadTips: uploadTotalCurrentCount + '/' + uploadTotalCount,
                uploadPercent: uploadTotalCurrentCount / uploadTotalCount * 100
              });
            }
            
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

    this.setData({
      keepConnecting: 1
    });   


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
    var is_master = this.data.is_master ? 1 : 0;
    this.setData({
      keepConnecting: 1
    });
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
  getPhotos:function(init,cb){
    // debugger;
    console.log('getPhotos');


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
        // console.log("left0");
        var photo = self._renderTime(photos[index]);
        photosLeft.push(photo);
        self.setData({
          photosLeft
        },function(){
            addOne(index + 1);
        });
      }else if(photosRight.length==0){
        // console.log("right0");
        var photo = self._renderTime(photos[index]);
        photosRight.push(photo);
        self.setData({
          photosRight
        }, function () {
            addOne(index + 1);
        });
      } else if (photosLeft.length == 1) {
        // console.log("left1");
        var photo = self._renderTime(photos[index]);
        photosLeft.push(photo);
        self.setData({
          photosLeft
        }, function () {
          addOne(index + 1);
        });
      } else if (photosRight.length == 1) {
        // console.log("right1");
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
          // console.log(index + "right|leftHeight=" + leftHeight + ";rightHeight=" + rightHeight);
          self.setData({
            photosRight
          }, function () {
            setTimeout(function () {
            addOne(index + 1);
            }, 100)
          })
        } else {
          // console.log(index + "left|leftHeight=" + leftHeight + ";rightHeight=" + rightHeight);
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
    var self = this;

    if (this.data.loadAll){
      console.log('load All,return !!!');
      return;
    }
    if (loadingMorePhoto) {
      console.log('loadingMorePhoto,return !!!');
      return;
    }

    loadingMorePhoto = true;

    this.getPhotos(false,function(){
      // debugger;
      loadingMorePhoto = false;
    });
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
        this.addWaitingPhotos();
      }
    }
  },
  addNewPhoto:function(image){
    // debugger;
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
    this.setData({
      keepConnecting: 1
    });

    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/photo/photo_detail?live=1&group_id=' + this.data.group_id + '&init_photo=' + id + '&order='+ this.data.mode.value
    });
  },
  _renderTime:function(photo){
    var date = new Date(photo.createTime *1000);
    var now = new Date();
    if(now - date < 60*1000){
      photo.time = '刚刚';
    }else if(+now - (+date) < 60 * 60 * 1000){
      var rest = Math.floor((+now - (+date))/60000);
      photo.time = rest +'分钟前'
    } else if (+now - (+date) < 24 * 60 * 60 * 1000 ){
      if(now.getDate()==date.getDate()){
        photo.time = (date.getHours() > 10 ? date.getHours() : '0' + date.getHours()) + ":" + (date.getMinutes() > 10 ? date.getMinutes() : '0' + date.getMinutes())
      }else{
        photo.time = '昨天' + (date.getHours() > 10 ? date.getHours() : '0' + date.getHours()) + ":" + (date.getMinutes() > 10 ? date.getMinutes() : '0' + date.getMinutes())
      }
    } else {
      function formatNumber(n) {
        n = n.toString()
        return n[1] ? n : '0' + n
      }
      var month = date.getMonth() + 1
      var day = date.getDate()
      photo.time = [month, day].map(formatNumber).join('-')
    }
    return photo;
  },
  tapLikeAlbum:function(){
    var self = this;
    

    this.setData({
      tapLike:true
    });
    this.showLikeAnimation(this.data.likeNum+1);

    if (this.data.OncelikeCountTimeout){
      clearTimeout(this.data.OncelikeCountTimeout);
    }
    // debugger;
    var count = this.data.onceLikeCount;

    count += 1;
    this.setData({
      onceLikeCount:count
    });

    var c = setTimeout(function(){
      requests.post({
        url: '/album/group/like',
        data: {
          id: self.data.group_id,
          count: self.data.onceLikeCount
        },
        success: function (resp) {

          console.log('album/group/like SUCCESS');
        }
      });
      self.setData({
        onceLikeCount:0
      })
    },1000);

    self.setData({
      OncelikeCountTimeout: c
    });

     

    
    setTimeout(function(){
      self.setData({
        tapLike: false
      });
    },500)
  },
  onLike: function (e) {
    var photo = e.currentTarget.dataset.photo;
    var listName = e.currentTarget.dataset.list;
    var index = e.currentTarget.dataset.index;

    var self = this
    var curr_photo = photo



      requests.post({
        url: '/album/photo/like',
        data: {
          id: curr_photo.id
        },
        success: function (resp) {
          // photo.like_count = resp.data.like_count
          var _list = self.data[listName];
          _list[index].like_count = resp.data.like_count;
          if (listName =='photosLeft'){
            self.setData({
              photosLeft: _list
            });
          }else{
            self.setData({
              photosRight: _list
            });
          }
          
        }
      })
    // }
  },
  refreshFeeds:function(){
    
    var self = this;
    if (this.data.refreshInterval){
      clearInterval(this.data.refreshInterval);
      this.setData({
        refreshInterval:null
      });
    }
    var c = setInterval(function(){
      var feeds = self.data.feedArray;
      if (feeds.length>0){
        feeds.shift();
        self.setData({
          feedArray:feeds
        });
      }
    },10000);
    this.setData({
      refreshInterval: c
    });
  },
  showLikeAnimation:function(likeNum){
    var self = this;
    var tapLikeArray = self.data.tapLikeArray;
    var flag = false;
    var index = -1;
    tapLikeArray.map((v, k) => {
      if (v == 1) {
        index = k;
      }
    });
    if (index >= 0 && index <= tapLikeArray.length - 1) {
      index = index + 1;
      tapLikeArray[index] = 1;
      flag = true;
    } else if (index == -1) {
      index = 0;
      tapLikeArray[index] = 1;
      flag = true;
    }

    self.setData({
      likeNum: likeNum,
      tapLikeArray: tapLikeArray
    });

    if (flag) {
      setTimeout(function () {
        // debugger;
        var tapLikeArray = self.data.tapLikeArray;

        var index = -1;
        tapLikeArray.map((v, k) => {
          if (v == 1 && index == -1) {
            index = k;
          }
        });
        if (index >= 0) {
          tapLikeArray[index] = 0
        }

        self.setData({
          tapLikeArray: tapLikeArray
        });
      }, 5000);
    }
  },
  addFeed:function(nickname, _type){
    var feeds = this.data.feedArray;
    var feed;
    if (_type =='like_group'){
      var param = nickname;
      var name = param.name;
      var count = param.user_like_count;
      feed = {
        text: name + " 为相册点了" + count+"个赞",
        color:'#FF3680'
      };
    }else if(_type=='enter_group'){
      feed = {
        text: nickname + " 进入了相册",
        color: '#FFFFFF'
      };
    } else if (_type == 'leave_group') {
      feed = {
        text: nickname + " 离开了相册",
        color: '#CCCCCC'
      };
    } else if (_type == 'send_photo') {
      feed = {
        text: nickname + " 上传了新照片",
        color: '#97D7D8'
      };
    }

    if (feeds.length == 6) {
      feeds.shift();
    }
    // console.log(feed);
    feeds.push(feed);
    this.refreshFeeds();
    this.setData({
      feedArray:feeds
    })
  }
})