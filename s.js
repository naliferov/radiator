// ./node s.js &> s.log & disown

globalThis.s ??= {};

(async () => {

    if (typeof window !== 'undefined') {
        s = await (await fetch('/s')).json();
        if (s.f.js) globalThis.f = eval(s.f.js);
        (new (await f('d75b3ec3-7f79-4749-b393-757c1836a03e'))).run();
        return;
    }

    s.nodeProcess = (await import('node:process')).default;
    s.nodeFS = (await import('node:fs')).promises;
    s.loopDelay = 2000;
    s.replFile = 's.js';
    if (!s.netId) s.netId = await s.nodeFS.readFile('netId', 'utf8');

    if (!s.loop) {
        s.loop = async () => {
            while (1) {
                await new Promise(r => setTimeout(r, s.loopDelay));
                try { eval(await s.nodeFS.readFile(s.replFile, 'utf8')); }
                catch (e) { console.log(e); }
            }
        };
        s.nodeProcess.on('uncaughtException', e => console.error('[[uncaughtException]]', e));
    }
    if (!s.loopRunning) { s.loop(); s.loopRunning = 1; }

    s.onceDB ??= {}; s.once = id => s.onceDB[id] ? 0 : s.onceDB[id] = 1;
    s.updateIds ??= {};
    s.connectedRS ??= {};
    s.isMainNode = 1;
    s.isUUID = str => str.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/);
    if (!s.server) {
        s.nodeHttp = await import('node:http');
        s.server = s.nodeHttp.createServer((rq, rs) => { if (s.httpSlicer) s.httpSlicer(rq, rs); });
    }
    s.l = console.log;
    s.dumpSkip = new Set([
        'connectedRS', 'dumpToDisc', 'dumpCreate', 'dumping', 'dumpSkip', 'netLogicExecuting',
        'nodeDownloading', 'nodeFS', 'nodeProcess', 'nodeExtraction',
        'nodeHttp', 'isMainNode', 'l', 'loadStateFromFS', 'loadStateDone', 'log',
        'loop', 'loopDelay', 'loopRunning', 'loopRestart', 'loopBreak',
        'once', 'onceDB', 'replFile',  'scriptsChangeSlicer', 'server', 'updateIds'
    ]);

    if (s['94a91287-7149-4bbd-9fef-1f1d68f65d70']) {
        s.httpClient = new (await s.f('94a91287-7149-4bbd-9fef-1f1d68f65d70'));
        s.logger = await s.f('20cb8896-bdf4-4538-a471-79fb684ffb86');
        s.log = new s.logger;
        s.fs = new (await s.f('9f0e6908-4f44-49d1-8c8e-10e1b0128858'))(s.log);
        s.util = await s.f('dc9436fd-bec3-4016-a2f6-f0300f70a905');
        s.os = await s.f('a4bc6fd6-649f-4709-8a74-d58523418c29');
    }

    s.dumpCreate = () => {
        const dump = {};
        for (let k in s) {
            if (s.dumpSkip.has(k)) continue;
            const v = s[k]; const t = typeof v;

            if (s.isUUID(k)) dump[k] = v;
            else {
                if (t === 'function') {
                    dump[k] = {js: v.toString()}; console.log(k);
                } else if (t === 'object' || t === 'boolean' || t === 'string' || t === 'number') {
                    dump[k] = v;
                } else s.l('unknown object type', t, k, v);
            }
        }
        return dump;
    }
    s.dumpToDisc = () => {
        if (s.dumping) return;
        s.dumping = setTimeout(async () => {
            s.l('memory dump', new Date);
            const dump = s.dumpCreate();
            if (s.loadStateDone) {
                await s.nodeFS.writeFile('state.json', JSON.stringify(dump));
            } else {
                s.l('dump dry run');
            }
            s.l('dumpCount:', Object.keys(dump).length, 'totalCount:', Object.keys(s).length);
            s.dumping = 0;
        }, 1000);
    }
    s.loadStateFromFS = async () => {
        const state = JSON.parse(await s.nodeFS.readFile('state.json', 'utf8'));

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
        s.l('loadStateFromFS', 'fs s', Object.keys(state).length, 'total s', Object.keys(s).length);
    }
    s.f = (id, args) => {
        const n = s[id]; if (!n) { console.error(`node not found by id [${id}]`); return; }
        try {
            return Array.isArray(args) ? eval(n.js)(...args) : eval(n.js)();
        }
        catch (e) { console.log(n.id); console.error(e); }
    };
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
    if (s.once(42)) {
        console.log('ONCE', new Date);
        await s.loadStateFromFS();
        //await s.dumpToDisc();
        if (!s.scriptsChangeSlicer) {
            s.scriptsChangeSlicer = await s.fsChangesSlicer('scripts');
            s.scriptsChangeSlicer.start();
        }
        s.scriptsChangeSlicer.slicer = async (e) => {
            if (e.eventType !== 'change') return;
            const id = e.filename.slice(0, -3);
            const node = s[id];
            if (!node) return;
            console.log('updateFromFS', node.id, node.name);
            const newJS = await s.fs.readFile('scripts/' + e.filename, 'utf8');
            if (node.js === newJS) { console.log('js already updated'); return; }
            try { eval(newJS); node.js = newJS; s.dumpToDisc(); }
            catch (e) { s.log.error(e.toString(), e.stack); }
        }
        s.server.listen(8080, () => console.log(`httpServer start port: 8080`));
    }
    //s.l(s.artistList.slice(1000, 1100));
    //s['4b60621c-e75a-444a-a36e-f22e7183fc97'].name = 'httpSlicer1';
    //s.dumpToDisc();
    //console.log(s.httpSlicer2);

    //s.l(s.parseRqBody.toString());
    //s.clone

    s.httpSlicer = async (rq, rs) => {
        //todo //if (!rs.isLongRequest && !rs.writableEnded) rs.s('rs end');
        const mainSlicer = await s.f('4b60621c-e75a-444a-a36e-f22e7183fc97');
        const next = await mainSlicer({
            rq, rs,
            stup: async up => {
                /*await (await s.f('03454982-4657-44d0-a21a-bb034392d3a6'))(up, s.updateIds, s.net, s.f);*/
                // if (s.isMainNode && up.m === '/k' && up.k === 'js' && up.v) {
                //     await s.fs.writeFile(`scripts/${up.nodeId}.js`, up.v);
                // }
            },
            updatePermit: true
        });
        if (!next) return;
        //DE FRONTEND
        const m = {
            'GET:/': async () => rs.s(await s.f('ed85ee2d-0f01-4707-8541-b7f46e79192e'), 'text/html'),
            'GET:/js': async () => rs.s(await s.fs.readFile(s.replFile), 'text/javascript; charset=utf-8'),
            'GET:/node': () => {
                if (!rq.query.id) { rs.s('id is empty'); return; }
                const node = g(rq.query.id);
                if (node && node.js) rs.s(node.js, 'text/javascript; charset=utf-8');
                else rs.s('script not found');
            },
            'GET:/consoleMonitor': () => {
                s.log.info('SSE connected');
                s.connectedRS = rs;
                rs.writeHead(200, {'Content-Type': 'text/event-stream', 'Connection': 'keep-alive', 'Cache-Control': 'no-cache'});
                rs.write(`data: EventSource connected \n\n`);
                rq.on('close', () => { s.connectedRS = 0; s.log.info('SSE closed'); });
            },
        }
        //if (s.isMainNode) m['POST:/unknown'] = async () => await s.fs.writeFile(selfId, (await parseRqBody(rq)).js);

        if (await s.resolveStatic(rq, rs)) return;
        if (m[rq.mp]) { await m[rq.mp](); return; }
        rs.s('page not found');
    }

    //if (typeof crypto !== 'undefined') console.log(crypto.randomUUID());

    //s.server.close(() => console.log('httpServer stop')); s.server.closeAllConnections();
    //s.server.listen(8080, () => console.log(`httpServer start port: 8080`));
    //if (procNodeId) { console.log(`procNodeId: ${procNodeId}`); await f(procNodeId); return; }

    //delete s.netNodeId;

    // for (let k in s) {
    //     if (s.isUUID(k)) {
    //         continue;
    //     }
    //
    //     console.log(k);
    // }
    // console.log('sep');

    const netLogic = await s.f('f877c6d7-e52a-48fb-b6f7-cf53c9181cc1');
    if (!s.netLogicExecuting) {
        s.netLogicExecuting = 1;
        await netLogic(s.netId);
        s.netLogicExecuting = 0;
    }
})();