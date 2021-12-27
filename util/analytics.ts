
export const gaPageview = (url: string) => {
    window.gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS, {
        page_path: url,
    })
}

type GTagEvent = {
    action: string;
    params?: {
        category: string;
        label: string;
        value: number;
    }
};

export const gaEvent = ({ action, params }: GTagEvent) => {
    window.gtag('event', action, params)
}