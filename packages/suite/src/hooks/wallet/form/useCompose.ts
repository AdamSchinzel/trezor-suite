import { useEffect, useRef, useCallback, useState } from 'react';
import { FieldPath, UseFormReturn } from 'react-hook-form';

import { FeeLevel } from '@trezor/connect';
import { useAsyncDebounce } from '@trezor/react-utils';
import { useActions, useTranslation } from 'src/hooks/suite';
import * as sendFormActions from 'src/actions/wallet/sendFormActions';
import { findComposeErrors } from '@suite-common/wallet-utils';
import {
    FormState,
    UseSendFormState,
    ComposeActionContext,
    SendContextValues,
    PrecomposedTransaction,
    PrecomposedTransactionCardano,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';

const DEFAULT_FIELD = 'outputs.0.amount';

interface Props<TFieldValues extends FormState> extends UseFormReturn<TFieldValues> {
    state?: ComposeActionContext;
    defaultField?: FieldPath<TFieldValues>;
}

// shareable sub-hook used in useRbfForm and useSendForm (TODO)

export const useCompose = <TFieldValues extends FormState>({
    state,
    defaultField,
    getValues,
    formState: { errors },
    clearErrors,
    ...props
}: Props<TFieldValues>) => {
    const [isLoading, setLoading] = useState(false);
    const [composeRequestID, setComposeRequestID] = useState(0);
    const composeRequestIDRef = useRef(composeRequestID);
    const defaultFieldRef = useRef(defaultField || DEFAULT_FIELD);
    const [composedLevels, setComposedLevels] =
        useState<SendContextValues['composedLevels']>(undefined);
    const [composeField, setComposeField] = useState<string | undefined>(undefined);
    const { translationString } = useTranslation();

    // actions
    const debounce = useAsyncDebounce();
    const { composeAction, signAction } = useActions({
        composeAction: sendFormActions.composeTransaction,
        signAction: sendFormActions.signTransaction,
    });

    // Type assertion allowing to make the hook reusable, see https://stackoverflow.com/a/73624072
    // This allows the hook to set values and errors for fields shared among multiple forms without passing them as arguments.
    const { setError, setValue } = props as unknown as UseFormReturn<FormState>;

    // compose process
    // call sendFormAction with debounce
    const compose = useCallback(async () => {
        if (!state) return;
        const composeInner = async () => {
            if (Object.keys(errors).length > 0) return;
            const values = getValues();
            const result = await composeAction(values, state);
            return result;
        };

        setLoading(true);
        // store current request ID before async debounced process and compare it later. see explanation below
        const resultID = composeRequestIDRef.current;
        const result = await debounce(composeInner);
        // RACE-CONDITION NOTE:
        // resultID could be outdated when composeRequestID was updated by another upcoming/pending composeRequest and render tick didn't process it yet,
        // therefore another debounce process was not called yet to interrupt current one
        // unexpected result: `updateComposedValues` is trying to work with updated/newer FormState
        if (resultID !== composeRequestIDRef.current) return;
        if (result) {
            setComposedLevels(result);
        }
        setLoading(false);
    }, [composeAction, debounce, getValues, errors, state]);

    // update composeRequestID
    const composeRequest = useCallback(
        (field = defaultFieldRef.current) => {
            // reset precomposed transactions
            setComposedLevels(undefined);
            // set ref for later use in useEffect
            composeRequestIDRef.current += 1;
            setComposeRequestID(composeRequestIDRef.current);
            // clear errors from previous compose process
            const composeErrors = findComposeErrors(errors);
            if (composeErrors.length > 0) {
                clearErrors(composeErrors);
            }
            // set field value for later use in updateComposedValues
            setComposeField(field);
        },
        [errors, clearErrors],
    );

    // update fields AFTER composedLevels change or selectedFee change (below)
    const updateComposedValues = useCallback(
        (composed: PrecomposedTransaction | PrecomposedTransactionCardano) => {
            const values = getValues();
            if (composed.type === 'error') {
                const { error, errorMessage } = composed;
                if (!errorMessage) {
                    // composed tx doesn't have an errorMessage (Translation props)
                    // this error is unexpected and should be handled in sendFormActions
                    console.warn('Compose unexpected error', error);
                    return;
                }

                const formError = {
                    type: 'compose',
                    message: translationString(errorMessage.id, errorMessage.values),
                };

                if (composeField) {
                    // setError to the field which created `composeRequest`
                    setError(composeField as FieldPath<FormState>, formError);
                } else if (defaultFieldRef.current !== DEFAULT_FIELD) {
                    // if defaultField in not an amount (like rbf case, defaultField: selectedFee)
                    // setError to this particular field
                    setError(defaultFieldRef.current as FieldPath<FormState>, formError);
                } else if (values.outputs) {
                    // setError to the all `Amount` fields, composeField is not specified (load draft case)
                    values.outputs.forEach((_, i) => {
                        setError(`outputs.${i}.amount`, formError);
                    });
                }
                return;
            }

            const composeErrors = findComposeErrors(errors);
            if (composeErrors.length > 0) {
                clearErrors(composeErrors);
            }

            // update feeLimit field if present (calculated from ethereum data size)
            setValue('estimatedFeeLimit', composed.estimatedFeeLimit);
        },
        [composeField, getValues, setValue, errors, setError, clearErrors, translationString],
    );

    // called from the useFees sub-hook
    const onFeeLevelChange = useCallback(
        (prev: FormState['selectedFee'], current: FormState['selectedFee']) => {
            if (!composedLevels) return;
            if (current === 'custom') {
                // set custom level from previously selected level
                const prevLevel = composedLevels[prev || 'normal'];
                const levels = {
                    ...composedLevels,
                    custom: prevLevel,
                } as
                    | (PrecomposedLevels & { custom: PrecomposedTransaction })
                    | (PrecomposedLevelsCardano & { custom: PrecomposedTransactionCardano });
                setComposedLevels(levels);
            } else {
                const currentLevel = composedLevels[current || 'normal'];
                updateComposedValues(currentLevel);
            }
        },
        [composedLevels, updateComposedValues],
    );

    const switchToNearestFee = useCallback(
        (composedLevels: NonNullable<UseSendFormState['composedLevels']>) => {
            const { selectedFee, setMaxOutputId } = getValues();
            let composed = composedLevels[selectedFee || 'normal'];

            // selectedFee was not set yet (no interaction with Fees) and default (normal) fee tx is not valid
            // OR setMax option was used
            // try to switch to nearest possible composed transaction
            const shouldSwitch =
                !selectedFee || (typeof setMaxOutputId === 'number' && selectedFee !== 'custom');
            if (shouldSwitch && composed.type === 'error') {
                // find nearest possible tx
                const nearest = Object.keys(composedLevels)
                    .reverse()
                    .find((key): key is FeeLevel['label'] => composedLevels[key].type !== 'error');
                // switch to it
                if (nearest) {
                    composed = composedLevels[nearest];
                    setValue('selectedFee', nearest);
                    if (nearest === 'custom') {
                        // @ts-expect-error: type = error already filtered above
                        const { feePerByte, feeLimit } = composed;
                        setValue('feePerUnit', feePerByte);
                        setValue('feeLimit', feeLimit || '');
                    }
                }
                // or do nothing, use default composed tx
            }

            // composed transaction does not exists (should never happen)
            if (!composed) return;

            updateComposedValues(composed);
        },
        [getValues, setValue, updateComposedValues],
    );

    // handle composeRequestID change, trigger compose process
    useEffect(() => {
        compose();
    }, [composeRequestID, compose]);

    // handle composedLevels change
    useEffect(() => {
        // do nothing if there are no composedLevels
        if (!composedLevels) return;
        switchToNearestFee(composedLevels);
    }, [composedLevels, switchToNearestFee]);

    // called from the UI, triggers signing process
    const signTransaction = async () => {
        const values = getValues();
        const composedTx = composedLevels
            ? composedLevels[values.selectedFee || 'normal']
            : undefined;
        if (composedTx && composedTx.type === 'final') {
            // sign workflow in Actions:
            // signTransaction > sign[COIN]Transaction > requestPushTransaction (modal with promise decision)
            const result = await signAction(values, composedTx);
            return result?.success;
        }
    };

    return {
        isLoading,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
        signTransaction,
    };
};
