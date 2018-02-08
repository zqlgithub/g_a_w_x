var requests = require('../../utils/requests.js')
var util = require('../../utils/util.js')
var upyun = require('../../utils/upyun.js')
var events = require('../../utils/events.js')

var app = getApp()
Page({
  data:{
    group_id:undefined,
    userInfo: null,
    loading: true,
    scroll_height: 1100,
    is_master: false,
    to_top: false,
    member_count: 0,
    default_title: "点击+按钮，分享你们值得纪念的瞬间", 
    bottom_tip: '',
    item_per_row: 3,
    timeline_data: [],       // 这个是展示出来的照片数据，部分折叠
    full_timeline_data: [],  // 这个是所有的相册数据
    full_album_map: {},      // 记录那些album被打开了
    page_state: 1,  //1 正常 2 选择删除模式
    select_photo: {},
    show_scroll_to_end: false, // 是否展示滚到底部的标识
    scroll_end_txt: '',   // 底部提示
    scroll_start_txt: '',  // 顶部提示
    top_album_id: '',
    show_tip: false,
    
    show_search_panel: false,
    show_search_bar: false,
    search_bar_animation: {},
    search_date_options: [],
    search_txt: '',
    search_date: {
      year: -1,
      month: -1,
      day: -1
    },
    search_date_txt: '',
    search_new: false,   // 是否筛选最新照片

    // 新照片通知
    photo_msg: [],
    new_photo: {},

    panel_timer: null,
    show_panel: false,
    album_input_default: '',
    plus_btn_animation: {},
    panel_animation: {},
    to_create_album_date: util.formatDate(new Date()),

    edit_panel_animation: {},
    show_edit_panel: false,
  },

  //---------------
  // 公共函数
  getAlbumIndex: function(album_id) {
    for(var i in this.data.full_timeline_data){
      if(this.data.full_timeline_data[i].id == album_id){
        return i
      }
    }
    return -1
  },
  scrollAlbumToTop:function(album_id){
    this.setData({
      top_album_id: 'album-'+album_id
    })
  },
  makeTop: function(album_id, photo_id) {
    var index = this.getAlbumIndex(album_id)
    var photos = this.data.full_timeline_data[index].photos
    for(var i in photos){
      if(photos[i].id == photo_id){
        photos[i].order = Date.now() / 1000
        break
      }
    }

    photos.sort(function(p1, p2){
      if(p1['order'] > p2['order']) return -1;
      else if(p1['order'] < p2['order']) return 1;
      return 0
    })
    var to_set_data = {}
    to_set_data['full_timeline_data['+index+'].photos'] = photos
    this.setData(to_set_data)
    this.displayAlbum(index)
  },

  batchMakeTop: function(album_id, photo_ids) {
    var photo_set = new Set()
    for(var i in photo_ids){
      photo_set.add(photo_ids[i])
    }

    var index = this.getAlbumIndex(album_id)
    var photos = this.data.full_timeline_data[index].photos

    var curr_order = photos[0].order
    for(var j = photos.length-1; j >= 0; j--){
      if(photo_set.has(photos[j].id)){
        photos[j].order = ++curr_order
      }
    }

    photos.sort(function(p1, p2){
      if(p1['order'] > p2['order']) return -1;
      else if(p1['order'] < p2['order']) return 1;
      return 0
    })
    var to_set_data = {}
    to_set_data['full_timeline_data['+index+'].photos'] = photos
    this.setData(to_set_data)
    this.displayAlbum(index)
  },

  addPhoto: function(album_id, photo_id, photo_url, loading=false){
    var i = this.getAlbumIndex(album_id)
    if(i == -1)return

    var photo = {
      id: photo_id,
      url: photo_url,
      thumbnail: photo_url,
      loading: loading,
      progress: 0
    }
    var timeline = this.data.full_timeline_data
    timeline[i].photos.push(photo)
    this.setData({
      full_timeline_data: timeline
    })
    this.displayAlbum(i)
  },
  removePhoto: function(album_id, photo_id){
    var i = this.getAlbumIndex(album_id)
    var photos = this.data.timeline_data[i].photos
    for(var j = 0; j < photos.length; j++){
      if(photos[j].id === photo_id){
        photos.splice(j, 1)
        var to_set_data = {}
        to_set_data['timeline_data['+i+'].photos'] = photos
        this.setData(to_set_data)
        return
      }
    }
  },

  // 搜索相关
  // 初始化搜索弹框的数据
  // showSearchBar: function() {
  //   if (this.show_search_bar) return

  //   this.show_search_bar = true
  //   clearTimeout(this.hide_bar_timer)
    
  //   // var animation = wx.createAnimation({
  //   //   duration: 400,
  //   //   timingFunction: 'linear'
  //   // })

  //   // animation.opacity(1).step()
  //   this.setData({
  //     show_search_bar: true,
  //     // search_bar_animation: animation.export(),
  //   })
  // },

  // hideSearchBar: function() {
  //   if (!this.show_search_bar) return
  //   this.show_search_bar = false

  //   // var animation = wx.createAnimation({
  //   //   duration: 400,
  //   //   timingFunction: 'linear'
  //   // })

  //   // animation.opacity(0).step()
  //   // this.setData({
  //   //   show_search_bar: true,
  //   //   search_bar_animation: animation.export(),
  //   // })

  //   var self = this
  //   this.hide_bar_timer = setTimeout(function() {
  //     self.setData({
  //       show_search_bar: false,
  //     })
  //   }, 1000)
  // },

  initSearchOptions: function() {
    // 初始化筛选条件
    var this_year = new Date().getFullYear()
    var year_options = []
    for(var i = 0; i < 20; i++) {
      year_options.push(this_year--)
    }

    var month_options = []
    var month_values = []
    for(var j = 1; j < 13; j++) {
      month_options.push(j+'月')
      month_values.push(j)
    }

    var day_options = []
    for(var k = 1; k < 32; k++) {
      day_options.push(k)
    }

    this.setData({
      search_date_options: [{
        name: 'year',
        options: year_options,
        values: year_options
      }, {
        name: 'month',
        options: month_options,
        values: month_values
      }, {
        name: 'day',
        options: day_options,
        values: day_options
      }]
    })
  },

  onTapSearchDate: function(e){
    var name = e.currentTarget.dataset.name
    var value = e.currentTarget.dataset.value
    var search_date = this.data.search_date
    var origin_value = search_date[name]
    search_date[name] = (search_date[name] == value) ? -1 : value

    var search_date_txt = '';
    // debugger;
    if(search_date.year >= 0){
      search_date_txt += search_date.year
      if(search_date.month >= 0){
        search_date_txt += '-' + search_date.month
        if(search_date.day >= 0) {
          search_date_txt += '-' + search_date.day
        }
      } else if (search_date.day>=0){
        wx.showToast({
          title: '请选择月份'
        })
        search_date[name] = origin_value
        return
      }
    } else if (search_date.month>0){
      wx.showToast({
        title: '请选择年份'
      })
      search_date[name] = origin_value
      return
    }

    this.setData({
      search_date: search_date,
      search_date_txt: search_date_txt
    })

  },

  onSearchInput: function(e) {
    this.setData({
      search_txt: e.detail.value
    })
  },

  onSearchFocus: function(e) {
    // this.setData({
    //   show_search_panel:true
    // })
  },

  onSearchBlur: function(e) {
    
  },

  onSearch: function(e) {
    this.setData({
      show_search_panel:false
    })
    this.syncTimeline()
  },

  onTapSearchBg: function(e) {
    // this.setData({
    //   show_search_panel:false
    // })
  },


  // 上传单张照片
  uploadPhoto: function(album_id, file_path) {
    var self = this
    var temp_id = 'upload_' + String(Date.now())
    
    this.addPhoto(album_id, temp_id, file_path, true)
    upyun.upload({
      file_path: file_path,
      data: {
        album_id: album_id
      },
      progress: function(resp) {
        console.info('uploading...', resp.progress)
        var timeline_data = self.data.timeline_data
        // 通过temp_id找到刚为了显示loading状态添加的图片，更新其上传成功后的参数
        var i = self.getAlbumIndex(album_id)
        var j = 0
        for (; j < timeline_data[i].photos.length; j++) {
          var photo = timeline_data[i].photos[j]
          if (photo.id == temp_id) break
        } 
        var to_set = {}
        to_set['timeline_data['+i+'].photos['+j+'].progress'] = resp.progress
        self.setData(to_set)
      },
      success: function(resp) {
        var data = resp.data
        requests.post({
          url: '/album/photo/create',
          data: {
            album_id: album_id,
            photo_url: data.url,
            upload_data: JSON.stringify(data)
          },
          success: function(resp) {
            console.log(resp)
            var full_timeline = self.data.full_timeline_data
            // 通过temp_id找到刚为了显示loading状态添加的图片，更新其上传成功后的参数
            var i = self.getAlbumIndex(album_id)
            var j = 0
            for (; j < full_timeline[i].photos.length; j++){
              var photo = full_timeline[i].photos[j]
              if(photo.id == temp_id) break
            } 
            var new_photo = {
              id: resp.data.id,
              url: resp.data.url,
              thumbnail: resp.data.thumbnail,
              creator: {
                id: self.data.userInfo.id,
                name: self.data.userInfo.name,
                avatar: self.data.userInfo.avatar
              },
              loading: false
            }
            full_timeline[i].photos[j] = new_photo
            self.setData({
              full_timeline_data: full_timeline
            })
            self.displayAlbum(i)
          },
          fail: function(resp) {
            console.log('UPLOAD FAILLLLL!')
            self.removePhoto(album_id, temp_id)
            if(resp.msg != null){
              wx.showToast({
                title: resp.msg
              })
            }
          }
        })
      },
      fail: function(resp) {
        console.log('UPLOAD FAILLLLL!')
        self.removePhoto(album_id, temp_id)
        if(resp.msg && resp.msg != null){
          wx.showToast({
            title: resp.msg
          })
        }
      }
    })
  },


  // 点击照片
  onTapPhoto: function(e) {
    if(this.longtap){
      return
    }

    var photo = e.currentTarget.dataset.photo
    var photo_index = e.currentTarget.dataset.index
    var album_id = e.currentTarget.dataset.album
    var album_index = this.getAlbumIndex(album_id)
    var photos = this.data.timeline_data[album_index].photos

    var page_state = this.data.page_state
    // 正常状态下
    if(page_state === 1){
      if(photos[photo_index].loading){
        return;
      }

      var to_showing_photos = [], current = null
      for(var i = 0; i < photos.length; i++){
        if( i == photo_index){
          current = photos[i].url
        }
        to_showing_photos.push(photos[i].url)
      }
      var id = photos[photo_index].id

      var photo_msg = this.data.photo_msg;
      if (photo_msg[id]){
        photo_msg[id] = null
        this.setData({
          photo_msg
        });
      }

      wx.navigateTo({
        url: '/pages/photo/photo_detail?group_id=' + this.data.group_id +'&album_id='+album_id+'&init_photo='+photos[photo_index].id
      })

    // 选择模式
    }else if(page_state === 2){
      var select_photo = this.data.select_photo
      if(!select_photo[photo.id]){
        var select_count = 0
        for(var photo_id in select_photo){
          if(select_photo[photo_id]){
            select_count += 1
          }
        }
        if(select_count > 9){
          wx.showToast({
            title: '批量操作的照片不宜过多'
          })
          return
        }
      }
      select_photo[photo.id] = !select_photo[photo.id]
      this.setData({
        select_photo: select_photo
      })
    }

    this.setData({
      show_search_panel:false
    })
  },

  onLongTapPhoto: function(e) {
    if(this.data.page_state != 1){
      return
    }

    this.onSelectState()
  },
  
  onTapTop: function(e){
    var self = this
    var album_id = e.currentTarget.dataset.album
    var photo_id = e.currentTarget.dataset.photo
    requests.post({
      url: '/album/photo/update',
      data: {
        'photo_id': photo_id,
        'order': 1
      },
      success: function(resp){
        self.makeTop(album_id, photo_id)
      }
    })

  },

  onTapAlbumTitle: function(e) {
    var album_id = e.currentTarget.dataset.album_id
    this.scrollAlbumToTop(album_id)
  },
  
  //---------------
  // 添加照片相关
  
  
  // 响应点击添加照片的事件
  onAddPhoto: function(e){
    var page_state = this.data.page_state
    if(page_state === 1){
      if(!this.data.is_master && !this.data.co_edit){
        wx.showToast({
          title: '群主设置了权限，您暂时不能上传照片哦',
        })
        return
      }

      var self = this
      var select_album_id = e.currentTarget.dataset.album
      var select_album_index = e.currentTarget.dataset.index

      wx.chooseImage({
        count: 9, 
        sizeType: ['original', 'compressed'], 
        sourceType: ['album', 'camera'], 
        success: function(res){
          // success
          console.log('SELECT PHOTO SUCCESS')
          console.log(res)
          self.expandAlbum(select_album_index)
          for(var i = 0; i < res.tempFilePaths.length; i++){
            self.uploadPhoto(select_album_id, res.tempFilePaths[i])
          }
        }
      })
    }
  },

  //-----------------
  // 删除相册
  onRemoveAlbum: function(e) {
    var self = this
    var album_id = e.currentTarget.dataset.album
    wx.showModal({
      title: "提示",
      content: "您确定要删除这个相册吗？",
      showCancel: true,
      success: function(res) {
        if(res.confirm){
          requests.post({
            url: '/album/remove',
            data: {
              album_id: album_id
            },
            success: function(resp) {
              console.log('REMOVE ALBUM SUCCESS')
              self.syncTimeline()
            },
            fail: function(resp) { 
              console.log('REMOVE ALBUM FAIL!')
              console.log(resp)
            }
          })
        }
      }
    })
  },

  onAlbumDetail: function(e){
    var pass_data = {
      id: e.currentTarget.dataset.album,
      name: e.currentTarget.dataset.album_name,
      date: e.currentTarget.dataset.album_date,
      is_master: this.data.is_master ? 1 : 0
    }

    wx.navigateTo({
      url: '/pages/album/album_settings?'+util.dictToQuery(pass_data),
    })
  },

  //-----------------
  // 创建相册相关
  showTip: function(tip) {

    var self = this
    if(this.tipTimer){
      clearTimeout(this.tip_timer)
    }
    self.setData({
      show_tip: true,
      bottom_tip: tip
    })
    this.tip_timer = setTimeout(function(){
      self.setData({
        show_tip: false,
        bottom_tip: ''
      })
      clearTimeout(self.tip_timer)
    }, 5000)
  },
  switchPlusBtn:function(is_open){
    if(!this.plus_animation){
      var plus_animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease', 
        delay: 0,
        transformOrigin: '50% 50% 0',
        success: function(res) {
          console.log('ANIMATION SUCCESS!!')
        }
      })
      this.plus_animation = plus_animation
    }
    var angel = is_open ? 45: 0;
    this.plus_animation.rotate(angel).step()

    this.setData({
      plus_btn_animation: this.plus_animation.export()
    })
  },
  hidePlusBtn:function(hide){
    var plus_animation = wx.createAnimation({
      duration: 400,
      timingFunction: 'ease', 
      delay: 0,
      transformOrigin: '50% 50% 0',
      success: function(res) {
        console.log('ANIMATION SUCCESS!!')
      }
    })
    this.plus_animation = plus_animation
    var op = hide ? 0: 1;
    this.plus_animation.opacity(op).step()

    this.setData({
      plus_animation: this.plus_animation.export()
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

  onChangeDate: function(e) {
    this.setData({
      to_create_album_date: e.detail.value
    })
  },
  onInputAlbumName: function(e) {
    this.setData({
      to_create_album_name: e.detail.value
    })
  },
  onCreateAlbum: function(e){
    debugger;
    var self = this
    var to_create_album_name = this.data.to_create_album_name
    var to_create_album_date = this.data.to_create_album_date
    if(to_create_album_name && util.strByteLen(to_create_album_name) > 26){
      wx.showToast({
        title: "相册名太长了，精简一点会好记一些哦"
      })
    }else{
      console.log('准备创建相册')
      // 防止重复点击
      if(this.album_creating){
        return
      }
      this.album_creating = true
      var to_create_album_date = util.strToDate(to_create_album_date)
      var req_data = {
        group_id: this.data.group_id,
        date: Date.UTC(to_create_album_date.getFullYear(), to_create_album_date.getMonth(), to_create_album_date.getDate()) / 1000
      }
      if(to_create_album_name){
        req_data['name'] = to_create_album_name
      }

      requests.post({
        url: "/album/create",
        data: req_data,
        complete:function() {
          self.album_creating = false
        },
        success: function(resp){
          self.setData({
            show_panel: false,
            album_input_default: '',
            to_create_album_name: '',
            to_create_album_date: util.formatDate(new Date()),
            // 取消搜索内容
            search_date: {
              year: -1,
              month: -1,
              day: -1
            },
            search_txt: '',
            search_date_txt: ''
          })

          self.onTapBg()
          self.initTimelineTo(resp.data.id)

          wx.chooseImage({
            count: 9, 
            sizeType: ['original', 'compressed'], 
            sourceType: ['album'], 
            success: function(res){
              // success
              console.log('SELECT PHOTO SUCCESS')
              for(var i = 0; i < res.tempFilePaths.length; i++){
                self.uploadPhoto(resp.data.id, res.tempFilePaths[i])
              }
            },
            complete: function(){
              // 邀请好友的提示
              
            }
          })
        }
      })
    }
  },

  onTapBg: function(e) {
    var self = this
    var page_state = this.data.page_state
    var onTimeout = function(){
      self.setData({
        show_panel: false
      })
    }
    this.setData({
      panel_timer: setTimeout(onTimeout, 400),
    })
    this.switchPanel(false)
  },

  onTapCreate: function(e) {
    var page_state = this.data.page_state
    var self = this
    if(this.data.page_state === 1 && !this.data.show_panel){
      clearTimeout(this.data.panel_timer)
      this.setData({
        show_panel: true
      })
      this.switchPanel(true)
      // this.switchPlusBtn(true)
    }

    // this.setData({
    //   show_search_panel:false
    // })
  },
  onTapTrash: function(e) {
    if(this.data.page_state === 2){
      this.removeSelectPhotos()
    }
  },
  onCancelPanel: function(e) {
    this.onTapBg()
  },

  onTapNewPhoto: function(e){

  },

  onTapDownLoad: function(e) {

  },

  downloadPhotos: function(urls) {
    while(urls.length > 0){
      this_url = urls.pop()
      
    }
  },
  
  //---------------
  // 删除照片
  removeSelectPhotos: function() {
    var self = this
    var select_photo = this.data.select_photo

    var all_false = true
    for(var i in select_photo){
      if(select_photo[i]){
        all_false = false
        break
      }
    }
    if(all_false){
      wx.showToast({
        icon: 'info',
        title: '请选择要删除的照片'
      })
      return
    }

    var photo_ids = []
    for(var key in select_photo){
      if(select_photo[key]){
        photo_ids.push(key)
      }
    }

    if(!this.data.is_master){
      for(var i in this.data.timeline_data){
        var album = this.data.timeline_data[i]
        for(var j in album.photos){
          var photo = album.photos[j]
          if(photo.id in select_photo && select_photo[photo.id]){
            if(photo.creator.id != this.data.userInfo.id){
              wx.showToast({
                title: '只能删除自己上传的照片哦'
              })
              return 
            }
          }
        }
      }
    }

    wx.showModal({
      title: "提示",
      content: "您确定要删除这些照片吗？",
      showCancel: true,
      success: function(res) {
        if(res.confirm){
          requests.post({
            url: '/album/photo/remove',
            data: {
              group_id: self.data.group_id,
              photo_list: JSON.stringify(photo_ids)
            },
            success: function(resp) {
              console.log('REMOVE PHOTO SUCCESS')
              self.syncTimeline()
            }
          })
        } 
      }
    })
  },

  //---------------
  // 导航bar相关
  onTop: function(e) {
    if(this.data.to_top)
      return
    var group_id = e.currentTarget.dataset.group
    var self = this
    requests.post({
      url: '/album/group/update',
      data: {
        id: group_id,
        order: 1
      },
      success: function(resp){
        self.setData({
          to_top: true
        })
      }
    })
  },
  onNormalState: function(e) {
    this.setData({
      page_state: 1,
      select_photo: {}
    })
    // this.switchPlusBtn(false)
  },
  // 编辑状态
  onSelectState: function(e) {
    this.setData({
      page_state: 3 - this.data.page_state,
      show_edit_panel: true
    })
    
    if(this.data.page_state === 2){
      clearTimeout(this.data.edit_panel_timer)
    }
    this.switchEditPanel(this.data.page_state === 2)
  },
  onTapFeeds: function(e) {
    var curr_group_id = this.data.group_id
    wx.navigateTo({
      url: '/pages/group/group_feeds/group_feeds?id='+curr_group_id
    })
  },
  onTapGroup: function(e) {
    var curr_group_id = this.data.group_id
    var is_master = this.data.is_master ? 1 : 0
    wx.navigateTo({
      url: '/pages/group/group_settings/group_settings?id='+curr_group_id+'&is_master='+is_master
    })

    this.setData({
      show_search_panel:false
    })
  },


  //---------------
  // 编辑bar
  switchEditPanel: function(is_open) {
    if(!this.edit_panel_animation){
      var panel_animation = wx.createAnimation({
        timingFunction: 'ease', // "linear","ease","ease-in","ease-in-out","ease-out","step-start","step-end"
        delay: 0,
        transformOrigin: '50% 0 0',
      })
      this.edit_panel_animation = panel_animation
    }
    
    var ty = is_open ? "0rpx" : "-140rpx";
    this.edit_panel_animation.bottom(ty).step()

    this.setData({
      edit_panel_animation: this.edit_panel_animation.export()
    })
  },

  onCancelEditPanel: function(e) {
    var self = this
    var onTimeout = function(){
      self.setData({
        show_panel: false
      })
    }
    this.setData({
      edit_panel_timer: setTimeout(onTimeout, 400),
      select_photo: {}
    })
    this.onSelectState()
    
  },
  onSetCover: function(e) {
    var self = this
    var select_photo_dict = this.data.select_photo

    var target_photo_id = 0
    for(var i in select_photo_dict){
      if(select_photo_dict[i]){
        if(target_photo_id > 0){
          wx.showToast({
            title: '只能设定一张封面哦'
          })
          return
        }
        target_photo_id = i
      }
    }
    if(target_photo_id == 0){
      wx.showToast({
        title: '请选择封面照片'
      })
      return
    }
    requests.post({
      url: '/album/group/update',
      data: {
        id: this.data.group_id,
        cover_photo_id: target_photo_id 
      },
      success: function(resp) {
        wx.showToast({
          title: '设置封面成功'
        })
      }
    })


  },
  onBatchTop: function(e) {
    
    var select_photo_dict = this.data.select_photo

    var select_count = 0
    for(var i in select_photo_dict){
      if(select_photo_dict[i]){
        select_count += 1
      }
    }

    if(select_count == 0){
      wx.showToast({
        title: '请选择照片'
      })
      return
    }
    
    var photo_ids = []
    var target_album_id = 0
    for(var i in this.data.timeline_data){
      var album = this.data.timeline_data[i]
      for(var j in album['photos']){
        var photo = album['photos'][j]
        if(photo['id'] in select_photo_dict && select_photo_dict[photo['id']]){
          photo_ids.push(photo['id'])
          target_album_id = album['id']
        }
      }
      if(target_album_id > 0){
        if(photo_ids.length != select_count){
          wx.showToast({
            title: '请选择同一相册的照片'   
          })
          return
        }
        break
      }
    }

    var self = this
    requests.post({
      url: '/album/photo/top',
      data: {
        group_id: this.data.group_id,
        album_id: target_album_id,
        photo_list: JSON.stringify(photo_ids)
      },
      success: function(resp){
        self.batchMakeTop(target_album_id, photo_ids)
      }
    })

  },


  //---------------
  // 页面初始化
  formatAlbumDate: function(date){
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()
    return year + "年" + month + "月" + day + '日'
  },

  simplifyTimeline:function(timeline_data){
    var new_timeline = []
    for(var i in timeline_data){
      new_timeline.push(this.simplifyAlbum(timeline_data[i]))
    }
    return new_timeline
  },

  simplifyAlbum: function(album) {
    var album_copy = JSON.parse(JSON.stringify(album))
    if (album_copy.photos.length > 15) {
      album_copy.photos = album_copy.photos.slice(0, 15)
      album_copy.simplify = true
    }
    return album_copy
  },

  displayAlbum: function(index) {
    var album = this.data.full_timeline_data[index]
    if(!this.data.full_album_map[album.id]){
      album = this.simplifyAlbum(album)
    }
    var to_set = {}
    to_set['timeline_data[' + index + ']'] = album
    this.setData(to_set)
  },

  displayTimeline: function(simplify = true){
    var timeline_data = []
    for (var i in this.data.full_timeline_data){
      var album = this.data.full_timeline_data[i]
      if (this.data.full_album_map[album.id]){
        timeline_data.push(album)
      }else{
        timeline_data.push(this.simplifyAlbum(album))
      }
    }
    this.setData({
      timeline_data: timeline_data
    })
  },

  syncTimeline: function(){
    var self = this
    var params = {
      group_id: this.data.group_id,
    }
    var search_date = this.data.search_date
    if(search_date.year >= 0){
      params.search_year = search_date.year
      if(search_date.month >= 0){
        params.search_month = search_date.month
        if(search_date.day >= 0){
          params.search_day = search_date.day
        }
      }
    }

    if(this.data.search_txt.length > 0){
      params.search_name = this.data.search_txt
    }

    if(self.data.invite_code){
      params.invite_code = self.data.invite_code
    }

    requests.get({
      url: '/album/group/timeline',
      data: params,
      success: function(resp) {
        wx.hideToast()

        wx.setNavigationBarTitle({
          title: resp.data.name
        })
        
        for(var i in resp.data.timeline){
          var album = resp.data.timeline[i]
          var date = new Date(album.date * 1000)
          album.date_txt = self.formatAlbumDate(date)
        }

        self.setData({
          loading: false,
          group_id: resp.data.id,
          group_name: resp.data.name,
          co_edit: resp.data.co_edit,
          co_invite: resp.data.co_invite,
          is_master: resp.data.master,
          full_timeline_data: resp.data.timeline,
          member_count: resp.data.member_count
        })
        self.displayTimeline()
      },
      fail: function(resp) {
        self.setData({
          loading: false,
          timeline_data: [],
          full_timeline_data: []
        })
        if(resp.code && resp.code == 9) {
          wx.hideToast()
          wx.showModal({
            title: "提示",
            content: resp.msg,
            showCancel: false,
            success: function(res) {
              wx.redirectTo({
                url: '/pages/group/group_list'
              })
            }
          })
        }else{
          wx.showToast({
            title: resp.msg || resp.errmsg
          })
        }
      }
    })
  },
  initTimelineTo: function(album_id) {
    var self = this

    var params = {
      group_id: this.data.group_id,
      album_id: album_id,
      direction: 0
    }

    var search_date = this.data.search_date
    if(search_date.year >= 0){
      params.search_year = search_date.year
      if(search_date.month >= 0){
        params.search_month = search_date.month
        if(search_date.day >= 0){
          params.search_day = search_date.day
        }
      }
    }

    if(this.data.search_txt.length > 0){
      params.search_name = this.data.search_txt
    }

    requests.get({
      url: '/album/group/timeline/page',
      data: params,
      success: function(resp) {
        if(resp.data != null && resp.data.length > 0){
          for(var i in resp.data){
            var album = resp.data[i]
            var date = new Date(album.date * 1000)
            album.date_txt = self.formatAlbumDate(date)
          }
          self.setData({
            full_timeline_data: resp.data
          })
          self.displayTimeline()

          self.scrollAlbumToTop(album_id)
        }
      }
    })
  },
  // 向上(1)或者向下(-1)扩展时间轴
  extendTimeline: function(direction=-1){
    var self = this
    var timeline = this.data.full_timeline_data
    var album_id = direction > 0 ? timeline[0].id : timeline[timeline.length-1].id

    var params = {
      group_id: this.data.group_id,
      album_id: album_id,
      direction: direction
    }

    var search_date = this.data.search_date
    if(search_date.year >= 0){
      params.search_year = search_date.year
      if(search_date.month >= 0){
        params.search_month = search_date.month
        if(search_date.day >= 0){
          params.search_day = search_date.day
        }
      }
    }

    if(this.data.search_txt.length > 0){
      params.search_name = this.data.search_txt
    }

    requests.get({
      url: '/album/group/timeline/page',
      data: params,
      success: function(resp) {
        if(resp.data != null && resp.data.length > 0){
          for(var i in resp.data){
            var album = resp.data[i]
            var date = new Date(album.date * 1000)
            album.date_txt = self.formatAlbumDate(date)
          }
          var curr_time_line = self.data.timeline_data
          var curr_full_timeline = self.data.full_timeline_data

          var this_timeline = resp.data
          var this_simplify_timeline = self.simplifyTimeline(this_timeline)
          if(direction == 1){
            self.setData({
              scroll_start_txt: '加载中...'
            })
            
            setTimeout(function(){
              self.setData({
                full_timeline_data: this_timeline.concat(curr_full_timeline),
                timeline_data: this_simplify_timeline.concat(curr_time_line),
                scroll_start_txt: ''
              })
            }, 500)
          }else if(direction == -1){
            self.setData({
              timeline_data: curr_time_line.concat(this_simplify_timeline),
              full_timeline_data: curr_full_timeline.concat(this_timeline)
            })
          }
        }

        if(direction == -1){
          self.setData({
            scroll_end_txt: '没有更多了~~'
          })
        }
      }
    })
  },

  expandAlbum: function (album_index) {
    var album = this.data.full_timeline_data[album_index]
    var to_set = {}
    to_set['timeline_data[' + album_index + ']'] = album
    to_set['full_album_map[' + album.id + ']'] = true
    this.setData(to_set)
  },

  onExpandAlbum: function(e) {
    var album_index = e.currentTarget.dataset.album_index
    this.expandAlbum(album_index)
  },
 
  onLoad:function(options){
    var self = this
    var group_id = options.id

    this.initSearchOptions()
    
    wx.showToast({
      title: "加载中",
      icon: "loading",
      duration: 100000
    })

    try {
      var res = wx.getSystemInfoSync()
      var scroll_height = Math.floor(750 * res.windowHeight / res.windowWidth) - 64
      this.setData({
        scroll_height: scroll_height,
      })
    } catch (e) {
      // Do something when catch error
    }

    wx.getStorage({
      key: 'has_invited',
      success: function (res) {
        console.log('get key: ', res)
        if (!res.data) {
          self.showTip('点击右上角的分享按钮，与朋友共享你的相册吧')
        }
      },
      fail: function () {
        self.showTip('点击右上角的分享按钮，与朋友共享你的相册吧')
      }
    })

    if(options.action == 'join_group'){
      self.setData({
        invite_code: options.invite_code
      })
    }

    if(group_id){
        console.log('打开相册 id '+ group_id)
        this.setData({
          group_id: group_id
        })

        this.handlerMsg();

        getApp().getUserInfo(function(userInfo){
          self.setData({
            userInfo: userInfo,
          })

          requests.get({
            url: '/album/group/detail?group_id=' + group_id,
            success: function (resp) {
              self.setData({
                group_name: resp.data.name,
                is_master: resp.data.master,
                live_mode: resp.data.live_mode,
                cover_pic: resp.data.front_cover,
                co_edit: resp.data.co_edit,
                co_invite: resp.data.co_invite,
                member_count: resp.data.member_count,
                ad:resp.data.ad
              })
              if (resp.data.live_mode){
                  wx.navigateTo({
                    url: '../live/live?action=' + options.action + '&id=' + options.id
                })
              }else{
                self.syncTimeline()
              }
            },
          })
        })

      }else {
        wx.showToast({
          title: '链接无效，稍后再试试？'
        })
        wx.navigateBack({
          delta: 1, // 回退前 delta(默认为1) 页面
          complete: function(res){
            console.log('跳到相册详情失败，没有传入id参数')
          }
        })
      }

    events.center.listen('remove_photo', this, function (data) {
        // debugger;
        var id = data.id;
        var timeline_data = self.data.timeline_data;
        var flag = undefined;
        self.data.timeline_data.map((group,k)=>{
          if (!flag){
            group.photos.map((photo, k2) => {
              if (!flag) {
                if(photo.id ==id){
                  flag = [k,k2];
                }
              }
            });
          }
            
        });

        timeline_data[flag[0]].photos.splice(flag[1],1);
        self.setData({
          'timeline_data': timeline_data
        });

    })

    
    // 事件处理
    events.center.listen('update_album', this, function(data){
      var album_id = data.id
      var index =  self.getAlbumIndex(album_id)
      if(index < 0) {
        return
      }
      var timeline_data = self.data.timeline_data
      var album = timeline_data[index]
      if(data.hasOwnProperty('name')){
        album.name = data.name
      }
      if(data.hasOwnProperty('date')) {
        self.setData({
          search_date: {
            year: -1,
            month: -1,
            day: -1
          },
          search_txt: '',
          search_date_txt: ''
        })

        self.initTimelineTo(album_id)
        return
      }
      self.setData({
        timeline_data: timeline_data
      })
    })

    // 事件处理
    events.center.listen('remove_album', this, function(data){
      var album_id = data.id
      var index =  self.getAlbumIndex(album_id)
      if(index < 0) {
        return
      }
      var timeline_data = self.data.full_timeline_data
      timeline_data.splice(index, 1)
      self.setData({
        full_timeline_data: timeline_data
      })
      self.displayTimeline()
    })

    events.center.listen('update_group', this, function(data){
      console.log('get event ', data)
      if(data.id == self.data.group_id){
        var to_update = {}
        if ('name' in data) {
          to_update['group_name'] = data.name
        }
        if ('member_count' in data) {
          to_update['member_count'] = data.member_count
        }
        if ('live_mode' in data) {
          to_update['live_mode'] = data.live_mode
        }
        self.setData(to_update)
        
      }
    })

    events.center.listen('remove_member', this, function(data){
      var member_count = self.data.member_count
      self.setData({
        member_count: member_count - 1
      })
    })
  },
  joinGroup: function (invite_code, group_id, cb) {
    var self = this;
    console.log("joinGroup");
    console.log(invite_code);

    requests.post({
      url: '/album/group/join',
      data: {
        group_id: group_id,
        invite_code: invite_code
      },
      success: function (res) {
        // debugger;
        if (cb) {
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
  handlerMsg: function () {
    var self = this;
    var newPhotoMsg = self.data.newPhotoMsg;

    requests.get({
      url: '/user/msg/list',
      data: {
        group_id: self.data.group_id
      },
      success: function (resp) {
        // debugger;
        var photo_msg = {}
        var new_photo = {}
        for (var i in resp.data) {
          var msg = resp.data[i];

          if (!msg.read && msg.msg_type == 10) {
            var photo_ids = msg.data.photos;
            for (var j in photo_ids) {
              new_photo[photo_ids[j]] = true;
            }
            requests.post({
              url: '/user/msg/read',
              data: {
                msg_id: msg.id
              }
            });
          }
          if (msg.msg_type == 11 || msg.msg_type == 12 || msg.msg_type == 13) {
            photo_msg[msg.photo_id] = msg.id;
            // requests.post({
            //   url: '/user/msg/read',
            //   data: {
            //     msg_id: msg.id
            //   }
            // });
          }
        }
        self.setData({
          photo_msg: photo_msg,  // 照片的评论等信息
          new_photo: new_photo,      // 新照片
          // new_photo_count: new_photo_count
        })
      }
    });

  },

  onShow:function(){
    if (this.data.live_mode === true) {
      wx.redirectTo({
        url: '../live/live?id=' + this.data.group_id,
      });
      return;
    }
    // 有可能跳到其他界面修改了群名，所以这里需要更新下
    if(this.data.group_name) {
      wx.setNavigationBarTitle({
        title: this.data.group_name
      })
    }
    
  },
  onHide:function(){
  },
  onUnload:function(){
    // 页面关闭
    events.center.remove('update_album', this)
    events.center.remove('remove_album', this)
    events.center.remove('update_group', this)
    events.center.remove('remove_member', this)
    events.center.remove('remove_photo', this)
  },
  onShareAppMessage: function () {
    console.log('inviting...')
    wx.setStorage({
      key: 'has_invited',
      data: true
    })
    
    var userInfo = this.data.userInfo
    var inviteCode = userInfo ? userInfo.invite_code : ''
    return {
      title: this.data.group_name,
      desc: userInfo.name + '邀请你加入' + this.data.group_name,
      path: '/pages/group/group_list?action=join_group&id='+this.data.group_id+'&invite_code='+inviteCode
    }
  },
  onScrollToTop: function(e){
    this.extendTimeline(1)
  },
  onScrollToBottom: function(e){
    if(!this.to_bottom){
      this.extendTimeline(-1)
      this.setData({
        scroll_end_txt: '加载中...'
      })
      this.to_bottom = true
      var self = this
      setTimeout(function(){
        self.to_bottom = false
      }, 1000)
    }
  },
  onScroll: function(e) {
    var delta_y = e.detail.deltaY
    if (delta_y > 13){
      // this.hideSearchBar()
    } else if (delta_y < -13){
      // this.showSearchBar()
    }
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






  //以下暂时废弃
  //--------------
  // 照片浏览swiper相关
  
  // 响应滑动事件，更新相册大小
  onPhotoSwiperChange: function(e){
    if(this.data.show_photo_detail){
      var current = e.detail.current
      var showing_photos = this.data.showing_photos
      var album_index = this.getAlbumIndex(this.data.showing_album_id)
      var album_photos = this.data.timeline_data[album_index].photos
      var start = this.data.curr_showing_start, end = this.data.curr_showing_end
      var extend_start = false, extend_end = false
      if(current == this.data.last_swiper_current){
        extend_start = true
        extend_end = true
      }else if(current > this.data.last_swiper_current){
        extend_end = true
      }else{
        extend_start = true
      }
      if(extend_end && end < album_photos.length - 1){
        end += 1
        showing_photos[end] = album_photos[end]
      }
      if(extend_start && start > 0){
        start -= 1
        showing_photos[start] = album_photos[start]
      }
      this.setData({
        showing_photos: showing_photos,
        curr_showing_start: start,
        curr_showing_end: end,
        last_swiper_current: current
      })
    }
    
  },

  //---------------
  //照片详情触控相关处理
  getScaleAnimation: function(scaleX, scaleY, anchorX, anchorY) {
    if(!this.scale_animation){
      var animation = wx.createAnimation({
        duration: 200,
        timingFunction: 'ease', // "linear","ease","ease-in","ease-in-out","ease-out","step-start","step-end"
        delay: 0,
        transformOrigin: anchorX+'% '+anchorY+'% 0'
      })
      this.scale_animation = animation
    }
    this.scale_animation.scale(scaleX, scaleY).step()
    return this.scale_animation.export()
  },
  getDoubleTapAnimation: function(width, height, tap_x, tap_y){
    
  },
  onSingleTapPhotoDetail: function(){
    this.photo_tap_timeout = null
    this.setData({
        showing_album_id: 0,
        show_photo_detail: false,
        showing_photos: [],
        swiper_current: 0,
        last_swiper_current: 0,
        curr_showing_start: 0,
        curr_showing_end: 0
      })
      wx.setNavigationBarTitle({
        title: this.data.group_name
      })
  },
  onTapPhotoDetail: function(e){
    console.log('ON TAP: ', e)

    
    if(!this.photo_tap_timeout){
      this.photo_tap_timeout = setTimeout(this.onSingleTapPhotoDetail, 200)
    }else{
      // 双击 ON DOUBLE TAP
      console.log('ON DOUBLE TAP ', e)
      clearTimeout(this.photo_tap_timeout)
      this.photo_tap_timeout = null
      
      var photo = e.currentTarget.dataset.photo
      var photo_index = e.currentTarget.dataset.index
      var to_set_data = {}
      var animation = this.getScaleAnimation(2,2,50,50)
      to_set_data['showing_photos['+photo_index+'].animation'] = animation
      to_set_data['single_photo_animation'] = animation
      this.setData(to_set_data)

      var self = this
      setTimeout(function(){
        self.setData({
          single_photo_mode: true,
          single_photo_url: photo.url
        })        
      }, 200)
    }

    this.setData({
      show_search_panel:false
    })
  },
  getSinglePhotoAnimation: function(curr_x1, curr_y1, curr_x2, curr_y2) {
    var middle_x = (curr_x1 + curr_x2) * 0.5
    var middle_y = (curr_y1 + curr_y2) * 0.5

    var total_delta_x = delta_x1 - delta_x2
    var total_delta_y = delta_y1 - delta_y2
    var scaleX = Math.abs(total_delta_x / delta_x1)
    var scaleY= Math.abs(total_delta_y / delta_y1)

    var animation = wx.createAnimation({
      duration: 400,
      timingFunction: 'ease', // "linear","ease","ease-in","ease-in-out","ease-out","step-start","step-end"
      delay: 0,
      transformOrigin: '50% 50% 0'
    })    
  },
  onLoadSinglePhoto: function(e) {

  },
  onSinglePhotoTap: function(e) {
    console.log('ON TAP: ', e)
  },
  onSinglePhotoTouchStart: function(e) {
  },
  onSinglePhotoTouchMove: function(e) {

  },
  onSinglePhotoTouchEnd: function(e) {
    console.log('touch end', e)
  },
  showSearchPanel:function(e){
    this.setData({
      show_search_panel:true
    });
  },
  cancelSearchPanel:function(e){
    this.setData({
      show_search_panel: false,
      search_date_txt:'',
      search_txt:'',
      search_date: {
        year: -1,
        month: -1,
        day: -1
      }
    });
    this.syncTimeline();
  }, tapSponsor(e) {
    // debugger;
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../sponsor/sponsor?id=' + id,
    });
  }
})