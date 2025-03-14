import React, { useRef, useLayoutEffect } from 'react';
import { useTheme } from '@trezor/components';
import { FormattedCryptoAmount } from 'src/components/suite';
import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from 'src/types/wallet';

interface CommonProps {
    setWidth: (n: number) => void;
    [k: string]: any;
}

type CustomYAxisTickProps =
    | ({ localCurrency: string; symbol?: never } & CommonProps)
    | ({ symbol: NetworkSymbol; localCurrency?: never } & CommonProps);

export const CustomYAxisTick = ({
    x,
    y,
    payload,
    setWidth,
    localCurrency,
    symbol,
}: CustomYAxisTickProps) => {
    const { FiatAmountFormatter } = useFormatters();

    const theme = useTheme();
    const ref = useRef<SVGGElement>(null);

    useLayoutEffect(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setWidth(rect.width);
        }
    }, [ref, setWidth]);

    return (
        <g ref={ref} transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={2}
                textAnchor="start"
                fill={theme.TYPE_LIGHT_GREY}
                style={{ fontVariantNumeric: 'tabular-nums' }}
            >
                {localCurrency && (
                    <FiatAmountFormatter
                        value={payload.value}
                        currency={localCurrency}
                        minimumFractionDigits={0}
                    />
                )}

                {symbol && (
                    <FormattedCryptoAmount value={payload.value} symbol={symbol} isRawString />
                )}
            </text>
        </g>
    );
};
