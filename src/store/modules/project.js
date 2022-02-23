const state = {
  projectId:'',
  materialId:'',
  elements:[],
  nodes:[],
  nodesIndex: [],
  //多选单元、面、线、点个数。用于显示
  multipleSelect:{
    element:0,
    face: 0,
    line: 0,
    node: 0
  },
  //单选单元、面、线、点个数。用于显示
  singalSelect:{
    element:0,
    face: 0,
    line: 0,
    node: 0
  },
  //渲染分区行数和列数，可以用户设置,默认为10*10
  groupsRows: 10,
  groupsColumns: 10
}

const mutations = {
  SET_PROJECTID: (state,projectId) => {
    state.projectId = projectId;
  },
  SET_ELEMENTS: (state, elements) => {
    state.elements = elements;
  },
  SET_NODES: (state, nodes) => {
    state.nodes = nodes;
  },
  SET_NODES_INDEX: (state, nodesIndex) => {
    state.nodesIndex = nodesIndex;
  },
  //拾取点的个数
  SET_MUL_NODE_NUMS: (state, nums) => {
    state.multipleSelect.node = nums;
  },
  //拾取线的个数
  SET_MUL_LINE_NUMS: (state, nums) => {
    state.multipleSelect.line = nums;
  },
  //拾取面的个数
  SET_MUL_FACE_NUMS: (state, nums) => {
    state.multipleSelect.face = nums;
  },
  //拾取单元的个数
  SET_MUL_ELEMENT_NUMS: (state, nums) => {
    state.multipleSelect.element = nums;
  },
  //分组的行数
  SET_GROUPS_ROWS: (state, row) => {
    state.groupsRows = row;
  },
  //分组的列数
  SET_GROUPS_COLUMNS: (state, column) => {
    state.groupsColumns = column;
  }
}

const actions = {
  setGroupsRows({commit}, row) {
    commit('SET_GROUPS_ROWS', row);
  },
  setGroupsColumns({commit}, column) {
    commit('SET_GROUPS_COLUMNS', column);
  },
  setProjectId({commit}, projectId) {
    commit('SET_PROJECTID',projectId);
  },
  setElements({commit}, elements) {
    commit('SET_ELEMENTS',elements);
  },
  setNodes({commit}, nodes) {
    commit('SET_NODES',nodes);
  },
  setNodesIndex({commit}, nodesIndex) {
    commit('SET_NODES_INDEX', nodesIndex);
  },
  setMulElementNums({commit}, nums) {
    commit('SET_MUL_ELEMENT_NUMS', nums);
  },
  setMulFaceNums({commit}, nums) {
    commit('SET_MUL_FACE_NUMS', nums);
  },
  setMulLineNums({commit}, nums) {
    commit('SET_MUL_LINE_NUMS', nums);
  },
  setMulNodeNums({commit}, nums) {
    commit('SET_MUL_NODE_NUMS', nums);
  },
}

const getters = {
  projectId: (state) => state.projectId,
  elements: (state) => state.elements,
  nodes: (state) => state.nodes,
  nodesIndex: (state) => state.nodesIndex,
  multiple: (state) => state.multipleSelect,
  singal: (state) => state.singalSelect,
  groupsRows: (state) => state.groupsRows,
  groupsColumns: (state) => state.groupsColumns,
}

export default{
  state, mutations, actions, getters
}
