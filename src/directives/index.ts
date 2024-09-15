import type { App } from 'vue'
import hasPerm from './permission/hasPerm'
//import hasRole from './permission/hasRole'

const install = function (app: App) {
  //app.directive('hasRole', hasRole)
  app.directive('hasPerm', hasPerm)
}

export default install
