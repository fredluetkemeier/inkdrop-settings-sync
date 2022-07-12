"use babel";

export function poll(
    fn,
    delayOrDelayCallback,
    shouldStopPolling = () => false
) {
    let kill = false;

    loop(fn, delayOrDelayCallback, () => kill || shouldStopPolling());

    return { dispose: () => (kill = true) };
}

async function loop(fn, delayOrDelayCallback, shouldStopPolling) {
    while (!(await shouldStopPolling())) {
        await fn();

        const delay =
            typeof delayOrDelayCallback === "number"
                ? delayOrDelayCallback
                : delayOrDelayCallback();
        await new Promise((resolve) => setTimeout(resolve, Math.max(0, delay)));
    }
}
