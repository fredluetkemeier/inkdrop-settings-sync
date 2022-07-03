"use babel";

import React, { useEffect, useState } from "react";
import open from "open";
import { getVerificationCode, getAccessToken } from "../api/github-oauth";
import { store } from "../store";
import { cmd } from "../utils/command";

import keys from "../keys.json";

const CLIENT_ID = "4e584ae2beef0baad913";
const STEPS = {
    Welcome: "Welcome",
    GithubAuth: "GithubAuth",
    Done: "Done",
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
    const handleClose = () => setIsOpen(false);
    const handleComplete = () => setStep(STEPS.Done);

    return (
        <Dialog
            className="large"
            visible={isOpen}
            onBackdropClick={() => setIsOpen(false)}
        >
            <Dialog.Title>Settings Sync</Dialog.Title>
            <Dialog.Content>
                <Step step={step} onComplete={handleComplete} />
            </Dialog.Content>
            <Dialog.Actions>
                <StepButton
                    step={step}
                    onNext={handleNext}
                    onClose={handleClose}
                />
            </Dialog.Actions>
        </Dialog>
    );
}

function getNextStep(currentStep) {
    switch (currentStep) {
        case STEPS.Welcome:
            return STEPS.GithubAuth;
        case STEPS.GithubAuth:
            return STEPS.Done;
        default:
            return STEPS.Welcome;
    }
}

function Step({ step, onComplete }) {
    switch (step) {
        case STEPS.Welcome:
            return <Welcome />;
        case STEPS.GithubAuth:
            return (
                <GithubAuth
                    onComplete={() => {
                        store.set(keys.hasBeenWelcomed, true);
                        onComplete();
                    }}
                />
            );
        case STEPS.Done:
            return <Done />;
        default:
            return <Welcome />;
    }
}

function StepButton({ step, onNext, onClose }) {
    switch (step) {
        case STEPS.Welcome:
            return <NextButton onClick={onNext} />;
        case STEPS.GithubAuth:
            return <></>;
        case STEPS.Done:
            return <CloseButton onClick={onClose} />;
        default:
            return <></>;
    }
}

function NextButton({ onClick }) {
    return (
        <button className="ui button" onClick={onClick}>
            <span>Next</span>
        </button>
    );
}

function CloseButton({ onClick }) {
    return (
        <button className="ui button" onClick={onClick}>
            <span>Close</span>
        </button>
    );
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
                    store.set(keys.githubAccessToken, token);
                    inkdrop.commands.dispatch(document.body, commands.tokenSet);

                    onComplete();
                });
            }
        );
    }, []);

    return (
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

function Done() {
    return (
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
    );
}
