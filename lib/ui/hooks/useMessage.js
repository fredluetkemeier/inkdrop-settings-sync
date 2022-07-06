"use babel";

import { useEffect, useCallback } from "react";
import { cmd } from "../../utils/command";

export default function useMessage(channel, onMessage) {
    useEffect(() => {
        const commandRef = inkdrop.commands.add(
            document.body,
            cmd(channel),
            (event) => console.log(event)
        );

        return () => commandRef.dispose();
    }, [channel, onMessage]);

    const sendMessage = useCallback(
        (message, payload) => {
            inkdrop.commands.dispatch(document.body, cmd(channel), {
                message,
                payload,
            });
        },
        [channel]
    );

    return { sendMessage };
}
