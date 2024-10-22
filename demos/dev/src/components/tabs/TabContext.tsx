import { createContext, useEffect, useState } from "react";

export function TabContextProvider(props: React.ComponentPropsWithoutRef<"div">) {
    const activeTabKey = "activeTab"
    const [activeTab, setActiveTab] = useState(parseInt(localStorage.getItem(activeTabKey) ?? "0"));

    useEffect(() => {
        localStorage.setItem(activeTabKey, activeTab.toString())
    }, [activeTab])

    return <TabContext.Provider value={{ activeTab, setActiveTab }}>{props.children}</TabContext.Provider>;
}

export const TabContext = createContext<{
    activeTab: number;
    setActiveTab: React.Dispatch<React.SetStateAction<number>>;
}>({
    activeTab: 0,
    setActiveTab: () => {},
});