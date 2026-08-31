import{L as rf,_ as sf,g as Ft,F as of,a as Yt,b as af,d as uf,i as rl,p as cf,c as sl,e as Ms,f as lf,h as hf,j as il,k as df,C as ff,r as ro,S as mf}from"./firebase-auth-D4PkIozu.js";var ku=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var _e,ol;(function(){var r;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function t(I,p){function y(){}y.prototype=p.prototype,I.F=p.prototype,I.prototype=new y,I.prototype.constructor=I,I.D=function(w,E,R){for(var _=Array(arguments.length-2),bt=2;bt<arguments.length;bt++)_[bt-2]=arguments[bt];return p.prototype[E].apply(w,_)}}function e(){this.blockSize=-1}function n(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}t(n,e),n.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function s(I,p,y){y||(y=0);const w=Array(16);if(typeof p=="string")for(var E=0;E<16;++E)w[E]=p.charCodeAt(y++)|p.charCodeAt(y++)<<8|p.charCodeAt(y++)<<16|p.charCodeAt(y++)<<24;else for(E=0;E<16;++E)w[E]=p[y++]|p[y++]<<8|p[y++]<<16|p[y++]<<24;p=I.g[0],y=I.g[1],E=I.g[2];let R=I.g[3],_;_=p+(R^y&(E^R))+w[0]+3614090360&4294967295,p=y+(_<<7&4294967295|_>>>25),_=R+(E^p&(y^E))+w[1]+3905402710&4294967295,R=p+(_<<12&4294967295|_>>>20),_=E+(y^R&(p^y))+w[2]+606105819&4294967295,E=R+(_<<17&4294967295|_>>>15),_=y+(p^E&(R^p))+w[3]+3250441966&4294967295,y=E+(_<<22&4294967295|_>>>10),_=p+(R^y&(E^R))+w[4]+4118548399&4294967295,p=y+(_<<7&4294967295|_>>>25),_=R+(E^p&(y^E))+w[5]+1200080426&4294967295,R=p+(_<<12&4294967295|_>>>20),_=E+(y^R&(p^y))+w[6]+2821735955&4294967295,E=R+(_<<17&4294967295|_>>>15),_=y+(p^E&(R^p))+w[7]+4249261313&4294967295,y=E+(_<<22&4294967295|_>>>10),_=p+(R^y&(E^R))+w[8]+1770035416&4294967295,p=y+(_<<7&4294967295|_>>>25),_=R+(E^p&(y^E))+w[9]+2336552879&4294967295,R=p+(_<<12&4294967295|_>>>20),_=E+(y^R&(p^y))+w[10]+4294925233&4294967295,E=R+(_<<17&4294967295|_>>>15),_=y+(p^E&(R^p))+w[11]+2304563134&4294967295,y=E+(_<<22&4294967295|_>>>10),_=p+(R^y&(E^R))+w[12]+1804603682&4294967295,p=y+(_<<7&4294967295|_>>>25),_=R+(E^p&(y^E))+w[13]+4254626195&4294967295,R=p+(_<<12&4294967295|_>>>20),_=E+(y^R&(p^y))+w[14]+2792965006&4294967295,E=R+(_<<17&4294967295|_>>>15),_=y+(p^E&(R^p))+w[15]+1236535329&4294967295,y=E+(_<<22&4294967295|_>>>10),_=p+(E^R&(y^E))+w[1]+4129170786&4294967295,p=y+(_<<5&4294967295|_>>>27),_=R+(y^E&(p^y))+w[6]+3225465664&4294967295,R=p+(_<<9&4294967295|_>>>23),_=E+(p^y&(R^p))+w[11]+643717713&4294967295,E=R+(_<<14&4294967295|_>>>18),_=y+(R^p&(E^R))+w[0]+3921069994&4294967295,y=E+(_<<20&4294967295|_>>>12),_=p+(E^R&(y^E))+w[5]+3593408605&4294967295,p=y+(_<<5&4294967295|_>>>27),_=R+(y^E&(p^y))+w[10]+38016083&4294967295,R=p+(_<<9&4294967295|_>>>23),_=E+(p^y&(R^p))+w[15]+3634488961&4294967295,E=R+(_<<14&4294967295|_>>>18),_=y+(R^p&(E^R))+w[4]+3889429448&4294967295,y=E+(_<<20&4294967295|_>>>12),_=p+(E^R&(y^E))+w[9]+568446438&4294967295,p=y+(_<<5&4294967295|_>>>27),_=R+(y^E&(p^y))+w[14]+3275163606&4294967295,R=p+(_<<9&4294967295|_>>>23),_=E+(p^y&(R^p))+w[3]+4107603335&4294967295,E=R+(_<<14&4294967295|_>>>18),_=y+(R^p&(E^R))+w[8]+1163531501&4294967295,y=E+(_<<20&4294967295|_>>>12),_=p+(E^R&(y^E))+w[13]+2850285829&4294967295,p=y+(_<<5&4294967295|_>>>27),_=R+(y^E&(p^y))+w[2]+4243563512&4294967295,R=p+(_<<9&4294967295|_>>>23),_=E+(p^y&(R^p))+w[7]+1735328473&4294967295,E=R+(_<<14&4294967295|_>>>18),_=y+(R^p&(E^R))+w[12]+2368359562&4294967295,y=E+(_<<20&4294967295|_>>>12),_=p+(y^E^R)+w[5]+4294588738&4294967295,p=y+(_<<4&4294967295|_>>>28),_=R+(p^y^E)+w[8]+2272392833&4294967295,R=p+(_<<11&4294967295|_>>>21),_=E+(R^p^y)+w[11]+1839030562&4294967295,E=R+(_<<16&4294967295|_>>>16),_=y+(E^R^p)+w[14]+4259657740&4294967295,y=E+(_<<23&4294967295|_>>>9),_=p+(y^E^R)+w[1]+2763975236&4294967295,p=y+(_<<4&4294967295|_>>>28),_=R+(p^y^E)+w[4]+1272893353&4294967295,R=p+(_<<11&4294967295|_>>>21),_=E+(R^p^y)+w[7]+4139469664&4294967295,E=R+(_<<16&4294967295|_>>>16),_=y+(E^R^p)+w[10]+3200236656&4294967295,y=E+(_<<23&4294967295|_>>>9),_=p+(y^E^R)+w[13]+681279174&4294967295,p=y+(_<<4&4294967295|_>>>28),_=R+(p^y^E)+w[0]+3936430074&4294967295,R=p+(_<<11&4294967295|_>>>21),_=E+(R^p^y)+w[3]+3572445317&4294967295,E=R+(_<<16&4294967295|_>>>16),_=y+(E^R^p)+w[6]+76029189&4294967295,y=E+(_<<23&4294967295|_>>>9),_=p+(y^E^R)+w[9]+3654602809&4294967295,p=y+(_<<4&4294967295|_>>>28),_=R+(p^y^E)+w[12]+3873151461&4294967295,R=p+(_<<11&4294967295|_>>>21),_=E+(R^p^y)+w[15]+530742520&4294967295,E=R+(_<<16&4294967295|_>>>16),_=y+(E^R^p)+w[2]+3299628645&4294967295,y=E+(_<<23&4294967295|_>>>9),_=p+(E^(y|~R))+w[0]+4096336452&4294967295,p=y+(_<<6&4294967295|_>>>26),_=R+(y^(p|~E))+w[7]+1126891415&4294967295,R=p+(_<<10&4294967295|_>>>22),_=E+(p^(R|~y))+w[14]+2878612391&4294967295,E=R+(_<<15&4294967295|_>>>17),_=y+(R^(E|~p))+w[5]+4237533241&4294967295,y=E+(_<<21&4294967295|_>>>11),_=p+(E^(y|~R))+w[12]+1700485571&4294967295,p=y+(_<<6&4294967295|_>>>26),_=R+(y^(p|~E))+w[3]+2399980690&4294967295,R=p+(_<<10&4294967295|_>>>22),_=E+(p^(R|~y))+w[10]+4293915773&4294967295,E=R+(_<<15&4294967295|_>>>17),_=y+(R^(E|~p))+w[1]+2240044497&4294967295,y=E+(_<<21&4294967295|_>>>11),_=p+(E^(y|~R))+w[8]+1873313359&4294967295,p=y+(_<<6&4294967295|_>>>26),_=R+(y^(p|~E))+w[15]+4264355552&4294967295,R=p+(_<<10&4294967295|_>>>22),_=E+(p^(R|~y))+w[6]+2734768916&4294967295,E=R+(_<<15&4294967295|_>>>17),_=y+(R^(E|~p))+w[13]+1309151649&4294967295,y=E+(_<<21&4294967295|_>>>11),_=p+(E^(y|~R))+w[4]+4149444226&4294967295,p=y+(_<<6&4294967295|_>>>26),_=R+(y^(p|~E))+w[11]+3174756917&4294967295,R=p+(_<<10&4294967295|_>>>22),_=E+(p^(R|~y))+w[2]+718787259&4294967295,E=R+(_<<15&4294967295|_>>>17),_=y+(R^(E|~p))+w[9]+3951481745&4294967295,I.g[0]=I.g[0]+p&4294967295,I.g[1]=I.g[1]+(E+(_<<21&4294967295|_>>>11))&4294967295,I.g[2]=I.g[2]+E&4294967295,I.g[3]=I.g[3]+R&4294967295}n.prototype.v=function(I,p){p===void 0&&(p=I.length);const y=p-this.blockSize,w=this.C;let E=this.h,R=0;for(;R<p;){if(E==0)for(;R<=y;)s(this,I,R),R+=this.blockSize;if(typeof I=="string"){for(;R<p;)if(w[E++]=I.charCodeAt(R++),E==this.blockSize){s(this,w),E=0;break}}else for(;R<p;)if(w[E++]=I[R++],E==this.blockSize){s(this,w),E=0;break}}this.h=E,this.o+=p},n.prototype.A=function(){var I=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);I[0]=128;for(var p=1;p<I.length-8;++p)I[p]=0;p=this.o*8;for(var y=I.length-8;y<I.length;++y)I[y]=p&255,p/=256;for(this.v(I),I=Array(16),p=0,y=0;y<4;++y)for(let w=0;w<32;w+=8)I[p++]=this.g[y]>>>w&255;return I};function i(I,p){var y=u;return Object.prototype.hasOwnProperty.call(y,I)?y[I]:y[I]=p(I)}function a(I,p){this.h=p;const y=[];let w=!0;for(let E=I.length-1;E>=0;E--){const R=I[E]|0;w&&R==p||(y[E]=R,w=!1)}this.g=y}var u={};function l(I){return-128<=I&&I<128?i(I,function(p){return new a([p|0],p<0?-1:0)}):new a([I|0],I<0?-1:0)}function d(I){if(isNaN(I)||!isFinite(I))return g;if(I<0)return M(d(-I));const p=[];let y=1;for(let w=0;I>=y;w++)p[w]=I/y|0,y*=4294967296;return new a(p,0)}function f(I,p){if(I.length==0)throw Error("number format error: empty string");if(p=p||10,p<2||36<p)throw Error("radix out of range: "+p);if(I.charAt(0)=="-")return M(f(I.substring(1),p));if(I.indexOf("-")>=0)throw Error('number format error: interior "-" character');const y=d(Math.pow(p,8));let w=g;for(let R=0;R<I.length;R+=8){var E=Math.min(8,I.length-R);const _=parseInt(I.substring(R,R+E),p);E<8?(E=d(Math.pow(p,E)),w=w.j(E).add(d(_))):(w=w.j(y),w=w.add(d(_)))}return w}var g=l(0),T=l(1),P=l(16777216);r=a.prototype,r.m=function(){if(k(this))return-M(this).m();let I=0,p=1;for(let y=0;y<this.g.length;y++){const w=this.i(y);I+=(w>=0?w:4294967296+w)*p,p*=4294967296}return I},r.toString=function(I){if(I=I||10,I<2||36<I)throw Error("radix out of range: "+I);if(x(this))return"0";if(k(this))return"-"+M(this).toString(I);const p=d(Math.pow(I,6));var y=this;let w="";for(;;){const E=nt(y,p).g;y=$(y,E.j(p));let R=((y.g.length>0?y.g[0]:y.h)>>>0).toString(I);if(y=E,x(y))return R+w;for(;R.length<6;)R="0"+R;w=R+w}},r.i=function(I){return I<0?0:I<this.g.length?this.g[I]:this.h};function x(I){if(I.h!=0)return!1;for(let p=0;p<I.g.length;p++)if(I.g[p]!=0)return!1;return!0}function k(I){return I.h==-1}r.l=function(I){return I=$(this,I),k(I)?-1:x(I)?0:1};function M(I){const p=I.g.length,y=[];for(let w=0;w<p;w++)y[w]=~I.g[w];return new a(y,~I.h).add(T)}r.abs=function(){return k(this)?M(this):this},r.add=function(I){const p=Math.max(this.g.length,I.g.length),y=[];let w=0;for(let E=0;E<=p;E++){let R=w+(this.i(E)&65535)+(I.i(E)&65535),_=(R>>>16)+(this.i(E)>>>16)+(I.i(E)>>>16);w=_>>>16,R&=65535,_&=65535,y[E]=_<<16|R}return new a(y,y[y.length-1]&-2147483648?-1:0)};function $(I,p){return I.add(M(p))}r.j=function(I){if(x(this)||x(I))return g;if(k(this))return k(I)?M(this).j(M(I)):M(M(this).j(I));if(k(I))return M(this.j(M(I)));if(this.l(P)<0&&I.l(P)<0)return d(this.m()*I.m());const p=this.g.length+I.g.length,y=[];for(var w=0;w<2*p;w++)y[w]=0;for(w=0;w<this.g.length;w++)for(let E=0;E<I.g.length;E++){const R=this.i(w)>>>16,_=this.i(w)&65535,bt=I.i(E)>>>16,be=I.i(E)&65535;y[2*w+2*E]+=_*be,j(y,2*w+2*E),y[2*w+2*E+1]+=R*be,j(y,2*w+2*E+1),y[2*w+2*E+1]+=_*bt,j(y,2*w+2*E+1),y[2*w+2*E+2]+=R*bt,j(y,2*w+2*E+2)}for(I=0;I<p;I++)y[I]=y[2*I+1]<<16|y[2*I];for(I=p;I<2*p;I++)y[I]=0;return new a(y,0)};function j(I,p){for(;(I[p]&65535)!=I[p];)I[p+1]+=I[p]>>>16,I[p]&=65535,p++}function q(I,p){this.g=I,this.h=p}function nt(I,p){if(x(p))throw Error("division by zero");if(x(I))return new q(g,g);if(k(I))return p=nt(M(I),p),new q(M(p.g),M(p.h));if(k(p))return p=nt(I,M(p)),new q(M(p.g),p.h);if(I.g.length>30){if(k(I)||k(p))throw Error("slowDivide_ only works with positive integers.");for(var y=T,w=p;w.l(I)<=0;)y=W(y),w=W(w);var E=J(y,1),R=J(w,1);for(w=J(w,2),y=J(y,2);!x(w);){var _=R.add(w);_.l(I)<=0&&(E=E.add(y),R=_),w=J(w,1),y=J(y,1)}return p=$(I,E.j(p)),new q(E,p)}for(E=g;I.l(p)>=0;){for(y=Math.max(1,Math.floor(I.m()/p.m())),w=Math.ceil(Math.log(y)/Math.LN2),w=w<=48?1:Math.pow(2,w-48),R=d(y),_=R.j(p);k(_)||_.l(I)>0;)y-=w,R=d(y),_=R.j(p);x(R)&&(R=T),E=E.add(R),I=$(I,_)}return new q(E,I)}r.B=function(I){return nt(this,I).h},r.and=function(I){const p=Math.max(this.g.length,I.g.length),y=[];for(let w=0;w<p;w++)y[w]=this.i(w)&I.i(w);return new a(y,this.h&I.h)},r.or=function(I){const p=Math.max(this.g.length,I.g.length),y=[];for(let w=0;w<p;w++)y[w]=this.i(w)|I.i(w);return new a(y,this.h|I.h)},r.xor=function(I){const p=Math.max(this.g.length,I.g.length),y=[];for(let w=0;w<p;w++)y[w]=this.i(w)^I.i(w);return new a(y,this.h^I.h)};function W(I){const p=I.g.length+1,y=[];for(let w=0;w<p;w++)y[w]=I.i(w)<<1|I.i(w-1)>>>31;return new a(y,I.h)}function J(I,p){const y=p>>5;p%=32;const w=I.g.length-y,E=[];for(let R=0;R<w;R++)E[R]=p>0?I.i(R+y)>>>p|I.i(R+y+1)<<32-p:I.i(R+y);return new a(E,I.h)}n.prototype.digest=n.prototype.A,n.prototype.reset=n.prototype.u,n.prototype.update=n.prototype.v,ol=n,a.prototype.add=a.prototype.add,a.prototype.multiply=a.prototype.j,a.prototype.modulo=a.prototype.B,a.prototype.compare=a.prototype.l,a.prototype.toNumber=a.prototype.m,a.prototype.toString=a.prototype.toString,a.prototype.getBits=a.prototype.i,a.fromNumber=d,a.fromString=f,_e=a}).apply(typeof ku<"u"?ku:typeof self<"u"?self:typeof window<"u"?window:{});var ps=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var al,gr,ul,vs,so,cl,ll,hl;(function(){var r,t=Object.defineProperty;function e(o){o=[typeof globalThis=="object"&&globalThis,o,typeof window=="object"&&window,typeof self=="object"&&self,typeof ps=="object"&&ps];for(var c=0;c<o.length;++c){var h=o[c];if(h&&h.Math==Math)return h}throw Error("Cannot find global object")}var n=e(this);function s(o,c){if(c)t:{var h=n;o=o.split(".");for(var m=0;m<o.length-1;m++){var A=o[m];if(!(A in h))break t;h=h[A]}o=o[o.length-1],m=h[o],c=c(m),c!=m&&c!=null&&t(h,o,{configurable:!0,writable:!0,value:c})}}s("Symbol.dispose",function(o){return o||Symbol("Symbol.dispose")}),s("Array.prototype.values",function(o){return o||function(){return this[Symbol.iterator]()}}),s("Object.entries",function(o){return o||function(c){var h=[],m;for(m in c)Object.prototype.hasOwnProperty.call(c,m)&&h.push([m,c[m]]);return h}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var i=i||{},a=this||self;function u(o){var c=typeof o;return c=="object"&&o!=null||c=="function"}function l(o,c,h){return o.call.apply(o.bind,arguments)}function d(o,c,h){return d=l,d.apply(null,arguments)}function f(o,c){var h=Array.prototype.slice.call(arguments,1);return function(){var m=h.slice();return m.push.apply(m,arguments),o.apply(this,m)}}function g(o,c){function h(){}h.prototype=c.prototype,o.Z=c.prototype,o.prototype=new h,o.prototype.constructor=o,o.Ob=function(m,A,V){for(var D=Array(arguments.length-2),z=2;z<arguments.length;z++)D[z-2]=arguments[z];return c.prototype[A].apply(m,D)}}var T=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?o=>o&&AsyncContext.Snapshot.wrap(o):o=>o;function P(o){const c=o.length;if(c>0){const h=Array(c);for(let m=0;m<c;m++)h[m]=o[m];return h}return[]}function x(o,c){for(let m=1;m<arguments.length;m++){const A=arguments[m];var h=typeof A;if(h=h!="object"?h:A?Array.isArray(A)?"array":h:"null",h=="array"||h=="object"&&typeof A.length=="number"){h=o.length||0;const V=A.length||0;o.length=h+V;for(let D=0;D<V;D++)o[h+D]=A[D]}else o.push(A)}}class k{constructor(c,h){this.i=c,this.j=h,this.h=0,this.g=null}get(){let c;return this.h>0?(this.h--,c=this.g,this.g=c.next,c.next=null):c=this.i(),c}}function M(o){a.setTimeout(()=>{throw o},0)}function $(){var o=I;let c=null;return o.g&&(c=o.g,o.g=o.g.next,o.g||(o.h=null),c.next=null),c}class j{constructor(){this.h=this.g=null}add(c,h){const m=q.get();m.set(c,h),this.h?this.h.next=m:this.g=m,this.h=m}}var q=new k(()=>new nt,o=>o.reset());class nt{constructor(){this.next=this.g=this.h=null}set(c,h){this.h=c,this.g=h,this.next=null}reset(){this.next=this.g=this.h=null}}let W,J=!1,I=new j,p=()=>{const o=Promise.resolve(void 0);W=()=>{o.then(y)}};function y(){for(var o;o=$();){try{o.h.call(o.g)}catch(h){M(h)}var c=q;c.j(o),c.h<100&&(c.h++,o.next=c.g,c.g=o)}J=!1}function w(){this.u=this.u,this.C=this.C}w.prototype.u=!1,w.prototype.dispose=function(){this.u||(this.u=!0,this.N())},w.prototype[Symbol.dispose]=function(){this.dispose()},w.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function E(o,c){this.type=o,this.g=this.target=c,this.defaultPrevented=!1}E.prototype.h=function(){this.defaultPrevented=!0};var R=(function(){if(!a.addEventListener||!Object.defineProperty)return!1;var o=!1,c=Object.defineProperty({},"passive",{get:function(){o=!0}});try{const h=()=>{};a.addEventListener("test",h,c),a.removeEventListener("test",h,c)}catch{}return o})();function _(o){return/^[\s\xa0]*$/.test(o)}function bt(o,c){E.call(this,o?o.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,o&&this.init(o,c)}g(bt,E),bt.prototype.init=function(o,c){const h=this.type=o.type,m=o.changedTouches&&o.changedTouches.length?o.changedTouches[0]:null;this.target=o.target||o.srcElement,this.g=c,c=o.relatedTarget,c||(h=="mouseover"?c=o.fromElement:h=="mouseout"&&(c=o.toElement)),this.relatedTarget=c,m?(this.clientX=m.clientX!==void 0?m.clientX:m.pageX,this.clientY=m.clientY!==void 0?m.clientY:m.pageY,this.screenX=m.screenX||0,this.screenY=m.screenY||0):(this.clientX=o.clientX!==void 0?o.clientX:o.pageX,this.clientY=o.clientY!==void 0?o.clientY:o.pageY,this.screenX=o.screenX||0,this.screenY=o.screenY||0),this.button=o.button,this.key=o.key||"",this.ctrlKey=o.ctrlKey,this.altKey=o.altKey,this.shiftKey=o.shiftKey,this.metaKey=o.metaKey,this.pointerId=o.pointerId||0,this.pointerType=o.pointerType,this.state=o.state,this.i=o,o.defaultPrevented&&bt.Z.h.call(this)},bt.prototype.h=function(){bt.Z.h.call(this);const o=this.i;o.preventDefault?o.preventDefault():o.returnValue=!1};var be="closure_listenable_"+(Math.random()*1e6|0),Rd=0;function Vd(o,c,h,m,A){this.listener=o,this.proxy=null,this.src=c,this.type=h,this.capture=!!m,this.ha=A,this.key=++Rd,this.da=this.fa=!1}function es(o){o.da=!0,o.listener=null,o.proxy=null,o.src=null,o.ha=null}function ns(o,c,h){for(const m in o)c.call(h,o[m],m,o)}function Sd(o,c){for(const h in o)c.call(void 0,o[h],h,o)}function Na(o){const c={};for(const h in o)c[h]=o[h];return c}const ka="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function Ma(o,c){let h,m;for(let A=1;A<arguments.length;A++){m=arguments[A];for(h in m)o[h]=m[h];for(let V=0;V<ka.length;V++)h=ka[V],Object.prototype.hasOwnProperty.call(m,h)&&(o[h]=m[h])}}function rs(o){this.src=o,this.g={},this.h=0}rs.prototype.add=function(o,c,h,m,A){const V=o.toString();o=this.g[V],o||(o=this.g[V]=[],this.h++);const D=Ri(o,c,m,A);return D>-1?(c=o[D],h||(c.fa=!1)):(c=new Vd(c,this.src,V,!!m,A),c.fa=h,o.push(c)),c};function Ai(o,c){const h=c.type;if(h in o.g){var m=o.g[h],A=Array.prototype.indexOf.call(m,c,void 0),V;(V=A>=0)&&Array.prototype.splice.call(m,A,1),V&&(es(c),o.g[h].length==0&&(delete o.g[h],o.h--))}}function Ri(o,c,h,m){for(let A=0;A<o.length;++A){const V=o[A];if(!V.da&&V.listener==c&&V.capture==!!h&&V.ha==m)return A}return-1}var Vi="closure_lm_"+(Math.random()*1e6|0),Si={};function Oa(o,c,h,m,A){if(Array.isArray(c)){for(let V=0;V<c.length;V++)Oa(o,c[V],h,m,A);return null}return h=Ua(h),o&&o[be]?o.J(c,h,u(m)?!!m.capture:!1,A):Pd(o,c,h,!1,m,A)}function Pd(o,c,h,m,A,V){if(!c)throw Error("Invalid event type");const D=u(A)?!!A.capture:!!A;let z=bi(o);if(z||(o[Vi]=z=new rs(o)),h=z.add(c,h,m,D,V),h.proxy)return h;if(m=bd(),h.proxy=m,m.src=o,m.listener=h,o.addEventListener)R||(A=D),A===void 0&&(A=!1),o.addEventListener(c.toString(),m,A);else if(o.attachEvent)o.attachEvent(La(c.toString()),m);else if(o.addListener&&o.removeListener)o.addListener(m);else throw Error("addEventListener and attachEvent are unavailable.");return h}function bd(){function o(h){return c.call(o.src,o.listener,h)}const c=Cd;return o}function Fa(o,c,h,m,A){if(Array.isArray(c))for(var V=0;V<c.length;V++)Fa(o,c[V],h,m,A);else m=u(m)?!!m.capture:!!m,h=Ua(h),o&&o[be]?(o=o.i,V=String(c).toString(),V in o.g&&(c=o.g[V],h=Ri(c,h,m,A),h>-1&&(es(c[h]),Array.prototype.splice.call(c,h,1),c.length==0&&(delete o.g[V],o.h--)))):o&&(o=bi(o))&&(c=o.g[c.toString()],o=-1,c&&(o=Ri(c,h,m,A)),(h=o>-1?c[o]:null)&&Pi(h))}function Pi(o){if(typeof o!="number"&&o&&!o.da){var c=o.src;if(c&&c[be])Ai(c.i,o);else{var h=o.type,m=o.proxy;c.removeEventListener?c.removeEventListener(h,m,o.capture):c.detachEvent?c.detachEvent(La(h),m):c.addListener&&c.removeListener&&c.removeListener(m),(h=bi(c))?(Ai(h,o),h.h==0&&(h.src=null,c[Vi]=null)):es(o)}}}function La(o){return o in Si?Si[o]:Si[o]="on"+o}function Cd(o,c){if(o.da)o=!0;else{c=new bt(c,this);const h=o.listener,m=o.ha||o.src;o.fa&&Pi(o),o=h.call(m,c)}return o}function bi(o){return o=o[Vi],o instanceof rs?o:null}var Ci="__closure_events_fn_"+(Math.random()*1e9>>>0);function Ua(o){return typeof o=="function"?o:(o[Ci]||(o[Ci]=function(c){return o.handleEvent(c)}),o[Ci])}function Et(){w.call(this),this.i=new rs(this),this.M=this,this.G=null}g(Et,w),Et.prototype[be]=!0,Et.prototype.removeEventListener=function(o,c,h,m){Fa(this,o,c,h,m)};function Vt(o,c){var h,m=o.G;if(m)for(h=[];m;m=m.G)h.push(m);if(o=o.M,m=c.type||c,typeof c=="string")c=new E(c,o);else if(c instanceof E)c.target=c.target||o;else{var A=c;c=new E(m,o),Ma(c,A)}A=!0;let V,D;if(h)for(D=h.length-1;D>=0;D--)V=c.g=h[D],A=ss(V,m,!0,c)&&A;if(V=c.g=o,A=ss(V,m,!0,c)&&A,A=ss(V,m,!1,c)&&A,h)for(D=0;D<h.length;D++)V=c.g=h[D],A=ss(V,m,!1,c)&&A}Et.prototype.N=function(){if(Et.Z.N.call(this),this.i){var o=this.i;for(const c in o.g){const h=o.g[c];for(let m=0;m<h.length;m++)es(h[m]);delete o.g[c],o.h--}}this.G=null},Et.prototype.J=function(o,c,h,m){return this.i.add(String(o),c,!1,h,m)},Et.prototype.K=function(o,c,h,m){return this.i.add(String(o),c,!0,h,m)};function ss(o,c,h,m){if(c=o.i.g[String(c)],!c)return!0;c=c.concat();let A=!0;for(let V=0;V<c.length;++V){const D=c[V];if(D&&!D.da&&D.capture==h){const z=D.listener,mt=D.ha||D.src;D.fa&&Ai(o.i,D),A=z.call(mt,m)!==!1&&A}}return A&&!m.defaultPrevented}function Dd(o,c){if(typeof o!="function")if(o&&typeof o.handleEvent=="function")o=d(o.handleEvent,o);else throw Error("Invalid listener argument");return Number(c)>2147483647?-1:a.setTimeout(o,c||0)}function Ba(o){o.g=Dd(()=>{o.g=null,o.i&&(o.i=!1,Ba(o))},o.l);const c=o.h;o.h=null,o.m.apply(null,c)}class xd extends w{constructor(c,h){super(),this.m=c,this.l=h,this.h=null,this.i=!1,this.g=null}j(c){this.h=arguments,this.g?this.i=!0:Ba(this)}N(){super.N(),this.g&&(a.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Qn(o){w.call(this),this.h=o,this.g={}}g(Qn,w);var qa=[];function ja(o){ns(o.g,function(c,h){this.g.hasOwnProperty(h)&&Pi(c)},o),o.g={}}Qn.prototype.N=function(){Qn.Z.N.call(this),ja(this)},Qn.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Di=a.JSON.stringify,Nd=a.JSON.parse,kd=class{stringify(o){return a.JSON.stringify(o,void 0)}parse(o){return a.JSON.parse(o,void 0)}};function za(){}function Ga(){}var Wn={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function xi(){E.call(this,"d")}g(xi,E);function Ni(){E.call(this,"c")}g(Ni,E);var Ce={},Ka=null;function is(){return Ka=Ka||new Et}Ce.Ia="serverreachability";function $a(o){E.call(this,Ce.Ia,o)}g($a,E);function Hn(o){const c=is();Vt(c,new $a(c))}Ce.STAT_EVENT="statevent";function Qa(o,c){E.call(this,Ce.STAT_EVENT,o),this.stat=c}g(Qa,E);function St(o){const c=is();Vt(c,new Qa(c,o))}Ce.Ja="timingevent";function Wa(o,c){E.call(this,Ce.Ja,o),this.size=c}g(Wa,E);function Jn(o,c){if(typeof o!="function")throw Error("Fn must not be null and must be a function");return a.setTimeout(function(){o()},c)}function Yn(){this.g=!0}Yn.prototype.ua=function(){this.g=!1};function Md(o,c,h,m,A,V){o.info(function(){if(o.g)if(V){var D="",z=V.split("&");for(let tt=0;tt<z.length;tt++){var mt=z[tt].split("=");if(mt.length>1){const pt=mt[0];mt=mt[1];const Gt=pt.split("_");D=Gt.length>=2&&Gt[1]=="type"?D+(pt+"="+mt+"&"):D+(pt+"=redacted&")}}}else D=null;else D=V;return"XMLHTTP REQ ("+m+") [attempt "+A+"]: "+c+`
`+h+`
`+D})}function Od(o,c,h,m,A,V,D){o.info(function(){return"XMLHTTP RESP ("+m+") [ attempt "+A+"]: "+c+`
`+h+`
`+V+" "+D})}function en(o,c,h,m){o.info(function(){return"XMLHTTP TEXT ("+c+"): "+Ld(o,h)+(m?" "+m:"")})}function Fd(o,c){o.info(function(){return"TIMEOUT: "+c})}Yn.prototype.info=function(){};function Ld(o,c){if(!o.g)return c;if(!c)return null;try{const V=JSON.parse(c);if(V){for(o=0;o<V.length;o++)if(Array.isArray(V[o])){var h=V[o];if(!(h.length<2)){var m=h[1];if(Array.isArray(m)&&!(m.length<1)){var A=m[0];if(A!="noop"&&A!="stop"&&A!="close")for(let D=1;D<m.length;D++)m[D]=""}}}}return Di(V)}catch{return c}}var os={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},Ha={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},Ja;function ki(){}g(ki,za),ki.prototype.g=function(){return new XMLHttpRequest},Ja=new ki;function Xn(o){return encodeURIComponent(String(o))}function Ud(o){var c=1;o=o.split(":");const h=[];for(;c>0&&o.length;)h.push(o.shift()),c--;return o.length&&h.push(o.join(":")),h}function ie(o,c,h,m){this.j=o,this.i=c,this.l=h,this.S=m||1,this.V=new Qn(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new Ya}function Ya(){this.i=null,this.g="",this.h=!1}var Xa={},Mi={};function Oi(o,c,h){o.M=1,o.A=us(zt(c)),o.u=h,o.R=!0,Za(o,null)}function Za(o,c){o.F=Date.now(),as(o),o.B=zt(o.A);var h=o.B,m=o.S;Array.isArray(m)||(m=[String(m)]),du(h.i,"t",m),o.C=0,h=o.j.L,o.h=new Ya,o.g=Cu(o.j,h?c:null,!o.u),o.P>0&&(o.O=new xd(d(o.Y,o,o.g),o.P)),c=o.V,h=o.g,m=o.ba;var A="readystatechange";Array.isArray(A)||(A&&(qa[0]=A.toString()),A=qa);for(let V=0;V<A.length;V++){const D=Oa(h,A[V],m||c.handleEvent,!1,c.h||c);if(!D)break;c.g[D.key]=D}c=o.J?Na(o.J):{},o.u?(o.v||(o.v="POST"),c["Content-Type"]="application/x-www-form-urlencoded",o.g.ea(o.B,o.v,o.u,c)):(o.v="GET",o.g.ea(o.B,o.v,null,c)),Hn(),Md(o.i,o.v,o.B,o.l,o.S,o.u)}ie.prototype.ba=function(o){o=o.target;const c=this.O;c&&ue(o)==3?c.j():this.Y(o)},ie.prototype.Y=function(o){try{if(o==this.g)t:{const z=ue(this.g),mt=this.g.ya(),tt=this.g.ca();if(!(z<3)&&(z!=3||this.g&&(this.h.h||this.g.la()||Iu(this.g)))){this.K||z!=4||mt==7||(mt==8||tt<=0?Hn(3):Hn(2)),Fi(this);var c=this.g.ca();this.X=c;var h=Bd(this);if(this.o=c==200,Od(this.i,this.v,this.B,this.l,this.S,z,c),this.o){if(this.U&&!this.L){e:{if(this.g){var m,A=this.g;if((m=A.g?A.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!_(m)){var V=m;break e}}V=null}if(o=V)en(this.i,this.l,o,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Li(this,o);else{this.o=!1,this.m=3,St(12),De(this),Zn(this);break t}}if(this.R){o=!0;let pt;for(;!this.K&&this.C<h.length;)if(pt=qd(this,h),pt==Mi){z==4&&(this.m=4,St(14),o=!1),en(this.i,this.l,null,"[Incomplete Response]");break}else if(pt==Xa){this.m=4,St(15),en(this.i,this.l,h,"[Invalid Chunk]"),o=!1;break}else en(this.i,this.l,pt,null),Li(this,pt);if(tu(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),z!=4||h.length!=0||this.h.h||(this.m=1,St(16),o=!1),this.o=this.o&&o,!o)en(this.i,this.l,h,"[Invalid Chunked Response]"),De(this),Zn(this);else if(h.length>0&&!this.W){this.W=!0;var D=this.j;D.g==this&&D.aa&&!D.P&&(D.j.info("Great, no buffering proxy detected. Bytes received: "+h.length),$i(D),D.P=!0,St(11))}}else en(this.i,this.l,h,null),Li(this,h);z==4&&De(this),this.o&&!this.K&&(z==4?Vu(this.j,this):(this.o=!1,as(this)))}else ef(this.g),c==400&&h.indexOf("Unknown SID")>0?(this.m=3,St(12)):(this.m=0,St(13)),De(this),Zn(this)}}}catch{}finally{}};function Bd(o){if(!tu(o))return o.g.la();const c=Iu(o.g);if(c==="")return"";let h="";const m=c.length,A=ue(o.g)==4;if(!o.h.i){if(typeof TextDecoder>"u")return De(o),Zn(o),"";o.h.i=new a.TextDecoder}for(let V=0;V<m;V++)o.h.h=!0,h+=o.h.i.decode(c[V],{stream:!(A&&V==m-1)});return c.length=0,o.h.g+=h,o.C=0,o.h.g}function tu(o){return o.g?o.v=="GET"&&o.M!=2&&o.j.Aa:!1}function qd(o,c){var h=o.C,m=c.indexOf(`
`,h);return m==-1?Mi:(h=Number(c.substring(h,m)),isNaN(h)?Xa:(m+=1,m+h>c.length?Mi:(c=c.slice(m,m+h),o.C=m+h,c)))}ie.prototype.cancel=function(){this.K=!0,De(this)};function as(o){o.T=Date.now()+o.H,eu(o,o.H)}function eu(o,c){if(o.D!=null)throw Error("WatchDog timer not null");o.D=Jn(d(o.aa,o),c)}function Fi(o){o.D&&(a.clearTimeout(o.D),o.D=null)}ie.prototype.aa=function(){this.D=null;const o=Date.now();o-this.T>=0?(Fd(this.i,this.B),this.M!=2&&(Hn(),St(17)),De(this),this.m=2,Zn(this)):eu(this,this.T-o)};function Zn(o){o.j.I==0||o.K||Vu(o.j,o)}function De(o){Fi(o);var c=o.O;c&&typeof c.dispose=="function"&&c.dispose(),o.O=null,ja(o.V),o.g&&(c=o.g,o.g=null,c.abort(),c.dispose())}function Li(o,c){try{var h=o.j;if(h.I!=0&&(h.g==o||Ui(h.h,o))){if(!o.L&&Ui(h.h,o)&&h.I==3){try{var m=h.Ba.g.parse(c)}catch{m=null}if(Array.isArray(m)&&m.length==3){var A=m;if(A[0]==0){t:if(!h.v){if(h.g)if(h.g.F+3e3<o.F)fs(h),hs(h);else break t;Ki(h),St(18)}}else h.xa=A[1],0<h.xa-h.K&&A[2]<37500&&h.F&&h.A==0&&!h.C&&(h.C=Jn(d(h.Va,h),6e3));su(h.h)<=1&&h.ta&&(h.ta=void 0)}else Ne(h,11)}else if((o.L||h.g==o)&&fs(h),!_(c))for(A=h.Ba.g.parse(c),c=0;c<A.length;c++){let tt=A[c];const pt=tt[0];if(!(pt<=h.K))if(h.K=pt,tt=tt[1],h.I==2)if(tt[0]=="c"){h.M=tt[1],h.ba=tt[2];const Gt=tt[3];Gt!=null&&(h.ka=Gt,h.j.info("VER="+h.ka));const ke=tt[4];ke!=null&&(h.za=ke,h.j.info("SVER="+h.za));const ce=tt[5];ce!=null&&typeof ce=="number"&&ce>0&&(m=1.5*ce,h.O=m,h.j.info("backChannelRequestTimeoutMs_="+m)),m=h;const le=o.g;if(le){const gs=le.g?le.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(gs){var V=m.h;V.g||gs.indexOf("spdy")==-1&&gs.indexOf("quic")==-1&&gs.indexOf("h2")==-1||(V.j=V.l,V.g=new Set,V.h&&(Bi(V,V.h),V.h=null))}if(m.G){const Qi=le.g?le.g.getResponseHeader("X-HTTP-Session-Id"):null;Qi&&(m.wa=Qi,rt(m.J,m.G,Qi))}}h.I=3,h.l&&h.l.ra(),h.aa&&(h.T=Date.now()-o.F,h.j.info("Handshake RTT: "+h.T+"ms")),m=h;var D=o;if(m.na=bu(m,m.L?m.ba:null,m.W),D.L){iu(m.h,D);var z=D,mt=m.O;mt&&(z.H=mt),z.D&&(Fi(z),as(z)),m.g=D}else Au(m);h.i.length>0&&ds(h)}else tt[0]!="stop"&&tt[0]!="close"||Ne(h,7);else h.I==3&&(tt[0]=="stop"||tt[0]=="close"?tt[0]=="stop"?Ne(h,7):Gi(h):tt[0]!="noop"&&h.l&&h.l.qa(tt),h.A=0)}}Hn(4)}catch{}}var jd=class{constructor(o,c){this.g=o,this.map=c}};function nu(o){this.l=o||10,a.PerformanceNavigationTiming?(o=a.performance.getEntriesByType("navigation"),o=o.length>0&&(o[0].nextHopProtocol=="hq"||o[0].nextHopProtocol=="h2")):o=!!(a.chrome&&a.chrome.loadTimes&&a.chrome.loadTimes()&&a.chrome.loadTimes().wasFetchedViaSpdy),this.j=o?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function ru(o){return o.h?!0:o.g?o.g.size>=o.j:!1}function su(o){return o.h?1:o.g?o.g.size:0}function Ui(o,c){return o.h?o.h==c:o.g?o.g.has(c):!1}function Bi(o,c){o.g?o.g.add(c):o.h=c}function iu(o,c){o.h&&o.h==c?o.h=null:o.g&&o.g.has(c)&&o.g.delete(c)}nu.prototype.cancel=function(){if(this.i=ou(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const o of this.g.values())o.cancel();this.g.clear()}};function ou(o){if(o.h!=null)return o.i.concat(o.h.G);if(o.g!=null&&o.g.size!==0){let c=o.i;for(const h of o.g.values())c=c.concat(h.G);return c}return P(o.i)}var au=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function zd(o,c){if(o){o=o.split("&");for(let h=0;h<o.length;h++){const m=o[h].indexOf("=");let A,V=null;m>=0?(A=o[h].substring(0,m),V=o[h].substring(m+1)):A=o[h],c(A,V?decodeURIComponent(V.replace(/\+/g," ")):"")}}}function oe(o){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let c;o instanceof oe?(this.l=o.l,tr(this,o.j),this.o=o.o,this.g=o.g,er(this,o.u),this.h=o.h,qi(this,fu(o.i)),this.m=o.m):o&&(c=String(o).match(au))?(this.l=!1,tr(this,c[1]||"",!0),this.o=nr(c[2]||""),this.g=nr(c[3]||"",!0),er(this,c[4]),this.h=nr(c[5]||"",!0),qi(this,c[6]||"",!0),this.m=nr(c[7]||"")):(this.l=!1,this.i=new sr(null,this.l))}oe.prototype.toString=function(){const o=[];var c=this.j;c&&o.push(rr(c,uu,!0),":");var h=this.g;return(h||c=="file")&&(o.push("//"),(c=this.o)&&o.push(rr(c,uu,!0),"@"),o.push(Xn(h).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),h=this.u,h!=null&&o.push(":",String(h))),(h=this.h)&&(this.g&&h.charAt(0)!="/"&&o.push("/"),o.push(rr(h,h.charAt(0)=="/"?$d:Kd,!0))),(h=this.i.toString())&&o.push("?",h),(h=this.m)&&o.push("#",rr(h,Wd)),o.join("")},oe.prototype.resolve=function(o){const c=zt(this);let h=!!o.j;h?tr(c,o.j):h=!!o.o,h?c.o=o.o:h=!!o.g,h?c.g=o.g:h=o.u!=null;var m=o.h;if(h)er(c,o.u);else if(h=!!o.h){if(m.charAt(0)!="/")if(this.g&&!this.h)m="/"+m;else{var A=c.h.lastIndexOf("/");A!=-1&&(m=c.h.slice(0,A+1)+m)}if(A=m,A==".."||A==".")m="";else if(A.indexOf("./")!=-1||A.indexOf("/.")!=-1){m=A.lastIndexOf("/",0)==0,A=A.split("/");const V=[];for(let D=0;D<A.length;){const z=A[D++];z=="."?m&&D==A.length&&V.push(""):z==".."?((V.length>1||V.length==1&&V[0]!="")&&V.pop(),m&&D==A.length&&V.push("")):(V.push(z),m=!0)}m=V.join("/")}else m=A}return h?c.h=m:h=o.i.toString()!=="",h?qi(c,fu(o.i)):h=!!o.m,h&&(c.m=o.m),c};function zt(o){return new oe(o)}function tr(o,c,h){o.j=h?nr(c,!0):c,o.j&&(o.j=o.j.replace(/:$/,""))}function er(o,c){if(c){if(c=Number(c),isNaN(c)||c<0)throw Error("Bad port number "+c);o.u=c}else o.u=null}function qi(o,c,h){c instanceof sr?(o.i=c,Hd(o.i,o.l)):(h||(c=rr(c,Qd)),o.i=new sr(c,o.l))}function rt(o,c,h){o.i.set(c,h)}function us(o){return rt(o,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),o}function nr(o,c){return o?c?decodeURI(o.replace(/%25/g,"%2525")):decodeURIComponent(o):""}function rr(o,c,h){return typeof o=="string"?(o=encodeURI(o).replace(c,Gd),h&&(o=o.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),o):null}function Gd(o){return o=o.charCodeAt(0),"%"+(o>>4&15).toString(16)+(o&15).toString(16)}var uu=/[#\/\?@]/g,Kd=/[#\?:]/g,$d=/[#\?]/g,Qd=/[#\?@]/g,Wd=/#/g;function sr(o,c){this.h=this.g=null,this.i=o||null,this.j=!!c}function xe(o){o.g||(o.g=new Map,o.h=0,o.i&&zd(o.i,function(c,h){o.add(decodeURIComponent(c.replace(/\+/g," ")),h)}))}r=sr.prototype,r.add=function(o,c){xe(this),this.i=null,o=nn(this,o);let h=this.g.get(o);return h||this.g.set(o,h=[]),h.push(c),this.h+=1,this};function cu(o,c){xe(o),c=nn(o,c),o.g.has(c)&&(o.i=null,o.h-=o.g.get(c).length,o.g.delete(c))}function lu(o,c){return xe(o),c=nn(o,c),o.g.has(c)}r.forEach=function(o,c){xe(this),this.g.forEach(function(h,m){h.forEach(function(A){o.call(c,A,m,this)},this)},this)};function hu(o,c){xe(o);let h=[];if(typeof c=="string")lu(o,c)&&(h=h.concat(o.g.get(nn(o,c))));else for(o=Array.from(o.g.values()),c=0;c<o.length;c++)h=h.concat(o[c]);return h}r.set=function(o,c){return xe(this),this.i=null,o=nn(this,o),lu(this,o)&&(this.h-=this.g.get(o).length),this.g.set(o,[c]),this.h+=1,this},r.get=function(o,c){return o?(o=hu(this,o),o.length>0?String(o[0]):c):c};function du(o,c,h){cu(o,c),h.length>0&&(o.i=null,o.g.set(nn(o,c),P(h)),o.h+=h.length)}r.toString=function(){if(this.i)return this.i;if(!this.g)return"";const o=[],c=Array.from(this.g.keys());for(let m=0;m<c.length;m++){var h=c[m];const A=Xn(h);h=hu(this,h);for(let V=0;V<h.length;V++){let D=A;h[V]!==""&&(D+="="+Xn(h[V])),o.push(D)}}return this.i=o.join("&")};function fu(o){const c=new sr;return c.i=o.i,o.g&&(c.g=new Map(o.g),c.h=o.h),c}function nn(o,c){return c=String(c),o.j&&(c=c.toLowerCase()),c}function Hd(o,c){c&&!o.j&&(xe(o),o.i=null,o.g.forEach(function(h,m){const A=m.toLowerCase();m!=A&&(cu(this,m),du(this,A,h))},o)),o.j=c}function Jd(o,c){const h=new Yn;if(a.Image){const m=new Image;m.onload=f(ae,h,"TestLoadImage: loaded",!0,c,m),m.onerror=f(ae,h,"TestLoadImage: error",!1,c,m),m.onabort=f(ae,h,"TestLoadImage: abort",!1,c,m),m.ontimeout=f(ae,h,"TestLoadImage: timeout",!1,c,m),a.setTimeout(function(){m.ontimeout&&m.ontimeout()},1e4),m.src=o}else c(!1)}function Yd(o,c){const h=new Yn,m=new AbortController,A=setTimeout(()=>{m.abort(),ae(h,"TestPingServer: timeout",!1,c)},1e4);fetch(o,{signal:m.signal}).then(V=>{clearTimeout(A),V.ok?ae(h,"TestPingServer: ok",!0,c):ae(h,"TestPingServer: server error",!1,c)}).catch(()=>{clearTimeout(A),ae(h,"TestPingServer: error",!1,c)})}function ae(o,c,h,m,A){try{A&&(A.onload=null,A.onerror=null,A.onabort=null,A.ontimeout=null),m(h)}catch{}}function Xd(){this.g=new kd}function ji(o){this.i=o.Sb||null,this.h=o.ab||!1}g(ji,za),ji.prototype.g=function(){return new cs(this.i,this.h)};function cs(o,c){Et.call(this),this.H=o,this.o=c,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}g(cs,Et),r=cs.prototype,r.open=function(o,c){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=o,this.D=c,this.readyState=1,or(this)},r.send=function(o){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const c={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};o&&(c.body=o),(this.H||a).fetch(new Request(this.D,c)).then(this.Pa.bind(this),this.ga.bind(this))},r.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,ir(this)),this.readyState=0},r.Pa=function(o){if(this.g&&(this.l=o,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=o.headers,this.readyState=2,or(this)),this.g&&(this.readyState=3,or(this),this.g)))if(this.responseType==="arraybuffer")o.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof a.ReadableStream<"u"&&"body"in o){if(this.j=o.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;mu(this)}else o.text().then(this.Oa.bind(this),this.ga.bind(this))};function mu(o){o.j.read().then(o.Ma.bind(o)).catch(o.ga.bind(o))}r.Ma=function(o){if(this.g){if(this.o&&o.value)this.response.push(o.value);else if(!this.o){var c=o.value?o.value:new Uint8Array(0);(c=this.B.decode(c,{stream:!o.done}))&&(this.response=this.responseText+=c)}o.done?ir(this):or(this),this.readyState==3&&mu(this)}},r.Oa=function(o){this.g&&(this.response=this.responseText=o,ir(this))},r.Na=function(o){this.g&&(this.response=o,ir(this))},r.ga=function(){this.g&&ir(this)};function ir(o){o.readyState=4,o.l=null,o.j=null,o.B=null,or(o)}r.setRequestHeader=function(o,c){this.A.append(o,c)},r.getResponseHeader=function(o){return this.h&&this.h.get(o.toLowerCase())||""},r.getAllResponseHeaders=function(){if(!this.h)return"";const o=[],c=this.h.entries();for(var h=c.next();!h.done;)h=h.value,o.push(h[0]+": "+h[1]),h=c.next();return o.join(`\r
`)};function or(o){o.onreadystatechange&&o.onreadystatechange.call(o)}Object.defineProperty(cs.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(o){this.m=o?"include":"same-origin"}});function gu(o){let c="";return ns(o,function(h,m){c+=m,c+=":",c+=h,c+=`\r
`}),c}function zi(o,c,h){t:{for(m in h){var m=!1;break t}m=!0}m||(h=gu(h),typeof o=="string"?h!=null&&Xn(h):rt(o,c,h))}function ct(o){Et.call(this),this.headers=new Map,this.L=o||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}g(ct,Et);var Zd=/^https?$/i,tf=["POST","PUT"];r=ct.prototype,r.Fa=function(o){this.H=o},r.ea=function(o,c,h,m){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+o);c=c?c.toUpperCase():"GET",this.D=o,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():Ja.g(),this.g.onreadystatechange=T(d(this.Ca,this));try{this.B=!0,this.g.open(c,String(o),!0),this.B=!1}catch(V){pu(this,V);return}if(o=h||"",h=new Map(this.headers),m)if(Object.getPrototypeOf(m)===Object.prototype)for(var A in m)h.set(A,m[A]);else if(typeof m.keys=="function"&&typeof m.get=="function")for(const V of m.keys())h.set(V,m.get(V));else throw Error("Unknown input type for opt_headers: "+String(m));m=Array.from(h.keys()).find(V=>V.toLowerCase()=="content-type"),A=a.FormData&&o instanceof a.FormData,!(Array.prototype.indexOf.call(tf,c,void 0)>=0)||m||A||h.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[V,D]of h)this.g.setRequestHeader(V,D);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(o),this.v=!1}catch(V){pu(this,V)}};function pu(o,c){o.h=!1,o.g&&(o.j=!0,o.g.abort(),o.j=!1),o.l=c,o.o=5,_u(o),ls(o)}function _u(o){o.A||(o.A=!0,Vt(o,"complete"),Vt(o,"error"))}r.abort=function(o){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=o||7,Vt(this,"complete"),Vt(this,"abort"),ls(this))},r.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),ls(this,!0)),ct.Z.N.call(this)},r.Ca=function(){this.u||(this.B||this.v||this.j?yu(this):this.Xa())},r.Xa=function(){yu(this)};function yu(o){if(o.h&&typeof i<"u"){if(o.v&&ue(o)==4)setTimeout(o.Ca.bind(o),0);else if(Vt(o,"readystatechange"),ue(o)==4){o.h=!1;try{const V=o.ca();t:switch(V){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var c=!0;break t;default:c=!1}var h;if(!(h=c)){var m;if(m=V===0){let D=String(o.D).match(au)[1]||null;!D&&a.self&&a.self.location&&(D=a.self.location.protocol.slice(0,-1)),m=!Zd.test(D?D.toLowerCase():"")}h=m}if(h)Vt(o,"complete"),Vt(o,"success");else{o.o=6;try{var A=ue(o)>2?o.g.statusText:""}catch{A=""}o.l=A+" ["+o.ca()+"]",_u(o)}}finally{ls(o)}}}}function ls(o,c){if(o.g){o.m&&(clearTimeout(o.m),o.m=null);const h=o.g;o.g=null,c||Vt(o,"ready");try{h.onreadystatechange=null}catch{}}}r.isActive=function(){return!!this.g};function ue(o){return o.g?o.g.readyState:0}r.ca=function(){try{return ue(this)>2?this.g.status:-1}catch{return-1}},r.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},r.La=function(o){if(this.g){var c=this.g.responseText;return o&&c.indexOf(o)==0&&(c=c.substring(o.length)),Nd(c)}};function Iu(o){try{if(!o.g)return null;if("response"in o.g)return o.g.response;switch(o.F){case"":case"text":return o.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in o.g)return o.g.mozResponseArrayBuffer}return null}catch{return null}}function ef(o){const c={};o=(o.g&&ue(o)>=2&&o.g.getAllResponseHeaders()||"").split(`\r
`);for(let m=0;m<o.length;m++){if(_(o[m]))continue;var h=Ud(o[m]);const A=h[0];if(h=h[1],typeof h!="string")continue;h=h.trim();const V=c[A]||[];c[A]=V,V.push(h)}Sd(c,function(m){return m.join(", ")})}r.ya=function(){return this.o},r.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function ar(o,c,h){return h&&h.internalChannelParams&&h.internalChannelParams[o]||c}function Tu(o){this.za=0,this.i=[],this.j=new Yn,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=ar("failFast",!1,o),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=ar("baseRetryDelayMs",5e3,o),this.Za=ar("retryDelaySeedMs",1e4,o),this.Ta=ar("forwardChannelMaxRetries",2,o),this.va=ar("forwardChannelRequestTimeoutMs",2e4,o),this.ma=o&&o.xmlHttpFactory||void 0,this.Ua=o&&o.Rb||void 0,this.Aa=o&&o.useFetchStreams||!1,this.O=void 0,this.L=o&&o.supportsCrossDomainXhr||!1,this.M="",this.h=new nu(o&&o.concurrentRequestLimit),this.Ba=new Xd,this.S=o&&o.fastHandshake||!1,this.R=o&&o.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=o&&o.Pb||!1,o&&o.ua&&this.j.ua(),o&&o.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&o&&o.detectBufferingProxy||!1,this.ia=void 0,o&&o.longPollingTimeout&&o.longPollingTimeout>0&&(this.ia=o.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}r=Tu.prototype,r.ka=8,r.I=1,r.connect=function(o,c,h,m){St(0),this.W=o,this.H=c||{},h&&m!==void 0&&(this.H.OSID=h,this.H.OAID=m),this.F=this.X,this.J=bu(this,null,this.W),ds(this)};function Gi(o){if(Eu(o),o.I==3){var c=o.V++,h=zt(o.J);if(rt(h,"SID",o.M),rt(h,"RID",c),rt(h,"TYPE","terminate"),ur(o,h),c=new ie(o,o.j,c),c.M=2,c.A=us(zt(h)),h=!1,a.navigator&&a.navigator.sendBeacon)try{h=a.navigator.sendBeacon(c.A.toString(),"")}catch{}!h&&a.Image&&(new Image().src=c.A,h=!0),h||(c.g=Cu(c.j,null),c.g.ea(c.A)),c.F=Date.now(),as(c)}Pu(o)}function hs(o){o.g&&($i(o),o.g.cancel(),o.g=null)}function Eu(o){hs(o),o.v&&(a.clearTimeout(o.v),o.v=null),fs(o),o.h.cancel(),o.m&&(typeof o.m=="number"&&a.clearTimeout(o.m),o.m=null)}function ds(o){if(!ru(o.h)&&!o.m){o.m=!0;var c=o.Ea;W||p(),J||(W(),J=!0),I.add(c,o),o.D=0}}function nf(o,c){return su(o.h)>=o.h.j-(o.m?1:0)?!1:o.m?(o.i=c.G.concat(o.i),!0):o.I==1||o.I==2||o.D>=(o.Sa?0:o.Ta)?!1:(o.m=Jn(d(o.Ea,o,c),Su(o,o.D)),o.D++,!0)}r.Ea=function(o){if(this.m)if(this.m=null,this.I==1){if(!o){this.V=Math.floor(Math.random()*1e5),o=this.V++;const A=new ie(this,this.j,o);let V=this.o;if(this.U&&(V?(V=Na(V),Ma(V,this.U)):V=this.U),this.u!==null||this.R||(A.J=V,V=null),this.S)t:{for(var c=0,h=0;h<this.i.length;h++){e:{var m=this.i[h];if("__data__"in m.map&&(m=m.map.__data__,typeof m=="string")){m=m.length;break e}m=void 0}if(m===void 0)break;if(c+=m,c>4096){c=h;break t}if(c===4096||h===this.i.length-1){c=h+1;break t}}c=1e3}else c=1e3;c=vu(this,A,c),h=zt(this.J),rt(h,"RID",o),rt(h,"CVER",22),this.G&&rt(h,"X-HTTP-Session-Id",this.G),ur(this,h),V&&(this.R?c="headers="+Xn(gu(V))+"&"+c:this.u&&zi(h,this.u,V)),Bi(this.h,A),this.Ra&&rt(h,"TYPE","init"),this.S?(rt(h,"$req",c),rt(h,"SID","null"),A.U=!0,Oi(A,h,null)):Oi(A,h,c),this.I=2}}else this.I==3&&(o?wu(this,o):this.i.length==0||ru(this.h)||wu(this))};function wu(o,c){var h;c?h=c.l:h=o.V++;const m=zt(o.J);rt(m,"SID",o.M),rt(m,"RID",h),rt(m,"AID",o.K),ur(o,m),o.u&&o.o&&zi(m,o.u,o.o),h=new ie(o,o.j,h,o.D+1),o.u===null&&(h.J=o.o),c&&(o.i=c.G.concat(o.i)),c=vu(o,h,1e3),h.H=Math.round(o.va*.5)+Math.round(o.va*.5*Math.random()),Bi(o.h,h),Oi(h,m,c)}function ur(o,c){o.H&&ns(o.H,function(h,m){rt(c,m,h)}),o.l&&ns({},function(h,m){rt(c,m,h)})}function vu(o,c,h){h=Math.min(o.i.length,h);const m=o.l?d(o.l.Ka,o.l,o):null;t:{var A=o.i;let z=-1;for(;;){const mt=["count="+h];z==-1?h>0?(z=A[0].g,mt.push("ofs="+z)):z=0:mt.push("ofs="+z);let tt=!0;for(let pt=0;pt<h;pt++){var V=A[pt].g;const Gt=A[pt].map;if(V-=z,V<0)z=Math.max(0,A[pt].g-100),tt=!1;else try{V="req"+V+"_"||"";try{var D=Gt instanceof Map?Gt:Object.entries(Gt);for(const[ke,ce]of D){let le=ce;u(ce)&&(le=Di(ce)),mt.push(V+ke+"="+encodeURIComponent(le))}}catch(ke){throw mt.push(V+"type="+encodeURIComponent("_badmap")),ke}}catch{m&&m(Gt)}}if(tt){D=mt.join("&");break t}}D=void 0}return o=o.i.splice(0,h),c.G=o,D}function Au(o){if(!o.g&&!o.v){o.Y=1;var c=o.Da;W||p(),J||(W(),J=!0),I.add(c,o),o.A=0}}function Ki(o){return o.g||o.v||o.A>=3?!1:(o.Y++,o.v=Jn(d(o.Da,o),Su(o,o.A)),o.A++,!0)}r.Da=function(){if(this.v=null,Ru(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var o=4*this.T;this.j.info("BP detection timer enabled: "+o),this.B=Jn(d(this.Wa,this),o)}},r.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,St(10),hs(this),Ru(this))};function $i(o){o.B!=null&&(a.clearTimeout(o.B),o.B=null)}function Ru(o){o.g=new ie(o,o.j,"rpc",o.Y),o.u===null&&(o.g.J=o.o),o.g.P=0;var c=zt(o.na);rt(c,"RID","rpc"),rt(c,"SID",o.M),rt(c,"AID",o.K),rt(c,"CI",o.F?"0":"1"),!o.F&&o.ia&&rt(c,"TO",o.ia),rt(c,"TYPE","xmlhttp"),ur(o,c),o.u&&o.o&&zi(c,o.u,o.o),o.O&&(o.g.H=o.O);var h=o.g;o=o.ba,h.M=1,h.A=us(zt(c)),h.u=null,h.R=!0,Za(h,o)}r.Va=function(){this.C!=null&&(this.C=null,hs(this),Ki(this),St(19))};function fs(o){o.C!=null&&(a.clearTimeout(o.C),o.C=null)}function Vu(o,c){var h=null;if(o.g==c){fs(o),$i(o),o.g=null;var m=2}else if(Ui(o.h,c))h=c.G,iu(o.h,c),m=1;else return;if(o.I!=0){if(c.o)if(m==1){h=c.u?c.u.length:0,c=Date.now()-c.F;var A=o.D;m=is(),Vt(m,new Wa(m,h)),ds(o)}else Au(o);else if(A=c.m,A==3||A==0&&c.X>0||!(m==1&&nf(o,c)||m==2&&Ki(o)))switch(h&&h.length>0&&(c=o.h,c.i=c.i.concat(h)),A){case 1:Ne(o,5);break;case 4:Ne(o,10);break;case 3:Ne(o,6);break;default:Ne(o,2)}}}function Su(o,c){let h=o.Qa+Math.floor(Math.random()*o.Za);return o.isActive()||(h*=2),h*c}function Ne(o,c){if(o.j.info("Error code "+c),c==2){var h=d(o.bb,o),m=o.Ua;const A=!m;m=new oe(m||"//www.google.com/images/cleardot.gif"),a.location&&a.location.protocol=="http"||tr(m,"https"),us(m),A?Jd(m.toString(),h):Yd(m.toString(),h)}else St(2);o.I=0,o.l&&o.l.pa(c),Pu(o),Eu(o)}r.bb=function(o){o?(this.j.info("Successfully pinged google.com"),St(2)):(this.j.info("Failed to ping google.com"),St(1))};function Pu(o){if(o.I=0,o.ja=[],o.l){const c=ou(o.h);(c.length!=0||o.i.length!=0)&&(x(o.ja,c),x(o.ja,o.i),o.h.i.length=0,P(o.i),o.i.length=0),o.l.oa()}}function bu(o,c,h){var m=h instanceof oe?zt(h):new oe(h);if(m.g!="")c&&(m.g=c+"."+m.g),er(m,m.u);else{var A=a.location;m=A.protocol,c=c?c+"."+A.hostname:A.hostname,A=+A.port;const V=new oe(null);m&&tr(V,m),c&&(V.g=c),A&&er(V,A),h&&(V.h=h),m=V}return h=o.G,c=o.wa,h&&c&&rt(m,h,c),rt(m,"VER",o.ka),ur(o,m),m}function Cu(o,c,h){if(c&&!o.L)throw Error("Can't create secondary domain capable XhrIo object.");return c=o.Aa&&!o.ma?new ct(new ji({ab:h})):new ct(o.ma),c.Fa(o.L),c}r.isActive=function(){return!!this.l&&this.l.isActive(this)};function Du(){}r=Du.prototype,r.ra=function(){},r.qa=function(){},r.pa=function(){},r.oa=function(){},r.isActive=function(){return!0},r.Ka=function(){};function ms(){}ms.prototype.g=function(o,c){return new xt(o,c)};function xt(o,c){Et.call(this),this.g=new Tu(c),this.l=o,this.h=c&&c.messageUrlParams||null,o=c&&c.messageHeaders||null,c&&c.clientProtocolHeaderRequired&&(o?o["X-Client-Protocol"]="webchannel":o={"X-Client-Protocol":"webchannel"}),this.g.o=o,o=c&&c.initMessageHeaders||null,c&&c.messageContentType&&(o?o["X-WebChannel-Content-Type"]=c.messageContentType:o={"X-WebChannel-Content-Type":c.messageContentType}),c&&c.sa&&(o?o["X-WebChannel-Client-Profile"]=c.sa:o={"X-WebChannel-Client-Profile":c.sa}),this.g.U=o,(o=c&&c.Qb)&&!_(o)&&(this.g.u=o),this.A=c&&c.supportsCrossDomainXhr||!1,this.v=c&&c.sendRawJson||!1,(c=c&&c.httpSessionIdParam)&&!_(c)&&(this.g.G=c,o=this.h,o!==null&&c in o&&(o=this.h,c in o&&delete o[c])),this.j=new rn(this)}g(xt,Et),xt.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},xt.prototype.close=function(){Gi(this.g)},xt.prototype.o=function(o){var c=this.g;if(typeof o=="string"){var h={};h.__data__=o,o=h}else this.v&&(h={},h.__data__=Di(o),o=h);c.i.push(new jd(c.Ya++,o)),c.I==3&&ds(c)},xt.prototype.N=function(){this.g.l=null,delete this.j,Gi(this.g),delete this.g,xt.Z.N.call(this)};function xu(o){xi.call(this),o.__headers__&&(this.headers=o.__headers__,this.statusCode=o.__status__,delete o.__headers__,delete o.__status__);var c=o.__sm__;if(c){t:{for(const h in c){o=h;break t}o=void 0}(this.i=o)&&(o=this.i,c=c!==null&&o in c?c[o]:void 0),this.data=c}else this.data=o}g(xu,xi);function Nu(){Ni.call(this),this.status=1}g(Nu,Ni);function rn(o){this.g=o}g(rn,Du),rn.prototype.ra=function(){Vt(this.g,"a")},rn.prototype.qa=function(o){Vt(this.g,new xu(o))},rn.prototype.pa=function(o){Vt(this.g,new Nu)},rn.prototype.oa=function(){Vt(this.g,"b")},ms.prototype.createWebChannel=ms.prototype.g,xt.prototype.send=xt.prototype.o,xt.prototype.open=xt.prototype.m,xt.prototype.close=xt.prototype.close,hl=function(){return new ms},ll=function(){return is()},cl=Ce,so={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},os.NO_ERROR=0,os.TIMEOUT=8,os.HTTP_ERROR=6,vs=os,Ha.COMPLETE="complete",ul=Ha,Ga.EventType=Wn,Wn.OPEN="a",Wn.CLOSE="b",Wn.ERROR="c",Wn.MESSAGE="d",Et.prototype.listen=Et.prototype.J,gr=Ga,ct.prototype.listenOnce=ct.prototype.K,ct.prototype.getLastError=ct.prototype.Ha,ct.prototype.getLastErrorCode=ct.prototype.ya,ct.prototype.getStatus=ct.prototype.ca,ct.prototype.getResponseJson=ct.prototype.La,ct.prototype.getResponseText=ct.prototype.la,ct.prototype.send=ct.prototype.ea,ct.prototype.setWithCredentials=ct.prototype.Fa,al=ct}).apply(typeof ps<"u"?ps:typeof self<"u"?self:typeof window<"u"?window:{});/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vt{constructor(t){this.uid=t}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(t){return t.uid===this.uid}}vt.UNAUTHENTICATED=new vt(null),vt.GOOGLE_CREDENTIALS=new vt("google-credentials-uid"),vt.FIRST_PARTY=new vt("first-party-uid"),vt.MOCK_USER=new vt("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Ln="12.11.0";function gf(r){Ln=r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $e=new rf("@firebase/firestore");function hn(){return $e.logLevel}function b(r,...t){if($e.logLevel<=Yt.DEBUG){const e=t.map(Do);$e.debug(`Firestore (${Ln}): ${r}`,...e)}}function lt(r,...t){if($e.logLevel<=Yt.ERROR){const e=t.map(Do);$e.error(`Firestore (${Ln}): ${r}`,...e)}}function In(r,...t){if($e.logLevel<=Yt.WARN){const e=t.map(Do);$e.warn(`Firestore (${Ln}): ${r}`,...e)}}function Do(r){if(typeof r=="string")return r;try{return(function(e){return JSON.stringify(e)})(r)}catch{return r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function O(r,t,e){let n="Unexpected state";typeof t=="string"?n=t:e=t,dl(r,n,e)}function dl(r,t,e){let n=`FIRESTORE (${Ln}) INTERNAL ASSERTION FAILED: ${t} (ID: ${r.toString(16)})`;if(e!==void 0)try{n+=" CONTEXT: "+JSON.stringify(e)}catch{n+=" CONTEXT: "+e}throw lt(n),new Error(n)}function L(r,t,e,n){let s="Unexpected state";typeof e=="string"?s=e:n=e,r||dl(t,s,n)}function F(r,t){return r}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const S={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class C extends of{constructor(t,e){super(t,e),this.code=t,this.message=e,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bt{constructor(){this.promise=new Promise(((t,e)=>{this.resolve=t,this.reject=e}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pf{constructor(t,e){this.user=e,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${t}`)}}class _f{getToken(){return Promise.resolve(null)}invalidateToken(){}start(t,e){t.enqueueRetryable((()=>e(vt.UNAUTHENTICATED)))}shutdown(){}}class yf{constructor(t){this.t=t,this.currentUser=vt.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(t,e){L(this.o===void 0,42304);let n=this.i;const s=l=>this.i!==n?(n=this.i,e(l)):Promise.resolve();let i=new Bt;this.o=()=>{this.i++,this.currentUser=this.u(),i.resolve(),i=new Bt,t.enqueueRetryable((()=>s(this.currentUser)))};const a=()=>{const l=i;t.enqueueRetryable((async()=>{await l.promise,await s(this.currentUser)}))},u=l=>{b("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=l,this.o&&(this.auth.addAuthTokenListener(this.o),a())};this.t.onInit((l=>u(l))),setTimeout((()=>{if(!this.auth){const l=this.t.getImmediate({optional:!0});l?u(l):(b("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new Bt)}}),0),a()}getToken(){const t=this.i,e=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(e).then((n=>this.i!==t?(b("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):n?(L(typeof n.accessToken=="string",31837,{l:n}),new pf(n.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const t=this.auth&&this.auth.getUid();return L(t===null||typeof t=="string",2055,{h:t}),new vt(t)}}class If{constructor(t,e,n){this.P=t,this.T=e,this.I=n,this.type="FirstParty",this.user=vt.FIRST_PARTY,this.R=new Map}A(){return this.I?this.I():null}get headers(){this.R.set("X-Goog-AuthUser",this.P);const t=this.A();return t&&this.R.set("Authorization",t),this.T&&this.R.set("X-Goog-Iam-Authorization-Token",this.T),this.R}}class Tf{constructor(t,e,n){this.P=t,this.T=e,this.I=n}getToken(){return Promise.resolve(new If(this.P,this.T,this.I))}start(t,e){t.enqueueRetryable((()=>e(vt.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class Mu{constructor(t){this.value=t,this.type="AppCheck",this.headers=new Map,t&&t.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class Ef{constructor(t,e){this.V=e,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,sf(t)&&t.settings.appCheckToken&&(this.p=t.settings.appCheckToken)}start(t,e){L(this.o===void 0,3512);const n=i=>{i.error!=null&&b("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const a=i.token!==this.m;return this.m=i.token,b("FirebaseAppCheckTokenProvider",`Received ${a?"new":"existing"} token.`),a?e(i.token):Promise.resolve()};this.o=i=>{t.enqueueRetryable((()=>n(i)))};const s=i=>{b("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit((i=>s(i))),setTimeout((()=>{if(!this.appCheck){const i=this.V.getImmediate({optional:!0});i?s(i):b("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.p)return Promise.resolve(new Mu(this.p));const t=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(t).then((e=>e?(L(typeof e.token=="string",44558,{tokenResult:e}),this.m=e.token,new Mu(e.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wf(r){const t=typeof self<"u"&&(self.crypto||self.msCrypto),e=new Uint8Array(r);if(t&&typeof t.getRandomValues=="function")t.getRandomValues(e);else for(let n=0;n<r;n++)e[n]=Math.floor(256*Math.random());return e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xo{static newId(){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",e=62*Math.floor(4.129032258064516);let n="";for(;n.length<20;){const s=wf(40);for(let i=0;i<s.length;++i)n.length<20&&s[i]<e&&(n+=t.charAt(s[i]%62))}return n}}function B(r,t){return r<t?-1:r>t?1:0}function io(r,t){const e=Math.min(r.length,t.length);for(let n=0;n<e;n++){const s=r.charAt(n),i=t.charAt(n);if(s!==i)return Wi(s)===Wi(i)?B(s,i):Wi(s)?1:-1}return B(r.length,t.length)}const vf=55296,Af=57343;function Wi(r){const t=r.charCodeAt(0);return t>=vf&&t<=Af}function Tn(r,t,e){return r.length===t.length&&r.every(((n,s)=>e(n,t[s])))}function fl(r){return r+"\0"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ou="__name__";class Kt{constructor(t,e,n){e===void 0?e=0:e>t.length&&O(637,{offset:e,range:t.length}),n===void 0?n=t.length-e:n>t.length-e&&O(1746,{length:n,range:t.length-e}),this.segments=t,this.offset=e,this.len=n}get length(){return this.len}isEqual(t){return Kt.comparator(this,t)===0}child(t){const e=this.segments.slice(this.offset,this.limit());return t instanceof Kt?t.forEach((n=>{e.push(n)})):e.push(t),this.construct(e)}limit(){return this.offset+this.length}popFirst(t){return t=t===void 0?1:t,this.construct(this.segments,this.offset+t,this.length-t)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(t){return this.segments[this.offset+t]}isEmpty(){return this.length===0}isPrefixOf(t){if(t.length<this.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}isImmediateParentOf(t){if(this.length+1!==t.length)return!1;for(let e=0;e<this.length;e++)if(this.get(e)!==t.get(e))return!1;return!0}forEach(t){for(let e=this.offset,n=this.limit();e<n;e++)t(this.segments[e])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(t,e){const n=Math.min(t.length,e.length);for(let s=0;s<n;s++){const i=Kt.compareSegments(t.get(s),e.get(s));if(i!==0)return i}return B(t.length,e.length)}static compareSegments(t,e){const n=Kt.isNumericId(t),s=Kt.isNumericId(e);return n&&!s?-1:!n&&s?1:n&&s?Kt.extractNumericId(t).compare(Kt.extractNumericId(e)):io(t,e)}static isNumericId(t){return t.startsWith("__id")&&t.endsWith("__")}static extractNumericId(t){return _e.fromString(t.substring(4,t.length-2))}}class H extends Kt{construct(t,e,n){return new H(t,e,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...t){const e=[];for(const n of t){if(n.indexOf("//")>=0)throw new C(S.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);e.push(...n.split("/").filter((s=>s.length>0)))}return new H(e)}static emptyPath(){return new H([])}}const Rf=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class at extends Kt{construct(t,e,n){return new at(t,e,n)}static isValidIdentifier(t){return Rf.test(t)}canonicalString(){return this.toArray().map((t=>(t=t.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),at.isValidIdentifier(t)||(t="`"+t+"`"),t))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Ou}static keyField(){return new at([Ou])}static fromServerFormat(t){const e=[];let n="",s=0;const i=()=>{if(n.length===0)throw new C(S.INVALID_ARGUMENT,`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);e.push(n),n=""};let a=!1;for(;s<t.length;){const u=t[s];if(u==="\\"){if(s+1===t.length)throw new C(S.INVALID_ARGUMENT,"Path has trailing escape character: "+t);const l=t[s+1];if(l!=="\\"&&l!=="."&&l!=="`")throw new C(S.INVALID_ARGUMENT,"Path has invalid escape sequence: "+t);n+=l,s+=2}else u==="`"?(a=!a,s++):u!=="."||a?(n+=u,s++):(i(),s++)}if(i(),a)throw new C(S.INVALID_ARGUMENT,"Unterminated ` in path: "+t);return new at(e)}static emptyPath(){return new at([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class N{constructor(t){this.path=t}static fromPath(t){return new N(H.fromString(t))}static fromName(t){return new N(H.fromString(t).popFirst(5))}static empty(){return new N(H.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(t){return this.path.length>=2&&this.path.get(this.path.length-2)===t}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(t){return t!==null&&H.comparator(this.path,t.path)===0}toString(){return this.path.toString()}static comparator(t,e){return H.comparator(t.path,e.path)}static isDocumentKey(t){return t.length%2==0}static fromSegments(t){return new N(new H(t.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ml(r,t,e){if(!e)throw new C(S.INVALID_ARGUMENT,`Function ${r}() cannot be called with an empty ${t}.`)}function Vf(r,t,e,n){if(t===!0&&n===!0)throw new C(S.INVALID_ARGUMENT,`${r} and ${e} cannot be used together.`)}function Fu(r){if(!N.isDocumentKey(r))throw new C(S.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${r} has ${r.length}.`)}function Lu(r){if(N.isDocumentKey(r))throw new C(S.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${r} has ${r.length}.`)}function gl(r){return typeof r=="object"&&r!==null&&(Object.getPrototypeOf(r)===Object.prototype||Object.getPrototypeOf(r)===null)}function ei(r){if(r===void 0)return"undefined";if(r===null)return"null";if(typeof r=="string")return r.length>20&&(r=`${r.substring(0,20)}...`),JSON.stringify(r);if(typeof r=="number"||typeof r=="boolean")return""+r;if(typeof r=="object"){if(r instanceof Array)return"an array";{const t=(function(n){return n.constructor?n.constructor.name:null})(r);return t?`a custom ${t} object`:"an object"}}return typeof r=="function"?"a function":O(12329,{type:typeof r})}function Pt(r,t){if("_delegate"in r&&(r=r._delegate),!(r instanceof t)){if(t.name===r.constructor.name)throw new C(S.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const e=ei(r);throw new C(S.INVALID_ARGUMENT,`Expected type '${t.name}', but it was: ${e}`)}}return r}function Sf(r,t){if(t<=0)throw new C(S.INVALID_ARGUMENT,`Function ${r}() requires a positive number, but it was: ${t}.`)}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ft(r,t){const e={typeString:r};return t&&(e.value=t),e}function zr(r,t){if(!gl(r))throw new C(S.INVALID_ARGUMENT,"JSON must be an object");let e;for(const n in t)if(t[n]){const s=t[n].typeString,i="value"in t[n]?{value:t[n].value}:void 0;if(!(n in r)){e=`JSON missing required field: '${n}'`;break}const a=r[n];if(s&&typeof a!==s){e=`JSON field '${n}' must be a ${s}.`;break}if(i!==void 0&&a!==i.value){e=`Expected '${n}' field to equal '${i.value}'`;break}}if(e)throw new C(S.INVALID_ARGUMENT,e);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Uu=-62135596800,Bu=1e6;class Y{static now(){return Y.fromMillis(Date.now())}static fromDate(t){return Y.fromMillis(t.getTime())}static fromMillis(t){const e=Math.floor(t/1e3),n=Math.floor((t-1e3*e)*Bu);return new Y(e,n)}constructor(t,e){if(this.seconds=t,this.nanoseconds=e,e<0)throw new C(S.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(e>=1e9)throw new C(S.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+e);if(t<Uu)throw new C(S.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t);if(t>=253402300800)throw new C(S.INVALID_ARGUMENT,"Timestamp seconds out of range: "+t)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Bu}_compareTo(t){return this.seconds===t.seconds?B(this.nanoseconds,t.nanoseconds):B(this.seconds,t.seconds)}isEqual(t){return t.seconds===this.seconds&&t.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:Y._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(t){if(zr(t,Y._jsonSchema))return new Y(t.seconds,t.nanoseconds)}valueOf(){const t=this.seconds-Uu;return String(t).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}Y._jsonSchemaVersion="firestore/timestamp/1.0",Y._jsonSchema={type:ft("string",Y._jsonSchemaVersion),seconds:ft("number"),nanoseconds:ft("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class U{static fromTimestamp(t){return new U(t)}static min(){return new U(new Y(0,0))}static max(){return new U(new Y(253402300799,999999999))}constructor(t){this.timestamp=t}compareTo(t){return this.timestamp._compareTo(t.timestamp)}isEqual(t){return this.timestamp.isEqual(t.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const En=-1;class Os{constructor(t,e,n,s){this.indexId=t,this.collectionGroup=e,this.fields=n,this.indexState=s}}function oo(r){return r.fields.find((t=>t.kind===2))}function Oe(r){return r.fields.filter((t=>t.kind!==2))}Os.UNKNOWN_ID=-1;class As{constructor(t,e){this.fieldPath=t,this.kind=e}}class Pr{constructor(t,e){this.sequenceNumber=t,this.offset=e}static empty(){return new Pr(0,Lt.min())}}function pl(r,t){const e=r.toTimestamp().seconds,n=r.toTimestamp().nanoseconds+1,s=U.fromTimestamp(n===1e9?new Y(e+1,0):new Y(e,n));return new Lt(s,N.empty(),t)}function _l(r){return new Lt(r.readTime,r.key,En)}class Lt{constructor(t,e,n){this.readTime=t,this.documentKey=e,this.largestBatchId=n}static min(){return new Lt(U.min(),N.empty(),En)}static max(){return new Lt(U.max(),N.empty(),En)}}function No(r,t){let e=r.readTime.compareTo(t.readTime);return e!==0?e:(e=N.comparator(r.documentKey,t.documentKey),e!==0?e:B(r.largestBatchId,t.largestBatchId))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yl="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class Il{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(t){this.onCommittedListeners.push(t)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach((t=>t()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Re(r){if(r.code!==S.FAILED_PRECONDITION||r.message!==yl)throw r;b("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class v{constructor(t){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,t((e=>{this.isDone=!0,this.result=e,this.nextCallback&&this.nextCallback(e)}),(e=>{this.isDone=!0,this.error=e,this.catchCallback&&this.catchCallback(e)}))}catch(t){return this.next(void 0,t)}next(t,e){return this.callbackAttached&&O(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(e,this.error):this.wrapSuccess(t,this.result):new v(((n,s)=>{this.nextCallback=i=>{this.wrapSuccess(t,i).next(n,s)},this.catchCallback=i=>{this.wrapFailure(e,i).next(n,s)}}))}toPromise(){return new Promise(((t,e)=>{this.next(t,e)}))}wrapUserFunction(t){try{const e=t();return e instanceof v?e:v.resolve(e)}catch(e){return v.reject(e)}}wrapSuccess(t,e){return t?this.wrapUserFunction((()=>t(e))):v.resolve(e)}wrapFailure(t,e){return t?this.wrapUserFunction((()=>t(e))):v.reject(e)}static resolve(t){return new v(((e,n)=>{e(t)}))}static reject(t){return new v(((e,n)=>{n(t)}))}static waitFor(t){return new v(((e,n)=>{let s=0,i=0,a=!1;t.forEach((u=>{++s,u.next((()=>{++i,a&&i===s&&e()}),(l=>n(l)))})),a=!0,i===s&&e()}))}static or(t){let e=v.resolve(!1);for(const n of t)e=e.next((s=>s?v.resolve(s):n()));return e}static forEach(t,e){const n=[];return t.forEach(((s,i)=>{n.push(e.call(this,s,i))})),this.waitFor(n)}static mapArray(t,e){return new v(((n,s)=>{const i=t.length,a=new Array(i);let u=0;for(let l=0;l<i;l++){const d=l;e(t[d]).next((f=>{a[d]=f,++u,u===i&&n(a)}),(f=>s(f)))}}))}static doWhile(t,e){return new v(((n,s)=>{const i=()=>{t()===!0?e().next((()=>{i()}),s):n()};i()}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Nt="SimpleDb";class ni{static open(t,e,n,s){try{return new ni(e,t.transaction(s,n))}catch(i){throw new Ir(e,i)}}constructor(t,e){this.action=t,this.transaction=e,this.aborted=!1,this.S=new Bt,this.transaction.oncomplete=()=>{this.S.resolve()},this.transaction.onabort=()=>{e.error?this.S.reject(new Ir(t,e.error)):this.S.resolve()},this.transaction.onerror=n=>{const s=ko(n.target.error);this.S.reject(new Ir(t,s))}}get D(){return this.S.promise}abort(t){t&&this.S.reject(t),this.aborted||(b(Nt,"Aborting transaction:",t?t.message:"Client-initiated abort"),this.aborted=!0,this.transaction.abort())}C(){const t=this.transaction;this.aborted||typeof t.commit!="function"||t.commit()}store(t){const e=this.transaction.objectStore(t);return new bf(e)}}class ye{static delete(t){return b(Nt,"Removing database:",t),Le(lf().indexedDB.deleteDatabase(t)).toPromise()}static v(){if(!hf())return!1;if(ye.F())return!0;const t=Ms(),e=ye.M(t),n=0<e&&e<10,s=Tl(t),i=0<s&&s<4.5;return!(t.indexOf("MSIE ")>0||t.indexOf("Trident/")>0||t.indexOf("Edge/")>0||n||i)}static F(){var t;return typeof process<"u"&&((t=process.__PRIVATE_env)==null?void 0:t.__PRIVATE_USE_MOCK_PERSISTENCE)==="YES"}static O(t,e){return t.store(e)}static M(t){const e=t.match(/i(?:phone|pad|pod) os ([\d_]+)/i),n=e?e[1].split("_").slice(0,2).join("."):"-1";return Number(n)}constructor(t,e,n){this.name=t,this.version=e,this.N=n,this.B=null,ye.M(Ms())===12.2&&lt("Firestore persistence suffers from a bug in iOS 12.2 Safari that may cause your app to stop working. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.")}async L(t){return this.db||(b(Nt,"Opening database:",this.name),this.db=await new Promise(((e,n)=>{const s=indexedDB.open(this.name,this.version);s.onsuccess=i=>{const a=i.target.result;e(a)},s.onblocked=()=>{n(new Ir(t,"Cannot upgrade IndexedDB schema while another tab is open. Close all tabs that access Firestore and reload this page to proceed."))},s.onerror=i=>{const a=i.target.error;a.name==="VersionError"?n(new C(S.FAILED_PRECONDITION,"A newer version of the Firestore SDK was previously used and so the persisted data is not compatible with the version of the SDK you are now using. The SDK will operate with persistence disabled. If you need persistence, please re-upgrade to a newer version of the SDK or else clear the persisted IndexedDB data for your app to start fresh.")):a.name==="InvalidStateError"?n(new C(S.FAILED_PRECONDITION,"Unable to open an IndexedDB connection. This could be due to running in a private browsing session on a browser whose private browsing sessions do not support IndexedDB: "+a)):n(new Ir(t,a))},s.onupgradeneeded=i=>{b(Nt,'Database "'+this.name+'" requires upgrade from version:',i.oldVersion);const a=i.target.result;this.N.k(a,s.transaction,i.oldVersion,this.version).next((()=>{b(Nt,"Database upgrade to version "+this.version+" complete")}))}}))),this.q&&(this.db.onversionchange=e=>this.q(e)),this.db}K(t){this.q=t,this.db&&(this.db.onversionchange=e=>t(e))}async runTransaction(t,e,n,s){const i=e==="readonly";let a=0;for(;;){++a;try{this.db=await this.L(t);const u=ni.open(this.db,t,i?"readonly":"readwrite",n),l=s(u).next((d=>(u.C(),d))).catch((d=>(u.abort(d),v.reject(d)))).toPromise();return l.catch((()=>{})),await u.D,l}catch(u){const l=u,d=l.name!=="FirebaseError"&&a<3;if(b(Nt,"Transaction failed with error:",l.message,"Retrying:",d),this.close(),!d)return Promise.reject(l)}}}close(){this.db&&this.db.close(),this.db=void 0}}function Tl(r){const t=r.match(/Android ([\d.]+)/i),e=t?t[1].split(".").slice(0,2).join("."):"-1";return Number(e)}class Pf{constructor(t){this.U=t,this.$=!1,this.W=null}get isDone(){return this.$}get G(){return this.W}set cursor(t){this.U=t}done(){this.$=!0}j(t){this.W=t}delete(){return Le(this.U.delete())}}class Ir extends C{constructor(t,e){super(S.UNAVAILABLE,`IndexedDB transaction '${t}' failed: ${e}`),this.name="IndexedDbTransactionError"}}function Ve(r){return r.name==="IndexedDbTransactionError"}class bf{constructor(t){this.store=t}put(t,e){let n;return e!==void 0?(b(Nt,"PUT",this.store.name,t,e),n=this.store.put(e,t)):(b(Nt,"PUT",this.store.name,"<auto-key>",t),n=this.store.put(t)),Le(n)}add(t){return b(Nt,"ADD",this.store.name,t,t),Le(this.store.add(t))}get(t){return Le(this.store.get(t)).next((e=>(e===void 0&&(e=null),b(Nt,"GET",this.store.name,t,e),e)))}delete(t){return b(Nt,"DELETE",this.store.name,t),Le(this.store.delete(t))}count(){return b(Nt,"COUNT",this.store.name),Le(this.store.count())}J(t,e){const n=this.options(t,e),s=n.index?this.store.index(n.index):this.store;if(typeof s.getAll=="function"){const i=s.getAll(n.range);return new v(((a,u)=>{i.onerror=l=>{u(l.target.error)},i.onsuccess=l=>{a(l.target.result)}}))}{const i=this.cursor(n),a=[];return this.H(i,((u,l)=>{a.push(l)})).next((()=>a))}}Z(t,e){const n=this.store.getAll(t,e===null?void 0:e);return new v(((s,i)=>{n.onerror=a=>{i(a.target.error)},n.onsuccess=a=>{s(a.target.result)}}))}X(t,e){b(Nt,"DELETE ALL",this.store.name);const n=this.options(t,e);n.Y=!1;const s=this.cursor(n);return this.H(s,((i,a,u)=>u.delete()))}ee(t,e){let n;e?n=t:(n={},e=t);const s=this.cursor(n);return this.H(s,e)}te(t){const e=this.cursor({});return new v(((n,s)=>{e.onerror=i=>{const a=ko(i.target.error);s(a)},e.onsuccess=i=>{const a=i.target.result;a?t(a.primaryKey,a.value).next((u=>{u?a.continue():n()})):n()}}))}H(t,e){const n=[];return new v(((s,i)=>{t.onerror=a=>{i(a.target.error)},t.onsuccess=a=>{const u=a.target.result;if(!u)return void s();const l=new Pf(u),d=e(u.primaryKey,u.value,l);if(d instanceof v){const f=d.catch((g=>(l.done(),v.reject(g))));n.push(f)}l.isDone?s():l.G===null?u.continue():u.continue(l.G)}})).next((()=>v.waitFor(n)))}options(t,e){let n;return t!==void 0&&(typeof t=="string"?n=t:e=t),{index:n,range:e}}cursor(t){let e="next";if(t.reverse&&(e="prev"),t.index){const n=this.store.index(t.index);return t.Y?n.openKeyCursor(t.range,e):n.openCursor(t.range,e)}return this.store.openCursor(t.range,e)}}function Le(r){return new v(((t,e)=>{r.onsuccess=n=>{const s=n.target.result;t(s)},r.onerror=n=>{const s=ko(n.target.error);e(s)}}))}let qu=!1;function ko(r){const t=ye.M(Ms());if(t>=12.2&&t<13){const e="An internal error was encountered in the Indexed Database server";if(r.message.indexOf(e)>=0){const n=new C("internal",`IOS_INDEXEDDB_BUG1: IndexedDb has thrown '${e}'. This is likely due to an unavoidable bug in iOS. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.`);return qu||(qu=!0,setTimeout((()=>{throw n}),0)),n}}return r}const Tr="IndexBackfiller";class Cf{constructor(t,e){this.asyncQueue=t,this.ne=e,this.task=null}start(){this.re(15e3)}stop(){this.task&&(this.task.cancel(),this.task=null)}get started(){return this.task!==null}re(t){b(Tr,`Scheduled in ${t}ms`),this.task=this.asyncQueue.enqueueAfterDelay("index_backfill",t,(async()=>{this.task=null;try{const e=await this.ne.ie();b(Tr,`Documents written: ${e}`)}catch(e){Ve(e)?b(Tr,"Ignoring IndexedDB error during index backfill: ",e):await Re(e)}await this.re(6e4)}))}}class Df{constructor(t,e){this.localStore=t,this.persistence=e}async ie(t=50){return this.persistence.runTransaction("Backfill Indexes","readwrite-primary",(e=>this.se(e,t)))}se(t,e){const n=new Set;let s=e,i=!0;return v.doWhile((()=>i===!0&&s>0),(()=>this.localStore.indexManager.getNextCollectionGroupToUpdate(t).next((a=>{if(a!==null&&!n.has(a))return b(Tr,`Processing collection: ${a}`),this.oe(t,a,s).next((u=>{s-=u,n.add(a)}));i=!1})))).next((()=>e-s))}oe(t,e,n){return this.localStore.indexManager.getMinOffsetFromCollectionGroup(t,e).next((s=>this.localStore.localDocuments.getNextDocuments(t,e,s,n).next((i=>{const a=i.changes;return this.localStore.indexManager.updateIndexEntries(t,a).next((()=>this._e(s,i))).next((u=>(b(Tr,`Updating offset: ${u}`),this.localStore.indexManager.updateCollectionGroup(t,e,u)))).next((()=>a.size))}))))}_e(t,e){let n=t;return e.changes.forEach(((s,i)=>{const a=_l(i);No(a,n)>0&&(n=a)})),new Lt(n.readTime,n.documentKey,Math.max(e.batchId,t.largestBatchId))}}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ct{constructor(t,e){this.previousValue=t,e&&(e.sequenceNumberHandler=n=>this.ae(n),this.ue=n=>e.writeSequenceNumber(n))}ae(t){return this.previousValue=Math.max(t,this.previousValue),this.previousValue}next(){const t=++this.previousValue;return this.ue&&this.ue(t),t}}Ct.ce=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ze=-1;function Gr(r){return r==null}function br(r){return r===0&&1/r==-1/0}function El(r){return typeof r=="number"&&Number.isInteger(r)&&!br(r)&&r<=Number.MAX_SAFE_INTEGER&&r>=Number.MIN_SAFE_INTEGER}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fs="";function Rt(r){let t="";for(let e=0;e<r.length;e++)t.length>0&&(t=ju(t)),t=xf(r.get(e),t);return ju(t)}function xf(r,t){let e=t;const n=r.length;for(let s=0;s<n;s++){const i=r.charAt(s);switch(i){case"\0":e+="";break;case Fs:e+="";break;default:e+=i}}return e}function ju(r){return r+Fs+""}function Qt(r){const t=r.length;if(L(t>=2,64408,{path:r}),t===2)return L(r.charAt(0)===Fs&&r.charAt(1)==="",56145,{path:r}),H.emptyPath();const e=t-2,n=[];let s="";for(let i=0;i<t;){const a=r.indexOf(Fs,i);switch((a<0||a>e)&&O(50515,{path:r}),r.charAt(a+1)){case"":const u=r.substring(i,a);let l;s.length===0?l=u:(s+=u,l=s,s=""),n.push(l);break;case"":s+=r.substring(i,a),s+="\0";break;case"":s+=r.substring(i,a+1);break;default:O(61167,{path:r})}i=a+2}return new H(n)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fe="remoteDocuments",Kr="owner",sn="owner",Cr="mutationQueues",Nf="userId",Ut="mutations",zu="batchId",je="userMutationsIndex",Gu=["userId","batchId"];/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Rs(r,t){return[r,Rt(t)]}function wl(r,t,e){return[r,Rt(t),e]}const kf={},wn="documentMutations",Ls="remoteDocumentsV14",Mf=["prefixPath","collectionGroup","readTime","documentId"],Vs="documentKeyIndex",Of=["prefixPath","collectionGroup","documentId"],vl="collectionGroupIndex",Ff=["collectionGroup","readTime","prefixPath","documentId"],Dr="remoteDocumentGlobal",ao="remoteDocumentGlobalKey",vn="targets",Al="queryTargetsIndex",Lf=["canonicalId","targetId"],An="targetDocuments",Uf=["targetId","path"],Mo="documentTargetsIndex",Bf=["path","targetId"],Us="targetGlobalKey",Ge="targetGlobal",xr="collectionParents",qf=["collectionId","parent"],Rn="clientMetadata",jf="clientId",ri="bundles",zf="bundleId",si="namedQueries",Gf="name",Oo="indexConfiguration",Kf="indexId",uo="collectionGroupIndex",$f="collectionGroup",Er="indexState",Qf=["indexId","uid"],Rl="sequenceNumberIndex",Wf=["uid","sequenceNumber"],wr="indexEntries",Hf=["indexId","uid","arrayValue","directionalValue","orderedDocumentKey","documentKey"],Vl="documentKeyIndex",Jf=["indexId","uid","orderedDocumentKey"],ii="documentOverlays",Yf=["userId","collectionPath","documentId"],co="collectionPathOverlayIndex",Xf=["userId","collectionPath","largestBatchId"],Sl="collectionGroupOverlayIndex",Zf=["userId","collectionGroup","largestBatchId"],Fo="globals",tm="name",Pl=[Cr,Ut,wn,Fe,vn,Kr,Ge,An,Rn,Dr,xr,ri,si],em=[...Pl,ii],bl=[Cr,Ut,wn,Ls,vn,Kr,Ge,An,Rn,Dr,xr,ri,si,ii],Cl=bl,Lo=[...Cl,Oo,Er,wr],nm=Lo,Dl=[...Lo,Fo],rm=Dl;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lo extends Il{constructor(t,e){super(),this.le=t,this.currentSequenceNumber=e}}function gt(r,t){const e=F(r);return ye.O(e.le,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ku(r){let t=0;for(const e in r)Object.prototype.hasOwnProperty.call(r,e)&&t++;return t}function Se(r,t){for(const e in r)Object.prototype.hasOwnProperty.call(r,e)&&t(e,r[e])}function xl(r){for(const t in r)if(Object.prototype.hasOwnProperty.call(r,t))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class et{constructor(t,e){this.comparator=t,this.root=e||It.EMPTY}insert(t,e){return new et(this.comparator,this.root.insert(t,e,this.comparator).copy(null,null,It.BLACK,null,null))}remove(t){return new et(this.comparator,this.root.remove(t,this.comparator).copy(null,null,It.BLACK,null,null))}get(t){let e=this.root;for(;!e.isEmpty();){const n=this.comparator(t,e.key);if(n===0)return e.value;n<0?e=e.left:n>0&&(e=e.right)}return null}indexOf(t){let e=0,n=this.root;for(;!n.isEmpty();){const s=this.comparator(t,n.key);if(s===0)return e+n.left.size;s<0?n=n.left:(e+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(t){return this.root.inorderTraversal(t)}forEach(t){this.inorderTraversal(((e,n)=>(t(e,n),!1)))}toString(){const t=[];return this.inorderTraversal(((e,n)=>(t.push(`${e}:${n}`),!1))),`{${t.join(", ")}}`}reverseTraversal(t){return this.root.reverseTraversal(t)}getIterator(){return new _s(this.root,null,this.comparator,!1)}getIteratorFrom(t){return new _s(this.root,t,this.comparator,!1)}getReverseIterator(){return new _s(this.root,null,this.comparator,!0)}getReverseIteratorFrom(t){return new _s(this.root,t,this.comparator,!0)}}class _s{constructor(t,e,n,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!t.isEmpty();)if(i=e?n(t.key,e):1,e&&s&&(i*=-1),i<0)t=this.isReverse?t.left:t.right;else{if(i===0){this.nodeStack.push(t);break}this.nodeStack.push(t),t=this.isReverse?t.right:t.left}}getNext(){let t=this.nodeStack.pop();const e={key:t.key,value:t.value};if(this.isReverse)for(t=t.left;!t.isEmpty();)this.nodeStack.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack.push(t),t=t.left;return e}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const t=this.nodeStack[this.nodeStack.length-1];return{key:t.key,value:t.value}}}class It{constructor(t,e,n,s,i){this.key=t,this.value=e,this.color=n??It.RED,this.left=s??It.EMPTY,this.right=i??It.EMPTY,this.size=this.left.size+1+this.right.size}copy(t,e,n,s,i){return new It(t??this.key,e??this.value,n??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(t){return this.left.inorderTraversal(t)||t(this.key,this.value)||this.right.inorderTraversal(t)}reverseTraversal(t){return this.right.reverseTraversal(t)||t(this.key,this.value)||this.left.reverseTraversal(t)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(t,e,n){let s=this;const i=n(t,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(t,e,n),null):i===0?s.copy(null,e,null,null,null):s.copy(null,null,null,null,s.right.insert(t,e,n)),s.fixUp()}removeMin(){if(this.left.isEmpty())return It.EMPTY;let t=this;return t.left.isRed()||t.left.left.isRed()||(t=t.moveRedLeft()),t=t.copy(null,null,null,t.left.removeMin(),null),t.fixUp()}remove(t,e){let n,s=this;if(e(t,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(t,e),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),e(t,s.key)===0){if(s.right.isEmpty())return It.EMPTY;n=s.right.min(),s=s.copy(n.key,n.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(t,e))}return s.fixUp()}isRed(){return this.color}fixUp(){let t=this;return t.right.isRed()&&!t.left.isRed()&&(t=t.rotateLeft()),t.left.isRed()&&t.left.left.isRed()&&(t=t.rotateRight()),t.left.isRed()&&t.right.isRed()&&(t=t.colorFlip()),t}moveRedLeft(){let t=this.colorFlip();return t.right.left.isRed()&&(t=t.copy(null,null,null,null,t.right.rotateRight()),t=t.rotateLeft(),t=t.colorFlip()),t}moveRedRight(){let t=this.colorFlip();return t.left.left.isRed()&&(t=t.rotateRight(),t=t.colorFlip()),t}rotateLeft(){const t=this.copy(null,null,It.RED,null,this.right.left);return this.right.copy(null,null,this.color,t,null)}rotateRight(){const t=this.copy(null,null,It.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,t)}colorFlip(){const t=this.left.copy(null,null,!this.left.color,null,null),e=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,t,e)}checkMaxDepth(){const t=this.check();return Math.pow(2,t)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw O(43730,{key:this.key,value:this.value});if(this.right.isRed())throw O(14113,{key:this.key,value:this.value});const t=this.left.check();if(t!==this.right.check())throw O(27949);return t+(this.isRed()?0:1)}}It.EMPTY=null,It.RED=!0,It.BLACK=!1;It.EMPTY=new class{constructor(){this.size=0}get key(){throw O(57766)}get value(){throw O(16141)}get color(){throw O(16727)}get left(){throw O(29726)}get right(){throw O(36894)}copy(t,e,n,s,i){return this}insert(t,e,n){return new It(t,e)}remove(t,e){return this}isEmpty(){return!0}inorderTraversal(t){return!1}reverseTraversal(t){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Z{constructor(t){this.comparator=t,this.data=new et(this.comparator)}has(t){return this.data.get(t)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(t){return this.data.indexOf(t)}forEach(t){this.data.inorderTraversal(((e,n)=>(t(e),!1)))}forEachInRange(t,e){const n=this.data.getIteratorFrom(t[0]);for(;n.hasNext();){const s=n.getNext();if(this.comparator(s.key,t[1])>=0)return;e(s.key)}}forEachWhile(t,e){let n;for(n=e!==void 0?this.data.getIteratorFrom(e):this.data.getIterator();n.hasNext();)if(!t(n.getNext().key))return}firstAfterOrEqual(t){const e=this.data.getIteratorFrom(t);return e.hasNext()?e.getNext().key:null}getIterator(){return new $u(this.data.getIterator())}getIteratorFrom(t){return new $u(this.data.getIteratorFrom(t))}add(t){return this.copy(this.data.remove(t).insert(t,!0))}delete(t){return this.has(t)?this.copy(this.data.remove(t)):this}isEmpty(){return this.data.isEmpty()}unionWith(t){let e=this;return e.size<t.size&&(e=t,t=this),t.forEach((n=>{e=e.add(n)})),e}isEqual(t){if(!(t instanceof Z)||this.size!==t.size)return!1;const e=this.data.getIterator(),n=t.data.getIterator();for(;e.hasNext();){const s=e.getNext().key,i=n.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){const t=[];return this.forEach((e=>{t.push(e)})),t}toString(){const t=[];return this.forEach((e=>t.push(e))),"SortedSet("+t.toString()+")"}copy(t){const e=new Z(this.comparator);return e.data=t,e}}class $u{constructor(t){this.iter=t}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}function on(r){return r.hasNext()?r.getNext():void 0}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dt{constructor(t){this.fields=t,t.sort(at.comparator)}static empty(){return new Dt([])}unionWith(t){let e=new Z(at.comparator);for(const n of this.fields)e=e.add(n);for(const n of t)e=e.add(n);return new Dt(e.toArray())}covers(t){for(const e of this.fields)if(e.isPrefixOf(t))return!0;return!1}isEqual(t){return Tn(this.fields,t.fields,((e,n)=>e.isEqual(n)))}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nl extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ht{constructor(t){this.binaryString=t}static fromBase64String(t){const e=(function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new Nl("Invalid base64 string: "+i):i}})(t);return new ht(e)}static fromUint8Array(t){const e=(function(s){let i="";for(let a=0;a<s.length;++a)i+=String.fromCharCode(s[a]);return i})(t);return new ht(e)}[Symbol.iterator](){let t=0;return{next:()=>t<this.binaryString.length?{value:this.binaryString.charCodeAt(t++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(e){return btoa(e)})(this.binaryString)}toUint8Array(){return(function(e){const n=new Uint8Array(e.length);for(let s=0;s<e.length;s++)n[s]=e.charCodeAt(s);return n})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(t){return B(this.binaryString,t.binaryString)}isEqual(t){return this.binaryString===t.binaryString}}ht.EMPTY_BYTE_STRING=new ht("");const sm=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function te(r){if(L(!!r,39018),typeof r=="string"){let t=0;const e=sm.exec(r);if(L(!!e,46558,{timestamp:r}),e[1]){let s=e[1];s=(s+"000000000").substr(0,9),t=Number(s)}const n=new Date(r);return{seconds:Math.floor(n.getTime()/1e3),nanos:t}}return{seconds:st(r.seconds),nanos:st(r.nanos)}}function st(r){return typeof r=="number"?r:typeof r=="string"?Number(r):0}function ee(r){return typeof r=="string"?ht.fromBase64String(r):ht.fromUint8Array(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kl="server_timestamp",Ml="__type__",Ol="__previous_value__",Fl="__local_write_time__";function Uo(r){var e,n;return((n=(((e=r==null?void 0:r.mapValue)==null?void 0:e.fields)||{})[Ml])==null?void 0:n.stringValue)===kl}function oi(r){const t=r.mapValue.fields[Ol];return Uo(t)?oi(t):t}function Nr(r){const t=te(r.mapValue.fields[Fl].timestampValue);return new Y(t.seconds,t.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class im{constructor(t,e,n,s,i,a,u,l,d,f,g){this.databaseId=t,this.appId=e,this.persistenceKey=n,this.host=s,this.ssl=i,this.forceLongPolling=a,this.autoDetectLongPolling=u,this.longPollingOptions=l,this.useFetchStreams=d,this.isUsingEmulator=f,this.apiKey=g}}const Bs="(default)";class Qe{constructor(t,e){this.projectId=t,this.database=e||Bs}static empty(){return new Qe("","")}get isDefaultDatabase(){return this.database===Bs}isEqual(t){return t instanceof Qe&&t.projectId===this.projectId&&t.database===this.database}}function om(r,t){if(!Object.prototype.hasOwnProperty.apply(r.options,["projectId"]))throw new C(S.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Qe(r.options.projectId,t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bo="__type__",Ll="__max__",ge={mapValue:{fields:{__type__:{stringValue:Ll}}}},qo="__vector__",Vn="value",Ss={nullValue:"NULL_VALUE"};function Ee(r){return"nullValue"in r?0:"booleanValue"in r?1:"integerValue"in r||"doubleValue"in r?2:"timestampValue"in r?3:"stringValue"in r?5:"bytesValue"in r?6:"referenceValue"in r?7:"geoPointValue"in r?8:"arrayValue"in r?9:"mapValue"in r?Uo(r)?4:Ul(r)?9007199254740991:ai(r)?10:11:O(28295,{value:r})}function Jt(r,t){if(r===t)return!0;const e=Ee(r);if(e!==Ee(t))return!1;switch(e){case 0:case 9007199254740991:return!0;case 1:return r.booleanValue===t.booleanValue;case 4:return Nr(r).isEqual(Nr(t));case 3:return(function(s,i){if(typeof s.timestampValue=="string"&&typeof i.timestampValue=="string"&&s.timestampValue.length===i.timestampValue.length)return s.timestampValue===i.timestampValue;const a=te(s.timestampValue),u=te(i.timestampValue);return a.seconds===u.seconds&&a.nanos===u.nanos})(r,t);case 5:return r.stringValue===t.stringValue;case 6:return(function(s,i){return ee(s.bytesValue).isEqual(ee(i.bytesValue))})(r,t);case 7:return r.referenceValue===t.referenceValue;case 8:return(function(s,i){return st(s.geoPointValue.latitude)===st(i.geoPointValue.latitude)&&st(s.geoPointValue.longitude)===st(i.geoPointValue.longitude)})(r,t);case 2:return(function(s,i){if("integerValue"in s&&"integerValue"in i)return st(s.integerValue)===st(i.integerValue);if("doubleValue"in s&&"doubleValue"in i){const a=st(s.doubleValue),u=st(i.doubleValue);return a===u?br(a)===br(u):isNaN(a)&&isNaN(u)}return!1})(r,t);case 9:return Tn(r.arrayValue.values||[],t.arrayValue.values||[],Jt);case 10:case 11:return(function(s,i){const a=s.mapValue.fields||{},u=i.mapValue.fields||{};if(Ku(a)!==Ku(u))return!1;for(const l in a)if(a.hasOwnProperty(l)&&(u[l]===void 0||!Jt(a[l],u[l])))return!1;return!0})(r,t);default:return O(52216,{left:r})}}function kr(r,t){return(r.values||[]).find((e=>Jt(e,t)))!==void 0}function we(r,t){if(r===t)return 0;const e=Ee(r),n=Ee(t);if(e!==n)return B(e,n);switch(e){case 0:case 9007199254740991:return 0;case 1:return B(r.booleanValue,t.booleanValue);case 2:return(function(i,a){const u=st(i.integerValue||i.doubleValue),l=st(a.integerValue||a.doubleValue);return u<l?-1:u>l?1:u===l?0:isNaN(u)?isNaN(l)?0:-1:1})(r,t);case 3:return Qu(r.timestampValue,t.timestampValue);case 4:return Qu(Nr(r),Nr(t));case 5:return io(r.stringValue,t.stringValue);case 6:return(function(i,a){const u=ee(i),l=ee(a);return u.compareTo(l)})(r.bytesValue,t.bytesValue);case 7:return(function(i,a){const u=i.split("/"),l=a.split("/");for(let d=0;d<u.length&&d<l.length;d++){const f=B(u[d],l[d]);if(f!==0)return f}return B(u.length,l.length)})(r.referenceValue,t.referenceValue);case 8:return(function(i,a){const u=B(st(i.latitude),st(a.latitude));return u!==0?u:B(st(i.longitude),st(a.longitude))})(r.geoPointValue,t.geoPointValue);case 9:return Wu(r.arrayValue,t.arrayValue);case 10:return(function(i,a){var T,P,x,k;const u=i.fields||{},l=a.fields||{},d=(T=u[Vn])==null?void 0:T.arrayValue,f=(P=l[Vn])==null?void 0:P.arrayValue,g=B(((x=d==null?void 0:d.values)==null?void 0:x.length)||0,((k=f==null?void 0:f.values)==null?void 0:k.length)||0);return g!==0?g:Wu(d,f)})(r.mapValue,t.mapValue);case 11:return(function(i,a){if(i===ge.mapValue&&a===ge.mapValue)return 0;if(i===ge.mapValue)return 1;if(a===ge.mapValue)return-1;const u=i.fields||{},l=Object.keys(u),d=a.fields||{},f=Object.keys(d);l.sort(),f.sort();for(let g=0;g<l.length&&g<f.length;++g){const T=io(l[g],f[g]);if(T!==0)return T;const P=we(u[l[g]],d[f[g]]);if(P!==0)return P}return B(l.length,f.length)})(r.mapValue,t.mapValue);default:throw O(23264,{he:e})}}function Qu(r,t){if(typeof r=="string"&&typeof t=="string"&&r.length===t.length)return B(r,t);const e=te(r),n=te(t),s=B(e.seconds,n.seconds);return s!==0?s:B(e.nanos,n.nanos)}function Wu(r,t){const e=r.values||[],n=t.values||[];for(let s=0;s<e.length&&s<n.length;++s){const i=we(e[s],n[s]);if(i)return i}return B(e.length,n.length)}function Sn(r){return ho(r)}function ho(r){return"nullValue"in r?"null":"booleanValue"in r?""+r.booleanValue:"integerValue"in r?""+r.integerValue:"doubleValue"in r?""+r.doubleValue:"timestampValue"in r?(function(e){const n=te(e);return`time(${n.seconds},${n.nanos})`})(r.timestampValue):"stringValue"in r?r.stringValue:"bytesValue"in r?(function(e){return ee(e).toBase64()})(r.bytesValue):"referenceValue"in r?(function(e){return N.fromName(e).toString()})(r.referenceValue):"geoPointValue"in r?(function(e){return`geo(${e.latitude},${e.longitude})`})(r.geoPointValue):"arrayValue"in r?(function(e){let n="[",s=!0;for(const i of e.values||[])s?s=!1:n+=",",n+=ho(i);return n+"]"})(r.arrayValue):"mapValue"in r?(function(e){const n=Object.keys(e.fields||{}).sort();let s="{",i=!0;for(const a of n)i?i=!1:s+=",",s+=`${a}:${ho(e.fields[a])}`;return s+"}"})(r.mapValue):O(61005,{value:r})}function Ps(r){switch(Ee(r)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const t=oi(r);return t?16+Ps(t):16;case 5:return 2*r.stringValue.length;case 6:return ee(r.bytesValue).approximateByteSize();case 7:return r.referenceValue.length;case 9:return(function(n){return(n.values||[]).reduce(((s,i)=>s+Ps(i)),0)})(r.arrayValue);case 10:case 11:return(function(n){let s=0;return Se(n.fields,((i,a)=>{s+=i.length+Ps(a)})),s})(r.mapValue);default:throw O(13486,{value:r})}}function Mr(r,t){return{referenceValue:`projects/${r.projectId}/databases/${r.database}/documents/${t.path.canonicalString()}`}}function fo(r){return!!r&&"integerValue"in r}function Or(r){return!!r&&"arrayValue"in r}function Hu(r){return!!r&&"nullValue"in r}function Ju(r){return!!r&&"doubleValue"in r&&isNaN(Number(r.doubleValue))}function bs(r){return!!r&&"mapValue"in r}function ai(r){var e,n;return((n=(((e=r==null?void 0:r.mapValue)==null?void 0:e.fields)||{})[Bo])==null?void 0:n.stringValue)===qo}function vr(r){if(r.geoPointValue)return{geoPointValue:{...r.geoPointValue}};if(r.timestampValue&&typeof r.timestampValue=="object")return{timestampValue:{...r.timestampValue}};if(r.mapValue){const t={mapValue:{fields:{}}};return Se(r.mapValue.fields,((e,n)=>t.mapValue.fields[e]=vr(n))),t}if(r.arrayValue){const t={arrayValue:{values:[]}};for(let e=0;e<(r.arrayValue.values||[]).length;++e)t.arrayValue.values[e]=vr(r.arrayValue.values[e]);return t}return{...r}}function Ul(r){return(((r.mapValue||{}).fields||{}).__type__||{}).stringValue===Ll}const Bl={mapValue:{fields:{[Bo]:{stringValue:qo},[Vn]:{arrayValue:{}}}}};function am(r){return"nullValue"in r?Ss:"booleanValue"in r?{booleanValue:!1}:"integerValue"in r||"doubleValue"in r?{doubleValue:NaN}:"timestampValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"stringValue"in r?{stringValue:""}:"bytesValue"in r?{bytesValue:""}:"referenceValue"in r?Mr(Qe.empty(),N.empty()):"geoPointValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"arrayValue"in r?{arrayValue:{}}:"mapValue"in r?ai(r)?Bl:{mapValue:{}}:O(35942,{value:r})}function um(r){return"nullValue"in r?{booleanValue:!1}:"booleanValue"in r?{doubleValue:NaN}:"integerValue"in r||"doubleValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"timestampValue"in r?{stringValue:""}:"stringValue"in r?{bytesValue:""}:"bytesValue"in r?Mr(Qe.empty(),N.empty()):"referenceValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"geoPointValue"in r?{arrayValue:{}}:"arrayValue"in r?Bl:"mapValue"in r?ai(r)?{mapValue:{}}:ge:O(61959,{value:r})}function Yu(r,t){const e=we(r.value,t.value);return e!==0?e:r.inclusive&&!t.inclusive?-1:!r.inclusive&&t.inclusive?1:0}function Xu(r,t){const e=we(r.value,t.value);return e!==0?e:r.inclusive&&!t.inclusive?1:!r.inclusive&&t.inclusive?-1:0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tt{constructor(t){this.value=t}static empty(){return new Tt({mapValue:{}})}field(t){if(t.isEmpty())return this.value;{let e=this.value;for(let n=0;n<t.length-1;++n)if(e=(e.mapValue.fields||{})[t.get(n)],!bs(e))return null;return e=(e.mapValue.fields||{})[t.lastSegment()],e||null}}set(t,e){this.getFieldsMap(t.popLast())[t.lastSegment()]=vr(e)}setAll(t){let e=at.emptyPath(),n={},s=[];t.forEach(((a,u)=>{if(!e.isImmediateParentOf(u)){const l=this.getFieldsMap(e);this.applyChanges(l,n,s),n={},s=[],e=u.popLast()}a?n[u.lastSegment()]=vr(a):s.push(u.lastSegment())}));const i=this.getFieldsMap(e);this.applyChanges(i,n,s)}delete(t){const e=this.field(t.popLast());bs(e)&&e.mapValue.fields&&delete e.mapValue.fields[t.lastSegment()]}isEqual(t){return Jt(this.value,t.value)}getFieldsMap(t){let e=this.value;e.mapValue.fields||(e.mapValue={fields:{}});for(let n=0;n<t.length;++n){let s=e.mapValue.fields[t.get(n)];bs(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},e.mapValue.fields[t.get(n)]=s),e=s}return e.mapValue.fields}applyChanges(t,e,n){Se(e,((s,i)=>t[s]=i));for(const s of n)delete t[s]}clone(){return new Tt(vr(this.value))}}function ql(r){const t=[];return Se(r.fields,((e,n)=>{const s=new at([e]);if(bs(n)){const i=ql(n.mapValue).fields;if(i.length===0)t.push(s);else for(const a of i)t.push(s.child(a))}else t.push(s)})),new Dt(t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class it{constructor(t,e,n,s,i,a,u){this.key=t,this.documentType=e,this.version=n,this.readTime=s,this.createTime=i,this.data=a,this.documentState=u}static newInvalidDocument(t){return new it(t,0,U.min(),U.min(),U.min(),Tt.empty(),0)}static newFoundDocument(t,e,n,s){return new it(t,1,e,U.min(),n,s,0)}static newNoDocument(t,e){return new it(t,2,e,U.min(),U.min(),Tt.empty(),0)}static newUnknownDocument(t,e){return new it(t,3,e,U.min(),U.min(),Tt.empty(),2)}convertToFoundDocument(t,e){return!this.createTime.isEqual(U.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=t),this.version=t,this.documentType=1,this.data=e,this.documentState=0,this}convertToNoDocument(t){return this.version=t,this.documentType=2,this.data=Tt.empty(),this.documentState=0,this}convertToUnknownDocument(t){return this.version=t,this.documentType=3,this.data=Tt.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=U.min(),this}setReadTime(t){return this.readTime=t,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(t){return t instanceof it&&this.key.isEqual(t.key)&&this.version.isEqual(t.version)&&this.documentType===t.documentType&&this.documentState===t.documentState&&this.data.isEqual(t.data)}mutableCopy(){return new it(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pn{constructor(t,e){this.position=t,this.inclusive=e}}function Zu(r,t,e){let n=0;for(let s=0;s<r.position.length;s++){const i=t[s],a=r.position[s];if(i.field.isKeyField()?n=N.comparator(N.fromName(a.referenceValue),e.key):n=we(a,e.data.field(i.field)),i.dir==="desc"&&(n*=-1),n!==0)break}return n}function tc(r,t){if(r===null)return t===null;if(t===null||r.inclusive!==t.inclusive||r.position.length!==t.position.length)return!1;for(let e=0;e<r.position.length;e++)if(!Jt(r.position[e],t.position[e]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fr{constructor(t,e="asc"){this.field=t,this.dir=e}}function cm(r,t){return r.dir===t.dir&&r.field.isEqual(t.field)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jl{}class K extends jl{constructor(t,e,n){super(),this.field=t,this.op=e,this.value=n}static create(t,e,n){return t.isKeyField()?e==="in"||e==="not-in"?this.createKeyFieldInFilter(t,e,n):new lm(t,e,n):e==="array-contains"?new fm(t,n):e==="in"?new Wl(t,n):e==="not-in"?new mm(t,n):e==="array-contains-any"?new gm(t,n):new K(t,e,n)}static createKeyFieldInFilter(t,e,n){return e==="in"?new hm(t,n):new dm(t,n)}matches(t){const e=t.data.field(this.field);return this.op==="!="?e!==null&&e.nullValue===void 0&&this.matchesComparison(we(e,this.value)):e!==null&&Ee(this.value)===Ee(e)&&this.matchesComparison(we(e,this.value))}matchesComparison(t){switch(this.op){case"<":return t<0;case"<=":return t<=0;case"==":return t===0;case"!=":return t!==0;case">":return t>0;case">=":return t>=0;default:return O(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class X extends jl{constructor(t,e){super(),this.filters=t,this.op=e,this.Pe=null}static create(t,e){return new X(t,e)}matches(t){return bn(this)?this.filters.find((e=>!e.matches(t)))===void 0:this.filters.find((e=>e.matches(t)))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce(((t,e)=>t.concat(e.getFlattenedFilters())),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function bn(r){return r.op==="and"}function mo(r){return r.op==="or"}function jo(r){return zl(r)&&bn(r)}function zl(r){for(const t of r.filters)if(t instanceof X)return!1;return!0}function go(r){if(r instanceof K)return r.field.canonicalString()+r.op.toString()+Sn(r.value);if(jo(r))return r.filters.map((t=>go(t))).join(",");{const t=r.filters.map((e=>go(e))).join(",");return`${r.op}(${t})`}}function Gl(r,t){return r instanceof K?(function(n,s){return s instanceof K&&n.op===s.op&&n.field.isEqual(s.field)&&Jt(n.value,s.value)})(r,t):r instanceof X?(function(n,s){return s instanceof X&&n.op===s.op&&n.filters.length===s.filters.length?n.filters.reduce(((i,a,u)=>i&&Gl(a,s.filters[u])),!0):!1})(r,t):void O(19439)}function Kl(r,t){const e=r.filters.concat(t);return X.create(e,r.op)}function $l(r){return r instanceof K?(function(e){return`${e.field.canonicalString()} ${e.op} ${Sn(e.value)}`})(r):r instanceof X?(function(e){return e.op.toString()+" {"+e.getFilters().map($l).join(" ,")+"}"})(r):"Filter"}class lm extends K{constructor(t,e,n){super(t,e,n),this.key=N.fromName(n.referenceValue)}matches(t){const e=N.comparator(t.key,this.key);return this.matchesComparison(e)}}class hm extends K{constructor(t,e){super(t,"in",e),this.keys=Ql("in",e)}matches(t){return this.keys.some((e=>e.isEqual(t.key)))}}class dm extends K{constructor(t,e){super(t,"not-in",e),this.keys=Ql("not-in",e)}matches(t){return!this.keys.some((e=>e.isEqual(t.key)))}}function Ql(r,t){var e;return(((e=t.arrayValue)==null?void 0:e.values)||[]).map((n=>N.fromName(n.referenceValue)))}class fm extends K{constructor(t,e){super(t,"array-contains",e)}matches(t){const e=t.data.field(this.field);return Or(e)&&kr(e.arrayValue,this.value)}}class Wl extends K{constructor(t,e){super(t,"in",e)}matches(t){const e=t.data.field(this.field);return e!==null&&kr(this.value.arrayValue,e)}}class mm extends K{constructor(t,e){super(t,"not-in",e)}matches(t){if(kr(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const e=t.data.field(this.field);return e!==null&&e.nullValue===void 0&&!kr(this.value.arrayValue,e)}}class gm extends K{constructor(t,e){super(t,"array-contains-any",e)}matches(t){const e=t.data.field(this.field);return!(!Or(e)||!e.arrayValue.values)&&e.arrayValue.values.some((n=>kr(this.value.arrayValue,n)))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pm{constructor(t,e=null,n=[],s=[],i=null,a=null,u=null){this.path=t,this.collectionGroup=e,this.orderBy=n,this.filters=s,this.limit=i,this.startAt=a,this.endAt=u,this.Te=null}}function po(r,t=null,e=[],n=[],s=null,i=null,a=null){return new pm(r,t,e,n,s,i,a)}function We(r){const t=F(r);if(t.Te===null){let e=t.path.canonicalString();t.collectionGroup!==null&&(e+="|cg:"+t.collectionGroup),e+="|f:",e+=t.filters.map((n=>go(n))).join(","),e+="|ob:",e+=t.orderBy.map((n=>(function(i){return i.field.canonicalString()+i.dir})(n))).join(","),Gr(t.limit)||(e+="|l:",e+=t.limit),t.startAt&&(e+="|lb:",e+=t.startAt.inclusive?"b:":"a:",e+=t.startAt.position.map((n=>Sn(n))).join(",")),t.endAt&&(e+="|ub:",e+=t.endAt.inclusive?"a:":"b:",e+=t.endAt.position.map((n=>Sn(n))).join(",")),t.Te=e}return t.Te}function $r(r,t){if(r.limit!==t.limit||r.orderBy.length!==t.orderBy.length)return!1;for(let e=0;e<r.orderBy.length;e++)if(!cm(r.orderBy[e],t.orderBy[e]))return!1;if(r.filters.length!==t.filters.length)return!1;for(let e=0;e<r.filters.length;e++)if(!Gl(r.filters[e],t.filters[e]))return!1;return r.collectionGroup===t.collectionGroup&&!!r.path.isEqual(t.path)&&!!tc(r.startAt,t.startAt)&&tc(r.endAt,t.endAt)}function qs(r){return N.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function js(r,t){return r.filters.filter((e=>e instanceof K&&e.field.isEqual(t)))}function ec(r,t,e){let n=Ss,s=!0;for(const i of js(r,t)){let a=Ss,u=!0;switch(i.op){case"<":case"<=":a=am(i.value);break;case"==":case"in":case">=":a=i.value;break;case">":a=i.value,u=!1;break;case"!=":case"not-in":a=Ss}Yu({value:n,inclusive:s},{value:a,inclusive:u})<0&&(n=a,s=u)}if(e!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(t)){const a=e.position[i];Yu({value:n,inclusive:s},{value:a,inclusive:e.inclusive})<0&&(n=a,s=e.inclusive);break}}return{value:n,inclusive:s}}function nc(r,t,e){let n=ge,s=!0;for(const i of js(r,t)){let a=ge,u=!0;switch(i.op){case">=":case">":a=um(i.value),u=!1;break;case"==":case"in":case"<=":a=i.value;break;case"<":a=i.value,u=!1;break;case"!=":case"not-in":a=ge}Xu({value:n,inclusive:s},{value:a,inclusive:u})>0&&(n=a,s=u)}if(e!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(t)){const a=e.position[i];Xu({value:n,inclusive:s},{value:a,inclusive:e.inclusive})>0&&(n=a,s=e.inclusive);break}}return{value:n,inclusive:s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Un{constructor(t,e=null,n=[],s=[],i=null,a="F",u=null,l=null){this.path=t,this.collectionGroup=e,this.explicitOrderBy=n,this.filters=s,this.limit=i,this.limitType=a,this.startAt=u,this.endAt=l,this.Ee=null,this.Ie=null,this.Re=null,this.startAt,this.endAt}}function Hl(r,t,e,n,s,i,a,u){return new Un(r,t,e,n,s,i,a,u)}function Qr(r){return new Un(r)}function rc(r){return r.filters.length===0&&r.limit===null&&r.startAt==null&&r.endAt==null&&(r.explicitOrderBy.length===0||r.explicitOrderBy.length===1&&r.explicitOrderBy[0].field.isKeyField())}function _m(r){return N.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function Jl(r){return r.collectionGroup!==null}function Ar(r){const t=F(r);if(t.Ee===null){t.Ee=[];const e=new Set;for(const i of t.explicitOrderBy)t.Ee.push(i),e.add(i.field.canonicalString());const n=t.explicitOrderBy.length>0?t.explicitOrderBy[t.explicitOrderBy.length-1].dir:"asc";(function(a){let u=new Z(at.comparator);return a.filters.forEach((l=>{l.getFlattenedFilters().forEach((d=>{d.isInequality()&&(u=u.add(d.field))}))})),u})(t).forEach((i=>{e.has(i.canonicalString())||i.isKeyField()||t.Ee.push(new Fr(i,n))})),e.has(at.keyField().canonicalString())||t.Ee.push(new Fr(at.keyField(),n))}return t.Ee}function Ot(r){const t=F(r);return t.Ie||(t.Ie=ym(t,Ar(r))),t.Ie}function ym(r,t){if(r.limitType==="F")return po(r.path,r.collectionGroup,t,r.filters,r.limit,r.startAt,r.endAt);{t=t.map((s=>{const i=s.dir==="desc"?"asc":"desc";return new Fr(s.field,i)}));const e=r.endAt?new Pn(r.endAt.position,r.endAt.inclusive):null,n=r.startAt?new Pn(r.startAt.position,r.startAt.inclusive):null;return po(r.path,r.collectionGroup,t,r.filters,r.limit,e,n)}}function _o(r,t){const e=r.filters.concat([t]);return new Un(r.path,r.collectionGroup,r.explicitOrderBy.slice(),e,r.limit,r.limitType,r.startAt,r.endAt)}function Im(r,t){const e=r.explicitOrderBy.concat([t]);return new Un(r.path,r.collectionGroup,e,r.filters.slice(),r.limit,r.limitType,r.startAt,r.endAt)}function zs(r,t,e){return new Un(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),t,e,r.startAt,r.endAt)}function ui(r,t){return $r(Ot(r),Ot(t))&&r.limitType===t.limitType}function Yl(r){return`${We(Ot(r))}|lt:${r.limitType}`}function dn(r){return`Query(target=${(function(e){let n=e.path.canonicalString();return e.collectionGroup!==null&&(n+=" collectionGroup="+e.collectionGroup),e.filters.length>0&&(n+=`, filters: [${e.filters.map((s=>$l(s))).join(", ")}]`),Gr(e.limit)||(n+=", limit: "+e.limit),e.orderBy.length>0&&(n+=`, orderBy: [${e.orderBy.map((s=>(function(a){return`${a.field.canonicalString()} (${a.dir})`})(s))).join(", ")}]`),e.startAt&&(n+=", startAt: ",n+=e.startAt.inclusive?"b:":"a:",n+=e.startAt.position.map((s=>Sn(s))).join(",")),e.endAt&&(n+=", endAt: ",n+=e.endAt.inclusive?"a:":"b:",n+=e.endAt.position.map((s=>Sn(s))).join(",")),`Target(${n})`})(Ot(r))}; limitType=${r.limitType})`}function Wr(r,t){return t.isFoundDocument()&&(function(n,s){const i=s.key.path;return n.collectionGroup!==null?s.key.hasCollectionId(n.collectionGroup)&&n.path.isPrefixOf(i):N.isDocumentKey(n.path)?n.path.isEqual(i):n.path.isImmediateParentOf(i)})(r,t)&&(function(n,s){for(const i of Ar(n))if(!i.field.isKeyField()&&s.data.field(i.field)===null)return!1;return!0})(r,t)&&(function(n,s){for(const i of n.filters)if(!i.matches(s))return!1;return!0})(r,t)&&(function(n,s){return!(n.startAt&&!(function(a,u,l){const d=Zu(a,u,l);return a.inclusive?d<=0:d<0})(n.startAt,Ar(n),s)||n.endAt&&!(function(a,u,l){const d=Zu(a,u,l);return a.inclusive?d>=0:d>0})(n.endAt,Ar(n),s))})(r,t)}function Xl(r){return r.collectionGroup||(r.path.length%2==1?r.path.lastSegment():r.path.get(r.path.length-2))}function Zl(r){return(t,e)=>{let n=!1;for(const s of Ar(r)){const i=Tm(s,t,e);if(i!==0)return i;n=n||s.field.isKeyField()}return 0}}function Tm(r,t,e){const n=r.field.isKeyField()?N.comparator(t.key,e.key):(function(i,a,u){const l=a.data.field(i),d=u.data.field(i);return l!==null&&d!==null?we(l,d):O(42886)})(r.field,t,e);switch(r.dir){case"asc":return n;case"desc":return-1*n;default:return O(19790,{direction:r.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ne{constructor(t,e){this.mapKeyFn=t,this.equalsFn=e,this.inner={},this.innerSize=0}get(t){const e=this.mapKeyFn(t),n=this.inner[e];if(n!==void 0){for(const[s,i]of n)if(this.equalsFn(s,t))return i}}has(t){return this.get(t)!==void 0}set(t,e){const n=this.mapKeyFn(t),s=this.inner[n];if(s===void 0)return this.inner[n]=[[t,e]],void this.innerSize++;for(let i=0;i<s.length;i++)if(this.equalsFn(s[i][0],t))return void(s[i]=[t,e]);s.push([t,e]),this.innerSize++}delete(t){const e=this.mapKeyFn(t),n=this.inner[e];if(n===void 0)return!1;for(let s=0;s<n.length;s++)if(this.equalsFn(n[s][0],t))return n.length===1?delete this.inner[e]:n.splice(s,1),this.innerSize--,!0;return!1}forEach(t){Se(this.inner,((e,n)=>{for(const[s,i]of n)t(s,i)}))}isEmpty(){return xl(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Em=new et(N.comparator);function Mt(){return Em}const th=new et(N.comparator);function pr(...r){let t=th;for(const e of r)t=t.insert(e.key,e);return t}function eh(r){let t=th;return r.forEach(((e,n)=>t=t.insert(e,n.overlayedDocument))),t}function Wt(){return Rr()}function nh(){return Rr()}function Rr(){return new ne((r=>r.toString()),((r,t)=>r.isEqual(t)))}const wm=new et(N.comparator),vm=new Z(N.comparator);function G(...r){let t=vm;for(const e of r)t=t.add(e);return t}const Am=new Z(B);function zo(){return Am}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Go(r,t){if(r.useProto3Json){if(isNaN(t))return{doubleValue:"NaN"};if(t===1/0)return{doubleValue:"Infinity"};if(t===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:br(t)?"-0":t}}function rh(r){return{integerValue:""+r}}function Rm(r,t){return El(t)?rh(t):Go(r,t)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ci{constructor(){this._=void 0}}function Vm(r,t,e){return r instanceof Cn?(function(s,i){const a={fields:{[Ml]:{stringValue:kl},[Fl]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return i&&Uo(i)&&(i=oi(i)),i&&(a.fields[Ol]=i),{mapValue:a}})(e,t):r instanceof Dn?ih(r,t):r instanceof xn?oh(r,t):(function(s,i){const a=sh(s,i),u=sc(a)+sc(s.Ae);return fo(a)&&fo(s.Ae)?rh(u):Go(s.serializer,u)})(r,t)}function Sm(r,t,e){return r instanceof Dn?ih(r,t):r instanceof xn?oh(r,t):e}function sh(r,t){return r instanceof Lr?(function(n){return fo(n)||(function(i){return!!i&&"doubleValue"in i})(n)})(t)?t:{integerValue:0}:null}class Cn extends ci{}class Dn extends ci{constructor(t){super(),this.elements=t}}function ih(r,t){const e=ah(t);for(const n of r.elements)e.some((s=>Jt(s,n)))||e.push(n);return{arrayValue:{values:e}}}class xn extends ci{constructor(t){super(),this.elements=t}}function oh(r,t){let e=ah(t);for(const n of r.elements)e=e.filter((s=>!Jt(s,n)));return{arrayValue:{values:e}}}class Lr extends ci{constructor(t,e){super(),this.serializer=t,this.Ae=e}}function sc(r){return st(r.integerValue||r.doubleValue)}function ah(r){return Or(r)&&r.arrayValue.values?r.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uh{constructor(t,e){this.field=t,this.transform=e}}function Pm(r,t){return r.field.isEqual(t.field)&&(function(n,s){return n instanceof Dn&&s instanceof Dn||n instanceof xn&&s instanceof xn?Tn(n.elements,s.elements,Jt):n instanceof Lr&&s instanceof Lr?Jt(n.Ae,s.Ae):n instanceof Cn&&s instanceof Cn})(r.transform,t.transform)}class bm{constructor(t,e){this.version=t,this.transformResults=e}}class ot{constructor(t,e){this.updateTime=t,this.exists=e}static none(){return new ot}static exists(t){return new ot(void 0,t)}static updateTime(t){return new ot(t)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(t){return this.exists===t.exists&&(this.updateTime?!!t.updateTime&&this.updateTime.isEqual(t.updateTime):!t.updateTime)}}function Cs(r,t){return r.updateTime!==void 0?t.isFoundDocument()&&t.version.isEqual(r.updateTime):r.exists===void 0||r.exists===t.isFoundDocument()}class li{}function ch(r,t){if(!r.hasLocalMutations||t&&t.fields.length===0)return null;if(t===null)return r.isNoDocument()?new qn(r.key,ot.none()):new Bn(r.key,r.data,ot.none());{const e=r.data,n=Tt.empty();let s=new Z(at.comparator);for(let i of t.fields)if(!s.has(i)){let a=e.field(i);a===null&&i.length>1&&(i=i.popLast(),a=e.field(i)),a===null?n.delete(i):n.set(i,a),s=s.add(i)}return new re(r.key,n,new Dt(s.toArray()),ot.none())}}function Cm(r,t,e){r instanceof Bn?(function(s,i,a){const u=s.value.clone(),l=oc(s.fieldTransforms,i,a.transformResults);u.setAll(l),i.convertToFoundDocument(a.version,u).setHasCommittedMutations()})(r,t,e):r instanceof re?(function(s,i,a){if(!Cs(s.precondition,i))return void i.convertToUnknownDocument(a.version);const u=oc(s.fieldTransforms,i,a.transformResults),l=i.data;l.setAll(lh(s)),l.setAll(u),i.convertToFoundDocument(a.version,l).setHasCommittedMutations()})(r,t,e):(function(s,i,a){i.convertToNoDocument(a.version).setHasCommittedMutations()})(0,t,e)}function Vr(r,t,e,n){return r instanceof Bn?(function(i,a,u,l){if(!Cs(i.precondition,a))return u;const d=i.value.clone(),f=ac(i.fieldTransforms,l,a);return d.setAll(f),a.convertToFoundDocument(a.version,d).setHasLocalMutations(),null})(r,t,e,n):r instanceof re?(function(i,a,u,l){if(!Cs(i.precondition,a))return u;const d=ac(i.fieldTransforms,l,a),f=a.data;return f.setAll(lh(i)),f.setAll(d),a.convertToFoundDocument(a.version,f).setHasLocalMutations(),u===null?null:u.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map((g=>g.field)))})(r,t,e,n):(function(i,a,u){return Cs(i.precondition,a)?(a.convertToNoDocument(a.version).setHasLocalMutations(),null):u})(r,t,e)}function Dm(r,t){let e=null;for(const n of r.fieldTransforms){const s=t.data.field(n.field),i=sh(n.transform,s||null);i!=null&&(e===null&&(e=Tt.empty()),e.set(n.field,i))}return e||null}function ic(r,t){return r.type===t.type&&!!r.key.isEqual(t.key)&&!!r.precondition.isEqual(t.precondition)&&!!(function(n,s){return n===void 0&&s===void 0||!(!n||!s)&&Tn(n,s,((i,a)=>Pm(i,a)))})(r.fieldTransforms,t.fieldTransforms)&&(r.type===0?r.value.isEqual(t.value):r.type!==1||r.data.isEqual(t.data)&&r.fieldMask.isEqual(t.fieldMask))}class Bn extends li{constructor(t,e,n,s=[]){super(),this.key=t,this.value=e,this.precondition=n,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class re extends li{constructor(t,e,n,s,i=[]){super(),this.key=t,this.data=e,this.fieldMask=n,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function lh(r){const t=new Map;return r.fieldMask.fields.forEach((e=>{if(!e.isEmpty()){const n=r.data.field(e);t.set(e,n)}})),t}function oc(r,t,e){const n=new Map;L(r.length===e.length,32656,{Ve:e.length,de:r.length});for(let s=0;s<e.length;s++){const i=r[s],a=i.transform,u=t.data.field(i.field);n.set(i.field,Sm(a,u,e[s]))}return n}function ac(r,t,e){const n=new Map;for(const s of r){const i=s.transform,a=e.data.field(s.field);n.set(s.field,Vm(i,a,t))}return n}class qn extends li{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class Ko extends li{constructor(t,e){super(),this.key=t,this.precondition=e,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $o{constructor(t,e,n,s){this.batchId=t,this.localWriteTime=e,this.baseMutations=n,this.mutations=s}applyToRemoteDocument(t,e){const n=e.mutationResults;for(let s=0;s<this.mutations.length;s++){const i=this.mutations[s];i.key.isEqual(t.key)&&Cm(i,t,n[s])}}applyToLocalView(t,e){for(const n of this.baseMutations)n.key.isEqual(t.key)&&(e=Vr(n,t,e,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(t.key)&&(e=Vr(n,t,e,this.localWriteTime));return e}applyToLocalDocumentSet(t,e){const n=nh();return this.mutations.forEach((s=>{const i=t.get(s.key),a=i.overlayedDocument;let u=this.applyToLocalView(a,i.mutatedFields);u=e.has(s.key)?null:u;const l=ch(a,u);l!==null&&n.set(s.key,l),a.isValidDocument()||a.convertToNoDocument(U.min())})),n}keys(){return this.mutations.reduce(((t,e)=>t.add(e.key)),G())}isEqual(t){return this.batchId===t.batchId&&Tn(this.mutations,t.mutations,((e,n)=>ic(e,n)))&&Tn(this.baseMutations,t.baseMutations,((e,n)=>ic(e,n)))}}class Qo{constructor(t,e,n,s){this.batch=t,this.commitVersion=e,this.mutationResults=n,this.docVersions=s}static from(t,e,n){L(t.mutations.length===n.length,58842,{me:t.mutations.length,fe:n.length});let s=(function(){return wm})();const i=t.mutations;for(let a=0;a<i.length;a++)s=s.insert(i[a].key,n[a].version);return new Qo(t,e,n,s)}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wo{constructor(t,e){this.largestBatchId=t,this.mutation=e}getKey(){return this.mutation.key}isEqual(t){return t!==null&&this.mutation===t.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xm{constructor(t,e){this.count=t,this.unchangedNames=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var dt,Q;function hh(r){switch(r){case S.OK:return O(64938);case S.CANCELLED:case S.UNKNOWN:case S.DEADLINE_EXCEEDED:case S.RESOURCE_EXHAUSTED:case S.INTERNAL:case S.UNAVAILABLE:case S.UNAUTHENTICATED:return!1;case S.INVALID_ARGUMENT:case S.NOT_FOUND:case S.ALREADY_EXISTS:case S.PERMISSION_DENIED:case S.FAILED_PRECONDITION:case S.ABORTED:case S.OUT_OF_RANGE:case S.UNIMPLEMENTED:case S.DATA_LOSS:return!0;default:return O(15467,{code:r})}}function dh(r){if(r===void 0)return lt("GRPC error has no .code"),S.UNKNOWN;switch(r){case dt.OK:return S.OK;case dt.CANCELLED:return S.CANCELLED;case dt.UNKNOWN:return S.UNKNOWN;case dt.DEADLINE_EXCEEDED:return S.DEADLINE_EXCEEDED;case dt.RESOURCE_EXHAUSTED:return S.RESOURCE_EXHAUSTED;case dt.INTERNAL:return S.INTERNAL;case dt.UNAVAILABLE:return S.UNAVAILABLE;case dt.UNAUTHENTICATED:return S.UNAUTHENTICATED;case dt.INVALID_ARGUMENT:return S.INVALID_ARGUMENT;case dt.NOT_FOUND:return S.NOT_FOUND;case dt.ALREADY_EXISTS:return S.ALREADY_EXISTS;case dt.PERMISSION_DENIED:return S.PERMISSION_DENIED;case dt.FAILED_PRECONDITION:return S.FAILED_PRECONDITION;case dt.ABORTED:return S.ABORTED;case dt.OUT_OF_RANGE:return S.OUT_OF_RANGE;case dt.UNIMPLEMENTED:return S.UNIMPLEMENTED;case dt.DATA_LOSS:return S.DATA_LOSS;default:return O(39323,{code:r})}}(Q=dt||(dt={}))[Q.OK=0]="OK",Q[Q.CANCELLED=1]="CANCELLED",Q[Q.UNKNOWN=2]="UNKNOWN",Q[Q.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",Q[Q.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",Q[Q.NOT_FOUND=5]="NOT_FOUND",Q[Q.ALREADY_EXISTS=6]="ALREADY_EXISTS",Q[Q.PERMISSION_DENIED=7]="PERMISSION_DENIED",Q[Q.UNAUTHENTICATED=16]="UNAUTHENTICATED",Q[Q.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",Q[Q.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",Q[Q.ABORTED=10]="ABORTED",Q[Q.OUT_OF_RANGE=11]="OUT_OF_RANGE",Q[Q.UNIMPLEMENTED=12]="UNIMPLEMENTED",Q[Q.INTERNAL=13]="INTERNAL",Q[Q.UNAVAILABLE=14]="UNAVAILABLE",Q[Q.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nm(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const km=new _e([4294967295,4294967295],0);function uc(r){const t=Nm().encode(r),e=new ol;return e.update(t),new Uint8Array(e.digest())}function cc(r){const t=new DataView(r.buffer),e=t.getUint32(0,!0),n=t.getUint32(4,!0),s=t.getUint32(8,!0),i=t.getUint32(12,!0);return[new _e([e,n],0),new _e([s,i],0)]}class Ho{constructor(t,e,n){if(this.bitmap=t,this.padding=e,this.hashCount=n,e<0||e>=8)throw new _r(`Invalid padding: ${e}`);if(n<0)throw new _r(`Invalid hash count: ${n}`);if(t.length>0&&this.hashCount===0)throw new _r(`Invalid hash count: ${n}`);if(t.length===0&&e!==0)throw new _r(`Invalid padding when bitmap length is 0: ${e}`);this.ge=8*t.length-e,this.pe=_e.fromNumber(this.ge)}ye(t,e,n){let s=t.add(e.multiply(_e.fromNumber(n)));return s.compare(km)===1&&(s=new _e([s.getBits(0),s.getBits(1)],0)),s.modulo(this.pe).toNumber()}we(t){return!!(this.bitmap[Math.floor(t/8)]&1<<t%8)}mightContain(t){if(this.ge===0)return!1;const e=uc(t),[n,s]=cc(e);for(let i=0;i<this.hashCount;i++){const a=this.ye(n,s,i);if(!this.we(a))return!1}return!0}static create(t,e,n){const s=t%8==0?0:8-t%8,i=new Uint8Array(Math.ceil(t/8)),a=new Ho(i,s,e);return n.forEach((u=>a.insert(u))),a}insert(t){if(this.ge===0)return;const e=uc(t),[n,s]=cc(e);for(let i=0;i<this.hashCount;i++){const a=this.ye(n,s,i);this.Se(a)}}Se(t){const e=Math.floor(t/8),n=t%8;this.bitmap[e]|=1<<n}}class _r extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hr{constructor(t,e,n,s,i){this.snapshotVersion=t,this.targetChanges=e,this.targetMismatches=n,this.documentUpdates=s,this.resolvedLimboDocuments=i}static createSynthesizedRemoteEventForCurrentChange(t,e,n){const s=new Map;return s.set(t,Jr.createSynthesizedTargetChangeForCurrentChange(t,e,n)),new Hr(U.min(),s,new et(B),Mt(),G())}}class Jr{constructor(t,e,n,s,i){this.resumeToken=t,this.current=e,this.addedDocuments=n,this.modifiedDocuments=s,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(t,e,n){return new Jr(n,e,G(),G(),G())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ds{constructor(t,e,n,s){this.be=t,this.removedTargetIds=e,this.key=n,this.De=s}}class fh{constructor(t,e){this.targetId=t,this.Ce=e}}class mh{constructor(t,e,n=ht.EMPTY_BYTE_STRING,s=null){this.state=t,this.targetIds=e,this.resumeToken=n,this.cause=s}}class lc{constructor(){this.ve=0,this.Fe=hc(),this.Me=ht.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(t){t.approximateByteSize()>0&&(this.Oe=!0,this.Me=t)}ke(){let t=G(),e=G(),n=G();return this.Fe.forEach(((s,i)=>{switch(i){case 0:t=t.add(s);break;case 2:e=e.add(s);break;case 1:n=n.add(s);break;default:O(38017,{changeType:i})}})),new Jr(this.Me,this.xe,t,e,n)}qe(){this.Oe=!1,this.Fe=hc()}Ke(t,e){this.Oe=!0,this.Fe=this.Fe.insert(t,e)}Ue(t){this.Oe=!0,this.Fe=this.Fe.remove(t)}$e(){this.ve+=1}We(){this.ve-=1,L(this.ve>=0,3241,{ve:this.ve})}Qe(){this.Oe=!0,this.xe=!0}}class Mm{constructor(t){this.Ge=t,this.ze=new Map,this.je=Mt(),this.Je=ys(),this.He=ys(),this.Ze=new et(B)}Xe(t){for(const e of t.be)t.De&&t.De.isFoundDocument()?this.Ye(e,t.De):this.et(e,t.key,t.De);for(const e of t.removedTargetIds)this.et(e,t.key,t.De)}tt(t){this.forEachTarget(t,(e=>{const n=this.nt(e);switch(t.state){case 0:this.rt(e)&&n.Le(t.resumeToken);break;case 1:n.We(),n.Ne||n.qe(),n.Le(t.resumeToken);break;case 2:n.We(),n.Ne||this.removeTarget(e);break;case 3:this.rt(e)&&(n.Qe(),n.Le(t.resumeToken));break;case 4:this.rt(e)&&(this.it(e),n.Le(t.resumeToken));break;default:O(56790,{state:t.state})}}))}forEachTarget(t,e){t.targetIds.length>0?t.targetIds.forEach(e):this.ze.forEach(((n,s)=>{this.rt(s)&&e(s)}))}st(t){const e=t.targetId,n=t.Ce.count,s=this.ot(e);if(s){const i=s.target;if(qs(i))if(n===0){const a=new N(i.path);this.et(e,a,it.newNoDocument(a,U.min()))}else L(n===1,20013,{expectedCount:n});else{const a=this._t(e);if(a!==n){const u=this.ut(t),l=u?this.ct(u,t,a):1;if(l!==0){this.it(e);const d=l===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ze=this.Ze.insert(e,d)}}}}}ut(t){const e=t.Ce.unchangedNames;if(!e||!e.bits)return null;const{bits:{bitmap:n="",padding:s=0},hashCount:i=0}=e;let a,u;try{a=ee(n).toUint8Array()}catch(l){if(l instanceof Nl)return In("Decoding the base64 bloom filter in existence filter failed ("+l.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw l}try{u=new Ho(a,s,i)}catch(l){return In(l instanceof _r?"BloomFilter error: ":"Applying bloom filter failed: ",l),null}return u.ge===0?null:u}ct(t,e,n){return e.Ce.count===n-this.Pt(t,e.targetId)?0:2}Pt(t,e){const n=this.Ge.getRemoteKeysForTarget(e);let s=0;return n.forEach((i=>{const a=this.Ge.ht(),u=`projects/${a.projectId}/databases/${a.database}/documents/${i.path.canonicalString()}`;t.mightContain(u)||(this.et(e,i,null),s++)})),s}Tt(t){const e=new Map;this.ze.forEach(((i,a)=>{const u=this.ot(a);if(u){if(i.current&&qs(u.target)){const l=new N(u.target.path);this.Et(l).has(a)||this.It(a,l)||this.et(a,l,it.newNoDocument(l,t))}i.Be&&(e.set(a,i.ke()),i.qe())}}));let n=G();this.He.forEach(((i,a)=>{let u=!0;a.forEachWhile((l=>{const d=this.ot(l);return!d||d.purpose==="TargetPurposeLimboResolution"||(u=!1,!1)})),u&&(n=n.add(i))})),this.je.forEach(((i,a)=>a.setReadTime(t)));const s=new Hr(t,e,this.Ze,this.je,n);return this.je=Mt(),this.Je=ys(),this.He=ys(),this.Ze=new et(B),s}Ye(t,e){if(!this.rt(t))return;const n=this.It(t,e.key)?2:0;this.nt(t).Ke(e.key,n),this.je=this.je.insert(e.key,e),this.Je=this.Je.insert(e.key,this.Et(e.key).add(t)),this.He=this.He.insert(e.key,this.Rt(e.key).add(t))}et(t,e,n){if(!this.rt(t))return;const s=this.nt(t);this.It(t,e)?s.Ke(e,1):s.Ue(e),this.He=this.He.insert(e,this.Rt(e).delete(t)),this.He=this.He.insert(e,this.Rt(e).add(t)),n&&(this.je=this.je.insert(e,n))}removeTarget(t){this.ze.delete(t)}_t(t){const e=this.nt(t).ke();return this.Ge.getRemoteKeysForTarget(t).size+e.addedDocuments.size-e.removedDocuments.size}$e(t){this.nt(t).$e()}nt(t){let e=this.ze.get(t);return e||(e=new lc,this.ze.set(t,e)),e}Rt(t){let e=this.He.get(t);return e||(e=new Z(B),this.He=this.He.insert(t,e)),e}Et(t){let e=this.Je.get(t);return e||(e=new Z(B),this.Je=this.Je.insert(t,e)),e}rt(t){const e=this.ot(t)!==null;return e||b("WatchChangeAggregator","Detected inactive target",t),e}ot(t){const e=this.ze.get(t);return e&&e.Ne?null:this.Ge.At(t)}it(t){this.ze.set(t,new lc),this.Ge.getRemoteKeysForTarget(t).forEach((e=>{this.et(t,e,null)}))}It(t,e){return this.Ge.getRemoteKeysForTarget(t).has(e)}}function ys(){return new et(N.comparator)}function hc(){return new et(N.comparator)}const Om={asc:"ASCENDING",desc:"DESCENDING"},Fm={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},Lm={and:"AND",or:"OR"};class Um{constructor(t,e){this.databaseId=t,this.useProto3Json=e}}function yo(r,t){return r.useProto3Json||Gr(t)?t:{value:t}}function Nn(r,t){return r.useProto3Json?`${new Date(1e3*t.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+t.nanoseconds).slice(-9)}Z`:{seconds:""+t.seconds,nanos:t.nanoseconds}}function gh(r,t){return r.useProto3Json?t.toBase64():t.toUint8Array()}function Bm(r,t){return Nn(r,t.toTimestamp())}function yt(r){return L(!!r,49232),U.fromTimestamp((function(e){const n=te(e);return new Y(n.seconds,n.nanos)})(r))}function Jo(r,t){return Io(r,t).canonicalString()}function Io(r,t){const e=(function(s){return new H(["projects",s.projectId,"databases",s.database])})(r).child("documents");return t===void 0?e:e.child(t)}function ph(r){const t=H.fromString(r);return L(Rh(t),10190,{key:t.toString()}),t}function Ur(r,t){return Jo(r.databaseId,t.path)}function Zt(r,t){const e=ph(t);if(e.get(1)!==r.databaseId.projectId)throw new C(S.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+e.get(1)+" vs "+r.databaseId.projectId);if(e.get(3)!==r.databaseId.database)throw new C(S.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+e.get(3)+" vs "+r.databaseId.database);return new N(Ih(e))}function _h(r,t){return Jo(r.databaseId,t)}function yh(r){const t=ph(r);return t.length===4?H.emptyPath():Ih(t)}function To(r){return new H(["projects",r.databaseId.projectId,"databases",r.databaseId.database]).canonicalString()}function Ih(r){return L(r.length>4&&r.get(4)==="documents",29091,{key:r.toString()}),r.popFirst(5)}function dc(r,t,e){return{name:Ur(r,t),fields:e.value.mapValue.fields}}function qm(r,t,e){const n=Zt(r,t.name),s=yt(t.updateTime),i=t.createTime?yt(t.createTime):U.min(),a=new Tt({mapValue:{fields:t.fields}}),u=it.newFoundDocument(n,s,i,a);return e&&u.setHasCommittedMutations(),e?u.setHasCommittedMutations():u}function jm(r,t){return"found"in t?(function(n,s){L(!!s.found,43571),s.found.name,s.found.updateTime;const i=Zt(n,s.found.name),a=yt(s.found.updateTime),u=s.found.createTime?yt(s.found.createTime):U.min(),l=new Tt({mapValue:{fields:s.found.fields}});return it.newFoundDocument(i,a,u,l)})(r,t):"missing"in t?(function(n,s){L(!!s.missing,3894),L(!!s.readTime,22933);const i=Zt(n,s.missing),a=yt(s.readTime);return it.newNoDocument(i,a)})(r,t):O(7234,{result:t})}function zm(r,t){let e;if("targetChange"in t){t.targetChange;const n=(function(d){return d==="NO_CHANGE"?0:d==="ADD"?1:d==="REMOVE"?2:d==="CURRENT"?3:d==="RESET"?4:O(39313,{state:d})})(t.targetChange.targetChangeType||"NO_CHANGE"),s=t.targetChange.targetIds||[],i=(function(d,f){return d.useProto3Json?(L(f===void 0||typeof f=="string",58123),ht.fromBase64String(f||"")):(L(f===void 0||f instanceof Buffer||f instanceof Uint8Array,16193),ht.fromUint8Array(f||new Uint8Array))})(r,t.targetChange.resumeToken),a=t.targetChange.cause,u=a&&(function(d){const f=d.code===void 0?S.UNKNOWN:dh(d.code);return new C(f,d.message||"")})(a);e=new mh(n,s,i,u||null)}else if("documentChange"in t){t.documentChange;const n=t.documentChange;n.document,n.document.name,n.document.updateTime;const s=Zt(r,n.document.name),i=yt(n.document.updateTime),a=n.document.createTime?yt(n.document.createTime):U.min(),u=new Tt({mapValue:{fields:n.document.fields}}),l=it.newFoundDocument(s,i,a,u),d=n.targetIds||[],f=n.removedTargetIds||[];e=new Ds(d,f,l.key,l)}else if("documentDelete"in t){t.documentDelete;const n=t.documentDelete;n.document;const s=Zt(r,n.document),i=n.readTime?yt(n.readTime):U.min(),a=it.newNoDocument(s,i),u=n.removedTargetIds||[];e=new Ds([],u,a.key,a)}else if("documentRemove"in t){t.documentRemove;const n=t.documentRemove;n.document;const s=Zt(r,n.document),i=n.removedTargetIds||[];e=new Ds([],i,s,null)}else{if(!("filter"in t))return O(11601,{Vt:t});{t.filter;const n=t.filter;n.targetId;const{count:s=0,unchangedNames:i}=n,a=new xm(s,i),u=n.targetId;e=new fh(u,a)}}return e}function Br(r,t){let e;if(t instanceof Bn)e={update:dc(r,t.key,t.value)};else if(t instanceof qn)e={delete:Ur(r,t.key)};else if(t instanceof re)e={update:dc(r,t.key,t.data),updateMask:Hm(t.fieldMask)};else{if(!(t instanceof Ko))return O(16599,{dt:t.type});e={verify:Ur(r,t.key)}}return t.fieldTransforms.length>0&&(e.updateTransforms=t.fieldTransforms.map((n=>(function(i,a){const u=a.transform;if(u instanceof Cn)return{fieldPath:a.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(u instanceof Dn)return{fieldPath:a.field.canonicalString(),appendMissingElements:{values:u.elements}};if(u instanceof xn)return{fieldPath:a.field.canonicalString(),removeAllFromArray:{values:u.elements}};if(u instanceof Lr)return{fieldPath:a.field.canonicalString(),increment:u.Ae};throw O(20930,{transform:a.transform})})(0,n)))),t.precondition.isNone||(e.currentDocument=(function(s,i){return i.updateTime!==void 0?{updateTime:Bm(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:O(27497)})(r,t.precondition)),e}function Eo(r,t){const e=t.currentDocument?(function(i){return i.updateTime!==void 0?ot.updateTime(yt(i.updateTime)):i.exists!==void 0?ot.exists(i.exists):ot.none()})(t.currentDocument):ot.none(),n=t.updateTransforms?t.updateTransforms.map((s=>(function(a,u){let l=null;if("setToServerValue"in u)L(u.setToServerValue==="REQUEST_TIME",16630,{proto:u}),l=new Cn;else if("appendMissingElements"in u){const f=u.appendMissingElements.values||[];l=new Dn(f)}else if("removeAllFromArray"in u){const f=u.removeAllFromArray.values||[];l=new xn(f)}else"increment"in u?l=new Lr(a,u.increment):O(16584,{proto:u});const d=at.fromServerFormat(u.fieldPath);return new uh(d,l)})(r,s))):[];if(t.update){t.update.name;const s=Zt(r,t.update.name),i=new Tt({mapValue:{fields:t.update.fields}});if(t.updateMask){const a=(function(l){const d=l.fieldPaths||[];return new Dt(d.map((f=>at.fromServerFormat(f))))})(t.updateMask);return new re(s,i,a,e,n)}return new Bn(s,i,e,n)}if(t.delete){const s=Zt(r,t.delete);return new qn(s,e)}if(t.verify){const s=Zt(r,t.verify);return new Ko(s,e)}return O(1463,{proto:t})}function Gm(r,t){return r&&r.length>0?(L(t!==void 0,14353),r.map((e=>(function(s,i){let a=s.updateTime?yt(s.updateTime):yt(i);return a.isEqual(U.min())&&(a=yt(i)),new bm(a,s.transformResults||[])})(e,t)))):[]}function Th(r,t){return{documents:[_h(r,t.path)]}}function Eh(r,t){const e={structuredQuery:{}},n=t.path;let s;t.collectionGroup!==null?(s=n,e.structuredQuery.from=[{collectionId:t.collectionGroup,allDescendants:!0}]):(s=n.popLast(),e.structuredQuery.from=[{collectionId:n.lastSegment()}]),e.parent=_h(r,s);const i=(function(d){if(d.length!==0)return Ah(X.create(d,"and"))})(t.filters);i&&(e.structuredQuery.where=i);const a=(function(d){if(d.length!==0)return d.map((f=>(function(T){return{field:fn(T.field),direction:$m(T.dir)}})(f)))})(t.orderBy);a&&(e.structuredQuery.orderBy=a);const u=yo(r,t.limit);return u!==null&&(e.structuredQuery.limit=u),t.startAt&&(e.structuredQuery.startAt=(function(d){return{before:d.inclusive,values:d.position}})(t.startAt)),t.endAt&&(e.structuredQuery.endAt=(function(d){return{before:!d.inclusive,values:d.position}})(t.endAt)),{ft:e,parent:s}}function wh(r){let t=yh(r.parent);const e=r.structuredQuery,n=e.from?e.from.length:0;let s=null;if(n>0){L(n===1,65062);const f=e.from[0];f.allDescendants?s=f.collectionId:t=t.child(f.collectionId)}let i=[];e.where&&(i=(function(g){const T=vh(g);return T instanceof X&&jo(T)?T.getFilters():[T]})(e.where));let a=[];e.orderBy&&(a=(function(g){return g.map((T=>(function(x){return new Fr(mn(x.field),(function(M){switch(M){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}})(x.direction))})(T)))})(e.orderBy));let u=null;e.limit&&(u=(function(g){let T;return T=typeof g=="object"?g.value:g,Gr(T)?null:T})(e.limit));let l=null;e.startAt&&(l=(function(g){const T=!!g.before,P=g.values||[];return new Pn(P,T)})(e.startAt));let d=null;return e.endAt&&(d=(function(g){const T=!g.before,P=g.values||[];return new Pn(P,T)})(e.endAt)),Hl(t,s,a,i,u,"F",l,d)}function Km(r,t){const e=(function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return O(28987,{purpose:s})}})(t.purpose);return e==null?null:{"goog-listen-tags":e}}function vh(r){return r.unaryFilter!==void 0?(function(e){switch(e.unaryFilter.op){case"IS_NAN":const n=mn(e.unaryFilter.field);return K.create(n,"==",{doubleValue:NaN});case"IS_NULL":const s=mn(e.unaryFilter.field);return K.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=mn(e.unaryFilter.field);return K.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const a=mn(e.unaryFilter.field);return K.create(a,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return O(61313);default:return O(60726)}})(r):r.fieldFilter!==void 0?(function(e){return K.create(mn(e.fieldFilter.field),(function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return O(58110);default:return O(50506)}})(e.fieldFilter.op),e.fieldFilter.value)})(r):r.compositeFilter!==void 0?(function(e){return X.create(e.compositeFilter.filters.map((n=>vh(n))),(function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return O(1026)}})(e.compositeFilter.op))})(r):O(30097,{filter:r})}function $m(r){return Om[r]}function Qm(r){return Fm[r]}function Wm(r){return Lm[r]}function fn(r){return{fieldPath:r.canonicalString()}}function mn(r){return at.fromServerFormat(r.fieldPath)}function Ah(r){return r instanceof K?(function(e){if(e.op==="=="){if(Ju(e.value))return{unaryFilter:{field:fn(e.field),op:"IS_NAN"}};if(Hu(e.value))return{unaryFilter:{field:fn(e.field),op:"IS_NULL"}}}else if(e.op==="!="){if(Ju(e.value))return{unaryFilter:{field:fn(e.field),op:"IS_NOT_NAN"}};if(Hu(e.value))return{unaryFilter:{field:fn(e.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:fn(e.field),op:Qm(e.op),value:e.value}}})(r):r instanceof X?(function(e){const n=e.getFilters().map((s=>Ah(s)));return n.length===1?n[0]:{compositeFilter:{op:Wm(e.op),filters:n}}})(r):O(54877,{filter:r})}function Hm(r){const t=[];return r.fields.forEach((e=>t.push(e.canonicalString()))),{fieldPaths:t}}function Rh(r){return r.length>=4&&r.get(0)==="projects"&&r.get(2)==="databases"}function Vh(r){return!!r&&typeof r._toProto=="function"&&r._protoValueType==="ProtoValue"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xt{constructor(t,e,n,s,i=U.min(),a=U.min(),u=ht.EMPTY_BYTE_STRING,l=null){this.target=t,this.targetId=e,this.purpose=n,this.sequenceNumber=s,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=a,this.resumeToken=u,this.expectedCount=l}withSequenceNumber(t){return new Xt(this.target,this.targetId,this.purpose,t,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(t,e){return new Xt(this.target,this.targetId,this.purpose,this.sequenceNumber,e,this.lastLimboFreeSnapshotVersion,t,null)}withExpectedCount(t){return new Xt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,t)}withLastLimboFreeSnapshotVersion(t){return new Xt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,t,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sh{constructor(t){this.yt=t}}function Jm(r,t){let e;if(t.document)e=qm(r.yt,t.document,!!t.hasCommittedMutations);else if(t.noDocument){const n=N.fromSegments(t.noDocument.path),s=Je(t.noDocument.readTime);e=it.newNoDocument(n,s),t.hasCommittedMutations&&e.setHasCommittedMutations()}else{if(!t.unknownDocument)return O(56709);{const n=N.fromSegments(t.unknownDocument.path),s=Je(t.unknownDocument.version);e=it.newUnknownDocument(n,s)}}return t.readTime&&e.setReadTime((function(s){const i=new Y(s[0],s[1]);return U.fromTimestamp(i)})(t.readTime)),e}function fc(r,t){const e=t.key,n={prefixPath:e.getCollectionPath().popLast().toArray(),collectionGroup:e.collectionGroup,documentId:e.path.lastSegment(),readTime:Gs(t.readTime),hasCommittedMutations:t.hasCommittedMutations};if(t.isFoundDocument())n.document=(function(i,a){return{name:Ur(i,a.key),fields:a.data.value.mapValue.fields,updateTime:Nn(i,a.version.toTimestamp()),createTime:Nn(i,a.createTime.toTimestamp())}})(r.yt,t);else if(t.isNoDocument())n.noDocument={path:e.path.toArray(),readTime:He(t.version)};else{if(!t.isUnknownDocument())return O(57904,{document:t});n.unknownDocument={path:e.path.toArray(),version:He(t.version)}}return n}function Gs(r){const t=r.toTimestamp();return[t.seconds,t.nanoseconds]}function He(r){const t=r.toTimestamp();return{seconds:t.seconds,nanoseconds:t.nanoseconds}}function Je(r){const t=new Y(r.seconds,r.nanoseconds);return U.fromTimestamp(t)}function Ue(r,t){const e=(t.baseMutations||[]).map((i=>Eo(r.yt,i)));for(let i=0;i<t.mutations.length-1;++i){const a=t.mutations[i];if(i+1<t.mutations.length&&t.mutations[i+1].transform!==void 0){const u=t.mutations[i+1];a.updateTransforms=u.transform.fieldTransforms,t.mutations.splice(i+1,1),++i}}const n=t.mutations.map((i=>Eo(r.yt,i))),s=Y.fromMillis(t.localWriteTimeMs);return new $o(t.batchId,s,e,n)}function yr(r){const t=Je(r.readTime),e=r.lastLimboFreeSnapshotVersion!==void 0?Je(r.lastLimboFreeSnapshotVersion):U.min();let n;return n=(function(i){return i.documents!==void 0})(r.query)?(function(i){const a=i.documents.length;return L(a===1,1966,{count:a}),Ot(Qr(yh(i.documents[0])))})(r.query):(function(i){return Ot(wh(i))})(r.query),new Xt(n,r.targetId,"TargetPurposeListen",r.lastListenSequenceNumber,t,e,ht.fromBase64String(r.resumeToken))}function Ph(r,t){const e=He(t.snapshotVersion),n=He(t.lastLimboFreeSnapshotVersion);let s;s=qs(t.target)?Th(r.yt,t.target):Eh(r.yt,t.target).ft;const i=t.resumeToken.toBase64();return{targetId:t.targetId,canonicalId:We(t.target),readTime:e,resumeToken:i,lastListenSequenceNumber:t.sequenceNumber,lastLimboFreeSnapshotVersion:n,query:s}}function bh(r){const t=wh({parent:r.parent,structuredQuery:r.structuredQuery});return r.limitType==="LAST"?zs(t,t.limit,"L"):t}function Hi(r,t){return new Wo(t.largestBatchId,Eo(r.yt,t.overlayMutation))}function mc(r,t){const e=t.path.lastSegment();return[r,Rt(t.path.popLast()),e]}function gc(r,t,e,n){return{indexId:r,uid:t,sequenceNumber:e,readTime:He(n.readTime),documentKey:Rt(n.documentKey.path),largestBatchId:n.largestBatchId}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ym{getBundleMetadata(t,e){return pc(t).get(e).next((n=>{if(n)return(function(i){return{id:i.bundleId,createTime:Je(i.createTime),version:i.version}})(n)}))}saveBundleMetadata(t,e){return pc(t).put((function(s){return{bundleId:s.id,createTime:He(yt(s.createTime)),version:s.version}})(e))}getNamedQuery(t,e){return _c(t).get(e).next((n=>{if(n)return(function(i){return{name:i.name,query:bh(i.bundledQuery),readTime:Je(i.readTime)}})(n)}))}saveNamedQuery(t,e){return _c(t).put((function(s){return{name:s.name,readTime:He(yt(s.readTime)),bundledQuery:s.bundledQuery}})(e))}}function pc(r){return gt(r,ri)}function _c(r){return gt(r,si)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hi{constructor(t,e){this.serializer=t,this.userId=e}static wt(t,e){const n=e.uid||"";return new hi(t,n)}getOverlay(t,e){return cr(t).get(mc(this.userId,e)).next((n=>n?Hi(this.serializer,n):null))}getOverlays(t,e){const n=Wt();return v.forEach(e,(s=>this.getOverlay(t,s).next((i=>{i!==null&&n.set(s,i)})))).next((()=>n))}saveOverlays(t,e,n){const s=[];return n.forEach(((i,a)=>{const u=new Wo(e,a);s.push(this.St(t,u))})),v.waitFor(s)}removeOverlaysForBatchId(t,e,n){const s=new Set;e.forEach((a=>s.add(Rt(a.getCollectionPath()))));const i=[];return s.forEach((a=>{const u=IDBKeyRange.bound([this.userId,a,n],[this.userId,a,n+1],!1,!0);i.push(cr(t).X(co,u))})),v.waitFor(i)}getOverlaysForCollection(t,e,n){const s=Wt(),i=Rt(e),a=IDBKeyRange.bound([this.userId,i,n],[this.userId,i,Number.POSITIVE_INFINITY],!0);return cr(t).J(co,a).next((u=>{for(const l of u){const d=Hi(this.serializer,l);s.set(d.getKey(),d)}return s}))}getOverlaysForCollectionGroup(t,e,n,s){const i=Wt();let a;const u=IDBKeyRange.bound([this.userId,e,n],[this.userId,e,Number.POSITIVE_INFINITY],!0);return cr(t).ee({index:Sl,range:u},((l,d,f)=>{const g=Hi(this.serializer,d);i.size()<s||g.largestBatchId===a?(i.set(g.getKey(),g),a=g.largestBatchId):f.done()})).next((()=>i))}St(t,e){return cr(t).put((function(s,i,a){const[u,l,d]=mc(i,a.mutation.key);return{userId:i,collectionPath:l,documentId:d,collectionGroup:a.mutation.key.getCollectionGroup(),largestBatchId:a.largestBatchId,overlayMutation:Br(s.yt,a.mutation)}})(this.serializer,this.userId,e))}}function cr(r){return gt(r,ii)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xm{bt(t){return gt(t,Fo)}getSessionToken(t){return this.bt(t).get("sessionToken").next((e=>{const n=e==null?void 0:e.value;return n?ht.fromUint8Array(n):ht.EMPTY_BYTE_STRING}))}setSessionToken(t,e){return this.bt(t).put({name:"sessionToken",value:e.toUint8Array()})}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Be{constructor(){}Dt(t,e){this.Ct(t,e),e.vt()}Ct(t,e){if("nullValue"in t)this.Ft(e,5);else if("booleanValue"in t)this.Ft(e,10),e.Mt(t.booleanValue?1:0);else if("integerValue"in t)this.Ft(e,15),e.Mt(st(t.integerValue));else if("doubleValue"in t){const n=st(t.doubleValue);isNaN(n)?this.Ft(e,13):(this.Ft(e,15),br(n)?e.Mt(0):e.Mt(n))}else if("timestampValue"in t){let n=t.timestampValue;this.Ft(e,20),typeof n=="string"&&(n=te(n)),e.xt(`${n.seconds||""}`),e.Mt(n.nanos||0)}else if("stringValue"in t)this.Ot(t.stringValue,e),this.Nt(e);else if("bytesValue"in t)this.Ft(e,30),e.Bt(ee(t.bytesValue)),this.Nt(e);else if("referenceValue"in t)this.Lt(t.referenceValue,e);else if("geoPointValue"in t){const n=t.geoPointValue;this.Ft(e,45),e.Mt(n.latitude||0),e.Mt(n.longitude||0)}else"mapValue"in t?Ul(t)?this.Ft(e,Number.MAX_SAFE_INTEGER):ai(t)?this.kt(t.mapValue,e):(this.qt(t.mapValue,e),this.Nt(e)):"arrayValue"in t?(this.Kt(t.arrayValue,e),this.Nt(e)):O(19022,{Ut:t})}Ot(t,e){this.Ft(e,25),this.$t(t,e)}$t(t,e){e.xt(t)}qt(t,e){const n=t.fields||{};this.Ft(e,55);for(const s of Object.keys(n))this.Ot(s,e),this.Ct(n[s],e)}kt(t,e){var a,u;const n=t.fields||{};this.Ft(e,53);const s=Vn,i=((u=(a=n[s].arrayValue)==null?void 0:a.values)==null?void 0:u.length)||0;this.Ft(e,15),e.Mt(st(i)),this.Ot(s,e),this.Ct(n[s],e)}Kt(t,e){const n=t.values||[];this.Ft(e,50);for(const s of n)this.Ct(s,e)}Lt(t,e){this.Ft(e,37),N.fromName(t).path.forEach((n=>{this.Ft(e,60),this.$t(n,e)}))}Ft(t,e){t.Mt(e)}Nt(t){t.Mt(2)}}Be.Wt=new Be;/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law | agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES | CONDITIONS OF ANY KIND, either express | implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const an=255;function Zm(r){if(r===0)return 8;let t=0;return r>>4||(t+=4,r<<=4),r>>6||(t+=2,r<<=2),r>>7||(t+=1),t}function yc(r){const t=64-(function(n){let s=0;for(let i=0;i<8;++i){const a=Zm(255&n[i]);if(s+=a,a!==8)break}return s})(r);return Math.ceil(t/8)}class tg{constructor(){this.buffer=new Uint8Array(1024),this.position=0}Qt(t){const e=t[Symbol.iterator]();let n=e.next();for(;!n.done;)this.Gt(n.value),n=e.next();this.zt()}jt(t){const e=t[Symbol.iterator]();let n=e.next();for(;!n.done;)this.Jt(n.value),n=e.next();this.Ht()}Zt(t){for(const e of t){const n=e.charCodeAt(0);if(n<128)this.Gt(n);else if(n<2048)this.Gt(960|n>>>6),this.Gt(128|63&n);else if(e<"\uD800"||"\uDBFF"<e)this.Gt(480|n>>>12),this.Gt(128|63&n>>>6),this.Gt(128|63&n);else{const s=e.codePointAt(0);this.Gt(240|s>>>18),this.Gt(128|63&s>>>12),this.Gt(128|63&s>>>6),this.Gt(128|63&s)}}this.zt()}Xt(t){for(const e of t){const n=e.charCodeAt(0);if(n<128)this.Jt(n);else if(n<2048)this.Jt(960|n>>>6),this.Jt(128|63&n);else if(e<"\uD800"||"\uDBFF"<e)this.Jt(480|n>>>12),this.Jt(128|63&n>>>6),this.Jt(128|63&n);else{const s=e.codePointAt(0);this.Jt(240|s>>>18),this.Jt(128|63&s>>>12),this.Jt(128|63&s>>>6),this.Jt(128|63&s)}}this.Ht()}Yt(t){const e=this.en(t),n=yc(e);this.tn(1+n),this.buffer[this.position++]=255&n;for(let s=e.length-n;s<e.length;++s)this.buffer[this.position++]=255&e[s]}nn(t){const e=this.en(t),n=yc(e);this.tn(1+n),this.buffer[this.position++]=~(255&n);for(let s=e.length-n;s<e.length;++s)this.buffer[this.position++]=~(255&e[s])}rn(){this.sn(an),this.sn(255)}_n(){this.an(an),this.an(255)}reset(){this.position=0}seed(t){this.tn(t.length),this.buffer.set(t,this.position),this.position+=t.length}un(){return this.buffer.slice(0,this.position)}en(t){const e=(function(i){const a=new DataView(new ArrayBuffer(8));return a.setFloat64(0,i,!1),new Uint8Array(a.buffer)})(t),n=!!(128&e[0]);e[0]^=n?255:128;for(let s=1;s<e.length;++s)e[s]^=n?255:0;return e}Gt(t){const e=255&t;e===0?(this.sn(0),this.sn(255)):e===an?(this.sn(an),this.sn(0)):this.sn(e)}Jt(t){const e=255&t;e===0?(this.an(0),this.an(255)):e===an?(this.an(an),this.an(0)):this.an(t)}zt(){this.sn(0),this.sn(1)}Ht(){this.an(0),this.an(1)}sn(t){this.tn(1),this.buffer[this.position++]=t}an(t){this.tn(1),this.buffer[this.position++]=~t}tn(t){const e=t+this.position;if(e<=this.buffer.length)return;let n=2*this.buffer.length;n<e&&(n=e);const s=new Uint8Array(n);s.set(this.buffer),this.buffer=s}}class eg{constructor(t){this.cn=t}Bt(t){this.cn.Qt(t)}xt(t){this.cn.Zt(t)}Mt(t){this.cn.Yt(t)}vt(){this.cn.rn()}}class ng{constructor(t){this.cn=t}Bt(t){this.cn.jt(t)}xt(t){this.cn.Xt(t)}Mt(t){this.cn.nn(t)}vt(){this.cn._n()}}class lr{constructor(){this.cn=new tg,this.ascending=new eg(this.cn),this.descending=new ng(this.cn)}seed(t){this.cn.seed(t)}ln(t){return t===0?this.ascending:this.descending}un(){return this.cn.un()}reset(){this.cn.reset()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qe{constructor(t,e,n,s){this.hn=t,this.Pn=e,this.Tn=n,this.En=s}In(){const t=this.En.length,e=t===0||this.En[t-1]===255?t+1:t,n=new Uint8Array(e);return n.set(this.En,0),e!==t?n.set([0],this.En.length):++n[n.length-1],new qe(this.hn,this.Pn,this.Tn,n)}Rn(t,e,n){return{indexId:this.hn,uid:t,arrayValue:xs(this.Tn),directionalValue:xs(this.En),orderedDocumentKey:xs(e),documentKey:n.path.toArray()}}An(t,e,n){const s=this.Rn(t,e,n);return[s.indexId,s.uid,s.arrayValue,s.directionalValue,s.orderedDocumentKey,s.documentKey]}}function he(r,t){let e=r.hn-t.hn;return e!==0?e:(e=Ic(r.Tn,t.Tn),e!==0?e:(e=Ic(r.En,t.En),e!==0?e:N.comparator(r.Pn,t.Pn)))}function Ic(r,t){for(let e=0;e<r.length&&e<t.length;++e){const n=r[e]-t[e];if(n!==0)return n}return r.length-t.length}function xs(r){return il()?(function(e){let n="";for(let s=0;s<e.length;s++)n+=String.fromCharCode(e[s]);return n})(r):r}function Tc(r){return typeof r!="string"?r:(function(e){const n=new Uint8Array(e.length);for(let s=0;s<e.length;s++)n[s]=e.charCodeAt(s);return n})(r)}class Ec{constructor(t){this.Vn=new Z(((e,n)=>at.comparator(e.field,n.field))),this.collectionId=t.collectionGroup!=null?t.collectionGroup:t.path.lastSegment(),this.dn=t.orderBy,this.mn=[];for(const e of t.filters){const n=e;n.isInequality()?this.Vn=this.Vn.add(n):this.mn.push(n)}}get fn(){return this.Vn.size>1}gn(t){if(L(t.collectionGroup===this.collectionId,49279),this.fn)return!1;const e=oo(t);if(e!==void 0&&!this.pn(e))return!1;const n=Oe(t);let s=new Set,i=0,a=0;for(;i<n.length&&this.pn(n[i]);++i)s=s.add(n[i].fieldPath.canonicalString());if(i===n.length)return!0;if(this.Vn.size>0){const u=this.Vn.getIterator().getNext();if(!s.has(u.field.canonicalString())){const l=n[i];if(!this.yn(u,l)||!this.wn(this.dn[a++],l))return!1}++i}for(;i<n.length;++i){const u=n[i];if(a>=this.dn.length||!this.wn(this.dn[a++],u))return!1}return!0}Sn(){if(this.fn)return null;let t=new Z(at.comparator);const e=[];for(const n of this.mn)if(!n.field.isKeyField())if(n.op==="array-contains"||n.op==="array-contains-any")e.push(new As(n.field,2));else{if(t.has(n.field))continue;t=t.add(n.field),e.push(new As(n.field,0))}for(const n of this.dn)n.field.isKeyField()||t.has(n.field)||(t=t.add(n.field),e.push(new As(n.field,n.dir==="asc"?0:1)));return new Os(Os.UNKNOWN_ID,this.collectionId,e,Pr.empty())}pn(t){for(const e of this.mn)if(this.yn(e,t))return!0;return!1}yn(t,e){if(t===void 0||!t.field.isEqual(e.fieldPath))return!1;const n=t.op==="array-contains"||t.op==="array-contains-any";return e.kind===2===n}wn(t,e){return!!t.field.isEqual(e.fieldPath)&&(e.kind===0&&t.dir==="asc"||e.kind===1&&t.dir==="desc")}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ch(r){var e,n;if(L(r instanceof K||r instanceof X,20012),r instanceof K){if(r instanceof Wl){const s=((n=(e=r.value.arrayValue)==null?void 0:e.values)==null?void 0:n.map((i=>K.create(r.field,"==",i))))||[];return X.create(s,"or")}return r}const t=r.filters.map((s=>Ch(s)));return X.create(t,r.op)}function rg(r){if(r.getFilters().length===0)return[];const t=Ao(Ch(r));return L(Dh(t),7391),wo(t)||vo(t)?[t]:t.getFilters()}function wo(r){return r instanceof K}function vo(r){return r instanceof X&&jo(r)}function Dh(r){return wo(r)||vo(r)||(function(e){if(e instanceof X&&mo(e)){for(const n of e.getFilters())if(!wo(n)&&!vo(n))return!1;return!0}return!1})(r)}function Ao(r){if(L(r instanceof K||r instanceof X,34018),r instanceof K)return r;if(r.filters.length===1)return Ao(r.filters[0]);const t=r.filters.map((n=>Ao(n)));let e=X.create(t,r.op);return e=Ks(e),Dh(e)?e:(L(e instanceof X,64498),L(bn(e),40251),L(e.filters.length>1,57927),e.filters.reduce(((n,s)=>Yo(n,s))))}function Yo(r,t){let e;return L(r instanceof K||r instanceof X,38388),L(t instanceof K||t instanceof X,25473),e=r instanceof K?t instanceof K?(function(s,i){return X.create([s,i],"and")})(r,t):wc(r,t):t instanceof K?wc(t,r):(function(s,i){if(L(s.filters.length>0&&i.filters.length>0,48005),bn(s)&&bn(i))return Kl(s,i.getFilters());const a=mo(s)?s:i,u=mo(s)?i:s,l=a.filters.map((d=>Yo(d,u)));return X.create(l,"or")})(r,t),Ks(e)}function wc(r,t){if(bn(t))return Kl(t,r.getFilters());{const e=t.filters.map((n=>Yo(r,n)));return X.create(e,"or")}}function Ks(r){if(L(r instanceof K||r instanceof X,11850),r instanceof K)return r;const t=r.getFilters();if(t.length===1)return Ks(t[0]);if(zl(r))return r;const e=t.map((s=>Ks(s))),n=[];return e.forEach((s=>{s instanceof K?n.push(s):s instanceof X&&(s.op===r.op?n.push(...s.filters):n.push(s))})),n.length===1?n[0]:X.create(n,r.op)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sg{constructor(){this.bn=new Xo}addToCollectionParentIndex(t,e){return this.bn.add(e),v.resolve()}getCollectionParents(t,e){return v.resolve(this.bn.getEntries(e))}addFieldIndex(t,e){return v.resolve()}deleteFieldIndex(t,e){return v.resolve()}deleteAllFieldIndexes(t){return v.resolve()}createTargetIndexes(t,e){return v.resolve()}getDocumentsMatchingTarget(t,e){return v.resolve(null)}getIndexType(t,e){return v.resolve(0)}getFieldIndexes(t,e){return v.resolve([])}getNextCollectionGroupToUpdate(t){return v.resolve(null)}getMinOffset(t,e){return v.resolve(Lt.min())}getMinOffsetFromCollectionGroup(t,e){return v.resolve(Lt.min())}updateCollectionGroup(t,e,n){return v.resolve()}updateIndexEntries(t,e){return v.resolve()}}class Xo{constructor(){this.index={}}add(t){const e=t.lastSegment(),n=t.popLast(),s=this.index[e]||new Z(H.comparator),i=!s.has(n);return this.index[e]=s.add(n),i}has(t){const e=t.lastSegment(),n=t.popLast(),s=this.index[e];return s&&s.has(n)}getEntries(t){return(this.index[t]||new Z(H.comparator)).toArray()}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vc="IndexedDbIndexManager",Is=new Uint8Array(0);class ig{constructor(t,e){this.databaseId=e,this.Dn=new Xo,this.Cn=new ne((n=>We(n)),((n,s)=>$r(n,s))),this.uid=t.uid||""}addToCollectionParentIndex(t,e){if(!this.Dn.has(e)){const n=e.lastSegment(),s=e.popLast();t.addOnCommittedListener((()=>{this.Dn.add(e)}));const i={collectionId:n,parent:Rt(s)};return Ac(t).put(i)}return v.resolve()}getCollectionParents(t,e){const n=[],s=IDBKeyRange.bound([e,""],[fl(e),""],!1,!0);return Ac(t).J(s).next((i=>{for(const a of i){if(a.collectionId!==e)break;n.push(Qt(a.parent))}return n}))}addFieldIndex(t,e){const n=hr(t),s=(function(u){return{indexId:u.indexId,collectionGroup:u.collectionGroup,fields:u.fields.map((l=>[l.fieldPath.canonicalString(),l.kind]))}})(e);delete s.indexId;const i=n.add(s);if(e.indexState){const a=cn(t);return i.next((u=>{a.put(gc(u,this.uid,e.indexState.sequenceNumber,e.indexState.offset))}))}return i.next()}deleteFieldIndex(t,e){const n=hr(t),s=cn(t),i=un(t);return n.delete(e.indexId).next((()=>s.delete(IDBKeyRange.bound([e.indexId],[e.indexId+1],!1,!0)))).next((()=>i.delete(IDBKeyRange.bound([e.indexId],[e.indexId+1],!1,!0))))}deleteAllFieldIndexes(t){const e=hr(t),n=un(t),s=cn(t);return e.X().next((()=>n.X())).next((()=>s.X()))}createTargetIndexes(t,e){return v.forEach(this.vn(e),(n=>this.getIndexType(t,n).next((s=>{if(s===0||s===1){const i=new Ec(n).Sn();if(i!=null)return this.addFieldIndex(t,i)}}))))}getDocumentsMatchingTarget(t,e){const n=un(t);let s=!0;const i=new Map;return v.forEach(this.vn(e),(a=>this.Fn(t,a).next((u=>{s&&(s=!!u),i.set(a,u)})))).next((()=>{if(s){let a=G();const u=[];return v.forEach(i,((l,d)=>{b(vc,`Using index ${(function(q){return`id=${q.indexId}|cg=${q.collectionGroup}|f=${q.fields.map((nt=>`${nt.fieldPath}:${nt.kind}`)).join(",")}`})(l)} to execute ${We(e)}`);const f=(function(q,nt){const W=oo(nt);if(W===void 0)return null;for(const J of js(q,W.fieldPath))switch(J.op){case"array-contains-any":return J.value.arrayValue.values||[];case"array-contains":return[J.value]}return null})(d,l),g=(function(q,nt){const W=new Map;for(const J of Oe(nt))for(const I of js(q,J.fieldPath))switch(I.op){case"==":case"in":W.set(J.fieldPath.canonicalString(),I.value);break;case"not-in":case"!=":return W.set(J.fieldPath.canonicalString(),I.value),Array.from(W.values())}return null})(d,l),T=(function(q,nt){const W=[];let J=!0;for(const I of Oe(nt)){const p=I.kind===0?ec(q,I.fieldPath,q.startAt):nc(q,I.fieldPath,q.startAt);W.push(p.value),J&&(J=p.inclusive)}return new Pn(W,J)})(d,l),P=(function(q,nt){const W=[];let J=!0;for(const I of Oe(nt)){const p=I.kind===0?nc(q,I.fieldPath,q.endAt):ec(q,I.fieldPath,q.endAt);W.push(p.value),J&&(J=p.inclusive)}return new Pn(W,J)})(d,l),x=this.Mn(l,d,T),k=this.Mn(l,d,P),M=this.xn(l,d,g),$=this.On(l.indexId,f,x,T.inclusive,k,P.inclusive,M);return v.forEach($,(j=>n.Z(j,e.limit).next((q=>{q.forEach((nt=>{const W=N.fromSegments(nt.documentKey);a.has(W)||(a=a.add(W),u.push(W))}))}))))})).next((()=>u))}return v.resolve(null)}))}vn(t){let e=this.Cn.get(t);return e||(t.filters.length===0?e=[t]:e=rg(X.create(t.filters,"and")).map((n=>po(t.path,t.collectionGroup,t.orderBy,n.getFilters(),t.limit,t.startAt,t.endAt))),this.Cn.set(t,e),e)}On(t,e,n,s,i,a,u){const l=(e!=null?e.length:1)*Math.max(n.length,i.length),d=l/(e!=null?e.length:1),f=[];for(let g=0;g<l;++g){const T=e?this.Nn(e[g/d]):Is,P=this.Bn(t,T,n[g%d],s),x=this.Ln(t,T,i[g%d],a),k=u.map((M=>this.Bn(t,T,M,!0)));f.push(...this.createRange(P,x,k))}return f}Bn(t,e,n,s){const i=new qe(t,N.empty(),e,n);return s?i:i.In()}Ln(t,e,n,s){const i=new qe(t,N.empty(),e,n);return s?i.In():i}Fn(t,e){const n=new Ec(e),s=e.collectionGroup!=null?e.collectionGroup:e.path.lastSegment();return this.getFieldIndexes(t,s).next((i=>{let a=null;for(const u of i)n.gn(u)&&(!a||u.fields.length>a.fields.length)&&(a=u);return a}))}getIndexType(t,e){let n=2;const s=this.vn(e);return v.forEach(s,(i=>this.Fn(t,i).next((a=>{a?n!==0&&a.fields.length<(function(l){let d=new Z(at.comparator),f=!1;for(const g of l.filters)for(const T of g.getFlattenedFilters())T.field.isKeyField()||(T.op==="array-contains"||T.op==="array-contains-any"?f=!0:d=d.add(T.field));for(const g of l.orderBy)g.field.isKeyField()||(d=d.add(g.field));return d.size+(f?1:0)})(i)&&(n=1):n=0})))).next((()=>(function(a){return a.limit!==null})(e)&&s.length>1&&n===2?1:n))}kn(t,e){const n=new lr;for(const s of Oe(t)){const i=e.data.field(s.fieldPath);if(i==null)return null;const a=n.ln(s.kind);Be.Wt.Dt(i,a)}return n.un()}Nn(t){const e=new lr;return Be.Wt.Dt(t,e.ln(0)),e.un()}qn(t,e){const n=new lr;return Be.Wt.Dt(Mr(this.databaseId,e),n.ln((function(i){const a=Oe(i);return a.length===0?0:a[a.length-1].kind})(t))),n.un()}xn(t,e,n){if(n===null)return[];let s=[];s.push(new lr);let i=0;for(const a of Oe(t)){const u=n[i++];for(const l of s)if(this.Kn(e,a.fieldPath)&&Or(u))s=this.Un(s,a,u);else{const d=l.ln(a.kind);Be.Wt.Dt(u,d)}}return this.$n(s)}Mn(t,e,n){return this.xn(t,e,n.position)}$n(t){const e=[];for(let n=0;n<t.length;++n)e[n]=t[n].un();return e}Un(t,e,n){const s=[...t],i=[];for(const a of n.arrayValue.values||[])for(const u of s){const l=new lr;l.seed(u.un()),Be.Wt.Dt(a,l.ln(e.kind)),i.push(l)}return i}Kn(t,e){return!!t.filters.find((n=>n instanceof K&&n.field.isEqual(e)&&(n.op==="in"||n.op==="not-in")))}getFieldIndexes(t,e){const n=hr(t),s=cn(t);return(e?n.J(uo,IDBKeyRange.bound(e,e)):n.J()).next((i=>{const a=[];return v.forEach(i,(u=>s.get([u.indexId,this.uid]).next((l=>{a.push((function(f,g){const T=g?new Pr(g.sequenceNumber,new Lt(Je(g.readTime),new N(Qt(g.documentKey)),g.largestBatchId)):Pr.empty(),P=f.fields.map((([x,k])=>new As(at.fromServerFormat(x),k)));return new Os(f.indexId,f.collectionGroup,P,T)})(u,l))})))).next((()=>a))}))}getNextCollectionGroupToUpdate(t){return this.getFieldIndexes(t).next((e=>e.length===0?null:(e.sort(((n,s)=>{const i=n.indexState.sequenceNumber-s.indexState.sequenceNumber;return i!==0?i:B(n.collectionGroup,s.collectionGroup)})),e[0].collectionGroup)))}updateCollectionGroup(t,e,n){const s=hr(t),i=cn(t);return this.Wn(t).next((a=>s.J(uo,IDBKeyRange.bound(e,e)).next((u=>v.forEach(u,(l=>i.put(gc(l.indexId,this.uid,a,n))))))))}updateIndexEntries(t,e){const n=new Map;return v.forEach(e,((s,i)=>{const a=n.get(s.collectionGroup);return(a?v.resolve(a):this.getFieldIndexes(t,s.collectionGroup)).next((u=>(n.set(s.collectionGroup,u),v.forEach(u,(l=>this.Qn(t,s,l).next((d=>{const f=this.Gn(i,l);return d.isEqual(f)?v.resolve():this.zn(t,i,l,d,f)})))))))}))}jn(t,e,n,s){return un(t).put(s.Rn(this.uid,this.qn(n,e.key),e.key))}Jn(t,e,n,s){return un(t).delete(s.An(this.uid,this.qn(n,e.key),e.key))}Qn(t,e,n){const s=un(t);let i=new Z(he);return s.ee({index:Vl,range:IDBKeyRange.only([n.indexId,this.uid,xs(this.qn(n,e))])},((a,u)=>{i=i.add(new qe(n.indexId,e,Tc(u.arrayValue),Tc(u.directionalValue)))})).next((()=>i))}Gn(t,e){let n=new Z(he);const s=this.kn(e,t);if(s==null)return n;const i=oo(e);if(i!=null){const a=t.data.field(i.fieldPath);if(Or(a))for(const u of a.arrayValue.values||[])n=n.add(new qe(e.indexId,t.key,this.Nn(u),s))}else n=n.add(new qe(e.indexId,t.key,Is,s));return n}zn(t,e,n,s,i){b(vc,"Updating index entries for document '%s'",e.key);const a=[];return(function(l,d,f,g,T){const P=l.getIterator(),x=d.getIterator();let k=on(P),M=on(x);for(;k||M;){let $=!1,j=!1;if(k&&M){const q=f(k,M);q<0?j=!0:q>0&&($=!0)}else k!=null?j=!0:$=!0;$?(g(M),M=on(x)):j?(T(k),k=on(P)):(k=on(P),M=on(x))}})(s,i,he,(u=>{a.push(this.jn(t,e,n,u))}),(u=>{a.push(this.Jn(t,e,n,u))})),v.waitFor(a)}Wn(t){let e=1;return cn(t).ee({index:Rl,reverse:!0,range:IDBKeyRange.upperBound([this.uid,Number.MAX_SAFE_INTEGER])},((n,s,i)=>{i.done(),e=s.sequenceNumber+1})).next((()=>e))}createRange(t,e,n){n=n.sort(((a,u)=>he(a,u))).filter(((a,u,l)=>!u||he(a,l[u-1])!==0));const s=[];s.push(t);for(const a of n){const u=he(a,t),l=he(a,e);if(u===0)s[0]=t.In();else if(u>0&&l<0)s.push(a),s.push(a.In());else if(l>0)break}s.push(e);const i=[];for(let a=0;a<s.length;a+=2){if(this.Hn(s[a],s[a+1]))return[];const u=s[a].An(this.uid,Is,N.empty()),l=s[a+1].An(this.uid,Is,N.empty());i.push(IDBKeyRange.bound(u,l))}return i}Hn(t,e){return he(t,e)>0}getMinOffsetFromCollectionGroup(t,e){return this.getFieldIndexes(t,e).next(Rc)}getMinOffset(t,e){return v.mapArray(this.vn(e),(n=>this.Fn(t,n).next((s=>s||O(44426))))).next(Rc)}}function Ac(r){return gt(r,xr)}function un(r){return gt(r,wr)}function hr(r){return gt(r,Oo)}function cn(r){return gt(r,Er)}function Rc(r){L(r.length!==0,28825);let t=r[0].indexState.offset,e=t.largestBatchId;for(let n=1;n<r.length;n++){const s=r[n].indexState.offset;No(s,t)<0&&(t=s),e<s.largestBatchId&&(e=s.largestBatchId)}return new Lt(t.readTime,t.documentKey,e)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vc={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},xh=41943040;class At{static withCacheSize(t){return new At(t,At.DEFAULT_COLLECTION_PERCENTILE,At.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(t,e,n){this.cacheSizeCollectionThreshold=t,this.percentileToCollect=e,this.maximumSequenceNumbersToCollect=n}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nh(r,t,e){const n=r.store(Ut),s=r.store(wn),i=[],a=IDBKeyRange.only(e.batchId);let u=0;const l=n.ee({range:a},((f,g,T)=>(u++,T.delete())));i.push(l.next((()=>{L(u===1,47070,{batchId:e.batchId})})));const d=[];for(const f of e.mutations){const g=wl(t,f.key.path,e.batchId);i.push(s.delete(g)),d.push(f.key)}return v.waitFor(i).next((()=>d))}function $s(r){if(!r)return 0;let t;if(r.document)t=r.document;else if(r.unknownDocument)t=r.unknownDocument;else{if(!r.noDocument)throw O(14731);t=r.noDocument}return JSON.stringify(t).length}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */At.DEFAULT_COLLECTION_PERCENTILE=10,At.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,At.DEFAULT=new At(xh,At.DEFAULT_COLLECTION_PERCENTILE,At.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),At.DISABLED=new At(-1,0,0);class di{constructor(t,e,n,s){this.userId=t,this.serializer=e,this.indexManager=n,this.referenceDelegate=s,this.Zn={}}static wt(t,e,n,s){L(t.uid!=="",64387);const i=t.isAuthenticated()?t.uid:"";return new di(i,e,n,s)}checkEmpty(t){let e=!0;const n=IDBKeyRange.bound([this.userId,Number.NEGATIVE_INFINITY],[this.userId,Number.POSITIVE_INFINITY]);return de(t).ee({index:je,range:n},((s,i,a)=>{e=!1,a.done()})).next((()=>e))}addMutationBatch(t,e,n,s){const i=gn(t),a=de(t);return a.add({}).next((u=>{L(typeof u=="number",49019);const l=new $o(u,e,n,s),d=(function(P,x,k){const M=k.baseMutations.map((j=>Br(P.yt,j))),$=k.mutations.map((j=>Br(P.yt,j)));return{userId:x,batchId:k.batchId,localWriteTimeMs:k.localWriteTime.toMillis(),baseMutations:M,mutations:$}})(this.serializer,this.userId,l),f=[];let g=new Z(((T,P)=>B(T.canonicalString(),P.canonicalString())));for(const T of s){const P=wl(this.userId,T.key.path,u);g=g.add(T.key.path.popLast()),f.push(a.put(d)),f.push(i.put(P,kf))}return g.forEach((T=>{f.push(this.indexManager.addToCollectionParentIndex(t,T))})),t.addOnCommittedListener((()=>{this.Zn[u]=l.keys()})),v.waitFor(f).next((()=>l))}))}lookupMutationBatch(t,e){return de(t).get(e).next((n=>n?(L(n.userId===this.userId,48,"Unexpected user for mutation batch",{userId:n.userId,batchId:e}),Ue(this.serializer,n)):null))}Xn(t,e){return this.Zn[e]?v.resolve(this.Zn[e]):this.lookupMutationBatch(t,e).next((n=>{if(n){const s=n.keys();return this.Zn[e]=s,s}return null}))}getNextMutationBatchAfterBatchId(t,e){const n=e+1,s=IDBKeyRange.lowerBound([this.userId,n]);let i=null;return de(t).ee({index:je,range:s},((a,u,l)=>{u.userId===this.userId&&(L(u.batchId>=n,47524,{Yn:n}),i=Ue(this.serializer,u)),l.done()})).next((()=>i))}getHighestUnacknowledgedBatchId(t){const e=IDBKeyRange.upperBound([this.userId,Number.POSITIVE_INFINITY]);let n=ze;return de(t).ee({index:je,range:e,reverse:!0},((s,i,a)=>{n=i.batchId,a.done()})).next((()=>n))}getAllMutationBatches(t){const e=IDBKeyRange.bound([this.userId,ze],[this.userId,Number.POSITIVE_INFINITY]);return de(t).J(je,e).next((n=>n.map((s=>Ue(this.serializer,s)))))}getAllMutationBatchesAffectingDocumentKey(t,e){const n=Rs(this.userId,e.path),s=IDBKeyRange.lowerBound(n),i=[];return gn(t).ee({range:s},((a,u,l)=>{const[d,f,g]=a,T=Qt(f);if(d===this.userId&&e.path.isEqual(T))return de(t).get(g).next((P=>{if(!P)throw O(61480,{er:a,batchId:g});L(P.userId===this.userId,10503,"Unexpected user for mutation batch",{userId:P.userId,batchId:g}),i.push(Ue(this.serializer,P))}));l.done()})).next((()=>i))}getAllMutationBatchesAffectingDocumentKeys(t,e){let n=new Z(B);const s=[];return e.forEach((i=>{const a=Rs(this.userId,i.path),u=IDBKeyRange.lowerBound(a),l=gn(t).ee({range:u},((d,f,g)=>{const[T,P,x]=d,k=Qt(P);T===this.userId&&i.path.isEqual(k)?n=n.add(x):g.done()}));s.push(l)})),v.waitFor(s).next((()=>this.tr(t,n)))}getAllMutationBatchesAffectingQuery(t,e){const n=e.path,s=n.length+1,i=Rs(this.userId,n),a=IDBKeyRange.lowerBound(i);let u=new Z(B);return gn(t).ee({range:a},((l,d,f)=>{const[g,T,P]=l,x=Qt(T);g===this.userId&&n.isPrefixOf(x)?x.length===s&&(u=u.add(P)):f.done()})).next((()=>this.tr(t,u)))}tr(t,e){const n=[],s=[];return e.forEach((i=>{s.push(de(t).get(i).next((a=>{if(a===null)throw O(35274,{batchId:i});L(a.userId===this.userId,9748,"Unexpected user for mutation batch",{userId:a.userId,batchId:i}),n.push(Ue(this.serializer,a))})))})),v.waitFor(s).next((()=>n))}removeMutationBatch(t,e){return Nh(t.le,this.userId,e).next((n=>(t.addOnCommittedListener((()=>{this.nr(e.batchId)})),v.forEach(n,(s=>this.referenceDelegate.markPotentiallyOrphaned(t,s))))))}nr(t){delete this.Zn[t]}performConsistencyCheck(t){return this.checkEmpty(t).next((e=>{if(!e)return v.resolve();const n=IDBKeyRange.lowerBound((function(a){return[a]})(this.userId)),s=[];return gn(t).ee({range:n},((i,a,u)=>{if(i[0]===this.userId){const l=Qt(i[1]);s.push(l)}else u.done()})).next((()=>{L(s.length===0,56720,{rr:s.map((i=>i.canonicalString()))})}))}))}containsKey(t,e){return kh(t,this.userId,e)}ir(t){return Mh(t).get(this.userId).next((e=>e||{userId:this.userId,lastAcknowledgedBatchId:ze,lastStreamToken:""}))}}function kh(r,t,e){const n=Rs(t,e.path),s=n[1],i=IDBKeyRange.lowerBound(n);let a=!1;return gn(r).ee({range:i,Y:!0},((u,l,d)=>{const[f,g,T]=u;f===t&&g===s&&(a=!0),d.done()})).next((()=>a))}function de(r){return gt(r,Ut)}function gn(r){return gt(r,wn)}function Mh(r){return gt(r,Cr)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ye{constructor(t){this.sr=t}next(){return this.sr+=2,this.sr}static _r(){return new Ye(0)}static ar(){return new Ye(-1)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class og{constructor(t,e){this.referenceDelegate=t,this.serializer=e}allocateTargetId(t){return this.ur(t).next((e=>{const n=new Ye(e.highestTargetId);return e.highestTargetId=n.next(),this.cr(t,e).next((()=>e.highestTargetId))}))}getLastRemoteSnapshotVersion(t){return this.ur(t).next((e=>U.fromTimestamp(new Y(e.lastRemoteSnapshotVersion.seconds,e.lastRemoteSnapshotVersion.nanoseconds))))}getHighestSequenceNumber(t){return this.ur(t).next((e=>e.highestListenSequenceNumber))}setTargetsMetadata(t,e,n){return this.ur(t).next((s=>(s.highestListenSequenceNumber=e,n&&(s.lastRemoteSnapshotVersion=n.toTimestamp()),e>s.highestListenSequenceNumber&&(s.highestListenSequenceNumber=e),this.cr(t,s))))}addTargetData(t,e){return this.lr(t,e).next((()=>this.ur(t).next((n=>(n.targetCount+=1,this.hr(e,n),this.cr(t,n))))))}updateTargetData(t,e){return this.lr(t,e)}removeTargetData(t,e){return this.removeMatchingKeysForTargetId(t,e.targetId).next((()=>ln(t).delete(e.targetId))).next((()=>this.ur(t))).next((n=>(L(n.targetCount>0,8065),n.targetCount-=1,this.cr(t,n))))}removeTargets(t,e,n){let s=0;const i=[];return ln(t).ee(((a,u)=>{const l=yr(u);l.sequenceNumber<=e&&n.get(l.targetId)===null&&(s++,i.push(this.removeTargetData(t,l)))})).next((()=>v.waitFor(i))).next((()=>s))}forEachTarget(t,e){return ln(t).ee(((n,s)=>{const i=yr(s);e(i)}))}ur(t){return Sc(t).get(Us).next((e=>(L(e!==null,2888),e)))}cr(t,e){return Sc(t).put(Us,e)}lr(t,e){return ln(t).put(Ph(this.serializer,e))}hr(t,e){let n=!1;return t.targetId>e.highestTargetId&&(e.highestTargetId=t.targetId,n=!0),t.sequenceNumber>e.highestListenSequenceNumber&&(e.highestListenSequenceNumber=t.sequenceNumber,n=!0),n}getTargetCount(t){return this.ur(t).next((e=>e.targetCount))}getTargetData(t,e){const n=We(e),s=IDBKeyRange.bound([n,Number.NEGATIVE_INFINITY],[n,Number.POSITIVE_INFINITY]);let i=null;return ln(t).ee({range:s,index:Al},((a,u,l)=>{const d=yr(u);$r(e,d.target)&&(i=d,l.done())})).next((()=>i))}addMatchingKeys(t,e,n){const s=[],i=me(t);return e.forEach((a=>{const u=Rt(a.path);s.push(i.put({targetId:n,path:u})),s.push(this.referenceDelegate.addReference(t,n,a))})),v.waitFor(s)}removeMatchingKeys(t,e,n){const s=me(t);return v.forEach(e,(i=>{const a=Rt(i.path);return v.waitFor([s.delete([n,a]),this.referenceDelegate.removeReference(t,n,i)])}))}removeMatchingKeysForTargetId(t,e){const n=me(t),s=IDBKeyRange.bound([e],[e+1],!1,!0);return n.delete(s)}getMatchingKeysForTargetId(t,e){const n=IDBKeyRange.bound([e],[e+1],!1,!0),s=me(t);let i=G();return s.ee({range:n,Y:!0},((a,u,l)=>{const d=Qt(a[1]),f=new N(d);i=i.add(f)})).next((()=>i))}containsKey(t,e){const n=Rt(e.path),s=IDBKeyRange.bound([n],[fl(n)],!1,!0);let i=0;return me(t).ee({index:Mo,Y:!0,range:s},(([a,u],l,d)=>{a!==0&&(i++,d.done())})).next((()=>i>0))}At(t,e){return ln(t).get(e).next((n=>n?yr(n):null))}}function ln(r){return gt(r,vn)}function Sc(r){return gt(r,Ge)}function me(r){return gt(r,An)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pc="LruGarbageCollector",Oh=1048576;function bc([r,t],[e,n]){const s=B(r,e);return s===0?B(t,n):s}class ag{constructor(t){this.Pr=t,this.buffer=new Z(bc),this.Tr=0}Er(){return++this.Tr}Ir(t){const e=[t,this.Er()];if(this.buffer.size<this.Pr)this.buffer=this.buffer.add(e);else{const n=this.buffer.last();bc(e,n)<0&&(this.buffer=this.buffer.delete(n).add(e))}}get maxValue(){return this.buffer.last()[0]}}class Fh{constructor(t,e,n){this.garbageCollector=t,this.asyncQueue=e,this.localStore=n,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Ar(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Ar(t){b(Pc,`Garbage collection scheduled in ${t}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",t,(async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(e){Ve(e)?b(Pc,"Ignoring IndexedDB error during garbage collection: ",e):await Re(e)}await this.Ar(3e5)}))}}class ug{constructor(t,e){this.Vr=t,this.params=e}calculateTargetCount(t,e){return this.Vr.dr(t).next((n=>Math.floor(e/100*n)))}nthSequenceNumber(t,e){if(e===0)return v.resolve(Ct.ce);const n=new ag(e);return this.Vr.forEachTarget(t,(s=>n.Ir(s.sequenceNumber))).next((()=>this.Vr.mr(t,(s=>n.Ir(s))))).next((()=>n.maxValue))}removeTargets(t,e,n){return this.Vr.removeTargets(t,e,n)}removeOrphanedDocuments(t,e){return this.Vr.removeOrphanedDocuments(t,e)}collect(t,e){return this.params.cacheSizeCollectionThreshold===-1?(b("LruGarbageCollector","Garbage collection skipped; disabled"),v.resolve(Vc)):this.getCacheSize(t).next((n=>n<this.params.cacheSizeCollectionThreshold?(b("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),Vc):this.gr(t,e)))}getCacheSize(t){return this.Vr.getCacheSize(t)}gr(t,e){let n,s,i,a,u,l,d;const f=Date.now();return this.calculateTargetCount(t,this.params.percentileToCollect).next((g=>(g>this.params.maximumSequenceNumbersToCollect?(b("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${g}`),s=this.params.maximumSequenceNumbersToCollect):s=g,a=Date.now(),this.nthSequenceNumber(t,s)))).next((g=>(n=g,u=Date.now(),this.removeTargets(t,n,e)))).next((g=>(i=g,l=Date.now(),this.removeOrphanedDocuments(t,n)))).next((g=>(d=Date.now(),hn()<=Yt.DEBUG&&b("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${a-f}ms
	Determined least recently used ${s} in `+(u-a)+`ms
	Removed ${i} targets in `+(l-u)+`ms
	Removed ${g} documents in `+(d-l)+`ms
Total Duration: ${d-f}ms`),v.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:i,documentsRemoved:g}))))}}function Lh(r,t){return new ug(r,t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cg{constructor(t,e){this.db=t,this.garbageCollector=Lh(this,e)}dr(t){const e=this.pr(t);return this.db.getTargetCache().getTargetCount(t).next((n=>e.next((s=>n+s))))}pr(t){let e=0;return this.mr(t,(n=>{e++})).next((()=>e))}forEachTarget(t,e){return this.db.getTargetCache().forEachTarget(t,e)}mr(t,e){return this.yr(t,((n,s)=>e(s)))}addReference(t,e,n){return Ts(t,n)}removeReference(t,e,n){return Ts(t,n)}removeTargets(t,e,n){return this.db.getTargetCache().removeTargets(t,e,n)}markPotentiallyOrphaned(t,e){return Ts(t,e)}wr(t,e){return(function(s,i){let a=!1;return Mh(s).te((u=>kh(s,u,i).next((l=>(l&&(a=!0),v.resolve(!l)))))).next((()=>a))})(t,e)}removeOrphanedDocuments(t,e){const n=this.db.getRemoteDocumentCache().newChangeBuffer(),s=[];let i=0;return this.yr(t,((a,u)=>{if(u<=e){const l=this.wr(t,a).next((d=>{if(!d)return i++,n.getEntry(t,a).next((()=>(n.removeEntry(a,U.min()),me(t).delete((function(g){return[0,Rt(g.path)]})(a)))))}));s.push(l)}})).next((()=>v.waitFor(s))).next((()=>n.apply(t))).next((()=>i))}removeTarget(t,e){const n=e.withSequenceNumber(t.currentSequenceNumber);return this.db.getTargetCache().updateTargetData(t,n)}updateLimboDocument(t,e){return Ts(t,e)}yr(t,e){const n=me(t);let s,i=Ct.ce;return n.ee({index:Mo},(([a,u],{path:l,sequenceNumber:d})=>{a===0?(i!==Ct.ce&&e(new N(Qt(s)),i),i=d,s=l):i=Ct.ce})).next((()=>{i!==Ct.ce&&e(new N(Qt(s)),i)}))}getCacheSize(t){return this.db.getRemoteDocumentCache().getSize(t)}}function Ts(r,t){return me(r).put((function(n,s){return{targetId:0,path:Rt(n.path),sequenceNumber:s}})(t,r.currentSequenceNumber))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uh{constructor(){this.changes=new ne((t=>t.toString()),((t,e)=>t.isEqual(e))),this.changesApplied=!1}addEntry(t){this.assertNotApplied(),this.changes.set(t.key,t)}removeEntry(t,e){this.assertNotApplied(),this.changes.set(t,it.newInvalidDocument(t).setReadTime(e))}getEntry(t,e){this.assertNotApplied();const n=this.changes.get(e);return n!==void 0?v.resolve(n):this.getFromCache(t,e)}getEntries(t,e){return this.getAllFromCache(t,e)}apply(t){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(t)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lg{constructor(t){this.serializer=t}setIndexManager(t){this.indexManager=t}addEntry(t,e,n){return Me(t).put(n)}removeEntry(t,e,n){return Me(t).delete((function(i,a){const u=i.path.toArray();return[u.slice(0,u.length-2),u[u.length-2],Gs(a),u[u.length-1]]})(e,n))}updateMetadata(t,e){return this.getMetadata(t).next((n=>(n.byteSize+=e,this.Sr(t,n))))}getEntry(t,e){let n=it.newInvalidDocument(e);return Me(t).ee({index:Vs,range:IDBKeyRange.only(dr(e))},((s,i)=>{n=this.br(e,i)})).next((()=>n))}Dr(t,e){let n={size:0,document:it.newInvalidDocument(e)};return Me(t).ee({index:Vs,range:IDBKeyRange.only(dr(e))},((s,i)=>{n={document:this.br(e,i),size:$s(i)}})).next((()=>n))}getEntries(t,e){let n=Mt();return this.Cr(t,e,((s,i)=>{const a=this.br(s,i);n=n.insert(s,a)})).next((()=>n))}vr(t,e){let n=Mt(),s=new et(N.comparator);return this.Cr(t,e,((i,a)=>{const u=this.br(i,a);n=n.insert(i,u),s=s.insert(i,$s(a))})).next((()=>({documents:n,Fr:s})))}Cr(t,e,n){if(e.isEmpty())return v.resolve();let s=new Z(xc);e.forEach((l=>s=s.add(l)));const i=IDBKeyRange.bound(dr(s.first()),dr(s.last())),a=s.getIterator();let u=a.getNext();return Me(t).ee({index:Vs,range:i},((l,d,f)=>{const g=N.fromSegments([...d.prefixPath,d.collectionGroup,d.documentId]);for(;u&&xc(u,g)<0;)n(u,null),u=a.getNext();u&&u.isEqual(g)&&(n(u,d),u=a.hasNext()?a.getNext():null),u?f.j(dr(u)):f.done()})).next((()=>{for(;u;)n(u,null),u=a.hasNext()?a.getNext():null}))}getDocumentsMatchingQuery(t,e,n,s,i){const a=e.path,u=[a.popLast().toArray(),a.lastSegment(),Gs(n.readTime),n.documentKey.path.isEmpty()?"":n.documentKey.path.lastSegment()],l=[a.popLast().toArray(),a.lastSegment(),[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],""];return Me(t).J(IDBKeyRange.bound(u,l,!0)).next((d=>{i==null||i.incrementDocumentReadCount(d.length);let f=Mt();for(const g of d){const T=this.br(N.fromSegments(g.prefixPath.concat(g.collectionGroup,g.documentId)),g);T.isFoundDocument()&&(Wr(e,T)||s.has(T.key))&&(f=f.insert(T.key,T))}return f}))}getAllFromCollectionGroup(t,e,n,s){let i=Mt();const a=Dc(e,n),u=Dc(e,Lt.max());return Me(t).ee({index:vl,range:IDBKeyRange.bound(a,u,!0)},((l,d,f)=>{const g=this.br(N.fromSegments(d.prefixPath.concat(d.collectionGroup,d.documentId)),d);i=i.insert(g.key,g),i.size===s&&f.done()})).next((()=>i))}newChangeBuffer(t){return new hg(this,!!t&&t.trackRemovals)}getSize(t){return this.getMetadata(t).next((e=>e.byteSize))}getMetadata(t){return Cc(t).get(ao).next((e=>(L(!!e,20021),e)))}Sr(t,e){return Cc(t).put(ao,e)}br(t,e){if(e){const n=Jm(this.serializer,e);if(!(n.isNoDocument()&&n.version.isEqual(U.min())))return n}return it.newInvalidDocument(t)}}function Bh(r){return new lg(r)}class hg extends Uh{constructor(t,e){super(),this.Mr=t,this.trackRemovals=e,this.Or=new ne((n=>n.toString()),((n,s)=>n.isEqual(s)))}applyChanges(t){const e=[];let n=0,s=new Z(((i,a)=>B(i.canonicalString(),a.canonicalString())));return this.changes.forEach(((i,a)=>{const u=this.Or.get(i);if(e.push(this.Mr.removeEntry(t,i,u.readTime)),a.isValidDocument()){const l=fc(this.Mr.serializer,a);s=s.add(i.path.popLast());const d=$s(l);n+=d-u.size,e.push(this.Mr.addEntry(t,i,l))}else if(n-=u.size,this.trackRemovals){const l=fc(this.Mr.serializer,a.convertToNoDocument(U.min()));e.push(this.Mr.addEntry(t,i,l))}})),s.forEach((i=>{e.push(this.Mr.indexManager.addToCollectionParentIndex(t,i))})),e.push(this.Mr.updateMetadata(t,n)),v.waitFor(e)}getFromCache(t,e){return this.Mr.Dr(t,e).next((n=>(this.Or.set(e,{size:n.size,readTime:n.document.readTime}),n.document)))}getAllFromCache(t,e){return this.Mr.vr(t,e).next((({documents:n,Fr:s})=>(s.forEach(((i,a)=>{this.Or.set(i,{size:a,readTime:n.get(i).readTime})})),n)))}}function Cc(r){return gt(r,Dr)}function Me(r){return gt(r,Ls)}function dr(r){const t=r.path.toArray();return[t.slice(0,t.length-2),t[t.length-2],t[t.length-1]]}function Dc(r,t){const e=t.documentKey.path.toArray();return[r,Gs(t.readTime),e.slice(0,e.length-2),e.length>0?e[e.length-1]:""]}function xc(r,t){const e=r.path.toArray(),n=t.path.toArray();let s=0;for(let i=0;i<e.length-2&&i<n.length-2;++i)if(s=B(e[i],n[i]),s)return s;return s=B(e.length,n.length),s||(s=B(e[e.length-2],n[n.length-2]),s||B(e[e.length-1],n[n.length-1]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dg{constructor(t,e){this.overlayedDocument=t,this.mutatedFields=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qh{constructor(t,e,n,s){this.remoteDocumentCache=t,this.mutationQueue=e,this.documentOverlayCache=n,this.indexManager=s}getDocument(t,e){let n=null;return this.documentOverlayCache.getOverlay(t,e).next((s=>(n=s,this.remoteDocumentCache.getEntry(t,e)))).next((s=>(n!==null&&Vr(n.mutation,s,Dt.empty(),Y.now()),s)))}getDocuments(t,e){return this.remoteDocumentCache.getEntries(t,e).next((n=>this.getLocalViewOfDocuments(t,n,G()).next((()=>n))))}getLocalViewOfDocuments(t,e,n=G()){const s=Wt();return this.populateOverlays(t,s,e).next((()=>this.computeViews(t,e,s,n).next((i=>{let a=pr();return i.forEach(((u,l)=>{a=a.insert(u,l.overlayedDocument)})),a}))))}getOverlayedDocuments(t,e){const n=Wt();return this.populateOverlays(t,n,e).next((()=>this.computeViews(t,e,n,G())))}populateOverlays(t,e,n){const s=[];return n.forEach((i=>{e.has(i)||s.push(i)})),this.documentOverlayCache.getOverlays(t,s).next((i=>{i.forEach(((a,u)=>{e.set(a,u)}))}))}computeViews(t,e,n,s){let i=Mt();const a=Rr(),u=(function(){return Rr()})();return e.forEach(((l,d)=>{const f=n.get(d.key);s.has(d.key)&&(f===void 0||f.mutation instanceof re)?i=i.insert(d.key,d):f!==void 0?(a.set(d.key,f.mutation.getFieldMask()),Vr(f.mutation,d,f.mutation.getFieldMask(),Y.now())):a.set(d.key,Dt.empty())})),this.recalculateAndSaveOverlays(t,i).next((l=>(l.forEach(((d,f)=>a.set(d,f))),e.forEach(((d,f)=>u.set(d,new dg(f,a.get(d)??null)))),u)))}recalculateAndSaveOverlays(t,e){const n=Rr();let s=new et(((a,u)=>a-u)),i=G();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(t,e).next((a=>{for(const u of a)u.keys().forEach((l=>{const d=e.get(l);if(d===null)return;let f=n.get(l)||Dt.empty();f=u.applyToLocalView(d,f),n.set(l,f);const g=(s.get(u.batchId)||G()).add(l);s=s.insert(u.batchId,g)}))})).next((()=>{const a=[],u=s.getReverseIterator();for(;u.hasNext();){const l=u.getNext(),d=l.key,f=l.value,g=nh();f.forEach((T=>{if(!i.has(T)){const P=ch(e.get(T),n.get(T));P!==null&&g.set(T,P),i=i.add(T)}})),a.push(this.documentOverlayCache.saveOverlays(t,d,g))}return v.waitFor(a)})).next((()=>n))}recalculateAndSaveOverlaysForDocumentKeys(t,e){return this.remoteDocumentCache.getEntries(t,e).next((n=>this.recalculateAndSaveOverlays(t,n)))}getDocumentsMatchingQuery(t,e,n,s){return _m(e)?this.getDocumentsMatchingDocumentQuery(t,e.path):Jl(e)?this.getDocumentsMatchingCollectionGroupQuery(t,e,n,s):this.getDocumentsMatchingCollectionQuery(t,e,n,s)}getNextDocuments(t,e,n,s){return this.remoteDocumentCache.getAllFromCollectionGroup(t,e,n,s).next((i=>{const a=s-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(t,e,n.largestBatchId,s-i.size):v.resolve(Wt());let u=En,l=i;return a.next((d=>v.forEach(d,((f,g)=>(u<g.largestBatchId&&(u=g.largestBatchId),i.get(f)?v.resolve():this.remoteDocumentCache.getEntry(t,f).next((T=>{l=l.insert(f,T)}))))).next((()=>this.populateOverlays(t,d,i))).next((()=>this.computeViews(t,l,d,G()))).next((f=>({batchId:u,changes:eh(f)})))))}))}getDocumentsMatchingDocumentQuery(t,e){return this.getDocument(t,new N(e)).next((n=>{let s=pr();return n.isFoundDocument()&&(s=s.insert(n.key,n)),s}))}getDocumentsMatchingCollectionGroupQuery(t,e,n,s){const i=e.collectionGroup;let a=pr();return this.indexManager.getCollectionParents(t,i).next((u=>v.forEach(u,(l=>{const d=(function(g,T){return new Un(T,null,g.explicitOrderBy.slice(),g.filters.slice(),g.limit,g.limitType,g.startAt,g.endAt)})(e,l.child(i));return this.getDocumentsMatchingCollectionQuery(t,d,n,s).next((f=>{f.forEach(((g,T)=>{a=a.insert(g,T)}))}))})).next((()=>a))))}getDocumentsMatchingCollectionQuery(t,e,n,s){let i;return this.documentOverlayCache.getOverlaysForCollection(t,e.path,n.largestBatchId).next((a=>(i=a,this.remoteDocumentCache.getDocumentsMatchingQuery(t,e,n,i,s)))).next((a=>{i.forEach(((l,d)=>{const f=d.getKey();a.get(f)===null&&(a=a.insert(f,it.newInvalidDocument(f)))}));let u=pr();return a.forEach(((l,d)=>{const f=i.get(l);f!==void 0&&Vr(f.mutation,d,Dt.empty(),Y.now()),Wr(e,d)&&(u=u.insert(l,d))})),u}))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fg{constructor(t){this.serializer=t,this.Nr=new Map,this.Br=new Map}getBundleMetadata(t,e){return v.resolve(this.Nr.get(e))}saveBundleMetadata(t,e){return this.Nr.set(e.id,(function(s){return{id:s.id,version:s.version,createTime:yt(s.createTime)}})(e)),v.resolve()}getNamedQuery(t,e){return v.resolve(this.Br.get(e))}saveNamedQuery(t,e){return this.Br.set(e.name,(function(s){return{name:s.name,query:bh(s.bundledQuery),readTime:yt(s.readTime)}})(e)),v.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mg{constructor(){this.overlays=new et(N.comparator),this.Lr=new Map}getOverlay(t,e){return v.resolve(this.overlays.get(e))}getOverlays(t,e){const n=Wt();return v.forEach(e,(s=>this.getOverlay(t,s).next((i=>{i!==null&&n.set(s,i)})))).next((()=>n))}saveOverlays(t,e,n){return n.forEach(((s,i)=>{this.St(t,e,i)})),v.resolve()}removeOverlaysForBatchId(t,e,n){const s=this.Lr.get(n);return s!==void 0&&(s.forEach((i=>this.overlays=this.overlays.remove(i))),this.Lr.delete(n)),v.resolve()}getOverlaysForCollection(t,e,n){const s=Wt(),i=e.length+1,a=new N(e.child("")),u=this.overlays.getIteratorFrom(a);for(;u.hasNext();){const l=u.getNext().value,d=l.getKey();if(!e.isPrefixOf(d.path))break;d.path.length===i&&l.largestBatchId>n&&s.set(l.getKey(),l)}return v.resolve(s)}getOverlaysForCollectionGroup(t,e,n,s){let i=new et(((d,f)=>d-f));const a=this.overlays.getIterator();for(;a.hasNext();){const d=a.getNext().value;if(d.getKey().getCollectionGroup()===e&&d.largestBatchId>n){let f=i.get(d.largestBatchId);f===null&&(f=Wt(),i=i.insert(d.largestBatchId,f)),f.set(d.getKey(),d)}}const u=Wt(),l=i.getIterator();for(;l.hasNext()&&(l.getNext().value.forEach(((d,f)=>u.set(d,f))),!(u.size()>=s)););return v.resolve(u)}St(t,e,n){const s=this.overlays.get(n.key);if(s!==null){const a=this.Lr.get(s.largestBatchId).delete(n.key);this.Lr.set(s.largestBatchId,a)}this.overlays=this.overlays.insert(n.key,new Wo(e,n));let i=this.Lr.get(e);i===void 0&&(i=G(),this.Lr.set(e,i)),this.Lr.set(e,i.add(n.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gg{constructor(){this.sessionToken=ht.EMPTY_BYTE_STRING}getSessionToken(t){return v.resolve(this.sessionToken)}setSessionToken(t,e){return this.sessionToken=e,v.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zo{constructor(){this.kr=new Z(_t.qr),this.Kr=new Z(_t.Ur)}isEmpty(){return this.kr.isEmpty()}addReference(t,e){const n=new _t(t,e);this.kr=this.kr.add(n),this.Kr=this.Kr.add(n)}$r(t,e){t.forEach((n=>this.addReference(n,e)))}removeReference(t,e){this.Wr(new _t(t,e))}Qr(t,e){t.forEach((n=>this.removeReference(n,e)))}Gr(t){const e=new N(new H([])),n=new _t(e,t),s=new _t(e,t+1),i=[];return this.Kr.forEachInRange([n,s],(a=>{this.Wr(a),i.push(a.key)})),i}zr(){this.kr.forEach((t=>this.Wr(t)))}Wr(t){this.kr=this.kr.delete(t),this.Kr=this.Kr.delete(t)}jr(t){const e=new N(new H([])),n=new _t(e,t),s=new _t(e,t+1);let i=G();return this.Kr.forEachInRange([n,s],(a=>{i=i.add(a.key)})),i}containsKey(t){const e=new _t(t,0),n=this.kr.firstAfterOrEqual(e);return n!==null&&t.isEqual(n.key)}}class _t{constructor(t,e){this.key=t,this.Jr=e}static qr(t,e){return N.comparator(t.key,e.key)||B(t.Jr,e.Jr)}static Ur(t,e){return B(t.Jr,e.Jr)||N.comparator(t.key,e.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pg{constructor(t,e){this.indexManager=t,this.referenceDelegate=e,this.mutationQueue=[],this.Yn=1,this.Hr=new Z(_t.qr)}checkEmpty(t){return v.resolve(this.mutationQueue.length===0)}addMutationBatch(t,e,n,s){const i=this.Yn;this.Yn++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const a=new $o(i,e,n,s);this.mutationQueue.push(a);for(const u of s)this.Hr=this.Hr.add(new _t(u.key,i)),this.indexManager.addToCollectionParentIndex(t,u.key.path.popLast());return v.resolve(a)}lookupMutationBatch(t,e){return v.resolve(this.Zr(e))}getNextMutationBatchAfterBatchId(t,e){const n=e+1,s=this.Xr(n),i=s<0?0:s;return v.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return v.resolve(this.mutationQueue.length===0?ze:this.Yn-1)}getAllMutationBatches(t){return v.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(t,e){const n=new _t(e,0),s=new _t(e,Number.POSITIVE_INFINITY),i=[];return this.Hr.forEachInRange([n,s],(a=>{const u=this.Zr(a.Jr);i.push(u)})),v.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(t,e){let n=new Z(B);return e.forEach((s=>{const i=new _t(s,0),a=new _t(s,Number.POSITIVE_INFINITY);this.Hr.forEachInRange([i,a],(u=>{n=n.add(u.Jr)}))})),v.resolve(this.Yr(n))}getAllMutationBatchesAffectingQuery(t,e){const n=e.path,s=n.length+1;let i=n;N.isDocumentKey(i)||(i=i.child(""));const a=new _t(new N(i),0);let u=new Z(B);return this.Hr.forEachWhile((l=>{const d=l.key.path;return!!n.isPrefixOf(d)&&(d.length===s&&(u=u.add(l.Jr)),!0)}),a),v.resolve(this.Yr(u))}Yr(t){const e=[];return t.forEach((n=>{const s=this.Zr(n);s!==null&&e.push(s)})),e}removeMutationBatch(t,e){L(this.ei(e.batchId,"removed")===0,55003),this.mutationQueue.shift();let n=this.Hr;return v.forEach(e.mutations,(s=>{const i=new _t(s.key,e.batchId);return n=n.delete(i),this.referenceDelegate.markPotentiallyOrphaned(t,s.key)})).next((()=>{this.Hr=n}))}nr(t){}containsKey(t,e){const n=new _t(e,0),s=this.Hr.firstAfterOrEqual(n);return v.resolve(e.isEqual(s&&s.key))}performConsistencyCheck(t){return this.mutationQueue.length,v.resolve()}ei(t,e){return this.Xr(t)}Xr(t){return this.mutationQueue.length===0?0:t-this.mutationQueue[0].batchId}Zr(t){const e=this.Xr(t);return e<0||e>=this.mutationQueue.length?null:this.mutationQueue[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _g{constructor(t){this.ti=t,this.docs=(function(){return new et(N.comparator)})(),this.size=0}setIndexManager(t){this.indexManager=t}addEntry(t,e){const n=e.key,s=this.docs.get(n),i=s?s.size:0,a=this.ti(e);return this.docs=this.docs.insert(n,{document:e.mutableCopy(),size:a}),this.size+=a-i,this.indexManager.addToCollectionParentIndex(t,n.path.popLast())}removeEntry(t){const e=this.docs.get(t);e&&(this.docs=this.docs.remove(t),this.size-=e.size)}getEntry(t,e){const n=this.docs.get(e);return v.resolve(n?n.document.mutableCopy():it.newInvalidDocument(e))}getEntries(t,e){let n=Mt();return e.forEach((s=>{const i=this.docs.get(s);n=n.insert(s,i?i.document.mutableCopy():it.newInvalidDocument(s))})),v.resolve(n)}getDocumentsMatchingQuery(t,e,n,s){let i=Mt();const a=e.path,u=new N(a.child("__id-9223372036854775808__")),l=this.docs.getIteratorFrom(u);for(;l.hasNext();){const{key:d,value:{document:f}}=l.getNext();if(!a.isPrefixOf(d.path))break;d.path.length>a.length+1||No(_l(f),n)<=0||(s.has(f.key)||Wr(e,f))&&(i=i.insert(f.key,f.mutableCopy()))}return v.resolve(i)}getAllFromCollectionGroup(t,e,n,s){O(9500)}ni(t,e){return v.forEach(this.docs,(n=>e(n)))}newChangeBuffer(t){return new yg(this)}getSize(t){return v.resolve(this.size)}}class yg extends Uh{constructor(t){super(),this.Mr=t}applyChanges(t){const e=[];return this.changes.forEach(((n,s)=>{s.isValidDocument()?e.push(this.Mr.addEntry(t,s)):this.Mr.removeEntry(n)})),v.waitFor(e)}getFromCache(t,e){return this.Mr.getEntry(t,e)}getAllFromCache(t,e){return this.Mr.getEntries(t,e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ig{constructor(t){this.persistence=t,this.ri=new ne((e=>We(e)),$r),this.lastRemoteSnapshotVersion=U.min(),this.highestTargetId=0,this.ii=0,this.si=new Zo,this.targetCount=0,this.oi=Ye._r()}forEachTarget(t,e){return this.ri.forEach(((n,s)=>e(s))),v.resolve()}getLastRemoteSnapshotVersion(t){return v.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(t){return v.resolve(this.ii)}allocateTargetId(t){return this.highestTargetId=this.oi.next(),v.resolve(this.highestTargetId)}setTargetsMetadata(t,e,n){return n&&(this.lastRemoteSnapshotVersion=n),e>this.ii&&(this.ii=e),v.resolve()}lr(t){this.ri.set(t.target,t);const e=t.targetId;e>this.highestTargetId&&(this.oi=new Ye(e),this.highestTargetId=e),t.sequenceNumber>this.ii&&(this.ii=t.sequenceNumber)}addTargetData(t,e){return this.lr(e),this.targetCount+=1,v.resolve()}updateTargetData(t,e){return this.lr(e),v.resolve()}removeTargetData(t,e){return this.ri.delete(e.target),this.si.Gr(e.targetId),this.targetCount-=1,v.resolve()}removeTargets(t,e,n){let s=0;const i=[];return this.ri.forEach(((a,u)=>{u.sequenceNumber<=e&&n.get(u.targetId)===null&&(this.ri.delete(a),i.push(this.removeMatchingKeysForTargetId(t,u.targetId)),s++)})),v.waitFor(i).next((()=>s))}getTargetCount(t){return v.resolve(this.targetCount)}getTargetData(t,e){const n=this.ri.get(e)||null;return v.resolve(n)}addMatchingKeys(t,e,n){return this.si.$r(e,n),v.resolve()}removeMatchingKeys(t,e,n){this.si.Qr(e,n);const s=this.persistence.referenceDelegate,i=[];return s&&e.forEach((a=>{i.push(s.markPotentiallyOrphaned(t,a))})),v.waitFor(i)}removeMatchingKeysForTargetId(t,e){return this.si.Gr(e),v.resolve()}getMatchingKeysForTargetId(t,e){const n=this.si.jr(e);return v.resolve(n)}containsKey(t,e){return v.resolve(this.si.containsKey(e))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ta{constructor(t,e){this._i={},this.overlays={},this.ai=new Ct(0),this.ui=!1,this.ui=!0,this.ci=new gg,this.referenceDelegate=t(this),this.li=new Ig(this),this.indexManager=new sg,this.remoteDocumentCache=(function(s){return new _g(s)})((n=>this.referenceDelegate.hi(n))),this.serializer=new Sh(e),this.Pi=new fg(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.ui=!1,Promise.resolve()}get started(){return this.ui}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(t){return this.indexManager}getDocumentOverlayCache(t){let e=this.overlays[t.toKey()];return e||(e=new mg,this.overlays[t.toKey()]=e),e}getMutationQueue(t,e){let n=this._i[t.toKey()];return n||(n=new pg(e,this.referenceDelegate),this._i[t.toKey()]=n),n}getGlobalsCache(){return this.ci}getTargetCache(){return this.li}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Pi}runTransaction(t,e,n){b("MemoryPersistence","Starting transaction:",t);const s=new Tg(this.ai.next());return this.referenceDelegate.Ti(),n(s).next((i=>this.referenceDelegate.Ei(s).next((()=>i)))).toPromise().then((i=>(s.raiseOnCommittedEvent(),i)))}Ii(t,e){return v.or(Object.values(this._i).map((n=>()=>n.containsKey(t,e))))}}class Tg extends Il{constructor(t){super(),this.currentSequenceNumber=t}}class fi{constructor(t){this.persistence=t,this.Ri=new Zo,this.Ai=null}static Vi(t){return new fi(t)}get di(){if(this.Ai)return this.Ai;throw O(60996)}addReference(t,e,n){return this.Ri.addReference(n,e),this.di.delete(n.toString()),v.resolve()}removeReference(t,e,n){return this.Ri.removeReference(n,e),this.di.add(n.toString()),v.resolve()}markPotentiallyOrphaned(t,e){return this.di.add(e.toString()),v.resolve()}removeTarget(t,e){this.Ri.Gr(e.targetId).forEach((s=>this.di.add(s.toString())));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(t,e.targetId).next((s=>{s.forEach((i=>this.di.add(i.toString())))})).next((()=>n.removeTargetData(t,e)))}Ti(){this.Ai=new Set}Ei(t){const e=this.persistence.getRemoteDocumentCache().newChangeBuffer();return v.forEach(this.di,(n=>{const s=N.fromPath(n);return this.mi(t,s).next((i=>{i||e.removeEntry(s,U.min())}))})).next((()=>(this.Ai=null,e.apply(t))))}updateLimboDocument(t,e){return this.mi(t,e).next((n=>{n?this.di.delete(e.toString()):this.di.add(e.toString())}))}hi(t){return 0}mi(t,e){return v.or([()=>v.resolve(this.Ri.containsKey(e)),()=>this.persistence.getTargetCache().containsKey(t,e),()=>this.persistence.Ii(t,e)])}}class Qs{constructor(t,e){this.persistence=t,this.fi=new ne((n=>Rt(n.path)),((n,s)=>n.isEqual(s))),this.garbageCollector=Lh(this,e)}static Vi(t,e){return new Qs(t,e)}Ti(){}Ei(t){return v.resolve()}forEachTarget(t,e){return this.persistence.getTargetCache().forEachTarget(t,e)}dr(t){const e=this.pr(t);return this.persistence.getTargetCache().getTargetCount(t).next((n=>e.next((s=>n+s))))}pr(t){let e=0;return this.mr(t,(n=>{e++})).next((()=>e))}mr(t,e){return v.forEach(this.fi,((n,s)=>this.wr(t,n,s).next((i=>i?v.resolve():e(s)))))}removeTargets(t,e,n){return this.persistence.getTargetCache().removeTargets(t,e,n)}removeOrphanedDocuments(t,e){let n=0;const s=this.persistence.getRemoteDocumentCache(),i=s.newChangeBuffer();return s.ni(t,(a=>this.wr(t,a,e).next((u=>{u||(n++,i.removeEntry(a,U.min()))})))).next((()=>i.apply(t))).next((()=>n))}markPotentiallyOrphaned(t,e){return this.fi.set(e,t.currentSequenceNumber),v.resolve()}removeTarget(t,e){const n=e.withSequenceNumber(t.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(t,n)}addReference(t,e,n){return this.fi.set(n,t.currentSequenceNumber),v.resolve()}removeReference(t,e,n){return this.fi.set(n,t.currentSequenceNumber),v.resolve()}updateLimboDocument(t,e){return this.fi.set(e,t.currentSequenceNumber),v.resolve()}hi(t){let e=t.key.toString().length;return t.isFoundDocument()&&(e+=Ps(t.data.value)),e}wr(t,e,n){return v.or([()=>this.persistence.Ii(t,e),()=>this.persistence.getTargetCache().containsKey(t,e),()=>{const s=this.fi.get(e);return v.resolve(s!==void 0&&s>n)}])}getCacheSize(t){return this.persistence.getRemoteDocumentCache().getSize(t)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Eg{constructor(t){this.serializer=t}k(t,e,n,s){const i=new ni("createOrUpgrade",e);n<1&&s>=1&&((function(l){l.createObjectStore(Kr)})(t),(function(l){l.createObjectStore(Cr,{keyPath:Nf}),l.createObjectStore(Ut,{keyPath:zu,autoIncrement:!0}).createIndex(je,Gu,{unique:!0}),l.createObjectStore(wn)})(t),Nc(t),(function(l){l.createObjectStore(Fe)})(t));let a=v.resolve();return n<3&&s>=3&&(n!==0&&((function(l){l.deleteObjectStore(An),l.deleteObjectStore(vn),l.deleteObjectStore(Ge)})(t),Nc(t)),a=a.next((()=>(function(l){const d=l.store(Ge),f={highestTargetId:0,highestListenSequenceNumber:0,lastRemoteSnapshotVersion:U.min().toTimestamp(),targetCount:0};return d.put(Us,f)})(i)))),n<4&&s>=4&&(n!==0&&(a=a.next((()=>(function(l,d){return d.store(Ut).J().next((g=>{l.deleteObjectStore(Ut),l.createObjectStore(Ut,{keyPath:zu,autoIncrement:!0}).createIndex(je,Gu,{unique:!0});const T=d.store(Ut),P=g.map((x=>T.put(x)));return v.waitFor(P)}))})(t,i)))),a=a.next((()=>{(function(l){l.createObjectStore(Rn,{keyPath:jf})})(t)}))),n<5&&s>=5&&(a=a.next((()=>this.gi(i)))),n<6&&s>=6&&(a=a.next((()=>((function(l){l.createObjectStore(Dr)})(t),this.pi(i))))),n<7&&s>=7&&(a=a.next((()=>this.yi(i)))),n<8&&s>=8&&(a=a.next((()=>this.wi(t,i)))),n<9&&s>=9&&(a=a.next((()=>{(function(l){l.objectStoreNames.contains("remoteDocumentChanges")&&l.deleteObjectStore("remoteDocumentChanges")})(t)}))),n<10&&s>=10&&(a=a.next((()=>this.Si(i)))),n<11&&s>=11&&(a=a.next((()=>{(function(l){l.createObjectStore(ri,{keyPath:zf})})(t),(function(l){l.createObjectStore(si,{keyPath:Gf})})(t)}))),n<12&&s>=12&&(a=a.next((()=>{(function(l){const d=l.createObjectStore(ii,{keyPath:Yf});d.createIndex(co,Xf,{unique:!1}),d.createIndex(Sl,Zf,{unique:!1})})(t)}))),n<13&&s>=13&&(a=a.next((()=>(function(l){const d=l.createObjectStore(Ls,{keyPath:Mf});d.createIndex(Vs,Of),d.createIndex(vl,Ff)})(t))).next((()=>this.bi(t,i))).next((()=>t.deleteObjectStore(Fe)))),n<14&&s>=14&&(a=a.next((()=>this.Di(t,i)))),n<15&&s>=15&&(a=a.next((()=>(function(l){l.createObjectStore(Oo,{keyPath:Kf,autoIncrement:!0}).createIndex(uo,$f,{unique:!1}),l.createObjectStore(Er,{keyPath:Qf}).createIndex(Rl,Wf,{unique:!1}),l.createObjectStore(wr,{keyPath:Hf}).createIndex(Vl,Jf,{unique:!1})})(t)))),n<16&&s>=16&&(a=a.next((()=>{e.objectStore(Er).clear()})).next((()=>{e.objectStore(wr).clear()}))),n<17&&s>=17&&(a=a.next((()=>{(function(l){l.createObjectStore(Fo,{keyPath:tm})})(t)}))),n<18&&s>=18&&il()&&(a=a.next((()=>{e.objectStore(Er).clear()})).next((()=>{e.objectStore(wr).clear()}))),a}pi(t){let e=0;return t.store(Fe).ee(((n,s)=>{e+=$s(s)})).next((()=>{const n={byteSize:e};return t.store(Dr).put(ao,n)}))}gi(t){const e=t.store(Cr),n=t.store(Ut);return e.J().next((s=>v.forEach(s,(i=>{const a=IDBKeyRange.bound([i.userId,ze],[i.userId,i.lastAcknowledgedBatchId]);return n.J(je,a).next((u=>v.forEach(u,(l=>{L(l.userId===i.userId,18650,"Cannot process batch from unexpected user",{batchId:l.batchId});const d=Ue(this.serializer,l);return Nh(t,i.userId,d).next((()=>{}))}))))}))))}yi(t){const e=t.store(An),n=t.store(Fe);return t.store(Ge).get(Us).next((s=>{const i=[];return n.ee(((a,u)=>{const l=new H(a),d=(function(g){return[0,Rt(g)]})(l);i.push(e.get(d).next((f=>f?v.resolve():(g=>e.put({targetId:0,path:Rt(g),sequenceNumber:s.highestListenSequenceNumber}))(l))))})).next((()=>v.waitFor(i)))}))}wi(t,e){t.createObjectStore(xr,{keyPath:qf});const n=e.store(xr),s=new Xo,i=a=>{if(s.add(a)){const u=a.lastSegment(),l=a.popLast();return n.put({collectionId:u,parent:Rt(l)})}};return e.store(Fe).ee({Y:!0},((a,u)=>{const l=new H(a);return i(l.popLast())})).next((()=>e.store(wn).ee({Y:!0},(([a,u,l],d)=>{const f=Qt(u);return i(f.popLast())}))))}Si(t){const e=t.store(vn);return e.ee(((n,s)=>{const i=yr(s),a=Ph(this.serializer,i);return e.put(a)}))}bi(t,e){const n=e.store(Fe),s=[];return n.ee(((i,a)=>{const u=e.store(Ls),l=(function(g){return g.document?new N(H.fromString(g.document.name).popFirst(5)):g.noDocument?N.fromSegments(g.noDocument.path):g.unknownDocument?N.fromSegments(g.unknownDocument.path):O(36783)})(a).path.toArray(),d={prefixPath:l.slice(0,l.length-2),collectionGroup:l[l.length-2],documentId:l[l.length-1],readTime:a.readTime||[0,0],unknownDocument:a.unknownDocument,noDocument:a.noDocument,document:a.document,hasCommittedMutations:!!a.hasCommittedMutations};s.push(u.put(d))})).next((()=>v.waitFor(s)))}Di(t,e){const n=e.store(Ut),s=Bh(this.serializer),i=new ta(fi.Vi,this.serializer.yt);return n.J().next((a=>{const u=new Map;return a.forEach((l=>{let d=u.get(l.userId)??G();Ue(this.serializer,l).keys().forEach((f=>d=d.add(f))),u.set(l.userId,d)})),v.forEach(u,((l,d)=>{const f=new vt(d),g=hi.wt(this.serializer,f),T=i.getIndexManager(f),P=di.wt(f,this.serializer,T,i.referenceDelegate);return new qh(s,P,g,T).recalculateAndSaveOverlaysForDocumentKeys(new lo(e,Ct.ce),l).next()}))}))}}function Nc(r){r.createObjectStore(An,{keyPath:Uf}).createIndex(Mo,Bf,{unique:!0}),r.createObjectStore(vn,{keyPath:"targetId"}).createIndex(Al,Lf,{unique:!0}),r.createObjectStore(Ge)}const fe="IndexedDbPersistence",Ji=18e5,Yi=5e3,Xi="Failed to obtain exclusive access to the persistence layer. To allow shared access, multi-tab synchronization has to be enabled in all tabs. If you are using `experimentalForceOwningTab:true`, make sure that only one tab has persistence enabled at any given time.",wg="main";class ea{constructor(t,e,n,s,i,a,u,l,d,f,g=18){if(this.allowTabSynchronization=t,this.persistenceKey=e,this.clientId=n,this.Ci=i,this.window=a,this.document=u,this.Fi=d,this.Mi=f,this.xi=g,this.ai=null,this.ui=!1,this.isPrimary=!1,this.networkEnabled=!0,this.Oi=null,this.inForeground=!1,this.Ni=null,this.Bi=null,this.Li=Number.NEGATIVE_INFINITY,this.ki=T=>Promise.resolve(),!ea.v())throw new C(S.UNIMPLEMENTED,"This platform is either missing IndexedDB or is known to have an incomplete implementation. Offline persistence has been disabled.");this.referenceDelegate=new cg(this,s),this.qi=e+wg,this.serializer=new Sh(l),this.Ki=new ye(this.qi,this.xi,new Eg(this.serializer)),this.ci=new Xm,this.li=new og(this.referenceDelegate,this.serializer),this.remoteDocumentCache=Bh(this.serializer),this.Pi=new Ym,this.window&&this.window.localStorage?this.Ui=this.window.localStorage:(this.Ui=null,f===!1&&lt(fe,"LocalStorage is unavailable. As a result, persistence may not work reliably. In particular enablePersistence() could fail immediately after refreshing the page."))}start(){return this.$i().then((()=>{if(!this.isPrimary&&!this.allowTabSynchronization)throw new C(S.FAILED_PRECONDITION,Xi);return this.Wi(),this.Qi(),this.Gi(),this.runTransaction("getHighestListenSequenceNumber","readonly",(t=>this.li.getHighestSequenceNumber(t)))})).then((t=>{this.ai=new Ct(t,this.Fi)})).then((()=>{this.ui=!0})).catch((t=>(this.Ki&&this.Ki.close(),Promise.reject(t))))}zi(t){return this.ki=async e=>{if(this.started)return t(e)},t(this.isPrimary)}setDatabaseDeletedListener(t){this.Ki.K((async e=>{e.newVersion===null&&await t()}))}setNetworkEnabled(t){this.networkEnabled!==t&&(this.networkEnabled=t,this.Ci.enqueueAndForget((async()=>{this.started&&await this.$i()})))}$i(){return this.runTransaction("updateClientMetadataAndTryBecomePrimary","readwrite",(t=>Es(t).put({clientId:this.clientId,updateTimeMs:Date.now(),networkEnabled:this.networkEnabled,inForeground:this.inForeground}).next((()=>{if(this.isPrimary)return this.ji(t).next((e=>{e||(this.isPrimary=!1,this.Ci.enqueueRetryable((()=>this.ki(!1))))}))})).next((()=>this.Ji(t))).next((e=>this.isPrimary&&!e?this.Hi(t).next((()=>!1)):!!e&&this.Zi(t).next((()=>!0)))))).catch((t=>{if(Ve(t))return b(fe,"Failed to extend owner lease: ",t),this.isPrimary;if(!this.allowTabSynchronization)throw t;return b(fe,"Releasing owner lease after error during lease refresh",t),!1})).then((t=>{this.isPrimary!==t&&this.Ci.enqueueRetryable((()=>this.ki(t))),this.isPrimary=t}))}ji(t){return fr(t).get(sn).next((e=>v.resolve(this.Xi(e))))}Yi(t){return Es(t).delete(this.clientId)}async es(){if(this.isPrimary&&!this.ts(this.Li,Ji)){this.Li=Date.now();const t=await this.runTransaction("maybeGarbageCollectMultiClientState","readwrite-primary",(e=>{const n=gt(e,Rn);return n.J().next((s=>{const i=this.ns(s,Ji),a=s.filter((u=>i.indexOf(u)===-1));return v.forEach(a,(u=>n.delete(u.clientId))).next((()=>a))}))})).catch((()=>[]));if(this.Ui)for(const e of t)this.Ui.removeItem(this.rs(e.clientId))}}Gi(){this.Bi=this.Ci.enqueueAfterDelay("client_metadata_refresh",4e3,(()=>this.$i().then((()=>this.es())).then((()=>this.Gi()))))}Xi(t){return!!t&&t.ownerId===this.clientId}Ji(t){return this.Mi?v.resolve(!0):fr(t).get(sn).next((e=>{if(e!==null&&this.ts(e.leaseTimestampMs,Yi)&&!this.ss(e.ownerId)){if(this.Xi(e)&&this.networkEnabled)return!0;if(!this.Xi(e)){if(!e.allowTabSynchronization)throw new C(S.FAILED_PRECONDITION,Xi);return!1}}return!(!this.networkEnabled||!this.inForeground)||Es(t).J().next((n=>this.ns(n,Yi).find((s=>{if(this.clientId!==s.clientId){const i=!this.networkEnabled&&s.networkEnabled,a=!this.inForeground&&s.inForeground,u=this.networkEnabled===s.networkEnabled;if(i||a&&u)return!0}return!1}))===void 0))})).next((e=>(this.isPrimary!==e&&b(fe,`Client ${e?"is":"is not"} eligible for a primary lease.`),e)))}async shutdown(){this.ui=!1,this._s(),this.Bi&&(this.Bi.cancel(),this.Bi=null),this.us(),this.cs(),await this.Ki.runTransaction("shutdown","readwrite",[Kr,Rn],(t=>{const e=new lo(t,Ct.ce);return this.Hi(e).next((()=>this.Yi(e)))})),this.Ki.close(),this.ls()}ns(t,e){return t.filter((n=>this.ts(n.updateTimeMs,e)&&!this.ss(n.clientId)))}hs(){return this.runTransaction("getActiveClients","readonly",(t=>Es(t).J().next((e=>this.ns(e,Ji).map((n=>n.clientId))))))}get started(){return this.ui}getGlobalsCache(){return this.ci}getMutationQueue(t,e){return di.wt(t,this.serializer,e,this.referenceDelegate)}getTargetCache(){return this.li}getRemoteDocumentCache(){return this.remoteDocumentCache}getIndexManager(t){return new ig(t,this.serializer.yt.databaseId)}getDocumentOverlayCache(t){return hi.wt(this.serializer,t)}getBundleCache(){return this.Pi}runTransaction(t,e,n){b(fe,"Starting transaction:",t);const s=e==="readonly"?"readonly":"readwrite",i=(function(l){return l===18?rm:l===17?Dl:l===16?nm:l===15?Lo:l===14?Cl:l===13?bl:l===12?em:l===11?Pl:void O(60245)})(this.xi);let a;return this.Ki.runTransaction(t,s,i,(u=>(a=new lo(u,this.ai?this.ai.next():Ct.ce),e==="readwrite-primary"?this.ji(a).next((l=>!!l||this.Ji(a))).next((l=>{if(!l)throw lt(`Failed to obtain primary lease for action '${t}'.`),this.isPrimary=!1,this.Ci.enqueueRetryable((()=>this.ki(!1))),new C(S.FAILED_PRECONDITION,yl);return n(a)})).next((l=>this.Zi(a).next((()=>l)))):this.Ps(a).next((()=>n(a)))))).then((u=>(a.raiseOnCommittedEvent(),u)))}Ps(t){return fr(t).get(sn).next((e=>{if(e!==null&&this.ts(e.leaseTimestampMs,Yi)&&!this.ss(e.ownerId)&&!this.Xi(e)&&!(this.Mi||this.allowTabSynchronization&&e.allowTabSynchronization))throw new C(S.FAILED_PRECONDITION,Xi)}))}Zi(t){const e={ownerId:this.clientId,allowTabSynchronization:this.allowTabSynchronization,leaseTimestampMs:Date.now()};return fr(t).put(sn,e)}static v(){return ye.v()}Hi(t){const e=fr(t);return e.get(sn).next((n=>this.Xi(n)?(b(fe,"Releasing primary lease."),e.delete(sn)):v.resolve()))}ts(t,e){const n=Date.now();return!(t<n-e)&&(!(t>n)||(lt(`Detected an update time that is in the future: ${t} > ${n}`),!1))}Wi(){this.document!==null&&typeof this.document.addEventListener=="function"&&(this.Ni=()=>{this.Ci.enqueueAndForget((()=>(this.inForeground=this.document.visibilityState==="visible",this.$i())))},this.document.addEventListener("visibilitychange",this.Ni),this.inForeground=this.document.visibilityState==="visible")}us(){this.Ni&&(this.document.removeEventListener("visibilitychange",this.Ni),this.Ni=null)}Qi(){var t;typeof((t=this.window)==null?void 0:t.addEventListener)=="function"&&(this.Oi=()=>{this._s();const e=/(?:Version|Mobile)\/1[456]/;sl()&&(navigator.appVersion.match(e)||navigator.userAgent.match(e))&&this.Ci.enterRestrictedMode(!0),this.Ci.enqueueAndForget((()=>this.shutdown()))},this.window.addEventListener("pagehide",this.Oi))}cs(){this.Oi&&(this.window.removeEventListener("pagehide",this.Oi),this.Oi=null)}ss(t){var e;try{const n=((e=this.Ui)==null?void 0:e.getItem(this.rs(t)))!==null;return b(fe,`Client '${t}' ${n?"is":"is not"} zombied in LocalStorage`),n}catch(n){return lt(fe,"Failed to get zombied client id.",n),!1}}_s(){if(this.Ui)try{this.Ui.setItem(this.rs(this.clientId),String(Date.now()))}catch(t){lt("Failed to set zombie client id.",t)}}ls(){if(this.Ui)try{this.Ui.removeItem(this.rs(this.clientId))}catch{}}rs(t){return`firestore_zombie_${this.persistenceKey}_${t}`}}function fr(r){return gt(r,Kr)}function Es(r){return gt(r,Rn)}function jh(r,t){let e=r.projectId;return r.isDefaultDatabase||(e+="."+r.database),"firestore/"+t+"/"+e+"/"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class na{constructor(t,e,n,s){this.targetId=t,this.fromCache=e,this.Ts=n,this.Es=s}static Is(t,e){let n=G(),s=G();for(const i of e.docChanges)switch(i.type){case 0:n=n.add(i.doc.key);break;case 1:s=s.add(i.doc.key)}return new na(t,e.fromCache,n,s)}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vg{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(t){this._documentReadCount+=t}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zh{constructor(){this.Rs=!1,this.As=!1,this.Vs=100,this.ds=(function(){return sl()?8:Tl(Ms())>0?6:4})()}initialize(t,e){this.fs=t,this.indexManager=e,this.Rs=!0}getDocumentsMatchingQuery(t,e,n,s){const i={result:null};return this.gs(t,e).next((a=>{i.result=a})).next((()=>{if(!i.result)return this.ps(t,e,s,n).next((a=>{i.result=a}))})).next((()=>{if(i.result)return;const a=new vg;return this.ys(t,e,a).next((u=>{if(i.result=u,this.As)return this.ws(t,e,a,u.size)}))})).next((()=>i.result))}ws(t,e,n,s){return n.documentReadCount<this.Vs?(hn()<=Yt.DEBUG&&b("QueryEngine","SDK will not create cache indexes for query:",dn(e),"since it only creates cache indexes for collection contains","more than or equal to",this.Vs,"documents"),v.resolve()):(hn()<=Yt.DEBUG&&b("QueryEngine","Query:",dn(e),"scans",n.documentReadCount,"local documents and returns",s,"documents as results."),n.documentReadCount>this.ds*s?(hn()<=Yt.DEBUG&&b("QueryEngine","The SDK decides to create cache indexes for query:",dn(e),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(t,Ot(e))):v.resolve())}gs(t,e){if(rc(e))return v.resolve(null);let n=Ot(e);return this.indexManager.getIndexType(t,n).next((s=>s===0?null:(e.limit!==null&&s===1&&(e=zs(e,null,"F"),n=Ot(e)),this.indexManager.getDocumentsMatchingTarget(t,n).next((i=>{const a=G(...i);return this.fs.getDocuments(t,a).next((u=>this.indexManager.getMinOffset(t,n).next((l=>{const d=this.Ss(e,u);return this.bs(e,d,a,l.readTime)?this.gs(t,zs(e,null,"F")):this.Ds(t,d,e,l)}))))})))))}ps(t,e,n,s){return rc(e)||s.isEqual(U.min())?v.resolve(null):this.fs.getDocuments(t,n).next((i=>{const a=this.Ss(e,i);return this.bs(e,a,n,s)?v.resolve(null):(hn()<=Yt.DEBUG&&b("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),dn(e)),this.Ds(t,a,e,pl(s,En)).next((u=>u)))}))}Ss(t,e){let n=new Z(Zl(t));return e.forEach(((s,i)=>{Wr(t,i)&&(n=n.add(i))})),n}bs(t,e,n,s){if(t.limit===null)return!1;if(n.size!==e.size)return!0;const i=t.limitType==="F"?e.last():e.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(s)>0)}ys(t,e,n){return hn()<=Yt.DEBUG&&b("QueryEngine","Using full collection scan to execute query:",dn(e)),this.fs.getDocumentsMatchingQuery(t,e,Lt.min(),n)}Ds(t,e,n,s){return this.fs.getDocumentsMatchingQuery(t,n,s).next((i=>(e.forEach((a=>{i=i.insert(a.key,a)})),i)))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ra="LocalStore",Ag=3e8;class Rg{constructor(t,e,n,s){this.persistence=t,this.Cs=e,this.serializer=s,this.vs=new et(B),this.Fs=new ne((i=>We(i)),$r),this.Ms=new Map,this.xs=t.getRemoteDocumentCache(),this.li=t.getTargetCache(),this.Pi=t.getBundleCache(),this.Os(n)}Os(t){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(t),this.indexManager=this.persistence.getIndexManager(t),this.mutationQueue=this.persistence.getMutationQueue(t,this.indexManager),this.localDocuments=new qh(this.xs,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.xs.setIndexManager(this.indexManager),this.Cs.initialize(this.localDocuments,this.indexManager)}collectGarbage(t){return this.persistence.runTransaction("Collect garbage","readwrite-primary",(e=>t.collect(e,this.vs)))}}function Gh(r,t,e,n){return new Rg(r,t,e,n)}async function Kh(r,t){const e=F(r);return await e.persistence.runTransaction("Handle user change","readonly",(n=>{let s;return e.mutationQueue.getAllMutationBatches(n).next((i=>(s=i,e.Os(t),e.mutationQueue.getAllMutationBatches(n)))).next((i=>{const a=[],u=[];let l=G();for(const d of s){a.push(d.batchId);for(const f of d.mutations)l=l.add(f.key)}for(const d of i){u.push(d.batchId);for(const f of d.mutations)l=l.add(f.key)}return e.localDocuments.getDocuments(n,l).next((d=>({Ns:d,removedBatchIds:a,addedBatchIds:u})))}))}))}function Vg(r,t){const e=F(r);return e.persistence.runTransaction("Acknowledge batch","readwrite-primary",(n=>{const s=t.batch.keys(),i=e.xs.newChangeBuffer({trackRemovals:!0});return(function(u,l,d,f){const g=d.batch,T=g.keys();let P=v.resolve();return T.forEach((x=>{P=P.next((()=>f.getEntry(l,x))).next((k=>{const M=d.docVersions.get(x);L(M!==null,48541),k.version.compareTo(M)<0&&(g.applyToRemoteDocument(k,d),k.isValidDocument()&&(k.setReadTime(d.commitVersion),f.addEntry(k)))}))})),P.next((()=>u.mutationQueue.removeMutationBatch(l,g)))})(e,n,t,i).next((()=>i.apply(n))).next((()=>e.mutationQueue.performConsistencyCheck(n))).next((()=>e.documentOverlayCache.removeOverlaysForBatchId(n,s,t.batch.batchId))).next((()=>e.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(n,(function(u){let l=G();for(let d=0;d<u.mutationResults.length;++d)u.mutationResults[d].transformResults.length>0&&(l=l.add(u.batch.mutations[d].key));return l})(t)))).next((()=>e.localDocuments.getDocuments(n,s)))}))}function $h(r){const t=F(r);return t.persistence.runTransaction("Get last remote snapshot version","readonly",(e=>t.li.getLastRemoteSnapshotVersion(e)))}function Sg(r,t){const e=F(r),n=t.snapshotVersion;let s=e.vs;return e.persistence.runTransaction("Apply remote event","readwrite-primary",(i=>{const a=e.xs.newChangeBuffer({trackRemovals:!0});s=e.vs;const u=[];t.targetChanges.forEach(((f,g)=>{const T=s.get(g);if(!T)return;u.push(e.li.removeMatchingKeys(i,f.removedDocuments,g).next((()=>e.li.addMatchingKeys(i,f.addedDocuments,g))));let P=T.withSequenceNumber(i.currentSequenceNumber);t.targetMismatches.get(g)!==null?P=P.withResumeToken(ht.EMPTY_BYTE_STRING,U.min()).withLastLimboFreeSnapshotVersion(U.min()):f.resumeToken.approximateByteSize()>0&&(P=P.withResumeToken(f.resumeToken,n)),s=s.insert(g,P),(function(k,M,$){return k.resumeToken.approximateByteSize()===0||M.snapshotVersion.toMicroseconds()-k.snapshotVersion.toMicroseconds()>=Ag?!0:$.addedDocuments.size+$.modifiedDocuments.size+$.removedDocuments.size>0})(T,P,f)&&u.push(e.li.updateTargetData(i,P))}));let l=Mt(),d=G();if(t.documentUpdates.forEach((f=>{t.resolvedLimboDocuments.has(f)&&u.push(e.persistence.referenceDelegate.updateLimboDocument(i,f))})),u.push(Pg(i,a,t.documentUpdates).next((f=>{l=f.Bs,d=f.Ls}))),!n.isEqual(U.min())){const f=e.li.getLastRemoteSnapshotVersion(i).next((g=>e.li.setTargetsMetadata(i,i.currentSequenceNumber,n)));u.push(f)}return v.waitFor(u).next((()=>a.apply(i))).next((()=>e.localDocuments.getLocalViewOfDocuments(i,l,d))).next((()=>l))})).then((i=>(e.vs=s,i)))}function Pg(r,t,e){let n=G(),s=G();return e.forEach((i=>n=n.add(i))),t.getEntries(r,n).next((i=>{let a=Mt();return e.forEach(((u,l)=>{const d=i.get(u);l.isFoundDocument()!==d.isFoundDocument()&&(s=s.add(u)),l.isNoDocument()&&l.version.isEqual(U.min())?(t.removeEntry(u,l.readTime),a=a.insert(u,l)):!d.isValidDocument()||l.version.compareTo(d.version)>0||l.version.compareTo(d.version)===0&&d.hasPendingWrites?(t.addEntry(l),a=a.insert(u,l)):b(ra,"Ignoring outdated watch update for ",u,". Current version:",d.version," Watch version:",l.version)})),{Bs:a,Ls:s}}))}function bg(r,t){const e=F(r);return e.persistence.runTransaction("Get next mutation batch","readonly",(n=>(t===void 0&&(t=ze),e.mutationQueue.getNextMutationBatchAfterBatchId(n,t))))}function Ws(r,t){const e=F(r);return e.persistence.runTransaction("Allocate target","readwrite",(n=>{let s;return e.li.getTargetData(n,t).next((i=>i?(s=i,v.resolve(s)):e.li.allocateTargetId(n).next((a=>(s=new Xt(t,a,"TargetPurposeListen",n.currentSequenceNumber),e.li.addTargetData(n,s).next((()=>s)))))))})).then((n=>{const s=e.vs.get(n.targetId);return(s===null||n.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(e.vs=e.vs.insert(n.targetId,n),e.Fs.set(t,n.targetId)),n}))}async function kn(r,t,e){const n=F(r),s=n.vs.get(t),i=e?"readwrite":"readwrite-primary";try{e||await n.persistence.runTransaction("Release target",i,(a=>n.persistence.referenceDelegate.removeTarget(a,s)))}catch(a){if(!Ve(a))throw a;b(ra,`Failed to update sequence numbers for target ${t}: ${a}`)}n.vs=n.vs.remove(t),n.Fs.delete(s.target)}function Ro(r,t,e){const n=F(r);let s=U.min(),i=G();return n.persistence.runTransaction("Execute query","readwrite",(a=>(function(l,d,f){const g=F(l),T=g.Fs.get(f);return T!==void 0?v.resolve(g.vs.get(T)):g.li.getTargetData(d,f)})(n,a,Ot(t)).next((u=>{if(u)return s=u.lastLimboFreeSnapshotVersion,n.li.getMatchingKeysForTargetId(a,u.targetId).next((l=>{i=l}))})).next((()=>n.Cs.getDocumentsMatchingQuery(a,t,e?s:U.min(),e?i:G()))).next((u=>(Hh(n,Xl(t),u),{documents:u,ks:i})))))}function Qh(r,t){const e=F(r),n=F(e.li),s=e.vs.get(t);return s?Promise.resolve(s.target):e.persistence.runTransaction("Get target data","readonly",(i=>n.At(i,t).next((a=>a?a.target:null))))}function Wh(r,t){const e=F(r),n=e.Ms.get(t)||U.min();return e.persistence.runTransaction("Get new document changes","readonly",(s=>e.xs.getAllFromCollectionGroup(s,t,pl(n,En),Number.MAX_SAFE_INTEGER))).then((s=>(Hh(e,t,s),s)))}function Hh(r,t,e){let n=r.Ms.get(t)||U.min();e.forEach(((s,i)=>{i.readTime.compareTo(n)>0&&(n=i.readTime)})),r.Ms.set(t,n)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jh="firestore_clients";function kc(r,t){return`${Jh}_${r}_${t}`}const Yh="firestore_mutations";function Mc(r,t,e){let n=`${Yh}_${r}_${e}`;return t.isAuthenticated()&&(n+=`_${t.uid}`),n}const Xh="firestore_targets";function Zi(r,t){return`${Xh}_${r}_${t}`}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $t="SharedClientState";class Hs{constructor(t,e,n,s){this.user=t,this.batchId=e,this.state=n,this.error=s}static $s(t,e,n){const s=JSON.parse(n);let i,a=typeof s=="object"&&["pending","acknowledged","rejected"].indexOf(s.state)!==-1&&(s.error===void 0||typeof s.error=="object");return a&&s.error&&(a=typeof s.error.message=="string"&&typeof s.error.code=="string",a&&(i=new C(s.error.code,s.error.message))),a?new Hs(t,e,s.state,i):(lt($t,`Failed to parse mutation state for ID '${e}': ${n}`),null)}Ws(){const t={state:this.state,updateTimeMs:Date.now()};return this.error&&(t.error={code:this.error.code,message:this.error.message}),JSON.stringify(t)}}class Sr{constructor(t,e,n){this.targetId=t,this.state=e,this.error=n}static $s(t,e){const n=JSON.parse(e);let s,i=typeof n=="object"&&["not-current","current","rejected"].indexOf(n.state)!==-1&&(n.error===void 0||typeof n.error=="object");return i&&n.error&&(i=typeof n.error.message=="string"&&typeof n.error.code=="string",i&&(s=new C(n.error.code,n.error.message))),i?new Sr(t,n.state,s):(lt($t,`Failed to parse target state for ID '${t}': ${e}`),null)}Ws(){const t={state:this.state,updateTimeMs:Date.now()};return this.error&&(t.error={code:this.error.code,message:this.error.message}),JSON.stringify(t)}}class Js{constructor(t,e){this.clientId=t,this.activeTargetIds=e}static $s(t,e){const n=JSON.parse(e);let s=typeof n=="object"&&n.activeTargetIds instanceof Array,i=zo();for(let a=0;s&&a<n.activeTargetIds.length;++a)s=El(n.activeTargetIds[a]),i=i.add(n.activeTargetIds[a]);return s?new Js(t,i):(lt($t,`Failed to parse client data for instance '${t}': ${e}`),null)}}class sa{constructor(t,e){this.clientId=t,this.onlineState=e}static $s(t){const e=JSON.parse(t);return typeof e=="object"&&["Unknown","Online","Offline"].indexOf(e.onlineState)!==-1&&typeof e.clientId=="string"?new sa(e.clientId,e.onlineState):(lt($t,`Failed to parse online state: ${t}`),null)}}class Vo{constructor(){this.activeTargetIds=zo()}Qs(t){this.activeTargetIds=this.activeTargetIds.add(t)}Gs(t){this.activeTargetIds=this.activeTargetIds.delete(t)}Ws(){const t={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(t)}}class to{constructor(t,e,n,s,i){this.window=t,this.Ci=e,this.persistenceKey=n,this.zs=s,this.syncEngine=null,this.onlineStateHandler=null,this.sequenceNumberHandler=null,this.js=this.Js.bind(this),this.Hs=new et(B),this.started=!1,this.Zs=[];const a=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this.storage=this.window.localStorage,this.currentUser=i,this.Xs=kc(this.persistenceKey,this.zs),this.Ys=(function(l){return`firestore_sequence_number_${l}`})(this.persistenceKey),this.Hs=this.Hs.insert(this.zs,new Vo),this.eo=new RegExp(`^${Jh}_${a}_([^_]*)$`),this.no=new RegExp(`^${Yh}_${a}_(\\d+)(?:_(.*))?$`),this.ro=new RegExp(`^${Xh}_${a}_(\\d+)$`),this.io=(function(l){return`firestore_online_state_${l}`})(this.persistenceKey),this.so=(function(l){return`firestore_bundle_loaded_v2_${l}`})(this.persistenceKey),this.window.addEventListener("storage",this.js)}static v(t){return!(!t||!t.localStorage)}async start(){const t=await this.syncEngine.hs();for(const n of t){if(n===this.zs)continue;const s=this.getItem(kc(this.persistenceKey,n));if(s){const i=Js.$s(n,s);i&&(this.Hs=this.Hs.insert(i.clientId,i))}}this.oo();const e=this.storage.getItem(this.io);if(e){const n=this._o(e);n&&this.ao(n)}for(const n of this.Zs)this.Js(n);this.Zs=[],this.window.addEventListener("pagehide",(()=>this.shutdown())),this.started=!0}writeSequenceNumber(t){this.setItem(this.Ys,JSON.stringify(t))}getAllActiveQueryTargets(){return this.uo(this.Hs)}isActiveQueryTarget(t){let e=!1;return this.Hs.forEach(((n,s)=>{s.activeTargetIds.has(t)&&(e=!0)})),e}addPendingMutation(t){this.co(t,"pending")}updateMutationState(t,e,n){this.co(t,e,n),this.lo(t)}addLocalQueryTarget(t,e=!0){let n="not-current";if(this.isActiveQueryTarget(t)){const s=this.storage.getItem(Zi(this.persistenceKey,t));if(s){const i=Sr.$s(t,s);i&&(n=i.state)}}return e&&this.ho.Qs(t),this.oo(),n}removeLocalQueryTarget(t){this.ho.Gs(t),this.oo()}isLocalQueryTarget(t){return this.ho.activeTargetIds.has(t)}clearQueryState(t){this.removeItem(Zi(this.persistenceKey,t))}updateQueryState(t,e,n){this.Po(t,e,n)}handleUserChange(t,e,n){e.forEach((s=>{this.lo(s)})),this.currentUser=t,n.forEach((s=>{this.addPendingMutation(s)}))}setOnlineState(t){this.To(t)}notifyBundleLoaded(t){this.Eo(t)}shutdown(){this.started&&(this.window.removeEventListener("storage",this.js),this.removeItem(this.Xs),this.started=!1)}getItem(t){const e=this.storage.getItem(t);return b($t,"READ",t,e),e}setItem(t,e){b($t,"SET",t,e),this.storage.setItem(t,e)}removeItem(t){b($t,"REMOVE",t),this.storage.removeItem(t)}Js(t){const e=t;if(e.storageArea===this.storage){if(b($t,"EVENT",e.key,e.newValue),e.key===this.Xs)return void lt("Received WebStorage notification for local change. Another client might have garbage-collected our state");this.Ci.enqueueRetryable((async()=>{if(this.started){if(e.key!==null){if(this.eo.test(e.key)){if(e.newValue==null){const n=this.Io(e.key);return this.Ro(n,null)}{const n=this.Ao(e.key,e.newValue);if(n)return this.Ro(n.clientId,n)}}else if(this.no.test(e.key)){if(e.newValue!==null){const n=this.Vo(e.key,e.newValue);if(n)return this.mo(n)}}else if(this.ro.test(e.key)){if(e.newValue!==null){const n=this.fo(e.key,e.newValue);if(n)return this.po(n)}}else if(e.key===this.io){if(e.newValue!==null){const n=this._o(e.newValue);if(n)return this.ao(n)}}else if(e.key===this.Ys){const n=(function(i){let a=Ct.ce;if(i!=null)try{const u=JSON.parse(i);L(typeof u=="number",30636,{yo:i}),a=u}catch(u){lt($t,"Failed to read sequence number from WebStorage",u)}return a})(e.newValue);n!==Ct.ce&&this.sequenceNumberHandler(n)}else if(e.key===this.so){const n=this.wo(e.newValue);await Promise.all(n.map((s=>this.syncEngine.So(s))))}}}else this.Zs.push(e)}))}}get ho(){return this.Hs.get(this.zs)}oo(){this.setItem(this.Xs,this.ho.Ws())}co(t,e,n){const s=new Hs(this.currentUser,t,e,n),i=Mc(this.persistenceKey,this.currentUser,t);this.setItem(i,s.Ws())}lo(t){const e=Mc(this.persistenceKey,this.currentUser,t);this.removeItem(e)}To(t){const e={clientId:this.zs,onlineState:t};this.storage.setItem(this.io,JSON.stringify(e))}Po(t,e,n){const s=Zi(this.persistenceKey,t),i=new Sr(t,e,n);this.setItem(s,i.Ws())}Eo(t){const e=JSON.stringify(Array.from(t));this.setItem(this.so,e)}Io(t){const e=this.eo.exec(t);return e?e[1]:null}Ao(t,e){const n=this.Io(t);return Js.$s(n,e)}Vo(t,e){const n=this.no.exec(t),s=Number(n[1]),i=n[2]!==void 0?n[2]:null;return Hs.$s(new vt(i),s,e)}fo(t,e){const n=this.ro.exec(t),s=Number(n[1]);return Sr.$s(s,e)}_o(t){return sa.$s(t)}wo(t){return JSON.parse(t)}async mo(t){if(t.user.uid===this.currentUser.uid)return this.syncEngine.bo(t.batchId,t.state,t.error);b($t,`Ignoring mutation for non-active user ${t.user.uid}`)}po(t){return this.syncEngine.Do(t.targetId,t.state,t.error)}Ro(t,e){const n=e?this.Hs.insert(t,e):this.Hs.remove(t),s=this.uo(this.Hs),i=this.uo(n),a=[],u=[];return i.forEach((l=>{s.has(l)||a.push(l)})),s.forEach((l=>{i.has(l)||u.push(l)})),this.syncEngine.Co(a,u).then((()=>{this.Hs=n}))}ao(t){this.Hs.get(t.clientId)&&this.onlineStateHandler(t.onlineState)}uo(t){let e=zo();return t.forEach(((n,s)=>{e=e.unionWith(s.activeTargetIds)})),e}}class Zh{constructor(){this.vo=new Vo,this.Fo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(t){}updateMutationState(t,e,n){}addLocalQueryTarget(t,e=!0){return e&&this.vo.Qs(t),this.Fo[t]||"not-current"}updateQueryState(t,e,n){this.Fo[t]=e}removeLocalQueryTarget(t){this.vo.Gs(t)}isLocalQueryTarget(t){return this.vo.activeTargetIds.has(t)}clearQueryState(t){delete this.Fo[t]}getAllActiveQueryTargets(){return this.vo.activeTargetIds}isActiveQueryTarget(t){return this.vo.activeTargetIds.has(t)}start(){return this.vo=new Vo,Promise.resolve()}handleUserChange(t,e,n){}setOnlineState(t){}shutdown(){}writeSequenceNumber(t){}notifyBundleLoaded(t){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cg{Mo(t){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Oc="ConnectivityMonitor";class Fc{constructor(){this.xo=()=>this.Oo(),this.No=()=>this.Bo(),this.Lo=[],this.ko()}Mo(t){this.Lo.push(t)}shutdown(){window.removeEventListener("online",this.xo),window.removeEventListener("offline",this.No)}ko(){window.addEventListener("online",this.xo),window.addEventListener("offline",this.No)}Oo(){b(Oc,"Network connectivity changed: AVAILABLE");for(const t of this.Lo)t(0)}Bo(){b(Oc,"Network connectivity changed: UNAVAILABLE");for(const t of this.Lo)t(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ws=null;function So(){return ws===null?ws=(function(){return 268435456+Math.round(2147483648*Math.random())})():ws++,"0x"+ws.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const eo="RestConnection",Dg={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"};class xg{get qo(){return!1}constructor(t){this.databaseInfo=t,this.databaseId=t.databaseId;const e=t.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Ko=e+"://"+t.host,this.Uo=`projects/${n}/databases/${s}`,this.$o=this.databaseId.database===Bs?`project_id=${n}`:`project_id=${n}&database_id=${s}`}Wo(t,e,n,s,i){const a=So(),u=this.Qo(t,e.toUriEncodedString());b(eo,`Sending RPC '${t}' ${a}:`,u,n);const l={"google-cloud-resource-prefix":this.Uo,"x-goog-request-params":this.$o};this.Go(l,s,i);const{host:d}=new URL(u),f=rl(d);return this.zo(t,u,l,n,f).then((g=>(b(eo,`Received RPC '${t}' ${a}: `,g),g)),(g=>{throw In(eo,`RPC '${t}' ${a} failed with error: `,g,"url: ",u,"request:",n),g}))}jo(t,e,n,s,i,a){return this.Wo(t,e,n,s,i)}Go(t,e,n){t["X-Goog-Api-Client"]=(function(){return"gl-js/ fire/"+Ln})(),t["Content-Type"]="text/plain",this.databaseInfo.appId&&(t["X-Firebase-GMPID"]=this.databaseInfo.appId),e&&e.headers.forEach(((s,i)=>t[i]=s)),n&&n.headers.forEach(((s,i)=>t[i]=s))}Qo(t,e){const n=Dg[t];let s=`${this.Ko}/v1/${e}:${n}`;return this.databaseInfo.apiKey&&(s=`${s}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),s}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ng{constructor(t){this.Jo=t.Jo,this.Ho=t.Ho}Zo(t){this.Xo=t}Yo(t){this.e_=t}t_(t){this.n_=t}onMessage(t){this.r_=t}close(){this.Ho()}send(t){this.Jo(t)}i_(){this.Xo()}s_(){this.e_()}o_(t){this.n_(t)}__(t){this.r_(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wt="WebChannelConnection",mr=(r,t,e)=>{r.listen(t,(n=>{try{e(n)}catch(s){setTimeout((()=>{throw s}),0)}}))};class _n extends xg{constructor(t){super(t),this.a_=[],this.forceLongPolling=t.forceLongPolling,this.autoDetectLongPolling=t.autoDetectLongPolling,this.useFetchStreams=t.useFetchStreams,this.longPollingOptions=t.longPollingOptions}static u_(){if(!_n.c_){const t=ll();mr(t,cl.STAT_EVENT,(e=>{e.stat===so.PROXY?b(wt,"STAT_EVENT: detected buffering proxy"):e.stat===so.NOPROXY&&b(wt,"STAT_EVENT: detected no buffering proxy")})),_n.c_=!0}}zo(t,e,n,s,i){const a=So();return new Promise(((u,l)=>{const d=new al;d.setWithCredentials(!0),d.listenOnce(ul.COMPLETE,(()=>{try{switch(d.getLastErrorCode()){case vs.NO_ERROR:const g=d.getResponseJson();b(wt,`XHR for RPC '${t}' ${a} received:`,JSON.stringify(g)),u(g);break;case vs.TIMEOUT:b(wt,`RPC '${t}' ${a} timed out`),l(new C(S.DEADLINE_EXCEEDED,"Request time out"));break;case vs.HTTP_ERROR:const T=d.getStatus();if(b(wt,`RPC '${t}' ${a} failed with status:`,T,"response text:",d.getResponseText()),T>0){let P=d.getResponseJson();Array.isArray(P)&&(P=P[0]);const x=P==null?void 0:P.error;if(x&&x.status&&x.message){const k=(function($){const j=$.toLowerCase().replace(/_/g,"-");return Object.values(S).indexOf(j)>=0?j:S.UNKNOWN})(x.status);l(new C(k,x.message))}else l(new C(S.UNKNOWN,"Server responded with status "+d.getStatus()))}else l(new C(S.UNAVAILABLE,"Connection failed."));break;default:O(9055,{l_:t,streamId:a,h_:d.getLastErrorCode(),P_:d.getLastError()})}}finally{b(wt,`RPC '${t}' ${a} completed.`)}}));const f=JSON.stringify(s);b(wt,`RPC '${t}' ${a} sending request:`,s),d.send(e,"POST",f,n,15)}))}T_(t,e,n){const s=So(),i=[this.Ko,"/","google.firestore.v1.Firestore","/",t,"/channel"],a=this.createWebChannelTransport(),u={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},l=this.longPollingOptions.timeoutSeconds;l!==void 0&&(u.longPollingTimeout=Math.round(1e3*l)),this.useFetchStreams&&(u.useFetchStreams=!0),this.Go(u.initMessageHeaders,e,n),u.encodeInitMessageHeaders=!0;const d=i.join("");b(wt,`Creating RPC '${t}' stream ${s}: ${d}`,u);const f=a.createWebChannel(d,u);this.E_(f);let g=!1,T=!1;const P=new Ng({Jo:x=>{T?b(wt,`Not sending because RPC '${t}' stream ${s} is closed:`,x):(g||(b(wt,`Opening RPC '${t}' stream ${s} transport.`),f.open(),g=!0),b(wt,`RPC '${t}' stream ${s} sending:`,x),f.send(x))},Ho:()=>f.close()});return mr(f,gr.EventType.OPEN,(()=>{T||(b(wt,`RPC '${t}' stream ${s} transport opened.`),P.i_())})),mr(f,gr.EventType.CLOSE,(()=>{T||(T=!0,b(wt,`RPC '${t}' stream ${s} transport closed`),P.o_(),this.I_(f))})),mr(f,gr.EventType.ERROR,(x=>{T||(T=!0,In(wt,`RPC '${t}' stream ${s} transport errored. Name:`,x.name,"Message:",x.message),P.o_(new C(S.UNAVAILABLE,"The operation could not be completed")))})),mr(f,gr.EventType.MESSAGE,(x=>{var k;if(!T){const M=x.data[0];L(!!M,16349);const $=M,j=($==null?void 0:$.error)||((k=$[0])==null?void 0:k.error);if(j){b(wt,`RPC '${t}' stream ${s} received error:`,j);const q=j.status;let nt=(function(I){const p=dt[I];if(p!==void 0)return dh(p)})(q),W=j.message;q==="NOT_FOUND"&&W.includes("database")&&W.includes("does not exist")&&W.includes(this.databaseId.database)&&In(`Database '${this.databaseId.database}' not found. Please check your project configuration.`),nt===void 0&&(nt=S.INTERNAL,W="Unknown error status: "+q+" with message "+j.message),T=!0,P.o_(new C(nt,W)),f.close()}else b(wt,`RPC '${t}' stream ${s} received:`,M),P.__(M)}})),_n.u_(),setTimeout((()=>{P.s_()}),0),P}terminate(){this.a_.forEach((t=>t.close())),this.a_=[]}E_(t){this.a_.push(t)}I_(t){this.a_=this.a_.filter((e=>e===t))}Go(t,e,n){super.Go(t,e,n),this.databaseInfo.apiKey&&(t["x-goog-api-key"]=this.databaseInfo.apiKey)}createWebChannelTransport(){return hl()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function kg(r){return new _n(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function td(){return typeof window<"u"?window:null}function Ns(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mi(r){return new Um(r,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */_n.c_=!1;class ia{constructor(t,e,n=1e3,s=1.5,i=6e4){this.Ci=t,this.timerId=e,this.R_=n,this.A_=s,this.V_=i,this.d_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.d_=0}g_(){this.d_=this.V_}p_(t){this.cancel();const e=Math.floor(this.d_+this.y_()),n=Math.max(0,Date.now()-this.f_),s=Math.max(0,e-n);s>0&&b("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.d_} ms, delay with jitter: ${e} ms, last attempt: ${n} ms ago)`),this.m_=this.Ci.enqueueAfterDelay(this.timerId,s,(()=>(this.f_=Date.now(),t()))),this.d_*=this.A_,this.d_<this.R_&&(this.d_=this.R_),this.d_>this.V_&&(this.d_=this.V_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.d_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Lc="PersistentStream";class ed{constructor(t,e,n,s,i,a,u,l){this.Ci=t,this.S_=n,this.b_=s,this.connection=i,this.authCredentialsProvider=a,this.appCheckCredentialsProvider=u,this.listener=l,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new ia(t,e)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Ci.enqueueAfterDelay(this.S_,6e4,(()=>this.k_())))}q_(t){this.K_(),this.stream.send(t)}async k_(){if(this.O_())return this.close(0)}K_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(t,e){this.K_(),this.U_(),this.M_.cancel(),this.D_++,t!==4?this.M_.reset():e&&e.code===S.RESOURCE_EXHAUSTED?(lt(e.toString()),lt("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):e&&e.code===S.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.W_(),this.stream.close(),this.stream=null),this.state=t,await this.listener.t_(e)}W_(){}auth(){this.state=1;const t=this.Q_(this.D_),e=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then((([n,s])=>{this.D_===e&&this.G_(n,s)}),(n=>{t((()=>{const s=new C(S.UNKNOWN,"Fetching auth token failed: "+n.message);return this.z_(s)}))}))}G_(t,e){const n=this.Q_(this.D_);this.stream=this.j_(t,e),this.stream.Zo((()=>{n((()=>this.listener.Zo()))})),this.stream.Yo((()=>{n((()=>(this.state=2,this.v_=this.Ci.enqueueAfterDelay(this.b_,1e4,(()=>(this.O_()&&(this.state=3),Promise.resolve()))),this.listener.Yo())))})),this.stream.t_((s=>{n((()=>this.z_(s)))})),this.stream.onMessage((s=>{n((()=>++this.F_==1?this.J_(s):this.onNext(s)))}))}N_(){this.state=5,this.M_.p_((async()=>{this.state=0,this.start()}))}z_(t){return b(Lc,`close with error: ${t}`),this.stream=null,this.close(4,t)}Q_(t){return e=>{this.Ci.enqueueAndForget((()=>this.D_===t?e():(b(Lc,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve())))}}}class Mg extends ed{constructor(t,e,n,s,i,a){super(t,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",e,n,s,a),this.serializer=i}j_(t,e){return this.connection.T_("Listen",t,e)}J_(t){return this.onNext(t)}onNext(t){this.M_.reset();const e=zm(this.serializer,t),n=(function(i){if(!("targetChange"in i))return U.min();const a=i.targetChange;return a.targetIds&&a.targetIds.length?U.min():a.readTime?yt(a.readTime):U.min()})(t);return this.listener.H_(e,n)}Z_(t){const e={};e.database=To(this.serializer),e.addTarget=(function(i,a){let u;const l=a.target;if(u=qs(l)?{documents:Th(i,l)}:{query:Eh(i,l).ft},u.targetId=a.targetId,a.resumeToken.approximateByteSize()>0){u.resumeToken=gh(i,a.resumeToken);const d=yo(i,a.expectedCount);d!==null&&(u.expectedCount=d)}else if(a.snapshotVersion.compareTo(U.min())>0){u.readTime=Nn(i,a.snapshotVersion.toTimestamp());const d=yo(i,a.expectedCount);d!==null&&(u.expectedCount=d)}return u})(this.serializer,t);const n=Km(this.serializer,t);n&&(e.labels=n),this.q_(e)}X_(t){const e={};e.database=To(this.serializer),e.removeTarget=t,this.q_(e)}}class Og extends ed{constructor(t,e,n,s,i,a){super(t,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",e,n,s,a),this.serializer=i}get Y_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}W_(){this.Y_&&this.ea([])}j_(t,e){return this.connection.T_("Write",t,e)}J_(t){return L(!!t.streamToken,31322),this.lastStreamToken=t.streamToken,L(!t.writeResults||t.writeResults.length===0,55816),this.listener.ta()}onNext(t){L(!!t.streamToken,12678),this.lastStreamToken=t.streamToken,this.M_.reset();const e=Gm(t.writeResults,t.commitTime),n=yt(t.commitTime);return this.listener.na(n,e)}ra(){const t={};t.database=To(this.serializer),this.q_(t)}ea(t){const e={streamToken:this.lastStreamToken,writes:t.map((n=>Br(this.serializer,n)))};this.q_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fg{}class Lg extends Fg{constructor(t,e,n,s){super(),this.authCredentials=t,this.appCheckCredentials=e,this.connection=n,this.serializer=s,this.ia=!1}sa(){if(this.ia)throw new C(S.FAILED_PRECONDITION,"The client has already been terminated.")}Wo(t,e,n,s){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([i,a])=>this.connection.Wo(t,Io(e,n),s,i,a))).catch((i=>{throw i.name==="FirebaseError"?(i.code===S.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new C(S.UNKNOWN,i.toString())}))}jo(t,e,n,s,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([a,u])=>this.connection.jo(t,Io(e,n),s,a,u,i))).catch((a=>{throw a.name==="FirebaseError"?(a.code===S.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),a):new C(S.UNKNOWN,a.toString())}))}terminate(){this.ia=!0,this.connection.terminate()}}function Ug(r,t,e,n){return new Lg(r,t,e,n)}class Bg{constructor(t,e){this.asyncQueue=t,this.onlineStateHandler=e,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,(()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve()))))}ha(t){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${t.toString()}`),this.ca("Offline")))}set(t){this.Pa(),this.oa=0,t==="Online"&&(this.aa=!1),this.ca(t)}ca(t){t!==this.state&&(this.state=t,this.onlineStateHandler(t))}la(t){const e=`Could not reach Cloud Firestore backend. ${t}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(lt(e),this.aa=!1):b("OnlineStateTracker",e)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xe="RemoteStore";class qg{constructor(t,e,n,s,i){this.localStore=t,this.datastore=e,this.asyncQueue=n,this.remoteSyncer={},this.Ta=[],this.Ea=new Map,this.Ia=new Set,this.Ra=[],this.Aa=i,this.Aa.Mo((a=>{n.enqueueAndForget((async()=>{tn(this)&&(b(Xe,"Restarting streams for network reachability change."),await(async function(l){const d=F(l);d.Ia.add(4),await Yr(d),d.Va.set("Unknown"),d.Ia.delete(4),await gi(d)})(this))}))})),this.Va=new Bg(n,s)}}async function gi(r){if(tn(r))for(const t of r.Ra)await t(!0)}async function Yr(r){for(const t of r.Ra)await t(!1)}function pi(r,t){const e=F(r);e.Ea.has(t.targetId)||(e.Ea.set(t.targetId,t),ua(e)?aa(e):zn(e).O_()&&oa(e,t))}function Mn(r,t){const e=F(r),n=zn(e);e.Ea.delete(t),n.O_()&&nd(e,t),e.Ea.size===0&&(n.O_()?n.L_():tn(e)&&e.Va.set("Unknown"))}function oa(r,t){if(r.da.$e(t.targetId),t.resumeToken.approximateByteSize()>0||t.snapshotVersion.compareTo(U.min())>0){const e=r.remoteSyncer.getRemoteKeysForTarget(t.targetId).size;t=t.withExpectedCount(e)}zn(r).Z_(t)}function nd(r,t){r.da.$e(t),zn(r).X_(t)}function aa(r){r.da=new Mm({getRemoteKeysForTarget:t=>r.remoteSyncer.getRemoteKeysForTarget(t),At:t=>r.Ea.get(t)||null,ht:()=>r.datastore.serializer.databaseId}),zn(r).start(),r.Va.ua()}function ua(r){return tn(r)&&!zn(r).x_()&&r.Ea.size>0}function tn(r){return F(r).Ia.size===0}function rd(r){r.da=void 0}async function jg(r){r.Va.set("Online")}async function zg(r){r.Ea.forEach(((t,e)=>{oa(r,t)}))}async function Gg(r,t){rd(r),ua(r)?(r.Va.ha(t),aa(r)):r.Va.set("Unknown")}async function Kg(r,t,e){if(r.Va.set("Online"),t instanceof mh&&t.state===2&&t.cause)try{await(async function(s,i){const a=i.cause;for(const u of i.targetIds)s.Ea.has(u)&&(await s.remoteSyncer.rejectListen(u,a),s.Ea.delete(u),s.da.removeTarget(u))})(r,t)}catch(n){b(Xe,"Failed to remove targets %s: %s ",t.targetIds.join(","),n),await Ys(r,n)}else if(t instanceof Ds?r.da.Xe(t):t instanceof fh?r.da.st(t):r.da.tt(t),!e.isEqual(U.min()))try{const n=await $h(r.localStore);e.compareTo(n)>=0&&await(function(i,a){const u=i.da.Tt(a);return u.targetChanges.forEach(((l,d)=>{if(l.resumeToken.approximateByteSize()>0){const f=i.Ea.get(d);f&&i.Ea.set(d,f.withResumeToken(l.resumeToken,a))}})),u.targetMismatches.forEach(((l,d)=>{const f=i.Ea.get(l);if(!f)return;i.Ea.set(l,f.withResumeToken(ht.EMPTY_BYTE_STRING,f.snapshotVersion)),nd(i,l);const g=new Xt(f.target,l,d,f.sequenceNumber);oa(i,g)})),i.remoteSyncer.applyRemoteEvent(u)})(r,e)}catch(n){b(Xe,"Failed to raise snapshot:",n),await Ys(r,n)}}async function Ys(r,t,e){if(!Ve(t))throw t;r.Ia.add(1),await Yr(r),r.Va.set("Offline"),e||(e=()=>$h(r.localStore)),r.asyncQueue.enqueueRetryable((async()=>{b(Xe,"Retrying IndexedDB access"),await e(),r.Ia.delete(1),await gi(r)}))}function sd(r,t){return t().catch((e=>Ys(r,e,t)))}async function jn(r){const t=F(r),e=ve(t);let n=t.Ta.length>0?t.Ta[t.Ta.length-1].batchId:ze;for(;$g(t);)try{const s=await bg(t.localStore,n);if(s===null){t.Ta.length===0&&e.L_();break}n=s.batchId,Qg(t,s)}catch(s){await Ys(t,s)}id(t)&&od(t)}function $g(r){return tn(r)&&r.Ta.length<10}function Qg(r,t){r.Ta.push(t);const e=ve(r);e.O_()&&e.Y_&&e.ea(t.mutations)}function id(r){return tn(r)&&!ve(r).x_()&&r.Ta.length>0}function od(r){ve(r).start()}async function Wg(r){ve(r).ra()}async function Hg(r){const t=ve(r);for(const e of r.Ta)t.ea(e.mutations)}async function Jg(r,t,e){const n=r.Ta.shift(),s=Qo.from(n,t,e);await sd(r,(()=>r.remoteSyncer.applySuccessfulWrite(s))),await jn(r)}async function Yg(r,t){t&&ve(r).Y_&&await(async function(n,s){if((function(a){return hh(a)&&a!==S.ABORTED})(s.code)){const i=n.Ta.shift();ve(n).B_(),await sd(n,(()=>n.remoteSyncer.rejectFailedWrite(i.batchId,s))),await jn(n)}})(r,t),id(r)&&od(r)}async function Uc(r,t){const e=F(r);e.asyncQueue.verifyOperationInProgress(),b(Xe,"RemoteStore received new credentials");const n=tn(e);e.Ia.add(3),await Yr(e),n&&e.Va.set("Unknown"),await e.remoteSyncer.handleCredentialChange(t),e.Ia.delete(3),await gi(e)}async function Po(r,t){const e=F(r);t?(e.Ia.delete(2),await gi(e)):t||(e.Ia.add(2),await Yr(e),e.Va.set("Unknown"))}function zn(r){return r.ma||(r.ma=(function(e,n,s){const i=F(e);return i.sa(),new Mg(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{Zo:jg.bind(null,r),Yo:zg.bind(null,r),t_:Gg.bind(null,r),H_:Kg.bind(null,r)}),r.Ra.push((async t=>{t?(r.ma.B_(),ua(r)?aa(r):r.Va.set("Unknown")):(await r.ma.stop(),rd(r))}))),r.ma}function ve(r){return r.fa||(r.fa=(function(e,n,s){const i=F(e);return i.sa(),new Og(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{Zo:()=>Promise.resolve(),Yo:Wg.bind(null,r),t_:Yg.bind(null,r),ta:Hg.bind(null,r),na:Jg.bind(null,r)}),r.Ra.push((async t=>{t?(r.fa.B_(),await jn(r)):(await r.fa.stop(),r.Ta.length>0&&(b(Xe,`Stopping write stream with ${r.Ta.length} pending writes`),r.Ta=[]))}))),r.fa}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ca{constructor(t,e,n,s,i){this.asyncQueue=t,this.timerId=e,this.targetTimeMs=n,this.op=s,this.removalCallback=i,this.deferred=new Bt,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((a=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(t,e,n,s,i){const a=Date.now()+n,u=new ca(t,e,a,s,i);return u.start(n),u}start(t){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),t)}skipDelay(){return this.handleDelayElapsed()}cancel(t){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new C(S.CANCELLED,"Operation cancelled"+(t?": "+t:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((t=>this.deferred.resolve(t)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function la(r,t){if(lt("AsyncQueue",`${t}: ${r}`),Ve(r))return new C(S.UNAVAILABLE,`${t}: ${r}`);throw r}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yn{static emptySet(t){return new yn(t.comparator)}constructor(t){this.comparator=t?(e,n)=>t(e,n)||N.comparator(e.key,n.key):(e,n)=>N.comparator(e.key,n.key),this.keyedMap=pr(),this.sortedSet=new et(this.comparator)}has(t){return this.keyedMap.get(t)!=null}get(t){return this.keyedMap.get(t)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(t){const e=this.keyedMap.get(t);return e?this.sortedSet.indexOf(e):-1}get size(){return this.sortedSet.size}forEach(t){this.sortedSet.inorderTraversal(((e,n)=>(t(e),!1)))}add(t){const e=this.delete(t.key);return e.copy(e.keyedMap.insert(t.key,t),e.sortedSet.insert(t,null))}delete(t){const e=this.get(t);return e?this.copy(this.keyedMap.remove(t),this.sortedSet.remove(e)):this}isEqual(t){if(!(t instanceof yn)||this.size!==t.size)return!1;const e=this.sortedSet.getIterator(),n=t.sortedSet.getIterator();for(;e.hasNext();){const s=e.getNext().key,i=n.getNext().key;if(!s.isEqual(i))return!1}return!0}toString(){const t=[];return this.forEach((e=>{t.push(e.toString())})),t.length===0?"DocumentSet ()":`DocumentSet (
  `+t.join(`  
`)+`
)`}copy(t,e){const n=new yn;return n.comparator=this.comparator,n.keyedMap=t,n.sortedSet=e,n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bc{constructor(){this.ga=new et(N.comparator)}track(t){const e=t.doc.key,n=this.ga.get(e);n?t.type!==0&&n.type===3?this.ga=this.ga.insert(e,t):t.type===3&&n.type!==1?this.ga=this.ga.insert(e,{type:n.type,doc:t.doc}):t.type===2&&n.type===2?this.ga=this.ga.insert(e,{type:2,doc:t.doc}):t.type===2&&n.type===0?this.ga=this.ga.insert(e,{type:0,doc:t.doc}):t.type===1&&n.type===0?this.ga=this.ga.remove(e):t.type===1&&n.type===2?this.ga=this.ga.insert(e,{type:1,doc:n.doc}):t.type===0&&n.type===1?this.ga=this.ga.insert(e,{type:2,doc:t.doc}):O(63341,{Vt:t,pa:n}):this.ga=this.ga.insert(e,t)}ya(){const t=[];return this.ga.inorderTraversal(((e,n)=>{t.push(n)})),t}}class On{constructor(t,e,n,s,i,a,u,l,d){this.query=t,this.docs=e,this.oldDocs=n,this.docChanges=s,this.mutatedKeys=i,this.fromCache=a,this.syncStateChanged=u,this.excludesMetadataChanges=l,this.hasCachedResults=d}static fromInitialDocuments(t,e,n,s,i){const a=[];return e.forEach((u=>{a.push({type:0,doc:u})})),new On(t,e,yn.emptySet(e),a,n,s,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(t){if(!(this.fromCache===t.fromCache&&this.hasCachedResults===t.hasCachedResults&&this.syncStateChanged===t.syncStateChanged&&this.mutatedKeys.isEqual(t.mutatedKeys)&&ui(this.query,t.query)&&this.docs.isEqual(t.docs)&&this.oldDocs.isEqual(t.oldDocs)))return!1;const e=this.docChanges,n=t.docChanges;if(e.length!==n.length)return!1;for(let s=0;s<e.length;s++)if(e[s].type!==n[s].type||!e[s].doc.isEqual(n[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xg{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some((t=>t.Da()))}}class Zg{constructor(){this.queries=qc(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(e,n){const s=F(e),i=s.queries;s.queries=qc(),i.forEach(((a,u)=>{for(const l of u.Sa)l.onError(n)}))})(this,new C(S.ABORTED,"Firestore shutting down"))}}function qc(){return new ne((r=>Yl(r)),ui)}async function ha(r,t){const e=F(r);let n=3;const s=t.query;let i=e.queries.get(s);i?!i.ba()&&t.Da()&&(n=2):(i=new Xg,n=t.Da()?0:1);try{switch(n){case 0:i.wa=await e.onListen(s,!0);break;case 1:i.wa=await e.onListen(s,!1);break;case 2:await e.onFirstRemoteStoreListen(s)}}catch(a){const u=la(a,`Initialization of query '${dn(t.query)}' failed`);return void t.onError(u)}e.queries.set(s,i),i.Sa.push(t),t.va(e.onlineState),i.wa&&t.Fa(i.wa)&&fa(e)}async function da(r,t){const e=F(r),n=t.query;let s=3;const i=e.queries.get(n);if(i){const a=i.Sa.indexOf(t);a>=0&&(i.Sa.splice(a,1),i.Sa.length===0?s=t.Da()?0:1:!i.ba()&&t.Da()&&(s=2))}switch(s){case 0:return e.queries.delete(n),e.onUnlisten(n,!0);case 1:return e.queries.delete(n),e.onUnlisten(n,!1);case 2:return e.onLastRemoteStoreUnlisten(n);default:return}}function tp(r,t){const e=F(r);let n=!1;for(const s of t){const i=s.query,a=e.queries.get(i);if(a){for(const u of a.Sa)u.Fa(s)&&(n=!0);a.wa=s}}n&&fa(e)}function ep(r,t,e){const n=F(r),s=n.queries.get(t);if(s)for(const i of s.Sa)i.onError(e);n.queries.delete(t)}function fa(r){r.Ca.forEach((t=>{t.next()}))}var bo,jc;(jc=bo||(bo={})).Ma="default",jc.Cache="cache";class ma{constructor(t,e,n){this.query=t,this.xa=e,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=n||{}}Fa(t){if(!this.options.includeMetadataChanges){const n=[];for(const s of t.docChanges)s.type!==3&&n.push(s);t=new On(t.query,t.docs,t.oldDocs,n,t.mutatedKeys,t.fromCache,t.syncStateChanged,!0,t.hasCachedResults)}let e=!1;return this.Oa?this.Ba(t)&&(this.xa.next(t),e=!0):this.La(t,this.onlineState)&&(this.ka(t),e=!0),this.Na=t,e}onError(t){this.xa.error(t)}va(t){this.onlineState=t;let e=!1;return this.Na&&!this.Oa&&this.La(this.Na,t)&&(this.ka(this.Na),e=!0),e}La(t,e){if(!t.fromCache||!this.Da())return!0;const n=e!=="Offline";return(!this.options.qa||!n)&&(!t.docs.isEmpty()||t.hasCachedResults||e==="Offline")}Ba(t){if(t.docChanges.length>0)return!0;const e=this.Na&&this.Na.hasPendingWrites!==t.hasPendingWrites;return!(!t.syncStateChanged&&!e)&&this.options.includeMetadataChanges===!0}ka(t){t=On.fromInitialDocuments(t.query,t.docs,t.mutatedKeys,t.fromCache,t.hasCachedResults),this.Oa=!0,this.xa.next(t)}Da(){return this.options.source!==bo.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ad{constructor(t){this.key=t}}class ud{constructor(t){this.key=t}}class np{constructor(t,e){this.query=t,this.Za=e,this.Xa=null,this.hasCachedResults=!1,this.current=!1,this.Ya=G(),this.mutatedKeys=G(),this.eu=Zl(t),this.tu=new yn(this.eu)}get nu(){return this.Za}ru(t,e){const n=e?e.iu:new Bc,s=e?e.tu:this.tu;let i=e?e.mutatedKeys:this.mutatedKeys,a=s,u=!1;const l=this.query.limitType==="F"&&s.size===this.query.limit?s.last():null,d=this.query.limitType==="L"&&s.size===this.query.limit?s.first():null;if(t.inorderTraversal(((f,g)=>{const T=s.get(f),P=Wr(this.query,g)?g:null,x=!!T&&this.mutatedKeys.has(T.key),k=!!P&&(P.hasLocalMutations||this.mutatedKeys.has(P.key)&&P.hasCommittedMutations);let M=!1;T&&P?T.data.isEqual(P.data)?x!==k&&(n.track({type:3,doc:P}),M=!0):this.su(T,P)||(n.track({type:2,doc:P}),M=!0,(l&&this.eu(P,l)>0||d&&this.eu(P,d)<0)&&(u=!0)):!T&&P?(n.track({type:0,doc:P}),M=!0):T&&!P&&(n.track({type:1,doc:T}),M=!0,(l||d)&&(u=!0)),M&&(P?(a=a.add(P),i=k?i.add(f):i.delete(f)):(a=a.delete(f),i=i.delete(f)))})),this.query.limit!==null)for(;a.size>this.query.limit;){const f=this.query.limitType==="F"?a.last():a.first();a=a.delete(f.key),i=i.delete(f.key),n.track({type:1,doc:f})}return{tu:a,iu:n,bs:u,mutatedKeys:i}}su(t,e){return t.hasLocalMutations&&e.hasCommittedMutations&&!e.hasLocalMutations}applyChanges(t,e,n,s){const i=this.tu;this.tu=t.tu,this.mutatedKeys=t.mutatedKeys;const a=t.iu.ya();a.sort(((f,g)=>(function(P,x){const k=M=>{switch(M){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return O(20277,{Vt:M})}};return k(P)-k(x)})(f.type,g.type)||this.eu(f.doc,g.doc))),this.ou(n),s=s??!1;const u=e&&!s?this._u():[],l=this.Ya.size===0&&this.current&&!s?1:0,d=l!==this.Xa;return this.Xa=l,a.length!==0||d?{snapshot:new On(this.query,t.tu,i,a,t.mutatedKeys,l===0,d,!1,!!n&&n.resumeToken.approximateByteSize()>0),au:u}:{au:u}}va(t){return this.current&&t==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new Bc,mutatedKeys:this.mutatedKeys,bs:!1},!1)):{au:[]}}uu(t){return!this.Za.has(t)&&!!this.tu.has(t)&&!this.tu.get(t).hasLocalMutations}ou(t){t&&(t.addedDocuments.forEach((e=>this.Za=this.Za.add(e))),t.modifiedDocuments.forEach((e=>{})),t.removedDocuments.forEach((e=>this.Za=this.Za.delete(e))),this.current=t.current)}_u(){if(!this.current)return[];const t=this.Ya;this.Ya=G(),this.tu.forEach((n=>{this.uu(n.key)&&(this.Ya=this.Ya.add(n.key))}));const e=[];return t.forEach((n=>{this.Ya.has(n)||e.push(new ud(n))})),this.Ya.forEach((n=>{t.has(n)||e.push(new ad(n))})),e}cu(t){this.Za=t.ks,this.Ya=G();const e=this.ru(t.documents);return this.applyChanges(e,!0)}lu(){return On.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Xa===0,this.hasCachedResults)}}const Gn="SyncEngine";class rp{constructor(t,e,n){this.query=t,this.targetId=e,this.view=n}}class sp{constructor(t){this.key=t,this.hu=!1}}class ip{constructor(t,e,n,s,i,a){this.localStore=t,this.remoteStore=e,this.eventManager=n,this.sharedClientState=s,this.currentUser=i,this.maxConcurrentLimboResolutions=a,this.Pu={},this.Tu=new ne((u=>Yl(u)),ui),this.Eu=new Map,this.Iu=new Set,this.Ru=new et(N.comparator),this.Au=new Map,this.Vu=new Zo,this.du={},this.mu=new Map,this.fu=Ye.ar(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function op(r,t,e=!0){const n=_i(r);let s;const i=n.Tu.get(t);return i?(n.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.lu()):s=await cd(n,t,e,!0),s}async function ap(r,t){const e=_i(r);await cd(e,t,!0,!1)}async function cd(r,t,e,n){const s=await Ws(r.localStore,Ot(t)),i=s.targetId,a=r.sharedClientState.addLocalQueryTarget(i,e);let u;return n&&(u=await ga(r,t,i,a==="current",s.resumeToken)),r.isPrimaryClient&&e&&pi(r.remoteStore,s),u}async function ga(r,t,e,n,s){r.pu=(g,T,P)=>(async function(k,M,$,j){let q=M.view.ru($);q.bs&&(q=await Ro(k.localStore,M.query,!1).then((({documents:I})=>M.view.ru(I,q))));const nt=j&&j.targetChanges.get(M.targetId),W=j&&j.targetMismatches.get(M.targetId)!=null,J=M.view.applyChanges(q,k.isPrimaryClient,nt,W);return Co(k,M.targetId,J.au),J.snapshot})(r,g,T,P);const i=await Ro(r.localStore,t,!0),a=new np(t,i.ks),u=a.ru(i.documents),l=Jr.createSynthesizedTargetChangeForCurrentChange(e,n&&r.onlineState!=="Offline",s),d=a.applyChanges(u,r.isPrimaryClient,l);Co(r,e,d.au);const f=new rp(t,e,a);return r.Tu.set(t,f),r.Eu.has(e)?r.Eu.get(e).push(t):r.Eu.set(e,[t]),d.snapshot}async function up(r,t,e){const n=F(r),s=n.Tu.get(t),i=n.Eu.get(s.targetId);if(i.length>1)return n.Eu.set(s.targetId,i.filter((a=>!ui(a,t)))),void n.Tu.delete(t);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(s.targetId),n.sharedClientState.isActiveQueryTarget(s.targetId)||await kn(n.localStore,s.targetId,!1).then((()=>{n.sharedClientState.clearQueryState(s.targetId),e&&Mn(n.remoteStore,s.targetId),Fn(n,s.targetId)})).catch(Re)):(Fn(n,s.targetId),await kn(n.localStore,s.targetId,!0))}async function cp(r,t){const e=F(r),n=e.Tu.get(t),s=e.Eu.get(n.targetId);e.isPrimaryClient&&s.length===1&&(e.sharedClientState.removeLocalQueryTarget(n.targetId),Mn(e.remoteStore,n.targetId))}async function lp(r,t,e){const n=Ia(r);try{const s=await(function(a,u){const l=F(a),d=Y.now(),f=u.reduce(((P,x)=>P.add(x.key)),G());let g,T;return l.persistence.runTransaction("Locally write mutations","readwrite",(P=>{let x=Mt(),k=G();return l.xs.getEntries(P,f).next((M=>{x=M,x.forEach((($,j)=>{j.isValidDocument()||(k=k.add($))}))})).next((()=>l.localDocuments.getOverlayedDocuments(P,x))).next((M=>{g=M;const $=[];for(const j of u){const q=Dm(j,g.get(j.key).overlayedDocument);q!=null&&$.push(new re(j.key,q,ql(q.value.mapValue),ot.exists(!0)))}return l.mutationQueue.addMutationBatch(P,d,$,u)})).next((M=>{T=M;const $=M.applyToLocalDocumentSet(g,k);return l.documentOverlayCache.saveOverlays(P,M.batchId,$)}))})).then((()=>({batchId:T.batchId,changes:eh(g)})))})(n.localStore,t);n.sharedClientState.addPendingMutation(s.batchId),(function(a,u,l){let d=a.du[a.currentUser.toKey()];d||(d=new et(B)),d=d.insert(u,l),a.du[a.currentUser.toKey()]=d})(n,s.batchId,e),await Pe(n,s.changes),await jn(n.remoteStore)}catch(s){const i=la(s,"Failed to persist write");e.reject(i)}}async function ld(r,t){const e=F(r);try{const n=await Sg(e.localStore,t);t.targetChanges.forEach(((s,i)=>{const a=e.Au.get(i);a&&(L(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?a.hu=!0:s.modifiedDocuments.size>0?L(a.hu,14607):s.removedDocuments.size>0&&(L(a.hu,42227),a.hu=!1))})),await Pe(e,n,t)}catch(n){await Re(n)}}function zc(r,t,e){const n=F(r);if(n.isPrimaryClient&&e===0||!n.isPrimaryClient&&e===1){const s=[];n.Tu.forEach(((i,a)=>{const u=a.view.va(t);u.snapshot&&s.push(u.snapshot)})),(function(a,u){const l=F(a);l.onlineState=u;let d=!1;l.queries.forEach(((f,g)=>{for(const T of g.Sa)T.va(u)&&(d=!0)})),d&&fa(l)})(n.eventManager,t),s.length&&n.Pu.H_(s),n.onlineState=t,n.isPrimaryClient&&n.sharedClientState.setOnlineState(t)}}async function hp(r,t,e){const n=F(r);n.sharedClientState.updateQueryState(t,"rejected",e);const s=n.Au.get(t),i=s&&s.key;if(i){let a=new et(N.comparator);a=a.insert(i,it.newNoDocument(i,U.min()));const u=G().add(i),l=new Hr(U.min(),new Map,new et(B),a,u);await ld(n,l),n.Ru=n.Ru.remove(i),n.Au.delete(t),ya(n)}else await kn(n.localStore,t,!1).then((()=>Fn(n,t,e))).catch(Re)}async function dp(r,t){const e=F(r),n=t.batch.batchId;try{const s=await Vg(e.localStore,t);_a(e,n,null),pa(e,n),e.sharedClientState.updateMutationState(n,"acknowledged"),await Pe(e,s)}catch(s){await Re(s)}}async function fp(r,t,e){const n=F(r);try{const s=await(function(a,u){const l=F(a);return l.persistence.runTransaction("Reject batch","readwrite-primary",(d=>{let f;return l.mutationQueue.lookupMutationBatch(d,u).next((g=>(L(g!==null,37113),f=g.keys(),l.mutationQueue.removeMutationBatch(d,g)))).next((()=>l.mutationQueue.performConsistencyCheck(d))).next((()=>l.documentOverlayCache.removeOverlaysForBatchId(d,f,u))).next((()=>l.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(d,f))).next((()=>l.localDocuments.getDocuments(d,f)))}))})(n.localStore,t);_a(n,t,e),pa(n,t),n.sharedClientState.updateMutationState(t,"rejected",e),await Pe(n,s)}catch(s){await Re(s)}}function pa(r,t){(r.mu.get(t)||[]).forEach((e=>{e.resolve()})),r.mu.delete(t)}function _a(r,t,e){const n=F(r);let s=n.du[n.currentUser.toKey()];if(s){const i=s.get(t);i&&(e?i.reject(e):i.resolve(),s=s.remove(t)),n.du[n.currentUser.toKey()]=s}}function Fn(r,t,e=null){r.sharedClientState.removeLocalQueryTarget(t);for(const n of r.Eu.get(t))r.Tu.delete(n),e&&r.Pu.yu(n,e);r.Eu.delete(t),r.isPrimaryClient&&r.Vu.Gr(t).forEach((n=>{r.Vu.containsKey(n)||hd(r,n)}))}function hd(r,t){r.Iu.delete(t.path.canonicalString());const e=r.Ru.get(t);e!==null&&(Mn(r.remoteStore,e),r.Ru=r.Ru.remove(t),r.Au.delete(e),ya(r))}function Co(r,t,e){for(const n of e)n instanceof ad?(r.Vu.addReference(n.key,t),mp(r,n)):n instanceof ud?(b(Gn,"Document no longer in limbo: "+n.key),r.Vu.removeReference(n.key,t),r.Vu.containsKey(n.key)||hd(r,n.key)):O(19791,{wu:n})}function mp(r,t){const e=t.key,n=e.path.canonicalString();r.Ru.get(e)||r.Iu.has(n)||(b(Gn,"New document in limbo: "+e),r.Iu.add(n),ya(r))}function ya(r){for(;r.Iu.size>0&&r.Ru.size<r.maxConcurrentLimboResolutions;){const t=r.Iu.values().next().value;r.Iu.delete(t);const e=new N(H.fromString(t)),n=r.fu.next();r.Au.set(n,new sp(e)),r.Ru=r.Ru.insert(e,n),pi(r.remoteStore,new Xt(Ot(Qr(e.path)),n,"TargetPurposeLimboResolution",Ct.ce))}}async function Pe(r,t,e){const n=F(r),s=[],i=[],a=[];n.Tu.isEmpty()||(n.Tu.forEach(((u,l)=>{a.push(n.pu(l,t,e).then((d=>{var f;if((d||e)&&n.isPrimaryClient){const g=d?!d.fromCache:(f=e==null?void 0:e.targetChanges.get(l.targetId))==null?void 0:f.current;n.sharedClientState.updateQueryState(l.targetId,g?"current":"not-current")}if(d){s.push(d);const g=na.Is(l.targetId,d);i.push(g)}})))})),await Promise.all(a),n.Pu.H_(s),await(async function(l,d){const f=F(l);try{await f.persistence.runTransaction("notifyLocalViewChanges","readwrite",(g=>v.forEach(d,(T=>v.forEach(T.Ts,(P=>f.persistence.referenceDelegate.addReference(g,T.targetId,P))).next((()=>v.forEach(T.Es,(P=>f.persistence.referenceDelegate.removeReference(g,T.targetId,P)))))))))}catch(g){if(!Ve(g))throw g;b(ra,"Failed to update sequence numbers: "+g)}for(const g of d){const T=g.targetId;if(!g.fromCache){const P=f.vs.get(T),x=P.snapshotVersion,k=P.withLastLimboFreeSnapshotVersion(x);f.vs=f.vs.insert(T,k)}}})(n.localStore,i))}async function gp(r,t){const e=F(r);if(!e.currentUser.isEqual(t)){b(Gn,"User change. New user:",t.toKey());const n=await Kh(e.localStore,t);e.currentUser=t,(function(i,a){i.mu.forEach((u=>{u.forEach((l=>{l.reject(new C(S.CANCELLED,a))}))})),i.mu.clear()})(e,"'waitForPendingWrites' promise is rejected due to a user change."),e.sharedClientState.handleUserChange(t,n.removedBatchIds,n.addedBatchIds),await Pe(e,n.Ns)}}function pp(r,t){const e=F(r),n=e.Au.get(t);if(n&&n.hu)return G().add(n.key);{let s=G();const i=e.Eu.get(t);if(!i)return s;for(const a of i){const u=e.Tu.get(a);s=s.unionWith(u.view.nu)}return s}}async function _p(r,t){const e=F(r),n=await Ro(e.localStore,t.query,!0),s=t.view.cu(n);return e.isPrimaryClient&&Co(e,t.targetId,s.au),s}async function yp(r,t){const e=F(r);return Wh(e.localStore,t).then((n=>Pe(e,n)))}async function Ip(r,t,e,n){const s=F(r),i=await(function(u,l){const d=F(u),f=F(d.mutationQueue);return d.persistence.runTransaction("Lookup mutation documents","readonly",(g=>f.Xn(g,l).next((T=>T?d.localDocuments.getDocuments(g,T):v.resolve(null)))))})(s.localStore,t);i!==null?(e==="pending"?await jn(s.remoteStore):e==="acknowledged"||e==="rejected"?(_a(s,t,n||null),pa(s,t),(function(u,l){F(F(u).mutationQueue).nr(l)})(s.localStore,t)):O(6720,"Unknown batchState",{Su:e}),await Pe(s,i)):b(Gn,"Cannot apply mutation batch with id: "+t)}async function Tp(r,t){const e=F(r);if(_i(e),Ia(e),t===!0&&e.gu!==!0){const n=e.sharedClientState.getAllActiveQueryTargets(),s=await Gc(e,n.toArray());e.gu=!0,await Po(e.remoteStore,!0);for(const i of s)pi(e.remoteStore,i)}else if(t===!1&&e.gu!==!1){const n=[];let s=Promise.resolve();e.Eu.forEach(((i,a)=>{e.sharedClientState.isLocalQueryTarget(a)?n.push(a):s=s.then((()=>(Fn(e,a),kn(e.localStore,a,!0)))),Mn(e.remoteStore,a)})),await s,await Gc(e,n),(function(a){const u=F(a);u.Au.forEach(((l,d)=>{Mn(u.remoteStore,d)})),u.Vu.zr(),u.Au=new Map,u.Ru=new et(N.comparator)})(e),e.gu=!1,await Po(e.remoteStore,!1)}}async function Gc(r,t,e){const n=F(r),s=[],i=[];for(const a of t){let u;const l=n.Eu.get(a);if(l&&l.length!==0){u=await Ws(n.localStore,Ot(l[0]));for(const d of l){const f=n.Tu.get(d),g=await _p(n,f);g.snapshot&&i.push(g.snapshot)}}else{const d=await Qh(n.localStore,a);u=await Ws(n.localStore,d),await ga(n,dd(d),a,!1,u.resumeToken)}s.push(u)}return n.Pu.H_(i),s}function dd(r){return Hl(r.path,r.collectionGroup,r.orderBy,r.filters,r.limit,"F",r.startAt,r.endAt)}function Ep(r){return(function(e){return F(F(e).persistence).hs()})(F(r).localStore)}async function wp(r,t,e,n){const s=F(r);if(s.gu)return void b(Gn,"Ignoring unexpected query state notification.");const i=s.Eu.get(t);if(i&&i.length>0)switch(e){case"current":case"not-current":{const a=await Wh(s.localStore,Xl(i[0])),u=Hr.createSynthesizedRemoteEventForCurrentChange(t,e==="current",ht.EMPTY_BYTE_STRING);await Pe(s,a,u);break}case"rejected":await kn(s.localStore,t,!0),Fn(s,t,n);break;default:O(64155,e)}}async function vp(r,t,e){const n=_i(r);if(n.gu){for(const s of t){if(n.Eu.has(s)&&n.sharedClientState.isActiveQueryTarget(s)){b(Gn,"Adding an already active target "+s);continue}const i=await Qh(n.localStore,s),a=await Ws(n.localStore,i);await ga(n,dd(i),a.targetId,!1,a.resumeToken),pi(n.remoteStore,a)}for(const s of e)n.Eu.has(s)&&await kn(n.localStore,s,!1).then((()=>{Mn(n.remoteStore,s),Fn(n,s)})).catch(Re)}}function _i(r){const t=F(r);return t.remoteStore.remoteSyncer.applyRemoteEvent=ld.bind(null,t),t.remoteStore.remoteSyncer.getRemoteKeysForTarget=pp.bind(null,t),t.remoteStore.remoteSyncer.rejectListen=hp.bind(null,t),t.Pu.H_=tp.bind(null,t.eventManager),t.Pu.yu=ep.bind(null,t.eventManager),t}function Ia(r){const t=F(r);return t.remoteStore.remoteSyncer.applySuccessfulWrite=dp.bind(null,t),t.remoteStore.remoteSyncer.rejectFailedWrite=fp.bind(null,t),t}class qr{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(t){this.serializer=mi(t.databaseInfo.databaseId),this.sharedClientState=this.Du(t),this.persistence=this.Cu(t),await this.persistence.start(),this.localStore=this.vu(t),this.gcScheduler=this.Fu(t,this.localStore),this.indexBackfillerScheduler=this.Mu(t,this.localStore)}Fu(t,e){return null}Mu(t,e){return null}vu(t){return Gh(this.persistence,new zh,t.initialUser,this.serializer)}Cu(t){return new ta(fi.Vi,this.serializer)}Du(t){return new Zh}async terminate(){var t,e;(t=this.gcScheduler)==null||t.stop(),(e=this.indexBackfillerScheduler)==null||e.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}qr.provider={build:()=>new qr};class Ap extends qr{constructor(t){super(),this.cacheSizeBytes=t}Fu(t,e){L(this.persistence.referenceDelegate instanceof Qs,46915);const n=this.persistence.referenceDelegate.garbageCollector;return new Fh(n,t.asyncQueue,e)}Cu(t){const e=this.cacheSizeBytes!==void 0?At.withCacheSize(this.cacheSizeBytes):At.DEFAULT;return new ta((n=>Qs.Vi(n,e)),this.serializer)}}class fd extends qr{constructor(t,e,n){super(),this.xu=t,this.cacheSizeBytes=e,this.forceOwnership=n,this.kind="persistent",this.synchronizeTabs=!1}async initialize(t){await super.initialize(t),await this.xu.initialize(this,t),await Ia(this.xu.syncEngine),await jn(this.xu.remoteStore),await this.persistence.zi((()=>(this.gcScheduler&&!this.gcScheduler.started&&this.gcScheduler.start(),this.indexBackfillerScheduler&&!this.indexBackfillerScheduler.started&&this.indexBackfillerScheduler.start(),Promise.resolve())))}vu(t){return Gh(this.persistence,new zh,t.initialUser,this.serializer)}Fu(t,e){const n=this.persistence.referenceDelegate.garbageCollector;return new Fh(n,t.asyncQueue,e)}Mu(t,e){const n=new Df(e,this.persistence);return new Cf(t.asyncQueue,n)}Cu(t){const e=jh(t.databaseInfo.databaseId,t.databaseInfo.persistenceKey),n=this.cacheSizeBytes!==void 0?At.withCacheSize(this.cacheSizeBytes):At.DEFAULT;return new ea(this.synchronizeTabs,e,t.clientId,n,t.asyncQueue,td(),Ns(),this.serializer,this.sharedClientState,!!this.forceOwnership)}Du(t){return new Zh}}class Rp extends fd{constructor(t,e){super(t,e,!1),this.xu=t,this.cacheSizeBytes=e,this.synchronizeTabs=!0}async initialize(t){await super.initialize(t);const e=this.xu.syncEngine;this.sharedClientState instanceof to&&(this.sharedClientState.syncEngine={bo:Ip.bind(null,e),Do:wp.bind(null,e),Co:vp.bind(null,e),hs:Ep.bind(null,e),So:yp.bind(null,e)},await this.sharedClientState.start()),await this.persistence.zi((async n=>{await Tp(this.xu.syncEngine,n),this.gcScheduler&&(n&&!this.gcScheduler.started?this.gcScheduler.start():n||this.gcScheduler.stop()),this.indexBackfillerScheduler&&(n&&!this.indexBackfillerScheduler.started?this.indexBackfillerScheduler.start():n||this.indexBackfillerScheduler.stop())}))}Du(t){const e=td();if(!to.v(e))throw new C(S.UNIMPLEMENTED,"IndexedDB persistence is only available on platforms that support LocalStorage.");const n=jh(t.databaseInfo.databaseId,t.databaseInfo.persistenceKey);return new to(e,t.asyncQueue,n,t.clientId,t.initialUser)}}class jr{async initialize(t,e){this.localStore||(this.localStore=t.localStore,this.sharedClientState=t.sharedClientState,this.datastore=this.createDatastore(e),this.remoteStore=this.createRemoteStore(e),this.eventManager=this.createEventManager(e),this.syncEngine=this.createSyncEngine(e,!t.synchronizeTabs),this.sharedClientState.onlineStateHandler=n=>zc(this.syncEngine,n,1),this.remoteStore.remoteSyncer.handleCredentialChange=gp.bind(null,this.syncEngine),await Po(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(t){return(function(){return new Zg})()}createDatastore(t){const e=mi(t.databaseInfo.databaseId),n=kg(t.databaseInfo);return Ug(t.authCredentials,t.appCheckCredentials,n,e)}createRemoteStore(t){return(function(n,s,i,a,u){return new qg(n,s,i,a,u)})(this.localStore,this.datastore,t.asyncQueue,(e=>zc(this.syncEngine,e,0)),(function(){return Fc.v()?new Fc:new Cg})())}createSyncEngine(t,e){return(function(s,i,a,u,l,d,f){const g=new ip(s,i,a,u,l,d);return f&&(g.gu=!0),g})(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,t.initialUser,t.maxConcurrentLimboResolutions,e)}async terminate(){var t,e;await(async function(s){const i=F(s);b(Xe,"RemoteStore shutting down."),i.Ia.add(5),await Yr(i),i.Aa.shutdown(),i.Va.set("Unknown")})(this.remoteStore),(t=this.datastore)==null||t.terminate(),(e=this.eventManager)==null||e.terminate()}}jr.provider={build:()=>new jr};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ta{constructor(t){this.observer=t,this.muted=!1}next(t){this.muted||this.observer.next&&this.Ou(this.observer.next,t)}error(t){this.muted||(this.observer.error?this.Ou(this.observer.error,t):lt("Uncaught Error in snapshot listener:",t.toString()))}Nu(){this.muted=!0}Ou(t,e){setTimeout((()=>{this.muted||t(e)}),0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Vp=class{constructor(t){this.datastore=t,this.readVersions=new Map,this.mutations=[],this.committed=!1,this.lastTransactionError=null,this.writtenDocs=new Set}async lookup(t){if(this.ensureCommitNotCalled(),this.mutations.length>0)throw this.lastTransactionError=new C(S.INVALID_ARGUMENT,"Firestore transactions require all reads to be executed before all writes."),this.lastTransactionError;const e=await(async function(s,i){const a=F(s),u={documents:i.map((g=>Ur(a.serializer,g)))},l=await a.jo("BatchGetDocuments",a.serializer.databaseId,H.emptyPath(),u,i.length),d=new Map;l.forEach((g=>{const T=jm(a.serializer,g);d.set(T.key.toString(),T)}));const f=[];return i.forEach((g=>{const T=d.get(g.toString());L(!!T,55234,{key:g}),f.push(T)})),f})(this.datastore,t);return e.forEach((n=>this.recordVersion(n))),e}set(t,e){this.write(e.toMutation(t,this.precondition(t))),this.writtenDocs.add(t.toString())}update(t,e){try{this.write(e.toMutation(t,this.preconditionForUpdate(t)))}catch(n){this.lastTransactionError=n}this.writtenDocs.add(t.toString())}delete(t){this.write(new qn(t,this.precondition(t))),this.writtenDocs.add(t.toString())}async commit(){if(this.ensureCommitNotCalled(),this.lastTransactionError)throw this.lastTransactionError;const t=this.readVersions;this.mutations.forEach((e=>{t.delete(e.key.toString())})),t.forEach(((e,n)=>{const s=N.fromPath(n);this.mutations.push(new Ko(s,this.precondition(s)))})),await(async function(n,s){const i=F(n),a={writes:s.map((u=>Br(i.serializer,u)))};await i.Wo("Commit",i.serializer.databaseId,H.emptyPath(),a)})(this.datastore,this.mutations),this.committed=!0}recordVersion(t){let e;if(t.isFoundDocument())e=t.version;else{if(!t.isNoDocument())throw O(50498,{Gu:t.constructor.name});e=U.min()}const n=this.readVersions.get(t.key.toString());if(n){if(!e.isEqual(n))throw new C(S.ABORTED,"Document version changed between two reads.")}else this.readVersions.set(t.key.toString(),e)}precondition(t){const e=this.readVersions.get(t.toString());return!this.writtenDocs.has(t.toString())&&e?e.isEqual(U.min())?ot.exists(!1):ot.updateTime(e):ot.none()}preconditionForUpdate(t){const e=this.readVersions.get(t.toString());if(!this.writtenDocs.has(t.toString())&&e){if(e.isEqual(U.min()))throw new C(S.INVALID_ARGUMENT,"Can't update a document that doesn't exist.");return ot.updateTime(e)}return ot.exists(!0)}write(t){this.ensureCommitNotCalled(),this.mutations.push(t)}ensureCommitNotCalled(){}};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sp{constructor(t,e,n,s,i){this.asyncQueue=t,this.datastore=e,this.options=n,this.updateFunction=s,this.deferred=i,this.zu=n.maxAttempts,this.M_=new ia(this.asyncQueue,"transaction_retry")}ju(){this.zu-=1,this.Ju()}Ju(){this.M_.p_((async()=>{const t=new Vp(this.datastore),e=this.Hu(t);e&&e.then((n=>{this.asyncQueue.enqueueAndForget((()=>t.commit().then((()=>{this.deferred.resolve(n)})).catch((s=>{this.Zu(s)}))))})).catch((n=>{this.Zu(n)}))}))}Hu(t){try{const e=this.updateFunction(t);return!Gr(e)&&e.catch&&e.then?e:(this.deferred.reject(Error("Transaction callback must return a Promise")),null)}catch(e){return this.deferred.reject(e),null}}Zu(t){this.zu>0&&this.Xu(t)?(this.zu-=1,this.asyncQueue.enqueueAndForget((()=>(this.Ju(),Promise.resolve())))):this.deferred.reject(t)}Xu(t){if((t==null?void 0:t.name)==="FirebaseError"){const e=t.code;return e==="aborted"||e==="failed-precondition"||e==="already-exists"||!hh(e)}return!1}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ae="FirestoreClient";class Pp{constructor(t,e,n,s,i){this.authCredentials=t,this.appCheckCredentials=e,this.asyncQueue=n,this._databaseInfo=s,this.user=vt.UNAUTHENTICATED,this.clientId=xo.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(n,(async a=>{b(Ae,"Received user=",a.uid),await this.authCredentialListener(a),this.user=a})),this.appCheckCredentials.start(n,(a=>(b(Ae,"Received new app check token=",a),this.appCheckCredentialListener(a,this.user))))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this._databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(t){this.authCredentialListener=t}setAppCheckTokenChangeListener(t){this.appCheckCredentialListener=t}terminate(){this.asyncQueue.enterRestrictedMode();const t=new Bt;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted((async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),t.resolve()}catch(e){const n=la(e,"Failed to shutdown persistence");t.reject(n)}})),t.promise}}async function no(r,t){r.asyncQueue.verifyOperationInProgress(),b(Ae,"Initializing OfflineComponentProvider");const e=r.configuration;await t.initialize(e);let n=e.initialUser;r.setCredentialChangeListener((async s=>{n.isEqual(s)||(await Kh(t.localStore,s),n=s)})),t.persistence.setDatabaseDeletedListener((()=>r.terminate())),r._offlineComponents=t}async function Kc(r,t){r.asyncQueue.verifyOperationInProgress();const e=await bp(r);b(Ae,"Initializing OnlineComponentProvider"),await t.initialize(e,r.configuration),r.setCredentialChangeListener((n=>Uc(t.remoteStore,n))),r.setAppCheckTokenChangeListener(((n,s)=>Uc(t.remoteStore,s))),r._onlineComponents=t}async function bp(r){if(!r._offlineComponents)if(r._uninitializedComponentsProvider){b(Ae,"Using user provided OfflineComponentProvider");try{await no(r,r._uninitializedComponentsProvider._offline)}catch(t){const e=t;if(!(function(s){return s.name==="FirebaseError"?s.code===S.FAILED_PRECONDITION||s.code===S.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11})(e))throw e;In("Error using user provided cache. Falling back to memory cache: "+e),await no(r,new qr)}}else b(Ae,"Using default OfflineComponentProvider"),await no(r,new Ap(void 0));return r._offlineComponents}async function Ea(r){return r._onlineComponents||(r._uninitializedComponentsProvider?(b(Ae,"Using user provided OnlineComponentProvider"),await Kc(r,r._uninitializedComponentsProvider._online)):(b(Ae,"Using default OnlineComponentProvider"),await Kc(r,new jr))),r._onlineComponents}function Cp(r){return Ea(r).then((t=>t.syncEngine))}function Dp(r){return Ea(r).then((t=>t.datastore))}async function Xs(r){const t=await Ea(r),e=t.eventManager;return e.onListen=op.bind(null,t.syncEngine),e.onUnlisten=up.bind(null,t.syncEngine),e.onFirstRemoteStoreListen=ap.bind(null,t.syncEngine),e.onLastRemoteStoreUnlisten=cp.bind(null,t.syncEngine),e}function xp(r,t,e,n){const s=new Ta(n),i=new ma(t,s,e);return r.asyncQueue.enqueueAndForget((async()=>ha(await Xs(r),i))),()=>{s.Nu(),r.asyncQueue.enqueueAndForget((async()=>da(await Xs(r),i)))}}function Np(r,t,e={}){const n=new Bt;return r.asyncQueue.enqueueAndForget((async()=>(function(i,a,u,l,d){const f=new Ta({next:T=>{f.Nu(),a.enqueueAndForget((()=>da(i,g)));const P=T.docs.has(u);!P&&T.fromCache?d.reject(new C(S.UNAVAILABLE,"Failed to get document because the client is offline.")):P&&T.fromCache&&l&&l.source==="server"?d.reject(new C(S.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):d.resolve(T)},error:T=>d.reject(T)}),g=new ma(Qr(u.path),f,{includeMetadataChanges:!0,qa:!0});return ha(i,g)})(await Xs(r),r.asyncQueue,t,e,n))),n.promise}function kp(r,t,e={}){const n=new Bt;return r.asyncQueue.enqueueAndForget((async()=>(function(i,a,u,l,d){const f=new Ta({next:T=>{f.Nu(),a.enqueueAndForget((()=>da(i,g))),T.fromCache&&l.source==="server"?d.reject(new C(S.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):d.resolve(T)},error:T=>d.reject(T)}),g=new ma(u,f,{includeMetadataChanges:!0,qa:!0});return ha(i,g)})(await Xs(r),r.asyncQueue,t,e,n))),n.promise}function Mp(r,t){const e=new Bt;return r.asyncQueue.enqueueAndForget((async()=>lp(await Cp(r),t,e))),e.promise}function Op(r,t,e){const n=new Bt;return r.asyncQueue.enqueueAndForget((async()=>{const s=await Dp(r);new Sp(r.asyncQueue,s,e,t,n).ju()})),n.promise}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function md(r){const t={};return r.timeoutSeconds!==void 0&&(t.timeoutSeconds=r.timeoutSeconds),t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fp="ComponentProvider",$c=new Map;function Lp(r,t,e,n,s){return new im(r,t,e,s.host,s.ssl,s.experimentalForceLongPolling,s.experimentalAutoDetectLongPolling,md(s.experimentalLongPollingOptions),s.useFetchStreams,s.isUsingEmulator,n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Up="firestore.googleapis.com",Qc=!0;class Wc{constructor(t){if(t.host===void 0){if(t.ssl!==void 0)throw new C(S.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=Up,this.ssl=Qc}else this.host=t.host,this.ssl=t.ssl??Qc;if(this.isUsingEmulator=t.emulatorOptions!==void 0,this.credentials=t.credentials,this.ignoreUndefinedProperties=!!t.ignoreUndefinedProperties,this.localCache=t.localCache,t.cacheSizeBytes===void 0)this.cacheSizeBytes=xh;else{if(t.cacheSizeBytes!==-1&&t.cacheSizeBytes<Oh)throw new C(S.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=t.cacheSizeBytes}Vf("experimentalForceLongPolling",t.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",t.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!t.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:t.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!t.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=md(t.experimentalLongPollingOptions??{}),(function(n){if(n.timeoutSeconds!==void 0){if(isNaN(n.timeoutSeconds))throw new C(S.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (must not be NaN)`);if(n.timeoutSeconds<5)throw new C(S.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (minimum allowed value is 5)`);if(n.timeoutSeconds>30)throw new C(S.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!t.useFetchStreams}isEqual(t){return this.host===t.host&&this.ssl===t.ssl&&this.credentials===t.credentials&&this.cacheSizeBytes===t.cacheSizeBytes&&this.experimentalForceLongPolling===t.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===t.experimentalAutoDetectLongPolling&&(function(n,s){return n.timeoutSeconds===s.timeoutSeconds})(this.experimentalLongPollingOptions,t.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===t.ignoreUndefinedProperties&&this.useFetchStreams===t.useFetchStreams}}class wa{constructor(t,e,n,s){this._authCredentials=t,this._appCheckCredentials=e,this._databaseId=n,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Wc({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new C(S.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(t){if(this._settingsFrozen)throw new C(S.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Wc(t),this._emulatorOptions=t.emulatorOptions||{},t.credentials!==void 0&&(this._authCredentials=(function(n){if(!n)return new _f;switch(n.type){case"firstParty":return new Tf(n.sessionIndex||"0",n.iamToken||null,n.authTokenFactory||null);case"provider":return n.client;default:throw new C(S.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(t.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(e){const n=$c.get(e);n&&(b(Fp,"Removing Datastore"),$c.delete(e),n.terminate())})(this),Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class se{constructor(t,e,n){this.converter=e,this._query=n,this.type="query",this.firestore=t}withConverter(t){return new se(this.firestore,t,this._query)}}class ut{constructor(t,e,n){this.converter=e,this._key=n,this.type="document",this.firestore=t}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Ie(this.firestore,this.converter,this._key.path.popLast())}withConverter(t){return new ut(this.firestore,t,this._key)}toJSON(){return{type:ut._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(t,e,n){if(zr(e,ut._jsonSchema))return new ut(t,n||null,new N(H.fromString(e.referencePath)))}}ut._jsonSchemaVersion="firestore/documentReference/1.0",ut._jsonSchema={type:ft("string",ut._jsonSchemaVersion),referencePath:ft("string")};class Ie extends se{constructor(t,e,n){super(t,e,Qr(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const t=this._path.popLast();return t.isEmpty()?null:new ut(this.firestore,null,new N(t))}withConverter(t){return new Ie(this.firestore,t,this._path)}}function c_(r,t,...e){if(r=Ft(r),ml("collection","path",t),r instanceof wa){const n=H.fromString(t,...e);return Lu(n),new Ie(r,null,n)}{if(!(r instanceof ut||r instanceof Ie))throw new C(S.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(H.fromString(t,...e));return Lu(n),new Ie(r.firestore,null,n)}}function Bp(r,t,...e){if(r=Ft(r),arguments.length===1&&(t=xo.newId()),ml("doc","path",t),r instanceof wa){const n=H.fromString(t,...e);return Fu(n),new ut(r,null,new N(n))}{if(!(r instanceof ut||r instanceof Ie))throw new C(S.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(H.fromString(t,...e));return Fu(n),new ut(r.firestore,r instanceof Ie?r.converter:null,new N(n))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hc="AsyncQueue";class Jc{constructor(t=Promise.resolve()){this.Yu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new ia(this,"async_queue_retry"),this._c=()=>{const n=Ns();n&&b(Hc,"Visibility state changed to "+n.visibilityState),this.M_.w_()},this.ac=t;const e=Ns();e&&typeof e.addEventListener=="function"&&e.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(t){this.enqueue(t)}enqueueAndForgetEvenWhileRestricted(t){this.uc(),this.cc(t)}enterRestrictedMode(t){if(!this.ec){this.ec=!0,this.sc=t||!1;const e=Ns();e&&typeof e.removeEventListener=="function"&&e.removeEventListener("visibilitychange",this._c)}}enqueue(t){if(this.uc(),this.ec)return new Promise((()=>{}));const e=new Bt;return this.cc((()=>this.ec&&this.sc?Promise.resolve():(t().then(e.resolve,e.reject),e.promise))).then((()=>e.promise))}enqueueRetryable(t){this.enqueueAndForget((()=>(this.Yu.push(t),this.lc())))}async lc(){if(this.Yu.length!==0){try{await this.Yu[0](),this.Yu.shift(),this.M_.reset()}catch(t){if(!Ve(t))throw t;b(Hc,"Operation failed with retryable error: "+t)}this.Yu.length>0&&this.M_.p_((()=>this.lc()))}}cc(t){const e=this.ac.then((()=>(this.rc=!0,t().catch((n=>{throw this.nc=n,this.rc=!1,lt("INTERNAL UNHANDLED ERROR: ",Yc(n)),n})).then((n=>(this.rc=!1,n))))));return this.ac=e,e}enqueueAfterDelay(t,e,n){this.uc(),this.oc.indexOf(t)>-1&&(e=0);const s=ca.createAndSchedule(this,t,e,n,(i=>this.hc(i)));return this.tc.push(s),s}uc(){this.nc&&O(47125,{Pc:Yc(this.nc)})}verifyOperationInProgress(){}async Tc(){let t;do t=this.ac,await t;while(t!==this.ac)}Ec(t){for(const e of this.tc)if(e.timerId===t)return!0;return!1}Ic(t){return this.Tc().then((()=>{this.tc.sort(((e,n)=>e.targetTimeMs-n.targetTimeMs));for(const e of this.tc)if(e.skipDelay(),t!=="all"&&e.timerId===t)break;return this.Tc()}))}Rc(t){this.oc.push(t)}hc(t){const e=this.tc.indexOf(t);this.tc.splice(e,1)}}function Yc(r){let t=r.message||"";return r.stack&&(t=r.stack.includes(r.message)?r.stack:r.message+`
`+r.stack),t}class jt extends wa{constructor(t,e,n,s){super(t,e,n,s),this.type="firestore",this._queue=new Jc,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const t=this._firestoreClient.terminate();this._queue=new Jc(t),this._firestoreClient=void 0,await t}}}function l_(r,t,e){e||(e=Bs);const n=af(r,"firestore");if(n.isInitialized(e)){const s=n.getImmediate({identifier:e}),i=n.getOptions(e);if(uf(i,t))return s;throw new C(S.FAILED_PRECONDITION,"initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance.")}if(t.cacheSizeBytes!==void 0&&t.localCache!==void 0)throw new C(S.INVALID_ARGUMENT,"cache and cacheSizeBytes cannot be specified at the same time as cacheSizeBytes willbe deprecated. Instead, specify the cache size in the cache object");if(t.cacheSizeBytes!==void 0&&t.cacheSizeBytes!==-1&&t.cacheSizeBytes<Oh)throw new C(S.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");return t.host&&rl(t.host)&&cf(t.host),n.initialize({options:t,instanceIdentifier:e})}function Kn(r){if(r._terminated)throw new C(S.FAILED_PRECONDITION,"The client has already been terminated.");return r._firestoreClient||qp(r),r._firestoreClient}function qp(r){var n,s,i,a;const t=r._freezeSettings(),e=Lp(r._databaseId,((n=r._app)==null?void 0:n.options.appId)||"",r._persistenceKey,(s=r._app)==null?void 0:s.options.apiKey,t);r._componentsProvider||(i=t.localCache)!=null&&i._offlineComponentProvider&&((a=t.localCache)!=null&&a._onlineComponentProvider)&&(r._componentsProvider={_offline:t.localCache._offlineComponentProvider,_online:t.localCache._onlineComponentProvider}),r._firestoreClient=new Pp(r._authCredentials,r._appCheckCredentials,r._queue,e,r._componentsProvider&&(function(l){const d=l==null?void 0:l._online.build();return{_offline:l==null?void 0:l._offline.build(d),_online:d}})(r._componentsProvider))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kt{constructor(t){this._byteString=t}static fromBase64String(t){try{return new kt(ht.fromBase64String(t))}catch(e){throw new C(S.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+e)}}static fromUint8Array(t){return new kt(ht.fromUint8Array(t))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(t){return this._byteString.isEqual(t._byteString)}toJSON(){return{type:kt._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(t){if(zr(t,kt._jsonSchema))return kt.fromBase64String(t.bytes)}}kt._jsonSchemaVersion="firestore/bytes/1.0",kt._jsonSchema={type:ft("string",kt._jsonSchemaVersion),bytes:ft("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xr{constructor(...t){for(let e=0;e<t.length;++e)if(t[e].length===0)throw new C(S.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new at(t)}isEqual(t){return this._internalPath.isEqual(t._internalPath)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yi{constructor(t){this._methodName=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ht{constructor(t,e){if(!isFinite(t)||t<-90||t>90)throw new C(S.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+t);if(!isFinite(e)||e<-180||e>180)throw new C(S.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+e);this._lat=t,this._long=e}get latitude(){return this._lat}get longitude(){return this._long}isEqual(t){return this._lat===t._lat&&this._long===t._long}_compareTo(t){return B(this._lat,t._lat)||B(this._long,t._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Ht._jsonSchemaVersion}}static fromJSON(t){if(zr(t,Ht._jsonSchema))return new Ht(t.latitude,t.longitude)}}Ht._jsonSchemaVersion="firestore/geoPoint/1.0",Ht._jsonSchema={type:ft("string",Ht._jsonSchemaVersion),latitude:ft("number"),longitude:ft("number")};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qt{constructor(t){this._values=(t||[]).map((e=>e))}toArray(){return this._values.map((t=>t))}isEqual(t){return(function(n,s){if(n.length!==s.length)return!1;for(let i=0;i<n.length;++i)if(n[i]!==s[i])return!1;return!0})(this._values,t._values)}toJSON(){return{type:qt._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(t){if(zr(t,qt._jsonSchema)){if(Array.isArray(t.vectorValues)&&t.vectorValues.every((e=>typeof e=="number")))return new qt(t.vectorValues);throw new C(S.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}qt._jsonSchemaVersion="firestore/vectorValue/1.0",qt._jsonSchema={type:ft("string",qt._jsonSchemaVersion),vectorValues:ft("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jp=/^__.*__$/;class zp{constructor(t,e,n){this.data=t,this.fieldMask=e,this.fieldTransforms=n}toMutation(t,e){return this.fieldMask!==null?new re(t,this.data,this.fieldMask,e,this.fieldTransforms):new Bn(t,this.data,e,this.fieldTransforms)}}class gd{constructor(t,e,n){this.data=t,this.fieldMask=e,this.fieldTransforms=n}toMutation(t,e){return new re(t,this.data,this.fieldMask,e,this.fieldTransforms)}}function pd(r){switch(r){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw O(40011,{dataSource:r})}}class va{constructor(t,e,n,s,i,a){this.settings=t,this.databaseId=e,this.serializer=n,this.ignoreUndefinedProperties=s,i===void 0&&this.Ac(),this.fieldTransforms=i||[],this.fieldMask=a||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}i(t){return new va({...this.settings,...t},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}dc(t){var s;const e=(s=this.path)==null?void 0:s.child(t),n=this.i({path:e,arrayElement:!1});return n.mc(t),n}fc(t){var s;const e=(s=this.path)==null?void 0:s.child(t),n=this.i({path:e,arrayElement:!1});return n.Ac(),n}gc(t){return this.i({path:void 0,arrayElement:!0})}yc(t){return Zs(t,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(t){return this.fieldMask.find((e=>t.isPrefixOf(e)))!==void 0||this.fieldTransforms.find((e=>t.isPrefixOf(e.field)))!==void 0}Ac(){if(this.path)for(let t=0;t<this.path.length;t++)this.mc(this.path.get(t))}mc(t){if(t.length===0)throw this.yc("Document fields must not be empty");if(pd(this.dataSource)&&jp.test(t))throw this.yc('Document fields cannot begin and end with "__"')}}class Gp{constructor(t,e,n){this.databaseId=t,this.ignoreUndefinedProperties=e,this.serializer=n||mi(t)}A(t,e,n,s=!1){return new va({dataSource:t,methodName:e,targetDoc:n,path:at.emptyPath(),arrayElement:!1,hasConverter:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function $n(r){const t=r._freezeSettings(),e=mi(r._databaseId);return new Gp(r._databaseId,!!t.ignoreUndefinedProperties,e)}function Ii(r,t,e,n,s,i={}){const a=r.A(i.merge||i.mergeFields?2:0,t,e,s);Sa("Data must be an object, but it was:",a,n);const u=_d(n,a);let l,d;if(i.merge)l=new Dt(a.fieldMask),d=a.fieldTransforms;else if(i.mergeFields){const f=[];for(const g of i.mergeFields){const T=Ze(t,g,e);if(!a.contains(T))throw new C(S.INVALID_ARGUMENT,`Field '${T}' is specified in your field mask but missing from your input data.`);Td(f,T)||f.push(T)}l=new Dt(f),d=a.fieldTransforms.filter((g=>l.covers(g.field)))}else l=null,d=a.fieldTransforms;return new zp(new Tt(u),l,d)}class Ti extends yi{_toFieldTransform(t){if(t.dataSource!==2)throw t.dataSource===1?t.yc(`${this._methodName}() can only appear at the top level of your update data`):t.yc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return t.fieldMask.push(t.path),null}isEqual(t){return t instanceof Ti}}class Aa extends yi{_toFieldTransform(t){return new uh(t.path,new Cn)}isEqual(t){return t instanceof Aa}}function Ra(r,t,e,n){const s=r.A(1,t,e);Sa("Data must be an object, but it was:",s,n);const i=[],a=Tt.empty();Se(n,((l,d)=>{const f=Id(t,l,e);d=Ft(d);const g=s.fc(f);if(d instanceof Ti)i.push(f);else{const T=Zr(d,g);T!=null&&(i.push(f),a.set(f,T))}}));const u=new Dt(i);return new gd(a,u,s.fieldTransforms)}function Va(r,t,e,n,s,i){const a=r.A(1,t,e),u=[Ze(t,n,e)],l=[s];if(i.length%2!=0)throw new C(S.INVALID_ARGUMENT,`Function ${t}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let T=0;T<i.length;T+=2)u.push(Ze(t,i[T])),l.push(i[T+1]);const d=[],f=Tt.empty();for(let T=u.length-1;T>=0;--T)if(!Td(d,u[T])){const P=u[T];let x=l[T];x=Ft(x);const k=a.fc(P);if(x instanceof Ti)d.push(P);else{const M=Zr(x,k);M!=null&&(d.push(P),f.set(P,M))}}const g=new Dt(d);return new gd(f,g,a.fieldTransforms)}function Kp(r,t,e,n=!1){return Zr(e,r.A(n?4:3,t))}function Zr(r,t){if(yd(r=Ft(r)))return Sa("Unsupported field value:",t,r),_d(r,t);if(r instanceof yi)return(function(n,s){if(!pd(s.dataSource))throw s.yc(`${n._methodName}() can only be used with update() and set()`);if(!s.path)throw s.yc(`${n._methodName}() is not currently supported inside arrays`);const i=n._toFieldTransform(s);i&&s.fieldTransforms.push(i)})(r,t),null;if(r===void 0&&t.ignoreUndefinedProperties)return null;if(t.path&&t.fieldMask.push(t.path),r instanceof Array){if(t.settings.arrayElement&&t.dataSource!==4)throw t.yc("Nested arrays are not supported");return(function(n,s){const i=[];let a=0;for(const u of n){let l=Zr(u,s.gc(a));l==null&&(l={nullValue:"NULL_VALUE"}),i.push(l),a++}return{arrayValue:{values:i}}})(r,t)}return(function(n,s){if((n=Ft(n))===null)return{nullValue:"NULL_VALUE"};if(typeof n=="number")return Rm(s.serializer,n);if(typeof n=="boolean")return{booleanValue:n};if(typeof n=="string")return{stringValue:n};if(n instanceof Date){const i=Y.fromDate(n);return{timestampValue:Nn(s.serializer,i)}}if(n instanceof Y){const i=new Y(n.seconds,1e3*Math.floor(n.nanoseconds/1e3));return{timestampValue:Nn(s.serializer,i)}}if(n instanceof Ht)return{geoPointValue:{latitude:n.latitude,longitude:n.longitude}};if(n instanceof kt)return{bytesValue:gh(s.serializer,n._byteString)};if(n instanceof ut){const i=s.databaseId,a=n.firestore._databaseId;if(!a.isEqual(i))throw s.yc(`Document reference is for database ${a.projectId}/${a.database} but should be for database ${i.projectId}/${i.database}`);return{referenceValue:Jo(n.firestore._databaseId||s.databaseId,n._key.path)}}if(n instanceof qt)return(function(a,u){const l=a instanceof qt?a.toArray():a;return{mapValue:{fields:{[Bo]:{stringValue:qo},[Vn]:{arrayValue:{values:l.map((f=>{if(typeof f!="number")throw u.yc("VectorValues must only contain numeric values.");return Go(u.serializer,f)}))}}}}}})(n,s);if(Vh(n))return n._toProto(s.serializer);throw s.yc(`Unsupported field value: ${ei(n)}`)})(r,t)}function _d(r,t){const e={};return xl(r)?t.path&&t.path.length>0&&t.fieldMask.push(t.path):Se(r,((n,s)=>{const i=Zr(s,t.dc(n));i!=null&&(e[n]=i)})),{mapValue:{fields:e}}}function yd(r){return!(typeof r!="object"||r===null||r instanceof Array||r instanceof Date||r instanceof Y||r instanceof Ht||r instanceof kt||r instanceof ut||r instanceof yi||r instanceof qt||Vh(r))}function Sa(r,t,e){if(!yd(e)||!gl(e)){const n=ei(e);throw n==="an object"?t.yc(r+" a custom object"):t.yc(r+" "+n)}}function Ze(r,t,e){if((t=Ft(t))instanceof Xr)return t._internalPath;if(typeof t=="string")return Id(r,t);throw Zs("Field path arguments must be of type string or ",r,!1,void 0,e)}const $p=new RegExp("[~\\*/\\[\\]]");function Id(r,t,e){if(t.search($p)>=0)throw Zs(`Invalid field path (${t}). Paths must not contain '~', '*', '/', '[', or ']'`,r,!1,void 0,e);try{return new Xr(...t.split("."))._internalPath}catch{throw Zs(`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,r,!1,void 0,e)}}function Zs(r,t,e,n,s){const i=n&&!n.isEmpty(),a=s!==void 0;let u=`Function ${t}() called with invalid data`;e&&(u+=" (via `toFirestore()`)"),u+=". ";let l="";return(i||a)&&(l+=" (found",i&&(l+=` in field ${n}`),a&&(l+=` in document ${s}`),l+=")"),new C(S.INVALID_ARGUMENT,u+r+l)}function Td(r,t){return r.some((e=>e.isEqual(t)))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ed{convertValue(t,e="none"){switch(Ee(t)){case 0:return null;case 1:return t.booleanValue;case 2:return st(t.integerValue||t.doubleValue);case 3:return this.convertTimestamp(t.timestampValue);case 4:return this.convertServerTimestamp(t,e);case 5:return t.stringValue;case 6:return this.convertBytes(ee(t.bytesValue));case 7:return this.convertReference(t.referenceValue);case 8:return this.convertGeoPoint(t.geoPointValue);case 9:return this.convertArray(t.arrayValue,e);case 11:return this.convertObject(t.mapValue,e);case 10:return this.convertVectorValue(t.mapValue);default:throw O(62114,{value:t})}}convertObject(t,e){return this.convertObjectMap(t.fields,e)}convertObjectMap(t,e="none"){const n={};return Se(t,((s,i)=>{n[s]=this.convertValue(i,e)})),n}convertVectorValue(t){var n,s,i;const e=(i=(s=(n=t.fields)==null?void 0:n[Vn].arrayValue)==null?void 0:s.values)==null?void 0:i.map((a=>st(a.doubleValue)));return new qt(e)}convertGeoPoint(t){return new Ht(st(t.latitude),st(t.longitude))}convertArray(t,e){return(t.values||[]).map((n=>this.convertValue(n,e)))}convertServerTimestamp(t,e){switch(e){case"previous":const n=oi(t);return n==null?null:this.convertValue(n,e);case"estimate":return this.convertTimestamp(Nr(t));default:return null}}convertTimestamp(t){const e=te(t);return new Y(e.seconds,e.nanos)}convertDocumentKey(t,e){const n=H.fromString(t);L(Rh(n),9688,{name:t});const s=new Qe(n.get(1),n.get(3)),i=new N(n.popFirst(5));return s.isEqual(e)||lt(`Document ${i} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${e.projectId}/${e.database}) instead.`),i}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ei extends Ed{constructor(t){super(),this.firestore=t}convertBytes(t){return new kt(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new ut(this.firestore,null,e)}}function h_(){return new Aa("serverTimestamp")}const Xc="@firebase/firestore",Zc="4.13.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function tl(r){return(function(e,n){if(typeof e!="object"||e===null)return!1;const s=e;for(const i of n)if(i in s&&typeof s[i]=="function")return!0;return!1})(r,["next","error","complete"])}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ti{constructor(t,e,n,s,i){this._firestore=t,this._userDataWriter=e,this._key=n,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new ut(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const t=new Qp(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(t)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var t;return((t=this._document)==null?void 0:t.data.clone().value.mapValue.fields)??void 0}get(t){if(this._document){const e=this._document.data.field(Ze("DocumentSnapshot.get",t));if(e!==null)return this._userDataWriter.convertValue(e)}}}class Qp extends ti{data(){return super.data()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wd(r){if(r.limitType==="L"&&r.explicitOrderBy.length===0)throw new C(S.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class Pa{}class ba extends Pa{}function d_(r,t,...e){let n=[];t instanceof Pa&&n.push(t),n=n.concat(e),(function(i){const a=i.filter((l=>l instanceof Ca)).length,u=i.filter((l=>l instanceof wi)).length;if(a>1||a>0&&u>0)throw new C(S.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")})(n);for(const s of n)r=s._apply(r);return r}class wi extends ba{constructor(t,e,n){super(),this._field=t,this._op=e,this._value=n,this.type="where"}static _create(t,e,n){return new wi(t,e,n)}_apply(t){const e=this._parse(t);return vd(t._query,e),new se(t.firestore,t.converter,_o(t._query,e))}_parse(t){const e=$n(t.firestore);return(function(i,a,u,l,d,f,g){let T;if(d.isKeyField()){if(f==="array-contains"||f==="array-contains-any")throw new C(S.INVALID_ARGUMENT,`Invalid Query. You can't perform '${f}' queries on documentId().`);if(f==="in"||f==="not-in"){nl(g,f);const x=[];for(const k of g)x.push(el(l,i,k));T={arrayValue:{values:x}}}else T=el(l,i,g)}else f!=="in"&&f!=="not-in"&&f!=="array-contains-any"||nl(g,f),T=Kp(u,a,g,f==="in"||f==="not-in");return K.create(d,f,T)})(t._query,"where",e,t.firestore._databaseId,this._field,this._op,this._value)}}function f_(r,t,e){const n=t,s=Ze("where",r);return wi._create(s,n,e)}class Ca extends Pa{constructor(t,e){super(),this.type=t,this._queryConstraints=e}static _create(t,e){return new Ca(t,e)}_parse(t){const e=this._queryConstraints.map((n=>n._parse(t))).filter((n=>n.getFilters().length>0));return e.length===1?e[0]:X.create(e,this._getOperator())}_apply(t){const e=this._parse(t);return e.getFilters().length===0?t:((function(s,i){let a=s;const u=i.getFlattenedFilters();for(const l of u)vd(a,l),a=_o(a,l)})(t._query,e),new se(t.firestore,t.converter,_o(t._query,e)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class Da extends ba{constructor(t,e){super(),this._field=t,this._direction=e,this.type="orderBy"}static _create(t,e){return new Da(t,e)}_apply(t){const e=(function(s,i,a){if(s.startAt!==null)throw new C(S.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new C(S.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new Fr(i,a)})(t._query,this._field,this._direction);return new se(t.firestore,t.converter,Im(t._query,e))}}function m_(r,t="asc"){const e=t,n=Ze("orderBy",r);return Da._create(n,e)}class xa extends ba{constructor(t,e,n){super(),this.type=t,this._limit=e,this._limitType=n}static _create(t,e,n){return new xa(t,e,n)}_apply(t){return new se(t.firestore,t.converter,zs(t._query,this._limit,this._limitType))}}function g_(r){return Sf("limit",r),xa._create("limit",r,"F")}function el(r,t,e){if(typeof(e=Ft(e))=="string"){if(e==="")throw new C(S.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!Jl(t)&&e.indexOf("/")!==-1)throw new C(S.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${e}' contains a '/' character.`);const n=t.path.child(H.fromString(e));if(!N.isDocumentKey(n))throw new C(S.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${n}' is not because it has an odd number of segments (${n.length}).`);return Mr(r,new N(n))}if(e instanceof ut)return Mr(r,e._key);throw new C(S.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${ei(e)}.`)}function nl(r,t){if(!Array.isArray(r)||r.length===0)throw new C(S.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${t.toString()}' filters.`)}function vd(r,t){const e=(function(s,i){for(const a of s)for(const u of a.getFlattenedFilters())if(i.indexOf(u.op)>=0)return u.op;return null})(r.filters,(function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}})(t.op));if(e!==null)throw e===t.op?new C(S.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${t.op.toString()}' filter.`):new C(S.INVALID_ARGUMENT,`Invalid query. You cannot use '${t.op.toString()}' filters with '${e.toString()}' filters.`)}function vi(r,t,e){let n;return n=r?e&&(e.merge||e.mergeFields)?r.toFirestore(t,e):r.toFirestore(t):t,n}class Wp extends Ed{constructor(t){super(),this.firestore=t}convertBytes(t){return new kt(t)}convertReference(t){const e=this.convertDocumentKey(t,this.firestore._databaseId);return new ut(this.firestore,null,e)}}class Hp{constructor(t){let e;this.kind="persistent",t!=null&&t.tabManager?(t.tabManager._initialize(t),e=t.tabManager):(e=Xp(void 0),e._initialize(t)),this._onlineComponentProvider=e._onlineComponentProvider,this._offlineComponentProvider=e._offlineComponentProvider}toJSON(){return{kind:this.kind}}}function p_(r){return new Hp(r)}class Jp{constructor(t){this.forceOwnership=t,this.kind="persistentSingleTab"}toJSON(){return{kind:this.kind}}_initialize(t){this._onlineComponentProvider=jr.provider,this._offlineComponentProvider={build:e=>new fd(e,t==null?void 0:t.cacheSizeBytes,this.forceOwnership)}}}class Yp{constructor(){this.kind="PersistentMultipleTab"}toJSON(){return{kind:this.kind}}_initialize(t){this._onlineComponentProvider=jr.provider,this._offlineComponentProvider={build:e=>new Rp(e,t==null?void 0:t.cacheSizeBytes)}}}function Xp(r){return new Jp(r==null?void 0:r.forceOwnership)}function __(){return new Yp}class pn{constructor(t,e){this.hasPendingWrites=t,this.fromCache=e}isEqual(t){return this.hasPendingWrites===t.hasPendingWrites&&this.fromCache===t.fromCache}}class Te extends ti{constructor(t,e,n,s,i,a){super(t,e,n,s,a),this._firestore=t,this._firestoreImpl=t,this.metadata=i}exists(){return super.exists()}data(t={}){if(this._document){if(this._converter){const e=new ks(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(e,t)}return this._userDataWriter.convertValue(this._document.data.value,t.serverTimestamps)}}get(t,e={}){if(this._document){const n=this._document.data.field(Ze("DocumentSnapshot.get",t));if(n!==null)return this._userDataWriter.convertValue(n,e.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new C(S.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t=this._document,e={};return e.type=Te._jsonSchemaVersion,e.bundle="",e.bundleSource="DocumentSnapshot",e.bundleName=this._key.toString(),!t||!t.isValidDocument()||!t.isFoundDocument()?e:(this._userDataWriter.convertObjectMap(t.data.value.mapValue.fields,"previous"),e.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),e)}}Te._jsonSchemaVersion="firestore/documentSnapshot/1.0",Te._jsonSchema={type:ft("string",Te._jsonSchemaVersion),bundleSource:ft("string","DocumentSnapshot"),bundleName:ft("string"),bundle:ft("string")};class ks extends Te{data(t={}){return super.data(t)}}class Ke{constructor(t,e,n,s){this._firestore=t,this._userDataWriter=e,this._snapshot=s,this.metadata=new pn(s.hasPendingWrites,s.fromCache),this.query=n}get docs(){const t=[];return this.forEach((e=>t.push(e))),t}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(t,e){this._snapshot.docs.forEach((n=>{t.call(e,new ks(this._firestore,this._userDataWriter,n.key,n,new pn(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(t={}){const e=!!t.includeMetadataChanges;if(e&&this._snapshot.excludesMetadataChanges)throw new C(S.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===e||(this._cachedChanges=(function(s,i){if(s._snapshot.oldDocs.isEmpty()){let a=0;return s._snapshot.docChanges.map((u=>{const l=new ks(s._firestore,s._userDataWriter,u.doc.key,u.doc,new pn(s._snapshot.mutatedKeys.has(u.doc.key),s._snapshot.fromCache),s.query.converter);return u.doc,{type:"added",doc:l,oldIndex:-1,newIndex:a++}}))}{let a=s._snapshot.oldDocs;return s._snapshot.docChanges.filter((u=>i||u.type!==3)).map((u=>{const l=new ks(s._firestore,s._userDataWriter,u.doc.key,u.doc,new pn(s._snapshot.mutatedKeys.has(u.doc.key),s._snapshot.fromCache),s.query.converter);let d=-1,f=-1;return u.type!==0&&(d=a.indexOf(u.doc.key),a=a.delete(u.doc.key)),u.type!==1&&(a=a.add(u.doc),f=a.indexOf(u.doc.key)),{type:Zp(u.type),doc:l,oldIndex:d,newIndex:f}}))}})(this,e),this._cachedChangesIncludeMetadataChanges=e),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new C(S.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const t={};t.type=Ke._jsonSchemaVersion,t.bundleSource="QuerySnapshot",t.bundleName=xo.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const e=[],n=[],s=[];return this.docs.forEach((i=>{i._document!==null&&(e.push(i._document),n.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),s.push(i.ref.path))})),t.bundle=(this._firestore,this.query._query,t.bundleName,"NOT SUPPORTED"),t}}function Zp(r){switch(r){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return O(61501,{type:r})}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Ke._jsonSchemaVersion="firestore/querySnapshot/1.0",Ke._jsonSchema={type:ft("string",Ke._jsonSchemaVersion),bundleSource:ft("string","QuerySnapshot"),bundleName:ft("string"),bundle:ft("string")};const t_={maxAttempts:5};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class e_{constructor(t,e){this._firestore=t,this._commitHandler=e,this._mutations=[],this._committed=!1,this._dataReader=$n(t)}set(t,e,n){this._verifyNotCommitted();const s=pe(t,this._firestore),i=vi(s.converter,e,n),a=Ii(this._dataReader,"WriteBatch.set",s._key,i,s.converter!==null,n);return this._mutations.push(a.toMutation(s._key,ot.none())),this}update(t,e,n,...s){this._verifyNotCommitted();const i=pe(t,this._firestore);let a;return a=typeof(e=Ft(e))=="string"||e instanceof Xr?Va(this._dataReader,"WriteBatch.update",i._key,e,n,s):Ra(this._dataReader,"WriteBatch.update",i._key,e),this._mutations.push(a.toMutation(i._key,ot.exists(!0))),this}delete(t){this._verifyNotCommitted();const e=pe(t,this._firestore);return this._mutations=this._mutations.concat(new qn(e._key,ot.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new C(S.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function pe(r,t){if((r=Ft(r)).firestore!==t)throw new C(S.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class n_{constructor(t,e){this._firestore=t,this._transaction=e,this._dataReader=$n(t)}get(t){const e=pe(t,this._firestore),n=new Wp(this._firestore);return this._transaction.lookup([e._key]).then((s=>{if(!s||s.length!==1)return O(24041);const i=s[0];if(i.isFoundDocument())return new ti(this._firestore,n,i.key,i,e.converter);if(i.isNoDocument())return new ti(this._firestore,n,e._key,null,e.converter);throw O(18433,{doc:i})}))}set(t,e,n){const s=pe(t,this._firestore),i=vi(s.converter,e,n),a=Ii(this._dataReader,"Transaction.set",s._key,i,s.converter!==null,n);return this._transaction.set(s._key,a),this}update(t,e,n,...s){const i=pe(t,this._firestore);let a;return a=typeof(e=Ft(e))=="string"||e instanceof Xr?Va(this._dataReader,"Transaction.update",i._key,e,n,s):Ra(this._dataReader,"Transaction.update",i._key,e),this._transaction.update(i._key,a),this}delete(t){const e=pe(t,this._firestore);return this._transaction.delete(e._key),this}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class r_ extends n_{constructor(t,e){super(t,e),this._firestore=t}get(t){const e=pe(t,this._firestore),n=new Ei(this._firestore);return super.get(t).then((s=>new Te(this._firestore,n,e._key,s._document,new pn(!1,!1),e.converter)))}}function y_(r,t,e){r=Pt(r,jt);const n={...t_,...e};(function(a){if(a.maxAttempts<1)throw new C(S.INVALID_ARGUMENT,"Max attempts must be at least 1")})(n);const s=Kn(r);return Op(s,(i=>t(new r_(r,i))),n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function I_(r){r=Pt(r,ut);const t=Pt(r.firestore,jt),e=Kn(t);return Np(e,r._key).then((n=>Ad(t,r,n)))}function T_(r){r=Pt(r,se);const t=Pt(r.firestore,jt),e=Kn(t),n=new Ei(t);return wd(r._query),kp(e,r._query).then((s=>new Ke(t,n,r,s)))}function E_(r,t,e){r=Pt(r,ut);const n=Pt(r.firestore,jt),s=vi(r.converter,t,e),i=$n(n);return ts(n,[Ii(i,"setDoc",r._key,s,r.converter!==null,e).toMutation(r._key,ot.none())])}function w_(r,t,e,...n){r=Pt(r,ut);const s=Pt(r.firestore,jt),i=$n(s);let a;return a=typeof(t=Ft(t))=="string"||t instanceof Xr?Va(i,"updateDoc",r._key,t,e,n):Ra(i,"updateDoc",r._key,t),ts(s,[a.toMutation(r._key,ot.exists(!0))])}function v_(r){return ts(Pt(r.firestore,jt),[new qn(r._key,ot.none())])}function A_(r,t){const e=Pt(r.firestore,jt),n=Bp(r),s=vi(r.converter,t),i=$n(r.firestore);return ts(e,[Ii(i,"addDoc",n._key,s,r.converter!==null,{}).toMutation(n._key,ot.exists(!1))]).then((()=>n))}function R_(r,...t){var d,f,g;r=Ft(r);let e={includeMetadataChanges:!1,source:"default"},n=0;typeof t[n]!="object"||tl(t[n])||(e=t[n++]);const s={includeMetadataChanges:e.includeMetadataChanges,source:e.source};if(tl(t[n])){const T=t[n];t[n]=(d=T.next)==null?void 0:d.bind(T),t[n+1]=(f=T.error)==null?void 0:f.bind(T),t[n+2]=(g=T.complete)==null?void 0:g.bind(T)}let i,a,u;if(r instanceof ut)a=Pt(r.firestore,jt),u=Qr(r._key.path),i={next:T=>{t[n]&&t[n](Ad(a,r,T))},error:t[n+1],complete:t[n+2]};else{const T=Pt(r,se);a=Pt(T.firestore,jt),u=T._query;const P=new Ei(a);i={next:x=>{t[n]&&t[n](new Ke(a,P,T,x))},error:t[n+1],complete:t[n+2]},wd(r._query)}const l=Kn(a);return xp(l,u,s,i)}function ts(r,t){const e=Kn(r);return Mp(e,t)}function Ad(r,t,e){const n=e.docs.get(t._key),s=new Ei(r);return new Te(r,s,t._key,n,new pn(e.hasPendingWrites,e.fromCache),t.converter)}function V_(r){return r=Pt(r,jt),Kn(r),new e_(r,(t=>ts(r,t)))}(function(t,e=!0){gf(mf),df(new ff("firestore",((n,{instanceIdentifier:s,options:i})=>{const a=n.getProvider("app").getImmediate(),u=new jt(new yf(n.getProvider("auth-internal")),new Ef(a,n.getProvider("app-check-internal")),om(a,s),a);return i={useFetchStreams:e,...i},u._setSettings(i),u}),"PUBLIC").setMultipleInstances(!0)),ro(Xc,Zc,t),ro(Xc,Zc,"esm2020")})();var s_="firebase",i_="12.11.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ro(s_,i_,"app");export{Ed as AbstractUserDataWriter,kt as Bytes,Ie as CollectionReference,ut as DocumentReference,Te as DocumentSnapshot,Xr as FieldPath,yi as FieldValue,jt as Firestore,C as FirestoreError,Ht as GeoPoint,se as Query,Ca as QueryCompositeFilterConstraint,ba as QueryConstraint,ks as QueryDocumentSnapshot,wi as QueryFieldFilterConstraint,xa as QueryLimitConstraint,Da as QueryOrderByConstraint,Ke as QuerySnapshot,pn as SnapshotMetadata,Y as Timestamp,r_ as Transaction,qt as VectorValue,e_ as WriteBatch,xo as _AutoId,ht as _ByteString,Qe as _DatabaseId,N as _DocumentKey,_f as _EmptyAuthCredentialsProvider,at as _FieldPath,Pt as _cast,In as _logWarn,Vf as _validateIsNotUsedTogether,A_ as addDoc,c_ as collection,v_ as deleteDoc,Bp as doc,Kn as ensureFirestoreConfigured,ts as executeWrite,I_ as getDoc,T_ as getDocs,l_ as initializeFirestore,g_ as limit,R_ as onSnapshot,m_ as orderBy,p_ as persistentLocalCache,__ as persistentMultipleTabManager,Xp as persistentSingleTabManager,d_ as query,y_ as runTransaction,h_ as serverTimestamp,E_ as setDoc,w_ as updateDoc,f_ as where,V_ as writeBatch};
