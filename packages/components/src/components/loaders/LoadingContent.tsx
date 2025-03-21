import React from 'react';
import styled, { css } from 'styled-components';
import { useTheme } from '../../utils';
import { Icon } from '../Icon';
import { Loader } from './Loader';

const LoadingWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const LoaderCell = styled.div<Required<Omit<LoadingContentProps, 'isSuccessful'>>>`
    width: ${({ size }) => 1.5 * size}px;
    transition: all 0.25s ease-out 0.5s;
    ${({ isLoading }) =>
        !isLoading &&
        css`
            width: 0;
            opacity: 0;
        `}
    svg {
        fill: ${({ theme }) => theme.TYPE_GREEN};
    }
`;

export type LoadingContentProps = {
    children: React.ReactNode;
    isLoading?: boolean;
    size?: number;
    isSuccessful?: boolean;
};

export const LoadingContent = ({
    children,
    isLoading = false,
    size = 20,
    isSuccessful = true,
}: LoadingContentProps) => {
    const theme = useTheme();

    return (
        <LoadingWrapper>
            <LoaderCell isLoading={isLoading} size={size}>
                {isLoading ? (
                    <Loader size={size} data-test="@loading-content/loader" />
                ) : (
                    <Icon
                        icon={isSuccessful ? 'CHECK' : 'CROSS'}
                        size={size}
                        color={isSuccessful ? theme.TYPE_GREEN : theme.TYPE_RED}
                    />
                )}
            </LoaderCell>

            {children}
        </LoadingWrapper>
    );
};
