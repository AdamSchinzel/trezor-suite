import React from 'react';

import styled from 'styled-components';
import { getUnixTime } from 'date-fns';
import { Account } from 'src/types/wallet';
import { TransactionsGraph, Translation, HiddenPlaceholder } from 'src/components/suite';
import { useSelector, useActions } from 'src/hooks/suite';
import * as graphActions from 'src/actions/wallet/graphActions';
import { RangeSelector } from 'src/components/suite/TransactionsGraph/components/RangeSelector';

import { calcTicks, calcTicksFromData } from '@suite-common/suite-utils';
import { variables, Button, Card } from '@trezor/components';

import { TransactionSummaryDropdown } from './TransactionSummaryDropdown';
import { SummaryCards } from './SummaryCards';
import {
    aggregateBalanceHistory,
    getMinMaxValueFromData,
} from '../../../../utils/wallet/graphUtils';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const ContentWrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const GraphWrapper = styled(Card)`
    flex-direction: row;
    display: flex;
    padding: 14px 16px;
    height: 320px;
`;

const Actions = styled.div`
    display: flex;
    margin-bottom: 20px;
    justify-content: space-between;
    align-items: center;
`;

const ErrorMessage = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 240px;
    padding: 20px;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${props => props.theme.STROKE_GREY};
    margin: 24px 0px;
`;

interface TransactionSummaryProps {
    account: Account;
}

export const TransactionSummary = ({ account }: TransactionSummaryProps) => {
    const { graph, localCurrency } = useSelector(state => ({
        graph: state.wallet.graph,
        localCurrency: state.wallet.settings.localCurrency,
    }));
    const { updateGraphData, getGraphDataForInterval } = useActions({
        updateGraphData: graphActions.updateGraphData,
        getGraphDataForInterval: graphActions.getGraphDataForInterval,
    });

    const { selectedRange } = graph;

    const onRefresh = () => {
        updateGraphData([account]);
    };

    const onSelectedRange = () => {
        updateGraphData([account], { newAccountsOnly: true });
    };

    const intervalGraphData = getGraphDataForInterval({ account });
    const data = intervalGraphData[0]?.data
        ? aggregateBalanceHistory(intervalGraphData, selectedRange.groupBy, 'account')
        : [];

    const error = intervalGraphData[0]?.error ?? false;
    const isLoading = intervalGraphData[0]?.isLoading ?? false;

    // aggregate values from shown graph data
    const minMaxValues = getMinMaxValueFromData(
        data,
        'account',
        d => d.sent,
        d => d.received,
        d => d.balance,
    );

    const xTicks =
        selectedRange.label === 'all'
            ? calcTicksFromData(data).map(getUnixTime)
            : calcTicks(selectedRange.startDate, selectedRange.endDate).map(getUnixTime);

    // Interval shown in InfoCard below the graph
    // For 'all' range pick first and last datapoint's timestamps
    // For other intervals do same date calculation as in calcTicks func
    const dataInterval: [number, number] =
        selectedRange.label === 'all'
            ? [
                  intervalGraphData[0]?.data[0]?.time,
                  intervalGraphData[0]?.data[intervalGraphData[0].data.length - 1]?.time,
              ]
            : [getUnixTime(selectedRange.startDate), getUnixTime(selectedRange.endDate)];

    return (
        <Wrapper>
            <Actions>
                <RangeSelector onSelectedRange={onSelectedRange} align="left" />
                <TransactionSummaryDropdown />
            </Actions>
            <ContentWrapper>
                {error ? (
                    <GraphWrapper>
                        <ErrorMessage>
                            <Translation id="TR_COULD_NOT_RETRIEVE_DATA" />
                            <Button onClick={onRefresh} icon="REFRESH" variant="tertiary">
                                <Translation id="TR_RETRY" />
                            </Button>
                        </ErrorMessage>
                    </GraphWrapper>
                ) : (
                    <HiddenPlaceholder intensity={7}>
                        <GraphWrapper>
                            <TransactionsGraph
                                hideToolbar
                                variant="one-asset"
                                xTicks={xTicks}
                                account={account}
                                isLoading={isLoading}
                                data={data}
                                minMaxValues={minMaxValues}
                                localCurrency={localCurrency}
                                onRefresh={onRefresh}
                                selectedRange={selectedRange}
                                receivedValueFn={data => data.received}
                                sentValueFn={data => data.sent}
                                balanceValueFn={data => data.balance}
                            />
                        </GraphWrapper>
                    </HiddenPlaceholder>
                )}

                <SummaryCards
                    selectedRange={selectedRange}
                    dataInterval={dataInterval}
                    data={data}
                    localCurrency={localCurrency}
                    symbol={account.symbol}
                    isLoading={isLoading}
                />
            </ContentWrapper>
            <Divider />
        </Wrapper>
    );
};
