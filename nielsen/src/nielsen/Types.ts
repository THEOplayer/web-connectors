export type AdType = 'preroll' | 'midroll' | 'postroll' | 'ad';

export type NielsenConfiguration = {
    country: NielsenCountry;
    enableDTVR: boolean;
    enableDCR: boolean;
};

export type NielsenOptions = {
    // HTML DOM element id of the player container
    containerId?: string;

    // Enables Debug Mode which allows output to be viewed in console.
    nol_sdkDebug?: string;

    // Set the ability to optout on initialization of the SDK
    optout?: boolean;
};

export type DCRContentMetadata = {
    /*
     * A fixed dial specifying the type of measured content
     */
    type: string;
    /*
     * Unique identifier for the video content (video file). Any label according to the needs of the TV company, which will ensure the identification of the same content across platforms. It can also be used for chaining several pieces of information from internal systems. At the beginning, the possibility of adding a client ID (to ensure uniqueness across clients)
     */
    assetid: string;
    /*
     * Content description (name of the show, channel name, etc.)
     */
    program: string;
    /*
     * Detailed description of content.
     * [VOD] episode title
     * [LIVE] name of the program (if it is available and can be dynamically changed along with the change of the program. Otherwise, fill in only the name of the channel))
     */
    title: string;
    /*
     * The length of the broadcast video content. It is also used to uniquely distinguish VOD and live broadcasts. This is the length of the currently playing content/file. If the content is, for example, only a part of the program, the length of this played part of the program is indicated. Use 86400 for live content.
     */
    length: string;
    /*
     * Broadcast date, if you cannot fill in the correct value, please use the constant "19700101 00:00:01".
     * [VOD] The date and time the video content was exposed online YYYYMMDD HH24:MI:SS.
     * [LIVE] Midnight of the current day in YYYYMMDD 00:00:00 format
     */
    airdate: string;
    /*
     * Indication of whether the video content being played is the entire episode or only part of it. Always use 'y' for live.
     */
    isfullepisode: string;
    /*
     * CMS tag helper item. The method of recording ads insertion: 1. Linear – corresponds to TV insertion of ads 2. Dynamic – Dynamic Ad Insertion (DAI)
     */
    adloadtype: string;
};

export enum AdLoadType {
    linear = '1',
    dynamic = '2'
}

export type NielsenDCRContentMetadata = {
    /*
     * Unique identifier for the video content (video file). Any label according to the needs of the TV company, which will ensure the identification of the same content across platforms. It can also be used for chaining several pieces of information from internal systems. At the beginning, the possibility of adding a client ID (to ensure uniqueness across clients)
     */
    assetid: string;
    /*
     * Content description (name of the show, channel name, etc.)
     */
    program: string;
    /*
     * Detailed description of content.
     * [VOD] episode title
     * [LIVE] name of the program (if it is available and can be dynamically changed along with the change of the program. Otherwise, fill in only the name of the channel))
     */
    title: string;
    /*
     * The length of the broadcast video content. It is also used to uniquely distinguish VOD and live broadcasts. This is the length of the currently playing content/file. If the content is, for example, only a part of the program, the length of this played part of the program is indicated. Use 86400 for live content.
     */
    length: string;
    /*
     * Broadcast date, if left empty, "19700101 00:00:01" will be reported.
     * [VOD] The date and time the video content was exposed online YYYYMMDD HH24:MI:SS.
     * [LIVE] Midnight of the current day in YYYYMMDD 00:00:00 format
     */
    airdate?: string;
    /*
     * Indication of whether the video content being played is the entire episode or only part of it. Always reported as true for live.
     */
    isfullepisode: boolean;
    /*
     * CMS tag helper item. The method of recording ads insertion: 1. Linear – corresponds to TV insertion of ads 2. Dynamic – Dynamic Ad Insertion (DAI)
     */
    adloadtype: AdLoadType;
};

export enum HasAds {
    no_ads = '0',
    supports_ads = '1',
    unknown = '2'
}

export type NielsenDCRContentMetadataCZ = NielsenDCRContentMetadata & {
    /*
     * IDEC type identifier
     */
    crossId1: string;
    /*
     * More detailed categorization of video content.
     * [VOD] Program type (codes according to the TV code list).
     * [LIVE] The program type of the content being played, if available and can be changed dynamically with the program change. Otherwise, send an empty string.
     */
    segB: string;
    /*
     * More detailed categorization of video content.
     */
    segC?: '';
    /*
     * Live TV station code
     * [VOD] Keep this empty and pass "nol_c1":"p1,".
     * [LIVE] implementation : "nol_c1":"p1,value" where value = Live station code used in the output data of the TV audience measurement project. see current appendix of the reference manual "Appendix RP 13 - List of stations.xlsx" If the live broadcast does not correspond to any TV station, use the code 9999.
     */
    c1?: string;
    /*
     * TV Identity for VOD.
     * [VOD] Pass "nol_c2" : "p2,value" where value = To ensure the best possible harmonization of PEM D online measurement data with the data of the TV meter project, it is recommended to use TV IDENT as another online content identifier. If TVIDENT is not available at the time the content is brought online, c2 remains blank (and can be filled in later). TVIdent - same as in broadcast protocols of TV stations.
     * [LIVE] Keep empty : "nol_c2":"p2,"
     */
    c2?: string;
    /*
     * CMS tag helper item. Indication of whether the content being played supports the insertion of advertisements. “0” – No ads “1” – Supports ads “2” – Don't know (default).
     */
    hasAds: HasAds;
};

export type DCRContentMetadataCZ = DCRContentMetadata & {
    /*
     * IDEC type identifier
     */
    crossId1: string;
    /*
     * More detailed categorization of video content.
     * [VOD] Program type (codes according to the TV code list).
     * [LIVE] The program type of the content being played, if available and can be changed dynamically with the program change. Otherwise, send an empty string.
     */
    segB: string;
    /*
     * More detailed categorization of video content.
     */
    segC: '';
    /*
     * Live TV station code
     * [VOD] Keep this empty and pass "nol_c1":"p1,".
     * [LIVE] implementation : "nol_c1":"p1,value" where value = Live station code used in the output data of the TV audience measurement project. see current appendix of the reference manual "Appendix RP 13 - List of stations.xlsx" If the live broadcast does not correspond to any TV station, use the code 9999.
     */
    nol_c1?: string;
    /*
     * TV Identity for VOD.
     * [VOD] Pass "nol_c2" : "p2,value" where value = To ensure the best possible harmonization of PEM D online measurement data with the data of the TV meter project, it is recommended to use TV IDENT as another online content identifier. If TVIDENT is not available at the time the content is brought online, c2 remains blank (and can be filled in later). TVIdent - same as in broadcast protocols of TV stations.
     * [LIVE] Keep empty : "nol_c2":"p2,"
     */
    nol_c2?: string;
    /*
     * CMS tag helper item. Indication of whether the content being played supports the insertion of advertisements. “0” – No ads “1” – Supports ads “2” – Don't know (default).
     */
    hasAds: '0' | '1' | '2';
};

export type NielsenDCRContentMetadataUS = NielsenDCRContentMetadata & {
    /*
     * Gracenote TMS ID (If available) should be passed for all telecasted content for clients using the Gracenote solution for proper matching purposes
     * Note: The TMS ID will be a 14 character string. Normally leading with 2 alpha characters ('EP', 'MV', 'SH' or 'SP'), followed by 12 numbers. This should be provided to you by Nielsen
     */
    crossId1?: string;
    /*
     * Populated by content distributor to contribute viewing from that distributor to the given content originator. For a full list of acceptable values, please contact your Nielsen representative.
     */
    crossId2?: string;
    /*
     * One of two custom segments for clients' granular reporting within a brand. (Examples: Genre - horror, comedy, etc. ; Timeslot - primetime, daytime, etc. ; News type - breakingnews, weather, etc.)
     */
    segB?: string;
    /*
     * One of two custom segments for clients' granular reporting within a brand. (Examples: Genre - horror, comedy, etc. ; Timeslot - primetime, daytime, etc. ; News type - breakingnews, weather, etc.)
     */
    segC?: string;
};

export type DCRContentMetadataUS = DCRContentMetadata & {
    /*
     * Gracenote TMS ID (If available) should be passed for all telecasted content for clients using the Gracenote solution for proper matching purposes
     * Note: The TMS ID will be a 14 character string. Normally leading with 2 alpha characters ('EP', 'MV', 'SH' or 'SP'), followed by 12 numbers. This should be provided to you by Nielsen
     */
    crossId1?: string;
    /*
     * Populated by content distributor to contribute viewing from that distributor to the given content originator. For a full list of acceptable values, please contact your Nielsen representative.
     */
    crossId2?: string;
    /*
     * One of two custom segments for clients' granular reporting within a brand. (Examples: Genre - horror, comedy, etc. ; Timeslot - primetime, daytime, etc. ; News type - breakingnews, weather, etc.)
     */
    segB?: string;
    /*
     * One of two custom segments for clients' granular reporting within a brand. (Examples: Genre - horror, comedy, etc. ; Timeslot - primetime, daytime, etc. ; News type - breakingnews, weather, etc.)
     */
    segC?: string;
};

/**
 * adModel: 1) - Linear – matches TV ad load * 2) Dynamic – Dynamic Ad Insertion (DAI)
 */
export type DTVRContentMetadata = {
    type: 'content';
    adModel: '1' | '2';
} & { [key: string]: string };

export type AdMetadata = {
    type: AdType;
    assetid: any; // TODO string? or can be anything?
} & { [key: string]: string };

export type DCRAdMetadataCZ = AdMetadata & {
    /*
     * An item in the CMS tag reserved for an identifier enabling the connection of an advertisement description from the RTVK system, similarly to PEM TV data.
     */
    nol_c4: string;
    /*
     * More detailed categorization of video content
     */
    nol_c5: string;
    /*
     * Ad type (same value as in the "type" item)
     */
    nol_c6: string;
    /*
     * Ad description. Possible use for cases where the AKA code is not available. RTB - designation of the advertising supplier (e.g. if there is no AKA code or more detailed description of the advertisement).
     */
    title?: string;
    /*
     * Length of broadcast ad in seconds. (So that the length indicator is available even in cases where the AKA code is not available.)
     */
    length: string;
};

/*
 * Countries for which (1) Nielsen provides DCR Browser SDKs and (2) the corresponding SDK was tested with this integration.
 */
export enum NielsenCountry {
    US = 'US',
    CZ = 'CZ'
}
