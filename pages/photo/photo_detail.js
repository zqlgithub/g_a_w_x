// pages/photo/photo_detail.js
var requests = require('../../utils/requests.js')
var events = require('../../utils/events.js')
var util = require('../../utils/util.js')

Page({
  data:{
    photo_msg: {},
    photos: [],
    to_showing_photos: [],

    photo_comments_map: {},
    comments: [],
    display_comment_list: [],

    curr_photo_index: 0,
    curr_index_txt: '',
    offset: 0,
    show_bullet: false,
    like: false,
    like_count: 0,
    comment_count: 0,
    comment_btn_loading: false,
    to_comment_content: '',
    panel_animation: {},
    show_panel: false,
    theme:{
      
    },
    pagination:undefined,
    totalNum:0,
    live:undefined,
    album_id:undefined,
    order:undefined,
    first_photo:undefined,
    last_photo:undefined
  },

  getCurrPhoto: function(){
    return this.data.photos[this.data.curr_photo_index]
  },

  // 因为swiper控件的current和照片的逻辑index不一样，需要计算下
  updatePhotoIndex: function(curr){
    var offset = this.data.offset
    var length = this.data.photos.length
    var index = (curr + offset) % length + 1
    this.setData({
      curr_index_txt: index + '/' + length
    })
  },

  initBullets: function(comments) {
    console.log('init bullets')
    var animations = [] 
    var display_comment_list = []
    var bullet_intervals = []
    var row_lengths = []
    for (var i = 0; i < 10; i++) row_lengths.push(0)

    function search_row(curr_length, interval){
      var result_index = -1
      for (var i in row_lengths){
        row_lengths[i] = Math.max(0, row_lengths[i] - interval)
        if (result_index < 0 && row_lengths[i] <= 0){
          result_index = i
          row_lengths[i] = curr_length
        }
      }
      return Math.max(result_index, 0)
    }

    function cal_interval(seconds){
      if(seconds < 300) return 4
      else if(seconds < 600) return 8
      else if(seconds < 30 * 60) return 12
      else if(seconds < 2 * 60 * 60) return 16
      return 20
    }

    function cal_speed(length) {
      if (length < 10) return 16
      else if (length < 20) return 20
      else if (length < 30) return 25
      else if (length < 50) return 30
      return 40
    }

    for(var i in comments){
      var comment_txt = comments[i].user.name.length > 0 ? comments[i].user.name + ':' + comments[i].content : comments[i].content
      comment_txt = comment_txt.length > 50 ? comment_txt.slice(0, 50) + '...' : comment_txt
      var length = util.strByteLen(comment_txt)
      var interval = 0
      if(i > 0){
        if (comments[i].createTime && comments[i-1].createTime){
          interval = cal_interval(comments[i].createTime - comments[i - 1].createTime)
        }else{
          interval = 1
        }
      }else{
        interval = 0
      }
      display_comment_list.push({
        left: this.data.windowWidth + 20,
        top: 50 * search_row(length, interval),
        width: length * 12,
        content: comment_txt,
        animation: {},
        speed: cal_speed(length) * 5,
        interval: interval * 150
      })
    }
    var self = this
    this.setData({
      curr_bullet_index: 0,
      last_bullet_time: 0,
      display_comment_list: display_comment_list,
      bullet_intervals: bullet_intervals
    }, function(){
      if(display_comment_list.length > 0)
        self.startBulletTimer()
    })
  },  

  refreshBullet: function(comments=null){
    console.log('refresh bullet timer')
    comments = comments || this.data.comments
    var self = this
    this.stopBulletTimer()
    this.setData({
      display_comment_list: []
    }, function(){
      if(comments.length > 0)
        self.initBullets(comments)
    })
  },

  clearBullet: function () {
    this.stopBulletTimer()
    this.setData({
      comments: [],
      display_comment_list: []
    })
  },

  startBulletTimer: function(){
    // console.log('start bullet timer')
    // 防止重复调用startBulletTimer
    clearTimeout(this.bullet_timer)
    this.last_bullet_duration = 0
    this.onBulletTimer()
  },

  stopBulletTimer: function() {
    // console.log('stop bullet timer')
    clearTimeout(this.bullet_timer)
    clearTimeout(this.bulletEndTimer)
  },

  getRect: function (dom_id) {
    if (wx.createSelectorQuery){
      var dom_rect = null
      wx.createSelectorQuery().select(dom_id).boundingClientRect(function (rect) {
        dom_rect = rect
      }).exec()
    }else{
      return null
    }
  },

  shoot_bullet: function(index){
    var comment_obj = this.data.display_comment_list[index]
    if(comment_obj){
      var offset = comment_obj.left + comment_obj.width
      var duration = (offset / comment_obj.speed) * 1000
      var animation = wx.createAnimation({
        duration: duration,
        timingFunction: 'linear',
        delay: 0,
        transformOrigin: '50% 50% 0',
      })

      animation.translate(-offset).step()
      var to_set_data = {}
      to_set_data['display_comment_list[' + index + '].animation'] = animation.export()
      this.setData(to_set_data)
      return duration
    }else{
      return 0
    }    
  },

  onBulletTimer: function(){
    var curr_bullet_index = this.data.curr_bullet_index
    var this_duration = this.shoot_bullet(curr_bullet_index++)
    this.last_bullet_duration = Math.max(this.last_bullet_duration, this_duration)

    if (curr_bullet_index >= this.data.display_comment_list.length) {
      // console.log('on timer to end')
      clearTimeout(this.bullet_timer)
      this.bulletEndTimer = setTimeout(this.onBulletEnd, this.last_bullet_duration)
    }else{
      // 计算下个子弹的时间间隔
      var next_comment_obj = this.data.display_comment_list[curr_bullet_index]
      var interval = next_comment_obj.interval
      this.setData({
        curr_bullet_index: curr_bullet_index
      })
      this.bullet_timer = setTimeout(this.onBulletTimer, interval)
    }
  },

  onBulletEnd: function() {
    console.log('on bullet end')
    console.log(this.data.display_comment_list)
    this.refreshBullet()
  },

  syncComments: function() {
    var curr_photo = this.getCurrPhoto()
    var self = this
    var photo_comments_map = this.data.photo_comments_map
    // if(curr_photo.id in photo_comments_map){
    //   this.setData({
    //     comments: photo_comments_map[curr_photo.id]
    //   })
    //   this.refreshBullet()
    // }else{
    requests.get({
      url: '/album/photo/comment/list',
      data: {
        photo_id: curr_photo.id
      },
      success: function(resp) {
        var comments = resp.data
        photo_comments_map[curr_photo.id] = comments
        self.setData({
          comments: comments,
          photo_comments_map: photo_comments_map
        })
        self.refreshBullet()
      }
    })
    // }
  },

  syncBottomBarData: function() {
    var photo = this.getCurrPhoto()
    var photo_msg = this.data.photo_msg
    if(!photo) return
    this.setData({
      like: photo.like,
      like_count: photo.like_count,
      comment_count: photo.comment_count,
      user_avatar: photo.creator.avatar,
      new_msg: photo.id in photo_msg
    })
  },

  formatAlbumDate: function(date){
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()
    return year + "年" + month + "月" + day + '日'
  },

  switchPanel: function(is_open){
    var self = this

    function animatePanel(is_open){
      if(!self.panel_animation){
        var panel_animation = wx.createAnimation({
          duration: 400,
          timingFunction: 'ease', // "linear","ease","ease-in","ease-in-out","ease-out","step-start","step-end"
          delay: 0,
          transformOrigin: '50% 0 0',
        })
        self.panel_animation = panel_animation
      }
      
      var ty = is_open ? "0rpx" : "-240rpx";
      self.panel_animation.bottom(ty).step()

      self.setData({
        panel_animation: self.panel_animation.export()
      })
    }

    if(is_open){
      if(this.panel_timer){
        clearTimeout(this.panel_timer)
      }
      self.setData({
        show_panel: true
      })
    }else{
      this.panel_timer = setTimeout(function(){
        self.setData({
          show_panel: false
        })
      }, 400)
    }
    animatePanel(is_open)
  },

  onBulletChange: function(e) {
    var show_bullet = !this.data.show_bullet
    if(!show_bullet){
      wx.showToast({
        title:"弹幕已屏蔽"
      });
      this.clearBullet()
    }else{
      wx.showToast({
        title: "弹幕已开启"
      });
      this.syncComments()
    }

    wx.setStorage({
      key: 'show_bullet',
      data: show_bullet
    })
    this.setData({
      show_bullet: show_bullet
    })
  },

  onTapBg: function(e) {
    this.switchPanel(false)
  } , 

  onTapPhoto: function(e) {
    var photos = this.data.photos
    var curr_index = this.data.curr_photo_index
    var curr = photos[curr_index].url
    
    wx.previewImage({
      current: curr,
      urls: [curr]
    })
  },

  onPhotoSwiperChange: function(e) {
    
    var curr = e.detail.current;
    console.log('curr:' + curr)
    // var photo = this.data.photos[curr]
    var photos = this.data.photos;
    var curr_photo_index = this.data.curr_photo_index;
    var direction ;

    //往左
    if (curr == curr_photo_index- 1 || (curr == photos.length-1 && curr_photo_index==0) ) {
      direction = 1;
      if(curr > 0 && !photos[curr-1].url){
        this.getMorePhotos(direction, photos[curr].pagination)
      }
    //往右
    } else if (curr == curr_photo_index + 1 || (curr_photo_index == photos.length - 1 && curr == 0)) {
      direction = -1;
      if (curr < photos.length - 1 && !photos[curr + 1].url) {
        this.getMorePhotos(direction, photos[curr].pagination)
      }
    }

    this.setData({
      curr_photo_index: curr,
    });




    this.syncBottomBarData()
    // this.updatePhotoIndex(curr)

    if(this.data.show_bullet){
      this.syncComments()
      
    }
  },

  onLike: function(){
    var self = this
    var curr_photo = this.data.photos[this.data.curr_photo_index]
    if(curr_photo.like){
      requests.post({
        url: '/album/photo/unlike',
        data: {
          id: curr_photo.id
        },
        success: function(resp){
          var curr = self.data.curr_photo_index
          var photo = self.data.photos[self.data.curr_photo_index]
          photo.like_count = resp.data.like_count
          photo.like = false
          var to_set_data = {}
          to_set_data['photos['+curr+']'] = photo
          self.setData(to_set_data)
          self.syncBottomBarData()
        }
      })
    }else{
      requests.post({
        url: '/album/photo/like',
        data: {
          id: curr_photo.id
        },
        success: function(resp){
          var curr = self.data.curr_photo_index
          var photo = self.data.photos[curr]
          photo.like_count = resp.data.like_count
          photo.like = true
          var to_set_data = {}
          to_set_data['photos['+curr+']'] = photo
          self.setData(to_set_data)
          self.syncBottomBarData()
        }
      })
    }
  },

  onComment: function(e) {
    if(!this.data.to_comment_content){
      wx.showToast({
        title: '请输入评论内容'
      })
      return
    }

    var self = this
    var curr_photo = this.getCurrPhoto()
    var content = this.data.to_comment_content
    requests.post({
      url: '/album/photo/comment',
      data: {
        photo_id: curr_photo.id,
        content: content
      },
      success: function(resp) {
        var curr_index = self.data.curr_photo_index
        var photo_comments_map = self.data.photo_comments_map
        var comments = self.data.comments
        var new_comment = {
          content: content,
          createTime: Number.parseInt(Date.now() / 1000),
          user: {
            name: self.data.userInfo.name,
            avatar: self.data.userInfo.avatar
          }
        }
        if(!photo_comments_map[curr_photo.id]){
          photo_comments_map[curr_photo.id] = []
        }
        photo_comments_map[curr_photo.id].push(new_comment)
        comments.push(new_comment)
        curr_photo.comment_count += 1
        var to_set_data = {
          to_comment_content: '',
          comments: comments,
          photo_comments_map: photo_comments_map
        }
        to_set_data['photos['+curr_index+']'] = curr_photo
        self.setData(to_set_data)
        self.syncBottomBarData()
        wx.showToast({
          title: '评论成功'
        })
        self.switchPanel(false)
      }
    })
  },

  onInputComment: function(e) {
    this.setData({
      to_comment_content: e.detail.value
    })
  },

  onTapComment: function(e) {
    this.switchPanel(true)
  },

  onTapCommentList: function(e) {
    var photo = this.data.photos[this.data.curr_photo_index]
    
    wx.navigateTo({
      url: '/pages/photo/photo_comments?id='+photo.id +"&url=" + photo.url
    });

  },
  onCancelPanel: function(e) {
    this.switchPanel(false)
  },

  onLoad:function(options){
    var album_id = options.album_id;
    var photo_id = options.init_photo;
    var order = options.order;
    var live = options.live;
    this.setData({
      live: live,
      album_id: album_id,
      order
    });
    try {
      var value = wx.getStorageSync('show_bullet')
      if (value) {
        this.setData({
          show_bullet: value
        })
      }
    } catch (e) {
    }

    var self = this
    getApp().getUserInfo(function(userInfo){
      self.setData({
        userInfo: userInfo,
      })
    })

    var width = 750
    try{
      width = wx.getSystemInfoSync().windowWidth
    }catch(e){
      width = 750
    }
    
    this.setData({
      windowWidth: width
    })

    var param = {
      id: album_id,
      photo_id: photo_id,
      size: 3
    };
    if(live){
      param.live = live;
    }
    if (order) {
      param.order = order;
    }
    requests.get({
      url: '/album/photos',
      data: param,
      success: function(resp) {
        // debugger;
        var origin_photos = resp.data.photos
        var title = ''
        if(resp.data.name && resp.data.name.length > 0){
          title = resp.data.name
        }else{
          title = self.formatAlbumDate(new Date(resp.data.date * 1000))
        }
        wx.setNavigationBarTitle({
          title: title
        });

        // var postfix_photos = []
        // var to_showing_photos = []
        // debugger;
        var photos = [];

        for (var i = 0; i < resp.data.photo_count;i++){
          photos.push({});
        }

        var currentIndex = -1;
        for(var i in origin_photos){
          var curr = origin_photos[i]
          if(origin_photos[i].id == photo_id){
            currentIndex = i;
          }
        }

        for (var i in origin_photos) {
            if(i < currentIndex){
              photos[photos.length  - (currentIndex - i)] = origin_photos[i]
            }else{
              photos[i - currentIndex] = origin_photos[i]
            }
        }

        if (currentIndex==0){
          photos[photos.length - 1] = resp.data.last_photo;
        }
        if (currentIndex == origin_photos.length-1) {
          photos[1] = resp.data.first_photo;
        }

        self.setData({
          photos: photos,
          last_photo: resp.data.last_photo,
          first_photo: resp.data.first_photo
        });
        
        // var tmp = postfix_photos
        // for(var i in origin_photos){
        //   var curr = origin_photos[i]
        //   if(origin_photos[i].id == photo_id){
        //     tmp = photos
        //     self.setData({
        //       curr_photo: curr,
        //       offset: Number.parseInt(i)
        //     })
        //   }
        //   tmp.push(curr)
        //   to_showing_photos.push(curr.url)
        // }
        // self.setData({
        //   photos: photos.concat(postfix_photos),
        //   to_showing_photos: to_showing_photos
        // });

        // self.updatePhotoIndex(0)
        self.syncBottomBarData()
        
        if (self.data.show_bullet) {
          self.syncComments()
        }

      }
    })

    requests.post({
      url: '/user/msg/read',
      data: {
        photo_id: photo_id
      }
    })

    var self = this
    events.center.listen('update_photo', this, function(data){
      console.log('update photo: ', data)
      var photo_id = data.id
      var photos = self.data.photos
      for(var i in photos){
        if(photos[i].id === photo_id){
          if('comment_count' in data){
            photos[i].comment_count = data.comment_count
          }
          var to_set_data = {}
          to_set_data['photos['+i+']'] = photos[i]
          self.setData(to_set_data)
          break
        }
      }
      // self.syncBottomBarData()
    })

  },
  onReady:function(){
    // 页面渲染完成
  },
  onShow:function(){
    var self = this
    requests.get({
      url: '/user/msg/list',
      success: function(resp) {
        var photo_new_msg = {}
        for(var i in resp.data){
          var msg = resp.data[i]
          if(!msg.read && 'photo_id' in msg){
            photo_new_msg[msg.photo_id] = true
          }
        }
        self.setData({
            photo_msg: photo_new_msg
        })
        self.syncBottomBarData()
      }
    })
  },
  getMorePhotos: function (direction, pagination){
    var self = this;
    var param = {
      id: this.data.album_id,
      pagination: pagination,
      direction: direction,
      size: 3
    };
    if (this.data.live) {
      param.live = this.data.live;
    }
    if (this.data.order) {
      param.order = this.data.order;
    }

    requests.get({
      url: '/album/photos',
      data: param,
      success: function (resp) {
        // debugger;
        if (direction==1){
          var photos = self.data.photos;
          var curr = self.data.curr_photo_index;
          //翻到头了，就加载倒数第一张
          if (resp.data.photos.length==0){
            if (curr > 0) {
              photos[curr - 1] = self.data.last_photo;
            } else {
              photos[photos.length - 1] = self.data.last_photo;
            }
          }else{
            resp.data.photos.map(function (v, k) {
              if (curr - resp.data.photos.length + k >= 0) {
                photos[curr - resp.data.photos.length + k] = v;
              } else {
                photos[photos.length - curr - resp.data.photos.length + k] = v
              }
            });
          }
          
        }else if(direction == -1){
          var photos = self.data.photos;
          var curr = self.data.curr_photo_index;
          if (resp.data.photos.length==0 ) {
            if (curr < photos.length - 1) {
              photos[curr + 1] = self.data.first_photo;
            } else {
              photos[0] = self.data.first_photo;
            }
          }else{
            resp.data.photos.map(function (v, k) {
              if (curr + k + 1 < photos.length) {
                photos[curr + k + 1] = v;
              } else {
                photos[curr + k + 1 - photos.length] = v
              }
            })
          }
          

        }
        self.setData({
          photos: photos
        });

        // self.setData({
        //   photos: photos.concat(postfix_photos),
        //   to_showing_photos: to_showing_photos
        // })
        // self.updatePhotoIndex(0)
        // self.syncBottomBarData()

        // if (self.data.show_bullet) {
        //   self.syncComments()
        // }

      }
    })
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    events.center.remove('update_photo', this)
  }
})