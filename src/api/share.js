import request from '@/utils/request'

/**
 * 创建分享
 */
export function createMoodShare(data) {
  return request({
    url: '/mood-shares',
    method: 'post',
    data
  })
}

/**
 * 删除分享
 */
export function deleteMoodShare(id) {
  return request({
    url: `/mood-shares/${id}`,
    method: 'delete'
  })
}

/**
 * 分页查询分享列表
 */
export function getMoodSharePage(params) {
  return request({
    url: '/mood-shares',
    method: 'get',
    params
  })
}

/**
 * 点赞/取消点赞
 */
export function toggleLike(id) {
  return request({
    url: `/mood-shares/${id}/like`,
    method: 'post'
  })
}




