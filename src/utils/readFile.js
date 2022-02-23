import {BlockFaceIndex, ReducedBlockFaceIndex, BlockLineIndex, ReducedBlockLineIndex,TetraFaceIndex, TetraLineIndex, QuadLineIndex, TriaLineIndex} from './config';
import Vue from 'vue';
import {minMax, arrayRange, createTypedArray} from 'utils/renderFunction';
import * as Three from 'three'

export default function (file) {
  
  console.time('总的时间');
  console.time('将文本读取成一个长字符串');
  let fileReader = new FileReader();
  let resultString = "" //读取结果字符串
  let resultArray = [] //读取结果数组

  //read as text(文本文件)
  fileReader.readAsText(file);

  //callback function after reading
  fileReader.onload = function (e) {

    // resultString即为文件中所有的内容，放在一个字符串中。
    resultString = fileReader.result;
    console.timeEnd('将文本读取成一个长字符串');

    try {
        // 以换行或者回车符来拆分字符串。
        console.time('将所读长字符串分离成数组');
        resultArray = resultString.match(/[^\r\n]+/g);
        console.timeEnd('将所读长字符串分离成数组');
   
        // 跳过注释，到sizing或elements
        console.time('找到sinzing这一部分');

        // 定义读行的变量
        let lineIndex = -1;
        let currentLine;
        let tempLineIndex = null;
        do{
          lineIndex++;
        }while (!/^elements/.exec(resultArray[lineIndex]) && !/^sizing/.exec(resultArray[lineIndex]));
    
        // 将当前行定位于sizing
        if (/^elements/.exec(resultArray[lineIndex])) {
          tempLineIndex = lineIndex;
          do{
            lineIndex++;
          }while (!/^sizing/.exec(resultArray[lineIndex]));
        } else {
          tempLineIndex = null;
        }
        currentLine = resultArray[lineIndex];
        console.timeEnd('找到sinzing这一部分');

        // 单元相关数据
        console.time('分离出单元数量');
        const elemNum = currentLine.substring(40, 50)*1;
        console.timeEnd('分离出单元数量');
        
        console.time('初始化单元的变量');
        const elemTypeArray = createTypedArray(256, elemNum);
        console.timeEnd('初始化单元的变量');
        
        // 节点相关数据
        console.time('分离出节点数量');
        const nodeNum = currentLine.substring(50, 60)*1;
        console.timeEnd('分离出节点数量');

        // 将当前行定位于elements
        console.time('获取单元类型的数组');
        if (tempLineIndex === null) {
          // 继续寻找elements
          do{
            lineIndex++;
          }while (!/^elements/.exec(resultArray[lineIndex]));
          
        }else{
          lineIndex = tempLineIndex;
        }
        currentLine = resultArray[lineIndex];
        
        // 移除数组的第一个元素，剩余元素即为整个模型中出现的单元类型
        let elemTypesArray = currentLine.split(/\s+|,|[\r\n]+/g);
        let dimension, quadElem;
        elemTypesArray.shift();
        console.timeEnd('获取单元类型的数组');

        // 确定整个模型的维度和是否含有四边形
        if (elemTypesArray.includes('7') || elemTypesArray.includes('134')) {        
          dimension = 3;
        } else if (elemTypesArray.includes('1') || elemTypesArray.includes('18')) {
          dimension = 2;
        }
        if (elemTypesArray.includes('7') || elemTypesArray.includes('18')) {
          quadElem = true;
        } else {
          quadElem = false;
        }

        // 初始化二维和三维模型不同的变量
        let elemPP, box, faceArrayObject, geoRange, octreeData, octreeSurfData, nodes2D, octreeDataID;
        octreeData = new OctreeData();
        octreeDataID = [0];
        switch (dimension) {
          case 3:
            elemPP = {
              x : new Float64Array(elemNum),
              y : new Float64Array(elemNum),
              z : new Float64Array(elemNum)
            };
            box = {
              x1 : new Float64Array(elemNum),
              x2 : new Float64Array(elemNum),
              y1 : new Float64Array(elemNum),
              y2 : new Float64Array(elemNum),
              z1 : new Float64Array(elemNum),
              z2 : new Float64Array(elemNum)
            }

            faceArrayObject = new Map();//存放判断后的外表面对象的，仅针对三维模型
            geoRange = [null, null, null, null, null, null];
            octreeSurfData = new OctreeData();
            break;

          case 2:
            elemPP = {
              x : new Float64Array(elemNum),
              y : new Float64Array(elemNum)
            };
            box = {
              x1 : new Float64Array(elemNum),
              x2 : new Float64Array(elemNum),
              y1 : new Float64Array(elemNum),
              y2 : new Float64Array(elemNum),
            }
            geoRange = [null, null, null, null];
            nodes2D = new Float64Array(nodeNum*2);
            break;
        
          default:
            break;
        }
        // 定位到coordinate
        console.time('定位到coordinate');
        do{
          lineIndex++;
        }while (!/^coordinates/.exec(resultArray[lineIndex]) && !/^connectivity/.exec(resultArray[lineIndex]));
        currentLine = resultArray[lineIndex];

        // 将当前行定位于coordinates
        if (/^connectivity/.exec(currentLine)) {
          tempLineIndex = lineIndex;
          lineIndex = resultArray.indexOf('coordinates', tempLineIndex+elemNum);
        } else {
          tempLineIndex = null;
        }
        console.timeEnd('定位到coordinate');

        // 读取节点
        console.time('读取节点数据');

        // 初始化读取节点的变量。
        const nodes = new Float64Array(nodeNum*3);
        let nodeGid, nodeNewGid = 0, coordiX, coordiY, coordiZ, base, indices, newIndex = [];
        lineIndex+=2;
        currentLine = resultArray[lineIndex];
        do{
          nodeLine(currentLine, nodes, nodeGid, nodeNewGid, newIndex, coordiX, coordiY, coordiZ, base, indices, geoRange);
          lineIndex++;
          nodeNewGid++;
          currentLine = resultArray[lineIndex];
        }while (nodeNewGid < nodeNum);
        console.timeEnd('读取节点数据');

        // 定位到connective
        console.time('定位到connectivity');
        if (!tempLineIndex) {
          do{
            lineIndex++;
          }while (!/^connectivity/.exec(resultArray[lineIndex]));
        } else {
          lineIndex = tempLineIndex;
        }
        console.timeEnd('定位到connectivity');

        // 读取单元
        console.time('读取单元信息，包括判断外表面和计算包围盒尺寸中心等');
        
        // 新建单元相关变量
        let elements = [];
        let elementGid = 0;             //单元内部索引
        let reducedElem = {};
        let nodeIndexOfEle,nodeCoordiOfEle;
        lineIndex+=2;
        currentLine = resultArray[lineIndex];
        let lineIndices = [];                  //画线的最终索引

        // 以下是一些2D单元独有的变量
        let globalToLocalMatrix;
        let e12D, e22D, e32D;
        let normAxisIndex;                             // 法向轴，0代表法向量不是任一一个坐标轴。1代表x轴为法向轴，2代表y轴为法向量，3代表z轴为法向量。
        let centerCoordi2D = new Three.Vector3();      // 中心点坐标，用于后面相机所看位置的确定。
        
        do{
          const elemLineInfoArr = currentLine.trim().split(/\s+/);
          elemTypeArray[elementGid] = elemLineInfoArr[1];
          const array = elemLineInfoArr.slice(2).map(Number).map(e=>newIndex[e]);
          elements[elementGid] = array;
          let elemBox;
          
          // 计算每个单元的包围盒
          switch (dimension) {
            case 3:
              elemBox = new Float64Array(6);
              for (let j = 0; j < array.length; j++) {
                nodeIndexOfEle = array[j];
                nodeCoordiOfEle = [nodes[nodeIndexOfEle*3], nodes[nodeIndexOfEle*3+1], nodes[nodeIndexOfEle*3+2]];
                findXYZMinMax(elemBox, nodeCoordiOfEle, j);
              }

              // 拾取中心和包围盒
              elemPP.x[elementGid] = (elemBox[0]+elemBox[1])/2;
              elemPP.y[elementGid] = (elemBox[2]+elemBox[3])/2;
              elemPP.z[elementGid] = (elemBox[4]+elemBox[5])/2;
              box.x1[elementGid] = elemBox[0];
              box.x2[elementGid] = elemBox[1];
              box.y1[elementGid] = elemBox[2];
              box.y2[elementGid] = elemBox[3];
              box.z1[elementGid] = elemBox[4];
              box.z2[elementGid] = elemBox[5];

              // 判断外表面
              switch (elemTypeArray[elementGid]) {
                case 7:
                  blockObj(array, elementGid, reducedElem, faceArrayObject);
                  lineIndices.push(...(BlockLineIndex.map(e => array[e])));
                  break;

                case 134:
                  tetraObj(array, elementGid, faceArrayObject);
                  lineIndices.push(...(TetraLineIndex.map(e => array[e])));
                  break;
              
                default:
                  break;
              }
              break;

            case 2:

              // 如果是第一个单元，确定局部坐标系。
              if (elementGid === 0) {
                globalToLocalMatrix = new Three.Matrix3();
                let BAVector, BCVector;
                let ACoordi, BCoordi, CCoordi;
                let offSet1, offSet2, offSet3;
                let centerCoordi2DArr = [null, null, null];
                ACoordi = [nodes[3*array[0]], nodes[3*array[0]+1], nodes[3*array[0]+2]];
                BCoordi = [nodes[3*array[1]], nodes[3*array[1]+1], nodes[3*array[1]+2]];
                CCoordi = [nodes[3*array[2]], nodes[3*array[2]+1], nodes[3*array[2]+2]];
                BAVector = new Three.Vector3(ACoordi[0]-BCoordi[0], ACoordi[1]-BCoordi[1], ACoordi[2]-BCoordi[2]);
                BCVector = new Three.Vector3(CCoordi[0]-BCoordi[0], CCoordi[1]-BCoordi[1], CCoordi[2]-BCoordi[2]);
                e12D = new Three.Vector3();
                e22D = new Three.Vector3();
                e32D = new Three.Vector3();
                e32D.crossVectors(BAVector, BCVector).normalize();
                if(Math.abs(e32D.x - 1) <= 0.0001 && Math.abs(e32D.y) <= 0.0001 && Math.abs(e32D.z) <= 0.0001){
                  
                  // 以x轴为法向量，以y轴和z轴为局部坐标系
                  normAxisIndex = 1;
                  offSet1 = 1;
                  offSet2 = 2;
                  offSet3 = 0;
                  e12D = new Three.Vector3(0, 1, 0);
                  e22D = new Three.Vector3(0, 0, 1);

                } else if (Math.abs(e32D.y - 1) <= 0.0001 && Math.abs(e32D.z) <= 0.0001 && Math.abs(e32D.x) <= 0.0001){

                  // 以y轴为法向量，以z轴和x轴为局部坐标系
                  normAxisIndex = 2;
                  offSet1 = 2;
                  offSet2 = 0;
                  offSet3 = 1;
                  e12D = new Three.Vector3(0, 0, 1);
                  e22D = new Three.Vector3(1, 0, 0);

                } else if (Math.abs(e32D.z - 1) <= 0.0001 && Math.abs(e32D.x) <= 0.0001 && Math.abs(e32D.y) <= 0.0001){

                  // 以z轴为法向量,以x轴和y轴为局部坐标系
                  normAxisIndex = 3;
                  offSet1 = 0;
                  offSet2 = 1;
                  offSet3 = 2;
                  e12D = new Three.Vector3(1, 0, 0);
                  e22D = new Three.Vector3(0, 1, 0);

                } else {

                  // 法向量不垂直于任一轴
                  normAxisIndex = 0;
                  e22D = BAVector.normalize();
                  e12D.crossVectors(e22D, e32D);
                  globalToLocalMatrix.set(e12D.x, e22D.x, e32D.x, e12D.y, e22D.y, e32D.y, e12D.z, e22D.z, e32D.z);
                  globalToLocalMatrix.invert();

                }
                
                // 构建nodes2D，待完成
                if (normAxisIndex !== 0) {
                  for (let i = 0; i < nodeNum; i++) {
                    nodes2D[i*2] = nodes[i*3+offSet1];
                    nodes2D[i*2+1] = nodes[i*3+offSet2];
                    [geoRange[0], geoRange[1]] = minMax(geoRange[0], geoRange[1], nodes[i*3+offSet1], null);
                    [geoRange[2], geoRange[3]] = minMax(geoRange[2], geoRange[3], nodes[i*3+offSet2], null);
                  }
                  centerCoordi2DArr[offSet1] = [geoRange[0] + geoRange[1]]/2;
                  centerCoordi2DArr[offSet2] = [geoRange[2] + geoRange[3]]/2;
                  centerCoordi2DArr[offSet3] = nodes[offSet3];
                  centerCoordi2D.fromArray(centerCoordi2DArr);
                } else {

                  // 待完成
                }
                
              }
              elemBox = new Float64Array(4);
              for (let j = 0; j < array.length; j++) {
                nodeIndexOfEle = array[j];
                nodeCoordiOfEle = [nodes2D[nodeIndexOfEle*2], nodes2D[nodeIndexOfEle*2+1]];
                findXYZMinMax(elemBox, nodeCoordiOfEle, j);
              }

              // 2D单元的拾取中心和边界
              elemPP.x[elementGid] = (elemBox[0]+elemBox[1])/2;
              elemPP.y[elementGid] = (elemBox[2]+elemBox[3])/2;
              box.x1[elementGid] = elemBox[0];
              box.x2[elementGid] = elemBox[1];
              box.y1[elementGid] = elemBox[2];
              box.y2[elementGid] = elemBox[3];

              // 绘制线框的索引
              switch (elemTypeArray[elementGid]) {
                case 18:
                  
                  // 单元是四边形单元
                  lineIndices.push(...(QuadLineIndex.map(e => array[e])));
                  break;

                case 134:
                  
                  // 单元式三角形单元
                  lineIndices.push(...(TriaLineIndex.map(e => array[e])));
                  break;
              
                default:
                  break;
              }
            
              break;
          
            default:
              break;
          }
          
          lineIndex++;
          currentLine = resultArray[lineIndex];
          elementGid++;
        }while (elementGid < elemNum)
        console.timeEnd('读取单元信息，包括判断外表面和计算包围盒尺寸中心等');

        // 将外表面单元记录下来，是外表面单元则记为1
        console.time('外表面单元包围盒和外表面信息');
        let elemPPXRange =Float64Array.from(elemPP.x);
        let elemIdxXRange = createTypedArray(elemNum, elemNum);  
        let surfaceInfo = {};
        switch (dimension) {
          case 3:
            surfaceInfo.surfaceArray = [...faceArrayObject.values()];
            surfaceInfo.boolSurfElem = new Uint8Array(elemNum);
            const surfElemObj = {};
            for (let i = 0; i < surfaceInfo.surfaceArray.length; i++) {
              if (surfaceInfo.boolSurfElem[surfaceInfo.surfaceArray[i][0]] === 0) {
                surfElemObj[surfaceInfo.surfaceArray[i][0]] = [surfaceInfo.surfaceArray[i][1]];
                surfaceInfo.boolSurfElem[surfaceInfo.surfaceArray[i][0]] = 1;
              } else {
                surfElemObj[surfaceInfo.surfaceArray[i][0]].push(surfaceInfo.surfaceArray[i][1]);
              }
            }
            faceArrayObject = null;

            // 计算外表面包围盒数组
            const surfBox = {
              x1 : new Float64Array(surfaceInfo.surfaceArray.length),
              x2 : new Float64Array(surfaceInfo.surfaceArray.length),
              y1 : new Float64Array(surfaceInfo.surfaceArray.length),
              y2 : new Float64Array(surfaceInfo.surfaceArray.length),
              z1 : new Float64Array(surfaceInfo.surfaceArray.length),
              z2 : new Float64Array(surfaceInfo.surfaceArray.length)
            }

            // 单元拾取中心
            const surfElemPP = {
              x : new Float64Array(surfaceInfo.surfaceArray.length),
              y : new Float64Array(surfaceInfo.surfaceArray.length),
              z : new Float64Array(surfaceInfo.surfaceArray.length)
            }

            // 计算外表面的包围盒的边界和拾取中心
            let faceIndex;
            for (let i = 0; i < surfaceInfo.surfaceArray.length; i++) {
              const GID = surfaceInfo.surfaceArray[i][0];
              const LID = surfaceInfo.surfaceArray[i][1];

              // 计算单个外表面单元的包围盒范围
              const elemBox = new Float64Array(6);
              const array = elements[GID];
              switch (elemTypeArray[GID]) {
                case 7:
                  faceIndex = BlockFaceIndex[LID];
                  break;

                case 134:
                  faceIndex = TetraFaceIndex[LID];
                  break;
              
                default:
                  break;
              }
              const faceNode = faceIndex.map(e => array[e]);

              const sumCoord = new Float64Array(3);
              for (let j = 0; j < faceNode.length; j++) {
                const nodeIndex = faceNode[j];
                const nodeCoordi = [nodes[nodeIndex*3], nodes[nodeIndex*3+1], nodes[nodeIndex*3+2]];
                findXYZMinMax(elemBox, nodeCoordi, j);
                sumCoord[0] = sumCoord[0]+nodeCoordi[0];
                sumCoord[1] = sumCoord[1]+nodeCoordi[1];
                sumCoord[2] = sumCoord[2]+nodeCoordi[2];
              }
              
              // 外表面的拾取中心和包围盒边界
              surfElemPP.x[i] = sumCoord[0]/faceNode.length;
              surfElemPP.y[i] = sumCoord[1]/faceNode.length;
              surfElemPP.z[i] = sumCoord[2]/faceNode.length;
              surfBox.x1[i] = elemBox[0];
              surfBox.x2[i] = elemBox[1];
              surfBox.y1[i] = elemBox[2];
              surfBox.y2[i] = elemBox[3];
              surfBox.z1[i] = elemBox[4];
              surfBox.z2[i] = elemBox[5];
            }
            console.timeEnd('外表面单元包围盒和外表面信息');
            
            console.time('建立包围盒包括面包围盒和体包围盒');
            //***********************************堆排序2开始，增加了节点的索引属性*******************************//

            console.time('八叉树包围盒');
            // 初始化树状结构
            octreeData.geoRange = geoRange;
            octreeData.id = 0;

            // 初始化X坐标数组及其索引的数组
            for (let i = 0; i < elemNum; i++) {
              elemIdxXRange[i] = i;
            }
            if (elemNum > 1) {
              octreeBuild(elemPP, elemNum, elemPPXRange, elemIdxXRange, elemNum, box, octreeData, octreeDataID);
            } 
            octreeData.elemGIDArray = elemIdxXRange;
            // console.log('octreeData', octreeData);
            console.timeEnd('八叉树包围盒');
            
            //***********************************堆排序2结束*******************************//

            // *********************************给外表面单元排序***************************//
            console.time("构建外表面的八叉树");
            octreeSurfData.geoRange = geoRange;
            octreeDataID[0] = 0;
            octreeSurfData.id = 0;

            // 初始化X坐标数组及其索引的数组
            const surfElemPPXRange =Float64Array.from(surfElemPP.x);
            const surfElemIdxXRange = createTypedArray(surfaceInfo.surfaceArray.length, surfaceInfo.surfaceArray.length); 
            for (let i = 0; i < surfaceInfo.surfaceArray.length; i++) {
              surfElemIdxXRange[i] = i;
            }
            if (surfaceInfo.surfaceArray.length > 1) {
              octreeBuild(surfElemPP, surfaceInfo.surfaceArray.length, surfElemPPXRange, surfElemIdxXRange, surfaceInfo.surfaceArray.length, surfBox, octreeSurfData, octreeDataID);
            }
            octreeSurfData.elemGIDArray = surfElemIdxXRange;
            console.timeEnd("构建外表面的八叉树");
            // console.log("octreeSurfData", octreeSurfData);
            console.timeEnd('建立包围盒包括面包围盒和体包围盒');
            // *********************************给外表面单元排序结束***************************//
            
            break;

          case 2:

            console.time('四叉树包围盒');
            // 初始化树状结构
            octreeData.geoRange = geoRange;
            octreeData.id = 0;

            // 初始化X坐标数组及其索引的数组 
            for (let i = 0; i < elemNum; i++) {
              elemIdxXRange[i] = i;
            }
            if (elemNum > 1) {
              octreeBuild2D(elemPP, elemNum, elemPPXRange, elemIdxXRange, elemNum, box, octreeData, octreeDataID);
            } 
            octreeData.elemGIDArray = elemIdxXRange;
            // console.log('octreeData', octreeData);
            console.timeEnd('四叉树包围盒');
            
            break;

          default:
            break;
        }       
        
        //向自定义事件总线$bus发送文件加载完成以及参数
        console.time('将读取的数据组织起来');
        const geomInfo = {
          elements : elements,
          nodes : nodes,
          nodes2D : nodes2D,
          surfaceInfo : surfaceInfo,
          lineIndices : lineIndices,
          elemTypeArray : elemTypeArray,
          dimension : dimension,
          quadElem : quadElem,
          geoRange : geoRange,
          reducedElem : reducedElem,
          octreeData : octreeData,
          octreeSurfData : octreeSurfData,
          axisVectorOf2D : [e12D, e22D, e32D],
          normAxisIndex : normAxisIndex,
          centerCoordi2D : centerCoordi2D,
        }
        console.timeEnd('将读取的数据组织起来');

        // *********************************读取文件的第一版结束****************************************//
        
        console.time('将数据传输过去完成');
        Vue.prototype.$bus.$emit('fileUpload', geomInfo);
        console.timeEnd('将数据传输过去完成');
        console.timeEnd('总的时间');
        // 将不用的变量置为空
        resultArray = null;
        resultString = null;
      } catch (error) {
        alert('文件读取失败');
      }
  }
}

// 单行节点的操作
function nodeLine(currentLine, nodes, nodeGid, nodeNewGid, newIndex, coordiX, coordiY, coordiZ, base, indices, geoRange) {
  
  // 全局索引
  nodeGid = currentLine.substring(0,10)*1;
  coordiX = currentLine.substring(10, 30);
  coordiY = currentLine.substring(30, 50);
  coordiZ = currentLine.substring(50, 70);

  // 除去两边的空白，如果除了第一位为符号，没有别的符号了，则直接就可以作为数字，如果
  nodes[nodeNewGid*3] = toNum(coordiX, base, indices);
  nodes[nodeNewGid*3+1] = toNum(coordiY, base, indices);
  nodes[nodeNewGid*3+2] = toNum(coordiZ, base, indices);
  
  [geoRange[0], geoRange[1]] = minMax(geoRange[0], geoRange[1], nodes[nodeNewGid*3], null);
  [geoRange[2], geoRange[3]] = minMax(geoRange[2], geoRange[3], nodes[nodeNewGid*3+1], null);
  [geoRange[4], geoRange[5]] = minMax(geoRange[4], geoRange[5], nodes[nodeNewGid*3+2], null);

  newIndex[nodeGid] = nodeNewGid;
}
// 将坐标节点转化为数字
function toNum(string , base, indices) {
  string = string.trim();
  if (string.indexOf('-', 1) !== -1) {
    base = string.substring(0, string.indexOf('-', 1))*1;
    indices = string.substring(string.indexOf('-', 1)+1)*(-1);
  } else if (string.indexOf('+', 1) !== -1) {
    base = string.substring(0, string.indexOf('+', 1))*1;
    indices = string.substring(string.indexOf('+', 1)+1)*1;
  } else {
    return string = string*1;
  }
  string = base * Math.pow(10, indices);
  return string;
}

// Block将外表面数组按格式放到对象中
function blockObj(array, gid, reduceObj, mapObj) {
  let arrayTemp ;
  if (array[0] !== array[3]) {

    // 正常单元
    for (let i = 0; i < 6; i++) {
      
      // 给每个面单元起名字，并判断这些名字中重复的删掉
      arrayTemp = BlockFaceIndex[i].map(e=>array[e]).sort((a,b)=>{return a-b});
      hashDelDupli(arrayTemp.join(""), [gid, i], mapObj);
   
    }

  } else {

    // 退缩单元
    for (let i = 0; i < 5; i++) {
      
      // 给每个面单元起名字，并判断这些名字中重复的删掉
      arrayTemp = ReducedBlockFaceIndex[i].map(e=>array[e]).sort((a,b)=>{return a-b});
      hashDelDupli(arrayTemp.join(""), [gid, i], mapObj);
    }

    // 判断哪些单元是缩减单元
    reduceObj[gid] = true;
  }
}

// 四面体将外表面数组按格式放到对象中
function tetraObj(array, gid, mapObj) {
  let arrayTemp ;
  for (let i = 0; i < 4; i++) {
    
    // 给每个面单元起名字，并判断这些名字中重复的删掉
    arrayTemp = TetraFaceIndex[i].map(e=>array[e]).sort((a,b)=>{return a-b});
    hashDelDupli(arrayTemp.join("_"), [gid, i], mapObj);
  }
}

// 如果有重复的属性，就删掉，仅保留只出现一次的属性在mapObj中
function hashDelDupli(key, value, mapObj) {
  // 判读是否重复
  if (mapObj.has(key)) {
    mapObj.delete(key);
  } else {
    mapObj.set(key, value);
  }
}

// 递归排列一个二叉树，使其保持为最大堆
function heapifyMax(tagetArray1, indexArray2, tempVari, rootIndex, numSize, largestIndex) {
  const indexL = 2 * rootIndex + 1;
  largestIndex = rootIndex;
  if (indexL < numSize) {
    if (tagetArray1[rootIndex] < tagetArray1[indexL]) {
      largestIndex = 2 * rootIndex + 1;
    }
  }
  if (indexL+1 < numSize) {
    if (tagetArray1[largestIndex] < tagetArray1[indexL+1]) {
      largestIndex = 2 * rootIndex + 2;
    }
  }

  if (largestIndex !== rootIndex) {
    arrayRange(tagetArray1, indexArray2, largestIndex, rootIndex, tempVari);
    heapifyMax(tagetArray1, indexArray2, tempVari, largestIndex, numSize, largestIndex);
  }
}

// 对某个数组堆排序
function heapSort (arrayLength, targetArray, indexArray) {

  // 构建堆数列，二叉树非叶子节点的数量是
  const unLeaf = Math.floor(arrayLength/2);
  let tempMax, i, rightIndex, largestIndex, rangedNum;

  // 遍历所有非叶子节点
  for (i = unLeaf-1; i >-1; i--) {

    // parent = targetArray[i];
    // left = targetArray[i*2+1];
    rightIndex = (i+1)*2;
    largestIndex = i;

    // 父节点和左节点比较
    if (targetArray[i] < targetArray[i*2+1]) {

      // 如果父节点小，则将父节点和右节点换位置
      largestIndex = i*2+1;
    }

    // 当这个节点含有右子节点时
    if (rightIndex < arrayLength) {

      // 父节点和右节点比较
      if (targetArray[largestIndex] < targetArray[rightIndex]) {

        // 如果父节点小，则将父节点和右节点换位置
        largestIndex = (i+1)*2;
      }
    }

    if (largestIndex !==i) {
      arrayRange(targetArray, indexArray, i, largestIndex, tempMax);
      heapifyMax(targetArray, indexArray, tempMax, largestIndex, arrayLength, largestIndex);      
    }
  }

  // 交换数组的第一个和最后一个数
  arrayRange(targetArray, indexArray, 0, arrayLength-1, tempMax);
  rangedNum = 1;

  // 维持最大堆性质，每循环完一次，就会得出一个最大值。
  let numNewSize = arrayLength -1;
  do {
    heapifyMax(targetArray, indexArray, tempMax, 0, numNewSize, largestIndex);
    arrayRange(targetArray, indexArray, 0, numNewSize-1, tempMax);
    rangedNum++;
    numNewSize--;
  } while (rangedNum < unLeaf);
}

/**
 * 
 * @param {*} arr1 要一分为二的拾取点索引数组
 * @param {*} arr2 一分为二后的排序依据，比如说按Z坐标分，就是Z坐标的数组
 * @param {*} num 创建typedArray数组时的元素最大值
 */
function cutAndSort(arr1, arr2, num) {
  const cutObj = cutToTwo(arr1, arr2, num);

  // 对两个数组按照Y坐标排序
  if (cutObj.Idx1.length>1) {
    heapSort(cutObj.Idx1.length, cutObj.PP1, cutObj.Idx1);
  }
  if (cutObj.Idx2.length>1) {
    heapSort(cutObj.Idx2.length, cutObj.PP2, cutObj.Idx2);
  }

  const resultObj = {
    PP1 : cutObj.PP1,
    index1 : cutObj.Idx1,
    PP2 : cutObj.PP2,
    index2 : cutObj.Idx2,
  }
  return resultObj
}

/**
 * 目的是将一个数组按一定的要求分成两个数组，返回分好组后的四个数组
 * @param {*} arr1 要一分为二的拾取点索引数组==============称为被切索引
 * @param {*} arr2 一分为二后的排序依据，比如说按Z坐标分，就传入Z坐标的数组=========称为sort标准
 * @param {*} num 创建typedArray数组时的元素最大值
 */
function cutToTwo(arr1, arr2, num) {

  // 拆分成两个数组分别的数量
  const num2 = Math.floor(arr1.length/2);
  const num1 = arr1.length-num2;

  // 存放切分之后的sort标准坐标数组
  const PP1 = new Float64Array(num1);
  const PP2 = new Float64Array(num2);

  // 存放切分以后的两个索引数组，这两个数组是按照被切坐标排序的
  const Idx1 = createTypedArray(num, num1);
  const Idx2 = createTypedArray(num, num2);
  let m = 0;
  for (m = 0; m < num1; m++) {

    // 按照被切坐标排序时的索引数组和按照被切坐标排序时的sort坐标数组
    Idx1[m] = arr1[m];
    if (arr2 !== null) {
      PP1[m] = arr2[arr1[m]];
    }
  }
  for (m = num1; m < arr1.length; m++) {

    // 同上
    Idx2[m-num1] = arr1[m];
    if (arr2 !== null) {
      PP2[m-num1] = arr2[arr1[m]];
    }
  }
  
  const cutObj = {
    Idx1 : Idx1,
    PP1 : PP1,
    Idx2 : Idx2,
    PP2 : PP2
  }
  arr1 = null;
  return cutObj
}

function octreeBuild(elemPP, num1, PPRange, indexRange, totalNum, box, treeNode, octreeDataID) {

  let currentTreeNode;
  if (num1 > 8) {

    // PPRange和indexRange按照X坐标从大到小进行排序
    heapSort(num1, PPRange, indexRange);

    // 将坐标数组先按X砍成两份,并且按照Y排序
    const X1X2 = cutAndSort(indexRange, elemPP.y, totalNum); 

    // 将X1区域按Y砍成两份，并且按照Z排序
    const X1Y1Y2 = cutAndSort(X1X2.index1, elemPP.z, totalNum);

    // 将X2区域按Y砍成两份，并且按照Z排序
    const X2Y1Y2 = cutAndSort(X1X2.index2, elemPP.z, totalNum);

    // 对4个数组再对Z进行分割
    const X1Y1Z1Z2 = cutToTwo(X1Y1Y2.index1, elemPP.z, totalNum);
    const X1Y2Z1Z2 = cutToTwo(X1Y1Y2.index2, elemPP.z, totalNum);
    const X2Y1Z1Z2 = cutToTwo(X2Y1Y2.index1, elemPP.z, totalNum);
    const X2Y2Z1Z2 = cutToTwo(X2Y1Y2.index2, elemPP.z, totalNum);
    
    // 获取八个子节点的单元索引和包围盒尺寸
    let octreeRankData = eightBoxesGeoGID(X1Y1Z1Z2, X1Y2Z1Z2, X2Y1Z1Z2, X2Y2Z1Z2, box);

    // 构建八个节点
    let i = 0;
    do {
      if (i === 0) {

        // 第一个包围盒永远不为空
        treeNode.child = new OctreeData();  
        currentTreeNode = treeNode.child;
        currentTreeNode.elemGIDArray = octreeRankData.GIDArrayObj[i];
        currentTreeNode.geoRange = octreeRankData.elemBox[i];
        octreeDataID[0]++;
        currentTreeNode.id = octreeDataID[0];
      } else {

        // 当包围盒中元素不为空的时候
        if (octreeRankData.GIDArrayObj[i].length > 0) {
          currentTreeNode.brother = new OctreeData();
          currentTreeNode = currentTreeNode.brother;
          currentTreeNode.elemGIDArray = octreeRankData.GIDArrayObj[i];
          currentTreeNode.geoRange = octreeRankData.elemBox[i];
          octreeDataID[0]++;
          currentTreeNode.id = octreeDataID[0];
        }
      }
      
      // 如果单元数量大于1，要继续分
      const ElmLength = currentTreeNode.elemGIDArray.length;
      if (ElmLength > 1) {
        
        // 首先构建x排序的数组
        const elemPPXRange = new Float64Array(ElmLength);
        const elemIdxXRange = createTypedArray(totalNum, ElmLength);
        for (let j = 0; j < ElmLength; j++) {
          elemIdxXRange[j] = currentTreeNode.elemGIDArray[j];
          elemPPXRange[j] = elemPP.x[currentTreeNode.elemGIDArray[j]];
        }

        // 继续分八叉
        octreeBuild(elemPP, ElmLength, elemPPXRange, elemIdxXRange, totalNum, box, currentTreeNode, octreeDataID);
      }
      i++;
    } while (i < 8);

  } else {

    // 当单元数量小于8时
    let nodeNum = 0;
    let currentArray = indexRange;
    do {
      if (nodeNum === 0) {

        // 第一个包围盒永远不为空
        treeNode.child = new OctreeData();      
        currentTreeNode = treeNode.child;
      } else {

        // 当包围盒中元素不为空的时候
        currentTreeNode.brother = new OctreeData();      
        currentTreeNode = currentTreeNode.brother;      
      }
      
      octreeDataID[0]++;
      currentTreeNode.id = octreeDataID[0]; 
      currentTreeNode.elemGIDArray = [currentArray[nodeNum]];
      currentTreeNode.geoRange = new Float64Array(6);

      // 找出第i个包围盒的X的最小值和最小值
      currentTreeNode.geoRange[0] = box.x1[currentArray[nodeNum]];
      currentTreeNode.geoRange[1] = box.x2[currentArray[nodeNum]];
      
      // 找出第i个包围盒的Y的最小值和最小值
      currentTreeNode.geoRange[2] = box.y1[currentArray[nodeNum]];
      currentTreeNode.geoRange[3] = box.y2[currentArray[nodeNum]];
      
      // 找出第i个包围盒的Z的最小值和最小值
      currentTreeNode.geoRange[4] = box.z1[currentArray[nodeNum]];
      currentTreeNode.geoRange[5] = box.z2[currentArray[nodeNum]];
      
      nodeNum++;
    } while (nodeNum < num1);  
  }
  
}

function octreeBuild2D(elemPP, num1, PPRange, indexRange, totalNum, box, treeNode, octreeDataID) {

  let currentTreeNode;
  if (num1 > 4) {

    // PPRange和indexRange按照X坐标从大到小进行排序
    heapSort(num1, PPRange, indexRange);

    // 将坐标数组先按X砍成两份,并且按照Y排序
    const X1X2 = cutAndSort(indexRange, elemPP.y, totalNum); 

    // // 将X1区域按Y砍成两份，并且按照Z排序
    // const X1Y1Y2 = cutAndSort(X1X2.index1, elemPP.z, totalNum);

    // // 将X2区域按Y砍成两份，并且按照Z排序
    // const X2Y1Y2 = cutAndSort(X1X2.index2, elemPP.z, totalNum);

    // 对2个数组再对Y进行分割
    const X1Y1Y2 = cutToTwo(X1X2.index1, elemPP.y, totalNum);
    const X2Y1Y2 = cutToTwo(X1X2.index2, elemPP.y, totalNum);
    // const X2Y1Z1Z2 = cutToTwo(X2Y1Y2.index1, elemPP.z, totalNum);
    // const X2Y2Z1Z2 = cutToTwo(X2Y1Y2.index2, elemPP.z, totalNum);
    
    // 获取八个子节点的单元索引和包围盒尺寸
    let octreeRankData = fourBoxesGeoGID(X1Y1Y2, X2Y1Y2, box);

    // 构建四个节点
    let i = 0;
    do {
      if (i === 0) {

        // 第一个包围盒永远不为空
        treeNode.child = new OctreeData();  
        currentTreeNode = treeNode.child;
        currentTreeNode.elemGIDArray = octreeRankData.GIDArrayObj[i];
        currentTreeNode.geoRange = octreeRankData.elemBox[i];
        octreeDataID[0]++;
        currentTreeNode.id = octreeDataID[0];
      } else {

        // 当包围盒中元素不为空的时候
        if (octreeRankData.GIDArrayObj[i].length > 0) {
          currentTreeNode.brother = new OctreeData();
          currentTreeNode = currentTreeNode.brother;
          currentTreeNode.elemGIDArray = octreeRankData.GIDArrayObj[i];
          currentTreeNode.geoRange = octreeRankData.elemBox[i];
          octreeDataID[0]++;
          currentTreeNode.id = octreeDataID[0];
        }
      }
      
      // 如果单元数量大于1，要继续分
      const ElmLength = currentTreeNode.elemGIDArray.length;
      if (ElmLength > 1) {
        
        // 首先构建x排序的数组
        const elemPPXRange = new Float64Array(ElmLength);
        const elemIdxXRange = createTypedArray(totalNum, ElmLength);
        for (let j = 0; j < ElmLength; j++) {
          elemIdxXRange[j] = currentTreeNode.elemGIDArray[j];
          elemPPXRange[j] = elemPP.x[currentTreeNode.elemGIDArray[j]];
        }

        // 继续分八叉
        octreeBuild2D(elemPP, ElmLength, elemPPXRange, elemIdxXRange, totalNum, box, currentTreeNode, octreeDataID);
      }
      i++;
    } while (i < 4);

  } else {

    // 当单元数量小于4时
    let nodeNum = 0;
    let currentArray = indexRange;
    do {
      if (nodeNum === 0) {

        // 第一个包围盒永远不为空
        treeNode.child = new OctreeData();      
        currentTreeNode = treeNode.child;
      } else {

        // 当包围盒中元素不为空的时候
        currentTreeNode.brother = new OctreeData();      
        currentTreeNode = currentTreeNode.brother;      
      }
      
      octreeDataID[0]++;
      currentTreeNode.id = octreeDataID[0]; 
      currentTreeNode.elemGIDArray = [currentArray[nodeNum]];
      currentTreeNode.geoRange = new Float64Array(4);

      // 找出第i个包围盒的X的最小值和最小值
      currentTreeNode.geoRange[0] = box.x1[currentArray[nodeNum]];
      currentTreeNode.geoRange[1] = box.x2[currentArray[nodeNum]];
      
      // 找出第i个包围盒的Y的最小值和最小值
      currentTreeNode.geoRange[2] = box.y1[currentArray[nodeNum]];
      currentTreeNode.geoRange[3] = box.y2[currentArray[nodeNum]];
      
      nodeNum++;
    } while (nodeNum < num1);  
  }
  
}

/**
 * 
 * @param {*} arr1 [Xmin = arr1[0], Xmax= arr1[1], Ymin= arr1[2], Ymax= arr1[3], Zmin= arr1[4], Zmax= arr1[5]]
 * @param {*} arr2 坐标[x, y, z]
 * @param {*} flag 判断是否为第一次进行比较
 */
function findXYZMinMax(arr1, arr2, flag) {
  if(flag === 0) {
    
    arr1[0] = arr2[0];
    arr1[1] = arr2[0];
    arr1[2] = arr2[1];
    arr1[3] = arr2[1];
    switch (arr1.length) {
      case 6:
        arr1[4] = arr2[2];
        arr1[5] = arr2[2];
        break;
    
      default:
        break;
    }
  } else {

    // 去找X的最大最小值
    if (arr1[0] > arr2[0]) {
      arr1[0] = arr2[0];
    } else if (arr1[1] < arr2[0]) {
      arr1[1] = arr2[0];
    }

    // 去找Y的最大最小值
    if (arr1[2] > arr2[1]) {
      arr1[2] = arr2[1];
    } else if (arr1[3] < arr2[1]) {
      arr1[3] = arr2[1];
    }

    switch (arr1.length) {
      case 6:
        
        // 去找Z的最大最小值
        if (arr1[4] > arr2[2]) {
          arr1[4] = arr2[2];
        } else if (arr1[5] < arr2[2]) {
          arr1[5] = arr2[2];
        }
        break;
    
      default:
        break;
    }
  }
}

function eightBoxesGeoGID(X1Y1Z1Z2, X1Y2Z1Z2, X2Y1Z1Z2, X2Y2Z1Z2, box) {
  
  const elemGIDArray = [X1Y1Z1Z2.Idx1,X1Y1Z1Z2.Idx2,X1Y2Z1Z2.Idx1,X1Y2Z1Z2.Idx2,X2Y1Z1Z2.Idx1,X2Y1Z1Z2.Idx2,X2Y2Z1Z2.Idx1,X2Y2Z1Z2.Idx2];
  const elemBox = [];
  
  for (let i = 0; i < 8; i++) {

    //初始化包围盒的边界elemBox[i]；
    elemBox[i] = new Float64Array(6);
    elemBox[i][0] = box.x1[elemGIDArray[i][0]];
    elemBox[i][1] = box.x2[elemGIDArray[i][0]];
    elemBox[i][2] = box.y1[elemGIDArray[i][0]];
    elemBox[i][3] = box.y2[elemGIDArray[i][0]];
    elemBox[i][4] = box.z1[elemGIDArray[i][0]];
    elemBox[i][5] = box.z2[elemGIDArray[i][0]];
    for (let j = 1; j < elemGIDArray[i].length; j++) {
      const elemGID = elemGIDArray[i][j];

      // 确定X的包围盒的最大最小值
      if (elemBox[i][0] > box.x1[elemGID]) {
        elemBox[i][0] = box.x1[elemGID]
      }
      if (elemBox[i][1] < box.x2[elemGID]) {
        elemBox[i][1] = box.x2[elemGID]
      }

      // 确定Y的包围盒的最大最小值
      if (elemBox[i][2] > box.y1[elemGID]) {
        elemBox[i][2] = box.y1[elemGID]
      }
      if (elemBox[i][3] < box.y2[elemGID]) {
        elemBox[i][3] = box.y2[elemGID]
      }

      // 确定Z的包围盒的最大最小值
      if (elemBox[i][4] > box.z1[elemGID]) {
        elemBox[i][4] = box.z1[elemGID]
      }
      if (elemBox[i][5] < box.z2[elemGID]) {
        elemBox[i][5] = box.z2[elemGID]
      }
    }
  }
  const obj = {
    GIDArrayObj : elemGIDArray,
    elemBox : elemBox
  };

  return obj;
}

function fourBoxesGeoGID(X1Y1Y2, X2Y1Y2, box) {
  
  const elemGIDArray = [X1Y1Y2.Idx1,X1Y1Y2.Idx2,X2Y1Y2.Idx1,X2Y1Y2.Idx2];
  const elemBox = [];
  
  for (let i = 0; i < 4; i++) {

    //初始化包围盒的边界elemBox[i]；
    elemBox[i] = new Float64Array(4);
    elemBox[i][0] = box.x1[elemGIDArray[i][0]];
    elemBox[i][1] = box.x2[elemGIDArray[i][0]];
    elemBox[i][2] = box.y1[elemGIDArray[i][0]];
    elemBox[i][3] = box.y2[elemGIDArray[i][0]];
    for (let j = 1; j < elemGIDArray[i].length; j++) {
      const elemGID = elemGIDArray[i][j];

      // 确定X的包围盒的最大最小值
      if (elemBox[i][0] > box.x1[elemGID]) {
        elemBox[i][0] = box.x1[elemGID]
      }
      if (elemBox[i][1] < box.x2[elemGID]) {
        elemBox[i][1] = box.x2[elemGID]
      }

      // 确定Y的包围盒的最大最小值
      if (elemBox[i][2] > box.y1[elemGID]) {
        elemBox[i][2] = box.y1[elemGID]
      }
      if (elemBox[i][3] < box.y2[elemGID]) {
        elemBox[i][3] = box.y2[elemGID]
      }
    }
  }
  const obj = {
    GIDArrayObj : elemGIDArray,
    elemBox : elemBox
  };

  return obj;
}

class OctreeData {
  constructor() {
    this.child = null;
    this.brother = null;
    this.geoRange = null;
    this.elemGIDArray = [];
    this.id;
  }
}
