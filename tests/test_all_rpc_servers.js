const { makeRPCCall } = require('../utils/rpc-helper');
const net = require('net');
const dns = require('dns').promises;

// Netstat output - parse destination addresses
const NETSTAT_OUTPUT = `
tcp        0      0 92.113.148.61:ssh       sl0.synclair.co:50012   ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ns106224.ip-147-1:39726 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.109.247.55:54962 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-54-188-171-19:59387 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2a01:4f8:221:20eb:40834 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.5.66.109.6:42348 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.255.124.47:60498 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      adsl.94-252-97-14:58268 ESTABLISHED
tcp6       0    288 92.113.148.61:7075      ec2-18-176-245-12:18990 ESTABLISHED
tcp6       0    144 92.113.148.61:46652     ec2-13-213-34-10.a:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-35-73-233-71.:34537 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      mail.nifni.eu:49742     ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2601:152:200:484e:41666 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      161.35.12.91:36978      ESTABLISHED
tcp6       0      0 92.113.148.61:7075      pool-96-236-136-9:33942 ESTABLISHED
tcp6       0      0 92.113.148.61:37412     ec2-35-77-33-134.:31100 ESTABLISHED
tcp6       0    288 92.113.148.61:7075      43.133.207.122:55866    ESTABLISHED
tcp6       0    288 92.113.148.61:47178     ec2-54-199-79-114:31100 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.106.91.108:42094 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      noli-me-tangere-2:41422 ESTABLISHED
tcp6       0     72 92.113.148.61:7075      vmi1203053.contab:37940 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2001-1c06-2584-db:50488 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      eu.cloud.sellix.i:35411 ESTABLISHED
tcp6       0    307 92.113.148.61:7075      ip70-170-72-35.lv:55977 ESTABLISHED
tcp6       0     72 92.113.148.61:7075      38-41-222-64.dyn.:43374 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2a01:4f8:1c1b:a4b:33034 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.45.87.63.1:37882 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2a01:7e00::f03c:9:35066 ESTABLISHED
tcp6       0     72 92.113.148.61:7075      ec2-54-188-171-197:3666 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      143.198.101.143:34872   ESTABLISHED
tcp6       0     72 92.113.148.61:7075      static.89.194.108:46578 ESTABLISHED
tcp6       0      0 92.113.148.61:47440     51-15-19-228.rev.p:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:41622     ip91.ip-37-187-212:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.150.111.21:56462 ESTABLISHED
tcp6       0      0 92.113.148.61:38624     static.213.104.78.:7075 ESTABLISHED
tcp6       0     72 92.113.148.61:7075      li2059-63.members:44816 ESTABLISHED
tcp6       0      0 92.113.148.61:33146     ec2-35-159-44-159.:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-54-229-85-145:48349 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.114.52.202:35600 ESTABLISHED
tcp6       0      0 92.113.148.61:37458     mail.nanswap.com:7075   ESTABLISHED
tcp6       0      0 92.113.148.61:7075      c-67-169-22-56.hs:43176 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      212.192.49.94:42778     ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.109.247.55:51020 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      78.129.253.179:48642    ESTABLISHED
tcp6       0      0 92.113.148.61:7075      104.130.246.207:28176   ESTABLISHED
tcp6       0      0 92.113.148.61:7075      vmi1457152.contab:34814 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.41.103.55.:45272 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      8.210.142.47:50586      ESTABLISHED
tcp6       0      0 92.113.148.61:7075      nano.strnmn.me:35888    ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.219.165.11:36382 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      72.red-81-38-97.d:47810 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.224.130.20:59818 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.5.66.109.6:34302 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      8.212.101.240:3129      ESTABLISHED
tcp6       0      0 92.113.148.61:7075      72.red-81-38-97.d:44444 TIME_WAIT  
tcp6       0      0 92.113.148.61:7075      161.132.92.119:45402    ESTABLISHED
tcp6       0      0 92.113.148.61:7075      177-130-251-46.un:46972 ESTABLISHED
tcp6       0      0 92.113.148.61:46400     ec2-52-220-87-186.:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      177-66-167-199.al:50120 ESTABLISHED
tcp6       0      0 92.113.148.61:42264     45.76.114.63.vultr:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ip-93-115-28-179.:44474 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-43-207-15-11.:48945 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ns31625290.ip-146:58718 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      43.130.233.34:60084     ESTABLISHED
tcp6       0    235 92.113.148.61:7075      ec2-34-195-53-91.:62321 ESTABLISHED
tcp6       0      1 92.113.148.61:36136     static.255.124.47:39794 SYN_SENT   
tcp6       0      0 92.113.148.61:7075      eu.cloud.sellix.i:13988 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.5.66.109.6:48880 ESTABLISHED
tcp6       0      0 92.113.148.61:53076     static.95.90.109.6:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.187.58.108:38752 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      84-25-196-136.cab:50501 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      176.143-17-0.abo.:56836 ESTABLISHED
tcp6       0      0 92.113.148.61:33484     v22019111078401020:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      vmi2606112.contab:34554 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      77.33.35.26.dhcp.:40000 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-54-148-216-18:33448 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      vmi245851.contabo:37572 ESTABLISHED
tcp6       0    235 92.113.148.61:7075      47.242.24.34:43060      ESTABLISHED
tcp6       0      0 92.113.148.61:46464     li1306-119.members:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:44416     ec2-54-248-133-60:31100 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      vmi293133.contabo:36008 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.153.49.108:34622 ESTABLISHED
tcp6       0      0 92.113.148.61:38890     ns107247.ip-51-81-:7075 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2a01:4f8:272:5456:40360 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ip-93-115-28-180.:47836 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ns3006692.ip-149-:39784 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-3-112-16-241.:58018 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      138.68.165.210:36162    ESTABLISHED
tcp6       0      0 92.113.148.61:7075      nano-node.madora.:60522 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ip-188-214-129-10:53054 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.223.133.90:38860 ESTABLISHED
tcp6       0      0 92.113.148.61:39222     ec2-13-213-221-153:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      webemail.quikbook:36646 ESTABLISHED
tcp6       0      0 92.113.148.61:45898     static.61.178.161.:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      67.213.122.233:44516    ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.35.132.181:53414 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-18-183-46-143:38832 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ns5006902.ip-51-2:45840 ESTABLISHED
tcp6       0      0 92.113.148.61:50998     ec2-13-250-24-161.:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      s19564118150.fast:47134 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      143.198.59.250:56724    ESTABLISHED
tcp6       0    549 92.113.148.61:7075      ec2-18-180-93-129:43252 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-54-247-115-16:51613 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2a06:61c1:63db:0::33582 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      188-24-127-170.rd:47524 ESTABLISHED
tcp6       0      0 92.113.148.61:54648     50.21.179.40:7075       ESTABLISHED
tcp6       0      0 92.113.148.61:7075      pool-173-63-37-24:52124 ESTABLISHED
tcp6       0      0 92.113.148.61:33988     ec2-18-101-47-105.:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      104.131.169.14:35672    ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.244.83.217:58082 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      delta.pulsarimpul:33038 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2a01:4f9:c010:cac:41088 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      kedrin.top:44692        ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.141.104.21:54926 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      vmi2331518.contab:41792 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      167.71.253.95:36720     ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.224.114.21:60880 ESTABLISHED
tcp6       0      0 92.113.148.61:42516     vsrv.my1.dev:7075       ESTABLISHED
tcp6       0      0 92.113.148.61:7075      203.249.182.130:33364   ESTABLISHED
tcp6       0      0 92.113.148.61:7075      89-80-239-193.abo:58814 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      v2202510868533942:59040 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.90.100.181:46562 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-52-4-132-28.c:16000 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      93-161-53-161-sta:61665 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2a01:cb19:8ddf:4d:48406 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.161.238.13:33272 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      vmi2162079.contab:40526 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      v2202103144270147:43346 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      185.123.53.88:57434     ESTABLISHED
tcp6       0      0 92.113.148.61:7075      1567156-static.en:46684 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      vmi1714549.contab:43830 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      v2202105107840154:48370 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      217.160.65.156:48874    ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2a01:4f8:272:5456:54848 ESTABLISHED
tcp6       0      0 92.113.148.61:33318     184-89-137-45.conn:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      99-54-16-68.light:60406 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e::43214 2600:3c02::f03c:92:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.167.145.9.:42950 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-3-112-138-57.:12911 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      47.239.53.112:41804     ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-3-112-138-57.:10710 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      lfbn-tou-1-456-92:38416 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      43.167.159.234:36060    ESTABLISHED
tcp6       0  64081 92.113.148.61:7075      50.37.253.81:3366       ESTABLISHED
tcp6       0      0 92.113.148.61:60266     ec2-54-77-3-59.eu-:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      8.212.101.240:42757     ESTABLISHED
tcp6       0      0 92.113.148.61:7075      webemail.quikbook:57864 ESTABLISHED
tcp6       0    235 92.113.148.61:7075      ec2-13-230-201-12:35944 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-52-30-132-101:54639 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      li1882-96.members:39992 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      94-237-111-22.nl-:56570 ESTABLISHED
tcp6       0      1 92.113.148.61:38244     50.37.253.81:46518      SYN_SENT   
tcp6       0      0 92.113.148.61:7075      ip-193-228-225-50:55450 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.108.195.21:49288 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-3-112-138-57.a:6731 ESTABLISHED
tcp6       0      0 92.113.148.61:42910     ec2-52-53-43-163.u:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.153.110.24:54584 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      mxe4.elisse.it:54358    ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2a03:4000:51:b13::33598 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2a01:4f8:13b:119e:37996 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2001:1c06:2584-db:50488 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-54-216-66-11.:32737 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2a01:4f9:3051:44a:45278 ESTABLISHED
tcp6       0      0 92.113.148.61:50806     thenanonode:7075        ESTABLISHED
tcp6       0      0 92.113.148.61:38438     vmi2635844.contabo:7075 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2a03:4000:5f:e15::58678 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.90.54.109.:37708 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      164.182.88.116.st:40092 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      88-202-151-14.cus:36888 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      li1362-142.member:59950 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      c-71-206-44-246.h:37630 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      203.249.182.130:38274   TIME_WAIT  
tcp6       0      0 92.113.148.61:7075      ns3019674.ip-149-:46640 ESTABLISHED
tcp6       0    470 92.113.148.61:7075      8.218.64.68:47382       ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-54-248-13-68.:17203 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.161.6.88.2:45430 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e::34918 2400:8902::f03c:92:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-35-161-85-155:55881 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.66.212.40.:45732 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.94.64.235.:33784 ESTABLISHED
tcp6       0    235 92.113.148.61:7075      ec2-13-230-16-114:53050 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ns3006544.ip-149-:55468 ESTABLISHED
tcp6       0    235 92.113.148.61:7075      83.171.250.39:35728     ESTABLISHED
tcp6       0      0 92.113.148.61:7075      96-2-249-51-dynam:40726 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e::52058 2a0f:f01:206:43e:::7075 TIME_WAIT  
tcp6       0      0 92.113.148.61:7075      syn-142-196-146-1:25578 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      static.109.193.99:33552 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      8.212.101.240:45228     ESTABLISHED
tcp6       0      0 92.113.148.61:7075      91-158-10-122.eli:35748 ESTABLISHED
tcp6       0     54 92.113.148.61:7075      150.5.142.242:60598     ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 vmi245851.contabo:51834 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e::43474 2a03:4000:f:79f:d8:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      165.140.202.208:55492   ESTABLISHED
tcp6       0      0 92.113.148.61:7075      136-51-21-140.goo:56030 ESTABLISHED
tcp6       0      0 2a0f:f01:206:43e:::7075 2a01:4f8:171:1117:36920 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      vmi1457165.contab:57678 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-18-176-159-241:6113 ESTABLISHED
tcp6       0      0 92.113.148.61:38846     ns3362683.ip-37-18:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:52902     static.189.85.78.5:7075 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      64.23.235.23:50742      ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ec2-3-112-138-57.:62638 ESTABLISHED
tcp6       0      0 92.113.148.61:45428     51.105.192.193:7075     ESTABLISHED
tcp6       0      0 92.113.148.61:7075      vmi293133.contabo:36016 TIME_WAIT  
tcp6       0      1 92.113.148.61:36224     78.129.253.179:54988    SYN_SENT   
tcp6       0      0 92.113.148.61:7075      cpe-144-137-220-7:39850 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      v2202111116757169:55338 ESTABLISHED
tcp6       0      0 92.113.148.61:7075      ip-109-106-1-122.:56462 ESTABLISHED
`;

// RPC port to test
const RPC_PORT = 45000;

/**
 * Parse netstat output and extract unique destination addresses
 */
function parseNetstatOutput(netstatOutput) {
    const destinations = new Set();
    const lines = netstatOutput.trim().split('\n');
    
    for (const line of lines) {
        // Skip empty lines and header
        if (!line.trim() || line.includes('Proto') || line.includes('Active')) {
            continue;
        }
        
        // Parse line: tcp6  0  0  local:port  foreign:port  STATE
        // Use regex to match the pattern: local_addr:port  foreign_addr:port
        const match = line.match(/\s+(\S+):(\d+)\s+(\S+):(\d+)\s+/);
        if (match) {
            const localAddr = match[1];
            const foreignAddr = match[3];
            const foreignPort = match[4];
            
            // Only include destinations (not our own IP)
            if (foreignAddr && 
                !foreignAddr.includes('92.113.148.61') && 
                !foreignAddr.includes('2a0f:f01:206:43e')) {
                
                // Clean up hostname (remove trailing dots, etc.)
                let cleanHost = foreignAddr.replace(/\.$/, '');
                
                // Skip IPv6 addresses (they contain colons and are hex)
                if (cleanHost.includes(':') && cleanHost.match(/^[0-9a-f:]+$/i)) {
                    continue;
                }
                
                // Check if it's an IP address
                if (/^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)) {
                    destinations.add(cleanHost);
                    continue;
                }
                
                // Skip if it's just a number or very short
                if (cleanHost.length < 3) {
                    continue;
                }
                
                // Skip incomplete hostnames that start with just numbers
                if (/^\d+$/.test(cleanHost.split('.')[0]) && !/^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)) {
                    continue;
                }
                
                // Add hostname (will try to resolve later)
                destinations.add(cleanHost);
            }
        }
    }
    
    return Array.from(destinations);
}

/**
 * Resolve hostname to IP address
 */
async function resolveHostname(hostname) {
    try {
        // Skip IPv6 addresses
        if (hostname.includes(':')) {
            return null;
        }
        
        // If it's already an IP address, return it
        if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
            return hostname;
        }
        
        // Try to resolve
        const addresses = await dns.resolve4(hostname);
        return addresses[0]; // Return first IPv4 address
    } catch (error) {
        // Try with common TLDs if it looks like a hostname without TLD
        if (!hostname.includes('.') && hostname.length > 3) {
            const commonTlds = ['.com', '.net', '.org', '.io', '.eu', '.me'];
            for (const tld of commonTlds) {
                try {
                    const addresses = await dns.resolve4(hostname + tld);
                    return addresses[0];
                } catch (e) {
                    // Continue to next TLD
                }
            }
        }
        return null;
    }
}

/**
 * Test TCP port connectivity
 */
async function testPortConnectivity(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const timeout = 3000; // 3 second timeout
        
        socket.setTimeout(timeout);
        
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        
        socket.connect(port, host);
    });
}

/**
 * Test RPC call
 */
async function testRPCCall(rpcUrl) {
    try {
        const result = await makeRPCCall(rpcUrl, {
            action: 'block_count'
        });
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Test a single server
 */
async function testServer(hostname) {
    // Try to resolve hostname
    let ip = hostname;
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        // It's a hostname, try to resolve
        const resolved = await resolveHostname(hostname);
        if (!resolved) {
            return {
                hostname: hostname,
                ip: null,
                port: RPC_PORT,
                resolved: false,
                portOpen: false,
                rpcWorking: false,
                error: 'DNS resolution failed'
            };
        }
        ip = resolved;
    }
    
    const httpUrl = `http://${ip}:${RPC_PORT}`;
    const httpsUrl = `https://${ip}:${RPC_PORT}`;
    
    // Test port connectivity
    const portOpen = await testPortConnectivity(ip, RPC_PORT);
    
    if (!portOpen) {
        return {
            hostname: hostname,
            ip: ip,
            port: RPC_PORT,
            resolved: true,
            portOpen: false,
            rpcWorking: false,
            error: 'Port not accessible'
        };
    }
    
    // Try HTTP first
    const httpResult = await testRPCCall(httpUrl);
    if (httpResult.success) {
        return {
            hostname: hostname,
            ip: ip,
            port: RPC_PORT,
            resolved: true,
            portOpen: true,
            rpcWorking: true,
            protocol: 'http',
            url: httpUrl,
            result: httpResult.result
        };
    }
    
    // Try HTTPS
    const httpsResult = await testRPCCall(httpsUrl);
    if (httpsResult.success) {
        return {
            hostname: hostname,
            ip: ip,
            port: RPC_PORT,
            resolved: true,
            portOpen: true,
            rpcWorking: true,
            protocol: 'https',
            url: httpsUrl,
            result: httpsResult.result
        };
    }
    
    return {
        hostname: hostname,
        ip: ip,
        port: RPC_PORT,
        resolved: true,
        portOpen: true,
        rpcWorking: false,
        protocol: null,
        error: httpResult.error || httpsResult.error
    };
}

/**
 * Test all servers with concurrency limit
 */
async function testAllServers(servers, concurrency = 10) {
    const results = [];
    const workingServers = [];
    const failedServers = [];
    
    console.log(`Testing ${servers.length} servers on port ${RPC_PORT} with concurrency limit of ${concurrency}...\n`);
    
    for (let i = 0; i < servers.length; i += concurrency) {
        const batch = servers.slice(i, i + concurrency);
        const batchNum = Math.floor(i / concurrency) + 1;
        const totalBatches = Math.ceil(servers.length / concurrency);
        console.log(`Testing batch ${batchNum}/${totalBatches} (${batch.length} servers)...`);
        
        const batchResults = await Promise.all(
            batch.map(async (server) => {
                const result = await testServer(server);
                if (result.rpcWorking) {
                    workingServers.push(result);
                    console.log(`  ✓ ${result.hostname} (${result.ip}) - Working (${result.protocol})`);
                } else if (result.portOpen && !result.rpcWorking) {
                    console.log(`  ✗ ${result.hostname} (${result.ip}) - Port open but RPC failed`);
                } else if (!result.resolved) {
                    console.log(`  ? ${result.hostname} - DNS resolution failed`);
                } else {
                    // Port closed or other error
                }
                return result;
            })
        );
        
        results.push(...batchResults);
        
        // Small delay between batches
        if (i + concurrency < servers.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    return { results, workingServers, failedServers: results.filter(r => !r.rpcWorking) };
}

/**
 * Main test function
 */
async function runTests() {
    console.log('========================================');
    console.log('Testing All RPC Destination Servers');
    console.log(`RPC Port: ${RPC_PORT}`);
    console.log('========================================\n');
    
    // Parse netstat output
    const destinations = parseNetstatOutput(NETSTAT_OUTPUT);
    console.log(`Extracted ${destinations.length} unique destination addresses from netstat output\n`);
    
    const startTime = Date.now();
    const { results, workingServers, failedServers } = await testAllServers(destinations, 10);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Print summary
    console.log('\n========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log(`Total servers tested: ${results.length}`);
    console.log(`Working RPC servers: ${workingServers.length}`);
    console.log(`Failed servers: ${failedServers.length}`);
    console.log(`Test duration: ${duration} seconds`);
    console.log('\n========================================');
    console.log('Working RPC Servers:');
    console.log('========================================');
    
    if (workingServers.length === 0) {
        console.log('No working RPC servers found on port 45000.');
    } else {
        workingServers.forEach((server, index) => {
            console.log(`\n${index + 1}. ${server.hostname}`);
            console.log(`   IP: ${server.ip}`);
            console.log(`   Port: ${server.port}`);
            console.log(`   Protocol: ${server.protocol.toUpperCase()}`);
            console.log(`   URL: ${server.url}`);
            if (server.result && server.result.count) {
                console.log(`   Block count: ${server.result.count}`);
            }
        });
    }
    
    // Save results to file
    const fs = require('fs');
    const output = {
        timestamp: new Date().toISOString(),
        rpcPort: RPC_PORT,
        totalServers: results.length,
        workingServers: workingServers.length,
        failedServers: failedServers.length,
        duration: duration,
        working: workingServers,
        failed: failedServers.slice(0, 50) // Limit failed servers in output
    };
    
    fs.writeFileSync('tests/rpc_test_results.json', JSON.stringify(output, null, 2));
    console.log('\n========================================');
    console.log(`Results saved to: tests/rpc_test_results.json`);
    console.log('========================================');
}

// Run tests
runTests().catch(console.error);
