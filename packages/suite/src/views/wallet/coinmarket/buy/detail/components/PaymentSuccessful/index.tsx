import * as routerActions from 'src/actions/suite/routerActions';
import React from 'react';
import styled from 'styled-components';
import { Button, variables, Image } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useActions } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

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
    margin: 17px 0 30px 0;
    max-width: 310px;
    text-align: center;
`;

interface Props {
    account: Account;
}

const PaymentSuccessful = ({ account }: Props) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    return (
        <Wrapper>
            <Image image="COINMARKET_SUCCESS" />
            <Title>
                <Translation id="TR_BUY_DETAIL_SUCCESS_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_BUY_DETAIL_SUCCESS_TEXT" />
            </Description>
            <Button
                onClick={() =>
                    goto('wallet-coinmarket-buy', {
                        params: {
                            symbol: account.symbol,
                            accountIndex: account.index,
                            accountType: account.accountType,
                        },
                    })
                }
            >
                <Translation id="TR_BUY_DETAIL_SUCCESS_BUTTON" />
            </Button>
        </Wrapper>
    );
};

export default PaymentSuccessful;
