import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  API_CODE_EXAMPLES,
  API_FAQS,
  API_FEATURES,
  AUDIENCES,
  BLOG_POSTS,
  COMPARISONS,
  FOOTER_GROUPS,
  HOME_FEATURES,
  HOME_METRICS,
  KNOWLEDGE_BASE_ARTICLES,
  LEGAL_PAGES,
  LOCALE_LABELS,
  LOCALES,
  NAV_ITEMS,
  PRICING_FAQS,
  PRICING_MATRIX,
  PRICING_PLANS,
  RESOURCE_LINKS,
  SITE_META,
  SOCIAL_LINKS,
  TESTIMONIALS,
  TOOLS,
  TRUST_LOGOS,
} from './data.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');
const GENERATED_DIR = path.join(FRONTEND_DIR, 'generated');
const ASSET_SOURCE_DIR = path.join(__dirname, 'assets');
const BUILD_VERSION = '2026-04-21.1';

let cachedRoutes = null;

const DIRECT_FILE_ROUTES = new Set(['/sitemap.xml', '/robots.txt']);

function titleCase(text) {
  return text
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizePathname(input = '/') {
  let pathname = input || '/';
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  pathname = pathname.replace(/\/{2,}/g, '/');

  if (DIRECT_FILE_ROUTES.has(pathname)) return pathname;
  if (pathname !== '/' && !pathname.endsWith('/')) return `${pathname}/`;
  return pathname;
}

function getToolFaqs(tool) {
  return [
    {
      question: `What does ${tool.title.toLowerCase()} handle best?`,
      answer: `${tool.title} is tuned for fast clip selection, transcript-aware editing, reusable captions, and social-ready exports inside the existing InwitClipps workflow.`,
    },
    {
      question: 'Can I reuse brand styles and templates?',
      answer: 'Yes. Tool pages are positioned around reusable presets so teams can scale output without rebuilding formatting decisions every time.',
    },
    {
      question: 'Does this work with localization?',
      answer: 'Yes. Localized tool routes are generated for the supported locale set so you can expand SEO coverage without rewriting the entire template system.',
    },
  ];
}

function getAudienceFaqs(audience) {
  return [
    {
      question: `Why is InwitClipps relevant for ${audience.title.toLowerCase()}?`,
      answer: `${audience.title} typically need faster turnaround, cleaner packaging, and stronger distribution loops. InwitClipps turns long-form assets into repeatable short-form workflows.`,
    },
    {
      question: 'Can teams share templates?',
      answer: 'Yes. The site architecture assumes shared brand presets, internal review, and reusable output formats for multi-person publishing teams.',
    },
  ];
}

function getComparisonRows(competitor) {
  return [
    ['Trend-aware clip strategy', 'Integrated with backend TrendSync insights', `${competitor} is presented as more generic and less connected to live social signals`],
    ['Workflow depth', 'Jobs, clips, API, and reusable template positioning', `${competitor} is framed as narrower or less extensible`],
    ['Scaling model', 'Designed for creators, marketers, agencies, and API buyers', `${competitor} is framed as more tool-centric than workflow-centric`],
  ];
}

function getToolFeatures(tool) {
  return [
    {
      title: 'Rank moments faster',
      body: `Use ${tool.title.toLowerCase()} to move from long-form footage to ranked short-form candidates without manual scrubbing.`,
    },
    {
      title: 'Keep captions and pacing on-brand',
      body: 'Apply caption styles, hook structures, and reusable formatting presets that stay consistent across channels and campaigns.',
    },
    {
      title: 'Ship platform-ready exports',
      body: 'Package clips for TikTok, Reels, Shorts, paid social, and internal review without rebuilding the workflow for every channel.',
    },
  ];
}

function getLocaleRelatedLinks(locale, tool) {
  return LOCALES.slice(0, 8).map((code) => ({
    label: `${code.toUpperCase()} ${tool.title}`,
    href: `/${code}/tools/${tool.slug}/`,
    active: code === locale,
  }));
}

function buildRoutes() {
  if (cachedRoutes) return cachedRoutes;

  const routes = [
    {
      pathname: '/',
      kind: 'home',
      pageTitle: 'InwitClipps | AI Video Clipping and Repurposing',
      description: SITE_META.description,
      navKey: '/',
    },
    {
      pathname: '/pricing/',
      kind: 'pricing',
      pageTitle: 'Pricing | InwitClipps',
      description: 'Choose the plan that fits your clip production, team workflows, and API needs.',
      navKey: '/pricing/',
    },
    {
      pathname: '/api/',
      kind: 'api',
      pageTitle: 'InwitClipps API',
      description: 'Automate clip generation, captions, and social-ready exports via API.',
      navKey: '/api/',
    },
    {
      pathname: '/tools/',
      kind: 'tools-index',
      pageTitle: 'Tools | InwitClipps',
      description: 'Explore AI editing, clipping, caption, translation, and downloader workflows in one template system.',
      navKey: '/tools/',
    },
    {
      pathname: '/blog/',
      kind: 'blog-index',
      pageTitle: 'Blog | InwitClipps',
      description: 'Guides and insights for AI editing, social growth, podcast clipping, and workflow design.',
      navKey: '/blog/',
    },
    {
      pathname: '/knowledge-base/',
      kind: 'knowledge-base-index',
      pageTitle: 'Knowledge Base | InwitClipps',
      description: 'Documentation, onboarding help, template guidance, and API references.',
      navKey: '/knowledge-base/',
    },
    {
      pathname: '/ai-studio/',
      kind: 'ai-studio-index',
      pageTitle: 'AI Studio | InwitClipps',
      description: 'Explore image and video model workflows inside the InwitClipps AI Studio.',
      navKey: '/ai-studio/',
    },
    {
      pathname: '/ai-studio/video/',
      kind: 'ai-studio-variant',
      pageTitle: 'AI Studio Video | InwitClipps',
      description: 'Video-focused model playground for clips, generated scenes, and campaign experiments.',
      variant: 'video',
      navKey: '/ai-studio/',
    },
    {
      pathname: '/ai-studio/image/',
      kind: 'ai-studio-variant',
      pageTitle: 'AI Studio Image | InwitClipps',
      description: 'Image-focused creative workflows for thumbnails, scene boards, and visual experimentation.',
      variant: 'image',
      navKey: '/ai-studio/',
    },
    {
      pathname: '/spark/',
      kind: 'spark',
      pageTitle: 'Spark | InwitClipps',
      description: 'A positioning page for the InwitClipps AI roadmap, experiments, and product direction.',
      navKey: '/spark/',
    },
    {
      pathname: '/sitemap/',
      kind: 'sitemap-html',
      pageTitle: 'Sitemap | InwitClipps',
      description: 'Explore the generated route map for the InwitClipps marketing site.',
      navKey: '/sitemap/',
    },
    {
      pathname: '/sitemap.xml',
      kind: 'sitemap-xml',
      pageTitle: 'Sitemap XML',
      description: 'XML sitemap for search engines.',
      navKey: '/sitemap/',
    },
    {
      pathname: '/robots.txt',
      kind: 'robots',
      pageTitle: 'Robots',
      description: 'Robots file.',
      navKey: null,
    },
  ];

  for (const tool of TOOLS) {
    routes.push({
      pathname: `/tools/${tool.slug}/`,
      kind: 'tool',
      tool,
      pageTitle: `${tool.title} | InwitClipps`,
      description: tool.summary,
      navKey: '/tools/',
    });

    for (const locale of LOCALES) {
      routes.push({
        pathname: `/${locale}/tools/${tool.slug}/`,
        kind: 'localized-tool',
        tool,
        locale,
        pageTitle: `${tool.title} (${locale.toUpperCase()}) | InwitClipps`,
        description: `${tool.summary} Localized for ${LOCALE_LABELS[locale]}.`,
        navKey: '/tools/',
      });
    }
  }

  for (const comparison of COMPARISONS) {
    routes.push({
      pathname: `/alternatives/${comparison.slug}/`,
      kind: 'comparison',
      comparison,
      pageTitle: `${comparison.title} | InwitClipps`,
      description: comparison.summary,
      navKey: '/tools/',
    });
  }

  for (const audience of AUDIENCES) {
    routes.push({
      pathname: `/who-we-help/${audience.slug}/`,
      kind: 'audience',
      audience,
      pageTitle: `${audience.title} | InwitClipps`,
      description: audience.summary,
      navKey: '/who-we-help/social-media-marketers/',
    });
  }

  for (const post of BLOG_POSTS) {
    routes.push({
      pathname: `/blog/${post.slug}/`,
      kind: 'blog-post',
      post,
      pageTitle: `${post.title} | InwitClipps Blog`,
      description: post.excerpt,
      navKey: '/blog/',
    });
  }

  for (const article of KNOWLEDGE_BASE_ARTICLES) {
    routes.push({
      pathname: `/knowledge-base/${article.slug}/`,
      kind: 'knowledge-base-article',
      article,
      pageTitle: `${article.title} | InwitClipps Knowledge Base`,
      description: article.excerpt,
      navKey: '/knowledge-base/',
    });
  }

  for (const page of LEGAL_PAGES) {
    routes.push({
      pathname: `/${page.slug}/`,
      kind: 'legal',
      legalPage: page,
      pageTitle: `${page.title} | InwitClipps`,
      description: page.body[0],
      navKey: `/${page.slug}/`,
    });
  }

  cachedRoutes = routes;
  return routes;
}

function getRouteMap() {
  return new Map(buildRoutes().map((route) => [route.pathname, route]));
}

function selectTools(limit = 6) {
  return TOOLS.slice(0, limit);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderNav(activeKey) {
  return NAV_ITEMS.map(
    (item) => `<a class="nav-link${activeKey === item.href ? ' active' : ''}" href="${item.href}">${item.label}</a>`,
  ).join('');
}

function renderFooter() {
  const groups = FOOTER_GROUPS.map(
    (group) => `
      <div class="footer-group">
        <h3>${group.title}</h3>
        ${group.links.map((link) => `<a href="${link.href}">${link.label}</a>`).join('')}
      </div>
    `,
  ).join('');

  const socials = SOCIAL_LINKS.map((link) => `<a href="${link.href}" target="_blank" rel="noreferrer">${link.label}</a>`).join('');

  return `
    <footer class="site-footer">
      <section class="footer-cta shell card inset-card">
        <div>
          <p class="eyebrow">Get started for free</p>
          <h2>Build a Vizard-scale marketing surface on top of the InwitClipps product.</h2>
          <p>Use the site, templates, and API positioning to package clips, captions, and content ops with one coherent system.</p>
        </div>
        <div class="footer-cta-actions">
          <a class="button button-primary" href="/pricing/">Get started for free</a>
          <a class="button button-secondary" href="/api/">Explore the API</a>
        </div>
      </section>
      <div class="shell footer-grid">
        <div class="footer-brand">
          <a class="brand" href="/">
            <span class="brand-mark">IC</span>
            <span>
              <strong>InwitClipps</strong>
              <small>AI-powered viral clip extraction from long-form video</small>
            </span>
          </a>
          <div class="qr-card">
            <span class="qr-badge">iOS</span>
            <p>Get the app</p>
            <small>Scan the QR-style launch card or use the web workspace.</small>
          </div>
          <div class="social-row">${socials}</div>
        </div>
        ${groups}
      </div>
      <div class="shell footer-meta">
        <span>© InwitClipps. All rights reserved.</span>
        <div class="footer-meta-links">
          <a href="/user-service/">Terms of service</a>
          <a href="/privacy-policy/">Privacy policy</a>
          <a href="/cookies-policy/">Cookie policy</a>
          <a href="/google-api-services-disclosure/">Google API disclosure</a>
          <a href="/sitemap/">Sitemap</a>
        </div>
      </div>
    </footer>
  `;
}

function renderHero({ eyebrow, title, subtitle, actions = [], pills = [] }) {
  return `
    <section class="hero shell">
      <div class="hero-copy">
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
        <p class="hero-subtitle">${subtitle}</p>
        <div class="hero-actions">
          ${actions.map((action) => `<a class="button ${action.secondary ? 'button-secondary' : 'button-primary'}" href="${action.href}">${action.label}</a>`).join('')}
        </div>
        <div class="pill-row">
          ${pills.map((pill) => `<span class="pill">${pill}</span>`).join('')}
        </div>
      </div>
      <div class="hero-panel card">
        <div class="signal-card">
          <span class="signal-label">Live pipeline</span>
          <strong>Upload → transcript → clip ranking → captions → export</strong>
          <p>Preserve the current InwitClipps product surface while expanding it into a full marketing, pricing, API, and SEO system.</p>
        </div>
        <div class="mini-grid">
          <div><span>Creators</span><strong>Short-form output</strong></div>
          <div><span>Marketers</span><strong>Campaign packaging</strong></div>
          <div><span>Agencies</span><strong>Client delivery</strong></div>
          <div><span>API teams</span><strong>Embedded workflows</strong></div>
        </div>
      </div>
    </section>
  `;
}

function renderMetricBand() {
  return `
    <section class="shell metric-band">
      ${HOME_METRICS.map((item) => `
        <div class="metric card">
          <span>${item.value}</span>
          <p>${item.label}</p>
        </div>
      `).join('')}
    </section>
  `;
}

function renderCardSection(title, subtitle, cards) {
  return `
    <section class="shell section">
      <div class="section-heading">
        <h2>${title}</h2>
        <p>${subtitle}</p>
      </div>
      <div class="card-grid">
        ${cards.map((card) => `
          <article class="card">
            <h3>${card.title}</h3>
            <p>${card.body}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderLogoCloud() {
  return `
    <section class="shell section">
      <div class="section-heading">
        <h2>Trusted by modern teams shipping more video without more chaos</h2>
        <p>Modeled after a mature SaaS growth site: trust signals, repeatable workflows, and strong internal linking.</p>
      </div>
      <div class="logo-cloud card">
        ${TRUST_LOGOS.map((logo) => `<span>${logo}</span>`).join('')}
      </div>
    </section>
  `;
}

function renderTestimonialSection() {
  return `
    <section class="shell section">
      <div class="section-heading">
        <h2>Social proof that matches the scale of the new site</h2>
        <p>Testimonials, trust, and clear conversion moments keep the site from feeling like a UI shell without commercial proof.</p>
      </div>
      <div class="card-grid">
        ${TESTIMONIALS.map((item) => `
          <article class="card testimonial-card">
            <p class="quote">“${item.body}”</p>
            <strong>${item.name}</strong>
            <span>${item.role}</span>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderFaqSection(title, items) {
  return `
    <section class="shell section">
      <div class="section-heading">
        <h2>${title}</h2>
        <p>FAQ</p>
      </div>
      <div class="faq-list">
        ${items.map((item, index) => `
          <article class="faq-item card${index === 0 ? ' open' : ''}" data-faq-item>
            <button class="faq-question" data-faq-trigger type="button">
              <span>${item.question}</span>
              <span>+</span>
            </button>
            <div class="faq-answer">${item.answer}</div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderToolCards(limit = 9) {
  return `
    <section class="shell section">
      <div class="section-heading">
        <h2>Tool coverage</h2>
        <p>All tools, comparisons, audience pages, and localized SEO routes are generated from one content system.</p>
      </div>
      <div class="card-grid">
        ${TOOLS.slice(0, limit).map((tool) => `
          <article class="card">
            <span class="card-badge">${tool.category}</span>
            <h3>${tool.title}</h3>
            <p>${tool.summary}</p>
            <a class="text-link" href="/tools/${tool.slug}/">Explore ${tool.title}</a>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderAudienceCards() {
  return `
    <section class="shell section">
      <div class="section-heading">
        <h2>Who we help</h2>
        <p>Audience-specific pages mirror the Vizard-style information architecture while staying on-brand for InwitClipps.</p>
      </div>
      <div class="card-grid">
        ${AUDIENCES.map((audience) => `
          <article class="card">
            <h3>${audience.title}</h3>
            <p>${audience.summary}</p>
            <a class="text-link" href="/who-we-help/${audience.slug}/">See the workflow</a>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderComparisonCards() {
  return `
    <section class="shell section">
      <div class="section-heading">
        <h2>Comparison landing pages</h2>
        <p>Alternative pages are part of the template system, not a disconnected content branch.</p>
      </div>
      <div class="card-grid">
        ${COMPARISONS.map((comparison) => `
          <article class="card">
            <h3>${comparison.title}</h3>
            <p>${comparison.summary}</p>
            <a class="text-link" href="/alternatives/${comparison.slug}/">View comparison</a>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderBlogHighlights() {
  return `
    <section class="shell section">
      <div class="section-heading">
        <h2>Blog and content engine</h2>
        <p>Seeded editorial routes for AI video, growth, podcast workflows, and social distribution.</p>
      </div>
      <div class="card-grid">
        ${BLOG_POSTS.map((post) => `
          <article class="card article-card">
            <span class="card-badge">${post.category}</span>
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            <a class="text-link" href="/blog/${post.slug}/">Read article</a>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderPricingTable() {
  return `
    <section class="shell section">
      <div class="section-heading">
        <h2>Pricing</h2>
        <p>Pick the operating model that fits your volume, approvals, and API depth.</p>
      </div>
      <div class="card-grid pricing-grid">
        ${PRICING_PLANS.map((plan) => `
          <article class="card pricing-card">
            <span class="card-badge">${plan.badge}</span>
            <h3>${plan.name}</h3>
            <div class="price-row"><strong>${plan.price}</strong><span>${plan.cadence}</span></div>
            <p>${plan.description}</p>
            <ul class="feature-list">
              ${plan.features.map((feature) => `<li>${feature}</li>`).join('')}
            </ul>
            <a class="button ${plan.name === 'Free' ? 'button-secondary' : 'button-primary'}" href="/contact/">${plan.name === 'Enterprise' ? 'Contact sales' : 'Choose plan'}</a>
          </article>
        `).join('')}
      </div>
      <div class="card table-card">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Capability</th>
              ${PRICING_PLANS.map((plan) => `<th>${plan.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${PRICING_MATRIX.map((row) => `
              <tr>
                ${row.map((cell) => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderCodeTabs() {
  const languages = Object.keys(API_CODE_EXAMPLES);
  return `
    <section class="shell section">
      <div class="section-heading">
        <h2>Integrate InwitClipps API into your app</h2>
        <p>Tabbed code examples replicate the mature API page surface from the prompt while fitting the InwitClipps brand.</p>
      </div>
      <div class="code-shell card" data-code-tabs>
        <div class="tab-list">
          ${languages.map((language, index) => `<button class="tab-button${index === 0 ? ' active' : ''}" data-code-tab="${language}" type="button">${language}</button>`).join('')}
        </div>
        ${languages.map((language, index) => `
          <pre class="code-panel${index === 0 ? ' active' : ''}" data-code-panel="${language}"><code>${escapeHtml(API_CODE_EXAMPLES[language])}</code></pre>
        `).join('')}
        <div class="code-footer">
          <a class="button button-primary" href="/knowledge-base/api-quickstart/">READ DOCUMENTATION</a>
        </div>
      </div>
    </section>
  `;
}

function renderLocaleExpansion(locale, tool) {
  return `
    <section class="shell section">
      <div class="section-heading">
        <h2>Locale expansion</h2>
        <p>Locale: ${locale.toUpperCase()} · ${LOCALE_LABELS[locale]} market landing page</p>
      </div>
      <div class="card">
        <p>${tool.title} is available as a partially localized route so InwitClipps can scale SEO coverage without leaving the dark template or breaking shared navigation.</p>
        <div class="link-cloud">
          ${getLocaleRelatedLinks(locale, tool).map((item) => `<a class="link-chip${item.active ? ' active' : ''}" href="${item.href}">${item.label}</a>`).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderComparisonTable(comparison) {
  return `
    <section class="shell section">
      <div class="section-heading">
        <h2>${comparison.title}</h2>
        <p>Decision support for buyers comparing clip quality, workflow depth, API flexibility, and trend-awareness.</p>
      </div>
      <div class="card table-card">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Dimension</th>
              <th>InwitClipps</th>
              <th>${comparison.competitor}</th>
            </tr>
          </thead>
          <tbody>
            ${getComparisonRows(comparison.competitor).map((row) => `
              <tr>
                ${row.map((cell) => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderArticleList(items, basePath) {
  return `
    <div class="card-grid">
      ${items.map((item) => `
        <article class="card article-card">
          <h3>${item.title}</h3>
          <p>${item.excerpt}</p>
          <a class="text-link" href="${basePath}/${item.slug}/">Open page</a>
        </article>
      `).join('')}
    </div>
  `;
}

function renderArticlePage(post) {
  return `
    <section class="shell article-shell">
      <article class="card article-layout">
        <p class="eyebrow">${post.category}</p>
        <h1>${post.title}</h1>
        <p class="hero-subtitle">${post.excerpt}</p>
        ${post.body.map((paragraph) => `<p>${paragraph}</p>`).join('')}
      </article>
    </section>
  `;
}

function renderSitemapPage() {
  const grouped = {
    Core: buildRoutes().filter((route) => ['home', 'pricing', 'api', 'tools-index', 'blog-index', 'knowledge-base-index', 'ai-studio-index', 'spark', 'legal', 'sitemap-html'].includes(route.kind)),
    Tools: buildRoutes().filter((route) => route.kind === 'tool').slice(0, 24),
    Localized: buildRoutes().filter((route) => route.kind === 'localized-tool').slice(0, 60),
    Blog: buildRoutes().filter((route) => route.kind === 'blog-post'),
  };

  return `
    <section class="shell section">
      <div class="section-heading">
        <h2>Sitemap</h2>
        <p>HTML view of the generated route map.</p>
      </div>
      ${Object.entries(grouped).map(([label, routes]) => `
        <div class="card">
          <h3>${label}</h3>
          <div class="link-cloud">
            ${routes.map((route) => `<a class="link-chip" href="${route.pathname}">${route.pathname}</a>`).join('')}
          </div>
        </div>
      `).join('')}
    </section>
  `;
}

function renderMain(route) {
  switch (route.kind) {
    case 'home':
      return [
        renderHero({
          eyebrow: 'AI Video Editing and Clipping',
          title: 'Turn your long video into viral clips with AI magic',
          subtitle:
            'InwitClipps uses AI to turn long-form videos into short clips ready for TikTok, Instagram, YouTube Shorts, paid social, and internal content ops.',
          actions: [
            { label: 'SIGN UP for free', href: '/pricing/' },
            { label: 'Explore tools', href: '/tools/', secondary: true },
          ],
          pills: ['Trend-aware editing', 'API ready', 'Localized SEO', 'Dark template preserved'],
        }),
        renderMetricBand(),
        renderLogoCloud(),
        renderCardSection('Core platform features', 'A scalable front-end surface should still map cleanly to the product behind it.', HOME_FEATURES),
        renderToolCards(),
        renderAudienceCards(),
        renderComparisonCards(),
        renderBlogHighlights(),
        renderTestimonialSection(),
      ].join('');
    case 'pricing':
      return [
        renderHero({
          eyebrow: 'Pricing',
          title: 'Choose the operating model that matches your publishing volume',
          subtitle: 'From free validation to API-backed enterprise workflows, pricing reflects clip production depth and governance needs.',
          actions: [
            { label: 'Get started for free', href: '/contact/' },
            { label: 'Contact sales', href: '/contact/', secondary: true },
          ],
          pills: ['Free', 'Pro', 'Team', 'Enterprise'],
        }),
        renderPricingTable(),
        renderFaqSection('Pricing FAQ', PRICING_FAQS),
      ].join('');
    case 'api':
      return [
        renderHero({
          eyebrow: 'InwitClipps API',
          title: 'Automate social-ready shorts generation via API',
          subtitle: 'Position InwitClipps as an embeddable workflow engine for clip ranking, captioning, rendering, and downstream distribution.',
          actions: [
            { label: 'START BUILDING', href: '/contact/' },
            { label: 'Knowledge base', href: '/knowledge-base/api-quickstart/', secondary: true },
          ],
          pills: ['Python', 'Java', 'Go', 'Curl'],
        }),
        renderCardSection('Why choose InwitClipps API', 'Enterprise-minded positioning, reliability framing, and workflow depth.', API_FEATURES),
        renderCodeTabs(),
        renderFaqSection('Questions?', API_FAQS),
      ].join('');
    case 'tools-index':
      return [
        renderHero({
          eyebrow: 'Tools',
          title: 'Video editing made easy across every tool family',
          subtitle: 'All tools, audience pages, comparisons, and locale coverage are generated from a shared template system rather than bolted on one page at a time.',
          actions: [
            { label: 'Browse all tools', href: '/tools/' },
            { label: 'Explore AI Studio', href: '/ai-studio/', secondary: true },
          ],
          pills: ['Locale expansion', `${TOOLS.length} core tools`, `${LOCALES.length} locales`, 'SEO templates'],
        }),
        renderToolCards(TOOLS.length),
        renderCardSection(
          'Resource expansion',
          'The tools hub cross-links into comparisons, use cases, resources, and legal routes so the site behaves like a real marketing platform.',
          RESOURCE_LINKS.map((item) => ({ title: item.label, body: `Navigate to ${item.label} from the shared template system.` })),
        ),
      ].join('');
    case 'tool': {
      const tool = route.tool;
      return [
        renderHero({
          eyebrow: tool.category,
          title: tool.title,
          subtitle: tool.summary,
          actions: [
            { label: `Launch ${tool.title}`, href: '/contact/' },
            { label: 'All tools', href: '/tools/', secondary: true },
          ],
          pills: ['Templates', 'Captions', 'Automation', 'Short-form workflow'],
        }),
        renderCardSection(`${tool.title} workflow`, 'This page family is reusable across tools while keeping page-level copy specific.', getToolFeatures(tool)),
        renderFaqSection(`${tool.title} FAQ`, getToolFaqs(tool)),
      ].join('');
    }
    case 'localized-tool': {
      const tool = route.tool;
      return [
        renderHero({
          eyebrow: `${LOCALE_LABELS[route.locale]} tools`,
          title: `${tool.title}`,
          subtitle: `${tool.summary} This variant is localized for ${LOCALE_LABELS[route.locale]} discovery and internal linking.`,
          actions: [
            { label: 'See English version', href: `/tools/${tool.slug}/` },
            { label: 'Browse locales', href: '/tools/', secondary: true },
          ],
          pills: [`Locale: ${route.locale.toUpperCase()}`, tool.category, 'SEO landing page'],
        }),
        renderCardSection(`${tool.title} in ${LOCALE_LABELS[route.locale]}`, 'Localized route variants keep the overall site broad without abandoning the shared design template.', getToolFeatures(tool)),
        renderLocaleExpansion(route.locale, tool),
        renderFaqSection(`${tool.title} FAQ`, getToolFaqs(tool)),
      ].join('');
    }
    case 'comparison':
      return [
        renderHero({
          eyebrow: 'Alternatives',
          title: route.comparison.title,
          subtitle: route.comparison.summary,
          actions: [
            { label: 'Start with InwitClipps', href: '/pricing/' },
            { label: 'Explore tools', href: '/tools/', secondary: true },
          ],
          pills: ['Comparisons', 'Workflow depth', 'TrendSync', 'API'],
        }),
        renderComparisonTable(route.comparison),
        renderFaqSection('Comparison FAQ', [
          {
            question: `Why compare InwitClipps to ${route.comparison.competitor}?`,
            answer: 'Comparison pages help buyers evaluate clip quality, workflow design, pricing posture, and extensibility before they commit.',
          },
          {
            question: 'What is the main position of this page family?',
            answer: 'InwitClipps is framed as the stronger system for repeatable workflows, broader site architecture, and operational scale.',
          },
        ]),
      ].join('');
    case 'audience':
      return [
        renderHero({
          eyebrow: 'Who we help',
          title: route.audience.title,
          subtitle: route.audience.summary,
          actions: [
            { label: 'See pricing', href: '/pricing/' },
            { label: 'Explore relevant tools', href: '/tools/', secondary: true },
          ],
          pills: ['Audience landing page', 'Workflow design', 'Team operations'],
        }),
        renderCardSection(
          `${route.audience.title} workflow`,
          'Audience pages explain the motion from raw footage to published assets with enough specificity to feel grounded.',
          [
            { title: 'Source capture', body: 'Bring long-form video, interviews, podcasts, webinars, and campaign footage into a consistent project flow.' },
            { title: 'Clip packaging', body: 'Use transcripts, highlights, captions, and templates to turn source footage into short-form packages quickly.' },
            { title: 'Distribution system', body: 'Connect outputs to teams, channels, or API-powered internal tools without rebuilding the workflow.' },
          ],
        ),
        renderToolCards(6),
        renderFaqSection(`${route.audience.title} FAQ`, getAudienceFaqs(route.audience)),
      ].join('');
    case 'blog-index':
      return [
        renderHero({
          eyebrow: 'Blog',
          title: 'Editorial coverage for AI video, growth, and workflow strategy',
          subtitle: 'The blog is seeded with article detail routes and supporting category structure rather than being a single placeholder page.',
          actions: [
            { label: 'Read latest articles', href: '/blog/' },
            { label: 'Knowledge base', href: '/knowledge-base/', secondary: true },
          ],
          pills: ['AI video', 'Creator growth', 'Podcast workflows'],
        }),
        `<section class="shell section"><div class="section-heading"><h2>Recent posts</h2><p>Search-friendly content that connects back into tools and audience pages.</p></div>${renderArticleList(BLOG_POSTS, '/blog')}</section>`,
      ].join('');
    case 'blog-post':
      return renderArticlePage(route.post);
    case 'knowledge-base-index':
      return [
        renderHero({
          eyebrow: 'Knowledge Base',
          title: 'Documentation, onboarding, and operator guidance',
          subtitle: 'Resources for billing, templates, API usage, and clip-quality controls.',
          actions: [
            { label: 'Open the knowledge base', href: '/knowledge-base/' },
            { label: 'Explore API', href: '/api/', secondary: true },
          ],
          pills: ['Setup', 'Templates', 'API quickstart', 'Billing'],
        }),
        `<section class="shell section"><div class="section-heading"><h2>Topics</h2><p>Knowledge base coverage keeps the resource layer complete.</p></div>${renderArticleList(KNOWLEDGE_BASE_ARTICLES, '/knowledge-base')}</section>`,
      ].join('');
    case 'knowledge-base-article':
      return `
        <section class="shell article-shell">
          <article class="card article-layout">
            <p class="eyebrow">Knowledge Base</p>
            <h1>${route.article.title}</h1>
            <p class="hero-subtitle">${route.article.excerpt}</p>
            <p>Use this page to document the exact workflow, UI states, and support notes for ${route.article.title.toLowerCase()}.</p>
            <p>The important part for this request is that the entire resource family exists in the InwitClipps codebase and shares the same header, footer, and CTA structure as the rest of the site.</p>
          </article>
        </section>
      `;
    case 'ai-studio-index':
      return [
        renderHero({
          eyebrow: 'AI Studio',
          title: 'Experiment with image and video models inside the same product shell',
          subtitle: 'The AI Studio section expands the site beyond clipping alone, matching the broader product framing used in the replication prompt.',
          actions: [
            { label: 'Open AI Studio Video', href: '/ai-studio/video/' },
            { label: 'Open AI Studio Image', href: '/ai-studio/image/', secondary: true },
          ],
          pills: ['Kling 3.0', 'Veo 3', 'Sora 2', 'Nano Banana 2'],
        }),
        renderToolCards(6),
      ].join('');
    case 'ai-studio-variant':
      return [
        renderHero({
          eyebrow: 'AI Studio',
          title: route.variant === 'video' ? 'Video model workflows' : 'Image model workflows',
          subtitle: route.variant === 'video'
            ? 'Compare scene generation, clip ideation, and campaign-testing workflows across model providers.'
            : 'Build thumbnails, concept frames, storyboard references, and creative variants for social packaging.',
          actions: [
            { label: 'Back to AI Studio', href: '/ai-studio/' },
            { label: 'See tools', href: '/tools/', secondary: true },
          ],
          pills: route.variant === 'video' ? ['Kling 3.0', 'Veo 3', 'Sora 2'] : ['Nano Banana 2', 'Luma', 'Hailuo'],
        }),
        renderToolCards(6),
      ].join('');
    case 'spark':
      return [
        renderHero({
          eyebrow: 'Our AI',
          title: 'Spark the roadmap, experiments, and differentiators',
          subtitle: 'This page works as a roadmap and positioning surface for the InwitClipps AI direction, including TrendSync and AI Studio alignment.',
          actions: [
            { label: 'See the API', href: '/api/' },
            { label: 'Explore AI Studio', href: '/ai-studio/', secondary: true },
          ],
          pills: ['TrendSync', 'AI Studio', 'Template system', 'Automation'],
        }),
        renderCardSection('Roadmap themes', 'The page mirrors roadmap-style resources from mature SaaS products.', [
          { title: 'TrendSync expansion', body: 'Use real-time topic signals to tune hooks, captions, and post angles.' },
          { title: 'Template orchestration', body: 'Move from ad hoc output to reusable layout and campaign systems.' },
          { title: 'API surface growth', body: 'Expose more of the underlying workflow for product teams and embedded experiences.' },
        ]),
      ].join('');
    case 'legal':
      return `
        <section class="shell article-shell">
          <article class="card article-layout">
            <p class="eyebrow">Company and legal</p>
            <h1>${route.legalPage.title}</h1>
            ${route.legalPage.body.map((paragraph) => `<p>${paragraph}</p>`).join('')}
          </article>
        </section>
      `;
    case 'sitemap-html':
      return renderSitemapPage();
    default:
      return `
        <section class="shell article-shell">
          <article class="card article-layout">
            <h1>${route.pageTitle}</h1>
            <p>${route.description}</p>
          </article>
        </section>
      `;
  }
}

function renderAlternateLinks(route) {
  const alternates = [`<link rel="canonical" href="${SITE_META.domain}${route.pathname === '/' ? '/' : route.pathname}" />`];

  if (route.kind === 'tool') {
    alternates.push(...LOCALES.map((locale) => `<link rel="alternate" hreflang="${locale}" href="${SITE_META.domain}/${locale}/tools/${route.tool.slug}/" />`));
    alternates.push(`<link rel="alternate" hreflang="x-default" href="${SITE_META.domain}/tools/${route.tool.slug}/" />`);
  }

  if (route.kind === 'localized-tool') {
    alternates.push(...LOCALES.map((locale) => `<link rel="alternate" hreflang="${locale}" href="${SITE_META.domain}/${locale}/tools/${route.tool.slug}/" />`));
    alternates.push(`<link rel="alternate" hreflang="x-default" href="${SITE_META.domain}/tools/${route.tool.slug}/" />`);
  }

  return alternates.join('\n');
}

function renderDocument(route) {
  const pageLang = route.locale || 'en';
  const heroHtml = renderMain(route);
  const description = route.description || SITE_META.description;
  const activeKey = route.navKey || null;

  return `<!DOCTYPE html>
<html lang="${pageLang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${route.pageTitle}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="theme-color" content="#0d0d0d" />
  ${renderAlternateLinks(route)}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="stylesheet" href="/assets/styles.css" />
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_META.brand,
    url: SITE_META.domain,
    sameAs: SOCIAL_LINKS.map((link) => link.href),
  })}</script>
</head>
<body>
  <header class="site-header">
    <div class="shell header-shell">
      <a class="brand" href="/">
        <span class="brand-mark">IC</span>
        <span>
          <strong>${SITE_META.brand}</strong>
          <small>${SITE_META.tagline}</small>
        </span>
      </a>
      <button class="mobile-toggle" type="button" data-nav-toggle aria-label="Toggle navigation">Menu</button>
      <nav class="site-nav" data-nav-drawer>
        ${renderNav(activeKey)}
      </nav>
      <div class="header-actions">
        <a class="button button-secondary" href="/contact/">Sign in</a>
        <a class="button button-primary" href="/pricing/">Sign up for free</a>
      </div>
    </div>
  </header>
  <main>
    ${heroHtml}
  </main>
  ${renderFooter()}
  <aside class="cookie-banner" data-cookie-banner>
    <p><strong>🍪</strong> This website uses cookies to preserve the complete marketing-site experience.</p>
    <div class="cookie-actions">
      <a class="button button-secondary" href="/cookies-policy/">Learn more</a>
      <button class="button button-primary" type="button" data-cookie-accept>Accept</button>
    </div>
  </aside>
  <script type="module" src="/assets/app.js"></script>
</body>
</html>`;
}

export function getSiteManifest() {
  const routes = buildRoutes();
  return {
    buildVersion: BUILD_VERSION,
    brand: SITE_META.brand,
    locales: LOCALES,
    tools: TOOLS,
    comparisons: COMPARISONS,
    audiences: AUDIENCES,
    blogPosts: BLOG_POSTS,
    knowledgeBase: KNOWLEDGE_BASE_ARTICLES,
    routes,
  };
}

export function renderSitemapXml() {
  const urls = buildRoutes()
    .filter((route) => !DIRECT_FILE_ROUTES.has(route.pathname))
    .map((route) => `  <url><loc>${SITE_META.domain}${route.pathname === '/' ? '/' : route.pathname}</loc></url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function renderRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_META.domain}/sitemap.xml
`;
}

export function renderRoute(pathname) {
  const normalized = normalizePathname(pathname);
  const route = getRouteMap().get(normalized);

  if (!route) return null;
  if (route.kind === 'sitemap-xml') return renderSitemapXml();
  if (route.kind === 'robots') return renderRobotsTxt();

  return renderDocument(route);
}

function pathnameToFile(pathname, outDir) {
  if (pathname === '/') return path.join(outDir, 'index.html');
  if (pathname === '/sitemap.xml') return path.join(outDir, 'sitemap.xml');
  if (pathname === '/robots.txt') return path.join(outDir, 'robots.txt');
  return path.join(outDir, pathname.slice(1), 'index.html');
}

function copyAsset(assetName) {
  const source = path.join(ASSET_SOURCE_DIR, assetName);
  const destination = path.join(GENERATED_DIR, 'assets', assetName);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

export function buildStaticSite(outDir = GENERATED_DIR) {
  const manifest = getSiteManifest();

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });

  copyAsset('styles.css');
  copyAsset('app.js');

  for (const route of manifest.routes) {
    const rendered = renderRoute(route.pathname);
    const filePath = pathnameToFile(route.pathname, outDir);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, rendered, 'utf8');
  }

  fs.writeFileSync(path.join(outDir, 'site-manifest.json'), JSON.stringify({
    buildVersion: BUILD_VERSION,
    routeCount: manifest.routes.length,
  }, null, 2));

  return outDir;
}

export function ensureSiteBuilt() {
  const markerPath = path.join(GENERATED_DIR, 'site-manifest.json');

  try {
    const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
    if (marker.buildVersion === BUILD_VERSION && marker.routeCount === buildRoutes().length) {
      return GENERATED_DIR;
    }
  } catch {
    // missing or stale marker; rebuild below
  }

  return buildStaticSite();
}

if (process.argv[1] === __filename) {
  const outDir = buildStaticSite();
  // eslint-disable-next-line no-console
  console.log(`Generated InwitClipps marketing site in ${outDir}`);
}
