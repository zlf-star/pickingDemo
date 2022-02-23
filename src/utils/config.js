const config={
  //===============================界面用户设置相关=====================================
  /**
   * @type {boolean} true | false
   * @description Whether show the settings right-panel
   */
   showSettings: true,

   /**
    * @type {boolean} true | false
    * @description Whether need tagsView
    */
   tagsView: true,
 
   /**
    * @type {boolean} true | false
    * @description Whether fix the header
    */
   fixedHeader: false,
 
   /**
    * @type {boolean} true | false
    * @description Whether show the logo in sidebar
    */
   sidebarLogo: false,

  //===================================== network相关 ==================================
  //是否开启登录拦截
  loginInterception: true,
  //配后端数据的接收方式application/json;charset=UTF-8或者application/x-www-form-urlencoded;charset=UTF-8
  contentType: 'application/json;charset=UTF-8',
  //最长请求时间
  requestTimeout: 5000,
  //操作正常code，支持String、Array、int多种类型
  successCode: [200, 20000],
  //登录失效code
  invalidCode: 402,
  //无权限code
  noPermissionCode: 401,
  // 开发以及部署时的URL
  publicPath: '/',
  // 生产环境构建文件的目录名
  outputDir: 'dist',
  // 放置生成的静态资源 (js、css、img、fonts) 的 (相对于 outputDir 的) 目录。
  assetsDir: 'static',
  // 开发环境每次保存时是否输出为eslint编译警告
  lintOnSave: true,
  // 进行编译的依赖
  transpileDependencies: [],
  //token存储位置localStorage sessionStorage
  storage: 'localStorage',
  //不经过token校验的路由
  routesWhiteList: ['/login', '/register', '/404', '/401'],
  //加载时显示文字
  loadingText: '渲染中...',
  loadingTarget:'document.body',
  //开发环境端口号
  devPort: '9528',
  // 默认的接口地址 如果是开发环境和生产环境走vab-mock-server，当然你也可以选择自己配置成需要的接口地址
  // baseURL: 'http://127.0.0.1:8222',
  baseURL:process.env.NODE_ENV === 'development'
      ? '/dev-api'
      : '/prod-api',
    // baseURL: 'http://127.0.0.1:8001',
  //================================网站信息相关===================================
   //这一项非常重要！请务必保留MIT协议下package.json及copyright作者信息 即可免费商用，不遵守此项约定你将无法使用该框架，如需自定义版权信息请联系QQ1204505056
   copyright: 'vab',
   //是否显示页面底部自定义版权信息
   footerCopyright: true,
  //消息框消失时间
  messageDuration: 3000,
    //token名称
  tokenName: 'pro_token',
    //标题 （包括初次加载雪花屏的标题 页面的标题 浏览器的标题）
  title:'热处理模拟网站',
  //需要加loading层的请求，防止重复提交
  debounce: ['doEdit'],

  //========================webGL渲染相关=============================================
  // 目前暂时的一些不同的单元单元类型除了如下之外，把缩减成五面体的六面体单元编号记为8
  Quad:18, //四边形
  Tria:1, // 三角形
  Tetra: 134, //四面体
  Block: 7, //六面体
  nodeNumForMesh:{
    7:   8,
    134: 4,
    1:   3,
    18:  4
  },
  BlockFaceIndex:[[0,3,2,1],[4,5,6,7],[1,5,4,0],[2,6,5,1],[3,7,6,2],[0,4,7,3]],//六面体面内部编号
  ReducedBlockFaceIndex:[[0,2,1],[4,5,6],[0,4,6,2],[1,5,4,0],[1,2,6,5]],//六面体面内部编号
  BlockDrawIndex:[[0,3,2,2,1,0],[4,5,6,6,7,4],[1,5,4,4,0,1],[2,6,5,5,1,2],[3,7,6,6,2,3],[0,4,7,7,3,0]],//六面体面内部编号
  BlockDrawIndexARange:[0,3,2,2,1,0,4,5,6,6,7,4,1,5,4,4,0,1,2,6,5,5,1,2,3,7,6,6,2,3,0,4,7,7,3,0],
  BlockReduDrawIndex:[[0,2,1],[4,5,6],[4,6,0,0,6,2],[5,4,1,1,4,0],[6,5,2,2,5,1]],//五面体的绘图索引
  BlockLineIndex:[0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7],
  ReducedBlockLineIndex: [0,2,2,1,1,0,4,5,5,6,6,4,0,4,1,5,2,6],
  //0, 1, 2, 0, 2, 3,1,3,2, 0, 3, 1 
  TetraFaceIndex:[[0,2,1],[0,3,2],[1,2,3],[0,1,3]],//四面体面内部编号
  TetraLineIndex:[0,1,0,2,0,3,1,2,2,3,3,1],//四面体面内部编号

  // QuadLineIndex:[[0,1],[2,3],[3,0],[1,2]],//四边形线内部编号
  QuadLineIndex:[0,1,1,2,2,3,3,0],//四边形线内部编号
  TriaLineIndex:[0,1,1,2,2,0],//三角形线内部编号
  scaleTimes:2,//几何外接球半径放大倍数
  pointColor:'0x888888',
  pointSize:0.05,
  minDistance:0.05,//最短距离，用来判断选中的是那条线
  modelColor: 0x7609db,//普通模型渲染颜色
  lineColor: 0x000000,//线渲染颜色
  modelHighlightColor:0xffe600,//模型高亮颜色
  sideBarWidth:256,//侧边栏宽度
  navBarHeight:50,//顶部导航高度
}
//作为一个类导出
module.exports = config