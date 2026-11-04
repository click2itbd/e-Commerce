import dns from 'node:dns';
import { Agent, setGlobalDispatcher } from 'undici';
// On production (cPanel Linux) servers, firewall blocks UDP port 53 to 8.8.8.8,
// so the OS resolver (/etc/resolv.conf) MUST be used to prevent 2-minute timeouts.
const isProductionOrLinux = process.env.NODE_ENV === 'production' || process.platform === 'linux';
let agent;
if (!isProductionOrLinux) {
    const resolver = new dns.promises.Resolver();
    try {
        resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    }
    catch (e) {
        console.warn('[NetworkDNS] Failed to set custom DNS servers:', e);
    }
    agent = new Agent({
        connect: {
            lookup: (hostname, options, callback) => {
                if (typeof options === 'function') {
                    callback = options;
                    options = {};
                }
                resolver.resolve4(hostname).then((addresses) => {
                    if (addresses && addresses.length > 0) {
                        if (options && options.all) {
                            callback(null, addresses.map(a => ({ address: a, family: 4 })));
                        }
                        else {
                            callback(null, addresses[0], 4);
                        }
                    }
                    else {
                        dns.lookup(hostname, options, callback);
                    }
                }, () => {
                    dns.lookup(hostname, options, callback);
                });
            },
            timeout: 10000,
        },
        headersTimeout: 10000,
        bodyTimeout: 10000,
    });
    setGlobalDispatcher(agent);
    console.log('[NetworkDNS] Resilient local DNS resolver initialized with 8.8.8.8 and 1.1.1.1');
}
else {
    agent = new Agent({
        connect: {
            timeout: 10000,
        },
        headersTimeout: 10000,
        bodyTimeout: 10000,
    });
    setGlobalDispatcher(agent);
    console.log('[NetworkDNS] Production environment: Using native host OS DNS resolution.');
}
export const resilientAgent = agent;
