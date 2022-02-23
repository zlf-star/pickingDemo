<template>
  <section class="app-main">
    <render />
    <el-dialog v-el-drag-dialog 
      :visible.sync="dialogTableVisible" 
      width="40%"
      title="读取网格文件" 
      :modal="true" 
      :close-on-click-modal="false">
        <el-upload
          ref="upload"
          action=""
          :file-list="fileList"
          :on-change="fileChange"
          :auto-upload="false"
          >
          <div slot="tip" class="el-upload__tip">只能上传网格类型文件</div>
          <el-button slot="trigger" size="small" type="primary" style="width:120px;">选取文件</el-button>
        </el-upload>
        <el-button type="success" round
        @click="fileRead"
        :loading="fileLoading"
        style="margin-top:50px;margin-left:30%;width:200px">确定读取</el-button>
    </el-dialog>
  </section>
</template>

<script>
import elDragDialog from 'utils/el-drag-dialog' 
import {mapGetters} from 'vuex'
import fileReadFunc from 'utils/readFile.js'
import Render from './Render'

  export default 
  {
    name:'',
    directives: { elDragDialog },
    components: { Render },
    data() {
      return {
        dialogTableVisible: true,
        fileLoading:false,
        fileList:[],

      }
    },
    methods: {
      fileChange(file, fileList) {
        //文件发生变化
        if (fileList.length > 1) {
          fileList.splice(0, 1)
        }

      },
      fileRead() {
        this.fileLoading = true;
        if (this.$refs.upload.$children[0].fileList.length > 0) {
          const file = this.$refs.upload.$children[0].fileList[0].raw;

          //read file
          
          //开启加载层
          const loading = this.$baseLoading(this.container,'');
          fileReadFunc(file);
          loading.close();
          
          this.fileLoading = false;
          this.dialogTableVisible = false;
        }else {
          this.$baseMessage('请先选择一个文件','warning');
          this.fileLoading = false
        }
        
      },

    },
    computed:{
      ...mapGetters({
        projectId:'project/projectId',
      }),
    },
    created() {
      //组件创建时，调用接口判断是否需要上传文件
    },
  }
</script>

<style lang="less" scoped>
  .app-main {
  /*50 = navbar  */
  min-height: calc(100vh - @base-nav-bar-height);
  width: 100%;
  position: relative;
  overflow: hidden;
    
  }
  .fixed-header+.app-main {
    padding-top: @base-nav-bar-height;
  
  }
  #render-container {
    width: 100%;
    min-height: calc(100vh - @base-nav-bar-height);
    overflow: hidden;
  }
  
</style>
