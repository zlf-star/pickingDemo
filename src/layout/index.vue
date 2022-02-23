<template>
  <div :class="classObj" class="app-wrapper">
    <div v-if="device==='mobile'&&sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <side-bar class="sidebar-container" />
    <div class="main-container hasTagsView">
       <div :class="{'fixed-header':fixedHeader}">
         <navbar /> 
         <!-- <tags-view /> -->
      </div>
      <app-main />
    </div>
  </div>
</template>

<script>
import { Navbar, SideBar, AppMain } from './components'
import {mapGetters} from 'vuex'
export default {
  name: 'Layout',
  components: {
    Navbar,
    SideBar,
    AppMain,
  },
  computed: {
    ...mapGetters({
      sidebar:'setting/sidebar',
      device: 'setting/device'
    }),
    fixedHeader() {
      return this.$store.state['settings/fixedHeader']
    },
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
    handleClickOutside() {
      this.$store.dispatch('setting/closeSideBar', { withoutAnimation: false })
    }
  }
}
</script>

<style lang="less" scoped>
  @import "~@/assets/styles/mixin.less";
  @import "~@/assets/styles/variables.less";

  .app-wrapper {
    .clearfix;
    position: relative;
    height: 100%;
    width: 100%;
    &.mobile.openSidebar{
      position: fixed;
      top: 0;
    }
  }
  .drawer-bg {
    background: #000;
    opacity: 0.3;
    width: 100%;
    top: 0;
    height: 100%;
    position: absolute;
    z-index: 999;
  }

  .fixed-header {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9;
    width: calc(100% - @sideBarWidth);
    transition: width 0.28s;
  }

  .hideSidebar .fixed-header {
    width: calc(100% - 54px)
  }

  .mobile .fixed-header {
    width: 100%;
  }
</style>
