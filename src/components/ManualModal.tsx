import { DraggableModal, ModalContent, ModalHeader, ModalProps } from "./common/DraggableModal";
import { createPortal } from "react-dom";
import { ManualPage } from "./ManualPage";
import { useTranslation } from "react-i18next";

export function HelpModal(props: ModalProps) {
    const {t} = useTranslation();
    return createPortal(
        <DraggableModal {...props} className="top-16 right-24 max-h-[700px] min-h-[700px] min-w-[600px]">
            <ModalHeader>
                {t("help.title")}
            </ModalHeader>
            <ModalContent>
                <ManualPage />
            </ModalContent>
        </DraggableModal>,
        document.body
    );
}
