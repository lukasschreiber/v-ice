import { BlocklyOptions, WorkspaceSvg } from "blockly";
import * as Blockly from "blockly/core";
import { ROOT_VARIABLE_STYLESHEET_ID } from "./themes/colors";


/**
 * The purpose of this function is to inject blockly into a set document object
 * The document could for example be a new window or an iframe
 * This is basically a copy of the inject function from blockly core https://github.com/google/blockly/blob/87efad06705fe054e175d4e16a78546f679cae04/core/inject.ts#L35
 * 
 * This is currently only used in the manual page, which does not need any popups or dropdowns, so only the barebones are changed.
 * All functions are private in the original function, so they are copied here.
 * 
 * @param container The container element or id to inject the blockly workspace into
 * @param document The document object to inject the blockly workspace into
 * @param opt_options The blockly options to use
 * @returns Newly created main workspace
 */
export function injectAcrossDocuments(
    container: Element | string,
    document: Document,
    opt_options?: BlocklyOptions
): WorkspaceSvg {
    let containerElement: Element | null = null;
    if (typeof container === 'string') {
        containerElement =
            document.getElementById(container) || document.querySelector(container);
    } else {
        containerElement = container;
    }

    const options = new Blockly.Options(opt_options || ({} as BlocklyOptions));
    const subContainer = document.createElement('div');
    Blockly.utils.dom.addClass(subContainer, 'injectionDiv');
    if (opt_options?.rtl) {
        Blockly.utils.dom.addClass(subContainer, 'blocklyRTL');
    }
    subContainer.tabIndex = 0;
    Blockly.utils.aria.setState(subContainer, Blockly.utils.aria.State.LABEL, Blockly.Msg['WORKSPACE_ARIA_LABEL']);

    containerElement!.appendChild(subContainer);
    const svg = createDom(subContainer, document, options);

    const workspace = createMainWorkspace(subContainer, svg, options);

    init(workspace);

    Blockly.common.setMainWorkspace(workspace);

    Blockly.common.svgResize(workspace);

    subContainer.addEventListener('focusin', function () {
        Blockly.common.setMainWorkspace(workspace);
    });

    Blockly.utils.browserEvents.conditionalBind(subContainer, 'keydown', null, onKeyDown);
    Blockly.utils.browserEvents.conditionalBind(
        Blockly.DropDownDiv.getContentDiv(),
        'keydown',
        null,
        onKeyDown,
    );
    const widgetContainer = Blockly.WidgetDiv.getDiv();
    if (widgetContainer) {
        Blockly.utils.browserEvents.conditionalBind(widgetContainer, 'keydown', null, onKeyDown);
    }

    return workspace;
}

function createDom(container: Element, document: Document, options: Blockly.Options): SVGElement {
    container.setAttribute('dir', 'LTR');

    const variablesStyle = window.document.getElementById(ROOT_VARIABLE_STYLESHEET_ID);
    if (variablesStyle) {
        document.head.appendChild(variablesStyle.cloneNode(true));
    }

    // We just let it inject the css into the document head
    Blockly.Css.inject(options.hasCss, options.pathToMedia);
    // and then we get the styles from the head and inject them into the new document
    // id is blockly-common-style
    const style = window.document.getElementById('blockly-common-style');
    if (style) {
        document.head.appendChild(style.cloneNode(true));
    }

    const svg = createSvgElement(
        Blockly.utils.Svg.SVG,
        document,
        {
            'xmlns': Blockly.utils.dom.SVG_NS,
            'xmlns:html': Blockly.utils.dom.HTML_NS,
            'xmlns:xlink': Blockly.utils.dom.XLINK_NS,
            'version': '1.1',
            'class': 'blocklySvg',
            'tabindex': '0',
        },
        container,
    );

    const defs = createSvgElement(Blockly.utils.Svg.DEFS, document, {}, svg);
    const rnd = String(Math.random()).substring(2);

    // TODO: This should be changed
    options.gridPattern = Blockly.Grid.createDom(rnd, options.gridOptions, defs);
    return svg;
}

function createMainWorkspace(
    injectionDiv: Element,
    svg: SVGElement,
    options: Blockly.Options,
): WorkspaceSvg {
    options.parentWorkspace = null;
    const mainWorkspace = new WorkspaceSvg(options);
    const wsOptions = mainWorkspace.options;
    mainWorkspace.scale = wsOptions.zoomOptions.startScale;
    svg.appendChild(
        mainWorkspace.createDom('blocklyMainBackground', injectionDiv),
    );

    // Set the theme name and renderer name onto the injection div.
    const rendererClassName = mainWorkspace.getRenderer().getClassName();
    if (rendererClassName) {
        Blockly.utils.dom.addClass(injectionDiv, rendererClassName);
    }
    const themeClassName = mainWorkspace.getTheme().getClassName();
    if (themeClassName) {
        Blockly.utils.dom.addClass(injectionDiv, themeClassName);
    }

    if (!wsOptions.hasCategories && wsOptions.languageTree) {
        // Add flyout as an <svg> that is a sibling of the workspace SVG.
        const flyout = mainWorkspace.addFlyout(Blockly.utils.Svg.SVG);
        Blockly.utils.dom.insertAfter(flyout, svg);
    }
    if (wsOptions.hasTrashcan) {
        mainWorkspace.addTrashcan();
    }
    if (wsOptions.zoomOptions && wsOptions.zoomOptions.controls) {
        mainWorkspace.addZoomControls();
    }
    // Register the workspace svg as a UI component.
    mainWorkspace
        .getThemeManager()
        .subscribe(svg, 'workspaceBackgroundColour', 'background-color');

    // A null translation will also apply the correct initial scale.
    mainWorkspace.translate(0, 0);

    mainWorkspace.addChangeListener(
        Blockly.bumpObjects.bumpIntoBoundsHandler(mainWorkspace),
    );

    // The SVG is now fully assembled.
    Blockly.common.svgResize(mainWorkspace);

    // TODO: This should be changed
    Blockly.WidgetDiv.createDom();
    Blockly.DropDownDiv.createDom();
    Blockly.Tooltip.createDom();
    return mainWorkspace;
}

function init(mainWorkspace: WorkspaceSvg) {
    const options = mainWorkspace.options;
    const svg = mainWorkspace.getParentSvg();

    // Suppress the browser's context menu.
    Blockly.browserEvents.conditionalBind(
        svg.parentNode as Element,
        'contextmenu',
        null,
        function (e: Event) {
            if (!Blockly.browserEvents.isTargetInput(e)) {
                e.preventDefault();
            }
        },
    );

    const workspaceResizeHandler = Blockly.browserEvents.conditionalBind(
        window,
        'resize',
        null,
        function () {
            // Don't hide all the chaff. Leave the dropdown and widget divs open if
            // possible.
            Blockly.Tooltip.hide();
            mainWorkspace.hideComponents(true);
            Blockly.DropDownDiv.repositionForWindowResize();
            Blockly.WidgetDiv.repositionForWindowResize();
            Blockly.common.svgResize(mainWorkspace);
            Blockly.bumpObjects.bumpTopObjectsIntoBounds(mainWorkspace);
        },
    );
    mainWorkspace.setResizeHandlerWrapper(workspaceResizeHandler);

    bindDocumentEvents();

    if (options.languageTree) {
        const toolbox = mainWorkspace.getToolbox();
        const flyout = mainWorkspace.getFlyout(true);
        if (toolbox) {
            toolbox.init();
        } else if (flyout) {
            // Build a fixed flyout with the root blocks.
            flyout.init(mainWorkspace);
            flyout.show(options.languageTree);
            if (typeof flyout.scrollToStart === 'function') {
                flyout.scrollToStart();
            }
        }
    }

    if (options.hasTrashcan) {
        mainWorkspace.trashcan!.init();
    }
    if (options.zoomOptions && options.zoomOptions.controls) {
        mainWorkspace.zoomControls_!.init();
    }

    if (options.moveOptions && options.moveOptions.scrollbars) {
        const horizontalScroll =
            options.moveOptions.scrollbars === true ||
            !!options.moveOptions.scrollbars.horizontal;
        const verticalScroll =
            options.moveOptions.scrollbars === true ||
            !!options.moveOptions.scrollbars.vertical;
        mainWorkspace.scrollbar = new Blockly.ScrollbarPair(
            mainWorkspace,
            horizontalScroll,
            verticalScroll,
            'blocklyMainWorkspaceScrollbar',
        );
        mainWorkspace.scrollbar.resize();
    } else {
        mainWorkspace.setMetrics({ x: 0.5, y: 0.5 });
    }

    // Load the sounds.
    if (options.hasSounds) {
        loadSounds(options.pathToMedia, mainWorkspace);
    }
}

function onKeyDown(e: KeyboardEvent) {
    const mainWorkspace = Blockly.common.getMainWorkspace() as WorkspaceSvg;
    if (!mainWorkspace) {
        return;
    }

    if (
        Blockly.browserEvents.isTargetInput(e) ||
        (mainWorkspace.rendered && !mainWorkspace.isVisible())
    ) {
        return;
    }
    Blockly.ShortcutRegistry.registry.onKeyDown(mainWorkspace, e);
}

let documentEventsBound = false;

function bindDocumentEvents() {
    if (!documentEventsBound) {
        Blockly.browserEvents.conditionalBind(document, 'scroll', null, function () {
            const workspaces = Blockly.common.getAllWorkspaces();
            for (let i = 0, workspace; (workspace = workspaces[i]); i++) {
                if (workspace instanceof WorkspaceSvg) {
                    workspace.updateInverseScreenCTM();
                }
            }
        });
        // longStop needs to run to stop the context menu from showing up.  It
        // should run regardless of what other touch event handlers have run.
        Blockly.browserEvents.bind(document, 'touchend', null, Blockly.Touch.longStop);
        Blockly.browserEvents.bind(document, 'touchcancel', null, Blockly.Touch.longStop);
    }
    documentEventsBound = true;
}

function loadSounds(pathToMedia: string, workspace: WorkspaceSvg) {
    const audioMgr = workspace.getAudioManager();
    audioMgr.load(
        [
            pathToMedia + 'click.mp3',
            pathToMedia + 'click.wav',
            pathToMedia + 'click.ogg',
        ],
        'click',
    );
    audioMgr.load(
        [
            pathToMedia + 'disconnect.wav',
            pathToMedia + 'disconnect.mp3',
            pathToMedia + 'disconnect.ogg',
        ],
        'disconnect',
    );
    audioMgr.load(
        [
            pathToMedia + 'delete.mp3',
            pathToMedia + 'delete.ogg',
            pathToMedia + 'delete.wav',
        ],
        'delete',
    );

    // Bind temporary hooks that preload the sounds.
    const soundBinds: Blockly.browserEvents.Data[] = [];
    /**
     *
     */
    function unbindSounds() {
        while (soundBinds.length) {
            const oldSoundBinding = soundBinds.pop();
            if (oldSoundBinding) {
                Blockly.browserEvents.unbind(oldSoundBinding);
            }
        }
        audioMgr.preload();
    }

    // These are bound on mouse/touch events with
    // Blockly.browserEvents.conditionalBind, so they restrict the touch
    // identifier that will be recognized.  But this is really something that
    // happens on a click, not a drag, so that's not necessary.

    // Android ignores any sound not loaded as a result of a user action.
    soundBinds.push(
        Blockly.browserEvents.conditionalBind(
            document,
            'pointermove',
            null,
            unbindSounds,
            true,
        ),
    );
    soundBinds.push(
        Blockly.browserEvents.conditionalBind(
            document,
            'touchstart',
            null,
            unbindSounds,
            true,
        ),
    );
}

// See https://github.com/google/blockly/blob/87efad06705fe054e175d4e16a78546f679cae04/core/utils/dom.ts#L53C1-L66C2
export function createSvgElement<T extends SVGElement>(
    name: string | Blockly.utils.Svg<T>,
    document: Document,
    attrs: { [key: string]: string | number },
    opt_parent?: Element | null,
): T {
    const e = document.createElementNS(Blockly.utils.dom.SVG_NS, `${name}`) as T;
    for (const key in attrs) {
        e.setAttribute(key, `${attrs[key]}`);
    }
    if (opt_parent) {
        opt_parent.appendChild(e);
    }
    return e;
}