export enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
}

const levelStyles: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: "color: #9966ff; font-weight: bold;",
    [LogLevel.INFO]: "color: #59c059; font-weight: bold;",
    [LogLevel.WARN]: "color: #ffab19; font-weight: bold;",
    [LogLevel.ERROR]: "color: red; font-weight: bold;",
};

type Loggable = string | number | boolean | undefined | null | Record<string, unknown> | Loggable[];
type LogVariables = Record<string, Loggable>;

async function shouldLog(level: LogLevel): Promise<boolean> {
    const store = (await import("@/store/store")).store;
    if (!store) {
        return false; // Store not available, cannot determine log level
    }
    const allowedLogLevel = store.getState().settings.debugger.logLevel;
    return Object.values(LogLevel).indexOf(level) >= Object.values(LogLevel).indexOf(allowedLogLevel);
}

async function logImpl(level: LogLevel, messages: Loggable[], variables: LogVariables = {}, skipTime: boolean = false, thrownBefore: boolean = false): Promise<void> {
    if (!await shouldLog(level)) {
        return;
    }

    try {
        let timestamp = "--:--:--";
        if (!skipTime) {
            timestamp = Intl.DateTimeFormat(document.documentElement.lang, {
                dateStyle: undefined,
                timeStyle: "medium",
                hour12: false,
            }).format(new Date());
        }
        const style = levelStyles[level] || "";

        console.groupCollapsed(`%c[V-ICE] [${timestamp}] [${level}]%c`, style, "color: inherit; font-weight: normal;", ...messages);
        for (const [name, value] of Object.entries(variables)) {
            console.log(`%c${name}:%c`, "font-weight: bold; color: #4c97ff;", "color: #ccc;", value);
        }

        console.trace(); // This prints the original call location
        console.groupEnd();
    } catch (e) {
        if (thrownBefore) {
            console.error("Error while logging, logging the error instead", e);
        } else {
            logImpl(level, messages, variables, true, true);
        }
    }
}

export function debug(...message: Loggable[]): LogBuilder {
    return logger().setLevel(LogLevel.DEBUG).addMessage(...message);
}

export function info(...message: Loggable[]): LogBuilder {
    return logger().setLevel(LogLevel.INFO).addMessage(...message);
}

export function warn(...message: Loggable[]): LogBuilder {
    return logger().setLevel(LogLevel.WARN).addMessage(...message);
}

export function error(...message: Loggable[]): LogBuilder {
    return logger().setLevel(LogLevel.ERROR).addMessage(...message);
    
}

export function assert(condition: boolean, ...message: Loggable[]): void {
    if (!condition) {
        logger().setLevel(LogLevel.ERROR).addMessage(...message).log();
    }
}

export function logger(): LogBuilder {
    return new LogBuilder();
}

class LogBuilder {
    private level: LogLevel = LogLevel.INFO;
    private messages: Loggable[] = [];
    private variables: LogVariables = {};

    setLevel(level: LogLevel): this {
        this.level = level;
        return this;
    }

    addMessage(...message: Loggable[]): this {
        this.messages.push(...message);
        return this;
    }

    addVariable(name: string, value: Loggable): this {
        this.variables[name] = value;
        return this;
    }

    addVariables(variables: LogVariables): this {
        this.variables = { ...this.variables, ...variables };
        return this;
    }

    log(): void {
        logImpl(this.level, this.messages, this.variables);
    }
}

info("Hello from V-ICE logger!").log();