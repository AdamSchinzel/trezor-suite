// minimum time span (in ms) after which discovery checkpoint is emitted by scanAccount
export const CHECKPOINT_COOLDOWN = 10000;

// minimum time span (in ms) after which progress info is emitted by scanAccount
export const PROGRESS_INFO_COOLDOWN = 1000;

export const DISCOVERY_LOOKOUT = 20;

// for change addresses as they're heavily used in coinjoin
export const DISCOVERY_LOOKOUT_EXTENDED = 50;

export const STATUS_TIMEOUT = {
    idle: 60000, // no registered accounts, occasionally fetch status to read fees
    enabled: 30000, // account is registered but utxo was not paired with Round
    registered: 20000, // utxo is registered in Round
} as const;

// add 2 sec. offset to round.inputRegistrationEnd to prevent race conditions
// we are expecting phase to change but server didn't propagate it yet
export const ROUND_REGISTRATION_END_OFFSET = 2000;

// following https://github.com/zkSNACKs/WalletWasabi/blob/913b16953a965eb922e0ae02a0f71a991a7b9bb7/WalletWasabi/WabiSabi/Client/CoinJoinClient.cs#L31-L34
// Maximum delay when spreading the requests in time, except input registration requests which
// timings only depends on the input-reg timeout and signing requests which timings must be larger.
// This is a maximum cap the delay can be zero if the remaining time is less.
export const ROUND_MAXIMUM_REQUEST_DELAY = 10000;

// do not register into Round if round.inputRegistrationEnd is below offset
export const ROUND_SELECTION_REGISTRATION_OFFSET = 30000;

// max output count
export const ROUND_SELECTION_MAX_OUTPUTS = 20;

// custom timeout for http requests (default is 50000 ms)
export const HTTP_REQUEST_TIMEOUT = 35000;

// gap (in ms) between two attempts of the same http request
export const HTTP_REQUEST_GAP = 1000;

// special timeout for quite large filter batches downloaded over tor
export const FILTERS_REQUEST_TIMEOUT = 300000;

// After how many ms should mempool be purged again
// (= large request for all mempool txids and throwing away all unincluded)
export const MEMPOOL_PURGE_CYCLE = 10 * 60 * 1000;

// timeout for CoinjoinRound currently running process
export const ROUND_PHASE_PROCESS_TIMEOUT = 10000;

// timeout between account/round creation
export const ACCOUNT_BUSY_TIMEOUT = 30000;

// fallback values for status request
// usage of these values is extremely unlikely, there would have to be a change in the coordinator's API
export const PLEBS_DONT_PAY_THRESHOLD_FALLBACK = 1000000;
export const COORDINATOR_FEE_RATE_FALLBACK = 0.003;
export const MIN_ALLOWED_AMOUNT_FALLBACK = 5000;
export const MAX_ALLOWED_AMOUNT_FALLBACK = 134375000000;

// affiliation flag:
// - sent coordinator/ready-to-sign request **only** when Alice pays coordination fee
// - check if Trezor affiliate server is running in status.affiliateInformation.runningAffiliateServers
export const AFFILIATION_ID = 'trezor';
