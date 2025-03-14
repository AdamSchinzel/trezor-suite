import React from 'react';

import { SettingsLayout } from 'src/components/settings';
import { SettingsSection } from 'src/components/suite/Settings';
import { Translation } from 'src/components/suite';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { isDesktop, isWeb } from '@trezor/env-utils';

import { selectDevice, selectTorState } from 'src/reducers/suite/suiteReducer';
import { selectEnabledNetworks } from 'src/reducers/wallet/settingsReducer';
import { Language } from './Language';
import { Fiat } from './Fiat';
import { Labeling } from './Labeling';
import { DisconnectLabelingProvider } from './DisconnectLabelingProvider';
import { ConnectLabelingProvider } from './ConnectLabelingProvider';
import { Tor } from './Tor';
import { TorOnionLinks } from './TorOnionLinks';
import { Theme } from './Theme';
import { Analytics } from './Analytics';
import { ShowApplicationLog } from './ShowApplicationLog';
import { ClearStorage } from './ClearStorage';
import { VersionWithUpdate } from './VersionWithUpdate';
import { EarlyAccess } from './EarlyAccess';
import { BitcoinAmountUnit } from './BitcoinAmountUnit';
import { NETWORKS } from 'src/config/wallet';
import { DesktopSuiteBanner } from './DesktopSuiteBanner';

export const SettingsGeneral = () => {
    const isPromoHidden = useSelector(state => state.suite.settings.isDesktopSuitePromoHidden);
    const { isTorEnabled } = useSelector(selectTorState);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const desktopUpdate = useSelector(state => state.desktopUpdate);
    const metadata = useSelector(state => state.metadata);
    const device = useSelector(selectDevice);

    const { isMobileLayout } = useLayoutSize();

    const hasBitcoinNetworks = NETWORKS.some(
        ({ symbol, features }) =>
            enabledNetworks.includes(symbol) && features?.includes('amount-unit'),
    );

    const isMetadataEnabled = metadata.enabled && !metadata.initiating;
    const isProviderConnected =
        metadata.enabled && device?.metadata.status === 'enabled' && !!metadata.provider;

    return (
        <SettingsLayout data-test="@settings/index">
            {isWeb() && !isMobileLayout && !isPromoHidden && <DesktopSuiteBanner />}

            <SettingsSection title={<Translation id="TR_LOCALIZATION" />} icon="FLAG">
                <Language />
                <Fiat />
                {hasBitcoinNetworks && <BitcoinAmountUnit />}
            </SettingsSection>

            <SettingsSection title={<Translation id="TR_LABELING" />} icon="TAG_MINIMAL">
                <Labeling />
                {isMetadataEnabled &&
                    (isProviderConnected ? (
                        <DisconnectLabelingProvider />
                    ) : (
                        <ConnectLabelingProvider />
                    ))}
            </SettingsSection>

            {(isDesktop() || (isWeb() && isTorEnabled)) && (
                <SettingsSection title={<Translation id="TR_TOR" />} icon="TOR_MINIMAL">
                    {isDesktop() && <Tor />}
                    {isTorEnabled && <TorOnionLinks />}
                </SettingsSection>
            )}

            <SettingsSection title={<Translation id="TR_APPLICATION" />} icon="APP">
                <Theme />
                <Analytics />
                <ShowApplicationLog />
                <ClearStorage />
                <VersionWithUpdate />
            </SettingsSection>

            {desktopUpdate.enabled && (
                <SettingsSection
                    title={<Translation id="TR_EXPERIMENTAL_FEATURES" />}
                    icon="EXPERIMENTAL"
                >
                    <EarlyAccess />
                </SettingsSection>
            )}
        </SettingsLayout>
    );
};
