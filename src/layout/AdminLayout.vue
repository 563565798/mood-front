<template>
  <el-container class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <el-icon :size="32"><Setting /></el-icon>
        <span>管理后台</span>
      </div>
      <el-menu
        :default-active="currentRoute"
        router
        background-color="#1e1e2d"
        text-color="#a2a3b7"
        active-text-color="#3699ff"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/posts">
          <el-icon><Document /></el-icon>
          <span>帖子管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/comments">
          <el-icon><ChatDotRound /></el-icon>
          <span>评论管理</span>
        </el-menu-item>
        <el-divider />
        <el-menu-item index="/dashboard">
          <el-icon><Back /></el-icon>
          <span>返回前台</span>
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
              <el-tag type="danger" size="small">管理员</el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="front">
                  <el-icon><Back /></el-icon>返回前台
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
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const currentRoute = computed(() => route.path)
const pageTitle = computed(() => route.meta.title || '管理后台')
const userInfo = computed(() => userStore.userInfo)

onMounted(async () => {
  if (!userStore.userInfo) {
    try {
      await userStore.getUserInfo()
    } catch (error) {
      console.error('获取用户信息失败', error)
    }
  }
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
  } else if (command === 'front') {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.sidebar {
  background-color: #1e1e2d;
  color: #a2a3b7;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 60px;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  border-bottom: 1px solid #2d2d3f;
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
  color: #1e1e2d;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.username {
  color: #1e1e2d;
  margin-right: 8px;
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
}

.el-divider {
  margin: 10px 16px;
  border-color: #2d2d3f;
}
</style>
