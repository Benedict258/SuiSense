module suisense_core::registry {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::String;

    /// On-chain receipt anchoring an off-chain explanation stored in Walrus.
    struct ExplanationReceipt has key, store {
        id: UID,
        tx_digest: String,
        walrus_blob_id: String,
        content_hash: vector<u8>,
        created_at_ms: u64,
        creator: address,
    }

    /// Creates a receipt object and transfers it to the sender.
    public entry fun create_receipt(
        tx_digest: String,
        walrus_blob_id: String,
        content_hash: vector<u8>,
        created_at_ms: u64,
        ctx: &mut TxContext,
    ) {
        let creator = tx_context::sender(ctx);
        let receipt = ExplanationReceipt {
            id: object::new(ctx),
            tx_digest,
            walrus_blob_id,
            content_hash,
            created_at_ms,
            creator,
        };
        transfer::transfer(receipt, creator);
    }

    /// Optional helper to share a receipt for global read access.
    public entry fun share_receipt(receipt: ExplanationReceipt) {
        transfer::share_object(receipt);
    }
}
