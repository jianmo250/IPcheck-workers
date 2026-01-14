/**
 * IP SENTINEL - PRO DASHBOARD
 * 1. UI 质感升级（悬浮、阴影、动画）
 * 2. 修复国内 IP 检测接口
 * 3. 集成 IPAPI.is 深度详情弹窗
 */

export default {
  async fetch(request, env, ctx) {
    const cf = request.cf || {};
    const headers = request.headers;
    const clientIp = headers.get("cf-connecting-ip") || headers.get("x-forwarded-for") || "127.0.0.1";
    
    // Cloudflare 自身数据
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
    <title>网络连接看板 | IP Sentinel</title>
    <link rel="icon" type="image/png" href="https://cdn-icons-png.flaticon.com/512/9662/9662243.png" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
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
              'primary': '#f97316',
              'primary-light': '#ffedd5',
              'success': '#10b981',
              'danger': '#ef4444',
            },
            boxShadow: {
              'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }
          }
        }
      }
    </script>
    <style>
      body { 
        background-color: #f8fafc; 
        color: #334155; 
        background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
        background-size: 24px 24px;
      }
      .glass-effect {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
      }
      .modal-enter { opacity: 0; transform: scale(0.95); }
      .modal-enter-active { opacity: 1; transform: scale(1); transition: all 0.2s; }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
    </style>
  </head>
  <body class="p-4 md:p-8 min-h-screen">
    <div id="root" class="max-w-7xl mx-auto"></div>

    <script type="text/babel" data-presets="react">
      const { useState, useEffect } = React;
      const { createRoot } = ReactDOM;

      // === 图标组件 ===
      const Icons = {
        Globe: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        Search: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
        Info: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        Check: () => <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
        X: () => <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
        Shield: () => <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.85.59-4.16" /></svg>,
        Map: () => <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        ByteDance: () => <svg className="w-5 h-5 text-blue-600" viewBox="0 0 48 48" fill="currentColor"><path d="M39 6h-6v36h6V6zM9 18H3v24h6V18zm15-6h-6v30h6V12zm15 12h-6v18h6V24z"/></svg>,
        Bilibili: () => <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.758v4.742c-.036 1.509-.556 2.769-1.56 3.766-1.004.996-2.264 1.52-3.773 1.574h-13.334c-1.509-.054-2.769-.578-3.773-1.574-1.004-.997-1.524-2.257-1.56-3.766v-4.742c.036-1.509.556-2.763 1.56-3.758 1.004-.996 2.264-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373l2.894 2.76h4.614l2.88-2.76c.267-.249.573-.373.92-.373.347 0 .653.124.92.373l.027.027c.249.249.373.551.373.907 0 .355-.124.657-.373.906l-1.174 1.12z"/></svg>,
        WeChat: () => <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M2.016 12.388c0-3.554 3.39-6.438 7.576-6.438 4.185 0 7.575 2.884 7.575 6.438 0 3.555-3.39 6.439-7.575 6.439-.839 0-1.646-.117-2.406-.33l-2.65 1.532.538-2.353c-1.884-1.374-3.058-3.392-3.058-5.288zM15.558 13.855c0-2.518 2.565-4.561 5.729-4.561 3.164 0 5.73 2.043 5.73 4.561 0 2.519-2.566 4.561-5.73 4.561-.594 0-1.166-.075-1.704-.214l-1.877 1.085.381-1.666c-1.519-.872-2.529-2.29-2.529-3.766z"/></svg>,
        Taobao: () => <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.001 2.002c-5.522 0-9.999 4.477-9.999 9.999 0 5.521 4.477 9.999 9.999 9.999 5.522 0 9.999-4.478 9.999-9.999 0-5.522-4.477-9.999-9.999-9.999zm-1.603 15.684c-.456.04-.908.016-1.353-.082-.472-.104-.897-.333-1.274-.689-.25-.236-.363-.518-.337-.847.03-.383.228-.679.593-.89.379-.219.792-.325 1.24-.316 2.378.048 4.29-1.293 5.737-4.026.17-.321.319-.654.43-1.004l-.946-.226c-.341.672-.731 1.285-1.168 1.839-.427.54-1.071 1.118-1.933 1.733l-.706-1.074c.731-.564 1.34-1.127 1.828-1.688.487-.562.894-1.244 1.221-2.046l-1.878-.449.256-1.07 1.956.467c.075-.386.115-.826.12-1.319h1.156c0 .485-.045.92-.134 1.306l2.172.519-.257 1.07-2.316-.554c-.115.358-.268.707-.461 1.047l1.096.262-.271 1.084-1.047-.25c-1.385 2.502-3.149 3.731-5.293 3.687-.432-.009-.824.086-1.176.285z"/></svg>,
        Github: () => <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405 1.02 0 2.04.135 3 .405 2.295-1.545 3.3-1.23 3.3-1.23.66 1.65.255 2.88.135 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.79 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>,
        Google: () => <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.347.533 12S5.867 24 12.48 24c3.44 0 6.04-1.133 8.133-3.293 2.133-2.133 2.773-5.12 2.773-7.573 0-.747-.067-1.467-.187-2.213h-10.72z"/></svg>,
        Cloudflare: () => <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19.32 7.13c-.85-2.48-3.21-4.16-5.88-4.16-3.13 0-5.77 2.3-6.19 5.38C3.12 8.79 0 11.96 0 16c0 4.42 3.58 8 8 8h11.5c2.48 0 4.5-2.02 4.5-4.5s-2.02-4.5-4.5-4.5c-.06 0-.12.01-.18.01z"/></svg>,
        Youtube: () => <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
      };

      // === IP 详情弹窗 ===
      const IpDetailModal = ({ ip, isOpen, onClose }) => {
        const [data, setData] = useState(null);
        const [loading, setLoading] = useState(false);

        useEffect(() => {
          if (isOpen && ip && ip.includes('.')) {
            setLoading(true);
            setData(null);
            // 使用 ipapi.is 获取详细风险数据
            fetch(\`https://api.ipapi.is?q=\${ip}\`)
              .then(res => res.json())
              .then(json => setData(json))
              .catch(() => setData({ error: true }))
              .finally(() => setLoading(false));
          }
        }, [isOpen, ip]);

        if (!isOpen) return null;

        const CheckItem = ({ label, isTrue }) => (
          <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
             <span className="text-sm text-gray-500">{label}</span>
             {isTrue ? <Icons.Check /> : <span className="text-gray-400 text-sm">否</span>}
          </div>
        );

        const RiskItem = ({ label, isDetected }) => (
          <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
             <span className="text-sm text-gray-500">{label}</span>
             {isDetected ? 
               <span className="flex items-center gap-1 text-danger font-bold text-sm">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 是
               </span> : 
               <span className="flex items-center gap-1 text-success text-sm">
                 <Icons.Check /> 否
               </span>
             }
          </div>
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border-t-4 border-primary transform transition-all" onClick={e => e.stopPropagation()}>
               {/* 头部 */}
               <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-2">
                     <Icons.Search />
                     <h3 className="text-lg font-bold text-gray-700">IP 详细信息 <span className="text-xs font-normal bg-gray-200 px-2 py-0.5 rounded text-gray-500 ml-2">数据来源: ipapi.is</span></h3>
                  </div>
                  <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><Icons.X /></button>
               </div>

               {/* 内容区 */}
               <div className="p-0 max-h-[80vh] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center space-y-4">
                       <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                       <p className="text-gray-400 text-sm">正在深入分析 IP 归属与风险...</p>
                    </div>
                  ) : data && !data.error ? (
                    <>
                      {/* 基础信息 */}
                      <div className="p-5 space-y-3">
                         <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3"><Icons.Info /> 基础信息</h4>
                         <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-gray-400 block text-xs mb-0.5">IP 地址</span> <span className="font-mono font-bold select-all">{data.ip}</span></div>
                            <div><span className="text-gray-400 block text-xs mb-0.5">区域互联网注册机构</span> <span className="font-bold">{data.rir}</span></div>
                            <div className="col-span-2"><span className="text-gray-400 block text-xs mb-0.5">运营商 / ASN 类型</span> <span>{data.asn?.org}</span> / <span className={data.asn?.type === 'hosting' ? 'text-primary' : 'text-success'}>{data.asn?.type}</span></div>
                            <div className="col-span-2 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                               <span className="text-gray-500">综合滥用评分</span> 
                               <span className="text-xs cursor-help text-blue-400 mr-auto ml-1">?</span>
                               <span className={\`px-2 py-1 rounded text-xs font-bold \${data.is_abuser ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}\`}>
                                  {data.is_abuser ? '高风险 IP' : '极度纯净'}
                               </span>
                            </div>
                         </div>
                      </div>
                      
                      {/* 安全检测 */}
                      <div className="p-5 border-t border-gray-100 bg-gray-50/30">
                         <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3"><Icons.Shield /> 安全检测</h4>
                         <div className="space-y-1">
                            <CheckItem label="移动网络" isTrue={data.is_mobile} />
                            <RiskItem label="数据中心 (Hosting)" isDetected={data.is_datacenter} />
                            <RiskItem label="爬虫 (Crawler)" isDetected={data.is_crawler} />
                            <RiskItem label="代理服务器 (Proxy)" isDetected={data.is_proxy} />
                            <RiskItem label="VPN" isDetected={data.is_vpn} />
                            <RiskItem label="Tor 网络" isDetected={data.is_tor} />
                            <RiskItem label="滥用 IP (Abuser)" isDetected={data.is_abuser} />
                            <RiskItem label="虚假 IP (Bogon)" isDetected={data.is_bogon} />
                         </div>
                      </div>

                      {/* 位置 */}
                      <div className="p-5 border-t border-gray-100">
                         <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3"><Icons.Map /> 位置信息</h4>
                         <p className="text-sm text-gray-600 mb-2">{data.location?.city}, {data.location?.state}, {data.location?.country}</p>
                         <div className="h-32 bg-gray-200 rounded-lg overflow-hidden relative">
                            <iframe 
                               src={\`https://maps.google.com/maps?q=\${data.location?.latitude},\${data.location?.longitude}&z=8&output=embed\`}
                               className="w-full h-full border-0 opacity-80 hover:opacity-100 transition-opacity"
                               loading="lazy"
                            ></iframe>
                         </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-red-400">
                       <p>获取详细信息失败，请稍后再试。</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        );
      };

      // === IP 卡片组件 ===
      const IpCard = ({ title, subTitle, type, fetchUrl, isCloudflare, onClick }) => {
        const [data, setData] = useState(isCloudflare ? window.CF_DATA : null);
        const [loading, setLoading] = useState(!isCloudflare);
        const [error, setError] = useState(false);

        useEffect(() => {
          if (isCloudflare) return;
          
          const load = async () => {
             try {
                // 优化国内 IP 检测逻辑，使用更稳定的接口
                let url = fetchUrl;
                
                // 尝试获取
                const res = await fetch(url);
                if (!res.ok) throw new Error("Load failed");
                const json = await res.json();
                
                // 数据标准化
                let formatted = {};
                
                // 1. 国内 IP 检测 (适配 uomg/ipapi/其他)
                if (title.includes("国内")) {
                    if (json.code === 200 && json.ip) { // uomg 格式
                       formatted = { ip: json.ip, location: json.location, isp: "Domestic ISP", desc: "您访问国内网站所使用的IP" };
                    } else if (json.status === 'success') { // ip-api 格式
                       formatted = { ip: json.query, location: \`\${json.country} \${json.regionName}\`, isp: json.isp, desc: "您访问国内网站所使用的IP" };
                    } else {
                       throw new Error("Format unknown");
                    }
                } 
                // 2. 国外 IP 检测
                else if (title.includes("国外")) {
                    formatted = {
                        ip: json.ip,
                        location: \`\${json.country_name} \${json.region}\`,
                        isp: \`\${json.asn} \${json.org}\`,
                        desc: "您访问没有被封的国外网站所使用的IP"
                    };
                } 
                // 3. 墙外测试 (IP.SB)
                else if (title.includes("墙外")) {
                    formatted = {
                        ip: json.ip,
                        location: \`\${json.country} \${json.region}\`,
                        isp: \`\${json.asn} \${json.organization}\`,
                        desc: "您访问Twitter(x.com)等网站所使用的IP"
                    };
                }
                setData(formatted);
             } catch (e) {
                // 如果是国内测试失败，尝试备用接口 (IP-API 中文)
                if (title.includes("国内") && url !== 'http://ip-api.com/json/?lang=zh-CN') {
                   try {
                      const res2 = await fetch('http://ip-api.com/json/?lang=zh-CN');
                      const json2 = await res2.json();
                      setData({ ip: json2.query, location: \`\${json2.country} \${json2.regionName} \${json2.city}\`, isp: json2.isp, desc: "您访问国内网站所使用的IP (备用线路)" });
                      setLoading(false);
                      return;
                   } catch(err) {}
                }
                setError(true);
             } finally {
                setLoading(false);
             }
          };
          load();
        }, []);

        let statusColor = "bg-gray-300";
        if (loading) statusColor = "bg-yellow-400 animate-pulse";
        else if (error) statusColor = "bg-danger";
        else statusColor = "bg-success";

        // Cloudflare 数据处理
        if (isCloudflare && data) {
           data.desc = "您访问CFCDN网站所使用的落地IP";
        }

        return (
          <div 
            className="glass-effect rounded-xl p-6 shadow-card hover:shadow-card-hover border border-white/50 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
            onClick={() => !loading && !error && data && onClick(data.ip)}
          >
             {/* 装饰背景 */}
             <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-gray-100 to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>

             <div className="flex items-center gap-2 mb-5 relative z-10">
                <div className={\`w-2.5 h-2.5 rounded-full \${statusColor} ring-4 ring-white/50\`}></div>
                <h3 className={\`font-bold text-base tracking-wide \${title.includes('墙外') ? 'text-red-700' : (title.includes('Cloud') ? 'text-orange-600' : (title.includes('国外') ? 'text-orange-500' : 'text-orange-400'))}\`}>
                  {title} <span className="text-gray-400 font-normal text-xs ml-1 bg-gray-100 px-1.5 py-0.5 rounded">{subTitle}</span>
                </h3>
             </div>

             <div className="flex-grow flex flex-col justify-center min-h-[100px] relative z-10">
                {loading ? (
                   <div className="space-y-3">
                      <div className="h-7 bg-gray-200/70 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-200/70 rounded animate-pulse w-1/2"></div>
                   </div>
                ) : error ? (
                   <div className="text-danger/80 font-bold italic text-lg flex items-center gap-2">
                     <Icons.X /> 加载失败
                   </div>
                ) : (
                   <>
                      <div className="text-2xl font-bold text-gray-800 font-mono mb-2 tracking-tight group-hover:text-primary transition-colors">{data.ip}</div>
                      <div className="text-sm text-gray-600 mb-1 font-medium">{data.location}</div>
                      {data.isp && <div className="text-xs text-gray-400 break-words leading-relaxed">{data.isp}</div>}
                   </>
                )}
             </div>

             <div className="mt-5 pt-4 border-t border-gray-100/80 text-xs text-gray-400 flex justify-between items-center relative z-10">
                <span>{error ? "可能被拦截" : (data?.desc || "检测中...")}</span>
                {!loading && !error && <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-bold">查看详情 &rarr;</span>}
             </div>
          </div>
        );
      };

      // === 测速卡片组件 ===
      const PingCard = ({ name, url, icon: Icon, tag }) => {
        const [history, setHistory] = useState([]); 
        const [displayTime, setDisplayTime] = useState(0);

        useEffect(() => {
          const ping = async () => {
             const start = performance.now();
             try {
                await fetch(url + "?" + Math.random(), { mode: 'no-cors', cache: 'no-store' });
                const time = Math.round(performance.now() - start);
                setDisplayTime(time);
                setHistory(prev => [...prev.slice(-19), time]); // 保留20个数据点
             } catch (e) {
                setDisplayTime(9999);
                setHistory(prev => [...prev.slice(-19), 9999]);
             }
          };
          ping();
          const interval = setInterval(ping, 3000);
          return () => clearInterval(interval);
        }, [url]);

        const getBarColor = (ms) => {
           if (ms === 9999) return "bg-red-200";
           if (ms < 100) return "bg-success";
           if (ms < 200) return "bg-yellow-400";
           return "bg-primary";
        };

        const isTimeout = displayTime === 9999;
        const timeColor = isTimeout ? "text-danger" : (displayTime < 100 ? "text-success" : "text-yellow-600");

        return (
           <div className="bg-white rounded-xl p-4 shadow-card hover:shadow-card-hover border border-white/50 flex flex-col justify-between h-32 transition-all duration-300">
              <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center gap-3 font-bold text-gray-700">
                    <div className="p-1.5 bg-gray-50 rounded-lg"><Icon /></div>
                    <span>{name}</span>
                 </div>
                 <span className={\`text-[10px] font-bold px-2 py-1 rounded-full \${tag === '国内' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}\`}>
                    {tag}
                 </span>
              </div>
              
              <div className="flex items-baseline justify-between mb-3">
                 <div className="text-xs text-gray-400 font-mono">Real-time Latency</div>
                 <span className={\`text-2xl font-bold font-mono \${timeColor}\`}>
                    {isTimeout ? "Timeout" : displayTime + "ms"}
                 </span>
              </div>

              <div className="flex gap-0.5 h-1.5 items-end">
                 {[...Array(20)].map((_, i) => {
                    const val = history[i];
                    return (
                       <div 
                          key={i} 
                          className={\`flex-1 rounded-sm transition-all duration-500 \${val !== undefined ? getBarColor(val) : 'bg-gray-100'}\`}
                          style={{height: val ? (val === 9999 ? '100%' : Math.min(100, val/2) + '%') : '0%'}}
                       ></div>
                    );
                 })}
              </div>
           </div>
        );
      };

      const App = () => {
        const [modalIp, setModalIp] = useState(null);

        return (
          <>
             <header className="mb-8 flex items-center gap-3 px-2">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Icons.Globe />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">网络连接看板</h1>
                    <p className="text-xs text-gray-400">实时监控 IP 归属与连通性</p>
                </div>
             </header>

             {/* 第一行：IP 卡片 */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <IpCard 
                   title="国内测试" subTitle="(api.uomg)" 
                   // 使用 api.uomg.com，通常比 speedtest.cn 更稳定，无跨域问题
                   fetchUrl="https://api.uomg.com/api/visitor.info?s=json"
                   onClick={setModalIp}
                />
                <IpCard 
                   title="国外测试" subTitle="(ipapi.co)" 
                   fetchUrl="https://ipapi.co/json/"
                   onClick={setModalIp}
                />
                <IpCard 
                   title="Cloudflare" subTitle="(ProxyIP)" 
                   isCloudflare={true}
                   onClick={setModalIp}
                />
                <IpCard 
                   title="墙外测试" subTitle="(推特)" 
                   fetchUrl="https://api.ip.sb/geoip"
                   onClick={setModalIp}
                />
             </div>

             {/* 第二行：测速卡片 */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <PingCard name="字节跳动" url="https://www.douyin.com" icon={Icons.ByteDance} tag="国内" />
                <PingCard name="Bilibili" url="https://www.bilibili.com" icon={Icons.Bilibili} tag="国内" />
                <PingCard name="微信" url="https://mp.weixin.qq.com" icon={Icons.WeChat} tag="国内" />
                <PingCard name="淘宝" url="https://www.taobao.com" icon={Icons.Taobao} tag="国内" />
                
                <PingCard name="GitHub" url="https://github.com" icon={Icons.Github} tag="国际" />
                <PingCard name="jsDelivr" url="https://cdn.jsdelivr.net" icon={Icons.Globe} tag="国际" />
                <PingCard name="Cloudflare" url="https://www.cloudflare.com" icon={Icons.Cloudflare} tag="国际" />
                <PingCard name="YouTube" url="https://www.youtube.com" icon={Icons.Youtube} tag="国际" />
             </div>

             <footer className="mt-12 text-center text-xs text-gray-400 pb-4">
                <p>&copy; 2024 IP Sentinel | Data by Cloudflare & ipapi.is</p>
             </footer>

             {/* 详情弹窗 */}
             <IpDetailModal 
                isOpen={!!modalIp} 
                ip={modalIp} 
                onClose={() => setModalIp(null)} 
             />
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
