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
})(globalThis.s);