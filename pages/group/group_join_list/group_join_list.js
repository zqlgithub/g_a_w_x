// pages/group/group_join_list/group_join_list.js
var requests = require('../../../utils/requests.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    group_id:undefined,
    list:[],
    page:undefined
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      group_id:options.id
    });
    this.getData();
  },
  getData:function(){
    var self = this;
    var page = this.data.page;
    var param = {
      group_id: this.data.group_id
    };
    if (page){
      param.pagination = page 
    }
    requests.get({
      url: "/album/group/join/req/list",
      data: param,
      success: function (resp) {
        self.setData({
          list: resp.data
        });
        if(resp.data.length>0){
          self.setData({
            page: resp.data[resp.data.length - 1].pagination
          });
        }
      }
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
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },
  tapConfirm:function(e){
    var self = this;
    var join_id = e.currentTarget.dataset.id;
    var idx = e.currentTarget.dataset.idx;
    var param = {
      join_id: join_id,
      accept: 1
    };
    requests.post({
      url: '/album/group/join/req/confirm',
      data: param,
      success: function (resp) {
        var  list = self.data.list;
        wx.showToast({
          title: '已设置通过',
        });
        list.splice(idx,1);
        self.setData({
          list: list
        });
      }
    });
    
  },
  tapIgnore:function(e) {
    var self = this;
    var join_id = e.currentTarget.dataset.id;
    var idx = e.currentTarget.dataset.idx;

    var param = {
      join_id: join_id,
      accept:0
    };
    wx.showModal({
      title: '提示',
      content: '忽略后2天内该用户无法再发送申请，确定要忽略么？',
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定')
          requests.post({
            url: '/album/group/join/req/confirm',
            data: param,
            success: function (resp) {
              var list = self.data.list;
              list.splice(idx, 1);
              self.setData({
                list: list
              });
            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
    

  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})