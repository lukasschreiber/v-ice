import { HTMLProps } from "react";
import WarningIcon from "@/assets/WarningIcon.svg?react";
import LightBulb from "@/assets/LightBulb.svg?react";
import InfoIcon from "@/assets/InfoIcon.svg?react";
import { useTranslation } from "react-i18next";

export enum InfoBoxType {
    NOTE = "note",
    WARNING = "warning",
    TIP = "tip",
}

export function InfoBox(props: HTMLProps<HTMLDivElement> & {type: InfoBoxType}) {
    const {t} = useTranslation();
    const backgroundColor = props.type === InfoBoxType.NOTE || props.type === InfoBoxType.TIP ? "bg-primary-100" : "bg-amber-100";
    const headerBackgroundColor = props.type === InfoBoxType.NOTE || props.type === InfoBoxType.TIP ? "bg-primary-400" : "bg-amber-400";
    const headerTextColor = props.type === InfoBoxType.NOTE || props.type === InfoBoxType.TIP ? "text-white" : "text-white";
    const headerTitle = props.type === InfoBoxType.NOTE ? t("help.note") : props.type === InfoBoxType.TIP ? t("help.tip") : t("help.warning");
    const Icon = props.type === InfoBoxType.NOTE ? InfoIcon : props.type === InfoBoxType.TIP ? LightBulb : WarningIcon;

    return (
        <div className={`${backgroundColor} rounded-md overflow-hidden mb-4`}>
            <div className={`${headerBackgroundColor} ${headerTextColor} font-semibold px-2 py-0.5 flex flex-row gap-1 items-center`}><Icon className="w-5 h-5" />{headerTitle}</div>
            <div className={`px-2 py-0.5 [&>p]:!mb-0`}>
                {props.children}
            </div>
        </div>
    );
}