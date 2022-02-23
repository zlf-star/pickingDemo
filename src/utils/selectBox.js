/*
 * @Descripttion: 
 * @version: 
 * @Author: zlf
 * @Date: 2021-07-08 17:28:26
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-07-16 11:49:25
 */
class SelectBox {
  constructor(renderer, drawedBox) {

    // 如果用户框选创建的框
    this.element = document.createElement('div');
    this.element.style.pointerEvents = 'none';
    //由于通过classList添加不起作用，通过style直接添加
    this.element.style.border = "1px solid #55aaff";
    this.element.style.backgroundColor = "rgba(75, 160, 255, 0.3)";
    this.element.style.position = "fixed";
    
    // this.renderer是模型的渲染区，this.drawedBox是创建的这个box
    this.renderer = renderer;
    this.drawedBox = drawedBox;
    
    //鼠标事件的相应标志
    this.isDown = false;
    this.isUp = false;
    this.isDownAndMove = false;

    //选择类型: 1是正单选，2是反单选，3是正框选，4是反框选
    this.selectType = 0;
    
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

    //由于添加事件中的this是window对象，这里绑定this为SelectBox
    //注意：在bindthis后的对象和原来的就不是同一个函数了，同时相同的函数绑定相同的this在内存中的地址也是不一样的
    //bind() 方法创建一个新的函数，在 bind() 被调用时，这个新函数的 this 被指定为 bind() 的第一个参数，而其余参数将作为新函数的参数，供调用时使用
    //call() 方法是使用一个指定的 this 值和单独给出的一个或多个参数来调用一个函数。
    this.pointerDown = this.pointerDown.bind(this);
    this.pointerMove = this.pointerMove.bind(this);
    this.pointerUp = this.pointerUp.bind(this);
  }

  //将世界坐标转换成标准归一化坐标
  transformCoordinate(w, h, dx, dy) {

    this.bottomRightStandard.x = ((this.bottomRight.x - dx)/ w) * 2 - 1;
    this.bottomRightStandard.y = ((this.bottomRight.y - dy) / h) * (-2) + 1;
    this.topLeftStandard.x = ((this.topLeft.x - dx) / w) * 2 - 1;
    this.topLeftStandard.y = ((this.topLeft.y - dy) / h) * (-2) + 1;
    
  }

  transformCoordinateSingle(w, h, dx, dy) {

    // console.log("((this.pickCoordi.x - dx)/w);是：(("+ this.pickCoordi.x+"-"+dx+")/"+w+")");
    // console.log("((this.pickCoordi.y - dy)/h);是：(("+ this.pickCoordi.y+"-"+dy+")/"+h+")");
    this.pickCoordiStandard.x = ((this.pickCoordi.x - dx)/w) * 2 - 1;
    this.pickCoordiStandard.y = ((this.pickCoordi.y - dy)/h) * (-2) + 1;
    return this.pickCoordiStandard;
  }
  //移除renderer所有pointer事件
  removeAllPoinerListeners() {
    this.renderer.removeEventListener('pointerdown', this.pointerDown);
    this.renderer.removeEventListener('pointermove', this.pointerMove);
    this.renderer.removeEventListener('pointerup', this.pointerUp);
  }
  //添加renderer所有pointer事件
  addAllPointerListeners() {
    this.renderer.addEventListener('pointerdown', this.pointerDown);
    this.renderer.addEventListener('pointermove', this.pointerMove);
    this.renderer.addEventListener('pointerup', this.pointerUp);
  }
  //鼠标按下事件
  pointerDown(event) {

    this.isUp = false;
    this.isDownAndMove = false;

    //1.触发按下
    this.isDown = true;

    //3.设定起始点
    this.startPoint.x = event.clientX;
    this.startPoint.y = event.clientY;

    //4. 设置单选的位置
    this.pickCoordi.x = event.clientX;
    this.pickCoordi.y = event.clientY;
  }
  //鼠标移动事件
  pointerMove(event) {
    if (this.isDown) {

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
    }
  }
  //鼠标抬起事件
  pointerUp(event) {
    //1.停止触发事件
    this.isDown = false;
    this.isUp = true;

    //2.如果有子节点的话，删除子节点
    let divChild = this.drawedBox.lastElementChild;
    while(divChild) {
      this.drawedBox.removeChild(divChild);
      divChild = this.drawedBox.lastElementChild;
    }

    //3.如果是右键就是反选，否则是正选 
    switch (event.button) {

      case 0:

        if (this.isDownAndMove) { 
          this.selectType = 3;
    
        } else {
          this.selectType = 1;
        } 
        break;

      case 2:
        
        if (this.isDownAndMove) {  
          this.selectType = 4;
    
        } else {
          this.selectType = 2;
        } 
        break;
    
      default:
        this.selectType = 0;
        break;
    }      

  }
}
export default SelectBox;
