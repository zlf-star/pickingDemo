<!--
 * @Descripttion: 
 * @version: 
 * @Author: zlf
 * @Date: 2021-06-30 17:36:28
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-07-16 10:41:15
-->
<template>
<el-dialog
  :visible="selectVisible" 
  title="选择"
  width="17%"
  :modal="false" 
  :close-on-click-modal="false"
  @close="dialogSelectClose"
  >
  <el-tabs v-model="activeName">
    <el-tab-pane label="框选" name="first">
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="text">单元：</div>
        </el-col>
        <el-col :span="6">
          <div class="nums">{{multiple.element}}</div>
        </el-col>
        <el-col :span="8">
          <el-button size="mini" type="primary" @click="selectClick(1)">开始选择</el-button>
        </el-col>
      </el-row>
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="text">面：</div>
        </el-col>
        <el-col :span="6">
          <div class="nums">{{multiple.face}}</div>
        </el-col>
        <el-col :span="12">
          <el-button size="mini" type="primary" @click="selectClick(2)">开始选择</el-button>
        </el-col>
      </el-row>
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="text">线：</div>
        </el-col>
        <el-col :span="6">
          <div class="nums">{{multiple.line}}</div>
        </el-col>
        <el-col :span="12">
          <el-button size="mini" type="primary" @click="selectClick(3)">开始选择</el-button>
        </el-col>
      </el-row>
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="text">点：</div>
        </el-col>
        <el-col :span="6">
          <div class="nums">{{multiple.node}}</div>
        </el-col>
        <el-col :span="12">
          <el-button size="mini" type="primary" @click="selectClick(4)">开始选择</el-button>
        </el-col>
      </el-row>
    </el-tab-pane>
    <el-tab-pane label="单选" name="second">单选</el-tab-pane>
  </el-tabs>
</el-dialog>
</template>

<script>
import {mapGetters} from 'vuex'
  export default {
    name:'',
    props:{
      selectVisible:{
        type:Boolean,
        default:false
      },
      modelType:{
        type: Number,
        default:-1,
      }
    },
    computed:{
      ...mapGetters({
        multiple:'project/multiple',
        singal:'project/singal',
      })
    },
    data() {
      return {
        activeName:'first',
      }
    },
    methods: {
      selectClick(index) {
        if (index == 2) {
          if (this.modelType == 0) {
            //二维不可选面
            this.$baseMessage('二维模型不可选面','warning');
            return;
          }
        }
        if (index == 3) {
          if (this.modelType == 1) {
            //三维不可选线
            this.$baseMessage('三维模型不可选线','warning',1500);
            return;
          }
        }
        this.$emit('selectClick', index);
      },
      dialogSelectClose() {
        this.$emit('selectClose');
      }
    },
  }
</script>

<style lang="less" scoped>
.text {
  height: 28px;
  line-height: 28px;
}
.nums {
  border-radius: @base-border-radius;
  border: 1px solid @base-border-color ;
  height: 28px;
  line-height: 28px;
  text-align: center;
}
  .el-dialog__wrapper{
    pointer-events: none !important;
  }
::v-deep {
  .el-row {
    margin-bottom: 20px;
    &:last-child {
      margin-bottom: 0;
    }
  }
  .el-col {
    border-radius: 4px;
  }
  
    .el-dialog{
      pointer-events: auto !important;
      top:calc(@base-nav-bar-height + 20px) !important;
      left: calc(@sideBarWidth + 20px) !important;
      margin: 0 !important;
      .el-dialog__header {
        padding: 10px !important;
      }
      .el-dialog__body{
        .el-tabs{
          //更改导航栏的那条线
          width: 200px;
        }
        flex:1;
        overflow: auto;
        padding: 0 10px 10px 10px !important;
      }
    }
  
    
}
  
  
</style>
