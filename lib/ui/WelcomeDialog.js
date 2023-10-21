"use babel";

import React, { useEffect, useState, useCallback } from "react";
import { shell } from "electron";
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

export default function WelcomeDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(STEPS.Welcome);

    const { Dialog } = inkdrop.components.classes;

    useEffect(() => {
        const cmdRef = inkdrop.commands.add(document.body, {
            [commands.show]: () => setIsOpen(true),
        });

        inkdrop.commands.dispatch(document.body, commands.ready);

        return () => cmdRef.dispose();
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
    const [verificationURI, setVerificationURI] = useState();
    const [error, setError] = useState();

    const getCode = () =>
        getVerificationCode(CLIENT_ID).then(
            ({
                device_code,
                expires_in,
                interval,
                user_code,
                verification_uri,
            }) => {
                setCode(user_code);
                setVerificationURI(verification_uri);

                shell.openExternal(verification_uri);

                return getAccessToken({
                    clientId: CLIENT_ID,
                    deviceCode: device_code,
                    interval,
                    expiresIn: expires_in,
                })
                    .then((token) => {
                        store.set(keys.githubAccessToken, token);
                        inkdrop.commands.dispatch(
                            document.body,
                            commands.tokenSet
                        );

                        onComplete();
                    })
                    .catch(setError);
            }
        );

    const handleRetry = useCallback(() => {
        setError(null);
        setCode(null);

        getCode();
    }, []);

    useEffect(() => {
        getCode();
    }, []);

    if (error) return <AuthError error={error} onRetry={handleRetry} />;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                height: "100%",
                gap: "50px",
            }}
        >
            <div>
                <h3 style={{ flex: "auto", textAlign: "center" }}>
                    Your code:
                </h3>
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
            <div
                style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-around",
                    alignItems: "center",
                    gap: "10px",
                }}
            >
                <span>
                    Please copy the above code and paste it into the GitHub
                    sign-in page that just opened.
                </span>
                <p>
                    <span>Don't see a sign-in page? </span>
                    <a href={verificationURI}>Click here.</a>
                </p>
            </div>
        </div>
    );
}

function AuthError({ error, onRetry }) {
    const text =
        error == "expired"
            ? "Your code has expired. Please request another."
            : "Something went wrong. Please try again.";

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                height: "100%",
                gap: "50px",
            }}
        >
            <h3 style={{ flex: "auto", textAlign: "center" }}>{text}</h3>
            <button
                onClick={onRetry}
                style={{
                    background: "black",
                    border: "none",
                    color: "white",
                    borderRadius: "8px",
                    fontSize: "22px",
                    padding: "16px",
                    marginTop: "36px",
                    cursor: "pointer",
                }}
            >
                Get New Code
            </button>
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
