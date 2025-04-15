import { DraggableModal, ModalContent, ModalHeader, ModalProps } from "./common/DraggableModal";
import { ManualPage } from "./ManualPage";
import { useTranslation } from "react-i18next";
import WindowIcon from "@/assets/WindowIcon.svg?react";
import { Tooltip } from "./common/Tooltip";
import { useContext } from "react";
import { SettingsContext } from "@/context/settings/settings_context";
import { Layer } from "@/utils/zindex";

export function ManualModal({ onUndock, ...props }: ModalProps & { onUndock?: () => void }) {
    const { t } = useTranslation();
    const { settings } = useContext(SettingsContext);

    return (
        <DraggableModal {...props} className="top-16 right-24 max-h-[700px] min-h-[700px] min-w-[600px]">
            <ModalHeader>
                {t("help.title")}
                {settings.allowManualToPopout && <div className="absolute right-10 ">
                    <Tooltip text={"Show in new window"} position="left" style={{ zIndex: Layer.Tooltips + Layer.Modals}}>
                        <WindowIcon
                            className="cursor-pointer w-6 h-6 text-white p-0.5 rounded-sm hover:bg-white/20"
                            onClick={() => onUndock?.()}
                        />
                    </Tooltip>
                </div>}
            </ModalHeader>
            <ModalContent>
                <ManualPage />
            </ModalContent>
        </DraggableModal>
    );
}
