<template>
  <div class="message-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-radio-group v-model="activeTab" @change="handleTabChange">
            <el-radio-button label="inbox">
              收件箱
              <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="unread-badge" />
            </el-radio-button>
            <el-radio-button label="outbox">发件箱</el-radio-button>
          </el-radio-group>
          <div class="header-actions">
            <el-switch
              v-model="isMsgOpen"
              active-text="接收私信"
              inactive-text="拒收私信"
              inline-prompt
              style="margin-right: 15px"
              @change="handleToggleMsgStatus"
            />
            <el-button type="primary" @click="showSendDialog = true">
              <el-icon><ChatDotSquare /></el-icon>写私信
            </el-button>
            <el-button v-if="activeTab === 'inbox'" @click="handleMarkAllRead">
              全部已读
            </el-button>
          </div>
        </div>
      </template>

      <el-table 
        :data="messages" 
        v-loading="loading" 
        stripe 
        @row-click="handleRowClick"
        class="message-table"
      >
        <el-table-column v-if="activeTab === 'inbox'" label="发送者" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="32" :src="row.senderAvatar || undefined">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span>{{ row.senderNickname || row.senderUsername }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'outbox'" label="接收者" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="32" :src="row.receiverAvatar || undefined">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span>{{ row.receiverNickname || row.receiverUsername }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容">
          <template #default="{ row }">
            <el-tooltip content="点击查看详情" placement="top" :show-after="500">
              <div class="message-content-cell">
                <el-badge v-if="activeTab === 'inbox' && row.isRead === 0" is-dot class="new-dot" />
                <span class="message-text">{{ row.content }}</span>
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'inbox'" label="操作" width="180">
          <template #default="{ row }">
            <el-button
              v-if="row.isRead === 0"
              type="primary"
              size="small"
              text
              @click.stop="handleMarkRead(row)"
            >
              标记已读
            </el-button>
            <el-button
              type="primary"
              size="small"
              text
              @click.stop="handleReply(row)"
            >
              回复
            </el-button>
            <el-button
              type="danger"
              size="small"
              text
              @click.stop="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'outbox'" label="操作" width="100">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              text
              @click.stop="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && messages.length === 0" description="暂无消息" />

      <el-pagination
        v-if="pagination.total > 0"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadMessages"
        @current-change="loadMessages"
        class="pagination"
      />
    </el-card>

    <!-- 发送私信对话框 -->
    <el-dialog v-model="showSendDialog" title="发送私信" width="500px">
      <el-form :model="sendForm" :rules="sendRules" ref="sendFormRef" label-width="80px">
        <el-form-item label="接收者" prop="receiverUsername">
          <el-input v-model="sendForm.receiverUsername" placeholder="输入用户名" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="sendForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入私信内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSendDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSend" :loading="sending">发送</el-button>
      </template>
    </el-dialog>

    <!-- 消息详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="消息详情" width="500px">
      <div v-if="currentMessage" class="message-detail">
        <div class="detail-header">
          <div class="user-info-large">
            <el-avatar :size="50" :src="(activeTab === 'inbox' ? currentMessage.senderAvatar : currentMessage.receiverAvatar) || undefined">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="user-meta">
              <span class="username">{{ activeTab === 'inbox' ? (currentMessage.senderNickname || currentMessage.senderUsername) : (currentMessage.receiverNickname || currentMessage.receiverUsername) }}</span>
              <span class="time">{{ formatDate(currentMessage.createdAt) }}</span>
            </div>
          </div>
        </div>
        <div class="detail-content">
          {{ currentMessage.content }}
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button 
          v-if="activeTab === 'inbox'" 
          type="primary" 
          @click="handleReplyFromDetail"
        >
          回复
        </el-button>
        <!-- 标记已读按钮（如果是未读） -->
        <el-button 
          v-if="activeTab === 'inbox' && currentMessage?.isRead === 0" 
          type="success" 
          @click="handleMarkRead(currentMessage)"
        >
          标记已读
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getInbox, getOutbox, sendMessage, markAsRead, markAllAsRead, deleteMessage } from '@/api/message'
import { getCurrentUser, updateMsgStatus } from '@/api/auth'
import { useMessageStore } from '@/stores/message'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const route = useRoute()
const messageStore = useMessageStore()
const unreadCount = computed(() => messageStore.unreadCount)

const activeTab = ref('inbox')
const messages = ref([])
const loading = ref(false)
const showSendDialog = ref(false)
const sending = ref(false)
const sendFormRef = ref(null)
const pagination = ref({
  page: 1,
  size: 10,
  total: 0
})

const sendForm = ref({
  receiverUsername: '',
  content: ''
})

const sendRules = {
  receiverUsername: [{ required: true, message: '请输入接收者用户名', trigger: 'blur' }],
  content: [{ required: true, message: '请输入私信内容', trigger: 'blur' }]
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadMessages = async () => {
  loading.value = true
  try {
    const api = activeTab.value === 'inbox' ? getInbox : getOutbox
    const res = await api(pagination.value.page, pagination.value.size)
    messages.value = res.list || []
    pagination.value.total = res.total || 0
  } catch (error) {
    ElMessage.error('获取消息失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  pagination.value.page = 1
  loadMessages()
}

const handleMarkRead = async (row) => {
  try {
    await markAsRead(row.id)
    row.isRead = 1
    messageStore.decrementUnread()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleMarkAllRead = async () => {
  if (unreadCount.value === 0) {
    ElMessage.info('无未读私信')
    return
  }
  try {
    await markAllAsRead()
    ElMessage.success('已全部标记为已读')
    // 更新列表中所有消息的状态
    messages.value.forEach(msg => {
      msg.isRead = 1
    })
    messageStore.clearUnread()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleReply = (row) => {
  sendForm.value.receiverUsername = row.senderUsername
  sendForm.value.content = ''
  showSendDialog.value = true
}

const handleSend = async () => {
  await sendFormRef.value.validate()
  
  sending.value = true
  try {
    // 先根据用户名查找用户ID
    const userRes = await request.get('/users/by-username', { 
      params: { username: sendForm.value.receiverUsername } 
    })
    
    await sendMessage({
      receiverId: userRes.id,
      content: sendForm.value.content
    })
    
    ElMessage.success('发送成功')
    showSendDialog.value = false
    sendForm.value = { receiverUsername: '', content: '' }
    
    if (activeTab.value === 'outbox') {
      loadMessages()
    }
  } catch (error) {
    // 全局拦截器已处理错误提示
    console.error(error)
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  loadMessages()
  messageStore.loadUnreadCount()
  loadUserMsgStatus()
  
  if (route.query.to) {
    sendForm.value.receiverUsername = route.query.to
    showSendDialog.value = true
  }
})

// 详情相关
const detailDialogVisible = ref(false)
const currentMessage = ref(null)

const handleRowClick = (row) => {
  currentMessage.value = row
  detailDialogVisible.value = true
  
  // 如果是未读收件箱消息，自动标记已读
  if (activeTab.value === 'inbox' && row.isRead === 0) {
    handleMarkRead(row)
  }
}

const handleReplyFromDetail = () => {
  detailDialogVisible.value = false
  handleReply(currentMessage.value)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除这条消息吗？此操作不可恢复。',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await deleteMessage(row.id)
      ElMessage.success('删除成功')
      // 如果是未读消息被删除，更新未读数
      if (activeTab.value === 'inbox' && row.isRead === 0) {
        messageStore.decrementUnread()
      }
      // 刷新列表
      if (messages.value.length === 1 && pagination.value.page > 1) {
        pagination.value.page--
      }
      await loadMessages()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 私信开关逻辑
const isMsgOpen = ref(true)

const loadUserMsgStatus = async () => {
  try {
    const user = await getCurrentUser()
    // 如果后端返回null，默认为开启(1)
    isMsgOpen.value = user.isMsgOpen !== 0
  } catch (error) {
    console.error('获取用户设置失败', error)
  }
}

const handleToggleMsgStatus = async (val) => {
  try {
    const status = val ? 1 : 0
    await updateMsgStatus(status)
    ElMessage.success(val ? '已开启私信接收' : '已关闭私信接收')
  } catch (error) {
    // 恢复开关状态
    isMsgOpen.value = !val
    ElMessage.error('操作失败')
  }
}
</script>

<style scoped>
.message-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unread-badge {
  margin-left: 5px;
}

.new-dot {
  margin-right: 8px;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}

.message-table :deep(.el-table__row) {
  cursor: pointer;
}

.message-detail {
  padding: 10px;
}

.detail-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
}

.user-info-large {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-meta .username {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.user-meta .time {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.detail-content {
  font-size: 15px;
  line-height: 1.6;
  color: #606266;
  min-height: 100px;
  white-space: pre-wrap;
}

.message-content-cell {
  display: flex;
  align-items: center;
  width: 100%;
}

.message-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
