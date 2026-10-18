import{query as c,collection as n,where as f,getDocs as g,addDoc as l}from"./firebase-core-uNIkC0EZ.js";import{k as p,d as i}from"./index-HptKSmIJ.js";const b=async(a,d,o)=>{const s=o.isVps||!!(o.hostname&&o.os),e=s?`🚀 Your Cloud VPS is Live & Ready! - ${o.hostname||o.serverIp||"Server"}`:`Your Service is Active! - ${o.domain||"Hosting"}`;let r="";if(s){const t=o.sshCommand||`ssh root@${o.serverIp||"YOUR_IP"}`;r=`
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
    `.trim(),`${o.hostname||"N/A"}${o.serverIp||"N/A"}${o.os||"Linux"}${o.serverLocation||"Dhaka / Global"}`,o.rootPassword&&`${o.rootPassword}`,`${t}`}else r=`
Hello,

Great news! Your service for ${o.domain||"your recent order"} has been activated.

Here are your service details:
- Server IP: ${o.serverIp||"N/A"}
- Control Panel: ${o.controlPanelUrl||"N/A"}

Thank you for choosing us!
    `.trim(),r.replace(/\n/g,"<br>");try{const t=await p("/api/send-email",{to:d,subject:e,html:r.replace(/\n/g,"<br>")});return await l(n(i,"emailLogs"),{orderId:a,customerEmail:d,subject:e,content:r,sentAt:new Date().toISOString(),status:t.success?"sent":"failed"}),t.success}catch(t){return console.error("Failed to send email:",t),await l(n(i,"emailLogs"),{orderId:a,customerEmail:d,subject:e,content:r,sentAt:new Date().toISOString(),status:"failed"}),!1}},u=async a=>{try{const d=c(n(i,"emailLogs"),f("orderId","==",a));return(await g(d)).docs.map(e=>({id:e.id,...e.data()})).sort((e,r)=>new Date(r.sentAt).getTime()-new Date(e.sentAt).getTime())}catch(d){return console.error("Failed to fetch email logs:",d),[]}},y=async({to:a,subject:d,html:o,attachments:s,category:e,orderId:r})=>{try{const t=await p("/api/send-email",{to:a,subject:d,html:o,attachments:s,category:e,orderId:r});return{success:(t==null?void 0:t.success)??!0,message:t==null?void 0:t.message}}catch(t){return console.error("Failed to send email:",t),{success:!1,error:(t==null?void 0:t.message)||"Email delivery failed. Please verify SMTP settings."}}};export{b as a,u as g,y as s};
