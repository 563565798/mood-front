<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <el-icon :size="32"><MostlyCloudy /></el-icon>
        <span>情绪记录</span>
      </div>
      <el-menu
        :default-active="currentRoute"
        router
        background-color="#2c3e50"
        text-color="#ecf0f1"
        active-text-color="#3498db"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/record">
          <el-icon><Edit /></el-icon>
          <span>情绪记录</span>
        </el-menu-item>
        <el-menu-item index="/analysis">
          <el-icon><TrendCharts /></el-icon>
          <span>趋势分析</span>
        </el-menu-item>
        <el-menu-item index="/share">
          <el-icon><ChatDotSquare /></el-icon>
          <span>心情分享墙</span>
        </el-menu-item>
        <el-menu-item index="/message">
          <el-icon><Message /></el-icon>
          <span>私信</span>
          <el-badge v-if="unreadCount > 0" :value="unreadCount" class="menu-badge" />
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <span>个人中心</span>
        </el-menu-item>
        <el-menu-item v-if="isAdmin" index="/admin">
          <el-icon><Setting /></el-icon>
          <span>管理后台</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部栏 -->
      <el-header class="header">
        <div class="header-left">
          <h2>{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="36" :src="userInfo?.avatar || undefined">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="username">{{ userInfo?.nickname || userInfo?.username }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()

const currentRoute = computed(() => route.path)
const pageTitle = computed(() => route.meta.title || '情绪记录系统')
const userInfo = computed(() => userStore.userInfo)
const isAdmin = computed(() => userStore.isAdmin)
const unreadCount = computed(() => messageStore.unreadCount)

onMounted(async () => {
  if (!userStore.userInfo) {
    try {
      await userStore.getUserInfo()
    } catch (error) {
      console.error('获取用户信息失败', error)
    }
  }
  messageStore.loadUnreadCount()
  // 每分钟刷新未读数
  setInterval(() => messageStore.loadUnreadCount(), 60000)
})

const handleCommand = async (command) => {
  if (command === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    userStore.logout()
    ElMessage.success('退出成功')
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.sidebar {
  background-color: #2c3e50;
  color: #ecf0f1;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 60px;
  font-size: 20px;
  font-weight: bold;
  color: #ecf0f1;
  border-bottom: 1px solid #34495e;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  font-size: 20px;
  color: #2c3e50;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.username {
  color: #2c3e50;
}

.main-content {
  background: #f5f7fa;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}

/* 重置 Element Plus 的默认 padding */
:deep(.el-main) {
  padding: 0;
}

.menu-badge {
  margin-left: 5px;
}
</style>




