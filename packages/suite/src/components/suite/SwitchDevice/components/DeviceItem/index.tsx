import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { useTheme, variables, Icon, Image, motionAnimation } from '@trezor/components';
import { Translation } from 'src/components/suite';
import * as deviceUtils from 'src/utils/suite/device';
import { useSelector, useActions } from 'src/hooks/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { OpenGuideFromTooltip } from 'src/components/guide';

import { WalletInstance } from '../WalletInstance';
import ColHeader from './components/ColHeader';
import AddWalletButton from './components/AddWalletButton';
import DeviceHeaderButton from './components/DeviceHeaderButton';

import type { TrezorDevice, AcquiredDevice, ForegroundAppProps } from 'src/types/suite';
import type { getBackgroundRoute } from 'src/utils/suite/router';
import { getDeviceModel } from '@trezor/device-utils';

const DeviceWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;

    & + & {
        margin-top: 50px;
    }
`;

const Device = styled.div`
    display: flex;
    align-items: center;
`;

const DeviceTitle = styled.span`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const DeviceStatus = styled.span<{ color: string }>`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: 600;
    text-transform: uppercase;
    color: ${props => props.color};
    margin-bottom: 2px;
`;

const DeviceActions = styled.div`
    display: flex;
    align-items: center;
    margin-left: 20px;
`;

const Col = styled.div<{ grow?: number }>`
    display: flex;
    flex-grow: ${props => props.grow || 0};
    align-items: flex-start;
    flex-direction: column;
`;

const WalletsWrapper = styled.div<{ enabled: boolean }>`
    opacity: ${props => (props.enabled ? 1 : 0.5)};
    pointer-events: ${props => (props.enabled ? 'unset' : 'none')};
    padding-bottom: ${props => (props.enabled ? '0px' : '24px')};
    margin-left: 37px;
    margin-top: 24px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-left: 0px;
    }
`;

const WalletsTooltips = styled.div`
    display: flex;
    justify-content: flex-end;
    padding-bottom: 10px;
`;

const WalletsCount = styled(ColHeader)`
    flex: 1;
    justify-content: flex-start;
    white-space: nowrap;
`;

const InstancesWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const DeviceHeader = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
`;

const DeviceImageWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 21px;
    height: 36px;
    margin-right: 16px;
`;

const ExpandIcon = styled(Icon)`
    margin-left: 24px;
`;

// TODO: this is going to be a problem with different col headers length since they won't be aligned with the columns inside WalletInstance
const ColRememberHeader = styled(ColHeader)`
    margin: 0 24px;
`;
const ColEjectHeader = styled(ColHeader)`
    margin: 0px 24px;
`;

const StyledImage = styled(Image)`
    height: 36px;
`;

interface Props {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    onCancel: ForegroundAppProps['onCancel'];
    backgroundRoute: ReturnType<typeof getBackgroundRoute>;
}

const DeviceItem = ({ device, instances, onCancel, backgroundRoute }: Props) => {
    const { goto, selectDevice, acquireDevice, createDeviceInstance } = useActions({
        goto: routerActions.goto,
        selectDevice: suiteActions.selectDevice,
        acquireDevice: suiteActions.acquireDevice,
        createDeviceInstance: suiteActions.createDeviceInstance,
    });
    const selectedDevice = useSelector(state => state.suite.device);

    const theme = useTheme();
    const [isExpanded, setIsExpanded] = useState(true);
    const [animateArrow, setAnimateArrow] = useState(false);

    const deviceStatus = deviceUtils.getStatus(device);
    const deviceModel = getDeviceModel(device);

    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);
    const isUnknown = device.type !== 'acquired';
    const isSelected = deviceUtils.isSelectedDevice(selectedDevice, device);
    const instancesWithState = instances.filter(i => i.state);

    const handleRedirection = async () => {
        // Preserve route for dashboard or wallet context only. Redirect from other routes to dashboard index.
        const isWalletOrDashboardContext =
            backgroundRoute && ['wallet', 'dashboard'].includes(backgroundRoute.app);
        if (!isWalletOrDashboardContext) {
            await goto('suite-index');
        }

        // Subpaths of wallet are not available to all account types (e.g. Tokens tab not available to BTC accounts).
        const isWalletSubpath =
            backgroundRoute?.app === 'wallet' && backgroundRoute?.name !== 'wallet-index';
        if (isWalletSubpath) {
            await goto('wallet-index');
        }

        const preserveParams = false;
        onCancel(preserveParams);
    };

    const selectDeviceInstance = (instance: Props['device']) => {
        selectDevice(instance);
        handleRedirection();
    };

    const addDeviceInstance = async (instance: Props['device']) => {
        await createDeviceInstance(instance);
        handleRedirection();
    };

    const onSolveIssueClick = () => {
        const needsAcquire =
            device.type === 'unacquired' ||
            deviceStatus === 'used-in-other-window' ||
            deviceStatus === 'was-used-in-other-window';
        if (needsAcquire) {
            acquireDevice(device);
        } else {
            selectDeviceInstance(device);
        }
    };

    const onDeviceSettingsClick = async () => {
        // await needed otherwise it just selects first account (???)
        await goto('settings-device');
        if (!isSelected) {
            selectDevice(device);
        }
    };

    return (
        <DeviceWrapper>
            <Device>
                <DeviceHeader>
                    {deviceModel && (
                        <DeviceImageWrapper>
                            <StyledImage alt="Trezor" image={`TREZOR_T${deviceModel}`} />
                        </DeviceImageWrapper>
                    )}
                    <Col grow={1}>
                        <DeviceStatus
                            color={device.connected ? theme.TYPE_GREEN : theme.TYPE_RED}
                            data-test={
                                device.connected
                                    ? '@deviceStatus-connected'
                                    : '@deviceStatus-disconnected'
                            }
                        >
                            {device.connected ? (
                                <Translation id="TR_CONNECTED" />
                            ) : (
                                <Translation id="TR_DISCONNECTED" />
                            )}
                        </DeviceStatus>
                        <DeviceTitle>{device.label}</DeviceTitle>
                    </Col>

                    <DeviceActions>
                        <DeviceHeaderButton
                            needsAttention={needsAttention}
                            device={device}
                            onSolveIssueClick={onSolveIssueClick}
                            onDeviceSettingsClick={onDeviceSettingsClick}
                        />
                        {!needsAttention && (
                            <ExpandIcon
                                useCursorPointer
                                size={24}
                                icon="ARROW_UP"
                                color={theme.TYPE_LIGHT_GREY}
                                hoverColor={theme.TYPE_LIGHTER_GREY}
                                canAnimate={animateArrow}
                                isActive={!isExpanded}
                                onClick={() => {
                                    setIsExpanded(!isExpanded);
                                    setAnimateArrow(true);
                                }}
                            />
                        )}
                    </DeviceActions>
                </DeviceHeader>
            </Device>
            {!needsAttention && (
                <AnimatePresence initial={false}>
                    {!isUnknown && isExpanded && (
                        <motion.div {...motionAnimation.expand}>
                            <WalletsWrapper enabled>
                                {instancesWithState.length > 0 && (
                                    <WalletsTooltips>
                                        <WalletsCount>
                                            <Translation
                                                id="TR_COUNT_WALLETS"
                                                values={{ count: instancesWithState.length }}
                                            />
                                        </WalletsCount>
                                        <ColRememberHeader
                                            tooltipOpenGuide={instance => (
                                                <OpenGuideFromTooltip
                                                    id="/1_initialize-and-secure-your-trezor/8_remember-and-eject.md"
                                                    instance={instance}
                                                />
                                            )}
                                            tooltipContent={
                                                <Translation id="TR_REMEMBER_ALLOWS_YOU_TO" />
                                            }
                                        >
                                            <Translation id="TR_REMEMBER_HEADING" />
                                        </ColRememberHeader>
                                        <ColEjectHeader
                                            tooltipOpenGuide={instance => (
                                                <OpenGuideFromTooltip
                                                    id="/1_initialize-and-secure-your-trezor/8_remember-and-eject.md"
                                                    instance={instance}
                                                />
                                            )}
                                            tooltipContent={
                                                <Translation id="TR_EJECT_WALLET_EXPLANATION" />
                                            }
                                        >
                                            <Translation id="TR_EJECT_HEADING" />
                                        </ColEjectHeader>
                                    </WalletsTooltips>
                                )}

                                <InstancesWrapper>
                                    {instancesWithState.map((instance, index) => (
                                        <WalletInstance
                                            key={`${instance.id}-${instance.instance}-${instance.state}`}
                                            instance={instance}
                                            enabled
                                            selected={deviceUtils.isSelectedInstance(
                                                selectedDevice,
                                                instance,
                                            )}
                                            selectDeviceInstance={selectDeviceInstance}
                                            index={index}
                                        />
                                    ))}
                                </InstancesWrapper>

                                <AddWalletButton
                                    device={device}
                                    instances={instances}
                                    addDeviceInstance={addDeviceInstance}
                                    selectDeviceInstance={selectDeviceInstance}
                                />
                            </WalletsWrapper>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </DeviceWrapper>
    );
};

export default DeviceItem;
