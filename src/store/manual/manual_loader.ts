interface TreeNode {
    [key: string]: string | TreeNode;
}

interface ManualSectionSettings {
    order: string[];
}

interface ManualSection {
    level: number;
    title: string;
    content: (string | ManualSection)[] | string;
}

const manualFilesTree: TreeNode = Object.entries(
    import.meta.glob('@/assets/help/**/*', { eager: true, import: 'default', query: '?raw' })
).reduce((tree, [filename, content]) => {
    const pathParts = filename.replace(/^.*\/help\//, '').split('/'); // Remove the base path and split into parts
    let current = tree;

    // Traverse or create the nested structure
    pathParts.forEach((part, index) => {
        if (index === pathParts.length - 1) {
            // If it's the last part, assign the file content
            current[part] = content as string;
        } else {
            // If it's a directory, ensure it exists as an object
            current[part] = current[part] || {};
            current = current[part] as TreeNode;
        }
    });

    return tree;
}, {} as TreeNode);

function getManualSectionSettings(node: TreeNode): ManualSectionSettings {
    if ("index.json" in node) {
        return JSON.parse(node["index.json"] as string) as ManualSectionSettings;
    }

    return { order: [] };
}

function getManualSection(node: TreeNode | string | undefined): ManualSection {
    if (typeof node === 'string') {
        const firstLine = node.split('\n')[0];
        const level = firstLine.match(/^#+/)?.[0].length || 0;
        const title = firstLine.replace(/^#+/, '').trim();
        return { level, title, content: node };
    }

    if (node === undefined || Object.keys(node).length === 0) {
        return { level: 0, title: '', content: [] };
    }

    const settings = getManualSectionSettings(node);
    const content = Object.entries(node).sort(([keyA, _valueA], [keyB, _valueB]) => {
        const orderA = settings.order.indexOf(keyA.replace('.md', ''));
        const orderB = settings.order.indexOf(keyB.replace('.md', ''));

        if (orderA === -1 && orderB === -1) return keyA.localeCompare(keyB);
        if (orderA === -1) return 1;
        if (orderB === -1) return -1;

        return orderA - orderB;
    }).filter(([key]) => key !== "index.json" && key !== "index.md").map(([_, value]) => {
        return getManualSection(value as TreeNode);
    })

    if ("index.md" in node) {
        const indexSection = getManualSection(node["index.md"] as string);
        return {...indexSection, content: [indexSection.content as string, ...content]};
    }
    return { level: -1, title: "Unknown", content };
}

export function getManual(language: string): ManualSection {
    const root = manualFilesTree[language] || manualFilesTree.en;
    return getManualSection(root);
}

export function getManualMarkdown(language: string): string {
    const manual = getManual(language);
    const markdowns: string[] = [];
    const stack: (ManualSection | string)[] = [manual];
    while (stack.length > 0) {
        const section = stack.pop()!;
        if (typeof section === 'string') {
            markdowns.push(section);
        }else if (typeof section.content === 'string') {
            markdowns.push(section.content);
        } else {
            stack.push(...section.content);
        }
    }

    return markdowns.reverse().join('\n');
}