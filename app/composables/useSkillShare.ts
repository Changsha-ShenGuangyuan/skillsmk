/**
 * useSkillShare
 * 封装分享菜单的开关控制、分享到各平台、复制链接等逻辑
 *
 * @param skillName  - 技能名称（响应式）
 * @param t          - i18n 翻译函数
 * @param shareMenuRef - 分享菜单容器的模板 ref（由调用方在组件内声明并传入），
 *                       用于检测点击外部区域以自动关闭菜单
 */
import { ref, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export function useSkillShare(
  skillName: Ref<string | undefined>,
  t: (key: string, fallback: string) => string,
  shareMenuRef: Ref<HTMLElement | null>
) {
  const isShareMenuOpen = ref(false)
  const isCopiedLink    = ref(false)

  function toggleShareMenu() {
    isShareMenuOpen.value = !isShareMenuOpen.value
  }

  function closeShareMenu() {
    isShareMenuOpen.value = false
  }

  function handleClickOutside(e: MouseEvent) {
    if (shareMenuRef.value && !shareMenuRef.value.contains(e.target as Node)) {
      closeShareMenu()
    }
  }

  onMounted(()  => document.addEventListener('mousedown', handleClickOutside))
  onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

  // 分享到 X (Twitter)
  function shareToX() {
    const url  = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(
      `${t('detail.shareText', '发现了一个很棒的 Agent Skill')}${skillName.value || ''} - ${t('detail.shareInvite', '快来 SKILLMK 看看！')}`
    )
    window.open(`https://x.com/intent/tweet?url=${url}&text=${text}`, '_blank')
    closeShareMenu()
  }

  // 分享到 WhatsApp
  function shareToWhatsApp() {
    const text = encodeURIComponent(
      `${t('detail.shareText', '发现了一个很棒的 Agent Skill')}${skillName.value || ''} - ${window.location.href}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
    closeShareMenu()
  }

  // 复制链接
  async function copyShareLink() {
    try {
      isCopiedLink.value = true
      await copyToClipboard(window.location.href)
      setTimeout(() => {
        isCopiedLink.value = false
        closeShareMenu()
      }, 1500)
    } catch (err) {
      console.error('Failed to copy url:', err)
      isCopiedLink.value = false
    }
  }

  return {
    isShareMenuOpen,
    isCopiedLink,
    toggleShareMenu,
    shareToX,
    shareToWhatsApp,
    copyShareLink,
  }
}
