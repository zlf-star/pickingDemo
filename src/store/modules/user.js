import Vue from 'vue'


import { StaticRouterMap } from 'router/index'
 const state= {
    uid:'',//用户id
    avatar:'',//用户头像
    roles:'',//用户角色
    init: false, // 是否完成动态路由初始化 // 默认未完成
    RouterList: [], // 动态路由
  }
const mutations={
  
  SET_TOKEN: (state, token) => {
    state.accessToken = token
  },
  SET_ID:(state,uid)=>{
    state.uid = uid
  },
  SET_AVATAR:(state,avatar)=>{
    state.avatar = avatar
  },
  SET_ROLES:(state,roles)=>{
    state.roles = roles
  },
  set_router: (state, RouterList) => {
    // debugger
    state.RouterList = RouterList
  },
  set_init: (state, status) => {
    state.init = status
  },
}
  const actions={



    // 动态设置路由 
    // store asyncRouter in vuex
    setRouterList({ commit }, routerList) {
      commit('set_router', StaticRouterMap.concat(routerList)) // 进行路由拼接并存储
    },


    
  }
  const getters = {
    routerList: (state) => state.RouterList,
  }


export default {
  state,mutations,actions,getters}