// ./node s.js &> s.log & disown

globalThis.s ??= {};

(async () => {

    //s.l(s.net);
    // s.server.close(() => {
    //     s.l('httpServer stop'); s.server.closeAllConnections();
    // });
    //s.server.listen(8080, () => console.log(`httpServer start port: 8080`));
    s.def = (k, v) => {
        Object.defineProperty(s, k, {writable: true, configurable: true, enumerable: false, value: v});
    }

    if (typeof window !== 'undefined') {
        s = await (await fetch('/s')).json();
        s.proxy = {};
        s = new Proxy(s, s.proxy);

        if (s.f.js) globalThis.f = eval(s.f.js);
        (new (await f('d75b3ec3-7f79-4749-b393-757c1836a03e'))).run();
        return;
    }

    s.def('process', (await import('node:process')).default);
    s.def('nodeFS', (await import('node:fs')).promises);
    s.def('fsAccess', async path => { try { await s.nodeFS.access(path); return true; } catch { return false; } });
    s.def('replFile', 's.js');

    //s.l(s.process.pid);

    if (!s.loop) {
        s.def('loop', async () => {
            while (1) {
                await new Promise(r => setTimeout(r, s.loopDelay));
                try {
                    const js = await s.nodeFS.readFile(s.replFile, 'utf8');
                    eval(js);
                    s.js = js;
                }
                catch (e) { console.log(e); }
            }
        });
        s.process.on('uncaughtException', e => console.error('[[uncaughtException]]', e));
    }
    if (!s.loopRunning) { s.loop(); s.def('loopRunning', 1); }
    s.stop = () => { s.l('stop process ', s.process.pid); s.process.exit(0); }

    s.onceDB ??= {}; s.once = id => s.onceDB[id] ? 0 : s.onceDB[id] = 1;
    s.updateIds ??= {};
    s.isUUID = str => str.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/);
    s.l = console.log;
    s.f = (id, args) => {
        const n = s[id]; if (!n) { console.log(`node not found by id [${id}]`); return; }
        try {
            return Array.isArray(args) ? eval(n.js)(...args) : eval(n.js)();
        }
        catch (e) { console.log(n.id); console.error(e); }
    }
    s.dumpSkip = new Set([
        'connectedSSERequests', 'def', 'dumpToDisc', 'dumpCreate', 'dumping', 'dumpSkip',
        'netId', 'netLogicExecuting', 'nodeDownloading', 'nodeExtraction',
        'nodeHttp', 'l', 'loadStateFromFS', 'loadStateDone', 'log',
        'loop', 'loopRunning', 'loopRestart', 'loopBreak',
        'once', 'onceDB', 'scriptsChangeSlicer', 'server', 'updateIds'
    ]);

    s.dumpCreate = () => {
        const dump = {};
        for (let k in s) {
            if (s.dumpSkip.has(k)) continue;
            const v = s[k];
            const t = typeof v;


            if (s.isUUID(k)) dump[k] = v;
            else {

                if (t === 'function') {
                    dump[k] = {js: v.toString()};
                } else if (t === 'object' || t === 'boolean' || t === 'string' || t === 'number') {
                    dump[k] = v;
                } else s.l('unknown object type', t, k, v);
            }
            //try { JSON.stringify(dump[k]) } catch (e) { s.l('cant json stringify value', k); throw new Error('dumpCreate error'); }
        }
        return dump;
    }
    s.dumpToDisc = () => {
        if (s.dumping) return;
        s.dumping = setTimeout(async () => {
            s.l('<< memory dump', new Date);
            const dump = s.dumpCreate();
            if (s.loadStateDone) {
                await s.nodeFS.writeFile('s.json', JSON.stringify(dump));
            } else {
                s.l('dump dry run');
            }
            s.l('dumpCount:', Object.keys(dump).length, 'totalCount:', Object.keys(s).length, ' >>');
            s.dumping = 0;
        }, 1000);
    }
    s.loadStateFromFS = async (fileName) => {
        const state = JSON.parse(await s.nodeFS.readFile(fileName, 'utf8'));

        for (let k in state) {
            const v = state[k]; const vType = typeof v;
            if (s.isUUID(k)) {
                s[k] = v;
            } else if (vType === 'object') {
                if (!Array.isArray(v) && v !== null && v.js) s[k] = eval(v.js);
                else s[k] = v;
            } else if (vType === 'string' || vType === 'number' || vType === 'boolean') {
                s[k] = v;
            } else s.l('unknown object type', k, v);
        }
        s.loadStateDone = 1;
        s.l('loadStateFromFS', 'fs: ', Object.keys(state).length, 'total: ', Object.keys(s).length);
    }
    if (s['94a91287-7149-4bbd-9fef-1f1d68f65d70']) {
        s.httpClient = new (await s.f('94a91287-7149-4bbd-9fef-1f1d68f65d70'));
        s.logger = await s.f('20cb8896-bdf4-4538-a471-79fb684ffb86');
        s.log = new s.logger;
        s.fs = new (await s.f('9f0e6908-4f44-49d1-8c8e-10e1b0128858'))(s.log);
        s.os = await s.f('a4bc6fd6-649f-4709-8a74-d58523418c29');
    }

    s.netUpdate = async up => {
        /*await (await s.f('03454982-4657-44d0-a21a-bb034392d3a6'))(up, s.updateIds, s.net, s.f);*/
        //     // if (s.isMainNode && up.m === '/k' && up.k === 'js' && up.v) {
        //     //     await s.fs.writeFile(`scripts/${up.nodeId}.js`, up.v);
        //     // }
        const del = id => setTimeout(() => delete s.updateIds[id], 20000);
        let updateId = up.updateId;
        if (updateId) {
            if (updateIds[updateId]) { console.log(`already updated [${updateId}]`); return; }
            updateIds[updateId] = 1;
            //console.log('update receive');
            del(updateId);
        } else {
            const newUpdateId = (await f('dc9436fd-bec3-4016-a2f6-f0300f70a905')).uuid();
            updateIds[newUpdateId] = 1;
            up.updateId = newUpdateId;
            del(newUpdateId);
        }
        for (let name in netProcs) {
            try { await netProcs[name].post(up.m, up); }
            catch (e) { console.log('stup error: ', name, up.m, e); }
        }
    }

    s.connectedSSERequests ??= {};
    s.parseRqBody = async rq => {
        return new Promise((resolve, reject) => {
            let b = [];
            rq.on('data', chunk => b.push(chunk)); rq.on('error', err => reject(err));
            rq.on('end', () => {
                b = Buffer.concat(b);
                if (rq.headers['content-type'] === 'application/json') b = JSON.parse(b.toString());
                resolve(b);
            });
        });
    }
    s.resolveRqStatic = async (rq, rs) => {

        const lastPart = rq.pathname.split('/').pop();
        const split = lastPart.split('.');
        if (split.length < 2) return false;

        const extension = split[split.length - 1]; if (!extension) return;
        try {
            const file = await s.nodeFS.readFile('.' + rq.pathname);
            const m = {html: 'text/html', js: 'text/javascript', css: 'text/css', map: 'application/json', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf'};
            if (m[extension]) rs.setHeader('Content-Type', m[extension]);
            rs.setHeader('Access-Control-Allow-Origin', '*');
            rs.end(file);
            return true;
        } catch (e) {
            if (s.log) s.log.info(e.toString(), {path: e.path, syscall: e.syscall});
            else console.log(e);
            return false;
        }
    }
    s.httpSlicer = async (rq, rs) => {
        const ip = rq.socket.remoteAddress;
        const isLocal = ip === '::1' || ip === '127.0.0.1';
        const cookie = rq.headers.cookie;

        if (s.token && rq.method === 'POST') { rs.writeHead(403).end('no'); return; }

        const url = (new URL('http://t.c' + rq.url));
        rq.query = {};
        url.searchParams.forEach((v, k) => rq.query[k] = v);
        rq.pathname = url.pathname;
        rs.e = code => rs.writeHead(code, {'Content-Type': 'text/plain; charset=utf-8'}).end();
        rq.mp = `${rq.method}:${url.pathname}`;

        s.l(ip, rq.mp);

        rs.s = (v, contentType) => {
            const s = (value, type) => rs.writeHead(200, {'Content-Type': type}).end(value);

            if (!v) s('empty val', 'text/plain; charset=utf-8');
            else if (v instanceof Buffer) s(v, '');
            else if (typeof v === 'object') s(JSON.stringify(v), 'application/json');
            else if (typeof v === 'string' || typeof v === 'number') s(v, contentType ?? 'text/plain; charset=utf-8');
            else s('', 'text/plain');
        }
        if (s.httpSlicer2 && !await s.httpSlicer2({rq, rs})) return;

        const m = {
            'GET:/': async () => rs.s(await s.f('ed85ee2d-0f01-4707-8541-b7f46e79192e'), 'text/html'),
            'GET:/ping': () => rs.s('pong'),
            'GET:/event-stream': () => {
                s.log.info('SSE connected');
                //s.connectedRS = rs;
                rs.writeHead(200, {'Content-Type': 'text/event-stream', 'Connection': 'keep-alive', 'Cache-Control': 'no-cache'});
                rs.write(`data: ES connected \n\n`);
                rq.on('close', () => {
                    //s.connectedRS = 0;
                    s.log.info('SSE closed');
                });
            },
            'POST:/token': () => {
                if (isLocal) {
                    const {token} = s.parseRqBody(rq);
                    if (token) s.token = token;
                    rs.s('ok');
                    return;
                }
                rs.s();
            },
            //GET:/fsAccess: //POST:/fsWriteFile:
        }
        if (s.resolveRqStatic && await s.resolveRqStatic(rq, rs)) return;
        if (m[rq.mp]) { await m[rq.mp](); return; }
        //todo //if (!rs.isLongRequest && !rs.writableEnded) rs.s('rs end');
        rs.s('not found');
    }
    s.httpSlicer2 = async ({rq, rs}) => {
        const m = {
            'GET:/s': async () => rs.s(s.dumpCreate()),
            'POST:/k': async () => {
                const {kPath, v, updateId, deleteProp} = await s.parseRqBody(rq);
                if (kPath && Array.isArray(kPath)) {

                    const kNodes = [s];

                    let node = s; //there will be the deepest node found by kPath
                    let key = null; //there will be last part of kPath

                    for (let i = 0; i < kPath.length; i++) {
                        const k = kPath[i];
                        if (i >= kPath.length - 1) {
                            key = k; break;
                        }
                        node = node[k];
                        //todo create object if force flag is set to true
                        if (!node) { //todo maybe use === undefined for possible null usage.
                            rs.s(`key [${k}] not found in object`);
                            return;
                        }
                        if (typeof node === 'object' && node !== null) kNodes.push(node);
                    }
                    if (!node) { rs.s({err: 'node not found'}); return; }

                    const nodeType = typeof node;
                    if (nodeType === 'object') {
                        node[key] = v;
                        if (key === 'js') {
                            try { node.__js__ = eval(v); } catch (e) { console.error(e); }
                        }
                        if (deleteProp) delete node[key];
                    } else {
                        const parentNode = kNodes.at(-1);
                        const parentKey = kPath.at(-2);
                        if (key === 'js') {
                            if (typeof v !== 'string') { rs.s('v is not string'); return; }
                            //console.log(Object.keys(parentNode).slice(0, 5), '---', parentKey, v);
                            try { parentNode[parentKey] = eval(v); } catch (e) { console.error(e); }
                        }
                    }
                }
                rs.s('ok');
                //if (s.netRadiate) await s.netRadiate({m: '/k', nodeId, kPath, v, deleteProp, updateId});
            },
        }
        if (m[rq.mp]) { await m[rq.mp](); return false; }
        return true;
    }

    //s.l(await s.httpClient.post('http://167.172.160.174:8080/kw', {deleteProp: 1}));
    //s.netId = 'main'

    if (!s.server) {
        s.nodeHttp = await import('node:http');
        s.server = s.nodeHttp.createServer((rq, rs) => { if (s.httpSlicer) s.httpSlicer(rq, rs); });
        s.serverPort = port => {
            s.server.close(() => {
                s.l('server stop'); s.server.closeAllConnections();
            });
            s.server.listen(port, () => s.l(`server start ${port}`));
        }
    }

    if (s.once(2)) {
        console.log('ONCE', new Date);

        if (await s.fsAccess('s.json')) await s.loadStateFromFS('s.json');
        if (await s.fsAccess('scripts') && s.fsChangesSlicer && !s.scriptsChangeSlicer) {
            s.scriptsChangeSlicer = await s.fsChangesSlicer('scripts');
            s.scriptsChangeSlicer.start();
            s.scriptsChangeSlicer.slicer = async (e) => {
                if (e.eventType !== 'change') return;
                const id = e.filename.slice(0, -3);
                const node = s[id];
                if (!node) return;
                console.log('updateFromFS', node.id, node.name);
                const newJS = await s.nodeFS.readFile('scripts/' + e.filename, 'utf8');
                if (node.js === newJS) { console.log('js already updated'); return; }
                try { eval(newJS); node.js = newJS; s.dumpToDisc(); }
                catch (e) { s.log.error(e.toString(), e.stack); }
            }
        }
        // if (!s.netId) {
        //     s.serverPort(8080);
        // }

        s.server.listen(8080, () => console.log(`httpServer start port: 8080`));
    }

    //console.log(s.process.env)

    //if (procNodeId) { console.log(`procNodeId: ${procNodeId}`); await f(procNodeId); return; }
    if (s['f877c6d7-e52a-48fb-b6f7-cf53c9181cc1'] && !s.netLogicExecuting) {
        const netLogic = await s.f('f877c6d7-e52a-48fb-b6f7-cf53c9181cc1');
        s.netLogicExecuting = 1;
        await netLogic(s.netId);
        s.netLogicExecuting = 0;
    }
})();