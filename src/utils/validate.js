/**
 * @description 判断是否是数组
 * @param arg
 * @returns {arg is any[]|boolean}
 */
 export function isArray(arg) {
  if (typeof Array.isArray === 'undefined') {
    return Object.prototype.toString.call(arg) === '[object Array]'
  }
  return Array.isArray(arg)
}
/**
 * @description 判断是否是邮箱
 * @param str
 * @returns {boolean}
 */
 export function isEmail(str) {
  const reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
  return reg.test(str)
}
/**
 * @description 校验密码是否小于6位
 * @param str
 * @returns {boolean}
 */
 export function isPassword(str) {
  return str.length >= 6
}

/**
 * Created by PanJiaChen on 16/11/18.
 */

/**
 * @param {string} path
 * @returns {Boolean}
 */
 export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}