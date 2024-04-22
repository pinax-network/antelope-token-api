import { Logger, type ILogObj } from "tslog";
import { APP_NAME, APP_VERSION } from "./config.js";

class TsLogger extends Logger<ILogObj> {
    constructor() {
        super();
        this.settings.minLevel = 5;
        this.settings.name = `${APP_NAME}:${APP_VERSION}`;
    }

    public enable(type: "pretty" | "json" = "pretty") {
        this.settings.type = type;
        this.settings.minLevel = 0;
    }

    public disable() {
        this.settings.type = "hidden";
    }
}

export const logger = new TsLogger();