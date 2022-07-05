"use babel";

import { useEffect } from "react";

export default function useMessage(channel, onMessage) {
    useEffect(() => {}, []);

    return { sendMessage };
}

function sendMessage(message) {}
