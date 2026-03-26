<script setup lang="ts">
import { useI18n } from '~/i18n'

const i18n = useI18n()
const t    = i18n.t
const { public: { siteUrl } } = useRuntimeConfig()



// SEO：服务条款页 meta（跟随语言动态更新）
useSeoMeta({
  title:              () => `${t('terms.title', 'Terms of Service')} | SKILLSMK`,
  ogTitle:            () => `${t('terms.title', 'Terms of Service')} | SKILLSMK`,
  description:        () => t('terms.seoDesc', 'SKILLSMK Terms of Service - Open-source Agent Skills Marketplace'),
  ogDescription:      () => t('terms.seoDesc', 'SKILLSMK Terms of Service - Open-source Agent Skills Marketplace'),
  ogUrl:              `${siteUrl}/terms`,
  ogImage:            `${siteUrl}/og-image.png`,
  ogType:             'website',
  ogSiteName:         'SKILLSMK',
  twitterCard:        'summary_large_image',
  twitterTitle:       () => `${t('terms.title', 'Terms of Service')} | SKILLSMK`,
  twitterDescription: () => t('terms.seoDesc', 'SKILLSMK Terms of Service - Open-source Agent Skills Marketplace'),
})
useHead({
  link: [{ rel: 'canonical', href: `${siteUrl}/terms` }],
})

// 返回顶部
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="terms-page fade-up">
    <div class="terms-inner">
      <!-- 顶部 Banner -->
      <header class="terms-header">
        <div class="terms-header-left">
          <span class="terms-label">{{ t('terms.label', 'LEGAL') }}</span>
          <h1 class="terms-title">{{ t('terms.title', 'Terms of Service') }}</h1>
          <p class="terms-subtitle">{{ t('terms.subtitle', 'Terms and Conditions · SkillMK Agent Skills Marketplace') }}</p>
        </div>
        <div class="terms-meta">
          <span class="terms-date">{{ t('terms.lastUpdated', 'Last updated: March 10, 2026') }}</span>
        </div>
      </header>

      <hr class="terms-divider" />

      <!-- 目录导航 -->
      <nav class="terms-toc">
        <h3 class="toc-title">{{ t('terms.tocTitle', 'Table of Contents') }}</h3>
        <ul class="toc-list">
          <li><a href="#section-1"  class="toc-link">{{ t('terms.toc1',  '1. Acceptance of Terms') }}</a></li>
          <li><a href="#section-2"  class="toc-link">{{ t('terms.toc2',  '2. Eligibility') }}</a></li>
          <li><a href="#section-3"  class="toc-link">{{ t('terms.toc3',  '3. Acceptable Use') }}</a></li>
          <li><a href="#section-4"  class="toc-link">{{ t('terms.toc4',  '4. Data Sources & Copyright') }}</a></li>
          <li><a href="#section-5"  class="toc-link">{{ t('terms.toc5',  '5. Intellectual Property') }}</a></li>
          <li><a href="#section-6"  class="toc-link">{{ t('terms.toc6',  '6. Third-Party Services') }}</a></li>
          <li><a href="#section-7"  class="toc-link">{{ t('terms.toc7',  '7. Disclaimer of Warranties') }}</a></li>
          <li><a href="#section-8"  class="toc-link">{{ t('terms.toc8',  '8. Limitation of Liability') }}</a></li>
          <li><a href="#section-9"  class="toc-link">{{ t('terms.toc9',  '9. Termination') }}</a></li>
          <li><a href="#section-10" class="toc-link">{{ t('terms.toc10', '10. Changes to Terms') }}</a></li>
        </ul>
      </nav>

      <!-- 条款正文 -->
      <main class="terms-content">

        <!-- Section 1 -->
        <section id="section-1" class="terms-section">
          <h2 class="section-title">
            <span class="section-number">01</span>
            {{ t('terms.s1.title', 'Acceptance of Terms') }}
          </h2>
          <p>{{ t('terms.s1.p1', 'By accessing or using SkillMK, you confirm that you have read, understood, and agreed to these Terms of Service.') }}</p>
          <p>{{ t('terms.s1.p2', 'If you disagree with any part of these terms, please immediately discontinue use.') }}</p>
        </section>

        <!-- Section 2 -->
        <section id="section-2" class="terms-section">
          <h2 class="section-title">
            <span class="section-number">02</span>
            {{ t('terms.s2.title', 'Eligibility') }}
          </h2>
          <p>{{ t('terms.s2.intro', 'To use this Platform, you must meet the following requirements:') }}</p>
          <ul class="terms-list">
            <li>{{ t('terms.s2.li1', 'You are legally eligible to use this type of service in your jurisdiction.') }}</li>
            <li>{{ t('terms.s2.li2', 'You access the Platform as an individual or a lawful organization, and your use complies with local laws.') }}</li>
            <li>{{ t('terms.s2.li3', 'If you use the Platform on behalf of a company, you have the authority to accept these Terms.') }}</li>
          </ul>
        </section>

        <!-- Section 3 -->
        <section id="section-3" class="terms-section">
          <h2 class="section-title">
            <span class="section-number">03</span>
            {{ t('terms.s3.title', 'Acceptable Use') }}
          </h2>
          <p>{{ t('terms.s3.intro', 'You agree to comply with the following conduct rules. The following actions are explicitly prohibited:') }}</p>
          <ul class="terms-list terms-list--warn">
            <li>{{ t('terms.s3.li1', 'Automated bulk scraping or crawling of Platform data at excessive frequencies.') }}</li>
            <li>{{ t('terms.s3.li2', 'Attempting to circumvent, disable, or interfere with the Platform\'s normal operation.') }}</li>
            <li>{{ t('terms.s3.li3', 'Using Skill data for any illegal activities or actions that infringe on the rights of others.') }}</li>
            <li>{{ t('terms.s3.li4', 'Building competing products or services directly based on Platform data without authorization.') }}</li>
            <li>{{ t('terms.s3.li5', 'Impersonating the Platform or spreading false information about it.') }}</li>
          </ul>
          <p>{{ t('terms.s3.outro', 'The Platform reserves the right to restrict or terminate your access for any of the above violations.') }}</p>
        </section>

        <!-- Section 4 -->
        <section id="section-4" class="terms-section">
          <h2 class="section-title">
            <span class="section-number">04</span>
            {{ t('terms.s4.title', 'Data Sources & Copyright') }}
          </h2>
          <p>{{ t('terms.s4.p1', 'All Skill content displayed on SkillMK is sourced from public GitHub repositories. The Platform does not own the copyright to this content.') }}</p>
          <div class="terms-callout">
            <span class="callout-icon">📌</span>
            <div>
              <strong>{{ t('terms.s4.calloutTitle', 'Copyright Attribution') }}</strong><br />
              {{ t('terms.s4.callout', 'All displayed content is copyrighted by the original authors. The Platform only indexes, organizes, and displays content.') }}
            </div>
          </div>
          <p style="margin-top: 16px;">{{ t('terms.s4.p2', 'Please note the following when using content from this Platform:') }}</p>
          <ul class="terms-list">
            <li>{{ t('terms.s4.li1', 'Each Skill\'s source repository may carry different open-source licenses. Please review the License file before use.') }}</li>
            <li>{{ t('terms.s4.li2', 'The Platform\'s search results, classification system, ranking algorithms, and UI design are SkillMK\'s original creations.') }}</li>
            <li>{{ t('terms.s4.li3', 'When citing or reproducing Skill content, please respect the original author\'s copyright and credit the source.') }}</li>
          </ul>
        </section>

        <!-- Section 5 -->
        <section id="section-5" class="terms-section">
          <h2 class="section-title">
            <span class="section-number">05</span>
            {{ t('terms.s5.title', 'Intellectual Property') }}
          </h2>
          <p>{{ t('terms.s5.p1', 'The design, code, brand identity, classification system, and UI components of the SkillMK Platform are protected by intellectual property law and belong to the SkillMK team.') }}</p>
          <p>{{ t('terms.s5.p2', 'Normal use of Platform features (searching, browsing, copying Skill content for personal or development purposes) is not subject to these restrictions.') }}</p>
        </section>

        <!-- Section 6 -->
        <section id="section-6" class="terms-section">
          <h2 class="section-title">
            <span class="section-number">06</span>
            {{ t('terms.s6.title', 'Third-Party Services') }}
          </h2>
          <p>{{ t('terms.s6.intro', 'The Platform may contain links to or integrations with third-party services, including but not limited to:') }}</p>
          <ul class="terms-list">
            <li><strong>GitHub</strong>：{{ t('terms.s6.li1', 'The source of all Skill data; access is governed by GitHub\'s own Terms of Service.') }}</li>
            <li><strong>Claude / Anthropic</strong>：{{ t('terms.s6.li2', 'One of the primary use cases for Skills; governed by Anthropic\'s usage policies.') }}</li>
            <li><strong>{{ t('terms.s6.li3', 'Other AI Platforms: SkillMK is not responsible for the content, policies, or availability of third-party platforms.') }}</strong></li>
          </ul>
          <p>{{ t('terms.s6.outro', 'Your use of third-party services is subject to their respective terms, and SkillMK bears no liability for their actions.') }}</p>
        </section>

        <!-- Section 7 -->
        <section id="section-7" class="terms-section">
          <h2 class="section-title">
            <span class="section-number">07</span>
            {{ t('terms.s7.title', 'Disclaimer of Warranties') }}
          </h2>
          <p>{{ t('terms.s7.intro', 'The Platform is provided on an "as is" and "as available" basis. SkillMK expressly disclaims all warranties, including but not limited to:') }}</p>
          <ul class="terms-list">
            <li>{{ t('terms.s7.li1', 'The accuracy, completeness, or timeliness of content displayed on the Platform.') }}</li>
            <li>{{ t('terms.s7.li2', 'The availability or performance of any Skill on a specific AI platform.') }}</li>
            <li>{{ t('terms.s7.li3', 'Uninterrupted or error-free operation of the Platform.') }}</li>
          </ul>
          <div class="terms-callout terms-callout--warn">
            <span class="callout-icon">⚠️</span>
            <div>
              <strong>{{ t('terms.s7.calloutTitle', 'Risk Notice') }}</strong><br />
              {{ t('terms.s7.callout', 'Before using any Skill in a production environment, please independently evaluate its safety and suitability.') }}
            </div>
          </div>
        </section>

        <!-- Section 8 -->
        <section id="section-8" class="terms-section">
          <h2 class="section-title">
            <span class="section-number">08</span>
            {{ t('terms.s8.title', 'Limitation of Liability') }}
          </h2>
          <p>{{ t('terms.s8.intro', 'To the maximum extent permitted by law, SkillMK and its team members shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:') }}</p>
          <ul class="terms-list">
            <li>{{ t('terms.s8.li1', 'Any loss caused by using or being unable to use the Platform\'s services.') }}</li>
            <li>{{ t('terms.s8.li2', 'Any business or data loss resulting from reliance on Skill content.') }}</li>
            <li>{{ t('terms.s8.li3', 'Unauthorized access to or alteration of your data.') }}</li>
            <li>{{ t('terms.s8.li4', 'The actions or content of any third party in channels related to the Platform.') }}</li>
          </ul>
        </section>

        <!-- Section 9 -->
        <section id="section-9" class="terms-section">
          <h2 class="section-title">
            <span class="section-number">09</span>
            {{ t('terms.s9.title', 'Termination') }}
          </h2>
          <p>{{ t('terms.s9.p1', 'SkillMK reserves the right to suspend or terminate your access to the Platform at any time, for any reason, without prior notice.') }}</p>
          <p>{{ t('terms.s9.p2', 'Upon termination, the provisions relating to intellectual property, disclaimers, and limitation of liability shall remain in effect.') }}</p>
        </section>

        <!-- Section 10 -->
        <section id="section-10" class="terms-section">
          <h2 class="section-title">
            <span class="section-number">10</span>
            {{ t('terms.s10.title', 'Changes to Terms') }}
          </h2>
          <p>{{ t('terms.s10.p1', 'We may update these Terms of Service from time to time. Continued use of the Platform after revised terms take effect constitutes your acceptance.') }}</p>
          <p>{{ t('terms.s10.p2', 'Significant changes will be communicated via announcements within the Platform. We recommend reviewing this page periodically.') }}</p>
        </section>

      </main>

      <!-- 底部版权行 -->
      <div class="terms-footer">
        <span class="terms-footer-text">{{ t('terms.footerText', 'Content sourced from GitHub. Copyright belongs to the original authors. · © 2026 SkillMK · All rights reserved.') }}</span>
        <button class="scroll-top-btn" @click="scrollToTop">{{ t('terms.backToTop', '↑ Back to Top') }}</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   Terms — 暗黑工业科技主题
============================================================ */
.terms-page {
  padding: 60px 0 100px;
  min-height: calc(100vh - 70px);
  position: relative;
  overflow: hidden;
}

/* 背景光球装饰 */
.terms-page::before {
  content: '';
  position: fixed;
  top: -100px;
  right: -200px;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, transparent 65%);
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

.terms-inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

/* ── Header ── */
.terms-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.terms-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--purple);
  background: rgba(168, 85, 247, 0.07);
  border: 1px solid rgba(168, 85, 247, 0.25);
  padding: 4px 12px;
  border-radius: 999px;
  margin-bottom: 12px;
}

.terms-title {
  font-family: var(--font-mono);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 800;
  color: var(--fg);
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.terms-subtitle {
  font-size: 13px;
  color: var(--muted);
  margin-top: 8px;
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}

.terms-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.terms-date {
  font-size: 13px;
  color: var(--muted);
  font-family: var(--font-mono);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 3px 10px;
  border-radius: 6px;
}

/* ── 分隔线 ── */
.terms-divider {
  border: none;
  height: 1px;
  background: var(--border);
  margin: 0 0 40px;
}

/* ── TOC 目录 ── */
.terms-toc {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 52px;
  position: relative;
  overflow: hidden;
}

/* TOC 顶部扫描线 */
.terms-toc::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.5), transparent);
}

.toc-title {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
  margin: 0 0 14px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 24px;
}

.toc-link {
  font-size: 13px;
  color: var(--fg-secondary);
  text-decoration: none;
  font-family: var(--font-mono);
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.toc-link::before {
  content: '//';
  color: var(--purple);
  font-size: 10px;
  opacity: 0.6;
}
.toc-link:hover { color: var(--purple); }

/* ── 正文区 ── */
.terms-content {
  display: flex;
  flex-direction: column;
  gap: 52px;
}

.terms-section { scroll-margin-top: 90px; }

.section-title {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--fg);
  margin: 0 0 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.section-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(168, 85, 247, 0.12);
  border: 1px solid rgba(168, 85, 247, 0.25);
  color: var(--purple);
  font-size: 12px;
  font-weight: 800;
  font-family: var(--font-mono);
  flex-shrink: 0;
  letter-spacing: 0.04em;
}

.terms-section p {
  font-size: 14.5px;
  line-height: 1.85;
  color: var(--fg-secondary);
  margin: 0 0 14px;
}

code {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--bg-elevated);
  padding: 2px 7px;
  border-radius: 4px;
  color: var(--purple);
  border: 1px solid var(--border);
}

/* ── 列表 ── */
.terms-list {
  padding-left: 0;
  margin: 12px 0 16px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.terms-list li {
  font-size: 14px;
  color: var(--fg-secondary);
  line-height: 1.75;
  padding: 10px 14px 10px 36px;
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: border-color 0.2s, background 0.2s;
}

.terms-list li:hover {
  background: var(--bg-elevated);
  border-color: var(--border-strong);
}

.terms-list li::before {
  content: '›';
  position: absolute;
  left: 14px;
  color: var(--purple);
  font-weight: 700;
  font-size: 16px;
  line-height: 1.6;
}

.terms-list--warn li::before {
  content: '✕';
  color: #f87171;
  font-size: 11px;
  line-height: 1.9;
}
.terms-list--warn li { border-color: rgba(248, 113, 113, 0.1); }
.terms-list--warn li:hover {
  border-color: rgba(248, 113, 113, 0.2);
  background: rgba(248, 113, 113, 0.03);
}

/* ── Callout 提示框 ── */
.terms-callout {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  background: rgba(37, 99, 235, 0.04);
  border: 1px solid rgba(37, 99, 235, 0.15);
  border-radius: 12px;
  padding: 16px 20px;
  margin-top: 20px;
  font-size: 14px;
  color: var(--fg-secondary);
  line-height: 1.75;
  position: relative;
  overflow: hidden;
}

.terms-callout::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.3), transparent);
}

.terms-callout strong {
  color: var(--accent);
  display: block;
  margin-bottom: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.terms-callout--warn {
  background: rgba(251, 146, 60, 0.05);
  border-color: rgba(251, 146, 60, 0.2);
}
.terms-callout--warn::before {
  background: linear-gradient(90deg, transparent, rgba(251, 146, 60, 0.4), transparent);
}
.terms-callout--warn strong { color: var(--orange); }

.callout-icon { flex-shrink: 0; font-size: 18px; margin-top: 2px; }

/* ── 底部 ── */
.terms-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 64px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  gap: 12px;
  flex-wrap: wrap;
}

.terms-footer-text {
  font-size: 11px;
  color: var(--muted);
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
}

.scroll-top-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--fg-secondary);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 14px;
  cursor: pointer;
  letter-spacing: 0.04em;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
  white-space: nowrap;
}
.scroll-top-btn:hover {
  border-color: var(--border-strong);
  color: var(--fg);
  background: var(--bg-card-hover);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .terms-header { flex-direction: column; align-items: flex-start; }
  .terms-meta { align-items: flex-start; }
  .toc-list { grid-template-columns: 1fr; }
  .terms-footer { flex-direction: column; align-items: flex-start; }
}
</style>
