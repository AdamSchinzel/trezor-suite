import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { Dropdown, DropdownRef, CoinLogo, variables } from '@trezor/components';
import { Translation, StatusLight } from 'src/components/suite';
import { ActionItem } from './ActionItem';
import { useActions, useSelector } from 'src/hooks/suite';
import { goto as gotoAction } from 'src/actions/suite/routerActions';
import { openModal as openModalAction } from 'src/actions/suite/modalActions';

import { BlockchainState } from '@suite-common/wallet-core';
import type { CustomBackend } from 'src/types/wallet';

const Wrapper = styled.div`
    margin-left: 8px;
    position: relative;
`;

const RowWrapper = styled.div`
    display: flex;
    width: 260px;
    align-items: center;
    > * + * {
        margin-left: 8px;
    }
    > div:nth-child(2) {
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-left: 8px;
        overflow: hidden;
        > span:first-child {
            font-weight: ${variables.FONT_WEIGHT.MEDIUM};
            font-size: ${variables.FONT_SIZE.NORMAL};
            overflow: hidden;
            text-overflow: ellipsis;
        }
        > span:last-child {
            font-weight: ${variables.FONT_WEIGHT.MEDIUM};
            font-size: ${variables.FONT_SIZE.SMALL};
            color: ${props => props.theme.TYPE_LIGHT_GREY};
            text-transform: capitalize;
        }
    }
`;

const BackendRow = ({
    backend: { coin, type },
    blockchain,
}: {
    backend: CustomBackend;
    blockchain: BlockchainState;
}) => {
    const chain = blockchain[coin];
    return (
        <RowWrapper>
            <CoinLogo symbol={coin} />
            <div>
                {chain?.url ? (
                    <span>{chain.url}</span>
                ) : (
                    <Translation id="TR_BACKEND_DISCONNECTED" />
                )}
                <span>{type}</span>
            </div>
            <StatusLight status={chain?.connected ? 'ok' : 'error'} />
        </RowWrapper>
    );
};

const DefaultBackendsLabel = styled.div`
    white-space: normal;
`;

type NavBackendsProps = {
    customBackends: CustomBackend[];
};

export const NavBackends = ({ customBackends }: NavBackendsProps) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<DropdownRef>();
    const { blockchain } = useSelector(state => ({
        blockchain: state.wallet.blockchain,
    }));
    const { goto, openModal } = useActions({
        goto: gotoAction,
        openModal: openModalAction,
    });

    return (
        <Wrapper>
            <Dropdown
                onToggle={() => setOpen(!open)}
                ref={dropdownRef}
                alignMenu="right"
                offset={4}
                topPadding={0}
                minWidth={230}
                masterLink={{
                    callback: () => goto('settings-coins'),
                    label: <Translation id="TR_MANAGE" />,
                    icon: 'ARROW_RIGHT_LONG',
                }}
                items={[
                    {
                        key: 'backends',
                        label: <Translation id="TR_BACKENDS" />,
                        options: customBackends.map(backend => ({
                            key: backend.coin,
                            label: <BackendRow backend={backend} blockchain={blockchain} />,
                            callback: () =>
                                openModal({
                                    type: 'advanced-coin-settings',
                                    coin: backend.coin,
                                }),
                        })),
                    },
                    {
                        key: 'note',
                        options: [
                            {
                                key: '1',
                                label: (
                                    <DefaultBackendsLabel>
                                        <Translation id="TR_OTHER_COINS_USE_DEFAULT_BACKEND" />
                                    </DefaultBackendsLabel>
                                ),
                                noHover: true,
                                isDisabled: true,
                                separatorBefore: true,
                            },
                        ],
                    },
                ]}
            >
                <ActionItem
                    label={<Translation id="TR_BACKENDS" />}
                    icon="BACKEND"
                    isOpen={open}
                    indicator="check"
                />
            </Dropdown>
        </Wrapper>
    );
};
