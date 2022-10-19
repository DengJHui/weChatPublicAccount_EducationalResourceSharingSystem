/*
    验证服务器有效的模块
    1.微信服务器知道开发者服务器是哪个
     -测试号管理页面上填写url开发者服务器地址
      -使用ngrok内网穿透将本地开启的服务器映射外网跨域访问一个网址
      -ngrok http 3000
      -ngrok访问时间过长导致配置失败
      -直接cmd使用ssh -R 80:localhost:3000 nokey@localhost.run即可
     -填写token
       -参与微信签名加密的一个参数
     2.开发者服务器 - 验证信息是否来自于微信服务器
       目的：计算得出signature微信加密签名和微信传递过来的signature进行对比，一样则是来自于微信服务器
       1. 将参与微信加密签名的三个参数（signature、nonce、token）组合在一起，按照字典序排序并组合在一起形成数组
       2. 将数组里所有参数拼成一个字符串，进行sha1加密
       3. 加密完成生成一个signature，和微信发送过来的进行对比
           如果一样，说明来自微信服务器，返回echostr给微信服务器
           如果不一样，说明不是微信服务器，返回error
 */

const config = require("../config");
const sha1 = require("sha1");
module.exports = () => {
    return (req, res, next) => {
        //微信服务器提交参数
        // console.log(req.query)
        /*
        {
        signature: 'e2ea78b13045addefa4151c2f91f28431aceaa9a',  //微信的加密签名
        echostr: '7007763131168456557', //微信的随机字符串
        timestamp: '1665998636',    //微信的发送请求时间戳
        nonce: '1153493717' //微信的随机数字
        }
         */
        const {signature, echostr, timestamp, nonce} = req.query
        const {token} = config

        // 1. 将参与微信加密签名的参数按照字典序排序组合成数组
        const arr = [timestamp, nonce, token]
        const arrSort = arr.sort()
        console.log(arrSort)
        // 2. 将数组里所有参数拼成一个字符串，进行sha1加密
        const str = arr.join('')
        const sha1Str = sha1(str)
        console.log(sha1Str)
        // 3. 加密完成生成一个signature，和微信发送过来的进行对比
        if (sha1Str === signature) {
            // 如果一样，说明来自微信服务器，返回echostr给微信服务器
            res.send(echostr)
        } else {
            // 如果不一样，说明不是微信服务器，返回error
            res.end('error')
        }
    }
}