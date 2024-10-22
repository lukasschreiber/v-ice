import Prism from "prismjs";
import {useEffect} from "react"

export function Code(props: React.HTMLProps<HTMLPreElement> & { code: string; language: string }) {
    const { code, language, ...rest } = props;

    useEffect(() => {
        Prism.highlightAll();
    }, [code]);

    return (
        <pre className="!my-0 h-full" {...rest}>
            <code className={`language-${language} !text-xs !leading-none`}>{code}</code>
        </pre>
    );
}
