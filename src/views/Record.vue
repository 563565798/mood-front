<template>
  <div class="record-page">
    <!-- 创建记录 -->
    <el-card shadow="hover" class="create-card">
      <template #header>
        <div class="card-header">
          <el-icon><Edit /></el-icon>
          <span>记录当前心情</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="选择情绪" prop="moodTypeId">
          <div class="mood-selector">
            <div
              v-for="moodType in moodTypes"
              :key="moodType.id"
              class="mood-option"
              :class="{ active: form.moodTypeId === moodType.id }"
              @click="form.moodTypeId = moodType.id"
            >
              <span class="mood-icon">{{ moodType.icon }}</span>
              <span class="mood-label">{{ moodType.name }}</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="情绪强度" prop="intensity">
          <el-slider
            v-model="form.intensity"
            :min="1"
            :max="10"
            show-stops
            :marks="{ 1: '1', 5: '5', 10: '10' }"
          />
        </el-form-item>

        <el-form-item label="触发事件">
          <el-input
            v-model="form.triggerEvent"
            type="textarea"
            :rows="3"
            placeholder="是什么让你有这样的感受？"
          />
        </el-form-item>

        <el-form-item label="当时想法">
          <el-input
            v-model="form.thoughts"
            type="textarea"
            :rows="3"
            placeholder="记录下你当时的想法..."
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            placeholder="选择或创建标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in commonTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="地点">
          <el-input v-model="form.location" placeholder="当前所在地点（选填）" />
        </el-form-item>

        <el-form-item label="天气">
          <el-select v-model="form.weather" placeholder="选择天气" clearable>
            <el-option label="☀️ 晴天" value="晴天" />
            <el-option label="☁️ 多云" value="多云" />
            <el-option label="🌧️ 雨天" value="雨天" />
            <el-option label="❄️ 下雪" value="下雪" />
            <el-option label="🌈 阴天" value="阴天" />
          </el-select>
        </el-form-item>

        <el-form-item label="记录时间">
          <el-date-picker
            v-model="form.recordDate"
            type="date"
            placeholder="选择日期"
            style="width: 200px; margin-right: 10px"
          />
          <el-time-picker
            v-model="form.recordTime"
            placeholder="选择时间"
            style="width: 150px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            保存记录
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 历史记录 -->
    <el-card shadow="hover" class="history-card">
      <template #header>
        <div class="card-header">
          <el-icon><Clock /></el-icon>
          <span>历史记录</span>
        </div>
      </template>

      <el-table
        :data="records"
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column label="情绪" width="120">
          <template #default="{ row }">
            <div class="mood-cell">
              <span class="mood-icon-table">{{ row.moodType?.icon }}</span>
              <span>{{ row.moodType?.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="intensity" label="强度" width="80">
          <template #default="{ row }">
            <el-tag>{{ row.intensity }}/10</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="triggerEvent" label="事件" show-overflow-tooltip />

        <el-table-column label="标签" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="(tag, index) in (row.tags || '').split(',')"
              :key="index"
              size="small"
              style="margin-right: 5px"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ row.recordDate }} {{ row.recordTime }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editRecord(row)">
              编辑
            </el-button>
            <el-button type="danger" link @click="deleteRecord(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @current-change="loadRecords"
        style="margin-top: 20px; text-align: right"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  getMoodTypes,
  createMoodRecord,
  getMoodRecordPage,
  deleteMoodRecord as apiDeleteMoodRecord
} from '@/api/mood'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()

const formRef = ref(null)
const moodTypes = ref([])
const records = ref([])
const loading = ref(false)
const submitting = ref(false)

const commonTags = ref(['工作', '学习', '家庭', '朋友', '恋爱', '运动', '睡眠', '饮食', '娱乐', '旅行'])

const form = ref({
  moodTypeId: null,
  intensity: 5,
  triggerEvent: '',
  thoughts: '',
  tags: [],
  location: '',
  weather: '',
  recordDate: new Date(),
  recordTime: new Date()
})

const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const rules = {
  moodTypeId: [{ required: true, message: '请选择情绪类型', trigger: 'change' }],
  intensity: [{ required: true, message: '请选择情绪强度', trigger: 'change' }]
}

onMounted(async () => {
  await loadMoodTypes()
  await loadRecords()
  
  // 如果有预选的情绪类型
  if (route.query.moodTypeId) {
    form.value.moodTypeId = Number(route.query.moodTypeId)
  }
})

const loadMoodTypes = async () => {
  moodTypes.value = await getMoodTypes()
}

const loadRecords = async () => {
  loading.value = true
  try {
    const data = await getMoodRecordPage({
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    })
    records.value = data.records || []
    pagination.value.total = data.total || 0
  } catch (error) {
    console.error('加载记录失败', error)
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const submitData = {
          ...form.value,
          tags: form.value.tags.join(','),
          recordDate: dayjs(form.value.recordDate).format('YYYY-MM-DD'),
          recordTime: dayjs(form.value.recordTime).format('HH:mm:ss')
        }
        
        await createMoodRecord(submitData)
        ElMessage.success('记录成功')
        resetForm()
        await loadRecords()
      } catch (error) {
        console.error('创建记录失败', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.value = {
    moodTypeId: null,
    intensity: 5,
    triggerEvent: '',
    thoughts: '',
    tags: [],
    location: '',
    weather: '',
    recordDate: new Date(),
    recordTime: new Date()
  }
}

const editRecord = (record) => {
  ElMessage.info('编辑功能开发中...')
}

const deleteRecord = async (id) => {
  await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  
  try {
    await apiDeleteMoodRecord(id)
    ElMessage.success('删除成功')
    await loadRecords()
  } catch (error) {
    console.error('删除失败', error)
  }
}
</script>

<style scoped>
.record-page {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.create-card,
.history-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

.mood-selector {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 15px;
  width: 100%;
}

.mood-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.mood-option:hover {
  border-color: #409eff;
  transform: translateY(-3px);
}

.mood-option.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.mood-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.mood-label {
  font-size: 14px;
  color: #606266;
}

.mood-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mood-icon-table {
  font-size: 24px;
}
</style>




