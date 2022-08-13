"use babel";

import React, { useState, useEffect } from "react";
import statuses from "../sync-statuses.json";
import { cmd } from "../utils/command";
import { store } from "../store";
import { commands as welcomeCmds } from "./WelcomeDialog";

import keys from "../keys.json";

export const commands = {
    needsAuth: cmd("status-banner:needsAuth"),
    synced: cmd("status-banner:synced"),
    syncing: cmd("status-banner:syncing"),
    error: cmd("status-banner:error"),
};

export default function StatusBanner() {
    const initialStatus = store.exists(keys.githubAccessToken)
        ? statuses.synced
        : statuses.needsAuth;
    const [status, setStatus] = useState(initialStatus);

    useEffect(() => {
        const cmdRef = inkdrop.commands.add(document.body, {
            [commands.needsAuth]: () => setStatus(statuses.needsAuth),
            [commands.synced]: () => setStatus(statuses.synced),
            [commands.syncing]: () => setStatus(statuses.syncing),
            [commands.error]: () => setStatus(statuses.error),
        });

        return () => cmdRef.dispose();
    }, []);

    return (
        <div className="sync-banner">
            <span className="sync-banner-text">Settings Sync</span>
            {!!status ? <StatusLabel status={status} /> : <></>}
        </div>
    );
}

function StatusLabel({ status }) {
    const { className, text, onClick = () => {} } = getStatusInfo(status);

    return (
        <div
            // style={{
            //     padding: "0px 4px",
            //     borderRadius: "8px",
            //     fontSize: "10px",
            //     fontWeight: "bold",
            //     ...style,
            // }}
            onClick={onClick}
            className={`status ${className}`}
        >
            {text}
        </div>
    );
}

function getStatusInfo(status) {
    if (status == statuses.needsAuth)
        return {
            // style: {
            //     background: "transparent",
            //     border: "1px solid #f5cc00",
            //     color: "#f5cc00",
            //     cursor: "pointer",
            // },
            className: "auth-needed",
            text: "Auth Needed",
            onClick: () => {
                inkdrop.commands.dispatch(document.body, welcomeCmds.show);
            },
        };
    if (status == statuses.syncing)
        return {
            // style: {
            //     background:
            //         "linear-gradient(90deg, rgba(134,0,217,1) 0%, rgba(0,62,215,1) 100%)",
            // },
            className: "syncing",
            text: "Syncing",
        };
    if (status == statuses.synced)
        return {
            // style: {
            //     background:
            //         "linear-gradient(90deg, rgba(36,200,0,1) 0%, rgba(0,196,193,1) 100%)",
            //     color: "#000",
            // },
            className: "synced",
            text: "Synced",
        };
    if (status == statuses.error)
        return {
            // style: {
            //     background: "transparent",
            //     border: "1px solid #c80000",
            //     color: "#c80000",
            // },
            className: "error",
            text: "Error",
        };
}
