import{query as m,collection as c,where as g,getDocs as f,addDoc as d}from"./firebase-core-Cm5yDKb8.js";import{d as l,e as u}from"./index-BF8Wsq1e.js";const w="https://click2itbd.com";async function h(s,e={}){const n=w.replace(/\/+$/,"");let o=s.startsWith("/")?s:`/${s}`;n.endsWith("/api")&&o.startsWith("/api/")&&(o=o.slice(4));const t=`${n}${o}`,r={"Content-Type":"application/json",...e.headers||{}};if(!r.Authorization&&typeof window<"u"&&u.currentUser)try{const i=await u.currentUser.getIdToken();i&&(r.Authorization=`Bearer ${i}`)}catch{}const a=await fetch(t,{...e,headers:r});if(!a.ok){const i=await a.json().catch(()=>({error:"Network error"}));throw new Error(i.error||`HTTP ${a.status}`)}return a.json()}const A=async(s,e,n)=>{const o=`Your Service is Active! - ${n.domain||"Hosting"}`,t=`
Hello,

Great news! Your service for ${n.domain||"your recent order"} has been activated.

Here are your service details:
- Server IP: ${n.serverIp||"N/A"}
- Control Panel: ${n.controlPanelUrl||"N/A"}

Thank you for choosing us!
  `.trim();try{const r=await h("/api/send-email",{method:"POST",body:JSON.stringify({to:e,subject:o,html:t.replace(/\n/g,"<br>")})});return await d(c(l,"emailLogs"),{orderId:s,customerEmail:e,subject:o,content:t,sentAt:new Date().toISOString(),status:r.success?"sent":"failed"}),r.success}catch(r){return console.error("Failed to send email:",r),await d(c(l,"emailLogs"),{orderId:s,customerEmail:e,subject:o,content:t,sentAt:new Date().toISOString(),status:"failed"}),!1}},S=async s=>{try{const e=m(c(l,"emailLogs"),g("orderId","==",s));return(await f(e)).docs.map(t=>({id:t.id,...t.data()})).sort((t,r)=>new Date(r.sentAt).getTime()-new Date(t.sentAt).getTime())}catch(e){return console.error("Failed to fetch email logs:",e),[]}},$=async({to:s,subject:e,html:n,attachments:o,category:t,orderId:r})=>{try{const a=await h("/api/send-email",{method:"POST",body:JSON.stringify({to:s,subject:e,html:n,attachments:o,category:t,orderId:r})});return(a==null?void 0:a.success)??!0}catch(a){return console.error("Failed to send email:",a),!1}};export{A as a,S as g,$ as s};
