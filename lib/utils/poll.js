"use babel";

let cancelTimeout = () => {};
let paused = false;

export function poll() {
    let kill = false;

    return {
        loop: (
            fn,
            delayOrDelayCallback,
            shouldStopPolling = async () => false
        ) =>
            loop(
                fn,
                delayOrDelayCallback,
                async () => kill || (await shouldStopPolling())
            ),
        dispose: () => {
            kill = true;
            cancelTimeout();
        },
        restart: () => cancelTimeout(),
        pause: () => {
            paused = true;
        },
        resume: () => {
            if (!paused) return;

            paused = false;
            cancelTimeout();
        },
    };
}

function loop(fn, delayOrDelayCallback, shouldStopPolling) {
    return new Promise(async (resolve, reject) => {
        do {
            if (!paused) await fn().catch(reject);

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
