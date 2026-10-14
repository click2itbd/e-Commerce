import{query as g,collection as i,where as m,getDocs as b,addDoc as p}from"./firebase-core-uNIkC0EZ.js";import{J as x,a as c,d as l}from"./index-CNmXH2s4.js";async function f(a,r={}){const o=x();let d=a.startsWith("/")?a:`/${a}`;o.endsWith("/api")&&d.startsWith("/api/")&&(d=d.slice(4));const n=`${o}${d}`,e={"Content-Type":"application/json",...r.headers||{}};if(!e.Authorization&&typeof window<"u"&&c.currentUser)try{const s=await c.currentUser.getIdToken();s&&(e.Authorization=`Bearer ${s}`)}catch{}const t=await fetch(n,{...r,headers:e});if(!t.ok){const s=await t.json().catch(()=>({error:"Network error"}));throw new Error(s.error||`HTTP ${t.status}`)}return t.json()}const h=async(a,r,o)=>{const d=o.isVps||!!(o.hostname&&o.os),n=d?`🚀 Your Cloud VPS is Live & Ready! - ${o.hostname||o.serverIp||"Server"}`:`Your Service is Active! - ${o.domain||"Hosting"}`;let e="";if(d){const t=o.sshCommand||`ssh root@${o.serverIp||"YOUR_IP"}`;e=`
Hello,

Great news! Your Cloud VPS server has been deployed and is now live!

Server Details:
- Hostname: ${o.hostname||"N/A"}
- Primary IP: ${o.serverIp||"N/A"}
- Operating System: ${o.os||"Linux"}
- Datacenter: ${o.serverLocation||"Dhaka / Global"}
- Root Username: root
${o.rootPassword?`- Root Password: ${o.rootPassword}`:""}
- Quick SSH Connect: ${t}

You can also view your server details and management options directly from your Client Dashboard.

Thank you for choosing Click2IT!
    `.trim(),`${o.hostname||"N/A"}${o.serverIp||"N/A"}${o.os||"Linux"}${o.serverLocation||"Dhaka / Global"}`,o.rootPassword&&`${o.rootPassword}`,`${t}`}else e=`
Hello,

Great news! Your service for ${o.domain||"your recent order"} has been activated.

Here are your service details:
- Server IP: ${o.serverIp||"N/A"}
- Control Panel: ${o.controlPanelUrl||"N/A"}

Thank you for choosing us!
    `.trim(),e.replace(/\n/g,"<br>");try{const t=await f("/api/send-email",{method:"POST",body:JSON.stringify({to:r,subject:n,html:e.replace(/\n/g,"<br>")})});return await p(i(l,"emailLogs"),{orderId:a,customerEmail:r,subject:n,content:e,sentAt:new Date().toISOString(),status:t.success?"sent":"failed"}),t.success}catch(t){return console.error("Failed to send email:",t),await p(i(l,"emailLogs"),{orderId:a,customerEmail:r,subject:n,content:e,sentAt:new Date().toISOString(),status:"failed"}),!1}},w=async a=>{try{const r=g(i(l,"emailLogs"),m("orderId","==",a));return(await b(r)).docs.map(n=>({id:n.id,...n.data()})).sort((n,e)=>new Date(e.sentAt).getTime()-new Date(n.sentAt).getTime())}catch(r){return console.error("Failed to fetch email logs:",r),[]}},S=async({to:a,subject:r,html:o,attachments:d,category:n,orderId:e})=>{try{const t=await f("/api/send-email",{method:"POST",body:JSON.stringify({to:a,subject:r,html:o,attachments:d,category:n,orderId:e})});return(t==null?void 0:t.success)??!0}catch(t){return console.error("Failed to send email:",t),!1}};export{h as a,w as g,S as s};
