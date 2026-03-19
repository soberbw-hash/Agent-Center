import React, { useState, useEffect, Component } from 'react';
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
  Clock, 
  Plus,
  Satellite,
  CheckCircle2,
  AlertCircle,
  LogIn
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
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
  rank: number;
  score: number;
  trend: string;
  title: string;
  platforms: string;
  tags: string[];
}

interface Report {
  id: string;
  time: string;
  title: string;
  content: string;
  status: 'completed' | 'processing' | 'pending';
  timestamp: Timestamp;
}

interface Agent {
  id: string;
  seed: string;
  status: 'success' | 'gold' | 'coral';
  pulse?: boolean;
}

interface TokenUsage {
  id: string;
  date: string;
  value: number;
  category?: string;
}


export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data States
  const [trends, setTrends] = useState<Trend[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const trendsQuery = query(collection(db, 'trends'), orderBy('rank', 'asc'), limit(10));
    const unsubscribeTrends = onSnapshot(trendsQuery, (snapshot) => {
      setTrends(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trend)));
    }, (error) => console.error("Trends Listener Error:", error));

    const reportsQuery = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)).reverse());
    }, (error) => console.error("Reports Listener Error:", error));

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
      unsubscribeReports();
      unsubscribeAgents();
      unsubscribeUsage();
    };
  }, [user, isAuthReady]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/popup-blocked') {
        setLoginError("登录弹窗被浏览器拦截。请允许本站弹出窗口，或者在新标签页中打开本应用。");
      } else if (error.code === 'auth/cancelled-popup-request') {
        setLoginError("登录请求被取消，请重试。");
      } else if (error.message?.includes('INTERNAL ASSERTION FAILED')) {
        setLoginError("Firebase 内部状态错误，请刷新页面后重试。");
      } else {
        setLoginError(error.message || "登录失败，请重试。");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen grid place-items-center bg-shell">
        <div className="flex flex-col items-center gap-4">
          <Satellite className="text-ink animate-pulse" size={48} />
          <div className="text-ink font-bold">Initializing OpenClaw...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-shell p-4">
        <div className="card p-10 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-ink text-gold flex items-center justify-center text-3xl mx-auto shadow-soft">
            <Satellite size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Agent Center</h1>
            <p className="text-text-soft">Please sign in to access your OpenClaw dashboard and real-time data.</p>
          </div>
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-4 bg-ink text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50"
          >
            <LogIn size={20} />
            {isLoggingIn ? '登录中...' : 'Sign in with Google'}
          </button>
          
          {loginError && (
            <div className="text-sm text-coral bg-coral/10 p-3 rounded-xl text-left">
              {loginError}
              {(loginError.includes('拦截') || loginError.includes('内部状态错误')) && (
                <a 
                  href={window.location.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block mt-2 underline font-semibold"
                >
                  在新标签页中打开应用 ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

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

              <div className="card px-3 py-4 flex xl:flex-col gap-3">
                <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={20} />} />
                <NavButton active={activeTab === 'trends'} onClick={() => setActiveTab('trends')} icon={<Flame size={20} />} />
                <NavButton active={activeTab === 'agents'} onClick={() => setActiveTab('agents')} icon={<Bot size={20} />} />
                <NavButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileText size={20} />} />
              </div>

              <div className="card px-3 py-4 flex xl:flex-col gap-3">
                <NavButton icon={<Bell size={20} />} badge />
                <NavButton icon={<Settings size={20} />} />
              </div>
            </div>

            <div className="hidden xl:flex flex-col items-center gap-4 mt-auto">
              <button onClick={handleLogout} className="nav-btn card"><LogOut size={20} /></button>
              <img 
                src={user.photoURL || "https://api.dicebear.com/7.x/notionists/svg?seed=bowen"} 
                alt="avatar" 
                className="w-14 h-14 rounded-full border border-line bg-white shadow-soft" 
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="col-span-12 xl:col-span-11 space-y-6">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="px-4 py-2 rounded-full bg-ink text-white text-sm font-semibold shadow-soft">Dashboard</button>
                  <button className="px-4 py-2 rounded-full bg-white/75 border border-line text-sm font-semibold text-ink">Trends</button>
                  <button className="px-4 py-2 rounded-full bg-white/75 border border-line text-sm font-semibold text-ink">Agents</button>
                  <button className="px-4 py-2 rounded-full bg-white/75 border border-line text-sm font-semibold text-ink">Content</button>
                  <button className="px-4 py-2 rounded-full bg-white/75 border border-line text-sm font-semibold text-ink">Reports</button>
                </div>
                <div className="glass-soft rounded-full px-4 py-2 border border-line text-xs font-mono text-ink/70">
                  API: {window.location.origin}/api/openclaw/data
                </div>
              </div>

              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3 text-sm muted-text font-medium mb-2">
                    <span className="pill subtle-pill">系统在线</span>
                    <span>下次热榜刷新 12:30</span>
                  </div>
                  <h1 className="text-[2.35rem] font-bold tracking-[-0.03em]">Hi, {user.displayName?.split(' ')[0] || 'User'}</h1>
                  <p className="muted-text mt-2 text-[15px]">OpenClaw Agent Center · 把热点、Agent、内容反馈和日报全部收进一个更统一、更安静的控制台</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <div className="glass-soft rounded-full px-5 py-3 border border-line shadow-soft flex items-center gap-3 min-w-[260px]">
                    <Search size={18} className="muted-text" />
                    <input className="w-full bg-transparent outline-none text-sm" placeholder="Search trends, agents, reports..." />
                  </div>
                  <button className="bg-ink text-white rounded-full px-6 py-3 font-semibold">Command Center</button>
                </div>
              </div>
            </header>

            {/* Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5">
              <StatCard label="今日 Tokens" value={tokenUsage.length > 0 ? `${(tokenUsage[tokenUsage.length-1].value / 1000000).toFixed(2)}M` : "0.00M"} subValue="实时更新" color="coral" />
              <StatCard label="InStreet 增长" value="+186" subValue="今日净增" color="success" />
              <StatCard label="公众号阅读" value="8,420" subValue="+14%" color="success" />
              <StatCard label="待审核草稿" value="6" subValue="3 篇高优先" color="gold" highlight />
              
              <div className="card p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="stat-label">Agents Active</div>
                    <div className="text-xs muted-text mt-1">{agents.length} 个核心 Agent 当前状态</div>
                  </div>
                  <span className="text-sm font-semibold muted-text">{agents.filter(a => a.status === 'success').length} / {agents.length || 5}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {agents.length > 0 ? agents.map(agent => (
                    <AgentAvatar key={agent.id} seed={agent.seed} status={agent.status} pulse={agent.pulse} />
                  )) : (
                    <>
                      <AgentAvatar seed="ava" status="success" pulse />
                      <AgentAvatar seed="bva" status="success" />
                      <AgentAvatar seed="cva" status="gold" />
                      <AgentAvatar seed="dva" status="success" />
                      <AgentAvatar seed="eva" status="coral" />
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Main Dashboard Section */}
            <section className="grid grid-cols-12 gap-6">
              {/* Trends Section */}
              <div className="col-span-12 lg:col-span-8 card p-6 md:p-7 min-h-[650px] relative overflow-hidden bg-[linear-gradient(180deg,#FBF8F4_0%,#F8F3ED_100%)]">
                <div className="blur-orb bg-gold w-[220px] h-[220px] top-[90px] right-[110px]"></div>
                <div className="blur-orb bg-coral w-[180px] h-[180px] top-[260px] right-[280px]"></div>
                <div className="blur-orb bg-blue-soft w-[150px] h-[150px] top-[130px] right-[10px]"></div>

                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div>
                    <h2 className="section-title">全球提纯热榜</h2>
                    <p className="muted-text mt-1">统一色板优化版 · 左侧清单，右侧评分可视化面板</p>
                  </div>
                  <button className="w-11 h-11 rounded-full bg-ink text-gold flex items-center justify-center">
                    <TrendingUp size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-5 relative z-10">
                  <div className="col-span-12 xl:col-span-7 space-y-3">
                    {trends.length > 0 ? trends.map(trend => (
                      <TrendItem 
                        key={trend.id} 
                        rank={trend.rank} 
                        score={trend.score} 
                        trend={trend.trend || "0%"} 
                        title={trend.title} 
                        platforms={trend.platforms} 
                        tags={trend.tags || []} 
                      />
                    )) : (
                      <div className="p-10 text-center muted-text italic">Waiting for OpenClaw data...</div>
                    )}
                  </div>

                  <div className="col-span-12 xl:col-span-5 hidden xl:block">
                    <div className="glass-soft rounded-[30px] border border-line p-5 shadow-soft min-h-[520px]">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <div className="text-xs muted-text">Scoring Panel</div>
                          <div className="text-[22px] font-bold mt-1 tracking-[-0.03em]">热度评分面板</div>
                        </div>
                        <span className="pill subtle-pill">Top 5</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <KPIBox label="最高热度" value={trends[0]?.score ? `${trends[0].score} / 100` : "0 / 100"} />
                        <KPIBox label="聚合平台" value="10 大平台" />
                        <KPIBox label="主线方向" value="AI 能力升级" />
                        <KPIBox label="适配动作" value="短帖优先" />
                      </div>

                      <div className="rounded-[26px] bg-white/54 border border-line p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm muted-text">系统综合判断</div>
                            <div className="mt-2 text-[28px] font-extrabold leading-none">{trends[0]?.title || "N/A"}</div>
                            <div className="text-sm muted-text mt-2">当前最值得立即处理的话题</div>
                          </div>
                          <div className="score-ring shrink-0">
                            <div className="score-ring-inner">
                              <div className="text-center">
                                <div className="text-[28px] font-extrabold leading-none">{trends[0]?.score || 0}</div>
                                <div className="text-[11px] muted-text mt-1">综合分</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          <ProgressBar label="传播势能" value={92} color="ink" />
                          <ProgressBar label="内容转化" value={88} color="coral" />
                          <ProgressBar label="话题延展" value={79} color="gold" />
                          <ProgressBar label="跟进时效" value={95} color="blue" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Widgets */}
              <div className="col-span-12 lg:col-span-4 space-y-5">
                <div className="card p-6 bg-[linear-gradient(180deg,#FBF8F4_0%,#F8F3ED_100%)]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="pill subtle-pill">趋势</span>
                        <span className="text-xs muted-text">最近 7 天</span>
                      </div>
                      <h3 className="card-title">每日 Token 消耗</h3>
                    </div>
                    <button className="px-3 py-2 rounded-xl border border-line text-sm font-semibold muted-text">近 7 天</button>
                  </div>
                  <div className="rounded-[24px] glass-soft border border-line px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs muted-text">本周累计</div>
                        <div className="text-[28px] font-extrabold leading-none mt-1">
                          {(tokenUsage.reduce((acc, curr) => acc + curr.value, 0) / 1000000).toFixed(2)}M
                        </div>
                      </div>
                    </div>
                    {/* Simplified Chart Placeholder */}
                    <div className="h-[170px] flex items-end gap-2 px-2">
                      {tokenUsage.length > 0 ? tokenUsage.map((usage, i) => (
                        <div key={i} className="flex-1 bg-blue-soft/20 rounded-t-lg relative group">
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-blue-soft rounded-t-lg transition-all" 
                            style={{ height: `${Math.min(100, (usage.value / 2000000) * 100)}%` }}
                          />
                        </div>
                      )) : [40, 60, 45, 90, 55, 80, 70].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-soft/20 rounded-t-lg relative group">
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-blue-soft rounded-t-lg transition-all" 
                            style={{ height: `${h}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card p-6 bg-[linear-gradient(180deg,#FBF8F4_0%,#F8F3ED_100%)]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="pill gold-pill">高优先</span>
                        <span className="text-xs muted-text">待审文稿</span>
                      </div>
                      <h3 className="card-title">当前最值得处理</h3>
                    </div>
                  </div>
                  <div className="relative pt-5 pb-2 px-1">
                    <div className="absolute inset-x-6 top-0 h-[220px] rounded-[22px] bg-[#F6EFE7] border border-[#E8DDCF]"></div>
                    <div className="absolute inset-x-4 top-3 h-[220px] rounded-[22px] bg-[#FBF5ED] border border-[#E8DDD0]"></div>
                    <div className="relative rounded-[24px] glass-soft border border-line p-5 shadow-soft">
                      <div className="flex items-center justify-between mb-3 gap-3">
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs px-3 py-1 rounded-full bg-[#F5EFE7] font-semibold">InStreet</span>
                        </div>
                        <span className="pill gold-pill">92 分</span>
                      </div>
                      <div className="font-bold text-[18px] leading-7">“OpenAI 新模型为什么不是简单堆参数，而是重做推理链路？”</div>
                      <div className="mt-5 flex gap-3">
                        <button className="flex-1 py-3 rounded-2xl border border-line font-semibold bg-[#FBF8F4]">打回</button>
                        <button className="flex-1 py-3 rounded-2xl bg-ink text-white font-semibold">去审核</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Section */}
            <section className="grid grid-cols-12 gap-6 items-start">
              <div className="col-span-12 xl:col-span-6 card p-6 bg-[linear-gradient(180deg,#FBF8F4_0%,#F8F3ED_100%)]">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="pill subtle-pill">时间轴</span>
                      <span className="text-xs muted-text">今日汇总</span>
                    </div>
                    <h3 className="card-title">早中晚日报</h3>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-ink text-gold flex items-center justify-center">
                    <Clock size={20} />
                  </button>
                </div>
                <div className="relative pl-5 flex-1">
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-[#E5DBCF]"></div>
                  <div className="space-y-5 h-full">
                    {reports.length > 0 ? reports.map(report => (
                      <ReportNode 
                        key={report.id}
                        time={report.time} 
                        title={report.title} 
                        content={report.content} 
                        status={report.status} 
                      />
                    )) : (
                      <>
                        <ReportNode time="08:00" title="晨报" content="昨夜数据汇总已生成，热点抓取正常启动。" status="completed" />
                        <ReportNode time="12:00" title="午报" content="AI 话题进入高热区，InStreet 表现超过预期。" status="processing" />
                        <ReportNode time="20:00" title="晚报" content="待生成，预计汇总今日最终增长与复盘建议。" status="pending" />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-12 xl:col-span-6 card p-6 bg-[#FBF7F2]">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="card-title">告警与工作流</h3>
                    <p className="text-sm muted-text mt-1">异常提醒 + 核心链路运行情况</p>
                  </div>
                  <button className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center">
                    <Plus size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <AlertItem title="午报汇总代理延迟" time="已持续 8 分钟" priority="P1" />
                    <AlertItem title="审核队列积压" time="还有 3 篇高优草稿待处理" priority="P2" />
                  </div>
                  <div className="space-y-4">
                    <WorkflowItem label="热点抓取" progress={9} total={12} />
                    <WorkflowItem label="提纯聚类" progress={8} total={10} />
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}


function NavButton({ active, icon, onClick, badge }: { active?: boolean, icon: React.ReactNode, onClick?: () => void, badge?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "nav-btn relative",
        active && "active"
      )}
    >
      {icon}
      {badge && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-coral"></span>}
    </button>
  );
}

function StatCard({ label, value, subValue, color, highlight }: { label: string, value: string, subValue: string, color: string, highlight?: boolean }) {
  return (
    <div className={cn("card p-5", highlight && "bg-[#FFF9F2] border-[1.5px] border-[#E9DCC7]")}>
      <div className="stat-label">{label}</div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-[2rem] font-extrabold">{value}</div>
        <span className={cn("text-sm font-semibold", `text-${color}`)}>{subValue}</span>
      </div>
    </div>
  );
}

function AgentAvatar({ seed, status, pulse }: { seed: string, status: string, pulse?: boolean, key?: any }) {
  return (
    <div className="text-center">
      <div className="agent-avatar mx-auto w-12 h-12">
        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`} alt={seed} className="w-full h-full object-cover" />
        <span className={cn("agent-status", `bg-${status}`, pulse && "pulse")}></span>
      </div>
      <div className="mt-2 text-[11px] font-bold capitalize">{seed}</div>
    </div>
  );
}

function TrendItem({ rank, score, trend, title, platforms, tags }: { rank: number, score: number, trend: string, title: string, platforms: string, tags: string[], key?: any }) {
  return (
    <div className="news-card glass-soft rounded-[22px] border border-line p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("pill", rank <= 2 ? (rank === 1 ? "gold-pill" : "coral-pill") : "sage-pill")}>
            #{rank} · {score}
          </span>
          <span className="text-xs muted-text">{trend}</span>
        </div>
        <div className="font-bold text-[18px] leading-7 truncate">{title}</div>
        <div className="text-[13px] muted-text mt-1">{platforms}</div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {tags.map((tag, i) => (
            <span key={i} className="pill subtle-pill">{tag}</span>
          ))}
        </div>
      </div>
      <button className="shrink-0 px-4 py-2 rounded-2xl bg-ink text-white text-sm font-semibold">生成短帖</button>
    </div>
  );
}

function KPIBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="kpi-box">
      <div className="text-[11px] muted-text">{label}</div>
      <div className="font-bold mt-1">{value}</div>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string, value: number, color: string }) {
  const colorMap: Record<string, string> = {
    ink: 'bg-ink',
    coral: 'bg-coral',
    gold: 'bg-gold',
    blue: 'bg-blue-soft'
  };
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="muted-text">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-[#E7DED3]">
        <div className={cn("h-2.5 rounded-full", colorMap[color])} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function ReportNode({ time, title, content, status }: { time: string, title: string, content: string, status: 'completed' | 'processing' | 'pending', key?: any }) {
  const statusColors = {
    completed: 'bg-ink',
    processing: 'bg-gold',
    pending: 'bg-[#D8CDC1]'
  };
  return (
    <div className="relative pl-6 report-node">
      <span className={cn("absolute left-0 top-2 w-5 h-5 rounded-full border-4 border-[#FBF8F4]", statusColors[status])}></span>
      <div className="rounded-[22px] bg-white border border-line p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-[18px]">{title} · {time}</div>
            <div className="text-sm muted-text mt-1">{content}</div>
          </div>
          <span className="text-xs muted-text shrink-0">
            {status === 'completed' ? '已完成' : status === 'processing' ? '处理中' : '待生成'}
          </span>
        </div>
      </div>
    </div>
  );
}

function AlertItem({ title, time, priority }: { title: string, time: string, priority: string }) {
  return (
    <div className={cn(
      "rounded-[20px] border p-3.5",
      priority === 'P1' ? "border-[#F0D5CC] bg-[#FFF6F3]" : "border-[#E9DFD3] bg-white"
    )}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-bold text-sm">{title}</div>
          <div className="text-xs muted-text mt-1">{time}</div>
        </div>
        <span className={cn("pill", priority === 'P1' ? "coral-pill" : "gold-pill")}>{priority}</span>
      </div>
    </div>
  );
}

function WorkflowItem({ label, progress, total }: { label: string, progress: number, total: number }) {
  return (
    <div className="bg-white border border-line rounded-[22px] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold">{label}</div>
        <div className="text-sm muted-text">{progress} / {total}</div>
      </div>
      <div className="micro-bar">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={cn(i < progress && "active")}></span>
        ))}
      </div>
    </div>
  );
}
