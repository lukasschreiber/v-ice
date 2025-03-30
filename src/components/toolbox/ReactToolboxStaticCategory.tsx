import { IStaticToolboxCategory } from "@/blocks/toolbox/builder/definitions";
import { ReactToolboxRow } from "./ReactToolboxRow";

export function ReactToolboxStaticCategory(props: IStaticToolboxCategory) {
    return (
        <div>
            <h3>{props.name}</h3>
            <div>
                {props.blocks.map((block, index) => {
                    return <ReactToolboxRow key={index} block={block} />;
                })}
            </div>
        </div>
    );
}
