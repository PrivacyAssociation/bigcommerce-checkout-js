import React from 'react';

import { fireEvent, render, screen, waitFor } from '@bigcommerce/checkout/test-utils';

import IappOrderTermsNotice from './IappOrderTermsNotice';
import {
    IAPP_ORDER_TERMS_HEADING,
    IAPP_ORDER_TERMS_LINK_TEXT,
    IAPP_ORDER_TERMS_NOTICE_PREFIX,
} from './iappOrderTermsContent';

describe('IappOrderTermsNotice', () => {
    it('renders the implied-consent sentence with a terms link', () => {
        render(<IappOrderTermsNotice />);

        expect(screen.getByTestId('iapp-order-terms-notice')).toHaveTextContent(
            `${IAPP_ORDER_TERMS_NOTICE_PREFIX}${IAPP_ORDER_TERMS_LINK_TEXT}`,
        );
        expect(screen.getByTestId('iapp-order-terms-link')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('opens the drawer with terms content and closes it', async () => {
        render(<IappOrderTermsNotice />);

        fireEvent.click(screen.getByTestId('iapp-order-terms-link'));

        expect(
            screen.getByRole('dialog', { name: IAPP_ORDER_TERMS_HEADING }),
        ).toBeInTheDocument();

        const body = screen.getByTestId('iapp-order-terms-drawer-body');

        expect(body).toHaveTextContent('Last Updated: September 28, 2026');
        expect(body).toHaveTextContent('1. Eligibility');
        expect(screen.getByRole('link', { name: 'Privacy Notice' })).toHaveAttribute(
            'href',
            'https://iapp.org/about/privacy-notice',
        );

        fireEvent.click(screen.getByTestId('iapp-order-terms-drawer-close'));

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });
});
