<template>
  <div class="analysis-page">
    <!-- 时间范围选择 -->
    <el-card shadow="hover" class="filter-card">
      <el-form :inline="true">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :disabled-date="disabledDate"
            @calendar-change="onCalendarChange"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button-group>
            <el-button @click="setDateRange(3)">最近3天</el-button>
            <el-button @click="setDateRange(7)">最近7天</el-button>
            <el-button @click="setDateRange(30)">最近30天</el-button>
          </el-button-group>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 心情总结 -->
    <el-card shadow="hover" class="summary-card" v-if="moodSummary">
      <template #header>
        <div class="card-header">
          <el-icon><DataAnalysis /></el-icon>
          <span>心情总结</span>
        </div>
      </template>
      <div class="summary-content">
        <div class="summary-text">{{ moodSummary.summaryText }}</div>
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-label">记录次数</div>
            <div class="stat-value">{{ moodSummary.recordCount }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">主导情绪</div>
            <div class="stat-value">{{ moodSummary.dominantMood }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">平均强度</div>
            <div class="stat-value">{{ moodSummary.avgIntensity }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">关键词</div>
            <div class="stat-value">{{ moodSummary.keyword }}</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 图表展示 -->
    <el-row :gutter="20">
      <!-- 情绪趋势折线图 -->
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>情绪强度趋势</span>
            </div>
          </template>
          <div ref="trendChartRef" style="height: 400px"></div>
        </el-card>
      </el-col>

      <!-- 情绪分布饼图 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><PieChart /></el-icon>
              <span>情绪类型分布</span>
            </div>
          </template>
          <div ref="distributionChartRef" style="height: 400px"></div>
        </el-card>
      </el-col>

      <!-- 一周情绪分布柱状图 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><Histogram /></el-icon>
              <span>一周情绪分布</span>
            </div>
          </template>
          <div ref="weekdayChartRef" style="height: 400px"></div>
        </el-card>
      </el-col>

      <!-- 正负面情绪比例 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><DataAnalysis /></el-icon>
              <span>情绪类别比例</span>
            </div>
          </template>
          <div ref="ratioChartRef" style="height: 400px"></div>
        </el-card>
      </el-col>

      <!-- 标签统计 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><Histogram /></el-icon>
              <span>标签统计</span>
            </div>
          </template>
          <div ref="tagChartRef" style="height: 400px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { getMoodStatistics, getMoodSummary } from '@/api/mood'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const dateRange = ref([
  dayjs().subtract(30, 'day').toDate(),
  new Date()
])

const moodSummary = ref(null)
const pickDate = ref(null)

const trendChartRef = ref(null)
const distributionChartRef = ref(null)
const weekdayChartRef = ref(null)
const ratioChartRef = ref(null)
const tagChartRef = ref(null)

let trendChart = null
let distributionChart = null
let weekdayChart = null
let ratioChart = null
let tagChart = null

onMounted(async () => {
  await nextTick()
  initCharts()
  await loadStatistics()
  await loadSummary()
})

const initCharts = () => {
  trendChart = echarts.init(trendChartRef.value)
  distributionChart = echarts.init(distributionChartRef.value)
  weekdayChart = echarts.init(weekdayChartRef.value)
  ratioChart = echarts.init(ratioChartRef.value)
  tagChart = echarts.init(tagChartRef.value)

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    trendChart?.resize()
    distributionChart?.resize()
    weekdayChart?.resize()
    ratioChart?.resize()
    tagChart?.resize()
  })
}

const loadSummary = async () => {
  try {
    const params = {
      startDate: dayjs(dateRange.value[0]).format('YYYY-MM-DD'),
      endDate: dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    }
    moodSummary.value = await getMoodSummary(params)
  } catch (error) {
    console.error('加载总结数据失败', error)
  }
}

const loadStatistics = async () => {
  try {
    const params = {
      startDate: dayjs(dateRange.value[0]).format('YYYY-MM-DD'),
      endDate: dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    }
    
    const data = await getMoodStatistics(params)
    
    renderTrendChart(data.moodTrend || [])
    renderDistributionChart(data.moodDistribution || {})
    renderWeekdayChart(data.weekdayMood || {})
    renderRatioChart(data.moodRatio || {})
    renderTagChart(data.tagStatistics || {})
  } catch (error) {
    console.error('加载统计数据失败', error)
  }
}

const onCalendarChange = (dates) => {
  if (dates.length === 1) {
    pickDate.value = dates[0]
  } else {
    pickDate.value = null
  }
}

const disabledDate = (time) => {
  // 限制不能选择未来时间
  if (time.getTime() > Date.now()) {
    return true
  }
  // 限制选择范围不超过30天
  if (pickDate.value) {
    const diff = time.getTime() - pickDate.value.getTime()
    return Math.abs(diff) > 30 * 24 * 60 * 60 * 1000
  }
  return false
}

const handleDateChange = () => {
  loadStatistics()
  loadSummary()
}

const renderTrendChart = (data) => {
  const dates = data.map(item => item.date)
  const values = data.map(item => item.avgIntensity)
  
  const option = {
    title: {
      text: '情绪强度变化趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '平均强度',
      min: 0,
      max: 10
    },
    series: [
      {
        data: values,
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#409eff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        }
      }
    ]
  }
  
  trendChart.setOption(option)
}

const renderDistributionChart = (data) => {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value
  }))
  
  const option = {
    title: {
      text: '情绪类型分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data: chartData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  distributionChart.setOption(option)
}

const renderWeekdayChart = (data) => {
  // 定义星期顺序（周一到周日）
  const weekdayOrder = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  
  // 按顺序提取数据，如果某天没有数据则默认为0
  const weekdays = weekdayOrder
  const values = weekdayOrder.map(day => data[day] || 0)
  
  const option = {
    title: {
      text: '一周情绪分布'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: weekdays
    },
    yAxis: {
      type: 'value',
      name: '平均强度',
      min: 0,
      max: 10
    },
    series: [
      {
        data: values,
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  }
  
  weekdayChart.setOption(option)
}

const renderRatioChart = (data) => {
  const total = (data.positiveCount || 0) + (data.negativeCount || 0) + (data.neutralCount || 0)
  
  let chartData = []
  let color = []
  
  if (total === 0) {
    chartData = [{ name: '暂无数据', value: 0 }]
    color = ['#dcdfe6']
  } else {
    chartData = [
      { name: '积极情绪', value: data.positiveCount || 0, itemStyle: { color: '#67c23a' } },
      { name: '消极情绪', value: data.negativeCount || 0, itemStyle: { color: '#f56c6c' } },
      { name: '中性情绪', value: data.neutralCount || 0, itemStyle: { color: '#909399' } }
    ]
  }
  
  const option = {
    title: {
      text: '情绪类别比例',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: total === 0 ? '{b}' : '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: total === 0,
          position: 'center',
          formatter: total === 0 ? '暂无数据' : null,
          fontSize: 20,
          fontWeight: 'bold',
          color: '#909399'
        },
        data: total === 0 ? [{ value: 1, name: '暂无数据', itemStyle: { color: '#ebeef5' } }] : chartData
      }
    ]
  }
  
  ratioChart.setOption(option)
}

const renderTagChart = (data) => {
  const tags = Object.keys(data)
  const values = Object.values(data)
  
  const option = {
    title: {
      text: '标签使用统计'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: tags
    },
    series: [
      {
        type: 'bar',
        data: values,
        itemStyle: {
          color: '#e6a23c'
        }
      }
    ]
  }
  
  tagChart.setOption(option)
}

const setDateRange = (days) => {
  dateRange.value = [
    dayjs().subtract(days, 'day').toDate(),
    new Date()
  ]
  loadStatistics()
  loadSummary()
}
</script>

<style scoped>
.analysis-page {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.filter-card {
  margin-bottom: 20px;
}

.summary-card {
  margin-bottom: 20px;
}

.summary-content {
  padding: 10px;
}

.summary-text {
  font-size: 16px;
  color: #303133;
  margin-bottom: 20px;
  line-height: 1.6;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}
</style>




