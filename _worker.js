/**
 * IP SENTINEL - HUD EDITION
 * 修复版：高对比度、无动画、清晰可视
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 配置
    const config = {
      title: env.TITLE || "网络连接哨兵",
      footer: env.FOOTER || "SYSTEM ONLINE // MONITORING",
    };

    // PWA Manifest
    if (url.pathname === "/manifest.json") {
      return new Response(JSON.stringify({
        "name": config.title,
        "short_name": "Sentinel",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#09090b",
        "theme_color": "#09090b",
        "icons": [{
          "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2306b6d4' stroke-width='2'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/%3E%3C/svg%3E",
          "type": "image/svg+xml",
          "sizes": "192x192"
        }]
      }), { headers: { "content-type": "application/json" }});
    }

    // IP 数据获取
    const cf = request.cf || {};
    const headers = request.headers;
    const clientIp = headers.get("cf-connecting-ip") || headers.get("x-forwarded-for") || "127.0.0.1";
    
    const initData = {
      ip: clientIp,
      country: cf.country || "UNK", 
      city: cf.city || "Unknown City",
      region: cf.region || "",
      isp: cf.asOrganization || "ISP Unknown",
      asn: cf.asn ? "AS" + cf.asn : "AS-N/A",
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
    <meta name="theme-color" content="#09090b" />
    <link rel="manifest" href="/manifest.json" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=JetBrains+Mono:wght@400;500;700;800&display=swap" rel="stylesheet">
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
            fontFamily: { 
              sans: ['Rajdhani', 'sans-serif'], 
              mono: ['JetBrains Mono', 'monospace'],
            },
            colors: { 
              bg: '#09090b',
              panel: '#18181b',
              accent: '#06b6d4', // Cyan 500
              success: '#10b981',
              warning: '#f59e0b',
              danger: '#ef4444'
            }
          }
        }
      }
    </script>
    <style>
      body { background-color: #09090b; color: #e4e4e7; antialiased; }
      
      /* HUD 卡片样式 */
      .hud-card {
        background: rgba(24, 24, 27, 0.7);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(63, 63, 70, 0.5);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        position: relative;
      }
      
      /* 角标装饰 */
      .hud-card::before {
        content: ''; position: absolute; top: -1px; left: -1px; width: 8px; height: 8px;
        border-top: 2px solid #06b6d4; border-left: 2px solid #06b6d4; z-index: 10;
      }
      .hud-card::after {
        content: ''; position: absolute; bottom: -1px; right: -1px; width: 8px; height: 8px;
        border-bottom: 2px solid #06b6d4; border-right: 2px solid #06b6d4; z-index: 10;
      }

      /* 地图样式修正 - 提高可见度 */
      .map-container iframe {
        filter: grayscale(1) invert(1) contrast(1.2) brightness(0.8);
        opacity: 0.6;
        transition: opacity 0.3s;
      }
      .map-container:hover iframe { opacity: 0.8; }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script type="text/babel" data-presets="react">
      const { useState, useEffect } = React;
      const { createRoot } = ReactDOM;

      const Icons = {
        Wifi: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
        Shield: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
        MapPin: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
        Eye: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
        EyeOff: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>,
        Server: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
        Activity: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
        Copy: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
        Check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
      };

      const copyToClipboard = (text, setCopied) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(console.error);
      };

      const DataItem = ({ label, value, sub, className="" }) => (
        <div className={\`flex flex-col \${className}\`}>
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">{label}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-white font-mono font-bold text-lg truncate">{value}</span>
            {sub && <span className="text-xs text-accent font-mono border border-accent/20 px-1 rounded bg-accent/5">{sub}</span>}
          </div>
        </div>
      );

      const StatusBadge = ({ label, status }) => {
        let color = "bg-gray-500";
        if(status === 'success') color = "bg-success";
        if(status === 'warning') color = "bg-warning";
        if(status === 'danger') color = "bg-danger";
        
        return (
           <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded border border-white/10">
              <div className={\`w-2 h-2 rounded-full \${color} shadow-[0_0_8px_rgba(0,0,0,0.5)]\`}></div>
              <span className="text-xs font-mono text-gray-300">{label}</span>
           </div>
        );
      }

      const MainDashboard = ({ data }) => {
        const [isHidden, setIsHidden] = useState(false);
        const [risk, setRisk] = useState({ score: 0, loading: true });
        const [copied, setCopied] = useState(false);

        useEffect(() => {
           fetch('https://api.ipapi.is').then(r => r.json()).then(d => {
              let score = 100;
              if(d.is_vpn) score -= 20;
              if(d.is_proxy) score -= 20;
              if(d.is_datacenter) score -= 20;
              if(d.is_abuser) score -= 40;
              setRisk({ score: Math.max(0, score), loading: false, data: d });
           }).catch(() => setRisk({ score: 50, loading: false }));
        }, []);

        const mask = (ip) => ip.replace(/[\d\w]+$/, '***');

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* 左侧：地图 + 核心 IP 卡片 */}
            <div className="lg:col-span-2 relative h-[320px] rounded-2xl overflow-hidden bg-panel border border-white/10 shadow-2xl group">
               {/* 背景地图 - 独立层 */}
               <div className="absolute inset-0 map-container z-0 bg-[#111]">
                  <iframe 
                    src={\`https://maps.google.com/maps?q=\${data.lat},\${data.lon}&z=6&output=embed\`}
                    className="w-full h-full border-none"
                    title="Map"
                  ></iframe>
                  {/* 遮罩，保证上方文字可读 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-transparent"></div>
               </div>

               {/* 内容浮层 */}
               <div className="absolute inset-0 z-10 p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-2">
                        <div className="bg-accent/20 p-2 rounded text-accent border border-accent/20">
                           <Icons.Wifi className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-xs text-gray-400 font-mono uppercase">Current Protocol</span>
                           <span className="text-sm font-bold text-white">{data.httpProtocol} / {data.tlsVersion}</span>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => setIsHidden(!isHidden)} className="p-2 bg-black/40 hover:bg-black/60 text-gray-300 rounded border border-white/10 transition-colors">
                           {isHidden ? <Icons.EyeOff className="w-4 h-4"/> : <Icons.Eye className="w-4 h-4"/>}
                        </button>
                        <button onClick={() => copyToClipboard(data.ip, setCopied)} className="p-2 bg-black/40 hover:bg-black/60 text-gray-300 rounded border border-white/10 transition-colors">
                           {copied ? <Icons.Check className="w-4 h-4 text-success"/> : <Icons.Copy className="w-4 h-4"/>}
                        </button>
                     </div>
                  </div>

                  <div>
                     <span className="text-accent font-mono text-sm tracking-widest mb-1 block">:: CONNECTED IP ADDRESS</span>
                     <h1 className="text-4xl md:text-5xl font-mono font-bold text-white tracking-tight mb-4 drop-shadow-lg">
                        {isHidden ? mask(data.ip) : data.ip}
                     </h1>
                     
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DataItem label="COUNTRY" value={data.country} sub={data.region} />
                        <DataItem label="CITY" value={data.city} />
                        <DataItem label="ISP" value={data.isp} className="col-span-2" />
                     </div>
                  </div>
               </div>
            </div>

            {/* 右侧：风险评分 + 环境信息 */}
            <div className="flex flex-col gap-4">
               <div className="hud-card flex-1 rounded-xl p-5 flex flex-col justify-center items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>
                  <h3 className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-4">Security Score</h3>
                  
                  <div className="relative mb-2">
                     <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="56" stroke="#27272a" strokeWidth="8" fill="none"/>
                        <circle cx="64" cy="64" r="56" stroke={risk.score > 80 ? "#10b981" : "#f59e0b"} strokeWidth="8" fill="none" strokeDasharray="351" strokeDashoffset={351 * (1 - risk.score/100)} className="transition-all duration-1000"/>
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold font-mono text-white">{risk.loading ? '--' : risk.score}</span>
                        <span className="text-[10px] text-gray-500">/ 100</span>
                     </div>
                  </div>
                  
                  <div className="flex gap-2 text-[10px] font-mono text-gray-400 mt-2">
                     <span className={risk.data?.is_proxy ? "text-danger" : "text-gray-600"}>PROXY</span>
                     <span>|</span>
                     <span className={risk.data?.is_vpn ? "text-danger" : "text-gray-600"}>VPN</span>
                     <span>|</span>
                     <span className={risk.data?.is_datacenter ? "text-warning" : "text-gray-600"}>D-CENTER</span>
                  </div>
               </div>

               <div className="hud-card flex-1 rounded-xl p-5 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2 text-accent">
                     <Icons.Server className="w-4 h-4" />
                     <span className="text-xs font-bold tracking-widest">SYSTEM INFO</span>
                  </div>
                  <div className="space-y-3">
                     <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500 text-xs font-mono">ASN</span>
                        <span className="text-white text-xs font-mono">{data.asn}</span>
                     </div>
                     <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-500 text-xs font-mono">DATACENTER</span>
                        <span className="text-white text-xs font-mono">{data.colo}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500 text-xs font-mono">COORDS</span>
                        <span className="text-white text-xs font-mono">{data.lat.toFixed(1)}, {data.lon.toFixed(1)}</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        );
      };

      const PingModule = () => {
         const targets = [
            { name: "Google", url: "https://www.google.com" },
            { name: "Github", url: "https://github.com" },
            { name: "Cloudflare", url: "https://www.cloudflare.com" },
            { name: "Baidu", url: "https://www.baidu.com" }
         ];

         return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
               {targets.map(t => <PingItem key={t.name} target={t} />)}
            </div>
         );
      };

      const PingItem = ({ target }) => {
         const [status, setStatus] = useState('pending');
         const [ms, setMs] = useState(0);

         useEffect(() => {
            const start = performance.now();
            fetch(target.url, { mode: 'no-cors', cache: 'no-store' })
               .then(() => {
                  setMs(Math.round(performance.now() - start));
                  setStatus('success');
               })
               .catch(() => setStatus('error'));
         }, []);

         let color = "text-gray-500";
         let border = "border-white/5";
         if(status === 'success') { color = ms < 200 ? "text-success" : "text-warning"; border = ms < 200 ? "border-success/30" : "border-warning/30"; }
         if(status === 'error') { color = "text-danger"; border = "border-danger/30"; }

         return (
            <div className={\`bg-panel border \${border} rounded-lg p-3 flex flex-col items-center justify-center transition-all\`}>
               <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{target.name}</span>
               <div className={\`text-xl font-mono font-bold \${color}\`}>
                  {status === 'pending' ? <span className="animate-pulse">...</span> : 
                   status === 'error' ? 'ERR' : ms}<span className="text-xs ml-0.5 opacity-50">ms</span>
               </div>
            </div>
         );
      };

      const ConnectivitySection = () => {
         return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <ConnCard title="IPv4 Connectivity" url="https://api-ipv4.ip.sb/geoip" />
               <ConnCard title="IPv6 Connectivity" url="https://api-ipv6.ip.sb/geoip" />
            </div>
         );
      };

      const ConnCard = ({ title, url }) => {
         const [data, setData] = useState(null);
         const [error, setError] = useState(false);

         useEffect(() => {
            fetch(url)
               .then(res => res.json())
               .then(setData)
               .catch(() => setError(true));
         }, [url]);

         return (
            <div className="hud-card rounded-xl p-5">
               <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                     <Icons.Activity className="w-4 h-4 text-accent" />
                     <span className="font-bold text-gray-300 text-sm">{title}</span>
                  </div>
                  {!data && !error && <div className="w-2 h-2 bg-accent rounded-full animate-ping"></div>}
                  {error && <div className="text-xs text-danger font-mono">UNAVAILABLE</div>}
                  {data && <div className="text-xs text-success font-mono">ACTIVE</div>}
               </div>
               
               {data ? (
                  <div className="space-y-2">
                     <div className="flex justify-between">
                        <span className="text-xs text-gray-500">IP Addr</span>
                        <span className="text-xs text-white font-mono">{data.ip}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-xs text-gray-500">ISP</span>
                        <span className="text-xs text-white font-mono">{data.isp}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Location</span>
                        <span className="text-xs text-white font-mono">{data.country}, {data.city}</span>
                     </div>
                  </div>
               ) : (
                  <div className="h-20 flex items-center justify-center text-xs text-gray-600 font-mono">
                     {error ? "No Connection" : "Scanning Network..."}
                  </div>
               )}
            </div>
         );
      };

      const App = () => {
        return (
          <div className="min-h-screen bg-bg text-gray-200 pb-10">
            {/* 头部 */}
            <header className="border-b border-white/5 bg-panel/50 backdrop-blur-md sticky top-0 z-50">
               <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-accent">
                     <Icons.Shield className="w-6 h-6" />
                     <span className="font-sans font-bold text-xl text-white tracking-widest">{window.SITE_CONFIG.title}</span>
                  </div>
                  <div className="hidden md:flex items-center gap-4">
                     <StatusBadge label="SSL SECURE" status="success" />
                     <div className="text-xs font-mono text-gray-600">{new Date().toLocaleDateString()}</div>
                  </div>
               </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
               <MainDashboard data={window.CF_DATA} />
               
               <div className="mb-6">
                  <h3 className="text-xs font-mono text-gray-500 mb-3 uppercase tracking-widest pl-1 border-l-2 border-accent">Network Latency</h3>
                  <PingModule />
               </div>

               <div className="mb-6">
                  <h3 className="text-xs font-mono text-gray-500 mb-3 uppercase tracking-widest pl-1 border-l-2 border-accent">Stack Analysis</h3>
                  <ConnectivitySection />
               </div>
            </main>

            <footer className="text-center py-8 text-[10px] text-gray-600 font-mono uppercase tracking-[0.2em] border-t border-white/5">
               {window.SITE_CONFIG.footer}
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
