import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { Input, Icon, useTheme, Tooltip, KEYBOARD_CODE } from '@trezor/components';
import { useActions } from 'src/hooks/suite';
import { SETTINGS } from 'src/config/suite';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { fetchTransactionsThunk } from '@suite-common/wallet-core';

const Wrapper = styled.div<{ expanded: boolean }>`
    margin-right: 20px;
    width: 36px;
    transition: width 0.4s ease-in-out;
    overflow: hidden;
    cursor: pointer;

    ${props =>
        props.expanded &&
        css`
            width: 210px;
            cursor: auto;
        `}
`;

const StyledInput = styled(Input)<{ expanded: boolean }>`
    border: none;
    ${props =>
        !props.expanded &&
        css`
            cursor: pointer;
            padding: 0 16px;
        `}
`;
export interface SearchProps {
    account: Account;
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    setSelectedPage: React.Dispatch<React.SetStateAction<number>>;
}

export const SearchAction = ({ account, search, setSearch, setSelectedPage }: SearchProps) => {
    const theme = useTheme();
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [hasFetchedAll, setHasFetchedAll] = useState(false);
    const { translationString } = useTranslation();
    const { addToast, fetchTransactions } = useActions({
        addToast: notificationsActions.addToast,
        fetchTransactions: fetchTransactionsThunk,
    });

    const onFocus = useCallback(() => {
        setExpanded(true);
        if (search !== '' && inputRef.current) {
            inputRef.current.select();
        }
    }, [setExpanded, search]);

    const onBlur = useCallback(() => {
        if (search === '') {
            setExpanded(false);
        }
    }, [setExpanded, search]);

    const onKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            // Handle esc (unfocus)
            if (event.code === KEYBOARD_CODE.ESCAPE && inputRef.current) {
                setSearch('');
                inputRef.current.blur();
            }
        },
        [setSearch],
    );

    const onSearch = useCallback(
        async ({ target }: React.ChangeEvent<HTMLInputElement>) => {
            setSelectedPage(1);
            setSearch(target.value);

            if (!hasFetchedAll) {
                setHasFetchedAll(true);

                try {
                    await fetchTransactions({
                        accountKey: account.key,
                        page: 2,
                        perPage: SETTINGS.TXS_PER_PAGE,
                        noLoading: true,
                        recursive: true,
                    });
                } catch (err) {
                    addToast({
                        type: 'error',
                        error: translationString('TR_SEARCH_FAIL'),
                    });
                }
            }
        },
        [
            account,
            addToast,
            fetchTransactions,
            hasFetchedAll,
            setSearch,
            setSelectedPage,
            translationString,
        ],
    );

    const onSearchKeys = useCallback(
        (event: KeyboardEvent) => {
            if (
                inputRef.current &&
                (event.ctrlKey || event.metaKey) &&
                event.key === KEYBOARD_CODE.LETTER_F
            ) {
                event.preventDefault();
                inputRef.current.focus();
            }
        },
        [inputRef],
    );

    useEffect(() => {
        setHasFetchedAll(false);
        setExpanded(false);
        setSearch('');

        document.addEventListener('keydown', onSearchKeys);
        return () => {
            document.removeEventListener('keydown', onSearchKeys);
        };
    }, [account.symbol, account.index, account.accountType, setSearch, onSearchKeys]);

    if (!isFeatureFlagEnabled('SEARCH_TRANSACTIONS')) {
        return null;
    }

    return (
        <Wrapper
            ref={wrapperRef}
            onClick={() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }}
            expanded={expanded}
        >
            <Tooltip content={<Translation id="TR_TRANSACTIONS_SEARCH_TOOLTIP" />}>
                <StyledInput
                    expanded={expanded}
                    data-test="@wallet/accounts/search-icon"
                    variant="small"
                    innerRef={inputRef}
                    innerAddon={<Icon icon="SEARCH" size={16} color={theme.TYPE_DARK_GREY} />}
                    placeholder={expanded ? translationString('TR_SEARCH_TRANSACTIONS') : undefined}
                    onChange={onSearch}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    value={search}
                    addonAlign="left"
                    maxLength={512}
                    noError
                    noTopLabel
                    clearButton="always"
                    onClear={() => {
                        setSearch('');
                    }}
                />
            </Tooltip>
        </Wrapper>
    );
};
