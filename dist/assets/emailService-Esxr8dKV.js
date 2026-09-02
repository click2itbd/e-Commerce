import{query as m,collection as c,where as g,getDocs as f,addDoc as d}from"./firebase-core-CqvQgLvb.js";import{d as l,e as u}from"./index-BQpEfiDi.js";const w="https://click2itbd.com";async function h(s,t={}){const n=w.replace(/\/+$/,"");let o=s.startsWith("/")?s:`/${s}`;n.endsWith("/api")&&o.startsWith("/api/")&&(o=o.slice(4));const r=`${n}${o}`,e={"Content-Type":"application/json",...t.headers||{}};if(!e.Authorization&&typeof window<"u"&&u.currentUser)try{const i=await u.currentUser.getIdToken();i&&(e.Authorization=`Bearer ${i}`)}catch{}const a=await fetch(r,{...t,headers:e});if(!a.ok){const i=await a.json().catch(()=>({error:"Network error"}));throw new Error(i.error||`HTTP ${a.status}`)}return a.json()}const A=async(s,t,n)=>{const o=`Your Service is Active! - ${n.domain||"Hosting"}`,r=`
Hello,

Great news! Your service for ${n.domain||"your recent order"} has been activated.

Here are your service details:
- Server IP: ${n.serverIp||"N/A"}
- Control Panel: ${n.controlPanelUrl||"N/A"}

Thank you for choosing us!
  `.trim();try{const e=await h("/api/send-email",{method:"POST",body:JSON.stringify({to:t,subject:o,html:r.replace(/\n/g,"<br>")})});return await d(c(l,"emailLogs"),{orderId:s,customerEmail:t,subject:o,content:r,sentAt:new Date().toISOString(),status:e.success?"sent":"failed"}),e.success}catch(e){return console.error("Failed to send email:",e),await d(c(l,"emailLogs"),{orderId:s,customerEmail:t,subject:o,content:r,sentAt:new Date().toISOString(),status:"failed"}),!1}},S=async s=>{try{const t=m(c(l,"emailLogs"),g("orderId","==",s));return(await f(t)).docs.map(r=>({id:r.id,...r.data()})).sort((r,e)=>new Date(e.sentAt).getTime()-new Date(r.sentAt).getTime())}catch(t){return console.error("Failed to fetch email logs:",t),[]}},$=async({to:s,subject:t,html:n,category:o,orderId:r})=>{try{const e=await h("/api/send-email",{method:"POST",body:JSON.stringify({to:s,subject:t,html:n,category:o,orderId:r})});return(e==null?void 0:e.success)??!0}catch(e){return console.error("Failed to send email:",e),!1}};export{A as a,S as g,$ as s};
