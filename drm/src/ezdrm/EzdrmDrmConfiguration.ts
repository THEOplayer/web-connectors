import { DRMConfiguration } from 'theoplayer';

/**
 * The identifier of the Ezdrm integration.
 */
export type EzdrmIntegrationID = 'ezdrm';

/**
 * Describes the configuration of the Ezdrm DRM integration.
 *
 * ```
 * const drmConfiguration = {
 *      integration : 'ezdrm',
 *      fairplay: {
 *          certificateURL: 'yourEzdrmCertificateUrl',
 *          licenseAcquisitionURL: 'yourEzdrmLicenseAcquisitionURL'
 *      }
 * }
 * ```
 */
export interface EzdrmDrmConfiguration extends DRMConfiguration {
    /**
     * The identifier of the DRM integration.
     */
    integration: EzdrmIntegrationID;
}
