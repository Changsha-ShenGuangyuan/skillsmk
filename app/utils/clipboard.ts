/**
 * 跨环境文本复制工具（兼容非安全上下文如 HTTP / IP 访问）
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. 尝试使用现代 Clipboard API（仅在 HTTPS / localhost 或安全上下文中可用）
  if (navigator.clipboard !== undefined && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('Clipboard API failed', err)
    }
  }

  // 2. 降级方案：创建隐藏的 textarea 并执行 execCommand('copy')
  return new Promise((resolve) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // 隐藏元素，防止页面跳动
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    
    textArea.focus()
    textArea.select()
    
    try {
      const successful = document.execCommand('copy')
      resolve(successful)
    } catch (err) {
      console.error('Fallback copy exception', err)
      resolve(false)
    } finally {
      textArea.remove()
    }
  })
}
