'use client'
import {useRouter} from "next/navigation";
import Header from '~/components/Header';
import Footer from '~/components/Footer';
import {useState,useEffect,useCallback,useRef} from "react";
import HeadInfo from "~/components/HeadInfo";
import {useCommonContext} from "~/context/common-context";
import {useInterval} from "ahooks";
import Link from "next/link";
import Script from 'next/script'
import { languages,getLanguageByLang,getEditorLocale} from "~/config";
import * as monaco from 'monaco-editor';
import {Editor,loader,useMonaco} from "@monaco-editor/react";
import { Stack, IStackStyles } from "@fluentui/react";
import { ErrorMessageBar } from "~/components/error-message-bar";
import { TitleBar } from "~/components/title-bar";
import { ToolBar } from "~/components/tool-bar";
import { BorderLine } from "~/components/styles";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import { useToggle } from "~/hooks";

import {
  downloadJsonFile,
  minifyJsonString,
  prettifyJsonString,
  parseJsonSchemaString,
} from "~/utils";

initializeIcons();
const stackStyles: IStackStyles = {
  root: {
    height: "inherit",
    borderTop: BorderLine,
    borderBottom: BorderLine,
  },
};

loader.config({ paths: { vs: "/vs" } });

const PageComponent = ({
                         locale = '',
                         indexLanguageText,
                         footerLanguageText,
                         jsonEditorText
                       }) => {

  const editorRef = useRef(null);
  const editorLocale = getEditorLocale(locale);
  console.log('editor mount locale:'+{locale}+'->'+editorLocale);
  const [isValidJson, setIsValidJson] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isAutoPrettifyOn, toggleAutoPrettifyOn] = useToggle(false);
  function handleEditorDidMount(editor, monaco) {
      editorRef.current = editor;
  }
  function format() {

    editorRef.current.trigger('', 'editor.action.formatDocument');
  }
  function minify() {
      if (editorRef.current.getValue() == undefined || editorRef.current.getValue().length==0) {
           console.log("empty")
           return
        }
        console.log(editorRef.current.getValue())
        const lines = editorRef.current.getValue().split("\n");
        const trimmedLines = lines.map((line) => line.trim());
        const filteredLines = trimmedLines.filter((line) => line !== "");
        const finalJson = filteredLines.join("");
        editorRef.current.getModel().setValue(finalJson);
  }
  const handleEditorValidation= useCallback((markers) => {
      const errorMessage = markers.map(
        ({ startLineNumber, message }) => `line ${startLineNumber}: ${message}`
      );
      const hasContent = editorRef.current?.getValue();
      const hasError: boolean = errorMessage.length > 0;
      setIsValidJson(!!hasContent && !hasError);
      setErrors(errorMessage);
   }, []);
    const handleDownloadClick = () => {
    const value = editorRef.current?.getValue();
    value && downloadJsonFile(value);
    };
   const handleCompareClick = () => {
       //locale
       let hrefValue = `/${locale}/json-compare`;
       const  url= '/'+`{locale}`+'/json-compare';
       window.open(hrefValue, '_blank');
   };
   const handleEditorChange = useCallback(
       (value: string | undefined) => {
         if (isAutoPrettifyOn) {
            editorRef.current.trigger('', 'editor.action.formatDocument');
         }
       },
       [isAutoPrettifyOn]
  );
  const handleUploadClick = (file: File) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const result = fileReader.result as string;
        handleEditorUpdateValue(result);
      };
      fileReader.readAsText(file);
   };
  const handleEditorUpdateValue = useCallback((value?: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.setValue(value || "");
      value && editor?.getAction("editor.action.formatDocument")?.run();
    }, []);
  const handleClearClick = () => editorRef.current?.setValue("");
  return (
    <>
       <HeadInfo
           title={jsonEditorText.title}
           description={jsonEditorText.description}
           keywords={jsonEditorText.keywords}
           locale={locale}
           page={"/json-studio"}
         />
       <Header locale={locale} page={"json-studio"} indexLanguageText={indexLanguageText}/>
       <p className="text-black text-center text-xl mb-3 mt-5">{jsonEditorText.h1}</p>
       <div className="mx-auto w-[80%] h-[100%] border-blue-200 border-2 mb-2">
         <Stack styles={stackStyles}>
            <Stack.Item>
               <ToolBar
                 isAutoPrettifyOn={isAutoPrettifyOn}
                 onAutoPrettifyChange={toggleAutoPrettifyOn}
                 onClearClick={handleClearClick}
                 onDownloadClick={handleDownloadClick}
                 onMinifyClick={minify}
                 onPrettifyClick={format}
                 onCompareClick={handleCompareClick}
                 onUploadClick={handleUploadClick}
                 toolTexts={jsonEditorText} />
            </Stack.Item>
            <Stack styles={stackStyles}>
                        <Stack.Item
                                  grow
                                  align="stretch"
                                  style={{
                                    height: `calc(100% - 20vh)`,
                                  }}
                                >
                         <Editor
                                      height="calc(60vh)"
                                      language="json"
                                      defaultValue=''
                                      onMount={handleEditorDidMount}
                                      onChange={handleEditorChange}
                                      onValidate={handleEditorValidation}
                                    />
                         </Stack.Item>
                         <Stack.Item
                           style={{
                             height: `15vh`,
                           }}
                         >
                           <ErrorMessageBar errors={errors} toolTexts={jsonEditorText} />
                         </Stack.Item>
                     </Stack>
         </Stack>
       </div>
       <Footer
           locale={locale}
           description={indexLanguageText.description}
           footerText={footerLanguageText}
       />
    </>
  )
}
export default PageComponent
