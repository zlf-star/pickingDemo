<template>
  <div >
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-tree 
        :data="data" 
        node-key="id"
        icon-class="none"
        :props="defaultProps"
        @node-click="handleNodeClick"
        @node-contextmenu='rihgtClick'>
        <span class="slot-t-node" slot-scope="{ node,data }">
          <span v-if="data.icon" class="svg-container">
              <svg-icon :icon-class="data.icon" />
          </span>
          <span class="node-title" :class="{'no-icon':!data.icon}">{{ node.label }}</span>
        </span>
      </el-tree>
      <el-button type="primary" class="sub-btn" style="padding:0">提交计算</el-button>
    </el-scrollbar>
    <!--鼠标右键点击出现页面-->
    <div v-show="menuVisibleFu">
      <el-menu
        id="rightClickMenuFu"
        class="el-menu-vertical"
        @select="handleRightSelect"
        active-text-color="#fff"
        text-color="#fff">
        <el-menu-item index="1" class="menuItem">
          <span slot="title">添加</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div v-show="menuVisibleZi">
      <el-menu
        id="rightClickMenuZi"
        class="el-menu-vertical"
        @select="handleRightSelect"
        active-text-color="#fff"
        text-color="#fff">
        <el-menu-item index="2" class="menuItem">
          <span slot="title">编辑</span>
        </el-menu-item>
        <el-menu-item index="3" class="menuItem">
          <span slot="title">删除</span>
        </el-menu-item>
      </el-menu>
    </div>
    <material-dialog 
    :visible="materialVisiable"
    @materialDialogClose="materialDialogClose"
    @submitAddNode="submitAddNode"/>
  </div>
</template>

<script>
import variables from 'assets/styles/variables.less'

import MaterialDialog from 'views/dialog/MaterialDialog'
  export default {
    name:'',
    components:{
      MaterialDialog
    },
    computed:{
      variables() {
      return variables
    },
    },
    data() {
      return {
        data: [
          {
            id: 1,
            label: '设置材料',
            icon:'material',
            children: [
              {
                id: 2,
                label: '二级 1-1',
              }
            ]
          },
          {
            id: 3,
            label: '设置边界载荷',
            icon:'boundaryLoading',
            children: [
              {
                id: 4,
                label: '二级 1-1',
              }
            ]
          },
          {
            id: 5,
            label: '设置计算条件',
            icon:'calculation',
            children: [
              {
                id: 6,
                label: '二级 1-1',
              }
            ]
          }
        ],
        defaultProps: {
          children: 'children',
          label: 'label',
          icon:'icon'
        },

        //右键相关
        DATA: null,
        NODE: null,
        menuVisibleFu: false,//父菜单
        menuVisibleZi: false,//子菜单
        maxexpandId:10,//新增节点开始id，需要后台返回

        projectId:'',//项目id
        materialVisiable:false,//项目弹窗
      };
    },
    //获取路径中项目id
    created(){
      if(this.$route.params && this.$route.params.projectId) {
        this.projectId = this.$route.params.projectId
        this.$store.dispatch('project/setProjectId',this.projectId)
      }
    },
    methods: {
      submitAddNode(materialId){
        this.materialVisiable = false
        if(this.DATA && this.NODE) {
          this.NodeAdd(this.NODE,this.DATA,materialId)
        }else {
          this.$baseMessage('材料设置失败','error')
        }
        console.log(materialId);
      },
      //子组件材料弹窗关闭
      materialDialogClose(){
        this.materialVisiable = false
      },
      //编辑节点
      NodeEdit(n,d){
        TODO
        /*
          将d.children.id存入 vuex
          dialog在创建时判断是否有materialId,有的话查询数据库回显数据
        */
      },
      //添加节点
      NodeAdd(n, d,name){
        console.log(d.children)
        //判断层级
        if(n.level >= 3){
          this.$message.error("最多只支持三级！")
          return false;
        }
        //新增数据
        d.children.push({
          id: name,
          label: name,
          pid: d.id,
        })
        //同时展开节点
        if(!n.expanded){
          n.expanded = true
        }
      },
      //删除节点
      NodeDel(n, d){
        
        console.log(n, d)
          //二次确认
            this.$baseConfirm("是否删除此节点？","",'',() => {
              //删除操作
              let _list = n.parent.data.children || n.parent.data;//节点同级数据
              let _index = _list.map((c) => c.id).indexOf(d.id);
              console.log(_index)
              _list.splice(_index, 1);
              this.menuVisible = false
              this.menuVisible3 = false
              this.$baseMessage("删除成功！",'success')
            })
      },
      //el-tree单击事件
      handleNodeClick() {
        this.menuVisibleFu = false;
        this.menuVisibleZi = false
      },
      //菜单选择
      handleRightSelect(key){
        if (key == 1) {
          // this.NodeAdd(this.NODE, this.DATA);
          this.menuVisibleFu = false;
          this.materialVisiable=true;
          
        } else if (key == 2) {
          this.NodeEdit(this.NODE, this.DATA);
          this.menuVisibleZi = false;
        } else if (key == 3) {
          this.NodeDel(this.NODE, this.DATA);
          this.menuVisibleZi = false;
        }
      },
      //右键点击
      rihgtClick(event, object, value, element) {
      console.log(object)
      console.log(object.children)
      let menu = null;
      if (this.objectID !== object.id) {
        //点击的是除之之 外
        this.objectID = object.id;
        if ( object.children) {
          //点击除之之外 父级
          this.menuVisibleFu = true;
          //子级菜单消失
          this.menuVisibleZi = false
          menu = document.querySelector("#rightClickMenuFu");
          console.log(menu)
        }else {
          //点击除之之外 子级
          this.menuVisibleZi = true
          //父级菜单消失
          this.menuVisibleFu = false
          menu = document.querySelector("#rightClickMenuZi");
          console.log(menu)
        }
        this.DATA = object;
        this.NODE = value;
        menu.style.left = event.clientX + 10 + "px";
        menu.style.top = event.clientY - 20 + "px";
        menu.style.position = "absolute"; // 为新创建的DIV指定绝对定位
        // menu.style.width = 60 + "px";
      } else {
        
        if ( object.children) {
          //点击的是同一父级
          this.menuVisibleFu = !this.menuVisibleFu
          
        }else {
          //点击的是同一子级
          this.menuVisibleZi = !this.menuVisibleZi
        }
      }
    },
    }
  }
</script>

<style lang="less">
  .el-tree{
    background-color: @menuBg;
    color:@menuText;
    .el-tree-node{

      .el-tree-node__content{
        height: @base-menu-item-height;
        line-height: @base-menu-item-height;
        .el-tree-node__expand-icon{
          padding: 0 !important;
        }
        // padding: 0 10px !important;
        .slot-t-node{
          //icon和标题统一字体
          font-size: @base-font-size-default;
            .node-title{
              //标题
              display: inline-block;
              height: 56px;
            }
            .no-icon{
              //没有图标的标题
              padding-left: 35px;
            }
            .svg-container{
              //图标
              margin: 0 20px 0 20px;
              display: inline-block;
              width: 14px;
              font-size: @base-font-size-default;
            }
        } 
          
      }
    }
    //当鼠标点击tree的节点时显示的背景色
    .el-tree-node:focus > .el-tree-node__content {
      background-color: @menuHover !important;
      color: @menuActiveText;
    }
    //鼠标移动时，节点样式
    .el-tree-node__content:hover {    
      background-color: @menuHover;
      // color: @menuActiveText;
    }
    //当鼠标点击后,再点击空白地方,节点失去焦点时显示的背景色
    .el-tree--highlight-current .el-tree-node.is-current>.el-tree-node__content {
      background-color: @menuHover;
      color: @menuActiveText;
    }
  }
  //设置按钮padding
  .sub-btn{
    width: calc(@sideBarWidth - 40px);
    height: 50px;
    line-height: 50px;
    margin: 10px 20px;
    color: @base-menu-color;
    background-color: @base-color-default;
    box-shadow: @base-box-shadow;
  }
  //设置右键菜单
  .menuItem{
    height: 30px;
    text-align: center;
    line-height: 30px;
    background-color: #545c64;
    font-size: @base-font-size-default;
    &:hover{
      background-color: #409EFF;
    }
  }
  .el-menu-vertical{
    // border: 3px solid red !important;
    // border-radius: 10px;
    width: 90px !important;
    height: 30px !important;
  }
  
  
</style>
