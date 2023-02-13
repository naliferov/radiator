globalThis.s ??= {};
(async s => {
    s.nodeProcess = (await import('node:process')).default;
    s.nodeFS = (await import('node:fs')).promises;
    s.loopDelay = 2000;
    s.replFile = 'srepl.js';
    s.loop = async () => {
        while (1) {
            await new Promise(r => setTimeout(r, s.loopDelay));
            try { eval(await s.nodeFS.readFile(s.replFile, 'utf8')); }
            catch (e) { console.log(e); }
        }
    };
    s.nodeProcess.on('uncaughtException', e => console.error('[[uncaughtException]]', e));
    s.loop();
})(globalThis.s);