import request from '@/utils/request'

/**
 * 获取所有情绪类型
 */
export function getMoodTypes() {
  return request({
    url: '/mood-types',
    method: 'get'
  })
}

/**
 * 创建情绪记录
 */
export function createMoodRecord(data) {
  return request({
    url: '/mood-records',
    method: 'post',
    data
  })
}

/**
 * 更新情绪记录
 */
export function updateMoodRecord(id, data) {
  return request({
    url: `/mood-records/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除情绪记录
 */
export function deleteMoodRecord(id) {
  return request({
    url: `/mood-records/${id}`,
    method: 'delete'
  })
}

/**
 * 分页查询情绪记录
 */
export function getMoodRecordPage(params) {
  return request({
    url: '/mood-records',
    method: 'get',
    params
  })
}

/**
 * 获取情绪记录详情
 */
export function getMoodRecordDetail(id) {
  return request({
    url: `/mood-records/${id}`,
    method: 'get'
  })
}

/**
 * 获取情绪统计数据
 */
export function getMoodStatistics(params) {
  return request({
    url: '/mood-records/statistics',
    method: 'get',
    params
  })
}




