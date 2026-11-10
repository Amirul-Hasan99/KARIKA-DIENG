# WhatsApp setup

Business contact: +62 878-3943-9540. For automatic payment receipts, configure `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_GRAPH_API_VERSION` for the Meta WhatsApp Cloud API, then create and approve an Indonesian utility template named `order_payment_confirmed` with three body parameters: buyer name, order number, and total. Set `WHATSAPP_PAYMENT_TEMPLATE` and `WHATSAPP_TEMPLATE_LANGUAGE` to match the approved template. The server sends the receipt after Midtrans confirms settlement or an admin records COD as collected. Without Meta credentials, the order page offers a click-to-chat confirmation link instead.

The local project has no WhatsApp Business credentials, so automatic messages remain disabled until configured. Never put the access token in browser code. The utility template must be approved by Meta before messages can be sent.
