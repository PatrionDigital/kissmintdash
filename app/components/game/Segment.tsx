import React from "react";
import { segmentStyle, skewedSegmentStyle } from "./segmentStyle";

type SegmentType = {
    active: boolean;
    color: string;
    size: number;
    id: string;
    skew: boolean;
};

const Segment = ({ active, color, size, id, skew }: SegmentType) => {
    const ss = skew ? skewedSegmentStyle[id] : segmentStyle[id];

    if (!ss) {
        console.error(`react-7-segment-display: Segment style for id "${id}" not found.`);
        return null;
    }

    const outerStyle = {
        filter: active
            ? `drop-shadow(0px 0px ${size * 0.3}px ${color})`
            : "none",
        padding: size * 0.3,
        width: "fit-content",
        position: ss.id ? "absolute" : "relative",
        transform: ss.transform,
        marginTop: `${size * ss.marginTop}px`,
        marginLeft: `${size * ss.marginLeft}px`,
        zIndex: "2",
    } as React.CSSProperties;

    const innerStyle = {
        backgroundColor: color,
        filter: active
            ? "opacity(1) grayscale(0)"
            : "opacity(0.3) grayscale(0.7)",
        color: color,
        clipPath: ss.clipPath,
        WebkitClipPath: ss.clipPath,
        MozClipPath: ss.clipPath,
        height: `${size}px`,
        width: `${size * 5}px`,
    } as React.CSSProperties;

    return (
        <div style={outerStyle}>
            <div style={innerStyle}></div>
        </div>
    );
};

export default Segment;
