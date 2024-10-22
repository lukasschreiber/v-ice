import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import * as Blockly from "blockly/core"

/**
 * Import all blockly locales files that are used
 * The naming scheme is blockly/msg/<COUNTRY>
 */
import * as de from "blockly/msg/de"
import * as en from "blockly/msg/en"

const blocklyResources: {[key: string]: Record<string, string>} = {
    de,
    en
}

interface Translations {
    [key: string]: string | Translations
}

/**
 * All additional translations are loaded from assets/translations/strings.<COUNTRY>.json
 * Those translation files may included nested translations that can be used with the t function like:
 * 
 * t("Hello") or t("blockly.test") or generally t(<KEY>)
 * 
 * All keys after blockly will be made available to the blockly framework so that they can be used dynamically inside
 * of the blockly SVG. Blockly allows the use of translations inside of the JSON specification. Those have the format:
 * 
 * %{BKY_<KEY>} where <KEY> is the key from the translation file. Hierarchy levels are flattened and concatenated by _ and all
 * values are upper-cased, e.g. hello.world becomes HELLO_WORLD
 */
const translationFiles: Record<string, object> = import.meta.glob('@/assets/translations/*.json', { eager: true, import: 'default' })

const resources = Object.entries(translationFiles).map(([filename, translations]) => {
    const countryCode = filename.match(/strings\.(.+)\.json/)![1]
    return {
        [countryCode]: { translation: translations as Translations }
    }
}).reduce((acc, val) => ({ ...acc, ...val }), {})

const DEFAULT_LOCALE = "en"

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: DEFAULT_LOCALE,
        fallbackLng: DEFAULT_LOCALE,
        interpolation: {
            escapeValue: false
        }
    })

    function flattenLocaleRecord(obj: Translations) {
        const record: Record<string, string> = {};
    
        for (const key in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    
            if (typeof obj[key] === "object" && obj[key] !== null) {
                const flatObject = flattenLocaleRecord(obj[key] as Translations);
                for (const x in flatObject) {
                    if (!Object.prototype.hasOwnProperty.call(flatObject, x)) continue;
    
                    record[(key + '_' + x).toUpperCase()] = flatObject[x];
                }
            } else {
                record[key.toUpperCase()] = obj[key] as string;
            }
        }
        return record;
    }

export function setBlocklyLocale(language: string) {
    Blockly.setLocale(blocklyResources[language] ?? blocklyResources[DEFAULT_LOCALE])

    const translations = (resources[language] ?? resources[DEFAULT_LOCALE]).translation
    if(translations.blockly) {
        const blocklyTranslations = flattenLocaleRecord(translations.blockly as Translations)
        Blockly.setLocale(blocklyTranslations)
    }
}

const helpMarkdownFiles: Record<string, object> = import.meta.glob('@/assets/help/*.md', { eager: true, import: 'default', query: '?raw' })
const helpResources = Object.entries(helpMarkdownFiles).map(([filename, markdown]) => {
    const countryCode = filename.match(/help\.(.+)\.md/)![1]
    return {
        [countryCode]: String(markdown)
    }
}).reduce((acc, val) => ({ ...acc, ...val }), {})

export function getHelpMarkdown(language: string) {
    return helpResources[language] ?? helpResources[DEFAULT_LOCALE]
}

export default i18n