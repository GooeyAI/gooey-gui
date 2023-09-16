import { useState, useEffect } from "react";

interface CountdownTimerProps {
    durationInSeconds: number;
    fallbackText: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ durationInSeconds, fallbackText }) => {
    const [seconds, setSeconds] = useState(durationInSeconds);
    const [isComplete, setIsComplete] = useState(false);

    const handleCountdownComplete = () => {
        setIsComplete(true);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (seconds > 0) {
                setSeconds((prevSeconds) => prevSeconds - 1);
            }
        }, 1000);

        if (seconds <= 0) {
            clearInterval(interval);
            handleCountdownComplete();
        }

        return () => clearInterval(interval);
    }, [seconds]);

    return (
        isComplete ? (
            <div>{fallbackText}</div>
        ) : (
            <div style={{ fontSize: 28 }}>{seconds}s left</div>
        )
    );
};

export default CountdownTimer;
