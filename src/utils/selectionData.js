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
class SelectionData {
  constructor(renderCt, drawedBox, selectMeshG, control, octreeData, octreeSurfData, elements, nodes, camera, surfaceInfo, elemTypeArray) {

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
    this.octreeSurfData = octreeSurfData;

    // // 单元和节点等数据
    this.elements = elements;
    this.nodes = nodes;
    this.camera = camera;
    this.surfaceInfo = surfaceInfo;
    this.elemTypeArray = elemTypeArray;

    // 用户选择的单元数据
    this.addRmSelection;

    //选择类型: 1是正单选，2是反单选，3是正框选，4是反框选
    this.selectType;
    this.objectType;         // 1.选点 2.选面 3.选体
    
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
    this.baseData = BaseData;    
    this.boxConnect = [[0,2,4],[1,2,4],[1,3,4],[0,3,4],[0,2,5],[1,2,5],[1,3,5],[0,3,5]];
    this.boxHalfLen = new Float64Array(3);
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
    this.pickElements3D = this.pickElements3D.bind(this);
    this.renderGeo = this.renderGeo.bind(this);
    this.renderSubGeo = this.renderSubGeo.bind(this);
    this.renderNode = this.renderNode.bind(this);
    this.pickOne3D = this.pickOne3D.bind(this);
    this.pickOne3D2D = this.pickOne3D2D.bind(this);
    this.pickOneNode3D = this.pickOneNode3D.bind(this);
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
    this.pickElements3D(event);    
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

        // 对于3D单元
        this.initBaseData(this.baseData, this.vecArr);
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
      if (!this.addRmSelection.cameraMatrix2) {
        this.addRmSelection.cameraMatrix1 = this.addRmSelection.cameraMatrix2;     
      }
    }
  };

  // 基坐标选取单元
  pickElements3D(e) { 
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

      // 定义选次级单元和主级单元的不同的变量
      let singlePickFunc;                       // 点选拾取的函数
      let renderObjectFunc;                     // 渲染的对象
      let framePickOctree;                      // 框选的对象
      switch (this.objectType) {
        case 3:
          singlePickFunc = this.pickOne3D;
          renderObjectFunc = this.renderGeo;
          framePickOctree = this.octreeData;
          break;

        case 2:
          singlePickFunc = this.pickOne3D2D;
          renderObjectFunc = this.renderSubGeo;
          framePickOctree = this.octreeSurfData;
          break;

        case 1:
          singlePickFunc = this.pickOneNode3D;
          renderObjectFunc = this.renderNode;
          framePickOctree = this.octreeData;
          break;
      
        default:
          break;
      }
              
      // 首先确认e1，e2，e3
      switch (this.selectType) {
          
        // 当前是点选
        case 1:
        case 2:
          // 计算点击位置归一化坐标
          this.transformCoordinateSingle(this.renderCt.clientWidth, this.renderCt.clientHeight, sideBarWidth, navBarHeight);

          // 判断点击位置坐标
          this.baseData.PPInImit = this.pickedCoordInWeb.applyMatrix3(this.baseData.matrWebToImit);

          // 判断是否需要排除两个三角
          switch (this.baseData.excluFlag) {
            case true:

              this.pickedJudgeSurfTree1(this.octreeSurfData, this.coorArr3, this.coorArr2, this.childNode, this.brotherNode);
              break;

            case false:

              this.pickedJudgeSurfTree2(this.octreeSurfData, this.coorArr3, this.coorArr2, this.childNode, this.brotherNode);
              break;
          
            default:
              break;
          }

          // 判断拾取对象
          singlePickFunc(nodesCoordi);
          console.timeEnd('基坐标选择');
          break;

        // 当前是框选
        case 3:
        case 4:  
        
          this.transformCoordinate(this.renderCt.clientWidth, this.renderCt.clientHeight, sideBarWidth, navBarHeight);

          // 框的信息
          this.baseData.frameData = new Float64Array(6);
          this.baseData.frameData[0] = (this.bottomRightStandard.x + this.topLeftStandard.x)/2;
          this.baseData.frameData[1] = (this.topLeftStandard.y + this.bottomRightStandard.y)/2;
          this.baseData.frameData[2] = (this.bottomRightStandard.x - this.topLeftStandard.x)/2;
          this.baseData.frameData[3] = (this.topLeftStandard.y - this.bottomRightStandard.y)/2;
          const frameCenterInImt = new Three.Vector3(this.baseData.frameData[0], this.baseData.frameData[1], 1);
          frameCenterInImt.applyMatrix3(this.baseData.matrWebToImit);
          this.baseData.frameData[4] = frameCenterInImt.x;
          this.baseData.frameData[5] = frameCenterInImt.y;

          // 判断包围盒有未被选中
          this.baseData.boxData = new Float64Array(6);
          this.framePick(framePickOctree, this.coorArr3, this.coorArr2, this.childNode, this.brotherNode);
          
          console.timeEnd('基坐标框选');
          break;

        default:
          break;
      }
      
      this.renderSelect(renderObjectFunc);
    }
  };
  
  // 初始化基坐标信息
  initBaseData(baseData, vecArr){

    // 计算出(0,0,0)、(1,0,0)、(0,1,0)、(0,0,1)，三个点在WebGL上的坐标
    const eArray = [[0,0,0],[1,0,0],[0,1,0],[0,0,1]];
    const fourPInWeb = [null, null, null, null];
    for (let i = 0; i < 4; i++) {
      const curtProjectVec = computeProjectVertex(eArray[i], this.camera);
      fourPInWeb[i] = new Three.Vector2(curtProjectVec.x, curtProjectVec.y);
    }

    // 计算出三个投影向量的长度和三个投影向量
    const eLengthArr = [null, null, null];
    for (let i = 1; i < 4; i++) {
      const currentVec = new Three.Vector2();
      currentVec.subVectors(fourPInWeb[i], fourPInWeb[0]);
      vecArr[i-1] = currentVec;
      eLengthArr[i-1] = currentVec.length();
    }

    // 排序三个向量
    baseData.baseInd = [0, 1, 2];
    let tempVari;
    let largestIndex = 0;
    if (eLengthArr[1] > eLengthArr[0]) {
      largestIndex = 1;
    }
    if (eLengthArr[2] > eLengthArr[largestIndex]) {
      largestIndex = 2;
    }
    if (largestIndex !== 0) {
      arrayRange(eLengthArr, baseData.baseInd, 0, largestIndex, tempVari);
      arrayRange(vecArr, null, 0, largestIndex, tempVari);
    }
    if (eLengthArr[2] > eLengthArr[1]) {
      arrayRange(eLengthArr, baseData.baseInd, 2, 1, tempVari);
      arrayRange(vecArr, null, 2, 1, tempVari);
    }

    // 确定a和b，分母为(e1).y*(e2).x-(e1).x*(e2).y
    const denomiFAB = vecArr[0].x*vecArr[1].y - vecArr[1].x*vecArr[0].y;
    baseData.coefA = (vecArr[2].x*vecArr[1].y - vecArr[1].x*vecArr[2].y)/denomiFAB;
    baseData.coefB = (vecArr[0].x*vecArr[2].y - vecArr[2].x*vecArr[0].y)/denomiFAB;
    if (Math.abs(baseData.coefA) > 1e-3) {

      // 需要排除两个三角形
      baseData.excluFlag = true;
      baseData.e3Slope = baseData.coefB/baseData.coefA;

      switch (baseData.baseInd[2]) {

        // 如果是ex作为e3
        case 0:
          if (baseData.e3Slope > 0) {

            // 两条线分别经过D点和E点，索引分别是3和4
            baseData.interceptIndex[0] = 3;
            baseData.interceptIndex[1] = 4;
          } else {

            // 两条线分别经过A点和H点，索引分别是0和7
            baseData.interceptIndex[0] = 0;
            baseData.interceptIndex[1] = 7;
          }
          break;

        // 如果是ey作为e3
        case 1:
          if (baseData.e3Slope > 0) {

            // 两条线分别经过B点和E点，索引分别是1和4
            baseData.interceptIndex[0] = 1;
            baseData.interceptIndex[1] = 4;
          } else {

            // 两条线分别经过A点和F点，索引分别是0和5
            baseData.interceptIndex[0] = 0;
            baseData.interceptIndex[1] = 5;
          }
          break;
      
        // 如果是ez作为e3
        case 2:
          if (baseData.e3Slope > 0) {

            // 两条线分别经过B点和D点，索引分别是1和3
            baseData.interceptIndex[0] = 1;
            baseData.interceptIndex[1] = 3;
          } else {

            // 两条线分别经过A点和C点，索引分别是0和2
            baseData.interceptIndex[0] = 0;
            baseData.interceptIndex[1] = 2;
          }
          break;
      }
    }else{

      // 不需要排除两个三角
      baseData.excluFlag = false;
    }

    // 点击位置在仿射坐标系下的坐标
    const m13 = fourPInWeb[0].x;
    const m23 = fourPInWeb[0].y;
    const m11 = fourPInWeb[baseData.baseInd[0]+1].x - m13;
    const m21 = fourPInWeb[baseData.baseInd[0]+1].y - m23;
    const m12 = fourPInWeb[baseData.baseInd[1]+1].x - m13;
    const m22 = fourPInWeb[baseData.baseInd[1]+1].y - m23;
    baseData.matrWebToImit.set(m11, m12, m13, m21, m22, m23, 0, 0, 1);
    baseData.matrWebToImit.invert();
    baseData.matrImitToWeb.set(m11, m12, m13, m21, m22, m23, 0, 0, 1);
  };

  // 包围盒的信息
  boxDataInImit(currentNode, coordi3, coordi2) {
    
    // 计算包围盒中心的世界坐标和半长
    for (let i = 0; i < 3; i++) {
      coordi3[i] = (currentNode.geoRange[i*2] + currentNode.geoRange[i*2+1])/2;
      this.boxHalfLen[i] = (currentNode.geoRange[i*2+1] - currentNode.geoRange[i*2])/2;       
    }

    // 计算包围盒仿射坐标系下的投影和仿射顺序下的包围盒半长
    coordi2[0] = coordi3[this.baseData.baseInd[0]] + this.baseData.coefA*coordi3[this.baseData.baseInd[2]];
    coordi2[1] = coordi3[this.baseData.baseInd[1]] + this.baseData.coefB*coordi3[this.baseData.baseInd[2]];
    const halfLen = [null, null, null];
    halfLen[0] = this.boxHalfLen[this.baseData.baseInd[0]];
    halfLen[1] = this.boxHalfLen[this.baseData.baseInd[1]];
    halfLen[2] = this.boxHalfLen[this.baseData.baseInd[2]];

    // 计算包围盒范围
    this.baseData.boxScope[0] = coordi2[0] - halfLen[0] - Math.abs(this.baseData.coefA)*halfLen[2];
    this.baseData.boxScope[1] = coordi2[0] + halfLen[0] + Math.abs(this.baseData.coefA)*halfLen[2];
    this.baseData.boxScope[2] = coordi2[1] - halfLen[1] - Math.abs(this.baseData.coefB)*halfLen[2];
    this.baseData.boxScope[3] = coordi2[1] + halfLen[1] + Math.abs(this.baseData.coefB)*halfLen[2];

  };

  // 计算截距的最大最小值
  paraLinesJudge(currentNode, coordi3, coordi2, pIndex1, pIndex2){

    // 计算第一个点的截距
    for (let i = 0; i < 3; i++) {
      coordi3[i] = currentNode.geoRange[this.boxConnect[pIndex1][i]];                  
    }
    coordi2[0] = coordi3[this.baseData.baseInd[0]] + this.baseData.coefA*coordi3[this.baseData.baseInd[2]];
    coordi2[1] = coordi3[this.baseData.baseInd[1]] + this.baseData.coefB*coordi3[this.baseData.baseInd[2]];
    this.baseData.intercept[0] = coordi2[1] - this.baseData.e3Slope*coordi2[0];

    // 计算第二个点的截距
    for (let i = 0; i < 3; i++) {
      coordi3[i] = currentNode.geoRange[this.boxConnect[pIndex2][i]];                  
    }
    coordi2[0] = coordi3[this.baseData.baseInd[0]] + this.baseData.coefA*coordi3[this.baseData.baseInd[2]];
    coordi2[1] = coordi3[this.baseData.baseInd[1]] + this.baseData.coefB*coordi3[this.baseData.baseInd[2]];
    this.baseData.intercept[1] = coordi2[1] - this.baseData.e3Slope*coordi2[0];
    
    // 确定是否为最大值和最小值
    if (this.baseData.intercept[1] < this.baseData.intercept[0]) {
      const tempVar = this.baseData.intercept[1];
      this.baseData.intercept[1] = this.baseData.intercept[0];
      this.baseData.intercept[0] = tempVar;
    }

    // (b/a)*x-y
    if (this.baseData.e3Slope*this.baseData.PPInImit.x - this.baseData.PPInImit.y + this.baseData.intercept[1] > 0 &&
      this.baseData.e3Slope*this.baseData.PPInImit.x - this.baseData.PPInImit.y + this.baseData.intercept[0] < 0) {
      this.baseData.inParaLines = true;
    }else{
      this.baseData.inParaLines = false;
    }
  };

  // 需要排除三角形的判断函数
  pickedJudge1(currentNode, coorArr3, coorArr2, childNode, brotherNode) {

    // 包围盒信息
    this.boxDataInImit(currentNode, coorArr3, coorArr2);

    // 判断是否位于包围盒内部
    if (this.baseData.PPInImit.x < this.baseData.boxScope[1] &&
      this.baseData.PPInImit.x > this.baseData.boxScope[0] &&
      this.baseData.PPInImit.y < this.baseData.boxScope[3] &&
      this.baseData.PPInImit.y > this.baseData.boxScope[2] ) {
      
      // 在包围盒内部
      this.baseData.inBox = true;
    }else{
      this.baseData.inBox = false;
    }
      
    // 如果在平行四边形之间
    if (this.baseData.inBox) {
      this.paraLinesJudge(currentNode, coorArr3, coorArr2, this.baseData.interceptIndex[0], this.baseData.interceptIndex[1]);
    
      // 如果在两条线之间
      if (this.baseData.inParaLines) {

        // 如果当前的包围盒只有一个单元，就把该单元编号存起来
        if (currentNode.elemGIDArray.length === 1) {

          // 判断是否为外表面单元
          if (this.surfaceInfo.boolSurfElem[currentNode.elemGIDArray[0]] === 1) {
            this.pickedElemArr.push(currentNode.elemGIDArray[0]);
          }
        }else{

          // 查询包围盒的孩子
          childNode = currentNode.child;
          this.pickedJudge1(childNode, coorArr3, coorArr2);
        };
      };
    };

    // 判断兄弟节点是否存在
    if (currentNode.brother) {
      brotherNode = currentNode.brother;
      this.pickedJudge1(brotherNode, coorArr3, coorArr2);
    };
  };

  // 不需要排除三角形的判断函数
  pickedJudge2(currentNode, coorArr3, coorArr2, childNode, brotherNode) {

    // 首先判断是否选中包围盒
    this.boxDataInImit(currentNode, coorArr3, coorArr2);
     
    // 判断是否位于包围盒内部
    if (this.baseData.PPInImit.x < this.baseData.boxScope[1] &&
      this.baseData.PPInImit.x > this.baseData.boxScope[0] &&
      this.baseData.PPInImit.y < this.baseData.boxScope[3] &&
      this.baseData.PPInImit.y > this.baseData.boxScope[2] ) {
      
      // 在包围盒内部
      this.baseData.inBox = true;
    }else{
      this.baseData.inBox = false;
    }
      
    // 如果在平行四边形内
    if (this.baseData.inBox) {
      
      // 如果当前的包围盒只有一个单元，就把该单元编号存起来
      if (currentNode.elemGIDArray.length === 1) {

        // 判断是否为外表面单元
        if (this.surfaceInfo.boolSurfElem[currentNode.elemGIDArray[0]] === 1) {
          this.pickedElemArr.push(currentNode.elemGIDArray[0]);
        }
      }else{

        // 查询包围盒的孩子
        childNode = currentNode.child;
        this.pickedJudge2(childNode, coorArr3, coorArr2);
      };
    };

    // 判断兄弟节点是否存在
    if (currentNode.brother) {
      brotherNode = currentNode.brother;
      this.pickedJudge2(brotherNode, coorArr3, coorArr2);
    };
  };

  pickedJudgeSurfTree1(currentNode, coorArr3, coorArr2, childNode, brotherNode) {

    // 当前节点包围盒信息
    this.boxDataInImit(currentNode, coorArr3, coorArr2);

    // 判断是否位于包围盒内部
    if (this.baseData.PPInImit.x < this.baseData.boxScope[1] &&
      this.baseData.PPInImit.x > this.baseData.boxScope[0] &&
      this.baseData.PPInImit.y < this.baseData.boxScope[3] &&
      this.baseData.PPInImit.y > this.baseData.boxScope[2] ) {
      // 在包围盒内部
      this.baseData.inBox = true;
    }else{
      this.baseData.inBox = false;
    }
      
    // 如果在平行四边形之间
    if (this.baseData.inBox) {
      this.paraLinesJudge(currentNode, coorArr3, coorArr2, this.baseData.interceptIndex[0], this.baseData.interceptIndex[1]);
    
      // 如果在两条线之间
      if (this.baseData.inParaLines) {

        // 如果当前的包围盒只有一个单元，就把该单元编号存起来
        if (currentNode.elemGIDArray.length === 1) {         
          this.pickedElemArr.push(currentNode.elemGIDArray[0]);
        }else{

          // 查询包围盒的孩子
          childNode = currentNode.child;
          this.pickedJudgeSurfTree1(childNode, coorArr3, coorArr2);
        };
      };
    };

    // 判断兄弟节点是否存在
    if (currentNode.brother) {
      brotherNode = currentNode.brother;
      this.pickedJudgeSurfTree1(brotherNode, coorArr3, coorArr2);
    };
  };

  // 不需要排除三角形的判断函数
  pickedJudgeSurfTree2(currentNode, coorArr3, coorArr2, childNode, brotherNode) {

    // 首先判断是否选中包围盒
    this.boxDataInImit(currentNode, coorArr3, coorArr2);
     
    // 判断是否位于包围盒内部
    if (this.baseData.PPInImit.x < this.baseData.boxScope[1] &&
      this.baseData.PPInImit.x > this.baseData.boxScope[0] &&
      this.baseData.PPInImit.y < this.baseData.boxScope[3] &&
      this.baseData.PPInImit.y > this.baseData.boxScope[2] ) {
      // 在包围盒内部
      this.baseData.inBox = true;
    }else{
      this.baseData.inBox = false;
    }
      
    // 如果在平行四边形内
    if (this.baseData.inBox) {
      
      // 如果当前的包围盒只有一个单元，就把该单元编号存起来
      if (currentNode.elemGIDArray.length === 1) {        
        this.pickedElemArr.push(currentNode.elemGIDArray[0]);
      }else{

        // 查询包围盒的孩子
        childNode = currentNode.child;
        this.pickedJudgeSurfTree2(childNode, coorArr3, coorArr2);
      };
    };

    // 判断兄弟节点是否存在
    if (currentNode.brother) {
      brotherNode = currentNode.brother;
      this.pickedJudgeSurfTree2(brotherNode, coorArr3, coorArr2);
    };
  };

 
  // 框选判断
  framePick(currentNode, coorArr3, coorArr2, childNode, brotherNode){
    
    // 包围盒的信息
    this.boxDataInImit(currentNode, coorArr3, coorArr2);
    
    // 如果包围盒中不仅仅有一个单元
    if (currentNode.elemGIDArray.length > 1) {
      this.baseData.boxData[0] = (this.baseData.boxScope[0] + this.baseData.boxScope[1])/2;
      this.baseData.boxData[1] = (this.baseData.boxScope[2] + this.baseData.boxScope[3])/2;
      this.baseData.boxData[2] = (this.baseData.boxScope[1] - this.baseData.boxScope[0])/2;
      this.baseData.boxData[3] = (this.baseData.boxScope[3] - this.baseData.boxScope[2])/2;
      const boxCenterInWeb = new Three.Vector3(this.baseData.boxData[0], this.baseData.boxData[1], 1);
      boxCenterInWeb.applyMatrix3(this.baseData.matrImitToWeb);
      this.baseData.boxData[4] = boxCenterInWeb.x;
      this.baseData.boxData[5] = boxCenterInWeb.y;

      // 矩阵的做法
      const matrixWToI2 = new Three.Matrix3();
      matrixWToI2.set(Math.abs(this.baseData.matrWebToImit.elements[0]), Math.abs(this.baseData.matrWebToImit.elements[3]), this.baseData.boxData[2], Math.abs(this.baseData.matrWebToImit.elements[1]), Math.abs(this.baseData.matrWebToImit.elements[4]), this.baseData.boxData[3], 0, 0, 1);
      const halfLenArr1 = new Three.Vector3(this.baseData.frameData[2], this.baseData.frameData[3], 1);
      halfLenArr1.applyMatrix3(matrixWToI2);

      // 判断两个包围盒的相交性
      if (Math.abs(this.baseData.boxData[0] - this.baseData.frameData[4]) < halfLenArr1.x && Math.abs(this.baseData.boxData[1] - this.baseData.frameData[5]) < halfLenArr1.y)
      {
        // 继续在WebGL坐标系上判断其有没有相交
        const matrixIToW2 = new Three.Matrix3();
        matrixIToW2.set(Math.abs(this.baseData.matrImitToWeb.elements[0]), Math.abs(this.baseData.matrImitToWeb.elements[3]), this.baseData.frameData[2], Math.abs(this.baseData.matrImitToWeb.elements[1]), Math.abs(this.baseData.matrImitToWeb.elements[4]), this.baseData.frameData[3], 0, 0, 1);
        const halfLenArr2 = new Three.Vector3(this.baseData.boxData[2], this.baseData.boxData[3], 1);
        halfLenArr2.applyMatrix3(matrixIToW2);

        const OOLength1 = Math.abs(this.baseData.frameData[0] - this.baseData.boxData[4]);
        const OOLength2 = Math.abs(this.baseData.frameData[1] - this.baseData.boxData[5]);
        
        if (OOLength1 < halfLenArr2.x && OOLength2 < halfLenArr2.y) 
        {

          // 不分离
          if (OOLength1 <= (2*this.baseData.frameData[2] - halfLenArr2.x) && OOLength2 <= (2*this.baseData.frameData[3] - halfLenArr2.y))
          {

            // 全包，分点面体三种不同的选则
            this.frameEntireBox(currentNode);
          } else {

            // 半包
            childNode = currentNode.child;
            this.framePick(childNode, coorArr3, coorArr2, childNode, brotherNode);
            
          }
        }
      }
    
    } else {

      // 当前包围盒的元素数量为1，求当前单元的重心在界面上的投影
      this.leafBoxFramed(currentNode);
    }

    // 遍历其兄弟包围盒
    if (currentNode.brother) {
      brotherNode = currentNode.brother;
      this.framePick(brotherNode, coorArr3, coorArr2, childNode, brotherNode);
    }
  }
  
  // 如果框把包围盒整个包围起来
  frameEntireBox(currentNode) {

    switch (this.objectType) {
      case 3:

        // 三维体单元
        switch (this.selectType) {
          case 3:
            this.addRmSelection.addChooseId([...currentNode.elemGIDArray]);
            break;

          case 4:
            this.addRmSelection.removeChooseId([...currentNode.elemGIDArray]);
            break;
        
          default:
            break;
        }
        break;

      case 2:

        // 三维体单元的二维次级单元
        switch (this.selectType) {
          case 3:
            this.addRmSelection.addChooseId([...currentNode.elemGIDArray]);
            break;

          case 4:
            this.addRmSelection.removeChooseId([...currentNode.elemGIDArray]);
            break;
        
          default:
            break;
        }
        break;

      case 1:

        // 三维体单元的点
        switch (this.selectType) {
          case 3:
            for (let i = 0; i < currentNode.elemGIDArray.length; i++) {
              const currentElemGID = currentNode.elemGIDArray[i];
              const currentArr = this.elements[currentElemGID];
              this.addRmSelection.addChooseId(currentArr);
            }
            break;

          case 4:
            for (let i = 0; i < currentNode.elemGIDArray.length; i++) {
              const currentElemGID = currentNode.elemGIDArray[i];
              const currentArr = this.elements[currentElemGID];
              this.addRmSelection.removeChooseId(currentArr);
            }
            break;
        
          default:
            break;
        }
        break;
    
      default:
        break;
    }
  }

  // 如果包围盒中只有一个单元
  leafBoxFramed(currentNode) {

    // 当前包围盒的元素数量为1，求当前单元的重心在界面上的投影
    let elemCenterInWeb = new Three.Vector3(0,0,0);
    let array, GID, LID, nodeIndexArr;
    let addOrRmFunction;

    switch (this.objectType) {
      case 3:

        // 当前选择三维体单元
        array = this.elements[currentNode.elemGIDArray[0]];            
        switch (this.selectType) {
          case 3:
            addOrRmFunction = this.addRmSelection.addChooseId;
            break;

          case 4:
            addOrRmFunction = this.addRmSelection.removeChooseId;
            break;
        
          default:
            break;
        }
        
        break;

      case 2:

        // 当前选择三维单元的二维面单元
        GID = this.surfaceInfo.surfaceArray[currentNode.elemGIDArray[0]][0];
        LID = this.surfaceInfo.surfaceArray[currentNode.elemGIDArray[0]][1];
        const elemType = this.elemTypeArray[GID];
        nodeIndexArr = this.elements[GID];
        switch (elemType) {
          case 7:
            // 六面体
            array = BlockFaceIndex[LID].map(e => nodeIndexArr[e]);

            break;

          case 134:
            // 四面体
            array = TetraFaceIndex[LID].map(e => nodeIndexArr[e]);

            break;
        
          default:
            break;
        }
        switch (this.selectType) {
          case 3:
            addOrRmFunction = this.addRmSelection.addChooseId;
            break;

          case 4:
            addOrRmFunction = this.addRmSelection.removeChooseId;
            break;
        
          default:
            break;
        }
        break;


      case 1:

        // 三维体单元的点
        array = [];

        // 判断点是否在框中
        GID = currentNode.elemGIDArray[0];
        nodeIndexArr = this.elements[GID];
        for (let i = 0; i < nodeIndexArr.length; i++) {
          const userSelectDataID = nodeIndexArr[i];
          const nodeCoordi = [this.nodes[userSelectDataID*3], this.nodes[userSelectDataID*3+1], this.nodes[userSelectDataID*3+2]];
          const nodeCoordInWeb = computeProjectVertex(nodeCoordi, this.camera);
          if (this.baseData.frameData[0] - this.baseData.frameData[2] <= nodeCoordInWeb.x && nodeCoordInWeb.x <= this.baseData.frameData[0] + this.baseData.frameData[2]
            && this.baseData.frameData[1] - this.baseData.frameData[3] <= nodeCoordInWeb.y && nodeCoordInWeb.y <= this.baseData.frameData[1] + this.baseData.frameData[3]) {
              switch (this.selectType) {
                case 3:
                  this.addRmSelection.addChooseId([userSelectDataID]);
                  console.log('现在选点是userSelectDataID', userSelectDataID);
                  break;
      
                case 4:
                  this.addRmSelection.removeChooseId([userSelectDataID]);
                  break;
              
                default:
                  break;
              }
          }
        }
        
        break;
    
      default:
        break;
    }

    if (array !== []) {
      
      for (let i = 0; i < array.length; i++) {
        const nodeIndex = array[i];
        elemCenterInWeb.x = elemCenterInWeb.x + this.nodes[nodeIndex*3];
        elemCenterInWeb.y = elemCenterInWeb.y + this.nodes[nodeIndex*3+1];
        elemCenterInWeb.z = elemCenterInWeb.z + this.nodes[nodeIndex*3+2];
      }
      elemCenterInWeb.x = elemCenterInWeb.x/array.length;
      elemCenterInWeb.y = elemCenterInWeb.y/array.length;
      elemCenterInWeb.z = elemCenterInWeb.z/array.length;
      elemCenterInWeb = computeProjectVertex(elemCenterInWeb, this.camera);

      if (this.baseData.frameData[0] - this.baseData.frameData[2] <= elemCenterInWeb.x && elemCenterInWeb.x <= this.baseData.frameData[0] + this.baseData.frameData[2]
        && this.baseData.frameData[1] - this.baseData.frameData[3] <= elemCenterInWeb.y && elemCenterInWeb.y <= this.baseData.frameData[1] + this.baseData.frameData[3]) 
      {
        addOrRmFunction(currentNode.elemGIDArray);
      }
    }
  }

  // 如果有多个单元，则进一步判断选中的单元
  pickOne3D(nodesCoordi) {

    let pickedZ;
    let pickedGID;
    
    if (this.pickedElemArr.length >= 1) {
      
      let faceIndex, GID, LID, elementType, array, nodeIndexes, nodeIndex, nodeCoordi, arr1, currentCoorZ;

      // 对于每个被选中的外表面单元
      for (let i = 0; i < this.pickedElemArr.length; i++) {

        // 计算一个外表面单元的顶点的坐标
        faceIndex = this.pickedElemArr[i];
        GID = this.surfaceInfo.surfaceArray[faceIndex][0];
        LID = this.surfaceInfo.surfaceArray[faceIndex][1];
        elementType = this.elemTypeArray[GID];
        array = this.elements[GID];
        switch (elementType) {
          case 7:

            // 单元是六面体单元
            arr1 = BlockFaceIndex[LID];
            nodeIndexes = BlockFaceIndex[LID].map(e => array[e]);
            break;

          case 134:

            // 单元是四面体单元
            arr1 = TetraFaceIndex[LID];
            nodeIndexes = TetraFaceIndex[LID].map(e => array[e]);
            break;
        
          default:
            break;
        }
        
        for (let j = 0; j < nodeIndexes.length; j++) {
          nodeIndex = nodeIndexes[j];
          nodeCoordi = [this.nodes[nodeIndex*3], this.nodes[nodeIndex*3+1], this.nodes[nodeIndex*3+2]];
          if (!nodesCoordi[nodeIndex]) {
            nodesCoordi[nodeIndex] = computeProjectVertex(nodeCoordi, this.camera);
          }
        }
        currentCoorZ = this.boolInPlane(arr1, array, nodesCoordi, this.pickCoordiStandard);

        // 与面相交
        if (currentCoorZ !== false) {

          if (!pickedZ) {
            pickedZ = currentCoorZ;
            pickedGID = GID;
          } else {
            if (currentCoorZ < pickedZ) {
              pickedZ = currentCoorZ;
              pickedGID = GID;
            }
          }
        }              
      }
    } 
    
    if (this.selectType === 1) {               
      this.addRmSelection.addChooseId([pickedGID]);
    } else {
      this.addRmSelection.removeChooseId([pickedGID]);
    }

  }

  // 如果有多个单元，则进一步判断选中的单元
  pickOne3D2D(nodesCoordi) {

    let pickedZ, pickedOne;
    let nodesIndexArray;
    
    // 对于每个被选中的单元
    if (this.pickedElemArr.length > 0) {
      let elementType, GID, LID;
      for (let i = 0; i < this.pickedElemArr.length; i++) {
        GID = this.surfaceInfo.surfaceArray[this.pickedElemArr[i]][0];
        LID = this.surfaceInfo.surfaceArray[this.pickedElemArr[i]][1];
        elementType = this.elemTypeArray[GID];
        
        // 参数确定
        switch (elementType) {
          case 7:
            nodesIndexArray = BlockFaceIndex;
            break;

          case 134:
            nodesIndexArray = TetraFaceIndex;
            break;
        
          default:
            break;
        }
        // 计算出顶点的投影坐标
        const nodeIndexArray = nodesIndexArray[LID].map(e=>this.elements[GID][e]);
        for (let k = 0; k < nodeIndexArray.length; k++) {
          const nodeIndex = nodeIndexArray[k];
          const nodeCoordi = [this.nodes[nodeIndex*3], this.nodes[nodeIndex*3+1], this.nodes[nodeIndex*3+2]];
          if (!nodesCoordi[nodeIndex]) {
            nodesCoordi[nodeIndex] = computeProjectVertex(nodeCoordi, this.camera);
          }
        }

        // 判断是否在平面内
        const arr1 = nodesIndexArray[LID];
        const currentCoorZ = this.boolInPlane(arr1, this.elements[GID], nodesCoordi, this.pickCoordiStandard);

        // 如果是相交，选中离用户最近的那个面单元
        if (currentCoorZ !== false) {

          if (!pickedZ) {
            pickedZ = currentCoorZ;
            pickedOne = this.pickedElemArr[i];
          } else {
            if (currentCoorZ < pickedZ) {
              pickedZ = currentCoorZ;
              pickedOne = this.pickedElemArr[i];
            }
          }
        }           
      } 
    }

    // 将选择的单元添加至数组
    if (this.selectType === 1) {                
      this.addRmSelection.addChooseId([pickedOne]);
    } else {
      this.addRmSelection.removeChooseId([pickedOne]);
    }
  }

  // 判断选中点
  pickOneNode3D(nodesCoordi) {
    let pickedZ, pickedOneSurf, pickedNodesArray, nodePPLengthSq, pickedNode;
    let nodesIndexArray;
    
    // 对于每个被选中的单元
    if (this.pickedElemArr.length > 0) {
      let elementType, GID, LID;
      for (let i = 0; i < this.pickedElemArr.length; i++) {
        GID = this.surfaceInfo.surfaceArray[this.pickedElemArr[i]][0];
        LID = this.surfaceInfo.surfaceArray[this.pickedElemArr[i]][1];
        elementType = this.elemTypeArray[GID];
        
        // 参数确定
        switch (elementType) {
          case 7:
            nodesIndexArray = BlockFaceIndex;
            break;

          case 134:
            nodesIndexArray = TetraFaceIndex;
            break;
        
          default:
            break;
        }
        // 计算出顶点的投影坐标
        const nodeIndexArray = nodesIndexArray[LID].map(e=>this.elements[GID][e]);
        for (let k = 0; k < nodeIndexArray.length; k++) {
          const nodeIndex = nodeIndexArray[k];
          const nodeCoordi = [this.nodes[nodeIndex*3], this.nodes[nodeIndex*3+1], this.nodes[nodeIndex*3+2]];
          if (!nodesCoordi[nodeIndex]) {
            nodesCoordi[nodeIndex] = computeProjectVertex(nodeCoordi, this.camera);
          }
        }

        // 判断是否在平面内
        const arr1 = nodesIndexArray[LID];
        const currentCoorZ = this.boolInPlane(arr1, this.elements[GID], nodesCoordi, this.pickCoordiStandard);

        // 如果是相交，选中离用户最近的那个面单元
        if (currentCoorZ !== false) {

          if (!pickedZ) {
            pickedZ = currentCoorZ;
            pickedOneSurf = this.pickedElemArr[i];
            pickedNodesArray = nodeIndexArray;
          } else {
            if (currentCoorZ < pickedZ) {
              pickedZ = currentCoorZ;
              pickedOneSurf = this.pickedElemArr[i];
              pickedNodesArray = nodeIndexArray;
            }
          }
        }
      }

      // 在这个面中找选定的顶点
      for (let j = 0; j < pickedNodesArray.length; j++) {
        const currentNode = pickedNodesArray[j];
        if(Math.pow(nodesCoordi[currentNode].x-this.pickCoordiStandard.x, 2) + Math.pow(nodesCoordi[currentNode].y - this.pickCoordiStandard.y, 2) < 0.002){
          if (!nodePPLengthSq) {
            nodePPLengthSq = Math.pow(nodesCoordi[currentNode].x-this.pickCoordiStandard.x, 2) + Math.pow(nodesCoordi[currentNode].y - this.pickCoordiStandard.y, 2);
            pickedNode = currentNode;
          } else {
            if (Math.pow(nodesCoordi[currentNode].x-this.pickCoordiStandard.x, 2) + Math.pow(nodesCoordi[currentNode].y - this.pickCoordiStandard.y, 2) < nodePPLengthSq) {
              nodePPLengthSq = Math.pow(nodesCoordi[currentNode].x-this.pickCoordiStandard.x, 2) + Math.pow(nodesCoordi[currentNode].y - this.pickCoordiStandard.y, 2);
              pickedNode = currentNode;
            }
          }
        }
      }
      
      // 将选择的单元添加至数组
      if (pickedNode !== undefined) {
        if (this.selectType === 1) {                
          this.addRmSelection.addChooseId([pickedNode]);
        } else {
          this.addRmSelection.removeChooseId([pickedNode]);
        }
        console.log("当前选中的节点是", pickedNode);
      }
    }
  }
  // 渲染主级几何
  renderGeo(color) {

    this.addRmSelection.chooseGId = [...this.addRmSelection.choosedObject.keys()];

    let elementType;
    const indices = [];

    if (this.addRmSelection.chooseGId !== []) {
      this.addRmSelection.chooseGId.forEach(e => {
        const array = this.elements[e];
        elementType = this.elemTypeArray[e];
        if (this.surfaceInfo.boolSurfElem[e] === 1) {
          if (elementType === 7) {
            //0,3,2,2,1,0,4,5,6,6,7,4,1,5,4,4,0,1,2,6,5,5,1,2,3,7,6,6,2,3,0,4,7,7,3,0
            indices.push(array[0],array[3],array[2],array[2],array[1],array[0],
              array[4],array[5],array[6],array[6],array[7],array[4],
              array[1],array[5],array[4],array[4],array[0],array[1],
              array[2],array[6],array[5],array[5],array[1],array[2],
              array[3],array[7],array[6],array[6],array[2],array[3],
              array[0],array[4],array[7],array[7],array[3],array[0]);

          }else if (elementType === 134) {
            indices.push(array[0],array[2],array[1],
                array[0],array[3],array[2],
                array[1],array[2],array[3],
                array[0],array[1],array[3])
          }else if (elementType === Quad) {
            // 0,1,2,2,3,0
            // indices.push(array[0],array[1],array[2],array[2],array[3],array[0]);
          }else if (elementType === Tria) {
            //0,1,2
            // indices.push(...array);
          }
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
  renderSubGeo(color) {
    this.addRmSelection.chooseSubID = [...this.addRmSelection.choosedObject.keys()];

    const indices = [];
    let indexArr, drawIndexes;
    let elementType;

    if (this.addRmSelection.chooseSubID !== []) {
      this.addRmSelection.chooseSubID.forEach(e => {
        const GID = this.surfaceInfo.surfaceArray[e][0];
        const LID = this.surfaceInfo.surfaceArray[e][1];
        const array = this.elements[GID];
        elementType = this.elemTypeArray[GID];
        switch (elementType) {
          case 7:
            //0,3,2,2,1,0,4,5,6,6,7,4,1,5,4,4,0,1,2,6,5,5,1,2,3,7,6,6,2,3,0,4,7,7,3,0
            drawIndexes = BlockDrawIndex[LID];
            break;

          case 134:
            drawIndexes = TetraFaceIndex[LID];
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
    elementGeo.setAttribute('position', new Three.Float32BufferAttribute(this.nodes, 3));
    const Material = new Three.MeshBasicMaterial({
        color: color,
      });
    return new Three.Mesh(elementGeo, Material);
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
      chosedNodes.push(this.nodes[currentNode*3], this.nodes[currentNode*3+1], this.nodes[currentNode*3+2]);
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
    switch (index1) {
      case 4:
        
        // 选择3D模型的三维体单元
        this.objectType = 3;
        break;

      case 3:
                    
        // 选择3D单元的次级面单元
        this.objectType = 2;
        break;

      case 1:
         
        // 选择体单元的节点
        this.objectType = 1;
        break;
    
      default:
        break;
    }
    this.addRmSelection.chosedNum = 0;

    document.addEventListener('keydown', this.keyDownCtrl, false);
    document.addEventListener('keyup', this.keyUpCtrl, false);
  };

}

// BaseData是基坐标及相关运算的一个类型
let BaseData = {
  baseInd : [0,1,2],                            //三个基向量的索引
  matrImitToWeb : new Three.Matrix3(),         //由仿射坐标系的值投影到WebGL坐标系下的矩阵
  matrWebToImit : new Three.Matrix3(),         //由Web坐标系的值投影到仿射坐标系下的矩阵
  coefA : null,                                //系数a和系数b
  coefB : null, 
  boxScope : new Float64Array(4),              //仿射坐标系的两个基向量的范围[e1Min, e1Max, e2Min, e2Max],[]
  inBox : false,                               //点击位置是否位于当前包围盒的范围内
  inParaLines : false,                         //点击位置是否在两条平行线之间
  excluFlag : false,                           //是否需要排除两个三角形
  e3Slope : null,                              //需要排除三角形的话的斜率
  interceptIndex : new Uint8Array(2),          //计算两个线经过的点的索引
  intercept : new Float64Array(2),             //截距，第一个是截距的最小值，第二个代表截距的最大值
  PPInImit : null,                             //点击位置在仿射坐标系下的坐标
  frameData : null,                            //框的信息[O1, O2, H1, H2, O1p, O2p],前两个是框中心点在WebGL坐标系下的坐标，中间两个是在WebGL坐标系下的半长，后两个是中心点在仿射坐标系上的坐标
  boxData : null,                              //包围盒的信息[O1, O2, H1, H2, O1p, O2p],前两个是包围盒中心点在仿射坐标系下的坐标，中间两个是在仿射坐标系下的半长，后两个是中心点在WebGL坐标系上的坐标
}
export default SelectionData;
