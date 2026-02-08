module sprinkle::bill;

use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;

/// Errors
const ErrorNotPositiveValue: u64 = 1001;
const ErrorInvalidDebtorsAndValuesLength: u64 = 1002;
const ErrorSelfPaying: u64 = 1003;
const ErrorInvalidCoinValue: u64 = 1004;
const ErrorNoDebtors: u64 = 1005;
const ErrorNoValues: u64 = 1006;

/// Debt struct that transfered to the debtors
public struct Debt has key, store {
    id: UID,
    bill_id: vector<u8>,
    creditor: address,
    value: u64,
}

/// Event that is emitted when a debt is paid
public struct DebtPaid has copy, drop {
    debt_id: ID,
    bill_id: vector<u8>,
    payer: address,
    creditor: address,
    paid_value: u64,
}

/// This function creates a bill and transfers the debt objects to the debtors
#[allow(lint(public_entry))]
public entry fun create_bill(
    bill_id: vector<u8>,
    debtors: vector<address>,
    values: vector<u64>,
    ctx: &mut TxContext,
) {
    assert!(debtors.length() > 0, ErrorNoDebtors);
    assert!(values.length() > 0, ErrorNoValues);
    assert!(debtors.length() == values.length(), ErrorInvalidDebtorsAndValuesLength);

    let mut index = 0;
    while (vector::length(&debtors) > index) {
        let debtor = *vector::borrow(&debtors, index);
        let value = *vector::borrow(&values, index);
        assert!(value > 0, ErrorNotPositiveValue);

        transfer::public_transfer(
            Debt {
                id: object::new(ctx),
                bill_id,
                creditor: ctx.sender(),
                value,
            },
            debtor,
        );
        index = index + 1;
    };
}

/// This function pays a debt and transfers the coin to the creditor.
#[allow(lint(public_entry))]
public entry fun pay_debt(debt: Debt, coin: Coin<SUI>, ctx: &mut TxContext) {
    assert!(debt.creditor != ctx.sender(), ErrorSelfPaying);
    assert!(coin.value() == debt.value, ErrorInvalidCoinValue);

    let paid_value = coin.value();

    transfer::public_transfer(coin, debt.creditor);

    event::emit(DebtPaid {
        debt_id: object::id(&debt),
        bill_id: debt.bill_id,
        payer: ctx.sender(),
        creditor: debt.creditor,
        paid_value,
    });

    let Debt { id, .. } = debt;
    object::delete(id);
}

/// Tests

#[test]
public fun test_create_bill() {
    use sui::test_scenario as ts;

    let user: address = @0x1;
    let debtor: address = @0x2;

    let mut scenario = ts::begin(user);
    let ctx = ts::ctx(&mut scenario);

    let mut debtors = vector::empty<address>();
    vector::push_back(&mut debtors, debtor);
    let mut values = vector::empty<u64>();
    vector::push_back(&mut values, 100);
    let bill_id = b"some_bill_id";

    create_bill(bill_id, debtors, values, ctx);

    ts::next_tx(&mut scenario, user);

    assert!(ts::has_most_recent_for_address<Debt>(debtor));
    ts::end(scenario);
}

#[test]
public fun test_pay_debt() {
    use sui::test_scenario as ts;

    let user: address = @0x1;
    let debtor: address = @0x2;

    let mut scenario = ts::begin(user);

    let mut debtors = vector::empty<address>();
    vector::push_back(&mut debtors, debtor);
    let mut values = vector::empty<u64>();
    vector::push_back(&mut values, 100);
    let bill_id = b"some_bill_id";

    create_bill(bill_id, debtors, values, ts::ctx(&mut scenario));

    ts::next_tx(&mut scenario, user);

    assert!(ts::has_most_recent_for_address<Debt>(debtor));

    ts::next_tx(&mut scenario, user);

    let debt = ts::take_from_address<Debt>(&scenario, debtor);

    let coin = coin::mint_for_testing<SUI>(100, ts::ctx(&mut scenario));
    pay_debt(debt, coin, ts::ctx(&mut scenario));

    let effects = ts::next_tx(&mut scenario, debtor);

    assert!(effects.num_user_events() == 1);
    assert!(!ts::has_most_recent_for_sender<Debt>(&scenario));

    ts::end(scenario);
}
