/**
 * Common models used for protobuf and openapi3 outputs
 */
namespace Models {
    model TraceInformation {
        trx_id: string;
        action_index: uint32;
    }

    model Scope {
        contract: string;
        symcode: string;
    }

    model Extras {
        precision: uint32;
        amount: int64;
        value: float64;
    }

    // Use a generic to allow the model to represent a timestamp using different types for protobuf/openapi3
    model BlockInfo<TimestampType> {
        block_num: uint64;
        timestamp: TimestampType;
    }

    model CommonAntelope<TimestampType> {
        ...TraceInformation;
        ...Scope;
        ...Extras;
        ...BlockInfo<TimestampType>;
    }

    model Transfer<TimestampType> {
        ...CommonAntelope<TimestampType>;
        from: string;
        to: string;
        quantity: string;
        memo: string;
    }

    model BalanceChange<TimestampType> {
        ...CommonAntelope<TimestampType>;
        account: string;
        balance: string;
        balance_delta: int64;
    }

    model Supply<TimestampType> {
        ...CommonAntelope<TimestampType>;
        issuer: string;
        max_supply: string;
        supply: string;
        supply_delta: int64;
    }
}
