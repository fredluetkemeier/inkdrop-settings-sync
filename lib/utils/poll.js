"use babel";

let cancelTimeout = () => {};

export function poll() {
    let kill = false;

    return {
        dispose: () => {
            kill = true;
            cancelTimeout();
        },
        loop: (fn, delayOrDelayCallback, shouldStopPolling = () => false) =>
            loop(fn, delayOrDelayCallback, () => kill || shouldStopPolling()),
        cancelTimeout: () => cancelTimeout(),
    };
}

function loop(fn, delayOrDelayCallback, shouldStopPolling) {
    return new Promise(async (resolve, reject) => {
        do {
            await fn().catch(reject);

            if (await shouldStopPolling()) break;

            const delay =
                typeof delayOrDelayCallback === "number"
                    ? delayOrDelayCallback
                    : delayOrDelayCallback();
            await new Promise((resolve) => {
                const timeoutRef = setTimeout(() => {
                    cancelTimeout = () => {};
                    resolve();
                }, Math.max(0, delay));

                cancelTimeout = () => {
                    clearTimeout(timeoutRef);
                    resolve();
                };
            });
        } while (!(await shouldStopPolling()));

        resolve();
    });
}
