// pages/album/album_settings.js
var requests = require('../../utils/requests.js')
var util = require('../../utils/util.js')
var events = require('../../utils/events.js')

Page({
  data:{
    show_panel: false,
    panel_animation: {},
    is_master: false
  },
  onInputAlbumName:function(e) {
    this.setData({
      to_create_album_name: e.detail.value
    })
  },
  onEditAlbumName:function(e) {
    var self = this
    var new_name = self.data.to_create_album_name

    if(util.strByteLen(new_name) > 26){
      wx.showToast({
        title: '相册名太长了，精简一点会好记一些哦'
      })
      return
    }

    requests.post({
      url: "/album/update",
      data: {
        album_id: this.data.album_id,
        name: new_name
      },
      success: function(resp) {
        self.onTapBg()
        self.setData({
          album_name: new_name
        })
        self.setData({
          album_name_input_default: ""
        })
        events.center.dispatch('update_album', {
          id: self.data.album_id,
          name: new_name
        })
      }
    })
  },
  onChangeDate: function(e) {
    console.log('change')
    var self = this
    var curr_date = e.detail.value
    var date = util.strToDate(curr_date)
    var to_update_date = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 1000

    requests.post({
      url: "/album/update",
      data: {
        album_id: this.data.album_id,
        date: to_update_date
      },
      success: function(resp) {
        events.center.dispatch('update_album', {
          id: self.data.album_id,
          date: to_update_date
        })
      }
    })

    this.setData({
      to_create_album_date: curr_date
    })
  },
  onRemove: function() {
    var self = this
    wx.showModal({
      title: "提示",
      content: "您确定要删除这个相册吗？",
      showCancel: true,
      success: function(res) {
        if(res.confirm){
          requests.post({
            url: '/album/remove',
            data: {
              album_id: self.data.album_id
            },
            success: function(resp) {
              console.log('REMOVE ALBUM SUCCESS')
              wx.navigateBack()
              events.center.dispatch('remove_album', {
                id: self.data.album_id
              })
            }
          })
        }
      }
    })
  },

  switchPanel: function(is_open){
    if(!this.panel_animation){
      var panel_animation = wx.createAnimation({
        duration: 400,
        timingFunction: 'ease', // "linear","ease","ease-in","ease-in-out","ease-out","step-start","step-end"
        delay: 0,
        transformOrigin: '50% 0 0',
      })
      this.panel_animation = panel_animation
    }
    
    var ty = is_open ? "0rpx" : "-455rpx";
    this.panel_animation.bottom(ty).step()

    this.setData({
      panel_animation: this.panel_animation.export()
    })
  },
  onTapAlbumName: function(e) {
    if(!this.data.show_panel){
        clearTimeout(this.data.panel_timer)
        this.setData({
          show_panel: true,
          album_name_input_default: this.data.album_name,
          to_create_album_name: this.data.album_name
        })
        this.switchPanel(true)
      }
  },
  onCancelPanel: function(e){
    this.onTapBg()
  },
  onTapBg: function(e) {
    var self = this
    var onTimeout = function(){
      self.setData({
        show_panel: false
      })
    }
    this.setData({
      panel_timer: setTimeout(onTimeout, 300)
    })
    this.switchPanel(false)
  },

  onLoad:function(options){
    var album_id = options.id
    var is_master = parseInt(options.is_master) == 1

    var self = this
    requests.get({
      url: '/album/detail',
      data: {
        'album_id': album_id
      },
      success: function(resp){
        var data = resp.data
        var date = new Date(data.date * 1000)
        self.setData({
          album_id: data.id, 
          album_name: data.name,
          album_date: date,
          to_create_album_date: util.formatDate(date),
          is_master: is_master
        })
      }
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