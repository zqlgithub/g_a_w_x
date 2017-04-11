// pages/slider/slider.js
Page({
  data: {
    animationData: {},
    show:'',
    config:{
      'music':'',
      'entity':[]
    }
    
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    this.animation = wx.createAnimation({})
    this.rotateAndScaleThenTranslate();

      // 页面显示
    var config = {
      "music": "",
      "entity": [
        {
          "src": "http://ohl9zoknv.bkt.clouddn.com/5336929786874992?imageMogr2/quality/70/rotate/0",
          "type": "image",  //image、text
          "pos": {
            "top": '0%',
            "left": '0%'
          },
          // 按照顺序来执行的动画数据
          "animation": [{
            "duration": 1000    // 时间间隔，setTimeout
          }, {
            "duration": 1000,
            "left": 200,        // 动作类型，包括left right top bottom opacity play等
            "bottom": 200,
          }, {
            "duration": 1000,
            "opacity": 0
          }]
        }
      ]
    }
    var _this = this;
    // var config = Object.assign({},this.data.config);
    // var entity = config.entity;
    var animation = wx.createAnimation({
        duration:2000,
        delay:2000
      })
    config.entity.map((v, k) => {
      
      // animation.opacity(1).width(100).top('100%').step({ duration: 1000 })
       animation.rotate(45).scale(2, 2).step();
       animation.translate(100, 100).step({ duration: 1000 });
      config.entity[k].animationObj = animation.export();
    });
    this.setData({
      config:config
    })
  },
  onReady: function () {
    
  },
  onShow: function () {
  
  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
    // 页面关闭
  },
  rotateAndScaleThenTranslate: function () {
    // 先旋转同时放大，然后平移
    this.animation.rotate(45).scale(2, 2).step()
    this.animation.translate(100, 100).step({ duration: 1000 })
    this.setData({
      animationData: this.animation.export()
    })
  }
})