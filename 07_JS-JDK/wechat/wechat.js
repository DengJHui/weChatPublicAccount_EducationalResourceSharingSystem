/*
    获取access_token:
      是什么？微信调用接口全局唯一凭据

     特点：
       1. 唯一性
       2. 有效期为2小时，提前5分钟请求
       3. 接口权限 每天2000次

     请求地址：
       https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
     请求方式：
       GET

     设计思路：
       1. 首次本地没有，发送请求获取access_token，保存下来（本地文件）
       2. 第二次之后：
         -先去本地读取文件读取，判断它是否过期
           -过期了
             -重新请求获取access_token，保存下来覆盖之前的文件
           -没有过期
             -直接使用

       整理思路：（access_token也可以保存在数据库中）
         读取本地文件（readAccessToken）
           -本地有文件
             -判断是否过期（isValidAccessToken）
               -过期了
                 -重新请求获取access_token(getAccessToken)，保存下来覆盖之前的文件(保证文件唯一)（saveAccessToken）
               -没有过期
                 -直接使用
            -本地没有文件
              -发送请求获取access_token(getAccessToken)，保存下来（本地文件）（saveAccessToken），直接使用
 */
//只需要引入request-promise-native
const rp = require('request-promise-native')
//引入fs模块
const {writeFile, readFile} = require('fs')
//引入config模块
const {appID, appsecret} = require('../config')
//引入menu模块
const menu = require('./menu')
//引入api模块
const api = require('../utils/api')
//引入工具函数
const {writeFileAsync,readFileAsync} = require('../utils/tool')


//定义类，获取access_token
class Wechat {
    constructor() {

    }

    /**
     * 用来获取access_token
     */
    getAccessToken() {
        //定义请求的地址
        const url = `${api.accessToken}&appid=${appID}&secret=${appsecret}`
        //发送请求
        /*
          request
          request-promise-native  返回值是一个promise对象
         */
        return new Promise((resolve, reject) => {
            rp({method: 'GET', url, json: true})
                .then(res => {
                    console.log(res)
                    /*
                    {
                       access_token: '61_Tww0TWguWKQzlo3FBwl0Q1seR3-faZNdlkQyHL68oxPQCeXW1d7r3ZD3tbig3NvQMf5GskBqVD3VUxj1biPontRjtD_I1UPEHdx6HlOA-j4vAw-dO1rLtS68GIvvwL96ii-m3RE5CueUdvSxRCSiAFAHSI',
                       expires_in: 7200
                     }
                     */
                    //设置access_token的过期时间
                    res.expires_in = Date.now() + (res.expires_in - 300) * 1000
                    //将promise对象状态改成成功的状态
                    resolve(res)
                })
                .catch(err => {
                    console.log(err)
                    //将promise对象状态改成失败的状态
                    reject('getAccessToken方法出了问题:' + err)
                })
        })

    }

    /**
     * 用来保存access_token
     * @param accessToken 要保存的凭据
     */
    saveAccessToken(accessToken) {
        return writeFileAsync(accessToken, 'accessToken.txt')
    }

    /**
     * 用来读取access_token
     */
    readAccessToken() {
        return readFileAsync('accessToken.txt')
    }

    /**
     * 用来检测accessToken是否过期
     * @param data
     */
    isValidAccessToken(data) {
        //检测传入的参数是否有效
        if (!data && !data.access_token && !data.expires_in) {
            //代表access_token无效的
            return false
        }

        //检测access_token是否在有效期内
        /* if (data.expires_in < Date.now()){
            //过期了
            return false
        }else {
            //没有过期
            return true
         }*/

        return data.expires_in > Date.now();
    }

    /**
     * 用来获取没有过期的access_token
     * @returns {Promise<unknown>} access_token
     */
    fetchAccessToken() {
        //优化
        if (this.access_token && this.expires_in && this.isValidAccessToken(this)) {
            //说明之前保存过access_token，并且它是有效的，直接使用
            return Promise.resolve({
                access_token: this.access_token,
                expires_in: this.expires_in
            })
        }
        //是fetchAccessToken函数的返回值
        return this.readAccessToken()
            .then(async res => {
                //本地有文件
                if (this.isValidAccessToken(res)) {
                    //有效的
                    // resolve(res)
                    return Promise.resolve(res)
                } else {
                    //过期的
                    //发送请求获取access_token(getAccessToken)
                    const res = await this.getAccessToken()
                    //保存下来（本地文件）（saveAccessToken），直接使用
                    await this.saveAccessToken(res)
                    //将请求回来的access_token返回出去
                    // resolve(res)
                    return Promise.resolve(res)
                }
            })
            .catch(async err => {
                //本地没有文件
                //发送请求获取access_token(getAccessToken)
                const res = await this.getAccessToken()
                //保存下来（本地文件）（saveAccessToken），直接使用
                await this.saveAccessToken(res)
                //将请求回来的access_token返回出去
                // resolve(res)
                return Promise.resolve(res)
            })
            .then(res => {
                //将access_token挂载到this上
                this.access_token = res.access_token
                this.expires_in = res.expires_in
                //返回res包装了一层promise对象（此对象为成功的状态）
                //是this.readAccessToken()最终的返回值
                return Promise.resolve(res)
            })
    }


    /**
     * 用来获取jsapi_ticket
     */
    getTicket() {
        //发送请求
        /*
          request
          request-promise-native  返回值是一个promise对象
         */
        return new Promise(async (resolve, reject) => {
            //获取access_token
            const data = await this.fetchAccessToken()
            //定义请求的地址
            const url = `${api.ticket}&access_token=${data.access_token}`
            rp({method: 'GET', url, json: true})
                .then(res => {
                    //将promise对象状态改成成功的状态
                    resolve({
                        ticket: res.ticket,
                        expires_in: Date.now() + (res.expires_in - 300) * 1000
                    })
                })
                .catch(err => {
                    console.log(err)
                    //将promise对象状态改成失败的状态
                    reject('getJsapiTicket方法出了问题:' + err)
                })
        })

    }

    /**
     * 用来保存jsapi_ticket
     * @param ticket 要保存的凭据
     */
    saveTicket(ticket) {
        return writeFileAsync(ticket, 'ticket.txt')
    }

    /**
     * 用来读取jsapi_ticket
     */
    readTicket() {
        return readFileAsync('ticket.txt')
    }

    /**
     * 用来检测ticket是否过期
     * @param data
     */
    isValidTicket(data) {
        //检测传入的参数是否有效
        if (!data && !data.ticket && !data.expires_in) {
            //代表ticket无效的
            return false
        }

        return data.expires_in > Date.now();
    }

    /**
     * 用来获取没有过期的ticket
     * @returns {Promise<unknown>} ticket
     */
    fetchTicket() {
        //优化
        if (this.ticket && this.ticket_expires_in && this.isValidTicket(this)) {
            //说明之前保存过ticket，并且它是有效的，直接使用
            return Promise.resolve({
                ticket: this.ticket,
                expires_in: this.ticket_expires_in
            })
        }
        //是fetchTicket函数的返回值
        return this.readTicket()
            .then(async res => {
                //本地有文件
                if (this.isValidTicket(res)) {
                    //有效的
                    return Promise.resolve(res)
                } else {
                    //过期的
                    const res = await this.getTicket()
                    await this.saveTicket(res)
                    return Promise.resolve(res)
                }
            })
            .catch(async err => {
                //本地没有文件
                const res = await this.getTicket()
                await this.saveTicket(res)
                return Promise.resolve(res)
            })
            .then(res => {
                //将ticket挂载到this上
                this.ticket = res.ticket
                this.ticket_expires_in = res.ticket_expires_in
                return Promise.resolve(res)
            })
    }

    /**
     * 用来创建自定义菜单
     * @param menu 菜单配置对象
     * @returns {Promise<unknown>}
     */
    createMenu(menu) {
        return new Promise(async (resolve, reject) => {
            try {
                //获取access_token
                const data = await this.fetchAccessToken()
                //定义请求地址
                const url = `${api.menu.create}access_token=${data.access_token}`
                //发送请求
                const result = await rp({method: 'POST', url, json: true, body: menu})
                resolve(result)
            } catch (e) {
                reject('createMenu方法出了问题：' + e)
            }

        })
    }

    /**
     * 用来删除自定义菜单
     * @returns {Promise<unknown>}
     */
    deleteMenu() {
        return new Promise(async (resolve, reject) => {
            try {
                //获取access_token
                const data = await this.fetchAccessToken()
                //定义请求地址
                const url = `${api.menu.delete}access_token=${data.access_token}`
                //发送请求
                const result = await rp({method: 'GET', url, json: true})
                resolve(result)
            } catch (e) {
                reject('deleteMenu方法出了问题：' + e)
            }
        })
    }
}

// (async () => {
//     //模拟测试
//     const w = new Wechat()
//     // //删除之前定义的菜单
//     // let result = await w.deleteMenu()
//     // console.log(result)
//     // //创建新的菜单
//     // result = await w.createMenu(menu)
//     // console.log(result)
//     const result = await w.fetchTicket()
//     console.log(result)
// })()

module.exports = Wechat