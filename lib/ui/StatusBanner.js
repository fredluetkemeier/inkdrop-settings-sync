"use babel";

import React from "react";
import { statuses } from "../sync";

export default function StatusBanner() {
    const [status, setStatus] = useState(statuses.NEEDS_AUTH);

    return (
        <div
            style={{
                padding: "10px 16px",
                borderTop: "var(--sidebar-sync-status-view-border-top)",
                display: "flex",
                justifyContent: "space-between",
            }}
        >
            <span
                style={{
                    fontSize: "12px",
                    color: "var(--sidebar-menu-section-color)",
                    display: "inline-flex",
                    alignItems: "center",
                }}
            >
                Settings Sync
            </span>
            <div
                style={{
                    background:
                        "linear-gradient(90deg, rgba(134,0,217,1) 0%, rgba(0,62,215,1) 100%)",
                    padding: "0px 4px",
                    borderRadius: "8px",
                    fontSize: "10px",
                }}
            >
                Syncing
            </div>
        </div>
    );
}
