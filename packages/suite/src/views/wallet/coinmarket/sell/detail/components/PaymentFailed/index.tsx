import * as routerActions from 'src/actions/suite/routerActions';
import React from 'react';
import styled from 'styled-components';
import { Button, variables, Link, Image } from '@trezor/components';
import { CoinmarketTransactionId } from 'src/components/wallet';
import { useActions } from 'src/hooks/suite/useActions';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite/Translation';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px 60px 20px;
    flex-direction: column;
`;

const Title = styled.div`
    margin-top: 25px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Description = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 17px 0 10px 0;
    max-width: 310px;
    text-align: center;
`;

const StyledLink = styled(Link)`
    margin-top: 30px;
    margin-bottom: 30px;
`;

interface Props {
    transactionId?: string;
    supportUrl?: string;
    account: Account;
}

const PaymentFailed = ({ transactionId, supportUrl, account }: Props) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    return (
        <Wrapper>
            <Image image="UNI_ERROR" />
            <Title>
                <Translation id="TR_SELL_DETAIL_ERROR_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_SELL_DETAIL_ERROR_TEXT" />
            </Description>
            {transactionId && <CoinmarketTransactionId transactionId={transactionId} />}
            {supportUrl && (
                <StyledLink href={supportUrl} target="_blank">
                    <Button variant="tertiary">
                        <Translation id="TR_SELL_DETAIL_ERROR_SUPPORT" />
                    </Button>
                </StyledLink>
            )}
            <Button
                onClick={() =>
                    goto('wallet-coinmarket-sell', {
                        params: {
                            symbol: account.symbol,
                            accountIndex: account.index,
                            accountType: account.accountType,
                        },
                    })
                }
            >
                <Translation id="TR_SELL_DETAIL_ERROR_BUTTON" />
            </Button>
        </Wrapper>
    );
};

export default PaymentFailed;
