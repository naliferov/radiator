(async () => {
    s.onceDB ??= {}; if (!s.once) s.once = id => s.onceDB[id] ? 0 : s.onceDB[id] = 1;
    if (!s.server) {
        s.nodeHttp = await import('node:http');
        s.server = s.nodeHttp.createServer((rq, rs) => { if (s.httpSlicer) s.httpSlicer(rq, rs); });
    }
    s.l = console.log;
    s.dumpSkip = new Set([
        'dumpCreate', 'dumping', 'dumpSkip', 'nodeProcess', 'nodeFS', 'nodeHttp',
        'l', 'loadStateFromFS', 'loadStateDone', 'loop', 'loopDelay', 'loopStart', 'loopRestart', 'loopBreak',
        'once', 'onceDB', 'replFile', 'server',
    ]);
    s.dumpCreate = () => {
        if (s.dumping) return;
        s.dumping = setTimeout(async () => {
            s.l('memory dump ' + new Date());

            const dump = {};
            for (let k in s) {
                if (s.dumpSkip.has(k)) continue;
                const v = s[k]; const t = typeof v;

                if (k.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/)) dump[k] = v;
                else {
                    if (t === 'function') {
                        dump[k] = v.toString(); console.log(k);
                    } else if (t === 'boolean' || t === 'string' || t === 'number') {
                        dump[k] = v;
                    } else s.l('unknown object type', t, k, v);
                }
            }
            s.dumping = 0;
            if (s.loadStateDone) await s.nodeFS.writeFile('./state/state.json', JSON.stringify(dump));
            s.l('dumpCount: ', Object.keys(dump).length);
        }, 1000);
    }
    s.loadStateFromFS = async () => {
        const state = JSON.parse(await s.nodeFS.readFile('state/state.json', 'utf8'));
        for (let k in state) {
            const v = state[k]; const vType = typeof v;

            if (k.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/)) s[k] = v;
            else if (vType === 'string') {
                s[k] = eval(v); s.l(k);
            } else if (vType === 'number' || vType === 'boolean') {
                s[k] = v;
            } else s.l('unknown object type', k, v);
        }
        s.loadStateDone = 1;
    }
    s.fsChangesSlicer = async (path) => {
        return {
            isStarted: false,
            ac: new AbortController,
            start: async function () {
                if (this.isStarted) return;
                this.generator = await s.nodeFS.watch(path, {signal: this.ac.signal});
                for await (const e of this.generator) if (this.slicer) await this.slicer(e);
                s.l('s.fsChangesSlicer STARTED');
                this.isStarted = true;
            },
            stop: function () { this.ac.abort(); }
        }
    }

    if (s.once(35)) {
        console.log('ONCE', new Date);
        //s.scriptsChangeSlicer = await s.fsChangesSlicer('scripts');
        //s.scriptsChangeSlicer.start();
        // s.scriptsChangeSlicer.slicer = async (e) => {
        //     if (e.eventType !== 'change') return;
        //     console.log(e);
        // };
        //await s.scriptsWatcher.start();
    }

    //console.log(s.scriptsChangeSlicer);

    //delete s.watchScripts;
    //s.l(Object.keys(s));
    //s.loadStateFromFS();
    //s.dumpCreate();

    //console.log(await s.stream.next());
    //console.log(`${Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100} MB`);

    /*const nodeId = e.filename.slice(0, -3);
                const node = s.st[nodeId];
                if (!node) continue;

                console.log('updateFromFS', node.id, node.name);
                const newJS = await s.fs.readFile('scripts/' + e.filename, 'utf8');
                if (node.js === newJS) { console.log('js already updated'); continue; }
                try {
                    const js = eval(newJS); if (js) node.__js__ = js;
                    node.js = newJS;
                    s.triggerDump();
                } catch (e) {
                    s.log.error(e.toString(), e.stack);
                }*/

    //console.log(s.watchScripts.close());
    //s.watchScriptsStart();console.log(11);
    //s.loadStateFromFS();

    //s.l(Object.keys(s.getTimestamp));
    //s.l(s.getTimestamp());

    //for (let k in s) { if (!k.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/)) console.log(k); }
    /*const state = JSON.parse(await s.nodeFS.readFile('state/state.json', 'utf8'));
    for (let i in state) {
        s[i] = state[i];
    }*/

    //console.log('asdsas'.match(/as/));
    //console.log(Object.keys(globalThis));
    //console.log(Object.keys(state).length);

    // s.logMsgHandler = m => {
    //     if (!s.connectedRS) return;
    //     const msg = JSON.stringify({m});
    //     s.connectedRS.write(`data: ${msg} \n\n`);
    // }
    //s.log.onMessage(m => s.logMsgHandler(m));

    /*
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
    s.resolveStatic = async (rq, rs) => {

        const lastPart = rq.pathname.split('/').pop();
        const split = lastPart.split('.');
        if (split.length < 2) return false;

        const extension = split[split.length - 1]; if (!extension) return;
        try {
            const file = await s.fs.readFile('.' + rq.pathname, null);
            const m = {html: 'text/html', js: 'text/javascript', css: 'text/css', map: 'application/json', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf'};
            if (m[extension]) rs.setHeader('Content-Type', m[extension]);
            rs.setHeader('Access-Control-Allow-Origin', '*');
            rs.end(file);
            return true;
        } catch (e) {
            s.log.info(e.toString(), {path: e.path, syscall: e.syscall});
            return false;
        }
    }
    s.runProcManager = async () => {
        const procLogger = (new s.Logger('pm: ')).onMessage(m => s.logMsgHandler(m));
        const os = new s.OS(procLogger);
        os.run(`./node ${selfId} --port=${port + 1} --netNodeId=${netNodeId} --procManager=1`, false, false, proc => {
            s.intervalChildProcess = proc;
        }, code => {
            s.log.error('procManager closed...... with code: ' + code);
            setTimeout(runProcManager, 2000);
        });
    }*/

    //console.log(s.runProcManager.toString());

    //console.log(s.parseRqBody.toString());

    //if (s.isMainNode) watchScripts();

    //resetInterval();
    //dump();

    //console.log(Object.keys(s));
    //console.log('asdasd');
    //s.symbols[Symbol('storm')] = 1;
    //console.log(Object.keys(s))

    //s.net ??= {};
    //s.slicer ??= {};
    //s.updateIds ??= {};
    //s.eventSource ??= {};
    //s.connectedRS = null;

    //console.log(s.wwwwwaaa());

    /*s.pa = async (...args) => {
        let r;
        for (let i = 0; i < args.length; i++) r = await eval(`async () => ${args[i]}`) ();
        return r;
    }
    s.execJS = id => {
        const n = s.st[id]; if (!n) { console.error(`node not found by id [${id}]`); return; }
        try {
            if (!n.__js__) n.__js__ = eval(n.js);
            return n.__js__();
        } catch (e) { console.log(n.id); console.error(e); }
    }
    s.e = event => {}
    s.f = async id => s.execJS(id);*/

    // s.st = await s.pa('import("node:fs")', 'r.promises', 'r.readFile("./state/nodes.json")', 'JSON.parse(r)');
    //
    // s.isMainNode = netNodeId === 'main';
    // s.Logger = await f('20cb8896-bdf4-4538-a471-79fb684ffb86');
    // s.log = new s.Logger;
    // s.fs = new (await f('9f0e6908-4f44-49d1-8c8e-10e1b0128858'))(s.log);
    // s.f = await f('dc9436fd-bec3-4016-a2f6-f0300f70a905');
    // s.OS = await f('a4bc6fd6-649f-4709-8a74-d58523418c29');
    // s.httpClient = await f('94a91287-7149-4bbd-9fef-1f1d68f65d70');
    // s.EventSource = (await import('eventsource')).default;

    if (typeof window !== 'undefined') {
        s.f = async (id, forceRequest) => {
            //if (forceRequest) return s.pa(`fetch('/node?id=${id}')`, 'r.text()', 'eval(r)()');
            return s.execJS(id);
        }
        //s.st = await (await fetch('/st')).json();
        //(new (await f('d75b3ec3-7f79-4749-b393-757c1836a03e'))).run();
        return;
    }
    //console.log('test')
})();

//console.clear();

//delete s.stateDumping; console.log(Object.keys(s));

/*s.httpSlicer = (rq, rs) => {
    rs.end('test 9900573jf www wwwwwa oioio');
}*/

//s.server.close(() => console.log('httpServer stop')); s.server.closeAllConnections();
//s.server.listen(8080, () => console.log(`httpServer start port: 8080`));