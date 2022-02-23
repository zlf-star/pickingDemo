//用户拾取的元素，包括添加和删除选中单元的方法
class AddRmSelection {
  constructor() {
    this.choosedObject = new Map();      //选择单元全局id，在多次选择后，已经确定选择的
    this.chooseGId = [];                 //选择单元全局id，在多次选择后，已经确定选择的
    this.chooseSubID = [];               //选择次级单元的全局ID和局部ID，在多次选择后，已经确定选择的
    this.thereAreNew = false;            //是否有新选择的,false为无
    this.cameraMatrix1 = null;
    this.cameraMatrix2 = null;           //两个投影矩阵，用来比较视图是否发生了变化
    this.chosedNum;

    this.addChooseId = this.addChooseId.bind(this);
    this.removeChooseId = this.removeChooseId.bind(this);
  }
  addChooseId(array) {
    //添加单元id
    //如果之前已经进行框选
    if (this.chosedNum > 0) {
      // debugger
      for (let i = 0; i < array.length; i++) {
        if(!this.choosedObject.has(array[i])){
          this.choosedObject.set(array[i],true);
          this.thereAreNew = true;
          this.chosedNum++;
        }        
      }
    }else {

      for (let i = 0; i < array.length; i++) {
        this.choosedObject.set(array[i],true);
        this.chosedNum++;
      }
      this.thereAreNew = true;
    }
  }
  removeChooseId(array) {
    // 将新加入的添加到数组中
    if (this.chosedNum > 0) {
      for (let i = 0; i < array.length; i++) {
        if(this.choosedObject.has(array[i])){          
          this.choosedObject.delete(array[i]);
          this.thereAreNew = true;
          this.chosedNum--;
        }
      }
    }
  }
}
export default AddRmSelection;