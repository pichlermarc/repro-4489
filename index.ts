// Import downloaded modules: winston
import Transport from "winston-transport";
import type TransportStream from "winston-transport";

// Import downloaded modules: Open Telemetry
import { Logger } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc";
import { Resource } from "@opentelemetry/resources";
import {
    LoggerProvider,
    SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

const OpenTelemetryLogLevel = {
    FATAL: 21,
    ERROR: 17,
    WARN: 13,
    INFO: 9,
    DEBUG: 5,
    TRACE: 1,
} as const;

// we use default winston level https://github.com/winstonjs/winston#logging-levels
// OTL have different level, we need to do a mapping, so customer have final log in OTLP
const mapLogLevelFromNpmToOpenTelemetry = (
    level: string,
): keyof typeof OpenTelemetryLogLevel => {
    switch (level) {
        case "error":
            return "ERROR";
        case "warn":
            return "WARN";
        case "info":
            return "INFO";
        case "verbose":
        case "debug":
        case "silly":
            return "DEBUG";
        default:
            return "INFO";
    }
};

const mapNpmLogLevelToOpenTelemetrySeverityNumber = (
    level: string | undefined,
): (typeof OpenTelemetryLogLevel)[keyof typeof OpenTelemetryLogLevel] => {
    switch (level) {
        case "trace":
            return 1;
        case "verbose":
        case "debug":
            return 5;
        case "info":
            return 9;
        case "warn":
            return 13;
        case "error":
            return 17;
        case "fatal":
            return 21;

        default:
            return 9;
    }
};

export class OpenTelemetryWinstonTransport extends Transport {
    loggerOTL: Logger;

    constructor(opts?: TransportStream.TransportStreamOptions) {
        super(opts);
        const logExporter = new OTLPLogExporter();
        const loggerProvider = new LoggerProvider({
            resource: new Resource({
                [SemanticResourceAttributes.SERVICE_NAME]:
                    process.env["OTEL_SERVICE_NAME"],
            }),
        });

        loggerProvider.addLogRecordProcessor(
            new SimpleLogRecordProcessor(logExporter),
        );
        this.loggerOTL = loggerProvider.getLogger("default");
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    override log(info: any, next: () => void) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        setImmediate(() => {
            const logRecord = {
                severityNumber:
                    info?.severityNumber ||
                    mapNpmLogLevelToOpenTelemetrySeverityNumber(info?.level),
                severityText:
                    mapLogLevelFromNpmToOpenTelemetry(info?.level || "") || "",
                body: info?.message || "",
            };

            this.loggerOTL.emit(logRecord);
            next();
        });
    }
}

new OpenTelemetryWinstonTransport();