import { Canvas, Clients, DataColumn, DataTable, Types, useQuery } from "v-ice";
import { useEffect, useState } from "react";

function App() {
    const {setQuerySource, addTarget, getQueryResultById} = useQuery();
    const [target, setTarget] = useState<string>("");

    useEffect(() => {
        Types.registry.registerEnum("Name", {columns: ["Name"]})
        Types.registry.registerEnum("Major", {columns: ["Major"]})
        setQuerySource(
            // load data from a file
            DataTable.fromColumns([
                new DataColumn("Name", Types.enum("Name"), ["Alice", "Bob", "Charlie"]),
                new DataColumn("Age", Types.number, [25, 30, 35]),
                new DataColumn("IsStudent", Types.boolean, [true, false, true]),
                new DataColumn("GPA", Types.number, [3.5, 3.0, 3.8]),
                new DataColumn("Major", Types.enum("Major"), ["Computer Science", "Mathematics", "Physics"]),
            ])
        );
       setTarget(addTarget("Target", "default_target"));

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        console.log(target, getQueryResultById(target));
    }, [getQueryResultById, target]);

    return (
        <>
            <Canvas width={1000} height={700} language={"en"} queryClient={Clients.js} />
        </>
    );
}

export default App;
