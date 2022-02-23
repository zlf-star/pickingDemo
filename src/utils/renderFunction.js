import * as THREE from 'three'
import store from 'store'
/**
 * @description: 通过索引组找到对应节点的下标
 * @param {*} index
 * @param {*} nodes
 * @return {*}
 */
 function indicesToNode(indices, nodes ) {
  const nodesXYZ = []
  indices.forEach(e => {
    nodesXYZ.push(nodes[e*3],nodes[e*3+1],nodes[e*3+2])
  })
  
  return nodesXYZ
}

/**
 * @description: 生成单元
 * @param {*} elemNodes
 * @param {*} elemIndices
 * @param {*} gid
 * @return {*}
 */
function generateElemMesh(elemNodes, elemIndices,gid) {
  let elemGeometry = new THREE.BufferGeometry()
  //公用材料
  let Material = new THREE.MeshBasicMaterial({
    color: 0x7609db,
    side: THREE.DoubleSide
  });

  elemGeometry.setIndex(elemIndices)
  elemGeometry.setAttribute('position', new THREE.Float32BufferAttribute(elemNodes, 3))
  elemGeometry.computeVertexNormals();
  let blockMesh = new THREE.Mesh(elemGeometry, Material)
  blockMesh.userData.elemId = gid

  return blockMesh
}

/**
 * @description: 每个单元生成一套线
 * @param {*} lineNodes
 * @param {*} lineIndices
 * @return {*}
 */
function generateLineMesh(lineNodes, lineIndices ) {
  let lineGeometry = new THREE.BufferGeometry()
  lineGeometry.setIndex(lineIndices)
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineNodes, 3))

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x000000
  })

  
  return new THREE.LineSegments(lineGeometry, lineMaterial)
}

/**
 * @description: 生成面，并设置lid和gid
 * @param {*} faceNodes
 * @param {*} faceIndices
 * @param {*} lid
 * @param {*} elemGid
 * @return {*}
 */
function generateFaceMesh(faceNodes, faceIndices, lid, elemGid) {
  let faceGeometry = new THREE.BufferGeometry()
  faceGeometry.setIndex(faceIndices)
  faceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(faceNodes, 3))
  const faceMaterial = new THREE.MeshBasicMaterial({
    color: 0x867ae9,
    side: THREE.DoubleSide
  })
  let faceMesh = new THREE.Mesh(faceGeometry, faceMaterial)
  faceMesh.userData.lid = lid
  faceMesh.userData.elemId = elemGid
  return faceMesh
}

/**
 * @description: 每两个点生成线，并设置lid和gid
 * @param {*} points
 * @param {*} lid
 * @param {*} elemGid
 * @return {*}
 */
function generateLineMesh2(points, lid, elemGid) {
  
  const lineGeometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3))

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x185adb
  })
  let lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
  lineMesh.userData.lid = lid
  lineMesh.userData.elemId = elemGid
  return lineMesh
}
/**
 * @description:通过三个点数组计算三角形的高
 * @param {*} array1
 * @param {*} array2
 * @param {*} array3
 * @return {*} height
 */
function computeHeightByArray(array1,array2,array3) {
  const poin1 = new THREE.Vector3().fromArray(array1)
  const poin2 = new THREE.Vector3().fromArray(array2)
  const poin3 = new THREE.Vector3().fromArray(array3)
  const v1 = new THREE.Vector3().subVectors(poin1,poin2)
  const v2= new THREE.Vector3().subVectors(poin1,poin3)
  const v3= new THREE.Vector3().subVectors(poin2,poin3)
  return v2.cross(v1).length() / v3.length()
}

/**
 * @description: 计算投影坐标
 * @param {*} obj
 * @param {*} camera
 * @param {*} w
 * @param {*} h
 * @return {*} 返回xy坐标对象
 */
function computeProjectVertex(obj, camera) {
  let arr = null;
  if (obj instanceof Array) {
    arr = obj;
  }else {
    arr = [obj.x, obj.y, obj.z];
  }
  return new THREE.Vector3().fromArray(arr).project(camera);
}
/**
 * @description: 根据拾取点的坐标计算拾取点的组数
 * @param {*} pickPoint
 * @param {*} len
 * @return {*}
 */
function computeOrderIngroups(pickPoint) {
  const spacex = 2 / store.getters['project/groupsRows'];
  const spacey = 2 / store.getters['project/groupsColumns'];
  // console.log('鼠标点击处的X坐标：',pickPoint.x ,'鼠标点击处的Y坐标：',pickPoint.y);
  const column = ~~(( pickPoint.x + 1) / spacex);//向下取整
  const row = ~~((1 - pickPoint.y) / spacey);//向下取整
  return {row, column};
}
/**
 * @description: 根据两个拾取点的坐标计算拾取框包含的行数和列数
 * @param {*} pickPoint1
 * @param {*} pickPoint2
 * @return {*}
 */
 function computeBoxFiled(pickPoint1, pickPoint2) {
  const spacex = 2 / store.getters['project/groupsRows'];
  const spacey = 2 / store.getters['project/groupsColumns'];
  const column = ~~(( pickPoint2.x + 1) / spacex) - ~~(( pickPoint1.x + 1) / spacex);//向下取整
  const row = ~~((1 - pickPoint2.y) / spacey) - ~~((1 - pickPoint1.y) / spacey);//向下取整
  return {row, column};
}
/**
 * @description: 通过两点数组计算中点返回中点的对象结构赋值
 * @param {*} arr1
 * @param {*} arr2
 * @return {*}
 */
function computeMidPoint(arr1, arr2) {
  const a3 = [];
  for (let i = 0; i < arr1.length; i++) {
    a3.push((arr1[i] + arr2[i]) / 2);    
  }
  return {x:a3[0],y:a3[1],z:a3[2]};
}
function computeTriaPoint(arr1, arr2, arr3) {
  const arr = [];
  for (let i = 0; i < arr1.length; i++) {
    arr.push((arr1[i] + arr2[i] + arr3[i]) / 3);    
  }
  return {x:arr[0],y:arr[1],z:arr[2]};
}
function computeTetraPoint(arr1, arr2, arr3, arr4) {
  const arr = [];
  for (let i = 0; i < arr1.length; i++) {
    arr.push(((arr1[i] + arr2[i] + arr3[i])*2 + arr4[i]*3)/ 9);    
  }
  return {x:arr[0],y:arr[1],z:arr[2]};
}
function computeNormalVector(arr1, arr2, arr3) {

  const vec1 = new THREE.Vector3((arr2[0] - arr1[0]), (arr2[1] - arr1[1]), (arr2[2] - arr1[2]));
  const vec2 = new THREE.Vector3((arr3[0] - arr1[0]), (arr3[1] - arr1[1]), (arr3[2] - arr1[2]));

  const vec3 = new THREE.Vector3();
  vec3.crossVectors(vec1, vec2);
  return vec3;
}

function boolBetweenAngle(arr1, arr2, arr3, arr4) {

  const vec1 = new THREE.Vector3((arr1.x - arr2.x), (arr1.y - arr2.y), 0);
  const vec2 = new THREE.Vector3((arr3.x - arr2.x), (arr3.y - arr2.y), 0);
  const vec3 = new THREE.Vector3((arr4.x - arr2.x), (arr4.y - arr2.y), 0);

  const vec13 = vec1.x*vec3.y - vec3.x*vec1.y;
  const vec32 = vec3.x*vec2.y - vec2.x*vec3.y;
  if ((vec13 > 0 && vec32 > 0) || ((vec13 < 0 && vec32 < 0))) {
    return true
  }else {
    return false
  }
}

// 判断传进去的参数比现有的参数谁大
function minMax(paraMin, paraMax, para, minMaxIndexArr, index) {
  if (paraMax === null) {
    paraMin = para;
    paraMax = para;
  } else {
    if (para < paraMin) {
      paraMin = para;
      if (minMaxIndexArr) {
        minMaxIndexArr[0] = index;
      }
    }else if (para > paraMax) {
      paraMax = para;
      if (minMaxIndexArr) {
        minMaxIndexArr[1] = index;
      }
    }
  }
  return [paraMin, paraMax];
}

/**
 * 
 * @param {*} tagetArray1 是要排序的数组
 * @param {*} indexArray2 和排序数组对应的索引的数组
 * @param {*} indexLittle 应该存放较小数值的索引
 * @param {*} indexBig 应该存放较大数值的索引
 * @param {*} tempVari 暂时存放中间变量的变量
 * @param {*} tempVariIndex 暂时存放中间变量的变量，保留这两个变量主要是为了放置不停的回收内存
 */
 function arrayRange(tagetArray1, indexArray2, index1, index2, tempVari) {
  
  tempVari = tagetArray1[index1];
  tagetArray1[index1]= tagetArray1[index2];
  tagetArray1[index2] = tempVari;

  if (indexArray2) {
    tempVari = indexArray2[index1];
    indexArray2[index1]= indexArray2[index2];
    indexArray2[index2] = tempVari;
  }
}


// num1是存储的数据的最大值，num2是建立数组的长度
function createTypedArray(num1, num2) {
  let typedArray;
  if (num1-1 < 256) {
    // 使用Uint8Array
    typedArray = new Uint8Array(num2);
  } else if(num1-1 < 65536){
    // 使用Uint16Array
    typedArray = new Uint16Array(num2);
  } else if (num1-1 < 2147483647) {
    // 使用Uint32Array        
    typedArray = new Uint32Array(num2);
  } else {
    alert('数量已经超过21亿');
    return
  }
  return typedArray;
}

export {
  indicesToNode,generateElemMesh,generateFaceMesh,generateLineMesh2,
  computeHeightByArray,computeProjectVertex,computeOrderIngroups,computeMidPoint,computeTriaPoint,computeTetraPoint,
  computeBoxFiled, computeNormalVector, boolBetweenAngle,minMax,
  arrayRange, createTypedArray
}