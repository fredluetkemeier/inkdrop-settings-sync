"use babel";

export function poll() {
    let kill = false;

    return {
        dispose: () => (kill = true),
        loop: (fn, delayOrDelayCallback, shouldStopPolling = () => false) =>
            loop(fn, delayOrDelayCallback, () => kill || shouldStopPolling()),
    };
}

function loop(fn, delayOrDelayCallback, shouldStopPolling) {
    return new Promise(async (resolve, _reject) => {
        do {
            await fn();

            const delay =
                typeof delayOrDelayCallback === "number"
                    ? delayOrDelayCallback
                    : delayOrDelayCallback();
            await new Promise((resolve) =>
                setTimeout(resolve, Math.max(0, delay))
            );
        } while (!(await shouldStopPolling()));

        resolve();
    });
}
