import React from 'react';
import { TooltipButton, ButtonProps } from '@trezor/components';
import { Translation } from 'src/components/suite';

interface AddButtonProps extends ButtonProps {
    disabledMessage: React.ReactNode;
    handleClick: () => void;
}

export const AddButton = ({ disabledMessage, handleClick, ...buttonProps }: AddButtonProps) => (
    <TooltipButton
        tooltipContent={disabledMessage}
        isDisabled={!!disabledMessage}
        onClick={handleClick}
        data-test="@add-account"
        {...buttonProps}
    >
        <Translation id="TR_ADD_ACCOUNT" />
    </TooltipButton>
);
