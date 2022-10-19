/*
  处理用户发送的消息类型和内容，决定返回不同的内容给用户
 */

module.exports = message => {

    let options = {
        toUserName: message.FromUserName,
        fromUserName: message.ToUserName,
        createTime: Date.now(),
        msgType: 'text'
    }

    let content = '您在说什么，我听不懂'
    //判断用户发送消息类型
    switch (message.MsgType) {
        case 'text':
            //判断用户发送消息内容
            if (message.Content === '1') {  //全匹配
                content = '大吉大利，今晚吃鸡'
            } else if (message.Content === '2') {
                content = '落地成盒'
            } else if (message.Content.match('爱')) {  //半匹配
                content = '我爱你'
            }
            break
        case 'image':
            options.msgType = 'image'
            options.mediaId = message.MediaId
            console.log(message.PicUrl)
            break
        case 'voice':
            options.msgType = 'voice'
            options.mediaId = message.MediaId
            console.log(message.Recognition)
            break
        case 'video':
            options.msgType = 'video'
            options.mediaId = message.MediaId
            options.ThumbMediaId = message.ThumbMediaId
            break
        case 'shortvideo':
            content = '好好看的小视频啊'
            break
        case 'location':
            content = `纬度：${message.Location_X} 经度：${message.Location_Y} 缩放大小：${message.Scale} 位置信息：${message.Label}`
            break
        case 'link':
            content = `标题：${message.Title} 描述：${message.Description} 链接：${message.Url}`
            break
        case 'event':
            if (message.Event === 'subscribe') {
                //用户订阅信息
                content = '欢迎您的关注'
                if (message.EventKey) {
                    content = '用户扫描带参数二维码关注事件'
                }
            } else if (message.Event === 'unsubscribe') {
                //用户取消订阅信息
                console.log(message.FromUserName + "无情的取消了关注")
            }else if(message.Event === 'SCAN'){
                content = '用户已经关注过，在扫描带参数二维码关注事件'
            }else if (message.Event === 'LOCATION'){
                content = `纬度：${message.Latitude} 经度：${message.Longitude} 精度：${message.Precision}`
            }else if (message.Event === 'CLICK'){
                content = `您点击了按钮:${message.EventKey}`
            }
    }



    options.content = content
    console.log(options)

    return options
}