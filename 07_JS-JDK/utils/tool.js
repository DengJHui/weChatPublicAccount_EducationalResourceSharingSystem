/*
  工具包函数
 */
//引入xml2js模块
const {parseString} = require('xml2js')
//引入fs模块
const {writeFile, readFile} = require("fs")
//引入path模块
const {resolve} = require('path')

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
    },
    writeFileAsync(data,fileName){
        //将对象转化为json字符串
        data = JSON.stringify(data)
        const filePath = resolve(__dirname,fileName)
        return new Promise((resolve, reject) => {
            writeFile(filePath, data, err => {
                if (!err) {
                    console.log('文件保存成功')
                    resolve()
                } else {
                    reject('writeFileAsync方法出了问题，' + err)
                }
            })
        })
    },
    readFileAsync(fileName){
        const filePath = resolve(__dirname,fileName)
        //读取本地文件中的ticket
        return new Promise((resolve, reject) => {
            readFile(filePath, (err, data) => {
                if (!err) {
                    console.log('文件读取成功')
                    //将json字符串转化为js对象
                    data = JSON.parse(data)
                    resolve(data)
                } else {
                    reject('readFileAsync方法出了问题，' + err)
                }
            })
        })
    }
}