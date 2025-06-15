import Segment from "./Segment.jsx";
import React from "react";
import defaultCharMap, { CharToDigit } from "./charToDigit";

const letters = ["A", "B", "C", "D", "E", "F", "G"] as const;
const DEFAULT_CHAR = "-";

const isValidSegmentArray = (arr: unknown): arr is number[] => {
    return Array.isArray(arr) && arr.every((item) => typeof item === "number");
};

type DigitType = {
    char: string;
    color: string;
    height: number;
    skew: boolean;
    charMap?: CharToDigit;
};

export const Digit = ({
    char,
    color = "red",
    height = 250,
    skew = false,
    charMap = defaultCharMap,
}: DigitType) => {
    const style = {
        height: `${height}px`,
        width: `${height * 0.6}px`,
        zIndex: "1",
        padding: skew ? "8px 0px" : "0",
        boxSizing: "border-box",
    } as React.CSSProperties;

    let segmentsToRender: number[];
    const currentMap = charMap || defaultCharMap;
    const charSegments =
        typeof char === "string" && char in currentMap
            ? currentMap[char]
            : undefined;

    if (isValidSegmentArray(charSegments)) {
        segmentsToRender = charSegments;
    } else {
        const fallbackSegments = currentMap[DEFAULT_CHAR];
        if (isValidSegmentArray(fallbackSegments)) {
            segmentsToRender = fallbackSegments;
        } else {
            console.error(
                `react-7-segment-display: Invalid segment data for char "${char}" AND default char "${DEFAULT_CHAR}". Check charMap.`,
            );
            segmentsToRender = [];
        }
    }

    return (
        <div className="digit" style={style}>
            {segmentsToRender.map((active, index) => {
                if (index >= letters.length) {
                    console.warn(
                        `react-7-segment-display: Segment index ${index} out of bounds for letter mapping.`,
                    );
                    return null;
                }
                const letter = letters[index];
                return (
                    <Segment
                        key={letter}
                        active={active === 1}
                        size={height / 12.5}
                        color={color}
                        id={letter}
                        skew={skew}
                    />
                );
            })}
        </div>
    );
};
