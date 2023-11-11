export type NetworkError = { code: 'NETWORK_ERROR'; reason: unknown };
export type JsonDeserializationError = { code: 'JSON_DESERIALIZATION_ERROR'; reason: unknown };
export type ApiContractError = { code: 'API_CONTRACT_ERROR'; reason: unknown; json: unknown };

export type ApiError = NetworkError | JsonDeserializationError | ApiContractError;
