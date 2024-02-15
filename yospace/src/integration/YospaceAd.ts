export enum YospaceAdType {
    LINEAR = "linear",
    NON_LINEAR = "nonlinear"
}

export abstract class YoSpaceAd {
    readonly type: YospaceAdType;

    readonly clickThroughUrl: string;

    protected constructor(type: YospaceAdType, clickThroughUrl: string) {
        this.clickThroughUrl = clickThroughUrl;
        this.type = type;
    }
}

export class YoSpaceNonLinearAd extends YoSpaceAd {
    private readonly url: string;

    constructor(clickThrough: string, url: string) {
        super(YospaceAdType.NON_LINEAR, clickThrough);
        this.url = url;
    }

    get imageUrl(): string {
        return this.url;
    }
}

export class YoSpaceLinearAd extends YoSpaceAd {
    constructor(clickThrough: string) {
        super(YospaceAdType.LINEAR, clickThrough);
    }
}
