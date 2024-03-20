declare namespace ns_ {
    namespace analytics {
      enum ConnectivityType {
        UNKNOWN,
        UNAVAILABLE,
        DISCONNECTED,
        CONNECTED,
        ETHERNET,
        WIFI,
        WWAN,
        BLUETOOTH,
        EMULATOR
      }

      enum PlatformAPIs {
        SmartTV,
        Netcast,
        Cordova,
        Trilithium,
        AppleTV,
        Chromecast,
        Xbox,
        webOS,
        tvOS,
        nodejs,
        html5,
        JSMAF,
        Skeleton,
        WebBrowser
      }

      namespace PlatformApi {
        function setPlatformAPI(platformApi: PlatformAPIs): void;
        function setPlatformAPI(platformApi: PlatformAPIs, interfaceObject: unknown): void;
        function setPlatformApi(platformApi: PlatformAPIs, interfaceObject: unknown): void;
      }

      class StreamingAnalytics {
        createPlaybackSession(): void
        getPlaybackSessionId(): void
        loopPlaybackSession(): void
        notifyBufferStart(): void
        notifyBufferStop(): void
        notifyChangePlaybackRate(rate: number): void;
        notifyEnd(): void
        notifyPause(): void
        notifyPlay(): void
        notifySeekStart(): void
        setDvrWindowLength(length: number): void;
        setImplementationId(id: string): void;
        setMetadata(metadata: any): void;
        setProjectId(id: string): void;
        startFromDvrWindowOffset(offset: number): void;
        startFromPosition(position: number): void;
        startFromSegment(segment: any): void;
        constructor();
      }
  
      namespace StreamingAnalytics {
        namespace AdvertisementMetadata {
            export enum AdvertisementType {
              ON_DEMAND_PRE_ROLL,
              ON_DEMAND_MID_ROLL,
              ON_DEMAND_POST_ROLL,
              LIVE,
              BRANDED_ON_DEMAND_PRE_ROLL,
              BRANDED_ON_DEMAND_MID_ROLL,
              BRANDED_ON_DEMAND_POST_ROLL,
              BRANDED_AS_CONTENT,
              BRANDED_DURING_LIVE,
              OTHER,
            }

            export enum AdvertisementDeliveryType {
                NATIONAL,
                LOCAL,
                SYNDICATION
              }
          }
    
          class AdvertisementMetadata {
            addCustomLabels(labels: any): void;
            classifyAsAudioStream(isAudio: boolean): void;
            setCallToActionUrl(url: string): void;
            setClipUrl(url: string): void;
            setDeliveryType(type: StreamingAnalytics.AdvertisementMetadata.AdvertisementDeliveryType): void;
            setLength(length: number): void;
            setMediaType(type: StreamingAnalytics.AdvertisementMetadata.AdvertisementType): void;
            setOwner(owner: string): void;
            setPlacementId(id: string): void;
            setRelatedContentMetadata(metadata: any): void;
            setServer(server: string): void;
            setServerCampaignId(id: string): void;
            setSiteId(id: string): void;
            setTitle(title: string): void;
            setUniqueId(id: string): void;
            setVideoDimensions(width: number, height: number): void;
    
            constructor();
          }

        namespace ContentMetadata {

          export enum ContentDeliveryAdvertisementCapability {
            NONE,
            DYNAMIC_LOAD,
            DYNAMIC_REPLACEMENT,
            LINEAR_1DAY,
            LINEAR_2DAY,
            LINEAR_3DAY,
            LINEAR_4DAY,
            LINEAR_5DAY,
            LINEAR_6DAY,
            LINEAR_7DAY
          }

          export enum ContentDeliveryComposition {
            CLEAN,
            EMBED
          }

          export enum ContentDeliveryMode {
            LINEAR,
            ON_DEMAND
          }

          export enum ContentDeliverySubscriptionType {
            ADVERTISING,
            PREMIUM,
            SUBSCRIPTION,
            TRADITIONAL_MVPD,
            TRANSACTIONAL,
            VIRTUAL_MVPD,
          }

          export enum ContentDistributionModel {
            EXCLUSIVELY_ONLINE,
            TV_AND_ONLINE
          }

          export enum ContentFeedType {
            EAST_HD,
            EAST_SD,
            OTHER,
            WEST_HD,
            WEST_SD
          }

          export enum ContentMediaFormat {
            EXTRA_EPISODE,
            EXTRA_GENERIC,
            EXTRA_MOVIE,
            FULL_CONTENT_EPISODE,
            FULL_CONTENT_GENERIC,
            FULL_CONTENT_MOVIE,
            PARTIAL_CONTENT_EPISODE,
            PARTIAL_CONTENT_GENERIC,
            PARTIAL_CONTENT_MOVIE,
            PREVIEW_EPISODE,
            PREVIEW_GENERIC,
            PREVIEW_MOVIE
          }

          export enum ContentType {
            LONG_FORM_ON_DEMAND,
            SHORT_FORM_ON_DEMAND,
            LIVE,
            USER_GENERATED_SHORT_FORM_ON_DEMAND,
            USER_GENERATED_LONG_FORM_ON_DEMAND,
            USER_GENERATED_LIVE,
            BUMPER,
            OTHER,
          }
        }
  
        class ContentMetadata {
            addCustomLabels(labels: any): void;
            carryTvAdvertisementLoad(carriesTvAdvertisementLoad: boolean): void;
            classifyAsAudioStream(audioStream: boolean): void;
            classifyAsCompleteEpisode(completeEpisode: boolean): void;
            setClipUrl(url: string): void;
            setDateOfDigitalAiring(year: number, month: number, day: number): void;
            setDateOfProduction(year: number, month: number, day: number): void;
            setDateOfTvAiring(year: number, month: number, day: number): void;
            setDeliveryAdvertisementCapability(value: StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability): void;
            setDeliveryComposition(value: StreamingAnalytics.ContentMetadata.ContentDeliveryComposition): void;
            setDeliveryMode(value: StreamingAnalytics.ContentMetadata.ContentDeliveryMode): void;
            setDeliverySubscriptionType(value: StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType): void;
            setDictionaryClassificationC3(value: string): void;
            setDictionaryClassificationC4(value: string): void;
            setDictionaryClassificationC6(value: string): void;
            setDistributionModel(value: StreamingAnalytics.ContentMetadata.ContentDistributionModel): void;
            setEpisodeId(id: string): void;
            setEpisodeNumber(episodeNumber: string): void;
            setEpisodeSeasonNumber(seasonNumber: string): void;
            setEpisodeTitle(title: string): void;
            setFeedType(value: StreamingAnalytics.ContentMetadata.ContentFeedType): void;
            setGenreId(id: string): void;
            setGenreName(name: string): void;
            setLength(length: number): void;
            setMediaFormat(value: StreamingAnalytics.ContentMetadata.ContentMediaFormat): void;
            setMediaType(value: StreamingAnalytics.ContentMetadata.ContentType): void;
            setNetworkAffiliate(code: string): void;
            setPlaylistTitle(title: string): void;
            setProgramId(id: string): void;
            setProgramTitle(title: string): void;
            setPublisherName(name: string): void;
            setStationCode(code: string): void;
            setStationTitle(title: string): void;
            setTimeOfDigitalAiring(hours: number, minutes: number): void;
            setTimeOfProduction(hours: number, minutes: number): void;
            setTimeOfTvAiring(hours: number, minutes: number): void;
            setTotalSegments(total: number): void;
            setUniqueId(id: string): void;
            setVideoDimensions(width: number, height: number): void;
  
            constructor();

        }

      }

      namespace configuration {
        function setApplicationName(name: string): void;
  
        function setApplicationVersion(name: string): void;
  
        function addClient(config: PublisherConfiguration): void;
  
        function getPublisherConfiguration(id: string): any;
  
        function setPersistentLabel(name: string, value: any): void;
  
        function addPersistentLabels(labels: any): void;
  
        function enableImplementationValidationMode(): void;
  
        function enableChildDirectedApplicationMode(): void;
  
        class PublisherConfiguration {
          publisherId: string;
          constructor({ }: any)
        }
      }
      function setMediaPlayerName(name: string): void;
      
      function setMediaPlayerVersion(version: string): void;
  
      function notifyHiddenEvent(): void;
  
      function notifyEnterForeground(): void;
  
      function notifyExitForeground(): void;
  
      function close(): void;
  
      function start(): void;

    }
  }
  