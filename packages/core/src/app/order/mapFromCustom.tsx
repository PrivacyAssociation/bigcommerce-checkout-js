import { type CustomItem } from '@bigcommerce/checkout-sdk';

import { type OrderItemType } from './OrderSummaryItem';

function mapFromCustom(item: CustomItem): OrderItemType {
    return {
        id: item.id,
        quantity: item.quantity,
        amount: item.extendedListPrice,
        name: item.name,
    };
}

export default mapFromCustom;
