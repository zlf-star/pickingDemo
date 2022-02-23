<!--
 * @Descripttion: 
 * @version: 
 * @Author: zlf
 * @Date: 2021-05-28 11:50:24
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-06-30 17:35:53
-->
<template>
<div class="right-side-bar-container">
  <el-tooltip class="item" effect="dark" content="显示单元" placement="left">
    <div class="tool-icon" @click="element_show_click" :class="{'isActive':elementActive}">
      <svg-icon icon-class="elemen_show"/>
    </div>
  </el-tooltip>
  <el-tooltip class="item" effect="dark" content="显示节点" placement="left">
    <div class="tool-icon" @click="node_show_click" :class="{'isActive':nodeActive}">
      <svg-icon icon-class="node_show"/>
    </div>
  </el-tooltip>
  <el-tooltip class="item" effect="dark" content="显示线" placement="left">
    <div  class="tool-icon" @click="line_show_click" :class="{'isActive':lineActive}">
      <svg-icon icon-class="line_show"/>
    </div>
  </el-tooltip>
  <el-tooltip class="item" effect="dark" content="显示X视图" placement="left">
    <div  class="tool-icon" @click="x_show_click">
      <svg-icon icon-class="X"/>
    </div>
  </el-tooltip>
  <el-tooltip class="item" effect="dark" content="显示Y视图" placement="left">
    <div  class="tool-icon" @click="y_show_click">
      <svg-icon icon-class="Y"/>
    </div>
  </el-tooltip>
  <el-tooltip class="item" effect="dark" content="显示Z视图" placement="left">
    <div  class="tool-icon" @click="z_show_click">
      <svg-icon icon-class="Z"/>
    </div>
  </el-tooltip>
  
  
  
</div>
</template>

<script>
  export default {
    name:'',
    data() {
      return {
        elementActive:true,
        nodeActive:false,
        lineActive:false,
      }
    },
    methods:{
      x_show_click() {
        this.$emit('x_show_click')
      },
      y_show_click() {
        this.$emit('y_show_click')
      },
      z_show_click() {
        this.$emit('z_show_click')
      },
      element_show_click() {
        this.elementActive = !this.elementActive
        this.$emit('element_show_click',this.elementActive)
      },
      node_show_click() {
        this.nodeActive = !this.nodeActive
        this.$emit('node_show_click', this.nodeActive)
      },
      line_show_click() {
        this.lineActive = !this.lineActive
        this.$emit('line_show_click', this.lineActive)
      }
    }
  }
</script>

<style lang="less" scoped>
.right-side-bar-container{
  position: absolute;
  width: @right-side-bar-width;
  height: 100%;
  top: 0;
  right: 0;
  background-color: @menuBg;
  color:@menuText;
  .tool-icon {
    width: 35px;
    height: 40px;
    margin: 5px calc((@right-side-bar-width - @tool-icon-width) / 2) ;
    font-size: 24px;
    
    text-align: center;
    line-height: 40px;
    &:hover{
      background-color: @menuHover;
    }
    
  }
  
}
.isActive{
      color: @menuActiveText;
    }
</style>
