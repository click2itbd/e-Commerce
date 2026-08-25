import{q as l,c as n,w as d,a as u,b as i}from"./firebase-core-DDBe8Z0u.js";import{d as c}from"./index-BqNPEL5d.js";const g="https://click2itbd.com";async function h(s,e={}){const o=`${g}${s}`,r=await fetch(o,{...e,headers:{"Content-Type":"application/json",...e.headers||{}}});if(!r.ok){const t=await r.json().catch(()=>({error:"Network error"}));throw new Error(t.error||`HTTP ${r.status}`)}return r.json()}const p=async(s,e,o)=>{const r=`Your Service is Active! - ${o.domain||"Hosting"}`,t=`
Hello,

Great news! Your service for ${o.domain||"your recent order"} has been activated.

Here are your service details:
- Server IP: ${o.serverIp||"N/A"}
- Control Panel: ${o.controlPanelUrl||"N/A"}

Thank you for choosing us!
  `.trim();try{const a=await h("/api/send-email",{method:"POST",body:JSON.stringify({to:e,subject:r,html:t.replace(/\n/g,"<br>")})});return await i(n(c,"emailLogs"),{orderId:s,customerEmail:e,subject:r,content:t,sentAt:new Date().toISOString(),status:a.success?"sent":"failed"}),a.success}catch(a){return console.error("Failed to send email:",a),await i(n(c,"emailLogs"),{orderId:s,customerEmail:e,subject:r,content:t,sentAt:new Date().toISOString(),status:"failed"}),!1}},f=async s=>{try{const e=l(n(c,"emailLogs"),d("orderId","==",s));return(await u(e)).docs.map(t=>({id:t.id,...t.data()})).sort((t,a)=>new Date(a.sentAt).getTime()-new Date(t.sentAt).getTime())}catch(e){return console.error("Failed to fetch email logs:",e),[]}};export{f as g,p as s};
