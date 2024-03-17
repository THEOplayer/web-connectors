import { ChromelessPlayer } from "theoplayer";
import { ComscoreConfiguration } from "../api/ComscoreConfiguration";
import { ComscoreMetadata } from "../api/ComscoreMetadata";

export class ComscoreTHEOIntegration {
    private contentMetadata: ComscoreMetadata;

    constructor(player: ChromelessPlayer, configuration: ComscoreConfiguration, metadata: ComscoreMetadata) {

    }

    public update(metadata: ComscoreMetadata) {
        this.contentMetadata = metadata;
    }

    public destroy() {
        this.removeListeners();
    }

    private removeListeners() {
        
    }
}