<template>
  <div class="profile-page">
    <!-- 用户信息卡片 -->
    <el-card shadow="hover" class="profile-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon><User /></el-icon>
            <span>个人信息</span>
          </div>
          <el-button 
            v-if="!isEditing" 
            type="primary" 
            @click="startEdit"
          >
            <el-icon><Edit /></el-icon>
            编辑资料
          </el-button>
        </div>
      </template>

      <div class="profile-content">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <el-avatar :size="120" :src="isEditing ? editForm.avatar : userInfo?.avatar || undefined">
            <el-icon :size="60"><UserFilled /></el-icon>
          </el-avatar>
          <div v-if="isEditing" class="avatar-edit">
            <el-upload
              class="avatar-uploader"
              :action="uploadUrl"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :on-success="handleAvatarSuccess"
              :on-error="handleAvatarError"
              :headers="uploadHeaders"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            >
              <el-button type="primary" :loading="uploading">
                <el-icon><Upload /></el-icon>
                {{ uploading ? '上传中...' : '选择图片' }}
              </el-button>
            </el-upload>
            <div class="avatar-tips">
              <el-text size="small" type="info">支持 jpg、png、gif、webp 格式，大小不超过 5MB</el-text>
            </div>
            <el-input
              v-model="editForm.avatar"
              placeholder="或直接输入图片URL"
              clearable
              style="margin-top: 10px"
            >
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
            </el-input>
          </div>
        </div>

        <!-- 信息展示/编辑区域 -->
        <div class="info-section">
          <!-- 查看模式 -->
          <el-descriptions v-if="!isEditing" :column="2" border>
            <el-descriptions-item label="用户名" :span="2">
              <el-tag>{{ userInfo?.username }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="昵称">
              {{ userInfo?.nickname || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">
              {{ userInfo?.email || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="性别">
              {{ getGenderText(userInfo?.gender) }}
            </el-descriptions-item>
            <el-descriptions-item label="生日">
              {{ userInfo?.birthday ? dayjs(userInfo.birthday).format('YYYY-MM-DD') : '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间" :span="2">
              {{ formatDate(userInfo?.createdAt) }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 编辑模式 -->
          <el-form
            v-else
            ref="formRef"
            :model="editForm"
            :rules="rules"
            label-width="100px"
            class="edit-form"
          >
            <el-form-item label="用户名">
              <el-input :value="userInfo?.username" disabled>
                <template #append>
                  <el-tooltip content="用户名不可修改" placement="top">
                    <el-icon><Lock /></el-icon>
                  </el-tooltip>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="昵称" prop="nickname">
              <el-input
                v-model="editForm.nickname"
                placeholder="请输入昵称"
                clearable
              />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="editForm.email"
                placeholder="请输入邮箱"
                clearable
              >
                <template #prepend>
                  <el-icon><Message /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="editForm.gender">
                <el-radio :label="0">未知</el-radio>
                <el-radio :label="1">男</el-radio>
                <el-radio :label="2">女</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="生日" prop="birthday">
              <el-date-picker
                v-model="editForm.birthday"
                type="date"
                placeholder="选择生日"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveEdit" :loading="saving">
                <el-icon><Select /></el-icon>
                保存修改
              </el-button>
              <el-button @click="cancelEdit">
                <el-icon><Close /></el-icon>
                取消
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>

    <!-- 统计信息卡片 -->
    <el-card shadow="hover" class="stats-card">
      <template #header>
        <div class="card-header">
          <el-icon><DataLine /></el-icon>
          <span>使用统计</span>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-icon" style="background: #ecf5ff; color: #409eff;">
              <el-icon :size="24"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">总记录数</div>
              <div class="stat-value">0</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-icon" style="background: #fef0f0; color: #f56c6c;">
              <el-icon :size="24"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">连续天数</div>
              <div class="stat-value">0</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <div class="stat-icon" style="background: #f4f4f5; color: #909399;">
              <el-icon :size="24"><ChatDotSquare /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">分享数</div>
              <div class="stat-value">0</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { updateCurrentUser } from '@/api/auth'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const isEditing = ref(false)
const saving = ref(false)
const uploading = ref(false)
const formRef = ref(null)

// 上传配置
const uploadUrl = import.meta.env.VITE_APP_BASE_API + '/files/upload'
const uploadHeaders = computed(() => ({
  'Authorization': 'Bearer ' + localStorage.getItem('token')
}))

const editForm = ref({
  nickname: '',
  email: '',
  avatar: '',
  gender: 0,
  birthday: null
})

const rules = {
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

onMounted(async () => {
  // 确保用户信息已加载
  if (!userInfo.value) {
    await userStore.getUserInfo()
  }
})

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const getGenderText = (gender) => {
  const genderMap = {
    0: '未知',
    1: '男',
    2: '女'
  }
  return genderMap[gender] || '未知'
}

const startEdit = () => {
  // 填充编辑表单
  editForm.value = {
    nickname: userInfo.value?.nickname || '',
    email: userInfo.value?.email || '',
    avatar: userInfo.value?.avatar || '',
    gender: userInfo.value?.gender ?? 0,
    birthday: userInfo.value?.birthday || null
  }
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  formRef.value?.resetFields()
}

const saveEdit = async () => {
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        await updateCurrentUser(editForm.value)
        ElMessage.success('更新成功')
        
        // 重新获取用户信息
        await userStore.getUserInfo()
        isEditing.value = false
      } catch (error) {
        console.error('更新失败', error)
      } finally {
        saving.value = false
      }
    }
  })
}

// 上传前验证
const beforeAvatarUpload = (file) => {
  const isImage = /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传 jpg、png、gif、webp 格式的图片!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  
  uploading.value = true
  return true
}

// 上传成功
const handleAvatarSuccess = (response) => {
  uploading.value = false
  if (response && response.code === 200) {
    editForm.value.avatar = response.data
    ElMessage.success('图片上传成功')
  } else {
    const errorMsg = response?.message || response?.msg || '上传失败'
    ElMessage.error(errorMsg)
  }
}

// 上传失败
const handleAvatarError = (error, file, fileList) => {
  uploading.value = false
  console.error('上传失败:', error)
  
  // 尝试从错误响应中获取错误信息
  let errorMsg = '图片上传失败，请重试'
  if (error && error.response) {
    const response = error.response
    if (response.data) {
      errorMsg = response.data.message || response.data.msg || errorMsg
    } else if (response.statusText) {
      errorMsg = response.statusText
    }
  } else if (error && error.message) {
    errorMsg = error.message
  }
  
  ElMessage.error(errorMsg)
}
</script>

<style scoped>
.profile-page {
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.profile-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: bold;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-content {
  display: flex;
  gap: 40px;
  padding: 20px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  min-width: 200px;
}

.avatar-edit {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.avatar-uploader {
  display: flex;
  justify-content: center;
}

.avatar-tips {
  text-align: center;
  margin-top: 5px;
}

.info-section {
  flex: 1;
}

.edit-form {
  max-width: 600px;
}

.stats-card {
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: transform 0.3s;
}

.stat-item:hover {
  transform: translateY(-3px);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
  }
  
  .edit-form {
    max-width: 100%;
  }
}
</style>
