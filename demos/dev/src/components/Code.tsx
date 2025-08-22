import { Editor } from "@monaco-editor/react";
import GithubLight from "../assets/github-light.json";
import { useEffect, useRef } from "react";

export function Code(
    props: {
        code: string;
        onChange?: (value: string) => void;
        language: string;
        decorations?: { regex: RegExp; className: string }[];
    }
) {
    const { code, language, decorations } = props;
    const editorRef = useRef<any>(null);

    function setEditorTheme(monaco: any) {
        monaco.editor.defineTheme("github-light", GithubLight);
        monaco.editor.setTheme("github-light");
    }

    function handleEditorDidMount(editor: any) {
        editorRef.current = editor;

        if (decorations) {
            applyDecorations(editor, decorations);
        }
    }

    useEffect(() => {
        if (editorRef.current && decorations) {
            applyDecorations(editorRef.current, decorations);
        }
    }, [decorations]);

    // Apply decorations based on the provided regex and className
    function applyDecorations(editor: any, decorations: { regex: RegExp; className: string }[]) {
        const model = editor.getModel();
        if (!model) return;

        const newDecorations = decorations.flatMap(({ regex, className }) => {
            const matches = model.findMatches(
                regex.source, // Regex pattern
                false, // Search entire model
                true, // Use regular expressions
                false, // Case-sensitive match
                null, // No word separators
                true // Capture full match
            );

            return matches.map((match: any) => ({
                range: match.range,
                options: {
                    inlineClassName: className,
                },
            }));
        });

        // Apply decorations to the editor
        editor.deltaDecorations([], newDecorations);
    }

    return (
        <Editor
            defaultLanguage={language}
            value={code}
            height="100%"
            width="100%"
            theme="github-light"
            onChange={(value) => props.onChange?.(value ?? "")}
            options={{ readOnly: props.onChange === undefined, fontSize: 12 }}
            beforeMount={setEditorTheme}
            onMount={handleEditorDidMount}
        />
    );
}
