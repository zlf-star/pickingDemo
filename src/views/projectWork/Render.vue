<template>
  <div id="render-container">
    <div id="renderer">
    </div>
    <div id="inset"></div>
    <div id="selectBox"></div>

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

      <el-tooltip class="item" disabled effect="dark" content="选择" placement="left">
        <div id = "choose-menu" class="tool-icon" :class="{'isActive':chooseActive}" @click="choose_click">
          <div id="choose-item" v-show = "chooseItemDisplay">
            <div class="choose-item-item">
               <svg-icon icon-class="choose_point" @click="handleSelect(1)"/>
            </div>
            <div class="choose-item-item">
              <svg-icon icon-class="choose_line" @click="handleSelect(2)"/>
            </div>
            <div class="choose-item-item">
              <svg-icon icon-class="choose_face" @click="handleSelect(3)"/>
            </div>
            <div class="choose-item-item">
              <svg-icon icon-class="choose_element" @click="handleSelect(4)"/>
            </div>
          </div>
          <svg-icon icon-class="mul_choose"/>
        </div>
      </el-tooltip>
     
    </div>
  </div>
</template>
<script>
import {mapGetters, mapActions} from 'vuex'

import {computeHeightByArray,computeTriaPoint,computeMidPoint,computeTetraPoint, computeProjectVertex, computeOrderIngroups,computeNormalVector, boolBetweenAngle, minMax} from 'utils/renderFunction'
import {Quad, Tria, Tetra, Block, BlockFaceIndex, ReducedBlockFaceIndex, BlockDrawIndex, BlockReduDrawIndex, TetraFaceIndex, minDistance, QuadLineIndex, TriaLineIndex, modelHighlightColor, modelColor, lineColor, sideBarWidth, navBarHeight} from 'utils/config'
import SelectionData from 'utils/selectionData'
import SelectionData2D from 'utils/selectionData2D'

import * as Three from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'

import SelectOptationDialog from '../dialog/selectOptationDialog.vue'
import RightSideBar from './RightSideBar.vue'

  export default {
    components: { RightSideBar, SelectOptationDialog},
    name:'',
    data() {
      return {
        chooseItemDisplay: false,

        // 选择
        userSelectData: null,  // 用户选择的数据

        // 显示
        elementActive:true,
        nodeActive:false,
        lineActive:false,        
        chooseActive:false,
        postionGlobalSize:0,//为了获取

        //控制器
        controls:null,
      }
    },

    nodes:null,
    nodes2D:null,
    elements:null,
    reducedElem:{},
    elemTypeArray:null,
    elemTypesArray:null,
    quadElem:null,        //是否包含有四面体网格，如果有的话，则需要单独画一套线
    dimension:0,          //模型信息
    geoRange:[],          //范围
    center:null,          //几何体中心 vector3
    surfaceInfo: null,
    octreeData:null,
    octreeSurfData:null,

    // 和2D单元相关的变量
    axisVectorOf2D: null,     // 
    normAxisIndex: null,      // 轴向方向的索引
    centerCoordi2D: null,     // 中心点的世界坐标系下的坐标
    
    // 选择相关
    selectMeshGroup: null, //用来存放点选时绘制的mesh
    selectionData:null,

    // 渲染相关结构
    element:null,
    point:null,

    //初始化
    camera: null,
    scene: null,
    renderer: null,
    container:null,//#renderer的dom节点对象
    ELE_GROUP: null,
    
    //坐标系
    camera2: null,
    scene2: null,
    renderer2: null,
    container2:null,
    axes2:null,

    computed:{
      ...mapGetters({
        groupsRows:'project/groupsRows',
        groupsColumns:'project/groupsColumns',
      })
    },
    methods:{

      ...mapActions({
        setMulElementNums:'project/setMulElementNums'
      }),
      //主界面拾取图标
      choose_click() {
        if (this.chooseActive === true) {
          this.chooseItemDisplay = false;
        } else {          
          this.chooseItemDisplay = !this.chooseItemDisplay;
        }
      },
      
      //渲染几何
      renderGeo(elemIdArray, color) {
        const indices = [];

        if (elemIdArray !== []) {
          elemIdArray.forEach(e => {
            const array = this.$options.elements[e];
            const elementType = this.$options.elemTypeArray[e];
            if (this.$options.surfaceInfo.boolSurfElem[e] === 1) {
              if (elementType === 7) {
                //0,3,2,2,1,0,4,5,6,6,7,4,1,5,4,4,0,1,2,6,5,5,1,2,3,7,6,6,2,3,0,4,7,7,3,0
                indices.push(array[0],array[3],array[2],array[2],array[1],array[0],
                  array[4],array[5],array[6],array[6],array[7],array[4],
                  array[1],array[5],array[4],array[4],array[0],array[1],
                  array[2],array[6],array[5],array[5],array[1],array[2],
                  array[3],array[7],array[6],array[6],array[2],array[3],
                  array[0],array[4],array[7],array[7],array[3],array[0])
              }else if (elementType === 134) {
                indices.push(array[0],array[1],array[2],
                    array[0],array[2],array[3],
                    array[1],array[3],array[2],
                    array[0],array[3],array[1])
              }else if (elementType === 18) {
                // 0,1,2,2,3,0
                indices.push(array[0],array[3],array[2],array[0],array[2],array[1]);
              }else if (elementType === 1) {
                //0,1,2
                indices.push(...array);
              }
            }
          })
        }
          
        let elementGeo = new Three.BufferGeometry();
        elementGeo.setIndex(indices);
        elementGeo.setAttribute('position', new Three.Float32BufferAttribute(this.$options.nodes, 3));
        // elementGeo.computeVertexNormals();
        const Material = new Three.MeshBasicMaterial({
            color: color,
          });
        return new Three.Mesh(elementGeo, Material);
      },

      drawSurface(array, geo){
        let indices = [];
        for (let i = 0; i < array.length; i++) {
          const elementGID = array[i][0];
          const elementLID = array[i][1];
          const currentElem = this.$options.elements[elementGID];
          const nodeArray = currentElem.array;
          let currentArray;
          if (currentElem.isReduced === false) {
            // const 
            currentArray = BlockDrawIndex[elementLID];
          } else {
            currentArray = BlockReduDrawIndex[elementLID];
          }

          // 将绘制节点放入数组中
          for (let j = 0; j < currentArray.length; j++) {
            const element = currentArray[j];
            
            indices.push(nodeArray[element]);
          }
        }
      },

      //开始选择，准备工作
      handleSelect(index) {
        // 将图标设置为选中状态

        // ***********************模块化*******************************//
        switch (this.$options.dimension) {
          case 3:
            
            // 选取3D单元
            this.$options.selectionData = new SelectionData(this.$options.container, document.getElementById('selectBox'), this.$options.selectMeshGroup, this.controls, this.$options.octreeData, this.$options.octreeSurfData, this.$options.elements, this.$options.nodes, this.$options.camera, this.$options.surfaceInfo, this.$options.elemTypeArray);
            this.$options.selectionData.initSelect(index);
            break;

          case 2:

            // 选取2D单元
            this.$options.selectionData = new SelectionData2D(this.$options.container, document.getElementById('selectBox'), this.$options.selectMeshGroup, this.controls, this.$options.octreeData, this.$options.elements, this.$options.nodes, this.$options.nodes2D, this.$options.camera, this.$options.elemTypeArray, this.$options.axisVectorOf2D);
            this.$options.selectionData.initSelect(index);
            break;
        
          default:
            break;
        }
        this.chooseActive = true;
        this.$options.container.addEventListener('pointerup', this.endPick);   
        // ***********************模块化结束*******************************//
      },

      endPick(e){
        if (e.button === 1 && e.ctrlKey === true) {
          this.chooseActive = false;
          this.$options.container.removeEventListener('pointerup', this.endPick); 
          this.$options.selectionData = null;      
        } 
      },
     
      
      //选面
      choose_face_click() {
        if (this.$options.dimension === 2) {
          this.$baseMessage('二维模型不可选面','warning')
          return
        }
        this.chooseActiveObject.face = !this.chooseActiveObject.face
        //显示线
        this.lineActive = true;
        this.initialChoose();
        
        this.chooseActiveObject.line = false
        this.chooseActiveObject.element = false
        this.chooseActiveObject.node = false


        if (this.chooseActiveObject.face) {
          this.userSelectData.chooseType = 2
          this.choose()
          console.log('222')
        }else {
          this.userSelectData.chooseType = -1
          this.unchoose()
        }
      },
      //选线
      choose_line_click() {
        if (this.$options.dimension === 3) {
          this.$baseMessage('三维模型不可选线','warning',1500)
          return
        }
        this.chooseActiveObject.line = !this.chooseActiveObject.line;
        //显示线
        this.lineActive = true;
        this.$options.scene.add(this.$options.line);
        this.initialChoose();

        this.chooseActiveObject.element = false;
        this.chooseActiveObject.face = false;
        this.chooseActiveObject.node = false;

        if (this.chooseActiveObject.line) {
          this.userSelectData.chooseType = 3;
          this.choose();
          console.log('333');
        }else{
          this.userSelectData.chooseType = -1;
          this.unchoose();
        }
      },
      //视图显示
      z_show_click() {
        this.$options.camera.position.set(0,0,this.postionGlobalSize*4)
      },
      y_show_click() {
        this.$options.camera.position.set(0,this.postionGlobalSize*4,0)
      },
      x_show_click() {
        this.$options.camera.position.set(this.postionGlobalSize*4,0,0)
      },
      //显示单元
      element_show_click() {
        this.elementActive = !this.elementActive;
        this.$options.element.material[0].visible = !this.$options.element.material[0].visible;
      },
      //显示节点
      node_show_click() {
        this.nodeActive = !this.nodeActive
        if (this.point) {
          if (this.nodeActive) {
            this.$options.ELE_GROUP.add(this.point)
          }else {
            this.$options.ELE_GROUP.remove(this.point)
          }
        }
      },
      //显示线
      line_show_click() {
        //1.改变样式
        this.lineActive = !this.lineActive;
        this.$options.element.material[1].visible = !this.$options.element.material[1].visible;
      },
      init() {
        this.$options.container = document.getElementById('renderer');

        this.$options.selectMeshGroup = new Three.Group();
        this.$options.ELE_GROUP = new Three.Group();
        this.$options.camera = new Three.OrthographicCamera(this.$options.container.clientWidth/-2, this.$options.container.clientWidth/2, this.$options.container.clientHeight/2, this.$options.container.clientHeight/-2, 0.0001, 10);

        this.$options.scene = new Three.Scene();
        this.$options.scene.background = new Three.Color( 0xe0e0e0 );              //这个是给背景加上标尺后删除的背景色
        this.$options.scene.add(this.$options.selectMeshGroup);

        this.$options.renderer = new Three.WebGLRenderer({antialias: true,alpha: true});
        this.$options.renderer.setClearAlpha(0.2);
        this.$options.renderer.setSize(this.$options.container.clientWidth, this.$options.container.clientHeight);
        this.$options.container.appendChild(this.$options.renderer.domElement);
        
        this.createControls();
        this.setupInset();
        this.fileRender();
        
      },

      // 判断二维外表面的拾取点
      surfacePP(index, array) {

        switch (index) {
          case 0:
            return computeMidPoint(this.$options.nodes[array[0]].array, this.$options.nodes[array[2]].array);             
          
          case 1:
            return computeMidPoint(this.$options.nodes[array[4]].array, this.$options.nodes[array[6]].array);
        
          case 2:
            return computeMidPoint(this.$options.nodes[array[1]].array, this.$options.nodes[array[4]].array);
          
          case 3:
            return computeMidPoint(this.$options.nodes[array[2]].array, this.$options.nodes[array[5]].array);
          
          case 4:
            return computeMidPoint(this.$options.nodes[array[3]].array, this.$options.nodes[array[6]].array);
        
          case 5:
            return computeMidPoint(this.$options.nodes[array[0]].array, this.$options.nodes[array[7]].array);
        
          default:
            break;
        }       
      },

      reduceSurfacePP(index, array) {

        switch (index) {
          case 0:
            return computeTriaPoint(this.$options.nodes[array[0]].array, this.$options.nodes[array[1]].array, this.$options.nodes[array[2]].array);             
          
          case 1:
            return computeTriaPoint(this.$options.nodes[array[4]].array, this.$options.nodes[array[5]].array, this.$options.nodes[array[6]].array);
        
          case 2:
            return computeMidPoint(this.$options.nodes[array[0]].array, this.$options.nodes[array[6]].array);
          
          case 3:
            return computeMidPoint(this.$options.nodes[array[1]].array, this.$options.nodes[array[4]].array);
          
          case 4:
            return computeMidPoint(this.$options.nodes[array[2]].array, this.$options.nodes[array[5]].array);
        
          default:
            break;
        }      
      },

      //文件渲染
      fileRender() {

        //监听事件总线中文件加载完成
        this.$bus.$on('fileUpload', (geomInfo) => {

          console.time('数据存放起来');
          // 将传输进来的数据存放到相应的数据结构中
          if (geomInfo.nodes.length>0) {
            this.$options.nodes = geomInfo.nodes
          };
          if (geomInfo.nodes2D) {
            this.$options.nodes2D = geomInfo.nodes2D
          };
          if (geomInfo.elements.length > 0) {
            this.$options.elements = geomInfo.elements
          };
          this.$options.surfaceInfo = geomInfo.surfaceInfo;
          const lineIndices = geomInfo.lineIndices;
          this.$options.elemTypeArray = geomInfo.elemTypeArray;
          this.$options.dimension = geomInfo.dimension;
          this.$options.quadElem = geomInfo.quadElem;
          this.$options.geoRange = geomInfo.geoRange;
          this.$options.reducedElem = geomInfo.reducedElem;
          this.$options.octreeData = geomInfo.octreeData;
          this.$options.octreeSurfData = geomInfo.octreeSurfData;
          this.$options.axisVectorOf2D = geomInfo.axisVectorOf2D;
          this.$options.normAxisIndex = geomInfo.normAxisIndex;
          this.$options.centerCoordi2D = geomInfo.centerCoordi2D;

          // 将传过来的信息置为null
          geomInfo.nodes = null;
          geomInfo.nodes2D = null;
          geomInfo.elements = null;
          geomInfo.elemTypeArray = null;
          geomInfo.dimension = null;
          geomInfo.quadElem = null;
          geomInfo.geoRange = null;
          geomInfo.lineIndices = null;
          geomInfo.reducedElem = null;
          geomInfo.octreeData = null;
          geomInfo.octreeSurfData = null;
          geomInfo.normAxisIndex = null;
          geomInfo.centerCoordi2D = null;
          geomInfo = null;
          console.timeEnd('数据存放起来');

          // ********************绘制准备***************************//
          console.time('绘制网格');
          let indices = []; //单元索引
          if (this.$options.dimension === 3) {
            // 找到外表面节点
            let boolSurfaceNode = new Map();
            let faceDrawArray;
            let faceNode;
            for (let i = 0; i < this.$options.surfaceInfo.surfaceArray.length; i++) {
              const elemGID = this.$options.surfaceInfo.surfaceArray[i][0];
              const elemLID = this.$options.surfaceInfo.surfaceArray[i][1];
              const array = this.$options.elements[elemGID];
              const elemType = this.$options.elemTypeArray[elemGID];

              switch (elemType) {
                case 7:
                  // 下面是绘制这个面的索引，和这个面包含的节点索引
                  if (this.$options.reducedElem[elemGID]) {
                    faceDrawArray = BlockReduDrawIndex[elemLID].map(e => array[e]);
                    faceNode = ReducedBlockFaceIndex[elemLID].map(e => array[e]);
                  } else {
                    faceDrawArray = BlockDrawIndex[elemLID].map(e => array[e]);
                    faceNode = BlockFaceIndex[elemLID].map(e => array[e]);
                  }
                  
                  break;

                case 134:
                  // 下面是绘制这个面的索引，和这个面包含的节点索引
                  faceDrawArray = TetraFaceIndex[elemLID].map(e => array[e]);
                  faceNode = TetraFaceIndex[elemLID].map(e => array[e]);

                  break;
              
                default:
                  break;
              }

              // 将数据放入indices
              indices.push(...faceDrawArray);

              // 判断外表面节点
              faceNode.forEach(e => {
                boolSurfaceNode.set(e, true); 
              });      
            }
            this.$options.surfaceInfo.surfaceNode = [...boolSurfaceNode.keys()];

          }else{
            // debugger
            for (let i = 0; i < this.$options.elements.length; i++) {
              
              // i为单元的全局索引
              const array = this.$options.elements[i];
              const elemType = this.$options.elemTypeArray[i];

              switch (elemType) {
                case 18:

                  // 四边形单元
                  indices.push(array[0],array[3],array[2],array[0],array[2],array[1]);
                  
                  break;

                case 1:

                  // 三角形单元
                  
                  
                  break;
              
                default:
                  break;
              }
            }
          }
          
          // 绘制体几何
          const elementGeo = new Three.BufferGeometry();
          elementGeo.setIndex(indices);
          Object.defineProperty(elementGeo.userData, 'lineIndices', {
            value : lineIndices,
            enumerable : true,
            configurable : true
          });
          elementGeo.setAttribute('position', new Three.Float32BufferAttribute(this.$options.nodes, 3));
          const Material = new Three.MeshBasicMaterial({
              color: modelColor,
              side: Three.FrontSide,
              // vertexColors: true,
            });
          const MaterialWire = new Three.MeshBasicMaterial({
              color: lineColor,
              wireframe : true,
              transparent : true,
              visible :false,
            });
          
          elementGeo.addGroup(0, +Infinity, 0);
          elementGeo.addGroup(0, +Infinity, 1);
          this.$options.element = new Three.Mesh(elementGeo, [Material, MaterialWire]);         
          this.$options.ELE_GROUP.add(this.$options.element); 
          this.$options.scene.add(this.$options.ELE_GROUP);
          indices = null;

          //相机设置
          let XLength, YLength, ZLength, bdRadius;
          let cameraPosition = new Three.Vector3();
          switch (this.$options.dimension) {
            case 3:
                  
              XLength = Math.abs(this.$options.geoRange[1] - this.$options.geoRange[0]);
              YLength = Math.abs(this.$options.geoRange[3] - this.$options.geoRange[2]);
              ZLength = Math.abs(this.$options.geoRange[5] - this.$options.geoRange[4]);
              bdRadius = Math.sqrt(Math.pow(XLength, 2) + Math.pow(YLength, 2) + Math.pow(ZLength, 2))/2;

              // 相机的中心在包围盒的中心，位置在
              this.$options.center = new Three.Vector3((this.$options.geoRange[1] + this.$options.geoRange[0])/2, (this.$options.geoRange[2] + this.$options.geoRange[3])/2, (this.$options.geoRange[4] + this.$options.geoRange[5])/2 );
              cameraPosition.add(this.$options.center);
              cameraPosition.add(new Three.Vector3(bdRadius*1.2, bdRadius*1.2, bdRadius*1.2));
              this.$options.camera.position = cameraPosition;
              this.$options.camera.zoom = (9*this.$options.container.clientHeight)/(20*bdRadius);
              this.$options.camera.far = bdRadius*3;

              //鼠标控制旋转中心设置
              this.controls.target = this.$options.center ? this.$options.center : new Three.Vector3().fromArray([0,0,0]);      

              break;

            case 2:
                  
              XLength = Math.abs(this.$options.geoRange[1] - this.$options.geoRange[0]);
              YLength = Math.abs(this.$options.geoRange[3] - this.$options.geoRange[2]);
              bdRadius = Math.sqrt(Math.pow(XLength, 2) + Math.pow(YLength, 2))/2;

              this.$options.center = this.$options.centerCoordi2D;
              cameraPosition.add(this.$options.center);
              cameraPosition.add(this.$options.axisVectorOf2D[2]);
              this.$options.camera.position = cameraPosition;
              this.$options.camera.zoom = (9*this.$options.container.clientHeight)/(20*bdRadius);
              this.$options.camera.far = 2;
              this.$options.camera.up = this.$options.axisVectorOf2D[1];

              console.log('this.$options.camera', this.$options.camera);
              console.log('this.$options.scene', this.$options.scene);

              //鼠标控制旋转中心设置
              this.controls.target = this.$options.center;  
              this.controls.enableRotate = false;   

              break;

            default:
              break;
          }

          // 取消右键默认事件
          document.oncontextmenu = (e) => {
            e.preventDefault();
          }
          console.timeEnd('绘制网格');
        })
      },
      //动画渲染
      animate() {
        requestAnimationFrame(this.animate);
        //copy position of the camera into inset
        this.$options.camera2.position.copy( this.$options.camera.position );
        this.$options.camera2.position.sub( this.controls.target );
        this.$options.camera2.position.setLength( 300 );
        this.$options.camera2.lookAt( this.$options.scene2.position );
        this.$options.renderer.render(this.$options.scene, this.$options.camera);
        this.$options.renderer2.render(this.$options.scene2, this.$options.camera2);
        // console.log("this.$options.camera", this.$options.camera);
      },
      //自适应渲染窗口
      onWindowResize() {
        // 监听dom改变,渲染改变
        const elementresizedetectormaker = require('element-resize-detector')
        const erd = elementresizedetectormaker()
        
        let _this = this
        erd.listenTo(this.$options.container, function(element) {
          const loading = _this.$baseLoading(element,'')
          _this.$options.camera.aspect = element.clientWidth / element.clientHeight;
          _this.$options.camera.updateProjectionMatrix();
          _this.$options.renderer.setSize( element.clientWidth, element.clientHeight );
          loading.close()
        })

      },
      //鼠标控制
      createControls() {

        this.controls = new OrbitControls( this.$options.camera, this.$options.renderer.domElement );
        this.controls.rotateSpeed = 0.8;
        this.controls.zoomSpeed = 0.8;
      },
      // 坐标系
      setupInset() {
        const insetWidth = 150, insetHeight = 150;
        this.$options.container2 = document.getElementById( 'inset' );
        this.$options.container2.width = insetWidth;
        this.$options.container2.height = insetHeight;

        // renderer
        this.$options.renderer2 = new Three.WebGLRenderer( { alpha: true } );
        this.$options.renderer2.setClearColor( 0x000000, 0 );
        this.$options.renderer2.setSize( insetWidth, insetHeight );
        this.$options.container2.appendChild( this.$options.renderer2.domElement );

        // scene
        this.$options.scene2 = new Three.Scene();

        // camera
        this.$options.camera2 = new Three.PerspectiveCamera( 50, insetWidth / insetHeight, 1, 1000 );
        this.$options.camera2.up = this.$options.camera.up; // important!

        // axes
        this.$options.axes2 = new Three.AxesHelper( 100 );
        this.$options.scene2.add( this.$options.axes2 );

      },
    },
    
    mounted() {
      this.init();
      this.animate();
      this.onWindowResize()
    }
  }
</script>

<style lang="less" scoped>
#inset {
    width: 150px;
    height: 150px;
    background-color: transparent; /* or transparent; will show through only if renderer alpha: true */
    border: none; /* or none; */
    margin: 0;
    padding: 0px;
    position: absolute;
    left: -30px;
    bottom: -30px;
    z-index: 100;
    overflow: hidden;
  }
.right-side-bar-container{
  position: absolute;
  width: @right-side-bar-width;
  height: 100%;
  top: 0;
  right: 0;
  background-color: @menuBg;
  color:@menuText;
  .tool-icon {
    width: @tool-icon-width;
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

    
#renderer {
  width: calc(100% - @right-side-bar-width);
  min-height: calc(100vh - @base-nav-bar-height);
  overflow: hidden;
}
.isActive{
      color: @menuActiveText;
    }
.selectBox {
  border: 1px solid #55aaff ;
  background-color: rgba(75, 160, 255, 0.3) ;
  position: fixed ;
  z-index: 10000 ;
}


#choose-item {
  position: absolute;
  top: 270px;
  right: 41px;
  width: 42px;
  height: 162px;
  z-index: 10001;
  align-items: center;
  background-color: @menuBg;
  color:@menuText;
  border: darkcyan 1px;

  .choose-item-item{
    display: block;
    width: 40px;
    height: 40px;
    
    &:hover{
      background-color: @menuHover;
    }

  }
}
</style>
