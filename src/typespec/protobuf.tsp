import "@typespec/protobuf";
import "./models.tsp";

using TypeSpec.Protobuf;

@package({
    name: "antelope.eosio.token.v1",
})
namespace AntelopeTokensV1;

// `is` or `extends` syntax doesn't work here, see https://github.com/microsoft/typespec/issues/3266
model Transfer {
    ...Models.Transfer<WellKnown.Timestamp>;
}
@@field(Transfer.trx_id, 1);
@@field(Transfer.action_index, 2);
@@field(Transfer.contract, 3);
@@field(Transfer.symcode, 4);
@@field(Transfer.from, 5);
@@field(Transfer.to, 6);
@@field(Transfer.quantity, 7);
@@field(Transfer.memo, 8);
@@field(Transfer.precision, 9);
@@field(Transfer.amount, 10);
@@field(Transfer.value, 11);
@@field(Transfer.block_num, 12);
@@field(Transfer.timestamp, 13);

model BalanceChange {
    ...Models.BalanceChange<WellKnown.Timestamp>;
}
@@field(BalanceChange.trx_id, 1);
@@field(BalanceChange.action_index, 2);
@@field(BalanceChange.contract, 3);
@@field(BalanceChange.symcode, 4);
@@field(BalanceChange.account, 5);
@@field(BalanceChange.balance, 6);
@@field(BalanceChange.balance_delta, 7);
@@field(BalanceChange.precision, 8);
@@field(BalanceChange.amount, 9);
@@field(BalanceChange.value, 10);
@@field(BalanceChange.block_num, 11);
@@field(BalanceChange.timestamp, 12);
