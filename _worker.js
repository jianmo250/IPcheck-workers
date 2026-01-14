/**
 * IP SENTINEL - ULTIMATE EDITION
 * 修复版：无黑屏 / 全汉化 / 硬编码配置
 */

export default {
  async fetch(request, env, ctx) {
    // 获取 Cloudflare 头部信息
    const cf = request.cf || {};
    const headers = request.headers;
    const clientIp = headers.get("cf-connecting-ip") || headers.get("x-forwarded-for") || "127.0.0.1";
    
    // 初始化数据 (安全默认值)
    const initData = {
      ip: clientIp,
      country: cf.country || "未知", 
      city: cf.city || "未知城市",
      region: cf.region || "",
      isp: cf.asOrganization || "未知运营商",
      asn: cf.asn ? "AS" + cf.asn : "N/A",
      lat: Number(cf.latitude) || 0,
      lon: Number(cf.longitude) || 0,
      colo: cf.colo || "UNK",
      httpProtocol: cf.httpProtocol || "HTTP/2",
      tlsVersion: cf.tlsVersion || "TLS 1.3",
      userAgent: headers.get("user-agent") || "未知设备"
    };

    // PWA Manifest (硬编码配置)
    const url = new URL(request.url);
    if (url.pathname === "/manifest.json") {
      return new Response(JSON.stringify({
        "name": "IP 哨兵",
        "short_name": "IP Sentinel",
        "display": "standalone",
        "background_color": "#050505",
        "theme_color": "#050505",
        "icons": [{
          "src": "https://cdn-icons-png.flaticon.com/512/9662/9662243.png",
          "sizes": "192x192",
          "type": "image/png"
        }]
      }), { headers: { "content-type": "application/json" }});
    }

    return new Response(renderHtml(initData), {
      headers: { 
        'content-type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache' // 防止缓存导致旧版 JS 报错
      },
    });
  },
};

function renderHtml(initData) {
  return `
<!DOCTYPE html>
<html lang="zh-CN" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>IP 哨兵 | 网络监控中心</title>
    <meta name="theme-color" content="#050505" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/png" href="https://cdn-icons-png.flaticon.com/512/9662/9662243.png" />
    
    <!-- 核心库 CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
    
    <script>
      window.CF_DATA = ${JSON.stringify(initData)};
      
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: { sans: ['Noto Sans SC', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
            colors: { 
              bg: '#050505', 
              panel: '#111318', 
              accent: '#00f2ea', // 赛博青
              danger: '#ff2a6d', // 赛博红
              success: '#05d5fa', // 亮蓝
              warning: '#f5d300', // 赛博黄
            }
          }
        }
      }
    </script>
    <style>
      body { background-color: #050505; color: #e0e0e0; overflow-x: hidden; }
      
      /* 玻璃拟态卡片 */
      .cyber-card {
        background: rgba(17, 19, 24, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 15px rgba(0, 242, 234, 0.05);
        position: relative;
        overflow: hidden;
      }
      
      /* 扫描线动画 */
      .scan-line {
        position: absolute; top: 0; left: 0; width: 100%; height: 2px;
        background: linear-gradient(90deg, transparent, #00f2ea, transparent);
        opacity: 0.3;
        animation: scan 3s linear infinite;
        pointer-events: none;
      }
      @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }

      /* 地图滤镜 */
      .map-filter { filter: invert(1) grayscale(1) brightness(0.7) contrast(1.2); }
      
      /* 仪表盘圆环 */
      .gauge-circle { transition: stroke-dashoffset 1s ease-in-out; transform: rotate(-90deg); transform-origin: 50% 50%; }
      
      /* 滚动条 */
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: #050505; }
      ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel" data-presets="react">
      const { useState, useEffect } = React;
      const { createRoot } = ReactDOM;

      // === 图标组件 (SVG) ===
      const Icons = {
        Wifi: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
        Shield: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
        Globe: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
        Alert: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
        Check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
        Eye: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
        EyeOff: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>,
        MapPin: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
      };

      // === 工具函数 ===
      const maskIp = (ip) => {
         if(!ip) return "";
         return ip.replace(/(\d+)\.(\d+)$/, '***.***').replace(/(:[\da-f]+){3}$/, ':****:****:****');
      };

      // === 组件：主要 IP 信息卡片 ===
      const IpMainCard = ({ data }) => {
        const [showIp, setShowIp] = useState(true);
        const isCN = data.country === 'CN';

        return (
          <div className="cyber-card rounded-2xl flex flex-col md:flex-row min-h-[300px]">
            <div className="scan-line"></div>
            
            {/* 左侧：地图 */}
            <div className="relative w-full md:w-2/5 h-48 md:h-auto bg-[#000]">
               <iframe 
                  src={\`https://maps.google.com/maps?q=\${data.lat},\${data.lon}&z=6&output=embed\`}
                  className="w-full h-full border-none map-filter opacity-50 hover:opacity-80 transition-opacity duration-500"
                  title="IP Location"
               ></iframe>
               <div className="absolute bottom-3 left-3 flex flex-col gap-1">
                  <div className="bg-black/80 backdrop-blur border border-accent/20 px-2 py-1 rounded text-[10px] text-accent font-mono flex items-center gap-1">
                     <Icons.MapPin className="w-3 h-3" />
                     {data.lat.toFixed(2)}, {data.lon.toFixed(2)}
                  </div>
               </div>
            </div>

            {/* 右侧：数据 */}
            <div className="w-full md:w-3/5 p-6 flex flex-col justify-between relative bg-gradient-to-br from-transparent to-panel/80">
               <div>
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <div className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-1">当前客户端 IP</div>
                        <div className="flex items-center gap-3">
                           <h1 className="text-3xl md:text-5xl font-mono font-bold text-white tracking-tight break-all cursor-pointer" onClick={() => setShowIp(!showIp)}>
                              {showIp ? data.ip : maskIp(data.ip)}
                           </h1>
                           <button onClick={() => setShowIp(!showIp)} className="text-gray-500 hover:text-accent transition-colors">
                              {showIp ? <Icons.EyeOff className="w-5 h-5"/> : <Icons.Eye className="w-5 h-5"/>}
                           </button>
                        </div>
                     </div>
                     <div className="text-right hidden md:block">
                        <span className="bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded text-xs font-bold font-mono">
                           {isCN ? "中国大陆" : "海外地区"}
                        </span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-6">
                     <div>
                        <span className="text-xs text-gray-500 block mb-1">物理位置</span>
                        <div className="text-lg text-gray-200 font-medium flex items-center gap-2">
                           <span className="text-2xl">{data.country === 'CN' ? '🇨🇳' : '🌍'}</span>
                           {data.country} {data.region}
                        </div>
                        <div className="text-sm text-gray-400 mt-0.5">{data.city}</div>
                     </div>
                     <div>
                        <span className="text-xs text-gray-500 block mb-1">网络运营商 (ISP)</span>
                        <div className="text-lg text-gray-200 font-medium truncate" title={data.isp}>{data.isp}</div>
                        <div className="text-sm text-gray-400 font-mono mt-0.5">{data.asn}</div>
                     </div>
                  </div>
               </div>

               <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center text-xs font-mono text-gray-600">
                  <div>协议: {data.httpProtocol} / {data.tlsVersion}</div>
                  <div className="text-accent flex items-center gap-1">
                     <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                     监控中
                  </div>
               </div>
            </div>
          </div>
        );
      };

      // === 组件：风险仪表盘 ===
      const RiskDashboard = () => {
         const [score, setScore] = useState(0);
         const [loading, setLoading] = useState(true);
         const [details, setDetails] = useState({});

         useEffect(() => {
            // 使用 ipapi.is 数据
            fetch('https://api.ipapi.is')
               .then(res => res.json())
               .then(data => {
                  let s = 100;
                  // 简单的扣分逻辑
                  if (data.is_vpn) s -= 30;
                  if (data.is_proxy) s -= 30;
                  if (data.is_tor) s -= 50;
                  if (data.is_datacenter) s -= 20;
                  if (data.is_abuser) s -= 50;
                  
                  setScore(Math.max(0, s));
                  setDetails(data);
                  setLoading(false);
               })
               .catch(() => {
                  setScore(80); // 默认安全分
                  setLoading(false);
               });
         }, []);

         // 计算圆环路径
         const radius = 56;
         const circumference = 2 * Math.PI * radius;
         const offset = circumference - ((score / 100) * circumference);
         
         let color = "#00f2ea"; // 默认青色
         let level = "安全";
         if (score < 80) { color = "#f5d300"; level = "中等风险"; }
         if (score < 50) { color = "#ff2a6d"; level = "高危"; }

         const RiskItem = ({ label, active }) => (
            <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
               <span className="text-xs text-gray-400">{label}</span>
               <span className={\`text-xs font-mono font-bold px-2 py-0.5 rounded \${active ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-white/5 text-gray-500'}\`}>
                  {active ? "检出" : "安全"}
               </span>
            </div>
         );

         return (
            <div className="cyber-card rounded-2xl p-6 h-full flex flex-col">
               <div className="flex items-center gap-2 mb-6">
                  <Icons.Shield className="w-5 h-5 text-accent" />
                  <span className="font-bold text-white tracking-wide">风险评估</span>
               </div>

               <div className="flex flex-col md:flex-row items-center gap-8 h-full">
                  {/* 仪表盘 */}
                  <div className="relative w-32 h-32 flex-shrink-0">
                     <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r={radius} stroke="#333" strokeWidth="8" fill="none" />
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
                        <span className="text-[10px] font-bold" style={{color}}>{level}</span>
                     </div>
                  </div>

                  {/* 列表 */}
                  <div className="flex-grow w-full space-y-1">
                     <RiskItem label="VPN 服务" active={details.is_vpn} />
                     <RiskItem label="代理服务器" active={details.is_proxy} />
                     <RiskItem label="数据中心/云" active={details.is_datacenter} />
                     <RiskItem label="Tor 节点" active={details.is_tor} />
                  </div>
               </div>
            </div>
         );
      };

      // === 组件：连通性测试 (支持多次 Ping) ===
      const PingTest = ({ isCN }) => {
         const targets = isCN 
            ? [
               { name: "百度", url: "https://www.baidu.com", icon: "🔍" },
               { name: "B站", url: "https://www.bilibili.com", icon: "📺" },
               { name: "淘宝", url: "https://www.taobao.com", icon: "🛍️" },
               { name: "微信", url: "https://mp.weixin.qq.com", icon: "💬" },
            ]
            : [
               { name: "Google", url: "https://www.google.com", icon: "G" },
               { name: "YouTube", url: "https://www.youtube.com", icon: "▶️" },
               { name: "GitHub", url: "https://github.com", icon: "🐙" },
               { name: "OpenAI", url: "https://api.openai.com", icon: "🤖" },
            ];

         return (
            <div className="cyber-card rounded-2xl p-6 mt-6">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                     <Icons.Wifi className="w-5 h-5 text-accent" />
                     <span className="font-bold text-white">网络连通性测试</span>
                  </div>
                  <span className="text-[10px] font-mono border border-white/20 px-2 py-1 rounded text-gray-400">
                     模式: {isCN ? "国内互联" : "国际互联"}
                  </span>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {targets.map(t => <PingBox key={t.name} target={t} />)}
               </div>
            </div>
         );
      };

      const PingBox = ({ target }) => {
         const [ms, setMs] = useState(0);
         const [status, setStatus] = useState("pending"); // pending, success, error

         useEffect(() => {
            const start = performance.now();
            fetch(target.url, { mode: 'no-cors', cache: 'no-store' })
               .then(() => {
                  const duration = Math.round(performance.now() - start);
                  setMs(duration);
                  setStatus("success");
               })
               .catch(() => setStatus("error"));
         }, [target]);

         let color = "text-gray-500";
         if (status === "success") color = ms < 200 ? "text-success" : "text-warning";
         if (status === "error") color = "text-danger";

         return (
            <div className="bg-panel border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center hover:border-accent/30 transition-colors">
               <div className="text-2xl mb-2">{target.icon}</div>
               <div className="text-xs text-gray-500 mb-1">{target.name}</div>
               <div className={\`font-mono font-bold text-lg \${color}\`}>
                  {status === "pending" ? <span className="animate-pulse">...</span> : 
                   status === "error" ? "超时" : ms + "ms"}
               </div>
            </div>
         );
      };

      // === 组件：WebRTC 检测 ===
      const WebRTCCheck = () => {
         const [leakIp, setLeakIp] = useState(null);
         const [status, setStatus] = useState("scanning");

         useEffect(() => {
            try {
               const rtc = new RTCPeerConnection({iceServers: [{urls: "stun:stun.l.google.com:19302"}]});
               rtc.createDataChannel('');
               rtc.createOffer().then(o => rtc.setLocalDescription(o));
               
               rtc.onicecandidate = (ice) => {
                  if (ice && ice.candidate && ice.candidate.candidate) {
                     const raw = ice.candidate.candidate;
                     const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(raw);
                     if (ipMatch && ipMatch[1]) {
                        const ip = ipMatch[1];
                        // 忽略内网 IP
                        if (!ip.match(/^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/)) {
                           setLeakIp(ip);
                           setStatus("leak");
                           rtc.close();
                        }
                     }
                  }
               };
               
               setTimeout(() => {
                  if (status === "scanning" && !leakIp) setStatus("safe");
               }, 2000);
            } catch(e) {
               setStatus("safe");
            }
         }, []);

         return (
            <div className="cyber-card rounded-2xl p-6 flex flex-col justify-center h-full">
               <div className="flex items-center gap-2 mb-2">
                  <Icons.Globe className="w-5 h-5 text-success" />
                  <span className="font-bold text-white">隐私泄露检测 (WebRTC)</span>
               </div>
               
               <div className="flex-grow flex items-center">
                  {status === "scanning" && <div className="text-accent font-mono animate-pulse">正在扫描 STUN 服务器...</div>}
                  
                  {status === "safe" && (
                     <div className="flex items-center gap-2 text-success">
                        <Icons.Check className="w-6 h-6" />
                        <div>
                           <div className="font-bold">未检测到 IP 泄露</div>
                           <div className="text-xs text-gray-500">浏览器 WebRTC 接口安全</div>
                        </div>
                     </div>
                  )}
                  
                  {status === "leak" && (
                     <div className="flex items-center gap-2 text-danger">
                        <Icons.Alert className="w-6 h-6" />
                        <div>
                           <div className="font-bold">存在真实 IP 泄露</div>
                           <div className="text-xs font-mono bg-danger/10 px-1 rounded">{leakIp}</div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         );
      };

      // === 主程序 ===
      const App = () => {
        const data = window.CF_DATA;
        const isCN = data.country === 'CN';

        // 简单的错误边界 fallback
        if (!data) return <div className="text-center p-10 text-white">数据加载失败，请刷新重试。</div>;

        return (
          <div className="min-h-screen pb-10">
            {/* 顶栏 */}
            <header className="border-b border-white/10 bg-panel/80 backdrop-blur sticky top-0 z-50">
               <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded bg-gradient-to-tr from-accent to-blue-500 flex items-center justify-center text-black font-bold">
                        <Icons.Shield className="w-5 h-5 text-black" />
                     </div>
                     <span className="text-lg font-bold text-white tracking-wider">
                        IP<span className="text-accent">哨兵</span>
                     </span>
                  </div>
                  <div className="hidden md:block text-xs font-mono text-gray-500">
                     系统状态: 监控中 // {new Date().toLocaleDateString()}
                  </div>
               </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
               {/* 第一行：主要信息 + 风险 */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                     <IpMainCard data={data} />
                  </div>
                  <div className="lg:col-span-1">
                     <RiskDashboard />
                  </div>
               </div>

               {/* 第二行：连通性 */}
               <PingTest isCN={isCN} />

               {/* 第三行：其他工具 */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <WebRTCCheck />
                  <div className="cyber-card rounded-2xl p-6 flex flex-col justify-center">
                     <div className="text-gray-500 text-xs uppercase mb-2">客户端环境</div>
                     <div className="bg-black/30 p-3 rounded border border-white/5 font-mono text-xs text-gray-300 break-all">
                        {data.userAgent}
                     </div>
                  </div>
               </div>
            </main>

            <footer className="text-center py-8 text-xs text-gray-600 font-mono">
               IP SENTINEL SYSTEM // POWERED BY CLOUDFLARE WORKERS
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
