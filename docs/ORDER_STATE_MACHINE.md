# Order state machine (target)

Order: `received -> preparing -> ready_for_delivery -> out_for_delivery -> delivered`; cancellation is a separately authorized terminal transition.
Payment: `pending -> settled | failed | expired`; COD remains `pending` until `collected` at handover. Delivery: `unassigned -> assigned -> picked_up -> delivered` with `failed_attempt` as a recoverable state.

QRIS settlement and delivery progress are separate. Only verified server webhook updates QRIS payment. The current legacy types/routes still encode coffee workflow states; this target state machine is not fully wired yet.
