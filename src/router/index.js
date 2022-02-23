import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

// 静态路由
export const StaticRouterMap = [
  
  {
    path:'/',
    component: ()=> import('views/projectWork/index'),
    // children: [
    //   {
    //     path: "dashboard",   
    //     name: "Dashboard",
    //     component: () => import("views/dashboard/index"),
    //     meta: { title: 'dashboard', icon: "dashboard" ,affix: true},

    //   }
    // ]
  },
  // {
  //   path:'/projectWork',
  //   component: ()=> import('views/projectWork/index'),
  //   hidden:true
  // },
];





const createRouter = () =>
  new VueRouter({
    mode: 'history', // require service support
    scrollBehavior: () => ({ y: 0 }),
    routes: StaticRouterMap
  });

const router = createRouter();
// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter();
  router.matcher = newRouter.matcher; // reset router
}

export default router;


  


