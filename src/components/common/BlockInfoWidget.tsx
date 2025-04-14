import { useWorkspace } from "@/main"
import { ContinuousCategory, ContinuousToolbox } from "@/toolbox/blockly/toolbox"
import { darken, isTooLight, lighten } from "@/utils/color"
import { useEffect, useState } from "react"

export function BlockInfoWidget(props: { type: string }) {
    const {workspace} = useWorkspace()
    const [status, setStatus] = useState({text: "", color: "", bgColor: "", borderColor: "", hidden: false})

    useEffect(() => {
        const targetWorkspace = workspace
        const toolboxWorkspace = targetWorkspace?.getToolbox()?.getFlyout()?.getWorkspace()
        if (!toolboxWorkspace) return

        setStatus(() => {
            const blocks = toolboxWorkspace.getBlocksByType(props.type)
            if (blocks.length === 0){
                return {text: "Ausgeblendet", color: "#db2727", bgColor: "#f2c9cd", borderColor: "#f47374", hidden: false}
            } else {
                // get the category of the block
                const toolbox = targetWorkspace.getToolbox() as ContinuousToolbox
                const category = toolbox.getCategoryByBlockType(props.type) as ContinuousCategory
                if (!category) return {text: "", color: "", bgColor: "", borderColor: "", hidden: true}

                if (isTooLight(category.getColor())) {
                    return {text: category.getName(), color: "text-black", bgColor: category.getColor(), borderColor: darken(category.getColor(), 0.2), hidden: false}
                }

                const textColor = darken(category.getColor(), 0.2)
                const backgroundColor = lighten(category.getColor(), 0.2)
                const borderColor = category.getColor()
                
                return {text: category.getName(), color: textColor, bgColor: backgroundColor, borderColor, hidden: false}
            }
        })

    }, [props.type, workspace])

    return (
        <div style={{display: status.hidden ? "none" : "inline-block", color: status.color, backgroundColor: status.bgColor, borderColor: status.borderColor}} className={`py-0.5 px-2 text-sm font-normal rounded-full border`}>
            {status.text}
        </div>
    )
}