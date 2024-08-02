import { Creative, LinearCreative, NonLinearCreative } from '../yospace/AdBreak';

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

interface CreativeUi<C extends Creative> {
    creative: C;
    element: HTMLElement;
}

type LinearCreativeUi = CreativeUi<LinearCreative>;
type NonLinearCreativeUi = CreativeUi<NonLinearCreative>;

export class YospaceUiHandler {
    private element: HTMLElement;
    private linearClickThrough: LinearCreativeUi | undefined;
    private nonLinears: NonLinearCreativeUi[] = [];

    constructor(element: HTMLElement) {
        this.element = element;
    }

    createNonLinear(creative: NonLinearCreative, imageUrl: string) {
        const adImage = document.createElement('img');
        adImage.src = imageUrl;
        adImage.className = 'theoplayer-yospace-non-linear-image';
        adImage.style.maxWidth = '100%';

        const nonLinearClickThrough = createClickThrough(creative.getClickThroughUrl(), 'theoplayer-yospace-advert');
        nonLinearClickThrough.appendChild(adImage);
        nonLinearClickThrough.style.zIndex = '10';
        nonLinearClickThrough.style.position = 'absolute';
        nonLinearClickThrough.addEventListener('click', () => {
            creative.onClickThrough();
        });

        this.element.appendChild(nonLinearClickThrough);
        this.nonLinears.push({ creative, element: nonLinearClickThrough });
        creative.setVisible(true);
    }

    private removeNonLinears(): void {
        for (const { creative, element } of this.nonLinears) {
            creative.setVisible(false);
            element.parentNode?.removeChild(element);
        }
        this.nonLinears.length = 0;
    }

    private removeLinearClickThrough(): void {
        const linearClickThrough = this.linearClickThrough;
        if (linearClickThrough) {
            linearClickThrough.element.parentNode?.removeChild(linearClickThrough.element);
        }
        this.linearClickThrough = undefined;
    }

    removeAllAds(): void {
        this.removeLinearClickThrough();
        this.removeNonLinears();
    }

    createLinearClickThrough(creative: LinearCreative): void {
        const clickThrough = createClickThrough(creative.getClickThroughUrl(), 'theoplayer-yospace-ad-clickthrough');
        clickThrough.style.zIndex = '10';
        stretchToParent(clickThrough);
        clickThrough.addEventListener('click', () => {
            creative.onClickThrough();
        });

        this.element.appendChild(clickThrough);
        this.linearClickThrough = { creative, element: clickThrough };
    }

    reset(): void {
        this.removeAllAds();
    }
}
