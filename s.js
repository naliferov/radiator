const {Worker, isMainThread, parentPort, workerData} = await import('node:worker_threads');

//add proxy for auto updates
globalThis.s ??= {};
(async(s) => {
    s.nodeProcess = (await import('node:process')).default;
    s.nodeFS = (await import('node:fs')).promises;
    s.loopDelay = 2000;
    s.replFile = 'srepl.js';
    s.loop = async() => {
        console.log('loop start');
        while (1) {
            await new Promise(resolve => setTimeout(resolve, s.loopDelay));
            const js = await s.nodeFS.readFile(s.replFile);
            const r = eval(js.toString());
            if (r instanceof Promise) r.catch(e => console.log('replRejection', e));
        }
    }
    s.loop();
    s.nodeProcess.on('uncaughtException', e => {
        console.error('[[uncaughtException]]', e); s.loop(e);
    });
    s.nodeProcess.on('unhandledRejection', (e) => {
        console.error('[[unhandledRejection]]', e); s.loop();
    });
    return;

    if (0) { //DE
        //s.netProcs.child = new s.httpClient(childUrl);
        s.httpSlicer.x = async (rq, rs) => {
            const m = {
                'GET:/': async () => rs.s(await f('ed85ee2d-0f01-4707-8541-b7f46e79192e'), 'text/html'),
                'GET:/unknown': async () => rs.s(await s.fs.readFile(selfId)),
                'GET:/sw': async () => rs.s(await f('ebac14bb-e6b1-4f6c-95ea-017a44a0cc28'), 'text/javascript'),
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
            if (s.isMainNode) m['POST:/unknown'] = async () => await s.fs.writeFile(selfId, (await parseRqBody(rq)).js);

            if (await resolveStatic(rq, rs)) return;
            if (m[rq.mp]) { await m[rq.mp](); return; }
            rs.s('page not found');
        }
        //runProcManager();

    } else {
        if (!s.netProcs.parent) s.netProcs.parent = new s.httpClient(parentUrl);
        if (procManager && !s.intervalIteration) {
            s.intervalIteration = 1;
            let can = 1, i;

            const runInterval = () => {
                if (i) return;
                i = setInterval(async () => {
                    if (!can) return; can = 0;
                    try { eval(await s.fs.readFile(selfId)); }
                    catch (e) { console.error('try catch', e); }
                    can = 1;
                }, 2000);
            }
            s.p.on('unhandledRejection', e => {
                console.error('unhandledRejection interval err', e);
                clearInterval(i); i = 0;
                can = 1;
                setTimeout(runInterval, 500);
            });
            runInterval();
            return;
        }
    }

    if (!s.server) {
        s.stup = async up => {
            if (DE && s.isMainNode && up.m === '/k' && up.k === 'js' && up.v) {
                await s.fs.writeFile(`scripts/${up.nodeId}.js`, up.v);
            }
            await (await f('03454982-4657-44d0-a21a-bb034392d3a6'))(up, s.updateIds, s.netNodes, s.netProcs, f, s.triggerDump);
        }
        s.server = (await import('node:http')).createServer(async (rq, rs) => {
            (await f('4b60621c-e75a-444a-a36e-f22e7183fc97'))({
                rq, rs, httpHandler: s.httpSlicer, stup: s.stup, st: s.st, updatePermit: s.isMainNode
            });
        });
        s.server.listen(port, () => console.log(`httpServer start port: ${port}`));
    }

    if (!s.intervalIteration) return;
    if (procNodeId) { console.log(`procNodeId: ${procNodeId}`); await f(procNodeId); return; }

    const netNodesLogic = await f('f877c6d7-e52a-48fb-b6f7-cf53c9181cc1');
    await netNodesLogic(netNodeId);
})(globalThis.s);