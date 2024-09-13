// 引入 echarts 核心模块
import * as echarts from 'echarts/core'

// 引入图表 (图表后缀都为 Chart)
// BarChart, LineChart
import { PieChart, GaugeChart } from 'echarts/charts'

// 引入提示框，标题，直角坐标系，数据集，内置数据转换器组件 (组件后缀都为 Component)
import {
  TooltipComponent
  //DatasetComponent,
  //GridComponent,
  //LegendComponent,
  //TitleComponent,
  //ToolboxComponent,
  //TransformComponent
} from 'echarts/components'

// 标签自动布局，全局过渡动画等特性
import { LabelLayout, UniversalTransition } from 'echarts/features'

/*
引入 Canvas 渲染器，注意引入 CanvasRenderer 或者 SVGRenderer 是必须的一步
在需要创建很多 ECharts 实例且浏览器易崩溃的情况下，可以使用 SVG 渲染器来进行改善。
数据量较大（> 1k）、较多交互时，建议选择 Canvas 渲染器。
*/
import { SVGRenderer } from 'echarts/renderers'

// 注册必须的组件
echarts.use([
  TooltipComponent,
  //TitleComponent,
  //GridComponent,
  //DatasetComponent,
  //TransformComponent,
  //ToolboxComponent,
  //LegendComponent,
  LabelLayout,
  UniversalTransition,
  SVGRenderer,
  PieChart,
  GaugeChart
])

export default echarts
