import SecureQueryWorker from "@/query/workers/js_secure_query_worker?worker";
import { JSBaseWorkerRuntime } from "./js_base_worker_runtime";

export class JSSecureRuntime extends JSBaseWorkerRuntime {
    constructor() {
        super(new SecureQueryWorker());
    }
}