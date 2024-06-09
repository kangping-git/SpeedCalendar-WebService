import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Link from "@editorjs/link";
import Quote from "@editorjs/quote";
import Raw from "@editorjs/raw";
import Checklist from "@editorjs/checklist";
import Warning from "@editorjs/warning";
import Marker from "@editorjs/marker";
import CodeTool from "@editorjs/code";
import ImageTool from "@editorjs/image";
import Delimiter from "@editorjs/delimiter";
import InlineCode from "@editorjs/inline-code";
import Embed from "@editorjs/embed";
import Table from "@editorjs/table";

window.addEventListener("load", () => {
    const editor = new EditorJS({
        holder: "editorjs",
        tools: {
            header: Header,
            list: List,
            link: {
                class: Link,
                config: {
                    endpoint: "/editor/fetch",
                },
            },
            quote: Quote,
            raw: Raw,
            image: {
                class: ImageTool,
                config: {
                    uploader: {
                        uploadByFile(file: File) {
                            return fetch(
                                "/editor/upload?mimeType=" + file.type,
                                {
                                    method: "POST",
                                    body: file,
                                }
                            )
                                .then((value) => value.json())
                                .then((value) => {
                                    if (value.file && value.file.url) {
                                        value.file.url =
                                            location.origin + value.file.url;
                                    }
                                    return value;
                                });
                        },
                    },
                },
            },
            checklist: Checklist,
            warning: Warning,
            marker: Marker,
            code: CodeTool,
            delimiter: Delimiter,
            inlineCode: InlineCode,
            embed: { class: Embed, config: {} },
            table: Table,
        },
    });
    setInterval(async () => {
        console.log(await editor.save());
    }, 10000);
});
