import React from 'react';
import styled from 'styled-components';
import { Icon, useTheme, variables, CoinLogo, H3 } from '@trezor/components';
import { Translation, FormattedDateWithBullet } from 'src/components/suite';
import { WalletAccountTransaction, Network } from 'src/types/wallet';
import {
    isTxFinal,
    getTxIcon,
    isPending,
    getFeeUnits,
    getFeeRate,
} from '@suite-common/wallet-utils';
import { TransactionHeader } from 'src/components/wallet/TransactionItem/components/TransactionHeader';
import { fromWei } from 'web3-utils';
import { IOAddress } from './IOAddress';

const Wrapper = styled.div`
    background-color: ${({ theme }) => theme.BG_GREY};
    padding: 18px;
    border-radius: 8px;
`;

const Confirmations = styled.div`
    display: flex;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StatusWrapper = styled.div`
    display: flex;
    height: 20px;
    align-items: center;
`;

const HeaderFirstRow = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-template-columns: minmax(55px, 70px) auto auto;
    align-items: center;
    padding-bottom: 28px;
    padding-right: 6px;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    ${variables.SCREEN_QUERY.MOBILE} {
        grid-template-columns: 55px 1fr fit-content(15px);
    }
`;

const Grid = styled.div<{ showRbfCols?: boolean }>`
    display: grid;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    grid-gap: 12px;
    grid-template-columns: 105px minmax(0, 2.5fr) 90px minmax(0, 2.5fr); /* title value title value */
    font-size: ${variables.NEUE_FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 28px 6px 10px 6px;
    text-align: left;
    align-items: center;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        grid-template-columns: 110px minmax(0, 1fr);
    }
`;

const Title = styled.div`
    display: inline-flex;
    text-align: left;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    align-items: center;
`;

const Value = styled.div`
    display: inline-flex;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    overflow: hidden;
    text-overflow: ellipsis;
    font-variant-numeric: tabular-nums;
`;

const TxidValue = styled.div`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const IconWrapper = styled.div`
    background-color: ${({ theme }) => theme.BG_WHITE};
    border-radius: 100px;
    display: flex;
    align-items: center;
    justify-content: center;

    > svg {
        margin: 0 auto;
        display: block;
    }
`;

const MainIconWrapper = styled(IconWrapper)`
    width: 54px;
    height: 54px;
    position: relative;
`;

const NestedIconWrapper = styled(IconWrapper)`
    width: 18px;
    height: 18px;
    position: absolute;
    top: 0px;
    right: 0px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
`;

const TxStatus = styled.div`
    text-align: left;
    overflow: hidden;
`;

const ConfirmationStatusWrapper = styled.div`
    align-items: center;
    display: inline-grid;
    justify-content: flex-end;
`;

const TxSentStatus = styled(H3)`
    overflow: hidden;
    text-overflow: ellipsis;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const ConfirmationStatus = styled.div<{ confirmed: boolean; tiny?: boolean }>`
    color: ${({ confirmed, theme }) => (confirmed ? theme.TYPE_GREEN : theme.TYPE_ORANGE)};
    font-weight: ${({ tiny }) =>
        tiny ? variables.FONT_WEIGHT.MEDIUM : variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${({ tiny }) =>
        tiny ? variables.NEUE_FONT_SIZE.TINY : variables.NEUE_FONT_SIZE.SMALL};
`;

const Circle = styled.div`
    margin-left: 5px;
    margin-right: 5px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Timestamp = styled.span`
    white-space: nowrap;
`;

const StyledIcon = styled(Icon)`
    margin-right: 6px;
`;

const IconPlaceholder = styled.span`
    min-width: 10px;
    margin-right: 6px;
`;

interface BasicDetailsProps {
    tx: WalletAccountTransaction;
    network: Network;
    confirmations: number;
    explorerUrl: string;
}

export const BasicDetails = ({ tx, confirmations, network, explorerUrl }: BasicDetailsProps) => {
    const theme = useTheme();
    const isConfirmed = confirmations > 0;
    const isFinal = isTxFinal(tx, confirmations);

    return (
        <Wrapper>
            <HeaderFirstRow>
                <MainIconWrapper>
                    <CoinLogo symbol={tx.symbol} size={48} />

                    <NestedIconWrapper>
                        <Icon
                            size={14}
                            color={tx.type === 'failed' ? theme.TYPE_RED : theme.TYPE_DARK_GREY}
                            icon={getTxIcon(tx.type)}
                        />
                    </NestedIconWrapper>
                </MainIconWrapper>

                <TxStatus>
                    <TxSentStatus>
                        <TransactionHeader transaction={tx} isPending={isPending(tx)} />
                    </TxSentStatus>
                </TxStatus>

                <ConfirmationStatusWrapper>
                    {isConfirmed ? (
                        <StatusWrapper>
                            <ConfirmationStatus confirmed>
                                <Translation id="TR_CONFIRMED_TX" />
                            </ConfirmationStatus>
                            <Circle>&bull;</Circle>

                            {confirmations && (
                                <Confirmations>
                                    <Translation
                                        id="TR_TX_CONFIRMATIONS"
                                        values={{ confirmationsCount: confirmations }}
                                    />
                                </Confirmations>
                            )}
                        </StatusWrapper>
                    ) : (
                        <ConfirmationStatus confirmed={false}>
                            <Translation id="TR_UNCONFIRMED_TX" />
                        </ConfirmationStatus>
                    )}
                </ConfirmationStatusWrapper>
            </HeaderFirstRow>

            <Grid>
                {/* MINED TIME */}
                <Title>
                    <StyledIcon icon="CALENDAR" size={10} />
                    {isConfirmed ? (
                        <Translation id="TR_MINED_TIME" />
                    ) : (
                        <Translation id="TR_FIRST_SEEN" />
                    )}
                </Title>

                <Value>
                    {tx.blockTime ? (
                        <Timestamp>
                            <FormattedDateWithBullet
                                value={new Date(tx.blockTime * 1000)}
                                timeLightColor
                            />
                        </Timestamp>
                    ) : (
                        <Translation id="TR_UNKNOWN_CONFIRMATION_TIME" />
                    )}
                </Value>

                {/* TX ID */}
                <Title>
                    <StyledIcon icon="FINGERPRINT" size={10} />
                    <Translation id="TR_TXID" />
                </Title>

                <TxidValue>
                    <IOAddress txAddress={tx.txid} explorerUrl={explorerUrl} />
                </TxidValue>

                {network.networkType === 'bitcoin' && (
                    <>
                        {/* Fee level */}
                        <Title>
                            <StyledIcon icon="GAS" size={10} />
                            <Translation id="TR_FEE_RATE" />
                        </Title>

                        <Value>
                            {/* tx.feeRate was added in @trezor/blockchain-link 2.1.5 meaning that users 
                            might have locally saved old transactions without this field. since we 
                            cant reliably migrate this data, we are keeping old way of displaying feeRate in place */}
                            {`${tx?.feeRate ? tx.feeRate : getFeeRate(tx)} ${getFeeUnits(
                                'bitcoin',
                            )}`}
                        </Value>

                        {/* RBF Status */}
                        <Title>
                            <Translation id="TR_RBF_STATUS" />
                        </Title>

                        <Value>
                            <ConfirmationStatus confirmed={isFinal} tiny>
                                <Translation
                                    id={isFinal ? 'TR_RBF_STATUS_FINAL' : 'TR_RBF_STATUS_NOT_FINAL'}
                                />
                            </ConfirmationStatus>
                        </Value>
                    </>
                )}

                {/* Ethereum */}
                {tx.ethereumSpecific && (
                    <>
                        <Title>
                            <StyledIcon icon="GAS" size={10} />
                            <Translation id="TR_GAS_LIMIT" />
                        </Title>
                        <Value>{tx.ethereumSpecific.gasLimit}</Value>

                        <Title>
                            <StyledIcon icon="GAS" size={10} />
                            <Translation id="TR_GAS_USED" />
                        </Title>
                        <Value>
                            {tx.ethereumSpecific.gasUsed ? (
                                tx.ethereumSpecific.gasUsed
                            ) : (
                                <Translation id="TR_BUY_STATUS_PENDING" />
                            )}
                        </Value>

                        <Title>
                            <StyledIcon icon="GAS" size={10} />
                            <Translation id="TR_GAS_PRICE" />
                        </Title>
                        <Value>{`${fromWei(tx.ethereumSpecific.gasPrice, 'gwei')} ${getFeeUnits(
                            'ethereum',
                        )}`}</Value>

                        <Title>
                            <IconPlaceholder>#</IconPlaceholder>
                            <Translation id="TR_NONCE" />
                        </Title>
                        <Value>{tx.ethereumSpecific.nonce}</Value>
                    </>
                )}
            </Grid>
        </Wrapper>
    );
};
