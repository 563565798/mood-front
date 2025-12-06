<template>
  <div class="admin-dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card users">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
              <div class="stat-label">用户总数</div>
            </div>
            <el-icon class="stat-icon"><User /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card posts">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalShares || 0 }}</div>
              <div class="stat-label">帖子总数</div>
            </div>
            <el-icon class="stat-icon"><Document /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card comments">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalComments || 0 }}</div>
              <div class="stat-label">评论总数</div>
            </div>
            <el-icon class="stat-icon"><ChatDotRound /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-row :gutter="20" class="quick-actions">
      <el-col :span="8">
        <el-card class="action-card" @click="router.push('/admin/users')">
          <el-icon :size="40"><UserFilled /></el-icon>
          <h3>用户管理</h3>
          <p>查看和管理所有用户</p>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="action-card" @click="router.push('/admin/posts')">
          <el-icon :size="40"><Document /></el-icon>
          <h3>帖子管理</h3>
          <p>审核和管理心情分享</p>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="action-card" @click="router.push('/admin/comments')">
          <el-icon :size="40"><ChatDotRound /></el-icon>
          <h3>评论管理</h3>
          <p>审核和管理用户评论</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getStats } from '@/api/admin'
import { ElMessage } from 'element-plus'

const router = useRouter()
const stats = ref({})

onMounted(async () => {
  try {
    stats.value = await getStats()
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
})
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.stats-row {
  margin-bottom: 30px;
}

.stat-card {
  border-radius: 12px;
  border: none;
}

.stat-card.users {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.posts {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.comments {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

.stat-info {
  color: white;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.stat-icon {
  font-size: 48px;
  color: rgba(255, 255, 255, 0.5);
}

.quick-actions {
  margin-top: 20px;
}

.action-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.action-card h3 {
  margin: 15px 0 10px;
  color: #1e1e2d;
}

.action-card p {
  color: #a2a3b7;
  font-size: 14px;
}

.action-card .el-icon {
  color: #3699ff;
}
</style>
