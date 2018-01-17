var conf = require('../config.js')
var util = require('util.js')
var requests = require('requests.js')


function upload() {
  var upload_queue = []
  var uploading = false

  function doUpload(){
    if(uploading || upload_queue.length == 0){
      return
    }
    uploading = true
    var obj = upload_queue.shift()

    var file_path = obj.file_path
      requests.get({
        url: '/album/photo/upload',
        data: obj.data,
        success: function(resp){
          console.log('GET UPLOAD DATA SUCCESS')
          var upload_data = resp.data
          var bucket = upload_data.bucket
          delete upload_data.bucket
          const uploadTask = wx.uploadFile({
            url: 'https://v0.api.upyun.com/'+bucket,
            filePath: file_path,
            name:'file',
            formData: upload_data, 
            success: function(res){
              // success
              console.log('UPLOAD SUCCESS')
              console.log(res)
              res.data = JSON.parse(res.data)
              obj.success(res)
            },
            fail: function(res) {
              // fail
              console.log('UPLOAD FAIL')
              if(obj.fail)
                obj.fail({
                  msg: '图片上传失败'
                })
            },
            complete: function() {
              uploading = false
              doUpload()
            }
          })

          uploadTask.onProgressUpdate((res) => {
            obj.progress(res)
          })
        },
        fail: function(resp) {
          console.log('GET UPLOAD DATA FAIL', resp)
          uploading = false
          doUpload()
          if(obj.fail)
            obj.fail(resp)
        }
      })
  }

  return function(obj){
    if(!upload_queue){
      upload_queue = []
    }
    upload_queue.push(obj)

    doUpload()
  }
}

module.exports = {
    upload: upload()
}