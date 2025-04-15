import { Layer } from "@/utils/zindex";
import { useWorkspace } from "@/main";
import { useSelector } from "@/store/hooks";
import { useRef, useState, useMemo } from "react";
import types from "@/data/types";
import { ReactToolboxBlockItem } from "@/toolbox/react/ReactToolboxBlockItem";

export function VariablesOverlay() {
    const { workspace } = useWorkspace();
    const variables = useSelector(state => state.blockly.variables);
    const [searchValue, setSearchValue] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const itemRefs = useRef(new Map());

    const searchQuery = searchValue.toLowerCase().trim();

    // Memoized sorting and filtering
    const collator = useMemo(() => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }), []);

    const sortedFilteredVariables = useMemo(() => {
        return variables
            .filter(variable => variable.name.toLowerCase().includes(searchQuery))
            .filter(variable => selectedType === "" || types.utils.toString(variable.type) === selectedType)
            .sort((a, b) => {
                return sortDirection === "asc"
                    ? collator.compare(a.name, b.name)
                    : collator.compare(b.name, a.name);
            });
    }, [variables, searchQuery, sortDirection, collator, selectedType]);


    if (!workspace) {
        return null;
    }

    return (
        <div
            className="fixed top-0 right-0 w-fit h-fit bg-pink-300/50 p-2 flex gap-2 flex-col"
            data-deletezone={true}
            style={{ zIndex: Layer.SearchOverlay }}
        >
            <div className="flex gap-2 flex-col">
                <input
                    type="text"
                    placeholder="Search variables"
                    className="p-1"
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                />
                <button onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}>
                    {sortDirection === "asc" ? "ASC" : "DESC"}
                </button>
                <select onChange={e => setSelectedType(e.target.value)} value={selectedType}>
                    <option value="">All types</option>
                    {Array.from(new Set(variables.map(variable => types.utils.toString(variable.type)))).map((type, index) => (
                        <option key={index} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>
            Variables:
            {sortedFilteredVariables.map(variable => {
                // Use cached instance if available, else create one
                if (!itemRefs.current.has(variable.id)) {
                    itemRefs.current.set(
                        variable.id,
                        <ReactToolboxBlockItem variable={workspace.getVariableById(variable.id)} height={40} />
                    );
                }

                return (
                    <div key={variable.id} style={{ height: 40 }}>
                        {itemRefs.current.get(variable.id)}
                    </div>
                );
            })}
        </div>
    );
}
