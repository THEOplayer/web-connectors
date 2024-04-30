import { YospaceSessionManager } from '../yospace/YospaceSessionManager';

export function stretchToParent(element: HTMLElement): void {
    const { style } = element;
    style.position = 'absolute';
    style.left = '0';
    style.right = '0';
    style.top = '0';
    style.bottom = '0';
    style.width = '100%';
    style.height = '100%';
}

function createClickThrough(clickThroughURL: string, classToAdd?: string): HTMLElement {
    const clickThroughElement = document.createElement('a');
    clickThroughElement.href = clickThroughURL;
    clickThroughElement.target = '_blank';

    if (classToAdd) {
        clickThroughElement.className = classToAdd;
    }

    // security enhancement
    // read more @ https://mathiasbynens.github.io/rel-noopener/
    clickThroughElement.rel = 'noopener';

    return clickThroughElement;
}

export class YospaceUiHandler {
    private element: HTMLElement;

    private sessionManager: YospaceSessionManager;

    private linearClickThrough: HTMLElement | undefined;

    private nonLinears: HTMLElement[] = [];

    constructor(element: HTMLElement, sessionManager: YospaceSessionManager) {
        this.element = element;
        this.sessionManager = sessionManager;
    }

    createNonLinear(clickThroughUrl: string, imageUrl: string) {
        const adImage = document.createElement('img');
        adImage.src = imageUrl;
        adImage.className = 'theoplayer-yospace-non-linear-image';
        adImage.style.maxWidth = '100%';

        const nonLinearClickThrough = createClickThrough(clickThroughUrl, 'theoplayer-yospace-advert');
        nonLinearClickThrough.appendChild(adImage);
        nonLinearClickThrough.style.zIndex = '10';
        nonLinearClickThrough.style.position = 'absolute';

        this.element.appendChild(nonLinearClickThrough);
        this.nonLinears.push(nonLinearClickThrough);
    }

    private removeNonLinears(): void {
        this.nonLinears.forEach((nonLinear) => {
            if (nonLinear && nonLinear.parentElement) {
                nonLinear.parentElement.removeChild(nonLinear);
            }
        });
        this.nonLinears.length = 0;
    }

    private removeLinearClickThrough(): void {
        if (this.linearClickThrough && this.linearClickThrough.parentNode) {
            this.linearClickThrough.parentNode.removeChild(this.linearClickThrough);
        }
        this.linearClickThrough = undefined;
    }

    removeAllAds(): void {
        this.removeLinearClickThrough();
        this.removeNonLinears();
    }

    createLinearClickThrough(clickThroughUrl: string): void {
        const clickThrough = createClickThrough(clickThroughUrl, 'theoplayer-yospace-ad-clickthrough');
        clickThrough.style.zIndex = '10';
        stretchToParent(clickThrough);

        this.element.appendChild(clickThrough);
        this.linearClickThrough = clickThrough;
    }

    reset(): void {
        this.removeAllAds();
    }
}
