import { defineStore } from 'pinia'
import { getUnreadCount } from '@/api/message'

export const useMessageStore = defineStore('message', {
    state: () => ({
        unreadCount: 0
    }),

    actions: {
        async loadUnreadCount() {
            try {
                this.unreadCount = await getUnreadCount()
            } catch (error) {
                console.error('获取未读数失败', error)
            }
        },

        decrementUnread() {
            if (this.unreadCount > 0) {
                this.unreadCount--
            }
        },

        clearUnread() {
            this.unreadCount = 0
        }
    }
})
