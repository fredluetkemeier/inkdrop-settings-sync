"use babel";

import React, { useEffect, useState } from "react";
import open from "open";
import { getVerificationCode, getAccessToken } from "../api/github-oauth";
import { gistClient } from "../api/gist-client";
import { store } from "../store";
import { cmd } from "../command";

import keys from "../keys.json";

const CLIENT_ID = "4e584ae2beef0baad913";
const STEPS = {
    Welcome: "Welcome",
    GithubAuth: "GithubAuth",
};

export const commands = {
    ready: cmd("welcome-modal:ready"),
    show: cmd("welcome-modal:show"),
    tokenSet: cmd("welcome-modal:tokenSet"),
};

export default function WelcomeDialog(props) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(STEPS.Welcome);

    const { Dialog } = inkdrop.components.classes;

    useEffect(() => {
        const showCmd = inkdrop.commands.add(document.body, {
            [commands.show]: () => setIsOpen(true),
        });

        inkdrop.commands.dispatch(document.body, commands.ready);

        return () => showCmd.dispose();
    }, []);

    const handleNext = () => {
        const nextStep = getNextStep(step);
        setStep(nextStep);
    };

    return (
        <Dialog
            className="large"
            visible={isOpen}
            onBackdropClick={() => setIsOpen(false)}
        >
            <Dialog.Title>Settings Sync</Dialog.Title>
            <Dialog.Content>
                <Step step={step} />
            </Dialog.Content>
            <Dialog.Actions>
                <button className="ui button" onClick={handleNext}>
                    <span>Next</span>
                </button>
            </Dialog.Actions>
        </Dialog>
    );
}

function getNextStep(currentStep) {
    switch (currentStep) {
        case STEPS.Welcome:
            return STEPS.GithubAuth;
        default:
            return STEPS.Welcome;
    }
}

function Step({ step }) {
    switch (step) {
        case STEPS.Welcome:
            return <Welcome />;
        case STEPS.GithubAuth:
            return (
                <GithubAuth
                    onComplete={() => {
                        store.set(keys.hasBeenWelcomed, true);
                    }}
                />
            );
        default:
            return <Welcome />;
    }
}

function Welcome() {
    return (
        <div>
            <p>Let's get you signed into GitHub.</p>
            <p>
                <strong>Settings Sync</strong> uses a GitHub Gist to store your
                settings files.
            </p>
        </div>
    );
}

function GithubAuth({ onComplete }) {
    const [code, setCode] = useState();
    const [isAuthed, setIsAuthed] = useState();

    useEffect(() => {
        getVerificationCode(CLIENT_ID).then(
            ({
                device_code,
                expires_in,
                interval,
                user_code,
                verification_uri,
            }) => {
                setCode(user_code);

                open(verification_uri);

                getAccessToken({
                    clientId: CLIENT_ID,
                    deviceCode: device_code,
                    interval,
                }).then((token) => {
                    setIsAuthed(token);
                    store.set(keys.githubAccessToken, token);
                    inkdrop.commands.dispatch(document.body, commands.tokenSet);

                    onComplete();
                });
            }
        );
    }, []);

    return isAuthed ? (
        <div>
            <span
                style={{
                    textAlign: "center",
                    fontSize: "30px",
                    fontWeight: "bold",
                }}
            >
                All set!
            </span>
        </div>
    ) : (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-around",
                alignItems: "center",
            }}
        >
            <h3 style={{ flex: "auto", textAlign: "center" }}>Your code:</h3>
            <span
                style={{
                    textAlign: "center",
                    fontSize: "30px",
                    fontWeight: "bold",
                }}
            >
                {code}
            </span>
        </div>
    );
}

// async function createEmptyGist() {
//     const { id } = await gistClient
//         .create(accessToken, {
//             files: {},
//             description: "test",
//             isPublic: false,
//         })
//         .then((res) => {
//             console.log(res);

//             return res;
//         });
// }