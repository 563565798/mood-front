<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #ecf5ff">
              <el-icon :size="32" color="#409eff"><Document /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.totalRecords || 0 }}</div>
              <div class="stats-label">总记录数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #fef0f0">
              <el-icon :size="32" color="#f56c6c"><Calendar /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ statistics.continuousDays || 0 }}</div>
              <div class="stats-label">连续记录天数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #f4f4f5">
              <el-icon :size="32" color="#909399"><Sunny /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">
                {{ moodRatio?.positiveRatio?.toFixed(1) || 0 }}%
              </div>
              <div class="stats-label">积极情绪比例</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #fdf6ec">
              <el-icon :size="32" color="#e6a23c"><DataAnalysis /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ recentMoodCount }}</div>
              <div class="stats-label">本周记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-card shadow="hover" class="quick-actions">
      <template #header>
        <div class="card-header">
          <el-icon><Lightning /></el-icon>
          <span>快速记录心情</span>
        </div>
      </template>
      <div class="mood-types-grid">
        <div
          v-for="moodType in moodTypes.slice(0, 8)"
          :key="moodType.id"
          class="mood-type-item"
          @click="quickRecord(moodType)"
        >
          <div class="mood-icon" :style="{ background: moodType.color + '20' }">
            <span style="font-size: 32px">{{ moodType.icon }}</span>
          </div>
          <div class="mood-name">{{ moodType.name }}</div>
        </div>
      </div>
    </el-card>

    <!-- 最近记录 -->
    <el-card shadow="hover" class="recent-records">
      <template #header>
        <div class="card-header">
          <el-icon><Clock /></el-icon>
          <span>最近记录</span>
          <el-button type="primary" link @click="$router.push('/record')">
            查看全部
          </el-button>
        </div>
      </template>
      <el-timeline v-if="recentRecords.length > 0">
        <el-timeline-item
          v-for="record in recentRecords"
          :key="record.id"
          :timestamp="formatDateTime(record.recordDate, record.recordTime)"
          placement="top"
        >
          <el-card shadow="hover">
            <div class="record-item">
              <div class="record-mood">
                <span class="mood-icon-large">{{ record.moodType?.icon }}</span>
                <div>
                  <div class="mood-name-large">{{ record.moodType?.name }}</div>
                  <div class="mood-intensity">强度: {{ record.intensity }}/10</div>
                </div>
              </div>
              <div v-if="record.triggerEvent" class="record-content">
                {{ record.triggerEvent }}
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="还没有情绪记录哦，快去记录吧！" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getMoodTypes, getMoodRecordPage, getMoodStatistics } from '@/api/mood'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()

const moodTypes = ref([])
const statistics = ref({})
const recentRecords = ref([])
const loading = ref(false)

const moodRatio = computed(() => statistics.value.moodRatio)
const recentMoodCount = computed(() => {
  // 计算本周记录数
  const oneWeekAgo = dayjs().subtract(7, 'day')
  return recentRecords.value.filter(r => 
    dayjs(r.recordDate).isAfter(oneWeekAgo)
  ).length
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    // 获取情绪类型
    moodTypes.value = await getMoodTypes()
    
    // 获取统计数据
    const endDate = dayjs().format('YYYY-MM-DD')
    const startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    statistics.value = await getMoodStatistics({ startDate, endDate })
    
    // 获取最近记录
    const recordData = await getMoodRecordPage({ pageNum: 1, pageSize: 5 })
    recentRecords.value = recordData.records || []
  } catch (error) {
    console.error('加载数据失败', error)
  } finally {
    loading.value = false
  }
}

const quickRecord = (moodType) => {
  router.push({
    path: '/record',
    query: { moodTypeId: moodType.id }
  })
}

const formatDateTime = (date, time) => {
  return `${date} ${time}`
}
</script>

<style scoped>
.dashboard {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.stats-card:hover {
  transform: translateY(-5px);
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-value {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
}

.stats-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 5px;
}

.quick-actions,
.recent-records {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

.card-header .el-button {
  margin-left: auto;
}

.mood-types-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 15px;
}

.mood-type-item {
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s;
}

.mood-type-item:hover {
  transform: scale(1.1);
}

.mood-icon {
  width: 70px;
  height: 70px;
  margin: 0 auto 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mood-name {
  font-size: 14px;
  color: #2c3e50;
}

.record-item {
  padding: 5px 0;
}

.record-mood {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.mood-icon-large {
  font-size: 36px;
}

.mood-name-large {
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
}

.mood-intensity {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 3px;
}

.record-content {
  color: #606266;
  line-height: 1.6;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
}
</style>




