/**
 * IP SENTINEL - DASHBOARD EDITION
 * 复刻风格：cf.090227.xyz
 * 功能：四路 IP 检测 + 持续历史波形测速
 */

export default {
  async fetch(request, env, ctx) {
    // 获取 Cloudflare 头部信息 (用于 Cloudflare 卡片)
    const cf = request.cf || {};
    const headers = request.headers;
    const clientIp = headers.get("cf-connecting-ip") || headers.get("x-forwarded-for") || "127.0.0.1";
    
    // Cloudflare 连接数据
    const cfData = {
      ip: clientIp,
      location: `${cf.city || "Unknown"}, ${cf.country || "UNK"}`,
      isp: cf.asOrganization || "Cloudflare Edge",
      asn: cf.asn ? `AS${cf.asn}` : "N/A"
    };

    return new Response(renderHtml(cfData), {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    });
  },
};

function renderHtml(cfData) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>当前网络信息 | 网络面板</title>
    <link rel="icon" type="image/png" href="https://cdn-icons-png.flaticon.com/512/3653/3653069.png" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
    
    <script>
      window.CF_DATA = ${JSON.stringify(cfData)};
      
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: { sans: ['Noto Sans SC', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
            colors: {
              'card-bg': '#ffffff',
              'page-bg': '#f3f4f6',
              'primary': '#f97316', // Orange used in title
              'success': '#22c55e',
              'warning': '#eab308',
              'danger': '#ef4444',
            }
          }
        }
      }
    </script>
    <style>
      body { background-color: #f8f9fa; color: #374151; }
      .shadow-soft { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }
      .bar-pill { transition: all 0.3s ease; }
    </style>
  </head>
  <body class="p-4 md:p-8">
    <div id="root" class="max-w-7xl mx-auto"></div>

    <script type="text/babel" data-presets="react">
      const { useState, useEffect, useRef } = React;
      const { createRoot } = ReactDOM;

      // === 图标组件 ===
      const Icons = {
        Globe: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        ByteDance: () => <svg className="w-5 h-5 text-blue-600" viewBox="0 0 48 48" fill="currentColor"><path d="M39 6h-6v36h6V6zM9 18H3v24h6V18zm15-6h-6v30h6V12zm15 12h-6v18h6V24z"/></svg>, // 模拟声波图标
        Bilibili: () => <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.758v4.742c-.036 1.509-.556 2.769-1.56 3.766-1.004.996-2.264 1.52-3.773 1.574h-13.334c-1.509-.054-2.769-.578-3.773-1.574-1.004-.997-1.524-2.257-1.56-3.766v-4.742c.036-1.509.556-2.763 1.56-3.758 1.004-.996 2.264-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373l2.894 2.76h4.614l2.88-2.76c.267-.249.573-.373.92-.373.347 0 .653.124.92.373l.027.027c.249.249.373.551.373.907 0 .355-.124.657-.373.906l-1.174 1.12z"/></svg>,
        WeChat: () => <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M2.016 12.388c0-3.554 3.39-6.438 7.576-6.438 4.185 0 7.575 2.884 7.575 6.438 0 3.555-3.39 6.439-7.575 6.439-.839 0-1.646-.117-2.406-.33l-2.65 1.532.538-2.353c-1.884-1.374-3.058-3.392-3.058-5.288zM15.558 13.855c0-2.518 2.565-4.561 5.729-4.561 3.164 0 5.73 2.043 5.73 4.561 0 2.519-2.566 4.561-5.73 4.561-.594 0-1.166-.075-1.704-.214l-1.877 1.085.381-1.666c-1.519-.872-2.529-2.29-2.529-3.766z"/></svg>,
        Taobao: () => <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.001 2.002c-5.522 0-9.999 4.477-9.999 9.999 0 5.521 4.477 9.999 9.999 9.999 5.522 0 9.999-4.478 9.999-9.999 0-5.522-4.477-9.999-9.999-9.999zm-1.603 15.684c-.456.04-.908.016-1.353-.082-.472-.104-.897-.333-1.274-.689-.25-.236-.363-.518-.337-.847.03-.383.228-.679.593-.89.379-.219.792-.325 1.24-.316 2.378.048 4.29-1.293 5.737-4.026.17-.321.319-.654.43-1.004l-.946-.226c-.341.672-.731 1.285-1.168 1.839-.427.54-1.071 1.118-1.933 1.733l-.706-1.074c.731-.564 1.34-1.127 1.828-1.688.487-.562.894-1.244 1.221-2.046l-1.878-.449.256-1.07 1.956.467c.075-.386.115-.826.12-1.319h1.156c0 .485-.045.92-.134 1.306l2.172.519-.257 1.07-2.316-.554c-.115.358-.268.707-.461 1.047l1.096.262-.271 1.084-1.047-.25c-1.385 2.502-3.149 3.731-5.293 3.687-.432-.009-.824.086-1.176.285z"/></svg>,
        Github: () => <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405 1.02 0 2.04.135 3 .405 2.295-1.545 3.3-1.23 3.3-1.23.66 1.65.255 2.88.135 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.79 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>,
        Google: () => <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.347.533 12S5.867 24 12.48 24c3.44 0 6.04-1.133 8.133-3.293 2.133-2.133 2.773-5.12 2.773-7.573 0-.747-.067-1.467-.187-2.213h-10.72z"/></svg>,
        Cloudflare: () => <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19.32 7.13c-.85-2.48-3.21-4.16-5.88-4.16-3.13 0-5.77 2.3-6.19 5.38C3.12 8.79 0 11.96 0 16c0 4.42 3.58 8 8 8h11.5c2.48 0 4.5-2.02 4.5-4.5s-2.02-4.5-4.5-4.5c-.06 0-.12.01-.18.01z"/></svg>,
        Youtube: () => <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
        Twitter: () => <svg className="w-5 h-5 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>,
      };

      const maskIp = (ip) => {
        if (!ip) return "Loading...";
        return ip.replace(/(\d+)\.(\d+)$/, '*.*').replace(/(:[\da-f]+){3}$/, ':*:*:*');
      };

      // === 组件：IP 卡片 ===
      const IpCard = ({ title, subTitle, type, fetchUrl, isCloudflare }) => {
        const [data, setData] = useState(isCloudflare ? window.CF_DATA : null);
        const [loading, setLoading] = useState(!isCloudflare);
        const [error, setError] = useState(false);

        useEffect(() => {
          if (isCloudflare) return;
          
          const load = async () => {
             try {
                const res = await fetch(fetchUrl);
                if (!res.ok) throw new Error("Load failed");
                const json = await res.json();
                
                // 数据标准化
                let formatted = {};
                if (title.includes("国内")) { // speedtest.cn structure
                    formatted = {
                        ip: json.ip,
                        location: \`\${json.country} \${json.province} \${json.city}\`,
                        isp: json.isp,
                        desc: "您访问国内网站所使用的IP"
                    };
                } else if (title.includes("国外")) { // ipapi.co structure
                    formatted = {
                        ip: json.ip,
                        location: \`\${json.country_name} \${json.region}\`,
                        isp: \`\${json.asn} \${json.org}\`,
                        desc: "您访问没有被封的国外网站所使用的IP"
                    };
                } else if (title.includes("墙外")) { // ip.sb
                    formatted = {
                        ip: json.ip,
                        location: \`\${json.country} \${json.region}\`,
                        isp: \`\${json.asn} \${json.organization}\`,
                        desc: "您访问Twitter(x.com)等网站所使用的IP"
                    };
                }
                setData(formatted);
             } catch (e) {
                setError(true);
             } finally {
                setLoading(false);
             }
          };
          load();
        }, []);

        let statusColor = "bg-gray-300";
        if (loading) statusColor = "bg-yellow-400 animate-pulse";
        else if (error) statusColor = "bg-red-500";
        else statusColor = "bg-green-500";

        // Cloudflare Data Formatting
        if (isCloudflare && data) {
           data.desc = "您访问CFCDN网站所使用的落地IP";
           if(!data.location) data.location = "Cloudflare Edge";
        }

        return (
          <div className="bg-card-bg rounded-lg p-5 shadow-soft border border-gray-100 flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
             <div className="flex items-center gap-2 mb-4">
                <div className={\`w-2.5 h-2.5 rounded-full \${statusColor}\`}></div>
                <h3 className={\`font-bold \${title.includes('墙外') ? 'text-red-700' : (title.includes('Cloud') ? 'text-orange-600' : (title.includes('国外') ? 'text-orange-500' : 'text-orange-400'))}\`}>
                  {title} <span className="text-gray-400 font-normal text-xs ml-1">{subTitle}</span>
                </h3>
             </div>

             <div className="flex-grow flex flex-col justify-center min-h-[100px]">
                {loading ? (
                   <div className="space-y-2">
                      <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
                   </div>
                ) : error ? (
                   <div className="text-red-400 font-bold italic text-xl">加载失败</div>
                ) : (
                   <>
                      <div className="text-2xl font-bold text-gray-800 font-mono mb-1">{data.ip}</div>
                      <div className="text-sm text-gray-500 mb-2">{data.location}</div>
                      {data.isp && <div className="text-xs text-gray-400 break-words">{data.isp}</div>}
                   </>
                )}
             </div>

             <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                {error ? "· 可能被广告拦截或无法连接" : (data?.desc || "· 正在检测...")}
             </div>
          </div>
        );
      };

      // === 组件：持续测速卡片 ===
      const PingCard = ({ name, url, icon: Icon, tag }) => {
        const [history, setHistory] = useState([]); // [100, 120, 50, ...]
        const [avg, setAvg] = useState(0);

        useEffect(() => {
          const maxHistory = 8;
          const ping = async () => {
             const start = performance.now();
             try {
                // no-cors allows us to ping blocked sites (opaque response) just to measure time
                await fetch(url + "?" + Math.random(), { mode: 'no-cors', cache: 'no-store' });
                const time = Math.round(performance.now() - start);
                
                setHistory(prev => {
                   const newH = [...prev, time];
                   if (newH.length > maxHistory) newH.shift();
                   // Calculate Avg
                   const sum = newH.reduce((a, b) => a + b, 0);
                   setAvg(Math.round(sum / newH.length));
                   return newH;
                });
             } catch (e) {
                // Timeout or error
                setHistory(prev => {
                   const newH = [...prev, 9999]; // 9999 means timeout
                   if (newH.length > maxHistory) newH.shift();
                   return newH;
                });
             }
          };

          // Initial ping
          ping();
          // Loop
          const interval = setInterval(ping, 2000);
          return () => clearInterval(interval);
        }, [url]);

        const getBarColor = (ms) => {
           if (ms === 9999) return "bg-red-200"; // timeout
           if (ms < 100) return "bg-green-500";
           if (ms < 200) return "bg-yellow-400";
           return "bg-orange-500";
        };

        const displayTime = history.length > 0 ? history[history.length - 1] : 0;
        const isTimeout = displayTime === 9999;
        const timeColor = isTimeout ? "text-red-500" : (displayTime < 100 ? "text-green-600" : "text-yellow-600");

        return (
           <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-soft flex flex-col justify-between h-28">
              <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center gap-2 font-bold text-gray-700">
                    <Icon /> <span>{name}</span>
                 </div>
                 <span className={\`text-xs px-2 py-0.5 rounded-full \${tag === '国内' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}\`}>
                    {tag}
                 </span>
              </div>
              
              <div className="flex items-baseline gap-1 mb-2">
                 <span className={\`text-xl font-bold font-mono \${timeColor}\`}>
                    {isTimeout ? "Timeout" : displayTime + "ms"}
                 </span>
              </div>

              {/* Ping History Bars */}
              <div className="flex gap-1 h-1.5 mt-auto">
                 {[...Array(8)].map((_, i) => {
                    const val = history[i];
                    return (
                       <div 
                          key={i} 
                          className={\`flex-1 rounded-full bar-pill \${val !== undefined ? getBarColor(val) : 'bg-gray-100'}\`}
                       ></div>
                    );
                 })}
              </div>
           </div>
        );
      };

      const App = () => {
        return (
          <>
             <header className="mb-6 flex items-center gap-2">
                <Icons.Globe />
                <h1 className="text-xl font-bold text-primary">当前网络信息</h1>
             </header>

             {/* 第一行：IP 卡片 */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <IpCard 
                   title="国内测试" subTitle="(speedtest.cn)" 
                   fetchUrl="https://forge.speedtest.cn/api/location/info"
                />
                <IpCard 
                   title="国外测试" subTitle="(漏网之鱼)" 
                   fetchUrl="https://ipapi.co/json/"
                />
                <IpCard 
                   title="Cloudflare" subTitle="(ProxyIP)" 
                   isCloudflare={true}
                />
                <IpCard 
                   title="墙外测试" subTitle="(推特)" 
                   // 使用一个通常被墙的域名的IP查询接口，这里模拟一个，
                   // 实际上在前端无法直接检测是否被墙，通常表现为连接超时(Load Failed)
                   // 我们使用 ip.sb 模拟海外连接，如果用户已翻墙则显示，否则可能超时
                   fetchUrl="https://api.ip.sb/geoip"
                />
             </div>

             {/* 第二行：测速卡片 */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <PingCard name="字节跳动" url="https://www.douyin.com" icon={Icons.ByteDance} tag="国内" />
                <PingCard name="Bilibili" url="https://www.bilibili.com" icon={Icons.Bilibili} tag="国内" />
                <PingCard name="微信" url="https://mp.weixin.qq.com" icon={Icons.WeChat} tag="国内" />
                <PingCard name="淘宝" url="https://www.taobao.com" icon={Icons.Taobao} tag="国内" />
                
                <PingCard name="GitHub" url="https://github.com" icon={Icons.Github} tag="国际" />
                <PingCard name="Cloudflare" url="https://www.cloudflare.com" icon={Icons.Cloudflare} tag="国际" />
                <PingCard name="Google" url="https://www.google.com" icon={Icons.Google} tag="国际" />
                <PingCard name="YouTube" url="https://www.youtube.com" icon={Icons.Youtube} tag="国际" />
             </div>

             <footer className="mt-8 text-center text-xs text-gray-400">
                <p>Designed like cf.090227.xyz | Powerd by Cloudflare Workers</p>
             </footer>
          </>
        );
      };

      const root = createRoot(document.getElementById('root'));
      root.render(<App />);
    </script>
  </body>
</html>
`;
}
