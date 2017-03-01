var requests = require('../../../utils/requests.js')
var events = require('../../../utils/events.js')

var app = getApp()
Page({
  data:{
    member_data: [],
    panel_animation: {},
    show_panel: false,
    group_name_input_default: "",
    to_create_group_name: ""
  },
  onInputGroupName:function(e) {
    this.setData({
      to_create_group_name: e.detail.value
    })
  },
  onEditGroupName:function(e) {
    var self = this
    var new_group_name = self.data.to_create_group_name
    requests.post({
      url: "/album/group/update",
      data: {
        id: this.data.group_id,
        name: new_group_name
      },
      success: function(resp) {
        self.onTapBg()
        self.setData({
          group_name: new_group_name
        })
        self.setData({
          group_name_input_default: ""
        })
        events.center.dispatch('update_group', {
          id: self.data.group_id,
          name: new_group_name
        })
      }
    })
  },
  onRemoveMember: function(e){
    var self = this
    var member_id = e.currentTarget.dataset.member

    if(!this.data.is_master){
      wx.showToast({
        title: '只有群主才能删除成员'
      })
      return
    }
    if(this.data.userInfo.id == member_id){
      return
    }

    wx.showModal({
      title: "提示",
      content: "您确定要删除这个成员吗？",
      showCancel: true,
      success: function(res) {
        if(res.confirm){
          requests.post({
            url: '/album/group/member/remove',
            data: {
              group_id: self.data.group_id,
              user_id: member_id
            },
            success: function(resp) {
              console.log('REMOVE GROUP SUCCESS')
              var members = self.data.member_data
              for(var i = 0; i < members.length; i++){
                if(members[i].id == member_id){
                  members.splice(i, 1)
                  break
                }
              }
              self.setData({
                member_data: members
              })

              events.center.dispatch('remove_member')
            },
            fail: function(resp) { 
              console.log('GET MEMBER LIST FAIL!')
              console.log(resp)
            }
          })
        }
      }
    })
  },
  onRemoveGroup: function(e) {
    var self = this
    wx.showModal({
      title: "提示",
      content: "您确定要删除这个群吗？",
      showCancel: true,
      success: function(res) {
        if(res.confirm){
          requests.post({
            url: '/album/group/remove',
            data: {
              id: self.data.group_id
            },
            success: function(resp) {
              console.log('REMOVE GROUP SUCCESS')
              wx.redirectTo({
                url: '../group_list'
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
        duration: 300,
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
  onTapGroupName: function(e) {
    if(this.data.is_master && !this.data.show_panel){
        clearTimeout(this.data.panel_timer)
        this.setData({
          show_panel: true,
          group_name_input_default: this.data.group_name
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
    var self = this
    var group_id = options.id

    getApp().getUserInfo(function(userInfo){
      console.log('userinfo: ', userInfo)
      self.setData({
        group_id: group_id,
        userInfo: app.globalData.userInfo,
        is_master: parseInt(options.is_master) == 1
      })

      requests.get({
        url: '/album/group/detail?group_id='+group_id,
        success: function(resp) {
          console.log('GET MEMBER LIST SUCCESS')
          self.setData({
            group_name: resp.data.name,
            member_data: resp.data.members
          })
        },
        complete: function(e) {
        }
      })

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
  },
  onPullDownRefresh: function () {
    console.log('onPullDownRefresh', new Date())
  },
  stopPullDownRefresh: function () {
    wx.stopPullDownRefresh({
      complete: function (res) {
        console.log(res, new Date())
      }
    })
  },
})