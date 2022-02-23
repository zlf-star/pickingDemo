import Cookies from 'js-cookie'
import {showSettings, fixedHeader, sidebarLogo} from 'utils/config'
import { getLanguage } from '@/lang/index'
 const state= {
    device :'desktop',
    sidebar:{
      opened: Cookies.get('sidebarStatus') ? !!+Cookies.get('sidebarStatus') : true,
      withoutAnimation: false
    },
    showSettings: showSettings,
    fixedHeader: fixedHeader,
    sidebarLogo: sidebarLogo,
    language: getLanguage(),
  }
const mutations={
    TOGGLE_SIDEBAR: state => {
      state.sidebar.opened = !state.sidebar.opened
      state.sidebar.withoutAnimation = false
      if (state.sidebar.opened) {
        Cookies.set('sidebarStatus', 1)
      } else {
        Cookies.set('sidebarStatus', 0)
      }
    },
    CLOSE_SIDEBAR: (state, withoutAnimation) => {
      Cookies.set('sidebarStatus', 0)
      state.sidebar.opened = false
      state.sidebar.withoutAnimation = withoutAnimation
    },
    TOGGLE_DEVICE: (state, device) => {
      state.device = device
    },
    CHANGE_SETTING: (state, { key, value }) => {
      if (state.hasOwnProperty(key)) {
        state[key] = value
      }
    },
    SET_LANGUAGE: (state, language) => {
      state.language = language
      Cookies.set('language', language)
    },
  }
  const actions={
    toggleSideBar({ commit }) {
      commit('TOGGLE_SIDEBAR')
    },
    closeSideBar({ commit }, { withoutAnimation }) {
      commit('CLOSE_SIDEBAR', withoutAnimation)
    },
    toggleDevice({ commit }, device) {
      commit('TOGGLE_DEVICE', device)
    },
    changeSetting({ commit }, data) {
      commit('CHANGE_SETTING', data)
    },
    setLanguage({ commit }, language) {
      commit('SET_LANGUAGE', language)
    },
  }
  const getters = {
    device: (state) => state.device,
    sidebar: (state) => state.sidebar,
    sidebarLogo: (state) => state.sidebarLogo,
    language: (state) => state.language,
  }


export default {
  state,mutations,actions,getters}