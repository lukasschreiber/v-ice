import SimpleQueryWorker from "@/query/workers/js_simple_query_worker?worker";
import { JSBaseWorkerRuntime } from "./js_base_worker_runtime";

export class JSWorkerRuntime extends JSBaseWorkerRuntime {
    constructor() {
        super(new SimpleQueryWorker());
    }
}