<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索用户名/昵称"
            style="width: 200px"
            clearable
          />
        </div>
      </template>

      <el-table :data="filteredUsers" v-loading="loading" stripe>
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="50" :src="row.avatar || undefined">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 1 ? 'danger' : 'info'">
              {{ row.role === 1 ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="shareCount" label="帖子数" width="80" />
        <el-table-column prop="createdAt" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                v-if="row.role !== 1"
                :type="row.status === 1 ? 'danger' : 'success'"
                size="small"
                @click="toggleUserStatus(row)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
              <el-button-group v-if="row.avatar">
                <el-button
                  type="primary"
                  size="small"
                  @click="viewAvatar(row)"
                >
                  查看头像
                </el-button>
                <el-button
                  v-if="row.role !== 1"
                  type="warning"
                  size="small"
                  @click="handleResetAvatar(row)"
                >
                  重置
                </el-button>
              </el-button-group>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadUsers"
        @current-change="loadUsers"
        class="pagination"
      />
    </el-card>

    <!-- 头像预览对话框 -->
    <el-dialog v-model="avatarDialogVisible" title="头像预览" width="400px">
      <div class="avatar-preview">
        <el-image :src="currentAvatar" fit="contain" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUserList, updateUserStatus, resetUserAvatar } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

const users = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const avatarDialogVisible = ref(false)
const currentAvatar = ref('')
const pagination = ref({
  page: 1,
  size: 10,
  total: 0
})

const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value
  const keyword = searchKeyword.value.toLowerCase()
  return users.value.filter(u =>
    u.username?.toLowerCase().includes(keyword) ||
    u.nickname?.toLowerCase().includes(keyword)
  )
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await getUserList(pagination.value.page, pagination.value.size)
    users.value = res.list || []
    pagination.value.total = res.total || 0
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const toggleUserStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 0 ? '禁用' : '启用'
  
  await ElMessageBox.confirm(`确定要${action}用户 "${row.username}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  
  try {
    await updateUserStatus(row.id, newStatus)
    ElMessage.success(`${action}成功`)
    loadUsers()
  } catch (error) {
    ElMessage.error(`${action}失败`)
  }
}

const viewAvatar = (row) => {
  currentAvatar.value = row.avatar
  avatarDialogVisible.value = true
}

const handleResetAvatar = async (row) => {
  await ElMessageBox.confirm(`确定要将用户 "${row.username}" 的头像重置为默认吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  
  try {
    await resetUserAvatar(row.id)
    ElMessage.success('头像已重置')
    loadUsers()
  } catch (error) {
    ElMessage.error('重置头像失败')
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
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

.avatar-preview {
  text-align: center;
}

.avatar-preview .el-image {
  max-width: 300px;
  max-height: 300px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}
</style>
