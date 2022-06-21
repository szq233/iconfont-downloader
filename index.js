// 需要在App.vue中import "./static/style/iconfont.css";引入一下
// 在u-view中的使用
// <u-icon name="xiazai" custom-prefix="s-icon" size="30" color="#888888"></u-icon>
/* eslint-disable */
const fs = require('fs');
const path = require("path");
const http = require("https");
const mimeType = require('mime-types');

// icon前缀。！！！如果需要配合u-view实现一些基于自定义图标的功能，前缀只能配置成默认'custom-icon'
let prefix = 'custom-icon';

// 将iconfont.css和iconfont.ttf保存的位置, 相对于该文件放置的文件夹
let staticPath = 'static/style';

// iconfont项目Fontclass源引用链接
let iconfont_url = '//at.alicdn.com/t/********************.css';


// 获取远端url的文件数据
function getFileData(url) {
  return new Promise((resolve, reject) => {
    http.get(`https:${url}`, function(res){
      let resultData = "";
      let contentLength = parseInt(res.headers['content-length']);
      //总长度
      res.setEncoding("binary");
      res.on("data", function(chunk){
        resultData+=chunk;
        // 进度
        // let process = ((resultData.length)/contentLength) * 100;
        // let percent = parseInt(((process).toFixed(0)));
      });
      res.on("end", function(){
        if (!resultData) {
          reject();
        } else {
          resolve(resultData);
        }
      });
    });
  })
}

// 获取url的iconfont.css文件
getFileData(iconfont_url).then((cssData) => {
  console.log("下载iconfont资源成功");
  const cssSavePath = path.join(__dirname, `${staticPath}/iconfont.css`);
  const ttfSavePath = path.join(__dirname, `${staticPath}/iconfont.ttf`);

  // 将下载的css文件读取，并以'\n\n'拆分
  let strArr = cssData.split('\n\n');
  // 提取出需要更改引入文件的设置fontface部分的代码片段string
  const fontFaceStr = strArr.shift();
  // @font-face下一部分的代码也移除，因为需要重写
  strArr.shift();

  // 获取@fontface部分代码中ttf文件的cdn引入方式
  let fr2 = fontFaceStr.match(/\w(.+)format\(\'truetype\'\)/g)[0];
  // 提取cdn下载链接
  let ttf_url = fr2.match(/\w\(\'(.+)\?/m)[1];
  // 下载ttf文件并读取数据
  getFileData(ttf_url).then((ttfData) => {
    fs.writeFile(ttfSavePath, ttfData, "binary", function(err){
      if(err){
        console.log('更新iconfont.ttf文件失败');
      }else{
        console.log('更新iconfont.ttf文件成功');
        // 将ttf文件转换为base64引入
        let ttfStamp = fs.readFileSync(ttfSavePath);
        ttfStamp = Buffer.from(ttfStamp).toString('base64');
        let ttfBase64 = 'data:' + mimeType.lookup(ttfSavePath) + ';base64,' + ttfStamp;
        // 生成最后的待写入文件string数据
        let cssFileData = [
        `@font-face {`,
        `  font-family: "${prefix}";`,
        `  src: url('${ttfBase64}') format('truetype');`,
        `}`,
        ``,
        `.${prefix} {`,
        `  font-family: "${prefix}" !important;`,
        `  font-size: 16px;`,
        `  font-style: normal;`,
        `  -webkit-font-smoothing: antialiased;`,
        `  -moz-osx-font-smoothing: grayscale;`,
        `}`,
        `\n`].join('\n') + strArr.join('\n\n');
        // 这里替换icon-为我这边设置的前缀
        cssFileData = cssFileData.replace(/icon-/g, prefix + '-');
        // 写入iconfont.css文件
        fs.writeFile(cssSavePath, cssFileData, "binary", function(err){
          if(err){
            console.log('更新iconfont: css、ttf文件失败');
          }else{
            console.log('更新iconfont.css文件成功');
          }
        });
      }
    })
  })
}).catch(() => {
  console.log("下载iconfont资源失败");
});