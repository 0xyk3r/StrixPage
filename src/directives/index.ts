import type { App } from 'vue'
import hasPerm from './permission/hasPerm'
//import hasRole from './permission/hasRole'

const install = function (Vue: App) {
  //Vue.directive('hasRole', hasRole)
  Vue.directive('hasPerm', hasPerm)
}

export default install
