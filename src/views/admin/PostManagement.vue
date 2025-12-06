<template>
  <div class="post-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>帖子管理</span>
          <el-radio-group v-model="statusFilter" @change="loadPosts">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="active">正常</el-radio-button>
            <el-radio-button label="deleted">已删除</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="filteredPosts" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="发布者" width="120">
          <template #default="{ row }">
            <span>{{ row.nickname || row.username || '匿名用户' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="anonymousName" label="匿名昵称" width="120" />
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column label="情绪" width="80">
          <template #default="{ row }">
            <span v-if="row.moodType">{{ row.moodType.icon }} {{ row.moodType.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="likeCount" label="点赞" width="70" />
        <el-table-column prop="commentCount" label="评论" width="70" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isDeleted === 0 ? 'success' : 'danger'">
              {{ row.isDeleted === 0 ? '正常' : '已删除' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发布时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="{ row }">
            <el-button
              :type="row.isDeleted === 0 ? 'danger' : 'success'"
              size="small"
              @click="toggleDeleteStatus(row)"
            >
              {{ row.isDeleted === 0 ? '删除' : '恢复' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadPosts"
        @current-change="loadPosts"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getShareList, updateShareDeleteStatus } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

const posts = ref([])
const loading = ref(false)
const statusFilter = ref('all')
const pagination = ref({
  page: 1,
  size: 10,
  total: 0
})

const filteredPosts = computed(() => {
  if (statusFilter.value === 'all') return posts.value
  if (statusFilter.value === 'active') return posts.value.filter(p => p.isDeleted === 0)
  return posts.value.filter(p => p.isDeleted === 1)
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadPosts = async () => {
  loading.value = true
  try {
    const res = await getShareList(pagination.value.page, pagination.value.size)
    posts.value = res.list || []
    pagination.value.total = res.total || 0
  } catch (error) {
    ElMessage.error('获取帖子列表失败')
  } finally {
    loading.value = false
  }
}

const toggleDeleteStatus = async (row) => {
  const newStatus = row.isDeleted === 0 ? 1 : 0
  const action = newStatus === 1 ? '删除' : '恢复'
  
  await ElMessageBox.confirm(`确定要${action}这条帖子吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  
  try {
    await updateShareDeleteStatus(row.id, newStatus)
    ElMessage.success(`${action}成功`)
    loadPosts()
  } catch (error) {
    ElMessage.error(`${action}失败`)
  }
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.post-management {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
