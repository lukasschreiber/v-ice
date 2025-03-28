export enum Layer {
    Base = 0,

    // This is not actually set, but it's here for reference, it comes from Blockly
    Toolbox = 20,

    // This is not actually set, but it's here for reference, it comes from Blockly
    Menu = 70,

    FloatingButtons = 71,
    SearchOverlay = 72,

    Tooltips = 99,
    Notifications = 101,
    ContextMenu = 102,
    
    Loading = 999,
    // All of the modals are draggable, so they should not only be on top of everything in v-ice but also on top of everything in the host application
    Modals = 10000000,
}