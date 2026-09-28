import React, { type FunctionComponent, type KeyboardEvent, type MouseEvent, useCallback } from 'react';
import ReactModal from 'react-modal';

import { IconClose } from '@bigcommerce/checkout/ui';

import IappOrderTermsBody from './IappOrderTermsBody';
import {
    IAPP_ORDER_TERMS_CLOSE_LABEL,
    IAPP_ORDER_TERMS_HEADING,
} from './iappOrderTermsContent';

import './IappOrderTermsDrawer.scss';

export const IAPP_ORDER_TERMS_DRAWER_TRANSITION_MS = 300;

export interface IappOrderTermsDrawerProps {
    isOpen: boolean;
    onRequestClose(): void;
}

const IappOrderTermsDrawer: FunctionComponent<IappOrderTermsDrawerProps> = ({
    isOpen,
    onRequestClose,
}) => {
    const handleClose = useCallback(
        (event: MouseEvent | KeyboardEvent) => {
            event.preventDefault();
            onRequestClose();
        },
        [onRequestClose],
    );

    return (
        <ReactModal
            ariaHideApp={process.env.NODE_ENV !== 'test'}
            bodyOpenClassName="has-activeIappOrderTermsDrawer"
            className={{
                base: 'iappOrderTermsDrawer optimizedCheckout-contentPrimary',
                afterOpen: 'iappOrderTermsDrawer--afterOpen',
                beforeClose: 'iappOrderTermsDrawer--beforeClose',
            }}
            closeTimeoutMS={IAPP_ORDER_TERMS_DRAWER_TRANSITION_MS}
            contentLabel={IAPP_ORDER_TERMS_HEADING}
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            overlayClassName={{
                base: 'iappOrderTermsDrawer-overlay',
                afterOpen: 'iappOrderTermsDrawer-overlay--afterOpen',
                beforeClose: 'iappOrderTermsDrawer-overlay--beforeClose',
            }}
            shouldCloseOnEsc={true}
            shouldCloseOnOverlayClick={true}
        >
            <div className="iappOrderTermsDrawer-header">
                <h2 className="iappOrderTermsDrawer-heading">{IAPP_ORDER_TERMS_HEADING}</h2>
                <button
                    className="iappOrderTermsDrawer-close"
                    data-test="iapp-order-terms-drawer-close"
                    onClick={handleClose}
                    type="button"
                >
                    <span className="is-srOnly">{IAPP_ORDER_TERMS_CLOSE_LABEL}</span>
                    <IconClose />
                </button>
            </div>
            <div className="iappOrderTermsDrawer-body" data-test="iapp-order-terms-drawer-body">
                <IappOrderTermsBody />
            </div>
        </ReactModal>
    );
};

export default IappOrderTermsDrawer;
