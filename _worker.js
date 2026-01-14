/**
 * IP SENTINEL - ELITE EDITION
 * 仿 ipfighter 功能 / 赛博朋克 UI / 智能分流测试
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 基础配置
    const config = {
      title: env.TITLE || "网络连接哨兵 | IP Sentinel",
      footer: env.FOOTER || "SYSTEM ONLINE // SECURITY LEVEL: MAX",
    };

    // PWA 配置
    if (url.pathname === "/manifest.json") {
      return new Response(JSON.stringify({
        "name": config.title,
        "short_name": "Sentinel",
        "display": "standalone",
        "background_color": "#0b0c10",
        "theme_color": "#0b0c10",
        "icons": [{"src": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6e1.png", "sizes": "72x72", "type": "image/png"}]
      }), { headers: { "content-type": "application/json" }});
    }

    // 获取 Cloudflare 头部信息
    const cf = request.cf || {};
    const headers = request.headers;
    const clientIp = headers.get("cf-connecting-ip") || headers.get("x-forwarded-for") || "127.0.0.1";
    
    // 初始化数据
    const initData = {
      ip: clientIp,
      country: cf.country || "UNK", 
      city: cf.city || "未知城市",
      region: cf.region || "",
      isp: cf.asOrganization || "ISP Unknown",
      asn: cf.asn ? "AS" + cf.asn : "N/A",
      lat: Number(cf.latitude) || 0,
      lon: Number(cf.longitude) || 0,
      colo: cf.colo || "UNK",
      timezone: cf.timezone || "UTC",
      httpProtocol: cf.httpProtocol || "HTTP/2",
      tlsVersion: cf.tlsVersion || "TLS 1.3",
      userAgent: headers.get("user-agent") || ""
    };

    return new Response(renderHtml(initData, config), {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    });
  },
};

function renderHtml(initData, config) {
  return `
<!DOCTYPE html>
<html lang="zh-CN" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>${config.title}</title>
    <meta name="theme-color" content="#0b0c10" />
    <link rel="manifest" href="/manifest.json" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=JetBrains+Mono:wght@400;500;700;800&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
    
    <script>
      window.CF_DATA = ${JSON.stringify(initData)};
      window.SITE_CONFIG = ${JSON.stringify(config)};
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: { sans: ['Rajdhani', 'Noto Sans SC', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
            colors: { 
              bg: '#0b0c10', panel: '#1f2833', 
              neon: { cyan: '#66fcf1', blue: '#45a29e', green: '#39ff14', red: '#ff073a', gold: '#ffd700' }
            },
            animation: { 'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }
          }
        }
      }
    </script>
    <style>
      body { background-color: #0b0c10; color: #c5c6c7; -webkit-font-smoothing: antialiased; }
      
      /* HUD 风格卡片 */
      .hud-card {
        background: rgba(31, 40, 51, 0.6);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(69, 162, 158, 0.2);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        position: relative; overflow: hidden;
      }
      .hud-card::before {
        content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px;
        background: linear-gradient(90deg, transparent, #66fcf1, transparent); opacity: 0.5;
      }
      
      /* 仪表盘动画 */
      .gauge-circle { transition: stroke-dashoffset 1s ease-in-out; transform: rotate(-90deg); transform-origin: 50% 50%; }
      
      /* 滚动条 */
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: #0b0c10; }
      ::-webkit-scrollbar-thumb { background: #45a29e; border-radius: 3px; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel" data-presets="react">
      const { useState, useEffect, useRef } = React;
      const { createRoot } = ReactDOM;

      // Icons
      const Icons = {
        Wifi: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
        Shield: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
        Globe: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
        Alert: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
        Check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
        Lock: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
      };

      // 工具函数
      const maskIp = (ip) => ip.replace(/(\d+)\.(\d+)$/, '***.***').replace(/(:[\da-f]+){3}$/, ':****:****:****');

      // --- 组件 ---

      // 1. IP 主信息卡片 (带地图)
      const IpCard = ({ data, riskScore }) => {
        const [showIp, setShowIp] = useState(true); // 默认显示，点击隐藏
        
        return (
          <div className="hud-card rounded-2xl p-0 flex flex-col md:flex-row overflow-hidden min-h-[280px]">
            {/* 左侧：地图区域 */}
            <div className="relative w-full md:w-2/5 h-48 md:h-auto bg-[#050505]">
              <iframe 
                src={\`https://maps.google.com/maps?q=\${data.lat},\${data.lon}&z=5&output=embed\`}
                className="w-full h-full opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
                style={{border:0}} loading="lazy"
              ></iframe>
              <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur px-2 py-1 rounded border border-white/10 text-[10px] font-mono text-neon-cyan">
                LAT: {data.lat.toFixed(2)} | LON: {data.lon.toFixed(2)}
              </div>
            </div>

            {/* 右侧：信息详情 */}
            <div className="p-6 md:w-3/5 flex flex-col justify-between bg-gradient-to-br from-[#1f2833] to-[#0b0c10]">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">Client IP Address</div>
                  <div className="flex gap-2">
                     {data.country === 'CN' && <span className="text-[10px] border border-neon-red/50 text-neon-red px-1.5 py-0.5 rounded">CN-Mainland</span>}
                     <span className="text-[10px] border border-neon-cyan/50 text-neon-cyan px-1.5 py-0.5 rounded">{data.httpProtocol}</span>
                  </div>
                </div>
                <h1 
                  className="text-3xl md:text-5xl font-mono font-bold text-white mb-4 cursor-pointer hover:text-neon-cyan transition-colors truncate"
                  onClick={() => setShowIp(!showIp)}
                  title="点击切换显示/隐藏"
                >
                  {showIp ? data.ip : maskIp(data.ip)}
                </h1>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Location</div>
                    <div className="text-lg font-bold text-gray-200 flex items-center gap-2">
                       {data.country} {data.region}
                    </div>
                    <div className="text-xs text-gray-400">{data.city}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Provider (ISP)</div>
                    <div className="text-sm font-bold text-gray-200">{data.isp}</div>
                    <div className="text-xs text-gray-400 font-mono">{data.asn}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-end">
                 <div className="text-xs text-gray-500">System Time: {new Date().toLocaleTimeString()}</div>
                 <div className="text-xs font-mono text-neon-blue">
                    SECURE CONNECTION
                 </div>
              </div>
            </div>
          </div>
        );
      };

      // 2. 风险检测仪表盘 (仿 ipfighter)
      const RiskGauge = ({ riskData, loading }) => {
        // 评分逻辑：满分100，每发现一项风险扣分
        let score = 100;
        let riskLevel = "Low";
        let color = "#39ff14"; // Green

        if (riskData) {
            if (riskData.is_vpn) score -= 25;
            if (riskData.is_proxy) score -= 25;
            if (riskData.is_tor) score -= 40;
            if (riskData.is_datacenter) score -= 15;
            if (riskData.is_abuser) score -= 40;
            score = Math.max(0, score);

            if (score < 50) { riskLevel = "Critical"; color = "#ff073a"; } // Red
            else if (score < 80) { riskLevel = "Medium"; color = "#ffd700"; } // Gold
        }

        const radius = 50;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - ((score / 100) * circumference);

        const RiskItem = ({ label, detected }) => (
            <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                <span className="text-xs text-gray-400">{label}</span>
                <span className={\`text-xs font-bold font-mono px-2 py-0.5 rounded \${detected ? 'bg-neon-red/10 text-neon-red' : 'bg-neon-green/10 text-neon-green'}\`}>
                    {detected ? "DETECTED" : "CLEAN"}
                </span>
            </div>
        );

        return (
          <div className="hud-card rounded-2xl p-5 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <Icons.Shield className="w-5 h-5 text-neon-cyan" />
              <span className="font-bold text-white tracking-wider">FRAUD SCORE</span>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* 仪表盘 */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r={radius} stroke="#1f2833" strokeWidth="8" fill="none" />
                  <circle 
                    cx="64" cy="64" r={radius} 
                    stroke={color} strokeWidth="8" fill="none" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={loading ? circumference : offset} 
                    strokeLinecap="round"
                    className="gauge-circle"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold font-mono text-white">{loading ? '--' : score}</span>
                  <span className="text-[10px] uppercase font-bold" style={{color}}>{riskLevel}</span>
                </div>
              </div>

              {/* 详细列表 */}
              <div className="flex-grow w-full">
                {loading ? (
                    <div className="text-center text-xs text-gray-500 animate-pulse">Scanning IP Reputation...</div>
                ) : (
                    <div className="flex flex-col">
                        <RiskItem label="VPN / Tunnel" detected={riskData.is_vpn} />
                        <RiskItem label="Public Proxy" detected={riskData.is_proxy} />
                        <RiskItem label="Tor Exit Node" detected={riskData.is_tor} />
                        <RiskItem label="Hosting / DataCenter" detected={riskData.is_datacenter} />
                        <RiskItem label="Abuse Reports" detected={riskData.is_abuser} />
                    </div>
                )}
              </div>
            </div>
          </div>
        );
      };

      // 3. 智能连通性测试 (支持持续Ping)
      const ConnectivityGrid = ({ isCN }) => {
        // 根据地区选择目标
        const targets = isCN 
            ? [
                { name: "Baidu", url: "https://www.baidu.com", icon: "🔍" },
                { name: "Bilibili", url: "https://www.bilibili.com", icon: "📺" },
                { name: "WeChat", url: "https://mp.weixin.qq.com", icon: "💬" },
                { name: "Douyin", url: "https://www.douyin.com", icon: "🎵" },
                { name: "Taobao", url: "https://www.taobao.com", icon: "🛍️" },
                { name: "Aliyun", url: "https://www.aliyun.com", icon: "☁️" },
              ]
            : [
                { name: "Google", url: "https://www.google.com", icon: "G" },
                { name: "YouTube", url: "https://www.youtube.com", icon: "▶️" },
                { name: "GitHub", url: "https://github.com", icon: "🐙" },
                { name: "OpenAI", url: "https://api.openai.com", icon: "🤖" },
                { name: "Cloudflare", url: "https://www.cloudflare.com", icon: "☁️" },
                { name: "Twitter", url: "https://twitter.com", icon: "🐦" },
              ];

        return (
            <div className="hud-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Icons.Wifi className="w-5 h-5 text-neon-cyan" />
                        <span className="font-bold text-white tracking-wider">NETWORK CONNECTIVITY</span>
                    </div>
                    <span className="text-[10px] text-gray-500 border border-gray-700 px-2 py-0.5 rounded">
                        MODE: {isCN ? "CN-MAINLAND" : "GLOBAL"}
                    </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {targets.map(t => <PingBox key={t.name} target={t} />)}
                </div>
            </div>
        );
      };

      // 单个 Ping 盒子 (持续测试逻辑)
      const PingBox = ({ target }) => {
        const [stats, setStats] = useState({ avg: 0, last: 0, min: 9999, max: 0, count: 0 });
        const [status, setStatus] = useState("waiting"); // waiting, pinging, done, error

        useEffect(() => {
            let mounted = true;
            let history = [];
            const maxTests = 5; // 连续测试5次取平均值

            const doPing = async (attempt) => {
                if (!mounted) return;
                setStatus("pinging");
                
                const start = performance.now();
                try {
                    // 使用 no-cors 模式，只测时间
                    await fetch(target.url + '?t=' + Date.now(), { mode: 'no-cors', cache: 'no-store' });
                    const end = performance.now();
                    const duration = Math.round(end - start);

                    if (mounted) {
                        history.push(duration);
                        const avg = Math.round(history.reduce((a,b)=>a+b,0) / history.length);
                        setStats({
                            last: duration,
                            avg: avg,
                            min: Math.min(...history),
                            max: Math.max(...history),
                            count: attempt
                        });

                        if (attempt < maxTests) {
                            setTimeout(() => doPing(attempt + 1), 500); // 间隔500ms再次测试
                        } else {
                            setStatus("done");
                        }
                    }
                } catch (e) {
                    if (mounted) setStatus("error");
                }
            };

            // 延迟一点启动，形成错落感
            setTimeout(() => doPing(1), Math.random() * 1000);

            return () => { mounted = false; };
        }, [target]);

        // 颜色逻辑
        let colorClass = "text-gray-500";
        if (status === "done") {
            if (stats.avg < 100) colorClass = "text-neon-green";
            else if (stats.avg < 300) colorClass = "text-neon-gold";
            else colorClass = "text-neon-red";
        } else if (status === "error") {
            colorClass = "text-neon-red";
        }

        return (
            <div className="bg-[#12141a] border border-white/5 rounded-lg p-3 flex flex-col items-center justify-center relative overflow-hidden group">
                {/* 顶部进度条 */}
                {status === "pinging" && (
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-neon-cyan/30 overflow-hidden">
                        <div className="h-full bg-neon-cyan animate-pulse"></div>
                    </div>
                )}
                
                <div className="text-xl mb-1 opacity-80 group-hover:scale-110 transition-transform">{target.icon}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">{target.name}</div>
                
                <div className={\`font-mono font-bold text-lg \${colorClass}\`}>
                    {status === "waiting" && <span className="opacity-30">...</span>}
                    {status === "pinging" && stats.last > 0 && stats.last}
                    {status === "pinging" && stats.last === 0 && "..."}
                    {status === "done" && \`\${stats.avg}ms\`}
                    {status === "error" && "ERR"}
                </div>

                {status === "done" && (
                    <div className="text-[9px] text-gray-600 font-mono mt-1">
                        ±{stats.max - stats.min}ms
                    </div>
                )}
            </div>
        );
      };

      // 4. WebRTC 检测组件
      const WebRTCCheck = () => {
        const [ip, setIp] = useState(null);
        const [status, setStatus] = useState("scanning"); // scanning, safe, leak

        useEffect(() => {
            const rtc = new RTCPeerConnection({iceServers: [{urls: "stun:stun.l.google.com:19302"}]});
            rtc.createDataChannel('');
            rtc.createOffer().then(o => rtc.setLocalDescription(o));
            
            rtc.onicecandidate = (ice) => {
                if (ice && ice.candidate && ice.candidate.candidate) {
                    const res = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate);
                    if (res && res[1]) {
                        // 过滤内网IP
                        if (!res[1].match(/^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/)) {
                            setIp(res[1]);
                            setStatus("leak");
                        }
                    }
                }
            };
            
            // 3秒后如果没有发现外网IP，则认为安全
            setTimeout(() => {
                if (status === "scanning" && !ip) setStatus("safe");
            }, 3000);
        }, [ip]);

        return (
             <div className="hud-card rounded-2xl p-5 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Icons.Globe className="w-5 h-5 text-neon-blue" />
                        <span className="font-bold text-white tracking-wider">WebRTC LEAK TEST</span>
                    </div>
                    <div className="text-xs text-gray-500">Detecting Real IP via WebRTC Stun</div>
                </div>
                <div className="text-right">
                    {status === "scanning" && <div className="text-neon-cyan text-sm font-mono animate-pulse">SCANNING...</div>}
                    {status === "safe" && <div className="text-neon-green text-sm font-bold font-mono flex items-center gap-1"><Icons.Check className="w-4 h-4"/> SAFE</div>}
                    {status === "leak" && (
                        <div>
                            <div className="text-neon-red text-sm font-bold font-mono flex items-center gap-1 justify-end"><Icons.Alert className="w-4 h-4"/> LEAK DETECTED</div>
                            <div className="text-[10px] text-gray-400 font-mono">{ip}</div>
                        </div>
                    )}
                </div>
             </div>
        );
      };

      // 主应用
      const App = () => {
        const cfData = window.CF_DATA;
        const [riskData, setRiskData] = useState(null);
        const [riskLoading, setRiskLoading] = useState(true);

        useEffect(() => {
            // 获取风险数据
            fetch('https://api.ipapi.is')
                .then(res => res.json())
                .then(data => {
                    setRiskData(data);
                    setRiskLoading(false);
                })
                .catch(() => setRiskLoading(false));
        }, []);

        const isCN = cfData.country === 'CN';

        return (
          <div className="min-h-screen pb-12 bg-[#0b0c10] bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            {/* Header */}
            <header className="border-b border-white/5 bg-[#1f2833]/80 backdrop-blur sticky top-0 z-50">
               <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-neon-cyan/10 border border-neon-cyan/50 rounded flex items-center justify-center text-neon-cyan">
                        <Icons.Shield className="w-5 h-5" />
                     </div>
                     <span className="text-lg font-bold text-white tracking-widest font-mono">
                        IP<span className="text-neon-cyan">SENTINEL</span>
                     </span>
                  </div>
                  <div className="hidden md:block text-[10px] font-mono text-neon-blue/80 border border-neon-blue/30 px-2 py-1 rounded">
                     {window.SITE_CONFIG.footer}
                  </div>
               </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
               {/* 第一排：IP 卡片 + 风险仪表盘 */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                     <IpCard data={cfData} />
                  </div>
                  <div className="lg:col-span-1">
                     <RiskGauge riskData={riskData} loading={riskLoading} />
                  </div>
               </div>

               {/* 第二排：连通性测试 */}
               <ConnectivityGrid isCN={isCN} />

               {/* 第三排：WebRTC + 其他 */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <WebRTCCheck />
                  <div className="hud-card rounded-2xl p-5 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                          <Icons.Lock className="w-5 h-5 text-neon-gold" />
                          <span className="font-bold text-white tracking-wider">ENVIRONMENT</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="bg-black/20 p-2 rounded border border-white/5">
                              <span className="text-gray-500 block">UA OS</span>
                              <span className="text-gray-300 truncate">{cfData.userAgent.split(')')[0].split('(')[1] || 'Unknown'}</span>
                          </div>
                           <div className="bg-black/20 p-2 rounded border border-white/5">
                              <span className="text-gray-500 block">TLS / PROTO</span>
                              <span className="text-gray-300">{cfData.tlsVersion} / {cfData.httpProtocol}</span>
                          </div>
                      </div>
                  </div>
               </div>

            </main>

            <footer className="text-center text-[10px] text-gray-600 font-mono py-8">
               DATA PROVIDED BY CLOUDFLARE & IPAPI.IS
            </footer>
          </div>
        );
      };

      const root = createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
`;
}
