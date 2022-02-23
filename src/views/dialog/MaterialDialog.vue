<template>
  <el-dialog v-el-drag-dialog 
  :visible="visible" 
  title="设置材料" 
  @dragDialog="handleDrag" 
  :modal="false" 
  :close-on-click-modal="false"
  @close="dialogClose">
    <el-form 
    ref="materialForm" 
    :model="materialForm" 
    label-width="100px"
    label-position="left">
      <el-form-item label="材料库">
        <el-radio-group v-model="materialForm.libs" @change="libsChange">
          <el-radio label="1">官方资源库</el-radio>
          <el-radio label="2">我的资源库</el-radio>
          <el-radio label="3">自定义材料</el-radio>
        </el-radio-group>
      </el-form-item>
      <div v-show="officeLibsVisible">
        <el-form-item label="官方材料库">
          <el-select v-model="materialForm.materialId" placeholder="请绑定材料">
            <el-option 
            v-for="material in officeLibs"
            :key="material.id"
            :label="material.name" 
            :value="material.id"/>
          </el-select>
        </el-form-item>
        
      </div>
      <div v-show="myLibsVisible">
        <el-form-item label="我的材料库">
          <el-select v-model="materialForm.materialId" placeholder="请绑定材料">
            <el-option 
            v-for="material in myLibs"
            :key="material.id"
            :label="material.name" 
            :value="material.id"/>
          </el-select>
        </el-form-item>
      </div>
        
      <div v-show="defineForm">
        <el-form-item label="材料名称">
        <el-input v-model="materialForm.name"/>
      </el-form-item>
      </div>
      <el-form-item v-show="officeLibsVisible || myLibsVisible || defineForm">
          <el-button type="primary" @click="onSubmit">确定</el-button>
          <el-button @click="dialogClose">取消</el-button>
        </el-form-item>  
    </el-form>
  </el-dialog>
</template>

<script>
import elDragDialog from 'utils/el-drag-dialog'
import {mapGetters} from 'vuex' 
  export default {
    name:'',
    directives: { elDragDialog },
    props:['visible'],
    //获取路径中项目id
    computed:{
      ...mapGetters({
        projectId:'project/projectId'
      })
    },
    data() {
      return {
        //官方材料库
        officeLibs:[
          {id:'1234567890123456789',name:'材料一'},
          {id:'1234567890123456781',name:'材料二'},
          {id:'1234567890123456782',name:'材料三'},
          {id:'1234567890123456783',name:'材料四'},
        ],
        //我的材料库
        myLibs:[
          {id:'1234567890123456784',name:'材料1'},
          {id:'1234567890123456785',name:'材料2'},
          {id:'1234567890123456786',name:'材料3'},
          {id:'1234567890123456787',name:'材料4'},
        ],
        
        //材料表格
        materialForm:{
          name:'',
          libs:'',
          materialId:''
        },
        // projecyId:'',//项目id
        officeLibsVisible:false,
        myLibsVisible:false,
        defineForm:false,
      }
    },
    created () {
      // console.log(this.projectId);
    },
    methods: {
      //材料绑定确定后
      onSubmit() {
        if (this.materialForm.materialId) {
          this.$baseMessage('设置材料成功','success')
          this.$emit('submitAddNode',this.materialForm.materialId)
          
        }else {
          this.$baseMessage('材料未绑定，请选择材料','error')
        }
        
      },
      //材料库选择改变
      libsChange(label) {
        if(label == 1) {
          this.officeLibsVisible = true
          this.defineForm = false
          this.myLibsVisible = false
        }else if(label == 3) {
          this.defineForm = true
          this.officeLibsVisible = false
          this.myLibsVisible = false
        }else if(label == 2) {
          this.myLibsVisible = true
          this.officeLibs = false
          this.defineForm = false
        }
      },
      // v-el-drag-dialog onDrag callback function
      handleDrag() {
        this.$refs.select.blur()
      },
      //dialog关闭
      dialogClose() {
        this.$emit('materialDialogClose')
      }
    },
  }
</script>

<style lang='less' scoped>
.el-input{
  width: 33.3%;
}
</style>
