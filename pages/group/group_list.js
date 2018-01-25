var requests = require('../../utils/requests.js')
var util = require('../../utils/util.js')
var events = require('../../utils/events.js')

var app = getApp()
Page({
  data:{
    loading: true,
    default_title: "点击+按钮，创建一个与好友共享的群相册",
    group_icon_width: 114,

    group_data: [],
    group_msg: {},
    show_panel: false,
    live_mode: false,
    plus_btn_animation: {},
    create_panel_animation: {},
    panel_animation: {},
    to_create_group_name: null,
    group_input_default: "",
    newPhotoMsg:{},
    newJoinGroupReq: {},
  },
  onSelectGroup: function(e){
    if(this.longtaping){
      return
    }
    var curr_group_id = e.currentTarget.dataset.group;
    var live_mode = e.currentTarget.dataset.mode;
    // debugger;
    var role = e.currentTarget.dataset.role;

    if(role==4){
      wx.showModal({
        title: '提示',
        showCancel:false,
        content: '相册主人通过您的申请后才可以查看哦~',
      });
      return;
    }
    if(live_mode){
      wx.navigateTo({
        url: '../live/live?id=' + curr_group_id
      });
    }else{
      wx.navigateTo({
        url: '../timeline/timeline?id=' + curr_group_id
      })
    }
    
  },
  
  onTapSettings: function(e) {
    var curr_group_id = e.currentTarget.dataset.groupid
    var is_master = e.currentTarget.dataset.master ? 1 : 0

    wx.navigateTo({
      url: 'group_settings/group_settings?id='+curr_group_id+'&is_master='+is_master
    })
  },
  onLongTapGroup: function(e) {
    this.longtaping = true

    var curr_group_id = e.currentTarget.dataset.group
    var self = this
    wx.showActionSheet({
      itemList: ['置顶', '退出该群'],
      itemColor: '#4bbccc',
      success: function(res) {
        if(res.tapIndex === 0){
          self.makeTop(curr_group_id)
        }else if(res.tapIndex === 1){
          requests.post({
            url: '/album/group/remove',
            data: {
              id: curr_group_id
            },
            success: function(resp) {
              self.syncGroupData()
            }
          })
        }
      },
      complete: function() {
        self.longtaping = false
      }
    })
  },
  makeTop: function(group_id){
    var self = this
    requests.post({
      url: '/album/group/update',
      data: {
        id: group_id,
        order: 1
      },
      success: function(resp){
        self.syncGroupData()
      }
    })
  },
  onTapTop: function(e){
    var group_id = e.currentTarget.dataset.groupid
    this.makeTop(group_id)
  },
  

  //--------------
  // 创建群相关
  // switchPanel: function(is_open){
  //   if(!this.plus_animation){
  //     var plus_animation = wx.createAnimation({
  //       duration: 300,
  //       timingFunction: 'ease', 
  //       delay: 0,
  //       transformOrigin: '50% 50% 0',
  //       success: function(res) {
  //         console.log('ANIMATION SUCCESS!!')
  //       }
  //     })
  //     this.plus_animation = plus_animation
  //   }
    
  //   var angel = is_open ? 45: 0;
  //   this.plus_animation.rotate(angel).step()

  //   if(!this.panel_animation){
  //     var panel_animation = wx.createAnimation({
  //       duration: 300,
  //       timingFunction: 'ease', // "linear","ease","ease-in","ease-in-out","ease-out","step-start","step-end"
  //       delay: 0,
  //       transformOrigin: '50% 0 0',
  //     })
  //     this.panel_animation = panel_animation
  //   }
    
  //   var ty = is_open ? "0rpx" : "-800rpx";
  //   this.panel_animation.bottom(ty).step()

  //   this.setData({
  //     plus_btn_animation: this.plus_animation.export(),
  //     panel_animation: this.panel_animation.export()
  //   })
  // },

  onTapCreate: function(e) {
    var self = this
    var show = !this.data.show_panel
    if(show){
      this.setData({
        show_panel: show
      })
    }else{
      self.setData({
        show_panel: show
      })
    }
    // this.switchPanel(show)
  },
  onInputGroupName: function(e) {
    this.setData({
      to_create_group_name: e.detail.value
    })
  },
  onCreateGroup: function(e){
    var group_name = this.data.to_create_group_name
    if(!group_name){
      wx.showToast({
        title: '请输入相册名字'
      })
    }else if(util.strByteLen(group_name) > 26){
      wx.showToast({
        title: '名字太长了'
      })
    }else{
      if(this.group_creating){
        return
      }
      this.group_creating = true
      var self = this
      requests.post({
        url: '/album/group/create',
        data: {
          name: this.data.to_create_group_name,
          live_mode: this.data.live_mode?1:0
        },
        complete: function() {
          self.group_creating = false
        },
        success: function (resp){
          var group_data = self.data.group_data
          group_data.push({
            id: resp.data.id,
            name: self.data.to_create_group_name
          })
          self.setData({
            group_data: group_data,
            show_panel: false,
            group_input_default: ""
          })
          // self.switchPanel(false)

          if (self.data.live_mode) {
            wx.navigateTo({
              url: '../live/live?id=' + resp.data.id
            });
          } else {
            wx.navigateTo({
              url: '../timeline/timeline?id=' + resp.data.id
            })
          }

          // wx.navigateTo({
          //   url: '../timeline/timeline?id='+resp.data.id,
          //   success: function(res){
          //     // success
          //   },
          // });
        }
      })
    }
  },
  onTapBg: function(e) {
    if(this.data.show_panel) {
      this.onTapCreate()
    }
  },
  syncGroupData: function() {
    var self = this
    requests.get({
      url: '/album/group/list',
      success: function(resp){
        self.setData({
          loading: false,
          group_data: resp.data,
          show_panel: false
        })
      },
      fail: function(resp) {
        self.setData({
          loading: false,
          default_title: "网络请求失败，请稍后再试"
        })
      },
      complete: function(resp) {
        wx.hideToast()
      }
    })
  },

  onLoad:function(options){
    wx.showToast({
      title: "加载中",
      icon: "loading",
      duration: 100000
    })

    var self = this
    getApp().getUserInfo(function(userInfo){

      self.setData({
        userInfo: app.globalData.userInfo
      })
      
      self.syncGroupData()
      if(options.action == 'join_group'){
        self.joinGroup(options.invite_code, options.id, function () {
          if (options.live) {
            console.log(options);
            wx.navigateTo({
              url: '../live/live?action=' + options.action + '&id=' + options.id
            })

          } else {
            wx.navigateTo({
              url: '../timeline/timeline?action=' + options.action + '&id=' + options.id + '&invite_code=' + options.invite_code
            })
          }
        });
        
      }else{
        var scene = options.scene ? decodeURIComponent(options.scene) : undefined;
        if(scene){
          console.log('get scene:', scene)
          var scene_data = util.queryToDict(scene)
          self.joinGroup(scene_data.v, scene_data.id, function () {
            wx.navigateTo({
              url: '../live/live?action=join_group&id=' + scene_data.id
            })
          }, scene_data.u);
        }
        
      }

    })


    
  },
  joinGroup: function (invite_code, group_id, cb, invitor) {
    var self = this;
    console.log("joinGroup");
    console.log(invite_code);
    var params = {
      group_id: group_id,
      invite_code: invite_code
    }
    if(invitor){
      params['invitor'] = invitor
    }
    requests.post({
      url: '/album/group/join',
      data: params,
      success: function (res) {
        // debugger;
        if (cb){
          cb();
        }
        console.log(res);
      },
      fail: function (err) {
        // debugger;
        wx.showModal({
          title: '提示',
          content: err.msg,
        })
        console.log(msg);
      }
    });
  },
  onReady:function(){
    // 页面渲染完成
  },
  handlerMsg:function(){
    var self = this;
    
    self.setData({
      newPhotoMsg:{},
      newJoinGroupReq: {}
    });
    var newPhotoMsg = {};
    var newJoinGroupReq = {}
    requests.get({
      url: '/user/msg/list',
      data: {
      },
      success: function (resp) {
        var msgs = resp.data;
        if(msgs){
          msgs.map((v,k)=>{
            if (util.msgType[v.msg_type] == '系统消息'){
              wx.showModal({
                title: '系统消息',
                content: v.msg,
                showCancel:false
              });
              requests.post({
                url: '/user/msg/read',
                data: {
                  msg_id: v.id
                }
              });
            } else if (util.msgType[v.msg_type] == '新照片'){
              newPhotoMsg[v.group_id] = true;
            } else if (v.msg_type == 20){
              if(!(v.group_id in newJoinGroupReq)){
                newJoinGroupReq[v.group_id] = 0
              }
              newJoinGroupReq[v.group_id] += 1
            }
          });
          self.setData({
            newPhotoMsg: newPhotoMsg,
            newJoinGroupReq: newJoinGroupReq
          });
        }
      }
    });

  },
  onShow:function(){
    if(this.data.userInfo){
      this.syncGroupData()
    } 
    this.handlerMsg();
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  },
  hideMask:function(){
    if (this.data.show_panel){

    }
  },
  setLifeMode:function(){
    this.setData({
      live_mode: !this.data.live_mode
    })
  }
})