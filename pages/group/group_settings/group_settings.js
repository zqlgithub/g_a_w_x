var requests = require('../../../utils/requests.js')
var events = require('../../../utils/events.js')
const Share = require('../../../components/shareQrcode/shareQrcode');


var loading = false;
var app = getApp()
Page({
  data: {
    co_edit: true,
    live_mode: false,
    front_cover: undefined,
    deleting: false,
    group_data: {},
    member_data: [],
    memberPageNum: undefined,
    panel_animation: {},
    show_panel: false,
    group_name_input_default: "",
    to_create_group_name: "",
    finger_animation: {},
    show_finger: false,
    is_master: false,
    showShareDialog:false,
    shareData: false
  },
  onInputGroupName: function (e) {
    this.setData({
      to_create_group_name: e.detail.value
    })
  },
  onEditGroupName: function (e) {
    var self = this
    var new_group_name = self.data.to_create_group_name
    requests.post({
      url: "/album/group/update",
      data: {
        id: this.data.group_id,
        name: new_group_name
      },
      success: function (resp) {
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

  onSetEdit: function (e) {
    var self = this
    var co_edit = e.detail.value
    requests.post({
      url: "/album/group/update",
      data: {
        id: this.data.group_id,
        co_edit: co_edit ? 1 : 0
      },
      success: function (resp) {
        self.onTapBg()
        var to_set_data = { 'group_data.co_edit': co_edit }
        self.setData(to_set_data)
      },
      fail: function (resp) {
        self.setData({
          co_edit: self.data.group_data.co_edit
        })
        wx.showToast({
          title: resp.msg,
          icon: 'success',
          duration: 2000
        })
      }
    })
  },

  onRemoveMember: function (e) {
    var self = this
    var member_id = e.currentTarget.dataset.member
    if (!this.data.deleting) {
      return false;
    }
    if (!this.data.is_master) {
      wx.showToast({
        title: '只有群主才能删除成员'
      })
      return
    }
    if (this.data.userInfo.id == member_id) {
      return
    }

    wx.showModal({
      title: "提示",
      content: "您确定要删除这个成员吗？",
      showCancel: true,
      success: function (res) {
        if (res.confirm) {
          requests.post({
            url: '/album/group/member/remove',
            data: {
              group_id: self.data.group_id,
              user_id: member_id
            },
            success: function (resp) {
              console.log('REMOVE GROUP SUCCESS')
              var members = self.data.member_data
              for (var i = 0; i < members.length; i++) {
                if (members[i].id == member_id) {
                  members.splice(i, 1)
                  break
                }
              }
              self.setData({
                member_data: members
              })

              events.center.dispatch('remove_member')
            },
            fail: function (resp) {
              console.log('GET MEMBER LIST FAIL!')
              console.log(resp)
            }
          })
        }
      }
    })
  },
  onTapInviteBtn: function (e) {
    var self = this
    wx.showModal({
      title: "提示",
      content: "点击“本页面”或“相册页面”右上角的按钮，分享给微信好友或群聊",
      showCancel: false,
      success: function (res) {
        self.setData({
          show_finger: true
        })

        // var animation = wx.createAnimation({
        //   timingFunction: 'ease', 
        //   duration: 300,
        //   transformOrigin: '50% 0 0',
        // })
        // animation.top('50rpx').step()
        // animation.top('10rpx').step()
        // self.setData({
        //   finger_animation: animation.export()
        // })

        setTimeout(function () {
          self.setData({
            show_finger: false
          })
        }, 1000)
      }
    })
  },
  onRemoveGroup: function (e) {
    var self = this
    wx.showModal({
      title: "提示",
      content: "您确定要删除这个群吗？",
      showCancel: true,
      success: function (res) {
        if (res.confirm) {
          requests.post({
            url: '/album/group/remove',
            data: {
              id: self.data.group_id
            },
            success: function (resp) {
              console.log('REMOVE GROUP SUCCESS')
              // wx.redirectTo({
              //   url: '../group_list'
              // })
              wx.navigateBack({
                delta: 2,
              })
            }
          })
        }
      }
    })
  },

  switchPanel: function (is_open) {
    if (!this.panel_animation) {
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
  onTapGroupName: function (e) {
    if (this.data.is_master && !this.data.show_panel) {
      clearTimeout(this.data.panel_timer)
      this.setData({
        show_panel: true,
        group_name_input_default: this.data.group_name
      })
      this.switchPanel(true)
    }
  },
  onCancelPanel: function (e) {
    this.onTapBg()
  },
  onTapBg: function (e) {
    var self = this
    var onTimeout = function () {
      self.setData({
        show_panel: false
      })
    }
    this.setData({
      panel_timer: setTimeout(onTimeout, 300)
    })
    this.switchPanel(false)
  },

  onLoad: function (options) {
    var self = this
    var group_id = options.id

    try {
      var res = wx.getSystemInfoSync()
      var scroll_height = Math.floor(750 * res.windowHeight / res.windowWidth) - 630
      this.setData({
        scroll_height: scroll_height,
      })
    } catch (e) {
      // Do something when catch error
    }

    getApp().getUserInfo(function (userInfo) {
      console.log('userinfo: ', userInfo)
      self.setData({
        group_id: group_id,
        userInfo: app.globalData.userInfo,
        is_master: parseInt(options.is_master) == 1
      })

      requests.get({
        url: '/album/group/detail?group_id=' + group_id,
        success: function (resp) {
          console.log('GET MEMBER LIST SUCCESS');
          // debugger;
          self.setData({
            group_data: resp.data,
            group_name: resp.data.name,
            front_cover: resp.data.front_cover,
            live_mode: resp.data.live_mode,
            co_edit: resp.data.co_edit
          })

          // events.center.dispatch('update_group', {
          //   id: group_id,
          //   member_count: resp.data.members.length
          // })
        },
        complete: function (e) {
        }
      });

      self.getGroupMember();




    })
  },
  loadMoreMembers: function () {
    // debugger;
    this.getGroupMember();
  },
  getGroupMember: function (init) {
    var group_id = this.data.group_id;
    var self = this;
    if (loading) {
      return;
    }

    loading = true;
    if (init) {
      this.setData({
        memberPagination: null,
        member_data: []
      });
    }
    var page = this.data.memberPageNum;
    var param = {
      group_id: group_id,
      live: 0
    };
    if (page) {
      param.pagination = page;
    }

    // var member_data = this.data.member_data.concat(members).concat(members);
    // self.setData({
    //   member_data
    // });

    requests.get({
      url: '/album/group/member/list',
      data: param,
      success: function (res) {
        // debugger;
        loading = false;
        self.setData({
          member_data: self.data.member_data.concat(res.data),
          memberPageNum: res.data.length > 0 ? res.data[res.data.length - 1].pagination : null
        });
      },
      fail: function (msg) {
        loading = false;
        debugger;
      }
    });
  },
  onReady: function () {
    // 页面渲染完成
  },
  onShow: function () {
    // 页面显示
  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
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
  onShareAppMessage: function () {
    wx.setStorage({
      key: 'has_invited',
      data: true
    })

    var userInfo = this.data.userInfo
    var inviteCode = userInfo ? userInfo.invite_code : ''
    return {
      title: userInfo.name + '邀请你加入《' + this.data.group_name + "》相册",
      imageUrl: this.data.front_cover,
      path: '/pages/group/group_list?action=join_group&id=' + this.data.group_id + '&invite_code=' + inviteCode
    }
  },
  setDeleting: function () {
    this.setData({
      deleting: !this.data.deleting
    });
  },
  setLiveMode: function () {
    var self = this;
    var updateLiveMode = function () {
      requests.post({
        url: "/album/group/update",
        data: {
          id: self.data.group_id,
          live_mode: self.data.live_mode ? 1 : 0
        },
        success: function (resp) {
          wx.showToast({
            title: "切换成功",
            icon: 'success',
            duration: 2000
          });
          events.center.dispatch('update_group', {
            id: self.data.group_id,
            live_mode: self.data.live_mode
          })
        },
        fail: function (resp) {
          wx.showToast({
            title: resp.msg,
            icon: 'success',
            duration: 2000
          })
        }
      })
    }
    if (this.data.live_mode) {
      wx.showModal({
        title: '提示',
        content: '您确定要将相册切换成普通相册吗',
        success: function (res) {
          //todo
          // debugger;
          if (res.cancel) {
            self.setData({
              live_mode: true
            })
          } else {
            self.setData({
              live_mode: false
            });
            updateLiveMode();
          }
        }
      })
    } else {
      wx.showModal({
        title: '您确定要将相册切换成live模式吗',
        content: '设置后，相册可以实时共享照片，1天后恢复成普通相册',
        success: function (res) {
          //todo
          // debugger;
          if (res.cancel) {
            self.setData({
              live_mode: false
            })
          } else {
            self.setData({
              live_mode: true
            });
            updateLiveMode();
          }
        }
      })
    }
  },
  getQrcode:function(){
    Share.show(this, {
      group_name: this.data.group_name,
      group_id: this.data.group_id
    });
  },
  saveSharePhoto:function(){
    Share.save();
  },
  tapShareMask:function(){
    Share.close(this);
  }
})