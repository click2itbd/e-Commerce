import{q as h,c,w as g,a as w,b as d}from"./firebase-core-DDBe8Z0u.js";import{d as l,e as u}from"./index-5WNEcMXb.js";const f="https://click2itbd.com";async function m(s,e={}){const a=f.replace(/\/+$/,"");let o=s.startsWith("/")?s:`/${s}`;a.endsWith("/api")&&o.startsWith("/api/")&&(o=o.slice(4));const t=`${a}${o}`,r={"Content-Type":"application/json",...e.headers||{}};if(!r.Authorization&&typeof window<"u"&&u.currentUser)try{const i=await u.currentUser.getIdToken();i&&(r.Authorization=`Bearer ${i}`)}catch{}const n=await fetch(t,{...e,headers:r});if(!n.ok){const i=await n.json().catch(()=>({error:"Network error"}));throw new Error(i.error||`HTTP ${n.status}`)}return n.json()}const A=async(s,e,a)=>{const o=`Your Service is Active! - ${a.domain||"Hosting"}`,t=`
Hello,

Great news! Your service for ${a.domain||"your recent order"} has been activated.

Here are your service details:
- Server IP: ${a.serverIp||"N/A"}
- Control Panel: ${a.controlPanelUrl||"N/A"}

Thank you for choosing us!
  `.trim();try{const r=await m("/api/send-email",{method:"POST",body:JSON.stringify({to:e,subject:o,html:t.replace(/\n/g,"<br>")})});return await d(c(l,"emailLogs"),{orderId:s,customerEmail:e,subject:o,content:t,sentAt:new Date().toISOString(),status:r.success?"sent":"failed"}),r.success}catch(r){return console.error("Failed to send email:",r),await d(c(l,"emailLogs"),{orderId:s,customerEmail:e,subject:o,content:t,sentAt:new Date().toISOString(),status:"failed"}),!1}},S=async s=>{try{const e=h(c(l,"emailLogs"),g("orderId","==",s));return(await w(e)).docs.map(t=>({id:t.id,...t.data()})).sort((t,r)=>new Date(r.sentAt).getTime()-new Date(t.sentAt).getTime())}catch(e){return console.error("Failed to fetch email logs:",e),[]}};export{S as g,A as s};
