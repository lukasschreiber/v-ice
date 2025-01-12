import { Editor } from "@monaco-editor/react";
import GithubLight from "../assets/github-light.json";

export function Code(props: React.HTMLProps<HTMLPreElement> & { code: string; language: string }) {
    const { code, language } = props;

    function setEditorTheme(monaco: any) {
        monaco.editor.defineTheme("github-light", GithubLight);
        monaco.editor.setTheme("github-light");
    }

    return (
        <Editor defaultLanguage={language} value={code} height="100%" width="100%" theme="github-light" options={{readOnly: true}} beforeMount={setEditorTheme} />
    )
}
