globalThis.s ??= {};
(async s => {
    s.nodeProcess = (await import('node:process')).default;
    s.nodeFS = (await import('node:fs')).promises;
    s.loopDelay = 2000;
    s.replFile = 'srepl.js';
    s.loop = async () => {
        console.log('loop start');
        while (1) {
            await new Promise(r => setTimeout(r, s.loopDelay));
            const js = await s.nodeFS.readFile(s.replFile);
            try { eval(js.toString()); }
            catch (e) { console.log(e); }
        }
    };
    s.nodeProcess.on('uncaughtException', e => console.error('[[uncaughtException]]', e));
    s.loop();
})(globalThis.s);