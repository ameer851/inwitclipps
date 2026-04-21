export const SITE_META = {
  brand: 'InwitClipps',
  domain: 'https://inwitclipps.ai',
  tagline: 'AI-powered viral clip extraction from long-form video',
  description:
    'InwitClipps turns long-form video into social-ready clips, captions, and repurposed campaigns with AI workflows for creators, marketers, and product teams.',
};

export const LOCALE_LABELS = {
  ar: 'Arabic',
  bg: 'Bulgarian',
  cn: 'Chinese (CN)',
  cs: 'Czech',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  es: 'Spanish',
  fi: 'Finnish',
  fr: 'French',
  he: 'Hebrew',
  hi: 'Hindi',
  hr: 'Croatian',
  hu: 'Hungarian',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  lt: 'Lithuanian',
  ms: 'Malay',
  nl: 'Dutch',
  no: 'Norwegian',
  pl: 'Polish',
  pt: 'Portuguese',
  ro: 'Romanian',
  ru: 'Russian',
  sk: 'Slovak',
  sr: 'Serbian',
  sv: 'Swedish',
  tr: 'Turkish',
  tw: 'Chinese (TW)',
  uk: 'Ukrainian',
  vi: 'Vietnamese',
  zh: 'Chinese',
};

export const LOCALES = Object.keys(LOCALE_LABELS);

export const NAV_ITEMS = [
  { label: 'AI Studio', href: '/ai-studio/' },
  { label: 'Our AI', href: '/spark/' },
  { label: 'Use cases', href: '/who-we-help/social-media-marketers/' },
  { label: 'Tools', href: '/tools/' },
  { label: 'Resources', href: '/blog/' },
  { label: 'Pricing', href: '/pricing/' },
  { label: 'API', href: '/api/' },
];

export const FOOTER_GROUPS = [
  {
    title: 'Tools',
    links: [
      { label: 'AI podcast clip generator', href: '/tools/ai-podcast-clip-generator/' },
      { label: 'AI video editor', href: '/tools/ai-video-editor/' },
      { label: 'AI video generator', href: '/tools/ai-video-generator/' },
      { label: 'Video translator', href: '/tools/video-translator/' },
      { label: 'TikTok video editor', href: '/tools/tiktok-video-editor/' },
      { label: 'YouTube clip maker', href: '/tools/youtube-clip-maker/' },
      { label: 'All tools', href: '/tools/' },
    ],
  },
  {
    title: 'Who we help',
    links: [
      { label: 'Social media marketers', href: '/who-we-help/social-media-marketers/' },
      { label: 'Content marketers', href: '/who-we-help/content-marketers/' },
      { label: 'Performance marketers', href: '/who-we-help/performance-marketers/' },
      { label: 'Event marketers', href: '/who-we-help/event-marketers/' },
      { label: 'Podcasters', href: '/who-we-help/podcasters/' },
      { label: 'Agencies', href: '/who-we-help/agencies/' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog/' },
      { label: 'Knowledge base', href: '/knowledge-base/' },
      { label: 'Pricing', href: '/pricing/' },
      { label: 'API', href: '/api/' },
      { label: 'Vizard vs Opus', href: '/alternatives/opus/' },
      { label: 'Vizard vs CapCut', href: '/alternatives/capcut/' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about/' },
      { label: 'Affiliate', href: '/affiliate/' },
      { label: 'Contact', href: '/contact/' },
      { label: 'Terms of service', href: '/user-service/' },
      { label: 'Privacy policy', href: '/privacy-policy/' },
      { label: 'Cookie policy', href: '/cookies-policy/' },
    ],
  },
];

export const HOME_METRICS = [
  { value: '10x', label: 'faster short-form production' },
  { value: '34', label: 'locale expansions ready for SEO' },
  { value: '99.99%', label: 'rendering and automation uptime target' },
  { value: '1 API', label: 'for clips, captions, and workflow orchestration' },
];

export const HOME_FEATURES = [
  {
    title: 'AI clip discovery',
    body: 'Score long-form footage for hooks, retention moments, and high-signal cuts so your editors start with ranked highlights instead of blank timelines.',
  },
  {
    title: 'Text-based editing',
    body: 'Trim clips, rewrite hooks, and reshape pacing from transcripts, captions, and scene intent rather than frame-by-frame manual edits.',
  },
  {
    title: 'Platform-ready exports',
    body: 'Package clips for TikTok, Reels, Shorts, ads, and internal teams with reusable formats, motion styles, captions, and CTA treatments.',
  },
  {
    title: 'Trend-aware workflows',
    body: 'Use TrendSync data from the backend to align titles, hooks, and distribution packages with current social momentum.',
  },
];

export const TRUST_LOGOS = [
  'Ubisoft',
  'Stanford',
  'Bookee',
  'Morningstar',
  'Google',
  'Hopper',
];

export const TESTIMONIALS = [
  {
    name: 'Sean S.',
    role: 'Director of Business Development',
    body: 'InwitClipps cut our clip packaging time from hours to a repeatable workflow. The team ships more experiments without adding headcount.',
  },
  {
    name: 'Nicolan L.',
    role: 'Blogger and Content Creator',
    body: 'The editing flow feels simple, but the output is polished enough to publish immediately. It made repurposing sustainable for me.',
  },
  {
    name: 'Jade M.',
    role: 'Growth Marketer',
    body: 'The combination of trend context, caption styles, and reusable templates gives us a sharper social engine than generic clipping tools.',
  },
];

export const PRICING_PLANS = [
  {
    name: 'Free',
    price: '$0',
    cadence: '/month',
    badge: 'Starter',
    description: 'For validating workflows and testing AI clipping on a few uploads.',
    features: ['5 exports per month', 'Basic captions', 'Single workspace', 'Email support'],
  },
  {
    name: 'Pro',
    price: '$39',
    cadence: '/month',
    badge: 'Most popular',
    description: 'For creators and solo operators who need consistent clip output.',
    features: ['Unlimited projects', 'Platform presets', 'Trend-aware suggestions', 'Priority support'],
  },
  {
    name: 'Team',
    price: '$149',
    cadence: '/month',
    badge: 'Scale',
    description: 'For marketing teams shipping campaigns, podcasts, and product videos.',
    features: ['Shared brand templates', 'Approval flow', 'Usage analytics', 'Priority queueing'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    badge: 'Custom',
    description: 'For API buyers, agencies, and multi-brand operations with custom governance.',
    features: ['Custom SLAs', 'Dedicated onboarding', 'Security review', 'API volume pricing'],
  },
];

export const PRICING_MATRIX = [
  ['Exports per month', '5', 'Unlimited', 'Unlimited', 'Custom'],
  ['Caption styles', '2', 'All', 'All + brand presets', 'Custom'],
  ['Workspaces', '1', '1', 'Unlimited', 'Unlimited'],
  ['TrendSync insights', 'No', 'Yes', 'Yes', 'Yes'],
  ['API access', 'No', 'No', 'Add-on', 'Included'],
  ['Support', 'Email', 'Priority email', 'Priority chat', 'Dedicated success'],
];

export const PRICING_FAQS = [
  {
    question: 'How do I upgrade from free to paid?',
    answer: 'Upgrade from the workspace billing panel or the pricing page CTA. Plan changes apply immediately and keep existing project history.',
  },
  {
    question: 'Can I cancel or change plans anytime?',
    answer: 'Yes. Billing is self-serve for Free, Pro, and Team plans. Enterprise plans follow the negotiated agreement and support process.',
  },
  {
    question: 'What payment methods are supported?',
    answer: 'Cards and Stripe-supported payment methods are available by default, with invoicing available for larger contracts.',
  },
  {
    question: 'Is support different by plan?',
    answer: 'Yes. Higher tiers unlock priority response times, onboarding help, and workflow guidance for template rollouts.',
  },
];

export const API_FEATURES = [
  {
    title: 'Automate social-ready clip generation',
    body: 'Create projects, fetch ranked clips, and route metadata into your own product or content operations stack.',
  },
  {
    title: 'Reliable engine',
    body: 'Design for queued rendering, safe retries, and high-volume clip workloads without handing orchestration to the browser.',
  },
  {
    title: 'Security and governance',
    body: 'Layer auth, env-based secrets, compliance review, and usage controls on top of the same backend stack that powers jobs today.',
  },
];

export const API_CODE_EXAMPLES = {
  Python: `import requests

VIZARD_API_KEY = "YOUR_API_KEY"
headers = {
    "Authorization": f"Bearer {VIZARD_API_KEY}",
    "Content-Type": "application/json",
}

project = requests.post(
    "https://inwitclipps.ai/api/v1/projects",
    headers=headers,
    json={"source_url": "https://youtube.com/watch?v=demo"},
).json()

clips = requests.get(
    f"https://inwitclipps.ai/api/v1/projects/{project['id']}/clips",
    headers=headers,
).json()
print(clips)
`,
  Java: `HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://inwitclipps.ai/api/v1/projects"))
    .header("Authorization", "Bearer YOUR_API_KEY")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(
        "{\\"source_url\\":\\"https://youtube.com/watch?v=demo\\"}"
    ))
    .build();`,
  Go: `payload := strings.NewReader(\`{"source_url":"https://youtube.com/watch?v=demo"}\`)
req, _ := http.NewRequest("POST", "https://inwitclipps.ai/api/v1/projects", payload)
req.Header.Add("Authorization", "Bearer YOUR_API_KEY")
req.Header.Add("Content-Type", "application/json")`,
  Curl: `curl -X POST https://inwitclipps.ai/api/v1/projects \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"source_url":"https://youtube.com/watch?v=demo"}'`,
};

export const API_FAQS = [
  {
    question: 'Who gets access to the API?',
    answer: 'API access is aimed at teams building workflows, products, or services on top of AI clipping and social distribution.',
  },
  {
    question: 'How does API pricing work?',
    answer: 'Pricing is based on volume, workflow shape, and support expectations. Team and enterprise buyers can request custom plans.',
  },
  {
    question: 'Where should I start?',
    answer: 'Start with project creation, clip retrieval, and template-aware rendering. The API page includes code examples and documentation entry points.',
  },
];

export const TOOL_SEEDS = [
  ['ai-podcast-clip-generator', 'AI podcast clip generator', 'Podcast workflow'],
  ['ai-video-editor', 'AI video editor', 'Editing'],
  ['ai-video-generator', 'AI video generator', 'Creation'],
  ['auto-subtitle-generator-online', 'Auto subtitle generator online', 'Captions'],
  ['auto-video-editor', 'Auto video editor', 'Editing'],
  ['clip-maker', 'Clip maker', 'Editing'],
  ['crop-video', 'Crop video', 'Editing'],
  ['dictation-software', 'Dictation software', 'Transcription'],
  ['facebook-video-editor', 'Facebook video editor', 'Platform'],
  ['free-online-editor', 'Free online editor', 'Editing'],
  ['instagram-video-editor', 'Instagram video editor', 'Platform'],
  ['linkedin-video-maker', 'LinkedIn video maker', 'Platform'],
  ['mp3-to-text', 'MP3 to text', 'Transcription'],
  ['mp4-to-text', 'MP4 to text', 'Transcription'],
  ['podcast-editor', 'Podcast editor', 'Podcast workflow'],
  ['podcast-to-text', 'Podcast to text', 'Podcast workflow'],
  ['repurpose-video', 'Repurpose video', 'Distribution'],
  ['resize-video', 'Resize video', 'Formatting'],
  ['screen-recorder', 'Screen recorder', 'Capture'],
  ['share-video', 'Share video', 'Distribution'],
  ['subtitle-editor', 'Subtitle editor', 'Captions'],
  ['tiktok-video-editor', 'TikTok video editor', 'Platform'],
  ['transcribe-audio-to-text', 'Transcribe audio to text', 'Transcription'],
  ['transcription', 'Transcription', 'Transcription'],
  ['twitch-editor', 'Twitch editor', 'Platform'],
  ['twitter-video-maker', 'Twitter video maker', 'Platform'],
  ['video-splitter', 'Video splitter', 'Editing'],
  ['video-to-text', 'Video to text', 'Transcription'],
  ['video-translator', 'Video translator', 'Localization'],
  ['video-trimmer', 'Video trimmer', 'Editing'],
  ['youtube-video-editor', 'YouTube video editor', 'Platform'],
  ['youtube-clip-maker', 'YouTube clip maker', 'Platform'],
  ['youtube-shorts-maker', 'YouTube Shorts maker', 'Platform'],
  ['twitter-downloader', 'Twitter downloader', 'Downloader'],
  ['tiktok-downloader', 'TikTok downloader', 'Downloader'],
  ['kling-3', 'Kling 3.0', 'AI studio'],
  ['veo-3', 'Veo 3', 'AI studio'],
  ['sora-2', 'Sora 2', 'AI studio'],
  ['nano-banana-2', 'Nano Banana 2', 'AI studio'],
  ['luma', 'Luma', 'AI studio'],
  ['hailuo', 'Hailuo', 'AI studio'],
];

export const TOOLS = TOOL_SEEDS.map(([slug, title, category]) => ({
  slug,
  title,
  category,
  summary: `${title} inside InwitClipps helps teams move from raw footage to publishable social assets with faster clip selection, transcript-aware editing, and reusable templates.`,
}));

export const COMPARISONS = [
  ['opus', 'Opus Clip', 'InwitClipps vs Opus'],
  ['capcut', 'CapCut', 'InwitClipps vs CapCut'],
  ['vidyo', 'Vidyo', 'InwitClipps vs Vidyo'],
  ['getmunch', 'GetMunch', 'InwitClipps vs GetMunch'],
  ['captions', 'Captions', 'InwitClipps vs Captions'],
  ['submagic', 'Submagic', 'InwitClipps vs Submagic'],
  ['veed', 'VEED', 'InwitClipps vs VEED'],
].map(([slug, competitor, title]) => ({
  slug,
  competitor,
  title,
  summary: `Compare InwitClipps against ${competitor} across clip quality, workflow depth, trend-awareness, and scaling flexibility.`,
}));

export const AUDIENCES = [
  ['social-media-marketers', 'Social media marketers'],
  ['content-marketers', 'Content marketers'],
  ['performance-marketers', 'Performance marketers'],
  ['event-marketers', 'Event marketers'],
  ['podcasters', 'Podcasters'],
  ['coaches', 'Coaches'],
  ['consultants', 'Consultants'],
  ['agencies', 'Agencies'],
].map(([slug, title]) => ({
  slug,
  title,
  summary: `${title} use InwitClipps to standardize clip output, increase publishable volume, and reduce editing bottlenecks across long-form content.`,
}));

export const BLOG_POSTS = [
  ['10-best-ai-video-generative-models-in-2026', '10 best AI video generative models in 2026'],
  ['10-best-ai-video-editors-to-streamline-your-content-creation', '10 best AI video editors to streamline content creation'],
  ['10-best-subtitle-editing-tools', '10 best subtitle editing tools'],
  ['youtube-shorts-growth-playbook', 'YouTube Shorts growth playbook'],
  ['tiktok-tips-for-repeatable-clip-systems', 'TikTok tips for repeatable clip systems'],
  ['how-to-start-a-podcast-on-youtube', 'How to start a podcast on YouTube'],
].map(([slug, title], index) => ({
  slug,
  title,
  category: index % 2 === 0 ? 'AI video' : 'Creator growth',
  excerpt: `${title} explores how modern AI editing, captions, and repurposing systems change content velocity and post-production decisions.`,
  body: [
    'Modern content teams are no longer deciding whether to repurpose video. They are deciding how to do it without increasing editing headcount or breaking their publishing rhythm.',
    'The practical edge comes from turning long-form source material into repeatable clip pipelines: ranked moments, transcript-aware editing, caption styling, and platform-specific packaging.',
    'InwitClipps fits into that model by pairing automation with enough control to keep outputs on-brand rather than generic.',
  ],
}));

export const KNOWLEDGE_BASE_ARTICLES = [
  ['workspace-setup', 'Workspace setup'],
  ['brand-templates', 'Brand templates'],
  ['clip-ranking', 'Clip ranking and scoring'],
  ['captions-and-styles', 'Captions and style presets'],
  ['api-quickstart', 'API quickstart'],
  ['billing-and-plan-controls', 'Billing and plan controls'],
].map(([slug, title]) => ({
  slug,
  title,
  excerpt: `${title} documentation for operators setting up InwitClipps across teams, campaigns, and API-backed workflows.`,
}));

export const LEGAL_PAGES = [
  ['about', 'About InwitClipps'],
  ['affiliate', 'Affiliate program'],
  ['contact', 'Contact InwitClipps'],
  ['user-service', 'Terms of service'],
  ['privacy-policy', 'Privacy policy'],
  ['cookies-policy', 'Cookie policy'],
  ['google-api-services-disclosure', 'Google API services disclosure'],
  ['affiliate-program-agreement', 'Affiliate program agreement'],
].map(([slug, title]) => ({
  slug,
  title,
  body: [
    `${title} explains the policies, operational boundaries, and commitments behind the InwitClipps platform.`,
    'This placeholder legal content is structured to be replaced by approved policy copy while preserving the full route map, navigation, and internal linking required by the marketing site.',
  ],
}));

export const RESOURCE_LINKS = [
  { label: 'Blog', href: '/blog/' },
  { label: 'Knowledge base', href: '/knowledge-base/' },
  { label: 'Video tutorials', href: '/knowledge-base/api-quickstart/' },
  { label: 'Roadmap', href: '/spark/' },
  { label: 'Help center', href: '/knowledge-base/' },
];

export const SOCIAL_LINKS = [
  { label: 'X', href: 'https://x.com/' },
  { label: 'LinkedIn', href: 'https://linkedin.com/' },
  { label: 'YouTube', href: 'https://youtube.com/' },
  { label: 'Discord', href: 'https://discord.com/' },
];
