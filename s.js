globalThis.s ??= {};

(async () => {
    Object.defineProperty(s, 'def', {
        writable: true, configurable: true, enumerable: false,
        value: (k, v) => {
            Object.defineProperty(s, k, {writable: true, configurable: true, enumerable: false, value: v});
        }
    });
    Object.defineProperty(s, 'defObjectProp', {
        writable: true, configurable: true, enumerable: false,
        value: (o, k, v) => {
            Object.defineProperty(o, k, {writable: true, configurable: true, enumerable: false, value: v});
        }
    });
    s.def('l', console.log);
    s.def('nodeSearch', id => {
        const idParts = id.split('.');
        let node = s;
        for (let i = 0; i < idParts.length; i++) {
            if (typeof node !== 'object') {
                console.log(`node not found by id [${id}]`); return;
            }
            node = node[idParts[i]];
        }
        if (!node) {
            console.log(`node not found by id [${id}]`);
            return;
        }
        return node;
    });
    s.def('f', (id, args) => {
        try {
            let node = s.nodeSearch(id);
            if (!node) return;
            let func = typeof node === 'function' ? node : eval(node.js);

            return Array.isArray(args) ? func(...args) : func();
        }
        catch (e) { console.log(id); console.error(e); }
    });

    if (typeof window !== 'undefined') {
        globalThis.f = s.f;

        const state = await (await fetch('/s')).json();
        for (let k in state) s[k] = state[k];
        s.proxy = {};
        s = new Proxy(s, s.proxy);

        (new (await f('apps.GUI'))).run();
        return;
    }

    s.def('process', (await import('node:process')).default);
    s.def('processStop', () => { s.l('stop process ', s.process.pid); s.process.exit(0); });
    //s.def('processRestart', () => { s.l('stop process ', s.process.pid); s.process.exit(0); });
    s.def('nodeFS', (await import('node:fs')).promises);
    s.def('fsAccess', async path => { try { await s.nodeFS.access(path); return true; } catch { return false; } });
    //if (!s.hang) s.def('hang', {interval: {}, promise: {}, ssh: {}});
    if (!s.u) s.u = {};
    if (!s.sys) s.sys = {};
    if (!s.std) s.std = {};

    //const a = s['bcc07804-c1bc-472d-a599-e4f5a3174300']; delete a.id;
    //delete s.apps.timeEditor;

    //s.u.aliferov.jsLib.langParser = { js: s['a28c97ba-edc0-4670-8902-cd40eca8d451'].js }
    //s.apps.timeEditor.jsFrontend = { js: s['9822fce5-9fcf-4703-b633-85d83b23c714'].js }
    //s.raspberry = {};
    //s.l(rasp);
    //s.std.ui.input = { js: s['924bfc18-6a27-48e0-aa18-16edfbad9bbb'].js };

    //s.std.unixTs = s.unixTs

    //s.l(s.netNodesCheck);
    //todo find stup and copy raspberry data net node

    s.def('replFile', 's.js');
    s.loopDelay = 2000;
    if (!s.loop) {
        if (!s.loopDelay) { console.log('loop delay is not set'); return; }
        s.def('loop', async () => {
            while (1) {
                await new Promise(r => setTimeout(r, s.loopDelay));
                try {
                    const js = await s.nodeFS.readFile(s.replFile, 'utf8');
                    eval(js);
                    s.def('js', js);
                }
                catch (e) { console.log(e); }
            }
        });
        s.process.on('uncaughtException', e => console.error('[[uncaughtException]]', e));
    }
    if (!s.loopRunning) { s.loop(); s.def('loopRunning', 1); }

    if (s.std.logger) {
        s.http = new (await s.f('std.httpClient'));
        s.log = new (await s.f('std.logger'));
        s.def('fs', new (await s.f('fsClass'))(s.log));
        s.def('os', await s.f('std.os'));
    }

    if (!s.onceDB) s.def('onceDB', {});
    s.def('once', id => s.onceDB[id] ? 0 : s.onceDB[id] = 1);
    s.def('updateIds', {});
    s.isUUID = str => str.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/);
    s.def('dumpSkip', new Set(['def', 'defObjectProp', 'dumping', 'l', 'netId', 'token']));
    s.def('createObjectDump', object => {
        const dump = {};
        for (let k in object) {
            if (s.dumpSkip.has(k)) continue;

            const v = object[k];
            const t = typeof v;

            if (s.isUUID(k)) dump[k] = v;
            else {
                if (t === 'function') {
                    dump[k] = {js: v.toString()};
                } else if (t === 'boolean' || t === 'string' || t === 'number') {
                    dump[k] = v;
                } else if (t === 'object') {
                    if (v === null || Array.isArray(v)) {
                        dump[k] = v;
                    } else {
                        dump[k] = s.createObjectDump(v);
                    }
                } else s.l('unknown object type', t, k, v);
            }
        }
        return dump;
    });
    s.def('dumpStateToDisc', () => {
        if (s.dumping) return;
        s.dumping = setTimeout(async () => {
            s.l('<< memory dump', new Date);
            const dump = s.createObjectDump(s);
            if (s.loadStateDone) {
                await s.nodeFS.writeFile('s.json', JSON.stringify(dump));
            } else {
                s.l('dump dry run');
            }
            s.l('dumpCount:', Object.keys(dump).length, 'totalCount:', Object.keys(s).length, ' >>');
            s.dumping = 0;
        }, 1000);
    });

    s.def('startupScripts', new Set(['fsChangesSlicer', 'isUUID', 'logger', 'uuid']));
    s.def('handleJs', async () => {

        const isScriptsDirExists = await s.fsAccess('scripts');
        const iterate = async (obj, parentObject, parentKey, kPath = '') => {

            if (Array.isArray(obj)) return;
            for (let k in obj) {

                const v = obj[k]; const vType = typeof v;
                //UUID check.
                if (k.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/)) continue;
                if (vType === 'object') {
                    await iterate(v, obj, k, kPath ? (kPath + '.' + k) : k);
                    continue;
                }
                if (vType === 'string' && k === 'js' && v) {
                    if (s.startupScripts.has(kPath)) {
                        try {
                            if (parentObject && parentKey) parentObject[parentKey] = eval(v);
                            else obj[k] = eval(v);
                        }
                        catch (e) { console.log(e, k); }
                    }
                    //This is for fallback editing of scripts if dashboard is broken.
                    if (isScriptsDirExists && kPath) {
                        await s.nodeFS.writeFile('scripts/' + kPath + '.js', v);
                    }
                }
            }
        }
        await iterate(s);
    });
    s.sys.setUpdate = async state => {
        for (let k in s) {
            if (!state[k]) delete s[k];
        }
        for (let k in state) s[k] = state[k];
        s.def('loadStateDone', 1);
        s.l('setUpdate', 'setForUpdate: ', Object.keys(state).length, 'set: ', Object.keys(s).length);
    }
    s.sys.netUpdate = async up => {
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

    if (!s.connectedSSERequests) s.def('connectedSSERequests', {});
    s.std.rqParseBody = async rq => {
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
    s.std.rqResolveStatic = async (rq, rs) => {
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
    s.std.rqGetToken = rq => {
        if (!rq.headers.cookie || rq.headers.cookie.length < 1) return;

        const cookies = rq.headers.cookie.split(';');
        for (let i in cookies) {
            const cookieKV = cookies[i].trim().split('=');
            if (cookieKV[0] === 'token' && cookieKV[1]) {
                return cookieKV[1].trim();
            }
        }
    }
    s.def('httpSlicer', async (rq, rs) => {
        const ip = rq.socket.remoteAddress;
        const isLocal = ip === '::1' || ip === '127.0.0.1';
        const token = s.std.rqGetToken(rq);

        if (rq.method === 'POST' && !isLocal) {
            if (!token || !s.token || token !== s.token) {
                rs.writeHead(403).end('no');
                return;
            }
        }

        const url = new URL('http://t.c' + rq.url);
        rq.query = {};
        url.searchParams.forEach((v, k) => rq.query[k] = v);
        rq.pathname = url.pathname;
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
        const m = {
            'GET:/': async () => rs.s(await s.f('apps.GUI.html'), 'text/html'),
            'GET:/trigger': async () => {
                if (!isLocal) { rs.s('ok'); return; }
                if (s.trigger) s.trigger();
                rs.s('ok');
            },
            'GET:/event-stream': () => {
                const rqId = s.f('uuid');

                s.log.info('SSE connected');
                s.connectedSSERequests[rqId] = rs;
                rs.writeHead(200, {'Content-Type': 'text/event-stream', 'Connection': 'keep-alive', 'Cache-Control': 'no-cache'});
                rq.on('close', () => {
                    delete s.connectedSSERequests[rqId];
                    s.log.info('SSE closed');
                });
            },
            'GET:/token': () => { rs.s(typeof s.token); },
            'POST:/token': () => {
                if (isLocal || !s.token) {
                    const {token} = s.std.rqParseBody(rq);
                    if (token) s.token = token;
                    rs.s('ok'); return;
                }
                rs.s();
            },
            'GET:/s': async () => rs.s(s.createObjectDump(s)),
            'POST:/s': async () => {
                const {state} = await s.std.rqParseBody(rq);
                s.sys.setUpdate(state);
                await s.handleJs(state);
                rs.s('ok');
            },
            'POST:/k': async () => {
                const {kPath, v, updateId, deleteProp} = await s.std.rqParseBody(rq);
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
                        if (key === 'js' && node.__js__) {
                            try { node.__js__ = eval(v); } catch (e) { console.error(e); }
                        }
                        if (deleteProp) delete node[key];
                    } else {
                        if (key === 'js') {
                            const parentNode = kNodes.at(-1);
                            const parentKey = kPath.at(-2);

                            if (typeof v !== 'string') { rs.s('v is not string'); return; }
                            //console.log(Object.keys(parentNode).slice(0, 5), '---', parentKey, v);
                            try { parentNode[parentKey] = eval(v); } catch (e) { console.error(e); }
                        }
                    }
                }
                rs.s('ok');
                //if (s.netRadiate) await s.netRadiate({m: '/k', nodeId, kPath, v, deleteProp, updateId});
            },
            'GET:/fsAccess': async () => {
                if (!rq.query.path || rq.query.path.includes('..')) { rs.s('path invalid'); return; }
                rs.s({'access': await s.fsAccess(rq.query.path)});
            },
            'POST:/fsWrite': async () => {
                if (!rq.query.path || rq.query.path.includes('..')) { rs.s('path invalid'); return; }
                const b = await s.std.rqParseBody(rq);
                if (b) await s.nodeFS.writeFile(rq.query.path, b);
                rs.s('ok');
            },
        }
        if (await s.std.rqResolveStatic(rq, rs)) return;
        if (m[rq.mp]) { await m[rq.mp](); return; }
        //todo //if (!rs.isLongRequest && !rs.writableEnded) rs.s('rs end');
        rs.s('not found');
    });
    if (!s.server) {
        s.def('nodeHttp', await import('node:http'));
        s.def('server', s.nodeHttp.createServer((rq, rs) => { if (s.httpSlicer) s.httpSlicer(rq, rs); }));
        s.def('serverStop', () => {
            s.server.closeAllConnections();
            s.server.close(() => s.server.closeAllConnections());
        });
        s.def('serverRestart', port => {
            s.server.closeAllConnections();
            s.server.close(() => {
                s.l('server stop');
                s.server.closeAllConnections();
                s.server.listen(port, () => s.l(`server start ${port}`));
            });
        });
    }

    if (!s.logSlicerProc && s.std.logger) {

        const logger = new (await s.f('std.logger'));
        logger.mute();
        logger.onMessage(msg => {
            const json = JSON.stringify({m: msg});
            for (let i in s.connectedSSERequests) {
                s.connectedSSERequests[i].write(`data: ${json}\n\n`);
            }
        });
        const os = new s.os(logger);
        s.def('logSlicerProc', 1);
        os.run('tail -f s.log', false, false, (proc) => {
            s.def('logSlicerProc', proc);
        });
    }
    s.def('trigger', async () => s.l('trigger test'));

    if (s.once(103)) {
        console.log('ONCE', new Date);

        if (await s.fsAccess('s.json')) {
            const state = JSON.parse(await s.nodeFS.readFile('s.json', 'utf8'));
            await s.sys.setUpdate(state);
            await s.handleJs(state);
        }
        if (await s.fsAccess('scripts') && s.fsChangesSlicer && !s.scriptsChangesSlicer) {
            s.def('scriptsChangesSlicer', await s.fsChangesSlicer('scripts'));
            s.scriptsChangesSlicer.start();
        }
        if (s.scriptsChangesSlicer) {
            s.scriptsChangesSlicer.slicer = async (e) => {
                if (e.eventType !== 'change') return;
                const id = e.filename.slice(0, -3);
                const node = s.nodeSearch(id);
                if (!node) return;

                const tNode = typeof node;

                console.log('updateFromFS', node.id, e.filename);
                const js = await s.nodeFS.readFile('scripts/' + e.filename, 'utf8');

                //todo some node can be functions, so we need make node.toString() before comparison
                if (node.js === js) { console.log('js already updated'); return; }
                try {
                    eval(js); //just for validation of js
                    if (tNode === 'object') node.js = js;
                    s.dumpStateToDisc();
                } catch (e) { s.log.error(e.toString(), e.stack); }
            }
        }

        if (s.server) s.server.listen(8080, () => console.log(`httpServer start port: 8080`));
    }

    const sendStateToNetNode = async () => {
        const r = await s.net.do.http.post(`/s`, {state: s.createObjectDump(s)}, {
            cookie: 'token=',
        });
        console.log(r);
    }
    //sendStateToNetNode();
    //s.netId = 'main';
    //s.l(await s.http.post('http://167.172.160.174', {}, {}));

    //s.sys.netNodesCheck = s.netNodesCheck;
    //await s.handleJs(state);


    const sys = s.sys;

    if (sys.netNodesCheck && !sys.netNodesCheckIsActive) {

        const netNodesCheck = await s.f('sys.netNodesCheck');
        s.defObjectProp(sys, 'netNodesCheckIsActive', 1);

        try { await netNodesCheck(s.netId); }
        catch (e) { s.l(e); }
        sys.netNodesCheckIsActive = 0;
    }
})();