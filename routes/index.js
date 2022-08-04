var express = require('express');
const fs = require("fs");
const request = require('request')
const cheerio = require('cheerio')
const chrome = require('chromedriver')

var router = express.Router();

var downloadID = 10000
var downloadDict = {}

function getTargetName(url){
  url = decodeURI(url)
  var firstIndex = url.indexOf('.')
  url = url.substring(firstIndex)
  firstIndex = url.indexOf('/')
  url = url.substring(firstIndex+1)
  console.log('url '+url)
  var lastIndex = url.lastIndexOf('.')
  if(lastIndex<0){
    return ''
  }
  var url1 = url.substring(0,lastIndex)
  var url2 = url.substring(lastIndex+1)
  lastIndex = url1.lastIndexOf('/')
  var len = 1
  console.log('lastIndex / '+lastIndex)
  if(lastIndex<0){
    lastIndex = url1.lastIndexOf('%2F')
    len = 3
  }
  var name = url1.substring(lastIndex+len)
  firstIndex = url2.indexOf('/')
  console.log('firstIndex / '+firstIndex)
  if(firstIndex<0){
    firstIndex = url2.indexOf('&')
  }
  var ext = ''
  if(firstIndex<0){
    ext = url2
  }else{
    ext = url2.substring(0,firstIndex)
  }
  return name +'.'+ ext
}
function findData(url){
  chrome.start()
  
  request({
    method: 'GET', uri: url, headers: {'Referer':url,}
  }, function (err,res,body){
    if(err){
      console.log('findData url error')
      return
    }
    var $ = cheerio.load(body)
    var src = $('video').attr('src')
    console.log('src '+src)
  });
  
}
function downloadFile(filename, file_url){
  var dir = 'file'
  checkDirectory(dir, function (){
    try {
      var received_bytes = 0;
      var total_bytes = 0;

      var req = request({
        method: 'GET', uri: file_url
      }, function (err,res,body){
        if(!err && res.statusCode==200){
          console.log('request success')
        }else{
          console.log('request error')
        }
      });
      console.log('url '+file_url)
      var targetPath = dir+'/'+ filename
      var out = fs.createWriteStream(targetPath);
      req.pipe(out);

      req.on('response', function ( data ) {
        // Change the total bytes value to get progress later.
        total_bytes = parseInt(data.headers['content-length' ]);
      });

      req.on('data', function(chunk) {
        var curr = chunk.length
        // Update the received bytes
        received_bytes += curr;

        showProgress(filename, received_bytes, total_bytes, curr);
      });

      req.on('end', function() {
        console.log('下载成功')
      });
    }catch (e){
      console.log('err '+e.message)
    }
  })
}
function showProgress(filename, received, total, curr){
  var percentage = (received * 100) / total;
  var _progress = percentage.toFixed(2);
  console.log(_progress + "% | " + received + "/" + total + " "+curr);
  if(downloadDict[filename]){
    downloadDict[filename]['progress'] = _progress
    console.log(downloadDict[filename])
  }
}
function checkDirectory(dir,onFinish)
{
  console.log('checkDir '+dir)
  fs.stat(dir, function (err, stats){
    if(err){
      fs.mkdir(dir, ()=>{onFinish()})
    }else{
      onFinish()
    }
  })
}

function refreshHistory(name, url)
{
  if(downloadDict[name]){
    return false
  }else{
    downloadDict[name] = {'id':downloadID, 'name':name, 'url':url,'progress':0}
    downloadID+=1
    return true
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Downloader'});
});
router.post('/download', function(req, res, next) {
  let url = req.body.url;
  if(url && url!==''){
    url = url.toString()
    console.log('url '+url)
    let filename = getTargetName(url);
    if(filename){
      if(!refreshHistory(filename,url)){
        res.json({'msg': '已经下载过的！', 'code': 0})
        return
      }
      console.log('filename '+filename)
      res.json({'msg': filename, 'code': 1})
      downloadFile(filename, url)
    }else{
      //解析html
      console.log('未找到可以下载的文件')
      res.json({'msg': 'url is not file', 'code': 0})
      findData(url)
    }
  }else{
    res.json({'msg': 'url error', 'code': 0})
  }
});
router.post('/progress', function (req, res, next){
  let name = req.body.name;
  if(name){
    res.json(downloadDict[name])
  }else{
    res.json({'msg': 'error'})
  }
})
module.exports = router;
