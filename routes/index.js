var express = require('express');
const fs = require("fs");
const request = require('request')
const cheerio = require('cheerio')
var router = express.Router();

function getTargetName(url){
  var firstIndex = url.indexOf('.')
  url = url.substring(firstIndex)
  firstIndex = url.indexOf('/')
  url = url.substring(firstIndex)
  var lastIndex = url.lastIndexOf('.')
  if(lastIndex<0){
    return ''
  }
  var url1 = url.substring(0,lastIndex)
  var url2 = url.substring(lastIndex+1)
  lastIndex = url1.lastIndexOf('/')
  var name = url1.substring(lastIndex+1)
  firstIndex = url2.indexOf('/')
  var ext = ''
  if(firstIndex<0){
    ext = url2
  }else{
    ext = url2.substring(0,firstIndex)
  }
  return name +'.'+ ext
}
function findData(url){
  request({
    method: 'GET', uri: url, headers: {'Referer':url,}
  }, function (err,res,body){
    var $ = cheerio.load(body)
    var src = $('video').attr('src')
    console.log('src '+src)
  });
  
}
function downloadFile(file_url){
  var dir = 'download'
  checkDirectory(dir, function (){
    try {
      var received_bytes = 0;
      var total_bytes = 0;

      var req = request({
        method: 'GET', uri: file_url
      });
      console.log('url '+file_url)
      var targetPath = dir+'/'+ getTargetName(file_url)
      var out = fs.createWriteStream(targetPath);
      req.pipe(out);

      req.on('response', function ( data ) {
        // Change the total bytes value to get progress later.
        total_bytes = parseInt(data.headers['content-length' ]);
      });

      req.on('data', function(chunk) {
        // Update the received bytes
        received_bytes += chunk.length;

        showProgress(received_bytes, total_bytes);
      });

      req.on('end', function() {
        console.log('下载成功')
      });
    }catch (e){

    }
  })
}
function showProgress(received, total){
  var percentage = (received * 100) / total;
  console.log(percentage + "% | " + received + " bytes out of " + total + " bytes.");
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
/* GET home page. */
router.get('/', function(req, res, next) {
  var input = req.query.input
  if(input && input!=''){
    input = input.toString()
    var filename = getTargetName(input)
    if(filename){
      console.log(filename)
      downloadFile(input)
    }else{
      //解析html
      console.log('未找到可以下载的文件')
      findData(input)
    }
    //downloadFile(input)
  }
  input='abc'
  res.render('index', { title: 'Downloader', data:input});
});

module.exports = router;
