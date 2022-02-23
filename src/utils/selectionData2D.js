/*
 * @Descripttion: 
 * @version: 
 * @Author: zlf
 * @Date: 2021-07-08 17:28:26
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-07-16 11:49:25
 */
import {Quad, Tria, Tetra, Block, BlockFaceIndex, ReducedBlockFaceIndex, BlockDrawIndex, BlockDrawIndexARange, BlockReduDrawIndex, TetraFaceIndex, minDistance, QuadLineIndex, TriaLineIndex, modelHighlightColor, sideBarWidth, navBarHeight} from 'utils/config'
import {computeProjectVertex, boolBetweenAngle, minMax, arrayRange, createTypedArray} from 'utils/renderFunction'
import AddRmSelection from 'utils/AddRmSelection'
import * as Three from 'three'
class SelectionData2D {
  constructor(renderCt, drawedBox, selectMeshG, control, octreeData, elements, nodes, nodes2D, camera, elemTypeArray, axisVectorOf2D) {

    // 如果用户框选创建的框，并添加格式
    this.element = document.createElement('div');
    this.element.style.pointerEvents = 'none';
    this.element.style.border = "1px solid #55aaff";
    this.element.style.backgroundColor = "rgba(75, 160, 255, 0.3)";
    this.element.style.position = "fixed";
    
    // this.renderCt是模型的渲染区，this.drawedBox是创建的这个box
    this.renderCt = renderCt;
    this.drawedBox = drawedBox;

    // 新选择的单元会放到这个组中
    this.selectMeshG = selectMeshG;

    // 控制器
    this.controls = control;

    // 用户选择的对象类型
    this.octreeData = octreeData;

    // 单元和节点等数据
    this.elements = elements;
    this.nodes = nodes;
    this.nodes2D = nodes2D;
    this.camera = camera;
    this.elemTypeArray = elemTypeArray;

    this.axisVectorOf2D = axisVectorOf2D;
    this.nodesForLineNode = null;

    // 用户选择的单元数据
    this.addRmSelection;

    //选择类型: 1是正单选，2是反单选，3是正框选，4是反框选
    this.selectType;
    this.objectType;         // 1.二维单元选点 2.二维单元选线 3.二维单元选面
    
    // 框选的坐标对象
    this.startPoint = {
      x: 0,
      y: 0
    };
    this.bottomRight = {
      x: 0,
      y: 0
    };
    this.topLeft = {
      x: 0,
      y: 0
    };
    this.topLeftStandard = {
      x: 0,
      y: 0
    };
    this.bottomRightStandard = {
      x: 0,
      y: 0
    };

    // 点选的坐标对象
    this.pickCoordi = {
      x: 0,
      y: 0
    };

    this.pickCoordiStandard = {
      x: 0,
      y: 0
    };

    this.pickedCoordInWeb = new Three.Vector3(0,0,1);

    // 拾取中的一些参量
    this.baseData2D = BaseData2D;
    this.pickedElemArr;
    this.vecArr = [null, null, null];
    this.coorArr3 = new Float64Array(3);
    this.coorArr2 = new Float64Array(2);
    this.childNode;
    this.brotherNode;

    // 事件的函数和标志
    this.isDownAndMove = false;
    this.pointerDown = this.pointerDown.bind(this);
    this.pointerMove = this.pointerMove.bind(this);
    this.pointerUp = this.pointerUp.bind(this);
    this.keyDownCtrl = this.keyDownCtrl.bind(this);
    this.keyUpCtrl = this.keyUpCtrl.bind(this);
    this.pickElements = this.pickElements.bind(this);
    this.render2D = this.render2D.bind(this);
    this.renderLine = this.renderLine.bind(this);
    this.renderNode = this.renderNode.bind(this);
  };

  //**************构造函数外部的函数，都会出现在原型上************************//
  //将世界坐标转换成标准归一化坐标
  transformCoordinate(w, h, dx, dy) {
    this.bottomRightStandard.x = ((this.bottomRight.x - dx)/ w) * 2 - 1;
    this.bottomRightStandard.y = ((this.bottomRight.y - dy) / h) * (-2) + 1;
    this.topLeftStandard.x = ((this.topLeft.x - dx) / w) * 2 - 1;
    this.topLeftStandard.y = ((this.topLeft.y - dy) / h) * (-2) + 1;
  };

  transformCoordinateSingle(w, h, dx, dy) {
    this.pickCoordiStandard.x = ((this.pickCoordi.x - dx)/w) * 2 - 1;
    this.pickCoordiStandard.y = ((this.pickCoordi.y - dy)/h) * (-2) + 1;
    this.pickedCoordInWeb.x = this.pickCoordiStandard.x;
    this.pickedCoordInWeb.y = this.pickCoordiStandard.y;
  };

  //鼠标按下事件
  pointerDown(event) {
    console.time('基坐标选择');
    // console.time("按下鼠标事件的时间");
    this.isDownAndMove = false;

    //3.设定起始点
    this.startPoint.x = event.clientX;
    this.startPoint.y = event.clientY;

    //4. 设置单选的位置
    this.pickCoordi.x = event.clientX;
    this.pickCoordi.y = event.clientY;
    this.renderCt.addEventListener('pointermove', this.pointerMove);
    this.renderCt.addEventListener('pointerup', this.pointerUp);
    this.renderCt.removeEventListener('pointerdown', this.pointerDown);

    // console.timeEnd("按下鼠标事件的时间");
  };
  //鼠标移动事件
  pointerMove(event) {

    this.isDownAndMove = true;
    //1.实时得到拾取框的左上右下点
    this.bottomRight.x = Math.max(event.clientX, this.startPoint.x);
    this.bottomRight.y = Math.max(event.clientY, this.startPoint.y);
    this.topLeft.x = Math.min(event.clientX, this.startPoint.x);
    this.topLeft.y = Math.min(event.clientY, this.startPoint.y);

    //2.更新div定位和宽高为0
    this.element.style.left = this.topLeft.x + 'px';
    this.element.style.top = this.topLeft.y + 'px';
    this.element.style.width = (this.bottomRight.x -this. topLeft.x) + 'px';
    this.element.style.height = (this.bottomRight.y - this.topLeft.y) + 'px';
    
    this.drawedBox.appendChild(this.element);
       
  };
  //鼠标抬起事件
  pointerUp(event) {
    //1.停止触发事件
    console.time("抬起鼠标事件的时间");
    console.time('基坐标框选');

    //3.如果是右键就是反选，否则是正选 
    switch (event.button) {
      case 0:
        if (this.isDownAndMove) { 
          this.selectType = 3;
          let divChild = this.drawedBox.lastElementChild;
          while(this.drawedBox.lastElementChild) {
            this.drawedBox.removeChild(divChild);
            divChild = this.drawedBox.lastElementChild;
          }
        } else {
          this.selectType = 1;
        } 
        break;

      case 2:
        if (this.isDownAndMove) {  
          this.selectType = 4;
          let divChild = this.drawedBox.lastElementChild;
          while(this.drawedBox.lastElementChild) {
            this.drawedBox.removeChild(divChild);
            divChild = this.drawedBox.lastElementChild;
          }
        } else {
          this.selectType = 2;
        } 
        break;
    
      default:
        this.selectType = 0;
        break;
    }
    
    this.renderCt.removeEventListener('pointermove', this.pointerMove);
    this.renderCt.removeEventListener('pointerup', this.pointerUp);
    this.renderCt.addEventListener('pointerdown', this.pointerDown);
    console.timeEnd("抬起鼠标事件的时间"); 
    this.pickElements(event);    
  };

  // 键盘按下ctrl键
  keyDownCtrl(event) {
    if (event.key === "Control") { 

      // 禁用控制器 、删除按下事件，防止不停的触发事件
      this.controls.enabled = false;
      document.removeEventListener('keydown', this.keyDownCtrl, false);
      this.addRmSelection.cameraMatrix2 = this.camera.position.toArray().toString().concat(this.camera.zoom);
      
      // 初始化基坐标相关信息
      if (this.addRmSelection.cameraMatrix1 === null || this.addRmSelection.cameraMatrix1 !== this.addRmSelection.cameraMatrix2) {

        // 确定baseData2D中的参数
        this.initBaseData2D(this.baseData2D);
      }
      
      // 监听鼠标的动作来进行拾取 
      this.renderCt.addEventListener('pointerdown', this.pointerDown);
    }
  };

  // 抬起ctrl的事件
  keyUpCtrl(event){
    if (event.key === "Control") {

      // 监听ctrl按下的事件
      document.addEventListener('keydown', this.keyDownCtrl, false);
      this.renderCt.removeEventListener('pointerdown', this.pointerDown);
      if(!this.controls.enabled){
        this.controls.enabled = true;
      }
      if (!this.addRmSelection) {
        if (!this.addRmSelection.cameraMatrix2) {
          this.addRmSelection.cameraMatrix1 = this.addRmSelection.cameraMatrix2;     
        }
      }
    }
  };

  // 基坐标选取单元
  pickElements(e) { 
    if (e.button === 1) {

      // 中止选择
      // 1.首先将数据保存起来(未完成)
      // 2.让用户进行命名(未完成)
      while (this.selectMeshG.children.length) {
        this.selectMeshG.remove(this.selectMeshG.children[0]);
      }

      // 将用户选择的事件置为空
      this.addRmSelection = null;
      this.controls.enabled = true;
    
    } else {
      this.pickedElemArr = [];
      let nodesCoordi = {};

      let continueFlag;

      let renderObjectFunc;                                    // 渲染的对象
      let minLen = null, selectedLID, selectNodeGID;           //最小的长度和索引

      switch (this.selectType) {
          
        // 当前是点选
        case 1:
        case 2:
          console.log("当前进入了点选面");
          // 计算点击位置归一化坐标
          this.transformCoordinateSingle(this.renderCt.clientWidth, this.renderCt.clientHeight, sideBarWidth, navBarHeight);

          // 根据归一化坐标求出点击位置的局部坐标系下的坐标
          this.baseData2D.PPCoordInLocal.x = this.baseData2D.slope*(this.pickedCoordInWeb.x - this.baseData2D.APointCoordInWeb[0])+this.nodes2D[0];
          this.baseData2D.PPCoordInLocal.y = this.baseData2D.slope*(this.pickedCoordInWeb.y - this.baseData2D.APointCoordInWeb[1])+this.nodes2D[1];

          // 判断拾取对象
          this.pickedJudgeTree2D(this.octreeData, this.childNode, this.brotherNode);

          // 判断是否确实选中
          for (let i = 0; i < this.pickedElemArr.length; i++) {
            const selectedElemGID = this.pickedElemArr[i];
            const array = this.elements[selectedElemGID];

            // 整合节点坐标
            for (let j = 0; j < array.length; j++) {
              
              const nodeGID = array[j];
              if (!nodesCoordi[nodeGID]) {
                nodesCoordi[nodeGID] = {x:this.nodes2D[nodeGID*2],y:this.nodes2D[nodeGID*2+1], z:0};
              }
            }

            continueFlag = this.boolInPlane([0, 1, 2, 3], array, nodesCoordi, this.baseData2D.PPCoordInLocal);
            if (continueFlag !== false) {
              switch (this.objectType) {
                case 3:
                  // 选择或移除2D单元
                  if(this.selectType === 1){
                    this.addRmSelection.addChooseId([selectedElemGID]);
                  } else {
                    this.addRmSelection.removeChooseId([selectedElemGID]);
                  }
                  renderObjectFunc = this.render2D;
                  break;
        
                case 2:

                  // 首先将坐标的数组整理好
                  if(this.nodesForLineNode === null) {
                    const nodesNum = Math.round(this.nodes.length/3);
                    const normVec = this.axisVectorOf2D[2];
                    this.nodesForLineNode = new Float64Array(nodesNum*3);
                    for (let j = 0; j < nodesNum; j++) {
                      this.nodesForLineNode[j*3] = this.nodes[j*3] + normVec.x*0.5;
                      this.nodesForLineNode[j*3+1] = this.nodes[j*3+1] + normVec.y*0.5;
                      this.nodesForLineNode[j*3+2] = this.nodes[j*3+2] + normVec.z*0.5;
                    }
                  }

                  // 首先找出距离最近的那条线
                  let vec1, vec2;
                  for (let j = 0; j < array.length; j++) {
                    const node1GID = array[j];
                    let node2GID;
                    if (j+1 === array.length) {
                      node2GID = array[0]
                    }else{
                      node2GID = array[j+1];
                    }

                    vec1 = [this.nodes2D[node2GID*2] - this.nodes2D[node1GID*2], this.nodes2D[node2GID*2+1] - this.nodes2D[node1GID*2+1]];
                    vec2 = [this.baseData2D.PPCoordInLocal.x - this.nodes2D[node1GID*2], this.baseData2D.PPCoordInLocal.y - this.nodes2D[node1GID*2+1]];
                    const currentLen = Math.abs(vec1[0]*vec2[1] - vec1[1]*vec2[0])/Math.sqrt(Math.pow(vec1[0], 2) + Math.pow(vec1[1], 2));
                    switch (minLen === null) {
                      case true:
                        minLen = currentLen;
                        selectedLID = j;
                        break;
                    
                      case false:
                        if (currentLen <= minLen) {
                          minLen = currentLen;
                          if (j === -1) {
                            selectedLID = array.length - 1;
                          } else {
                            selectedLID = j;
                          }
                        }
                        break;
                      default:
                        break;
                    }
                  }

                  if(this.selectType === 1){
                    this.addRmSelection.addChooseId([selectedElemGID*4+selectedLID]);
                  } else {
                    this.addRmSelection.removeChooseId([selectedElemGID*4+selectedLID]);
                  }
                  renderObjectFunc = this.renderLine;
                    
                  break;
        
                case 1:
                  // 选择点

                  // 首先将坐标的数组整理好
                  if(this.nodesForLineNode === null) {
                    const nodesNum = Math.round(this.nodes.length/3);
                    const normVec = this.axisVectorOf2D[2];
                    this.nodesForLineNode = new Float64Array(nodesNum*3);
                    for (let j = 0; j < nodesNum; j++) {
                      this.nodesForLineNode[j*3] = this.nodes[j*3] + normVec.x*0.5;
                      this.nodesForLineNode[j*3+1] = this.nodes[j*3+1] + normVec.y*0.5;
                      this.nodesForLineNode[j*3+2] = this.nodes[j*3+2] + normVec.z*0.5;
                    }
                  }
                  for (let j = 0; j < array.length; j++) {
                    const nodeGID = array[j];
                    
                    let vec1 = [this.baseData2D.PPCoordInLocal.x - this.nodes2D[nodeGID*2], this.baseData2D.PPCoordInLocal.y - this.nodes2D[nodeGID*2+1]];
                    const currentLen = Math.sqrt(Math.pow(vec1[0], 2) + Math.pow(vec1[1], 2));
                    switch (minLen === null) {
                      case true:
                        minLen = currentLen;
                        selectNodeGID = nodeGID;
                        break;
                    
                      case false:
                        if (currentLen <= minLen) {
                          minLen = currentLen;
                          selectNodeGID = nodeGID;
                        }
                        break;
                      default:
                        break;
                    }
                  }
                  
                  if(this.selectType === 1){
                    this.addRmSelection.addChooseId([selectNodeGID]);
                  } else {
                    this.addRmSelection.removeChooseId([selectNodeGID]);
                  }
                  renderObjectFunc = this.renderNode;
                  break;
              
                default:
                  break;
              }
              
              break;
            }
          }
          break;

        // 当前是框选
        case 3:
        case 4:  
        
          // this.transformCoordinate(this.renderCt.clientWidth, this.renderCt.clientHeight, sideBarWidth, navBarHeight);

          // // 框的信息
          // this.baseData.frameData = new Float64Array(6);
          // this.baseData.frameData[0] = (this.bottomRightStandard.x + this.topLeftStandard.x)/2;
          // this.baseData.frameData[1] = (this.topLeftStandard.y + this.bottomRightStandard.y)/2;
          // this.baseData.frameData[2] = (this.bottomRightStandard.x - this.topLeftStandard.x)/2;
          // this.baseData.frameData[3] = (this.topLeftStandard.y - this.bottomRightStandard.y)/2;
          // const frameCenterInImt = new Three.Vector3(this.baseData.frameData[0], this.baseData.frameData[1], 1);
          // frameCenterInImt.applyMatrix3(this.baseData.matrWebToImit);
          // this.baseData.frameData[4] = frameCenterInImt.x;
          // this.baseData.frameData[5] = frameCenterInImt.y;

          // // 判断包围盒有未被选中
          // this.baseData.boxData = new Float64Array(6);
          // this.framePick(framePickOctree, this.coorArr3, this.coorArr2, this.childNode, this.brotherNode);
          
          console.timeEnd('基坐标框选');
          break;

        default:
          break;
      }
      
      this.renderSelect(renderObjectFunc);
      console.log("this.selectMeshG", this.selectMeshG);
    }
  };
  
  pickedJudgeTree2D(currentNode, childNode, brotherNode) {
    if (this.baseData2D.PPCoordInLocal.x <= currentNode.geoRange[1] &&
      this.baseData2D.PPCoordInLocal.x >= currentNode.geoRange[0] &&
      this.baseData2D.PPCoordInLocal.y <= currentNode.geoRange[3] &&
      this.baseData2D.PPCoordInLocal.y >= currentNode.geoRange[2] ) {
      
        // 当前节点被选中
        if (currentNode.elemGIDArray.length === 1) {
          
          // 当前仅一个单元
          this.pickedElemArr.push(currentNode.elemGIDArray[0]);
        }else{

          // 不仅含有一个单元
          childNode = currentNode.child;
          this.pickedJudgeTree2D(childNode, childNode, brotherNode);
        }
    }
    
    // 判断兄弟节点是否存在
    if (currentNode.brother) {
      brotherNode = currentNode.brother;
      this.pickedJudgeTree2D(brotherNode, childNode, brotherNode);
    };
  }

  // 渲染主级几何，即二维面单元
  render2D(color) {

    this.addRmSelection.chooseGId = [...this.addRmSelection.choosedObject.keys()];

    let elementType;
    const indices = [];

    if (this.addRmSelection.chooseGId !== []) {
      this.addRmSelection.chooseGId.forEach(e => {
        const array = this.elements[e];
        elementType = this.elemTypeArray[e];

        switch (elementType) {
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
        
      })
    } 
    let elementGeo = new Three.BufferGeometry();

    elementGeo.setIndex(indices);
    elementGeo.setAttribute('position', new Three.Float32BufferAttribute(this.nodes, 3));
    const Material = new Three.MeshBasicMaterial({
        color: color,
        side: Three.DoubleSide
      });
    return new Three.Mesh(elementGeo, Material);
  };
     
  // 渲染次级几何
  renderLine(color) {
    this.addRmSelection.chooseSubID = [...this.addRmSelection.choosedObject.keys()];

    const indices = [];
    let indexArr, drawIndexes;
    let elementType;

    if (this.addRmSelection.chooseSubID !== []) {
      this.addRmSelection.chooseSubID.forEach(e => {
        const GID = Math.floor(e/4);
        const LID = e%4;
        const array = this.elements[GID];
        elementType = this.elemTypeArray[GID];
        switch (elementType) {
          case 18:
            drawIndexes = [QuadLineIndex[LID*2], QuadLineIndex[LID*2+1]];
            break;

          case 1:
            drawIndexes = [TriaLineIndex[LID*2], TriaLineIndex[LID*2+1]];
            break;
        
          default:
            break;
        }
        
        indexArr = drawIndexes.map(elem => array[elem]);
        indices.push(...indexArr);
      })
    }
      
    let elementGeo = new Three.BufferGeometry();
    elementGeo.setIndex(indices);
    elementGeo.setAttribute('position', new Three.Float32BufferAttribute(this.nodesForLineNode, 3));
    const Material = new Three.LineBasicMaterial({
        color: color,
        linewidth: 5,
      });
    return new Three.LineSegments(elementGeo, Material);
  };

  renderNode(color){

    const vertexShaderSource =
      'uniform float size;\n' +
      'void main() {\n' +
      '  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n'+
      '  gl_Position = projectionMatrix * mvPosition;\n'+
      '  gl_PointSize = size;\n'+
      '}\n';

    const fragmentShaderSource =
      'uniform vec3 color;\n' +
      'uniform sampler2D pointTexture;\n' +
      'void main() {\n' +
      '  gl_FragColor = vec4( color, 1.0 );\n'+
      '  gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );\n' +
      '  if ( gl_FragColor.a < ALPHATEST ) discard;\n' +
      '}\n';
    const nodeGeo = new Three.BufferGeometry();
    this.addRmSelection.chooseGId = [...this.addRmSelection.choosedObject.keys()];
    const chosedNodes = [];
    for (let i = 0; i < this.addRmSelection.chooseGId.length; i++) {
      const currentNode = this.addRmSelection.chooseGId[i];
      chosedNodes.push(this.nodesForLineNode[currentNode*3], this.nodesForLineNode[currentNode*3+1], this.nodesForLineNode[currentNode*3+2]);
    }
		nodeGeo.setAttribute('position', new Three.Float32BufferAttribute(chosedNodes, 3));

    const nodesMaterial = new Three.ShaderMaterial({
      uniforms: {
        color: { value: new Three.Color(color) },
        pointTexture: { value: new Three.TextureLoader().load(require('/src/utils/textures/disc.png')) },
        size : {value : 30}
      },
      vertexShader: vertexShaderSource,
			fragmentShader: fragmentShaderSource,
      alphaTest: 0.9
    });
    // const nodesMaterial = new Three.PointsMaterial({
    //   color: color,
    //   size : 20,
    // });
    const nodeMesh = new Three.Points(nodeGeo, nodesMaterial);
    console.log(nodeMesh);
    return nodeMesh;
  }
  //渲染拾取的物体
  renderSelect(renderfunc) {
    // 有新框选的
    if (this.addRmSelection.thereAreNew) {

      // 删除之前绘制的对象 
      while (this.selectMeshG.children.length) {
        this.selectMeshG.remove(this.selectMeshG.children[0]);
      }
      const mesh = renderfunc(modelHighlightColor);
      this.selectMeshG.add(mesh);
    } 
    this.addRmSelection.thereAreNew = false;
  };
  // 判断点是否在平面内
  // arr1是组成这个面的节点局部索引，按照逆时针顺序旋转，arr2是组成这个单元的的节点的全局索引；
  // obj是这个单元节点的坐标对象，键是节点全局索引，值是这个点的投影坐标
  // coordi是鼠标点击位置的坐标
  boolInPlane(arr1, arr2, obj, coordi) {
    let node1, node2, node3, node4;
    // console.log('arr1', arr1);
    for (let i = 0; i < arr1.length-1; i++) {
      const i1 = i;
      const i2 = i+1;
      let i3;
      if (i+2 === arr1.length) {
        i3 = 0;
      } else {
        i3 = i+2
      }
      node1 = arr2[arr1[i1]];
      node2 = arr2[arr1[i2]];
      node3 = arr2[arr1[i3]];
      // console.log('node1','node2','node3', node1, node2, node3);
      if (!boolBetweenAngle(obj[node1], obj[node2], obj[node3], coordi)) {
        // console.log('三个点不在一个面上');
        return false
      }
    }
    if (arr1.length === 3) {          
      return (obj[node1].z+obj[node2].z+obj[node3].z)/3;
    } else {
      node1 = arr2[arr1[0]];
      node2 = arr2[arr1[1]];
      node3 = arr2[arr1[2]];
      node4 = arr2[arr1[3]];
      return (obj[node1].z+obj[node2].z+obj[node3].z+obj[node4].z)/4;
    }
  };
  
  // 初始化拾取
  initSelect(index1) {
    
    this.addRmSelection = new AddRmSelection();
    try {
      switch (index1) {
        case 3:
           
          // 选择2D单元的主级面单元
          this.objectType = 3;
          break;
  
        case 2:
          
          // 选择2D单元的次级线单元
          this.objectType = 2;
          break;
  
        case 1:  
                      
          // 选择节点
          this.objectType = 1;
          break;
      
        default:
          break;
      }
      this.addRmSelection.chosedNum = 0;
  
      document.addEventListener('keydown', this.keyDownCtrl, false);
      document.addEventListener('keyup', this.keyUpCtrl, false);

    } catch (error) {
      this.$baseMessage('初始化过程出错','warning',5000);
    }

  };

  initBaseData2D (baseData2D) {
    const APointCoordInWeb = computeProjectVertex([this.nodes[0], this.nodes[1], this.nodes[2]], this.camera);
    const BPointCoordInWeb = computeProjectVertex([this.nodes[3], this.nodes[4], this.nodes[5]], this.camera);

    baseData2D.APointCoordInWeb = [APointCoordInWeb.x, APointCoordInWeb.y];
    baseData2D.BPointCoordInWeb = [BPointCoordInWeb.x, BPointCoordInWeb.y];
    if(Math.abs(BPointCoordInWeb.x - APointCoordInWeb.x) >= Math.abs(BPointCoordInWeb.y - APointCoordInWeb.y)){
      baseData2D.slope = (this.nodes2D[2] - this.nodes2D[0])/(BPointCoordInWeb.x - APointCoordInWeb.x);
    }else {
      baseData2D.slope = (this.nodes2D[3] - this.nodes2D[1])/(BPointCoordInWeb.y - APointCoordInWeb.y);
    }
  }

}

// BaseData是基坐标及相关运算的一个类型
let BaseData2D = {
  slope : null,                                //局部坐标系和WebGL坐标系之间的比例
  APointCoordInWeb : [null, null],             // WebGL笛卡尔坐标系下A点的坐标值
  BPointCoordInWeb : [null, null],             // WebGL笛卡尔坐标系下B点的坐标值
  PPCoordInLocal : {x: null, y:null},           // 鼠标点击位置的局部坐标系下的坐标
}

export default SelectionData2D;
