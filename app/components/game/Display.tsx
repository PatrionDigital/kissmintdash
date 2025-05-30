import defaultCharMap, { CharToDigit } from "./charToDigit";
import { Digit } from "./Digit";
import React, { useEffect, useState } from "react";

type DisplayType = {
    count: number;
    height: number;
    value: string | number | null;
    color: string;
    backgroundColor?: string;
    skew: boolean;
    padding: string;
    charMap?: CharToDigit;
};

export const Display = ({
    count = 2,
    height = 250,
    value = null,
    color = "red",
    backgroundColor,
    skew = false,
    padding = "20px",
    charMap = defaultCharMap,
}: DisplayType) => {
    const [digits, setDigits] = useState<string[] | null>([]);

    const style = {
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: "fit-content",
        width: "fit-content",
        padding,
    } as React.CSSProperties;

    const displayStyle = {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "fit-content",
        width: "fit-content",
        backgroundColor: backgroundColor ? backgroundColor : "transparent",
        padding,
        color: "white",
    } as React.CSSProperties;

    useEffect(() => {
        let newDigits: string[] | null = value ? value.toString().split("") : null;

        if (!value || (newDigits && count < newDigits.length)) {
            newDigits = null;
        }

        if (value && newDigits && count > newDigits.length) {
            for (let i = 0; i < count - newDigits.length; i++) {
                newDigits.unshift("0");
            }
        }

        setDigits(newDigits);
    }, [count, value]);

    return (
        <div className="display" style={displayStyle}>
            <div className="display-digits" style={style}>
                {digits
                    ? digits.map((digit, index) => {
                          return (
                              <Digit
                                  key={index}
                                  char={digit}
                                  height={height}
                                  color={color}
                                  skew={skew}
                                  charMap={charMap}
                              />
                          );
                      })
                    : Array.from(Array(count).keys()).map((index) => {
                          return (
                              <Digit
                                  key={index}
                                  char="-"
                                  height={height}
                                  color={color}
                                  skew={skew}
                              />
                          );
                      })}
            </div>
        </div>
    );
};
