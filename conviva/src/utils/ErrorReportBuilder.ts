import { ErrorCategory, ErrorCode, InterceptableResponse, ResponseInterceptor, type THEOplayerError } from 'theoplayer';
import { ChromelessPlayer, HTTPHeaders } from 'theoplayer';
import { bufferedToString } from './Utils';

/**
 * ErrorReportBuilder provides extra error details that can be sent when reporting an error.
 */
export class ErrorReportBuilder {
    private _responseInterceptor: ResponseInterceptor = (response: InterceptableResponse) => {
        // Keep info on the last X HTTP responses
        while (Object.keys(this._responses).length >= this.maxHTTPResponses) {
            delete this._responses[Object.keys(this._responses)[0]];
        }
        // Create an entry with the path & http response status
        let respDesc = `${response.url},status: ${response.status} ${response.statusText},`;
        // Add interesting header values
        respDesc += `content-length: ${getHeaderValue(response.headers, 'content-length')}`;
        this._responses[Date.now().toString()] = respDesc;
    };

    private _responses: { [key: string]: string } = {};
    private _report: { [key: string]: string } = {};

    constructor(
        private player: ChromelessPlayer,
        private maxHTTPResponses: number = 10
    ) {
        this.player.network.addResponseInterceptor(this._responseInterceptor);
    }

    withPlayerBuffer() {
        this._report['buffered'] = bufferedToString(this.player.buffered);
        return this;
    }

    withErrorDetails(error?: THEOplayerError) {
        this._report = { ...this._report, ...flattenErrorObject(error) };
        return this;
    }

    build(): { [key: string]: string } {
        // Merge report and a list of the latest http responses in separate entries as event
        // payloads are truncated in the Pulse dashboard.
        return { ...this._report, ...this._responses };
    }

    destroy() {
        this._responses = {};
        this._report = {};
        this.player.network.removeResponseInterceptor(this._responseInterceptor);
    }
}

function getHeaderValue(headers: HTTPHeaders, key: string): string {
    return headers[key] ?? 'N/A';
}

export function flattenErrorObject(error?: THEOplayerError): { [key: string]: string } {
    const errorDetails: { [key: string]: string | undefined } = {
        code: ErrorCode[error?.code ?? -1],
        category: ErrorCategory[error?.category ?? -1],
        name: error?.cause?.name,
        message: error?.cause?.message,
        stack: error?.stack
    };
    // Remove undefined values
    for (const key in errorDetails) {
        if (errorDetails[key] === undefined) {
            delete errorDetails[key];
        }
    }
    return errorDetails as { [key: string]: string };
}
