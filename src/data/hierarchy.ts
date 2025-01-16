export interface IHierarchyDefinition {
    meta: IHierarchyDefinitionMetadata,
    hierarchy: IHierarchy;
}

export interface IHierarchyDefinitionMetadata {
    topLevelSort: string[];
}

export interface IHierarchyEntry {
    name: string;
    children: IHierarchy;
}

export interface IHierarchy {
    [key: string]: IHierarchyEntry;
}

export class Hierarchy {
    protected hierarchy: IHierarchy;
    protected topLevelSort: string[];
    protected index: Map<string, string[]> = new Map();
    protected name: string;

    constructor(definition: IHierarchyDefinition, type: string) {
        this.hierarchy = definition.hierarchy;
        this.topLevelSort = definition.meta.topLevelSort;
        this.name = type;
    }

    public getName(): string {
        return this.name;
    }

    public getHierarchy(): IHierarchy {
        return this.hierarchy;
    }

    public getTopLevelSort(): string[] {
        return this.topLevelSort;
    }

    public getEntry(key: string): IHierarchyEntry | null {
        const route = this.findRoute(key);
        if (!route) return null;
        return this.getEntryFromRoute(route);
    }

    public getRoot(): IHierarchyEntry {
        return {
            name: ".",
            children: this.hierarchy,
        };
    }

    public getHierarchyDefinition(): IHierarchyDefinition {
        return {
            meta: {
                topLevelSort: this.topLevelSort,
            },
            hierarchy: this.hierarchy,
        };
    }

    protected getEntryFromRoute(route: string[]): IHierarchyEntry | null {
        let currentHierarchy = this.hierarchy;
        for (const key of route.slice(0, -1)) {
            if (!currentHierarchy[key]) return null;
            currentHierarchy = currentHierarchy[key].children;
        }
        return currentHierarchy[route[route.length - 1]];
    }

    protected findRoute(key: string): string[] | null {
        if (this.index.has(key)) {
            return this.index.get(key)!;
        } else {
            const route = this.findRouteRecursive(key, this.hierarchy, []);
            if (route) {
                this.index.set(key, route);
            }
            return route;
        }
    }

    public getRoute(key: string): string[] | null {
        return this.findRoute(key);
    }

    public getEntriesOnRoute(key: string): (IHierarchyEntry & {code: string})[] {
        const route = this.findRoute(key);
        if (!route) return [];

        let currentHierarchy = this.hierarchy;
        const entries: (IHierarchyEntry & {code: string})[] = [];
        for (const key of route) {
            if (!currentHierarchy[key]) return entries;
            entries.push({...currentHierarchy[key], code: key});
            currentHierarchy = currentHierarchy[key].children;
        }
        return entries;
    }

    protected findRouteRecursive(key: string, hierarchy: IHierarchy, route: string[]): string[] | null {
        for (const [currentKey, entry] of Object.entries(hierarchy || {})) {
            if (currentKey === key) {
                return [...route, key];
            } else {
                const subRoute = this.findRouteRecursive(key, entry.children, [...route, currentKey]);
                if (subRoute) {
                    return subRoute;
                }
            }
        }
        return null;
    }

    getAllEntryNames(): string[] {
        return this.getAllEntryNamesRecursive(this.hierarchy)
    }

    protected getAllEntryNamesRecursive(hierarchy: IHierarchy | undefined): string[] {
        let names: string[] = [];
        if (!hierarchy) return names;
        for (const [key, entry] of Object.entries(hierarchy)) {
            names.push(key);
            names = names.concat(this.getAllEntryNamesRecursive(entry.children));
        }
        return names;
    }

}