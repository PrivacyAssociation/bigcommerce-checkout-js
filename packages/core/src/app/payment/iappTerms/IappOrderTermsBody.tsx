import React, { type FunctionComponent } from 'react';

const CONTACT_URL = 'https://iapp.org/about/contact';
const PRIVACY_URL = 'https://iapp.org/about/privacy-notice';

const ExternalLink: FunctionComponent<{ href: string; children: React.ReactNode }> = ({
    href,
    children,
}) => (
    <a href={href} rel="noopener noreferrer" target="_blank">
        {children}
    </a>
);

const IappOrderTermsBody: FunctionComponent = () => (
    <>
        <p>
            <strong>Last Updated:</strong> September 28, 2026
        </p>
        <p>
            These Terms and Conditions of Sale (“Terms”) govern the purchase of products and
            services from The International Association of Privacy Professionals, Inc. (“IAPP,”
            “Company,” “we,” “our,” or “us”) through our website (the “Site”).
        </p>
        <p>By placing an order, you agree to these Terms.</p>

        <h2>1. Eligibility</h2>
        <p>
            You must be at least 18 years old and capable of forming a binding contract to make a
            purchase. By placing an order, you represent that you meet these requirements.
        </p>

        <h2>2. Products and Services</h2>
        <p>
            This policy applies to all physical and digital products sold on the Site, including
            without limitation the following (product descriptions are available on the Site):
        </p>
        <ul>
            <li>
                <strong>Books and physical materials</strong>
            </li>
            <li>
                <strong>Digital content</strong> (eBooks, certification exams, recorded web
                conferences, self-paced training, downloadable materials)
            </li>
            <li>
                <strong>Live and online training programs</strong>
            </li>
            <li>
                <strong>Conference and event tickets</strong>
            </li>
            <li>
                <strong>Annual individual memberships</strong>
            </li>
        </ul>

        <h2>3. Pricing and Payment</h2>
        <ul>
            <li>All prices are listed in United States Dollars unless otherwise stated.</li>
            <li>Applicable taxes, shipping, and handling fees will be added at checkout.</li>
            <li>
                Payment must be made in full at the time of purchase via approved payment methods.
            </li>
            <li>We reserve the right to correct pricing errors and cancel affected orders.</li>
        </ul>

        <h2>4. Order Confirmation and Acceptance</h2>
        <ul>
            <li>After placing an order, you will receive an order confirmation email.</li>
            <li>
                Acceptance of your order occurs when we process payment and confirm fulfillment.
            </li>
            <li>
                We reserve the right to refuse or cancel orders for any reason, including suspected
                fraud or pricing errors.
            </li>
        </ul>

        <h2>5. Shipping and Delivery (physical products)</h2>
        <ul>
            <li>Shipping times are estimates and not guaranteed.</li>
            <li>Risk of loss transfers to you upon delivery.</li>
            <li>You are responsible for providing accurate order and delivery information.</li>
        </ul>

        <h2>
            6. Digital Products (e.g. self-paced trainings, recorded web conferences, certification
            exams, practice exams, membership)
        </h2>
        <ul>
            <li>Digital products are delivered electronically via download or access link.</li>
            <li>
                For certification exam purchases, you must schedule your exam through PearsonVUE and
                take the exam within one (1) year of purchase.
            </li>
            <li>
                If the exam has not been scheduled and has not expired, purchaser may exchange
                certification exam designations, provided that the original scheduling expiration
                date shall apply and provided any balance due (to the extent the exam designations
                differ in price) has been paid in full.
            </li>
            <li>
                You are granted a limited, non-transferable, non-exclusive license to any digital
                products you purchase for personal use only.
            </li>
        </ul>

        <h2>
            7. Live Training Programs (In-Person and/or Online) and Live Online Web Conferences
        </h2>
        <h3>7.1 Attendance and Access</h3>
        <ul>
            <li>
                Space is limited for in-person and live online events and space will be reserved for
                you upon your purchase.
            </li>
            <li>For online trainings, access details will be provided via your myIAPP account.</li>
        </ul>
        <h3>7.2 Changes and Cancellations</h3>
        <p>We reserve the right to:</p>
        <ul>
            <li>Reschedule or cancel events in our sole discretion</li>
            <li>Substitute instructors or modify content</li>
        </ul>
        <p>
            If <u>we</u> cancel or reschedule an event for any reason, you will be offered:
        </p>
        <ul>
            <li>
                A credit for the original purchase amount, redeemable for a period of two (2) years,
                or
            </li>
            <li>Transfer to a future event.</li>
        </ul>

        <h2>8. Conference and Event Tickets</h2>
        <ul>
            <li>
                Space is limited for conferences and events and space will be reserved for you upon
                ticket purchase.
            </li>
            <li>
                Tickets are non-transferable unless otherwise approved by IAPP in writing.
            </li>
            <li>Entry may be denied for failure to comply with event rules.</li>
            <li>We reserve the right to modify event schedules, speakers, or venues.</li>
        </ul>

        <h2>9. Memberships and Subscriptions</h2>
        <h3>9.1 Term and Renewal</h3>
        <ul>
            <li>Memberships are billed annually.</li>
        </ul>
        <h3>9.2 Benefits</h3>
        <p>
            Membership benefits are subject to change for subsequent membership terms at our
            discretion.
        </p>

        <h2>10. Cancellation/Return/Refund Policy</h2>
        <p>
            Unless otherwise stated, orders shall only be cancelable/returnable/refundable as
            follows:
        </p>
        <ul>
            <li>
                <strong>Physical products:</strong> Orders may be canceled by{' '}
                <ExternalLink href={CONTACT_URL}>contacting IAPP</ExternalLink> within 14 calendar
                days of product delivery. You must return the canceled products within 14 calendar
                days of the cancellation notice. A refund for the original purchase cost (excluding
                without limitation delivery charges, foreign transaction or currency exchange fees)
                to the original payment method shall be issued for orders that are cancelled and
                returned within said periods.
            </li>
            <li>
                <strong>Digital products:</strong> Provided digital products have not been used,
                accessed or redeemed, orders for such products may be canceled by{' '}
                <ExternalLink href={CONTACT_URL}>contacting IAPP</ExternalLink> within 14 calendar
                days of purchase. A full refund to the original payment method shall be issued for
                orders that are so cancelled. Transfers of unscheduled exams may be allowed at our
                discretion.
            </li>
            <li>
                <strong>
                    Events, Conferences, Live Trainings (In Person or Online); Live Online Web
                    Conference:
                </strong>
                <ul>
                    <li>
                        If you <ExternalLink href={CONTACT_URL}>contact IAPP</ExternalLink> at least
                        14 calendar days prior to the start of the event, conference or training, we
                        will issue you a credit for the original purchase amount, which will be
                        redeemable on the Site for a period of 2 years from issuance.
                    </li>
                    <li>Transfers may be allowed at our discretion.</li>
                </ul>
            </li>
            <li>
                <strong>Memberships:</strong> Provided membership benefits have not been utilized or
                accessed, orders may be canceled by{' '}
                <ExternalLink href={CONTACT_URL}>contacting IAPP</ExternalLink> within 14 calendar
                days of purchase. A full refund to the original payment method shall be issued for
                orders that are so cancelled.
            </li>
        </ul>

        <h2>11. Intellectual Property</h2>
        <p>
            All content and materials provided by IAPP in connection with a purchase, and all
            intellectual property rights therein, are owned by or licensed to IAPP. You shall not
            record, copy, reproduce, distribute or share such content and materials.
        </p>

        <h2>12. Code of Conduct (Events & Trainings)</h2>
        <p>
            Participants are expected to behave professionally and respectfully. We reserve the
            right to remove participants without refund or credit for:
        </p>
        <ul>
            <li>Disruptive behavior</li>
            <li>Harassment or misconduct</li>
        </ul>

        <h2>13. Privacy</h2>
        <p>
            Your personal information will be handled in accordance with our{' '}
            <ExternalLink href={PRIVACY_URL}>Privacy Notice</ExternalLink>.
        </p>

        <h2>14. Limitation of Liability</h2>
        <p>To the fullest extent permitted by law:</p>
        <ul>
            <li>We are not liable for indirect, incidental, or consequential damages.</li>
            <li>
                Our total liability shall not exceed the amount paid for the relevant product or
                service.
            </li>
        </ul>

        <h2>15. Disclaimer</h2>
        <p>
            All products and services are provided “as is” without warranties of any kind, unless
            required by law. We do not guarantee specific outcomes from trainings or memberships or
            continuous availability of the Site.
        </p>

        <h2>16. Force Majeure</h2>
        <p>
            We are not responsible for delays or failures caused by events beyond our control,
            including but not limited to natural disasters, pandemics, or technical outages.
        </p>

        <h2>17. Governing Law</h2>
        <p>
            These Terms are governed by the laws of the State of New Hampshire, without regard to
            conflict of law principles.
        </p>

        <h2>18. Changes to These Terms</h2>
        <p>
            We may update these Terms at any time. Updated Terms will be posted on the Site with a
            revised effective date and shall apply to purchases made after that effective date.
        </p>

        <h2>19. Contact Information</h2>
        <p>
            For questions about these Terms, please contact{' '}
            <ExternalLink href={CONTACT_URL}>contact IAPP</ExternalLink>.
        </p>
    </>
);

export default IappOrderTermsBody;
