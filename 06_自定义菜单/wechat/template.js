/*
  用来加工处理最终回复用户消息的模板（xml数据）
 */
module.exports = options => {
    let replyMessage = `<xml>
                          <ToUserName><![CDATA[${options.toUserName}]]></ToUserName>
                          <FromUserName><![CDATA[${options.fromUserName}]]></FromUserName>
                          <CreateTime>${options.createTime}</CreateTime>
                          <MsgType><![CDATA[${options.msgType}]]></MsgType>`
    switch (options.msgType) {
        case 'text':
            replyMessage += `<Content><![CDATA[${options.content}]]></Content>`
            break
        case 'image':
            replyMessage += `<Image><MediaId><![CDATA[${options.media_id}]]></MediaId></Image>`
            break
        case 'voice':
            replyMessage += `<Voice><MediaId><![CDATA[${options.media_id}]]></MediaId></Voice>`
            break
        case 'video':
            replyMessage += `<Video>
                                <MediaId><![CDATA[${options.media_id}]]></MediaId>
                                <Title><![CDATA[${options.title}]]></Title>
                                <Description><![CDATA[${options.description}]]></Description>
                            </Video>`
            break
        case 'music':
            replyMessage += `<Music>
                                <Title><![CDATA[${options.TITLE}]]></Title>
                                <Description><![CDATA[${options.DESCRIPTION}]]></Description>
                                <MusicUrl><![CDATA[${options.MUSIC_Url}]]></MusicUrl>
                                <HQMusicUrl><![CDATA[${options.HQ_MUSIC_Url}]]></HQMusicUrl>
                                <ThumbMediaId><![CDATA[${options.media_id}]]></ThumbMediaId>
                              </Music>`
            break
        case 'news':
            replyMessage += `<ArticleCount>${options.content.length}</ArticleCount>
                                  <Articles>`
            options.content.forEach(item => {
                replyMessage += `<item>
                                      <Title><![CDATA[${item.title}]]></Title>
                                      <Description><![CDATA[${item.description}]]></Description>
                                      <PicUrl><![CDATA[${item.picurl}]]></PicUrl>
                                      <Url><![CDATA[${item.url}]]></Url>
                                    </item>`
            })
            replyMessage += `</Articles>`
            break
    }

    replyMessage += '</xml>'

    //最终回复给用户的xml数据
    return replyMessage
}