"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenTelemetryWinstonTransport = void 0;
// Import downloaded modules: winston
const winston_transport_1 = __importDefault(require("winston-transport"));
const exporter_logs_otlp_grpc_1 = require("@opentelemetry/exporter-logs-otlp-grpc");
const resources_1 = require("@opentelemetry/resources");
const sdk_logs_1 = require("@opentelemetry/sdk-logs");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const OpenTelemetryLogLevel = {
    FATAL: 21,
    ERROR: 17,
    WARN: 13,
    INFO: 9,
    DEBUG: 5,
    TRACE: 1,
};
// we use default winston level https://github.com/winstonjs/winston#logging-levels
// OTL have different level, we need to do a mapping, so customer have final log in OTLP
const mapLogLevelFromNpmToOpenTelemetry = (level) => {
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
const mapNpmLogLevelToOpenTelemetrySeverityNumber = (level) => {
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
class OpenTelemetryWinstonTransport extends winston_transport_1.default {
    constructor(opts) {
        super(opts);
        const logExporter = new exporter_logs_otlp_grpc_1.OTLPLogExporter();
        const loggerProvider = new sdk_logs_1.LoggerProvider({
            resource: new resources_1.Resource({
                [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: process.env["OTEL_SERVICE_NAME"],
            }),
        });
        loggerProvider.addLogRecordProcessor(new sdk_logs_1.SimpleLogRecordProcessor(logExporter));
        this.loggerOTL = loggerProvider.getLogger("default");
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    log(info, next) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        setImmediate(() => {
            const logRecord = {
                severityNumber: (info === null || info === void 0 ? void 0 : info.severityNumber) ||
                    mapNpmLogLevelToOpenTelemetrySeverityNumber(info === null || info === void 0 ? void 0 : info.level),
                severityText: mapLogLevelFromNpmToOpenTelemetry((info === null || info === void 0 ? void 0 : info.level) || "") || "",
                body: (info === null || info === void 0 ? void 0 : info.message) || "",
            };
            this.loggerOTL.emit(logRecord);
            next();
        });
    }
}
exports.OpenTelemetryWinstonTransport = OpenTelemetryWinstonTransport;
new OpenTelemetryWinstonTransport();
