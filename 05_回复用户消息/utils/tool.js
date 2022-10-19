/*
  工具包函数
 */
const {parseString} = require('xml2js')

module.exports = {
    getUserDataAsync(req) {
        return new Promise((resolve, reject) => {
            let xmlData = ''
            req
                .on('data', data => {
                    //数据传入时触发事件，将数据注入回调函数中
                    // console.log(data)
                    //读取数据为buffer，转化为字符串
                    xmlData += data.toString()
                })
                .on('end', () => {
                    //数据接收完毕时触发事件
                    resolve(xmlData)
                })
        })

    },
    parseXMLAsync(xmlData) {
        return new Promise((resolve, reject) => {
            parseString(xmlData, {trim: true}, (err, data) => {
                if (!err) {
                    resolve(data)
                } else {
                    reject('parseXMLAsync方法出了问题:' + err)
                }
            })
        })
    },
    formatMessage(jsData) {
        let message = {}
        //获取xml对象
        jsData = jsData.xml
        //判断数据是否是一个对象
        if (typeof jsData === 'object') {
            for (let key in jsData) {
                //获取属性值
                let value = jsData[key]
                //过滤空数据
                if (Array.isArray(value) && value.length > 0) {
                    //将合法数据赋值到message对象上
                    message[key] = value[0]
                }
            }
        }
        return message
    }
}