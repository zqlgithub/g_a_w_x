function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatTime2(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [month, day].map(formatNumber).join('-') + ' ' + [hour, minute].map(formatNumber).join(':')
}

function formatDate(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  return [year, month, day].map(formatNumber).join('-')
}

function strToDate(str){
  var parts = str.split("-")
  return new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]))
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function dictToQuery(targetDict) {
  var strList = [];
  for(var key in targetDict){
      strList.push(encodeURIComponent(key) + "=" + encodeURI(targetDict[key]))
  }
  return strList.join('&')
}

function queryToDict(s){
  var result = {}
  var parts = s.split('&')
  for(var key in parts){
    var params = parts[key].split('=')
    result[params[0]] = params[1]
  }
  return result
}

 function strByteLen(val) {
    var len = 0;
    for (var i = 0; i < val.length; i++) {
        if (val[i].match(/[^x00-xff]/ig) != null) //全角
            len += 2;
        else
            len += 1;
    }
    return len;
}

//  1	系统消息
//  10	新照片
//  11	照片被点赞
//  12	照片被评论
//  13	评论被回复

const msgType = {
  1:	'系统消息',
  10: '新照片',
  11:	'照片被点赞',
  12: '照片被评论',
  13:	'评论被回复'
}
module.exports = {
  formatTime: formatTime,
  formatDate: formatDate,
  formatNumber: formatNumber,
  formatTime2:formatTime2,
  strToDate: strToDate,
  dictToQuery: dictToQuery,
  queryToDict: queryToDict,
  strByteLen: strByteLen,
  msgType
}
