import { createCooldown } from '@trezor/utils';
import { transformTransaction } from '@trezor/blockchain-link-utils/lib/blockbook';

import { getBlockMultiFilter } from './filters';
import { doesTxContainAddress } from './backendUtils';
import { CoinjoinAddressController } from './CoinjoinAddressController';
import type {
    Transaction,
    BlockbookTransaction,
    ScanAccountParams,
    ScanAccountCheckpoint,
    ScanAccountContext,
    ScanAccountResult,
} from '../types/backend';
import { CHECKPOINT_COOLDOWN } from '../constants';

const transformTx =
    (xpub: string, { receive, change }: CoinjoinAddressController) =>
    (tx: BlockbookTransaction) =>
        // It doesn't matter for transformTransaction which receive addrs are used and which are unused
        transformTransaction(xpub, { used: receive, unused: [], change }, tx);

export const scanAccount = async (
    params: ScanAccountParams & { checkpoints: ScanAccountCheckpoint[] },
    {
        client,
        network,
        filters,
        mempool,
        abortSignal,
        onProgress,
        onProgressInfo,
    }: ScanAccountContext,
): Promise<ScanAccountResult> => {
    const xpub = params.descriptor;
    const { checkpoints } = params;

    const addresses = new CoinjoinAddressController(xpub, network, checkpoints[0], params.cache);

    let checkpoint = checkpoints[0];
    const checkpointCooldown = createCooldown(CHECKPOINT_COOLDOWN);

    const txs = new Set<BlockbookTransaction>();

    const everyFilter = filters.getFilterIterator({ checkpoints }, { abortSignal, onProgressInfo });
    // eslint-disable-next-line no-restricted-syntax
    for await (const { filter, blockHash, blockHeight } of everyFilter) {
        const isMatch = getBlockMultiFilter(filter, blockHash);
        const scripts = addresses.receive.concat(addresses.change).map(({ script }) => script);

        if (isMatch(scripts)) {
            const block = await client.fetchBlock(blockHeight, { signal: abortSignal });
            addresses.analyze(
                ({ address }) => block.txs.filter(doesTxContainAddress(address)),
                transactions => transactions.forEach(txs.add, txs),
            );
        }

        const transactions = Array.from(txs, transformTx(xpub, addresses));
        checkpoint = {
            blockHash,
            blockHeight,
            receiveCount: addresses.receive.length,
            changeCount: addresses.change.length,
        };

        txs.clear();

        if (checkpointCooldown() || transactions.length) {
            onProgress({ checkpoint, transactions });
        }
    }

    let pending: Transaction[] = [];
    if (mempool) {
        if (mempool.status === 'stopped') {
            await mempool.start();
            pending = await mempool
                .init(addresses, onProgressInfo)
                .then(transactions => transactions.map(transformTx(xpub, addresses)))
                .catch(err => {
                    mempool.stop();
                    throw err;
                });
        } else {
            await mempool.update();
            pending = mempool.getTransactions(addresses).map(transformTx(xpub, addresses));
        }

        checkpoint.receiveCount = addresses.receive.length;
        checkpoint.changeCount = addresses.change.length;
    }

    const cache = {
        receivePrederived: addresses.receive.map(({ address, path }) => ({ address, path })),
        changePrederived: addresses.change.map(({ address, path }) => ({ address, path })),
    };

    return {
        pending,
        checkpoint,
        cache,
    };
};
