import { DataRow } from "@/main";
import { QueryWorkerAction } from "./query_worker_interface";

export abstract class BaseWorker {
    protected rows: DataRow[] = [];

    constructor() {
        self.onmessage = this.handleMessage.bind(this);
    }

    private handleMessage(event: MessageEvent<{ action: QueryWorkerAction.RunQuery; query: string } | {action: QueryWorkerAction.SetRows, rows: DataRow[]}>) {
        const { action } = event.data;

        switch (action) {
            case QueryWorkerAction.SetRows:
                if (event.data.rows) this.setRows(event.data.rows);
                break;

            case QueryWorkerAction.RunQuery:
                if (event.data.query) this.runQuery(event.data.query);
                break;

            default:
                console.warn(`Unknown action received: ${action}`);
        }
    }

    protected setRows(rows: DataRow[]) {
        this.rows = rows;
    }

    protected abstract runQuery(query: string): void;
}
