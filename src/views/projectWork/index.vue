<template>
<div :class="classObj" class="app-wrapper">
  <div v-if="device==='mobile'&&sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
  <side-bar class="sidebar-container" />
  <div class="main-container">
    <div :class="{'fixed-header':fixedHeader}">
      <nav-bar/> 
    </div>
    <work-main />
  </div> 
</div>
</template>

<script>
import {mapGetters} from 'vuex'
import elDragDialog from 'utils/el-drag-dialog' 
import NavBar from './NavBar'
import SideBar from './SideBar'
import WorkMain from './WorkMain'
  export default {
    name:'',
    directives: { elDragDialog },
    components:{
      NavBar,
      SideBar,
      WorkMain
    },
    data() {
      return {
        

         dialogTableVisible: false,
     
    
      }
    },
    computed:{
      ...mapGetters({
        sidebar:'setting/sidebar',
        device: 'setting/device',
      }),
      fixedHeader() {
        return this.$store.state['settings/fixedHeader']
      },
      //多个class
      classObj() {
        return {
          hideSidebar: !this.sidebar.opened,
          openSidebar: this.sidebar.opened,
          withoutAnimation: this.sidebar.withoutAnimation,
          mobile: this.device === 'mobile'
        }
      }
    },
    methods: {
      // v-el-drag-dialog onDrag callback function
      handleDrag() {
        this.$refs.select.blur()
      },
      //sidebar 
      handleClickOutside() {
        this.$store.dispatch('setting/closeSideBar', { withoutAnimation: false })
      }
    }
  }
</script>

<style lang="less" scoped>
  .sidebar {
    transition: width 0.28s;
    width: @sideBarWidth !important;
    background-color: @menuBg;
    height: 100%;
    position: fixed;
    font-size: 0px;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1001;
    overflow: hidden;
  }
  .el-tree-node{
    background-color: @menuBg;
    color: @menuText;
  }

  .fixed-header {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9;
    width: calc(100% - @sideBarWidth);
    transition: width 0.28s;
  }
</style>
