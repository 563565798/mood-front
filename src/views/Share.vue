<template>
  <div class="share-page">
    <!-- 发布分享 -->
    <el-card shadow="hover" class="create-share-card">
      <template #header>
        <div class="card-header">
          <el-icon><ChatDotSquare /></el-icon>
          <span>分享你的心情</span>
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
          <div class="publish-options">
            <el-switch v-model="form.isAnonymous" active-text="匿名发布" inactive-text="" />
            <el-input
              v-if="form.isAnonymous"
              v-model="form.anonymousName"
              placeholder="匿名昵称（选填，不填则随机生成）"
              style="width: 200px; margin-left: 10px"
            />
            <el-button type="primary" @click="submitShare" :loading="submitting" style="margin-left: auto">
              发布
            </el-button>
          </div>
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
              <div class="user-info" v-if="share.isAnonymous || !share.nickname">
                <!-- 匿名用户 -->
                <span class="username">{{ share.anonymousName }}</span>
                <span class="time">{{ formatTime(share.createdAt) }}</span>
              </div>
              <div class="user-info clickable" v-else @click="showUserProfile(share)">
                <!-- 实名用户，可点击查看资料 -->
                <el-avatar :size="36" :src="share.avatar || undefined">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <div class="user-detail">
                  <span class="nickname">{{ share.nickname }}</span>
                  <span class="time">{{ formatTime(share.createdAt) }}</span>
                </div>
              </div>
            </div>
            <!-- 作者可以删除分享 -->
            <el-button 
              v-if="share.isOwner" 
              type="danger" 
              link 
              size="small"
              @click="handleDeleteShare(share)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
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

              <el-button link @click="openComments(share)">
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

    <!-- 评论弹窗 -->
    <el-dialog
      v-model="commentVisible"
      title="评论详情"
      width="600px"
      destroy-on-close
    >
      <div class="comment-container" v-loading="commentLoading">
        <!-- 评论列表 -->
        <div class="comment-list" v-if="comments.length > 0">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <!-- 匿名评论 -->
              <span v-if="comment.isAnonymous || !comment.nickname" class="comment-user">
                {{ comment.anonymousName }}
                <el-tag v-if="comment.isOwner" size="small" type="warning" effect="plain">作者</el-tag>
              </span>
              <!-- 实名评论 - 可点击查看资料 -->
              <div v-else class="comment-user-info clickable" @click="showCommentUserProfile(comment)">
                <el-avatar :size="28" :src="comment.avatar || undefined">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span class="comment-nickname">{{ comment.nickname }}</span>
                <el-tag v-if="comment.isOwner" size="small" type="warning" effect="plain">作者</el-tag>
              </div>
              <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
            </div>
            
            <div class="comment-content">
              <span v-if="comment.parentId" class="reply-target">回复 @{{ comment.replyToName }}: </span>
              {{ comment.content }}
            </div>
            
            <div class="comment-actions">
              <el-button link type="primary" size="small" @click="replyTo(comment)">回复</el-button>
              <el-button 
                v-if="comment.canDelete" 
                link 
                type="danger" 
                size="small" 
                @click="handleDeleteComment(comment.id)"
              >删除</el-button>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无评论，快来抢沙发~" :image-size="100" />
        
        <!-- 发表评论 -->
        <div class="comment-form">
          <div v-if="replyTarget" class="reply-preview">
            <el-tag closable @close="cancelReply" type="info">
              回复 @{{ replyTarget.nickname || replyTarget.anonymousName }}
            </el-tag>
          </div>
          <div class="input-area">
            <el-input
              v-model="commentContent"
              type="textarea"
              :rows="2"
              :placeholder="replyTarget ? `回复 @${replyTarget.nickname || replyTarget.anonymousName}...` : '写下你的评论...'"
              maxlength="300"
              show-word-limit
            />
            <div class="comment-submit-area">
              <el-switch v-model="commentAnonymous" active-text="匿名" size="small" />
              <el-button type="primary" @click="submitComment" :loading="commentSubmitting">
                发送
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 用户资料弹窗 -->
    <el-dialog v-model="userProfileVisible" title="用户资料" width="400px">
      <div class="user-profile-card" v-if="selectedUser">
        <div class="profile-header">
          <el-avatar :size="80" :src="selectedUser.avatar || undefined">
            <el-icon :size="40"><User /></el-icon>
          </el-avatar>
          <h3>{{ selectedUser.nickname || selectedUser.username }}</h3>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户名">{{ selectedUser.username }}</el-descriptions-item>
          <el-descriptions-item label="性别">
            {{ selectedUser.gender === 1 ? '男' : selectedUser.gender === 2 ? '女' : '保密' }}
          </el-descriptions-item>
          <el-descriptions-item label="生日" v-if="selectedUser.birthday">
            {{ selectedUser.birthday }}
          </el-descriptions-item>
          <el-descriptions-item label="注册时间" v-if="selectedUser.userCreatedAt">
            {{ formatDate(selectedUser.userCreatedAt) }}
          </el-descriptions-item>
        </el-descriptions>
        <div class="profile-actions">
          <el-button type="primary" @click="sendMessageToUser">
            <el-icon><ChatDotSquare /></el-icon>发送私信
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMoodTypes } from '@/api/mood'
import { 
  createMoodShare, 
  getMoodSharePage, 
  toggleLike as apiToggleLike, 
  deleteMoodShare,
  getShareComments,
  addShareComment,
  deleteShareComment
} from '@/api/share'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotSquare, Message, Refresh, Star, ChatDotRound, Delete, User } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()

const formRef = ref(null)
const moodTypes = ref([])
const shares = ref([])
const loading = ref(false)
const submitting = ref(false)

const form = ref({
  moodTypeId: null,
  content: '',
  anonymousName: '',
  isAnonymous: false
})

const pagination = ref({
  pageNum: 1,
  pageSize: 20,
  total: 0
})

// 评论相关
const commentVisible = ref(false)
const commentLoading = ref(false)
const commentSubmitting = ref(false)
const comments = ref([])
const currentShareId = ref(null)
const commentContent = ref('')
const replyTarget = ref(null)
const commentAnonymous = ref(false)

// 用户资料弹窗
const userProfileVisible = ref(false)
const selectedUser = ref(null)

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
          anonymousName: '',
          isAnonymous: false
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

const handleDeleteShare = (share) => {
  ElMessageBox.confirm(
    '确定要删除这条分享吗？此操作不可恢复。',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await deleteMoodShare(share.id)
      ElMessage.success('删除成功')
      loadShares()
    } catch (error) {
      console.error('删除分享失败', error)
    }
  }).catch(() => {})
}

// 评论功能
const openComments = async (share) => {
  currentShareId.value = share.id
  commentVisible.value = true
  replyTarget.value = null
  commentContent.value = ''
  await loadComments(share.id)
}

const loadComments = async (shareId) => {
  commentLoading.value = true
  try {
    comments.value = await getShareComments(shareId)
  } catch (error) {
    console.error('加载评论失败', error)
  } finally {
    commentLoading.value = false
  }
}

const replyTo = (comment) => {
  replyTarget.value = comment
  // 聚焦输入框 (simple implementation, usually via ref)
}

const cancelReply = () => {
  replyTarget.value = null
}

const submitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  commentSubmitting.value = true
  try {
    await addShareComment({
      shareId: currentShareId.value,
      content: commentContent.value,
      parentId: replyTarget.value ? replyTarget.value.id : null,
      isAnonymous: commentAnonymous.value
    })
    ElMessage.success('评论成功')
    commentContent.value = ''
    replyTarget.value = null
    commentAnonymous.value = false
    
    // 刷新评论和分享列表（更新评论数）
    await loadComments(currentShareId.value)
    // Update comment count in list locally
    const share = shares.value.find(s => s.id === currentShareId.value)
    if (share) {
      share.commentCount = (share.commentCount || 0) + 1
    }
  } catch (error) {
    console.error('发表评论失败', error)
  } finally {
    commentSubmitting.value = false
  }
}

const handleDeleteComment = (commentId) => {
  ElMessageBox.confirm(
    '确定要删除这条评论吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await deleteShareComment(commentId)
      ElMessage.success('删除成功')
      await loadComments(currentShareId.value)
      // Update comment count in list locally
      const share = shares.value.find(s => s.id === currentShareId.value)
      if (share && share.commentCount > 0) {
        share.commentCount--
      }
    } catch (error) {
      console.error('删除评论失败', error)
    }
  }).catch(() => {})
}

const formatTime = (time) => {
  return dayjs(time).fromNow()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD')
}

// 显示用户资料
const showUserProfile = (share) => {
  selectedUser.value = {
    userId: share.userId,
    username: share.username,
    nickname: share.nickname,
    avatar: share.avatar,
    gender: share.gender,
    birthday: share.birthday,
    userCreatedAt: share.userCreatedAt
  }
  userProfileVisible.value = true
}

// 显示评论用户资料
const showCommentUserProfile = (comment) => {
  selectedUser.value = {
    userId: comment.userId,
    username: comment.username,
    nickname: comment.nickname,
    avatar: comment.avatar,
    gender: comment.gender,
    birthday: comment.birthday,
    userCreatedAt: comment.userCreatedAt
  }
  userProfileVisible.value = true
}

// 发送私信给用户
const sendMessageToUser = () => {
  userProfileVisible.value = false
  router.push({
    path: '/message',
    query: { to: selectedUser.value.username }
  })
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
  flex-wrap: wrap;
  gap: 10px;
}

.mood-option-mini {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f5f7fa;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s;
}

.mood-option-mini:hover {
  transform: scale(1.1);
}

.mood-option-mini.active {
  background-color: #e6f7ff;
  border: 2px solid #409eff;
}

.share-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.share-item {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 20px;
}

.share-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.share-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.share-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mood-icon-large {
  font-size: 32px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: bold;
  font-size: 14px;
  color: #303133;
}

.time {
  font-size: 12px;
  color: #909399;
}

.share-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
  white-space: pre-wrap;
}

.share-actions {
  display: flex;
  gap: 20px;
}

/* 评论相关样式 */
.comment-container {
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.comment-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
  max-height: 350px;
}

.comment-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.comment-user {
  font-weight: bold;
  font-size: 13px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 5px;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-content {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
  line-height: 1.5;
}

.reply-target {
  color: #409eff;
  margin-right: 5px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.comment-form {
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.reply-preview {
  margin-bottom: 10px;
}

.input-area {
  display: flex;
  gap: 10px;
}

.input-area .el-input {
  flex: 1;
}

/* 发布选项 */
.publish-options {
  display: flex;
  align-items: center;
  width: 100%;
}

/* 可点击用户信息 */
.user-info.clickable {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 5px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.user-info.clickable:hover {
  background-color: #f5f7fa;
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-weight: bold;
  font-size: 14px;
  color: #409eff;
}

/* 用户资料卡片 */
.user-profile-card {
  text-align: center;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.profile-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.profile-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 评论用户信息 */
.comment-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-nickname {
  font-weight: bold;
  font-size: 13px;
  color: #409eff;
}

.comment-submit-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}
</style>
