<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-wrapper">
          <svg class="mood-logo" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
            <defs>
              <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#fff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="url(#logo-gradient)" opacity="0.4"/>
            <path d="M512 140c-205.4 0-372 166.6-372 372s166.6 372 372 372 372-166.6 372-372-166.6-372-372-372z m0 680c-170 0-308-138-308-308s138-308 308-308 308 138 308 308-138 308-308 308z" fill="url(#logo-gradient)" opacity="0.6"/>
            <circle cx="350" cy="400" r="40" fill="#fff" filter="url(#glow)"/>
            <circle cx="674" cy="400" r="40" fill="#fff" filter="url(#glow)"/>
            <path d="M350 580 c0 0 80 100 162 100 82 0 162-100 162-100" stroke="#fff" stroke-width="40" stroke-linecap="round" fill="none" filter="url(#glow)"/>
          </svg>
        </div>
        <h1>情绪记录系统</h1>
        <p>记录每一刻心情，发现生活的美好</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          :loading="loading"
          class="login-button"
          @click="handleLogin"
        >
          登录
        </el-button>

        <div class="login-footer">
          <span>还没有账号？</span>
          <el-link type="primary" @click="$router.push('/register')">
            立即注册
          </el-link>
          <el-divider direction="vertical" />
          <el-link type="info" @click="showResetDialog = true">
            忘记密码?
          </el-link>
        </div>
      </el-form>
    </div>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="showResetDialog"
      title="重置密码"
      width="500px"
    >
      <el-form
        ref="resetFormRef"
        :model="resetForm"
        :rules="resetRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="resetForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="resetForm.email"
            placeholder="请输入注册时的邮箱"
            :prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetForm.newPassword"
            type="password"
            placeholder="请输入新密码(至少6位)"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showResetDialog = false">取消</el-button>
        <el-button type="primary" :loading="resetting" @click="handleResetPassword">
          确认重置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = ref({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(loginForm.value)
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } catch (error) {
        console.error('登录失败', error)
      } finally {
        loading.value = false
      }
    }
  })
}


// 重置密码相关逻辑
import { resetPassword } from '@/api/auth'
import { Message } from '@element-plus/icons-vue'

const showResetDialog = ref(false)
const resetFormRef = ref(null)
const resetting = ref(false)

const resetForm = ref({
  username: '',
  email: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== resetForm.value.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const resetRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/, message: '密码必须包含字母和数字，长度6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleResetPassword = async () => {
  await resetFormRef.value.validate(async (valid) => {
    if (valid) {
      resetting.value = true
      try {
        await resetPassword(resetForm.value)
        ElMessage.success('密码重置成功,请使用新密码登录')
        showResetDialog.value = false
        // 重置表单
        resetForm.value = {
          username: '',
          email: '',
          newPassword: '',
          confirmPassword: ''
        }
      } catch (error) {
        console.error('密码重置失败', error)
      } finally {
        resetting.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.login-box {
  width: 90%;
  max-width: 500px; /* Reduced width for better proportion */
  padding: 50px 40px;
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

/* Logo Styles */
.mood-logo {
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}

.login-header h1 {
  margin: 15px 0 10px;
  font-size: 32px;
  font-weight: 600;
  color: #fff; /* Changed to white for contrast on glass */
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.login-header p {
  color: #eee; /* Lightened for contrast */
  font-size: 16px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.login-form {
  margin-top: 30px;
}

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.8);
}

:deep(.el-input__wrapper.is-focus) {
  background: #fff;
}

.login-button {
  width: 100%;
  margin-top: 10px;
  height: 40px;
  font-size: 16px;
  background: linear-gradient(to right, #667eea, #764ba2);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.login-footer {
  text-align: center;
  margin-top: 25px;
  color: #fff;
  font-size: 14px;
}

:deep(.el-link) {
  color: #fff !important;
  font-weight: 500;
}

:deep(.el-link:hover) {
  color: #e0e0e0 !important;
  text-decoration: underline;
}

:deep(.el-divider--vertical) {
  border-left-color: rgba(255,255,255,0.5);
}
</style>




