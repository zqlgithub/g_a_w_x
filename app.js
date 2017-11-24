//app.js
var requests = require('/utils/requests.js')

App({
  syncUserInfo: function(){
    this.getUserInfo(function(userinfo){
      requests.post({
          url: '/user/update',
          data: {
            name: userinfo.nickName,
            avatar: userinfo.avatarUrl,
            gender: userinfo.gender,
            province: userinfo.province,
            city: userinfo.city,
            country: userinfo.country
          },
          success: function(resp){
            console.log('UPDATE USER INFO SUCCESS')
          },
          fail: function(resp){
            console.log('UPDATE USER INFO FAIL')
            console.log(resp)
          }
        })
    })
  },
  login: function(code, userInfo, cb){
    // 先用默认的session登录
    console.log('login with: ', userInfo)
    requests.post({
      url: '/user/login',
      success: function(resp){
        console.log(resp)
        typeof cb == "function" && cb(resp.data)
      },
      fail: function(resp){
        console.log('自动登录失败，进行微信登录')
        requests.post({
          url: '/user/wx/login',
          data: {
            code: code,
            name: userInfo.nickName,
            avatar: userInfo.avatarUrl
          },
          success: function(resp){
            // 后端登录微信成功，存下session
            try{
              wx.setStorageSync('sessionid', resp.data.sessionid)
            } catch (e) {
              console.log('SAVE SESSION ERROR', e)
            }
            typeof cb == "function" && cb(resp.data.user)
          },
          fail: function() {
            wx.showToast({
              title: "网络异常，用户登录失败"
            })
          }
        })
      }
    })
  },
  onLaunch: function () {
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  getUserInfo:function(cb){
    var that = this;
    wx.login({
      success: function(res){
        if(that.globalData.userInfo){
          typeof cb == "function" && cb(that.globalData.userInfo)
        }else{
          var code = res.code
          wx.getUserInfo({
            success: function (res) {
              var userinfo = res.userInfo
              console.log('get user info: ', userinfo)
              that.login(code, userinfo, function(data){
                // 如果用户信息有变动，就更新用户信息
                if(userinfo.nickName != data.name || userinfo.avatarUrl != data.avatar){
                  requests.post({
                    url: '/user/update',
                    data: {
                      name: userinfo.nickName,
                      avatar: userinfo.avatarUrl,
                      gender: userinfo.gender,
                      province: userinfo.province,
                      city: userinfo.city,
                      country: userinfo.country
                    },
                    success: function(resp){
                      console.log('UPDATE USER INFO SUCCESS')
                    }
                  })
                }

                userinfo.id = data.id
                userinfo.invite_code = data.invite_code
                userinfo.msg_list = data.user_msg
                that.globalData.userInfo = userinfo
                typeof cb == "function" && cb(userinfo)
              })
            },
            fail: function() {
              wx.showToast({
                title: "获取用户信息失败"
              })
            }
          })
          
        }
      },
      fail: function() {
        // fail
      },
      complete: function() {
        // complete
      }
    })
  },
  getSystemInfo:function(){
    if (this.globalData == null){
      this.globalData.systemInfo = wx.getSystemInfoSync()
    }
    return this.globalData.systemInfo
  },
  listen: function(event_type, cb){
    
  },
  dispatch: function(event_type){
    
  },
  globalData:{
    userInfo: null,
    systemInfo: null
  }
})