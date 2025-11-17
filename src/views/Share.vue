<template>
  <div class="share-page">
    <!-- 发布分享 -->
    <el-card shadow="hover" class="create-share-card">
      <template #header>
        <div class="card-header">
          <el-icon><ChatDotSquare /></el-icon>
          <span>匿名分享你的心情</span>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules">
        <el-form-item prop="moodTypeId">
          <div class="mood-selector-mini">
            <div
              v-for="moodType in moodTypes.slice(0, 12)"
              :key="moodType.id"
              class="mood-option-mini"
              :class="{ active: form.moodTypeId === moodType.id }"
              @click="form.moodTypeId = moodType.id"
            >
              <span>{{ moodType.icon }}</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="分享你此刻的心情...(最多500字)"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="form.anonymousName"
            placeholder="匿名昵称（选填，不填则随机生成）"
            style="width: 200px; margin-right: 10px"
          />
          <el-button type="primary" @click="submitShare" :loading="submitting">
            匿名发布
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 分享墙 -->
    <el-card shadow="hover" class="share-wall-card">
      <template #header>
        <div class="card-header">
          <el-icon><Message /></el-icon>
          <span>心情分享墙</span>
          <el-button type="primary" link @click="loadShares">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
        </div>
      </template>

      <div v-loading="loading" class="share-list">
        <div v-for="share in shares" :key="share.id" class="share-item">
          <div class="share-header">
            <div class="share-user">
              <span class="mood-icon-large">{{ share.moodType?.icon }}</span>
              <div class="user-info">
                <span class="username">{{ share.anonymousName }}</span>
                <span class="time">{{ formatTime(share.createdAt) }}</span>
              </div>
            </div>
          </div>

          <div class="share-content">
            {{ share.content }}
          </div>

          <div class="share-footer">
            <div class="share-actions">
              <el-button
                link
                :type="share.isLiked ? 'primary' : 'default'"
                @click="toggleLike(share)"
              >
                <el-icon><Star /></el-icon>
                {{ share.likeCount || 0 }}
              </el-button>

              <el-button link>
                <el-icon><ChatDotRound /></el-icon>
                {{ share.commentCount || 0 }}
              </el-button>
            </div>
          </div>
        </div>

        <el-empty v-if="shares.length === 0" description="还没有人分享，来做第一个吧！" />
      </div>

      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, prev, pager, next"
        @current-change="loadShares"
        style="margin-top: 20px; text-align: center"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMoodTypes } from '@/api/mood'
import { createMoodShare, getMoodSharePage, toggleLike as apiToggleLike } from '@/api/share'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const formRef = ref(null)
const moodTypes = ref([])
const shares = ref([])
const loading = ref(false)
const submitting = ref(false)

const form = ref({
  moodTypeId: null,
  content: '',
  anonymousName: ''
})

const pagination = ref({
  pageNum: 1,
  pageSize: 20,
  total: 0
})

const rules = {
  moodTypeId: [{ required: true, message: '请选择情绪', trigger: 'change' }],
  content: [
    { required: true, message: '请输入分享内容', trigger: 'blur' },
    { min: 1, max: 500, message: '内容长度在1-500字之间', trigger: 'blur' }
  ]
}

onMounted(async () => {
  await loadMoodTypes()
  await loadShares()
})

const loadMoodTypes = async () => {
  moodTypes.value = await getMoodTypes()
}

const loadShares = async () => {
  loading.value = true
  try {
    const data = await getMoodSharePage({
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    })
    shares.value = data.records || []
    pagination.value.total = data.total || 0
  } catch (error) {
    console.error('加载分享失败', error)
  } finally {
    loading.value = false
  }
}

const submitShare = async () => {
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await createMoodShare(form.value)
        ElMessage.success('分享成功')
        
        // 重置表单
        formRef.value.resetFields()
        form.value = {
          moodTypeId: null,
          content: '',
          anonymousName: ''
        }
        
        // 刷新列表
        pagination.value.pageNum = 1
        await loadShares()
      } catch (error) {
        console.error('发布分享失败', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

const toggleLike = async (share) => {
  try {
    await apiToggleLike(share.id)
    
    // 更新本地状态
    if (share.isLiked) {
      share.likeCount--
      share.isLiked = false
    } else {
      share.likeCount++
      share.isLiked = true
    }
  } catch (error) {
    console.error('点赞失败', error)
  }
}

const formatTime = (time) => {
  return dayjs(time).fromNow()
}
</script>

<style scoped>
.share-page {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.create-share-card,
.share-wall-card {
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

.mood-selector-mini {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.mood-option-mini {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.mood-option-mini:hover {
  border-color: #409eff;
  transform: scale(1.1);
}

.mood-option-mini.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.share-list {
  min-height: 400px;
}

.share-item {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.3s;
}

.share-item:hover {
  background-color: #f5f7fa;
}

.share-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.share-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mood-icon-large {
  font-size: 36px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username {
  font-weight: bold;
  color: #2c3e50;
}

.time {
  font-size: 12px;
  color: #909399;
}

.share-content {
  padding: 15px 0;
  line-height: 1.8;
  color: #606266;
  font-size: 15px;
}

.share-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
}

.share-actions {
  display: flex;
  gap: 15px;
}
</style>




