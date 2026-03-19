/**
 * 服务端 API 签名工具（仅在 Nitro 服务端运行，不会暴露给浏览器）
 *
 * 签名算法：
 * 1. 收集所有 query / body 参数，按 key 字典序排列
 * 2. 拼接为 key=value&key=value&...（跳过空值）
 * 3. 追加 &timestamp={X-Timestamp}&nonce={X-Nonce}
 * 4. 以 API_SIGN_SECRET 为密钥计算 HMAC-SHA256，结果转小写 hex
 */
import { createHmac } from 'node:crypto'

export interface SignHeaders {
  'X-Timestamp': string
  'X-Nonce': string
  'X-Sign': string
}

/**
 * 生成 10~36 字符的随机 nonce（字母数字）
 */
function randomNonce(length = 16): string {
  return Math.random().toString(36).slice(2)
    + Math.random().toString(36).slice(2)
      .slice(0, length)
}

/**
 * 按字典序拼接参数字符串（空值跳过）
 */
function buildParamStr(params: Record<string, unknown>, timestamp: string, nonce: string): string {
  // 过滤、排序
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')

  const tail = `timestamp=${timestamp}&nonce=${nonce}`
  return sorted ? `${sorted}&${tail}` : tail
}

/**
 * HMAC-SHA256（小写 hex 输出）
 */
function hmacSha256(secret: string, message: string): string {
  return createHmac('sha256', secret).update(message).digest('hex')
}

/**
 * 对外暴露：给定请求参数，返回三个签名请求头
 * @param params  query 参数或 body 参数的扁平对象（不含 timestamp / nonce）
 * @param secret  API_SIGN_SECRET
 */
export function buildSignHeaders(
  params: Record<string, unknown>,
  secret: string,
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = randomNonce(16)
  const strToSign = buildParamStr(params, timestamp, nonce)
  const sign = hmacSha256(secret, strToSign)

  return {
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Sign': sign,
  }
}
