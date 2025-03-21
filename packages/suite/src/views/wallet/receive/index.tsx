import React from 'react';

import { WalletLayout, WalletLayoutHeader } from 'src/components/wallet';
import { useDevice, useSelector, useActions } from 'src/hooks/suite';
import * as receiveActions from 'src/actions/wallet/receiveActions';

import { selectPendingAccountAddresses } from '@suite-common/wallet-core';
import { selectDevice } from 'src/reducers/suite/suiteReducer';

import { FreshAddress } from './components/FreshAddress';
import { UsedAddresses } from './components/UsedAddresses';
import { CoinjoinReceiveWarning } from './components/CoinjoinReceiveWarning';

const Receive = () => {
    const isCoinjoinReceiveWarningHidden = useSelector(
        state => state.suite.settings.isCoinjoinReceiveWarningHidden,
    );
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const receive = useSelector(state => state.wallet.receive);
    const device = useSelector(selectDevice);

    const { showAddress } = useActions({
        showAddress: receiveActions.showAddress,
    });

    const { account } = selectedAccount;

    const pendingAddresses = useSelector(state =>
        selectPendingAccountAddresses(state, account?.key ?? null),
    );

    const { isLocked } = useDevice();

    const isDeviceLocked = isLocked(true);

    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_RECEIVE" account={selectedAccount} />;
    }

    const disabled = !!device.authConfirm;
    const showCexWarning = account?.accountType === 'coinjoin' && !isCoinjoinReceiveWarningHidden;

    return (
        <WalletLayout title="TR_NAV_RECEIVE" account={selectedAccount}>
            <WalletLayoutHeader title="TR_NAV_RECEIVE" />

            {showCexWarning && <CoinjoinReceiveWarning />}

            <FreshAddress
                account={account}
                addresses={receive}
                showAddress={showAddress}
                disabled={disabled}
                locked={isDeviceLocked}
                pendingAddresses={pendingAddresses}
            />

            <UsedAddresses
                account={account}
                addresses={receive}
                showAddress={showAddress}
                locked={isDeviceLocked}
                pendingAddresses={pendingAddresses}
            />
        </WalletLayout>
    );
};

export default Receive;
