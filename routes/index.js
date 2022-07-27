var express = require('express');
const fs = require("fs");
const request = require('request')
var router = express.Router();

function downloadFile(file_url , targetPath){
  var dir = targetPath.substring(0,targetPath.lastIndexOf('/'))
  checkDirectory(dir, function (){
    try {
      var received_bytes = 0;
      var total_bytes = 0;

      var req = request({
        method: 'GET', uri: file_url
      });

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
    let filename = input;
    let lastIndex = input.lastIndexOf('/');
    if(lastIndex > 0 ){
      filename = input.substring(lastIndex+1)
    }
    var path = 'download/'+filename
    downloadFile(input, path)
  }
  res.render('index', { title: 'Downloader'});
});

module.exports = router;
