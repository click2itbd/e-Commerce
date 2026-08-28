import{q as m,c,w as g,a as w,b as d}from"./firebase-core-DDBe8Z0u.js";import{d as l,e as u}from"./index-B9h64Mph.js";const f="https://click2itbd.com";async function h(o,t={}){const a=f.replace(/\/+$/,"");let s=o.startsWith("/")?o:`/${o}`;a.endsWith("/api")&&s.startsWith("/api/")&&(s=s.slice(4));const r=`${a}${s}`,e={"Content-Type":"application/json",...t.headers||{}};if(!e.Authorization&&typeof window<"u"&&u.currentUser)try{const i=await u.currentUser.getIdToken();i&&(e.Authorization=`Bearer ${i}`)}catch{}const n=await fetch(r,{...t,headers:e});if(!n.ok){const i=await n.json().catch(()=>({error:"Network error"}));throw new Error(i.error||`HTTP ${n.status}`)}return n.json()}const A=async(o,t,a)=>{const s=`Your Service is Active! - ${a.domain||"Hosting"}`,r=`
Hello,

Great news! Your service for ${a.domain||"your recent order"} has been activated.

Here are your service details:
- Server IP: ${a.serverIp||"N/A"}
- Control Panel: ${a.controlPanelUrl||"N/A"}

Thank you for choosing us!
  `.trim();try{const e=await h("/api/send-email",{method:"POST",body:JSON.stringify({to:t,subject:s,html:r.replace(/\n/g,"<br>")})});return await d(c(l,"emailLogs"),{orderId:o,customerEmail:t,subject:s,content:r,sentAt:new Date().toISOString(),status:e.success?"sent":"failed"}),e.success}catch(e){return console.error("Failed to send email:",e),await d(c(l,"emailLogs"),{orderId:o,customerEmail:t,subject:s,content:r,sentAt:new Date().toISOString(),status:"failed"}),!1}},S=async o=>{try{const t=m(c(l,"emailLogs"),g("orderId","==",o));return(await w(t)).docs.map(r=>({id:r.id,...r.data()})).sort((r,e)=>new Date(e.sentAt).getTime()-new Date(r.sentAt).getTime())}catch(t){return console.error("Failed to fetch email logs:",t),[]}},$=async({to:o,subject:t,html:a,category:s,orderId:r})=>{try{const e=await h("/api/send-email",{method:"POST",body:JSON.stringify({to:o,subject:t,html:a,category:s,orderId:r})});return(e==null?void 0:e.success)??!0}catch(e){return console.error("Failed to send email:",e),!1}};export{A as a,S as g,$ as s};
