// pages/photo/photo_detail.js
var requests = require('../../utils/requests.js')
var events = require('../../utils/events.js')
var util = require('../../utils/util.js')

Page({
  data:{
    photo_msg: {},
    photos: [],
    to_showing_photos: [],

    curr_bullet_index: 0, 
    last_bullet_time: 0,
    comments: [],
    bullet_animations: [],
    bullet_tops: [],
    bullet_lefts: [],
    bullet_widths: [],
    bullet_line_last_time: [],

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
  },

  getCurrPhoto: function(){
    return this.data.photos[this.data.curr_photo_index]
  },

  updatePhotoIndex: function(curr){
    var offset = this.data.offset
    var length = this.data.photos.length
    var index = (curr + offset) % length + 1
    this.setData({
      curr_index_txt: index + '/' + length
    })
  },

  initBullets: function() {
    var width = []
    var left = []
    var top = []
    var animations = []
    var comments = this.data.comments
    for(var i in comments){
      width.push(util.strByteLen(comments[i].content) * 30)
      left.push(700)
      top.push(0)
      animations.push({})
    }
    this.setData({
      bullet_widths: width,
      bullet_tops: top,
      bullet_lefts: left,
      curr_bullet_index: 0, 
      last_bullet_time: 0,
      bullet_animations: animations
    })
  },  

  refreshBullet: function(){
    this.stopBulletTimer()
    clearTimeout(this.bulletEndTimer)
    this.initBullets()
    this.startBulletTimer()
  },

  startBulletTimer: function(){
    this.bullet_timer = setTimeout(this.startBulletTimer, 2000)
    this.onBulletTimer()
  },

  stopBulletTimer: function() {
    clearTimeout(this.bullet_timer)
  },

  shoot_bullet: function(index){
    // var LINE_HEIGHT = 50
    // var now_ts = Date.now()
    // if(!this.line_last_time){
    //   this.line_last_time = []
    // }

    // var i = 0
    // for(; i < this.line_last_time.length; i++){
    //   if(this.line_last_time[i] <= now_ts){
    //     break
    //   }
    // }
    // var ts = now_ts + this.data.comments[index].content.length * 200
    // if(i == this.line_last_time.length){
    //   this.line_last_time.push(ts)
    // }else{
    //   this.line_last_time[i] = ts
    // }
    // var to_set_data = {}
    // to_set_data['bullet_tops['+index+']'] = LINE_HEIGHT * i
    // this.setData(to_set_data)

    var animation = wx.createAnimation({
      duration: 6000,
      timingFunction: 'linear', 
      delay: 0,
      transformOrigin: '50% 50% 0',
    })

    var w = this.data.bullet_widths[index]
    animation.left('0rpx').step()

    var to_set_data = {}
    to_set_data['bullet_animations['+index+']'] = animation.export()
    this.setData(to_set_data)
  },

  onBulletTimer: function(){
    var curr_index = this.data.curr_bullet_index
    var curr_comment = this.data.comments[curr_index]
    var last_comment = curr_index > 0 ? this.data.comments[curr_index - 1] : null
    var last_bullet_time = this.data.last_bullet_time
    var now_ts = Date.now()

    this.shoot_bullet(curr_index)

    curr_index = curr_index + 1
    this.setData({
      curr_bullet_index: curr_index,
      last_bullet_time: now_ts
    })

    if(curr_index >= this.data.comments.length){
      this.bulletEndTimer = setTimeout(this.onBulletEnd, 6000)
      this.stopBulletTimer()
    }

  },

  onBulletEnd: function() {
    this.refreshBullet()
  },

  syncComments: function() {
    var curr_photo = this.getCurrPhoto()
    var self = this
    requests.get({
      url: '/album/photo/comment/list',
      data: {
        photo_id: curr_photo.id
      },
      success: function(resp) {
        self.setData({
          comments: resp.data
        })
        // self.startBulletTimer()
        self.refreshBullet()
      }
    })
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
    var curr_index = e.currentTarget.dataset.index
    var curr = photos[curr_index].url
    
    wx.previewImage({
      current: curr,
      urls: this.data.to_showing_photos
    })
  },

  onPhotoSwiperChange: function(e) {
    var curr = e.detail.current
    var photo = this.data.photos[curr]
    this.setData({
      curr_photo_index: curr,
    })
    this.syncBottomBarData()
    this.updatePhotoIndex(curr)
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
    requests.post({
      url: '/album/photo/comment',
      data: {
        photo_id: curr_photo.id,
        content: this.data.to_comment_content
      },
      success: function(resp) {
        var curr_index = self.data.curr_photo_index
        curr_photo.comment_count += 1
        var to_set_data = {}
        to_set_data['to_comment_content'] = ''
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
      url: '/pages/photo/photo_comments?id='+photo.id
    })

    requests.post({
      url: '/user/msg/read',
      data: {
        photo_id: photo.id
      }
    })
  },
  onCancelPanel: function(e) {
    this.switchPanel(false)
  },

  onLoad:function(options){
    var album_id = options.album_id
    var photo_id = options.init_photo

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
    requests.get({
      url: '/album/photos',
      data: {
        id: album_id
      },
      success: function(resp) {
        var origin_photos = resp.data.photos
        var title = ''
        if(resp.data.name && resp.data.name.length > 0){
          title = resp.data.name
        }else{
          title = self.formatAlbumDate(new Date(resp.data.date * 1000))
        }
        wx.setNavigationBarTitle({
          title: title
        })
        
        var to_showing_photos = []
        var photos = [];
        var postfix_photos = []
        var tmp = postfix_photos
        for(var i in origin_photos){
          var curr = origin_photos[i]
          if(origin_photos[i].id == photo_id){
            tmp = photos
            self.setData({
              curr_photo: curr,
              offset: Number.parseInt(i)
            })
          }
          tmp.push(curr)
          to_showing_photos.push(curr.url)
        }
        self.setData({
          photos: photos.concat(postfix_photos),
          to_showing_photos: to_showing_photos
        })
        self.updatePhotoIndex(0)
        self.syncBottomBarData()
        self.syncComments()
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
      self.syncBottomBarData()
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
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    events.center.remove('update_photo', this)
  }
})