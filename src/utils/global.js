import { Loading, Message, MessageBox, Notification } from 'element-ui'
import {messageDuration,loadingText, loadingTarget} from './config'
const install = (Vue, opts={}) => {
  /* 全局Message */
  Vue.prototype.$baseMessage = (message, type,duration) => {
    Message({
      offset: 40,//距离窗口顶部的偏移量
      showClose: true,
      message: message,
      type: type, //success/warning/info/error
      dangerouslyUseHTMLString: true,//可换行可缩进转义字符
      duration: duration || messageDuration,
    })
  }

  /* 全局Alert */
  Vue.prototype.$baseAlert = (content, title, callback) => {
    MessageBox.alert(content, title || '温馨提示', {
      confirmButtonText: '确定',
      dangerouslyUseHTMLString: true,
      callback: (action) => {
        if (callback) {
          callback()
        }
      },
    })
  }

  /* 全局Confirm */
  Vue.prototype.$baseConfirm = (content, title, type,callback1, callback2) => {
    MessageBox.confirm(content, title || '温馨提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      closeOnClickModal: false,
      type: type || 'warning',
    })
      .then(() => {
        if (callback1) {
          callback1()
        }
      })
      .catch(() => {
        if (callback2) {
          callback2()
        }
      })
  }

  /* 全局Notification */
  Vue.prototype.$baseNotify = (message, title, type='success', position='top-right',duration) => {
    Notification({
      title: title,
      message: message,
      position,
      type,
      duration:duration || messageDuration,
    })
  }
  /* 全局加载层 */
  Vue.prototype.$baseLoading = (target, text) => {
    let loading = Loading.service({
      target:target || loadingTarget,
      text: text || loadingText,
      background:'rgba(255, 255, 255, 0.5)'
    })
    return loading
  }
}
 
if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

export default install