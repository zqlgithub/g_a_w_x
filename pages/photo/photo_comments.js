// pages/photo/photo_comments.js
var requests = require('../../utils/requests.js')
var events = require('../../utils/events.js')
var utils = require('../../utils/util.js')
Page({
  data:{
    loading: true,
    photo_id: 0,
    phone_url:undefined,
    comment_data: [],
    comments: [],
    to_comment_content: '',
    input_holder: '你觉得怎么样？',
    input_focus: false
  },
  // formatTime: function(date) {
  //   function formatNumber(n) {
  //     n = n.toString()
  //     return n[1] ? n : '0' + n
  //   }

  //   var year = date.getFullYear()
  //   var month = date.getMonth() + 1
  //   var day = date.getDate()

  //   var hour = date.getHours()
  //   var minute = date.getMinutes()

  //   return  month + '-' + day + ' ' + [hour, minute].join(':')
  // },
  onComment: function(e) {
    if(!this.data.to_comment_content){
      wx.showToast({
        title: '请输入评论内容'
      })
      return
    }
    var self = this

    var req_data = {
      photo_id: this.data.photo_id,
      content: this.data.to_comment_content
    }
    if(this.data.resp_comment){
      req_data['resp_comment_id'] = this.data.resp_comment.id
    }
    requests.post({
      url: '/album/photo/comment',
      data: req_data,
      success: function(resp) {
        self.setData({
          to_comment_content: ''
        })
        self.initComments(self.data.photo_id)
        wx.showToast({
          title: '评论成功'
        })
      }
    })
  },
  onInputComment: function(e) {
    this.setData({
      to_comment_content: e.detail.value
    })
  },
  onTapResp: function(e) {
    var resp_comment = e.currentTarget.dataset.comment
    if(resp_comment.user_id != this.data.userInfo.id){
      this.setData({
        resp_comment: resp_comment,
        input_holder: '回复'+resp_comment.user_name,
        input_focus: true
      })
    }else {
      var self = this
      wx.showActionSheet({
        itemList: ['删除'],
        itemColor: '#e64340',
        success: function(res) {
          if(res.tapIndex === 0){
            requests.post({
              url: '/album/photo/uncomment',
              data: {
                comment_id: resp_comment.id
              },
              success: function(resp) {
                self.initComments(Number.parseInt(self.data.photo_id))
              }
            })
          }
        }
      })
    }
    
  },
  onBlur: function(e){
    if(this.data.resp_comment){
      this.setData({
        resp_comment: null,
        input_holder: '你觉得怎么样？'
      })
    }
  },

  initComments: function(photo_id) {
    var self = this

    wx.showToast({
      title: "加载中",
      icon: "loading",
      duration: 100000
    })

    requests.get({
      url: '/album/photo/detail',
      data: {
        photo_id: photo_id
      },
      success: function(resp) {
        var comments = []
        var data = resp.data.comments
        var comment_user_map = {}
        for(var i in data){
          comment_user_map[data[i].id] = data[i].user.name
        }

        for(var i in data){
          var resp_id = data[i].resp_comment_id
          var resp_user = resp_id ? comment_user_map[resp_id] : null
          comments.push({
            id: data[i].id,
            resp_user_name: resp_user,
            content: data[i].content,
            user_id: data[i].user.id,
            user_avatar: data[i].user.avatar,
            user_name: data[i].user.name,
            create_time_txt: utils.formatTime2(new Date(data[i].createTime * 1000))
          })
        }

        self.setData({
          comments: comments
        })

        events.center.dispatch('update_photo', {
          id: photo_id,
          comment_count: comments.length
        })
      },
      complete: function(resp) {
        self.setData({
          loading: false
        })
        wx.hideToast()
      }
    })
  },
  onLoad:function(options){
    var photo_id = Number.parseInt(options.id)
    this.setData({
      photo_id: photo_id,
      phone_url: options.url
    });
    var self = this
    getApp().getUserInfo(function(userInfo){
      self.setData({
        userInfo: userInfo
      })
      self.initComments(photo_id)
    })
  },
  
  onReady:function(){
    // 页面渲染完成
  },
  onShow:function(){
    // 页面显示
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  }
})