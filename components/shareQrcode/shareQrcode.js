var requests = require('../../utils/requests.js')

const close = function (_this) {
  var shareData = _this.data.shareData;
  shareData.show = false;
  _this.setData({
    shareData: shareData,
  });
}

const save = function(){
  wx.showToast({
    title: '正在保存图片...',
  });
  wx.canvasToTempFilePath({
    canvasId: 'shareCanvas',
    success: function (res) {
      var img = res.tempFilePath;
      wx.authorize({
        scope: 'scope.writePhotosAlbum',
        success() {
          wx.saveImageToPhotosAlbum({
            filePath: img,
          });
          wx.showModal({
            title: '提示',
            content: '已保存图片到手机',
            showCancel: false,
            confirmText: '好的',
            confirmColor: '#00BCCC',
            complete: function () {
              close(_this);
            }
          });
        }, fail() {
          wx.showModal({
            title: '提示',
            confirmText: '好的',
            showCancel: false,
            content: '授权后才可以正常运行哦',
            success: function (res) {
              wx.openSetting({
                success: function (res) {
                  var pages = getCurrentPages();
                  var lastPage = pages[pages.length - 1];
                  var options = lastPage.options;
                  var para = "";

                  var optionsArr = Object.keys(options);

                  if (optionsArr.length > 0) {
                    para += '?';
                    optionsArr.map((v, k) => {
                      para += v + "=" + options[v] + "&"
                    });
                  }
                  var url = "/" + lastPage.route + para;
                  wx.reLaunch({
                    url: url
                  });
                }
              })
            }
          });
        }
      });
    },
    fail: function (err) {
      console.log("canvasToTempFilePath fail");
      wx.showModal({
        title: '提示',
        showCancel: false,
        confirmText: "好的",
        content: 'ios系统自动保存出现了一些小小的问题，建议先截图保存，并更新最新版微信6.5.23后可正常使用',
      })
    }
  })
}
const shareMoment = function (_this, param) {

  var promise1 = new Promise((resolve, reject) => {
    var group_id = param.group_id;
    
    requests.get({
      url: "/album/group/wxa_code?group_id=" + group_id,
      success: function (resp) {
        wx.getImageInfo({
          src: resp.data.url,
          success: function (res) {
            // var path = res.path;
            resolve(res);
          }
        });
      }
    });
  });


  Promise.all([promise1]).then((paths) => {
    var context = wx.createCanvasContext('shareCanvas')


    context.setFillStyle('#ffffff');
    var width = _this.data.shareData.width;
    var height = _this.data.shareData.height;
    context.fillRect(0, 0, width, height);

    var width = 260;
    var height = 260;

    context.drawImage(paths[0].path, 20, 20, width, height);

    context.setFillStyle('#333333');
    context.setFontSize(16);
    context.setTextAlign('center')
    context.fillText('扫一扫小程序码加入相册', 150, 320);
    context.setFillStyle('#4BBCCC');
    context.setFontSize(26);
    context.setTextAlign('center')
    context.fillText(param.group_name, 150, 360);


    context.draw();

  });

}


const show = function (_this, param) {
  console.log(wx.getSystemInfoSync());
  var info = wx.getSystemInfoSync();
  var system = wx.getSystemInfoSync().system;
  var sdk = wx.getSystemInfoSync().SDKVersion;
  var sdkArr = sdk.split(".");

  if (sdkArr[1] < 2) {
    // debugger;
    wx.showModal({
      title: '提示',
      content: '此版本小程序不支持此功能，请更新微信后再试：）',
      showCancel: false,
      confirmText: '好的',
      confirmColor: '#00BCCC'
    });
    return;
  }

  _this.setData({
    shareData: {
      show: true,
      width: 300,
      height: 400
    }
  });
  shareMoment(_this, param);
}

module.exports = {
  close,
  shareMoment,
  show,
  save
}