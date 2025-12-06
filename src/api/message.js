import request from '@/utils/request'

// 发送私信
export const sendMessage = (data) => {
    return request.post('/messages', data)
}

// 获取收件箱
export const getInbox = (page = 1, size = 10) => {
    return request.get('/messages/inbox', { params: { page, size } })
}

// 获取发件箱
export const getOutbox = (page = 1, size = 10) => {
    return request.get('/messages/outbox', { params: { page, size } })
}

// 标记为已读
export const markAsRead = (id) => {
    return request.put(`/messages/${id}/read`)
}

// 标记所有为已读
export const markAllAsRead = () => {
    return request.put('/messages/read-all')
}

// 获取未读数
export const getUnreadCount = () => {
    return request.get('/messages/unread-count')
}
