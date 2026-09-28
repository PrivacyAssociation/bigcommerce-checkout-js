import React, { type FunctionComponent, useCallback, useState } from 'react';

import IappOrderTermsDrawer from './IappOrderTermsDrawer';
import {
    IAPP_ORDER_TERMS_LINK_TEXT,
    IAPP_ORDER_TERMS_NOTICE_PREFIX,
} from './iappOrderTermsContent';

const IappOrderTermsNotice: FunctionComponent = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = useCallback(() => {
        setIsOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <p className="iappOrderTermsNotice body-regular" data-test="iapp-order-terms-notice">
            {IAPP_ORDER_TERMS_NOTICE_PREFIX}
            <button
                className="iappOrderTermsNotice-link"
                data-test="iapp-order-terms-link"
                onClick={handleOpen}
                type="button"
            >
                {IAPP_ORDER_TERMS_LINK_TEXT}
            </button>
            .
            <IappOrderTermsDrawer isOpen={isOpen} onRequestClose={handleClose} />
        </p>
    );
};

export default IappOrderTermsNotice;
