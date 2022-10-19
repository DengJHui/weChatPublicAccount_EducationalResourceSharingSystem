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
//引入config模块
const config = require("../config")
//引入sha1模块
const sha1 = require("sha1")
//引入tool模块
const {getUserDataAsync, parseXMLAsync, formatMessage} = require('../utils/tool')

module.exports = () => {
    return async (req, res, next) => {
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

        const sha1Str = sha1([timestamp, nonce, token].sort().join(''))


        /*
          微信服务器会发送两种类型的消息给开发者服务器
            1. GET请求
              - 验证服务器的有效性
            2. POST请求
              - 微信服务器会将用户发送的数据以POST请求的方式转发到开发者服务器上
         */

        if (req.method === 'GET') {
            if (sha1Str === signature) {
                // 如果一样，说明来自微信服务器，返回echostr给微信服务器
                res.send(echostr)
            } else {
                // 如果不一样，说明不是微信服务器，返回error
                res.end('error')
            }
        } else if (req.method === 'POST') {
            //微信服务器会将用户发送的数据以POST请求的方式转发到开发者服务器上
            //验证信息来自微信服务器
            if (sha1Str !== signature) {
                // 说明不是微信服务器，返回error
                res.end('error')
            }

            // console.log(req.query)
            /*
            {
              signature: '91e3e102ab0f60121c3617f803bb2ac105439f36',
              timestamp: '1666076253',
              nonce: '648195310',
              openid: 'oMb_O6nUOibF7gJgcmYQg_L9FL1c'  //用户微信id
            }
             */

            //接受请求体中的数据，流式数据
            const xmlData = await getUserDataAsync(req)
            // console.log(xmlData)
            /*
            <xml>
            <ToUserName><![CDATA[gh_4c2c7cf39a93]]></ToUserName>  //开发者的id
            <FromUserName><![CDATA[oMb_O6nUOibF7gJgcmYQg_L9FL1c]]></FromUserName>  //用户openid
            <CreateTime>1666077308</CreateTime>  // 发送的时间戳
            <MsgType><![CDATA[text]]></MsgType>  // 发送消息类型
            <Content><![CDATA[123]]></Content>   // 发送消息内容
            <MsgId>23852494219883919</MsgId>     // 消息id微信服务器会默认保存3天用户发送的数据，通过这个id三天内可以找到消息数据，三天后销毁
            </xml>
             */

            //将xml数据解析为js对象
            const jsData = await parseXMLAsync(xmlData)
            // console.log(jsData)
            /*
            {
              xml: {
                ToUserName: [ 'gh_4c2c7cf39a93' ],
                FromUserName: [ 'oMb_O6nUOibF7gJgcmYQg_L9FL1c' ],
                CreateTime: [ '1666077842' ],
                MsgType: [ 'text' ],
                Content: [ '111' ],
                MsgId: [ '23852500208354221' ]
              }
            }
             */

            //格式化数据
            const message = formatMessage(jsData)
            // console.log(message)
            /*
            {
              ToUserName: 'gh_4c2c7cf39a93',
              FromUserName: 'oMb_O6nUOibF7gJgcmYQg_L9FL1c',
              CreateTime: '1666078606',
              MsgType: 'text',
              Content: '123',
              MsgId: '23852512136856250'
            }
             */

            //简单的自动回复，回复文本内容
            /*
              一旦遇到以下情况，微信都会在公众号会话中，向用户下发系统提示“该公众号暂时无法提供服务，请稍后再试”：
              1、开发者在5秒内未回复任何内容
              2、开发者回复了异常数据，比如 JSON 数据、字符串、xml数据中有多余的空格...等
             */
            let content = '您在说什么，我听不懂'
            //判断用户发送消息是否是文本消息
            if (message.MsgType === 'text') {
                //判断用户发送消息内容
                if (message.Content === '1') {  //全匹配
                    content = '大吉大利，今晚吃鸡'
                } else if (message.Content === '2') {
                    content = '落地成盒'
                } else if (message.Content.match('爱')) {  //半匹配
                    content = '我爱你'
                }
            }
            //最终回复用户的消息
            let replyMessage = `<xml>
                                  <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
                                  <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
                                  <CreateTime>${Date.now()}</CreateTime>
                                  <MsgType><![CDATA[text]]></MsgType>
                                  <Content><![CDATA[${content}]]></Content>
                                </xml>`

            //返回响应给微信服务器
            res.send(replyMessage)


            //如果开发者服务器没有返回响应，微信服务器会发送三次请求
            //res.end('')

        } else {
            res.end('err')
        }
    }
}