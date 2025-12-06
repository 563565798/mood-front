import request from '@/utils/request'

// 获取用户列表
export const getUserList = (page = 1, size = 10) => {
    return request.get('/admin/users', { params: { page, size } })
}

// 更新用户状态
export const updateUserStatus = (id, status) => {
    return request.put(`/admin/users/${id}/status`, null, { params: { status } })
}

// 重置用户头像
export const resetUserAvatar = (id) => {
    return request.put(`/admin/users/${id}/reset-avatar`)
}

// 获取帖子列表
export const getShareList = (page = 1, size = 10) => {
    return request.get('/admin/shares', { params: { page, size } })
}

// 更新帖子删除状态
export const updateShareDeleteStatus = (id, isDeleted) => {
    return request.put(`/admin/shares/${id}/delete-status`, null, { params: { isDeleted } })
}

// 获取评论列表
export const getCommentList = (page = 1, size = 10) => {
    return request.get('/admin/comments', { params: { page, size } })
}

// 更新评论删除状态
export const updateCommentDeleteStatus = (id, isDeleted) => {
    return request.put(`/admin/comments/${id}/delete-status`, null, { params: { isDeleted } })
}

// 获取统计数据
export const getStats = () => {
    return request.get('/admin/stats')
}
