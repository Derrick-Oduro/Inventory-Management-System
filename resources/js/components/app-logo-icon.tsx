import { HTMLAttributes } from 'react';

export default function AppLogoIcon(props: HTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/images/company-logo.jpg"
            alt="Company Logo"
            className={`object-contain ${props.className || ''}`}
        />
    );
}
