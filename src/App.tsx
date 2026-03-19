import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Flame, 
  Bot, 
  FileText, 
  Bell, 
  Settings, 
  LogOut, 
  Search, 
  TrendingUp, 
  Plus,
  Satellite,
  X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';

// --- Types ---
interface Trend {
  id: string;
  rank: number | string;
  score: number | string;
  trend?: string;
  growth?: string;
  title: string;
  platforms?: string;
  sources?: string;
  tags?: string[];
  summary?: string;
  angle?: string;
  action?: string;
  timeline?: string;
  platformFit?: string;
  status?: string;
}

interface Agent {
  id: string;
  seed: string;
  status: string;
  pulse?: boolean;
  name?: string;
  role?: string;
  task?: string;
  queue?: string;
  last?: string;
  cost?: string;
  detail?: string;
}

interface TokenUsage {
  id: string;
  date: string;
  value: number;
  category?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  // Data States
  const [trends, setTrends] = useState<Trend[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage[]>([]);

  // UI States
  const [activeFilter, setActiveFilter] = useState({
    time: '24 小时',
    platform: '全部平台',
    topic: 'AI',
    format: '适合短帖'
  });
  
  const [toast, setToast] = useState({ isOpen: false, message: '' });
  const [drawerData, setDrawerData] = useState<Trend | null>(null);
  const [reviewData, setReviewData] = useState<{ title: string, source: string, format: string, score: string } | null>(null);
  const [agentModalData, setAgentModalData] = useState<Agent | null>(null);

  const showToast = (message: string) => {
    setToast({ isOpen: true, message });
    setTimeout(() => setToast({ isOpen: false, message: '' }), 1600);
  };

  // Firestore Listeners
  useEffect(() => {
    const trendsQuery = query(collection(db, 'trends'), orderBy('rank', 'asc'), limit(10));
    const unsubscribeTrends = onSnapshot(trendsQuery, (snapshot) => {
      setTrends(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trend)));
    }, (error) => console.error("Trends Listener Error:", error));

    const agentsQuery = query(collection(db, 'agents'));
    const unsubscribeAgents = onSnapshot(agentsQuery, (snapshot) => {
      setAgents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent)));
    }, (error) => console.error("Agents Listener Error:", error));

    const usageQuery = query(collection(db, 'tokenUsage'), orderBy('date', 'desc'), limit(7));
    const unsubscribeUsage = onSnapshot(usageQuery, (snapshot) => {
      setTokenUsage(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TokenUsage)).reverse());
    }, (error) => console.error("Usage Listener Error:", error));

    return () => {
      unsubscribeTrends();
      unsubscribeAgents();
      unsubscribeUsage();
    };
  }, []);

  // Fallback Data if Firestore is empty
  const displayTrends = trends.length > 0 ? trends : [
    {
      id: "1", rank: "#1", score: "96", title: "OpenAI 新模型突破长链推理", sources: "X / Reddit / Hacker News / YouTube", growth: "↑ 18%",
      summary: "这个话题在多平台同时升温，已经从技术讨论扩散到更泛科技圈，具备强传播势能和内容延展空间。",
      angle: "从“不是简单堆参数，而是重做推理链路”这个角度切入，更容易形成观点差异。",
      action: "优先生成 InStreet 短帖，再扩展成公众号长文。", timeline: "过去 3 小时快速上升，未来 6 小时仍然值得跟进。",
      platformFit: "最适合 X、InStreet、公众号", status: "Ava 已抓取，Bva 待起草", tags: ["4 平台聚合", "适合短帖", "建议立即跟进"]
    },
    {
      id: "2", rank: "#2", score: "88", title: "英伟达财报带动算力板块再爆发", sources: "Bloomberg / Reddit / Google Trends", growth: "↑ 11%",
      summary: "财报消息刺激市场情绪，带动算力与 AI 基础设施讨论升温，适合做中等深度的行业观察。",
      angle: "从“财报超预期不只是数字，而是验证了 AI 需求持续上行”来写更好。",
      action: "优先做长文版，再拆成短帖观点。", timeline: "短期热度高，但更偏行业判断，适合今天内跟进。",
      platformFit: "公众号 / 长文 / 社群", status: "待观察", tags: ["3 平台聚合", "适合长文", "继续观察"]
    },
    {
      id: "3", rank: "#3", score: "74", title: "AI Agent 创业工具链正在快速升温", sources: "GitHub / Product Hunt / X", growth: "↑ 6%",
      summary: "这个话题适合写观点型内容，讨论门槛低，传播效率不错，但爆发性弱于前两名。",
      angle: "从“创业者为什么开始围着 Agent 工具链重新搭团队”切入更有讨论空间。",
      action: "加入观察池，视空档补发观点帖。", timeline: "稳步升温，适合当第二梯队素材。",
      platformFit: "InStreet / X", status: "观察中", tags: ["3 平台聚合", "适合观点帖", "中高优先"]
    }
  ];

  const displayAgents = agents.length > 0 ? agents : [
    { id: "1", name: "Ava", role: "Scraper", seed: "ava", status: "正常", task: "抓取 Reddit + X 热点", queue: "3", last: "2 分钟前", cost: "1m 32s", detail: "负责跨平台热点抓取与原始数据去重，目前已完成 Reddit 和 X 的上一轮扫描，下一轮将在 12:30 自动执行。", pulse: true },
    { id: "2", name: "Bva", role: "Writer", seed: "bva", status: "繁忙", task: "生成 InStreet 草稿", queue: "5", last: "5 分钟前", cost: "3m 11s", detail: "负责短帖和长文起草。当前正在为全球热榜 #1 和 #2 生成两个版本的文稿，建议优先审核 #1。" },
    { id: "3", name: "Cva", role: "Review", seed: "cva", status: "待命", task: "等待高优稿件审核", queue: "1", last: "12 分钟前", cost: "42s", detail: "负责语气、风险和结构检查。可用于自动初审，也可在你点“去审核”后接手生成修改建议。" },
    { id: "4", name: "Dva", role: "Report", seed: "dva", status: "正常", task: "生成中午日报摘要", queue: "2", last: "8 分钟前", cost: "58s", detail: "负责晨报、午报、晚报的结构化摘要与结论生成，当前正在等待午报汇总数据恢复。" },
    { id: "5", name: "Eva", role: "Alert", seed: "eva", status: "异常", task: "监控午报延迟", queue: "2", last: "刚刚", cost: "持续中", detail: "负责异常监控与告警，目前发现午报链路延迟 8 分钟，建议重试任务或切换备用链路。" }
  ];

  const topTrend = displayTrends[0];
  const totalTokens = tokenUsage.length > 0 ? (tokenUsage.reduce((acc, curr) => acc + curr.value, 0) / 1000000).toFixed(2) : "6.82";

  const isOverlayOpen = !!drawerData || !!reviewData || !!agentModalData;

  const closeAll = () => {
    setDrawerData(null);
    setReviewData(null);
    setAgentModalData(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="shell max-w-[1760px] mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-12 gap-5 md:gap-6">

          {/* Sidebar */}
          <aside className="col-span-12 xl:col-span-1 flex xl:flex-col items-center justify-between xl:justify-start gap-4">
            <div className="flex xl:flex-col items-center gap-4 w-full xl:w-auto">
              <div className="hidden xl:flex flex-col items-center gap-1 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-ink text-gold flex items-center justify-center text-lg shadow-soft">
                  <Satellite size={20} />
                </div>
                <div className="text-xs font-extrabold tracking-tight">OpenClaw</div>
              </div>

              <div className="glass-nav rounded-[28px] px-3 py-4 flex xl:flex-col gap-3">
                <button className={cn("nav-btn", activeTab === 'home' && "active")} onClick={() => setActiveTab('home')}><Home size={20} /></button>
                <button className={cn("nav-btn", activeTab === 'trends' && "active")} onClick={() => setActiveTab('trends')}><Flame size={20} /></button>
                <button className={cn("nav-btn", activeTab === 'agents' && "active")} onClick={() => setActiveTab('agents')}><Bot size={20} /></button>
                <button className={cn("nav-btn", activeTab === 'reports' && "active")} onClick={() => setActiveTab('reports')}><FileText size={20} /></button>
              </div>

              <div className="glass-nav rounded-[28px] px-3 py-4 flex xl:flex-col gap-3">
                <button className="nav-btn relative">
                  <Bell size={20} />
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-coral"></span>
                </button>
                <button className="nav-btn"><Settings size={20} /></button>
              </div>
            </div>

            <div className="hidden xl:flex flex-col items-center gap-4 mt-auto">
              <button className="nav-btn liquid-btn rounded-[18px]"><LogOut size={20} /></button>
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=bowen" alt="avatar" className="w-14 h-14 rounded-full border border-line bg-white shadow-soft" />
            </div>
          </aside>

          {/* Main Content */}
          <main className="col-span-12 xl:col-span-11 space-y-6">
            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <button className="px-4 py-2 rounded-full bg-ink text-white text-sm font-semibold shadow-soft">Dashboard</button>
                <button className="px-4 py-2 rounded-full bg-white/75 border border-line text-sm font-semibold text-ink">Trends</button>
                <button className="px-4 py-2 rounded-full bg-white/75 border border-line text-sm font-semibold text-ink">Review</button>
                <button className="px-4 py-2 rounded-full bg-white/75 border border-line text-sm font-semibold text-ink">Agents</button>
                <button className="px-4 py-2 rounded-full bg-white/75 border border-line text-sm font-semibold text-ink">Assets</button>
                <button className="px-4 py-2 rounded-full bg-white/75 border border-line text-sm font-semibold text-ink">Reports</button>
              </div>

              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3 text-sm muted-text font-medium mb-2">
                    <span className="pill subtle-pill">系统在线</span>
                    <span>北京时间 12:20 · 下次热榜刷新 12:30</span>
                  </div>
                  <h1 className="text-[2.35rem] font-bold tracking-[-0.03em]">Hi, Bowen</h1>
                  <p className="muted-text mt-2 text-[15px]">可点击交互原型版 · Token 折线图已上移到右侧决策卡上方</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <div className="glass-search rounded-full px-5 py-3 flex items-center gap-3 min-w-[280px]">
                    <Search size={18} className="muted-text" />
                    <input className="w-full bg-transparent outline-none text-sm" placeholder="Search 热榜、草稿、Agent、日报、已发布内容..." />
                  </div>
                  <button className="bg-ink text-white rounded-full px-6 py-3 font-semibold">Command Center</button>
                </div>
              </div>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5">
              <div className="card p-5">
                <div className="stat-label">今日 Tokens</div>
                <div className="mt-2 flex items-end justify-between">
                  <div className="text-[2rem] font-extrabold">1.24M</div>
                  <span className="text-sm font-semibold text-coral">60%</span>
                </div>
                <div className="mt-4 flex items-end gap-1 h-8 opacity-80">
                  <span className="w-2 rounded-full bg-[#D8D0C7] h-3"></span>
                  <span className="w-2 rounded-full bg-[#D8D0C7] h-4"></span>
                  <span className="w-2 rounded-full bg-[#D8D0C7] h-5"></span>
                  <span className="w-2 rounded-full bg-[#D8D0C7] h-4"></span>
                  <span className="w-2 rounded-full bg-[#D8D0C7] h-6"></span>
                  <span className="w-2 rounded-full bg-coral h-8"></span>
                  <span className="w-2 rounded-full bg-coral h-7"></span>
                </div>
              </div>

              <div className="card p-5">
                <div className="stat-label">InStreet 增长</div>
                <div className="mt-2 flex items-end justify-between">
                  <div className="text-[2rem] font-extrabold">+186</div>
                  <span className="text-sm font-semibold text-success">今日净增</span>
                </div>
                <div className="mt-4 flex items-end gap-1 h-8 opacity-80">
                  <span className="w-2 rounded-full bg-[#D8D0C7] h-2"></span>
                  <span className="w-2 rounded-full bg-[#D8D0C7] h-3"></span>
                  <span className="w-2 rounded-full bg-[#D8D0C7] h-4"></span>
                  <span className="w-2 rounded-full bg-[#D8D0C7] h-5"></span>
                  <span className="w-2 rounded-full bg-[#BFC79A] h-6"></span>
                  <span className="w-2 rounded-full bg-[#BFC79A] h-7"></span>
                  <span className="w-2 rounded-full bg-[#BFC79A] h-8"></span>
                </div>
              </div>

              <div className="card p-5">
                <div className="stat-label">公众号阅读</div>
                <div className="mt-2 flex items-end justify-between">
                  <div className="text-[2rem] font-extrabold">8,420</div>
                  <span className="text-sm font-semibold text-success">+14%</span>
                </div>
              </div>

              <div className="card p-5 bg-[#FFF9F2] border-[1.5px] border-[#E9DCC7]">
                <div className="stat-label">待审核草稿</div>
                <div className="mt-2 flex items-end justify-between">
                  <div className="text-[2rem] font-extrabold">6</div>
                  <span className="text-sm font-semibold text-[#9B6A25]">3 篇高优先</span>
                </div>
              </div>

              <div className="card p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="stat-label">Agents Active</div>
                    <div className="text-xs muted-text mt-1">点击卡片展开 Agent 详情</div>
                  </div>
                  <span className="text-sm font-semibold muted-text">{displayAgents.filter(a => a.status === '正常' || a.status === 'success').length} / {displayAgents.length}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {displayAgents.map(agent => (
                    <button 
                      key={agent.id} 
                      onClick={() => setAgentModalData(agent)}
                      className="text-center hover:opacity-80 transition-opacity"
                    >
                      <div className="agent-avatar mx-auto">
                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${agent.seed}`} alt={agent.seed} className="w-full h-full object-cover" />
                        <span className={cn(
                          "agent-status", 
                          (agent.status === '正常' || agent.status === 'success') ? "bg-success" : 
                          (agent.status === '繁忙' || agent.status === 'gold') ? "bg-gold" : "bg-coral",
                          agent.pulse && "pulse"
                        )}></span>
                      </div>
                      <div className="mt-2 text-[11px] font-bold">{agent.name || agent.seed}</div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Main Dashboard Section */}
            <section className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 card p-6 md:p-7 min-h-[760px] relative overflow-hidden bg-[linear-gradient(180deg,#FBF8F4_0%,#F8F3ED_100%)]">
                <div className="blur-orb bg-gold w-[220px] h-[220px] top-[90px] right-[110px]"></div>
                <div className="blur-orb bg-coral w-[180px] h-[180px] top-[300px] right-[280px]"></div>
                <div className="blur-orb bg-blue-soft w-[150px] h-[150px] top-[130px] right-[10px]"></div>

                <div className="flex flex-col gap-4 mb-6 relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="section-title">全球提纯热榜</h2>
                      <p className="muted-text mt-1">点击热榜打开右侧详情抽屉。顶部筛选可切换选中状态。</p>
                    </div>
                    <button className="liquid-btn w-11 h-11 rounded-full text-ink flex items-center justify-center">
                      <TrendingUp size={20} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['24 小时', '3 小时', '30 分钟'].map(t => (
                      <button key={t} onClick={() => setActiveFilter(f => ({...f, time: t}))} className={cn("pill filter-pill", activeFilter.time === t && "active")}>{t}</button>
                    ))}
                    {['全部平台', 'X', 'Reddit', 'YouTube'].map(t => (
                      <button key={t} onClick={() => setActiveFilter(f => ({...f, platform: t}))} className={cn("pill filter-pill", activeFilter.platform === t && "active")}>{t}</button>
                    ))}
                    {['AI', '科技', '开源'].map(t => (
                      <button key={t} onClick={() => setActiveFilter(f => ({...f, topic: t}))} className={cn("pill filter-pill", activeFilter.topic === t && "active")}>{t}</button>
                    ))}
                    {['适合短帖', '适合长文'].map(t => (
                      <button key={t} onClick={() => setActiveFilter(f => ({...f, format: t}))} className={cn("pill filter-pill", activeFilter.format === t && "active")}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-5 relative z-10">
                  <div className="col-span-12 xl:col-span-7 space-y-3">
                    {displayTrends.map((trend, idx) => (
                      <div 
                        key={trend.id} 
                        className={cn("news-card rounded-[22px] border border-line bg-white p-4 flex items-center justify-between gap-4 cursor-pointer", drawerData?.id === trend.id && "active")}
                        onClick={() => setDrawerData(trend)}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("pill", idx === 0 ? "gold-pill" : idx === 1 ? "coral-pill" : "sage-pill")}>{trend.rank} · {trend.score}</span>
                            <span className="text-xs muted-text">{trend.growth || trend.trend}</span>
                          </div>
                          <div className="font-bold text-[18px] leading-7">{trend.title}</div>
                          <div className="text-[13px] muted-text mt-1">{trend.sources || trend.platforms}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {trend.tags ? trend.tags.map((tag, i) => (
                              <span key={i} className={cn("pill", i === 0 ? "subtle-pill" : i === 1 ? (idx === 0 ? "sage-pill" : "coral-pill") : (idx === 0 ? "gold-pill" : "subtle-pill"))}>{tag}</span>
                            )) : (
                              <span className="pill subtle-pill">暂无标签</span>
                            )}
                          </div>
                        </div>
                        <div className="relative z-10 flex flex-col gap-2 shrink-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setReviewData({ title: trend.title, source: `全球热榜 ${trend.rank}`, format: trend.action?.includes('短帖') ? 'InStreet 短帖' : '长文', score: String(trend.score) }); }}
                            className={cn("px-4 py-2 rounded-2xl text-sm font-semibold", idx === 0 ? "bg-ink text-white" : "border border-line")}
                          >
                            {idx === 0 ? '生成短帖' : idx === 1 ? '深度长文' : idx === 2 ? '加入观察' : '快速跟进'}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDrawerData(trend); }} className="px-4 py-2 rounded-2xl border border-line text-sm font-semibold">查看详情</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="col-span-12 xl:col-span-5 hidden xl:block">
                    <div className="glass-panel rounded-[30px] p-5 min-h-[610px] relative overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/35 to-transparent pointer-events-none"></div>

                      <div className="flex items-center justify-between mb-5 relative z-10">
                        <div>
                          <div className="text-xs muted-text">Decision Summary</div>
                          <div className="text-[22px] font-bold mt-1 tracking-[-0.03em]">当前最值得做什么</div>
                        </div>
                        <span className="pill subtle-pill">Top 5</span>
                      </div>

                      {topTrend && (
                        <div className="rounded-[26px] bg-white/48 border border-white/50 p-5 relative z-10 mb-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm muted-text">系统综合判断</div>
                              <div className="mt-2 text-[28px] font-extrabold leading-none truncate max-w-[150px]">{topTrend.title.substring(0, 10)}...</div>
                              <div className="text-sm muted-text mt-2">当前最值得立即处理的话题</div>
                            </div>

                            <div className="score-ring shrink-0">
                              <div className="score-ring-inner">
                                <div className="text-center">
                                  <div className="text-[28px] font-extrabold leading-none">{topTrend.score}</div>
                                  <div className="text-[11px] muted-text mt-1">综合分</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-5">
                            <div className="kpi-box">
                              <div className="text-[11px] muted-text">推荐形式</div>
                              <div className="font-bold mt-1">InStreet 短帖</div>
                            </div>
                            <div className="kpi-box">
                              <div className="text-[11px] muted-text">推荐发布时间</div>
                              <div className="font-bold mt-1">12:40</div>
                            </div>
                            <div className="kpi-box">
                              <div className="text-[11px] muted-text">适合平台</div>
                              <div className="font-bold mt-1">X / InStreet</div>
                            </div>
                            <div className="kpi-box">
                              <div className="text-[11px] muted-text">状态</div>
                              <div className="font-bold mt-1">等待跟进</div>
                            </div>
                          </div>

                          <div className="mt-5 space-y-4">
                            <div>
                              <div className="flex items-center justify-between text-sm mb-2"><span className="muted-text">传播势能</span><span className="font-bold">92</span></div>
                              <div className="w-full h-2.5 rounded-full bg-[#E7DED3]"><div className="h-2.5 rounded-full bg-ink" style={{width: '92%'}}></div></div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-sm mb-2"><span className="muted-text">内容转化</span><span className="font-bold">88</span></div>
                              <div className="w-full h-2.5 rounded-full bg-[#E7DED3]"><div className="h-2.5 rounded-full bg-coral" style={{width: '88%'}}></div></div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-sm mb-2"><span className="muted-text">话题延展</span><span className="font-bold">79</span></div>
                              <div className="w-full h-2.5 rounded-full bg-[#E7DED3]"><div className="h-2.5 rounded-full bg-gold" style={{width: '79%'}}></div></div>
                            </div>
                          </div>

                          <div className="mt-5 rounded-[20px] kpi-box">
                            <div className="text-[11px] muted-text">推荐动作</div>
                            <div className="font-bold mt-1">{topTrend.action || "先发观点帖，再转公众号长文，交给 Bva 起草。"}</div>
                          </div>

                          <div className="mt-5 flex gap-3">
                            <button 
                              onClick={() => setReviewData({ title: topTrend.title, source: `全球热榜 ${topTrend.rank}`, format: 'InStreet 短帖', score: String(topTrend.score) })}
                              className="flex-1 py-3 rounded-2xl bg-ink text-white font-semibold"
                            >
                              去审核
                            </button>
                            <button onClick={() => setDrawerData(topTrend)} className="flex-1 py-3 rounded-2xl border border-line font-semibold bg-white/70">展开详情</button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 relative z-10">
                        <div className="kpi-box">
                          <div className="text-[11px] muted-text">优先级建议</div>
                          <div className="font-bold mt-2">1 高热 / 2 中热 / 2 观察</div>
                        </div>
                        <div className="kpi-box">
                          <div className="text-[11px] muted-text">是否已有跟进</div>
                          <div className="font-bold mt-2">Ava 已抓取，Bva 待起草</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="col-span-12 lg:col-span-4 space-y-5">
                <div className="card p-6 bg-[linear-gradient(180deg,#FBF8F4_0%,#F8F3ED_100%)]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-xs muted-text">Runtime Cost</div>
                      <h3 className="card-title mt-1">Token 折线图</h3>
                      <p className="text-sm muted-text mt-1">已上移到待审核文稿决策卡上方</p>
                    </div>
                    <span className="pill subtle-pill">近 7 天</span>
                  </div>

                  <div className="rounded-[24px] bg-white border border-line px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs muted-text">本周累计</div>
                        <div className="text-[28px] font-extrabold leading-none mt-1">{totalTokens}M</div>
                      </div>
                      <div className="kpi-box">
                        <div className="text-[11px] muted-text">峰值</div>
                        <div className="font-bold mt-1">1.28M</div>
                      </div>
                    </div>

                    <svg viewBox="0 0 400 170" className="w-full h-[170px]">
                      <defs>
                        <linearGradient id="lineFillRightTop" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#7C86EE" stopOpacity="0.22"/>
                          <stop offset="100%" stopColor="#7C86EE" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <line x1="20" y1="20" x2="20" y2="140" stroke="#E8DED2"/>
                      <line x1="75" y1="20" x2="75" y2="140" stroke="#E8DED2"/>
                      <line x1="130" y1="20" x2="130" y2="140" stroke="#E8DED2"/>
                      <line x1="185" y1="20" x2="185" y2="140" stroke="#E8DED2"/>
                      <line x1="240" y1="20" x2="240" y2="140" stroke="#E8DED2"/>
                      <line x1="295" y1="20" x2="295" y2="140" stroke="#E8DED2"/>
                      <line x1="350" y1="20" x2="350" y2="140" stroke="#E8DED2"/>
                      <path d="M20 82 C45 70, 60 68, 75 78 S115 102, 130 88 S170 52, 185 62 S225 98, 240 86 S280 48, 295 56 S335 92, 350 78 L350 140 L20 140 Z" fill="url(#lineFillRightTop)"/>
                      <path d="M20 82 C45 70, 60 68, 75 78 S115 102, 130 88 S170 52, 185 62 S225 98, 240 86 S280 48, 295 56 S335 92, 350 78" fill="none" stroke="#7C86EE" strokeWidth="4" strokeLinecap="round"/>
                      <circle cx="185" cy="62" r="6" fill="#7C86EE"/>
                      <circle cx="185" cy="62" r="13" fill="#7C86EE" opacity="0.12"/>
                    </svg>

                    <div className="grid grid-cols-7 mt-2 text-[11px] muted-text font-semibold">
                      <div className="text-left">Sat</div>
                      <div className="text-center">Sun</div>
                      <div className="text-center">Mon</div>
                      <div className="text-center">Tue</div>
                      <div className="text-center">Wed</div>
                      <div className="text-center">Thu</div>
                      <div className="text-right">Fri</div>
                    </div>
                  </div>
                </div>

                <div className="card p-6 bg-[linear-gradient(180deg,#FBF8F4_0%,#F8F3ED_100%)]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="pill gold-pill">高优先</span>
                        <span className="text-xs muted-text">今日最值得处理</span>
                      </div>
                      <h3 className="card-title">待审文稿决策卡</h3>
                      <p className="text-sm muted-text mt-1">已下移到 Token 折线图下面</p>
                    </div>
                  </div>

                  <div className="relative pt-5 pb-2 px-1">
                    <div className="absolute inset-x-6 top-0 h-[250px] rounded-[22px] bg-[#F6EFE7] border border-[#E8DDCF] pointer-events-none"></div>
                    <div className="absolute inset-x-4 top-3 h-[250px] rounded-[22px] bg-[#FBF5ED] border border-[#E8DDD0] pointer-events-none"></div>

                    <div className="relative rounded-[24px] bg-white border border-line p-5 shadow-soft">
                      <div className="flex items-center justify-between mb-3 gap-3">
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs px-3 py-1 rounded-full bg-[#F5EFE7] font-semibold">InStreet</span>
                          <span className="text-xs px-3 py-1 rounded-full bg-[#F5EFE7] font-semibold">短帖</span>
                        </div>
                        <span className="pill gold-pill">92 分</span>
                      </div>

                      <div className="font-bold text-[20px] leading-8">“OpenAI 新模型为什么不是简单堆参数，而是重做推理链路？”</div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="kpi-box">
                          <div className="text-[11px] muted-text">来源热点</div>
                          <div className="font-bold mt-1">全球热榜 #1</div>
                        </div>
                        <div className="kpi-box">
                          <div className="text-[11px] muted-text">预测表现</div>
                          <div className="font-bold mt-1">高</div>
                        </div>
                        <div className="kpi-box">
                          <div className="text-[11px] muted-text">所属 Agent</div>
                          <div className="font-bold mt-1">Bva</div>
                        </div>
                        <div className="kpi-box">
                          <div className="text-[11px] muted-text">风险等级</div>
                          <div className="font-bold mt-1">低</div>
                        </div>
                      </div>

                      <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setReviewData({ title: "OpenAI 新模型为什么不是简单堆参数，而是重做推理链路？", source: "全球热榜 #1", format: "InStreet 短帖", score: "92" })}
                          className="py-3 rounded-2xl bg-ink text-white font-semibold"
                        >去审核</button>
                        <button onClick={() => showToast('已加入发布队列')} className="py-3 rounded-2xl border border-line font-semibold">直接发布</button>
                        <button onClick={() => showToast('已打回重写')} className="py-3 rounded-2xl border border-line font-semibold">打回重写</button>
                        <button onClick={() => showToast('已标记为稍后处理')} className="py-3 rounded-2xl border border-line font-semibold">稍后处理</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Section */}
            <section className="grid grid-cols-12 gap-6">
              <div className="col-span-12 xl:col-span-4 card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-xs muted-text">Agent Runtime</div>
                    <h3 className="card-title mt-1">Agent 任务状态</h3>
                  </div>
                  <button className="liquid-btn px-3 py-2 rounded-xl text-sm font-semibold">查看全部</button>
                </div>

                <div className="space-y-3">
                  {displayAgents.slice(0, 3).map(agent => (
                    <div key={agent.id} className="bg-white border border-line rounded-[22px] p-4">
                      <button onClick={() => setAgentModalData(agent)} className="w-full text-left flex items-center justify-between hover:opacity-80">
                        <div className="flex items-center gap-3">
                          <div className="agent-avatar">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${agent.seed}`} className="w-full h-full object-cover" alt="" />
                            <span className={cn("agent-status", (agent.status === '正常' || agent.status === 'success') ? "bg-success" : (agent.status === '繁忙' || agent.status === 'gold') ? "bg-gold" : "bg-coral", agent.pulse && "pulse")}></span>
                          </div>
                          <div>
                            <div className="font-bold">{agent.name || agent.seed} · {agent.role || 'Agent'}</div>
                            <div className="text-xs muted-text mt-1">当前任务：{agent.task || '待命'}</div>
                          </div>
                        </div>
                        <span className={cn("pill", (agent.status === '正常' || agent.status === 'success') ? "sage-pill" : (agent.status === '繁忙' || agent.status === 'gold') ? "gold-pill" : "coral-pill")}>{agent.status}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-12 xl:col-span-8 card p-6 bg-[#FBF7F2]">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-xs muted-text">Alerts & Workflow</div>
                    <h3 className="card-title mt-1">告警与工作流</h3>
                  </div>
                  <button className="liquid-btn w-10 h-10 rounded-full text-ink flex items-center justify-center">
                    <Plus size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                  <div className="rounded-[20px] border border-[#F0D5CC] bg-[#FFF6F3] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm">午报汇总代理延迟</div>
                        <div className="text-xs muted-text mt-1">已持续 8 分钟 · 建议重试汇总链路</div>
                      </div>
                      <span className="pill coral-pill">P1</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button onClick={() => showToast('已触发午报汇总重试')} className="py-3 rounded-2xl bg-ink text-white font-semibold">重试任务</button>
                      <button onClick={() => showToast('已切换到备用汇总链路')} className="py-3 rounded-2xl border border-line font-semibold">切备用链路</button>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#E9DFD3] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-sm">审核队列积压</div>
                        <div className="text-xs muted-text mt-1">还有 3 篇高优草稿待处理</div>
                      </div>
                      <span className="pill gold-pill">P2</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button 
                        onClick={() => setReviewData({ title: "OpenAI 新模型为什么不是简单堆参数，而是重做推理链路？", source: "全球热榜 #1", format: "InStreet 短帖", score: "92" })}
                        className="py-3 rounded-2xl border border-line font-semibold"
                      >去审核</button>
                      <button onClick={() => showToast('已忽略当前审核积压提醒')} className="py-3 rounded-2xl border border-line font-semibold">忽略告警</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-line rounded-[22px] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold">热点抓取</div>
                      <div className="text-sm muted-text">9 / 12</div>
                    </div>
                    <div className="micro-bar">
                      <span className="active"></span><span className="active"></span><span className="active"></span><span className="active"></span><span className="active"></span><span className="active"></span><span className="active"></span><span></span><span></span><span></span>
                    </div>
                  </div>

                  <div className="bg-white border border-line rounded-[22px] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold">提纯聚类</div>
                      <div className="text-sm muted-text">8 / 10</div>
                    </div>
                    <div className="micro-bar">
                      <span className="active"></span><span className="active"></span><span className="active"></span><span className="active"></span><span className="active"></span><span className="active"></span><span className="active"></span><span className="active"></span><span></span><span></span>
                    </div>
                  </div>

                  <div className="bg-white border border-line rounded-[22px] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold">审核发布</div>
                      <div className="text-sm muted-text">4 / 8</div>
                    </div>
                    <div className="micro-bar">
                      <span className="active"></span><span className="active"></span><span className="active"></span><span className="active"></span><span></span><span></span><span></span><span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Overlays */}
      <div className={cn("overlay", isOverlayOpen && "open")} onClick={closeAll}></div>

      {/* Trend Drawer */}
      <aside className={cn("side-drawer", drawerData && "open")}>
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div>
            <div className="text-xs muted-text">Trend Detail</div>
            <div className="text-[24px] font-bold tracking-[-0.03em] mt-1">{drawerData?.title}</div>
          </div>
          <button onClick={() => setDrawerData(null)} className="liquid-btn w-10 h-10 rounded-full flex items-center justify-center text-ink">
            <X size={20} />
          </button>
        </div>

        {drawerData && (
          <div className="p-5 overflow-y-auto space-y-4">
            <div className="flex items-center gap-2">
              <span className="pill gold-pill">{drawerData.rank} · {drawerData.score}</span>
              <span className="text-sm muted-text">{drawerData.growth || drawerData.trend}</span>
            </div>

            <div className="kpi-box">
              <div className="text-[11px] muted-text">来源平台</div>
              <div className="font-bold mt-1">{drawerData.sources || drawerData.platforms}</div>
            </div>

            <div className="kpi-box">
              <div className="text-[11px] muted-text">统一摘要</div>
              <div className="font-bold mt-1 leading-7">{drawerData.summary || '暂无摘要'}</div>
            </div>

            <div className="kpi-box">
              <div className="text-[11px] muted-text">推荐切入角度</div>
              <div className="font-bold mt-1 leading-7">{drawerData.angle || '暂无角度'}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="kpi-box">
                <div className="text-[11px] muted-text">推荐动作</div>
                <div className="font-bold mt-1">{drawerData.action || '暂无动作'}</div>
              </div>
              <div className="kpi-box">
                <div className="text-[11px] muted-text">是否跟进</div>
                <div className="font-bold mt-1">{drawerData.status || '暂无状态'}</div>
              </div>
              <div className="kpi-box col-span-2">
                <div className="text-[11px] muted-text">热度时间线</div>
                <div className="font-bold mt-1">{drawerData.timeline || '暂无时间线'}</div>
              </div>
              <div className="kpi-box col-span-2">
                <div className="text-[11px] muted-text">适合平台</div>
                <div className="font-bold mt-1">{drawerData.platformFit || '暂无适配建议'}</div>
              </div>
            </div>

            <div className="rounded-[24px] bg-white border border-line p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold">热度变化示意</div>
                <span className="pill subtle-pill">最近 3 小时</span>
              </div>
              <svg viewBox="0 0 340 130" className="w-full h-[130px]">
                <defs>
                  <linearGradient id="drawerFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7C86EE" stopOpacity="0.18"/>
                    <stop offset="100%" stopColor="#7C86EE" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M16 92 C46 88, 64 80, 92 82 S144 70, 168 66 S224 42, 250 46 S302 30, 324 28 L324 120 L16 120 Z" fill="url(#drawerFill)"></path>
                <path d="M16 92 C46 88, 64 80, 92 82 S144 70, 168 66 S224 42, 250 46 S302 30, 324 28" fill="none" stroke="#7C86EE" strokeWidth="4" strokeLinecap="round"></path>
                <circle cx="324" cy="28" r="5" fill="#7C86EE"></circle>
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => { setReviewData({ title: drawerData.title, source: `全球热榜 ${drawerData.rank}`, format: drawerData.action?.includes('短帖') ? 'InStreet 短帖' : '长文', score: String(drawerData.score) }); setDrawerData(null); }}
                className="py-3 rounded-2xl bg-ink text-white font-semibold"
              >去审核</button>
              <button onClick={() => showToast('已加入发布队列')} className="py-3 rounded-2xl border border-line font-semibold">加入发布队列</button>
            </div>
          </div>
        )}
      </aside>

      {/* Review Modal */}
      <section className={cn("modal", reviewData && "open")}>
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div>
            <div className="text-xs muted-text">Review Center</div>
            <div className="text-[24px] font-bold tracking-[-0.03em] mt-1">审核文稿</div>
          </div>
          <button onClick={() => setReviewData(null)} className="liquid-btn w-10 h-10 rounded-full flex items-center justify-center text-ink">
            <X size={20} />
          </button>
        </div>

        {reviewData && (
          <div className="p-5 overflow-y-auto max-h-[75vh] space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="kpi-box">
                <div className="text-[11px] muted-text">来源</div>
                <div className="font-bold mt-1">{reviewData.source}</div>
              </div>
              <div className="kpi-box">
                <div className="text-[11px] muted-text">形式</div>
                <div className="font-bold mt-1">{reviewData.format}</div>
              </div>
              <div className="kpi-box">
                <div className="text-[11px] muted-text">预测表现</div>
                <div className="font-bold mt-1">{reviewData.score}</div>
              </div>
              <div className="kpi-box">
                <div className="text-[11px] muted-text">风险</div>
                <div className="font-bold mt-1">低</div>
              </div>
            </div>

            <div className="rounded-[24px] bg-white border border-line p-5">
              <div className="text-[11px] muted-text">标题</div>
              <div className="font-bold text-[20px] leading-8 mt-2">{reviewData.title}</div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="kpi-box">
                  <div className="text-[11px] muted-text">自动审查建议</div>
                  <div className="font-bold mt-1 leading-7">保留核心判断，但标题建议再口语化一点，利于平台传播。</div>
                </div>
                <div className="kpi-box">
                  <div className="text-[11px] muted-text">修改方向</div>
                  <div className="font-bold mt-1 leading-7">结尾可增加“这意味着什么”的落点，让观点更完整。</div>
                </div>
              </div>

              <div className="mt-5">
                <label className="text-[11px] muted-text block mb-2">草稿内容</label>
                <textarea 
                  className="w-full min-h-[220px] rounded-[22px] border border-line bg-[#FFFCF8] p-4 outline-none resize-y leading-7"
                  defaultValue={`OpenAI 这次的新模型，不只是参数堆得更多，而是把“怎么想”这件事重新做了一遍。

真正值得关注的，不是跑分，而是它在复杂任务里开始表现出更稳定的长链推理能力。这意味着，未来很多过去必须拆成多步处理的工作流，可能会重新被一个更强的核心模型吞掉。

对内容创作者来说，这不是单纯的模型新闻，而是一次生产方式变化的信号。`}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                <button onClick={() => { showToast('审核通过'); setReviewData(null); }} className="py-3 rounded-2xl bg-ink text-white font-semibold">审核通过</button>
                <button onClick={() => { showToast('已打回重写'); setReviewData(null); }} className="py-3 rounded-2xl border border-line font-semibold">打回重写</button>
                <button onClick={() => { showToast('已标记为稍后处理'); setReviewData(null); }} className="py-3 rounded-2xl border border-line font-semibold">稍后处理</button>
                <button onClick={() => showToast('已触发自动改写建议')} className="py-3 rounded-2xl border border-line font-semibold">自动改写</button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Agent Modal */}
      <section className={cn("modal", agentModalData && "open")}>
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div>
            <div className="text-xs muted-text">Agent Detail</div>
            <div className="text-[24px] font-bold tracking-[-0.03em] mt-1">{agentModalData?.name || agentModalData?.seed} · {agentModalData?.role || 'Agent'}</div>
          </div>
          <button onClick={() => setAgentModalData(null)} className="liquid-btn w-10 h-10 rounded-full flex items-center justify-center text-ink">
            <X size={20} />
          </button>
        </div>

        {agentModalData && (
          <div className="p-5 overflow-y-auto max-h-[75vh] space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="kpi-box">
                <div className="text-[11px] muted-text">状态</div>
                <div className="font-bold mt-1">{agentModalData.status}</div>
              </div>
              <div className="kpi-box">
                <div className="text-[11px] muted-text">当前任务</div>
                <div className="font-bold mt-1">{agentModalData.task || '待命'}</div>
              </div>
              <div className="kpi-box">
                <div className="text-[11px] muted-text">队列</div>
                <div className="font-bold mt-1">{agentModalData.queue || '0'}</div>
              </div>
              <div className="kpi-box">
                <div className="text-[11px] muted-text">耗时</div>
                <div className="font-bold mt-1">{agentModalData.cost || 'N/A'}</div>
              </div>
            </div>

            <div className="rounded-[24px] bg-white border border-line p-5">
              <div className="text-[11px] muted-text">详细说明</div>
              <div className="font-bold mt-2 leading-7">{agentModalData.detail || '暂无详细说明。'}</div>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                <button onClick={() => showToast('已对该 Agent 执行重试')} className="py-3 rounded-2xl bg-ink text-white font-semibold">重试</button>
                <button onClick={() => showToast('已暂停该 Agent')} className="py-3 rounded-2xl border border-line font-semibold">暂停</button>
                <button onClick={() => showToast('已切换备用模型')} className="py-3 rounded-2xl border border-line font-semibold">切换模型</button>
                <button onClick={() => showToast('已打开最近日志')} className="py-3 rounded-2xl border border-line font-semibold">查看日志</button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Toast */}
      <div className="toast-wrap">
        <div className={cn("toast", toast.isOpen && "show")}>{toast.message}</div>
      </div>
    </div>
  );
}
